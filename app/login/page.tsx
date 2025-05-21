import Link from "next/link"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function Login() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold text-center justify-center mb-6">Log in to JobSight</h2>

            <form className="space-y-4">
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
                <label className="label">
                  <Link href="/forgot-password" className="label-text-alt link link-hover">
                    Forgot password?
                  </Link>
                </label>
              </div>

              <div className="form-control mt-6">
                <Link href="/dashboard" className="btn btn-primary">
                  Log in
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
              Don't have an account?{" "}
              <Link href="/register" className="link link-primary">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
