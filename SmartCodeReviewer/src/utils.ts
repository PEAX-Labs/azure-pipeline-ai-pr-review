import * as tl from "azure-pipelines-task-lib/task";
import { minimatch } from "minimatch";

export function getFileExtension(fileName: string): string {
  return fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2);
}

export function getTargetBranchName(): string | undefined {
  let targetBranchName = tl.getVariable('System.PullRequest.TargetBranchName');

  if (!targetBranchName) {
    targetBranchName = tl.getVariable('System.PullRequest.TargetBranch')?.replace('refs/heads/', '');
  }

  if (!targetBranchName) {
    return undefined;
  }

  return `origin/${targetBranchName}`;
}

export function shouldSkipFile(fileName: string, skipPatterns: string[]): boolean {
  if (!skipPatterns || skipPatterns.length === 0) {
    return false;
  }

  return skipPatterns.some(pattern => {
    const trimmedPattern = pattern.trim();
    if (!trimmedPattern) return false;
    
    try {
      return minimatch(fileName, trimmedPattern);
    } catch (error) {
      console.warn(`Invalid skip pattern: ${trimmedPattern}`);
      return false;
    }
  });
}

export function chunkComment(content: string, maxChunkSize: number = 1800): string[] {
  if (content.length <= maxChunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let currentPos = 0;

  while (currentPos < content.length) {
    let chunkEnd = currentPos + maxChunkSize;
    
    // If we're not at the end, try to break at a natural point
    if (chunkEnd < content.length) {
      // Look for a good break point (paragraph, sentence, or line)
      const breakPoints = ['\n\n', '. ', '\n', ', '];
      let bestBreak = -1;
      
      for (const breakPoint of breakPoints) {
        const lastBreak = content.lastIndexOf(breakPoint, chunkEnd);
        if (lastBreak > currentPos) {
          bestBreak = lastBreak + breakPoint.length;
          break;
        }
      }
      
      if (bestBreak > -1) {
        chunkEnd = bestBreak;
      }
    }

    const chunk = content.slice(currentPos, chunkEnd);
    if (chunks.length > 0) {
      chunks.push(`**[Continued ${chunks.length + 1}/${Math.ceil(content.length / maxChunkSize)}]**\n\n${chunk}`);
    } else {
      chunks.push(chunk);
    }
    
    currentPos = chunkEnd;
  }

  return chunks;
}

export function getTaskInput(name: string, required: boolean = false): string | undefined {
  const value = tl.getInput(name, required);
  return value || undefined;
}

export function getTaskInputAsNumber(name: string, defaultValue: number): number {
  const value = tl.getInput(name);
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function getTaskInputAsFloat(name: string, defaultValue: number): number {
  const value = tl.getInput(name);
  if (!value) return defaultValue;
  
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function parseSkipPatterns(input: string | undefined): string[] {
  if (!input) return [];
  
  return input
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#'));
}

export const DEFAULT_AI_INSTRUCTIONS = `You are an expert senior software engineer conducting a thorough code review. Analyze the provided git diff and provide constructive feedback focusing on:

🔍 **Code Quality & Best Practices**
- Code readability, maintainability, and adherence to conventions
- Proper error handling and edge cases
- Performance implications and optimization opportunities

🛡️ **Security & Safety**
- Potential security vulnerabilities or data exposure risks
- Input validation and sanitization
- Authentication and authorization concerns

🏗️ **Architecture & Design**
- Code structure, modularity, and separation of concerns
- Design patterns usage and architectural decisions
- API design and interface contracts

🧪 **Testing & Reliability**
- Test coverage and quality
- Potential bugs or logical errors
- Boundary conditions and error scenarios

**Guidelines:**
- Focus only on changed lines (additions/modifications/deletions)
- Provide specific, actionable feedback with examples when possible
- Use a constructive, professional tone
- If the code looks good overall, simply respond with 'No significant issues found. Code looks good! ✅'
- For serious issues, use emojis: 🚨 (critical), ⚠️ (warning), 💡 (suggestion)
- Keep responses concise but informative`;

export function sanitizeForAzureDevOps(content: string): string {
  // Ensure content doesn't exceed reasonable limits and is properly formatted
  return content
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
}