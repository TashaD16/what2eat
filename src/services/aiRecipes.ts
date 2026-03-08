import { supabase, isSupabaseConfigured } from './supabase'
import { RecipeStep } from '../types/recipe'

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

/**
 * Calls OpenAI Responses API with web_search_preview tool — real internet search.
 */
async function callOpenAIWithWebSearch(prompt: string): Promise<string> {
  const apiKey = getApiKey()
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      tools: [{ type: 'web_search_preview' }],
      input: prompt,
    }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`OpenAI web search error: ${response.status} — ${err}`)
  }
  const data = (await response.json()) as {
    output?: Array<{
      type: string
      content?: Array<{ type: string; text?: string }>
    }>
  }
  const message = data.output?.find((o) => o.type === 'message')
  const text = message?.content?.find((c) => c.type === 'output_text')?.text
  if (!text) throw new Error('Пустой ответ от OpenAI')
  return text
}

/**
 * Generates a photorealistic food photo using DALL-E 3. Throws if generation fails.
 * Recipe is never shown without a photo.
 */
async function generateDishPhoto(dishName: string): Promise<string> {
  const apiKey = getApiKey()
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt: `Professional food photography of "${dishName}": beautifully plated dish, restaurant quality, appetizing presentation, natural lighting, 4K, photorealistic. No text, no watermarks.`,
      n: 1,
      size: '1024x1024',
      quality: 'standard',
    }),
  })
  if (!response.ok) {
    const err = await response.text()
    throw new Error(`DALL-E 3 error: ${response.status} — ${err}`)
  }
  const data = (await response.json()) as { data?: Array<{ url?: string }> }
  const url = data.data?.[0]?.url
  if (!url) throw new Error('Не удалось получить фото блюда от DALL-E 3')
  return url
}

/**
 * Generates a recipe by searching the internet via OpenAI, then creates a matching photo.
 * Never returns a recipe without a photo.
 */
export async function generateRecipeByIngredients(ingredientNames: string[]): Promise<AIRecipe> {
  const prompt = `Найди в интернете рецепт вкусного блюда из следующих продуктов: ${ingredientNames.join(', ')}.
Можно использовать не все продукты и добавить базовые специи/соль/масло.
Найди реальный проверенный рецепт с кулинарного сайта.

Верни ТОЛЬКО JSON объект (без пояснений, без markdown):
{
  "name": "<название блюда на русском>",
  "description": "<2-3 предложения о блюде: вкус, история, особенности>",
  "cooking_time": <минуты как число>,
  "difficulty": "<easy|medium|hard>",
  "ingredients": [{"name": "<название>", "quantity": "<количество>", "unit": "<единица измерения>"}],
  "instructions": [{"step": 1, "description": "<подробное описание шага>"}, ...]
}
Только JSON, без пояснений.`

  const text = await callOpenAIWithWebSearch(prompt)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Не удалось распознать рецепт от AI')

  const parsed = JSON.parse(match[0]) as AIRecipe
  parsed.source_ingredients = ingredientNames

  // Photo is required — throw if DALL-E fails
  parsed.image_url = await generateDishPhoto(parsed.name)

  return parsed
}

/**
 * Generates random diverse dishes from internet search + DALL-E 3 photos.
 * Dishes without photos are filtered out.
 */
export async function generateRandomAIDishes(count = 5): Promise<AIRecipe[]> {
  const prompt = `Найди в интернете ${count} разнообразных популярных домашних рецептов из разных кухонь мира.
Выбери по одному из: русская кухня, итальянская, азиатская (японская/китайская/тайская), мексиканская/латинская, средиземноморская/греческая.
Только реальные популярные блюда с понятными ингредиентами.

Верни ТОЛЬКО JSON массив объектов (без пояснений, без markdown):
[
  {
    "name": "<название блюда на русском>",
    "description": "<2-3 предложения о блюде: вкус, история, особенности>",
    "cooking_time": <минуты как число>,
    "difficulty": "<easy|medium|hard>",
    "ingredients": [{"name": "<название>", "quantity": "<количество>", "unit": "<единица>"}],
    "instructions": [{"step": 1, "description": "<подробное описание шага>"}, ...]
  }
]
Только JSON массив, без пояснений.`

  const text = await callOpenAIWithWebSearch(prompt)
  const match = text.match(/\[[\s\S]*\]/)
  if (!match) throw new Error('Не удалось получить список рецептов')

  const dishes = JSON.parse(match[0]) as AIRecipe[]

  // Generate photos in parallel — filter out any failures
  const results = await Promise.allSettled(
    dishes.map(async (dish) => {
      dish.image_url = await generateDishPhoto(dish.name)
      dish.source_ingredients = []
      return dish
    })
  )

  const successful = results
    .filter((r): r is PromiseFulfilledResult<AIRecipe> => r.status === 'fulfilled')
    .map((r) => r.value)

  if (successful.length === 0) {
    throw new Error('Не удалось сгенерировать фото ни для одного блюда')
  }

  return successful
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
