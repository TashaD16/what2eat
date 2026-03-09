// supabase/functions/seed-global-recipes/index.ts
// Deno Edge Function — seeds global_recipes table with 100 translated meals from TheMealDB.
// Deploy: supabase functions deploy seed-global-recipes
// Run:    supabase functions invoke seed-global-recipes --no-verify-jwt

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const TARGET = 100
const BATCH = 5 // parallel GPT translations per batch

// ─── TheMealDB types ────────────────────────────────────────────────────────

interface MealDBMeal {
  idMeal: string
  strMeal: string
  strCategory: string
  strArea: string
  strInstructions: string
  strMealThumb: string
  [key: string]: string | null
}

interface RecipeStep {
  step: number
  description: string
}

interface AIRecipeIngredient {
  name: string
  quantity: string
  unit: string
}

interface GlobalRecipeRow {
  name: string
  description: string
  instructions: RecipeStep[]
  ingredients: AIRecipeIngredient[]
  cooking_time: number
  difficulty: 'easy' | 'medium' | 'hard'
  image_url: string
  mealdb_id: string
  source: 'mealdb'
}

// ─── TheMealDB helpers ───────────────────────────────────────────────────────

async function getRandomMeal(): Promise<MealDBMeal | null> {
  try {
    const res = await fetch('https://www.themealdb.com/api/json/v1/1/random.php')
    if (!res.ok) return null
    const data = await res.json() as { meals: MealDBMeal[] }
    return data?.meals?.[0] ?? null
  } catch {
    return null
  }
}

function extractIngredients(meal: MealDBMeal): Array<{ nameEn: string; measure: string }> {
  const result: Array<{ nameEn: string; measure: string }> = []
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]
    if (name && name.trim()) {
      result.push({ nameEn: name.trim(), measure: (measure ?? '').trim() })
    }
  }
  return result
}

function estimateMeta(meal: MealDBMeal): { cooking_time: number; difficulty: 'easy' | 'medium' | 'hard' } {
  const len = meal.strInstructions?.length ?? 0
  if (len < 600) return { cooking_time: 20, difficulty: 'easy' }
  if (len < 1500) return { cooking_time: 40, difficulty: 'medium' }
  return { cooking_time: 65, difficulty: 'hard' }
}

/** Fetch `needed` unique meals from TheMealDB, excluding already-known IDs. */
async function fetchUniqueMeals(needed: number, existingIds: Set<string>): Promise<MealDBMeal[]> {
  const meals: MealDBMeal[] = []
  const seen = new Set<string>(existingIds)
  let attempts = 0
  const maxAttempts = needed * 4

  while (meals.length < needed && attempts < maxAttempts) {
    const batch = await Promise.all(
      Array.from({ length: Math.min(10, needed - meals.length + 5) }, () => getRandomMeal())
    )
    for (const meal of batch) {
      if (!meal || seen.has(meal.idMeal)) continue
      seen.add(meal.idMeal)
      meals.push(meal)
      if (meals.length >= needed) break
    }
    attempts += 10
  }

  return meals
}

// ─── GPT translation ─────────────────────────────────────────────────────────

async function translateMeal(meal: MealDBMeal, openaiKey: string): Promise<GlobalRecipeRow> {
  const ingsEn = extractIngredients(meal)
  const meta = estimateMeta(meal)
  const ingredientLines = ingsEn.map((i) => `${i.nameEn}: ${i.measure}`).join('\n')
  const instructions = meal.strInstructions.slice(0, 3000)

  const prompt = `Переведи этот рецепт с английского на русский. Раздели инструкции на чёткие пронумерованные шаги.

Блюдо: ${meal.strMeal}
Кухня: ${meal.strArea}, категория: ${meal.strCategory}
Инструкции: ${instructions}
Ингредиенты:
${ingredientLines}

Верни ТОЛЬКО JSON (без пояснений, без markdown):
{
  "name": "<название блюда на русском>",
  "description": "<2-3 предложения: что это за блюдо, вкус, из какой кухни>",
  "ingredients": [{"name": "<название на русском>", "quantity": "<количество>", "unit": "<единица>"}],
  "instructions": [{"step": 1, "description": "<подробный шаг на русском>"}, ...]
}`

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI error: ${res.status} — ${err}`)
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> }
  const text = data.choices?.[0]?.message?.content ?? ''
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`Failed to parse translation for "${meal.strMeal}"`)

  const parsed = JSON.parse(match[0]) as {
    name: string
    description: string
    ingredients: AIRecipeIngredient[]
    instructions: RecipeStep[]
  }

  return {
    name: parsed.name,
    description: parsed.description,
    ingredients: parsed.ingredients,
    instructions: parsed.instructions,
    cooking_time: meta.cooking_time,
    difficulty: meta.difficulty,
    image_url: meal.strMealThumb,
    mealdb_id: meal.idMeal,
    source: 'mealdb',
  }
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, // bypasses RLS for INSERT
    )
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: 'OPENAI_API_KEY not set' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      )
    }

    // 1. Get already-stored mealdb_ids to avoid duplicates
    const { data: existing } = await supabase
      .from('global_recipes')
      .select('mealdb_id')
    const existingIds = new Set<string>((existing ?? []).map((r: { mealdb_id: string }) => r.mealdb_id).filter(Boolean))
    const existingCount = existing?.length ?? 0

    const toFetch = TARGET - existingCount
    if (toFetch <= 0) {
      return new Response(
        JSON.stringify({ ok: true, inserted: 0, message: `Already have ${existingCount} recipes` }),
        { headers: { 'Content-Type': 'application/json' } },
      )
    }

    console.log(`Existing: ${existingCount}, fetching ${toFetch} more...`)

    // 2. Fetch unique meals from TheMealDB (fetch a few extra to account for failures)
    const meals = await fetchUniqueMeals(Math.ceil(toFetch * 1.2), existingIds)
    const toTranslate = meals.slice(0, toFetch)

    console.log(`Got ${meals.length} unique meals, translating ${toTranslate.length}...`)

    // 3. Translate in batches of BATCH
    let done = 0
    for (let i = 0; i < toTranslate.length; i += BATCH) {
      const batch = toTranslate.slice(i, i + BATCH)
      const results = await Promise.allSettled(
        batch.map((meal) => translateMeal(meal, openaiKey))
      )

      const translated = results
        .filter((r): r is PromiseFulfilledResult<GlobalRecipeRow> => r.status === 'fulfilled')
        .map((r) => r.value)

      if (translated.length > 0) {
        const { error } = await supabase
          .from('global_recipes')
          .upsert(translated, { onConflict: 'mealdb_id', ignoreDuplicates: true })
        if (error) console.error('Upsert error:', error)
      }

      done += translated.length
      console.log(`Translated ${done}/${toTranslate.length}...`)
    }

    return new Response(
      JSON.stringify({ ok: true, inserted: done, total: existingCount + done }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Seed error:', err)
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
