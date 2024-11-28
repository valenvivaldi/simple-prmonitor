import React, { useState } from 'react';
import { Plus, Trash2, UserPlus, X } from 'lucide-react';
import { fetchGithubUser } from '../../services/github';
import type { ReviewersList as ReviewersListType, GithubUser } from '../../types';
import toast from 'react-hot-toast';

interface ReviewersListProps {
    list: ReviewersListType;
    onUpdate: (list: ReviewersListType) => void;
    onDelete: (id: string) => void;
    githubToken: string;
}

export function ReviewersList({ list, onUpdate, onDelete, githubToken }: ReviewersListProps) {
    const [newUsername, setNewUsername] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUsername.trim()) return;

        setLoading(true);
        try {
            const user = await fetchGithubUser(newUsername, githubToken);
            if (!list.users.some(u => u.login === user.login)) {
                onUpdate({
                    ...list,
                    users: [...list.users, user]
                });
                toast.success(`Usuario ${user.name} agregado`);
            } else {
                toast.error('Usuario ya existe en la lista');
            }
            setNewUsername('');
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Error al agregar usuario');
        } finally {
            setLoading(false);
        }
    };

    const removeUser = (userToRemove: GithubUser) => {
        onUpdate({
            ...list,
            users: list.users.filter(user => user.login !== userToRemove.login)
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{list.name}</h3>
                <button
                    onClick={() => onDelete(list.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Eliminar lista"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleAddUser} className="mb-4">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Usuario de GitHub"
                        className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Agregar
                    </button>
                </div>
            </form>

            <div className="flex flex-wrap gap-2">
                {list.users.map(user => (
                    <div
                        key={user.login}
                        className="flex items-center gap-2 bg-gray-100 rounded-full pl-1 pr-2 py-1"
                    >
                        <img
                            src={user.avatar_url}
                            alt={user.name}
                            className="w-6 h-6 rounded-full"
                        />
                        <span className="text-sm font-medium">{user.name}</span>
                        <button
                            onClick={() => removeUser(user)}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}