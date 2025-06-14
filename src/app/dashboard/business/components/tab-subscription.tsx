"use client";

import { useState, useEffect } from "react";
import {
    getCurrentSubscription,
    cancelSubscription,
    getSubscriptionPlans,
    createSubscription,
} from "@/app/actions/subscriptions";
import {
    createCheckoutSession,
    createBillingPortalSession,
    updateStripeSubscription,
} from "@/app/actions/stripe";
import type {
    BusinessSubscription,
    SubscriptionPlan,
    BillingInterval,
} from "@/types/subscription";
import { toast } from "@/hooks/use-toast";

export const TabSubscription = () => {
    const [currentSubscription, setCurrentSubscription] =
        useState<BusinessSubscription | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [billingInterval, setBillingInterval] =
        useState<BillingInterval>("monthly");
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [subscription, subscriptionPlans] = await Promise.all([
                getCurrentSubscription(),
                getSubscriptionPlans(),
            ]);

            setCurrentSubscription(subscription);
            setPlans(subscriptionPlans);
        } catch (error) {
            console.error("Error loading subscription data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePlanChange = async (planId: string) => {
        try {
            setIsUpdating(true);

            // Handle personal plan separately (no Stripe required)
            if (planId === "personal") {
                const result = await createSubscription(
                    planId,
                    billingInterval,
                );
                if (result.success) {
                    await loadData();
                    showToast("Subscription updated successfully!", "success");
                } else {
                    showToast(
                        result.error || "Failed to update subscription",
                        "error",
                    );
                }
                return;
            }

            // Handle other paid plans
            if (currentSubscription?.stripe_subscription_id) {
                // User has existing Stripe subscription, update it
                const result = await updateStripeSubscription(
                    planId,
                    billingInterval,
                );
                if (!result.success) {
                    throw new Error(
                        result.error || "Failed to update subscription",
                    );
                }
            } else {
                // New Stripe customer, redirect to checkout
                const result = await createCheckoutSession(
                    planId,
                    billingInterval,
                );
                if (result.success && result.sessionUrl) {
                    window.location.href = result.sessionUrl;
                    return;
                } else {
                    throw new Error(
                        result.error || "Failed to create checkout session",
                    );
                }
            }
        } catch (error) {
            console.error("Error updating subscription:", error);
            showToast("Failed to update subscription", "error");
        } finally {
            setIsUpdating(false);
        }
    };

    const showToast = (message: string, type: "success" | "error") => {
        const toast = document.createElement("div");
        toast.className = "toast toast-top toast-end";
        toast.innerHTML = `
            <div class="alert alert-${type}">
                <span>${message}</span>
            </div>
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    };

    const handleCancelSubscription = async () => {
        setIsLoading(true);
        try {
            // For Stripe subscriptions, redirect to billing portal
            if (currentSubscription?.stripe_subscription_id) {
                const result = await createBillingPortalSession();
                if (result.success && result.sessionUrl) {
                    window.location.href = result.sessionUrl;
                } else {
                    showToast(
                        result.error || "Failed to access billing portal",
                        "error",
                    );
                }
            } else {
                // For local-only subscriptions (like personal plan)
                const result = await cancelSubscription();
                if (result.success) {
                    showToast("Subscription cancelled successfully", "success");
                    await loadData();
                } else {
                    showToast(
                        result.error || "Failed to cancel subscription",
                        "error",
                    );
                }
            }
        } catch (error) {
            console.error("Error canceling subscription:", error);
            showToast("Failed to cancel subscription", "error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleManageBilling = async () => {
        setIsLoading(true);
        try {
            const result = await createBillingPortalSession();
            if (result.success && result.sessionUrl) {
                window.location.href = result.sessionUrl;
            } else {
                toast.error(result.error || "Failed to access billing portal");
            }
        } catch (error) {
            console.error("Error accessing billing portal:", error);
            toast.error("Failed to access billing portal");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <div className="skeleton h-32 w-full"></div>
                <div className="skeleton h-64 w-full"></div>
            </div>
        );
    }

    const currentPlan = plans.find(
        (plan) => plan.id === currentSubscription?.plan_id,
    );
    const getPrice = (plan: SubscriptionPlan) =>
        billingInterval === "monthly" ? plan.monthly_price : plan.annual_price;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Choose Your Plan</h2>
                <p className="text-base-content/70 max-w-2xl mx-auto">
                    Select the plan that fits your business needs. You can
                    upgrade or downgrade at any time.
                </p>
            </div>

            {/* Current Subscription Status */}
            {currentSubscription && currentPlan && (
                <div className="alert alert-success">
                    <i className="fas fa-check-circle"></i>
                    <div>
                        <div className="font-medium">
                            Active Subscription: {currentPlan.name}
                        </div>
                        <div className="text-sm">
                            ${getPrice(currentPlan)}/
                            {billingInterval === "monthly" ? "month" : "year"} •
                            Started{" "}
                            {new Date(
                                currentSubscription.start_date || "",
                            ).toLocaleDateString()}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {currentSubscription?.stripe_subscription_id && (
                            <button
                                className="btn btn-sm btn-outline"
                                onClick={handleManageBilling}
                                disabled={isUpdating}
                            >
                                Manage Billing
                            </button>
                        )}
                        <button
                            className="btn btn-sm btn-outline btn-error"
                            onClick={handleCancelSubscription}
                            disabled={isUpdating}
                        >
                            {currentSubscription?.stripe_subscription_id
                                ? "Cancel via Stripe"
                                : "Cancel Plan"}
                        </button>
                    </div>
                </div>
            )}

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
                <div className="tabs tabs-boxed">
                    <a
                        className={`tab ${billingInterval === "monthly" ? "tab-active" : ""}`}
                        onClick={() => setBillingInterval("monthly")}
                    >
                        Monthly
                    </a>
                    <a
                        className={`tab ${billingInterval === "annual" ? "tab-active" : ""}`}
                        onClick={() => setBillingInterval("annual")}
                    >
                        Annual
                        <span className="badge badge-success ml-2 text-xs">
                            Save 17%
                        </span>
                    </a>
                </div>
            </div>

            {/* Pricing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-4 gap-6">
                {plans.map((plan) => {
                    const price = getPrice(plan);
                    const isCurrentPlan =
                        currentSubscription?.plan_id === plan.id;
                    const isPopular = plan.id === "pro";

                    return (
                        <div
                            key={plan.id}
                            className={`card bg-base-100 shadow-xl relative ${
                                isCurrentPlan ? "ring-2 ring-primary" : ""
                            } ${isPopular ? "border-accent border-2" : ""}`}
                        >
                            {isPopular && (
                                <div className="badge badge-accent absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                                    Most Popular
                                </div>
                            )}

                            <div className="card-body">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="card-title text-2xl">
                                        {plan.name}
                                    </h2>
                                    {isCurrentPlan && (
                                        <span className="badge badge-primary">
                                            Current
                                        </span>
                                    )}
                                </div>

                                <div className="text-center my-4">
                                    <span className="text-4xl font-bold">
                                        ${price}
                                    </span>
                                    <span className="text-base-content/70">
                                        /
                                        {billingInterval === "monthly"
                                            ? "month"
                                            : "year"}
                                    </span>
                                </div>

                                <div className="divider"></div>

                                <ul className="space-y-3 mb-6">
                                    {plan.features.map((feature, index) => (
                                        <li
                                            key={index}
                                            className="flex items-start"
                                        >
                                            <i className="fas fa-check text-success mt-1 mr-3 text-sm"></i>
                                            <span className="text-sm">
                                                {feature}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {plan.ai_addon_available && (
                                    <div className="bg-base-200 p-3 rounded-lg mb-4 text-sm">
                                        <p className="font-semibold">
                                            AI Add-on Available
                                        </p>
                                        <p>+${plan.ai_addon_price}/month</p>
                                    </div>
                                )}

                                <div className="card-actions justify-center mt-auto">
                                    {isCurrentPlan ? (
                                        <button
                                            className="btn btn-outline btn-block"
                                            disabled
                                        >
                                            Current Plan
                                        </button>
                                    ) : (
                                        <button
                                            className={`btn btn-block ${
                                                plan.id === "starter"
                                                    ? "btn-outline"
                                                    : isPopular
                                                      ? "btn-accent"
                                                      : "btn-primary"
                                            }`}
                                            onClick={() =>
                                                handlePlanChange(plan.id)
                                            }
                                            disabled={isUpdating}
                                        >
                                            {isUpdating ? (
                                                <>
                                                    <span className="loading loading-spinner loading-sm"></span>
                                                    Processing...
                                                </>
                                            ) : currentSubscription ? (
                                                `Switch to ${plan.name}`
                                            ) : (
                                                `Choose ${plan.name}`
                                            )}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
