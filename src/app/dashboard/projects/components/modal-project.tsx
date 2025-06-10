import { Project } from "@/types/projects";

export default function ProjectModal({
    project,
    onClose,
    onSave,
}: {
    project: Project;
    onClose: () => void;
    onSave: (updatedProject: Project) => void;
}) {
    return (

        <div className="modal modal-open">
            <div className="modal-box max-w-3xl">
                <h3 className="font-bold text-lg mb-4">Add New Project</h3>
                <form>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Project Name</span>
                            </label>
                            <input type="text" placeholder="Enter project name" className="input input-bordered" />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Client</span>
                            </label>
                            <select className="select select-bordered" defaultValue="">
                                <option disabled value="">
                                    Select a client
                                </option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Project Type</span>
                            </label>
                            <select className="select select-bordered" defaultValue="">
                                <option disabled value="">
                                    Select type
                                </option>
                                <option value="commercial">Commercial</option>
                                <option value="residential">Residential</option>
                                <option value="industrial">Industrial</option>
                                <option value="government">Government</option>
                                <option value="healthcare">Healthcare</option>
                                <option value="education">Education</option>
                            </select>
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Status</span>
                            </label>
                            <select className="select select-bordered" defaultValue="">
                                <option disabled value="">
                                    Select status
                                </option>
                                <option value="planning">Planning</option>
                                <option value="bidding">Bidding</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="on_hold">On Hold</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Start Date</span>
                            </label>
                            <input type="date" className="input input-bordered" />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">End Date</span>
                            </label>
                            <input type="date" className="input input-bordered" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Budget</span>
                            </label>
                            <input type="number" placeholder="Enter budget amount" className="input input-bordered" />
                        </div>
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Location</span>
                            </label>
                            <input type="text" placeholder="Enter project location" className="input input-bordered" />
                        </div>
                    </div>

                    <div className="form-control mb-4">
                        <label className="label">
                            <span className="label-text">Project Description</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered h-24"
                            placeholder="Enter project description"
                        ></textarea>
                    </div>

                    <div className="modal-action">
                        <button type="button" className="btn btn-ghost" onClick={() => onClose()}>
                            Cancel
                        </button>
                        <button type="button" className="btn btn-primary" onClick={() => onClose()}>
                            Create Project
                        </button>
                    </div>
                </form>
            </div>
            <div className="modal-backdrop" onClick={() => onClose()}></div>
        </div>
    );
}