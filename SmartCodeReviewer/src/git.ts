import { SimpleGitOptions, SimpleGit, simpleGit } from 'simple-git';
import * as tl from "azure-pipelines-task-lib/task";
import binaryExtensions from 'binary-extensions';
import { getFileExtension, shouldSkipFile, parseSkipPatterns } from './utils';

const gitOptions: Partial<SimpleGitOptions> = {
  baseDir: `${tl.getVariable('System.DefaultWorkingDirectory')}`,
  binary: 'git'
};

export const git: SimpleGit = simpleGit(gitOptions);

export async function getChangedFiles(targetBranch: string): Promise<string[]> {
  try {
    await git.addConfig('core.pager', 'cat');
    await git.addConfig('core.quotepath', 'false');
    await git.fetch();

    const diffs = await git.diff([targetBranch, '--name-only', '--diff-filter=AM']);
    const files = diffs.split('\n').filter(line => line.trim().length > 0);
    
    // Filter out binary files
    const nonBinaryFiles = files.filter(file => {
      const extension = getFileExtension(file);
      return !binaryExtensions.includes(extension);
    });

    // Apply skip patterns
    const skipPatterns = parseSkipPatterns(tl.getInput('skip_files'));
    const filteredFiles = nonBinaryFiles.filter(file => !shouldSkipFile(file, skipPatterns));

    console.log(`Total changed files: ${files.length}`);
    console.log(`Non-binary files: ${nonBinaryFiles.length}`);
    console.log(`Files after filtering: ${filteredFiles.length}`);
    console.log(`Files to review:\n${filteredFiles.map(f => `  - ${f}`).join('\n')}`);

    if (skipPatterns.length > 0) {
      const skippedFiles = nonBinaryFiles.filter(file => shouldSkipFile(file, skipPatterns));
      if (skippedFiles.length > 0) {
        console.log(`Skipped files (${skippedFiles.length}):\n${skippedFiles.map(f => `  - ${f}`).join('\n')}`);
      }
    }

    return filteredFiles;
  } catch (error) {
    console.error('Error getting changed files:', error);
    throw error;
  }
}

export async function getFilePatch(targetBranch: string, fileName: string): Promise<string> {
  try {
    const patch = await git.diff([targetBranch, '--', fileName]);
    return patch;
  } catch (error) {
    console.error(`Error getting patch for file ${fileName}:`, error);
    throw error;
  }
}