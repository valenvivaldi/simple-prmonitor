import type { PullRequest } from '../../types';

export interface GitHubRepo {
    owner: {
        login: string;
    };
    name: string;
    full_name: string;
}

export interface GitHubPR {
    id: number;
    title: string;
    body: string | null;
    user: {
        login: string;
        avatar_url: string;
    } | null;
    head: {
        ref: string;
    };
    state: 'open' | 'closed';
    merged: boolean;
    comments: number;
    commits: number;
    created_at: string;
    updated_at: string;
    html_url: string;
    requested_reviewers: Array<{ login: string }> | null;
}

export interface GitHubError {
    name: string;
    status: number;
    message: string;
    documentation_url?: string;
}