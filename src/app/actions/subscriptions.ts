
'use server';

import { withBusinessServer } from '@/lib/auth/with-business-server';
import { createServerClient } from '@/lib/supabase';
import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck } from '@/lib/db';
import type { BusinessSubscription, SubscriptionPlan, BillingInterval } from '@/types/subscription';
import { revalidatePath } from 'next/cache';

export async function getCurrentSubscription(): Promise<BusinessSubscription | null> {
  const { business } = await withBusinessServer();
  
  const result = await fetchByBusiness<BusinessSubscription>(
    'business_subscriptions',
    business.id,
    {
      filters: [{ column: 'status', operator: 'eq', value: 'active' }],
      single: true
    }
  );
  
  return result;
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  // For now, we'll load from the static file. Later this could be from database or API
  const fs = require('fs');
  const path = require('path');
  
  try {
    const filePath = path.join(process.cwd(), 'docs', 'jobsight_pricing_with_ai_addon.json');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error('Error loading subscription plans:', error);
    return [];
  }
}

export async function createSubscription(
  planId: string,
  billingInterval: BillingInterval
): Promise<{ success: boolean; error?: string }> {
  try {
    const { business, user } = await withBusinessServer();
    
    // Check if there's already an active subscription
    const existingSubscription = await getCurrentSubscription();
    
    if (existingSubscription) {
      // For now, we'll just update the existing subscription
      // In a real implementation, this would involve Stripe to change the subscription
      const updateResult = await updateWithBusinessCheck(
        'business_subscriptions',
        existingSubscription.id,
        business.id,
        {
          plan_id: planId,
          updated_at: new Date().toISOString(),
          updated_by: user.id,
        }
      );
      
      if (!updateResult.success) {
        return { success: false, error: updateResult.error };
      }
    } else {
      // Create new subscription
      const newSubscription: Partial<BusinessSubscription> = {
        business_id: business.id,
        plan_id: planId,
        start_date: new Date().toISOString(),
        status: 'active',
        created_by: user.id,
        created_at: new Date().toISOString(),
      };
      
      const insertResult = await insertWithBusiness(
        'business_subscriptions',
        newSubscription,
        business.id
      );
      
      if (!insertResult.success) {
        return { success: false, error: insertResult.error };
      }
    }
    
    revalidatePath('/dashboard/business');
    return { success: true };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return { success: false, error: 'Failed to create subscription' };
  }
}

export async function cancelSubscription(): Promise<{ success: boolean; error?: string }> {
  try {
    const { business, user } = await withBusinessServer();
    
    const currentSubscription = await getCurrentSubscription();
    if (!currentSubscription) {
      return { success: false, error: 'No active subscription found' };
    }
    
    // Update subscription status to canceled
    const updateResult = await updateWithBusinessCheck(
      'business_subscriptions',
      currentSubscription.id,
      business.id,
      {
        status: 'canceled',
        end_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }
    );
    
    if (!updateResult.success) {
      return { success: false, error: updateResult.error };
    }
    
    revalidatePath('/dashboard/business');
    return { success: true };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return { success: false, error: 'Failed to cancel subscription' };
  }
}
