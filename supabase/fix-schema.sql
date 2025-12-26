-- Fix Schema: Add missing columns to existing tables
-- Run this if you get "column does not exist" errors
-- 
-- ⚠️ IMPORTANT: This script only modifies tables for HR Evaluation System
-- It will NOT affect other existing tables in your database
-- 
-- Tables that will be modified (only if they exist):
-- - users
-- - criteria
-- - evaluations
-- - comments
-- - exclusions
-- - system_config
-- - logs
--
-- All operations check if tables exist before modifying them

-- ============================================
-- Fix users table (only if table exists)
-- ============================================
-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Check if users table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'users'
    ) THEN
        -- Add parent_internal_id if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'parent_internal_id'
        ) THEN
            ALTER TABLE users ADD COLUMN parent_internal_id VARCHAR(50);
        END IF;

        -- Add weight if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'weight'
        ) THEN
            ALTER TABLE users ADD COLUMN weight DECIMAL(5,2);
        END IF;

        -- Add permissions if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'permissions'
        ) THEN
            ALTER TABLE users ADD COLUMN permissions TEXT;
        END IF;

        -- Add password if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'password'
        ) THEN
            ALTER TABLE users ADD COLUMN password VARCHAR(255);
        END IF;

        -- Add email if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'email'
        ) THEN
            ALTER TABLE users ADD COLUMN email VARCHAR(255);
        END IF;

        -- Add created_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Add updated_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
    END IF;
END $$;

-- Create indexes if they don't exist (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        CREATE INDEX IF NOT EXISTS idx_users_parent ON users(parent_internal_id);
        CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
        CREATE INDEX IF NOT EXISTS idx_users_internal_id ON users(internal_id);
    END IF;
END $$;

-- ============================================
-- Fix criteria table (only if table exists)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'criteria') THEN
        -- Add role_group if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'criteria' AND column_name = 'role_group'
        ) THEN
            ALTER TABLE criteria ADD COLUMN role_group VARCHAR(50);
        END IF;

        -- Add created_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'criteria' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE criteria ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Add updated_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'criteria' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE criteria ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
    END IF;
END $$;

-- ============================================
-- Fix evaluations table (only if table exists)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evaluations') THEN
        -- Add created_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'evaluations' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE evaluations ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Add updated_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'evaluations' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE evaluations ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Create unique constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'evaluations_evaluator_target_criteria_key'
        ) THEN
            ALTER TABLE evaluations 
            ADD CONSTRAINT evaluations_evaluator_target_criteria_key 
            UNIQUE(evaluator_internal_id, target_internal_id, criteria_id);
        END IF;

        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_evaluations_evaluator ON evaluations(evaluator_internal_id);
        CREATE INDEX IF NOT EXISTS idx_evaluations_target ON evaluations(target_internal_id);
        CREATE INDEX IF NOT EXISTS idx_evaluations_criteria ON evaluations(criteria_id);
    END IF;
END $$;

-- ============================================
-- Fix comments table (only if table exists)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        -- Add created_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'comments' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE comments ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Add updated_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'comments' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE comments ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Create unique constraint if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint 
            WHERE conname = 'comments_evaluator_target_key'
        ) THEN
            ALTER TABLE comments 
            ADD CONSTRAINT comments_evaluator_target_key 
            UNIQUE(evaluator_internal_id, target_internal_id);
        END IF;

        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_comments_evaluator ON comments(evaluator_internal_id);
        CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_internal_id);
    END IF;
END $$;

-- ============================================
-- Fix exclusions table (only if table exists)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exclusions') THEN
        -- Add created_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'exclusions' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE exclusions ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_exclusions_evaluator ON exclusions(evaluator_org_id);
        CREATE INDEX IF NOT EXISTS idx_exclusions_target ON exclusions(target_org_id);
    END IF;
END $$;

-- ============================================
-- Fix system_config table (only if table exists)
-- ============================================
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_config') THEN
        -- Add created_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'system_config' AND column_name = 'created_at'
        ) THEN
            ALTER TABLE system_config ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;

        -- Add updated_at if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'system_config' AND column_name = 'updated_at'
        ) THEN
            ALTER TABLE system_config ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
        END IF;
    END IF;
END $$;

-- ============================================
-- Fix logs table (only if table exists)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logs') THEN
        -- Create indexes if they don't exist
        CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);
        CREATE INDEX IF NOT EXISTS idx_logs_type ON logs(type);
    END IF;
END $$;

-- ============================================
-- Create/Update Triggers
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist and recreate (only for tables that exist)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP TRIGGER IF EXISTS update_users_updated_at ON users;
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'criteria') THEN
        DROP TRIGGER IF EXISTS update_criteria_updated_at ON criteria;
        CREATE TRIGGER update_criteria_updated_at BEFORE UPDATE ON criteria
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evaluations') THEN
        DROP TRIGGER IF EXISTS update_evaluations_updated_at ON evaluations;
        CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
        CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_config') THEN
        DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
        CREATE TRIGGER update_system_config_updated_at BEFORE UPDATE ON system_config
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ============================================
-- Enable Row Level Security (RLS) - only for existing tables
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'criteria') THEN
        ALTER TABLE criteria ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evaluations') THEN
        ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exclusions') THEN
        ALTER TABLE exclusions ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_config') THEN
        ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logs') THEN
        ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ============================================
-- Create/Update RLS Policies (only for existing tables)
-- ============================================
DO $$
BEGIN
    -- Users table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON users;
        CREATE POLICY "Allow all for authenticated users" ON users
            FOR ALL USING (true);
    END IF;

    -- Criteria table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'criteria') THEN
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON criteria;
        CREATE POLICY "Allow all for authenticated users" ON criteria
            FOR ALL USING (true);
    END IF;

    -- Evaluations table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evaluations') THEN
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON evaluations;
        CREATE POLICY "Allow all for authenticated users" ON evaluations
            FOR ALL USING (true);
    END IF;

    -- Comments table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments') THEN
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON comments;
        CREATE POLICY "Allow all for authenticated users" ON comments
            FOR ALL USING (true);
    END IF;

    -- Exclusions table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exclusions') THEN
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON exclusions;
        CREATE POLICY "Allow all for authenticated users" ON exclusions
            FOR ALL USING (true);
    END IF;

    -- System config table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_config') THEN
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON system_config;
        CREATE POLICY "Allow all for authenticated users" ON system_config
            FOR ALL USING (true);
    END IF;

    -- Logs table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logs') THEN
        DROP POLICY IF EXISTS "Allow all for authenticated users" ON logs;
        CREATE POLICY "Allow all for authenticated users" ON logs
            FOR ALL USING (true);
    END IF;
END $$;

