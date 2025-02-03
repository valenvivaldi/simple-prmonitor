import type { PullRequest } from '../../types';

export interface BitbucketUser {
    account_id: string;
    display_name: string;
    links: {
        avatar: {
            href: string;
        };
    };
}

export interface BitbucketWorkspace {
    slug: string;
}

export interface BitbucketRepo {
    full_name: string;
}

export interface BitbucketParticipant {
    account_id: string;
    approved: boolean;
}

export interface BitbucketPR {
    id: number;
    title: string;
    description: string;
    author: BitbucketUser;
    destination: {
        repository: {
            full_name: string;
        };
    };
    source: {
        branch: {
            name: string;
        };
    };
    state: string;
    comment_count: number;
    commits: any[];
    created_on: string;
    updated_on: string;
    links: {
        html: {
            href: string;
        };
    };
    reviewers: BitbucketUser[];
    participants: BitbucketParticipant[];
}