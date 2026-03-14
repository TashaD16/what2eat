#!/usr/bin/env node
/**
 * Загружает до 1000 рецептов в global_recipes: популярные, разные кухни.
 * Каждый рецепт: фото, ингредиенты, приготовление, КБЖУ; на двух языках (EN + RU).
 *
 * Требования:
 *   - Выполнены миграции: language, youtube_url, КБЖУ (20250312100000_global_recipes_kbju.sql)
 *   - В apps/web/.env: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VITE_OPENAI_API_KEY
 *
 * Запуск: node apps/web/scripts/load-1000-recipes.mjs
 */

import { readFileSync } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const MEALDB = 'https://www.themealdb.com/api/json/v1/1'
const TARGET_RECIPES = 1000
const BATCH_SIZE = 5
const DELAY_MS = 400

function loadEnv() {
  const path = join(__dirname, '..', '.env')
  const raw = readFileSync(path, 'utf-8')
  const env = {}
  raw.split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  })
  return env
}

const env = loadEnv()
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
const OPENAI_KEY = env.VITE_OPENAI_API_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Need VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

async function listAreas() {
  const data = await fetchJson(`${MEALDB}/list.php?a=list`)
  return (data?.meals ?? []).map((m) => m.strArea).filter(Boolean)
}

async function getMealIdsByArea(area) {
  const data = await fetchJson(`${MEALDB}/filter.php?a=${encodeURIComponent(area)}`)
  return (data?.meals ?? []).map((m) => m.idMeal).filter(Boolean)
}

async function getMealById(id) {
  const data = await fetchJson(`${MEALDB}/lookup.php?i=${id}`)
  return data?.meals?.[0] ?? null
}

function extractIngredients(meal) {
  const out = []
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]
    const measure = (meal[`strMeasure${i}`] ?? '').trim()
    if (name && name.trim()) {
      const qty = measure.replace(/[^\d./]/g, '').trim() || '1'
      const unit = measure.replace(/[\d./\s]/g, '').trim() || ''
      out.push({ name: name.trim(), quantity: qty, unit })
    }
  }
  return out
}

function parseSteps(text) {
  if (!text || text.length < 50) return []
  const numbered = text.match(/(?:^|\r?\n)\s*\d+[.)]\s*.+/g)
  if (numbered && numbered.length >= 2) {
    return numbered.map((s, i) => ({
      step: i + 1,
      description: s.replace(/^\s*\d+[.)]\s*/, '').trim(),
    }))
  }
  const lines = text.split(/\r?\n+/).map((s) => s.trim()).filter((s) => s.length > 25)
  if (lines.length >= 2) return lines.map((line, i) => ({ step: i + 1, description: line }))
  const sent = text.split(/\.\s+/).filter((s) => s.trim().length > 25)
  return sent.map((s, i) => ({ step: i + 1, description: s.trim() + '.' }))
}

function estimateMeta(meal) {
  const len = (meal.strInstructions ?? '').length
  if (len < 600) return { cooking_time: 25, difficulty: 'easy' }
  if (len < 1500) return { cooking_time: 45, difficulty: 'medium' }
  return { cooking_time: 60, difficulty: 'hard' }
}

function mealToEnRecipe(meal, kbju = null) {
  const ings = extractIngredients(meal)
  const steps = parseSteps(meal.strInstructions ?? '')
  const meta = estimateMeta(meal)
  return {
    name: meal.strMeal,
    description: `${meal.strMeal} – ${(meal.strCategory ?? '').toLowerCase()} from ${meal.strArea ?? 'international'} cuisine.`,
    ingredients: ings,
    instructions: steps,
    cooking_time: meta.cooking_time,
    difficulty: meta.difficulty,
    image_url: meal.strMealThumb || null,
    youtube_url: (meal.strYoutube ?? '').trim() || null,
    mealdb_id: meal.idMeal,
    language: 'en',
    servings: 4,
    ...(kbju && {
      calories_per_serving: kbju.calories_per_serving,
      protein_per_serving: kbju.protein_per_serving,
      fat_per_serving: kbju.fat_per_serving,
      carbs_per_serving: kbju.carbs_per_serving,
    }),
  }
}

async function openAIJson(prompt, maxTokens = 1200) {
  if (!OPENAI_KEY) return null
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content ?? ''
  const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/)
  if (!m) return null
  try {
    return JSON.parse(m[0])
  } catch {
    return null
  }
}

