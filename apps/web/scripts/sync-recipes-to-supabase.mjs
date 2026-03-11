#!/usr/bin/env node
/**
 * Скрипт для синхронизации рецептов из SQL файла в Supabase
 * Читает database/recipes-seed.sql и сохраняет все рецепты в Supabase
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Загружаем переменные окружения
function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    const env = {}
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^=]+)=(.*)$/)
      if (match) {
        env[match[1].trim()] = match[2].trim()
      }
    })
    return env
  } catch (err) {
    console.error('Ошибка загрузки .env:', err.message)
    process.exit(1)
  }
}

const env = loadEnv()
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://siaaptnnchaafzygxugc.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Ошибка: SUPABASE_SERVICE_ROLE_KEY не найден в .env')
  console.error('   Получите ключ в Supabase Dashboard → Settings → API → service_role')
  process.exit(1)
}

// Создаём клиент Supabase с service_role (обходит RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Парсинг SQL INSERT statements
function parseSQLFile(sqlContent) {
  const recipes = []
  const ingredients = new Map() // name -> {id, category}
  
  // Парсим ингредиенты (улучшенный парсер с поддержкой экранированных кавычек)
  const ingredientsMatch = sqlContent.match(/INSERT OR IGNORE INTO ingredients[^;]+;/s)
  if (ingredientsMatch) {
    const valuesMatch = ingredientsMatch[0].match(/VALUES\s+(.+);/s)
    if (valuesMatch) {
      const valuesStr = valuesMatch[1]
      // Парсим (id, 'name', 'category', image_url) с поддержкой ''
      const ingredientRegex = /\((\d+),\s*'((?:[^']|'')+)',\s*'((?:[^']|'')+)',\s*(?:NULL|'(?:[^']|'')*')\)/g
      let match
      while ((match = ingredientRegex.exec(valuesStr)) !== null) {
        const [, id, name, category] = match
        ingredients.set(name.replace(/''/g, "'"), { id: parseInt(id), category: category.replace(/''/g, "'") })
      }
    }
  }

  // Парсим блюда (улучшенный парсер)
  const dishesMatch = sqlContent.match(/INSERT OR IGNORE INTO dishes[^;]+;/s)
  if (dishesMatch) {
    const valuesMatch = dishesMatch[0].match(/VALUES\s+(.+);/s)
    if (valuesMatch) {
      const valuesStr = valuesMatch[1]
      // Парсим ('name', 'description', 'image_url', cooking_time, 'difficulty', servings, estimated_cost, is_vegetarian, is_vegan)
      // Более гибкий regex с поддержкой экранированных кавычек и NULL
      const dishRegex = /\('((?:[^']|'')+)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*(\d+),\s*'((?:[^']|'')+)',\s*(\d+),\s*(?:NULL|\d+\.?\d*),\s*(\d+),\s*(\d+)\)/g
      let match
      while ((match = dishRegex.exec(valuesStr)) !== null) {
        const [, name, description, imageUrl, cookingTime, difficulty, servings, isVeg, isVegan] = match
        recipes.push({
          name: name.replace(/''/g, "'"),
          description: description.replace(/''/g, "'"),
          image_url: imageUrl.replace(/''/g, "'"),
          cooking_time: parseInt(cookingTime),
          difficulty: difficulty.replace(/''/g, "'"),
          servings: parseInt(servings),
          is_vegetarian: parseInt(isVeg) === 1,
          is_vegan: parseInt(isVegan) === 1,
          ingredients: [],
          instructions: [],
        })
      }
    }
  }

  // Парсим рецепты (instructions) - улучшенный парсер для JSON
  const recipesMatch = sqlContent.match(/INSERT OR IGNORE INTO recipes[^;]+;/s)
  if (recipesMatch) {
    const valuesMatch = recipesMatch[0].match(/VALUES\s+(.+);/s)
    if (valuesMatch) {
      const valuesStr = valuesMatch[1]
      // Парсим (dish_id, 'instructions_json') - JSON может быть многострочным
      const recipeRegex = /\(\(SELECT id FROM dishes WHERE name = '((?:[^']|'')+)'\),\s*'((?:\[.*?\]|(?:[^']|'')+))'\)/gs
      let match
      while ((match = recipeRegex.exec(valuesStr)) !== null) {
        const [, dishName, instructionsJson] = match
        const dishNameClean = dishName.replace(/''/g, "'")
        const jsonClean = instructionsJson.replace(/''/g, "'")
        try {
          const instructions = JSON.parse(jsonClean)
          const recipe = recipes.find((r) => r.name === dishNameClean)
          if (recipe) {
            recipe.instructions = instructions
          }
        } catch (e) {
          console.warn(`Не удалось распарсить инструкции для "${dishNameClean}":`, e.message)
        }
      }
    }
  }

  // Парсим ингредиенты рецептов (recipe_ingredients)
  const recipeIngredientsMatch = sqlContent.match(/INSERT OR IGNORE INTO recipe_ingredients[^;]+;/s)
  if (recipeIngredientsMatch) {
    const valuesMatch = recipeIngredientsMatch[0].match(/VALUES\s+(.+);/s)
    if (valuesMatch) {
      const valuesStr = valuesMatch[1]
      // Парсим (recipe_id, ingredient_id, quantity, 'unit') с поддержкой экранированных кавычек
      const regex = /\(\(SELECT id FROM recipes WHERE dish_id = \(SELECT id FROM dishes WHERE name = '((?:[^']|'')+)'\)\),\s*(\d+),\s*([\d.]+),\s*'((?:[^']|'')+)'\)/g
      let match
      while ((match = regex.exec(valuesStr)) !== null) {
        const [, dishName, ingredientId, quantity, unit] = match
        const dishNameClean = dishName.replace(/''/g, "'")
        const recipe = recipes.find((r) => r.name === dishNameClean)
        if (recipe) {
          // Находим название ингредиента по ID
          const ingredient = Array.from(ingredients.entries()).find(([_, data]) => data.id === parseInt(ingredientId))
          if (ingredient) {
            recipe.ingredients.push({
              name: ingredient[0],
              quantity: parseFloat(quantity),
              unit: unit.replace(/''/g, "'"),
            })
          }
        }
      }
    }
  }

  return recipes
}

// Создание таблицы global_recipes в Supabase
async function ensureTableExists() {
  console.log('📋 Проверка таблицы global_recipes в Supabase...')
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS global_recipes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      instructions JSONB NOT NULL,
      ingredients JSONB NOT NULL,
      cooking_time INTEGER,
      difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
      image_url TEXT,
      servings INTEGER DEFAULT 4,
      is_vegetarian BOOLEAN DEFAULT false,
      is_vegan BOOLEAN DEFAULT false,
      mealdb_id TEXT,
      source TEXT DEFAULT 'mealdb',
      created_at TIMESTAMPTZ DEFAULT now()
    );

    CREATE INDEX IF NOT EXISTS idx_global_recipes_name ON global_recipes(name);
    CREATE INDEX IF NOT EXISTS idx_global_recipes_difficulty ON global_recipes(difficulty);
    
    ALTER TABLE global_recipes ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "global_recipes_select" ON global_recipes;
    CREATE POLICY "global_recipes_select" ON global_recipes
      FOR SELECT TO anon, authenticated USING (true);
  `

  // Выполняем через RPC или напрямую через PostgREST (если доступно)
  // Для простоты используем Supabase JS client
  try {
    // Проверяем, существует ли таблица
    const { data, error } = await supabase.from('global_recipes').select('id').limit(1)
    if (error && error.code === '42P01') {
      // Таблица не существует, нужно создать через SQL Editor вручную
      console.log('⚠️  Таблица global_recipes не существует.')
      console.log('   Выполните этот SQL в Supabase Dashboard → SQL Editor:')
      console.log('\n' + createTableSQL + '\n')
      console.log('После создания таблицы запустите скрипт снова.')
      process.exit(1)
    }
    console.log('✓ Таблица global_recipes существует')
  } catch (err) {
    console.error('Ошибка проверки таблицы:', err.message)
    process.exit(1)
  }
}

// Сохранение рецептов в Supabase
async function saveRecipesToSupabase(recipes) {
  console.log(`\n💾 Сохранение ${recipes.length} рецептов в Supabase...`)
  
  const batchSize = 10
  let saved = 0
  let errors = 0

  for (let i = 0; i < recipes.length; i += batchSize) {
    const batch = recipes.slice(i, i + batchSize)
    
    const records = batch.map((recipe) => ({
      name: recipe.name,
      description: recipe.description || null,
      instructions: recipe.instructions || [],
      ingredients: recipe.ingredients || [],
      cooking_time: recipe.cooking_time || null,
      difficulty: recipe.difficulty || 'medium',
      image_url: recipe.image_url || null,
      servings: recipe.servings || 4,
      is_vegetarian: recipe.is_vegetarian || false,
      is_vegan: recipe.is_vegan || false,
      source: 'mealdb',
    }))

    try {
      const { data, error } = await supabase
        .from('global_recipes')
        .upsert(records, { onConflict: 'name', ignoreDuplicates: false })

      if (error) {
        console.error(`❌ Ошибка сохранения batch ${i / batchSize + 1}:`, error.message)
        errors += batch.length
      } else {
        saved += batch.length
        process.stdout.write(`\rСохранено: ${saved}/${recipes.length}`)
      }
    } catch (err) {
      console.error(`\n❌ Ошибка batch ${i / batchSize + 1}:`, err.message)
      errors += batch.length
    }

    // Небольшая задержка между batch'ами
    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  console.log(`\n\n✅ Сохранено: ${saved} рецептов`)
  if (errors > 0) {
    console.log(`⚠️  Ошибок: ${errors}`)
  }
}

// Главная функция
async function main() {
  console.log('🚀 Синхронизация рецептов в Supabase...\n')

  // Читаем SQL файл
  const sqlPath = join(__dirname, '..', 'database', 'recipes-seed.sql')
  console.log(`📖 Чтение файла: ${sqlPath}`)
  
  let sqlContent
  try {
    sqlContent = readFileSync(sqlPath, 'utf-8')
  } catch (err) {
    console.error(`❌ Ошибка чтения файла: ${err.message}`)
    console.error('   Убедитесь, что файл database/recipes-seed.sql существует')
    console.error('   Запустите: node scripts/populate-recipes.mjs')
    process.exit(1)
  }

  // Парсим SQL
  console.log('🔍 Парсинг SQL файла...')
  const recipes = parseSQLFile(sqlContent)
  console.log(`✓ Найдено ${recipes.length} рецептов`)

  if (recipes.length === 0) {
    console.error('❌ Рецепты не найдены в SQL файле')
    process.exit(1)
  }

  // Проверяем таблицу
  await ensureTableExists()

  // Сохраняем рецепты
  await saveRecipesToSupabase(recipes)

  console.log('\n✨ Готово!')
}

main().catch((err) => {
  console.error('\n❌ Критическая ошибка:', err)
  process.exit(1)
})
