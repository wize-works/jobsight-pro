'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';

interface ReferralShareModalProps {
    referralCode: string;
    businessName: string;
    isOpen: boolean;
    onClose: () => void;
}

export const ReferralShareModal: React.FC<ReferralShareModalProps> = ({
    referralCode,
    businessName,
    isOpen,
    onClose,
}) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const referralUrl = `${window.location.origin}/sign-up?ref=${referralCode}`;

    const shareText = `🚀 Join JobSight Pro and get started with professional job site management! 

Use my referral code: ${referralCode}

Get access to:
✅ Advanced project management
✅ Real-time collaboration tools  
✅ Professional reporting
✅ Photo management & documentation

Sign up now: ${referralUrl}

#JobSight #Construction #ProjectManagement`;

    const emailSubject = `Join JobSight Pro - Referral from ${businessName}`;
    const emailBody = `Hi there!

I wanted to share JobSight Pro with you - it's been a game-changer for managing our construction projects.

Use my referral code: ${referralCode}

JobSight Pro offers:
• Advanced project management tools
• Real-time team collaboration
• Professional reporting and analytics
• Photo management and documentation
• Mobile-friendly interface

You can sign up here: ${referralUrl}

Best regards,
${businessName}`;

    const copyToClipboard = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success('Copied to clipboard!');
            setTimeout(() => setCopiedField(null), 2000);
        } catch (err) {
            toast.error('Failed to copy to clipboard');
        }
    };

    const shareViaEmail = () => {
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.open(mailtoUrl);
    };

    const shareViaSMS = () => {
        const smsText = `Check out JobSight Pro! Use my referral code: ${referralCode}. Sign up: ${referralUrl}`;
        const smsUrl = `sms:?body=${encodeURIComponent(smsText)}`;
        window.open(smsUrl);
    };

    const shareViaWhatsApp = () => {
        const whatsappText = `🚀 Check out JobSight Pro for construction project management! Use my referral code: ${referralCode}. Sign up: ${referralUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
        window.open(whatsappUrl, '_blank');
    };

    const shareViaLinkedIn = () => {
        const linkedInText = `I highly recommend JobSight Pro for construction project management. Use my referral code: ${referralCode}`;
        const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}&title=${encodeURIComponent('JobSight Pro Referral')}&summary=${encodeURIComponent(linkedInText)}`;
        window.open(linkedInUrl, '_blank');
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl">
                <form method="dialog">
                    <button
                        className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
                        onClick={onClose}
                    >
                        ✕
                    </button>
                </form>

                <h3 className="font-bold text-lg mb-4">
                    Share Your Referral Code
                </h3>

                <div className="space-y-6">
                    {/* Referral Code Display */}
                    <div className="bg-base-200 p-4 rounded-lg">
                        <div className="text-center">
                            <p className="text-sm text-gray-600 mb-2">Your referral code</p>
                            <div className="flex items-center justify-center space-x-2">
                                <code className="text-2xl font-bold text-primary bg-base-100 px-4 py-2 rounded">
                                    {referralCode}
                                </code>
                                <button
                                    className="btn btn-sm btn-ghost"
                                    onClick={() => copyToClipboard(referralCode, 'code')}
                                >
                                    {copiedField === 'code' ? '✓' : '📋'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Share Options */}
                    <div>
                        <h4 className="font-semibold mb-3">Quick Share</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={shareViaEmail}
                            >
                                📧 Email
                            </button>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={shareViaSMS}
                            >
                                💬 SMS
                            </button>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={shareViaWhatsApp}
                            >
                                📱 WhatsApp
                            </button>
                            <button
                                className="btn btn-outline btn-sm"
                                onClick={shareViaLinkedIn}
                            >
                                💼 LinkedIn
                            </button>
                        </div>
                    </div>

                    {/* Referral URL */}
                    <div>
                        <h4 className="font-semibold mb-2">Referral Link</h4>
                        <div className="flex items-center space-x-2">
                            <input
                                type="text"
                                value={referralUrl}
                                readOnly
                                className="input input-bordered flex-1 text-sm"
                            />
                            <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => copyToClipboard(referralUrl, 'url')}
                            >
                                {copiedField === 'url' ? '✓ Copied' : '📋 Copy'}
                            </button>
                        </div>
                    </div>

                    {/* Social Media Text */}
                    <div>
                        <h4 className="font-semibold mb-2">Social Media Post</h4>
                        <div className="relative">
                            <textarea
                                value={shareText}
                                readOnly
                                className="textarea textarea-bordered w-full h-32 text-sm"
                            />
                            <button
                                className="btn btn-ghost btn-sm absolute top-2 right-2"
                                onClick={() => copyToClipboard(shareText, 'social')}
                            >
                                {copiedField === 'social' ? '✓' : '📋'}
                            </button>
                        </div>
                    </div>

                    {/* Tips */}
                    <div className="bg-info/10 p-4 rounded-lg">
                        <h4 className="font-semibold text-info mb-2">💡 Sharing Tips</h4>
                        <ul className="text-sm space-y-1 text-info">
                            <li>• Share with businesses that could benefit from project management tools</li>
                            <li>• Mention specific features that helped your business</li>
                            <li>• Personal recommendations work best</li>
                            <li>• Follow up to help them get started</li>
                        </ul>
                    </div>
                </div>

                <div className="modal-action">
                    <button className="btn btn-primary" onClick={onClose}>
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};
