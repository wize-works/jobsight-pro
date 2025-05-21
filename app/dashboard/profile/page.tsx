"use client"

import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { useState } from "react";

export default function ProfilePage() {
    const { user, isLoading } = useKindeAuth()
    const [activeTab, setActiveTab] = useState("profile")

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Profile Settings</h1>
                <button className="btn btn-primary">
                    <i className="fas fa-save mr-2"></i> Save Changes
                </button>
            </div>

            <div className="tabs tabs-boxed mb-6">
                <a className={`tab ${activeTab === "profile" ? "tab-active" : ""}`} onClick={() => setActiveTab("profile")}>
                    Personal Info
                </a>
                <a className={`tab ${activeTab === "account" ? "tab-active" : ""}`} onClick={() => setActiveTab("account")}>
                    Account Settings
                </a>
                <a
                    className={`tab ${activeTab === "notifications" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("notifications")}
                >
                    Notifications
                </a>
            </div>

            {activeTab === "profile" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex flex-col md:flex-row gap-8">
                            <div className="md:w-1/3 flex flex-col items-center">
                                <div className="avatar">
                                    <div className="w-32 rounded-full">
                                        <img src={user?.picture || "/placeholder.svg?height=128&width=128&query=avatar"} alt="Profile" />
                                    </div>
                                </div>
                                <div className="mt-4 space-y-2">
                                    <button className="btn btn-outline btn-sm w-full">
                                        <i className="fas fa-upload mr-2"></i> Upload Photo
                                    </button>
                                    <button className="btn btn-ghost btn-sm text-error w-full">
                                        <i className="fas fa-trash mr-2"></i> Remove
                                    </button>
                                </div>
                            </div>

                            <div className="md:w-2/3">
                                <h2 className="text-xl font-semibold mb-4">Personal Information</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">First Name</span>
                                        </label>
                                        <input type="text" className="input input-bordered" defaultValue={user?.given_name || ""} />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Last Name</span>
                                        </label>
                                        <input type="text" className="input input-bordered" defaultValue={user?.family_name || ""} />
                                    </div>
                                </div>

                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text">Email</span>
                                    </label>
                                    <input type="email" className="input input-bordered" defaultValue={user?.email || ""} disabled />
                                    <label className="label">
                                        <span className="label-text-alt">
                                            Email cannot be changed directly. Contact support for assistance.
                                        </span>
                                    </label>
                                </div>

                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text">Phone Number</span>
                                    </label>
                                    <input type="tel" className="input input-bordered" defaultValue="(555) 123-4567" />
                                </div>

                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text">Job Title</span>
                                    </label>
                                    <input type="text" className="input input-bordered" defaultValue="Project Manager" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "account" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="text-xl font-semibold mb-4">Account Settings</h2>

                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">Username</span>
                            </label>
                            <input type="text" className="input input-bordered" defaultValue={user?.email || ""} />
                        </div>

                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">Language</span>
                            </label>
                            <select className="select select-bordered w-full">
                                <option>English</option>
                                <option>Spanish</option>
                                <option>French</option>
                            </select>
                        </div>

                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">Time Zone</span>
                            </label>
                            <select className="select select-bordered w-full">
                                <option>Pacific Time (PT)</option>
                                <option>Mountain Time (MT)</option>
                                <option>Central Time (CT)</option>
                                <option>Eastern Time (ET)</option>
                            </select>
                        </div>

                        <div className="divider"></div>

                        <h3 className="text-lg font-semibold mb-4">Security</h3>

                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Change Password</span>
                            </label>
                            <button className="btn btn-outline">
                                <i className="fas fa-key mr-2"></i> Change Password
                            </button>
                        </div>

                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">Two-Factor Authentication</span>
                            </label>
                            <div className="flex items-center">
                                <button className="btn btn-outline">
                                    <i className="fas fa-shield-alt mr-2"></i> Enable 2FA
                                </button>
                                <span className="ml-4 text-sm text-base-content/70">Not enabled</span>
                            </div>
                        </div>

                        <div className="divider"></div>

                        <h3 className="text-lg font-semibold mb-4">Danger Zone</h3>

                        <div className="bg-error/10 p-4 rounded-lg">
                            <h4 className="font-semibold text-error">Delete Account</h4>
                            <p className="text-sm mb-4">Once you delete your account, there is no going back. Please be certain.</p>
                            <button className="btn btn-error">
                                <i className="fas fa-trash mr-2"></i> Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "notifications" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <h2 className="text-xl font-semibold mb-4">Notification Preferences</h2>

                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                                    <div>
                                        <span className="label-text font-medium block">Email Notifications</span>
                                        <span className="text-xs text-base-content/70">
                                            Receive email notifications for important updates
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                                    <div>
                                        <span className="label-text font-medium block">Push Notifications</span>
                                        <span className="text-xs text-base-content/70">
                                            Receive push notifications on your mobile device
                                        </span>
                                    </div>
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                                    <div>
                                        <span className="label-text font-medium block">In-App Notifications</span>
                                        <span className="text-xs text-base-content/70">Receive notifications within the application</span>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="divider"></div>

                        <h3 className="text-lg font-semibold mb-4">Notification Types</h3>

                        <div className="overflow-x-auto">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Notification Type</th>
                                        <th>Email</th>
                                        <th>Push</th>
                                        <th>In-App</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Project updates</td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Task assignments</td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Equipment alerts</td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Invoice updates</td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" />
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>System announcements</td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" />
                                        </td>
                                        <td>
                                            <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
