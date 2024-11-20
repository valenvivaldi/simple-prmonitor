import React from 'react';
import { Github } from 'lucide-react';

interface PlatformFilterProps {
  selectedPlatforms: Set<string>;
  setSelectedPlatforms: (platforms: Set<string>) => void;
}

export function PlatformFilter({ selectedPlatforms, setSelectedPlatforms }: PlatformFilterProps) {
  const togglePlatform = (platform: string) => {
    const newPlatforms = new Set(selectedPlatforms);
    if (newPlatforms.has(platform)) {
      newPlatforms.delete(platform);
    } else {
      newPlatforms.add(platform);
    }
    setSelectedPlatforms(newPlatforms);
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={() => togglePlatform('github')}
        className={`p-2 rounded-md ${
          selectedPlatforms.has('github')
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-400 hover:text-gray-500'
        }`}
        title="Toggle GitHub PRs"
      >
        <Github className="w-5 h-5" />
      </button>
      <button
        onClick={() => togglePlatform('bitbucket')}
        className={`p-2 rounded-md ${
          selectedPlatforms.has('bitbucket')
            ? 'bg-gray-100 text-gray-900'
            : 'text-gray-400 hover:text-gray-500'
        }`}
        title="Toggle Bitbucket PRs"
      >
        <div className="w-5 h-5 flex items-center justify-center font-semibold text-inherit">
          B
        </div>
      </button>
    </div>
  );
}