import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function Register() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-center mb-8">Create Your JobSight Account</h1>

          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">1. Choose your plan</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="card cursor-pointer border-2 border-primary">
                  <div className="card-body p-4">
                    <h3 className="font-bold text-lg">Starter</h3>
                    <p className="text-xl">
                      $9.99
                      <span className="text-sm text-base-content/70">/mo</span>
                    </p>
                    <p className="text-sm">1 user included</p>
                  </div>
                </div>

                <div className="card cursor-pointer border-2 border-base-300">
                  <div className="card-body p-4">
                    <h3 className="font-bold text-lg">Pro</h3>
                    <p className="text-xl">
                      $49
                      <span className="text-sm text-base-content/70">/mo</span>
                    </p>
                    <p className="text-sm">10 users included</p>
                  </div>
                </div>

                <div className="card cursor-pointer border-2 border-base-300">
                  <div className="card-body p-4">
                    <h3 className="font-bold text-lg">Business</h3>
                    <p className="text-xl">
                      $149
                      <span className="text-sm text-base-content/70">/mo</span>
                    </p>
                    <p className="text-sm">50 users included</p>
                  </div>
                </div>

                <div className="card cursor-pointer border-2 border-base-300">
                  <div className="card-body p-4">
                    <h3 className="font-bold text-lg">Enterprise</h3>
                    <p className="text-xl">
                      $500
                      <span className="text-sm text-base-content/70">/mo</span>
                    </p>
                    <p className="text-sm">Unlimited users</p>
                  </div>
                </div>
              </div>

              <h2 className="card-title text-xl mb-4">2. Create your account</h2>

              <form className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">First Name</span>
                    </label>
                    <input type="text" placeholder="John" className="input input-bordered" required />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Last Name</span>
                    </label>
                    <input type="text" placeholder="Doe" className="input input-bordered" required />
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Business Name</span>
                  </label>
                  <input type="text" placeholder="Acme Construction" className="input input-bordered" required />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Email</span>
                  </label>
                  <input type="email" placeholder="email@example.com" className="input input-bordered" required />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <input type="password" placeholder="••••••••" className="input input-bordered" required />
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" className="checkbox checkbox-primary" required />
                    <span className="label-text">
                      I agree to the{" "}
                      <Link href="/terms" className="link link-primary">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="link link-primary">
                        Privacy Policy
                      </Link>
                    </span>
                  </label>
                </div>

                <div className="form-control mt-6">
                  <Link href="/dashboard" className="btn btn-primary">
                    Start Your 30-Day Free Trial
                  </Link>
                </div>
              </form>

              <div className="divider">OR</div>

              <div className="space-y-3">
                <button className="btn btn-outline btn-block">
                  <i className="fab fa-google mr-2"></i> Continue with Google
                </button>
                <button className="btn btn-outline btn-block">
                  <i className="fab fa-apple mr-2"></i> Continue with Apple
                </button>
                <button className="btn btn-outline btn-block">
                  <i className="fab fa-facebook mr-2"></i> Continue with Facebook
                </button>
              </div>

              <p className="text-center mt-6">
                Already have an account?{" "}
                <Link href="/login" className="link link-primary">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
