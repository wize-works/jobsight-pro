'use client';

import { SweepstakeEntry } from '@/types/referral';
import { formatDistanceToNow } from 'date-fns';

interface SweepstakeEntryListProps {
    entries: SweepstakeEntry[];
    loading?: boolean;
    businessName?: string;
}

export const SweepstakeEntryList: React.FC<SweepstakeEntryListProps> = ({
    entries,
    loading,
    businessName
}) => {
    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                        <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (entries.length === 0) {
        return (
            <div className="text-center py-12 bg-base-200 rounded-lg">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">No sweepstake entries yet</h3>
                <p className="text-gray-500 mb-4">
                    Start referring other businesses to earn entries!
                </p>
                <div className="text-sm text-gray-400">
                    Each successful referral earns you sweepstake entries
                </div>
            </div>
        );
    }

    const getEntryIcon = (entryType: string) => {
        switch (entryType) {
            case 'business_signup':
                return '🏢';
            case 'referral':
                return '🤝';
            case 'bonus':
                return '🎁';
            default:
                return '🎯';
        }
    };

    const getEntryColor = (entryType: string) => {
        switch (entryType) {
            case 'business_signup':
                return 'bg-blue-50 border-blue-200';
            case 'referral':
                return 'bg-green-50 border-green-200';
            case 'bonus':
                return 'bg-purple-50 border-purple-200';
            default:
                return 'bg-gray-50 border-gray-200';
        }
    };

    const getEntryTitle = (entry: SweepstakeEntry) => {
        switch (entry.entry_type) {
            case 'business_signup':
                return 'Business Registration';
            case 'referral':
                return 'Successful Referral';
            case 'bonus':
                return 'Bonus Entry';
            default:
                return 'Sweepstake Entry';
        }
    };

    const getEntryDescription = (entry: SweepstakeEntry) => {
        switch (entry.entry_type) {
            case 'business_signup':
                return `${businessName || 'Your business'} registered and subscribed to the ${entry.plan_type} plan`;
            case 'referral':
                return `A business you referred subscribed to the ${entry.plan_type} plan`;
            case 'bonus':
                return 'Special bonus entry awarded';
            default:
                return 'Sweepstake entry earned';
        }
    };

    const sortedEntries = [...entries].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Entry History</h3>
                <div className="badge badge-primary">
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </div>
            </div>

            {sortedEntries.map((entry) => (
                <div
                    key={entry.id}
                    className={`border rounded-lg p-4 transition-all hover:shadow-md ${getEntryColor(entry.entry_type)}`}
                >
                    <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                                <span className="text-lg">{getEntryIcon(entry.entry_type)}</span>
                            </div>
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium text-gray-900">
                                    {getEntryTitle(entry)}
                                </h4>
                                <span className="text-xs text-gray-500 whitespace-nowrap">
                                    {formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 mt-1">
                                {getEntryDescription(entry)}
                            </p>

                            {entry.plan_type && (
                                <div className="mt-2">
                                    <span className="badge badge-outline badge-sm">
                                        {entry.plan_type} plan
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}

            {entries.length > 0 && (
                <div className="bg-base-200 rounded-lg p-4 mt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">Total Entries</h4>
                            <p className="text-sm text-gray-600">
                                You have earned {entries.length} sweepstake {entries.length === 1 ? 'entry' : 'entries'}
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{entries.length}</div>
                            <div className="text-xs text-gray-500">entries</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
