import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="hero min-h-[70vh] bg-base-200">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <div className="max-w-sm">
            <img
              src="/construction-site-dashboard.png"
              alt="JobSight Dashboard Preview"
              className="rounded-lg shadow-2xl"
              width={600}
              height={400}
            />
          </div>
          <div>
            <h1 className="text-5xl font-bold text-base-content">Your Entire Jobsite, One App</h1>
            <p className="py-6 text-base-content">
              JobSight is a modern field service and construction project management platform built to help teams track
              projects, tasks, equipment, crews, and daily logs in one centralized interface.
            </p>
            <Link href="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link href="/demo" className="btn btn-outline ml-4">
              Request Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-base-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-base-content">Key Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <i className="fas fa-users text-primary text-4xl mb-4"></i>
                <h3 className="card-title text-base-content">Crew Management</h3>
                <p className="text-base-content">Manage crews, assignments, and schedules with ease.</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <i className="fas fa-truck text-primary text-4xl mb-4"></i>
                <h3 className="card-title text-base-content">Equipment Tracking</h3>
                <p className="text-base-content">Assign equipment and log inspections efficiently.</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <i className="fas fa-tasks text-primary text-4xl mb-4"></i>
                <h3 className="card-title text-base-content">Projects & Tasks</h3>
                <p className="text-base-content">Create and manage projects, tasks, and statuses.</p>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <i className="fas fa-file-invoice-dollar text-primary text-4xl mb-4"></i>
                <h3 className="card-title text-base-content">Invoicing</h3>
                <p className="text-base-content">Provide itemized invoicing to clients through email.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-content py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to streamline your jobsite management?</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            Join thousands of construction and field service companies who trust JobSight to manage their operations.
          </p>
          <Link href="/register" className="btn btn-secondary">
            Start Your 30-Day Free Trial
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
