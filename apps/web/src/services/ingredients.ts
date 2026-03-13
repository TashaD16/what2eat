import { supabase, isSupabaseConfigured } from './supabase'
import { Ingredient, CuisineCode } from '@what2eat/types'

function mapRow(r: {
  id: number
  name: string
  category: string
  image_url: string | null
  cuisines?: string[] | null
}): Ingredient {
  const cuisines = r.cuisines?.length
    ? (r.cuisines as CuisineCode[])
    : undefined
  return {
    id: r.id,
    name: r.name,
    category: r.category as Ingredient['category'],
    image_url: r.image_url ?? null,
    cuisines,
  }
}

export async function getAllIngredients(): Promise<Ingredient[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, category, image_url, cuisines')
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
    .select('id, name, category, image_url, cuisines')
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
    .select('id, name, category, image_url, cuisines')
    .ilike('name', `%${query}%`)
    .order('name')
  if (error) {
    console.error('searchIngredients:', error)
    return []
  }
  return (data ?? []).map(mapRow)
}

/** Подходит ли ингредиент для выбранной кухни: пустой cuisines = все кухни, иначе в списке должна быть кухня */
export function ingredientMatchesCuisine(ing: Ingredient, cuisine: string | null): boolean {
  if (!cuisine) return true
  if (!ing.cuisines?.length) return true
  return (ing.cuisines as string[]).includes(cuisine)
}
