'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from '@/hooks/use-toast';

interface SetupUserFormProps {
    onSetupComplete: () => void;
}

export default function SetupUserForm({ onSetupComplete }: SetupUserFormProps) {
    const { user } = useUser();
    const [selectedOption, setSelectedOption] = useState<'seed' | 'empty' | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSetup = async () => {
        setIsLoading(true);
        setError(null);

        const useSeedData = selectedOption === 'seed';

        try {
            if (useSeedData) {
                const response = await fetch('/api/setup-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        userName: user?.fullName || user?.firstName || 'User',
                        userEmail: user?.emailAddresses[0]?.emailAddress || '',
                        seedData: true,
                    }),
                });

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(result.error || 'Failed to setup account');
                }
            } else {
                // For empty setup, we need to explicitly mark the setup as complete
                await markSetupCompleted();
            }

            // Success! Call the completion callback
            onSetupComplete();

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Create a function to mark setup as complete regardless of seed data
    const markSetupCompleted = async () => {
        try {
            // If using seed data, the API call already handles marking setup complete
            const useSeedData = selectedOption === 'seed';

            if (useSeedData) {
                return;
            }

            // If not using seed data, we need to make a separate API call to mark setup as complete
            const response = await fetch('/api/mark-setup-complete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error({
                    title: 'Setup Error',
                    description: result.error || 'Failed to mark setup as complete',
                });
                throw new Error(result.error || 'Failed to mark setup as complete');
            }

            console.log('[SetupUserForm] Setup marked as complete:', result);
        } catch (error) {
            console.error('[SetupUserForm] Error marking setup as complete:', error);
            throw error; // Re-throw to be handled by the caller
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-base-200 p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="text-center mb-6">
                        <div className="text-primary text-5xl mb-4">
                            <i className="far fa-hammer"></i>
                        </div>
                        <h2 className="card-title text-2xl justify-center mb-2">
                            Welcome to JobSight Pro!
                        </h2>
                        <p className="text-base-content/60">
                            How would you like to get started?
                        </p>
                    </div>

                    <div className="space-y-4">
                        {/* Sample Data Option */}
                        <div
                            className={`card bg-base-200 cursor-pointer transition-all hover:bg-base-300 ${selectedOption === 'seed' ? 'ring-2 ring-primary bg-primary/10' : ''
                                }`}
                            onClick={() => setSelectedOption('seed')}
                        >
                            <div className="card-body p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <input
                                            type="radio"
                                            name="setup-option"
                                            className="radio radio-primary"
                                            checked={selectedOption === 'seed'}
                                            onChange={() => setSelectedOption('seed')}
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold text-base mb-1">
                                            Start with sample data
                                        </h3>
                                        <p className="text-sm text-base-content/60 mb-2">
                                            Explore all features with pre-loaded projects, crews, and equipment
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            <div className="badge badge-outline badge-xs">Demo Projects</div>
                                            <div className="badge badge-outline badge-xs">Sample Crews</div>
                                            <div className="badge badge-outline badge-xs">Equipment</div>
                                            <div className="badge badge-outline badge-xs">Daily Logs</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Empty Start Option */}
                        <div
                            className={`card bg-base-200 cursor-pointer transition-all hover:bg-base-300 ${selectedOption === 'empty' ? 'ring-2 ring-primary bg-primary/10' : ''
                                }`}
                            onClick={() => setSelectedOption('empty')}
                        >
                            <div className="card-body p-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0">
                                        <input
                                            type="radio"
                                            name="setup-option"
                                            className="radio radio-primary"
                                            checked={selectedOption === 'empty'}
                                            onChange={() => setSelectedOption('empty')}
                                        />
                                    </div>
                                    <div className="flex-grow">
                                        <h3 className="font-semibold text-base mb-1">
                                            Start fresh
                                        </h3>
                                        <p className="text-sm text-base-content/60 mb-2">
                                            Begin with a clean slate and add your own data
                                        </p>
                                        <div className="flex flex-wrap gap-1">
                                            <div className="badge badge-outline badge-xs">Clean Setup</div>
                                            <div className="badge badge-outline badge-xs">Your Data</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-error mt-4">
                            <i className="far fa-exclamation-triangle"></i>
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="card-actions justify-center mt-6">
                        <button
                            onClick={() => handleSetup()}
                            disabled={!selectedOption || isLoading}
                            className="btn btn-primary btn-wide"
                        >
                            {isLoading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Setting up...
                                </>
                            ) : (
                                <>
                                    <i className="far fa-rocket mr-2"></i>
                                    Get Started
                                </>
                            )}
                        </button>
                    </div>

                    <div className="text-center mt-4">
                        <p className="text-xs text-base-content/50">
                            You can change these settings later in your dashboard
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
