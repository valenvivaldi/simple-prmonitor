import React from 'react';
import { PRCard } from './PRCard';
import type { PullRequest } from '../types';

interface PRListProps {
  prs: PullRequest[];
  githubToken?: string;
  groupByBranch?: boolean;
}

export function PRList({ prs, githubToken, groupByBranch = false }: PRListProps) {
  if (prs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No pull requests found</p>
      </div>
    );
  }

  if (groupByBranch) {
    const branchOrder: string[] = [];
    const grouped = prs.reduce<Record<string, PullRequest[]>>((acc, pr) => {
      if (!acc[pr.branch]) {
        acc[pr.branch] = [];
        branchOrder.push(pr.branch);
      }
      acc[pr.branch].push(pr);
      return acc;
    }, {});

    return (
      <div className="space-y-6">
        {branchOrder.map((branch) => (
          <section key={branch}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700">
                {branch}
              </h2>
              <span className="text-xs text-gray-500">
                {grouped[branch].length} PRs
              </span>
            </div>
            <div className="space-y-4">
              {grouped[branch].map((pr) => (
                <PRCard key={pr.id} pr={pr} githubToken={githubToken} />
              ))}
            </div>
          </section>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {prs.map((pr) => (
        <PRCard key={pr.id} pr={pr} githubToken={githubToken} />
      ))}
    </div>
  );
}