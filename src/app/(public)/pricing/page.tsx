"use client";
import Link from "next/link"

// Load pricing data from the centralized JSON file
import pricingPlans from '../../../../docs/jobsight_pricing_with_ai_addon.json'
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
                            <div key={plan.id} className="card bg-base-100 shadow-xl rounded-lg">
                                <div className={`card-body rounded-lg relative ${plan.name === "Pro" ? 'border-2 border-accent' : ''}`}>
                                    {plan.name === "Pro" && (
                                        <div className="badge badge-accent absolute -top-3 left-1/2 transform -translate-x-1/2">Most Popular</div>
                                    )}
                                    <h2 className={`card-title text-3xl justify-center ${plan.name === "Pro" ? 'text-accent font-extrabold' : ''}`}>{plan.name}</h2>
                                    <div className="text-center my-4">
                                        <span className="text-4xl font-semibold">
                                            {isAnnual ? `$${plan.annual_price}` : `$${plan.monthly_price}`}
                                        </span>
                                        <span className="text-base-content/70">/month</span>
                                    </div>

                                    <div className="divider"></div>

                                    <ul className="space-y-6">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start text-lg">
                                                <i className="far fa-check text-success mt-1 mr-2"></i>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    {plan.ai_addon_available && (
                                        <div className="bg-base-200 p-3 rounded-lg mt-4 text-sm">
                                            <p className="font-semibold">AI Add-on Available</p>
                                            <p>+${plan.ai_addon_price}/month</p>
                                        </div>
                                    )}

                                    <div className="card-actions justify-center mt-auto">
                                        <Link href={`/api/auth/register?post_login_redirect_url=%2Fregister`} className={`btn  ${plan.name === "Pro" ? 'btn-accent' : 'btn-primary'} btn-block`}>
                                            Register Now
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

            <section className="py-12">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>

                    <div className="max-w-3xl mx-auto">
                        <div tabIndex={0} className="collapse collapse-plus bg-base-200 mb-4">
                            <div className="collapse-title text-xl font-medium">Can I change plans later?</div>
                            <div className="collapse-content">
                                <p>
                                    Yes, you can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while
                                    downgrades take effect at the end of your billing cycle.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-200 mb-4">
                            <input type="radio" name="my-accordion-3" />
                            <div className="collapse-title text-xl font-medium">What payment methods do you accept?</div>
                            <div className="collapse-content">
                                <p>
                                    We accept all major credit cards and PayPal. For Enterprise plans, we also offer invoicing options.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-200">
                            <input type="radio" name="my-accordion-3" />
                            <div className="collapse-title text-xl font-medium">What is the AI add-on?</div>
                            <div className="collapse-content">
                                <p>
                                    The AI add-on provides intelligent assistance for project planning, resource allocation, and automated
                                    reporting. It helps save time and improve decision-making.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

        </main>
    )
}
