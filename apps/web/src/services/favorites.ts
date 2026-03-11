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
  const { data: existing } = await supabase
    .from('favorite_recipes')
    .select('id')
    .eq('user_id', userId)
    .eq('local_dish_id', dishId)
    .maybeSingle()
  if (existing) return
  await supabase.from('favorite_recipes').insert({ user_id: userId, local_dish_id: dishId })
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
  const { data: existing } = await supabase
    .from('favorite_recipes')
    .select('local_dish_id')
    .eq('user_id', userId)
    .in('local_dish_id', dishIds)
  const existingIds = new Set((existing ?? []).map((r) => r.local_dish_id as number))
  const newRows = dishIds.filter((id) => !existingIds.has(id)).map((id) => ({ user_id: userId, local_dish_id: id }))
  if (newRows.length === 0) return
  await supabase.from('favorite_recipes').insert(newRows)
}
