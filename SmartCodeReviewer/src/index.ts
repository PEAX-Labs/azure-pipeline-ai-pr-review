import * as tl from "azure-pipelines-task-lib/task";
import { deleteExistingComments } from './pr';
import { reviewFile } from './review';
import { getTargetBranchName, getTaskInput } from './utils';
import { getChangedFiles } from './git';
import https from 'https';

async function run(): Promise<void> {
  try {
    console.log('🚀 Smart Code Reviewer - Starting AI-powered pull request review...');
    
    // Validate that this is a pull request build
    if (tl.getVariable('Build.Reason') !== 'PullRequest') {
      tl.setResult(tl.TaskResult.Skipped, "⏭️ Skipping: This task only runs for Pull Request builds.");
      return;
    }

    // Validate API key
    const apiKey = getTaskInput('api_key', true);
    if (!apiKey) {
      tl.setResult(tl.TaskResult.Failed, '❌ No API Key provided! Please configure your OpenAI or Azure OpenAI API key.');
      return;
    }

    // Create HTTPS agent with SSL configuration
    const supportSelfSignedCertificate = tl.getBoolInput('support_self_signed_certificate') || false;
    const httpsAgent = new https.Agent({
      rejectUnauthorized: !supportSelfSignedCertificate
    });

    console.log(`🔧 SSL Configuration: ${supportSelfSignedCertificate ? 'Self-signed certificates allowed' : 'Standard SSL validation'}`);

    // Get target branch
    const targetBranch = getTargetBranchName();
    if (!targetBranch) {
      tl.setResult(tl.TaskResult.Failed, '❌ Unable to determine target branch for the pull request.');
      return;
    }

    console.log(`🎯 Target branch: ${targetBranch}`);

    // Get configuration details
    const model = getTaskInput('model') || 'gpt-4o';
    const endpoint = getTaskInput('ai_endpoint');
    const aiProvider = endpoint ? 'Azure OpenAI' : 'OpenAI';
    
    console.log(`🤖 AI Provider: ${aiProvider}`);
    console.log(`🧠 Model: ${model}`);

    // Get changed files
    console.log('📁 Analyzing changed files...');
    const fileNames = await getChangedFiles(targetBranch);

    if (fileNames.length === 0) {
      console.log('✅ No files to review (all files were filtered out or no changes detected)');
      tl.setResult(tl.TaskResult.Succeeded, "No files to review.");
      return;
    }

    console.log(`📋 Found ${fileNames.length} file(s) to review`);

    // Clean up existing AI comments
    await deleteExistingComments(httpsAgent);

    // Review each file
    let reviewedCount = 0;
    let errorCount = 0;

    for (const fileName of fileNames) {
      try {
        await reviewFile(targetBranch, fileName, httpsAgent);
        reviewedCount++;
      } catch (error) {
        console.error(`❌ Failed to review ${fileName}:`, error);
        errorCount++;
      }
    }

    // Summary
    console.log('\n📊 Review Summary:');
    console.log(`  ✅ Successfully reviewed: ${reviewedCount} files`);
    if (errorCount > 0) {
      console.log(`  ❌ Failed to review: ${errorCount} files`);
    }

    if (errorCount === fileNames.length) {
      tl.setResult(tl.TaskResult.Failed, `❌ Failed to review all ${fileNames.length} files.`);
    } else if (errorCount > 0) {
      tl.setResult(tl.TaskResult.SucceededWithIssues, `⚠️ Completed with issues: ${reviewedCount}/${fileNames.length} files reviewed successfully.`);
    } else {
      tl.setResult(tl.TaskResult.Succeeded, `✅ Pull request review completed successfully! Reviewed ${reviewedCount} files.`);
    }

  } catch (err: any) {
    console.error('💥 Fatal error:', err);
    tl.setResult(tl.TaskResult.Failed, `❌ Task failed: ${err.message}`);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  tl.setResult(tl.TaskResult.Failed, `❌ Unhandled error: ${reason}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  tl.setResult(tl.TaskResult.Failed, `❌ Uncaught exception: ${error.message}`);
  process.exit(1);
});

// Start the task
run();