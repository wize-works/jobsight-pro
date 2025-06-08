"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { CrewWithDetails } from "@/types/crews";
import { CrewMemberRole, crewMemberRoleOptions, type CrewMember, type CrewMemberInsert } from "@/types/crew-members";
import type { Equipment } from "@/types/equipment";
import { toast } from "@/hooks/use-toast";
import { assignCrewLeader, updateCrewNotes } from "@/app/actions/crews";
import { createCrewMember } from "@/app/actions/crew-members";
import { addCrewMemberToCrew } from "@/app/actions/crew-member-assignment";
import { createProjectCrew, updateCrewMember } from "@/app/actions/project-crews";
import { Project } from "@/types/projects";
import { ProjectCrewInsert } from "@/types/project-crews";
import { set } from "zod";

// Status options with colors and labels
const statusOptions = {
    active: { label: "Active", color: "badge-primary" },
    available: { label: "Available", color: "badge-success" },
};

interface CrewDetailProps {
    crew: CrewWithDetails;
    members?: CrewMember[];
    allMembers?: CrewMember[];
    schedule?: any[];
    history?: any[];
    equipment?: Equipment[];
    projects?: Project[];
}

export default function CrewDetailComponent({
    crew,
    members = [],
    allMembers = [],
    schedule = [],
    history = [],
    equipment = [],
    projects = [],
}: CrewDetailProps & { projects?: { id: string; name: string }[] }) {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("members");
    const [crewLeader, setCrewLeader] = useState(crew.leader_id || "");
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showLinkMemberModal, setShowLinkMemberModal] = useState(false);
    const [linkMember, setLinkMember] = useState<CrewMember | null>(null);
    const [workHistory, setWorkHistory] = useState(history || []);
    const [notes, setNotes] = useState(crew.notes || "");
    const [newMember, setNewMember] = useState({
        name: "",
        role: "",
        experience: 0,
        phone: "",
        email: "",
        avatar_url: "",
    });
    const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);
    const [newAssignment, setNewAssignment] = useState({
        projectId: '',
        startDate: '',
        endDate: '',
        notes: '',
    });
    const [editingMember, setEditingMember] = useState<CrewMember | null>(null);
    const [showEditMemberModal, setShowEditMemberModal] = useState(false);

    const leaderData = useMemo(() => {
        return allMembers.find((m: CrewMember) => m.id === crewLeader) || { id: "", name: "", role: "", phone: "", email: "", avatar_url: "" };
    }, [allMembers, crewLeader]);

    const handleAddMember = async () => {
        const memberData = {
            name: newMember.name,
            role: newMember.role,
            experience: newMember.experience,
            phone: newMember.phone,
            email: newMember.email,
            avatar_url: newMember.avatar_url || `/diverse-avatars.png?height=40&width=40&query=avatar${Math.floor(Math.random() * 100)}`,
        } as CrewMemberInsert;

        try {

            const member = await createCrewMember(memberData);

            if (!member) {
                toast.error({
                    title: "Error",
                    description: "Failed to create crew member. Please try again.",
                });
            }

            if (member) {
                await addCrewMemberToCrew(crew.id, member.id);

                toast.success({
                    title: "Success",
                    description: `Added ${member.name} to the crew.`,
                });
            }
            setNewMember({
                name: "",
                role: "",
                experience: 0,
                phone: "",
                email: "",
                avatar_url: "",
            });
            router.refresh();
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Error adding crew member. Please try again.",
            });
        }
    };

    const handleLinkMember = async () => {
        try {
            if (linkMember && linkMember.id) {
                await addCrewMemberToCrew(crew.id, linkMember.id);
                toast.success({
                    title: "Success",
                    description: `Linked ${linkMember.name} to the crew.`,
                });
            }
            setLinkMember(null);
            router.refresh();
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Error linking crew member. Please try again.",
            });
        }
    };

    const handleEditMember = (member: CrewMember) => {
        setEditingMember(member);
        setShowEditMemberModal(true);
    };

    const handleUpdateMember = async () => {
        if (!editingMember) return;

        try {
            const result = await updateCrewMember(editingMember.id, editingMember);

            if (result) {
                toast({
                    title: "Success",
                    description: `Updated ${editingMember.name} successfully.`,
                });

                setShowEditMemberModal(false);
                setEditingMember(null);
                router.refresh();
            } else {
                throw new Error("Failed to update crew member");
            }
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Error updating crew member. Please try again.",
            });
        }
    };

    // Add this handler for adding an assignment (mock for now)
    const handleAddAssignment = async () => {
        console.log("Adding assignment for crew:", crew.id, "with data:", newAssignment.projectId);
        const projectCrewInsert = {
            crew_id: crew.id,
            project_id: newAssignment.projectId,
            start_date: new Date(newAssignment.startDate).toISOString(),
            end_date: newAssignment.endDate ? new Date(newAssignment.endDate).toISOString() : null,
            notes: newAssignment.notes,
        } as ProjectCrewInsert;

        try {
            await createProjectCrew(projectCrewInsert);
            toast.success({
                title: "Assignment added",
                description: `Assignment for crew scheduled from ${newAssignment.startDate} to ${newAssignment.endDate}.`,
            });
            setShowAddAssignmentModal(false);
            setNewAssignment({ projectId: '', startDate: '', endDate: '', notes: '' });
            router.refresh();
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Failed to add assignment. Please try again.",
            });
        }
    };

    const handleAssignLeader = async () => {
        if (!crewLeader) {
            toast.error({
                title: "Error",
                description: "Please select a crew leader.",
            });
            return;
        }

        await assignCrewLeader(crew.id, crewLeader);

        toast.success({
            title: "Success",
            description: `Assigned ${crewLeader} as the new crew leader.`,
        });
        router.refresh();
    }

    const handleUpdateNotes = async () => {
        if (!notes) {
            toast.error({
                title: "Error",
                description: "Please enter notes before saving.",
            });
            return;
        }

        try {
            await updateCrewNotes(crew.id, notes);
            toast.success({
                title: "Success",
                description: "Crew notes updated successfully.",
            });
            router.refresh();
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Failed to update crew notes. Please try again.",
            });
        }
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 md:gap-6">
                <div className="order-2 md:order-last">
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title">Crew Leader</h2>
                            <p className="text-base-content/70 mb-4">Contact information</p>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="avatar">
                                    <div className="w-12 rounded-full">
                                        <img src={leaderData.avatar_url || `/diverse-avatars.png?height=40&width=40&query=avatar${leaderData.id}`} alt="Leader Avatar" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-semibold">{leaderData.name}</h3>
                                    <p className="text-sm opacity-70">{leaderData.role}</p>
                                    <p className="text-sm text-primary"><i className="fas fa-phone fa-fw mr-2"></i><Link href={`tel:${leaderData.phone}`}>{leaderData.phone}</Link></p>
                                    <p className="text-sm text-primary"><i className="fas fa-envelope fa-fw mr-2"></i><Link href={`mailto:${leaderData.email}`}>{leaderData.email}</Link></p>
                                </div>
                            </div>

                            <p>Here you can change the leader of this crew:</p>
                            <div className="join w-full">
                                <select
                                    className="select select-bordered join-item w-full"
                                    defaultValue={crew.leader_id || ""}
                                    onChange={(e) => { setCrewLeader(e.target.value); }}
                                >
                                    <option value="">Select Crew Leader</option>
                                    {allMembers.map((member) => (
                                        <option key={member.id} value={member.id}>
                                            {member.name} - {member.role}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-primary join-item"
                                    onClick={() => { handleAssignLeader() }}
                                >
                                    Change
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="card bg-base-100 shadow-sm mt-6">
                        <div className="card-body">
                            <h2 className="card-title">Notes</h2>
                            <p className="text-base-content/70 mb-4">Add any important notes about the crew here.</p>
                            <textarea
                                className="textarea textarea-bordered w-full"
                                placeholder="Add notes about the crew..."
                                rows={4}
                                defaultValue={crew.notes || ""}
                                onChange={(e) => {
                                    setNotes(e.target.value);
                                }}
                            ></textarea>

                            <div className="mt-4">
                                <button className="btn btn-primary btn-sm" onClick={() => { handleUpdateNotes(); }}>
                                    <i className="fas fa-save mr-2"></i> Save Notes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-6 col-span-2">

                    <div className="order-1 md:order-1">
                        <div className="card bg-base-100 shadow-sm">
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
                            </div>
                        </div>
                        <div>
                            <div className="stats stats-vertical md:stats-horizontal shadow bg-base-100 mt-6 w-full">
                                <div className="stat">
                                    <div className="stat-figure text-primary">
                                        <i className="fas fa-users fa-2x"></i>
                                    </div>
                                    <div className="stat-title">Total Members</div>
                                    <div className="stat-value">{crew.member_count || 0}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-figure text-secondary">
                                        <i className="fas fa-project-diagram fa-2x"></i>
                                    </div>
                                    <div className="stat-title">Active Projects</div>
                                    <div className="stat-value">{crew.active_projects || 0}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-figure text-accent">
                                        <i className="fas fa-clock fa-2x"></i>
                                    </div>
                                    <div className="stat-title">Total Hours Worked</div>
                                    <div className="stat-value">{crew.total_hours || 0} hrs</div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="order-2">
                        <div className="tabs tabs-box mb-6">
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
                                    <div className="flex flex-col md:flex-row justify-between items-center mb-4">
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
                                                                    <button
                                                                        className="btn btn-ghost btn-xs"
                                                                        onClick={() => handleEditMember(member)}
                                                                    >
                                                                        <i className="fas fa-edit fa-xl"></i>
                                                                    </button>
                                                                    <button className="btn btn-ghost btn-xs text-error">
                                                                        <i className="fas fa-trash fa-xl"></i>
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
                                        <button className="btn btn-sm btn-outline" onClick={() => setShowAddAssignmentModal(true)}>
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
                                                                        <i className="fas fa-edit fa-xl"></i>
                                                                    </button>
                                                                    <button className="btn btn-ghost btn-xs text-error">
                                                                        <i className="fas fa-trash fa-xl"></i>
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
                                                            <td>{item.equipment_name}</td>
                                                            <td>{item.equipment_type}</td>
                                                            <td>
                                                                <div className={`badge ${item.status === 'functional' ? 'badge-success' : 'badge-warning'}`}>
                                                                    {item.status}
                                                                </div>
                                                            </td>
                                                            <td>{item.assigned_date}</td>
                                                            <td>
                                                                <div className="flex gap-2">
                                                                    <button className="btn btn-ghost btn-xs">
                                                                        <i className="fas fa-edit fa-fw fa-xl"></i>
                                                                    </button>
                                                                    <button className="btn btn-ghost btn-xs text-error">
                                                                        <i className="fas fa-trash fa-fw fa-xl"></i>
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
                                            <select className="select select-bordered select-sm" defaultValue="all" onChange={(e) => {
                                                // Handle project filter change
                                                const selectedProjectId = e.target.value;
                                                if (selectedProjectId === "all") {
                                                    // Reset filter
                                                    setWorkHistory(history);
                                                } else {
                                                    // Filter history by selected project
                                                    const filteredHistory = history.filter((item: any) => item.project_id === selectedProjectId);
                                                    setWorkHistory(filteredHistory);
                                                }
                                            }}>
                                                <option value="all">All Projects</option>
                                                {projects.map((project: Project) => (
                                                    <option key={project.id} value={project.id}>
                                                        {project.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <button className="btn btn-sm btn-outline">
                                                <i className="fas fa-filter mr-2"></i> Filter
                                            </button>
                                        </div>
                                    </div>

                                    {workHistory.length > 0 ? (
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
                                                            <td>{item.start_date} - {item.end_date}</td>
                                                            <td>{item.project_name}</td>
                                                            <td>{item.tasks}</td>
                                                            <td>{item.hours_worked}</td>
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
                                        <div className="text-center py-8">
                                            <p>Feature will be released in future updates.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

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
                                            className="input input-bordered input-secondary w-full"
                                            value={newMember.name}
                                            onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                            placeholder="Enter full name"
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Role</span>
                                        </label>
                                        {crewMemberRoleOptions.select(
                                            newMember.role as CrewMemberRole,
                                            (role) => setNewMember({ ...newMember, role }),
                                            "select-secondary w-full"
                                        )}
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Experience</span>
                                        </label>
                                        <input
                                            type="number"
                                            className="input input-bordered input-secondary w-full"
                                            value={newMember.experience}
                                            onChange={(e) => setNewMember({ ...newMember, experience: Number(e.target.value) })}
                                            placeholder="e.g. 5 years"
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Phone</span>
                                        </label>
                                        <input
                                            type="tel"
                                            className="input input-bordered input-secondary w-full"
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
                                            className="input input-bordered input-secondary w-full"
                                            value={newMember.email}
                                            onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                            placeholder="Email address"
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Avatar Url</span>
                                        </label>
                                        <input
                                            type="email"
                                            className="input input-bordered input-secondary w-full"
                                            value={newMember.avatar_url || ""}
                                            onChange={(e) => setNewMember({ ...newMember, avatar_url: e.target.value })}
                                            placeholder="Avatar image URL"
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
                                            handleAddMember();
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
                                <h3 className="font-bold text-lg mb-4">Link Crew Member</h3>
                                <form className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Crew Members</span>
                                        </label>
                                        <select
                                            className="select select-bordered"
                                            defaultValue={linkMember?.id || ""}
                                            onChange={(e) => {
                                                const selectedMember = allMembers.find((m) => m.id === e.target.value);
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
                                </form>
                                <div className="modal-action">
                                    <button className="btn btn-outline" onClick={() => setShowLinkMemberModal(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            handleLinkMember();
                                            setShowLinkMemberModal(false);
                                        }}
                                        disabled={!linkMember}
                                    >
                                        Link Member
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Assignment Modal */}
                    {showAddAssignmentModal && (
                        <div className="modal modal-open">
                            <div className="modal-box">
                                <h3 className="font-bold text-lg mb-4">Add Crew Assignment</h3>
                                <form className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Project</span>
                                        </label>
                                        <select
                                            className="select select-bordered"
                                            value={newAssignment.projectId}
                                            onChange={e => setNewAssignment({ ...newAssignment, projectId: e.target.value })}
                                        >
                                            <option value="">Select a project</option>
                                            {projects.map((project) => (
                                                <option key={project.id} value={project.id}>{project.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Start Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="input input-bordered"
                                            value={newAssignment.startDate}
                                            onChange={e => setNewAssignment({ ...newAssignment, startDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">End Date</span>
                                        </label>
                                        <input
                                            type="date"
                                            className="input input-bordered"
                                            value={newAssignment.endDate}
                                            onChange={e => setNewAssignment({ ...newAssignment, endDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Notes</span>
                                        </label>
                                        <textarea
                                            className="textarea textarea-bordered"
                                            value={newAssignment.notes}
                                            onChange={e => setNewAssignment({ ...newAssignment, notes: e.target.value })}
                                            placeholder="Assignment notes                                        />
                                    </div>
                                </form>
                                <div className="modal-action">
                                    <button className="btn btn-outline" onClick={() => setShowAddAssignmentModal(false)}>
                                        Cancel
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={handleAddAssignment}
                                        disabled={!newAssignment.projectId || !newAssignment.startDate}
                                    >
                                        Add Assignment
                                    </button>
                                </div>
                            </div>
                            <form method="dialog" className="modal-backdrop">
                                <button onClick={() => setShowAddAssignmentModal(false)}>close</button>
                            </form>
                        </div>
                    )}

                    {/* Edit Member Modal */}
                    {showEditMemberModal && editingMember && (
                        <div className="modal modal-open">
                            <div className="modal-box">
                                <h3 className="font-bold text-lg mb-4">Edit Crew Member</h3>
                                <form className="space-y-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Name</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered"
                                            value={editingMember.name}
                                            onChange={(e) => setEditingMember({ ...editingMember, name: e.target.value })}
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
                                            value={editingMember.role}
                                            onChange={(e) => setEditingMember({ ...editingMember, role: e.target.value })}
                                            placeholder="e.g. Foreman, Electrician, etc."
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Experience (years)</span>
                                        </label>
                                        <input
                                            type="number"
                                            className="input input-bordered"
                                            value={editingMember.experience}
                                            onChange={(e) => setEditingMember({ ...editingMember, experience: parseInt(e.target.value) || 0 })}
                                            min="0"
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Phone</span>
                                        </label>
                                        <input
                                            type="tel"
                                            className="input input-bordered"
                                            value={editingMember.phone}
                                            onChange={(e) => setEditingMember({ ...editingMember, phone: e.target.value })}
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
                                            value={editingMember.email}
                                            onChange={(e) => setEditingMember({ ...editingMember, email: e.target.value })}
                                            placeholder="Email address"
                                        />
                                    </div>
                                </form>
                                <div className="modal-action">
                                    <button className="btn btn-primary" onClick={handleUpdateMember}>
                                        <i className="fas fa-save mr-2"></i> Update Member
                                    </button>
                                    <button 
                                        className="btn" 
                                        onClick={() => {
                                            setShowEditMemberModal(false);
                                            setEditingMember(null);
                                        }}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            <form method="dialog" className="modal-backdrop">
                                <button onClick={() => {
                                    setShowEditMemberModal(false);
                                    setEditingMember(null);
                                }}>close</button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}