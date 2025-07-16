-- Migration: Update referral system tables for Clerk auth
-- Date: 2025-07-15
-- Description: Updates existing referrals and sweepstake_entries tables, checks for referral_code column

-- Check if referral_code column exists in businesses table, if not add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'businesses' 
                   AND column_name = 'referral_code') THEN
        ALTER TABLE businesses ADD COLUMN referral_code VARCHAR(20) UNIQUE;
    END IF;
END $$;

-- Update referrals table if it exists, otherwise create it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'referrals') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'referrals' 
                       AND column_name = 'created_by') THEN
            ALTER TABLE referrals ADD COLUMN created_by UUID REFERENCES users(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'referrals' 
                       AND column_name = 'updated_by') THEN
            ALTER TABLE referrals ADD COLUMN updated_by UUID REFERENCES users(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'referrals' 
                       AND column_name = 'updated_at') THEN
            ALTER TABLE referrals ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        -- Update plan_type constraint to include correct values
        ALTER TABLE referrals DROP CONSTRAINT IF EXISTS referrals_plan_type_check;
        ALTER TABLE referrals ADD CONSTRAINT referrals_plan_type_check 
            CHECK (plan_type IN ('starter', 'pro', 'business'));
    ELSE
        -- Create referrals table if it doesn't exist
        CREATE TABLE referrals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            referrer_business_id UUID NOT NULL REFERENCES businesses(id),
            referee_business_id UUID NOT NULL REFERENCES businesses(id),
            referee_user_id UUID NOT NULL REFERENCES users(id),
            plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('starter', 'pro', 'business')),
            subscription_id UUID REFERENCES business_subscriptions(id),
            status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            confirmed_at TIMESTAMP WITH TIME ZONE,
            created_by UUID REFERENCES users(id),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_by UUID REFERENCES users(id),
            UNIQUE(referrer_business_id, referee_business_id)
        );
    END IF;
END $$;

-- Update sweepstake_entries table if it exists, otherwise create it
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sweepstake_entries') THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'sweepstake_entries' 
                       AND column_name = 'created_by') THEN
            ALTER TABLE sweepstake_entries ADD COLUMN created_by UUID REFERENCES users(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'sweepstake_entries' 
                       AND column_name = 'updated_by') THEN
            ALTER TABLE sweepstake_entries ADD COLUMN updated_by UUID REFERENCES users(id);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name = 'sweepstake_entries' 
                       AND column_name = 'updated_at') THEN
            ALTER TABLE sweepstake_entries ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    ELSE
        -- Create sweepstake_entries table if it doesn't exist
        CREATE TABLE sweepstake_entries (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            business_id UUID NOT NULL REFERENCES businesses(id),
            user_id UUID NOT NULL REFERENCES users(id),
            entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('business_signup', 'referral', 'bonus')),
            referral_id UUID REFERENCES referrals(id),
            plan_type VARCHAR(50),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by UUID REFERENCES users(id),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_by UUID REFERENCES users(id)
        );
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_business ON referrals(referrer_business_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_business ON referrals(referee_business_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_sweepstake_entries_business ON sweepstake_entries(business_id);
CREATE INDEX IF NOT EXISTS idx_sweepstake_entries_type ON sweepstake_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_businesses_referral_code ON businesses(referral_code);

-- Add triggers for updated_at timestamps if they don't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers and recreate them
DROP TRIGGER IF EXISTS update_referrals_updated_at ON referrals;
CREATE TRIGGER update_referrals_updated_at
    BEFORE UPDATE ON referrals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sweepstake_entries_updated_at ON sweepstake_entries;
CREATE TRIGGER update_sweepstake_entries_updated_at
    BEFORE UPDATE ON sweepstake_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
