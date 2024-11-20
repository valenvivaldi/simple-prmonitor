import { fetchGithubPRs, fetchBitbucketPRs } from './services/api';
import type { PullRequest, Credentials } from './types';

let refreshInterval: number | undefined;

async function fetchAllPRs(): Promise<PullRequest[]> {
  const credentials = await chrome.storage.local.get('pr-viewer-credentials');
  const creds: Credentials = credentials['pr-viewer-credentials'] || {};
  
  const prs: PullRequest[] = [];
  
  if (creds.github?.token) {
    try {
      const githubPRs = await fetchGithubPRs(creds.github.token);
      prs.push(...githubPRs);
    } catch (error) {
      console.error('Error fetching GitHub PRs:', error);
    }
  }
  
  if (creds.bitbucket?.username && creds.bitbucket?.appPassword) {
    try {
      const bitbucketPRs = await fetchBitbucketPRs(
        creds.bitbucket.username,
        creds.bitbucket.appPassword
      );
      prs.push(...bitbucketPRs);
    } catch (error) {
      console.error('Error fetching Bitbucket PRs:', error);
    }
  }
  
  await chrome.storage.local.set({ 'pr-viewer-prs': prs });
  return prs;
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get('pr-viewer-refresh-interval', (data) => {
    const interval = data['pr-viewer-refresh-interval'] || 5;
    startRefreshInterval(interval);
  });
});

function startRefreshInterval(minutes: number) {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  
  refreshInterval = setInterval(fetchAllPRs, minutes * 60 * 1000);
  chrome.storage.local.set({ 'pr-viewer-refresh-interval': minutes });
}