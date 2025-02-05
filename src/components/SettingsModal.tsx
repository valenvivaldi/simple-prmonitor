import React, { useState, useEffect } from 'react';
import { Dialog, Disclosure } from '@headlessui/react';
import { X, RotateCw, ChevronDown, Trash2 } from 'lucide-react';
import type { Credentials, SyncDates } from '../types';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  showOnlyOpen: boolean;
  setShowOnlyOpen: (value: boolean) => void;
}

export function SettingsModal({ isOpen, onClose, showOnlyOpen, setShowOnlyOpen }: SettingsModalProps) {
  const [credentials, setCredentials] = useState<Credentials>({});
  const [refreshInterval, setRefreshInterval] = useState('5');
  const [lastSyncDates, setLastSyncDates] = useState<SyncDates>({});

  useEffect(() => {
    const loadSettings = async () => {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([
          'pr-viewer-credentials',
          'pr-viewer-refresh-interval',
          'pr-viewer-last-sync'
        ]);
        if (result['pr-viewer-credentials']) {
          setCredentials(result['pr-viewer-credentials']);
        }
        if (result['pr-viewer-refresh-interval']) {
          setRefreshInterval(result['pr-viewer-refresh-interval']);
        }
        if (result['pr-viewer-last-sync']) {
          setLastSyncDates(result['pr-viewer-last-sync']);
        }
      } else {
        const storedCredentials = localStorage.getItem('pr-viewer-credentials');
        const storedInterval = localStorage.getItem('pr-viewer-refresh-interval');
        const storedSyncDates = localStorage.getItem('pr-viewer-last-sync');
        
        if (storedCredentials) {
          setCredentials(JSON.parse(storedCredentials));
        }
        if (storedInterval) {
          setRefreshInterval(storedInterval);
        }
        if (storedSyncDates) {
          setLastSyncDates(JSON.parse(storedSyncDates));
        }
      }
    };
    
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    localStorage.setItem('pr-viewer-credentials', JSON.stringify(credentials));
    localStorage.setItem('pr-viewer-refresh-interval', refreshInterval);
    localStorage.setItem('pr-viewer-show-only-open', JSON.stringify(showOnlyOpen));
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        'pr-viewer-credentials': credentials,
        'pr-viewer-refresh-interval': refreshInterval,
        'pr-viewer-show-only-open': showOnlyOpen
      });
    }

    window.location.reload();
    onClose();
  };

  const resetSyncDates = async () => {
    const newSyncDates = {};
    localStorage.setItem('pr-viewer-last-sync', JSON.stringify(newSyncDates));
    setLastSyncDates(newSyncDates);
    
    if (typeof chrome !== 'undefined' && chrome.storage) {
      await chrome.storage.local.set({
        'pr-viewer-last-sync': newSyncDates
      });
    }

    window.location.reload();
  };

  const clearCache = async () => {
    try {
      // Save items we want to keep
      const credentials = localStorage.getItem('pr-viewer-credentials');
      const bbWhitelist = localStorage.getItem('bb-whitelisted-repos');
      const reviewerLists = localStorage.getItem('gh-reviewer-lists');

      // Clear all localStorage
      localStorage.clear();

      // Restore saved items
      if (credentials) localStorage.setItem('pr-viewer-credentials', credentials);
      if (bbWhitelist) localStorage.setItem('bb-whitelisted-repos', bbWhitelist);
      if (reviewerLists) localStorage.setItem('gh-reviewer-lists', reviewerLists);

      // Clear Chrome storage if available
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.local.get([
          'pr-viewer-credentials',
          'bb-whitelisted-repos',
          'gh-reviewer-lists'
        ]);

        await chrome.storage.local.clear();

        // Restore saved items
        await chrome.storage.local.set({
          'pr-viewer-credentials': result['pr-viewer-credentials'],
          'bb-whitelisted-repos': result['bb-whitelisted-repos'],
          'gh-reviewer-lists': result['gh-reviewer-lists']
        });
      }

      toast.success('Cache cleared successfully');
      window.location.reload();
    } catch (error) {
      toast.error('Error clearing cache');
      console.error('Error clearing cache:', error);
    }
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

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Disclosure >
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                    <span>Cache Management</span>
                    <ChevronDown className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-500`}/>
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 pt-4 pb-2">
                    <div className="flex justify-between items-center mb-4">
                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          GitHub: {lastSyncDates.github 
                            ? format(new Date(lastSyncDates.github), 'MMM d, yyyy')
                            : 'Never synced'}
                        </p>
                        <p>
                          Bitbucket: {lastSyncDates.bitbucket
                            ? format(new Date(lastSyncDates.bitbucket), 'MMM d, yyyy')
                            : 'Never synced'}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={resetSyncDates}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <RotateCw className="w-4 h-4 mr-2" />
                          Reset Sync
                        </button>
                        <button
                          type="button"
                          onClick={clearCache}
                          className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear Cache
                        </button>
                      </div>
                    </div>
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>

            <Disclosure >
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                    <span>Display Settings</span>
                    <ChevronDown className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-500`}/>
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 pt-4 pb-2">
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
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>

            <Disclosure >
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                    <span>GitHub Settings</span>
                    <ChevronDown className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-500`}/>
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 pt-4 pb-2">
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
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>

            <Disclosure >
              {({ open }) => (
                <>
                  <Disclosure.Button className="flex w-full justify-between rounded-lg bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-500 focus-visible:ring-opacity-75">
                    <span>Bitbucket Settings</span>
                    <ChevronDown className={`${open ? 'rotate-180 transform' : ''} h-5 w-5 text-gray-500`}/>
                  </Disclosure.Button>
                  <Disclosure.Panel className="px-4 pt-4 pb-2">
                    <div className="space-y-4">
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
                  </Disclosure.Panel>
                </>
              )}
            </Disclosure>

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