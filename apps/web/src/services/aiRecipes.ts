import { supabase, isSupabaseConfigured } from './supabase'
import { RecipeStep } from '@what2eat/types'
import {
  MealDBMeal,
  getRandomMeals,
  getMealsByArea,
  getMealById,
  findMealsByIngredients,
  searchMealsByName,
  cuisineToMealDbAreas,
  extractIngredients,
  estimateMeta,
} from './mealDbService'

export interface AIRecipeIngredient {
  name: string
  quantity: string
  unit: string
}

export interface AIRecipe {
  id?: string
  mealdb_id?: string            // TheMealDB idMeal — used for dedup in global_recipes
  name: string
  description: string
  instructions: RecipeStep[]
  ingredients: AIRecipeIngredient[]
  cooking_time: number
  difficulty: 'easy' | 'medium' | 'hard'
  source_ingredients: string[]
  image_url?: string
  youtube_url?: string          // TheMealDB strYoutube (may be absent)
  language?: 'ru' | 'en'       // recipe language (default 'ru')
  created_at?: string
  // Nutrition per 1 serving (~2 servings total)
  calories_per_serving?: number
  protein_per_serving?: number
  fat_per_serving?: number
  carbs_per_serving?: number
}

/** Splits raw TheMealDB instruction text into structured steps. */
function parseInstructionSteps(text: string): RecipeStep[] {
  // Try numbered steps "1. ..." or "1) ..."
  const numbered = text.match(/(?:^|\r?\n)\s*\d+[.)]\s*.+/g)
  if (numbered && numbered.length >= 3) {
    return numbered.map((s, i) => ({
      step: i + 1,
      description: s.replace(/^\s*\d+[.)]\s*/, '').trim(),
    }))
  }
  // Split by newlines
  const lines = text.split(/\r?\n+/).map((s) => s.trim()).filter((s) => s.length > 20)
  if (lines.length >= 2) {
    return lines.map((line, i) => ({ step: i + 1, description: line }))
  }
  // Split by sentences
  const sentences = text.split(/\.\s+/).filter((s) => s.trim().length > 20)
  return sentences.map((s, i) => ({ step: i + 1, description: s.trim() + '.' }))
}

/**
 * Converts a TheMealDB meal to an English AIRecipe without any translation.
 * Used when the app is in English mode.
 */
export function mealToEnglishRecipe(meal: MealDBMeal): AIRecipe {
  const ings = extractIngredients(meal).map((i) => ({
    name: i.nameEn,
    quantity: i.measure.replace(/[^\d./]/g, '').trim() || '1',
    unit: i.measure.replace(/[\d./\s]/g, '').trim() || '',
  }))
  const meta = estimateMeta(meal)
  const youtubeUrl = (meal.strYoutube ?? '').trim() || undefined
  return {
    mealdb_id: meal.idMeal,
    name: meal.strMeal,
    description: `${meal.strMeal} is a ${(meal.strCategory ?? '').toLowerCase()} dish from ${meal.strArea ?? 'international'} cuisine.`,
    ingredients: ings,
    instructions: parseInstructionSteps(meal.strInstructions ?? ''),
    cooking_time: meta.cooking_time,
    difficulty: meta.difficulty,
    image_url: meal.strMealThumb,
    youtube_url: youtubeUrl,
    source_ingredients: [],
    language: 'en',
  }
}

function getApiKey(): string {
  const key = import.meta.env.VITE_OPENAI_API_KEY
  if (!key) throw new Error('Задайте VITE_OPENAI_API_KEY в .env для работы AI-функций')
  return key
}

