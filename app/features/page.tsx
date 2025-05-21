import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"
import Image from "next/image"

export default function Features() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <section className="py-12 bg-base-200">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Powerful Features for Construction & Field Service</h1>
          <p className="max-w-2xl mx-auto mb-8">
            JobSight provides all the tools you need to manage your projects, crews, equipment, and more in one
            centralized platform.
          </p>
          <Link href="/register" className="btn btn-primary">
            Start Free Trial
          </Link>
        </div>
      </section>

      {/* Business Management */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <div className="badge badge-primary mb-2">Organization</div>
              <h2 className="text-3xl font-bold mb-4">Business Management</h2>
              <p className="mb-4">
                Create and manage your business profile, invite team members, and set up role-based permissions to
                ensure everyone has the right level of access.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Invite unlimited team members based on your subscription</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Assign roles and permissions</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Manage company profile and branding</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Track subscription usage and billing</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <Image
                src="/business-management-dashboard.png"
                width={600}
                height={400}
                alt="Business Management"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Crew Management */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-1/2">
              <div className="badge badge-primary mb-2">Teams</div>
              <h2 className="text-3xl font-bold mb-4">Crew Management</h2>
              <p className="mb-4">
                Efficiently manage your crews, assign them to projects, and track their schedules and availability in
                real-time.
              </p>
              <ul className="space-y-2">
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
                  <span>Track crew availability and schedules</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Monitor crew performance and productivity</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <Image
                src="/construction-crew-management.png"
                width={600}
                height={400}
                alt="Crew Management"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Equipment Management */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <div className="badge badge-primary mb-2">Assets</div>
              <h2 className="text-3xl font-bold mb-4">Equipment Management</h2>
              <p className="mb-4">
                Keep track of all your equipment, schedule maintenance, and ensure everything is properly inspected and
                ready for use.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Track equipment location and status</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Schedule and log maintenance activities</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Conduct and record equipment inspections</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Assign equipment to projects and crews</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <Image
                src="/construction-equipment-tracking.png"
                width={600}
                height={400}
                alt="Equipment Management"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Projects & Tasks */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-1/2">
              <div className="badge badge-primary mb-2">Workflow</div>
              <h2 className="text-3xl font-bold mb-4">Projects & Tasks</h2>
              <p className="mb-4">
                Create and manage projects, break them down into tasks, and track progress from start to finish.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Create detailed project plans with milestones</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Break projects into manageable tasks</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Assign tasks to crews and individuals</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Track progress and identify bottlenecks</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <Image
                src="/construction-project-management.png"
                width={600}
                height={400}
                alt="Projects & Tasks"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Daily Logs */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="md:w-1/2">
              <div className="badge badge-primary mb-2">Documentation</div>
              <h2 className="text-3xl font-bold mb-4">Daily Logs</h2>
              <p className="mb-4">
                Keep detailed records of daily activities, weather conditions, and progress with easy-to-use digital
                logs.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Submit daily logs from the field</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Attach photos and documents</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Record weather conditions automatically</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Generate comprehensive reports</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <Image
                src="/construction-daily-logs.png"
                width={600}
                height={400}
                alt="Daily Logs"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Invoicing */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center gap-8">
            <div className="md:w-1/2">
              <div className="badge badge-primary mb-2">Billing</div>
              <h2 className="text-3xl font-bold mb-4">Invoicing</h2>
              <p className="mb-4">
                Create professional invoices, send them to clients, and track payments all within the platform.
              </p>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Generate itemized invoices</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Email invoices directly to clients</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Accept online payments via Stripe</span>
                </li>
                <li className="flex items-start">
                  <i className="fas fa-check-circle text-success mt-1 mr-2"></i>
                  <span>Track payment status and send reminders</span>
                </li>
              </ul>
            </div>
            <div className="md:w-1/2">
              <Image
                src="/placeholder.svg?height=400&width=600&query=construction invoicing"
                width={600}
                height={400}
                alt="Invoicing"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-content py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to streamline your jobsite management?</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            Start your 30-day free trial today and experience the difference JobSight can make for your business.
          </p>
          <Link href="/register" className="btn btn-secondary">
            Start Your Free Trial
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
