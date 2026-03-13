import { supabase, isSupabaseConfigured } from './supabase'

export interface FavoriteRecord {
  id: string
  user_id: string
  local_dish_id: number | null
  ai_recipe_id: string | null
  added_at: string
}

export async function addFavoriteLocalDish(userId: string, dishId: number): Promise<void> {
  if (!isSupabaseConfigured()) return
  await supabase
    .from('favorite_recipes')
    .upsert({ user_id: userId, local_dish_id: dishId }, { onConflict: 'user_id,local_dish_id' })
}

export async function removeFavoriteLocalDish(userId: string, dishId: number): Promise<void> {
  if (!isSupabaseConfigured()) return
  await supabase
    .from('favorite_recipes')
    .delete()
    .eq('user_id', userId)
    .eq('local_dish_id', dishId)
}

export async function getUserFavoriteDishIds(userId: string): Promise<number[]> {
  if (!isSupabaseConfigured()) return []
  const { data } = await supabase
    .from('favorite_recipes')
    .select('local_dish_id')
    .eq('user_id', userId)
    .not('local_dish_id', 'is', null)
  if (!data) return []
  return data.map((r) => r.local_dish_id as number)
}

export async function migrateLocalFavoritesToSupabase(userId: string, dishIds: number[]): Promise<void> {
  if (!isSupabaseConfigured() || dishIds.length === 0) return
  const rows = dishIds.map((id) => ({ user_id: userId, local_dish_id: id }))
  await supabase.from('favorite_recipes').upsert(rows, { onConflict: 'user_id,local_dish_id' })
}

export async function addFavoriteGlobalRecipe(userId: string, recipeId: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  const { data } = await supabase
    .from('favorite_recipes')
    .select('id')
    .eq('user_id', userId)
    .eq('ai_recipe_id', recipeId)
    .maybeSingle()
  if (!data) {
    await supabase.from('favorite_recipes').insert({ user_id: userId, ai_recipe_id: recipeId })
  }
}

export async function removeFavoriteGlobalRecipe(userId: string, recipeId: string): Promise<void> {
  if (!isSupabaseConfigured()) return
  await supabase
    .from('favorite_recipes')
    .delete()
    .eq('user_id', userId)
    .eq('ai_recipe_id', recipeId)
}

export async function getUserFavoriteGlobalRecipeIds(userId: string): Promise<string[]> {
  if (!isSupabaseConfigured()) return []
  const { data } = await supabase
    .from('favorite_recipes')
    .select('ai_recipe_id')
    .eq('user_id', userId)
    .not('ai_recipe_id', 'is', null)
  if (!data) return []
  return data.map((r) => r.ai_recipe_id as string)
}
