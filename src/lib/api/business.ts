import { CreateBusinessParams } from '@/types/business';

export interface BusinessApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export const businessApi = {
    // Get user's business
    async getUserBusiness(userId?: string): Promise<BusinessApiResponse> {
        try {
            const params = new URLSearchParams();
            if (userId) params.append('userId', userId);

            const response = await fetch(`/api/business?${params}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            return await response.json();
        } catch (error) {
            console.error('Error fetching user business:', error);
            return { success: false, error: 'Failed to fetch business' };
        }
    },

    // Get business by ID
    async getBusinessById(businessId: string): Promise<BusinessApiResponse> {
        try {
            const response = await fetch(`/api/business?businessId=${businessId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            return await response.json();
        } catch (error) {
            console.error('Error fetching business by ID:', error);
            return { success: false, error: 'Failed to fetch business' };
        }
    },

    // Create new business
    async createBusiness(params: Omit<CreateBusinessParams, 'userId'>): Promise<BusinessApiResponse> {
        try {
            const response = await fetch('/api/business', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(params),
            });

            return await response.json();
        } catch (error) {
            console.error('Error creating business:', error);
            return { success: false, error: 'Failed to create business' };
        }
    },

    // Update business
    async updateBusiness(businessId: string, data: Partial<CreateBusinessParams>): Promise<BusinessApiResponse> {
        try {
            const response = await fetch('/api/business', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ businessId, ...data }),
            });

            return await response.json();
        } catch (error) {
            console.error('Error updating business:', error);
            return { success: false, error: 'Failed to update business' };
        }
    },

    // Update business from form data
    async updateBusinessFromForm(formData: FormData): Promise<BusinessApiResponse> {
        try {
            const businessId = formData.get('id') as string;
            if (!businessId) {
                return { success: false, error: 'Business ID is required' };
            }

            // Convert FormData to object
            const data: Record<string, any> = {};
            formData.forEach((value, key) => {
                if (key !== 'id') {
                    data[key] = value;
                }
            });

            return await this.updateBusiness(businessId, data);
        } catch (error) {
            console.error('Error updating business from form:', error);
            return { success: false, error: 'Failed to update business' };
        }
    },

    // Check user business status
    async checkUserBusinessStatus(): Promise<BusinessApiResponse> {
        try {
            const response = await fetch('/api/business/status?type=basic', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            return await response.json();
        } catch (error) {
            console.error('Error checking user business status:', error);
            return { success: false, error: 'Failed to check business status' };
        }
    },

    // Check business status with subscription info
    async checkBusinessStatus(): Promise<BusinessApiResponse> {
        try {
            const response = await fetch('/api/business/status?type=detailed', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            return await response.json();
        } catch (error) {
            console.error('Error checking business status:', error);
            return { success: false, error: 'Failed to check business status' };
        }
    },

    // Assign subscription to business
    async assignSubscriptionToBusiness(businessId: string, subscriptionId: string): Promise<BusinessApiResponse> {
        try {
            const response = await fetch('/api/business/subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ businessId, subscriptionId }),
            });

            return await response.json();
        } catch (error) {
            console.error('Error assigning subscription to business:', error);
            return { success: false, error: 'Failed to assign subscription' };
        }
    },
};
