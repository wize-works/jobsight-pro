
"use client"

import { useState } from "react"
import Link from "next/link"

export default function BillingSettingsPage() {
    const [currentPlan] = useState({
        name: "JobSight Pro",
        price: 49,
        period: "month",
        features: [
            "Unlimited projects",
            "Advanced reporting",
            "Team collaboration",
            "Mobile app access",
            "Priority support"
        ]
    })

    const plans = [
        {
            name: "Starter",
            price: 19,
            period: "month",
            features: ["Up to 5 projects", "Basic reporting", "2 team members"]
        },
        {
            name: "Professional",
            price: 49,
            period: "month",
            features: ["Unlimited projects", "Advanced reporting", "10 team members", "Mobile app"],
            current: true
        },
        {
            name: "Enterprise",
            price: 99,
            period: "month",
            features: ["Everything in Pro", "Custom integrations", "Unlimited team members", "Dedicated support"]
        }
    ]

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/settings" className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">Billing & Subscription</h1>
                </div>
            </div>

            <div className="space-y-6">
                {/* Current Plan */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Current Plan</h2>
                        
                        <div className="flex items-center justify-between p-4 bg-primary bg-opacity-10 rounded-lg">
                            <div>
                                <h3 className="font-bold text-lg">{currentPlan.name}</h3>
                                <p className="text-sm text-base-content/70">
                                    ${currentPlan.price}/{currentPlan.period} • Next billing: December 15, 2024
                                </p>
                            </div>
                            <div className="text-right">
                                <button className="btn btn-outline btn-sm mb-2">
                                    Change Plan
                                </button>
                                <br />
                                <button className="btn btn-ghost btn-xs text-error">
                                    Cancel Subscription
                                </button>
                            </div>
                        </div>

                        <div className="mt-4">
                            <h4 className="font-semibold mb-2">Current Plan Features:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                                {currentPlan.features.map((feature, index) => (
                                    <li key={index}>{feature}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Available Plans */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Available Plans</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {plans.map((plan, index) => (
                                <div 
                                    key={index} 
                                    className={`card border-2 ${plan.current ? 'border-primary bg-primary/5' : 'border-base-300'}`}
                                >
                                    <div className="card-body">
                                        <div className="text-center">
                                            <h3 className="font-bold text-lg">{plan.name}</h3>
                                            <div className="text-3xl font-bold text-primary my-2">
                                                ${plan.price}
                                                <span className="text-sm font-normal">/{plan.period}</span>
                                            </div>
                                        </div>
                                        
                                        <ul className="space-y-2 text-sm">
                                            {plan.features.map((feature, featureIndex) => (
                                                <li key={featureIndex} className="flex items-center gap-2">
                                                    <i className="fas fa-check text-success"></i>
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="card-actions justify-end mt-4">
                                            {plan.current ? (
                                                <span className="badge badge-primary">Current Plan</span>
                                            ) : (
                                                <button className="btn btn-outline btn-sm">
                                                    {plan.price > currentPlan.price ? 'Upgrade' : 'Downgrade'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Payment Method */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Payment Method</h2>
                        
                        <div className="flex items-center justify-between p-4 bg-base-200 rounded-lg">
                            <div className="flex items-center gap-3">
                                <i className="fab fa-cc-visa text-2xl text-primary"></i>
                                <div>
                                    <p className="font-medium">•••• •••• •••• 4242</p>
                                    <p className="text-sm text-base-content/70">Expires 12/25</p>
                                </div>
                            </div>
                            <button className="btn btn-outline btn-sm">
                                Update Card
                            </button>
                        </div>
                    </div>
                </div>

                {/* Billing History */}
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h2 className="card-title text-xl mb-4">Billing History</h2>
                        
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Description</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Nov 15, 2024</td>
                                        <td>JobSight Pro - Monthly</td>
                                        <td>$49.00</td>
                                        <td><span className="badge badge-success">Paid</span></td>
                                        <td>
                                            <button className="btn btn-ghost btn-xs">
                                                <i className="fas fa-download mr-1"></i>
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Oct 15, 2024</td>
                                        <td>JobSight Pro - Monthly</td>
                                        <td>$49.00</td>
                                        <td><span className="badge badge-success">Paid</span></td>
                                        <td>
                                            <button className="btn btn-ghost btn-xs">
                                                <i className="fas fa-download mr-1"></i>
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Sep 15, 2024</td>
                                        <td>JobSight Pro - Monthly</td>
                                        <td>$49.00</td>
                                        <td><span className="badge badge-success">Paid</span></td>
                                        <td>
                                            <button className="btn btn-ghost btn-xs">
                                                <i className="fas fa-download mr-1"></i>
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
