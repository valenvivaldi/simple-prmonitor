import {useState, useEffect, useCallback} from 'react';
import {fetchGithubPRs, fetchBitbucketPRs} from '../services/api';
import type {PullRequest, Credentials} from '../types';

export function usePRs() {
    const [prs, setPRs] = useState<PullRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPRs = useCallback(async () => {
        try {
            setRefreshing(true);
            setError(null);

            let storedCredentials: Credentials = {};

            // Try to get credentials from Chrome storage first, then fallback to localStorage
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get('pr-viewer-credentials');
                storedCredentials = result['pr-viewer-credentials'] || {};
            } else {
                const stored = localStorage.getItem('pr-viewer-credentials');
                storedCredentials = stored ? JSON.parse(stored) : {};
            }

            const allPRs: PullRequest[] = [];
            const errors: string[] = [];

            if (storedCredentials.github?.token) {
                try {
                    const githubPRs = await fetchGithubPRs(storedCredentials.github.token, true);
                    allPRs.push(...githubPRs);
                } catch (err) {
                    errors.push(`GitHub: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
            }

            if (storedCredentials.bitbucket?.username && storedCredentials.bitbucket?.appPassword) {
                try {
                    const bitbucketPRs = await fetchBitbucketPRs(
                        storedCredentials.bitbucket.username,
                        storedCredentials.bitbucket.appPassword,
                            true
                    );
                    allPRs.push(...bitbucketPRs);
                } catch (err) {
                    errors.push(`Bitbucket: ${err instanceof Error ? err.message : 'Unknown error'}`);
                }
            }

            if (errors.length > 0) {
                setError(errors.join('\n'));
            }

            if (allPRs.length > 0) {
                setPRs(allPRs);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch PRs');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchPRs();

        // Set up refresh interval
        const getRefreshInterval = async () => {
            let interval = '5';
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get('pr-viewer-refresh-interval');
                interval = result['pr-viewer-refresh-interval'] || '5';
            } else {
                interval = localStorage.getItem('pr-viewer-refresh-interval') || '5';
            }
            return parseInt(interval) * 60 * 1000;
        };

        getRefreshInterval().then(interval => {
            const intervalId = setInterval(fetchPRs, interval);
            return () => clearInterval(intervalId);
        });
    }, [fetchPRs]);

    const refresh = () => {
        if (!refreshing) {
            fetchPRs();
        }
    };

    return {prs, loading, error, refreshing, refresh};
}