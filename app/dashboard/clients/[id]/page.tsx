"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

// Mock data for client details
const mockClient = {
  id: "1",
  name: "Acme Construction",
  logo: null,
  address: "123 Builder St, Construction City, CC 12345",
  website: "https://acmeconstruction.example.com",
  industry: "Commercial Construction",
  description:
    "Acme Construction is a leading commercial construction company specializing in office buildings and retail spaces.",
  status: "Active",
  contacts: [
    {
      id: "c1",
      name: "John Smith",
      title: "Project Manager",
      email: "john@acmeconstruction.com",
      phone: "(555) 123-4567",
      primary: true,
    },
    {
      id: "c2",
      name: "Jane Doe",
      title: "Financial Director",
      email: "jane@acmeconstruction.com",
      phone: "(555) 123-4568",
      primary: false,
    },
  ],
  projects: [
    {
      id: "p1",
      name: "Downtown Office Complex",
      status: "In Progress",
      startDate: "2023-03-15",
      endDate: "2023-12-30",
      value: 1250000,
    },
    {
      id: "p2",
      name: "Riverside Retail Center",
      status: "Planning",
      startDate: "2023-07-01",
      endDate: "2024-05-30",
      value: 850000,
    },
    {
      id: "p3",
      name: "Harbor View Apartments",
      status: "Completed",
      startDate: "2022-05-10",
      endDate: "2023-02-28",
      value: 2100000,
    },
  ],
  communications: [
    {
      id: "com1",
      type: "Email",
      date: "2023-05-15",
      subject: "Project Update - Downtown Office Complex",
      summary: "Sent weekly progress report and updated timeline.",
      contact: "John Smith",
    },
    {
      id: "com2",
      type: "Meeting",
      date: "2023-05-10",
      subject: "Riverside Retail Center Planning",
      summary: "Discussed initial plans and budget requirements.",
      contact: "John Smith, Jane Doe",
    },
    {
      id: "com3",
      type: "Phone Call",
      date: "2023-05-05",
      subject: "Invoice Payment",
      summary: "Discussed outstanding invoice for Harbor View project.",
      contact: "Jane Doe",
    },
  ],
  documents: [
    {
      id: "d1",
      name: "Master Service Agreement",
      type: "Contract",
      date: "2022-01-15",
      size: "2.4 MB",
    },
    {
      id: "d2",
      name: "Downtown Office Complex Contract",
      type: "Contract",
      date: "2023-03-10",
      size: "3.1 MB",
    },
    {
      id: "d3",
      name: "Riverside Retail Center Proposal",
      type: "Proposal",
      date: "2023-04-22",
      size: "1.8 MB",
    },
  ],
  invoices: [
    {
      id: "i1",
      number: "INV-2023-001",
      date: "2023-04-01",
      amount: 125000,
      status: "Paid",
      project: "Downtown Office Complex",
    },
    {
      id: "i2",
      number: "INV-2023-002",
      date: "2023-05-01",
      amount: 125000,
      status: "Pending",
      project: "Downtown Office Complex",
    },
    {
      id: "i3",
      number: "INV-2023-003",
      date: "2023-06-01",
      amount: 125000,
      status: "Upcoming",
      project: "Downtown Office Complex",
    },
  ],
}

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")

  // In a real app, you would fetch the client data based on the ID
  const client = mockClient

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => router.back()}>
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-base-content/70">Client ID: {client.id}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <Link href={`/dashboard/clients/${client.id}/edit`} className="btn btn-outline">
            <i className="fas fa-edit mr-2"></i>
            Edit Client
          </Link>
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn">
              <i className="fas fa-ellipsis-v mr-2"></i>
              Actions
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a>
                  <i className="fas fa-file-contract mr-2"></i>
                  Create Contract
                </a>
              </li>
              <li>
                <a>
                  <i className="fas fa-file-invoice-dollar mr-2"></i>
                  Create Invoice
                </a>
              </li>
              <li>
                <a>
                  <i className="fas fa-envelope mr-2"></i>
                  Send Email
                </a>
              </li>
              <li>
                <a>
                  <i className="fas fa-project-diagram mr-2"></i>
                  Create Project
                </a>
              </li>
              <li>
                <a className="text-error">
                  <i className="fas fa-trash mr-2"></i>
                  Delete Client
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-4">
                <div className="avatar placeholder">
                  <div className="bg-neutral text-neutral-content rounded-full w-16">
                    <span className="text-xl">{client.name.charAt(0)}</span>
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-bold">{client.name}</h2>
                  <p className="text-base-content/70">{client.industry}</p>
                </div>
                <span
                  className={`badge ml-auto ${
                    client.status === "Active"
                      ? "badge-success"
                      : client.status === "Potential"
                        ? "badge-warning"
                        : "badge-ghost"
                  }`}
                >
                  {client.status}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <h3 className="font-semibold mb-2">Contact Information</h3>
                  <p className="flex items-center gap-2 mb-1">
                    <i className="fas fa-map-marker-alt w-5 text-center"></i>
                    {client.address}
                  </p>
                  <p className="flex items-center gap-2 mb-1">
                    <i className="fas fa-globe w-5 text-center"></i>
                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="link">
                      {client.website}
                    </a>
                  </p>
                  <p className="flex items-center gap-2 mb-1">
                    <i className="fas fa-envelope w-5 text-center"></i>
                    <a href={`mailto:${client.contacts[0].email}`} className="link">
                      {client.contacts[0].email}
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <i className="fas fa-phone w-5 text-center"></i>
                    <a href={`tel:${client.contacts[0].phone}`} className="link">
                      {client.contacts[0].phone}
                    </a>
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Primary Contact</h3>
                  <p className="flex items-center gap-2 mb-1">
                    <i className="fas fa-user w-5 text-center"></i>
                    {client.contacts[0].name}
                  </p>
                  <p className="flex items-center gap-2 mb-1">
                    <i className="fas fa-briefcase w-5 text-center"></i>
                    {client.contacts[0].title}
                  </p>
                  <p className="flex items-center gap-2 mb-1">
                    <i className="fas fa-envelope w-5 text-center"></i>
                    <a href={`mailto:${client.contacts[0].email}`} className="link">
                      {client.contacts[0].email}
                    </a>
                  </p>
                  <p className="flex items-center gap-2">
                    <i className="fas fa-phone w-5 text-center"></i>
                    <a href={`tel:${client.contacts[0].phone}`} className="link">
                      {client.contacts[0].phone}
                    </a>
                  </p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p>{client.description}</p>
              </div>
            </div>

            <div className="divider md:divider-horizontal"></div>

            <div className="md:w-64">
              <h3 className="font-semibold mb-2">Quick Stats</h3>
              <div className="stats stats-vertical shadow w-full">
                <div className="stat">
                  <div className="stat-title">Projects</div>
                  <div className="stat-value text-primary">{client.projects.length}</div>
                  <div className="stat-desc">
                    {client.projects.filter((p) => p.status === "In Progress").length} active
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Invoices</div>
                  <div className="stat-value text-secondary">{client.invoices.length}</div>
                  <div className="stat-desc">
                    {client.invoices.filter((i) => i.status === "Pending").length} pending
                  </div>
                </div>
                <div className="stat">
                  <div className="stat-title">Total Value</div>
                  <div className="stat-value">
                    ${client.projects.reduce((sum, project) => sum + project.value, 0).toLocaleString()}
                  </div>
                  <div className="stat-desc">Lifetime project value</div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold mb-2">Recent Activity</h3>
                <ul className="timeline timeline-compact timeline-snap-icon max-md:timeline-compact timeline-vertical">
                  {client.communications.slice(0, 3).map((comm, index) => (
                    <li key={comm.id}>
                      {index > 0 && <hr />}
                      <div className="timeline-middle">
                        <i
                          className={`fas ${
                            comm.type === "Email"
                              ? "fa-envelope"
                              : comm.type === "Meeting"
                                ? "fa-handshake"
                                : "fa-phone"
                          } text-primary`}
                        ></i>
                      </div>
                      <div className="timeline-end mb-4">
                        <time className="font-mono">{new Date(comm.date).toLocaleDateString()}</time>
                        <div className="text-sm">{comm.subject}</div>
                      </div>
                      {index < client.communications.length - 1 && <hr />}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tabs tabs-boxed mb-6">
        <a className={`tab ${activeTab === "overview" ? "tab-active" : ""}`} onClick={() => setActiveTab("overview")}>
          Overview
        </a>
        <a className={`tab ${activeTab === "projects" ? "tab-active" : ""}`} onClick={() => setActiveTab("projects")}>
          Projects
        </a>
        <a className={`tab ${activeTab === "contacts" ? "tab-active" : ""}`} onClick={() => setActiveTab("contacts")}>
          Contacts
        </a>
        <a
          className={`tab ${activeTab === "communication" ? "tab-active" : ""}`}
          onClick={() => setActiveTab("communication")}
        >
          Communication
        </a>
        <a className={`tab ${activeTab === "documents" ? "tab-active" : ""}`} onClick={() => setActiveTab("documents")}>
          Documents
        </a>
        <a className={`tab ${activeTab === "invoices" ? "tab-active" : ""}`} onClick={() => setActiveTab("invoices")}>
          Invoices
        </a>
        <a className={`tab ${activeTab === "portal" ? "tab-active" : ""}`} onClick={() => setActiveTab("portal")}>
          Portal Access
        </a>
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">
                <i className="fas fa-project-diagram text-primary mr-2"></i>
                Active Projects
              </h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Project Name</th>
                      <th>Status</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.projects
                      .filter((project) => project.status !== "Completed")
                      .map((project) => (
                        <tr key={project.id}>
                          <td>
                            <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:text-primary">
                              {project.name}
                            </Link>
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                project.status === "In Progress"
                                  ? "badge-success"
                                  : project.status === "Planning"
                                    ? "badge-info"
                                    : "badge-ghost"
                              }`}
                            >
                              {project.status}
                            </span>
                          </td>
                          <td>${project.value.toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="card-actions justify-end mt-4">
                <Link href="/dashboard/projects/create" className="btn btn-primary btn-sm">
                  <i className="fas fa-plus mr-2"></i>
                  New Project
                </Link>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">
                <i className="fas fa-file-invoice-dollar text-primary mr-2"></i>
                Recent Invoices
              </h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td>
                          <Link href={`/dashboard/invoices/${invoice.id}`} className="font-medium hover:text-primary">
                            {invoice.number}
                          </Link>
                        </td>
                        <td>{new Date(invoice.date).toLocaleDateString()}</td>
                        <td>${invoice.amount.toLocaleString()}</td>
                        <td>
                          <span
                            className={`badge ${
                              invoice.status === "Paid"
                                ? "badge-success"
                                : invoice.status === "Pending"
                                  ? "badge-warning"
                                  : "badge-ghost"
                            }`}
                          >
                            {invoice.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card-actions justify-end mt-4">
                <Link href="/dashboard/invoices/create" className="btn btn-primary btn-sm">
                  <i className="fas fa-plus mr-2"></i>
                  New Invoice
                </Link>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">
                <i className="fas fa-comments text-primary mr-2"></i>
                Recent Communications
              </h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Subject</th>
                      <th>Contact</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.communications.map((comm) => (
                      <tr key={comm.id}>
                        <td>{new Date(comm.date).toLocaleDateString()}</td>
                        <td>
                          <span
                            className={`badge ${
                              comm.type === "Email"
                                ? "badge-info"
                                : comm.type === "Meeting"
                                  ? "badge-success"
                                  : "badge-warning"
                            }`}
                          >
                            {comm.type}
                          </span>
                        </td>
                        <td>{comm.subject}</td>
                        <td>{comm.contact}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-primary btn-sm">
                  <i className="fas fa-plus mr-2"></i>
                  Log Communication
                </button>
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">
                <i className="fas fa-file-contract text-primary mr-2"></i>
                Documents
              </h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {client.documents.map((doc) => (
                      <tr key={doc.id}>
                        <td className="font-medium">{doc.name}</td>
                        <td>
                          <span
                            className={`badge ${
                              doc.type === "Contract"
                                ? "badge-primary"
                                : doc.type === "Proposal"
                                  ? "badge-secondary"
                                  : "badge-ghost"
                            }`}
                          >
                            {doc.type}
                          </span>
                        </td>
                        <td>{new Date(doc.date).toLocaleDateString()}</td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-ghost btn-square">
                              <i className="fas fa-download"></i>
                            </button>
                            <button className="btn btn-sm btn-ghost btn-square">
                              <i className="fas fa-eye"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="card-actions justify-end mt-4">
                <button className="btn btn-primary btn-sm">
                  <i className="fas fa-plus mr-2"></i>
                  Upload Document
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "projects" && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h2 className="card-title">
                <i className="fas fa-project-diagram text-primary mr-2"></i>
                Projects
              </h2>
              <Link href="/dashboard/projects/create" className="btn btn-primary">
                <i className="fas fa-plus mr-2"></i>
                New Project
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th>Project Name</th>
                    <th>Status</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Value</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {client.projects.map((project) => (
                    <tr key={project.id}>
                      <td>
                        <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:text-primary">
                          {project.name}
                        </Link>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            project.status === "In Progress"
                              ? "badge-success"
                              : project.status === "Planning"
                                ? "badge-info"
                                : project.status === "Completed"
                                  ? "badge-ghost"
                                  : "badge-warning"
                          }`}
                        >
                          {project.status}
                        </span>
                      </td>
                      <td>{new Date(project.startDate).toLocaleDateString()}</td>
                      <td>{new Date(project.endDate).toLocaleDateString()}</td>
                      <td>${project.value.toLocaleString()}</td>
                      <td>
                        <div className="flex gap-2">
                          <Link href={`/dashboard/projects/${project.id}`} className="btn btn-sm btn-ghost btn-square">
                            <i className="fas fa-eye"></i>
                          </Link>
                          <Link
                            href={`/dashboard/projects/${project.id}/edit`}
                            className="btn btn-sm btn-ghost btn-square"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs would be implemented similarly */}
      {activeTab !== "overview" && activeTab !== "projects" && (
        <div className="card bg-base-100 shadow-md">
          <div className="card-body">
            <h2 className="card-title">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Content</h2>
            <p>This tab is under development. Please check back later.</p>
          </div>
        </div>
      )}
    </div>
  )
}
