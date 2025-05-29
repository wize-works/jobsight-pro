-- User Notification Preferences Table
CREATE TABLE IF NOT EXISTS jobsight.user_notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES jobsight.users(auth_id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES jobsight.businesses(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT false,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) REFERENCES jobsight.users(auth_id) ON DELETE SET NULL,
    updated_by VARCHAR(255) REFERENCES jobsight.users(auth_id) ON DELETE SET NULL,
    UNIQUE(user_id, business_id)
);

-- User Notification Type Preferences Table
CREATE TABLE IF NOT EXISTS jobsight.user_notification_type_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES jobsight.users(auth_id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES jobsight.businesses(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL, -- 'projectUpdates', 'taskAssignments', 'equipmentAlerts', etc.
    email_enabled BOOLEAN DEFAULT true,
    push_enabled BOOLEAN DEFAULT false,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) REFERENCES jobsight.users(auth_id) ON DELETE SET NULL,
    updated_by VARCHAR(255) REFERENCES jobsight.users(auth_id) ON DELETE SET NULL,
    UNIQUE(user_id, business_id, notification_type)
);

-- Push Notification Subscriptions Table
CREATE TABLE IF NOT EXISTS jobsight.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES jobsight.users(auth_id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES jobsight.businesses(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(255) REFERENCES jobsight.users(auth_id) ON DELETE SET NULL,
    updated_by VARCHAR(255) REFERENCES jobsight.users(auth_id) ON DELETE SET NULL,
    last_used_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, endpoint)
);

-- Notifications Table (for storing actual notifications)
CREATE TABLE IF NOT EXISTS jobsight.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL REFERENCES jobsight.users(auth_id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES jobsight.businesses(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'projectUpdates', 'taskAssignments', 'equipmentAlerts', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- Optional link to the relevant page
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB -- For storing additional context (e.g., project_id, task_id, etc.)
);

-- Create indexes for better query performance
CREATE INDEX idx_notification_prefs_user ON jobsight.user_notification_preferences(user_id);
CREATE INDEX idx_notification_prefs_business ON jobsight.user_notification_preferences(business_id);
CREATE INDEX idx_notification_type_prefs_user ON jobsight.user_notification_type_preferences(user_id);
CREATE INDEX idx_notification_type_prefs_business ON jobsight.user_notification_type_preferences(business_id);
CREATE INDEX idx_push_subscriptions_user ON jobsight.push_subscriptions(user_id);
CREATE INDEX idx_push_subscriptions_business ON jobsight.push_subscriptions(business_id);
CREATE INDEX idx_notifications_user ON jobsight.notifications(user_id);
CREATE INDEX idx_notifications_business ON jobsight.notifications(business_id);
CREATE INDEX idx_notifications_unread ON jobsight.notifications(user_id, business_id) WHERE read = false;
CREATE INDEX idx_notifications_type ON jobsight.notifications(type);

-- Note: Security will be handled at the application level using Kinde authentication
-- and business_id scoping in API routes
