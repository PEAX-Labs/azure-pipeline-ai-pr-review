import * as tl from "azure-pipelines-task-lib/task";
import { Agent } from 'https';
import fetch from 'node-fetch';
import { chunkComment, getTaskInputAsNumber, sanitizeForAzureDevOps } from './utils';

interface CommentBody {
  comments: Array<{
    parentCommentId: number;
    content: string;
    commentType: number;
  }>;
  status: number;
  threadContext: {
    filePath: string;
  };
}

export async function addCommentToPR(fileName: string, comment: string, httpsAgent: Agent): Promise<void> {
  try {
    const sanitizedComment = sanitizeForAzureDevOps(comment);
    const chunkSize = getTaskInputAsNumber('comment_chunk_size', 1800);
    const chunks = chunkComment(sanitizedComment, chunkSize);

    console.log(`Adding ${chunks.length} comment(s) for file: ${fileName}`);

    for (const [index, chunk] of chunks.entries()) {
      const body: CommentBody = {
        comments: [
          {
            parentCommentId: 0,
            content: chunk,
            commentType: 1
          }
        ],
        status: 1,
        threadContext: {
          filePath: fileName,
        }
      };

      const stringifiedBody = JSON.stringify(body);
      const prUrl = buildPRUrl();

      const response = await fetch(prUrl, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${tl.getVariable('SYSTEM.ACCESSTOKEN')}`, 
          'Content-Type': 'application/json' 
        },
        body: stringifiedBody,
        agent: httpsAgent
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add comment ${index + 1}/${chunks.length} for ${fileName}: ${response.status} ${response.statusText} - ${errorText}`);
      }

      console.log(`✅ Comment ${index + 1}/${chunks.length} added for ${fileName} (${chunk.length} chars)`);
    }

  } catch (error) {
    console.error(`❌ Error adding comment for ${fileName}:`, error);
    throw error;
  }
}

export async function deleteExistingComments(httpsAgent: Agent): Promise<void> {
  console.log("🧹 Cleaning up existing AI review comments...");

  try {
    const threadsUrl = buildThreadsUrl();
    const threadsResponse = await fetch(threadsUrl, {
      headers: { Authorization: `Bearer ${tl.getVariable('SYSTEM.ACCESSTOKEN')}` },
      agent: httpsAgent
    });

    if (!threadsResponse.ok) {
      throw new Error(`Failed to fetch threads: ${threadsResponse.status} ${threadsResponse.statusText}`);
    }

    const threads = await threadsResponse.json() as { value: any[] };
    const threadsWithContext = threads.value.filter((thread: any) => thread.threadContext !== null);

    const collectionUri = tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI') as string;
    const collectionName = getCollectionName(collectionUri);
    const buildServiceName = `${tl.getVariable('SYSTEM.TEAMPROJECT')} Build Service (${collectionName})`;

    let deletedCount = 0;

    for (const thread of threadsWithContext) {
      const commentsUrl = buildCommentsUrl(thread.id);
      const commentsResponse = await fetch(commentsUrl, {
        headers: { Authorization: `Bearer ${tl.getVariable('SYSTEM.ACCESSTOKEN')}` },
        agent: httpsAgent
      });

      if (!commentsResponse.ok) {
        console.warn(`⚠️ Failed to fetch comments for thread ${thread.id}: ${commentsResponse.status}`);
        continue;
      }

      const comments = await commentsResponse.json() as { value: any[] };
      const aiComments = comments.value.filter((comment: any) => 
        comment.author.displayName === buildServiceName
      );

      for (const comment of aiComments) {
        const removeCommentUrl = buildRemoveCommentUrl(thread.id, comment.id);

        const deleteResponse = await fetch(removeCommentUrl, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${tl.getVariable('SYSTEM.ACCESSTOKEN')}` },
          agent: httpsAgent
        });

        if (deleteResponse.ok) {
          deletedCount++;
        } else {
          console.warn(`⚠️ Failed to delete comment ${comment.id}: ${deleteResponse.status}`);
        }
      }
    }

    console.log(`✅ Deleted ${deletedCount} existing AI review comments`);

  } catch (error) {
    console.error("❌ Error deleting existing comments:", error);
    // Don't throw here - we want to continue even if cleanup fails
  }
}

function buildPRUrl(): string {
  return `${tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')}${tl.getVariable('SYSTEM.TEAMPROJECTID')}/_apis/git/repositories/${tl.getVariable('Build.Repository.Name')}/pullRequests/${tl.getVariable('System.PullRequest.PullRequestId')}/threads?api-version=7.0`;
}

function buildThreadsUrl(): string {
  return `${tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')}${tl.getVariable('SYSTEM.TEAMPROJECTID')}/_apis/git/repositories/${tl.getVariable('Build.Repository.Name')}/pullRequests/${tl.getVariable('System.PullRequest.PullRequestId')}/threads?api-version=7.0`;
}

function buildCommentsUrl(threadId: string): string {
  return `${tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')}${tl.getVariable('SYSTEM.TEAMPROJECTID')}/_apis/git/repositories/${tl.getVariable('Build.Repository.Name')}/pullRequests/${tl.getVariable('System.PullRequest.PullRequestId')}/threads/${threadId}/comments?api-version=7.0`;
}

function buildRemoveCommentUrl(threadId: string, commentId: string): string {
  return `${tl.getVariable('SYSTEM.TEAMFOUNDATIONCOLLECTIONURI')}${tl.getVariable('SYSTEM.TEAMPROJECTID')}/_apis/git/repositories/${tl.getVariable('Build.Repository.Name')}/pullRequests/${tl.getVariable('System.PullRequest.PullRequestId')}/threads/${threadId}/comments/${commentId}?api-version=7.0`;
}

function getCollectionName(collectionUri: string): string {
  const collectionUriWithoutProtocol = collectionUri.replace('https://', '').replace('http://', '');

  if (collectionUriWithoutProtocol.includes('.visualstudio.')) {
    return collectionUriWithoutProtocol.split('.visualstudio.')[0];
  } else {
    return collectionUriWithoutProtocol.split('/')[1];
  }
}