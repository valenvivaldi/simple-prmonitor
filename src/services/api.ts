import {Octokit} from '@octokit/rest';
import type {PullRequest} from '../types';

export async function fetchGithubPRs(token: string, onlyOpen: boolean = false): Promise<PullRequest[]> {
    try {
        const octokit = new Octokit({auth: token});

        // First, get the authenticated user's information
        const {data: user} = await octokit.users.getAuthenticated();

        // Get repositories the user has access to
        const {data: repos} = await octokit.repos.listForAuthenticatedUser({
            sort: 'updated',
            per_page: 100
        });

        const allPRs: PullRequest[] = [];

        // Fetch PRs from each repository
        for (const repo of repos) {
            try {
                const {data: pulls} = await octokit.pulls.list({
                    owner: repo.owner.login,
                    repo: repo.name,
                    state: onlyOpen ? 'open' : 'all',
                    per_page: 100
                });

                const mappedPRs = pulls.map(pull => ({
                    id: String(pull.id),
                    title: pull.title,
                    description: pull.body || '',
                    author: {
                        name: pull.user?.login || '',
                        avatar: pull.user?.avatar_url || '',
                    },
                    repository: repo.full_name,
                    branch: pull.head.ref,
                    status: pull.merged ? 'merged' : (pull.state as 'open' | 'closed'),
                    comments: pull.comments,
                    commits: pull.commits,
                    created: pull.created_at,
                    updated: pull.updated_at,
                    source: 'github' as const,
                    url: pull.html_url,
                    reviewed: Boolean(pull.requested_reviewers?.length === 0),
                    isOwner: pull.user?.login === user.login
                }));

                allPRs.push(...mappedPRs);
            } catch (error) {
                console.error(`Error fetching PRs for ${repo.full_name}:`, error);
                // Continue with other repositories even if one fails
            }
        }

        return allPRs;
    } catch (error) {
        console.error('Error in fetchGithubPRs:', error);
        throw new Error('Failed to fetch GitHub PRs. Please check your token and try again.');
    }
}

export async function fetchBitbucketPRs(username: string, appPassword: string, onlyOpen: boolean = false): Promise<PullRequest[]> {
    try {
        const auth = btoa(`${username}:${appPassword}`);
        //get current user
        const userResponse = await fetch('https://api.bitbucket.org/2.0/user', {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            }
        });
        if (!userResponse.ok) {
            throw new Error(`HTTP error! status: ${userResponse.status}`);
        }
        const userData = await userResponse.json();
        console.table(userData);
        const user_id = userData?.account_id;


        let url = 'https://api.bitbucket.org/2.0/pullrequests/' + user_id;
        if (onlyOpen) {
            url += '?state=OPEN';
        }
        const response = await fetch(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        return data.values.map((pull) => ({
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
            reviewed: pull.reviewers?.length === 0,
            isOwner: pull.author.account_id === user_id
        }));
    } catch (error) {
        console.error('Error in fetchBitbucketPRs:', error);
        throw new Error('Failed to fetch Bitbucket PRs. Please check your credentials and try again.');
    }
}