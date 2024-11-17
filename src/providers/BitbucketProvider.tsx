import {PullRequest} from "@/models/PullRequest.tsx";
import {Provider} from "@/models/Provider.tsx";

export class BitbucketProvider extends Provider {
    constructor(token: string) {
        super("Bitbucket", token);
    }

    async syncPullRequests(): Promise<PullRequest[]> {
        console.log(`[Bitbucket] Synchronizing Pull Requests using token: ${this.token}`);
        // Simular la obtención de PRs (en un caso real, se haría una llamada a la API de Bitbucket)
        return [
            new PullRequest(
                "PR-201",
                "Bitbucket",
                201,
                "Feature: Add Bitbucket integration",
                "my-repo/bitbucket-integration",
                {checks: "Checks Pass", mergeable: true, review: "Waiting for review"},
                "Checks Pass",
                true,
                "Waiting for review",
                {additions: 50, deletions: 10, commits: 2},
                {name: "BitbucketUser", avatarUrl: "https://bitbucket.com/avatar1.png"},
                "https://bitbucket.com/my-repo/pull/201"
            ),
        ];
    }

    async validateCredentials(): Promise<boolean> {
        console.log(`[Bitbucket] Validating credentials using token: ${this.token}`);
        // Simulación de validación de credenciales
        return true;
    }
}