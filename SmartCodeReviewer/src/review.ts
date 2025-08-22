import * as tl from "azure-pipelines-task-lib/task";
import { Agent } from 'https';
import OpenAI from 'openai';
import fetch from 'node-fetch';
import { addCommentToPR } from './pr';
import { getFilePatch } from './git';
import { getTaskInput, getTaskInputAsNumber, getTaskInputAsFloat } from './utils';

interface AIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  instructions: string;
  endpoint?: string;
}

export async function reviewFile(
  targetBranch: string, 
  fileName: string, 
  httpsAgent: Agent
): Promise<void> {
  console.log(`\n🔍 Reviewing ${fileName}...`);

  try {
    const config = getAIConfig();
    const patch = await getFilePatch(targetBranch, fileName);

    if (!patch.trim()) {
      console.log(`⚠️ No changes found for ${fileName}, skipping...`);
      return;
    }

    console.log(`📝 Patch size: ${patch.length} characters`);
    
    const review = await getAIReview(patch, config, fileName);

    if (review && shouldAddComment(review)) {
      await addCommentToPR(fileName, review, httpsAgent);
      console.log(`✅ Review completed for ${fileName}`);
    } else {
      console.log(`✅ No issues found in ${fileName} - no comment needed`);
    }

  } catch (error: any) {
    console.error(`❌ Error reviewing ${fileName}:`, error);
    
    // Add error comment to PR for visibility
    const errorComment = `🚨 **AI Review Error for ${fileName}**\n\nUnable to complete AI review due to an error:\n\`\`\`\n${error.message}\n\`\`\`\n\nPlease review this file manually.`;
    
    try {
      await addCommentToPR(fileName, errorComment, httpsAgent);
    } catch (commentError) {
      console.error(`Failed to add error comment:`, commentError);
    }
    
    // Don't throw - continue with other files
  }
}

function getAIConfig(): AIConfig {
  const apiKey = getTaskInput('api_key', true);
  if (!apiKey) {
    throw new Error('API key is required');
  }

  return {
    apiKey,
    model: getTaskInput('model') || 'gpt-4o',
    maxTokens: getTaskInputAsNumber('max_tokens', 1500),
    temperature: getTaskInputAsFloat('temperature', 0.1),
    instructions: getTaskInput('ai_instructions', true) || '',
    endpoint: getTaskInput('ai_endpoint')
  };
}

async function getAIReview(patch: string, config: AIConfig, fileName: string): Promise<string | null> {
  const { apiKey, model, maxTokens, temperature, instructions, endpoint } = config;

  try {
    if (endpoint) {
      // Azure OpenAI
      return await getAzureOpenAIReview(patch, config, fileName);
    } else {
      // Standard OpenAI
      return await getOpenAIReview(patch, config, fileName);
    }
  } catch (error: any) {
    console.error(`AI API Error:`, error);
    
    if (error.code === 'context_length_exceeded') {
      console.warn(`⚠️ Patch too large for ${fileName}, attempting with truncated content...`);
      const truncatedPatch = truncatePatch(patch, maxTokens);
      
      if (endpoint) {
        return await getAzureOpenAIReview(truncatedPatch, config, fileName);
      } else {
        return await getOpenAIReview(truncatedPatch, config, fileName);
      }
    }
    
    throw error;
  }
}

async function getOpenAIReview(patch: string, config: AIConfig, fileName: string): Promise<string | null> {
  const { apiKey, model, maxTokens, temperature, instructions } = config;
  
  console.log(`🤖 Requesting review from OpenAI (${model})`);

  const openai = new OpenAI({ apiKey });

  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content: instructions
      },
      {
        role: "user",
        content: `Please review the following git diff for the file "${fileName}":\n\n\`\`\`diff\n${patch}\n\`\`\``
      }
    ],
    max_tokens: maxTokens,
    temperature
  });

  return response.choices[0]?.message?.content || null;
}

async function getAzureOpenAIReview(patch: string, config: AIConfig, fileName: string): Promise<string | null> {
  const { apiKey, maxTokens, temperature, instructions, endpoint } = config;
  
  if (!endpoint) {
    throw new Error('Azure OpenAI endpoint is required');
  }

  console.log(`🤖 Requesting review from Azure OpenAI`);

  const requestBody = {
    messages: [
      {
        role: "system",
        content: instructions
      },
      {
        role: "user",
        content: `Please review the following git diff for the file "${fileName}":\n\n\`\`\`diff\n${patch}\n\`\`\``
      }
    ],
    max_completion_tokens: maxTokens,
    temperature,
    model: config.model
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || null;
}

function shouldAddComment(review: string): boolean {
  const trimmedReview = review.trim().toLowerCase();
  
  // Don't add comments for standard "no issues" responses
  const noIssuesPatterns = [
    'no feedback',
    'no significant issues found',
    'code looks good',
    'no issues found',
    'looks good',
    'no problems',
    'no concerns'
  ];

  return !noIssuesPatterns.some(pattern => trimmedReview.includes(pattern));
}

function truncatePatch(patch: string, maxTokens: number): string {
  // Rough estimate: 1 token ≈ 4 characters
  const maxChars = maxTokens * 3; // Leave some buffer
  
  if (patch.length <= maxChars) {
    return patch;
  }

  console.log(`⚠️ Truncating patch from ${patch.length} to ~${maxChars} characters`);
  
  // Try to keep the beginning and end of the patch
  const halfSize = Math.floor(maxChars / 2);
  const beginning = patch.substring(0, halfSize);
  const end = patch.substring(patch.length - halfSize);
  
  return `${beginning}\n\n... [TRUNCATED FOR REVIEW] ...\n\n${end}`;
}
