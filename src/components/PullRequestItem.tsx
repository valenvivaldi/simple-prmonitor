import {PullRequest} from "@/models/PullRequest.tsx";
import {Github, Globe} from "lucide-react";

export function PullRequestItem(props: { pr: PullRequest, statusColor: string }) {
    return <div className="border rounded-lg p-4">
        <div className="flex justify-between items-start">
            <div className="space-y-2">
                <div className="flex items-center space-x-2">
                    {props.pr.platform === "github" ?
                        <Github className="w-4 h-4"/> :
                        <Globe className="w-4 h-4"/>
                    }
                    <h3 className="font-medium">{props.pr.title}</h3>
                </div>
                <div className="flex space-x-2">
                          <span
                              className={`px-3 py-1 rounded-full text-white text-sm ${props.statusColor}`}>
                            Checks {props.pr.status.checks === "pass" ? "Pass" : "Fail"}
                          </span>
                    {props.pr.status.mergeable && (
                        <span
                            className="px-3 py-1 rounded-full bg-green-500 text-white text-sm">
                              Mergeable
                            </span>
                    )}
                    <span
                        className="px-3 py-1 rounded-full bg-blue-400 text-white text-sm">
                            Waiting for review
                          </span>
                </div>
                <div className="text-sm text-gray-600">
                    {props.pr.repository} (#{props.pr.prNumber})
                    - {props.pr.changes.additions} additions, {props.pr.changes.deletions} deletions, {props.pr.changes.commits} commits
                </div>
            </div>
            <div className="text-sm text-gray-500">
                {props.pr.author.name}
            </div>
        </div>
    </div>;
}