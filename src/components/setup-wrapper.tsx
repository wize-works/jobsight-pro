'use client';

import { useUserSetup } from '@/hooks/use-user-setup';
import SetupUserForm from './setup-user-form';

interface SetupWrapperProps {
    children: React.ReactNode;
}

export default function SetupWrapper({ children }: SetupWrapperProps) {
    const {
        needsSetup,
        isLoading,
        error,
        markSetupComplete,
        isBusinessOwner,
        businessSetupPending,
        checkSetupStatus
    } = useUserSetup();

    console.log('[SetupWrapper] Render with needsSetup:', needsSetup,
        'isLoading:', isLoading,
        'error:', error,
        'isBusinessOwner:', isBusinessOwner,
        'businessSetupPending:', businessSetupPending);

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

    // Show setup form if user needs setup and is the business owner
    if (needsSetup) {
        console.log('[SetupWrapper] User needs setup, showing SetupUserForm');
        return <SetupUserForm onSetupComplete={markSetupComplete} />;
    }

    // If business setup is pending but user is not the owner, show pending notice
    if (businessSetupPending && !isBusinessOwner) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-base-200" key={`setup-pending-${Date.now()}`}>
                <div className="card w-96 bg-base-100 shadow-xl">
                    <div className="card-body text-center">
                        <div className="text-warning text-4xl mb-4">
                            <i className="far fa-clock"></i>
                        </div>
                        <h2 className="card-title justify-center">Setup Pending</h2>
                        <p className="text-base-content/60 mb-4">
                            The business owner needs to complete the setup process before you can access the dashboard.
                        </p>
                        <p className="text-sm text-base-content/40">
                            Please contact the business owner to complete the setup.
                        </p>
                        <div className="card-actions justify-center mt-4">
                            <button
                                onClick={() => {
                                    // Use the hook's checkSetupStatus directly instead of page reload
                                    console.log('[SetupWrapper] Manually checking setup status');
                                    markSetupComplete(); // Reset UI immediately 
                                    checkSetupStatus(); // Then check the actual status
                                }}
                                className="btn btn-outline btn-warning"
                            >
                                <i className="far fa-redo mr-2"></i>
                                Check Again
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // User is all set up, show the main app
    return (
        <>
            {/* Temporary debug info - remove after debugging */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed bottom-24 right-4 z-50 bg-info text-info-content p-2 rounded shadow-lg text-xs">
                    <div>Setup Status: {needsSetup ? 'Needs Setup' : 'Setup Complete'}</div>
                    <div>Owner: {isBusinessOwner ? 'Yes' : 'No'}</div>
                    <div>Setup Pending: {businessSetupPending ? 'Yes' : 'No'}</div>
                    <button
                        onClick={checkSetupStatus}
                        className="btn btn-xs btn-primary mt-2"
                    >
                        Refresh Status
                    </button>
                </div>
            )}
            {children}
        </>
    );
}
