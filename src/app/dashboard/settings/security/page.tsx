
"use client"

import Link from "next/link";

export default function SecuritySettingsPage() {
    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">Security Settings</h1>
                </div>
            </div>

            <div className="space-y-6">
                {/* Password & Authentication */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Password & Authentication</h2>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                                <div>
                                    <h3 className="font-medium">Password</h3>
                                    <p className="text-sm text-base-content/70">Last changed 2 months ago</p>
                                </div>
                                <button className="btn btn-outline">
                                    <i className="fas fa-key mr-2"></i> Change Password
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                                <div>
                                    <h3 className="font-medium">Two-Factor Authentication</h3>
                                    <p className="text-sm text-base-content/70">Add an extra layer of security to your account</p>
                                </div>
                                <button className="btn btn-outline">
                                    <i className="fas fa-shield-alt mr-2"></i> Enable 2FA
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                                <div>
                                    <h3 className="font-medium">Backup Codes</h3>
                                    <p className="text-sm text-base-content/70">Generate backup codes for account recovery</p>
                                </div>
                                <button className="btn btn-outline" disabled>
                                    <i className="fas fa-download mr-2"></i> Generate Codes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Login Activity */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Login Activity</h2>
                        
                        <div className="space-y-3">
                            <div className="flex items-center justify-between p-3 bg-base-200 rounded">
                                <div className="flex items-center gap-3">
                                    <i className="fas fa-desktop text-primary"></i>
                                    <div>
                                        <p className="font-medium">Chrome on macOS</p>
                                        <p className="text-xs text-base-content/70">San Francisco, CA • Current session</p>
                                    </div>
                                </div>
                                <span className="badge badge-success">Active</span>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-base-200 rounded">
                                <div className="flex items-center gap-3">
                                    <i className="fas fa-mobile-alt text-warning"></i>
                                    <div>
                                        <p className="font-medium">Mobile App</p>
                                        <p className="text-xs text-base-content/70">San Francisco, CA • 2 hours ago</p>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-ghost text-error">
                                    <i className="fas fa-times mr-1"></i> Revoke
                                </button>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-base-200 rounded">
                                <div className="flex items-center gap-3">
                                    <i className="fas fa-laptop text-info"></i>
                                    <div>
                                        <p className="font-medium">Firefox on Windows</p>
                                        <p className="text-xs text-base-content/70">Oakland, CA • 1 day ago</p>
                                    </div>
                                </div>
                                <button className="btn btn-sm btn-ghost text-error">
                                    <i className="fas fa-times mr-1"></i> Revoke
                                </button>
                            </div>
                        </div>

                        <div className="mt-4">
                            <button className="btn btn-outline btn-sm">
                                <i className="fas fa-history mr-2"></i> View Full History
                            </button>
                        </div>
                    </div>
                </div>

                {/* Privacy */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Privacy</h2>

                        <div className="space-y-4">
                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                    <span className="label-text">Show my profile to other team members</span>
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input type="checkbox" className="checkbox checkbox-primary" defaultChecked />
                                    <span className="label-text">Allow others to see when I'm online</span>
                                </label>
                            </div>

                            <div className="form-control">
                                <label className="label cursor-pointer justify-start gap-4">
                                    <input type="checkbox" className="checkbox checkbox-primary" />
                                    <span className="label-text">Share usage analytics to help improve JobSight</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className="card bg-error/10 border border-error/20 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-error text-xl mb-4">
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            Danger Zone
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-semibold text-error mb-2">Download Your Data</h3>
                                <p className="text-sm mb-4">
                                    Export all your personal data associated with this account.
                                </p>
                                <button className="btn btn-outline btn-error">
                                    <i className="fas fa-download mr-2"></i> Export Data
                                </button>
                            </div>

                            <div className="divider"></div>

                            <div>
                                <h3 className="font-semibold text-error mb-2">Delete Account</h3>
                                <p className="text-sm mb-4">
                                    Once you delete your account, there is no going back. All your data will be permanently removed.
                                </p>
                                <button className="btn btn-error">
                                    <i className="fas fa-trash mr-2"></i> Delete Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
