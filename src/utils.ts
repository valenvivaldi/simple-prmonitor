import type {PullRequest} from "./types.ts";

function updatePRArray(currentPrs: PullRequest[], allPRs: PullRequest[]) {
    //all Pr containts all the PR updateded recently, so we will add the new PRs to the current PRs,
    // but first its necesary to remove the PRs that are already in the current PRs, this check can be done by id and provider
    const newPRIDs = allPRs.map(pr => pr.source + pr.id);
    currentPrs = currentPrs.filter(pr => !newPRIDs.includes(pr.source + pr.id));
    currentPrs.push(...allPRs);
    return currentPrs;
}

export {updatePRArray};