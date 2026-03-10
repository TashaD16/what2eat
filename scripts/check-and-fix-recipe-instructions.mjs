#!/usr/bin/env node
/**
 * Проверка и исправление рецептов без инструкций
 * Заменяет рецепты без инструкций на новые из TheMealDB или удаляет их
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1'

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
const OPENAI_API_KEY = env.VITE_OPENAI_API_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Ошибка: SUPABASE_SERVICE_ROLE_KEY не найден в .env')
  process.exit(1)
}

if (!OPENAI_API_KEY) {
  console.error('❌ Ошибка: VITE_OPENAI_API_KEY не найден в .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Получение случайного рецепта из TheMealDB
async function getRandomMeal() {
  try {
    const res = await fetch(`${THEMEALDB_BASE}/random.php`)
    if (!res.ok) return null
    const data = await res.json()
    return data.meals?.[0] ?? null
  } catch (err) {
    return null
  }
}

// Извлечение ингредиентов
function extractIngredients(meal) {
  const ingredients = []
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]
    if (name && name.trim()) {
      ingredients.push({
        nameEn: name.trim(),
        measure: (measure || '').trim(),
      })
    }
  }
  return ingredients
}

// Оценка времени и сложности
function estimateMeta(meal) {
  const len = meal.strInstructions?.length ?? 0
  if (len < 600) return { cooking_time: 20, difficulty: 'easy' }
  if (len < 1500) return { cooking_time: 40, difficulty: 'medium' }
  return { cooking_time: 65, difficulty: 'hard' }
}

// Перевод рецепта через OpenAI
async function translateMeal(meal) {
  const ingredients = extractIngredients(meal)
  const ingredientLines = ingredients
    .map((i) => `${i.nameEn}: ${i.measure}`)
    .join('\n')
  const instructions = meal.strInstructions?.slice(0, 3000) || ''

  if (!instructions || instructions.trim().length < 50) {
    return null // Нет инструкций
  }

  const prompt = `Переведи этот рецепт с английского на русский. Раздели инструкции на чёткие пронумерованные шаги.

Блюдо: ${meal.strMeal}
Кухня: ${meal.strArea || 'International'}, категория: ${meal.strCategory || 'General'}
Инструкции: ${instructions}
Ингредиенты:
${ingredientLines}

Верни ТОЛЬКО JSON (без пояснений, без markdown):
{
  "name": "<название блюда на русском>",
  "description": "<2-3 предложения: что это за блюдо, вкус, из какой кухни>",
  "ingredients": [{"name": "<название на русском>", "quantity": "<число>", "unit": "<единица: г, мл, шт, ст.л., ч.л.>"}],
  "instructions": [{"step": 1, "description": "<подробный шаг на русском>"}, ...],
  "is_vegetarian": <true/false>,
  "is_vegan": <true/false>
}`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`OpenAI error: ${response.status} — ${err}`)
    }

    const data = await response.json()
    const text = data.choices?.[0]?.message?.content || ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      return null
    }

    const parsed = JSON.parse(match[0])
    
    // Проверяем, что есть инструкции
    if (!parsed.instructions || !Array.isArray(parsed.instructions) || parsed.instructions.length === 0) {
      return null
    }

    return parsed
  } catch (err) {
    console.warn(`Ошибка перевода: ${err.message}`)
    return null
  }
}

// Получение всех рецептов из Supabase
async function getAllRecipes() {
  const { data, error } = await supabase
    .from('global_recipes')
    .select('id, name, instructions')

  if (error) {
    throw new Error(`Ошибка получения рецептов: ${error.message}`)
  }

  return data
}

// Проверка наличия инструкций
function hasValidInstructions(recipe) {
  if (!recipe.instructions) return false
  if (!Array.isArray(recipe.instructions)) return false
  if (recipe.instructions.length === 0) return false
  
  // Проверяем, что есть хотя бы одна инструкция с описанием
  return recipe.instructions.some(
    (step) => step && step.description && step.description.trim().length > 10
  )
}

// Замена рецепта новым из TheMealDB
async function replaceRecipe(recipeId, oldName) {
  console.log(`\n   🔄 Поиск замены для "${oldName}"...`)
  
  let attempts = 0
  const maxAttempts = 30
  const seenNames = new Set()

  while (attempts < maxAttempts) {
    attempts++
    const meal = await getRandomMeal()
    if (!meal) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      continue
    }

    // Проверяем, что есть инструкции
    if (!meal.strInstructions || meal.strInstructions.trim().length < 50) {
      await new Promise((resolve) => setTimeout(resolve, 200))
      continue
    }

    const translated = await translateMeal(meal)
    if (!translated || !hasValidInstructions({ instructions: translated.instructions })) {
      await new Promise((resolve) => setTimeout(resolve, 500))
      continue
    }

    // Проверяем, что такого рецепта еще нет в базе
    const { data: existing } = await supabase
      .from('global_recipes')
      .select('id')
      .eq('name', translated.name)
      .limit(1)

    if (existing && existing.length > 0) {
      // Такой рецепт уже есть, пробуем другой
      seenNames.add(translated.name)
      await new Promise((resolve) => setTimeout(resolve, 200))
      continue
    }

    const meta = estimateMeta(meal)

    // Обновляем рецепт
    const { error } = await supabase
      .from('global_recipes')
      .update({
        name: translated.name,
        description: translated.description || null,
        instructions: translated.instructions,
        ingredients: translated.ingredients || [],
        cooking_time: meta.cooking_time,
        difficulty: meta.difficulty,
        image_url: meal.strMealThumb || null,
        is_vegetarian: translated.is_vegetarian || false,
        is_vegan: translated.is_vegan || false,
      })
      .eq('id', recipeId)

    if (error) {
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        // Дубликат - пробуем другой рецепт
        seenNames.add(translated.name)
        await new Promise((resolve) => setTimeout(resolve, 200))
        continue
      }
      console.error(`   ❌ Ошибка обновления: ${error.message}`)
      return false
    }

    console.log(`   ✅ Заменён на "${translated.name}"`)
    return true
  }

  return false
}

// Удаление рецепта
async function deleteRecipe(recipeId, name) {
  const { error } = await supabase
    .from('global_recipes')
    .delete()
    .eq('id', recipeId)

  if (error) {
    console.error(`   ❌ Ошибка удаления: ${error.message}`)
    return false
  }

  console.log(`   🗑️  Удалён "${name}"`)
  return true
}

// Главная функция
async function main() {
  console.log('🔍 Проверка рецептов на наличие инструкций...\n')

  const recipes = await getAllRecipes()
  console.log(`📊 Всего рецептов: ${recipes.length}\n`)

  const withoutInstructions = recipes.filter((r) => !hasValidInstructions(r))

  if (withoutInstructions.length === 0) {
    console.log('✅ У всех рецептов есть пошаговые инструкции!')
    return
  }

  console.log(`⚠️  Найдено ${withoutInstructions.length} рецептов без инструкций:\n`)

  let replaced = 0
  let deleted = 0
  let failed = 0

  for (let i = 0; i < withoutInstructions.length; i++) {
    const recipe = withoutInstructions[i]
    console.log(`${i + 1}/${withoutInstructions.length}. "${recipe.name}" (ID: ${recipe.id})`)

    const success = await replaceRecipe(recipe.id, recipe.name)
    
    if (success) {
      replaced++
    } else {
      // Если не удалось заменить, удаляем
      const deletedSuccess = await deleteRecipe(recipe.id, recipe.name)
      if (deletedSuccess) {
        deleted++
      } else {
        failed++
      }
    }

    // Задержка между запросами
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  console.log(`\n\n📊 Результат:`)
  console.log(`   ✅ Заменено: ${replaced}`)
  console.log(`   🗑️  Удалено: ${deleted}`)
  console.log(`   ❌ Ошибок: ${failed}`)

  // Финальная проверка
  const finalRecipes = await getAllRecipes()
  const finalWithoutInstructions = finalRecipes.filter((r) => !hasValidInstructions(r))

  console.log(`\n📊 Финальная статистика:`)
  console.log(`   Всего рецептов: ${finalRecipes.length}`)
  console.log(`   С инструкциями: ${finalRecipes.length - finalWithoutInstructions.length}`)
  console.log(`   Без инструкций: ${finalWithoutInstructions.length}`)

  if (finalWithoutInstructions.length > 0) {
    console.log(`\n⚠️  Остались рецепты без инструкций:`)
    finalWithoutInstructions.forEach((r) => {
      console.log(`   - "${r.name}"`)
    })
  } else {
    console.log(`\n✅ Все рецепты теперь имеют пошаговые инструкции!`)
  }
}

main().catch((err) => {
  console.error('\n❌ Критическая ошибка:', err)
  process.exit(1)
})
