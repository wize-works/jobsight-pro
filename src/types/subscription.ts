
export interface SubscriptionPlan {
  id: string;
  name: string;
  monthly_price: number;
  annual_price: number;
  included_users: number;
  extra_user_price: number;
  ai_addon_available: boolean;
  ai_addon_price?: number;
  features: string[];
}

export interface BusinessSubscription {
  id: string;
  business_id: string;
  plan_id: string;
  start_date: string | null;
  end_date: string | null;
  status: string | null;
  created_at: string | null;
  created_by: string | null;
  updated_at: string | null;
  updated_by: string | null;
  stripe_subscription_id: string | null;
  stripe_invoice_id: string | null;
  stripe_customer_id: string | null;
}

export type BillingInterval = 'monthly' | 'annual';
