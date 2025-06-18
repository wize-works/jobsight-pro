"use client";
import { useState, useEffect } from "react";
import pricingPlans from '../../../../../docs/jobsight_pricing_with_ai_addon.json';
import Link from "next/link";

export default function ROICalculator() {
    const [employees, setEmployees] = useState(50);
    const [avgSalary, setAvgSalary] = useState(75000);
    const [timeWasted, setTimeWasted] = useState(15);
    const [projectsPerMonth, setProjectsPerMonth] = useState(15);
    const [avgProjectValue, setAvgProjectValue] = useState(50000);
    const [selectedPlan, setSelectedPlan] = useState('pro'); const [results, setResults] = useState({
        annualCost: 0,
        timeSaved: 0,
        monthlyCostSavings: 0,
        monthlyErrorReduction: 0,
        monthlyCommunicationEfficiency: 0,
        totalMonthlySavings: 0,
        roi: 0,
        paybackPeriod: 0
    });

    const currentPlan = pricingPlans.find(plan => plan.id === selectedPlan);
    const jobsightCost = currentPlan?.monthly_price || 49; // Fallback to Pro plan monthly cost

    useEffect(() => {
        calculateROI();
    }, [employees, avgSalary, timeWasted, projectsPerMonth, avgProjectValue, selectedPlan]); const calculateROI = () => {
        const hourlyRate = avgSalary / 2080; // 40 hours/week * 52 weeks
        const hoursWastedPerEmployee = (timeWasted / 100) * 40; // hours per week
        const totalHoursWasted = hoursWastedPerEmployee * employees * 52; // annual
        const annualWasteCost = totalHoursWasted * hourlyRate;

        const timeSavedPercent = 80; // Jobsight saves 80% of wasted time
        const timeSaved = totalHoursWasted * (timeSavedPercent / 100);
        const monthlyTimeSaved = timeSaved / 12; // Convert to monthly
        const costSavings = timeSaved * hourlyRate;
        const monthlyCostSavings = costSavings / 12;

        // Additional calculations based on project value and frequency
        const annualProjects = projectsPerMonth * 12;
        const errorReduction = annualProjects * avgProjectValue * 0.05; // 5% error reduction
        const monthlyErrorReduction = errorReduction / 12;

        const communicationEfficiency = employees * 520; // $520 per employee annually
        const monthlyCommunicationEfficiency = communicationEfficiency / 12;

        const annualJobsightCost = jobsightCost * 12;
        const totalMonthlySavings = monthlyCostSavings + monthlyErrorReduction + monthlyCommunicationEfficiency;
        const netSavings = (totalMonthlySavings * 12) - annualJobsightCost;
        const roi = ((netSavings / annualJobsightCost) * 100);
        const paybackPeriod = annualJobsightCost / totalMonthlySavings;

        setResults({
            annualCost: Math.round(annualWasteCost),
            timeSaved: Math.round(monthlyTimeSaved), // Now monthly
            monthlyCostSavings: Math.round(monthlyCostSavings),
            monthlyErrorReduction: Math.round(monthlyErrorReduction),
            monthlyCommunicationEfficiency: Math.round(monthlyCommunicationEfficiency),
            totalMonthlySavings: Math.round(totalMonthlySavings),
            roi: Math.round(roi),
            paybackPeriod: Math.round(paybackPeriod * 10) / 10
        });
    };

    return (
        <section className="py-12 bg-base-100">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl font-bold text-center mb-8">Calculate Your ROI</h2>
                <p className="text-center mb-12 max-w-2xl mx-auto">
                    See how much time and money you could save with Jobsight Pro
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {/* Input Section */}
                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <h3 className="card-title text-xl mb-6">Your Business Details</h3>
                            <div className="form-control mb-6">
                                <label className="label">
                                    <span className="label-text font-semibold">Select Your Plan</span>
                                </label>
                                <div className="tabs tabs-box w-full">
                                    {pricingPlans.filter(plan => plan.id !== 'personal').map((plan) => (
                                        <button
                                            key={plan.id}
                                            className={`tab flex-1 ${selectedPlan === plan.id ? 'tab-active' : ''}`}
                                            onClick={() => setSelectedPlan(plan.id)}
                                        >
                                            <div className="text-center">
                                                <div className="font-semibold">{plan.name}</div>
                                                <div className="text-xs opacity-70">${plan.monthly_price}/mo</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center mt-2">
                                    <span className="badge badge-outline">
                                        {currentPlan?.name} Plan - ${jobsightCost}/month
                                    </span>
                                </div>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Number of Employees</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="500"
                                    value={employees}
                                    onChange={(e) => setEmployees(Number(e.target.value))}
                                    className="range range-secondary w-full"
                                />
                                <div className="w-full flex justify-between text-xs px-2">
                                    <span>1</span>
                                    <span>250</span>
                                    <span>500</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="badge badge-secondary badge-lg">{employees} employees</span>
                                </div>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Average Employee Salary</span>
                                </label>
                                <input
                                    type="range"
                                    min="40000"
                                    max="150000"
                                    step="5000"
                                    value={avgSalary}
                                    onChange={(e) => setAvgSalary(Number(e.target.value))}
                                    className="range range-secondary w-full"
                                />
                                <div className="w-full flex justify-between text-xs px-2">
                                    <span>$40k</span>
                                    <span>$95k</span>
                                    <span>$150k</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="badge badge-secondary badge-lg">${avgSalary.toLocaleString()}/year</span>
                                </div>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Time Wasted on Admin Tasks</span>
                                </label>
                                <input
                                    type="range"
                                    min="5"
                                    max="40"
                                    value={timeWasted}
                                    onChange={(e) => setTimeWasted(Number(e.target.value))}
                                    className="range range-secondary w-full"
                                />
                                <div className="w-full flex justify-secondary text-xs px-2">
                                    <span>5%</span>
                                    <span>22%</span>
                                    <span>40%</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="badge badge-secondary badge-lg">{timeWasted}% of work time</span>
                                </div>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Projects per Month</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="50"
                                    value={projectsPerMonth}
                                    onChange={(e) => setProjectsPerMonth(Number(e.target.value))}
                                    className="range range-secondary w-full"
                                />
                                <div className="w-full flex justify-between text-xs px-2">
                                    <span>1</span>
                                    <span>25</span>
                                    <span>50</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="badge badge-secondary badge-lg">{projectsPerMonth} projects</span>
                                </div>
                            </div>

                            <div className="form-control mb-4">
                                <label className="label">
                                    <span className="label-text font-semibold">Average Project Value</span>
                                </label>
                                <input
                                    type="range"
                                    min="10000"
                                    max="500000"
                                    step="5000"
                                    value={avgProjectValue}
                                    onChange={(e) => setAvgProjectValue(Number(e.target.value))}
                                    className="range range-secondary w-full"
                                />
                                <div className="w-full flex justify-between text-xs px-2">
                                    <span>$10k</span>
                                    <span>$255k</span>
                                    <span>$500k</span>
                                </div>
                                <div className="text-center mt-2">
                                    <span className="badge badge-secondary badge-lg">${avgProjectValue.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Results Section */}
                    <div className="card bg-base-100 shadow-xl" id="roi">
                        <div className="card-body">
                            <h3 className="card-title text-xl mb-6">Your Potential Savings</h3>

                            <div className="space-y-4">
                                {/* Time Savings */}
                                <div className="bg-info/10 border border-info rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-info rounded-full flex items-center justify-center">
                                            <i className="far fa-clock text-white fa-fw fa-2xl"></i>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-info">Time Savings</h4>
                                            <div className="text-2xl font-bold text-info">{results.timeSaved} hours/month</div>
                                            <div className="text-info">${results.monthlyCostSavings.toLocaleString()} monthly value</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Error Reduction */}
                                <div className="bg-secondary/10 border border-secondary rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                                            <i className="far fa-check-circle text-white fa-fw fa-2xl"></i>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-secondary">Error Reduction</h4>
                                            <div className="text-2xl font-bold text-secondary">${results.monthlyErrorReduction.toLocaleString()}</div>
                                            <div className="text-secondary">monthly savings from fewer mistakes</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Communication Efficiency */}
                                <div className="bg-accent/10 border border-accent rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                                            <i className="far fa-comments text-white fa-fw fa-2xl"></i>
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-semibold text-accent">Communication Efficiency</h4>
                                            <div className="text-2xl font-bold text-accent">${results.monthlyCommunicationEfficiency.toLocaleString()}</div>
                                            <div className="text-accent">monthly savings from better coordination</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Total Monthly Savings */}
                                <div className="bg-success/10 border border-success/40 rounded-lg p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center">
                                            <i className="far fa-arrow-trend-up text-white fa-fw fa-2xl"></i>
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-lg font-semibold text-success">Total Monthly Savings</h4>
                                            <div className="text-3xl font-bold text-success">${results.totalMonthlySavings.toLocaleString()}</div>
                                            <div className="mt-2 space-y-1">
                                                <div className="text-success font-semibold">ROI: {results.roi}%</div>
                                                <div className="text-success">Payback period: {results.paybackPeriod} months</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="alert alert-info mt-6">
                                <i className="far fa-info-circle fa-xl mr-2"></i>
                                <span>Based on {currentPlan?.name} plan at ${jobsightCost}/month. Results may vary based on implementation and usage.</span>
                            </div>

                            <Link href="/api/auth/register?post_login_redirect_url=%2Fregister" className="btn btn-primary btn-block btn-xl mt-6">
                                Start Saving Today <i className="fas fa-arrow-right ml-2"></i>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}