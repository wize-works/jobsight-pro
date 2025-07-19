"use client";

import { useState, useEffect } from "react";
import { useSubscriptionManager } from "@/hooks/useSubscriptions";
import { useStripeCheckout, useStripeBillingPortal } from "@/hooks/useStripe";
import type {
    BusinessSubscription,
    SubscriptionPlan,
    BillingInterval,
} from "@/types/subscription";
import { toast } from "@/hooks/use-toast";
import { useBusiness } from "@/lib/business-context";

export const TabSubscription = () => {
    const { businessId } = useBusiness();
    const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");

    // Use the subscription manager hook
    const {
        subscription: currentSubscription,
        plans,
        loading: isLoading,
        error,
        createOrUpdateSubscription,
        cancelCurrentSubscription,
        refreshData
    } = useSubscriptionManager(businessId || '');

    // Use Stripe hooks
    const { createCheckoutSession, loading: checkoutLoading } = useStripeCheckout();
    const { createBillingPortalSession, loading: billingLoading } = useStripeBillingPortal();

    const [isUpdating, setIsUpdating] = useState(false);

    // Remove the useEffect that calls refreshData - the useSubscriptionManager hook already handles fetching data when businessId changes

    const handlePlanChange = async (planId: string) => {
        try {
            setIsUpdating(true);

            // Handle personal plan separately (no Stripe required)
            if (planId === "personal") {
                const result = await createOrUpdateSubscription(planId, billingInterval);

                if (result.success) {
                    toast({
                        title: "Success",
                        description: "Subscription updated successfully!",
                        variant: "success"
                    });
                    await refreshData();
                } else {
                    toast({
                        title: "Error",
                        description: result.error || "Failed to update subscription",
                        variant: "error"
                    });
                }
                return;
            }

            // For paid plans, check if user has existing Stripe subscription
            if (currentSubscription?.stripe_subscription_id) {
                // User has existing Stripe subscription - update it directly
                const result = await createOrUpdateSubscription(planId, billingInterval);

                if (result.success) {
                    toast({
                        title: "Success",
                        description: "Subscription updated successfully!",
                        variant: "success"
                    });
                    await refreshData();
                } else {
                    toast({
                        title: "Error",
                        description: result.error || "Failed to update subscription",
                        variant: "error"
                    });
                }
            } else {
                // New Stripe customer, redirect to checkout
                const result = await createCheckoutSession({
                    planId,
                    billingInterval,
                });
                if (!result.success) {
                    toast({
                        title: "Error",
                        description: result.error || "Failed to create checkout session",
                        variant: "error"
                    });
                }
                // Redirect is handled automatically by the hook
            }
        } catch (error) {
            console.error("Error updating subscription:", error);
            toast({
                title: "Error",
                description: "Failed to update subscription",
                variant: "error"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancelSubscription = async () => {
        setIsUpdating(true);
        try {
            // For Stripe subscriptions, redirect to billing portal
            if (currentSubscription?.stripe_subscription_id) {
                const result = await createBillingPortalSession();
                if (!result.success) {
                    toast({
                        title: "Error",
                        description: result.error || "Failed to access billing portal",
                        variant: "error"
                    });
                }
                // Redirect is handled automatically by the hook
            } else {
                // For local-only subscriptions (like personal plan)
                const result = await cancelCurrentSubscription();
                if (result.success) {
                    toast({
                        title: "Success",
                        description: "Subscription cancelled successfully",
                        variant: "success"
                    });
                    await refreshData();
                } else {
                    toast({
                        title: "Error",
                        description: result.error || "Failed to cancel subscription",
                        variant: "error"
                    });
                }
            }
        } catch (error) {
            console.error("Error canceling subscription:", error);
            toast({
                title: "Error",
                description: "Failed to cancel subscription",
                variant: "error"
            });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleManageBilling = async () => {
        setIsUpdating(true);
        try {
            const result = await createBillingPortalSession();
            if (!result.success) {
                toast({
                    title: "Error",
                    description: result.error || "Failed to access billing portal",
                    variant: "error"
                });
            }
            // Redirect is handled automatically by the hook
        } catch (error) {
            console.error("Error accessing billing portal:", error);
            toast({
                title: "Error",
                description: "Failed to access billing portal",
                variant: "error"
            });
        } finally {
            setIsUpdating(false);
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
                    <i className="far fa-check-circle"></i>
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
                            className={`card bg-base-100 shadow-xl relative ${isCurrentPlan ? "ring-2 ring-primary" : ""
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
                                            <i className="far fa-check text-success mt-1 mr-3 text-sm"></i>
                                            <span className="text-sm">
                                                {feature}
                                            </span>                                        </li>
                                    ))}
                                </ul>

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
                                            className={`btn btn-block ${plan.id === "starter"
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
