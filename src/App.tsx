import React, { useState } from 'react';
import { Header } from './components/Header';
import { PRList } from './components/PRList';
import { SettingsModal } from './components/SettingsModal';
import { usePRs } from './hooks/usePRs';
import type { TabType } from './types';

export function App() {
  const { prs, loading, error, refreshing, refresh } = usePRs();
  const [currentTab, setCurrentTab] = useState<TabType>('to-review');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set(['github', 'bitbucket']));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnlyOpen, setShowOnlyOpen] = useState(() => {
    const stored = localStorage.getItem('pr-viewer-show-only-open');
    return stored ? JSON.parse(stored) : true;
  });

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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            chrome.storage.local.set({ 'pr-viewer-show-only-open': value });
          }
        }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PRList prs={filteredPRs} />
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