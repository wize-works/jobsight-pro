import Link from "next/link"

export default function Footer() {
  return (
    <footer className="footer p-10 bg-base-200 text-base-content">
      <div>
        <i className="fas fa-hard-hat text-primary text-4xl"></i>
        <p className="font-bold text-lg">JobSight</p>
        <p>Your Entire Jobsite, One App</p>
      </div>
      <div>
        <span className="footer-title">Services</span>
        <Link href="/features" className="link link-hover">
          Features
        </Link>
        <Link href="/pricing" className="link link-hover">
          Pricing
        </Link>
        <Link href="/demo" className="link link-hover">
          Request Demo
        </Link>
      </div>
      <div>
        <span className="footer-title">Company</span>
        <Link href="/about" className="link link-hover">
          About us
        </Link>
        <Link href="/contact" className="link link-hover">
          Contact
        </Link>
        <Link href="/careers" className="link link-hover">
          Careers
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
  )
}
