'use client';

import * as Clerk from '@clerk/elements/common';
import * as SignUp from '@clerk/elements/sign-up';
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { getSubscriptionPlans, createSubscription } from "@/app/actions/subscriptions";
import { createCheckoutSession } from "@/app/actions/stripe";
import { createBusiness, getUserBusiness } from "@/app/actions/business";
import { createSelf, getSelfByAuthId } from "@/app/actions/users";
import type { SubscriptionPlan } from "@/types/subscription";
import type { UserInsert } from "@/types/users";

// Password validation component
const PasswordField = () => {
    const [password, setPassword] = useState('');
    const [showRequirements, setShowRequirements] = useState(false);
    const [clerkError, setClerkError] = useState<string>('');

    const requirements = [
        { text: 'At least 8 characters', test: (pwd: string) => pwd.length >= 8 },
        { text: 'One uppercase letter', test: (pwd: string) => /[A-Z]/.test(pwd) },
        { text: 'One lowercase letter', test: (pwd: string) => /[a-z]/.test(pwd) },
        { text: 'One number', test: (pwd: string) => /\d/.test(pwd) },
        { text: 'One special character', test: (pwd: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) }
    ];

    const allRequirementsMet = requirements.every(req => req.test(password));

    // Enhanced error messages for common Clerk password rejections
    const getErrorMessage = (error: string) => {
        if (error.toLowerCase().includes('pwned') || error.toLowerCase().includes('breach') || error.toLowerCase().includes('leaked')) {
            return 'This password has been found in data breaches and is not secure. Please choose a different password.';
        }
        if (error.toLowerCase().includes('common') || error.toLowerCase().includes('weak')) {
            return 'This password is too common. Please choose a more unique password.';
        }
        if (error.toLowerCase().includes('dictionary')) {
            return 'This password contains common dictionary words. Please make it more unique.';
        }
        return error; // Return the original error if we don't have a specific message
    };

    return (
        <Clerk.Field name="password" className="form-control">
            <Clerk.Label className="label">
                <span className="label-text">Password</span>
            </Clerk.Label>
            <Clerk.Input
                className={`input input-bordered w-full ${clerkError ? 'input-error' : ''}`}
                onFocus={() => setShowRequirements(true)}
                onBlur={() => setShowRequirements(false)}
                onChange={(e) => {
                    setPassword(e.target.value);
                    // Clear clerk error when user starts typing a new password
                    if (clerkError) setClerkError('');
                }}
            />

            {/* Clerk field error - enhanced to capture and display better messages */}
            <Clerk.FieldError className="label">
                {(fieldError) => {
                    if (fieldError?.message) {
                        const enhancedError = getErrorMessage(fieldError.message);
                        setClerkError(enhancedError);
                        return (
                            <div className='alert alert-error mt-2 p-3 w-full'>
                                <span className="whitespace-break-spaces">{enhancedError}</span>
                            </div>
                        );
                    }
                    return null;
                }}
            </Clerk.FieldError>

            {/* Show additional security warning for breached passwords */}
            {clerkError && (clerkError.toLowerCase().includes('breach') || clerkError.toLowerCase().includes('leaked')) && (
                <div className="alert alert-warning mt-2 p-3">
                    <svg className="w-4 h-4 text-warning" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="text-sm">
                        <div className="font-medium">Security Alert</div>
                        <div>For your protection, we don't allow passwords that have been compromised in data breaches.</div>
                    </div>
                </div>
            )}

            {/* Password requirements - show when focused or when there's text */}
            {(showRequirements || password.length > 0) && (
                <div className="mt-2 p-3 bg-base-200 rounded-lg text-xs">
                    <div className="font-medium text-base-content mb-2">
                        Password Requirements:
                        {password.length > 0 && (
                            <span className={`ml-2 badge badge-sm ${allRequirementsMet ? 'badge-success' : 'badge-warning'}`}>
                                {allRequirementsMet ? 'All met ✓' : `${requirements.filter(req => req.test(password)).length}/${requirements.length} met`}
                            </span>
                        )}
                    </div>
                    <div className="space-y-1">
                        {requirements.map((req, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <svg
                                    className={`w-3 h-3 ${req.test(password) ? 'text-success' : 'text-base-content/40'}`}
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                                <span className={req.test(password) ? 'text-success' : 'text-base-content/60'}>
                                    {req.text}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Additional security tip */}
                    {allRequirementsMet && (
                        <div className="mt-3 p-2 bg-info/10 rounded border border-info/20">
                            <div className="flex items-start gap-2 text-info">
                                <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                </svg>
                                <span className="text-xs">
                                    Tip: Use a unique password you haven't used elsewhere for maximum security.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Clerk.Field>
    );
};

export default function SignUpPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const searchParams = useSearchParams();

    // Registration flow state
    const [currentStep, setCurrentStep] = useState<'auth' | 'business' | 'plans' | 'processing'>('auth');
    const [isProcessing, setIsProcessing] = useState(false);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string>("");
    const [billingInterval, setBillingInterval] = useState<"monthly" | "annual">("monthly");

    // Business form state
    const [businessForm, setBusinessForm] = useState({
        businessName: "",
        businessType: "General Contractor",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
    });

    useEffect(() => {
        setMounted(true);

        // Load subscription plans
        const loadPlans = async () => {
            try {
                const subscriptionPlans = await getSubscriptionPlans();
                setPlans(subscriptionPlans);
            } catch (error) {
                console.error("Error loading plans:", error);
            }
        };
        loadPlans();

        // Check for pre-selected plan from URL
        const planParam = searchParams.get("plan");
        if (planParam) {
            setSelectedPlan(planParam);
        }
    }, [searchParams]);

    // Handle user authentication state and flow progression
    useEffect(() => {
        const handleUserFlow = async () => {
            if (!isLoaded || !user) return;

            if (isSignedIn && user) {
                // Check if user already has complete setup
                try {
                    const dbUser = await getSelfByAuthId(user.id);
                    if (dbUser) {
                        const userBusiness = await getUserBusiness(user.id);
                        if (userBusiness) {
                            // User has complete setup, redirect to dashboard
                            router.push("/dashboard");
                            return;
                        }
                    }

                    // User is authenticated but needs to complete registration
                    // Check what step they're on based on available data
                    const hasBusinessInfo = user.unsafeMetadata?.businessName;

                    if (!hasBusinessInfo) {
                        setCurrentStep('business');
                    } else {
                        setCurrentStep('plans');
                    }
                } catch (error) {
                    console.error("Error checking user status:", error);
                    setCurrentStep('business');
                }
            } else {
                setCurrentStep('auth');
            }
        };

        handleUserFlow();
    }, [isLoaded, isSignedIn, user, router]);

    // Handle business form submission
    const handleBusinessFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error({
                title: "Authentication Error",
                description: "You must be signed in to continue",
            });
            return;
        }

        if (!businessForm.businessName.trim()) {
            toast.warning({
                title: "Business Name Required",
                description: "Please enter your business name",
            });
            return;
        }

        setIsProcessing(true);

        try {
            // Save business info to Clerk metadata first
            await user.update({
                unsafeMetadata: {
                    businessName: businessForm.businessName,
                    businessType: businessForm.businessType,
                    businessEmail: businessForm.email,
                    businessPhone: businessForm.phone,
                    businessAddress: businessForm.address,
                    businessCity: businessForm.city,
                    businessState: businessForm.state,
                    businessZip: businessForm.zipCode,
                    businessCountry: businessForm.country,
                }
            });

            // Proceed to plan selection
            setCurrentStep('plans');
        } catch (error) {
            console.error("Error saving business info:", error);
            toast.error({
                title: "Error",
                description: "Failed to save business information",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    // Handle plan selection and complete registration
    const handlePlanSelect = async (planId: string) => {
        if (!user) {
            toast.error({
                title: "Authentication Error",
                description: "You must be signed in to continue",
            });
            return;
        }

        setSelectedPlan(planId);
        setIsProcessing(true);
        setCurrentStep('processing');

        try {
            // Create user record in database
            const dbUser = await getSelfByAuthId(user.id);
            if (!dbUser) {
                await createSelf({
                    auth_id: user.id,
                    email: user.emailAddresses[0]?.emailAddress || "",
                    first_name: user.firstName || "",
                    last_name: user.lastName || "",
                    avatar_url: user.imageUrl || "",
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    created_by: user.id,
                    updated_by: user.id,
                    status: "active",
                } as UserInsert);
            }

            // Create business record in database
            const businessResult = await createBusiness({
                userId: user.id,
                businessName: businessForm.businessName,
                businessType: businessForm.businessType,
                email: businessForm.email || user.emailAddresses[0]?.emailAddress || "",
                phoneNumber: businessForm.phone,
                address: businessForm.address,
                city: businessForm.city,
                state: businessForm.state,
                zipCode: businessForm.zipCode,
                country: businessForm.country,
            });

            if (!businessResult.success) {
                throw new Error(businessResult.error || "Failed to create business");
            }

            // Handle subscription based on plan type
            if (planId === "personal" || planId === "free") {
                // For free plans, create subscription directly
                const subscriptionResult = await createSubscription(planId, billingInterval);

                if (subscriptionResult.success) {
                    toast.success({
                        title: "Welcome to JobSight!",
                        description: "Your account has been set up successfully",
                    });
                    router.push("/dashboard");
                } else {
                    throw new Error(subscriptionResult.error || "Failed to create subscription");
                }
            } else {
                // For paid plans, redirect to Stripe checkout
                const checkoutResult = await createCheckoutSession(
                    businessResult.businessId!,
                    planId,
                    billingInterval
                );

                if (checkoutResult.success && checkoutResult.sessionUrl) {
                    // Redirect to Stripe checkout
                    window.location.href = checkoutResult.sessionUrl;
                } else {
                    throw new Error(checkoutResult.error || "Failed to create checkout session");
                }
            }
        } catch (error) {
            console.error("Error completing registration:", error);
            toast.error({
                title: "Registration Error",
                description: error instanceof Error ? error.message : "Failed to complete registration",
            });
            setCurrentStep('plans');
        } finally {
            setIsProcessing(false);
        }
    };

    // Loading state
    if (!mounted || !isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg"></div>
                    <p className="mt-4">Loading...</p>
                </div>
            </div>
        );
    }

    // Processing state
    if (currentStep === 'processing' || isProcessing) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg"></div>
                    <p className="mt-4">Setting up your account...</p>
                </div>
            </div>
        );
    }

    // Business information collection step
    if (currentStep === 'business') {
        return (
            <main className="min-h-screen flex flex-col lg:flex-row relative">
                {/* Left Side - Business Information Form */}
                <section className="bg-base-100 w-full lg:w-1/2 flex flex-col items-center justify-center min-h-screen p-6">
                    <div className="w-full max-w-md">
                        {/* Logo */}
                        <div className="mb-8 text-center">
                            {mounted && resolvedTheme === "dark" ? (
                                <Image
                                    src="/logo-full-white.png"
                                    alt="JobSight Logo"
                                    width={200}
                                    height={16}
                                    className="mx-auto"
                                />
                            ) : (
                                <Image
                                    src="/logo-full.png"
                                    alt="JobSight Logo"
                                    width={200}
                                    height={16}
                                    className="mx-auto"
                                />
                            )}
                            <h1 className="text-2xl font-bold mt-4 text-base-content">Tell us about your business</h1>
                            <p className="text-base-content/70 mt-2">Help us customize JobSight for your construction business</p>
                        </div>

                        {/* Business Information Form */}
                        <form className="space-y-6" onSubmit={handleBusinessFormSubmit}>
                            {/* Business Name */}
                            <div className="space-y-2">
                                <label className="label">
                                    <span className="label-text">Business Name <span className="text-error">*</span></span>
                                </label>
                                <input
                                    required
                                    className="input input-bordered w-full"
                                    placeholder="Your construction company name"
                                    value={businessForm.businessName}
                                    onChange={(e) => setBusinessForm({ ...businessForm, businessName: e.target.value })}
                                />
                            </div>

                            {/* Business Type */}
                            <div className="space-y-2">
                                <label className="label">
                                    <span className="label-text">Business Type</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={businessForm.businessType}
                                    onChange={(e) => setBusinessForm({ ...businessForm, businessType: e.target.value })}
                                >
                                    <option value="General Contractor">General Contractor</option>
                                    <option value="Electrical">Electrical</option>
                                    <option value="Plumbing">Plumbing</option>
                                    <option value="HVAC">HVAC</option>
                                    <option value="Roofing">Roofing</option>
                                    <option value="Concrete">Concrete</option>
                                    <option value="Landscaping">Landscaping</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>

                            {/* Contact Information */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="label">
                                        <span className="label-text">Business Email</span>
                                    </label>
                                    <input
                                        type="email"
                                        className="input input-bordered w-full"
                                        placeholder="business@company.com"
                                        value={businessForm.email}
                                        onChange={(e) => setBusinessForm({ ...businessForm, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="label">
                                        <span className="label-text">Phone Number</span>
                                    </label>
                                    <input
                                        type="tel"
                                        className="input input-bordered w-full"
                                        placeholder="(555) 123-4567"
                                        value={businessForm.phone}
                                        onChange={(e) => setBusinessForm({ ...businessForm, phone: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-2">
                                <label className="label">
                                    <span className="label-text">Business Address</span>
                                </label>
                                <input
                                    className="input input-bordered w-full"
                                    placeholder="123 Main Street"
                                    value={businessForm.address}
                                    onChange={(e) => setBusinessForm({ ...businessForm, address: e.target.value })}
                                />
                            </div>

                            {/* City, State, ZIP */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="label">
                                        <span className="label-text">City</span>
                                    </label>
                                    <input
                                        className="input input-bordered w-full"
                                        placeholder="City"
                                        value={businessForm.city}
                                        onChange={(e) => setBusinessForm({ ...businessForm, city: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="label">
                                        <span className="label-text">State</span>
                                    </label>
                                    <input
                                        className="input input-bordered w-full"
                                        placeholder="State"
                                        value={businessForm.state}
                                        onChange={(e) => setBusinessForm({ ...businessForm, state: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="label">
                                        <span className="label-text">ZIP Code</span>
                                    </label>
                                    <input
                                        className="input input-bordered w-full"
                                        placeholder="12345"
                                        value={businessForm.zipCode}
                                        onChange={(e) => setBusinessForm({ ...businessForm, zipCode: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    className="btn btn-outline flex-1"
                                    onClick={() => setCurrentStep('plans')}
                                >
                                    Skip for Now
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? "Saving..." : "Continue"}
                                </button>
                            </div>
                        </form>
                    </div>
                </section>

                {/* Right Side - Benefits */}
                <section className="bg-primary w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 min-h-screen">
                    <div className="max-w-lg mx-auto text-center lg:text-left">
                        <h2 className="text-4xl font-bold text-primary-content mb-6">
                            Built for Construction
                        </h2>
                        <p className="text-xl text-primary-content/90 mb-10">
                            JobSight understands the unique needs of construction businesses.
                        </p>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-white rounded-full p-2 mt-1 flex-shrink-0">
                                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-primary-content">Industry-Specific Features</h3>
                                    <p className="text-primary-content/80">Tools designed specifically for construction workflows</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-white rounded-full p-2 mt-1 flex-shrink-0">
                                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-primary-content">Quick Setup</h3>
                                    <p className="text-primary-content/80">Get up and running in minutes, not hours</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="bg-white rounded-full p-2 mt-1 flex-shrink-0">
                                    <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-primary-content">Scalable Solutions</h3>
                                    <p className="text-primary-content/80">Grow from solo contractor to enterprise</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    // Subscription plan selection step
    if (currentStep === 'plans') {
        return (
            <div className="min-h-screen bg-base-200 py-12">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-8">
                        {mounted && resolvedTheme === "dark" ? (
                            <Image
                                src="/logo-full-white.png"
                                alt="JobSight Logo"
                                width={200}
                                height={50}
                                className="mx-auto mb-4"
                            />
                        ) : (
                            <Image
                                src="/logo-full.png"
                                alt="JobSight Logo"
                                width={200}
                                height={50}
                                className="mx-auto mb-4"
                            />
                        )}
                        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
                        <p className="text-lg">Select a subscription plan to get started with JobSight Pro</p>
                    </div>

                    <div className="flex justify-center mb-8">
                        <div className="tabs tabs-boxed">
                            <button
                                className={`tab ${billingInterval === "monthly" ? "tab-active" : ""}`}
                                onClick={() => setBillingInterval("monthly")}
                            >
                                Monthly
                            </button>
                            <button
                                className={`tab ${billingInterval === "annual" ? "tab-active" : ""}`}
                                onClick={() => setBillingInterval("annual")}
                            >
                                Annual (Save 15%)
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`card bg-base-100 shadow-xl ${selectedPlan === plan.id ? "ring-2 ring-primary" : ""}`}
                            >
                                <div className="card-body">
                                    <h2 className="card-title text-2xl justify-center">
                                        {plan.name}
                                    </h2>
                                    <div className="text-center my-4">
                                        <span className="text-4xl font-bold">
                                            $
                                            {billingInterval === "monthly"
                                                ? plan.monthly_price
                                                : plan.annual_price}
                                        </span>
                                        <span className="text-base-content/70">
                                            /{billingInterval === "monthly" ? "month" : "year"}
                                        </span>
                                    </div>

                                    <div className="divider"></div>

                                    <ul className="space-y-2 mb-6">
                                        {plan.features.map((feature, index) => (
                                            <li
                                                key={index}
                                                className="flex items-start text-sm"
                                            >
                                                <svg
                                                    className="h-4 w-4 text-success mt-0.5 mr-2 flex-shrink-0"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M5 13l4 4L19 7"
                                                    />
                                                </svg>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        onClick={() => handlePlanSelect(plan.id)}
                                        className="btn btn-primary btn-block"
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? "Processing..." : `Choose ${plan.name}`}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-8">
                        <button
                            onClick={() => setCurrentStep('business')}
                            className="btn btn-ghost"
                        >
                            ← Back to Business Info
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Normal sign-up flow for users who haven't signed up yet (auth step)
    return (
        <main className="min-h-screen flex flex-col lg:flex-row relative">
            {/* Left Side - Sign Up Form */}
            <section className="bg-base-100 w-full lg:w-1/2 flex flex-col items-center justify-center min-h-screen p-6">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="mb-8 text-center">
                        {mounted && resolvedTheme === "dark" ? (
                            <Image
                                src="/logo-full-white.png"
                                alt="JobSight Logo"
                                width={200}
                                height={16}
                                className="mx-auto"
                            />
                        ) : (
                            <Image
                                src="/logo-full.png"
                                alt="JobSight Logo"
                                width={200}
                                height={16}
                                className="mx-auto"
                            />
                        )}
                        <p className="text-base-content/70 mt-6">Start managing your construction projects today</p>
                    </div>

                    {/* Clerk Sign Up Component */}
                    <SignUp.Root>
                        {/* Start Step */}
                        <SignUp.Step name="start" className="space-y-6">
                            {/* Social Sign Up */}
                            <div>
                                Social sign-in options are currently disabled. Please use email and password to sign in.
                            </div>
                            {/* <div className="grid grid-cols-3 gap-3">
                                <Clerk.Connection
                                    name="google"
                                    className="btn btn-outline justify-center gap-3"
                                >
                                    <i className='fab fa-google' />
                                    Google
                                </Clerk.Connection>
                                <Clerk.Connection
                                    name="apple"
                                    className="btn btn-outline justify-center gap-3"
                                >
                                    <i className='fab fa-apple' />
                                    Apple
                                </Clerk.Connection>
                                <Clerk.Connection
                                    name="facebook"
                                    className="btn btn-outline justify-center gap-3"
                                >
                                    <i className='fab fa-facebook' />
                                    Facebook
                                </Clerk.Connection>
                            </div>

                            <div className="divider">or continue with email</div> */}

                            {/* Email Sign Up */}
                            <div className="space-y-4">
                                <div className='grid grid-cols-2 gap-6'>
                                    <Clerk.Field name="firstName" className="form-control">
                                        <Clerk.Label className="label">
                                            <span className="label-text">First name</span>
                                        </Clerk.Label>
                                        <Clerk.Input className="input input-bordered w-full" />
                                        <Clerk.FieldError className="label">
                                            <span className="label-text-alt text-error" />
                                        </Clerk.FieldError>
                                    </Clerk.Field>

                                    <Clerk.Field name="lastName" className="form-control">
                                        <Clerk.Label className="label">
                                            <span className="label-text">Last name</span>
                                        </Clerk.Label>
                                        <Clerk.Input className="input input-bordered w-full" />
                                        <Clerk.FieldError className="label">
                                            <span className="label-text-alt text-error" />
                                        </Clerk.FieldError>
                                    </Clerk.Field>
                                </div>

                                <Clerk.Field name="emailAddress" className="form-control">
                                    <Clerk.Label className="label">
                                        <span className="label-text">Email address</span>
                                    </Clerk.Label>
                                    <Clerk.Input className="input input-bordered w-full" />
                                    <Clerk.FieldError className="label">
                                        <span className="label-text-alt text-error" />
                                    </Clerk.FieldError>
                                </Clerk.Field>

                                <PasswordField />

                                <div id="clerk-captcha"></div>

                                <SignUp.Action submit className="btn btn-primary w-full">
                                    Create Account
                                </SignUp.Action>
                            </div>

                            <div className="text-center">
                                <span className="text-sm text-base-content/70">
                                    Already have an account?{" "}
                                    <Link href="/sign-in" className="link link-primary">
                                        Sign in
                                    </Link>
                                </span>
                            </div>
                        </SignUp.Step>

                        {/* Verifications Step */}
                        <SignUp.Step name="verifications" className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold mb-2">Verify your email</h2>
                                <p className="text-base-content/70 mb-6">
                                    We've sent a verification code to your email address
                                </p>
                            </div>

                            <SignUp.Strategy name="email_code">
                                <Clerk.Field name="code" className="form-control">
                                    <Clerk.Label className="label">
                                        <span className="label-text">Verification code</span>
                                    </Clerk.Label>
                                    <Clerk.Input className="input input-bordered w-full text-center" />
                                    <Clerk.FieldError className="label">
                                        <span className="label-text-alt text-error" />
                                    </Clerk.FieldError>
                                </Clerk.Field>

                                <SignUp.Action submit className="btn btn-primary w-full">
                                    Verify Email
                                </SignUp.Action>

                                <SignUp.Action resend className="btn btn-ghost w-full">
                                    Resend Code
                                </SignUp.Action>
                            </SignUp.Strategy>
                        </SignUp.Step>

                        {/* Continue Step */}
                        <SignUp.Step name="continue" className="space-y-6">
                            <div className="text-center">
                                <h2 className="text-xl font-semibold mb-2">Almost done!</h2>
                                <p className="text-base-content/70 mb-6">
                                    Complete your profile to get started
                                </p>
                            </div>

                            {/* We'll handle business info collection in our custom step */}
                            <div className="text-center">
                                <button
                                    className="btn btn-primary w-full"
                                    onClick={() => setCurrentStep('business')}
                                >
                                    Continue Setup
                                </button>
                            </div>
                        </SignUp.Step>
                    </SignUp.Root>
                </div>
            </section>

            {/* Right Side - Hero */}
            <section className="bg-primary w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 min-h-screen">
                <div className="max-w-lg mx-auto text-center lg:text-left">
                    <h2 className="text-4xl font-bold text-primary-content mb-6">
                        Build Better Projects
                    </h2>
                    <p className="text-xl text-primary-content/90 mb-10">
                        Join thousands of construction professionals who trust JobSight to manage their projects, track progress, and grow their business.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-white rounded-full p-2 mt-1 flex-shrink-0">
                                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary-content">Project Management</h3>
                                <p className="text-primary-content/80">Keep your projects on track and on budget</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-white rounded-full p-2 mt-1 flex-shrink-0">
                                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary-content">Team Collaboration</h3>
                                <p className="text-primary-content/80">Connect your team and subcontractors</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-white rounded-full p-2 mt-1 flex-shrink-0">
                                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary-content">Financial Tracking</h3>
                                <p className="text-primary-content/80">Monitor costs and profitability in real-time</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}