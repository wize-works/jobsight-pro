"use client"

import { useState } from "react"

export default function BusinessPage() {
  const [activeTab, setActiveTab] = useState("profile")

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Business Management</h1>
        <button className="btn btn-primary">
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

      {activeTab === "profile" && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Business Information</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Business Name</span>
                </label>
                <input type="text" className="input input-bordered" defaultValue="Acme Construction" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Business Type</span>
                </label>
                <select className="select select-bordered w-full">
                  <option>General Contractor</option>
                  <option>Specialty Contractor</option>
                  <option>Home Builder</option>
                  <option>Remodeler</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Phone Number</span>
                </label>
                <input type="tel" className="input input-bordered" defaultValue="(555) 123-4567" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Email</span>
                </label>
                <input type="email" className="input input-bordered" defaultValue="info@acmeconstruction.com" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Website</span>
                </label>
                <input type="url" className="input input-bordered" defaultValue="https://acmeconstruction.com" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tax ID / EIN</span>
                </label>
                <input type="text" className="input input-bordered" defaultValue="12-3456789" />
              </div>
            </div>

            <h3 className="text-lg font-semibold mt-6 mb-4">Address</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Street Address</span>
                </label>
                <input type="text" className="input input-bordered" defaultValue="123 Main Street" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Suite/Unit</span>
                </label>
                <input type="text" className="input input-bordered" defaultValue="Suite 200" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">City</span>
                </label>
                <input type="text" className="input input-bordered" defaultValue="Springfield" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">State</span>
                </label>
                <select className="select select-bordered w-full">
                  <option>California</option>
                  <option>Texas</option>
                  <option>New York</option>
                  <option>Florida</option>
                  <option>Illinois</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Zip Code</span>
                </label>
                <input type="text" className="input input-bordered" defaultValue="12345" />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Country</span>
                </label>
                <select className="select select-bordered w-full">
                  <option>United States</option>
                  <option>Canada</option>
                  <option>Mexico</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

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
                            <img src="/placeholder.svg?height=40&width=40&query=avatar1" alt="User avatar" />
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
                  <tr>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 rounded-full">
                            <img src="/placeholder.svg?height=40&width=40&query=avatar2" alt="User avatar" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">Sarah Johnson</div>
                          <div className="text-sm opacity-50">Project Manager</div>
                        </div>
                      </div>
                    </td>
                    <td>sarah.j@example.com</td>
                    <td>Supervisor</td>
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
                  <tr>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 rounded-full">
                            <img src="/placeholder.svg?height=40&width=40&query=avatar3" alt="User avatar" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">Mike Wilson</div>
                          <div className="text-sm opacity-50">Foreman</div>
                        </div>
                      </div>
                    </td>
                    <td>mike.w@example.com</td>
                    <td>Field Worker</td>
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
                  <tr>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="avatar">
                          <div className="w-10 rounded-full">
                            <img src="/placeholder.svg?height=40&width=40&query=avatar4" alt="User avatar" />
                          </div>
                        </div>
                        <div>
                          <div className="font-bold">Emily Clark</div>
                          <div className="text-sm opacity-50">Office Manager</div>
                        </div>
                      </div>
                    </td>
                    <td>emily.c@example.com</td>
                    <td>Supervisor</td>
                    <td>
                      <span className="badge badge-warning">Pending</span>
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
                </tbody>
              </table>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Role Permissions</h3>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Permission</th>
                      <th>Admin</th>
                      <th>Supervisor</th>
                      <th>Field Worker</th>
                      <th>Client</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>View Dashboard</td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-times text-error"></i>
                      </td>
                    </tr>
                    <tr>
                      <td>Manage Users</td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-times text-error"></i>
                      </td>
                      <td>
                        <i className="fas fa-times text-error"></i>
                      </td>
                      <td>
                        <i className="fas fa-times text-error"></i>
                      </td>
                    </tr>
                    <tr>
                      <td>Create Projects</td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-times text-error"></i>
                      </td>
                      <td>
                        <i className="fas fa-times text-error"></i>
                      </td>
                    </tr>
                    <tr>
                      <td>Manage Invoices</td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-times text-error"></i>
                      </td>
                      <td>
                        <i className="fas fa-times text-error"></i>
                      </td>
                    </tr>
                    <tr>
                      <td>Submit Daily Logs</td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-times text-error"></i>
                      </td>
                    </tr>
                    <tr>
                      <td>View Invoices</td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                      <td>
                        <i className="fas fa-times text-error"></i>
                      </td>
                      <td>
                        <i className="fas fa-check text-success"></i>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "subscription" && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Subscription Details</h2>

            <div className="bg-base-200 p-6 rounded-lg mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-primary p-3">
                  <i className="fas fa-crown text-primary-content text-xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Pro Plan</h3>
                  <p className="text-base-content/70">$49/month, billed monthly</p>
                </div>
                <div className="ml-auto">
                  <span className="badge badge-warning">Trial</span>
                </div>
              </div>

              <div className="divider"></div>

              <div className="flex justify-between mb-2">
                <span>Trial Period:</span>
                <span>23 days remaining</span>
              </div>

              <div className="flex justify-between mb-2">
                <span>Next Billing Date:</span>
                <span>June 12, 2025</span>
              </div>

              <div className="flex justify-between mb-2">
                <span>Users:</span>
                <span>4 of 10 included users</span>
              </div>

              <div className="flex justify-between mb-2">
                <span>Storage:</span>
                <span>1.2GB of 5GB used</span>
              </div>

              <div className="mt-6 flex gap-4">
                <button className="btn btn-primary">
                  <i className="fas fa-credit-card mr-2"></i> Add Payment Method
                </button>
                <button className="btn btn-outline">
                  <i className="fas fa-arrow-up mr-2"></i> Upgrade Plan
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Available Plans</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h3 className="font-bold text-lg">Starter</h3>
                  <p className="text-xl">
                    $9.99
                    <span className="text-sm text-base-content/70">/mo</span>
                  </p>
                  <p className="text-sm">1 user included</p>
                  <button className="btn btn-sm btn-outline mt-4">Current Plan</button>
                </div>
              </div>

              <div className="card bg-primary text-primary-content">
                <div className="card-body p-4">
                  <h3 className="font-bold text-lg">Pro</h3>
                  <p className="text-xl">
                    $49
                    <span className="text-sm opacity-80">/mo</span>
                  </p>
                  <p className="text-sm">Up to 10 users</p>
                  <button className="btn btn-sm btn-secondary mt-4">Current Plan</button>
                </div>
              </div>

              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h3 className="font-bold text-lg">Business</h3>
                  <p className="text-xl">
                    $149
                    <span className="text-sm text-base-content/70">/mo</span>
                  </p>
                  <p className="text-sm">Up to 50 users</p>
                  <button className="btn btn-sm btn-primary mt-4">Upgrade</button>
                </div>
              </div>

              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h3 className="font-bold text-lg">Enterprise</h3>
                  <p className="text-xl">
                    $500
                    <span className="text-sm text-base-content/70">/mo</span>
                  </p>
                  <p className="text-sm">Unlimited users</p>
                  <button className="btn btn-sm btn-primary mt-4">Upgrade</button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Billing History</h3>

              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Invoice</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>May 12, 2025</td>
                      <td>Pro Plan - Monthly</td>
                      <td>$0.00</td>
                      <td>
                        <span className="badge badge-success">Trial</span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-ghost">
                          <i className="fas fa-download"></i>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "branding" && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Branding</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Logo</h3>

                <div className="flex items-center gap-4 mb-4">
                  <div className="avatar">
                    <div className="w-24 rounded">
                      <img
                        src="/placeholder.svg?height=96&width=96&query=construction company logo"
                        alt="Company logo"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button className="btn btn-sm btn-outline">
                      <i className="fas fa-upload mr-2"></i> Upload New Logo
                    </button>
                    <button className="btn btn-sm btn-ghost text-error">
                      <i className="fas fa-trash mr-2"></i> Remove
                    </button>
                  </div>
                </div>

                <p className="text-sm text-base-content/70">
                  Recommended size: 512x512px. Max file size: 2MB. Supported formats: PNG, JPG, SVG.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Colors</h3>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Primary Color</span>
                  </label>
                  <div className="flex gap-2">
                    <input type="color" className="input input-bordered w-16 h-10 p-1" defaultValue="#F87431" />
                    <input type="text" className="input input-bordered" defaultValue="#F87431" />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Secondary Color</span>
                  </label>
                  <div className="flex gap-2">
                    <input type="color" className="input input-bordered w-16 h-10 p-1" defaultValue="#02ACA3" />
                    <input type="text" className="input input-bordered" defaultValue="#02ACA3" />
                  </div>
                </div>
              </div>
            </div>

            <div className="divider"></div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Email Templates</h3>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Email Header</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  defaultValue="<h1>{{company_name}}</h1>"
                ></textarea>
              </div>

              <div className="form-control mb-4">
                <label className="label">
                  <span className="label-text">Email Footer</span>
                </label>
                <textarea
                  className="textarea textarea-bordered h-24"
                  defaultValue="<p>© {{current_year}} {{company_name}}. All rights reserved.</p>"
                ></textarea>
              </div>

              <div className="flex justify-end">
                <button className="btn btn-primary">
                  <i className="fas fa-eye mr-2"></i> Preview Email
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
