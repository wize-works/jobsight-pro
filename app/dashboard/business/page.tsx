"use client"

import { useState } from "react"
import { useBusiness } from "@/hooks/use-business"
import { toast } from "react-hot-toast"

export default function BusinessPage() {
    const [activeTab, setActiveTab] = useState("profile")
    const { business, loading, error, update } = useBusiness()

    const handleSaveChanges = async () => {
        // Get form data
        const form = document.getElementById("business-form") as HTMLFormElement
        const formData = new FormData(form)

        // Convert FormData to object
        const data = Object.fromEntries(formData.entries())

        // Update business
        const result = await update(data)

        if (result.success) {
            toast.success("Business information updated successfully")
        } else {
            toast.error("Failed to update business information")
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-64">Loading...</div>
    }

    if (error) {
        return <div className="alert alert-error">Error loading business information: {error.message}</div>
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Business Management</h1>
                <button className="btn btn-primary" onClick={handleSaveChanges}>
                    <i className="fas fa-save mr-2"></i> Save Changes
                </button>
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

            <form id="business-form">
                {activeTab === "profile" && (
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4">Business Information</h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Business Name</span>
                                    </label>
                                    <input type="text" name="name" className="input input-bordered" defaultValue={business?.name || ""} />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Business Type</span>
                                    </label>
                                    <select className="select select-bordered w-full" name="industry" defaultValue={business?.business_type || ""}>
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
                                    <input
                                        type="tel"
                                        name="phone"
                                        className="input input-bordered"
                                        defaultValue={business?.phone || ""}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Email</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        className="input input-bordered"
                                        defaultValue={business?.email || ""}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Website</span>
                                    </label>
                                    <input
                                        type="url"
                                        name="website"
                                        className="input input-bordered"
                                        defaultValue={business?.website || ""}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Tax ID / EIN</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="tax_id"
                                        className="input input-bordered"
                                        defaultValue={business?.tax_id || ""}
                                    />
                                </div>
                            </div>

                            <h3 className="text-lg font-semibold mt-6 mb-4">Address</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Street Address</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        className="input input-bordered"
                                        defaultValue={business?.address || ""}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">City</span>
                                    </label>
                                    <input type="text" name="city" className="input input-bordered" defaultValue={business?.city || ""} />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">State</span>
                                    </label>
                                    <select className="select select-bordered w-full" name="state" value={business?.state || ""}>
                                        <option value="California">California</option>
                                        <option value="Texas">Texas</option>
                                        <option value="New York">New York</option>
                                        <option value="Florida">Florida</option>
                                        <option value="Illinois">Illinois</option>
                                    </select>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Zip Code</span>
                                    </label>
                                    <input type="text" name="zip" className="input input-bordered" defaultValue={business?.zip || ""} />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Country</span>
                                    </label>
                                    <select className="select select-bordered w-full" name="country" value={business?.country || ""}>
                                        <option value="United States">United States</option>
                                        <option value="Canada">Canada</option>
                                        <option value="Mexico">Mexico</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </form>

            {activeTab === "users" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="card-title text-xl">Users & Permissions</h2>
                            <button className="btn btn-primary">
                                <i className="fas fa-user-plus mr-2"></i> Invite User
                            </button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>
                                            <div className="flex items-center gap-3">
                                                <div className="avatar">
                                                    <div className="w-10 rounded-full">
                                                        <img src="/diverse-group-avatars.png" alt="User avatar" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="font-bold">John Doe</div>
                                                    <div className="text-sm opacity-50">Owner</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>john.doe@example.com</td>
                                        <td>Admin</td>
                                        <td>
                                            <span className="badge badge-success">Active</span>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button className="btn btn-sm btn-ghost">
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button className="btn btn-sm btn-ghost text-error">
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                    {/* More users... */}
                                </tbody>
                            </table>
                        </div>

                        {/* Role permissions table... */}
                    </div>
                </div>
            )}

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