/** GPT-4o-mini — used only for translation and fallback recipe generation. */
async function callOpenAIMini(prompt: string): Promise<string> {
  const apiKey = getApiKey()
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI error: ${response.status} — ${err}`)
  }
  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>
  }
  return data.choices?.[0]?.message?.content ?? ''
}

/**
 * Translates a TheMealDB meal into Russian and formats it as AIRecipe.
 * Uses GPT-4o-mini — cheap (~$0.0001 per meal), no web search needed.
 */
async function translateMealToRussian(meal: MealDBMeal): Promise<AIRecipe> {
  const ingsEn = extractIngredients(meal)
  const meta = estimateMeta(meal)

  const ingredientLines = ingsEn.map((i) => `${i.nameEn}: ${i.measure}`).join('\n')
  // Trim instructions to avoid token overflow
  const instructions = meal.strInstructions.slice(0, 3000)

  const prompt = `Переведи этот рецепт с английского на русский. Раздели инструкции на чёткие пронумерованные шаги. Оцени КБЖУ на 1 порцию (рецепт рассчитан на 2 порции).

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
  "instructions": [{"step": 1, "description": "<подробный шаг на русском>"}, ...],
  "calories_per_serving": <целое число ккал>,
  "protein_per_serving": <целое число г>,
  "fat_per_serving": <целое число г>,
  "carbs_per_serving": <целое число г>
}`

  const text = await callOpenAIMini(prompt)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`Не удалось перевести рецепт "${meal.strMeal}"`)

  const parsed = JSON.parse(match[0]) as {
    name: string
    description: string
    ingredients: AIRecipeIngredient[]
    instructions: RecipeStep[]
    calories_per_serving?: number
    protein_per_serving?: number
    fat_per_serving?: number
    carbs_per_serving?: number
  }

  const youtubeUrl = (meal.strYoutube ?? '').trim() || undefined

  return {
    mealdb_id: meal.idMeal,
    name: parsed.name,
    description: parsed.description,
    ingredients: parsed.ingredients,
    instructions: parsed.instructions,
    cooking_time: meta.cooking_time,
    difficulty: meta.difficulty,
    image_url: meal.strMealThumb,   // real TheMealDB photo — permanent URL
    youtube_url: youtubeUrl,
    source_ingredients: [],
    language: 'ru',
    calories_per_serving: parsed.calories_per_serving,
    protein_per_serving: parsed.protein_per_serving,
    fat_per_serving: parsed.fat_per_serving,
    carbs_per_serving: parsed.carbs_per_serving,
  }
}

/**
 * Translates a list of Russian ingredient names to English for TheMealDB queries.
 */
async function translateIngredientsToEnglish(namesRu: string[]): Promise<string[]> {
  const prompt = `Переведи названия продуктов с русского на английский (одно слово/словосочетание).
Верни ТОЛЬКО JSON массив строк в том же порядке, без пояснений.
Входные данные: ${JSON.stringify(namesRu)}`

  const text = await callOpenAIMini(prompt)
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) return namesRu.map(() => '')

  const result = JSON.parse(match[0]) as string[]
  return result.map((s) => s.trim())
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Finds a recipe from TheMealDB using the selected Russian ingredient names.
 * Falls back to GPT-4o-mini generation if TheMealDB has no results.
 * Image is always TheMealDB photo (no DALL-E needed).
 */
export async function generateRecipeByIngredients(
  ingredientNames: string[],
  cuisine?: string | null
): Promise<AIRecipe> {
  // Translate ingredient names to English for TheMealDB
  const namesEn = await translateIngredientsToEnglish(ingredientNames)
  const validNamesEn = namesEn.filter(Boolean)

  const areas = cuisineToMealDbAreas(cuisine ?? null)

  if (validNamesEn.length > 0) {
    const meals = await findMealsByIngredients(validNamesEn, areas.length > 0 ? 10 : 1)
    // If cuisine filter set, prefer meals matching the target area
    const filtered = areas.length > 0
      ? meals.filter((m) => areas.includes(m.strArea))
      : meals
    const candidate = filtered[0] ?? meals[0]
    if (candidate) {
      const recipe = await translateMealToRussian(candidate)
      recipe.source_ingredients = ingredientNames
      return recipe
    }
  }

  // Fallback: generate with GPT-4o-mini (no web search, just smart generation)
  return generateRecipeWithGPT(ingredientNames, cuisine ?? null)
}

/**
 * GPT-4o-mini fallback when TheMealDB has no results.
 * Generates recipe text only — uses Unsplash placeholder for photo.
 */
async function generateRecipeWithGPT(ingredientNames: string[], cuisine: string | null = null): Promise<AIRecipe> {
  const cuisineHint = cuisine ? `\nПредпочтительная кухня: ${cuisine}.` : ''
  const prompt = `Составь вкусный рецепт из следующих продуктов: ${ingredientNames.join(', ')}.
Можно добавить базовые специи/соль/масло.${cuisineHint}
Оцени КБЖУ на 1 порцию (рецепт рассчитан на 2 порции).

