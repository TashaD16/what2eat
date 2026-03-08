import { supabase, isSupabaseConfigured } from './supabase'
import { RecipeStep } from '../types/recipe'
import {
  MealDBMeal,
  getRandomMeals,
  findMealsByIngredients,
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
  name: string
  description: string
  instructions: RecipeStep[]
  ingredients: AIRecipeIngredient[]
  cooking_time: number
  difficulty: 'easy' | 'medium' | 'hard'
  source_ingredients: string[]
  image_url?: string
  created_at?: string
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

  const text = await callOpenAIMini(prompt)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error(`Не удалось перевести рецепт "${meal.strMeal}"`)

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
    image_url: meal.strMealThumb,   // real TheMealDB photo — permanent URL
    source_ingredients: [],
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
export async function generateRecipeByIngredients(ingredientNames: string[]): Promise<AIRecipe> {
  // Translate ingredient names to English for TheMealDB
  const namesEn = await translateIngredientsToEnglish(ingredientNames)
  const validNamesEn = namesEn.filter(Boolean)

  if (validNamesEn.length > 0) {
    const meals = await findMealsByIngredients(validNamesEn, 1)
    if (meals.length > 0) {
      const recipe = await translateMealToRussian(meals[0])
      recipe.source_ingredients = ingredientNames
      return recipe
    }
  }

  // Fallback: generate with GPT-4o-mini (no web search, just smart generation)
  return generateRecipeWithGPT(ingredientNames)
}

/**
 * GPT-4o-mini fallback when TheMealDB has no results.
 * Generates recipe text only — uses Unsplash placeholder for photo.
 */
async function generateRecipeWithGPT(ingredientNames: string[]): Promise<AIRecipe> {
  const prompt = `Составь вкусный рецепт из следующих продуктов: ${ingredientNames.join(', ')}.
Можно добавить базовые специи/соль/масло.

Верни ТОЛЬКО JSON (без пояснений):
{
  "name": "<название блюда на русском>",
  "description": "<2-3 предложения>",
  "cooking_time": <минуты>,
  "difficulty": "<easy|medium|hard>",
  "ingredients": [{"name": "<название>", "quantity": "<количество>", "unit": "<единица>"}],
  "instructions": [{"step": 1, "description": "<шаг>"}, ...]
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
export async function fetchRecipesFromWeb(count = 5): Promise<AIRecipe[]> {
  const meals = await getRandomMeals(count)
  if (meals.length === 0) throw new Error('TheMealDB недоступен. Проверьте интернет-соединение.')

  // Translate all meals in parallel
  const results = await Promise.allSettled(meals.map((m) => translateMealToRussian(m)))

  const successful = results
    .filter((r): r is PromiseFulfilledResult<AIRecipe> => r.status === 'fulfilled')
    .map((r) => r.value)

  if (successful.length === 0) throw new Error('Не удалось перевести рецепты')
  return successful
}

/**
 * Fetches count random meals from TheMealDB and translates them progressively.
 * Calls onRecipe as each translation completes so the caller can show cards one by one.
 * Returns all successfully translated recipes.
 */
export async function fetchRecipesProgressively(
  count: number,
  onRecipe: (recipe: AIRecipe, index: number) => void
): Promise<AIRecipe[]> {
  const meals = await getRandomMeals(count)
  if (meals.length === 0) throw new Error('TheMealDB недоступен. Проверьте интернет-соединение.')

  const successful: AIRecipe[] = []

  await Promise.allSettled(
    meals.map(async (meal, i) => {
      try {
        const recipe = await translateMealToRussian(meal)
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
