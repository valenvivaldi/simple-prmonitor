import { Octokit } from '@octokit/rest';
import type { PullRequest, ReviewerStatus, CheckSummary } from '../../types';
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

function summarizeChecks(checkRuns: Array<{ status: string; conclusion: string | null }>): CheckSummary {
    let success = 0;
    let failed = 0;
    let pending = 0;

    const successConclusions = new Set(['success', 'neutral', 'skipped']);
    const failedConclusions = new Set(['failure', 'cancelled', 'timed_out', 'action_required', 'stale']);

    for (const run of checkRuns) {
        if (run.status !== 'completed' || run.conclusion === null) {
            pending += 1;
        } else if (successConclusions.has(run.conclusion)) {
            success += 1;
        } else if (failedConclusions.has(run.conclusion)) {
            failed += 1;
        } else {
            pending += 1;
        }
    }

    return { total: checkRuns.length, success, failed, pending };
}

async function fetchReviewerStatuses(
    octokit: Octokit,
    owner: string,
    repo: string,
    prNumber: number,
    requested: GitHubPR['requested_reviewers']
): Promise<ReviewerStatus[]> {
    const reviewers = new Map<string, ReviewerStatus>();

    if (requested) {
        requested.forEach(reviewer => {
            reviewers.set(reviewer.login, {
                login: reviewer.login,
                avatar: reviewer.avatar_url,
                state: 'pending'
            });
        });
    }

    const { data: reviews } = await retryOperation(() =>
        octokit.pulls.listReviews({
            owner,
            repo,
            pull_number: prNumber,
            per_page: 100
        })
    );

    const latestByUser = new Map<string, { state: string; avatar?: string }>();
    reviews.forEach(review => {
        const login = review.user?.login;
        if (!login) return;
        latestByUser.set(login, {
            state: review.state,
            avatar: review.user?.avatar_url
        });
    });

    latestByUser.forEach((value, login) => {
        const normalizedState: ReviewerStatus['state'] =
            value.state === 'APPROVED'
                ? 'approved'
                : value.state === 'CHANGES_REQUESTED'
                    ? 'changes_requested'
                    : value.state === 'COMMENTED' || value.state === 'DISMISSED'
                        ? 'commented'
                        : 'pending';

        reviewers.set(login, {
            login,
            avatar: value.avatar,
            state: normalizedState
        });
    });

    return Array.from(reviewers.values());
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

                    const prs = await Promise.all(pulls.map(async (pull: GitHubPR) => {
                        let reviewers: ReviewerStatus[] = [];
                        let checks: CheckSummary | null = null;

                        try {
                            reviewers = await fetchReviewerStatuses(
                                octokit,
                                repo.owner.login,
                                repo.name,
                                pull.number,
                                pull.requested_reviewers
                            );
                        } catch (error) {
                            console.warn('Failed to fetch reviewers for PR', pull.html_url, error);
                        }

                        try {
                            const { data: checksData } = await retryOperation(() =>
                                octokit.checks.listForRef({
                                    owner: repo.owner.login,
                                    repo: repo.name,
                                    ref: pull.head.sha,
                                    per_page: 100
                                })
                            );
                            checks = summarizeChecks(checksData.check_runs || []);
                        } catch (error) {
                            console.warn('Failed to fetch checks for PR', pull.html_url, error);
                        }

                        return {
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
                            isOwner: pull.user?.login === user.login,
                            reviewers,
                            checks
                        };
                    }));

                    return prs;
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