import React, { useState } from 'react';
import { PRCard } from './PRCard';
import { Copy, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react';
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
  const [collapsedBranches, setCollapsedBranches] = useState<Set<string>>(new Set());
  const [isRefreshingBulk, setIsRefreshingBulk] = useState(false);

  const toggleBranchCollapse = (branch: string) => {
    const newCollapsed = new Set(collapsedBranches);
    if (newCollapsed.has(branch)) {
      newCollapsed.delete(branch);
    } else {
      newCollapsed.add(branch);
    }
    setCollapsedBranches(newCollapsed);
  };

  const handleBulkRefresh = async () => {
    if (!onRefreshPR || isRefreshingBulk) return;
    const selectedPRs = prs.filter(pr => selectedIds.has(pr.id));
    if (selectedPRs.length === 0) return;

    setIsRefreshingBulk(true);
    const toastId = toast.loading(`Refreshing ${selectedPRs.length} PRs...`);
    try {
      await Promise.all(selectedPRs.map(pr => onRefreshPR(pr)));
      toast.success('All selected PRs refreshed', { id: toastId });
    } catch (error) {
      toast.error('Failed to refresh some PRs', { id: toastId });
    } finally {
      setIsRefreshingBulk(false);
    }
  };

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
        <p className="text-gray-500 dark:text-gray-400">No pull requests found</p>
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
        <div className="sticky top-[157px] z-20 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-3 border dark:border-gray-700 shadow-md flex items-center justify-between mb-4 rounded-lg">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
            {selectedIds.size} PRs seleccionados
          </span>
          <div className="flex items-center space-x-2">
            {onRefreshPR && (
              <button
                onClick={handleBulkRefresh}
                disabled={isRefreshingBulk}
                className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-md hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors shadow-sm text-sm font-bold disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingBulk ? 'animate-spin' : ''}`} />
                <span>Refresh Selected</span>
              </button>
            )}
            <button
              onClick={copyReviewMessage}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm font-bold"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Push Review Message</span>
            </button>
          </div>
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
              const isCollapsed = collapsedBranches.has(branch);
              
              return (
                <section key={branch}>
                  <div className="flex items-center justify-between mb-3 bg-gray-50 dark:bg-gray-800/50 p-2 rounded transition-colors">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={() => toggleBranch(branchPRs)}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 dark:border-gray-600 dark:bg-gray-700 focus:ring-blue-500 cursor-pointer"
                      />
                      <button 
                        onClick={() => toggleBranchCollapse(branch)}
                        className="flex items-center text-sm font-bold text-gray-800 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        {isCollapsed ? <ChevronRight className="w-4 h-4 mr-1" /> : <ChevronDown className="w-4 h-4 mr-1" />}
                        <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                        {branch}
                      </button>
                    </div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border dark:border-gray-700">
                      {branchPRs.length} PRs
                    </span>
                  </div>

                  {!isCollapsed && renderPRs(branchPRs)}
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
