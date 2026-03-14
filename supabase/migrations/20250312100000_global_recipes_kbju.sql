-- КБЖУ на порцию (калории, белки, жиры, углеводы)
ALTER TABLE global_recipes
  ADD COLUMN IF NOT EXISTS calories_per_serving INTEGER,
  ADD COLUMN IF NOT EXISTS protein_per_serving INTEGER,
  ADD COLUMN IF NOT EXISTS fat_per_serving INTEGER,
  ADD COLUMN IF NOT EXISTS carbs_per_serving INTEGER;

COMMENT ON COLUMN global_recipes.calories_per_serving IS 'Калории на 1 порцию (ккал)';
COMMENT ON COLUMN global_recipes.protein_per_serving IS 'Белки на 1 порцию (г)';
COMMENT ON COLUMN global_recipes.fat_per_serving IS 'Жиры на 1 порцию (г)';
COMMENT ON COLUMN global_recipes.carbs_per_serving IS 'Углеводы на 1 порцию (г)';
