"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"

// Mock data for crew members
const crewMembers = {
  crew1: [
    {
      id: "m1",
      name: "Mike Wilson",
      role: "Foreman",
      experience: "8 years",
      phone: "(555) 123-4567",
      email: "mike.w@example.com",
    },
    {
      id: "m2",
      name: "John Smith",
      role: "Operator",
      experience: "5 years",
      phone: "(555) 234-5678",
      email: "john.s@example.com",
    },
    {
      id: "m3",
      name: "Robert Johnson",
      role: "Laborer",
      experience: "3 years",
      phone: "(555) 345-6789",
      email: "robert.j@example.com",
    },
    {
      id: "m4",
      name: "Emily Davis",
      role: "Carpenter",
      experience: "6 years",
      phone: "(555) 456-7890",
      email: "emily.d@example.com",
    },
    {
      id: "m5",
      name: "Michael Brown",
      role: "Laborer",
      experience: "2 years",
      phone: "(555) 567-8901",
      email: "michael.b@example.com",
    },
  ],
  crew2: [
    {
      id: "m6",
      name: "Sarah Johnson",
      role: "Foreman",
      experience: "10 years",
      phone: "(555) 678-9012",
      email: "sarah.j@example.com",
    },
    {
      id: "m7",
      name: "David Lee",
      role: "Framer",
      experience: "7 years",
      phone: "(555) 789-0123",
      email: "david.l@example.com",
    },
    {
      id: "m8",
      name: "Jessica Wilson",
      role: "Framer",
      experience: "4 years",
      phone: "(555) 890-1234",
      email: "jessica.w@example.com",
    },
    {
      id: "m9",
      name: "Thomas Moore",
      role: "Framer",
      experience: "6 years",
      phone: "(555) 901-2345",
      email: "thomas.m@example.com",
    },
    {
      id: "m10",
      name: "Daniel White",
      role: "Apprentice",
      experience: "1 year",
      phone: "(555) 012-3456",
      email: "daniel.w@example.com",
    },
    {
      id: "m11",
      name: "Christopher Adams",
      role: "Framer",
      experience: "5 years",
      phone: "(555) 123-4567",
      email: "chris.a@example.com",
    },
    {
      id: "m12",
      name: "Amanda Clark",
      role: "Apprentice",
      experience: "2 years",
      phone: "(555) 234-5678",
      email: "amanda.c@example.com",
    },
  ],
  crew3: [
    {
      id: "m13",
      name: "David Martinez",
      role: "Master Electrician",
      experience: "12 years",
      phone: "(555) 345-6789",
      email: "david.m@example.com",
    },
    {
      id: "m14",
      name: "Steven Taylor",
      role: "Journeyman Electrician",
      experience: "8 years",
      phone: "(555) 456-7890",
      email: "steven.t@example.com",
    },
    {
      id: "m15",
      name: "Lisa Rodriguez",
      role: "Apprentice Electrician",
      experience: "3 years",
      phone: "(555) 567-8901",
      email: "lisa.r@example.com",
    },
    {
      id: "m16",
      name: "Kevin Wilson",
      role: "Journeyman Electrician",
      experience: "6 years",
      phone: "(555) 678-9012",
      email: "kevin.w@example.com",
    },
  ],
  crew4: [
    {
      id: "m17",
      name: "Lisa Chen",
      role: "Master Plumber",
      experience: "15 years",
      phone: "(555) 789-0123",
      email: "lisa.c@example.com",
    },
    {
      id: "m18",
      name: "Mark Johnson",
      role: "Journeyman Plumber",
      experience: "9 years",
      phone: "(555) 890-1234",
      email: "mark.j@example.com",
    },
    {
      id: "m19",
      name: "Patricia Davis",
      role: "Apprentice Plumber",
      experience: "2 years",
      phone: "(555) 901-2345",
      email: "patricia.d@example.com",
    },
  ],
  crew5: [
    {
      id: "m20",
      name: "James Taylor",
      role: "Finishing Foreman",
      experience: "14 years",
      phone: "(555) 012-3456",
      email: "james.t@example.com",
    },
    {
      id: "m21",
      name: "Robert Brown",
      role: "Painter",
      experience: "8 years",
      phone: "(555) 123-4567",
      email: "robert.b@example.com",
    },
    {
      id: "m22",
      name: "Jennifer Wilson",
      role: "Painter",
      experience: "6 years",
      phone: "(555) 234-5678",
      email: "jennifer.w@example.com",
    },
    {
      id: "m23",
      name: "Michael Davis",
      role: "Drywall Installer",
      experience: "9 years",
      phone: "(555) 345-6789",
      email: "michael.d@example.com",
    },
    {
      id: "m24",
      name: "Susan Miller",
      role: "Drywall Installer",
      experience: "7 years",
      phone: "(555) 456-7890",
      email: "susan.m@example.com",
    },
    {
      id: "m25",
      name: "William Johnson",
      role: "Trim Carpenter",
      experience: "10 years",
      phone: "(555) 567-8901",
      email: "william.j@example.com",
    },
  ],
}

