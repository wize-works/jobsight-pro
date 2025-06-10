import Link from "next/link"

// Pricing data from the provided JSON
const pricingData = [
    {
        id: "starter",
        name: "Starter",
        trial_days: 30,
        monthly_price: 9.99,
        annual_price: 99.99,
        included_users: 1,
        extra_user_price: 0,
        ai_addon_available: true,
        ai_addon_price: 5.0,
        features: [
            "1 user only",
            "Core project and task management",
            "Crew and equipment tracking",
            "Mobile access",
            "100MB storage",
            "No AI tools (optional upgrade available)",
        ],
    },
    {
        id: "pro",
        name: "Pro",
        monthly_price: 49,
        annual_price: 499,
        included_users: 10,
        extra_user_price: 5,
        ai_addon_available: true,
        ai_addon_price: 15.0,
        features: [
            "Up to 10 users",
            "All Starter features",
            "5GB storage",
            "Invoicing & scheduling",
            "Custom branding",
            "Email support",
            "AI tools available as add-on",
        ],
    },
    {
        id: "business",
        name: "Business",
        monthly_price: 149,
        annual_price: 1499,
        included_users: 50,
        extra_user_price: 3,
        ai_addon_available: false,
        features: [
            "Up to 50 users",
            "All Pro features",
            "20GB storage",
            "Priority support",
            "Basic AI assistance",
            "Report exports",
        ],
    },
    {
        id: "enterprise",
        name: "Enterprise",
        monthly_price: 500,
        annual_price: 6000,
        included_users: 100,
        extra_user_price: 0,
        ai_addon_available: false,
        features: [
            "Unlimited users",
            "All Business features",
            "100GB+ storage",
            "Dedicated support rep",
            "Advanced AI assistance",
        ],
    },
]

export default function Pricing() {
    return (
        <main className="min-h-screen flex flex-col">
            <section className="py-12 bg-base-200 pt-20">
                <div className="container mx-auto px-4">
                    <h1 className="text-4xl font-bold text-center mb-4">Simple, Transparent Pricing</h1>
                    <p className="text-center mb-12 max-w-2xl mx-auto">
                        Choose the plan that fits your business needs. All plans include a 30-day free trial.
                    </p>

                    <div className="flex justify-center mb-8">
                        <div className="tabs tabs-box">
                            <a className="tab tab-active">Monthly</a>
                            <a className="tab">Annual (Save 15%)</a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {pricingData.map((plan) => (
                            <div key={plan.id} className="card bg-base-100 shadow-xl">
                                <div className="card-body">
                                    <h2 className="card-title text-2xl justify-center">{plan.name}</h2>
                                    <div className="text-center my-4">
                                        <span className="text-4xl font-bold">${plan.monthly_price}</span>
                                        <span className="text-base-content/70">/month</span>
                                    </div>

                                    <div className="divider"></div>

                                    <ul className="space-y-6">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start">
                                                <i className="fas fa-check text-success mt-1 mr-2"></i>
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

                                    <div className="card-actions justify-center mt-6">
                                        <Link href={`/register?plan=${plan.id}`} className="btn btn-primary btn-block">
                                            Choose {plan.name}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="py-12">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center mb-8">Frequently Asked Questions</h2>

                    <div className="max-w-3xl mx-auto">
                        <div className="collapse collapse-plus bg-base-200 mb-4">
                            <input type="radio" name="my-accordion-3" checked={true} readOnly />
                            <div className="collapse-title text-xl font-medium">What's included in the free trial?</div>
                            <div className="collapse-content">
                                <p>
                                    Your 30-day free trial includes all features of your selected plan with no restrictions. No credit
                                    card required to start.
                                </p>
                            </div>
                        </div>

                        <div className="collapse collapse-plus bg-base-200 mb-4">
                            <input type="radio" name="my-accordion-3" />
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
