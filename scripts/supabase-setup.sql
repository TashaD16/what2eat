-- Скрипт настройки Supabase для What2Eat
-- Выполните этот SQL в Supabase Dashboard → SQL Editor

-- Профили пользователей
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI-сгенерированные рецепты
CREATE TABLE IF NOT EXISTS ai_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  name TEXT NOT NULL,
  description TEXT,
  instructions JSONB NOT NULL,
  ingredients JSONB NOT NULL,
  cooking_time INTEGER,
  difficulty TEXT,
  image_url TEXT,
  source_ingredients TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Избранные рецепты
CREATE TABLE IF NOT EXISTS favorite_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  local_dish_id INTEGER,
  ai_recipe_id UUID REFERENCES ai_recipes,
  added_at TIMESTAMPTZ DEFAULT now()
);

-- Уникальные индексы
CREATE UNIQUE INDEX IF NOT EXISTS uniq_fav_local ON favorite_recipes (user_id, local_dish_id) WHERE local_dish_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_fav_ai ON favorite_recipes (user_id, ai_recipe_id) WHERE ai_recipe_id IS NOT NULL;

-- Сохранённые наборы продуктов
CREATE TABLE IF NOT EXISTS user_ingredient_sets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  ingredient_ids INTEGER[],
  saved_at TIMESTAMPTZ DEFAULT now()
);

-- Включаем Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorite_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ingredient_sets ENABLE ROW LEVEL SECURITY;

-- Политики user_profiles
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;
CREATE POLICY "user_profiles_select" ON user_profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "user_profiles_insert" ON user_profiles;
CREATE POLICY "user_profiles_insert" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "user_profiles_update" ON user_profiles;
CREATE POLICY "user_profiles_update" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Политики ai_recipes
DROP POLICY IF EXISTS "ai_recipes_all" ON ai_recipes;
CREATE POLICY "ai_recipes_all" ON ai_recipes USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Политики favorite_recipes
DROP POLICY IF EXISTS "favorite_recipes_all" ON favorite_recipes;
CREATE POLICY "favorite_recipes_all" ON favorite_recipes USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Политики user_ingredient_sets
DROP POLICY IF EXISTS "ingredient_sets_all" ON user_ingredient_sets;
CREATE POLICY "ingredient_sets_all" ON user_ingredient_sets USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Глобальная база рецептов (общая для всех пользователей)
CREATE TABLE IF NOT EXISTS global_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructions JSONB NOT NULL,    -- RecipeStep[] = [{step, description}]
  ingredients JSONB NOT NULL,     -- AIRecipeIngredient[] = [{name, quantity, unit}]
  cooking_time INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  mealdb_id TEXT UNIQUE,          -- TheMealDB idMeal для дедупликации
  source TEXT DEFAULT 'mealdb',   -- 'mealdb' | 'openai'
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE global_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "global_recipes_select" ON global_recipes;
CREATE POLICY "global_recipes_select" ON global_recipes
  FOR SELECT TO anon USING (true);
-- INSERT только через service_role (Edge Function)
