'use client';

import { ReferralStats as ReferralStatsType } from '@/types/referral';

interface ReferralStatsProps {
    stats: ReferralStatsType;
    loading?: boolean;
}

export const ReferralStats: React.FC<ReferralStatsProps> = ({ stats, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="card bg-base-100 shadow-lg animate-pulse">
                        <div className="card-body">
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const statItems = [
        {
            title: 'Total Entries',
            value: stats.totalEntries,
            icon: '🏆',
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-50',
            description: 'Sweepstake entries earned',
        },
        {
            title: 'Business Signups',
            value: stats.businessSignups,
            icon: '👥',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            description: 'From business registration',
        },
        {
            title: 'Confirmed Referrals',
            value: stats.confirmedReferrals,
            icon: '✅',
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            description: 'Successful referrals',
        },
        {
            title: 'Pending Referrals',
            value: stats.pendingReferrals,
            icon: '⏰',
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            description: 'Awaiting subscription',
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Referral Statistics</h3>
                    <p className="text-sm text-gray-600">
                        Your referral code: <span className="badge badge-outline">{stats.referralCode}</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-gray-600">Business Name</p>
                    <p className="font-medium">{stats.businessName}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statItems.map((item) => (
                    <div key={item.title} className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="flex items-center justify-between">
                                <h4 className="card-title text-sm font-medium text-gray-600">
                                    {item.title}
                                </h4>
                                <div className={`p-2 rounded-full ${item.bgColor}`}>
                                    <span className="text-lg">{item.icon}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="text-2xl font-bold">{item.value}</div>
                                <p className="text-xs text-gray-500">{item.description}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {stats.totalEntries > 0 && (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body">
                        <h4 className="card-title text-sm">Performance Summary</h4>
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Referral Success Rate</span>
                                <span className="font-medium">
                                    {stats.confirmedReferrals > 0
                                        ? `${Math.round((stats.confirmedReferrals / (stats.confirmedReferrals + stats.pendingReferrals)) * 100)}%`
                                        : '0%'
                                    }
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Entries per Referral</span>
                                <span className="font-medium">
                                    {stats.confirmedReferrals > 0
                                        ? Math.round(stats.totalEntries / stats.confirmedReferrals * 10) / 10
                                        : '0'
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
