import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { CrewWithDetails } from "@/types/crews";
import { CrewMember, CrewMemberInsert } from "@/types/crew-members";
import { CrewMemberAssignment } from "@/types/crew-member-assignments";
import { useCrews, useCrewMembers, useCrewAssignments } from "@/hooks/useCrews";
import { useBusiness } from "@/lib/business-context";
import { toast } from "@/hooks/use-toast";
import ModalLoading from "@/components/modal-loading";

// Lazy load sub-modals for better performance
const ModalMember = dynamic(() => import("./modal-member"), {
    loading: () => <ModalLoading message="Loading member form..." />,
    ssr: false
});

const ModalLink = dynamic(() => import("./modal-link"), {
    loading: () => <ModalLoading message="Loading link form..." />,
    ssr: false
});

interface ModalCrewMembersProps {
    crew: CrewWithDetails;
    isOpen: boolean;
    onClose: () => void;
    onRefresh?: () => void;
}

const ModalCrewMembers: React.FC<ModalCrewMembersProps> = ({
    crew,
    isOpen,
    onClose,
    onRefresh
}) => {
    const { businessId } = useBusiness();
    const { fetchCrewMembers, createCrewMember, updateCrewMember } = useCrewMembers();
    const { fetchCrewAssignments, createCrewAssignment, deleteCrewAssignment } = useCrewAssignments();

    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<CrewMember[]>([]);
    const [allMembers, setAllMembers] = useState<CrewMember[]>([]);
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [showLinkMemberModal, setShowLinkMemberModal] = useState(false);
    const [editingMember, setEditingMember] = useState<CrewMember | null>(null);
    const [showEditMemberModal, setShowEditMemberModal] = useState(false);

    // Load crew members and all available members
    useEffect(() => {
        if (isOpen && businessId) {
            loadData();
        }
    }, [isOpen, businessId, crew.id]); const loadData = async () => {
        try {
            setLoading(true);

            // Fetch crew members for this specific crew
            await fetchCrewMembers(crew.id);

            // Fetch all available members from the API
            const response = await fetch('/api/crew-members');
            if (response.ok) {
                const data = await response.json();
                setAllMembers(data.members || []);
            }

            // Get crew members from the crew data if available
            if (crew.members) {
                setMembers(crew.members);
            }
        } catch (error) {
            console.error("Error loading crew members:", error);
            toast({
                title: "Error",
                description: "Failed to load crew members. Please try again.",
            });
        } finally {
            setLoading(false);
        }
    }; const handleAddMember = async (formData: any) => {
        const memberData = {
            name: formData.name,
            role: formData.role,
            experience: formData.experience || 0,
            phone: formData.phone || "",
            email: formData.email || "",
            avatar_url: formData.avatar_url || `/diverse-avatars.png?height=40&width=40&query=avatar${Math.floor(Math.random() * 100)}`,
        } as CrewMemberInsert;

        try {
            const member = await createCrewMember(crew.id, memberData);

            if (!member) {
                toast({
                    title: "Error",
                    description: "Failed to create crew member. Please try again.",
                });
                throw new Error("Failed to create crew member");
            }

            if (member) {
                toast({
                    title: "Success",
                    description: `Added ${member.name} to the crew.`,
                });
            }

            setShowAddMemberModal(false);
            onRefresh?.();
            loadData();
            return { success: true };
        } catch (error) {
            toast({
                title: "Error",
                description: "Error adding crew member. Please try again.",
            });
            throw error;
        }
    };

    const handleLinkMember = async (formData: any) => {
        try {
            if (formData.memberId) {
                // Create assignment using direct API call
                const response = await fetch(`/api/crews/${crew.id}/assignments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        crew_member_id: formData.memberId,
                        role: 'member',
                        status: 'active'
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to create assignment');
                }

                toast({
                    title: "Success",
                    description: `Linked ${formData.member?.name || 'member'} to the crew.`,
                });
            }
            setShowLinkMemberModal(false);
            onRefresh?.();
            loadData();
            return { success: true };
        } catch (error) {
            toast({
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
            const result = await updateCrewMember(crew.id, formData.id, formData);

            if (result) {
                toast({
                    title: "Success",
                    description: `Updated ${formData.name} successfully.`,
                });

                setShowEditMemberModal(false);
                setEditingMember(null);
                onRefresh?.();
                loadData();
                return { success: true };
            } else {
                throw new Error("Failed to update crew member");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Error updating crew member. Please try again.",
            });
            return { success: false };
        }
    }; const handleRemoveMember = async (memberId: string, memberName: string) => {
        if (!window.confirm(`Are you sure you want to remove ${memberName} from the crew?`)) {
            return;
        }

        try {
            // Get assignments for this crew and find the specific assignment
            const response = await fetch(`/api/crews/${crew.id}/assignments`);
            if (!response.ok) {
                throw new Error('Failed to fetch assignments');
            }

            const data = await response.json();
            const assignments = data.assignments || [];
            const assignment = assignments.find((a: any) => a.crew_member_id === memberId);

            if (assignment) {
                // Delete the assignment
                const deleteResponse = await fetch(`/api/crews/${crew.id}/assignments/${assignment.id}`, {
                    method: 'DELETE'
                });

                if (!deleteResponse.ok) {
                    throw new Error('Failed to delete assignment');
                }

                toast({
                    title: "Success",
                    description: `Removed ${memberName} from the crew.`,
                });
                onRefresh?.();
                loadData();
            } else {
                throw new Error("Assignment not found");
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to remove crew member. Please try again.",
            });
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="modal modal-open">
                <div className="modal-box max-w-4xl p-0 rounded-lg flex flex-col" style={{ maxHeight: "90vh", height: "auto" }}>
                    {/* Modal Header */}
                    <div className="bg-primary text-primary-content p-6 rounded-t-lg flex-shrink-0">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold">Manage Crew Members</h2>
                                <p className="text-primary-content/80 mt-1">{crew.name}</p>
                            </div>
                            <button
                                type="button"
                                className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                                onClick={onClose}
                            >
                                <i className="far fa-times"></i>
                            </button>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="p-6 overflow-y-auto" style={{ maxHeight: "calc(90vh - 145px)" }}>
                        {loading ? (
                            <div className="flex justify-center items-center py-12">
                                <span className="loading loading-spinner loading-lg"></span>
                            </div>
                        ) : (
                            <>
                                {/* Action Buttons */}
                                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="stats shadow bg-base-200">
                                            <div className="stat px-4 py-2">
                                                <div className="stat-title text-xs">Total Members</div>
                                                <div className="stat-value text-lg">{members.length}</div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            className="btn btn-sm btn-primary"
                                            onClick={() => setShowAddMemberModal(true)}
                                        >
                                            <i className="far fa-user-plus mr-2"></i> Add New Member
                                        </button>
                                        <button
                                            className="btn btn-sm btn-secondary"
                                            onClick={() => setShowLinkMemberModal(true)}
                                        >
                                            <i className="far fa-link mr-2"></i> Link Existing Member
                                        </button>
                                    </div>
                                </div>

                                {/* Members List */}
                                {members.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="table table-zebra w-full">
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
                                                {members.map((member) => (
                                                    <tr key={member.id}>
                                                        <td>
                                                            <div className="flex items-center gap-3">
                                                                <div className="avatar">
                                                                    <div className="w-10 rounded-full">
                                                                        <img
                                                                            src={member.avatar_url || `/diverse-avatars.png`}
                                                                            alt={member.name}
                                                                        />
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
                                                        <td>
                                                            <span className="badge badge-outline">
                                                                {member.role}
                                                            </span>
                                                        </td>
                                                        <td>{member.experience || 0} years</td>
                                                        <td>
                                                            <div className="text-sm">
                                                                {member.phone && (
                                                                    <div><i className="far fa-phone mr-1"></i>{member.phone}</div>
                                                                )}
                                                                {member.email && (
                                                                    <div className="text-primary">
                                                                        <i className="far fa-envelope mr-1"></i>{member.email}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <div className="flex gap-1">
                                                                <button
                                                                    className="btn btn-ghost btn-xs"
                                                                    onClick={() => handleEditMember(member)}
                                                                    title="Edit member"
                                                                >
                                                                    <i className="far fa-edit"></i>
                                                                </button>
                                                                {member.id !== crew.leader_id && (
                                                                    <button
                                                                        className="btn btn-ghost btn-xs text-error"
                                                                        onClick={() => handleRemoveMember(member.id, member.name)}
                                                                        title="Remove from crew"
                                                                    >
                                                                        <i className="far fa-trash"></i>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <i className="far fa-users text-4xl text-base-content/30 mb-4"></i>
                                        <h3 className="text-lg font-semibold mb-2">No crew members added yet</h3>
                                        <p className="text-base-content/70 mb-4">
                                            Add crew members to start building your team
                                        </p>
                                        <div className="flex justify-center gap-2">
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => setShowAddMemberModal(true)}
                                            >
                                                <i className="far fa-user-plus mr-2"></i> Add First Member
                                            </button>
                                            <button
                                                className="btn btn-outline"
                                                onClick={() => setShowLinkMemberModal(true)}
                                            >
                                                <i className="far fa-link mr-2"></i> Link Existing Member
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Modal Footer */}
                    <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300 flex-shrink-0">
                        <div className="flex justify-end gap-3">
                            <button className="btn btn-outline" onClick={onClose}>
                                <i className="far fa-times mr-2"></i> Close
                            </button>
                        </div>
                    </div>
                </div>
                <form method="dialog" className="modal-backdrop">
                    <button onClick={onClose}>close</button>
                </form>
            </div>

            {/* Sub-modals */}
            {showAddMemberModal && (
                <ModalMember
                    title="Add New Crew Member"
                    loading={false}
                    onClose={() => setShowAddMemberModal(false)}
                    onSubmit={handleAddMember}
                />
            )}

            {showLinkMemberModal && (
                <ModalLink
                    title="Link Existing Member"
                    loading={false}
                    onClose={() => setShowLinkMemberModal(false)}
                    onSubmit={handleLinkMember}
                    allMembers={allMembers.filter(m => !members.find(cm => cm.id === m.id))}
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
        </>
    );
};

export default ModalCrewMembers;
