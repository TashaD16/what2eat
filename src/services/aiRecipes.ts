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
  created_at?: string
}

const OPENAI_PROXY_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/openai-proxy`
  : null

async function callOpenAI(messages: object[], model = 'gpt-4o-mini', max_tokens = 1500): Promise<string> {
  // Use Edge Function proxy if configured, otherwise fall back to direct call with client key
  if (OPENAI_PROXY_URL) {
    const session = await supabase.auth.getSession()
    const token = session.data.session?.access_token
    const response = await fetch(OPENAI_PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, model, max_tokens }),
    })
    if (!response.ok) throw new Error(`Proxy error: ${response.status}`)
    const data = await response.json()
    return (data.choices?.[0]?.message?.content as string) ?? ''
  }

  // Fallback: direct OpenAI call (dev only, key exposed)
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) throw new Error('OpenAI API key not configured')
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, max_tokens, messages }),
  })
  if (!response.ok) throw new Error(`OpenAI error: ${response.status}`)
  const data = await response.json()
  return (data.choices?.[0]?.message?.content as string) ?? ''
}

export async function generateRecipeByIngredients(ingredientNames: string[]): Promise<AIRecipe> {
  const prompt = `Ты опытный повар. Придумай вкусный рецепт из следующих продуктов: ${ingredientNames.join(', ')}.
Можно использовать не все продукты и добавить базовые специи/соль/масло.

Верни ТОЛЬКО JSON объект в точном формате:
{
  "name": "<название блюда на русском>",
  "description": "<2-3 предложения о блюде>",
  "cooking_time": <минуты как число>,
  "difficulty": "<easy|medium|hard>",
  "ingredients": [{"name": "<название>", "quantity": "<количество>", "unit": "<единица>"}],
  "instructions": [{"step": 1, "description": "<описание шага>"}, ...]
}
Без пояснений, только JSON.`

  const text = await callOpenAI([{ role: 'user', content: prompt }], 'gpt-4o-mini', 1200)
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('Не удалось получить рецепт от AI')

  const parsed = JSON.parse(match[0]) as AIRecipe
  parsed.source_ingredients = ingredientNames
  return parsed
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
