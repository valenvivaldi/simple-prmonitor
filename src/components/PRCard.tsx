import React, { useState } from 'react';
import { format } from 'date-fns';
import { GitPullRequest, MessageSquare, GitCommit, Github, CheckCircle2, XCircle, Clock, Users, RefreshCw } from 'lucide-react';
import { Popover } from '@headlessui/react';
import { AddReviewersPopover } from './AddReviewersPopover';
import { useReviewerLists } from '../hooks/useReviewerLists';
import toast from 'react-hot-toast';
import type { PullRequest, ReviewerStatus } from '../types';

interface PRCardProps {
  pr: PullRequest;
  githubToken?: string;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  onRefresh?: () => Promise<void>;
}

const statusColors = {
  open: 'bg-green-100 text-green-800',
  merged: 'bg-purple-100 text-purple-800',
  closed: 'bg-red-100 text-red-800',
};

  const reviewerRingColors: Record<string, string> = {
  approved: 'ring-green-400',
  pending: 'ring-yellow-400',
  changes_requested: 'ring-red-400',
  commented: 'ring-gray-400'
};

const reviewerLabel: Record<string, string> = {
  approved: 'Approved',
  pending: 'Pending',
  changes_requested: 'Changes requested',
  commented: 'Commented'
};

export function PRCard({ pr, githubToken, selected = false, onSelect, onRefresh }: PRCardProps) {
  const { lists, updateList } = useReviewerLists();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  };
  // Extract owner and repo from repository string (format: "owner/repo")
  const [owner, repo] = pr.repository.split('/');
  // Extract PR number from URL (format: "https://github.com/owner/repo/pull/123")
  const prNumber = parseInt(pr.url.split('/pull/')[1], 10);

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border ${selected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-200'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {onSelect && (
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => onSelect(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 mr-2"
            />
          )}
          <div className="flex-shrink-0">
            <img
              src={pr.author.avatar}
              alt={pr.author.name}
              className="w-10 h-10 rounded-full"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
              <a href={pr.url} target="_blank" rel="noopener noreferrer">
                {pr.title}
              </a>
            </h3>
            <p className="text-sm text-gray-600">
              {pr.repository} • {pr.branch}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {onRefresh && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRefresh();
              }}
              disabled={isRefreshing}
              className={`p-1 rounded-full hover:bg-gray-100 transition-colors ${isRefreshing ? 'animate-spin text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}
              title="Refresh PR details"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {pr.source === 'github' ? (
            <Github className="w-5 h-5 text-gray-500" />
          ) : (
            <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-blue-500 text-white font-semibold text-xs">
              B
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <p className="text-gray-600 text-sm line-clamp-2">{pr.description}</p>
      </div>

      {(pr.reviewers?.length || (pr.checks && pr.source === 'github')) && (
        <div className="mt-4 flex items-center justify-between">
          {pr.reviewers && pr.reviewers.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-500">Reviewers</span>
              <div className="flex items-center -space-x-2">
                {pr.reviewers.map((reviewer: ReviewerStatus) => (
                  <Popover key={reviewer.login} className="relative inline-block">
                    <Popover.Button title={`Add ${reviewer.login} to reviewer list`}>
                      <img
                        src={reviewer.avatar || `https://github.com/${reviewer.login}.png`}
                        alt={reviewer.login}
                        title={`${reviewer.login} • ${reviewerLabel[reviewer.state]}`}
                        className={`w-6 h-6 rounded-full ring-2 ring-white ${reviewerRingColors[reviewer.state] || 'ring-gray-300'}`}
                      />
                    </Popover.Button>

                    <Popover.Panel className="absolute z-50 mt-2 w-52 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 left-0">
                      <div className="p-2">
                        <div className="text-sm text-gray-700 mb-2">Add <strong>{reviewer.login}</strong> to list</div>
                        {lists.length === 0 ? (
                          <div className="text-xs text-gray-500">No lists defined. Create one in GH Reviewers.</div>
                        ) : (
                          <div className="space-y-1">
                            {lists.map(list => (
                              <button
                                key={list.id}
                                onClick={() => {
                                  try {
                                    const exists = list.users.some(u => u.login === reviewer.login);
                                    if (exists) {
                                      toast('User already in list');
                                      return;
                                    }
                                    const newUsers = [...list.users, { login: reviewer.login, name: reviewer.name || reviewer.login, avatar_url: reviewer.avatar || `https://github.com/${reviewer.login}.png` }];
                                    updateList({ ...list, users: newUsers });
                                    toast.success(`Added ${reviewer.login} to ${list.name}`);
                                  } catch (err) {
                                    toast.error('Failed to add reviewer to list');
                                  }
                                }}
                                className="w-full text-left text-sm px-2 py-1 rounded hover:bg-gray-100"
                              >
                                <Users className="w-4 h-4 inline-block mr-2 text-gray-500" />
                                {list.name}
                                <span className="ml-2 text-xs text-gray-400">{list.users.length}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </Popover.Panel>
                  </Popover>
                ))}
              </div>
            </div>
          )}
          {pr.checks && pr.source === 'github' && (
            <div className="flex items-center space-x-3 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>{pr.checks.success}</span>
              </div>
              <div className="flex items-center space-x-1">
                <XCircle className="w-4 h-4 text-red-600" />
                <span>{pr.checks.failed}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span>{pr.checks.pending}</span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[pr.status]}`}>
              <div className="flex items-center space-x-1">
                <GitPullRequest className="w-4 h-4" />
                <span>{pr.status}</span>
              </div>
            </span>
            {pr.isOwner && pr.source === 'github' && githubToken && (
              <AddReviewersPopover
                owner={owner}
                repo={repo}
                prNumber={prNumber}
                githubToken={githubToken}
              />
            )}
          </div>
          <div className="flex items-center space-x-4 text-gray-500">
            <div className="flex items-center space-x-1">
              <MessageSquare className="w-4 h-4" />
              <span className="text-sm">{pr.comments}</span>
            </div>
            <div className="flex items-center space-x-1">
              <GitCommit className="w-4 h-4" />
              <span className="text-sm">{pr.commits}</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          Updated {format(new Date(pr.updated), 'MMM d, yyyy')}
        </div>
      </div>
    </div>
  );
}