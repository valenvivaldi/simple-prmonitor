import { GitPullRequest, Search, Settings, RotateCw } from 'lucide-react';
import { Tab } from '@headlessui/react';
import { PlatformFilter } from './PlatformFilter';
import type { TabType } from '../types';

interface HeaderProps {
    currentTab: TabType;
    setCurrentTab: (tab: TabType) => void;
    selectedPlatforms: Set<string>;
    setSelectedPlatforms: (platforms: Set<string>) => void;
    onOpenSettings: () => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onRefresh: () => void;
    refreshing: boolean;
    showOnlyOpen: boolean;
    setShowOnlyOpen: (value: boolean) => void;
    hasGithubToken: boolean;
    hasBitbucketCreds: boolean;
}

export function Header({
    currentTab,
    setCurrentTab,
    selectedPlatforms,
    setSelectedPlatforms,
    onOpenSettings,
    searchQuery,
    setSearchQuery,
    onRefresh,
    refreshing,
    showOnlyOpen,
    setShowOnlyOpen,
    hasGithubToken,
    hasBitbucketCreds
}: HeaderProps) {
    const tabs: { id: TabType; name: string; enabled: boolean }[] = [
        { id: 'reviews', name: 'To Review', enabled: true },
        { id: 'my-prs', name: 'My PRs', enabled: true },
        { id: 'gh-reviewers', name: 'GH Reviewers', enabled: hasGithubToken },
        { id: 'bb-whitelist', name: 'BB Whitelist', enabled: hasBitbucketCreds }
    ];

    return (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <GitPullRequest className="w-8 h-8 text-blue-600" />
                        <h1 className="text-xl font-bold text-gray-900">PR Viewer</h1>
                    </div>
                    
                    <div className="flex-1 max-w-2xl mx-8">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search pull requests..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        {currentTab !== 'gh-reviewers' && currentTab !== 'bb-whitelist' && (
                            <>
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={showOnlyOpen}
                                        onChange={(e) => setShowOnlyOpen(e.target.checked)}
                                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="ml-2 text-sm text-gray-600">Show only open PRs</span>
                                </label>
                                <PlatformFilter
                                    selectedPlatforms={selectedPlatforms}
                                    setSelectedPlatforms={setSelectedPlatforms}
                                />
                                <button
                                    onClick={onRefresh}
                                    disabled={refreshing}
                                    className={`inline-flex items-center px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
                                        refreshing
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'text-gray-700 bg-white hover:bg-gray-50'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                >
                                    <RotateCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </>
                        )}
                        <button
                            onClick={onOpenSettings}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </button>
                    </div>
                </div>

                <Tab.Group selectedIndex={tabs.findIndex(tab => tab.id === currentTab)} onChange={(index) => setCurrentTab(tabs[index].id)}>
                    <Tab.List className="flex space-x-4 border-b border-gray-200">
                        {tabs.filter(tab => tab.enabled).map((tab) => (
                            <Tab
                                key={tab.id}
                                className={({ selected }) =>
                                    `px-3 py-2 text-sm font-medium border-b-2 focus:outline-none ${
                                        selected
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`
                                }
                            >
                                {tab.name}
                            </Tab>
                        ))}
                    </Tab.List>
                </Tab.Group>
            </div>
        </header>
    );
}