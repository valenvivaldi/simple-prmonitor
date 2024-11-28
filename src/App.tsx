import React, {useState, useEffect} from 'react';
import {Header} from './components/Header';
import {PRList} from './components/PRList';
import {SettingsModal} from './components/SettingsModal';
import {GHReviewers} from './components/reviewers/GHReviewers';
import {usePRs} from './hooks/usePRs';
import {Toaster} from 'react-hot-toast';
import type {TabType, Credentials} from './types';

export function App() {
    const {prs, loading, error, refreshing, refresh} = usePRs();
    const [currentTab, setCurrentTab] = useState<TabType>('to-review');
    const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['github', 'bitbucket']));
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [credentials, setCredentials] = useState<Credentials>(() => {
        const stored = localStorage.getItem('pr-viewer-credentials');
        return stored ? JSON.parse(stored) : {};
    });
    const [showOnlyOpen, setShowOnlyOpen] = useState(() => {
        const stored = localStorage.getItem('pr-viewer-show-only-open');
        return stored ? JSON.parse(stored) : true;
    });

    useEffect(() => {
        const loadCredentials = async () => {
            if (typeof chrome !== 'undefined' && chrome.storage) {
                const result = await chrome.storage.local.get('pr-viewer-credentials');
                if (result['pr-viewer-credentials']) {
                    setCredentials(result['pr-viewer-credentials']);
                }
            }
        };
        loadCredentials();
    }, []);

    const filteredPRs = prs
        .filter(pr => selectedPlatforms.has(pr.source))
        .filter(pr => pr.title.toLowerCase().includes(searchQuery.toLowerCase()))
        .filter(pr => !showOnlyOpen || pr.status === 'open')
        .filter(pr => {
            switch (currentTab) {
                case 'to-review':
                    return !pr.reviewed && !pr.isOwner;
                case 'reviewed':
                    return pr.reviewed && !pr.isOwner;
                case 'my-prs':
                    return pr.isOwner;
                default:
                    return true;
            }
        });

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Toaster position="top-right"/>
            <Header
                currentTab={currentTab}
                setCurrentTab={setCurrentTab}
                selectedPlatforms={selectedPlatforms}
                setSelectedPlatforms={setSelectedPlatforms}
                onOpenSettings={() => setIsSettingsOpen(true)}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onRefresh={refresh}
                refreshing={refreshing}
                showOnlyOpen={showOnlyOpen}
                setShowOnlyOpen={(value) => {
                    setShowOnlyOpen(value);
                    localStorage.setItem('pr-viewer-show-only-open', JSON.stringify(value));
                    if (typeof chrome !== 'undefined' && chrome.storage) {
                        chrome.storage.local.set({'pr-viewer-show-only-open': value});
                    }
                }}
                hasGithubToken={Boolean(credentials.github?.token)}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {currentTab === 'gh-reviewers' && credentials.github?.token ? (
                    <GHReviewers githubToken={credentials.github.token}/>
                ) : (
                    <PRList prs={filteredPRs}/>
                )}
            </main>
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                showOnlyOpen={showOnlyOpen}
                setShowOnlyOpen={setShowOnlyOpen}
            />
        </div>
    );
}

export default App;