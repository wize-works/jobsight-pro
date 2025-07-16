'use client';

import { useState } from 'react';
import { ReferralCreationRequest, ReferralCreationResponse } from '@/types/referral';

interface BusinessReferralInputProps {
    businessId: string;
    planType: 'starter' | 'pro' | 'business';
    onReferralSubmit: (code: string, referrerName: string) => Promise<void>;
}

export const BusinessReferralInput: React.FC<BusinessReferralInputProps> = ({
    businessId,
    planType,
    onReferralSubmit,
}) => {
    const [referralCode, setReferralCode] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [referrerName, setReferrerName] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!referralCode.trim()) {
            setError('Please enter a referral code');
            return;
        }

        setIsValidating(true);
        setError('');
        setSuccess('');

        try {
            const request: ReferralCreationRequest = {
                referrer_code: referralCode.trim().toUpperCase(),
                business_id: businessId,
                plan_type: planType,
            };

            const response = await fetch('/api/referrals/business', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data: ReferralCreationResponse = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to create referral');
            }

            setSuccess(`Referral applied! Referred by: ${data.referrer_business}`);
            setReferrerName(data.referrer_business || '');

            // Call the parent callback
            if (onReferralSubmit) {
                await onReferralSubmit(referralCode, data.referrer_business || '');
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to apply referral';
            setError(errorMessage);
        } finally {
            setIsValidating(false);
        }
    };

    const handleSkip = () => {
        // Call parent callback with empty values to skip referral
        if (onReferralSubmit) {
            onReferralSubmit('', '');
        }
    };

    return (
        <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
                <h2 className="card-title text-2xl mb-4">
                    <i className="fas fa-gift text-primary mr-2"></i>
                    Referral Code (Optional)
                </h2>

                <div className="mb-4">
                    <p className="text-base-content/70 mb-2">
                        Have a referral code? Enter it below to give credit to the business that referred you
                        and earn both of you entries in our sweepstake!
                    </p>
                    <div className="alert alert-info">
                        <i className="fas fa-info-circle"></i>
                        <span className="text-sm">
                            Valid for {planType.charAt(0).toUpperCase() + planType.slice(1)} plan and higher
                        </span>
                    </div>
                </div>

                {success && (
                    <div className="alert alert-success mb-4">
                        <i className="fas fa-check-circle"></i>
                        <span>{success}</span>
                    </div>
                )}

                {error && (
                    <div className="alert alert-error mb-4">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="form-control">
                        <label className="label">
                            <span className="label-text">Referral Code</span>
                        </label>
                        <div className="input-group">
                            <input
                                type="text"
                                className="input input-bordered flex-1"
                                placeholder="Enter referral code (e.g., ABC12345)"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                disabled={isValidating || !!success}
                                maxLength={10}
                            />
                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={isValidating || !referralCode.trim() || !!success}
                            >
                                {isValidating ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Validating...
                                    </>
                                ) : (
                                    'Apply'
                                )}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={handleSkip}
                            disabled={isValidating}
                        >
                            Skip for now
                        </button>

                        {success && (
                            <div className="flex items-center text-success">
                                <i className="fas fa-check mr-2"></i>
                                <span className="text-sm">Applied successfully!</span>
                            </div>
                        )}
                    </div>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-sm text-base-content/60">
                        Don't have a referral code? No problem! You can still participate in our sweepstake.
                    </p>
                </div>
            </div>
        </div>
    );
};