async function estimateKbjuForRecipes(recipes) {
  const list = recipes.map((r) => ({
    name: r.name,
    ingredients: r.ingredients,
    servings: 4,
  }))
  const prompt = `For each recipe below, estimate per 1 serving (servings total given): calories (kcal), protein (g), fat (g), carbs (g). Return a JSON array of exactly ${recipes.length} objects, in the same order:
[{"calories_per_serving": number, "protein_per_serving": number, "fat_per_serving": number, "carbs_per_serving": number}, ...]

Recipes:
${JSON.stringify(list)}`
  const arr = await openAIJson(prompt, 2000)
  if (!Array.isArray(arr) || arr.length !== recipes.length) return recipes.map(() => null)
  return arr.map((o) => ({
    calories_per_serving: o?.calories_per_serving ?? null,
    protein_per_serving: o?.protein_per_serving ?? null,
    fat_per_serving: o?.fat_per_serving ?? null,
    carbs_per_serving: o?.carbs_per_serving ?? null,
  }))
}

async function translateToRussian(recipe) {
  const prompt = `Translate this recipe to Russian. Return ONLY valid JSON (no markdown):
{"name": "<название>", "description": "<описание>", "ingredients": [{"name": "<название>", "quantity": "<количество>", "unit": "<ед>"}], "instructions": [{"step": 1, "description": "<шаг>"}]}

Recipe (English):
${JSON.stringify({ name: recipe.name, description: recipe.description, ingredients: recipe.ingredients, instructions: recipe.instructions })}`
  const out = await openAIJson(prompt)
  if (!out) return null
  return {
    ...recipe,
    name: out.name ?? recipe.name,
    description: out.description ?? recipe.description,
    ingredients: Array.isArray(out.ingredients) ? out.ingredients : recipe.ingredients,
    instructions: Array.isArray(out.instructions) ? out.instructions : recipe.instructions,
    language: 'ru',
    mealdb_id: recipe.mealdb_id,
    image_url: recipe.image_url,
    youtube_url: recipe.youtube_url,
    cooking_time: recipe.cooking_time,
    difficulty: recipe.difficulty,
    calories_per_serving: recipe.calories_per_serving ?? null,
    protein_per_serving: recipe.protein_per_serving ?? null,
    fat_per_serving: recipe.fat_per_serving ?? null,
    carbs_per_serving: recipe.carbs_per_serving ?? null,
  }
}

async function insertRecipe(row) {
  const { error } = await supabase.from('global_recipes').insert({
    name: row.name,
    description: row.description ?? null,
    instructions: row.instructions ?? [],
    ingredients: row.ingredients ?? [],
    cooking_time: row.cooking_time ?? null,
    difficulty: row.difficulty ?? 'medium',
    image_url: row.image_url ?? null,
    youtube_url: row.youtube_url ?? null,
    mealdb_id: row.mealdb_id ?? null,
    language: row.language ?? 'en',
    source: row.source ?? 'mealdb',
    servings: row.servings ?? 4,
    calories_per_serving: row.calories_per_serving ?? null,
    protein_per_serving: row.protein_per_serving ?? null,
    fat_per_serving: row.fat_per_serving ?? null,
    carbs_per_serving: row.carbs_per_serving ?? null,
  })
  return !error
}

async function existsByMealdbAndLang(mealdbId, lang) {
  const { data } = await supabase
    .from('global_recipes')
    .select('id')
    .eq('mealdb_id', mealdbId)
    .eq('language', lang)
    .limit(1)
  return (data?.length ?? 0) > 0
}