// Mock data for crews
const crewsData = {
  crew1: {
    id: "crew1",
    name: "Foundation Team",
    leader: "Mike Wilson",
    members: 5,
    currentProject: "Main Street Development",
    status: "active",
    specialty: "Concrete and Foundation Work",
    certifications: ["OSHA 30", "Concrete Finishing", "Heavy Equipment Operation"],
    notes: "Specialized in commercial foundation projects. Team has worked together for 3+ years.",
  },
  crew2: {
    id: "crew2",
    name: "Framing Crew",
    leader: "Sarah Johnson",
    members: 7,
    currentProject: "Riverside Apartments",
    status: "active",
    specialty: "Residential and Commercial Framing",
    certifications: ["OSHA 10", "Fall Protection", "Scaffold Safety"],
    notes: "Excellent team for multi-story framing projects. Very efficient with minimal waste.",
  },
  crew3: {
    id: "crew3",
    name: "Electrical Team",
    leader: "David Martinez",
    members: 4,
    currentProject: "Downtown Project",
    status: "active",
    specialty: "Commercial Electrical",
    certifications: ["Master Electrician License", "OSHA 10", "Arc Flash Safety"],
    notes: "Specialized in commercial electrical installations and troubleshooting.",
  },
  crew4: {
    id: "crew4",
    name: "Plumbing Specialists",
    leader: "Lisa Chen",
    members: 3,
    currentProject: null,
    status: "available",
    specialty: "Commercial and Residential Plumbing",
    certifications: ["Master Plumber License", "Backflow Prevention", "OSHA 10"],
    notes: "Small but highly skilled team. Great for complex plumbing installations.",
  },
  crew5: {
    id: "crew5",
    name: "Finishing Crew",
    leader: "James Taylor",
    members: 6,
    currentProject: "Johnson Residence",
    status: "active",
    specialty: "Interior Finishing",
    certifications: ["Lead Paint Certification", "OSHA 10", "Fine Carpentry"],
    notes: "Excellent attention to detail. Specialized in high-end residential finishing work.",
  },
}

// Mock data for crew schedule
const crewSchedule = {
  crew1: [
    { date: "2025-05-20", project: "Main Street Development", task: "Foundation pouring", hours: 8 },
    { date: "2025-05-21", project: "Main Street Development", task: "Foundation finishing", hours: 8 },
    { date: "2025-05-22", project: "Main Street Development", task: "Waterproofing", hours: 8 },
    { date: "2025-05-23", project: "Main Street Development", task: "Backfilling", hours: 8 },
    { date: "2025-05-24", project: "Main Street Development", task: "Site cleanup", hours: 4 },
  ],
  crew2: [
    { date: "2025-05-20", project: "Riverside Apartments", task: "First floor framing", hours: 8 },
    { date: "2025-05-21", project: "Riverside Apartments", task: "First floor framing", hours: 8 },
    { date: "2025-05-22", project: "Riverside Apartments", task: "Second floor framing", hours: 8 },
    { date: "2025-05-23", project: "Riverside Apartments", task: "Second floor framing", hours: 8 },
    { date: "2025-05-24", project: "Riverside Apartments", task: "Roof framing", hours: 8 },
  ],
  crew3: [
    { date: "2025-05-20", project: "Downtown Project", task: "Rough electrical", hours: 8 },
    { date: "2025-05-21", project: "Downtown Project", task: "Rough electrical", hours: 8 },
    { date: "2025-05-22", project: "Downtown Project", task: "Panel installation", hours: 8 },
    { date: "2025-05-23", project: "Downtown Project", task: "Lighting fixtures", hours: 8 },
    { date: "2025-05-24", project: "Downtown Project", task: "Testing and inspection", hours: 6 },
  ],
  crew4: [
    { date: "2025-05-25", project: "Riverside Apartments", task: "Rough plumbing", hours: 8 },
    { date: "2025-05-26", project: "Riverside Apartments", task: "Rough plumbing", hours: 8 },
    { date: "2025-05-27", project: "Riverside Apartments", task: "Fixture installation", hours: 8 },
    { date: "2025-05-28", project: "Riverside Apartments", task: "Testing", hours: 6 },
  ],
  crew5: [
    { date: "2025-05-20", project: "Johnson Residence", task: "Drywall finishing", hours: 8 },
    { date: "2025-05-21", project: "Johnson Residence", task: "Painting", hours: 8 },
    { date: "2025-05-22", project: "Johnson Residence", task: "Painting", hours: 8 },
    { date: "2025-05-23", project: "Johnson Residence", task: "Trim installation", hours: 8 },
    { date: "2025-05-24", project: "Johnson Residence", task: "Final touches", hours: 6 },
  ],
}

