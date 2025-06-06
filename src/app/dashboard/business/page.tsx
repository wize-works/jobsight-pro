"use client";

import { useState, useEffect } from "react";
import { useBusiness } from "@/lib/business-context";
import { updateBusinessFromForm } from "@/app/actions/business";
import { getUsers, deleteUser } from "@/app/actions/users";
import { sendUserInvitation, revokeUserInvitation, resendUserInvitation } from "@/app/actions/user-invitations";
import { toast } from "@/hooks/use-toast";
import { User, UserInsert, UserRole, userRoleOptions } from "@/types/users";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import PushManager from "@/components/push-manager";

function UsersPermissionsTab() {
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteFirstName, setInviteFirstName] = useState("");
    const [inviteLastName, setInviteLastName] = useState("");
    const [inviteRole, setInviteRole] = useState<"admin" | "manager" | "member">("member");
    const [inviting, setInviting] = useState(false);
    const { user: currentUser } = useKindeBrowserClient();
    const { businessData } = useBusiness();

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoadingUsers(true);
            const usersData = await getUsers();
            setUsers(usersData);
        } catch (error) {
            console.error("Error loading users:", error);
            toast.error("Failed to load users");
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleInviteUser = async () => {
        if (!inviteEmail || !inviteFirstName) {
            toast.error({
                title: "Error",
                description: "Please fill in all required fields",
            });
            return;
        }

        setInviting(true);
        try {
            const fullName = `${inviteFirstName} ${inviteLastName}`.trim();
            const result = await sendUserInvitation(inviteEmail, fullName, inviteRole);

            if (result.success && result.user) {
                setUsers(prev => [...prev, result.user]);
                setShowInviteModal(false);
                setInviteEmail("");
                setInviteFirstName("");
                setInviteLastName("");
                setInviteRole("member");
                toast({
                    title: "Invitation Sent",
                    description: `Invitation email sent to ${inviteEmail}`,
                });
            } else {
                toast.error({
                    title: "Failed to Send Invitation",
                    description: result.error || "Failed to invite user",
                });
            }
        } catch (error) {
            console.error("Error inviting user:", error);
            toast.error({
                title: "Error",
                description: "Failed to invite user",
            });
        } finally {
            setInviting(false);
        }
    };

    const handleRemoveUser = async (userId: string, userName: string, userStatus: string) => {
        if (!confirm(`Are you sure you want to remove ${userName} from your business?`)) {
            return;
        }

        try {
            let success = false;

            if (userStatus === 'invited') {
                // Revoke invitation for invited users
                const result = await revokeUserInvitation(userId);
                success = result.success;
            } else {
                // Delete user for active users
                success = await deleteUser(userId);
            }

            if (success) {
                setUsers(prev => prev.filter(user => user.id !== userId));
                toast({
                    title: "User Removed",
                    description: `${userName} has been removed from your business`,
                });
            } else {
                toast.error({
                    title: "Error",
                    description: "Failed to remove user",
                });
            }
        } catch (error) {
            console.error("Error removing user:", error);
            toast.error({
                title: "Error",
                description: "Failed to remove user",
            });
        }
    };

    const handleResendInvitation = async (userId: string, userEmail: string) => {
        try {
            const result = await resendUserInvitation(userId);

            if (result.success) {
                toast.success({
                    title: "Invitation Resent",
                    description: `Invitation email resent to ${userEmail}`,
                });
            } else {
                toast.error({
                    title: "Error",
                    description: result.error || "Failed to resend invitation",
                });
            }
        } catch (error) {
            console.error("Error resending invitation:", error);
            toast.error({
                title: "Error",
                description: "Failed to resend invitation",
            });
        }
    };

    const getUserInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="card-title text-xl">Users & Permissions</h2>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowInviteModal(true)}
                    >
                        <i className="fas fa-user-plus mr-2"></i> Invite User
                    </button>
                </div>

                {loadingUsers ? (
                    <div className="flex justify-center items-center h-32">
                        <span className="loading loading-spinner loading-md"></span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar">
                                                    <div className="avatar avatar-placeholder">
                                                        <div className="bg-secondary text-neutral-content w-12 rounded-full">
                                                            <span className="text-lg">{getUserInitials(`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || "U")}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">{`${user.first_name || ''} ${user.last_name || ''}`.trim() || "Unknown"}</div>
                                                    <div className="text-sm opacity-50">
                                                        {user.auth_id === currentUser?.id && "You"}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{user.email}</td>
                                        <td>
                                            {userRoleOptions.badge(user.role as UserRole)}
                                        </td>
                                        <td>
                                            <span className={`badge ${user.status === 'active' ? 'badge-success' :
                                                user.status === 'invited' ? 'badge-warning' :
                                                    'badge-error'
                                                }`}>
                                                {user.status || 'active'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                {user && user.email && user.status === 'invited' && (
                                                    <button
                                                        className="btn btn-sm btn-ghost text-primary"
                                                        onClick={() => handleResendInvitation(user.id, user.email)}
                                                        title="Resend invitation"
                                                    >
                                                        <i className="fas fa-paper-plane"></i>
                                                    </button>
                                                )}
                                                {user.auth_id !== currentUser?.id && (
                                                    <button
                                                        className="btn btn-sm btn-ghost text-error"
                                                        onClick={() => handleRemoveUser(user.id, `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email || "User", user.status || 'active')}
                                                        title={user.status === 'invited' ? 'Revoke invitation' : 'Remove user'}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-8 text-base-content/60">
                                            No users found. Invite your first team member!
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Role Permissions Section */}
                <div className="mt-8">
                    <h3 className="text-lg font-semibold mb-4">Role Permissions</h3>
                    <div className="overflow-x-auto">
                        <table className="table table-sm">
                            <thead>
                                <tr>
                                    <th>Permission</th>
                                    <th>Admin</th>
                                    <th>Manager</th>
                                    <th>Member</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>View Projects</td>
                                    <td><i className="fas fa-check text-success"></i></td>
                                    <td><i className="fas fa-check text-success"></i></td>
                                    <td><i className="fas fa-check text-success"></i></td>
                                </tr>
                                <tr>
                                    <td>Create/Edit Projects</td>
                                    <td><i className="fas fa-check text-success"></i></td>
                                    <td><i className="fas fa-check text-success"></i></td>
                                    <td><i className="fas fa-times text-error"></i></td>
                                </tr>
                                <tr>
                                    <td>Manage Users</td>
                                    <td><i className="fas fa-check text-success"></i></td>
                                    <td><i className="fas fa-times text-error"></i></td>
                                    <td><i className="fas fa-times text-error"></i></td>
                                </tr>
                                <tr>
                                    <td>Business Settings</td>
                                    <td><i className="fas fa-check text-success"></i></td>
                                    <td><i className="fas fa-times text-error"></i></td>
                                    <td><i className="fas fa-times text-error"></i></td>
                                </tr>
                                <tr>
                                    <td>View Reports</td>
                                    <td><i className="fas fa-check text-success"></i></td>
                                    <td><i className="fas fa-check text-success"></i></td>
                                    <td><i className="fas fa-check text-success"></i></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Invite User Modal */}
            {showInviteModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Invite New User</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">First Name *</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={inviteFirstName}
                                    onChange={(e) => setInviteFirstName(e.target.value)}
                                    placeholder="Enter first name"
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Last Name</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={inviteLastName}
                                    onChange={(e) => setInviteLastName(e.target.value)}
                                    placeholder="Enter last name"
                                />
                            </div>
                        </div>

                        <div className="form-control mb-4">
                            <label className="label">
                                <span className="label-text">Email Address *</span>
                            </label>
                            <input
                                type="email"
                                className="input input-bordered"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="Enter email address"
                            />
                        </div>

                        <div className="form-control mb-6">
                            <label className="label">
                                <span className="label-text">Role</span>
                            </label>
                            <select
                                className="select select-bordered"
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as "admin" | "manager" | "member")}
                            >
                                <option value="member">Member</option>
                                <option value="manager">Manager</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="modal-action">
                            <button
                                className="btn btn-ghost"
                                onClick={() => setShowInviteModal(false)}
                                disabled={inviting}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleInviteUser}
                                disabled={inviting}
                            >
                                {inviting ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm mr-2"></span>
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <i className="fas fa-paper-plane mr-2"></i>
                                        Send Invitation
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function BusinessPage() {
    const [activeTab, setActiveTab] = useState("profile");
    const { businessData, loading, error, refreshBusiness } = useBusiness();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSaveChanges = async (formData: FormData) => {
        setIsSubmitting(true);
        try {
            if (businessData?.id) {
                formData.append("id", businessData.id);
            }

            const result = await updateBusinessFromForm(formData);

            if (result.success) {
                await refreshBusiness();
                toast.success("Business information updated successfully");
            } else {
                toast.error("Failed to update business information");
            }
        } catch (error) {
            console.error("Error updating business:", error);
            toast.error("An error occurred while updating business information");
        } finally {
            setIsSubmitting(false);
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>
    }

    if (error) {
        return <div className="alert alert-error">Error loading business information: {error}</div>
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Business Management</h1>
            </div>

            <div className="tabs tabs-boxed mb-6">
                <a className={`tab ${activeTab === "profile" ? "tab-active" : ""}`} onClick={() => setActiveTab("profile")}>
                    Business Profile
                </a>
                <a className={`tab ${activeTab === "users" ? "tab-active" : ""}`} onClick={() => setActiveTab("users")}>
                    Users & Permissions
                </a>
                <a
                    className={`tab ${activeTab === "subscription" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("subscription")}
                >
                    Subscription
                </a>
                <a className={`tab ${activeTab === "branding" ? "tab-active" : ""}`} onClick={() => setActiveTab("branding")}>
                    Branding
                </a>
            </div>

            {activeTab === "profile" && (
                <form action={handleSaveChanges}>
                    <div className="grid grid-cols-2 gap-6 mb-4">
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="card-title text-xl">Business Information</h2>
                                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                                        <i className="fas fa-save mr-2"></i> {isSubmitting ? "Saving..." : "Save Changes"}
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Business Name</span>
                                        </label>
                                        <input type="text" name="name" className="input input-bordered w-full" defaultValue={businessData?.name || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Business Type</span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full"
                                            name="business_type"
                                            defaultValue={businessData?.business_type || ""}
                                        >
                                            <option value="General Contractor">General Contractor</option>
                                            <option value="Specialty Contractor">Specialty Contractor</option>
                                            <option value="Home Builder">Home Builder</option>
                                            <option value="Remodeler">Remodeler</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Phone Number</span>
                                        </label>
                                        <input type="tel" name="phone" className="input input-bordered w-full" defaultValue={businessData?.phone || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Email</span>
                                        </label>
                                        <input type="email" name="email" className="input input-bordered w-full" defaultValue={businessData?.email || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Website</span>
                                        </label>
                                        <input type="url" name="website" className="input input-bordered w-full" defaultValue={businessData?.website || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Logo Url</span>
                                        </label>
                                        <input type="url" name="logo_url" className="input input-bordered w-full" defaultValue={businessData?.logo_url || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Tax ID / EIN</span>
                                        </label>
                                        <input type="text" name="tax_id" className="input input-bordered w-full" defaultValue={businessData?.tax_id || ""} />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h2 className="card-title text-xl mb-4">Business Address</h2>
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                                    <div className="form-control md:col-span-6">
                                        <label className="label">
                                            <span className="label-text">Street Address</span>
                                        </label>
                                        <input type="text" name="address" className="input input-bordered w-full" defaultValue={businessData?.address || ""} />
                                    </div>

                                    <div className="form-control md:col-span-3">
                                        <label className="label">
                                            <span className="label-text">City</span>
                                        </label>
                                        <input type="text" name="city" className="input input-bordered w-full" defaultValue={businessData?.city || ""} />
                                    </div>                                    <div className="form-control md:col-span-1">
                                        <label className="label">
                                            <span className="label-text">State</span>
                                        </label>
                                        <select
                                            className="select select-bordered w-full"
                                            name="state"
                                            key={businessData?.state || "empty"}
                                            defaultValue={businessData?.state || ""}
                                        >
                                            <option value="">Select State</option>
                                            <option value="AL">AL - Alabama</option>
                                            <option value="AK">AK - Alaska</option>
                                            <option value="AZ">AZ - Arizona</option>
                                            <option value="AR">AR - Arkansas</option>
                                            <option value="CA">CA - California</option>
                                            <option value="CO">CO - Colorado</option>
                                            <option value="CT">CT - Connecticut</option>
                                            <option value="DE">DE - Delaware</option>
                                            <option value="FL">FL - Florida</option>
                                            <option value="GA">GA - Georgia</option>
                                            <option value="HI">HI - Hawaii</option>
                                            <option value="ID">ID - Idaho</option>
                                            <option value="IL">IL - Illinois</option>
                                            <option value="IN">IN - Indiana</option>
                                            <option value="IA">IA - Iowa</option>
                                            <option value="KS">KS - Kansas</option>
                                            <option value="KY">KY - Kentucky</option>
                                            <option value="LA">LA - Louisiana</option>
                                            <option value="ME">ME - Maine</option>
                                            <option value="MD">MD - Maryland</option>
                                            <option value="MA">MA - Massachusetts</option>
                                            <option value="MI">MI - Michigan</option>
                                            <option value="MN">MN - Minnesota</option>
                                            <option value="MS">MS - Mississippi</option>
                                            <option value="MO">MO - Missouri</option>
                                            <option value="MT">MT - Montana</option>
                                            <option value="NE">NE - Nebraska</option>
                                            <option value="NV">NV - Nevada</option>
                                            <option value="NH">NH - New Hampshire</option>
                                            <option value="NJ">NJ - New Jersey</option>
                                            <option value="NM">NM - New Mexico</option>
                                            <option value="NY">NY - New York</option>
                                            <option value="NC">NC - North Carolina</option>
                                            <option value="ND">ND - North Dakota</option>
                                            <option value="OH">OH - Ohio</option>
                                            <option value="OK">OK - Oklahoma</option>
                                            <option value="OR">OR - Oregon</option>
                                            <option value="PA">PA - Pennsylvania</option>
                                            <option value="RI">RI - Rhode Island</option>
                                            <option value="SC">SC - South Carolina</option>
                                            <option value="SD">SD - South Dakota</option>
                                            <option value="TN">TN - Tennessee</option>
                                            <option value="TX">TX - Texas</option>
                                            <option value="UT">UT - Utah</option>
                                            <option value="VT">VT - Vermont</option>
                                            <option value="VA">VA - Virginia</option>
                                            <option value="WA">WA - Washington</option>
                                            <option value="WV">WV - West Virginia</option>
                                            <option value="WI">WI - Wisconsin</option>
                                            <option value="WY">WY - Wyoming</option>
                                        </select>
                                    </div>

                                    <div className="form-control md:col-span-2">
                                        <label className="label">
                                            <span className="label-text">Zip Code</span>
                                        </label>
                                        <input type="text" name="zip" className="input input-bordered w-full" defaultValue={businessData?.zip || ""} />
                                    </div>

                                    <div className="form-control col-span-3">
                                        <label className="label">
                                            <span className="label-text">Country</span>
                                        </label>
                                        <select className="select select-bordered w-full" name="country" defaultValue={businessData?.country || ""} >
                                            <option value="United States">United States</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            )}

            {activeTab === "users" && <UsersPermissionsTab />}

            {activeTab === "subscription" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Subscription Details</h2>
                        {/* Subscription content... */}
                    </div>
                </div>
            )}

            {activeTab === "branding" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Branding</h2>
                        {/* Branding content... */}
                    </div>
                </div>
            )}
        </div>
    )
}
