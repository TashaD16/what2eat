-- Migration: add language and youtube_url columns to global_recipes
-- Run in Supabase Dashboard → SQL Editor

ALTER TABLE global_recipes
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ru' CHECK (language IN ('ru', 'en')),
  ADD COLUMN IF NOT EXISTS youtube_url TEXT;

-- Backfill: mark all existing records as Russian
UPDATE global_recipes SET language = 'ru' WHERE language IS NULL;

-- Index for language filter
CREATE INDEX IF NOT EXISTS idx_global_recipes_language ON global_recipes(language);
