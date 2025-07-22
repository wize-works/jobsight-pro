"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ErrorBoundary from "@/components/error-boundary";
import type { Crew, CrewWithDetails } from "@/types/crews";
import { CrewMemberRole, crewMemberRoleOptions, type CrewMember, type CrewMemberInsert } from "@/types/crew-members";
import { assignmentStatusOptions, EquipmentAssignment, EquipmentAssignmentStatus, type EquipmentAssignmentInsert, type EquipmentAssignmentUpdate, type EquipmentAssignmentWithEquipmentDetails } from "@/types/equipment-assignments";
import { toast } from "@/hooks/use-toast";
import { assignCrewLeader, updateCrewNotes, updateCrew } from "@/app/actions/crews";
import { createCrewMember, updateCrewMember } from "@/app/actions/crew-members";
import { addCrewMemberToCrew } from "@/app/actions/crew-member-assignment";
import { createProjectCrew, updateProjectCrew, deleteProjectCrew } from "@/app/actions/project-crews";
import { updateEquipmentAssignment, deleteEquipmentAssignment, createEquipmentAssignment } from "@/app/actions/equipment-assignments";
import { Project, projectStatusOptions } from "@/types/projects";
import { ProjectCrewInsert, ProjectCrewUpdate } from "@/types/project-crews";
import { Equipment } from "@/types/equipment";
import { create } from "domain";
import { useBusiness } from "@/lib/business-context";
import ModalLoading from "@/components/modal-loading";

// Dynamic imports for modal components
const ModalEdit = dynamic(() => import("./modal-edit"), {
    loading: () => <ModalLoading message="Loading edit form..." />,
});

const ModalMember = dynamic(() => import("./modal-member"), {
    loading: () => <ModalLoading message="Loading member form..." />,
});

const ModalLink = dynamic(() => import("./modal-link"), {
    loading: () => <ModalLoading message="Loading link form..." />,
});

const ModalAssignment = dynamic(() => import("./modal-assignment"), {
    loading: () => <ModalLoading message="Loading assignment form..." />,
});

const ModalEquipment = dynamic(() => import("./modal-equipment"), {
    loading: () => <ModalLoading message="Loading equipment form..." />,
});

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
    equipment?: EquipmentAssignmentWithEquipmentDetails[];
    projects?: Project[];
    allEquipment?: Equipment[];
}

