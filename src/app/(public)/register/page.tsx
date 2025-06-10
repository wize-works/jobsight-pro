
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { LoginLink, RegisterLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { toast } from "@/hooks/use-toast";
import { getSubscriptionPlans, createSubscription } from "@/app/actions/subscriptions";
import { createBusiness } from "@/app/actions/business";
import { acceptInvitation } from "../onboarding/actions";
import type { SubscriptionPlan } from "@/types/subscription";
import Image from "next/image";

export default function RegisterPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: isAuthLoading, isAuthenticated } = useKindeBrowserClient();

    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string>("");
    const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");
    const [isProcessing, setIsProcessing] = useState(false);
    const [registrationStep, setRegistrationStep] = useState<"plan_selection" | "business_setup" | "processing">("plan_selection");
    const [invitationData, setInvitationData] = useState<any>(null);
    const [businessForm, setBusinessForm] = useState({
        businessName: "",
        businessType: "General Contractor",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States"
    });

    // Check for invitation token or pre-selected plan
    useEffect(() => {
        const token = searchParams.get("token");
        const planParam = searchParams.get("plan");

        if (token) {
            // Handle invitation flow
            try {
                const decoded = JSON.parse(Buffer.from(token, "base64").toString());
                if (new Date(decoded.expiresAt) < new Date()) {
                    toast({
                        title: "Invitation Expired",
                        description: "This invitation link has expired. Please request a new one.",
                        variant: "destructive",
                    });
                    router.push("/");
                    return;
                }
                setInvitationData(decoded);
                setRegistrationStep("processing"); // Skip plan selection for invitations
            } catch (error) {
                toast({
                    title: "Invalid Invitation",
                    description: "Invalid invitation token",
                    variant: "destructive",
                });
                router.push("/");
            }
        } else if (planParam) {
            setSelectedPlan(planParam);
            setRegistrationStep("business_setup");
        }
    }, [searchParams, router]);

    // Load subscription plans
    useEffect(() => {
        const loadPlans = async () => {
            try {
                const subscriptionPlans = await getSubscriptionPlans();
                setPlans(subscriptionPlans);
            } catch (error) {
                console.error("Error loading plans:", error);
            }
        };

        loadPlans();
    }, []);

    // Handle post-auth processing
    useEffect(() => {
        const processRegistration = async () => {
            if (isAuthLoading || !user?.id || isProcessing) return;

            if (invitationData) {
                // Handle invitation acceptance
                setIsProcessing(true);
                try {
                    const result = await acceptInvitation(
                        invitationData.userId,
                        user.id,
                        invitationData.email
                    );

                    if (result.success) {
                        toast({
                            title: "Welcome!",
                            description: "Your invitation has been accepted successfully",
                        });
                        router.push("/dashboard");
                    } else {
                        toast({
                            title: "Error",
                            description: result.error || "Failed to accept invitation",
                            variant: "destructive",
                        });
                        router.push("/");
                    }
                } catch (error) {
                    console.error("Error processing invitation:", error);
                    toast({
                        title: "Error",
                        description: "Failed to process invitation",
                        variant: "destructive",
                    });
                    router.push("/");
                }
                setIsProcessing(false);
            } else if (isAuthenticated && registrationStep === "processing" && selectedPlan && businessForm.businessName) {
                // Handle business creation
                setIsProcessing(true);
                try {
                    const businessResult = await createBusiness({
                        userId: user.id,
                        businessName: businessForm.businessName,
                        businessType: businessForm.businessType,
                        email: businessForm.email,
                        phoneNumber: businessForm.phone,
                        address: businessForm.address,
                        city: businessForm.city,
                        state: businessForm.state,
                        zipCode: businessForm.zipCode,
                        country: businessForm.country,
                    });

                    if (businessResult.success) {
                        // Create subscription with selected plan
                        const subscriptionResult = await createSubscription(selectedPlan, billingInterval);
                        
                        if (subscriptionResult.success) {
                            toast({
                                title: "Welcome to JobSight Pro!",
                                description: "Your business has been set up successfully",
                            });
                            router.push("/dashboard");
                        } else {
                            toast({
                                title: "Business Created",
                                description: "Business created but subscription setup failed. You can set this up later.",
                            });
                            router.push("/dashboard");
                        }
                    } else {
                        toast({
                            title: "Error",
                            description: businessResult.error || "Failed to create business",
                            variant: "destructive",
                        });
                    }
                } catch (error) {
                    console.error("Error creating business:", error);
                    toast({
                        title: "Error",
                        description: "Failed to create business",
                        variant: "destructive",
                    });
                }
                setIsProcessing(false);
            }
        };

        processRegistration();
    }, [user, invitationData, isAuthLoading, isProcessing, registrationStep, selectedPlan, businessForm, router, isAuthenticated, billingInterval]);

    const handlePlanSelect = (planId: string) => {
        setSelectedPlan(planId);
        setRegistrationStep("business_setup");
    };

    const handleBusinessFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!businessForm.businessName.trim()) {
            toast({
                title: "Business Name Required",
                description: "Please enter your business name",
                variant: "destructive",
            });
            return;
        }
        setRegistrationStep("processing");
    };

    // Show loading only if auth is actually loading and we don't have user data yet
    if (isAuthLoading && !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg"></div>
                    <p className="mt-4">Loading...</p>
                </div>
            </div>
        );
    }

    // Show invitation processing for invited users who aren't authenticated
    if (invitationData && !isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card w-full max-w-md bg-base-100 shadow-xl">
                    <div className="card-body text-center">
                        <h1 className="text-2xl font-bold mb-4">Complete Your Invitation</h1>
                        <p className="mb-6">Please sign in to accept your team invitation</p>
                        <RegisterLink className="btn btn-primary w-full mb-2">
                            Create Account
                        </RegisterLink>
                        <LoginLink className="btn btn-ghost w-full">
                            Already have an account? Sign In
                        </LoginLink>
                    </div>
                </div>
            </div>
        );
    }

    // Show processing state for both invitation and business setup
    if (isProcessing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg"></div>
                    <p className="mt-4">
                        {invitationData ? "Processing your invitation..." : "Setting up your business..."}
                    </p>
                </div>
            </div>
        );
    }

    // Show plan selection step (for non-authenticated users or those who haven't selected a plan)
    if (!isAuthenticated && registrationStep === "plan_selection") {
        return (
            <div className="min-h-screen bg-base-200 py-12">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        <Image src="/logo-full.png" alt="JobSight Logo" width={200} height={50} className="mx-auto mb-4" />
                        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
                        <p className="text-lg">Select a subscription plan to get started with JobSight Pro</p>
                    </div>

                    <div className="flex justify-center mb-8">
                        <div className="tabs tabs-boxed">
                            <button
                                className={`tab ${billingInterval === 'monthly' ? 'tab-active' : ''}`}
                                onClick={() => setBillingInterval('monthly')}
                            >
                                Monthly
                            </button>
                            <button
                                className={`tab ${billingInterval === 'annual' ? 'tab-active' : ''}`}
                                onClick={() => setBillingInterval('annual')}
                            >
                                Annual (Save 15%)
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {plans.map((plan) => (
                            <div key={plan.id} className={`card bg-base-100 shadow-xl ${selectedPlan === plan.id ? 'ring-2 ring-primary' : ''}`}>
                                <div className="card-body">
                                    <h2 className="card-title text-2xl justify-center">{plan.name}</h2>
                                    <div className="text-center my-4">
                                        <span className="text-4xl font-bold">
                                            ${billingInterval === 'monthly' ? plan.monthly_price : plan.annual_price}
                                        </span>
                                        <span className="text-base-content/70">
                                            /{billingInterval === 'monthly' ? 'month' : 'year'}
                                        </span>
                                    </div>

                                    <div className="divider"></div>

                                    <ul className="space-y-2 mb-6">
                                        {plan.features.map((feature, index) => (
                                            <li key={index} className="flex items-start text-sm">
                                                <svg className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handlePlanSelect(plan.id)}
                                        className="btn btn-primary btn-block"
                                    >
                                        Choose {plan.name}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <p className="text-sm text-base-content/70">
                            Already have an account? <LoginLink className="link link-primary">Sign In</LoginLink>
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Show business setup step
    if (!isAuthenticated && registrationStep === "business_setup") {
        return (
            <div className="min-h-screen bg-base-200 py-12">
                <div className="container mx-auto px-4 max-w-2xl">
                    <div className="text-center mb-8">
                        <Image src="/logo-full.png" alt="JobSight Logo" width={200} height={50} className="mx-auto mb-4" />
                        <h1 className="text-3xl font-bold mb-2">Create Your Account</h1>
                        <p>Tell us about your business to complete setup</p>
                    </div>

                    <div className="card bg-base-100 shadow-xl">
                        <div className="card-body">
                            <form onSubmit={handleBusinessFormSubmit} className="space-y-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Business Name *</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={businessForm.businessName}
                                        onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                                        required
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Business Type</span>
                                    </label>
                                    <select
                                        className="select select-bordered"
                                        value={businessForm.businessType}
                                        onChange={(e) => setBusinessForm({ ...businessForm, businessType: e.target.value })}
                                    >
                                        <option value="General Contractor">General Contractor</option>
                                        <option value="Electrical">Electrical</option>
                                        <option value="Plumbing">Plumbing</option>
                                        <option value="HVAC">HVAC</option>
                                        <option value="Roofing">Roofing</option>
                                        <option value="Concrete">Concrete</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Email</span>
                                        </label>
                                        <input
                                            type="email"
                                            className="input input-bordered"
                                            value={businessForm.email}
                                            onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Phone</span>
                                        </label>
                                        <input
                                            type="tel"
                                            className="input input-bordered"
                                            value={businessForm.phone}
                                            onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text">Address</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={businessForm.address}
                                        onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">City</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered"
                                            value={businessForm.city}
                                            onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">State</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered"
                                            value={businessForm.state}
                                            onChange={(e) => setBusinessForm({ ...businessForm, state: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">ZIP Code</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered"
                                            value={businessForm.zipCode}
                                            onChange={(e) => setBusinessForm({ ...businessForm, zipCode: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="card-actions justify-between pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setRegistrationStep("plan_selection")}
                                        className="btn btn-ghost"
                                    >
                                        Back to Plans
                                    </button>
                                    <RegisterLink className="btn btn-primary">
                                        Create Account & Continue
                                    </RegisterLink>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // If user is authenticated but hasn't completed setup, redirect to dashboard
    if (isAuthenticated && !invitationData) {
        router.push("/dashboard");
        return null;
    }

    // Default fallback
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <Image
                        src="/logo-full.png"
                        alt="JobSight Pro"
                        width={200}
                        height={60}
                        className="mx-auto mb-4"
                    />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Welcome to JobSight Pro
                    </h1>
                    <p className="text-gray-600">
                        Sign in or create an account to get started
                    </p>
                </div>

                <div className="space-y-4">
                    <LoginLink className="btn btn-primary w-full">
                        Sign In
                    </LoginLink>
                    <RegisterLink className="btn btn-outline w-full">
                        Create Account
                    </RegisterLink>
                </div>
            </div>
        </div>
    );
}
