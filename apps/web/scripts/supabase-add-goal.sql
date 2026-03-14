-- Migration: add goal / goal_intensity / meals_per_day columns to user_profiles
-- Run this in the Supabase SQL Editor before deploying.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS goal          TEXT NOT NULL DEFAULT 'maintenance',
  ADD COLUMN IF NOT EXISTS goal_intensity TEXT NOT NULL DEFAULT 'light',
  ADD COLUMN IF NOT EXISTS meals_per_day  INTEGER NOT NULL DEFAULT 3;
