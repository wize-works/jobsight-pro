'use client';

import { useUserSetup } from '@/hooks/use-user-setup';
import SetupUserForm from './setup-user-form';

interface SetupWrapperProps {
    children: React.ReactNode;
}

export default function SetupWrapper({ children }: SetupWrapperProps) {
    const { needsSetup, isLoading, error, markSetupComplete } = useUserSetup();

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary"></div>
                    <p className="mt-4 text-base-content/60">Checking your setup...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200">
                <div className="card w-96 bg-base-100 shadow-xl">
                    <div className="card-body text-center">
                        <div className="text-error text-4xl mb-4">
                            <i className="far fa-exclamation-triangle"></i>
                        </div>
                        <h2 className="card-title justify-center text-error">Something went wrong</h2>
                        <p className="text-base-content/60">{error}</p>
                        <div className="card-actions justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="btn btn-error"
                            >
                                <i className="far fa-redo mr-2"></i>
                                Try Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Show setup form if user needs setup
    if (needsSetup) {
        return <SetupUserForm onSetupComplete={markSetupComplete} />;
    }

    // User is all set up, show the main app
    return <>{children}</>;
}
