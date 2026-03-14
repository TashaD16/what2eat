import { supabase, isSupabaseConfigured } from './supabase'
import { Ingredient, CuisineCode } from '@what2eat/types'

type RawIngredientRow = {
  id: number
  name: string
  name_en?: string | null
  category: string
  image_url: string | null
  cuisines?: string[] | null
}

function mapRow(r: RawIngredientRow, lang: 'ru' | 'en' = 'ru'): Ingredient {
  const cuisines = r.cuisines?.length
    ? (r.cuisines as CuisineCode[])
    : undefined
  return {
    id: r.id,
    name: (lang === 'en' && r.name_en) ? r.name_en : r.name,
    category: r.category as Ingredient['category'],
    image_url: r.image_url ?? null,
    cuisines,
  }
}

export async function getAllIngredients(lang: 'ru' | 'en' = 'ru'): Promise<Ingredient[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, name_en, category, image_url, cuisines')
    .order('category')
    .order('name')
  if (error) {
    console.error('getAllIngredients:', error)
    return []
  }
  return (data ?? []).map((r) => mapRow(r as RawIngredientRow, lang))
}

export async function getIngredientsByCategory(
  category: Ingredient['category'],
  lang: 'ru' | 'en' = 'ru'
): Promise<Ingredient[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, name_en, category, image_url, cuisines')
    .eq('category', category)
    .order('name')
  if (error) {
    console.error('getIngredientsByCategory:', error)
    return []
  }
  return (data ?? []).map((r) => mapRow(r as RawIngredientRow, lang))
}

export async function searchIngredients(query: string, lang: 'ru' | 'en' = 'ru'): Promise<Ingredient[]> {
  if (!isSupabaseConfigured()) return []
  const nameField = lang === 'en' ? 'name_en' : 'name'
  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, name_en, category, image_url, cuisines')
    .ilike(nameField, `%${query}%`)
    .order('name')
  if (error) {
    console.error('searchIngredients:', error)
    return []
  }
  return (data ?? []).map((r) => mapRow(r as RawIngredientRow, lang))
}

/** Подходит ли ингредиент для выбранной кухни: пустой cuisines = все кухни, иначе в списке должна быть кухня */
export function ingredientMatchesCuisine(ing: Ingredient, cuisine: string | null): boolean {
  if (!cuisine) return true
  if (!ing.cuisines?.length) return true
  return (ing.cuisines as string[]).includes(cuisine)
}
