"use client";
import Link from "next/link"

// Load pricing data from the centralized JSON file
import pricingPlans from '../../../../docs/jobsight_pricing.json'
import Image from "next/image"
import { useState } from "react";
import ROICalculator from "./components/roi";

const pricingData = pricingPlans

export default function Pricing() {
    const [isAnnual, setIsAnnual] = useState(false);
    return (
        <main className="min-h-screen flex flex-col">
            <section className="py-12 bg-base-200 pt-20">
                <div className="flex px-4 align-center justify-center text-center mt-10 mb-20">
                    <Image src="/logo-full.png" alt="Logo" height={400} width={400} />
                </div>
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h1>
                    <p className="text-center mb-12 max-w-2xl mx-auto">
                        Choose the plan that fits your business needs. All plans include a 30-day free trial.
                    </p>

                    <div className="flex justify-center mb-8">
                        <div className="tabs tabs-box">
                            <button
                                className={`tab ${!isAnnual ? 'tab-active' : ''}`}
                                onClick={() => setIsAnnual(false)}
                            >
                                Monthly
                            </button>
                            <button
                                className={`tab ${isAnnual ? 'tab-active' : ''}`}
                                onClick={() => setIsAnnual(true)}
                            >
                                Annual <span className="text-secondary font-bold ml-2">(Save 15%)</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pricingData.map((plan) => (
                            <div key={plan.id} className={`card bg-base-100 shadow-xl rounded-lg hover:shadow-2xl transition-all duration-300 ${plan.name === "Pro" ? 'transform scale-105' : ''}`}>
                                <div className={`card-body rounded-lg relative p-6 ${plan.name === "Pro" ? 'border-2 border-accent bg-gradient-to-br from-base-100 to-accent/5' : ''}`}>
                                    {plan.name === "Pro" && (
                                        <div className="badge badge-accent absolute -top-3 left-1/2 transform -translate-x-1/2 font-semibold">Most Popular</div>
                                    )}

                                    <div className="text-center mb-6">
                                        <h2 className={`text-2xl font-bold mb-3 ${plan.name === "Pro" ? 'text-accent' : 'text-base-content'}`}>
                                            {plan.name}
                                        </h2>
                                        <p className="text-sm text-base-content/70 leading-relaxed mb-4 min-h-[3rem]">
                                            {plan.description}
                                        </p>
                                        <div className="pricing-display">
                                            <span className={`text-4xl font-bold ${plan.name === "Pro" ? 'text-accent' : 'text-primary'}`}>
                                                ${isAnnual ? plan.annual_price : plan.monthly_price}
                                            </span>
                                            <span className="text-base-content/70 text-sm">
                                                {isAnnual ? '/year' : '/month'}
                                            </span>
                                            {isAnnual && plan.monthly_price > 0 && (
                                                <div className="text-xs text-success mt-1">
                                                    Save ${(plan.monthly_price * 12 - plan.annual_price).toFixed(0)}/year
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="divider my-4"></div>

                                    <ul className="space-y-3 flex-grow">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start text-sm">
                                                <svg className="w-4 h-4 text-success mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                </svg>
                                                <span className="leading-relaxed">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <div className="card-actions justify-center mt-6">
                                        <Link
                                            href={`/sign-up`}
                                            className={`btn btn-block ${plan.name === "Pro"
                                                ? 'btn-accent hover:btn-accent-focus shadow-lg'
                                                : 'btn-primary hover:btn-primary-focus'
                                                } transition-all duration-200`}
                                        >
                                            {plan.monthly_price === 0 ? 'Get Started Free' : 'Start Free Trial'}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
            <section className="py-12 bg-base-100">
                <div className="container mx-auto px-4">
                    <ROICalculator />
                </div>
            </section>

            <section className="py-16 bg-base-200">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4">Questions? We've Got Answers</h2>
                        <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                            Everything you need to know about JobSight Pro and how it can transform your construction projects.
                        </p>
                    </div>

                    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">How quickly can my crew start using JobSight Pro?</div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    Most teams are up and running within hours. Our mobile-first design means your crew can start tracking time,
                                    equipment, and progress from their phones immediately. No complex training required - just simple,
                                    intuitive tools built for the job site.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">Does it work offline on construction sites?</div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    The offline functionality is currently in development, but our goal is to ensure that JobSight Pro works seamlessly offline. Your crew can log hours, update project status, and take photos
                                    even without internet. Everything syncs automatically when connectivity returns, so you never lose critical data.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">Can I track equipment and material costs accurately?</div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    Absolutely. Track equipment usage by hour, monitor material deliveries, and get real-time cost insights.
                                    Our system helps you stay on budget and identify cost overruns before they become problems.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">How does the AI Assistant help with project management?</div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    Our AI analyzes your project data to provide insights on scheduling conflicts, resource allocation,
                                    and potential delays. It helps you make informed decisions faster and keeps projects on track with
                                    predictive recommendations.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">What happens to my data if I need to switch plans?</div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    Your data is always yours. You can upgrade or downgrade plans anytime without losing any information.
                                    We also provide full data export capabilities so you're never locked in. Upgrades are immediate,
                                    downgrades take effect at your next billing cycle.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">Do you offer training and support for my team?</div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    Yes! All plans include comprehensive onboarding resources. Pro and Business plans get priority email support,
                                    while Business plans also include phone support and dedicated account management to ensure your success.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">Can I generate professional reports for clients?</div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    Definitely. Create branded progress reports, time sheets, and project summaries with photos and data.
                                    Pro and Business plans include custom branding, so reports look professional and reinforce your company image.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-100 shadow-lg">
                            <input type="radio" name="faq-accordion" />
                            <div className="collapse-title text-lg font-semibold">Is there really a free trial with full access?</div>
                            <div className="collapse-content">
                                <p className="text-base-content/80">
                                    Yes! Every paid plan includes a complete 30-day free trial with full access to all features.
                                    No credit card required to start. Test it on real projects and see the difference before you commit.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-lg text-base-content/70 mb-6">
                            Still have questions? We're here to help.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link href="/contact" className="btn btn-primary btn-lg">
                                Contact Support
                            </Link>
                            <Link href="/demo" className="btn btn-outline btn-lg">
                                Schedule a Demo
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    )
}
