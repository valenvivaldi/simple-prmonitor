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

export interface GitHubPR {
    id: string | number;
    title: string
    description: string;
    author: { display_name: string; links: { avatar: { href: string; }; }; account_id: string; };
    destination: { repository: { full_name: string; }; };
    source: { branch: { name: string; }; };
    state: string;
    comment_count: number;
    commits: string | any[];
    created_on: string;
    updated_on: string;
    links: { html: { href: string; }; };
    reviewers: string | any[];
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