import Link from "next/link"

export default function MorePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">More Options</h1>
        <p className="text-base-content/70">Access additional features and settings</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Link href="/dashboard/organization" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body items-center text-center p-6">
            <i className="fas fa-building text-4xl text-primary mb-2"></i>
            <h2 className="card-title text-lg">Organization</h2>
            <p className="text-sm">Manage your business profile and team</p>
          </div>
        </Link>

        <Link href="/dashboard/equipment" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body items-center text-center p-6">
            <i className="fas fa-truck text-4xl text-primary mb-2"></i>
            <h2 className="card-title text-lg">Equipment</h2>
            <p className="text-sm">Track and manage your equipment</p>
          </div>
        </Link>

        <Link href="/dashboard/clients" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body items-center text-center p-6">
            <i className="fas fa-user-tie text-4xl text-primary mb-2"></i>
            <h2 className="card-title text-lg">Clients</h2>
            <p className="text-sm">Manage your client relationships</p>
          </div>
        </Link>

        <Link href="/dashboard/daily-logs" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body items-center text-center p-6">
            <i className="fas fa-clipboard-list text-4xl text-primary mb-2"></i>
            <h2 className="card-title text-lg">Daily Logs</h2>
            <p className="text-sm">Record daily activities and progress</p>
          </div>
        </Link>

        <Link href="/dashboard/invoices" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body items-center text-center p-6">
            <i className="fas fa-file-invoice-dollar text-4xl text-primary mb-2"></i>
            <h2 className="card-title text-lg">Invoices</h2>
            <p className="text-sm">Create and manage invoices</p>
          </div>
        </Link>

        <Link href="/dashboard/media" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body items-center text-center p-6">
            <i className="fas fa-images text-4xl text-primary mb-2"></i>
            <h2 className="card-title text-lg">Media</h2>
            <p className="text-sm">Manage photos and documents</p>
          </div>
        </Link>

        <Link href="/dashboard/reports" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body items-center text-center p-6">
            <i className="fas fa-chart-bar text-4xl text-primary mb-2"></i>
            <h2 className="card-title text-lg">Reports</h2>
            <p className="text-sm">Generate and view reports</p>
          </div>
        </Link>

        <Link href="/dashboard/settings" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body items-center text-center p-6">
            <i className="fas fa-cog text-4xl text-primary mb-2"></i>
            <h2 className="card-title text-lg">Settings</h2>
            <p className="text-sm">Configure your account settings</p>
          </div>
        </Link>

        <Link href="/dashboard/help" className="card bg-base-100 shadow-xl hover:shadow-2xl transition-shadow">
          <div className="card-body items-center text-center p-6">
            <i className="fas fa-question-circle text-4xl text-primary mb-2"></i>
            <h2 className="card-title text-lg">Help</h2>
            <p className="text-sm">Get support and documentation</p>
          </div>
        </Link>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Account</h2>
          <div className="space-y-2 mt-2">
            <Link href="/dashboard/profile" className="flex items-center p-2 hover:bg-base-200 rounded-lg">
              <i className="fas fa-user-circle w-8 text-primary"></i>
              <span>Profile</span>
              <span className="badge badge-primary badge-sm ml-2">New</span>
            </Link>
            <Link href="/api/auth/logout" className="flex items-center p-2 hover:bg-base-200 rounded-lg">
              <i className="fas fa-sign-out-alt w-8 text-error"></i>
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
