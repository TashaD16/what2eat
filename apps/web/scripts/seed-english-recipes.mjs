#!/usr/bin/env node
/**
 * Seeds 30 English recipes from TheMealDB into global_recipes (language = 'en').
 * No OpenAI needed — uses raw TheMealDB data.
 *
 * Requirements:
 *   - Run supabase-add-language.sql migration first
 *   - Add SUPABASE_SERVICE_ROLE_KEY to apps/web/.env
 *     (needed because anon key cannot INSERT into global_recipes)
 *
 * Usage:
 *   node apps/web/scripts/seed-english-recipes.mjs
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// ─── Load .env ────────────────────────────────────────────────────────────────

function loadEnv() {
  try {
    const envPath = join(__dirname, '..', '.env')
    const content = readFileSync(envPath, 'utf-8')
    const env = {}
    for (const line of content.split('\n')) {
      const m = line.match(/^([^#=\s][^=]*)=(.*)$/)
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
    return env
  } catch {
    console.error('Could not read .env — create apps/web/.env')
    process.exit(1)
  }
}

const env = loadEnv()
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL) { console.error('VITE_SUPABASE_URL missing in .env'); process.exit(1) }
if (!SERVICE_ROLE_KEY) { console.error('SUPABASE_SERVICE_ROLE_KEY missing in .env'); process.exit(1) }

// ─── TheMealDB helpers ────────────────────────────────────────────────────────

const MEALDB = 'https://www.themealdb.com/api/json/v1/1'

async function apiFetch(url) {
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json()
}

async function getRandomMeal() {
  const data = await apiFetch(`${MEALDB}/random.php`)
  return data?.meals?.[0] ?? null
}

async function get30UniqueMeals() {
  const meals = []
  const seen = new Set()
  let attempts = 0
  process.stdout.write('Fetching 30 unique meals from TheMealDB...')
  while (meals.length < 30 && attempts < 100) {
    attempts++
    const meal = await getRandomMeal()
    if (meal && !seen.has(meal.idMeal)) {
      seen.add(meal.idMeal)
      meals.push(meal)
      process.stdout.write(`\rFetching meals: ${meals.length}/30`)
    }
    await new Promise(r => setTimeout(r, 150))
  }
  console.log(`\n✓ Got ${meals.length} unique meals`)
  return meals
}

// ─── Convert meal → recipe ────────────────────────────────────────────────────

function extractIngredients(meal) {
  const result = []
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]
    if (name && name.trim()) {
      const qty = (measure ?? '').replace(/[^\d./]/g, '').trim() || '1'
      const unit = (measure ?? '').replace(/[\d./\s]/g, '').trim() || ''
      result.push({ name: name.trim(), quantity: qty, unit })
    }
  }
  return result
}

function estimateMeta(meal) {
  const len = (meal.strInstructions ?? '').length
  if (len < 600) return { cooking_time: 20, difficulty: 'easy' }
  if (len < 1500) return { cooking_time: 40, difficulty: 'medium' }
  return { cooking_time: 65, difficulty: 'hard' }
}

function parseInstructionSteps(text) {
  if (!text) return [{ step: 1, description: 'Follow the recipe instructions.' }]
  // Try numbered steps
  const numbered = text.match(/(?:^|\r?\n)\s*\d+[.)]\s*.+/g)
  if (numbered && numbered.length >= 3) {
    return numbered.map((s, i) => ({
      step: i + 1,
      description: s.replace(/^\s*\d+[.)]\s*/, '').trim(),
    }))
  }
  // Split by newlines
  const lines = text.split(/\r?\n+/).map(s => s.trim()).filter(s => s.length > 20)
  if (lines.length >= 2) {
    return lines.map((line, i) => ({ step: i + 1, description: line }))
  }
  // Split by sentences
  const sentences = text.split(/\.\s+/).filter(s => s.trim().length > 20)
  if (sentences.length >= 2) {
    return sentences.map((s, i) => ({ step: i + 1, description: s.trim() + '.' }))
  }
  return [{ step: 1, description: text.trim() }]
}

function mealToRecipe(meal) {
  const meta = estimateMeta(meal)
  const ingredients = extractIngredients(meal)
  const instructions = parseInstructionSteps(meal.strInstructions)
  const youtubeUrl = (meal.strYoutube ?? '').trim() || null

  return {
    name: meal.strMeal,
    description: `${meal.strMeal} is a ${(meal.strCategory ?? 'classic').toLowerCase()} dish from ${meal.strArea ?? 'international'} cuisine.`,
    ingredients,
    instructions,
    cooking_time: meta.cooking_time,
    difficulty: meta.difficulty,
    image_url: meal.strMealThumb,
    youtube_url: youtubeUrl,
    mealdb_id: meal.idMeal,
    language: 'en',
    source: 'mealdb',
    servings: 4,
    is_vegetarian: false,
    is_vegan: false,
  }
}

// ─── Supabase insert ──────────────────────────────────────────────────────────

async function upsertRecipes(recipes) {
  const url = `${SUPABASE_URL}/rest/v1/global_recipes`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
      'Prefer': 'resolution=ignore-duplicates',  // skip on conflict
    },
    body: JSON.stringify(recipes),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Supabase error ${res.status}: ${err}`)
  }
  return res
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌍 Seeding 30 English recipes from TheMealDB...\n')

  const meals = await get30UniqueMeals()
  if (meals.length === 0) { console.error('No meals fetched.'); process.exit(1) }

  // Filter: must have image and instructions
  const valid = meals.filter(m => m.strMealThumb && m.strInstructions && m.strInstructions.length > 50)
  console.log(`✓ ${valid.length} valid meals (with photo + instructions)`)

  const recipes = valid.map(mealToRecipe)

  // Check ingredients completeness
  const complete = recipes.filter(r => r.ingredients.length >= 3 && r.instructions.length >= 2)
  console.log(`✓ ${complete.length} complete recipes (≥3 ingredients, ≥2 steps)`)

  if (complete.length === 0) { console.error('No complete recipes to insert.'); process.exit(1) }

  console.log('\nInserting into Supabase...')
  await upsertRecipes(complete)

  console.log(`\n✅ Done! ${complete.length} English recipes added to global_recipes.`)
  console.log('\nWith YouTube videos:')
  complete.filter(r => r.youtube_url).forEach(r => console.log(`  ▶ ${r.name}`))
}

main().catch(err => {
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
