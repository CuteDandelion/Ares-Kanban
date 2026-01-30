-- Migration: fix_users_rls_and_triggers
-- Description: Add missing INSERT RLS policy and auto-create trigger for user profiles
-- Created: 2026-01-28
-- Issue: Login successful but failed to create user profile due to missing RLS INSERT policy

-- ============================================
-- 1. ADD MISSING INSERT RLS POLICY FOR USERS
-- ============================================

-- Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own profile (for registration and login auto-create)
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. CREATE FUNCTION TO AUTO-CREATE USER PROFILE
-- ============================================

-- Function to handle user creation after auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role, created_at, updated_at, last_seen_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'member',
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. CREATE TRIGGER ON AUTH USER CREATION
-- ============================================

-- Drop existing trigger if it exists (for idempotency)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create user profile on auth signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 4. VERIFY AND FIX EXISTING AUTH USERS WITHOUT PROFILES
-- ============================================

-- Create a function to sync existing auth users with users table
CREATE OR REPLACE FUNCTION public.sync_missing_user_profiles()
RETURNS TABLE (
  synced_count INTEGER,
  errors TEXT
) AS $$
DECLARE
  v_count INTEGER := 0;
  v_errors TEXT := '';
  v_auth_user RECORD;
BEGIN
  FOR v_auth_user IN 
    SELECT au.id, au.email, au.raw_user_meta_data
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
  LOOP
    BEGIN
      INSERT INTO public.users (id, email, name, role, created_at, updated_at, last_seen_at)
      VALUES (
        v_auth_user.id,
        v_auth_user.email,
        COALESCE(v_auth_user.raw_user_meta_data->>'name', split_part(v_auth_user.email, '@', 1)),
        'member',
        NOW(),
        NOW(),
        NOW()
      );
      v_count := v_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_errors := v_errors || 'Error for user ' || v_auth_user.id || ': ' || SQLERRM || '; ';
    END;
  END LOOP;
  
  RETURN QUERY SELECT v_count, v_errors;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the sync function for any existing users
SELECT * FROM public.sync_missing_user_profiles();

-- ============================================
-- 5. INDEX OPTIMIZATION
-- ============================================

-- Add index on users.id for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_users_id_lookup ON public.users(id);

-- ============================================
-- VERIFICATION QUERIES (Run manually if needed)
-- ============================================

-- Check RLS policies
-- SELECT policyname, cmd, roles, qual FROM pg_policies WHERE tablename = 'users';

-- Check if trigger exists
-- SELECT tgname, tgrelid::regclass FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Check for orphaned auth users (auth.users without public.users)
-- SELECT au.id, au.email 
-- FROM auth.users au
-- LEFT JOIN public.users pu ON au.id = pu.id
-- WHERE pu.id IS NULL;
