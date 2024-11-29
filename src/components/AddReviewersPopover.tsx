import { useState } from 'react';
import { Popover } from '@headlessui/react';
import { UserPlus, Users } from 'lucide-react';
import { useReviewerLists } from '../hooks/useReviewerLists';
import { addReviewers } from '../services/github';
import toast from 'react-hot-toast';

interface AddReviewersPopoverProps {
    owner: string;
    repo: string;
    prNumber: number;
    githubToken: string;
}

export function AddReviewersPopover({ owner, repo, prNumber, githubToken }: AddReviewersPopoverProps) {
    const [username, setUsername] = useState('');
    const { lists } = useReviewerLists();
    const [loading, setLoading] = useState(false);

    const handleAddSingleReviewer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        try {
            await addReviewers(owner, repo, prNumber, [username], githubToken);
            toast.success(`Reviewer ${username} added successfully`);
            setUsername('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to add reviewer');
        } finally {
            setLoading(false);
        }
    };

    const handleAddList = async (listId: string) => {
        const list = lists.find(l => l.id === listId);
        if (!list) return;

        setLoading(true);
        try {
            const reviewers = list.users.map(user => user.login);
            await addReviewers(owner, repo, prNumber, reviewers, githubToken);
            toast.success(`Added ${reviewers.length} reviewers from list ${list.name}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Failed to add reviewers');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Popover className="relative inline-block">
            <Popover.Button
                className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                title="Add reviewers"
            >
                <UserPlus className="w-4 h-4" />
            </Popover.Button>

            <Popover.Panel className="absolute z-50 w-72 left-full ml-2 top-0 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5">
                <div className="p-4">
                    <form onSubmit={handleAddSingleReviewer} className="mb-4">
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                            Add reviewer by username
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="GitHub username"
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                                disabled={loading}
                            />
                            <button
                                type="submit"
                                disabled={loading || !username}
                                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                            >
                                Add
                            </button>
                        </div>
                    </form>

                    {lists.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Add from lists</h4>
                            <div className="space-y-2">
                                {lists.map(list => (
                                    <button
                                        key={list.id}
                                        onClick={() => handleAddList(list.id)}
                                        disabled={loading}
                                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50"
                                    >
                                        <Users className="w-4 h-4 mr-2" />
                                        <span>{list.name}</span>
                                        <span className="ml-auto text-xs text-gray-500">
                                            {list.users.length} users
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Popover.Panel>
        </Popover>
    );
}