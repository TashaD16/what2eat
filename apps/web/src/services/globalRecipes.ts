import { supabase, isSupabaseConfigured } from './supabase'
import { AIRecipe } from './aiRecipes'
import { RecipeStep } from '@what2eat/types'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Loads all global recipe IDs and returns them shuffled. */
export async function getShuffledGlobalRecipeIds(): Promise<string[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase.from('global_recipes').select('id')
  if (error || !data) return []
  return shuffle(data.map((r: { id: string }) => r.id))
}

/** Normalizes instructions from Supabase — handles both JSONB array and double-encoded string. */
function parseInstructions(raw: unknown): RecipeStep[] {
  if (!raw) return []
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as RecipeStep[] } catch { return [] }
  }
  if (Array.isArray(raw)) return raw as RecipeStep[]
  return []
}

/** Fetches full recipes by UUID list (up to 20 at a time). */
export async function getGlobalRecipesByIds(ids: string[]): Promise<AIRecipe[]> {
  if (!isSupabaseConfigured() || ids.length === 0) return []
  const { data, error } = await supabase
    .from('global_recipes')
    .select('*')
    .in('id', ids)
  if (error || !data) return []

  return data.map((r: {
    id: string
    name: string
    description: string
    instructions: unknown
    ingredients: AIRecipe['ingredients']
    cooking_time: number
    difficulty: 'easy' | 'medium' | 'hard'
    image_url: string | null
    source_ingredients?: string[]
    created_at?: string
  }) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    instructions: parseInstructions(r.instructions),
    ingredients: r.ingredients ?? [],
    cooking_time: r.cooking_time ?? 30,
    difficulty: r.difficulty ?? 'medium',
    image_url: r.image_url ?? undefined,
    source_ingredients: r.source_ingredients ?? [],
    created_at: r.created_at,
  })) as AIRecipe[]
}

/**
 * Searches global_recipes by ingredient names.
 * Fetches all recipes and ranks client-side by number of matching ingredients.
 */
export async function searchGlobalRecipesByIngredients(ingredientNames: string[]): Promise<AIRecipe[]> {
  if (!isSupabaseConfigured() || ingredientNames.length === 0) return []

  const { data, error } = await supabase
    .from('global_recipes')
    .select('*')
    .limit(500)

  if (error || !data) return []

  const lowerNames = ingredientNames.map((n) => n.toLowerCase())

  const scored = data
    .map((r) => {
      const ingText = JSON.stringify(r.ingredients ?? []).toLowerCase()
      const score = lowerNames.filter((n) => ingText.includes(n)).length
      return { r, score }
    })
    .filter(({ score }) => score > 0)

  scored.sort((a, b) => b.score - a.score)

  return scored.slice(0, 20).map(({ r }) => ({
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    instructions: parseInstructions(r.instructions),
    ingredients: r.ingredients ?? [],
    cooking_time: r.cooking_time ?? 30,
    difficulty: r.difficulty ?? 'medium',
    image_url: r.image_url ?? undefined,
    source_ingredients: ingredientNames,
    created_at: r.created_at,
  })) as AIRecipe[]
}

/** Saves a new OpenAI-generated recipe to the global pool. */
export async function saveGlobalRecipe(recipe: AIRecipe, mealdbId?: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await supabase.from('global_recipes').upsert(
    {
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      cooking_time: recipe.cooking_time,
      difficulty: recipe.difficulty,
      image_url: recipe.image_url ?? null,
      mealdb_id: mealdbId ?? null,
      source: 'openai',
    },
    { onConflict: 'mealdb_id', ignoreDuplicates: true },
  )
}
