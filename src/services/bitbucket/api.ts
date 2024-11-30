import type { PullRequest } from '../../types';
import type { BitbucketWorkspace, BitbucketRepo, BitbucketPR } from './types';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(
    url: string,
    options: RequestInit,
    retries: number = MAX_RETRIES
): Promise<Response> {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    } catch (error) {
        if (retries > 0) {
            await delay(RETRY_DELAY);
            return fetchWithRetry(url, options, retries - 1);
        }
        throw error;
    }
}

export async function fetchBitbucketPRs(
    username: string,
    appPassword: string,
    onlyOpen: boolean = false,
    lastSync?: string
): Promise<PullRequest[]> {
    try {
        const auth = btoa(`${username}:${appPassword}`);
        const headers = {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
        };

        const userResponse = await fetchWithRetry(
            'https://api.bitbucket.org/2.0/user',
            { headers }
        );
        const userData = await userResponse.json();
        const user_id = userData?.account_id;

        const workspacesResponse = await fetchWithRetry(
            'https://api.bitbucket.org/2.0/workspaces',
            { headers }
        );
        const workspacesData = await workspacesResponse.json();
        const allPRs: PullRequest[] = [];

        // Process workspaces in chunks to avoid overwhelming the API
        const chunkSize = 3;
        for (let i = 0; i < workspacesData.values.length; i += chunkSize) {
            const workspaceChunk = workspacesData.values.slice(i, i + chunkSize);
            
            const workspacePromises = workspaceChunk.map(async (workspace: BitbucketWorkspace) => {
                try {
                    const reposResponse = await fetchWithRetry(
                        `https://api.bitbucket.org/2.0/repositories/${workspace.slug}`,
                        { headers }
                    );
                    const reposData = await reposResponse.json();

                    const repoPromises = reposData.values.map(async (repo: BitbucketRepo) => {
                        try {
                            let url = `https://api.bitbucket.org/2.0/repositories/${repo.full_name}/pullrequests`;
                            if (lastSync) {
                                url += `?q=updated_on > ${lastSync}`;
                            }
                            if (onlyOpen) {
                                url += `${lastSync ? ' AND ' : '?q='}state = "OPEN"`;
                            }

                            const prResponse = await fetchWithRetry(url, { headers });
                            const prData = await prResponse.json();

                            return prData.values.map((pull: BitbucketPR) => ({
                                id: String(pull.id),
                                title: pull.title,
                                description: pull.description || '',
                                author: {
                                    name: pull.author.display_name,
                                    avatar: pull.author.links.avatar.href,
                                },
                                repository: pull.destination.repository.full_name,
                                branch: pull.source.branch.name,
                                status: pull.state === 'MERGED' ? 'merged' : 'open',
                                comments: pull.comment_count,
                                commits: pull.commits?.length || 0,
                                created: pull.created_on,
                                updated: pull.updated_on,
                                source: 'bitbucket' as const,
                                url: pull.links.html.href,
                                imReviewer: pull.reviewers?.some(reviewer => reviewer.account_id === user_id) || false,
                                reviewed: pull.reviewers?.length === 0,
                                isOwner: pull.author.account_id === user_id
                            }));
                        } catch (error) {
                            console.error(`Error fetching PRs for ${repo.full_name}:`, error);
                            return [];
                        }
                    });

                    const repoPRs = await Promise.all(repoPromises);
                    return repoPRs.flat();
                } catch (error) {
                    console.error(`Error processing workspace ${workspace.slug}:`, error);
                    return [];
                }
            });

            const workspacePRs = await Promise.all(workspacePromises);
            workspacePRs.forEach(prs => allPRs.push(...prs));

            // Add delay between workspace chunks
            if (i + chunkSize < workspacesData.values.length) {
                await delay(200);
            }
        }

        return allPRs;
    } catch (error) {
        console.error('Error in fetchBitbucketPRs:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch Bitbucket PRs';
        throw new Error(`Bitbucket API Error: ${message}. Please check your credentials and try again.`);
    }
}