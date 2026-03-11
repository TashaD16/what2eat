-- Таблица для глобальных рецептов в Supabase (общая для всех пользователей)
-- Выполните этот SQL в Supabase Dashboard → SQL Editor перед запуском sync-recipes-to-supabase.mjs

CREATE TABLE IF NOT EXISTS global_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  instructions JSONB NOT NULL,    -- RecipeStep[] = [{step, description}]
  ingredients JSONB NOT NULL,     -- AIRecipeIngredient[] = [{name, quantity, unit}]
  cooking_time INTEGER,
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  image_url TEXT,
  servings INTEGER DEFAULT 4,
  is_vegetarian BOOLEAN DEFAULT false,
  is_vegan BOOLEAN DEFAULT false,
  mealdb_id TEXT,
  source TEXT DEFAULT 'mealdb',   -- 'mealdb' | 'openai' | 'manual'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_global_recipes_name ON global_recipes(name);
CREATE INDEX IF NOT EXISTS idx_global_recipes_difficulty ON global_recipes(difficulty);
CREATE INDEX IF NOT EXISTS idx_global_recipes_source ON global_recipes(source);

-- Уникальный индекс на название (чтобы не было дубликатов)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_global_recipes_name ON global_recipes(name);

-- Row Level Security - разрешаем всем читать
ALTER TABLE global_recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "global_recipes_select" ON global_recipes;
CREATE POLICY "global_recipes_select" ON global_recipes
  FOR SELECT TO anon, authenticated USING (true);

-- INSERT только через service_role (для скриптов)
-- Обычные пользователи не могут добавлять рецепты напрямую
