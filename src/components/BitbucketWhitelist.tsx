import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface BitbucketWhitelistProps {
    credentials: {
        username: string;
        appPassword: string;
    };
}

export function BitbucketWhitelist({ credentials }: BitbucketWhitelistProps) {
    const [workspace, setWorkspace] = useState('');
    const [repo, setRepo] = useState('');
    const [whitelistedRepos, setWhitelistedRepos] = useState<string[]>(() => {
        const stored = localStorage.getItem('bb-whitelisted-repos');
        return stored ? JSON.parse(stored) : [];
    });

    const handleAddRepo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workspace.trim() || !repo.trim()) return;

        const fullName = `${workspace}/${repo}`;
        
        // Check if repo already exists
        if (whitelistedRepos.includes(fullName)) {
            toast.error('Repository already in whitelist');
            return;
        }

        try {
            // Verify repo exists
            const auth = btoa(`${credentials.username}:${credentials.appPassword}`);
            const response = await fetch(`https://api.bitbucket.org/2.0/repositories/${fullName}`, {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Repository not found');
            }

            // Add to whitelist
            const newRepos = [...whitelistedRepos, fullName];
            setWhitelistedRepos(newRepos);
            localStorage.setItem('bb-whitelisted-repos', JSON.stringify(newRepos));
            
            setWorkspace('');
            setRepo('');
            toast.success('Repository added to whitelist');
        } catch (error) {
            toast.error('Failed to add repository. Please verify the workspace and repository names.');
        }
    };

    const handleRemoveRepo = (fullName: string) => {
        const newRepos = whitelistedRepos.filter(r => r !== fullName);
        setWhitelistedRepos(newRepos);
        localStorage.setItem('bb-whitelisted-repos', JSON.stringify(newRepos));
        toast.success('Repository removed from whitelist');
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Bitbucket Repository Whitelist</h2>
                
                <form onSubmit={handleAddRepo} className="mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label htmlFor="workspace" className="block text-sm font-medium text-gray-700 mb-1">
                                Workspace
                            </label>
                            <input
                                type="text"
                                id="workspace"
                                value={workspace}
                                onChange={(e) => setWorkspace(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="e.g., your-workspace"
                            />
                        </div>
                        <div className="flex-1">
                            <label htmlFor="repo" className="block text-sm font-medium text-gray-700 mb-1">
                                Repository
                            </label>
                            <input
                                type="text"
                                id="repo"
                                value={repo}
                                onChange={(e) => setRepo(e.target.value)}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                placeholder="e.g., your-repo"
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="h-10 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Add
                            </button>
                        </div>
                    </div>
                </form>

                <div className="space-y-2">
                    {whitelistedRepos.length === 0 ? (
                        <p className="text-gray-500 text-center py-4">
                            No repositories in whitelist. Add repositories to start monitoring their pull requests.
                        </p>
                    ) : (
                        whitelistedRepos.map((fullName) => (
                            <div
                                key={fullName}
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                            >
                                <span className="font-medium">{fullName}</span>
                                <button
                                    onClick={() => handleRemoveRepo(fullName)}
                                    className="text-red-500 hover:text-red-700 p-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}