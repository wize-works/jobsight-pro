import Link from "next/link"
import { ThemeToggle } from "@/components/theme-toggle"
import { isAuthenticated } from "@/lib/auth"

export default function Home() {
  // Server component - safe to use isAuthenticated()
  const authenticated = isAuthenticated()

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
          <ThemeToggle />
          {authenticated ? (
            <Link href="/dashboard" className="btn btn-primary">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="btn btn-ghost">
                Login
              </Link>
              <Link href="/register" className="btn btn-primary">
                Get Started
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero min-h-[70vh] bg-base-200">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <img
            src="/construction-site-dashboard.png"
            alt="JobSight Dashboard"
            className="max-w-sm rounded-lg shadow-2xl"
          />
          <div>
            <h1 className="text-5xl font-bold">Your Entire Jobsite, One App</h1>
            <p className="py-6">
              JobSight is a modern field service and construction project management platform built to help teams track
              projects, tasks, equipment, crews, and daily logs in one centralized interface.
            </p>
            <Link href="/register" className="btn btn-primary">
              Get Started
            </Link>
            <Link href="/demo" className="btn btn-ghost ml-2">
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-base-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <i className="fas fa-users text-4xl text-primary mb-4"></i>
                <h3 className="card-title">Crew Management</h3>
                <p>Manage crews, assignments, and schedules with ease. Keep track of who's working where and when.</p>
              </div>
            </div>

            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <i className="fas fa-truck text-4xl text-primary mb-4"></i>
                <h3 className="card-title">Equipment Tracking</h3>
                <p>Assign equipment, log inspections, and maintain maintenance records all in one place.</p>
              </div>
            </div>

            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <i className="fas fa-tasks text-4xl text-primary mb-4"></i>
                <h3 className="card-title">Projects & Tasks</h3>
                <p>Create and manage projects, tasks, and statuses to keep your team on track and clients informed.</p>
              </div>
            </div>

            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <i className="fas fa-clipboard-list text-4xl text-primary mb-4"></i>
                <h3 className="card-title">Daily Logs</h3>
                <p>Submit logs with media, notes, and weather information to document progress and issues.</p>
              </div>
            </div>

            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <i className="fas fa-file-invoice-dollar text-4xl text-primary mb-4"></i>
                <h3 className="card-title">Invoicing</h3>
                <p>Provide itemized invoicing to clients through email with links to pay through Stripe.</p>
              </div>
            </div>

            <div className="card bg-base-200 shadow-xl">
              <div className="card-body">
                <i className="fas fa-chart-line text-4xl text-primary mb-4"></i>
                <h3 className="card-title">Dashboard & Reporting</h3>
                <p>Get visual insights into your business with customizable charts and reports.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-secondary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to streamline your jobsite management?</h2>
          <p className="mb-8 max-w-2xl mx-auto">
            Join thousands of construction professionals who are saving time and reducing headaches with JobSight.
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
      </footer>
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
    </div>
  )
}
