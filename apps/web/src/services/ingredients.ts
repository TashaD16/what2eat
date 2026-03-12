import { supabase, isSupabaseConfigured } from './supabase'
import { Ingredient } from '@what2eat/types'

function mapRow(r: { id: number; name: string; category: string; image_url: string | null }): Ingredient {
  return {
    id: r.id,
    name: r.name,
    category: r.category as Ingredient['category'],
    image_url: r.image_url ?? null,
  }
}

export async function getAllIngredients(): Promise<Ingredient[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, category, image_url')
    .order('category')
    .order('name')
  if (error) {
    console.error('getAllIngredients:', error)
    return []
  }
  return (data ?? []).map(mapRow)
}

export async function getIngredientsByCategory(
  category: Ingredient['category']
): Promise<Ingredient[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, category, image_url')
    .eq('category', category)
    .order('name')
  if (error) {
    console.error('getIngredientsByCategory:', error)
    return []
  }
  return (data ?? []).map(mapRow)
}

export async function searchIngredients(query: string): Promise<Ingredient[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, category, image_url')
    .ilike('name', `%${query}%`)
    .order('name')
  if (error) {
    console.error('searchIngredients:', error)
    return []
  }
  return (data ?? []).map(mapRow)
}
