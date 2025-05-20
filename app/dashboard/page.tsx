import Link from "next/link"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-base-content/70">Welcome back, John Doe</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/organization" className="btn btn-outline btn-sm">
            <i className="fas fa-building mr-2"></i>
            Organization
          </Link>
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-outline btn-sm">
              <i className="fas fa-calendar-alt mr-2"></i>
              This Week <i className="fas fa-chevron-down ml-2"></i>
            </div>
            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
              <li>
                <a>Today</a>
              </li>
              <li>
                <a>This Week</a>
              </li>
              <li>
                <a>This Month</a>
              </li>
              <li>
                <a>This Quarter</a>
              </li>
              <li>
                <a>This Year</a>
              </li>
              <li>
                <a>Custom Range</a>
              </li>
            </ul>
          </div>
          <button className="btn btn-primary btn-sm">
            <i className="fas fa-download mr-2"></i>
            Export
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <i className="fas fa-project-diagram text-3xl"></i>
            </div>
            <div className="stat-title">Active Projects</div>
            <div className="stat-value">12</div>
            <div className="stat-desc text-success">↗︎ 2 new this month</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <i className="fas fa-tasks text-3xl"></i>
            </div>
            <div className="stat-title">Open Tasks</div>
            <div className="stat-value">42</div>
            <div className="stat-desc text-error">↗︎ 8 overdue</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <i className="fas fa-users text-3xl"></i>
            </div>
            <div className="stat-title">Crew Members</div>
            <div className="stat-value">24</div>
            <div className="stat-desc">↗︎ 4 on leave</div>
          </div>
        </div>

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-figure text-primary">
              <i className="fas fa-file-invoice-dollar text-3xl"></i>
            </div>
            <div className="stat-title">Pending Invoices</div>
            <div className="stat-value">$24.5k</div>
            <div className="stat-desc text-error">↗︎ 3 overdue</div>
          </div>
        </div>
      </div>

      {/* Project Progress */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Project Progress</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra">
              <thead>
                <tr>
                  <th>Project</th>
                  <th>Client</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Riverside Apartments</td>
                  <td>Acme Development</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <progress className="progress progress-primary w-full" value="65" max="100"></progress>
                      <span>65%</span>
                    </div>
                  </td>
                  <td>
                    <div className="badge badge-success">On Track</div>
                  </td>
                  <td>Jun 15, 2025</td>
                  <td>
                    <Link href="/dashboard/projects/1" className="btn btn-ghost btn-xs">
                      View
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td>Downtown Office Tower</td>
                  <td>Metro Commercial</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <progress className="progress progress-primary w-full" value="32" max="100"></progress>
                      <span>32%</span>
                    </div>
                  </td>
                  <td>
                    <div className="badge badge-warning">Delayed</div>
                  </td>
                  <td>Aug 30, 2025</td>
                  <td>
                    <Link href="/dashboard/projects/2" className="btn btn-ghost btn-xs">
                      View
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td>Hillside Villas</td>
                  <td>Luxury Homes Inc.</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <progress className="progress progress-primary w-full" value="78" max="100"></progress>
                      <span>78%</span>
                    </div>
                  </td>
                  <td>
                    <div className="badge badge-success">On Track</div>
                  </td>
                  <td>Jul 10, 2025</td>
                  <td>
                    <Link href="/dashboard/projects/3" className="btn btn-ghost btn-xs">
                      View
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td>Community Center</td>
                  <td>City of Westlake</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <progress className="progress progress-primary w-full" value="12" max="100"></progress>
                      <span>12%</span>
                    </div>
                  </td>
                  <td>
                    <div className="badge badge-error">At Risk</div>
                  </td>
                  <td>Oct 22, 2025</td>
                  <td>
                    <Link href="/dashboard/projects/4" className="btn btn-ghost btn-xs">
                      View
                    </Link>
                  </td>
                </tr>
                <tr>
                  <td>Parkview Residences</td>
                  <td>Green Living LLC</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <progress className="progress progress-primary w-full" value="45" max="100"></progress>
                      <span>45%</span>
                    </div>
                  </td>
                  <td>
                    <div className="badge badge-success">On Track</div>
                  </td>
                  <td>Sep 5, 2025</td>
                  <td>
                    <Link href="/dashboard/projects/5" className="btn btn-ghost btn-xs">
                      View
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="card-actions justify-end mt-4">
            <Link href="/dashboard/projects" className="btn btn-primary btn-sm">
              View All Projects
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity and Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Recent Activity</h2>
            <ul className="timeline timeline-snap-icon max-md:timeline-compact timeline-vertical">
              <li>
                <div className="timeline-middle">
                  <i className="fas fa-circle text-primary"></i>
                </div>
                <div className="timeline-start md:text-end mb-10">
                  <time className="font-mono italic">2 hours ago</time>
                  <div className="text-lg font-black">Daily Log Submitted</div>
                  <p>John Doe submitted a daily log for Riverside Apartments</p>
                </div>
                <hr />
              </li>
              <li>
                <hr />
                <div className="timeline-middle">
                  <i className="fas fa-circle text-primary"></i>
                </div>
                <div className="timeline-end mb-10">
                  <time className="font-mono italic">4 hours ago</time>
                  <div className="text-lg font-black">Task Completed</div>
                  <p>Foundation inspection completed for Downtown Office Tower</p>
                </div>
                <hr />
              </li>
              <li>
                <hr />
                <div className="timeline-middle">
                  <i className="fas fa-circle text-primary"></i>
                </div>
                <div className="timeline-start md:text-end mb-10">
                  <time className="font-mono italic">Yesterday</time>
                  <div className="text-lg font-black">New Invoice</div>
                  <p>Invoice #1234 created for Acme Development</p>
                </div>
                <hr />
              </li>
              <li>
                <hr />
                <div className="timeline-middle">
                  <i className="fas fa-circle text-primary"></i>
                </div>
                <div className="timeline-end mb-10">
                  <time className="font-mono italic">2 days ago</time>
                  <div className="text-lg font-black">Equipment Assigned</div>
                  <p>Excavator #EX-103 assigned to Hillside Villas project</p>
                </div>
              </li>
            </ul>
            <div className="card-actions justify-end mt-4">
              <Link href="/dashboard/activity" className="btn btn-ghost btn-sm">
                View All Activity
              </Link>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Upcoming Tasks</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Task</th>
                    <th>Project</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Concrete Pouring - Level 2</td>
                    <td>Riverside Apartments</td>
                    <td>Tomorrow</td>
                    <td>
                      <div className="badge badge-warning">Pending</div>
                    </td>
                  </tr>
                  <tr>
                    <td>Electrical Inspection</td>
                    <td>Hillside Villas</td>
                    <td>May 17, 2025</td>
                    <td>
                      <div className="badge badge-warning">Pending</div>
                    </td>
                  </tr>
                  <tr>
                    <td>Site Preparation</td>
                    <td>Community Center</td>
                    <td>May 18, 2025</td>
                    <td>
                      <div className="badge badge-warning">Pending</div>
                    </td>
                  </tr>
                  <tr>
                    <td>HVAC Installation</td>
                    <td>Downtown Office Tower</td>
                    <td>May 20, 2025</td>
                    <td>
                      <div className="badge badge-warning">Pending</div>
                    </td>
                  </tr>
                  <tr>
                    <td>Plumbing Rough-In</td>
                    <td>Parkview Residences</td>
                    <td>May 22, 2025</td>
                    <td>
                      <div className="badge badge-warning">Pending</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="card-actions justify-end mt-4">
              <Link href="/dashboard/tasks" className="btn btn-primary btn-sm">
                View All Tasks
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Weather and Crew Availability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weather Forecast */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Weather Forecast</h2>
            <div className="flex flex-wrap gap-4 justify-between">
              <div className="text-center p-4">
                <p className="font-bold">Today</p>
                <i className="fas fa-sun text-4xl text-warning my-2"></i>
                <p className="text-2xl">72°F</p>
                <p className="text-sm">Clear</p>
              </div>
              <div className="text-center p-4">
                <p className="font-bold">Tomorrow</p>
                <i className="fas fa-cloud-sun text-4xl text-warning my-2"></i>
                <p className="text-2xl">68°F</p>
                <p className="text-sm">Partly Cloudy</p>
              </div>
              <div className="text-center p-4">
                <p className="font-bold">Wednesday</p>
                <i className="fas fa-cloud-rain text-4xl text-info my-2"></i>
                <p className="text-2xl">65°F</p>
                <p className="text-sm">Light Rain</p>
              </div>
              <div className="text-center p-4">
                <p className="font-bold">Thursday</p>
                <i className="fas fa-cloud text-4xl my-2"></i>
                <p className="text-2xl">70°F</p>
                <p className="text-sm">Cloudy</p>
              </div>
              <div className="text-center p-4">
                <p className="font-bold">Friday</p>
                <i className="fas fa-sun text-4xl text-warning my-2"></i>
                <p className="text-2xl">75°F</p>
                <p className="text-sm">Sunny</p>
              </div>
            </div>
          </div>
        </div>

        {/* Crew Availability */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Crew Availability</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Crew</th>
                    <th>Members</th>
                    <th>Status</th>
                    <th>Current Project</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Team Alpha</td>
                    <td>6/6</td>
                    <td>
                      <div className="badge badge-success">Available</div>
                    </td>
                    <td>None</td>
                  </tr>
                  <tr>
                    <td>Team Bravo</td>
                    <td>4/5</td>
                    <td>
                      <div className="badge badge-warning">Partial</div>
                    </td>
                    <td>Riverside Apartments</td>
                  </tr>
                  <tr>
                    <td>Team Charlie</td>
                    <td>5/5</td>
                    <td>
                      <div className="badge badge-error">Assigned</div>
                    </td>
                    <td>Hillside Villas</td>
                  </tr>
                  <tr>
                    <td>Team Delta</td>
                    <td>3/4</td>
                    <td>
                      <div className="badge badge-warning">Partial</div>
                    </td>
                    <td>Downtown Office Tower</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="card-actions justify-end mt-4">
              <Link href="/dashboard/crews" className="btn btn-primary btn-sm">
                Manage Crews
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