async function main() {
  console.log('Загрузка до 1000 рецептов (фото, ингредиенты, приготовление, КБЖУ, EN + RU)\n')

  const allIds = new Set()
  const areas = await listAreas()
  console.log(`Области кухонь: ${areas.length}`)

  for (const area of areas) {
    const ids = await getMealIdsByArea(area)
    ids.forEach((id) => allIds.add(id))
    await new Promise((r) => setTimeout(r, 120))
  }

  const idList = [...allIds]
  console.log(`Уникальных блюд TheMealDB: ${idList.length}`)

  const meals = []
  for (let i = 0; i < idList.length; i++) {
    const meal = await getMealById(idList[i])
    if (meal?.strMealThumb && meal?.strInstructions && extractIngredients(meal).length >= 3 && parseSteps(meal.strInstructions).length >= 2) {
      meals.push(meal)
    }
    if ((i + 1) % 50 === 0) process.stdout.write(`\rЗагружено деталей: ${i + 1}/${idList.length}`)
    await new Promise((r) => setTimeout(r, 80))
  }
  console.log(`\nПодходящих рецептов (с фото, ингредиентами, шагами): ${meals.length}`)

  let inserted = 0
  for (let i = 0; i < meals.length; i += BATCH_SIZE) {
    const batch = meals.slice(i, i + BATCH_SIZE)
    const kbjuList = OPENAI_KEY ? await estimateKbjuForRecipes(batch.map((m) => mealToEnRecipe(m))) : batch.map(() => null)
    for (let j = 0; j < batch.length; j++) {
      const meal = batch[j]
      const kbju = kbjuList[j] ?? null
      const enRow = mealToEnRecipe(meal, kbju)
      const existsEn = await existsByMealdbAndLang(meal.idMeal, 'en')
      if (!existsEn) {
        const ok = await insertRecipe(enRow)
        if (ok) inserted++
      }
      const existsRu = await existsByMealdbAndLang(meal.idMeal, 'ru')
      if (!existsRu) {
        const ruRow = await translateToRussian(enRow)
        if (ruRow && (await insertRecipe(ruRow))) inserted++
      }
      await new Promise((r) => setTimeout(r, DELAY_MS))
    }
    process.stdout.write(`\rОбработано TheMealDB: ${Math.min(i + BATCH_SIZE, meals.length)}/${meals.length}, вставлено строк: ${inserted}`)
    await new Promise((r) => setTimeout(r, 200))
  }

  console.log(`\n\nTheMealDB: вставлено рецептов (EN+RU): ${inserted}`)

  const { count } = await supabase.from('global_recipes').select('*', { count: 'exact', head: true })
  const current = count ?? 0
  if (current >= TARGET_RECIPES) {
    console.log(`Всего в таблице: ${current}. Цель ${TARGET_RECIPES} достигнута.`)
    return
  }

  const needMore = TARGET_RECIPES - current
  if (needMore <= 0) {
    console.log(`Всего в таблице: ${current}. Цель ${TARGET_RECIPES} достигнута.`)
    return
  }
  console.log(`Нужно ещё рецептов (до ${TARGET_RECIPES}): ${needMore}. Генерация через OpenAI...`)

  const cuisines = ['Italian', 'Russian', 'Japanese', 'Mexican', 'Indian', 'French', 'Thai', 'American', 'Chinese', 'Greek']
  let generated = 0
  const seenNames = new Set()

  while (generated < needMore) {
    const cuisine = cuisines[generated % cuisines.length]
    const prompt = `Generate one popular ${cuisine} recipe in English. Return ONLY valid JSON:
{"name": "<dish name>", "description": "<short description>", "ingredients": [{"name": "<ingredient>", "quantity": "<amount>", "unit": "<unit>"}], "instructions": [{"step": 1, "description": "<step>"}], "cooking_time": <minutes>, "difficulty": "easy|medium|hard", "calories_per_serving": <number>, "protein_per_serving": <number>, "fat_per_serving": <number>, "carbs_per_serving": <number>}
Requirements: at least 5 ingredients, at least 4 instruction steps, realistic KBJU per serving.`
    const one = await openAIJson(prompt, 800)
    if (!one?.name || seenNames.has(one.name)) continue
    seenNames.add(one.name)
    const enRecipe = {
      name: one.name,
      description: one.description || `${one.name} – ${cuisine} recipe.`,
      ingredients: Array.isArray(one.ingredients) ? one.ingredients : [],
      instructions: Array.isArray(one.instructions) ? one.instructions : [],
      cooking_time: one.cooking_time ?? 30,
      difficulty: ['easy', 'medium', 'hard'].includes(one.difficulty) ? one.difficulty : 'medium',
      image_url: `https://picsum.photos/seed/${encodeURIComponent(one.name)}/400/300`,
      language: 'en',
      source: 'openai',
      servings: 4,
      calories_per_serving: one.calories_per_serving ?? null,
      protein_per_serving: one.protein_per_serving ?? null,
      fat_per_serving: one.fat_per_serving ?? null,
      carbs_per_serving: one.carbs_per_serving ?? null,
    }
    if (enRecipe.ingredients.length < 3 || enRecipe.instructions.length < 2) continue
    const okEn = await insertRecipe(enRecipe)
    if (okEn) generated++
    const ruRecipe = await translateToRussian(enRecipe)
    if (ruRecipe) {
      ruRecipe.source = 'openai'
      ruRecipe.image_url = enRecipe.image_url
      const okRu = await insertRecipe(ruRecipe)
      if (okRu) generated++
    }
    process.stdout.write(`\rСгенерировано дополнительных рецептов: ${generated}/${needMore}`)
    const { count: now } = await supabase.from('global_recipes').select('*', { count: 'exact', head: true })
    if ((now ?? 0) >= TARGET_RECIPES) break
    await new Promise((r) => setTimeout(r, 600))
  }

  const { count: finalCount } = await supabase.from('global_recipes').select('*', { count: 'exact', head: true })
  console.log(`\n\nГотово. Всего рецептов в базе: ${finalCount ?? 0}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
