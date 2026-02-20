import React, { useState } from 'react';
import { PRCard } from './PRCard';
import { Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import type { PullRequest } from '../types';

interface PRListProps {
  prs: PullRequest[];
  githubToken?: string;
  groupByBranch?: boolean;
  onRefreshPR?: (pr: PullRequest) => Promise<void>;
}

export function PRList({ prs, githubToken, groupByBranch = false, onRefreshPR }: PRListProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelect = (id: string, selected: boolean) => {
    const newSelected = new Set(selectedIds);
    if (selected) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleBranch = (branchPRs: PullRequest[]) => {
    const allSelected = branchPRs.every(pr => selectedIds.has(pr.id));
    const newSelected = new Set(selectedIds);
    
    branchPRs.forEach(pr => {
      if (allSelected) {
        newSelected.delete(pr.id);
      } else {
        newSelected.add(pr.id);
      }
    });
    
    setSelectedIds(newSelected);
  };

  const copyReviewMessage = () => {
    const selectedPRs = prs.filter(pr => selectedIds.has(pr.id));
    if (selectedPRs.length === 0) {
      toast.error('Selecciona al menos un PR');
      return;
    }

    const message = selectedPRs.map(pr => {
      const target = pr.targetBranch ? ` -> ${pr.targetBranch}` : '';
      return `* ${pr.title}\n  🔗 ${pr.url}\n  🌿 ${pr.branch}${target}`;
    }).join('\n\n');

    navigator.clipboard.writeText(message);
    toast.success('Mensaje copiado al portapapeles');
  };

  if (prs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No pull requests found</p>
      </div>
    );
  }

  const renderPRs = (prsToRender: PullRequest[]) => (
    <div className="space-y-4">
      {prsToRender.map((pr) => (
        <PRCard
          key={pr.id}
          pr={pr}
          githubToken={githubToken}
          selected={selectedIds.has(pr.id)}
          onSelect={(selected) => toggleSelect(pr.id, selected)}
          onRefresh={onRefreshPR ? () => onRefreshPR(pr) : undefined}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      {selectedIds.size > 0 && (
        <div className="sticky top-[157px] z-20 bg-white/90 backdrop-blur-sm p-3 border shadow-md flex items-center justify-between mb-4 rounded-lg">
          <span className="text-sm font-semibold text-blue-700">
            {selectedIds.size} PRs seleccionados
          </span>
          <button
            onClick={copyReviewMessage}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm font-bold"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Push Review Message</span>
          </button>
        </div>
      )}

      {groupByBranch ? (
        <div className="space-y-6">
          {(() => {
            const branchOrder: string[] = [];
            const grouped = prs.reduce<Record<string, PullRequest[]>>((acc, pr) => {
              if (!acc[pr.branch]) {
                acc[pr.branch] = [];
                branchOrder.push(pr.branch);
              }
              acc[pr.branch].push(pr);
              return acc;
            }, {});

            return branchOrder.map((branch) => {
              const branchPRs = grouped[branch];
              const allSelected = branchPRs.every(pr => selectedIds.has(pr.id));
              
              return (
                <section key={branch}>
                  <div className="flex items-center justify-between mb-3 bg-gray-50 p-2 rounded">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleBranch(branchPRs)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <h2 className="text-sm font-bold text-gray-800 flex items-center">
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                        {branch}
                      </h2>
                    </div>
                    <span className="text-xs font-medium text-gray-500 bg-white px-2 py-0.5 rounded border">
                      {branchPRs.length} PRs
                    </span>
                  </div>
                  {renderPRs(branchPRs)}
                </section>
              );
            });
          })()}
        </div>
      ) : (
        renderPRs(prs)
      )}
    </div>
  );
}
