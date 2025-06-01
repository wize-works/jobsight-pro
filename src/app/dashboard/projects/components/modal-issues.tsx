import { getCrewMembers } from "@/app/actions/crew-members";
import { createProjectIssue } from "@/app/actions/projects-issues";
import { toast } from "@/hooks/use-toast";
import { CrewMember } from "@/types/crew-members";
import { ProjectIssue, ProjectIssuePriority, projectIssuePriorityOptions, ProjectIssueStatus, projectIssueStatusOptions } from "@/types/projects-issues";
import { useEffect, useState } from "react";


const IssueModal = ({ isOpen, onClose, initialIssue }: { isOpen: boolean; onClose: () => void; initialIssue: ProjectIssue }) => {
    const [issuePriority, setIssuePriority] = useState<ProjectIssuePriority>("low");
    const [issueStatus, setIssueStatus] = useState<ProjectIssueStatus>("open");
    const [crewMembers, setCrewMembers] = useState<CrewMember[]>([]);
    const [issue, setIssue] = useState<Partial<ProjectIssue>>(initialIssue);

    useEffect(() => {
        const fetchCrewMembers = async () => {
            const members = await getCrewMembers();
            setCrewMembers(members);
        };
        fetchCrewMembers();
    }, []);

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box">
                <h2 className="text-2xl font-bold">Create New Issue</h2>
                <form className="space-y-6" onSubmit={async (e) => {
                    e.preventDefault();
                    const newIssue: ProjectIssue = {
                        ...issue,
                        priority: issuePriority,
                        status: issueStatus,
                        reported_date: new Date().toISOString(),
                    } as ProjectIssue;

                    await createProjectIssue(newIssue);
                    toast.success("Issue created successfully!");
                    onClose();
                    setIssue({});
                }}>
                    <p className="text-base-content/70">Fill out the details below to report a new issue.</p>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Issue Title</span>
                        </label>
                        <input type="text" placeholder="Enter issue title" name="title" className="input input-bordered w-full textarea-secondary" onChange={(e) => setIssue((prev) => ({ ...prev, title: e.target.value }))} />
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Description</span>
                        </label>
                        <textarea placeholder="Describe the issue" name="description" className="textarea textarea-bordered textarea-secondary w-full" onChange={(e) => setIssue((prev) => ({ ...prev, description: e.target.value }))}></textarea>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="form-controle">
                            <label className="label">
                                <span className="label-text">Reported By</span>
                            </label>
                            <input type="text" name="reported_by" placeholder="Who reported this issues?" className="input input-bordered input-secondary w-full" onChange={(e) => setIssue((prev) => ({ ...prev, reported_by: e.target.value }))} />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Reported Date</span>
                            </label>
                            <input type="date" name="reported_date" className="input input-bordered input-secondary w-full" />
                        </div>
                    </div>
                    <div className="flex justify-evenly items-center gap-6">
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Priority</span>
                            </label>
                            {projectIssuePriorityOptions.select(
                                issuePriority as ProjectIssuePriority,
                                (value) => { setIssuePriority(value); setIssue((prev) => ({ ...prev, priority: value })); },
                                "select-secondary"
                            )}
                        </div>
                        <div className="form-control w-full">
                            <label className="label">
                                <span className="label-text">Status</span>
                            </label>
                            {projectIssueStatusOptions.select(
                                issueStatus as ProjectIssueStatus,
                                (value) => { setIssueStatus(value); setIssue((prev) => ({ ...prev, status: value })); },
                                "select-secondary"
                            )}
                        </div>
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Assigned To</span>
                        </label>
                        <select name="assigned_to" className="select select-bordered select-secondary w-full" onChange={(e) => setIssue((prev) => ({ ...prev, assigned_to: e.target.value }))}>
                            <option value="">Select a crew member</option>
                            {crewMembers.map(member => (
                                <option key={member.id} value={member.id}>
                                    {member.name} ({member.role})
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Resolution</span>
                        </label>
                        <textarea placeholder="Describe the resolution" name="resolution" className="textarea textarea-bordered textarea-secondary w-full" onChange={(e) => setIssue((prev) => ({ ...prev, resolution: e.target.value }))}></textarea>
                    </div>
                    <div className="modal-action">
                        <button type="submit" className="btn btn-primary">Submit Issue</button>
                        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default IssueModal;