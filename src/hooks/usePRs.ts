import {useState, useEffect, useCallback, useRef} from 'react';
import {
    fetchGithubPRs,
    fetchBitbucketPRs,
    fetchGithubPRDetails,
    fetchBitbucketPRDetails
} from '../services/api';
import type {PullRequest, Credentials, SyncDates} from '../types';
import toast from 'react-hot-toast';
import {updatePRArray} from "../utils";

export function usePRs() {
    const prsRef = useRef<PullRequest[]>([]);
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

    // Keep ref in sync with state
    useEffect(() => {
        prsRef.current = prs;
    }, [prs]);

    const fetchPRDetailsIncremental = async (pr: PullRequest, credentials: Credentials) => {
        try {
            let details: Partial<PullRequest> = {};
            if (pr.source === 'github' && credentials.github?.token) {
                details = await fetchGithubPRDetails(credentials.github.token, pr);
            } else if (pr.source === 'bitbucket' && credentials.bitbucket?.username && credentials.bitbucket?.appPassword) {
                details = await fetchBitbucketPRDetails(credentials.bitbucket.username, credentials.bitbucket.appPassword, pr);
            }

            if (Object.keys(details).length > 0) {
                setPRs(prevPRs => {
                    const newPRs = prevPRs.map(p => 
                        p.id === pr.id && p.source === pr.source 
                            ? { ...p, ...details } 
                            : p
                    );
                    
                    // Persist incremental update
                    localStorage.setItem('pr-viewer-prs', JSON.stringify(newPRs));
                    if (typeof chrome !== 'undefined' && chrome.storage) {
                        chrome.storage.local.set({ 'pr-viewer-prs': newPRs });
                    }
                    
                    return newPRs;
                });
            }
        } catch (err) {
            console.error(`Error fetching details for PR ${pr.id}:`, err);
        }
    };

    const fetchPRs = useCallback(async (showLoading = false) => {
        try {
            setRefreshing(true);
            setError(null);
            toast.loading('Actualizando lista...', { id: 'refresh-toast' });

            let storedCredentials: Credentials = {};
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get('pr-viewer-credentials');
                storedCredentials = result['pr-viewer-credentials'] || {};
            } else {
                const stored = localStorage.getItem('pr-viewer-credentials');
                storedCredentials = stored ? JSON.parse(stored) : {};
            }

            const allNewPRs: PullRequest[] = [];
            const errors: string[] = [];
            const newSyncDates: SyncDates = {};

            const get24HoursBeforeSync = (lastSyncDate?: string) => {
                if (!lastSyncDate) return undefined;
                const date = new Date(lastSyncDate);
                date.setHours(date.getHours() - 24);
                return date.toISOString();
            };

            // 1. Fetch Lists (GitHub)
            if (storedCredentials.github?.token) {
                try {
                    const githubLastSync = get24HoursBeforeSync(lastSyncDates.github);
                    const githubPRs = await fetchGithubPRs(
                        storedCredentials.github.token,
                        true,
                        githubLastSync
                    );
                    allNewPRs.push(...githubPRs);
                    newSyncDates.github = new Date().toISOString();
                } catch (err) {
                    const message = `GitHub: ${err instanceof Error ? err.message : 'Unknown error'}`;
                    errors.push(message);
                    toast.error(message);
                }
            }

            // 2. Fetch Lists (Bitbucket)
            if (storedCredentials.bitbucket?.username && storedCredentials.bitbucket?.appPassword) {
                try {
                    const bitbucketLastSync = get24HoursBeforeSync(lastSyncDates.bitbucket);
                    const bitbucketPRs = await fetchBitbucketPRs(
                        storedCredentials.bitbucket.username,
                        storedCredentials.bitbucket.appPassword,
                        true,
                        bitbucketLastSync
                    );
                    allNewPRs.push(...bitbucketPRs);
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

            // 3. Update UI with List immediately
            let currentPrs = prsRef.current;
            if (allNewPRs.length > 0) {
                currentPrs = updatePRArray(prsRef.current, allNewPRs);
                setPRs(currentPrs);
                
                setLastSyncDates(prev => ({...prev, ...newSyncDates}));
                
                localStorage.setItem('pr-viewer-prs', JSON.stringify(currentPrs));
                localStorage.setItem('pr-viewer-last-sync', JSON.stringify({...lastSyncDates, ...newSyncDates}));
                
                if (typeof chrome !== 'undefined' && chrome.storage) {
                    chrome.storage.local.set({
                        'pr-viewer-prs': currentPrs,
                        'pr-viewer-last-sync': {...lastSyncDates, ...newSyncDates}
                    });
                }
                toast.success('Lista actualizada. Cargando detalles...', { id: 'refresh-toast' });
            } else {
                toast.success('No hay nuevos PRs', { id: 'refresh-toast' });
            }

            // 4. Fetch Details in parallel (Incremental)
            // We only fetch details for PRs that were either just added or updated
            const prsToUpdate = allNewPRs.length > 0 ? allNewPRs : currentPrs;
            
            // Limit concurrency to 5 at a time
            const chunkSize = 5;
            for (let i = 0; i < prsToUpdate.length; i += chunkSize) {
                const chunk = prsToUpdate.slice(i, i + chunkSize);
                await Promise.all(chunk.map(pr => fetchPRDetailsIncremental(pr, storedCredentials)));
            }

            if (allNewPRs.length > 0) {
                toast.success('Actualización completa', { id: 'refresh-toast' });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch PRs';
            setError(message);
            toast.error(message, { id: 'refresh-toast' });
        } finally {
            setRefreshing(false);
        }
    }, [lastSyncDates]);

    const refresh = () => {
        if (!refreshing) {
            fetchPRs(false);
        }
    };

    const refreshPR = async (pr: PullRequest) => {
        let storedCredentials: Credentials = {};
        if (typeof chrome !== 'undefined' && chrome.storage) {
            const result = await chrome.storage.local.get('pr-viewer-credentials');
            storedCredentials = result['pr-viewer-credentials'] || {};
        } else {
            const stored = localStorage.getItem('pr-viewer-credentials');
            storedCredentials = stored ? JSON.parse(stored) : {};
        }
        
        toast.loading(`Actualizando ${pr.title}...`, { id: `refresh-pr-${pr.id}` });
        await fetchPRDetailsIncremental(pr, storedCredentials);
        toast.success('PR actualizado', { id: `refresh-pr-${pr.id}` });
    };

    return {prs, loading, error, refreshing, refresh, refreshPR};
}
