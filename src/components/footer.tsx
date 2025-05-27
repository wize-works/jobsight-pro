import Link from "next/link"

export default function Footer() {
    return (
        <footer className="bg-base-200 text-base-content">
            {/* Main Footer Section */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Top section with logo and description */}
                <div className="flex flex-col md:flex-row justify-between gap-10 mb-12">
                    <div className="max-w-md">
                        <div className="flex items-center gap-2 mb-3">
                            <i className="fas fa-hard-hat text-primary text-3xl"></i>
                            <span className="font-bold text-2xl">JobSight</span>
                        </div>
                        <p className="text-base-content/80 mb-6">
                            Your Entire Jobsite, One App. Simplifying construction management
                            since 2023. Our platform connects every aspect of your construction business.
                        </p>

                        {/* Newsletter subscription */}
                        <div className="form-control w-full max-w-sm">
                            <label className="label">
                                <span className="label-text font-medium">Stay updated with our newsletter</span>
                            </label>
                            <div className="relative">
                                <input type="email" placeholder="Enter your email" className="input input-bordered w-full pr-16" />
                                <button className="btn btn-primary absolute top-0 right-0 rounded-l-none">Subscribe</button>
                            </div>
                        </div>
                    </div>

                    {/* Links grid section */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:gap-16">
                        <div>
                            <h3 className="footer-title mb-4">Services</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a
                                        href="https://www.jobsight.co/features"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-hover flex items-center"
                                    >
                                        <i className="fas fa-check-circle text-primary mr-2 text-xs"></i>
                                        Features
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.jobsight.co/pricing"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-hover flex items-center"
                                    >
                                        <i className="fas fa-tag text-primary mr-2 text-xs"></i>
                                        Pricing
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.jobsight.co/demo"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-hover flex items-center"
                                    >
                                        <i className="fas fa-play-circle text-primary mr-2 text-xs"></i>
                                        Request Demo
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.jobsight.co/support"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-hover flex items-center"
                                    >
                                        <i className="fas fa-headset text-primary mr-2 text-xs"></i>
                                        Support
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="footer-title mb-4">Company</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a
                                        href="https://www.jobsight.co/about"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-hover flex items-center"
                                    >
                                        <i className="fas fa-building text-primary mr-2 text-xs"></i>
                                        About us
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.jobsight.co/contact"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-hover flex items-center"
                                    >
                                        <i className="fas fa-envelope text-primary mr-2 text-xs"></i>
                                        Contact
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.jobsight.co/careers"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-hover flex items-center"
                                    >
                                        <i className="fas fa-briefcase text-primary mr-2 text-xs"></i>
                                        Careers
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.jobsight.co/blog"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-hover flex items-center"
                                    >
                                        <i className="fas fa-newspaper text-primary mr-2 text-xs"></i>
                                        Blog
                                    </a>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="footer-title mb-4">Legal</h3>
                            <ul className="space-y-2">
                                <li>
                                    <a
                                        href="https://www.jobsight.co/terms"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-hover flex items-center"
                                    >
                                        <i className="fas fa-file-contract text-primary mr-2 text-xs"></i>
                                        Terms of use
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.jobsight.co/privacy"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-hover flex items-center"
                                    >
                                        <i className="fas fa-shield-alt text-primary mr-2 text-xs"></i>
                                        Privacy policy
                                    </a>
                                </li>
                                <li>
                                    <a
                                        href="https://www.jobsight.co/cookies"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="link link-hover flex items-center"
                                    >
                                        <i className="fas fa-cookie text-primary mr-2 text-xs"></i>
                                        Cookie policy
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="divider my-0"></div>

                {/* Bottom section with social and copyright */}
                <div className="flex flex-col md:flex-row justify-between items-center pt-6">
                    <div className="flex gap-4 mb-4 md:mb-0">
                        <a
                            aria-label="Twitter"
                            href="https://twitter.com/jobsightapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-circle btn-ghost btn-sm"
                        >
                            <i className="fab fa-twitter text-lg"></i>
                        </a>
                        <a
                            aria-label="LinkedIn"
                            href="https://www.linkedin.com/company/jobsight"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-circle btn-ghost btn-sm"
                        >
                            <i className="fab fa-linkedin text-lg"></i>
                        </a>
                        <a
                            aria-label="Instagram"
                            href="https://www.instagram.com/jobsightapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-circle btn-ghost btn-sm"
                        >
                            <i className="fab fa-instagram text-lg"></i>
                        </a>
                        <a
                            aria-label="Facebook"
                            href="https://www.facebook.com/jobsightapp"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-circle btn-ghost btn-sm"
                        >
                            <i className="fab fa-facebook text-lg"></i>
                        </a>
                    </div>
                    <p className="text-base-content/70">© {new Date().getFullYear()} JobSight. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
