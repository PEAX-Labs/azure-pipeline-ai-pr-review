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
    maxTokens: getTaskInputAsNumber('max_tokens', 450),
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

  // Debug logging for token usage and response structure
  console.log(`🔍 OpenAI Response Debug Info:`);
  console.log(`  Model: ${response.model || 'unknown'}`);
  console.log(`  Finish Reason: ${response.choices?.[0]?.finish_reason || 'unknown'}`);
  
  if (response.usage) {
    console.log(`  Token Usage:`);
    console.log(`    Prompt Tokens: ${response.usage.prompt_tokens || 0}`);
    console.log(`    Completion Tokens: ${response.usage.completion_tokens || 0}`);
    console.log(`    Total Tokens: ${response.usage.total_tokens || 0}`);
  }
  
  const messageContent = response.choices[0]?.message?.content;
  console.log(`  Response Content Length: ${messageContent?.length || 0} chars`);

  return messageContent || null;
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
  
  // Debug logging for token usage and response structure
  console.log(`🔍 API Response Debug Info:`);
  console.log(`  Model: ${data.model || 'unknown'}`);
  console.log(`  Finish Reason: ${data.choices?.[0]?.finish_reason || 'unknown'}`);
  
  if (data.usage) {
    console.log(`  Token Usage:`);
    console.log(`    Prompt Tokens: ${data.usage.prompt_tokens || 0}`);
    console.log(`    Completion Tokens: ${data.usage.completion_tokens || 0}`);
    if (data.usage.completion_tokens_details) {
      console.log(`    Reasoning Tokens: ${data.usage.completion_tokens_details.reasoning_tokens || 0}`);
      console.log(`    Accepted Prediction Tokens: ${data.usage.completion_tokens_details.accepted_prediction_tokens || 0}`);
    }
    console.log(`    Total Tokens: ${data.usage.total_tokens || 0}`);
  }
  
  const messageContent = data.choices?.[0]?.message?.content;
  const reasoningContent = data.choices?.[0]?.message?.reasoning_content;
  
  console.log(`  Response Content Length: ${messageContent?.length || 0} chars`);
  console.log(`  Reasoning Content Length: ${reasoningContent?.length || 0} chars`);
  
  if (!messageContent && reasoningContent) {
    console.warn(`⚠️ Response is empty but reasoning content exists - tokens likely exhausted by reasoning`);
    console.log(`  Reasoning preview: "${reasoningContent.substring(0, 100)}..."`);
  }
  
  return messageContent || null;
}

function shouldAddComment(review: string): boolean {
  const trimmedReview = review.trim();
  
  // Check for the explicit "no issues" signal - exact match only
  if (trimmedReview === 'REVIEW_OK') {
    console.log(`🚫 Skipping comment - AI signaled no issues (REVIEW_OK)`);
    return false;
  }
  
  console.log(`✅ Adding comment - AI provided feedback`);
  console.log(`📝 Review text preview: "${trimmedReview.substring(0, 200)}${trimmedReview.length > 200 ? '...' : ''}"`);
  return true;
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
