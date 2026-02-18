export default async function loadDebugCredentials(): Promise<void> {
    if (!import.meta.env.DEV) return;

    try {
        const res = await fetch('/debug-credentials.json');
        if (!res.ok) return;
        const creds = await res.json();

        if (typeof chrome !== 'undefined' && chrome.storage) {
            chrome.storage.local.set({ 'pr-viewer-credentials': creds });
        } else {
            localStorage.setItem('pr-viewer-credentials', JSON.stringify(creds));
        }

        // Optionally set Bitbucket whitelisted repos if provided in the debug file
        if (creds.bitbucket?.whitelistedRepos) {
            localStorage.setItem('bb-whitelisted-repos', JSON.stringify(creds.bitbucket.whitelistedRepos));
        }

        console.info('Debug credentials loaded');
    } catch (err) {
        console.warn('No debug credentials found or failed to load', err);
    }
}
