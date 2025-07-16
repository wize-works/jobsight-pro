// src/types/referral.ts
export interface Referral {
    id: string
    referrer_business_id: string
    referee_business_id: string
    referee_user_id: string
    plan_type: 'starter' | 'pro' | 'business'
    subscription_id: string | null
    status: 'pending' | 'confirmed' | 'cancelled'
    created_at: string
    confirmed_at: string | null
    created_by: string | null
    updated_at: string
    updated_by: string | null
}

export interface ReferralInsert {
    id?: string
    referrer_business_id: string
    referee_business_id: string
    referee_user_id: string
    plan_type: 'starter' | 'pro' | 'business'
    subscription_id?: string | null
    status?: 'pending' | 'confirmed' | 'cancelled'
    created_at?: string
    confirmed_at?: string | null
    created_by?: string | null
    updated_at?: string
    updated_by?: string | null
}

export interface ReferralUpdate {
    id?: string
    referrer_business_id?: string
    referee_business_id?: string
    referee_user_id?: string
    plan_type?: 'starter' | 'pro' | 'business'
    subscription_id?: string | null
    status?: 'pending' | 'confirmed' | 'cancelled'
    created_at?: string
    confirmed_at?: string | null
    created_by?: string | null
    updated_at?: string
    updated_by?: string | null
}

export interface SweepstakeEntry {
    id: string
    business_id: string
    user_id: string
    entry_type: 'business_signup' | 'referral' | 'bonus'
    referral_id: string | null
    plan_type: string | null
    created_at: string
    created_by: string | null
    updated_at: string
    updated_by: string | null
}

export interface SweepstakeEntryInsert {
    id?: string
    business_id: string
    user_id: string
    entry_type: 'business_signup' | 'referral' | 'bonus'
    referral_id?: string | null
    plan_type?: string | null
    created_at?: string
    created_by?: string | null
    updated_at?: string
    updated_by?: string | null
}

export interface SweepstakeEntryUpdate {
    id?: string
    business_id?: string
    user_id?: string
    entry_type?: 'business_signup' | 'referral' | 'bonus'
    referral_id?: string | null
    plan_type?: string | null
    created_at?: string
    created_by?: string | null
    updated_at?: string
    updated_by?: string | null
}

export interface ReferralStats {
    totalEntries: number
    businessSignups: number
    confirmedReferrals: number
    pendingReferrals: number
    referralCode: string
    businessName: string
}

export interface ReferralCreationRequest {
    referrer_code: string
    business_id: string
    plan_type: 'starter' | 'pro' | 'business'
}

export interface ReferralCreationResponse {
    success: boolean
    referral?: Referral
    referrer_business?: string
    error?: string
}

export interface ReferralConfirmationRequest {
    referral_id: string
    subscription_id: string
}

export interface ReferralConfirmationResponse {
    success: boolean
    error?: string
}

export interface ReferralCodeResponse {
    referral_code: string
}

export interface SweepstakeDashboardResponse {
    stats: ReferralStats
    entries: SweepstakeEntry[]
}
