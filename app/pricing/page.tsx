import Link from "next/link"

export default function Pricing() {
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

      {/* Pricing Section */}
      <section className="py-16 bg-base-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
            <p className="text-lg max-w-2xl mx-auto">
              Choose the plan that's right for your business. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Tier 1 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl">Tier 1</h2>
                <p className="text-3xl font-bold mt-4">
                  $49<span className="text-lg font-normal">/month</span>
                </p>
                <p className="text-sm text-base-content/70 mt-1">Billed annually or $59 monthly</p>

                <div className="divider"></div>

                <ul className="space-y-3">
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Up to 5 users</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>10 active projects</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Basic reporting</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>5GB storage</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Email support</span>
                  </li>
                </ul>

                <div className="card-actions mt-6">
                  <Link href="/register?plan=tier1" className="btn btn-primary w-full">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>

            {/* Tier 2 */}
            <div className="card bg-base-100 shadow-xl border-2 border-primary">
              <div className="card-body">
                <div className="badge badge-primary mx-auto mb-2">Most Popular</div>
                <h2 className="card-title text-2xl">Tier 2</h2>
                <p className="text-3xl font-bold mt-4">
                  $99<span className="text-lg font-normal">/month</span>
                </p>
                <p className="text-sm text-base-content/70 mt-1">Billed annually or $119 monthly</p>

                <div className="divider"></div>

                <ul className="space-y-3">
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Up to 15 users</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Unlimited projects</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Advanced reporting</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>25GB storage</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Priority email support</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Client portal access</span>
                  </li>
                </ul>

                <div className="card-actions mt-6">
                  <Link href="/register?plan=tier2" className="btn btn-primary w-full">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>

            {/* Tier 3 */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title text-2xl">Tier 3</h2>
                <p className="text-3xl font-bold mt-4">
                  $199<span className="text-lg font-normal">/month</span>
                </p>
                <p className="text-sm text-base-content/70 mt-1">Billed annually or $239 monthly</p>

                <div className="divider"></div>

                <ul className="space-y-3">
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Unlimited users</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Unlimited projects</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Custom reporting</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>100GB storage</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>24/7 phone & email support</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>Advanced client portal</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fas fa-check text-success mt-1 mr-2"></i>
                    <span>API access</span>
                  </li>
                </ul>

                <div className="card-actions mt-6">
                  <Link href="/register?plan=tier3" className="btn btn-primary w-full">
                    Get Started
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <h3 className="text-2xl font-bold mb-4">Need a custom solution?</h3>
            <p className="mb-6">Contact our sales team for enterprise pricing and custom solutions.</p>
            <Link href="/contact" className="btn btn-secondary">
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-base-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>

          <div className="max-w-3xl mx-auto space-y-4">
            <div className="collapse collapse-plus bg-base-200">
              <input type="radio" name="faq-accordion" checked />
              <div className="collapse-title text-xl font-medium">How does the 14-day free trial work?</div>
              <div className="collapse-content">
                <p>
                  You can sign up for any plan and try all features for 14 days without being charged. No credit card is
                  required to start your trial. At the end of your trial, you can choose to subscribe or your account
                  will be automatically downgraded to a limited free version.
                </p>
              </div>
            </div>

            <div className="collapse collapse-plus bg-base-200">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-xl font-medium">Can I change plans later?</div>
              <div className="collapse-content">
                <p>
                  Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the
                  prorated difference immediately. When downgrading, the new rate will apply at the start of your next
                  billing cycle.
                </p>
              </div>
            </div>

            <div className="collapse collapse-plus bg-base-200">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-xl font-medium">Is there a discount for annual billing?</div>
              <div className="collapse-content">
                <p>Yes, you save approximately 15% when you choose annual billing compared to monthly billing.</p>
              </div>
            </div>

            <div className="collapse collapse-plus bg-base-200">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-xl font-medium">What payment methods do you accept?</div>
              <div className="collapse-content">
                <p>
                  We accept all major credit cards (Visa, Mastercard, American Express, Discover) as well as PayPal. For
                  annual enterprise plans, we can also accept bank transfers.
                </p>
              </div>
            </div>

            <div className="collapse collapse-plus bg-base-200">
              <input type="radio" name="faq-accordion" />
              <div className="collapse-title text-xl font-medium">Can I cancel my subscription?</div>
              <div className="collapse-content">
                <p>
                  Yes, you can cancel your subscription at any time from your account settings. Your subscription will
                  remain active until the end of your current billing period.
                </p>
              </div>
            </div>
          </div>
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
