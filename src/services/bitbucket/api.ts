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

        // Get user data for reviewer checks
        const userResponse = await fetchWithRetry(
            'https://api.bitbucket.org/2.0/user',
            { headers }
        );
        const userData = await userResponse.json();
        const user_id = userData?.account_id;

        // Get whitelisted repositories
        const whitelistedRepos = JSON.parse(localStorage.getItem('bb-whitelisted-repos') || '[]');
        if (whitelistedRepos.length === 0) {
            console.log('No whitelisted repositories found');
            return [];
        }

        console.log(`Fetching PRs for ${whitelistedRepos.length} whitelisted repositories`);
        const allPRs: PullRequest[] = [];

        // Process repositories in chunks to avoid overwhelming the API
        const chunkSize = 3;
        for (let i = 0; i < whitelistedRepos.length; i += chunkSize) {
            const repoChunk = whitelistedRepos.slice(i, i + chunkSize);
            console.log(`Processing chunk ${i / chunkSize + 1} of ${Math.ceil(whitelistedRepos.length / chunkSize)}`);
            
            const repoPromises = repoChunk.map(async (fullName: string) => {
                try {
                    // Build URL with query parameters
                    const queryParams = new URLSearchParams();
                    
                    if (lastSync) {
                        // Convert lastSync to start of day for date-only comparison
                        const syncDate = new Date(lastSync);
                        syncDate.setHours(0, 0, 0, 0);
                        queryParams.append('q', `updated_on > "${syncDate.toISOString()}"`);
                    }
                    
                    if (onlyOpen) {
                        const stateQuery = 'state = "OPEN"';
                        queryParams.set('q', lastSync 
                            ? `${queryParams.get('q')} AND ${stateQuery}`
                            : stateQuery
                        );
                    }
                    
                    // Add pagination parameters
                    queryParams.append('pagelen', '50');
                    
                    const baseUrl = `https://api.bitbucket.org/2.0/repositories/${fullName}/pullrequests`;
                    const url = queryParams.toString() 
                        ? `${baseUrl}?${queryParams.toString()}`
                        : baseUrl;

                    console.log(`Fetching PRs from ${fullName}`);
                    const prResponse = await fetchWithRetry(url, { headers });
                    const prData = await prResponse.json();

                    if (!prData.values) {
                        console.warn(`No PRs found for ${fullName}`);
                        return [];
                    }

                    console.log(`Found ${prData.values.length} PRs in ${fullName}`);
                    return prData.values.map((pull: BitbucketPR) => {
                        // Check if user is a reviewer
                        const isReviewer = pull.reviewers?.some(reviewer => reviewer.account_id === user_id) || false;
                        
                        // Check if user has approved the PR
                        const hasApproved = pull.participants?.some(participant => 
                            participant.account_id === user_id && 
                            participant.approved
                        ) || false;

                        return {
                            id: String(pull.id),
                            title: pull.title,
                            description: pull.description || '',
                            author: {
                                name: pull.author.display_name,
                                avatar: pull.author.links.avatar.href,
                            },
                            repository: pull.destination.repository.full_name,
                            branch: pull.source.branch.name,
                            status: pull.state === 'MERGED' 
                                ? 'merged' 
                                : pull.state === 'DECLINED' 
                                    ? 'closed' 
                                    : 'open',
                            comments: pull.comment_count,
                            commits: pull.commits?.length || 0,
                            created: pull.created_on,
                            updated: pull.updated_on,
                            source: 'bitbucket' as const,
                            url: pull.links.html.href,
                            imReviewer: isReviewer,
                            reviewed: hasApproved,
                            isOwner: pull.author.account_id === user_id
                        };
                    });
                } catch (error) {
                    console.error(`Error fetching PRs for ${fullName}:`, error);
                    return [];
                }
            });

            const repoPRs = await Promise.all(repoPromises);
            repoPRs.forEach(prs => allPRs.push(...prs));

            // Add delay between chunks to avoid rate limiting
            if (i + chunkSize < whitelistedRepos.length) {
                await delay(200);
            }
        }

        console.log(`Total PRs fetched: ${allPRs.length}`);
        return allPRs;
    } catch (error) {
        console.error('Error in fetchBitbucketPRs:', error);
        const message = error instanceof Error ? error.message : 'Failed to fetch Bitbucket PRs';
        throw new Error(`Bitbucket API Error: ${message}. Please check your credentials and try again.`);
    }
}