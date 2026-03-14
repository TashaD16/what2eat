-- КБЖУ на порцию для global_recipes (калории, белки, жиры, углеводы)
-- Выполнить в Supabase Dashboard → SQL Editor перед load-1000-recipes.mjs

ALTER TABLE global_recipes
  ADD COLUMN IF NOT EXISTS calories_per_serving INTEGER,
  ADD COLUMN IF NOT EXISTS protein_per_serving INTEGER,
  ADD COLUMN IF NOT EXISTS fat_per_serving INTEGER,
  ADD COLUMN IF NOT EXISTS carbs_per_serving INTEGER;
