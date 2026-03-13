-- Migration: support bilingual recipes (one mealdb_id can exist in both RU and EN)
-- Run this in Supabase SQL Editor before deploying the bilingual feature.

-- 1. Drop old unique index that only allows one entry per mealdb_id
DROP INDEX IF EXISTS uniq_global_recipes_mealdb;

-- 2. Create new unique index: one entry per (mealdb_id, language)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_mealdb_lang
  ON global_recipes(mealdb_id, language)
  WHERE mealdb_id IS NOT NULL;

-- 3. Drop old unique index that only allows one entry per name (regardless of language)
DROP INDEX IF EXISTS uniq_global_recipes_name;

-- 4. Create new unique index: one entry per (name, language)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_name_lang
  ON global_recipes(name, language);
