-- Supabase Database Setup for MovieMadness
-- Run this in your Supabase SQL Editor

-- Create contributors table
CREATE TABLE IF NOT EXISTS contributors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email TEXT NOT NULL,
    display_name TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create API keys table (OPTIONAL - for storing API keys for future services)
-- Note: Current streaming services (vidking.net, vidsrc.xyz) don't require API keys
-- This table is included for potential future use with other services
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    key_name TEXT UNIQUE NOT NULL,
    key_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Create a function to check if user is admin (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_user_admin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM contributors
        WHERE user_id = user_uuid AND is_admin = TRUE
    );
END;
$$;

-- RLS Policies for contributors table
-- Users can read their own contributor record
CREATE POLICY "Users can view own contributor record"
    ON contributors FOR SELECT
    USING (auth.uid() = user_id);

-- Only admins can update contributor records
CREATE POLICY "Admins can update contributors"
    ON contributors FOR UPDATE
    USING (is_user_admin(auth.uid()));

-- Anyone can insert their own contributor record (on signup)
-- Allow any authenticated user to insert (needed for signup flow)
CREATE POLICY "Users can insert own contributor record"
    ON contributors FOR INSERT
    WITH CHECK (true);

-- Admins can view all contributors
CREATE POLICY "Admins can view all contributors"
    ON contributors FOR SELECT
    USING (is_user_admin(auth.uid()));

-- Create a function to check if user is approved (bypasses RLS to avoid recursion)
CREATE OR REPLACE FUNCTION is_user_approved(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM contributors
        WHERE user_id = user_uuid AND is_approved = TRUE
    );
END;
$$;

-- RLS Policies for api_keys table
-- Only approved contributors can read API keys
CREATE POLICY "Approved contributors can read API keys"
    ON api_keys FOR SELECT
    USING (is_user_approved(auth.uid()));

-- Only admins can insert/update API keys
CREATE POLICY "Admins can manage API keys"
    ON api_keys FOR ALL
    USING (is_user_admin(auth.uid()));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update updated_at
CREATE TRIGGER update_contributors_updated_at
    BEFORE UPDATE ON contributors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert a default admin user (you'll need to replace the user_id with your actual admin user ID after creating the account)
-- First, create your admin account through the app, then run:
-- UPDATE contributors SET is_admin = TRUE, is_approved = TRUE WHERE email = 'your-admin-email@example.com';

-- Note: The current streaming services (vidking.net, vidsrc.xyz) use direct embed URLs
-- with TMDB IDs and don't require API keys. The api_keys table is optional and can be
-- used if you need to store API keys for other services in the future.
-- 
-- If you want to use this table, you can insert keys manually through the Supabase dashboard
-- or via a secure admin function.