export default function CrewDetailPage() {
  const params = useParams()
  const router = useRouter()
  const crewId = params.id as string
  const [activeTab, setActiveTab] = useState("members")
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [newMember, setNewMember] = useState({
    name: "",
    role: "",
    experience: "",
    phone: "",
    email: "",
  })
  const [members, setMembers] = useState(crewMembers[crewId as keyof typeof crewMembers] || [])
  const crew = crewsData[crewId as keyof typeof crewsData]
  const schedule = crewSchedule[crewId as keyof typeof crewSchedule] || []

  // If crew doesn't exist, redirect to crews page
  useEffect(() => {
    if (!crew) {
      router.push("/dashboard/crews")
    }
  }, [crew, router])

  if (!crew) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    )
  }

  const handleAddMember = () => {
    const member = {
      id: `m${Date.now()}`,
      ...newMember,
    }
    setMembers([...members, member])
    setNewMember({
      name: "",
      role: "",
      experience: "",
      phone: "",
      email: "",
    })
    setShowAddMemberModal(false)
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/crews" className="btn btn-ghost btn-sm">
              <i className="fas fa-arrow-left"></i>
            </Link>
            <h1 className="text-2xl font-bold">{crew.name}</h1>
            <div className={`badge ${crew.status === "active" ? "badge-primary" : "badge-success"}`}>
              {crew.status === "active" ? "Active" : "Available"}
            </div>
          </div>
          <p className="text-base-content/70 mt-1">Led by {crew.leader}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm">
            <i className="fas fa-edit mr-2"></i> Edit Crew
          </button>
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
              <p>{crew.specialty}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Current Project</h3>
              <p>{crew.currentProject || "None assigned"}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Team Size</h3>
              <p>{crew.members} members</p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Certifications</h3>
            <div className="flex flex-wrap gap-2">
              {crew.certifications.map((cert, index) => (
                <div key={index} className="badge badge-outline">
                  {cert}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Notes</h3>
            <p>{crew.notes}</p>
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
              {members.map((member) => (
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
                          {member.id === `m${members[0].id.substring(1)}` ? "Leader" : "Member"}
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
            <div className="overflow-x-auto">
              <table className="table table-zebra">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Project</th>
                    <th>Task</th>
                    <th>Hours</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item, index) => (
                    <tr key={index}>
                      <td>{item.date}</td>
                      <td>{item.project}</td>
                      <td>{item.task}</td>
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
          </div>
        </div>
      )}

      {activeTab === "equipment" && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Assigned Equipment</h3>
              <Link href="/dashboard/equipment" className="btn btn-sm btn-outline">
                <i className="fas fa-plus mr-2"></i> Assign Equipment
              </Link>
            </div>

            {crew.id === "crew1" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex gap-3">
                      <img
                        src="/large-yellow-excavator.png"
                        alt="Excavator"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">Excavator #103</h4>
                        <p className="text-sm">Assigned since: May 1, 2025</p>
                        <div className="badge badge-primary mt-1">In Use</div>
                      </div>
                    </div>
                    <div className="card-actions justify-end mt-2">
                      <Link href="/dashboard/equipment/eq1" className="btn btn-xs btn-ghost">
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button className="btn btn-xs btn-ghost text-error">
                        <i className="fas fa-undo"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex gap-3">
                      <img
                        src="/placeholder-tdvdz.png"
                        alt="Cement Mixer"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">Cement Mixer #42</h4>
                        <p className="text-sm">Assigned since: May 1, 2025</p>
                        <div className="badge badge-primary mt-1">In Use</div>
                      </div>
                    </div>
                    <div className="card-actions justify-end mt-2">
                      <Link href="/dashboard/equipment/eq3" className="btn btn-xs btn-ghost">
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button className="btn btn-xs btn-ghost text-error">
                        <i className="fas fa-undo"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {crew.id === "crew2" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex gap-3">
                      <img
                        src="/backhoe-loader.png"
                        alt="Backhoe Loader"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">Backhoe Loader #64</h4>
                        <p className="text-sm">Assigned since: April 15, 2025</p>
                        <div className="badge badge-primary mt-1">In Use</div>
                      </div>
                    </div>
                    <div className="card-actions justify-end mt-2">
                      <Link href="/dashboard/equipment/eq7" className="btn btn-xs btn-ghost">
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button className="btn btn-xs btn-ghost text-error">
                        <i className="fas fa-undo"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {crew.id === "crew3" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex gap-3">
                      <img
                        src="/abstract-energy-flow.png"
                        alt="Generator"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">Generator #56</h4>
                        <p className="text-sm">Assigned since: April 20, 2025</p>
                        <div className="badge badge-primary mt-1">In Use</div>
                      </div>
                    </div>
                    <div className="card-actions justify-end mt-2">
                      <Link href="/dashboard/equipment/eq5" className="btn btn-xs btn-ghost">
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button className="btn btn-xs btn-ghost text-error">
                        <i className="fas fa-undo"></i>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex gap-3">
                      <img
                        src="/placeholder.svg?height=60&width=60&query=boom+lift"
                        alt="Boom Lift"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">Boom Lift #45</h4>
                        <p className="text-sm">Assigned since: April 20, 2025</p>
                        <div className="badge badge-primary mt-1">In Use</div>
                      </div>
                    </div>
                    <div className="card-actions justify-end mt-2">
                      <Link href="/dashboard/equipment/eq12" className="btn btn-xs btn-ghost">
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button className="btn btn-xs btn-ghost text-error">
                        <i className="fas fa-undo"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {crew.id === "crew5" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="card bg-base-200">
                  <div className="card-body p-4">
                    <div className="flex gap-3">
                      <img
                        src="/placeholder.svg?height=60&width=60&query=skid+steer"
                        alt="Skid Steer"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div>
                        <h4 className="font-semibold">Skid Steer #51</h4>
                        <p className="text-sm">Assigned since: April 10, 2025</p>
                        <div className="badge badge-primary mt-1">In Use</div>
                      </div>
                    </div>
                    <div className="card-actions justify-end mt-2">
                      <Link href="/dashboard/equipment/eq9" className="btn btn-xs btn-ghost">
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button className="btn btn-xs btn-ghost text-error">
                        <i className="fas fa-undo"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {crew.id === "crew4" && (
              <div className="alert alert-info">
                <i className="fas fa-info-circle"></i>
                <span>No equipment currently assigned to this crew.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="card bg-base-100 shadow-sm">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">Work History</h3>
            <div className="alert alert-info">
              <i className="fas fa-info-circle"></i>
              <span>Work history feature will be available in the next update.</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Add New Crew Member</h3>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                placeholder="Enter member name"
                className="input input-bordered"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              />
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Role</span>
              </label>
              <input
                type="text"
                placeholder="Enter role (e.g., Carpenter, Electrician)"
                className="input input-bordered"
                value={newMember.role}
                onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              />
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Experience</span>
              </label>
              <input
                type="text"
                placeholder="Enter experience (e.g., 5 years)"
                className="input input-bordered"
                value={newMember.experience}
                onChange={(e) => setNewMember({ ...newMember, experience: e.target.value })}
              />
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Phone</span>
              </label>
              <input
                type="tel"
                placeholder="Enter phone number"
                className="input input-bordered"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
              />
            </div>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="Enter email address"
                className="input input-bordered"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
              />
            </div>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setShowAddMemberModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleAddMember}>
                Add Member
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setShowAddMemberModal(false)}></div>
        </div>
      )}
    </div>
  )
}
