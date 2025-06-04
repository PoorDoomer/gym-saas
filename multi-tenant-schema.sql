-- Multi-Tenant Gym Management System Database Schema
-- This adds multi-tenancy support to the existing schema

-- Subscription Tiers Table
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tier_name VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    monthly_price DECIMAL(10,2) NOT NULL,
    max_gyms INTEGER NOT NULL,
    max_members INTEGER NOT NULL,
    max_trainers INTEGER NOT NULL,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gyms Table (Main multi-tenant entity)
CREATE TABLE IF NOT EXISTS gyms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_tier VARCHAR(50) REFERENCES subscription_tiers(tier_name) DEFAULT 'solo',
    subscription_status VARCHAR(50) DEFAULT 'trial', -- trial, active, expired, cancelled
    subscription_end_date TIMESTAMP WITH TIME ZONE,
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    timezone VARCHAR(100) DEFAULT 'UTC',
    logo_url TEXT,
    primary_color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gym Subscriptions Table (Billing records)
CREATE TABLE IF NOT EXISTS gym_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tier_slug VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    current_period_end TIMESTAMP WITH TIME ZONE,
    monthly_price DECIMAL(10,2) NOT NULL,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Gym User Permissions Table (Access control)
CREATE TABLE IF NOT EXISTS gym_user_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL, -- owner, admin, trainer, front_desk
    permissions JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(gym_id, user_id)
);

-- Add gym_id to existing tables for multi-tenancy
-- Members table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'members' AND column_name = 'gym_id') THEN
        ALTER TABLE members ADD COLUMN gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members(gym_id);
    END IF;
END $$;

-- Trainers table  
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trainers' AND column_name = 'gym_id') THEN
        ALTER TABLE trainers ADD COLUMN gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_trainers_gym_id ON trainers(gym_id);
    END IF;
END $$;

-- Classes table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'gym_id') THEN
        ALTER TABLE classes ADD COLUMN gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_classes_gym_id ON classes(gym_id);
    END IF;
END $$;

-- Class schedules table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'class_schedules' AND column_name = 'gym_id') THEN
        ALTER TABLE class_schedules ADD COLUMN gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_class_schedules_gym_id ON class_schedules(gym_id);
    END IF;
END $$;

-- Membership plans table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'membership_plans' AND column_name = 'gym_id') THEN
        ALTER TABLE membership_plans ADD COLUMN gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_membership_plans_gym_id ON membership_plans(gym_id);
    END IF;
END $$;

-- Payments table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'gym_id') THEN
        ALTER TABLE payments ADD COLUMN gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_payments_gym_id ON payments(gym_id);
    END IF;
END $$;

-- Check-ins table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'check_ins' AND column_name = 'gym_id') THEN
        ALTER TABLE check_ins ADD COLUMN gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_check_ins_gym_id ON check_ins(gym_id);
    END IF;
END $$;

-- Subscriptions table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscriptions' AND column_name = 'gym_id') THEN
        ALTER TABLE subscriptions ADD COLUMN gym_id UUID REFERENCES gyms(id) ON DELETE CASCADE;
        CREATE INDEX IF NOT EXISTS idx_subscriptions_gym_id ON subscriptions(gym_id);
    END IF;
END $$;

-- Insert default subscription tiers
INSERT INTO subscription_tiers (tier_name, display_name, monthly_price, max_gyms, max_members, max_trainers, features) 
VALUES 
    ('solo', 'Solo Plan', 20.00, 1, 200, 10, '["Gym Management", "Member Management", "Class Scheduling", "Payment Processing", "Basic Reports"]'),
    ('multi', 'Multi Plan', 100.00, 999, 999999, 999, '["Unlimited Gyms", "Unlimited Members", "Unlimited Trainers", "Advanced Analytics", "Priority Support", "Custom Branding"]')
ON CONFLICT (tier_name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE gyms ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_user_permissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gyms table
CREATE POLICY "Users can view their own gyms" ON gyms
    FOR SELECT USING (owner_user_id = auth.uid());

CREATE POLICY "Users can create their own gyms" ON gyms
    FOR INSERT WITH CHECK (owner_user_id = auth.uid());

CREATE POLICY "Users can update their own gyms" ON gyms
    FOR UPDATE USING (owner_user_id = auth.uid());

-- RLS Policies for subscription_tiers (public read)
CREATE POLICY "Anyone can view subscription tiers" ON subscription_tiers
    FOR SELECT USING (true);

-- RLS Policies for gym_subscriptions
CREATE POLICY "Users can view their gym subscriptions" ON gym_subscriptions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their gym subscriptions" ON gym_subscriptions
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- RLS Policies for gym_user_permissions
CREATE POLICY "Users can view their gym permissions" ON gym_user_permissions
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Gym owners can manage permissions" ON gym_user_permissions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM gyms 
            WHERE gyms.id = gym_user_permissions.gym_id 
            AND gyms.owner_user_id = auth.uid()
        )
    );

-- Create updated_at triggers for new tables
CREATE TRIGGER update_gyms_updated_at BEFORE UPDATE ON gyms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscription_tiers_updated_at BEFORE UPDATE ON subscription_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gym_subscriptions_updated_at BEFORE UPDATE ON gym_subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gym_user_permissions_updated_at BEFORE UPDATE ON gym_user_permissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 