Верни ТОЛЬКО JSON (без пояснений):
{
  "name": "<название блюда на русском>",
  "description": "<2-3 предложения>",
  "cooking_time": <минуты>,
  "difficulty": "<easy|medium|hard>",
  "ingredients": [{"name": "<название>", "quantity": "<количество>", "unit": "<единица>"}],
  "instructions": [{"step": 1, "description": "<шаг>"}, ...],
  "calories_per_serving": <целое число ккал>,
  "protein_per_serving": <целое число г>,
  "fat_per_serving": <целое число г>,
  "carbs_per_serving": <целое число г>
}`

  const text = await callOpenAIMini(prompt)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Не удалось создать рецепт')

  const parsed = JSON.parse(match[0]) as AIRecipe
  parsed.source_ingredients = ingredientNames

  // Fallback photo from Unsplash (no DALL-E cost)
  parsed.image_url = `https://source.unsplash.com/featured/1024x1024/?food,${encodeURIComponent(parsed.name)}`

  return parsed
}

/**
 * Fetches N diverse random recipes from TheMealDB and translates them to Russian.
 * Real food photos included — no DALL-E, no web search.
 * Called by the randomizer thunk for progressive loading.
 */
export async function fetchRecipesFromWeb(count = 5, lang: 'ru' | 'en' = 'ru'): Promise<AIRecipe[]> {
  const meals = await getRandomMeals(count)
  if (meals.length === 0) throw new Error('TheMealDB недоступен. Проверьте интернет-соединение.')

  const transform = lang === 'en'
    ? (m: MealDBMeal) => Promise.resolve(mealToEnglishRecipe(m))
    : translateMealToRussian

  const results = await Promise.allSettled(meals.map((m) => transform(m)))

  const successful = results
    .filter((r): r is PromiseFulfilledResult<AIRecipe> => r.status === 'fulfilled')
    .map((r) => r.value)

  if (successful.length === 0) throw new Error('Не удалось загрузить рецепты')
  return successful
}

/**
 * Fetches count random meals from TheMealDB and translates them progressively.
 * Calls onRecipe as each translation completes so the caller can show cards one by one.
 * Returns all successfully translated recipes.
 */
export async function fetchRecipesProgressively(
  count: number,
  onRecipe: (recipe: AIRecipe, index: number) => void,
  cuisine?: string | null,
  lang: 'ru' | 'en' = 'ru'
): Promise<AIRecipe[]> {
  let meals: MealDBMeal[]
  const areas = cuisineToMealDbAreas(cuisine ?? null)

  if (areas.length > 0) {
    // Fetch meal IDs for first matching area, then get full details
    let ids: string[] = []
    for (const area of areas) {
      ids = await getMealsByArea(area)
      if (ids.length > 0) break
    }
    // Shuffle and pick `count` IDs
    const shuffled = [...ids].sort(() => Math.random() - 0.5).slice(0, count)
    const fetched = await Promise.all(shuffled.map((id) => getMealById(id)))
    meals = fetched.filter((m): m is MealDBMeal => m !== null)
  } else {
    meals = await getRandomMeals(count)
  }

  if (meals.length === 0) throw new Error('TheMealDB недоступен. Проверьте интернет-соединение.')

  const successful: AIRecipe[] = []

  const transform = lang === 'en'
    ? (m: MealDBMeal) => Promise.resolve(mealToEnglishRecipe(m))
    : translateMealToRussian

  await Promise.allSettled(
    meals.map(async (meal, i) => {
      try {
        const recipe = await transform(meal)
        onRecipe(recipe, i)
        successful.push(recipe)
      } catch {
        // Skip failed translation — continue with others
      }
    })
  )

  return successful
}

// Kept for compatibility — used by dishesSlice progressive loader.
// Now just returns the TheMealDB thumbnail (no DALL-E call).
export async function generateDishPhoto(dishName: string): Promise<string> {
  // For cache-based loading: photo URLs are already stored in cache.
  // This stub exists so dishesSlice doesn't need changes.
  // In practice, recipes from TheMealDB always have image_url set.
  return `https://source.unsplash.com/featured/1024x1024/?food,${encodeURIComponent(dishName)}`
}

/**
 * Searches the internet (TheMealDB) by dish names — e.g. AI-suggested names when not in DB.
 * Translates names to English, searches search.php?s=, returns up to maxCount recipes in requested language.
 */
