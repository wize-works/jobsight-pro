'use client';

import * as Clerk from '@clerk/elements/common';
import * as SignIn from '@clerk/elements/sign-in';
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignInPage() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <main className="min-h-screen flex flex-col lg:flex-row relative">
            {/* Left Side - Sign In Form */}
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
                        <h1 className="text-2xl font-bold mt-4 text-base-content">Welcome Back</h1>
                        <p className="text-base-content/70 mt-2">Sign in to your JobSight account</p>
                    </div>

                    {/* Custom Clerk Elements Sign In */}
                    <SignIn.Root>
                        <Clerk.Loading>
                            {(isGlobalLoading) => (
                                <>
                                    <SignIn.Step name="start" className='space-y-6'>
                                        {/* Social Sign In */}
                                        <div className="grid grid-cols-3 gap-3">
                                            <Clerk.Connection
                                                name="google"
                                                className="btn btn-outline justify-center gap-3"
                                            >
                                                <i className='fab fa-google' />
                                                Google
                                            </Clerk.Connection>
                                            <Clerk.Connection
                                                name="linkedin_oidc"
                                                className="btn btn-outline justify-center gap-3"
                                            >
                                                <i className='fab fa-linkedin' />
                                                LinkedIn
                                            </Clerk.Connection>
                                            <Clerk.Connection
                                                name="facebook"
                                                className="btn btn-outline justify-center gap-3"
                                            >
                                                <i className='fab fa-facebook' />
                                                Facebook
                                            </Clerk.Connection>
                                        </div>

                                        <div className="divider text-xs text-base-content/50">OR</div>

                                        {/* Email Field */}
                                        <Clerk.Field name="identifier" className="form-control">
                                            <Clerk.Label className="label">
                                                <span className="label-text">Email address</span>
                                            </Clerk.Label>
                                            <Clerk.Input
                                                type="email"
                                                className="input input-bordered w-full"
                                                placeholder="Enter your email"
                                            />
                                            <Clerk.FieldError className="label">
                                                <span className="label-text-alt text-error"></span>
                                            </Clerk.FieldError>
                                        </Clerk.Field>

                                        {/* Password Field */}
                                        <Clerk.Field name="password" className="form-control">
                                            <Clerk.Label className="label">
                                                <span className="label-text">Password</span>
                                            </Clerk.Label>
                                            <Clerk.Input
                                                type="password"
                                                className="input input-bordered w-full"
                                                placeholder="Enter your password"
                                            />
                                            <Clerk.FieldError className="label">
                                                <span className="label-text-alt text-error"></span>
                                            </Clerk.FieldError>
                                        </Clerk.Field>

                                        {/* Forgot Password Link */}
                                        <div className="text-right">
                                            <SignIn.Action navigate="forgot-password" asChild>
                                                <button className="link link-primary text-sm">
                                                    Forgot your password?
                                                </button>
                                            </SignIn.Action>
                                        </div>

                                        {/* Submit Button */}
                                        <SignIn.Action submit asChild>
                                            <button className="btn btn-primary btn-block" disabled={isGlobalLoading}>
                                                {isGlobalLoading ? (
                                                    <>
                                                        <span className="loading loading-spinner loading-sm"></span>
                                                        Signing in...
                                                    </>
                                                ) : (
                                                    "Sign In"
                                                )}
                                            </button>
                                        </SignIn.Action>
                                    </SignIn.Step>

                                    <SignIn.Step name="choose-strategy">
                                        <div className="space-y-4">
                                            <div className="text-center">
                                                <h3 className="text-lg font-medium text-base-content">Choose verification method</h3>
                                                <p className="text-sm text-base-content/70 mt-1">How would you like to verify your identity?</p>
                                            </div>

                                            <SignIn.SupportedStrategy name="email_code" asChild>
                                                <button className="btn btn-outline btn-block">
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                    Email code
                                                </button>
                                            </SignIn.SupportedStrategy>

                                            <SignIn.SupportedStrategy name="password" asChild>
                                                <button className="btn btn-outline btn-block">
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                    Password
                                                </button>
                                            </SignIn.SupportedStrategy>

                                            <SignIn.Action navigate="previous" asChild>
                                                <button className="btn btn-ghost btn-block">
                                                    ← Back
                                                </button>
                                            </SignIn.Action>
                                        </div>
                                    </SignIn.Step>

                                    <SignIn.Step name="verifications">
                                        <SignIn.Strategy name="email_code">
                                            <div className="space-y-4">
                                                <div className="text-center">
                                                    <h3 className="text-lg font-medium text-base-content">Check your email</h3>
                                                    <p className="text-sm text-base-content/70 mt-1">We sent a verification code to your email address</p>
                                                </div>

                                                <Clerk.Field name="code" className="form-control">
                                                    <Clerk.Label className="label">
                                                        <span className="label-text">Verification code</span>
                                                    </Clerk.Label>
                                                    <Clerk.Input
                                                        type="text"
                                                        className="input input-bordered w-full text-center text-lg tracking-widest"
                                                        placeholder="000000"
                                                    />
                                                    <Clerk.FieldError className="label">
                                                        <span className="label-text-alt text-error"></span>
                                                    </Clerk.FieldError>
                                                </Clerk.Field>

                                                <SignIn.Action submit asChild>
                                                    <button className="btn btn-primary btn-block" disabled={isGlobalLoading}>
                                                        {isGlobalLoading ? (
                                                            <>
                                                                <span className="loading loading-spinner loading-sm"></span>
                                                                Verifying...
                                                            </>
                                                        ) : (
                                                            "Verify"
                                                        )}
                                                    </button>
                                                </SignIn.Action>

                                                <div className="text-center">
                                                    <SignIn.Action resend asChild>
                                                        <button className="link link-primary text-sm">
                                                            Resend code
                                                        </button>
                                                    </SignIn.Action>
                                                </div>

                                                <SignIn.Action navigate="previous" asChild>
                                                    <button className="btn btn-ghost btn-block">
                                                        ← Back
                                                    </button>
                                                </SignIn.Action>
                                            </div>
                                        </SignIn.Strategy>

                                        <SignIn.Strategy name="password">
                                            <div className="space-y-4">
                                                <div className="text-center">
                                                    <h3 className="text-lg font-medium text-base-content">Enter your password</h3>
                                                    <p className="text-sm text-base-content/70 mt-1">Please enter your password to continue</p>
                                                </div>

                                                <Clerk.Field name="password" className="form-control">
                                                    <Clerk.Label className="label">
                                                        <span className="label-text">Password</span>
                                                    </Clerk.Label>
                                                    <Clerk.Input
                                                        type="password"
                                                        className="input input-bordered w-full"
                                                        placeholder="Enter your password"
                                                    />
                                                    <Clerk.FieldError className="label">
                                                        <span className="label-text-alt text-error"></span>
                                                    </Clerk.FieldError>
                                                </Clerk.Field>

                                                <SignIn.Action submit asChild>
                                                    <button className="btn btn-primary btn-block" disabled={isGlobalLoading}>
                                                        {isGlobalLoading ? (
                                                            <>
                                                                <span className="loading loading-spinner loading-sm"></span>
                                                                Signing in...
                                                            </>
                                                        ) : (
                                                            "Sign In"
                                                        )}
                                                    </button>
                                                </SignIn.Action>

                                                <SignIn.Action navigate="previous" asChild>
                                                    <button className="btn btn-ghost btn-block">
                                                        ← Back
                                                    </button>
                                                </SignIn.Action>
                                            </div>
                                        </SignIn.Strategy>
                                    </SignIn.Step>

                                    <SignIn.Step name="forgot-password">
                                        <div className="space-y-4">
                                            <div className="text-center">
                                                <h3 className="text-lg font-medium text-base-content">Reset your password</h3>
                                                <p className="text-sm text-base-content/70 mt-1">Enter your email to receive a reset link</p>
                                            </div>

                                            <Clerk.Field name="identifier" className="form-control">
                                                <Clerk.Label className="label">
                                                    <span className="label-text">Email address</span>
                                                </Clerk.Label>
                                                <Clerk.Input
                                                    type="email"
                                                    className="input input-bordered w-full"
                                                    placeholder="Enter your email"
                                                />
                                                <Clerk.FieldError className="label">
                                                    <span className="label-text-alt text-error"></span>
                                                </Clerk.FieldError>
                                            </Clerk.Field>

                                            <SignIn.Action submit asChild>
                                                <button className="btn btn-primary btn-block" disabled={isGlobalLoading}>
                                                    {isGlobalLoading ? (
                                                        <>
                                                            <span className="loading loading-spinner loading-sm"></span>
                                                            Sending...
                                                        </>
                                                    ) : (
                                                        "Send reset link"
                                                    )}
                                                </button>
                                            </SignIn.Action>

                                            <SignIn.Action navigate="previous" asChild>
                                                <button className="btn btn-ghost btn-block">
                                                    ← Back to sign in
                                                </button>
                                            </SignIn.Action>
                                        </div>
                                    </SignIn.Step>
                                </>
                            )}
                        </Clerk.Loading>
                    </SignIn.Root>

                    {/* Footer Links */}
                    <div className="text-center mt-6">
                        <p className="text-sm text-base-content/70">
                            Don't have an account?{' '}
                            <Link href="/sign-up" className="link link-primary font-medium">
                                Sign up here
                            </Link>
                        </p>
                        <div className="divider text-xs text-base-content/50">OR</div>
                        <Link href="/landing" className="link link-secondary text-sm">
                            ← Back to Landing Page
                        </Link>
                    </div>
                </div>
            </section>

            {/* Right Side - Branding */}
            <section className="bg-primary w-full lg:w-1/2 flex flex-col justify-center p-8 lg:p-16 min-h-screen">
                <div className="max-w-lg mx-auto text-center lg:text-left">
                    <h2 className="text-4xl font-bold text-primary-content mb-6">
                        Get Back to Work
                    </h2>
                    <p className="text-xl text-primary-content/90 mb-10">
                        Continue managing your construction projects with the tools that matter.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-white rounded-full p-2 mt-1 flex-shrink-0">
                                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary-content">Quick Access</h3>
                                <p className="text-primary-content/80">Jump right back into your active projects</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-white rounded-full p-2 mt-1 flex-shrink-0">
                                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary-content">Secure Login</h3>
                                <p className="text-primary-content/80">Your data is protected with enterprise-grade security</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="bg-white rounded-full p-2 mt-1 flex-shrink-0">
                                <svg className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-primary-content">Lightning Fast</h3>
                                <p className="text-primary-content/80">Get back to work in seconds, not minutes</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 pt-6 border-t border-primary-content/20">
                        <p className="text-sm text-primary-content/70">
                            Need help? <Link href="/help" className="text-white hover:underline">Contact Support</Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
