"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CrewWithDetails, CrewWithStats } from "@/types/crews";
import type { CrewMember } from "@/types/crew-members";
import type { Equipment } from "@/types/equipments";
import { toast } from "@/hooks/use-toast";

// Status options with colors and labels
const statusOptions = {
    active: { label: "Active", color: "badge-primary" },
    available: { label: "Available", color: "badge-success" },
};

interface CrewDetailProps {
    crew: CrewWithDetails;
    businessId: string;
    members?: CrewMember[];
    allMembers?: CrewMember[];
    schedule?: any[];
    equipment?: Equipment[];
}

export default function CrewDetailComponent({
    crew,
    members = [],
    allMembers = [],
    schedule = [],
    equipment = [],
    businessId,
}: CrewDetailProps) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("members");
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showLinkMemberModal, setShowLinkMemberModal] = useState(false);
    const [linkMember, setLinkMember] = useState<CrewMember | null>(null);
    const [newMember, setNewMember] = useState({
        name: "",
        role: "",
        experience: "",
        phone: "",
        email: "",
    });

    // Mock data for initial UI showcase - would be replaced with real data in a full implementation
    //const workHistory = [];

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/crews" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">{crew.name}</h1>
                        <div className={`badge ${statusOptions[crew.status as keyof typeof statusOptions]?.color || "badge-neutral"}`}>
                            {statusOptions[crew.status as keyof typeof statusOptions]?.label || crew.status}
                        </div>
                    </div>
                    <p className="text-base-content/70 mt-1">Led by {crew.leader}</p>
                </div>
                <div className="flex gap-2">
                    <Link className="btn btn-outline btn-sm" href={`/dashboard/crews/${crew.id}/edit`}>
                        <i className="fas fa-edit mr-2"></i> Edit Crew
                    </Link>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowAddMemberModal(true)}>
                        <i className="fas fa-user-plus mr-2"></i> Add Member
                    </button>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <h3 className="font-semibold mb-2">Specialty</h3>
                            <p>{crew.specialty || "General Construction"}</p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Current Project</h3>
                            <p>
                                {crew.current_project_id ?
                                    <Link href={`/dashboard/projects/${crew.current_project_id}`} className="text-primary">
                                        {crew.current_project}
                                    </Link>
                                    : "None assigned"
                                }
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold mb-2">Team Size</h3>
                            <p>{crew.member_count || 0} members</p>
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="font-semibold mb-2">Notes</h3>
                        <p>{crew.notes || "No additional notes"}</p>
                    </div>
                </div>
            </div>

            <div className="tabs tabs-boxed mb-6">
                <a className={`tab ${activeTab === "members" ? "tab-active" : ""}`} onClick={() => setActiveTab("members")}>
                    Members
                </a>
                <a className={`tab ${activeTab === "schedule" ? "tab-active" : ""}`} onClick={() => setActiveTab("schedule")}>
                    Schedule
                </a>
                <a className={`tab ${activeTab === "equipment" ? "tab-active" : ""}`} onClick={() => setActiveTab("equipment")}>
                    Equipment
                </a>
                <a className={`tab ${activeTab === "history" ? "tab-active" : ""}`} onClick={() => setActiveTab("history")}>
                    Work History
                </a>
            </div>

            {activeTab === "members" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Crew Members</h3>
                            <div className="flex gap-2">
                                <button className="btn btn-sm btn-primary" onClick={() => setShowAddMemberModal(true)}>
                                    <i className="fas fa-user-plus mr-2"></i> Add New Member
                                </button>
                                <button className="btn btn-sm btn-secondary" onClick={() => setShowLinkMemberModal(true)}>
                                    <i className="fas fa-edit mr-2"></i> Link Crew Member
                                </button>
                            </div>
                        </div>

                        {members.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Role</th>
                                            <th>Experience</th>
                                            <th>Contact</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {members.map((member: any) => (
                                            <tr key={member.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <div className="avatar">
                                                            <div className="w-10 rounded-full">
                                                                <img src={`/diverse-avatars.png?height=40&width=40&query=avatar${member.id}`} alt="Avatar" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="font-bold">{member.name}</div>
                                                            <div className="text-sm opacity-50">
                                                                {member.id === crew.leader_id ? "Leader" : "Member"}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>{member.role}</td>
                                                <td>{member.experience}</td>
                                                <td>
                                                    <div>{member.phone}</div>
                                                    <div className="text-sm opacity-50">{member.email}</div>
                                                </td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-ghost btn-xs">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="btn btn-ghost btn-xs text-error">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="mb-4">No crew members have been added yet</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowAddMemberModal(true)}
                                >
                                    <i className="fas fa-user-plus mr-2"></i> Add First Member
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "schedule" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Upcoming Schedule</h3>
                            <button className="btn btn-sm btn-outline">
                                <i className="fas fa-plus mr-2"></i> Add Assignment
                            </button>
                        </div>

                        {schedule.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Project</th>
                                            <th>Notes</th>
                                            <th>Hours</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {schedule.map((item: any, index: number) => (
                                            <tr key={index}>
                                                <td>{item.start_date + ' - ' + item.end_date}</td>
                                                <td>
                                                    <Link href={`/dashboard/projects/${item.project_id}`} className="text-primary">
                                                        {item.project_name}
                                                        <i className="fas fa-arrow-up-right-from-square fa-fw ml-2" />
                                                    </Link>
                                                </td>
                                                <td>{item.notes}</td>
                                                <td>{item.hours}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-ghost btn-xs">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="btn btn-ghost btn-xs text-error">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="mb-4">No schedule items have been added yet</p>
                                <button className="btn btn-outline">
                                    <i className="fas fa-plus mr-2"></i> Add First Assignment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "equipment" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Assigned Equipment</h3>
                            <button className="btn btn-sm btn-outline">
                                <i className="fas fa-tools mr-2"></i> Assign Equipment
                            </button>
                        </div>

                        {equipment.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Equipment</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Assigned Date</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {equipment.map((item: any, index: number) => (
                                            <tr key={index}>
                                                <td>{item.name}</td>
                                                <td>{item.type}</td>
                                                <td>
                                                    <div className={`badge ${item.status === 'functional' ? 'badge-success' : 'badge-warning'}`}>
                                                        {item.status}
                                                    </div>
                                                </td>
                                                <td>{item.assigned_date}</td>
                                                <td>
                                                    <div className="flex gap-2">
                                                        <button className="btn btn-ghost btn-xs">
                                                            <i className="fas fa-edit"></i>
                                                        </button>
                                                        <button className="btn btn-ghost btn-xs text-error">
                                                            <i className="fas fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="mb-4">No equipment has been assigned to this crew yet</p>
                                <button className="btn btn-outline">
                                    <i className="fas fa-tools mr-2"></i> Assign First Equipment
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "history" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Work History</h3>
                            <div className="flex gap-2">
                                <select className="select select-sm select-bordered">
                                    <option value="">All Projects</option>
                                    <option value="project1">Project 1</option>
                                    <option value="project2">Project 2</option>
                                </select>
                                <button className="btn btn-sm btn-outline">
                                    <i className="fas fa-filter mr-2"></i> Filter
                                </button>
                            </div>
                        </div>

                        {/* {workHistory.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Project</th>
                                            <th>Task</th>
                                            <th>Hours</th>
                                            <th>Completion</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {workHistory.map((item: any, index: number) => (
                                            <tr key={index}>
                                                <td>{item.date}</td>
                                                <td>{item.project}</td>
                                                <td>{item.task}</td>
                                                <td>{item.hours}</td>
                                                <td>
                                                    <progress
                                                        className="progress progress-success w-20"
                                                        value={item.completion}
                                                        max="100"
                                                    ></progress>
                                                    <span className="ml-2">{item.completion}%</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                        )} */}
                        <div className="text-center py-8">
                            <p>Feature will be released in future updates.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add New Crew Member</h3>
                        <form className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Name</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newMember.name}
                                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                    placeholder="Enter full name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Role</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newMember.role}
                                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                    placeholder="e.g. Foreman, Carpenter, Electrician"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Experience</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newMember.experience}
                                    onChange={(e) => setNewMember({ ...newMember, experience: e.target.value })}
                                    placeholder="e.g. 5 years"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Phone</span>
                                </label>
                                <input
                                    type="tel"
                                    className="input input-bordered"
                                    value={newMember.phone}
                                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                                    placeholder="Phone number"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Email</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                    placeholder="Email address"
                                />
                            </div>
                        </form>
                        <div className="modal-action">
                            <button className="btn btn-outline" onClick={() => setShowAddMemberModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    // Here we would add the implementation to save the member
                                    toast({
                                        title: "Member added",
                                        description: `${newMember.name} was added to the crew.`,
                                    });
                                    setShowAddMemberModal(false);
                                }}
                                disabled={!newMember.name || !newMember.role}
                            >
                                Add Member
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLinkMemberModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add New Crew Member</h3>
                        <form className="space-y-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Name</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={linkMember?.id || ""}
                                    onChange={(e) => {
                                        const selectedMember = members.find((m) => m.id === e.target.value);
                                        setLinkMember(selectedMember || null);
                                    }}
                                >
                                    <option value="">Select a member</option>
                                    {allMembers.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.name} - {member.role}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Role</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newMember.role}
                                    onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                                    placeholder="e.g. Foreman, Carpenter, Electrician"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Experience</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newMember.experience}
                                    onChange={(e) => setNewMember({ ...newMember, experience: e.target.value })}
                                    placeholder="e.g. 5 years"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Phone</span>
                                </label>
                                <input
                                    type="tel"
                                    className="input input-bordered"
                                    value={newMember.phone}
                                    onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                                    placeholder="Phone number"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Email</span>
                                </label>
                                <input
                                    type="email"
                                    className="input input-bordered"
                                    value={newMember.email}
                                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                    placeholder="Email address"
                                />
                            </div>
                        </form>
                        <div className="modal-action">
                            <button className="btn btn-outline" onClick={() => setShowLinkMemberModal(false)}>
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    // Here we would add the implementation to save the member
                                    toast({
                                        title: "Member linked",
                                        description: `${newMember.name} was added to the crew.`,
                                    });
                                    setShowLinkMemberModal(false);
                                }}
                                disabled={!newMember.name || !newMember.role}
                            >
                                Link Member
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
