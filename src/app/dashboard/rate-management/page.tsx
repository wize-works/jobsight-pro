"use client";

import { useState, useEffect } from 'react';
import RateManagement from '@/components/rate-management';
import { useBusiness } from '@/lib/business-context';

export default function RateManagementPage() {
    const { businessId } = useBusiness();

    if (!businessId) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="hero min-h-[400px]">
                    <div className="hero-content text-center">
                        <div className="max-w-md">
                            <h1 className="text-3xl font-bold">No Business Established</h1>
                            <p className="py-6 text-base-content/70">Please setup a business to manage rates.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <RateManagement businessId={businessId} />
        </div>
    );
}
