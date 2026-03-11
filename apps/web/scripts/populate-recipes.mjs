#!/usr/bin/env node
/**
 * Скрипт для заполнения базы данных 100 рецептами из TheMealDB
 * Получает рецепты, переводит через OpenAI и генерирует SQL для seed.sql
 */

import { readFileSync, writeFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const THEMEALDB_BASE = 'https://www.themealdb.com/api/json/v1/1'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// Загружаем API ключ из .env
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
const OPENAI_API_KEY = env.VITE_OPENAI_API_KEY

if (!OPENAI_API_KEY) {
  console.error('Ошибка: VITE_OPENAI_API_KEY не найден в .env')
  process.exit(1)
}

// Получение случайного рецепта из TheMealDB
async function getRandomMeal() {
  try {
    const res = await fetch(`${THEMEALDB_BASE}/random.php`)
    if (!res.ok) return null
    const data = await res.json()
    return data.meals?.[0] ?? null
  } catch (err) {
    console.error('Ошибка получения рецепта:', err.message)
    return null
  }
}

// Получение N уникальных рецептов
async function getUniqueMeals(count) {
  const meals = []
  const seenIds = new Set()
  let attempts = 0
  const maxAttempts = count * 3 // Запас на дубликаты

  console.log(`Получение ${count} уникальных рецептов из TheMealDB...`)

  while (meals.length < count && attempts < maxAttempts) {
    attempts++
    const meal = await getRandomMeal()
    if (meal && !seenIds.has(meal.idMeal)) {
      seenIds.add(meal.idMeal)
      meals.push(meal)
      process.stdout.write(`\rПолучено: ${meals.length}/${count}`)
    }
    // Небольшая задержка, чтобы не перегружать API
    await new Promise((resolve) => setTimeout(resolve, 200))
  }

  console.log(`\n✓ Получено ${meals.length} уникальных рецептов`)
  return meals
}

// Извлечение ингредиентов из рецепта TheMealDB
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

// Перевод рецепта через OpenAI
async function translateMeal(meal) {
  const ingredients = extractIngredients(meal)
  const ingredientLines = ingredients
    .map((i) => `${i.nameEn}: ${i.measure}`)
    .join('\n')
  const instructions = meal.strInstructions?.slice(0, 3000) || ''

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
    const response = await fetch(OPENAI_API_URL, {
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
      throw new Error(`Не удалось распарсить ответ для "${meal.strMeal}"`)
    }

    return JSON.parse(match[0])
  } catch (err) {
    console.error(`\nОшибка перевода "${meal.strMeal}":`, err.message)
    return null
  }
}

// Оценка времени и сложности
function estimateMeta(meal) {
  const len = meal.strInstructions?.length ?? 0
  if (len < 600) return { cooking_time: 20, difficulty: 'easy' }
  if (len < 1500) return { cooking_time: 40, difficulty: 'medium' }
  return { cooking_time: 65, difficulty: 'hard' }
}

// Определение категории ингредиента
function guessIngredientCategory(nameRu) {
  const name = nameRu.toLowerCase()
  if (['курица', 'говядина', 'свинина', 'баранина', 'индейка', 'фарш', 'сосиски', 'колбаса', 'бекон'].some((m) => name.includes(m))) {
    return 'meat'
  }
  if (['макароны', 'гречка', 'рис', 'овсянка', 'перловка', 'пшено', 'булгур', 'киноа'].some((c) => name.includes(c))) {
    return 'cereals'
  }
  if (['молоко', 'сыр', 'сметана', 'творог', 'йогурт', 'сливки', 'масло сливочное', 'яйца'].some((d) => name.includes(d))) {
    return 'dairy'
  }
  if (['соль', 'перец', 'паприка', 'куркума', 'кориандр', 'тмин', 'базилик', 'орегано', 'розмарин'].some((s) => name.includes(s))) {
    return 'spices'
  }
  return 'vegetables'
}

// Генерация SQL
function generateSQL(translatedRecipes, mealData) {
  const sql = []
  sql.push('-- Автоматически сгенерированные рецепты из TheMealDB')
  sql.push('-- Сгенерировано: ' + new Date().toISOString())
  sql.push('')

  const allIngredients = new Map() // name -> {id, category}
  let ingredientId = 1000 // Начинаем с большого ID, чтобы не конфликтовать с существующими

  // Собираем все уникальные ингредиенты
  translatedRecipes.forEach((recipe) => {
    if (!recipe) return
    recipe.ingredients?.forEach((ing) => {
      const name = ing.name.trim()
      if (name && !allIngredients.has(name)) {
        allIngredients.set(name, {
          id: ingredientId++,
          category: guessIngredientCategory(name),
        })
      }
    })
  })

  // SQL для ингредиентов
  sql.push('-- Ингредиенты')
  sql.push('INSERT OR IGNORE INTO ingredients (id, name, category, image_url) VALUES')
  const ingredientValues = Array.from(allIngredients.entries()).map(([name, data]) => {
    return `(${data.id}, '${name.replace(/'/g, "''")}', '${data.category}', NULL)`
  })
  sql.push(ingredientValues.join(',\n') + ';')
  sql.push('')

  // SQL для блюд
  sql.push('-- Блюда')
  sql.push('INSERT OR IGNORE INTO dishes (name, description, image_url, cooking_time, difficulty, servings, estimated_cost, is_vegetarian, is_vegan) VALUES')
  const dishValues = translatedRecipes
    .map((recipe, idx) => {
      if (!recipe) return null
      const meal = mealData[idx]
      const meta = estimateMeta(meal)
      const imageUrl = meal.strMealThumb || `https://source.unsplash.com/featured/600x400/?food,${encodeURIComponent(recipe.name)}`
      const desc = (recipe.description || '').replace(/'/g, "''")
      const isVeg = recipe.is_vegetarian ? 1 : 0
      const isVegan = recipe.is_vegan ? 1 : 0
      return `('${recipe.name.replace(/'/g, "''")}', '${desc}', '${imageUrl}', ${meta.cooking_time}, '${meta.difficulty}', 4, NULL, ${isVeg}, ${isVegan})`
    })
    .filter(Boolean)
  sql.push(dishValues.join(',\n') + ';')
  sql.push('')

  // SQL для связей блюд и ингредиентов (dish_ingredients)
  sql.push('-- Связи блюд и ингредиентов')
  sql.push('INSERT OR IGNORE INTO dish_ingredients (dish_id, ingredient_id) VALUES')
  const dishIngredientValues = []
  translatedRecipes.forEach((recipe, idx) => {
    if (!recipe) return
    const dishId = idx + 1 // Предполагаем последовательные ID
    recipe.ingredients?.forEach((ing) => {
      const ingData = allIngredients.get(ing.name.trim())
      if (ingData) {
        dishIngredientValues.push(`((SELECT id FROM dishes WHERE name = '${recipe.name.replace(/'/g, "''")}'), ${ingData.id})`)
      }
    })
  })
  sql.push(dishIngredientValues.join(',\n') + ';')
  sql.push('')

  // SQL для рецептов
  sql.push('-- Рецепты')
  sql.push('INSERT OR IGNORE INTO recipes (dish_id, instructions) VALUES')
  const recipeValues = translatedRecipes
    .map((recipe) => {
      if (!recipe || !recipe.instructions) return null
      const instructionsJson = JSON.stringify(recipe.instructions).replace(/'/g, "''")
      return `((SELECT id FROM dishes WHERE name = '${recipe.name.replace(/'/g, "''")}'), '${instructionsJson}')`
    })
    .filter(Boolean)
  sql.push(recipeValues.join(',\n') + ';')
  sql.push('')

  // SQL для ингредиентов рецептов (recipe_ingredients)
  sql.push('-- Ингредиенты рецептов с количеством')
  sql.push('INSERT OR IGNORE INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit) VALUES')
  const recipeIngredientValues = []
  translatedRecipes.forEach((recipe) => {
    if (!recipe || !recipe.ingredients) return
    recipe.ingredients.forEach((ing) => {
      const ingData = allIngredients.get(ing.name.trim())
      if (ingData) {
        const quantity = parseFloat(ing.quantity) || 0
        const unit = (ing.unit || 'шт').replace(/'/g, "''")
        recipeIngredientValues.push(
          `((SELECT id FROM recipes WHERE dish_id = (SELECT id FROM dishes WHERE name = '${recipe.name.replace(/'/g, "''")}')), ${ingData.id}, ${quantity}, '${unit}')`
        )
      }
    })
  })
  sql.push(recipeIngredientValues.join(',\n') + ';')

  return sql.join('\n')
}

// Главная функция
async function main() {
  console.log('🚀 Начинаем заполнение базы данных рецептами...\n')

  // Получаем рецепты
  const meals = await getUniqueMeals(200)
  if (meals.length === 0) {
    console.error('Не удалось получить рецепты')
    process.exit(1)
  }

  // Переводим рецепты
  console.log('\n📝 Перевод рецептов на русский через OpenAI...')
  const translatedRecipes = []
  for (let i = 0; i < meals.length; i++) {
    process.stdout.write(`\rПеревод: ${i + 1}/${meals.length} - ${meals[i].strMeal}`)
    const translated = await translateMeal(meals[i])
    translatedRecipes.push(translated)
    // Задержка между запросами к OpenAI
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  const successful = translatedRecipes.filter(Boolean)
  console.log(`\n✓ Успешно переведено ${successful.length} рецептов`)

  // Генерируем SQL
  console.log('\n💾 Генерация SQL...')
  const sql = generateSQL(translatedRecipes, meals)

  // Сохраняем в файл
  const outputPath = join(__dirname, '..', 'database', 'recipes-seed.sql')
  writeFileSync(outputPath, sql, 'utf-8')
  console.log(`✓ SQL сохранён в ${outputPath}`)
  console.log(`\n📊 Статистика:`)
  console.log(`   - Рецептов: ${successful.length}`)
  console.log(`   - Ингредиентов: ${new Set(translatedRecipes.flatMap((r) => r?.ingredients?.map((i) => i.name) || [])).size}`)
  console.log(`\n✅ Готово! Добавьте содержимое recipes-seed.sql в database/seed.sql`)
}

main().catch((err) => {
  console.error('\n❌ Ошибка:', err)
  process.exit(1)
})
