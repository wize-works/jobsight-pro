'use client';

import { useState, useEffect } from 'react';
import { ReferralCodeResponse } from '@/types/referral';

interface ReferralCodeGeneratorProps {
    businessId: string;
    onCodeGenerated?: (code: string) => void;
}

export const ReferralCodeGenerator: React.FC<ReferralCodeGeneratorProps> = ({
    businessId,
    onCodeGenerated,
}) => {
    const [referralCode, setReferralCode] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    useEffect(() => {
        fetchReferralCode();
    }, [businessId]);

    const fetchReferralCode = async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await fetch(`/api/businesses/${businessId}/referral-code`);

            if (!response.ok) {
                throw new Error('Failed to fetch referral code');
            }

            const data: ReferralCodeResponse = await response.json();
            setReferralCode(data.referral_code || '');

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load referral code';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const generateReferralCode = async () => {
        try {
            setIsGenerating(true);
            setError('');

            const response = await fetch(`/api/businesses/${businessId}/referral-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to generate referral code');
            }

            const data: ReferralCodeResponse = await response.json();
            setReferralCode(data.referral_code);

            if (onCodeGenerated) {
                onCodeGenerated(data.referral_code);
            }

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to generate referral code';
            setError(errorMessage);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(referralCode);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
        }
    };

    const shareReferralCode = async () => {
        const shareData = {
            title: 'JobSight Pro Referral',
            text: `Join JobSight Pro using my referral code: ${referralCode}`,
            url: `${window.location.origin}/sign-up?ref=${referralCode}`,
        };

        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                // Fallback: copy to clipboard
                await copyToClipboard();
            }
        } catch (error) {
            console.error('Failed to share:', error);
        }
    };

    if (isLoading) {
        return (
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <div className="flex items-center justify-center py-8">
                        <span className="loading loading-spinner loading-lg"></span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
                <h3 className="card-title text-xl mb-4">
                    <i className="fas fa-share-alt text-primary mr-2"></i>
                    Your Referral Code
                </h3>

                {error && (
                    <div className="alert alert-error mb-4">
                        <i className="fas fa-exclamation-triangle"></i>
                        <span>{error}</span>
                    </div>
                )}

                {referralCode ? (
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label">
                                <span className="label-text">Share this code with other businesses:</span>
                            </label>
                            <div className="input-group">
                                <input
                                    type="text"
                                    className="input input-bordered flex-1 font-mono text-lg text-center"
                                    value={referralCode}
                                    readOnly
                                />
                                <button
                                    className="btn btn-primary"
                                    onClick={copyToClipboard}
                                    disabled={copySuccess}
                                >
                                    {copySuccess ? (
                                        <>
                                            <i className="fas fa-check"></i>
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-copy"></i>
                                            Copy
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                className="btn btn-outline btn-primary flex-1"
                                onClick={shareReferralCode}
                            >
                                <i className="fas fa-share mr-2"></i>
                                Share Code
                            </button>
                        </div>

                        <div className="alert alert-info">
                            <i className="fas fa-info-circle"></i>
                            <div className="text-sm">
                                <div className="font-semibold">How it works:</div>
                                <ul className="mt-1 space-y-1">
                                    <li>• Share your code with other businesses</li>
                                    <li>• They enter it during signup for Starter, Pro, or Business plans</li>
                                    <li>• Both of you earn sweepstake entries when they subscribe</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="alert alert-warning">
                            <i className="fas fa-exclamation-triangle"></i>
                            <span>You don't have a referral code yet.</span>
                        </div>

                        <button
                            className="btn btn-primary"
                            onClick={generateReferralCode}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-plus mr-2"></i>
                                    Generate Referral Code
                                </>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
