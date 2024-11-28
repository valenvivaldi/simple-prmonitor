import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { ReviewersList } from './ReviewersList';
import { useReviewerLists } from '../../hooks/useReviewerLists';
import toast from 'react-hot-toast';

interface GHReviewersProps {
    githubToken: string;
}

export function GHReviewers({ githubToken }: GHReviewersProps) {
    const { lists, addList, removeList, updateList } = useReviewerLists();
    const [newListName, setNewListName] = useState('');

    const handleCreateList = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newListName.trim()) return;

        if (lists.some(list => list.name === newListName)) {
            toast.error('Ya existe una lista con ese nombre');
            return;
        }

        addList(newListName);
        setNewListName('');
        toast.success('Lista creada');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <form onSubmit={handleCreateList} className="mb-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        placeholder="Nombre de la nueva lista"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Crear Lista
                    </button>
                </div>
            </form>

            <div className="space-y-4">
                {lists.map(list => (
                    <ReviewersList
                        key={list.id}
                        list={list}
                        onUpdate={updateList}
                        onDelete={removeList}
                        githubToken={githubToken}
                    />
                ))}
            </div>

            {lists.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No hay listas de revisores. Crea una nueva lista para comenzar.
                </div>
            )}
        </div>
    );
}