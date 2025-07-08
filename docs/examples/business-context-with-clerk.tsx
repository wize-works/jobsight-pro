// Example integration with existing business context
// This shows how to modify your business context to use the new Clerk integration

"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, type ReactNode } from "react";
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from "next/navigation";
import { getUserBusiness } from "@/app/actions/client/business"; // Use client action
import { useToast } from "@/hooks/use-toast";
import { useBusinessAuthInitializer } from "@/hooks/use-business-auth-initializer";
import type { Business } from "@/types/business";

type BusinessContextType = {
    businessId: string;
    business: Business;
    setBusinessId: (id: string) => void;
    loading: boolean;
    error: string | null;
    refreshBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType>({
    businessId: "",
    business: {} as Business,
    setBusinessId: () => { },
    loading: true,
    error: null,
    refreshBusiness: async () => { },
});

export function BusinessProvider({ children }: { children: ReactNode }) {
    const [businessId, setBusinessId] = useState<string>("");
    const [business, setBusinessData] = useState<Business>({} as Business);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const pathname = usePathname();
    const { toast } = useToast();

    // Initialize business auth state with Clerk
    const { isInitialized } = useBusinessAuthInitializer();

    // Check if we're in a registration flow
    const isRegistrationFlow = pathname === '/register' || pathname === '/onboarding';

    // Function to fetch business data using client action
    const fetchBusinessData = async (userAuthId: string) => {
        try {
            // Use the offline-first client action instead of server action
            const businessData = await getUserBusiness(userAuthId);

            if (businessData) {
                setBusinessId(businessData.id);
                setBusinessData(businessData);
                localStorage.setItem("businessId", businessData.id);
                setLoading(false);
            } else {
                setLoading(false);
                // User is valid but has no business
                if (!isRegistrationFlow) {
                    router.push('/register');
                    toast({
                        title: "No Business Found",
                        description: "Please register your business to continue.",
                    });
                }
            }
        } catch (err) {
            console.error("Error fetching business data:", err);
            setError(err instanceof Error ? err.message : "Unknown error fetching business data");

            if (!isRegistrationFlow) {
                toast({
                    title: "Error",
                    description: "Failed to load business data",
                });
            }
            setLoading(false);
        }
    };

    // Function to load business data
    const loadBusinessData = async () => {
        if (!isLoaded || !isInitialized) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // If no user and not in registration flow, finish loading
            if (!user) {
                setLoading(false);
                return;
            }

            // Try to get from localStorage first
            const storedBusinessId = localStorage.getItem("businessId");

            if (storedBusinessId && user) {
                // Verify the stored business ID is still valid by fetching it
                await fetchBusinessData(user.id); // user.id is auth_id from Clerk
            } else if (user) {
                // No stored business ID, fetch fresh
                await fetchBusinessData(user.id); // user.id is auth_id from Clerk
            }
        } catch (err) {
            console.error("Error in loadBusinessData:", err);
            setError(err instanceof Error ? err.message : "Unknown error");
            setLoading(false);
        }
    };

    // Load business data when user changes or auth is initialized
    useEffect(() => {
        loadBusinessData();
    }, [user?.id, isLoaded, isInitialized, isRegistrationFlow]);

    // Refresh function
    const refreshBusiness = useCallback(async () => {
        if (user?.id && isInitialized) {
            await fetchBusinessData(user.id); // user.id is auth_id from Clerk
        }
    }, [user?.id, isInitialized]);

    const value = useMemo(() => ({
        businessId,
        business,
        setBusinessId,
        loading,
        error,
        refreshBusiness,
    }), [businessId, business, loading, error, refreshBusiness]);

    return (
        <BusinessContext.Provider value={value}>
            {children}
        </BusinessContext.Provider>
    );
}

export const useBusiness = () => {
    const context = useContext(BusinessContext);
    if (!context) {
        throw new Error('useBusiness must be used within a BusinessProvider');
    }
    return context;
};
