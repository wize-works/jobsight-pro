import Link from "next/link"

export default function Features() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="navbar bg-base-100 shadow-md">
        <div className="navbar-start">
          <div className="dropdown">
            <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
              <i className="fas fa-bars"></i>
            </div>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52"
            >
              <li>
                <Link href="/features">Features</Link>
              </li>
              <li>
                <Link href="/pricing">Pricing</Link>
              </li>
              <li>
                <Link href="/about">About</Link>
              </li>
            </ul>
          </div>
          <Link href="/" className="btn btn-ghost text-xl">
            <i className="fas fa-hard-hat text-primary mr-2"></i>
            JobSight
          </Link>
        </div>
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link href="/features">Features</Link>
            </li>
            <li>
              <Link href="/pricing">Pricing</Link>
            </li>
            <li>
              <Link href="/about">About</Link>
            </li>
          </ul>
        </div>
        <div className="navbar-end">
          <Link href="/login" className="btn btn-ghost">
            Login
          </Link>
          <Link href="/register" className="btn btn-primary">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-6">Powerful Features for Modern Construction Teams</h1>
          <p className="text-lg max-w-3xl mx-auto mb-8">
            JobSight brings together everything you need to manage your construction projects efficiently in one
            easy-to-use platform.
          </p>
        </div>
      </section>

      {/* Feature Sections */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          {/* Business Management */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
            <div className="lg:w-1/2">
              <div className="badge badge-primary mb-4">Organization</div>
              <h2 className="text-3xl font-bold mb-6">Business Management</h2>
              <p className="mb-6">
                Create and manage your business profile, invite team members, and set permissions based on roles. Keep
                your entire organization connected and on the same page.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>User role management with custom permissions</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Team member invitations and onboarding</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Business profile customization</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Activity logs and audit trails</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <img
                src="/business-management-dashboard.png"
                alt="Business Management"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>

          {/* Crew Management */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 mb-24">
            <div className="lg:w-1/2">
              <div className="badge badge-primary mb-4">Teams</div>
              <h2 className="text-3xl font-bold mb-6">Crew Management</h2>
              <p className="mb-6">
                Organize your workforce into crews, assign them to projects, and track their schedules and productivity.
                Ensure the right people are at the right place at the right time.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Create and manage multiple crews</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Assign crews to projects and tasks</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Track crew schedules and availability</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Monitor crew productivity and performance</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <img src="/placeholder-miyu3.png" alt="Crew Management" className="rounded-lg shadow-lg" />
            </div>
          </div>

          {/* Equipment Management */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
            <div className="lg:w-1/2">
              <div className="badge badge-primary mb-4">Assets</div>
              <h2 className="text-3xl font-bold mb-6">Equipment Management</h2>
              <p className="mb-6">
                Keep track of all your equipment, schedule maintenance, and ensure compliance with safety regulations.
                Maximize equipment uptime and extend asset lifespan.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Equipment inventory and tracking</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Maintenance scheduling and history</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Equipment assignment to projects</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Safety inspection logs and compliance</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <img src="/placeholder-kpzye.png" alt="Equipment Management" className="rounded-lg shadow-lg" />
            </div>
          </div>

          {/* Projects & Tasks */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12 mb-24">
            <div className="lg:w-1/2">
              <div className="badge badge-primary mb-4">Workflow</div>
              <h2 className="text-3xl font-bold mb-6">Projects & Tasks</h2>
              <p className="mb-6">
                Create detailed project plans, break them down into manageable tasks, and track progress in real-time.
                Keep everyone aligned and projects on schedule.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Project creation with custom fields</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Task assignment and deadline tracking</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Progress visualization with Gantt charts</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Dependency management and critical path analysis</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <img src="/placeholder-xf0jv.png" alt="Projects & Tasks" className="rounded-lg shadow-lg" />
            </div>
          </div>

          {/* Daily Logs */}
          <div className="flex flex-col lg:flex-row items-center gap-12 mb-24">
            <div className="lg:w-1/2">
              <div className="badge badge-primary mb-4">Documentation</div>
              <h2 className="text-3xl font-bold mb-6">Daily Logs</h2>
              <p className="mb-6">
                Document daily activities, weather conditions, and site observations. Attach photos and videos to create
                a comprehensive record of project progress.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Daily activity logging with templates</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Weather data integration</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Photo and video attachments</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Issue tracking and resolution</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <img src="/placeholder-i2g3x.png" alt="Daily Logs" className="rounded-lg shadow-lg" />
            </div>
          </div>

          {/* Invoicing */}
          <div className="flex flex-col lg:flex-row-reverse items-center gap-12">
            <div className="lg:w-1/2">
              <div className="badge badge-primary mb-4">Finance</div>
              <h2 className="text-3xl font-bold mb-6">Invoicing</h2>
              <p className="mb-6">
                Create professional invoices, track payments, and streamline your billing process. Get paid faster with
                integrated online payment options.
              </p>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Custom invoice creation</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Stripe payment integration</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Payment tracking and reminders</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Financial reporting and export</span>
                </li>
              </ul>
            </div>
            <div className="lg:w-1/2">
              <img src="/placeholder-mge0c.png" alt="Invoicing" className="rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to transform your jobsite management?</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            Start your 14-day free trial today and experience the difference JobSight can make for your business.
          </p>
          <Link href="/register" className="btn btn-primary btn-lg">
            Start Your Free Trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer p-10 bg-neutral text-neutral-content">
        <div>
          <i className="fas fa-hard-hat text-4xl"></i>
          <p className="font-bold text-lg">JobSight</p>
          <p>Your Entire Jobsite, One App</p>
        </div>
        <div>
          <span className="footer-title">Company</span>
          <Link href="/about" className="link link-hover">
            About
          </Link>
          <Link href="/contact" className="link link-hover">
            Contact
          </Link>
          <Link href="/careers" className="link link-hover">
            Careers
          </Link>
        </div>
        <div>
          <span className="footer-title">Product</span>
          <Link href="/features" className="link link-hover">
            Features
          </Link>
          <Link href="/pricing" className="link link-hover">
            Pricing
          </Link>
          <Link href="/roadmap" className="link link-hover">
            Roadmap
          </Link>
        </div>
        <div>
          <span className="footer-title">Legal</span>
          <Link href="/terms" className="link link-hover">
            Terms of use
          </Link>
          <Link href="/privacy" className="link link-hover">
            Privacy policy
          </Link>
          <Link href="/cookies" className="link link-hover">
            Cookie policy
          </Link>
        </div>
        <footer className="footer px-10 py-4 border-t bg-neutral text-neutral-content border-base-300">
          <div className="items-center grid-flow-col">
            <p>© 2025 JobSight. All rights reserved.</p>
          </div>
          <div className="md:place-self-center md:justify-self-end">
            <div className="grid grid-flow-col gap-4">
              <Link href="#">
                <i className="fab fa-twitter text-xl"></i>
              </Link>
              <Link href="#">
                <i className="fab fa-facebook text-xl"></i>
              </Link>
              <Link href="#">
                <i className="fab fa-linkedin text-xl"></i>
              </Link>
              <Link href="#">
                <i className="fab fa-instagram text-xl"></i>
              </Link>
            </div>
          </div>
        </footer>
      </footer>
    </div>
  )
}