export async function searchRecipesByDishNames(
  dishNamesRu: string[],
  maxCount = 5,
  lang: 'ru' | 'en' = 'ru'
): Promise<AIRecipe[]> {
  if (dishNamesRu.length === 0) return []
  const namesEn =
    lang === 'en'
      ? dishNamesRu.filter(Boolean)
      : await translateIngredientsToEnglish(dishNamesRu)
  const validEn = namesEn.filter(Boolean).slice(0, 8)
  if (validEn.length === 0) return []

  const seenIds = new Set<string>()
  const meals: MealDBMeal[] = []
  for (const nameEn of validEn) {
    if (meals.length >= maxCount) break
    const found = await searchMealsByName(nameEn)
    for (const m of found) {
      if (m && m.idMeal && !seenIds.has(m.idMeal)) {
        seenIds.add(m.idMeal)
        meals.push(m)
        if (meals.length >= maxCount) break
      }
    }
  }

  if (meals.length === 0) return []
  const transform = lang === 'en' ? (m: MealDBMeal) => Promise.resolve(mealToEnglishRecipe(m)) : translateMealToRussian
  const results = await Promise.allSettled(meals.map((m) => transform(m)))
  return results
    .filter((r): r is PromiseFulfilledResult<AIRecipe> => r.status === 'fulfilled')
    .map((r) => r.value)
    .filter((r) => r.image_url && r.ingredients.length > 0 && r.instructions.length > 0)
}

/**
 * Searches TheMealDB by Russian ingredient names (translates first),
 * then translates found meals to Russian.
 * Used as fallback when global_recipes has no matches.
 * Only returns complete recipes (image + ingredients + instructions).
 */
export async function searchRecipesByIngredients(
  ingredientNamesRu: string[],
  count = 5,
  lang: 'ru' | 'en' = 'ru'
): Promise<AIRecipe[]> {
  if (ingredientNamesRu.length === 0) return []

  // For English mode ingredient names are already in English, skip translation
  let validEn: string[]
  if (lang === 'en') {
    validEn = ingredientNamesRu.filter(Boolean)
  } else {
    const namesEn = await translateIngredientsToEnglish(ingredientNamesRu)
    validEn = namesEn.filter(Boolean)
  }
  if (validEn.length === 0) return []

  const meals = await findMealsByIngredients(validEn, count)
  if (meals.length === 0) return []

  const transform = lang === 'en'
    ? (m: MealDBMeal) => Promise.resolve(mealToEnglishRecipe(m))
    : translateMealToRussian

  const results = await Promise.allSettled(meals.map((m) => transform(m)))
  return results
    .filter((r): r is PromiseFulfilledResult<AIRecipe> => r.status === 'fulfilled')
    .map((r) => { r.value.source_ingredients = ingredientNamesRu; return r.value })
    .filter((r) => r.image_url && r.ingredients.length > 0 && r.instructions.length > 0)
}

/**
 * Translates a recipe to the other language.
 * - If mealdb_id is set: fetches the meal from TheMealDB and converts directly (free, no GPT for EN direction).
 * - If no mealdb_id: uses GPT-4o-mini to translate the recipe structure.
 */
export async function translateRecipeToOtherLanguage(recipe: AIRecipe): Promise<AIRecipe> {
  const otherLang: 'ru' | 'en' = recipe.language === 'ru' ? 'en' : 'ru'

  if (recipe.mealdb_id) {
    const meal = await getMealById(recipe.mealdb_id)
    if (meal) {
      const translated = otherLang === 'en'
        ? mealToEnglishRecipe(meal)
        : await translateMealToRussian(meal)
      translated.source_ingredients = recipe.source_ingredients
      return translated
    }
  }

  // GPT fallback: translate the full recipe text
  const targetLangName = otherLang === 'ru' ? 'русский' : 'English'
  const prompt = `Translate this recipe to ${targetLangName}. Return ONLY JSON (no explanation):
{
  "name": "<name>",
  "description": "<description>",
  "ingredients": [{"name": "<name>", "quantity": "<qty>", "unit": "<unit>"}],
  "instructions": [{"step": 1, "description": "<step>"}]
}

Recipe:
${JSON.stringify({ name: recipe.name, description: recipe.description, ingredients: recipe.ingredients, instructions: recipe.instructions })}`

  const text = await callOpenAIMini(prompt)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`Failed to translate recipe "${recipe.name}"`)

  const parsed = JSON.parse(match[0]) as Pick<AIRecipe, 'name' | 'description' | 'ingredients' | 'instructions'>
  return {
    ...recipe,
    id: undefined,
    name: parsed.name,
    description: parsed.description,
    ingredients: parsed.ingredients,
    instructions: parsed.instructions,
    language: otherLang,
  }
}

export async function saveAIRecipe(userId: string, recipe: AIRecipe): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const { data, error } = await supabase
    .from('ai_recipes')
    .insert({
      user_id: userId,
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      cooking_time: recipe.cooking_time,
      difficulty: recipe.difficulty,
      source_ingredients: recipe.source_ingredients,
    })
    .select('id')
    .single()
  if (error) {
    console.error('Failed to save AI recipe:', error)
    return null
  }
  return data.id as string
}
