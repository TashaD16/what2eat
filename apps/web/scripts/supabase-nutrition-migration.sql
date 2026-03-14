-- ============================================================
-- Migration: Add КБЖУ fields to global_recipes
--            Add/update user_profiles table with body metrics
-- Run this in the Supabase SQL Editor
-- ============================================================

-- 1. Add КБЖУ columns to global_recipes (nullable, per serving)
ALTER TABLE global_recipes
  ADD COLUMN IF NOT EXISTS calories_per_serving  integer,
  ADD COLUMN IF NOT EXISTS protein_per_serving   integer,
  ADD COLUMN IF NOT EXISTS fat_per_serving       integer,
  ADD COLUMN IF NOT EXISTS carbs_per_serving     integer;

-- 2. Create user_profiles table (if not exists) with body metrics
CREATE TABLE IF NOT EXISTS user_profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  gender       text,          -- 'male' | 'female'
  age          integer,
  height_cm    integer,
  weight_kg    integer,
  activity     text,          -- 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  created_at   timestamptz DEFAULT now()
);

-- Add missing columns to user_profiles in case the table already existed
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS gender    text,
  ADD COLUMN IF NOT EXISTS age       integer,
  ADD COLUMN IF NOT EXISTS height_cm integer,
  ADD COLUMN IF NOT EXISTS weight_kg integer,
  ADD COLUMN IF NOT EXISTS activity  text;

-- 3. Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies: users can only read/write their own profile
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_select'
  ) THEN
    CREATE POLICY user_profiles_select ON user_profiles FOR SELECT USING (auth.uid() = id);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'user_profiles' AND policyname = 'user_profiles_upsert'
  ) THEN
    CREATE POLICY user_profiles_upsert ON user_profiles FOR ALL USING (auth.uid() = id);
  END IF;
END $$;
