import React from 'react';
import { PRCard } from './PRCard';
import type { PullRequest } from '../types';

interface PRListProps {
  prs: PullRequest[];
}

export function PRList({ prs }: PRListProps) {
  if (prs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No pull requests found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prs.map((pr) => (
        <PRCard key={pr.id} pr={pr} />
      ))}
    </div>
  );
}