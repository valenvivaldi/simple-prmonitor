import { Octokit } from '@octokit/rest';
import type { GithubUser } from '../types';

export async function fetchGithubUser(username: string, token: string): Promise<GithubUser> {
    try {
        const octokit = new Octokit({ auth: token });
        const { data } = await octokit.users.getByUsername({ username });
        
        return {
            login: data.login,
            name: data.name || data.login,
            avatar_url: data.avatar_url
        };
    } catch (error) {
        throw new Error(`Usuario no encontrado: ${username}`);
    }
}

export async function addReviewers(owner: string, repo: string, prNumber: number, reviewers: string[], token: string): Promise<void> {
    try {
        const octokit = new Octokit({ auth: token });
        await octokit.pulls.requestReviewers({
            owner,
            repo,
            pull_number: prNumber,
            reviewers
        });
    } catch (error) {
        throw new Error('Failed to add reviewers to the pull request');
    }
}