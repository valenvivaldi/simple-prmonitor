import { Octokit } from '@octokit/rest';
import type { PullRequest } from '../../types';
import type { GitHubRepo, GitHubPR, GitHubError } from './types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function retryOperation<T>(
    operation: () => Promise<T>,
    retries: number = MAX_RETRIES
): Promise<T> {
    try {
        return await operation();
    } catch (error) {
        if (retries > 0 && error instanceof Error) {
            const githubError = error as GitHubError;
            // Only retry on server errors (500s) or rate limit (429)
            if (githubError.status >= 500 || githubError.status === 429) {
                await delay(RETRY_DELAY);
                return retryOperation(operation, retries - 1);
            }
        }
        throw error;
    }
}

export async function fetchGithubPRs(
    token: string,
    onlyOpen: boolean = false,
    lastSync?: string
): Promise<PullRequest[]> {
    try {
        const octokit = new Octokit({ auth: token });
        const { data: user } = await retryOperation(() => 
            octokit.users.getAuthenticated()
        );

        const repoParams: any = {
            sort: 'updated',
            per_page: 100,
            ...(lastSync && { since: lastSync })
        };

        const { data: repos } = await retryOperation(() =>
            octokit.repos.listForAuthenticatedUser(repoParams)
        );

        const allPRs: PullRequest[] = [];

        // Use Promise.all with a limited concurrency
        const chunkSize = 5;
        for (let i = 0; i < repos.length; i += chunkSize) {
            const chunk = repos.slice(i, i + chunkSize);
            const prPromises = chunk.map(async (repo: GitHubRepo) => {
                try {
                    const pullParams: any = {
                        owner: repo.owner.login,
                        repo: repo.name,
                        state: onlyOpen ? 'open' : 'all',
                        per_page: 100,
                        sort: 'updated',
                        direction: 'desc',
                        ...(lastSync && { since: lastSync })
                    };

                    const { data: pulls } = await retryOperation(() =>
                        octokit.pulls.list(pullParams)
                    );

                    return pulls.map((pull: GitHubPR) => ({
                        id: String(pull.id),
                        title: pull.title,
                        description: pull.body || '',
                        author: {
                            name: pull.user?.login || '',
                            avatar: pull.user?.avatar_url || '',
                        },
                        repository: repo.full_name,
                        branch: pull.head.ref,
                        status: pull.merged ? 'merged' : pull.state,
                        comments: pull.comments,
                        commits: pull.commits,
                        created: pull.created_at,
                        updated: pull.updated_at,
                        source: 'github' as const,
                        url: pull.html_url,
                        imReviewer: Boolean(pull.requested_reviewers?.find(reviewer => reviewer.login === user.login)),
                        reviewed: Boolean(pull.requested_reviewers?.length === 0),
                        isOwner: pull.user?.login === user.login
                    }));
                } catch (error) {
                    console.error(`Error fetching PRs for ${repo.full_name}:`, error);
                    return [];
                }
            });

            const results = await Promise.all(prPromises);
            results.forEach(prs => allPRs.push(...prs));
            
            // Add a small delay between chunks to avoid rate limiting
            if (i + chunkSize < repos.length) {
                await delay(100);
            }
        }

        return allPRs;
    } catch (error) {
        console.error('Error in fetchGithubPRs:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch GitHub PRs';
        throw new Error(`GitHub API Error: ${message}. Please check your token and try again.`);
    }
}