export default function CrewDetailComponent({
    crew,
    members = [],
    allMembers = [],
    schedule = [],
    history = [],
    equipment = [],
    projects = [],
    allEquipment = [],
}: CrewDetailProps) {
    const { businessId } = useBusiness();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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
    const [showEditAssignmentModal, setShowEditAssignmentModal] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<any>(null);
    const [newAssignment, setNewAssignment] = useState({
        projectId: '',
        startDate: '',
        endDate: '',
        notes: '',
    });
    const [editingMember, setEditingMember] = useState<CrewMember | null>(null);
    const [showEditMemberModal, setShowEditMemberModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false); // State for the new modal    // Equipment states
    const [showEquipmentModal, setShowEquipmentModal] = useState(false); // New standardized equipment modal
    const [editingEquipment, setEditingEquipment] = useState<any | null>(null);
    const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]); // New state for selected equipment IDs

    const leaderData = useMemo(() => {
        return allMembers.find((m: CrewMember) => m.id === crewLeader) || { id: "", name: "", role: "", phone: "", email: "", avatar_url: "" };
    }, [allMembers, crewLeader]);

    const handleAddMember = async (formData: any) => {
        const memberData = {
            name: formData.name,
            role: formData.role,
            experience: formData.experience || 0,
            phone: formData.phone || "",
            email: formData.email || "",
            avatar_url: formData.avatar_url || `/diverse-avatars.png?height=40&width=40&query=avatar${Math.floor(Math.random() * 100)}`,
            hourly_rate: formData.hourlyRate || 0,
            overtime_rate: formData.overtimeRate || undefined,
            doubletime_rate: formData.doubletimeRate || undefined,
            is_billable: formData.isBillable || false,
        } as CrewMemberInsert;

        try {
            const member = await createCrewMember(businessId, memberData);

            if (!member) {
                toast.error({
                    title: "Error",
                    description: "Failed to create crew member. Please try again.",
                });
                throw new Error("Failed to create crew member");
            }

            if (member) {
                await addCrewMemberToCrew(businessId, crew.id, member.id);

                toast.success({
                    title: "Success",
                    description: `Added ${member.name} to the crew.`,
                });
            }

            router.refresh();
            return { success: true };
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Error adding crew member. Please try again.",
            });
            throw error;
        }
    };

    const handleLinkMember = async (formData: any) => {
        try {
            if (formData.memberId) {
                await addCrewMemberToCrew(businessId, crew.id, formData.memberId);
                toast.success({
                    title: "Success",
                    description: `Linked ${formData.member?.name || 'member'} to the crew.`,
                });
            }

            router.refresh();
            return { success: true };
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Error linking crew member. Please try again.",
            });
            throw error;
        }
    };

    const handleEditMember = (member: CrewMember) => {
        setEditingMember(member);
        setShowEditMemberModal(true);
    };

    const handleUpdateMember = async (formData: any) => {
        try {


            const memberData = {
                name: formData.name,
                role: formData.role,
                experience: formData.experience || 0,
                phone: formData.phone || "",
                email: formData.email || "",
                avatar_url: formData.avatar_url || `/diverse-avatars.png?height=40&width=40&query=avatar${Math.floor(Math.random() * 100)}`,
                hourly_rate: formData.hourlyRate || 0,
                overtime_rate: formData.overtimeRate || undefined,
                doubletime_rate: formData.doubletimeRate || undefined,
                is_billable: formData.isBillable || false,
                billable_effective_date: formData.billableEffectiveDate || null,
            } as CrewMemberInsert;

            const result = await updateCrewMember(businessId, formData.id, memberData);

            if (result) {
                toast({
                    title: "Success",
                    description: `Updated ${formData.name} successfully.`,
                });

                setShowEditMemberModal(false);
                setEditingMember(null);
                router.refresh();
                return { success: true };
            } else {
                throw new Error("Failed to update crew member");
            }
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Error updating crew member. Please try again.",
            });
            return { success: false };
        }
    };

    const handleAddAssignment = async (formData: any) => {
        console.log("Adding assignment for crew:", crew.id, "with data:", formData.projectId);
        const projectCrewInsert = {
            crew_id: crew.id,
            project_id: formData.projectId,
            start_date: new Date(formData.startDate).toISOString(),
            end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            notes: formData.notes,
        } as ProjectCrewInsert;

        try {
            await createProjectCrew(businessId, projectCrewInsert);
            toast.success({
                title: "Assignment added",
                description: `Assignment for crew scheduled from ${formData.startDate} to ${formData.endDate || 'ongoing'}.`,
            });
            setShowAddAssignmentModal(false);
            router.refresh();
            return { success: true };
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Failed to add assignment. Please try again.",
            });
            throw error;
        }
    };

    // Handler for editing an assignment
    const handleEditAssignment = async (formData: any) => {
        if (!editingAssignment?.id) {
            throw new Error("No assignment ID provided for editing");
        }

        const projectCrewUpdate = {
            project_id: formData.projectId,
            start_date: new Date(formData.startDate).toISOString(),
            end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            notes: formData.notes,
        } as ProjectCrewUpdate;

        try {
            await updateProjectCrew(businessId, editingAssignment.id, projectCrewUpdate);
            toast.success({
                title: "Assignment updated",
                description: `Assignment updated successfully.`,
            });
            setShowEditAssignmentModal(false);
            setEditingAssignment(null);
            router.refresh();
            return { success: true };
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Failed to update assignment. Please try again.",
            });
            throw error;
        }
    };    // Handler to open edit assignment modal
    const handleOpenEditAssignment = (assignment: any) => {
        setEditingAssignment(assignment);
        setShowEditAssignmentModal(true);
    };

    // Handler to delete assignment
    const handleDeleteAssignment = async (assignment: any) => {
        if (!assignment?.id) {
            toast.error({
                title: "Error",
                description: "Invalid assignment ID",
            });
            return;
        }

        // Show confirmation dialog
        if (!window.confirm("Are you sure you want to delete this assignment? This action cannot be undone.")) {
            return;
        }

        try {
            await deleteProjectCrew(businessId, assignment.id);
            toast.success({
                title: "Assignment deleted",
                description: "The assignment has been successfully removed from the crew's schedule.",
            });
            router.refresh();
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Failed to delete assignment. Please try again.",
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

        await assignCrewLeader(businessId, crew.id, crewLeader);

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
            await updateCrewNotes(businessId, crew.id, notes);
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

    const handleUpdateCrew = async (formData: any) => {
        try {
            console.log("Updating crew:", crew.id, "with data:", formData);

            if (!formData.name.trim()) {
                toast.error({
                    title: "Validation Error",
                    description: "Crew name is required",
                });
                return { success: false };
            }

            // Create a partial update with only the fields we want to change
            const crewUpdate = {
                name: formData.name,
                status: formData.status,
                leader_id: formData.leader_id || null,
                specialty: formData.specialty || null,
                notes: formData.notes || null
            } as any; // Using any as a workaround for the type issues

            const result = await updateCrew(businessId, crew.id, crewUpdate);

            if (result) {
                toast.success({
                    title: "Crew Updated",
                    description: `The crew "${result.name}" has been updated successfully.`,
                });
                setShowEditModal(false);
                router.refresh();
                return { success: true };
            } else {
                throw new Error("Failed to update crew");
            }
        } catch (error) {
            console.error("Error updating crew:", error);
            toast.error({
                title: "Error",
                description: "Failed to update crew. Please try again.",
            });
            return { success: false };
        }
    }

    // Equipment Handlers
    const handleAddEquipmentAssignment = async (formData: any) => {
        const equipmentAssignment = {
            crew_id: crew.id,
            equipment_id: formData.equipmentId,
            start_date: new Date(formData.startDate).toISOString(),
            end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            status: formData.status,
            notes: formData.notes,
        } as EquipmentAssignmentInsert;

        try {
            await createEquipmentAssignment(businessId, equipmentAssignment);
            toast.success({
                title: "Equipment assigned",
                description: "Equipment has been successfully assigned to the crew.",
            });
            setShowEquipmentModal(false);
            router.refresh();
            return { success: true };
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Failed to assign equipment. Please try again.",
            });
            throw error;
        }
    };

    const handleEditEquipmentAssignment = (assignment: any) => {
        setEditingEquipment(assignment);
        setShowEquipmentModal(true);
    };

    const handleUpdateEquipmentAssignment = async (formData: any) => {
        if (!editingEquipment?.id) {
            throw new Error("No equipment assignment ID provided for editing");
        }

        const equipmentAssignmentUpdate = {
            equipment_id: formData.equipmentId,
            start_date: new Date(formData.startDate).toISOString(),
            end_date: formData.endDate ? new Date(formData.endDate).toISOString() : null,
            status: formData.status,
            notes: formData.notes,
        } as EquipmentAssignmentUpdate;

        try {
            await updateEquipmentAssignment(businessId, editingEquipment.id, equipmentAssignmentUpdate);
            toast.success({
                title: "Equipment assignment updated",
                description: "Equipment assignment has been successfully updated.",
            });
            setShowEquipmentModal(false);
            setEditingEquipment(null);
            router.refresh();
            return { success: true };
        } catch (error) {
            toast.error({
                title: "Error",
                description: "Failed to update equipment assignment. Please try again.",
            });
            throw error;
        }
    };

    const handleDeleteEquipmentAssignment = async (assignmentId: string) => {
        if (window.confirm("Are you sure you want to delete this equipment assignment?")) {
            try {
                await deleteEquipmentAssignment(businessId, assignmentId);
                toast({
                    title: "Success",
                    description: "Equipment assignment deleted successfully.",
                });
                router.refresh();
            } catch (error) {
                toast.error({
                    title: "Error",
                    description: "Failed to delete equipment assignment. Please try again.",
                });
            }
        }
    };

    // Assign Equipment Functionality
    const handleOpenAssignEquipmentModal = () => {
        setShowEquipmentModal(true);
    };

    // Don't render until component is mounted to prevent hydration issues
    if (!mounted) {
        return (
            <div className="loading loading-spinner loading-lg"></div>
        );
    }

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                <Link href={`/dashboard/crews`} className="btn btn-outline mr-2">
                    <i className="far fa-arrow-left"></i> Back to Crews
                </Link>
                <div className="flex gap-2">
                    <button className="btn btn-outline" onClick={() => setShowEditModal(true)}>
                        <i className="far fa-edit mr-2"></i> Edit Crew
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowAddMemberModal(true)}>
                        <i className="far fa-user-plus mr-2"></i> Add Member
                    </button>
                </div>
            </div>            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 md:gap-6">
                <div className="order-2 md:order-last">
                    <ErrorBoundary fallback={() => (
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
                                <div className="alert alert-warning">
                                    <i className="fas fa-exclamation-triangle"></i>
                                    <div>
                                        <h3 className="font-bold">Crew leader section temporarily unavailable</h3>
                                        <div className="text-xs">Leader information couldn't be loaded.</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}>
                        <div className="card bg-base-100 shadow-lg">
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
                                        <p className="text-sm text-primary"><i className="far fa-phone fa-fw mr-2"></i><Link href={`tel:${leaderData.phone}`}>{leaderData.phone}</Link></p>
                                        <p className="text-sm text-primary"><i className="far fa-envelope fa-fw mr-2"></i><Link href={`mailto:${leaderData.email}`}>{leaderData.email}</Link></p>
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
                        <div className="card bg-base-100 shadow-lg mt-6">
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
                                ></textarea>                            <div className="mt-4">
                                    <button className="btn btn-primary btn-sm" onClick={() => { handleUpdateNotes(); }}>
                                        <i className="far fa-save mr-2"></i> Save Notes
                                    </button>
                                </div>
                            </div>
                        </div>
                    </ErrorBoundary>
                </div>
                <div className="flex flex-col gap-6 col-span-2">

                    <div className="order-1 md:order-1">
                        <div className="card bg-base-100 shadow-lg">
                            <div className="card-body">
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
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                        <i className="far fa-users fa-2x"></i>
                                    </div>
                                    <div className="stat-title">Total Members</div>
                                    <div className="stat-value text-primary">{crew.member_count || 0}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-figure text-secondary">
                                        <i className="far fa-screwdriver-wrench fa-2x"></i>
                                    </div>
                                    <div className="stat-title">Active Projects</div>
                                    <div className="stat-value text-secondary">{crew.active_projects || 0}</div>
                                </div>
                                <div className="stat">
                                    <div className="stat-figure text-accent">
                                        <i className="far fa-clock fa-2x"></i>
                                    </div>
                                    <div className="stat-title">Total Hours Worked</div>
                                    <div className="stat-value text-accent">{crew.total_hours || 0} hrs</div>
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
                        </div>                        {activeTab === "members" && (
                            <ErrorBoundary fallback={() => (
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="alert alert-warning">
                                            <i className="fas fa-exclamation-triangle"></i>
                                            <div>
                                                <h3 className="font-bold">Members section temporarily unavailable</h3>
                                                <div className="text-xs">Crew members couldn't be loaded.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}>
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex flex-col md:flex-row justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Crew Members</h3>
                                            <div className="flex gap-2">
                                                <button className="btn btn-sm btn-primary" onClick={() => setShowAddMemberModal(true)}>
                                                    <i className="far fa-user-plus mr-2"></i> Add New Member
                                                </button>
                                                <button className="btn btn-sm btn-secondary" onClick={() => setShowLinkMemberModal(true)}>
                                                    <i className="far fa-edit mr-2"></i> Link Crew Member
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
                                                                            <i className="far fa-edit fa-xl"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-ghost btn-xs text-error"
                                                                            onClick={() => {
                                                                                if (window.confirm("Are you sure you want to remove this member from the crew?")) {
                                                                                    // TODO: Implement remove member functionality
                                                                                    console.log("Remove member:", member.id, "from crew:", crew.id);
                                                                                }
                                                                            }}
                                                                        >
                                                                            <i className="far fa-trash fa-xl"></i>
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
                                                    <i className="far fa-user-plus mr-2"></i> Add First Member
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ErrorBoundary>
                        )}                        {activeTab === "schedule" && (
                            <ErrorBoundary fallback={() => (
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="alert alert-warning">
                                            <i className="fas fa-exclamation-triangle"></i>
                                            <div>
                                                <h3 className="font-bold">Schedule section temporarily unavailable</h3>
                                                <div className="text-xs">Crew schedule couldn't be loaded.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}>
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Upcoming Schedule</h3>
                                            <button className="btn btn-sm btn-outline" onClick={() => setShowAddAssignmentModal(true)}>
                                                <i className="far fa-plus mr-2"></i> Add Assignment
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
                                                                        <i className="far fa-arrow-up-right-from-square fa-fw ml-2" />
                                                                    </Link>
                                                                </td>
                                                                <td>{item.notes}</td>
                                                                <td>{item.hours}</td>
                                                                <td>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            className="btn btn-ghost btn-xs"
                                                                            onClick={() => {
                                                                                handleOpenEditAssignment(item);
                                                                            }}
                                                                        >
                                                                            <i className="far fa-edit fa-xl"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-ghost btn-xs text-error"
                                                                            onClick={() => handleDeleteAssignment(item)}
                                                                        >
                                                                            <i className="far fa-trash fa-xl"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (<div className="text-center py-8">
                                            <p className="mb-4">No schedule items have been added yet</p>
                                            <button className="btn btn-outline" onClick={() => setShowAddAssignmentModal(true)}>
                                                <i className="far fa-plus mr-2"></i> Add First Assignment
                                            </button>
                                        </div>
                                        )}
                                    </div>
                                </div>
                            </ErrorBoundary>
                        )}                        {activeTab === "equipment" && (
                            <ErrorBoundary fallback={() => (
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="alert alert-warning">
                                            <i className="fas fa-exclamation-triangle"></i>
                                            <div>
                                                <h3 className="font-bold">Equipment section temporarily unavailable</h3>
                                                <div className="text-xs">Crew equipment assignments couldn't be loaded.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}>
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-semibold">Assigned Equipment</h3>
                                            <button className="btn btn-sm btn-outline" onClick={handleOpenAssignEquipmentModal}>
                                                <i className="far fa-tools mr-2"></i> Assign Equipment
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
                                                                    {assignmentStatusOptions.badge(item.status as EquipmentAssignmentStatus)}
                                                                </td>
                                                                <td>{item.assigned_date}</td>
                                                                <td>
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            className="btn btn-ghost btn-xs"
                                                                            onClick={() => handleEditEquipmentAssignment(item)}
                                                                        >
                                                                            <i className="far fa-edit fa-fw fa-xl"></i>
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-ghost btn-xs text-error"
                                                                            onClick={() => handleDeleteEquipmentAssignment(item.id)}
                                                                        >
                                                                            <i className="far fa-trash fa-fw fa-xl"></i>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (<div className="text-center py-8">
                                            <p className="mb-4">No equipment has been assigned to this crew yet</p>
                                            <button className="btn btn-outline" onClick={handleOpenAssignEquipmentModal}>
                                                <i className="far fa-tools mr-2"></i> Assign First Equipment
                                            </button>
                                        </div>
                                        )}
                                    </div>
                                </div>
                            </ErrorBoundary>
                        )}                        {activeTab === "history" && (
                            <ErrorBoundary fallback={() => (
                                <div className="card bg-base-100 shadow-lg">
                                    <div className="card-body">
                                        <div className="alert alert-warning">
                                            <i className="fas fa-exclamation-triangle"></i>
                                            <div>
                                                <h3 className="font-bold">History section temporarily unavailable</h3>
                                                <div className="text-xs">Crew work history couldn't be loaded.</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}>
                                <div className="card bg-base-100 shadow-lg">
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
                                                    <i className="far fa-filter mr-2"></i> Filter
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
                                            </div>) : (
                                            <div className="text-center py-8">
                                                <p>Feature will be released in future updates.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </ErrorBoundary>
                        )}
                    </div>                    {/* Add Member Modal */}
                    {showAddMemberModal && (
                        <ModalMember
                            title="Add New Crew Member"
                            loading={false}
                            onClose={() => setShowAddMemberModal(false)}
                            onSubmit={handleAddMember}
                        />
                    )}                    {showLinkMemberModal && (
                        <ModalLink
                            title="Link Crew Member"
                            loading={false}
                            onClose={() => setShowLinkMemberModal(false)}
                            onSubmit={handleLinkMember}
                            allMembers={allMembers}
                        />
                    )}                    {/* Add Assignment Modal */}
                    {showAddAssignmentModal && (
                        <ModalAssignment
                            title="Add Crew Assignment"
                            loading={false}
                            onClose={() => setShowAddAssignmentModal(false)}
                            onSubmit={handleAddAssignment}
                            projects={projects}
                        />
                    )}

                    {/* Edit Member Modal */}
                    {showEditMemberModal && editingMember && (
                        <ModalMember
                            title="Edit Crew Member"
                            loading={false}
                            onClose={() => {
                                setShowEditMemberModal(false);
                                setEditingMember(null);
                            }}
                            onSubmit={handleUpdateMember}
                            initialMember={editingMember}
                        />
                    )}

                    {showEditModal && (
                        <ModalEdit
                            title="Edit Crew"
                            onClose={() => setShowEditModal(false)}
                            onSubmit={handleUpdateCrew}
                            initialCrew={crew as Crew}
                            initialMembers={allMembers}
                        />
                    )}

                    {/* Edit Assignment Modal */}
                    {showEditAssignmentModal && editingAssignment && (
                        <ModalAssignment
                            title="Edit Assignment"
                            loading={false}
                            onClose={() => {
                                setShowEditAssignmentModal(false);
                                setEditingAssignment(null);
                            }}
                            onSubmit={handleEditAssignment}
                            projects={projects}
                            initialData={{
                                id: editingAssignment.id,
                                project_id: editingAssignment.project_id,
                                start_date: editingAssignment.start_date,
                                end_date: editingAssignment.end_date,
                                notes: editingAssignment.notes,
                                project_name: editingAssignment.project_name,
                            }}
                        />
                    )}

                    {/* Equipment Assignment Modal */}
                    {showEquipmentModal && (
                        <ModalEquipment
                            title={editingEquipment ? "Edit Equipment Assignment" : "Assign Equipment"}
                            loading={false}
                            onClose={() => {
                                setShowEquipmentModal(false);
                                setEditingEquipment(null);
                            }}
                            onSubmit={editingEquipment ? handleUpdateEquipmentAssignment : handleAddEquipmentAssignment}
                            equipment={allEquipment}
                            initialData={editingEquipment ? {
                                id: editingEquipment.id,
                                equipment_id: editingEquipment.equipment_id,
                                start_date: editingEquipment.start_date,
                                end_date: editingEquipment.end_date,
                                status: editingEquipment.status,
                                notes: editingEquipment.notes,
                                equipment_name: editingEquipment.equipment_name,
                                equipment_model: editingEquipment.equipment_model,
                                equipment_type: editingEquipment.equipment_type,
                            } : undefined}
                        />
                    )}
                </div>
            </div>
        </div >
    );
}