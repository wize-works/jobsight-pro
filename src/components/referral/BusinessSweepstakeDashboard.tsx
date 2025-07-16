'use client';

import { useState, useEffect } from 'react';
import { SweepstakeDashboardResponse, SweepstakeEntry } from '@/types/referral';

interface BusinessSweepstakeDashboardProps {
    businessId: string;
}

export const BusinessSweepstakeDashboard: React.FC<BusinessSweepstakeDashboardProps> = ({
    businessId,
}) => {
    const [data, setData] = useState<SweepstakeDashboardResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchDashboardData();
    }, [businessId]);

    const fetchDashboardData = async () => {
        try {
            setIsLoading(true);
            setError('');

            const response = await fetch(`/api/sweepstake/dashboard?business_id=${businessId}`);

            if (!response.ok) {
                throw new Error('Failed to fetch dashboard data');
            }

            const data: SweepstakeDashboardResponse = await response.json();
            setData(data);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to load dashboard';
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const getEntryTypeIcon = (entryType: string) => {
        switch (entryType) {
            case 'business_signup':
                return 'fas fa-user-plus';
            case 'referral':
                return 'fas fa-handshake';
            case 'bonus':
                return 'fas fa-gift';
            default:
                return 'fas fa-ticket-alt';
        }
    };

    const getEntryTypeLabel = (entryType: string) => {
        switch (entryType) {
            case 'business_signup':
                return 'Business Signup';
            case 'referral':
                return 'Referral Reward';
            case 'bonus':
                return 'Bonus Entry';
            default:
                return 'Entry';
        }
    };

    const getEntryTypeColor = (entryType: string) => {
        switch (entryType) {
            case 'business_signup':
                return 'badge-primary';
            case 'referral':
                return 'badge-success';
            case 'bonus':
                return 'badge-warning';
            default:
                return 'badge-neutral';
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-error">
                <i className="fas fa-exclamation-triangle"></i>
                <span>{error}</span>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const { stats, entries } = data;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">
                    <i className="fas fa-trophy text-warning mr-2"></i>
                    Sweepstake Dashboard
                </h2>
                <p className="text-base-content/70">
                    Track your entries and referral progress
                </p>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat bg-base-100 shadow-lg rounded-lg">
                    <div className="stat-figure text-primary">
                        <i className="fas fa-ticket-alt text-2xl"></i>
                    </div>
                    <div className="stat-title">Total Entries</div>
                    <div className="stat-value text-primary">{stats.totalEntries}</div>
                    <div className="stat-desc">Your chances to win</div>
                </div>

                <div className="stat bg-base-100 shadow-lg rounded-lg">
                    <div className="stat-figure text-success">
                        <i className="fas fa-user-plus text-2xl"></i>
                    </div>
                    <div className="stat-title">Signup Entries</div>
                    <div className="stat-value text-success">{stats.businessSignups}</div>
                    <div className="stat-desc">From account creation</div>
                </div>

                <div className="stat bg-base-100 shadow-lg rounded-lg">
                    <div className="stat-figure text-info">
                        <i className="fas fa-handshake text-2xl"></i>
                    </div>
                    <div className="stat-title">Confirmed Referrals</div>
                    <div className="stat-value text-info">{stats.confirmedReferrals}</div>
                    <div className="stat-desc">Successful referrals</div>
                </div>

                <div className="stat bg-base-100 shadow-lg rounded-lg">
                    <div className="stat-figure text-warning">
                        <i className="fas fa-clock text-2xl"></i>
                    </div>
                    <div className="stat-title">Pending Referrals</div>
                    <div className="stat-value text-warning">{stats.pendingReferrals}</div>
                    <div className="stat-desc">Awaiting subscription</div>
                </div>
            </div>

            {/* Referral Code Display */}
            {stats.referralCode && (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h3 className="card-title">Your Referral Code</h3>
                        <div className="flex items-center gap-4">
                            <div className="font-mono text-2xl font-bold text-primary">
                                {stats.referralCode}
                            </div>
                            <button
                                className="btn btn-outline btn-primary btn-sm"
                                onClick={() => navigator.clipboard.writeText(stats.referralCode)}
                            >
                                <i className="fas fa-copy mr-2"></i>
                                Copy
                            </button>
                        </div>
                        <p className="text-sm text-base-content/70 mt-2">
                            Share this code with other businesses to earn referral entries
                        </p>
                    </div>
                </div>
            )}

            {/* Entry History */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <h3 className="card-title mb-4">Entry History</h3>

                    {entries.length === 0 ? (
                        <div className="text-center py-8 text-base-content/70">
                            <i className="fas fa-ticket-alt text-4xl mb-4"></i>
                            <p>No entries yet. Start by signing up for a plan!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {entries.map((entry: SweepstakeEntry) => (
                                <div
                                    key={entry.id}
                                    className="flex items-center justify-between p-4 bg-base-200 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                            <i className={`${getEntryTypeIcon(entry.entry_type)} text-primary`}></i>
                                        </div>
                                        <div>
                                            <div className="font-semibold">{getEntryTypeLabel(entry.entry_type)}</div>
                                            <div className="text-sm text-base-content/70">
                                                {new Date(entry.created_at).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {entry.plan_type && (
                                            <span className="badge badge-outline">{entry.plan_type}</span>
                                        )}
                                        <span className={`badge ${getEntryTypeColor(entry.entry_type)}`}>
                                            {getEntryTypeLabel(entry.entry_type)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Call to Action */}
            <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <div className="card-body text-center">
                    <h3 className="card-title justify-center mb-2">
                        <i className="fas fa-bullhorn text-primary mr-2"></i>
                        Boost Your Entries!
                    </h3>
                    <p className="text-base-content/70 mb-4">
                        Share your referral code with other businesses to earn more entries
                    </p>
                    <div className="flex justify-center gap-2">
                        <button className="btn btn-primary btn-sm">
                            <i className="fas fa-share mr-2"></i>
                            Share Code
                        </button>
                        <button className="btn btn-outline btn-primary btn-sm">
                            <i className="fas fa-trophy mr-2"></i>
                            View Rules
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
