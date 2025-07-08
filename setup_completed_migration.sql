-- Migration to add setup_completed field to users table

-- Add setup_completed column to users table
DO $$
BEGIN
    -- Add the column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'setup_completed'
    ) THEN
        ALTER TABLE public.users 
        ADD COLUMN setup_completed BOOLEAN DEFAULT FALSE;
    END IF;
    
    -- Set existing users with data as setup_completed = true
    -- This helps migrate existing users without requiring them to go through setup again
    UPDATE public.users 
    SET setup_completed = TRUE 
    WHERE business_id IS NOT NULL 
    AND EXISTS (
        SELECT 1 FROM public.projects p 
        WHERE p.business_id = users.business_id
        UNION
        SELECT 1 FROM public.crews c 
        WHERE c.business_id = users.business_id
        UNION 
        SELECT 1 FROM public.crew_members cm 
        WHERE cm.business_id = users.business_id
    );
END $$;
