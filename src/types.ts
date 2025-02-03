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
    imReviewer: boolean;
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

export interface SyncDates {
    github?: string;
    bitbucket?: string;
}

export type TabType = 'reviews' | 'my-prs' | 'gh-reviewers' | 'bb-whitelist';

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
    credentials: Credentials;
}

export interface GithubUser {
    login: string;
    name: string;
    avatar_url: string;
}

export interface ReviewersList {
    id: string;
    name: string;
    users: GithubUser[];
}

export interface BitbucketRepo {
    workspace: string;
    repo: string;
    fullName: string;
}