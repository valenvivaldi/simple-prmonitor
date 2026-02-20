import { GitPullRequest, Search, Settings, RotateCw, Moon, Sun } from 'lucide-react';
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
    groupByBranch: boolean;
    setGroupByBranch: (value: boolean) => void;
    hasGithubToken: boolean;
    hasBitbucketCreds: boolean;
    isDarkMode: boolean;
    setIsDarkMode: (value: boolean) => void;
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
    groupByBranch,
    setGroupByBranch,
    hasGithubToken,
    hasBitbucketCreds,
    isDarkMode,
    setIsDarkMode
}: HeaderProps) {
    const tabs: { id: TabType; name: string; enabled: boolean }[] = [
        { id: 'reviews', name: 'To Review', enabled: true },
        { id: 'my-prs', name: 'My PRs', enabled: true },
        { id: 'gh-reviewers', name: 'GH Reviewers', enabled: hasGithubToken },
        { id: 'bb-whitelist', name: 'BB Whitelist', enabled: hasBitbucketCreds }
    ];

    return (
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <GitPullRequest className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white">PR Viewer</h1>
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
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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
                                        className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Show only open PRs</span>
                                </label>
                                <label className="inline-flex items-center">
                                    <input
                                        type="checkbox"
                                        checked={groupByBranch}
                                        onChange={(e) => setGroupByBranch(e.target.checked)}
                                        className="rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                    />
                                    <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">Group by branch</span>
                                </label>
                                <PlatformFilter
                                    selectedPlatforms={selectedPlatforms}
                                    setSelectedPlatforms={setSelectedPlatforms}
                                />
                                <button
                                    onClick={onRefresh}
                                    disabled={refreshing}
                                    className={`inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium ${
                                        refreshing
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                            : 'text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                                >
                                    <RotateCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                                    Refresh
                                </button>
                            </>
                        )}
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            className="p-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                        >
                            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={onOpenSettings}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Settings
                        </button>
                    </div>
                </div>

                <Tab.Group selectedIndex={tabs.findIndex(tab => tab.id === currentTab)} onChange={(index) => setCurrentTab(tabs[index].id)}>
                    <Tab.List className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
                        {tabs.filter(tab => tab.enabled).map((tab) => (
                            <Tab
                                key={tab.id}
                                className={({ selected }) =>
                                    `px-3 py-2 text-sm font-medium border-b-2 focus:outline-none ${
                                        selected
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
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
