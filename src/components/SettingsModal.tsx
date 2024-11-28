import React, { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { X } from 'lucide-react';
import type { Credentials } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showOnlyOpen: boolean;
  setShowOnlyOpen: (value: boolean) => void;
}

export function SettingsModal({ isOpen, onClose, showOnlyOpen, setShowOnlyOpen }: SettingsModalProps) {
  const [credentials, setCredentials] = useState<Credentials>({});
  const [refreshInterval, setRefreshInterval] = useState('5');

  useEffect(() => {
    const loadSettings = async () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get(['pr-viewer-credentials', 'pr-viewer-refresh-interval']);
        if (result['pr-viewer-credentials']) {
          setCredentials(result['pr-viewer-credentials']);
        }
        if (result['pr-viewer-refresh-interval']) {
          setRefreshInterval(result['pr-viewer-refresh-interval']);
        }
      } else {
        const storedCredentials = localStorage.getItem('pr-viewer-credentials');
        const storedInterval = localStorage.getItem('pr-viewer-refresh-interval');
        
        if (storedCredentials) {
          setCredentials(JSON.parse(storedCredentials));
        }
        if (storedInterval) {
          setRefreshInterval(storedInterval);
        }
      }
    };
    
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save to localStorage
    localStorage.setItem('pr-viewer-credentials', JSON.stringify(credentials));
    localStorage.setItem('pr-viewer-refresh-interval', refreshInterval);
    localStorage.setItem('pr-viewer-show-only-open', JSON.stringify(showOnlyOpen));
    
    // If in Chrome extension context, also save to chrome.storage
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        'pr-viewer-credentials': credentials,
        'pr-viewer-refresh-interval': refreshInterval,
        'pr-viewer-show-only-open': showOnlyOpen
      });
    }

    // Trigger a page reload to ensure all components pick up the new settings
    window.location.reload();
    
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-lg w-full bg-white rounded-xl shadow-lg">
          <div className="flex justify-between items-center p-6 border-b border-gray-200">
            <Dialog.Title className="text-lg font-semibold">
              Settings
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Display Settings</h3>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="show-only-open"
                  checked={showOnlyOpen}
                  onChange={(e) => setShowOnlyOpen(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <label htmlFor="show-only-open" className="ml-2 block text-sm text-gray-700">
                  Show only open pull requests
                </label>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Refresh Interval</h3>
              <div>
                <label htmlFor="refresh-interval" className="block text-sm font-medium text-gray-700">
                  Minutes between refreshes
                </label>
                <input
                  type="number"
                  id="refresh-interval"
                  min="1"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">GitHub</h3>
              <div>
                <label htmlFor="github-token" className="block text-sm font-medium text-gray-700">
                  Personal Access Token
                </label>
                <input
                  type="password"
                  id="github-token"
                  value={credentials.github?.token || ''}
                  onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    github: { token: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Bitbucket</h3>
              <div>
                <label htmlFor="bitbucket-username" className="block text-sm font-medium text-gray-700">
                  Username
                </label>
                <input
                  type="text"
                  id="bitbucket-username"
                  value={credentials.bitbucket?.username || ''}
                  onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    bitbucket: { ...prev.bitbucket, username: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label htmlFor="bitbucket-password" className="block text-sm font-medium text-gray-700">
                  App Password
                </label>
                <input
                  type="password"
                  id="bitbucket-password"
                  value={credentials.bitbucket?.appPassword || ''}
                  onChange={(e) => setCredentials(prev => ({
                    ...prev,
                    bitbucket: { ...prev.bitbucket, appPassword: e.target.value }
                  }))}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Save
              </button>
            </div>
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}