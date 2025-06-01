import { ProjectIssue, ProjectIssuePriority, projectIssuePriorityOptions, ProjectIssueStatus, projectIssueStatusOptions, ProjectIssueWithDetails } from "@/types/projects-issues";

export default function IssuesTab({ issues, setIssues, modalHandler }: { issues: ProjectIssueWithDetails[]; setIssues: (issues: ProjectIssueWithDetails[]) => void; modalHandler: (open: boolean) => void }) {
    return (
        <div className="">
            {
                issues.length > 0 ? (
                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="card-title">Project Issues</h2>
                                <button className="btn btn-primary btn-sm" onClick={() => modalHandler(true)}>
                                    <i className="fas fa-plus mr-2"></i>Create Issue
                                </button>
                            </div>
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Issue</th>
                                        <th>Reported By</th>
                                        <th>Status</th>
                                        <th>Priority</th>
                                        <th>Assigned To</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {issues.map(issue => (
                                        <tr key={issue.id}>
                                            <td>
                                                <div className="font-medium">{issue.title}</div>
                                                <div className="text-xs text-base-content/70">
                                                    {(issue.description ?? "").length > 50 ? `${(issue.description ?? "").substring(0, 50)}...` : (issue.description ?? "")}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="">
                                                    {issue.reported_date ? new Date(issue.reported_date).toLocaleDateString() : "N/A"}
                                                </div>
                                                {issue.reported_by ? (
                                                    <div className="text-xs text-base-content/70">{issue.reported_by}</div>
                                                ) : (
                                                    <div className="text-xs text-base-content/70">Unknown</div>
                                                )}
                                            </td>
                                            <td>{projectIssueStatusOptions.badge(issue.status as ProjectIssueStatus)}</td>
                                            <td>{projectIssuePriorityOptions.badge(issue.priority as ProjectIssuePriority)}</td>
                                            <td>{issue.assigned_to_name}</td>
                                            <td>
                                                <button className="btn btn-sm btn-secondary" onClick={() => modalHandler(true)}>View Details</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body text-center bg-active">
                            <h2 className="card-title justify-center">No issues reported for this project.</h2>
                            <p className="text-base-content/70">Have something to report, create a new issue now.</p>
                            <div className="mt-4">
                                <button className="btn btn-active" onClick={() => modalHandler(true)}>Create Issue</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}