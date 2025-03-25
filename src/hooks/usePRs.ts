import {useState, useEffect, useCallback} from 'react';
import {fetchGithubPRs, fetchBitbucketPRs} from '../services/api';
import type {PullRequest, Credentials, SyncDates} from '../types';
import toast from 'react-hot-toast';
import {updatePRArray} from "../utils";

export function usePRs() {
    const [prs, setPRs] = useState<PullRequest[]>(() => {
        const storedPRs = localStorage.getItem('pr-viewer-prs');
        return storedPRs ? JSON.parse(storedPRs) : [];
    });
    
    const [lastSyncDates, setLastSyncDates] = useState<SyncDates>(() => {
        const stored = localStorage.getItem('pr-viewer-last-sync');
        return stored ? JSON.parse(stored) : {};
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPRs = useCallback(async (showLoading = false) => {
        try {
            setRefreshing(true);
            setError(null);
            toast.loading('Actualizando...', { id: 'refresh-toast' });

            let storedCredentials: Credentials = {};
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get('pr-viewer-credentials');
                storedCredentials = result['pr-viewer-credentials'] || {};
            } else {
                const stored = localStorage.getItem('pr-viewer-credentials');
                storedCredentials = stored ? JSON.parse(stored) : {};
            }

            const allPRs: PullRequest[] = [];
            const errors: string[] = [];
            const newSyncDates: SyncDates = {};

            // Function to get date 24 hours before the last sync
            const get24HoursBeforeSync = (lastSyncDate?: string) => {
                if (!lastSyncDate) return undefined;
                const date = new Date(lastSyncDate);
                date.setHours(date.getHours() - 24);
                return date.toISOString();
            };

            if (storedCredentials.github?.token) {
                try {
                    const githubLastSync = get24HoursBeforeSync(lastSyncDates.github);
                    const githubPRs = await fetchGithubPRs(
                        storedCredentials.github.token,
                        true,
                        githubLastSync
                    );
                    allPRs.push(...githubPRs);
                    // Set sync date to current time
                    newSyncDates.github = new Date().toISOString();
                } catch (err) {
                    const message = `GitHub: ${err instanceof Error ? err.message : 'Unknown error'}`;
                    errors.push(message);
                    toast.error(message);
                }
            }

            if (storedCredentials.bitbucket?.username && storedCredentials.bitbucket?.appPassword) {
                try {
                    const bitbucketLastSync = get24HoursBeforeSync(lastSyncDates.bitbucket);
                    const bitbucketPRs = await fetchBitbucketPRs(
                        storedCredentials.bitbucket.username,
                        storedCredentials.bitbucket.appPassword,
                        true,
                        bitbucketLastSync
                    );
                    allPRs.push(...bitbucketPRs);
                    // Set sync date to current time
                    newSyncDates.bitbucket = new Date().toISOString();
                } catch (err) {
                    const message = `Bitbucket: ${err instanceof Error ? err.message : 'Unknown error'}`;
                    errors.push(message);
                    toast.error(message);
                }
            }

            if (errors.length > 0) {
                setError(errors.join('\n'));
            }

            if (allPRs.length > 0) {
                const currentPrs = updatePRArray(prs, allPRs);
                setPRs(currentPrs);
                
                // Update sync dates only for successful fetches
                setLastSyncDates(prev => ({...prev, ...newSyncDates}));
                
                // Store updated data
                localStorage.setItem('pr-viewer-prs', JSON.stringify(currentPrs));
                localStorage.setItem('pr-viewer-last-sync', JSON.stringify({...lastSyncDates, ...newSyncDates}));
                
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.set({
                        'pr-viewer-prs': currentPrs,
                        'pr-viewer-last-sync': {...lastSyncDates, ...newSyncDates}
                    });
                }
            }
            toast.success('Actualización completada', { id: 'refresh-toast' });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch PRs';
            setError(message);
            toast.error(message, { id: 'refresh-toast' });
        } finally {
            setRefreshing(false);
        }
    }, [prs, lastSyncDates]);

    const refresh = () => {
        if (!refreshing) {
            fetchPRs(false);
        }
    };

    return {prs, loading, error, refreshing, refresh};
}