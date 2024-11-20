export interface PullRequest {
  id: string;
  title: string;
  description: string;
  author: {
    name: string;
    avatar: string;
  };
  repository: string;
  branch: string;
  status: 'open' | 'merged' | 'closed';
  comments: number;
  commits: number;
  created: string;
  updated: string;
  source: 'github' | 'bitbucket';
  url: string;
  reviewed: boolean;
  isOwner: boolean;
}

export type TabType = 'to-review' | 'reviewed' | 'my-prs';

export interface Credentials {
  github?: {
    token: string;
  };
  bitbucket?: {
    username: string;
    appPassword: string;
  };
}

export interface Settings {
  showOnlyOpen: boolean;
  refreshInterval: string;
  credentials: Credentials;
}