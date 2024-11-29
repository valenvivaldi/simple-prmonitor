import React from 'react';
import { format } from 'date-fns';
import { GitPullRequest, MessageSquare, GitCommit, Github } from 'lucide-react';
import { AddReviewersPopover } from './AddReviewersPopover';
import type { PullRequest } from '../types';

interface PRCardProps {
  pr: PullRequest;
  githubToken?: string;
}

const statusColors = {
  open: 'bg-green-100 text-green-800',
  merged: 'bg-purple-100 text-purple-800',
  closed: 'bg-red-100 text-red-800',
};

export function PRCard({ pr, githubToken }: PRCardProps) {
  // Extract owner and repo from repository string (format: "owner/repo")
  const [owner, repo] = pr.repository.split('/');
  // Extract PR number from URL (format: "https://github.com/owner/repo/pull/123")
  const prNumber = parseInt(pr.url.split('/pull/')[1], 10);

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-4 border border-gray-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
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
        {pr.source === 'github' ? (
          <Github className="w-5 h-5 text-gray-500" />
        ) : (
          <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-blue-500 text-white font-semibold text-xs">
            B
          </div>
        )}
      </div>

      <div className="mt-4">
        <p className="text-gray-600 text-sm line-clamp-2">{pr.description}</p>
      </div>

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