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

/** Loads all global recipe IDs for the given language and returns them shuffled. Only returns recipes with an image. */
export async function getShuffledGlobalRecipeIds(lang: 'ru' | 'en' = 'ru'): Promise<string[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase
    .from('global_recipes')
    .select('id')
    .eq('language', lang)
    .not('image_url', 'is', null)
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

type RawRecipeRow = {
  id: string
  name: string
  description: string
  instructions: unknown
  ingredients: AIRecipe['ingredients']
  cooking_time: number
  difficulty: 'easy' | 'medium' | 'hard'
  image_url: string | null
  youtube_url?: string | null
  mealdb_id?: string | null
  source_ingredients?: string[]
  created_at?: string
}

function mapRow(r: RawRecipeRow): AIRecipe {
  return {
    id: r.id,
    name: r.name,
    description: r.description ?? '',
    instructions: parseInstructions(r.instructions),
    ingredients: r.ingredients ?? [],
    cooking_time: r.cooking_time ?? 30,
    difficulty: r.difficulty ?? 'medium',
    image_url: r.image_url ?? undefined,
    youtube_url: r.youtube_url ?? undefined,
    mealdb_id: r.mealdb_id ?? undefined,
    source_ingredients: r.source_ingredients ?? [],
    created_at: r.created_at,
  }
}

/** Fetches full recipes by UUID list (up to 20 at a time). */
export async function getGlobalRecipesByIds(ids: string[]): Promise<AIRecipe[]> {
  if (!isSupabaseConfigured() || ids.length === 0) return []
  const { data, error } = await supabase
    .from('global_recipes')
    .select('*')
    .in('id', ids)
  if (error || !data) return []
  return (data as RawRecipeRow[]).map(mapRow)
}

export interface SearchGlobalRecipesOptions {
  /** При true — только рецепты, где все ингредиенты входят в выбранные или в список специй */
  strictOnlySelectedAndSpices?: boolean
  /** Названия специй (категория spices) — при strictOnlySelectedAndSpices не требуют выбора */
  spiceNames?: string[]
  /** Language filter — only return recipes in this language */
  lang?: 'ru' | 'en'
}

/**
 * Searches global_recipes by ingredient names.
 * Fetches all recipes and ranks client-side by number of matching ingredients.
 */
export async function searchGlobalRecipesByIngredients(
  ingredientNames: string[],
  options: SearchGlobalRecipesOptions = {}
): Promise<AIRecipe[]> {
  if (!isSupabaseConfigured() || ingredientNames.length === 0) return []

  const { strictOnlySelectedAndSpices = false, spiceNames = [], lang = 'ru' } = options
  const lowerNames = ingredientNames.map((n) => n.toLowerCase())
  const lowerSpice = spiceNames.map((n) => n.toLowerCase())
  const allowedLower = new Set([...lowerNames, ...lowerSpice])

  const { data, error } = await supabase
    .from('global_recipes')
    .select('*')
    .eq('language', lang)
    .limit(500)

  if (error || !data) return []

  const scored = (data as RawRecipeRow[])
    .filter((r) => {
      // Only show complete recipes: must have photo, ingredients and instructions
      if (!r.image_url) return false
      const ings = r.ingredients
      if (!Array.isArray(ings) || ings.length === 0) return false
      const instr = parseInstructions(r.instructions)
      return instr.length > 0
    })
    .map((r) => {
      const ingText = JSON.stringify(r.ingredients ?? []).toLowerCase()
      const score = lowerNames.filter((n) => ingText.includes(n)).length
      return { r, score }
    })
    .filter(({ score }) => score > 0)

  let filtered = scored
  if (strictOnlySelectedAndSpices && allowedLower.size > 0) {
    filtered = scored.filter(({ r }) => {
      const ings = (r.ingredients ?? []) as Array<{ name?: string }>
      return ings.every((ing) => {
        const name = (ing.name ?? '').trim().toLowerCase()
        return name === '' || allowedLower.has(name)
      })
    })
  }

  filtered.sort((a, b) => b.score - a.score)

  return filtered.slice(0, 20).map(({ r }) => ({
    ...mapRow(r),
    source_ingredients: ingredientNames,
  }))
}

/** Поиск рецептов по названию (для строки поиска в шапке). */
export async function searchGlobalRecipesByName(query: string, lang?: 'ru' | 'en'): Promise<Array<{ id: string; name: string }>> {
  if (!isSupabaseConfigured() || !query.trim()) return []
  let q = supabase
    .from('global_recipes')
    .select('id, name')
    .ilike('name', `%${query.trim()}%`)
    .limit(10)
    .order('name')
  if (lang) q = q.eq('language', lang)
  const { data, error } = await q
  if (error) {
    console.error('searchGlobalRecipesByName:', error)
    return []
  }
  return (data ?? []).map((r: { id: string; name: string }) => ({ id: r.id, name: r.name }))
}

/**
 * Ищет рецепты по списку названий (для подстановки AI-предложений в свайп).
 * Возвращает полные рецепты, подходящие под любое из названий (ilike).
 */
export async function searchGlobalRecipesByNames(
  names: string[],
  lang: 'ru' | 'en' = 'ru'
): Promise<AIRecipe[]> {
  if (!isSupabaseConfigured() || names.length === 0) return []
  const trimmed = names.map((n) => n.trim()).filter(Boolean)
  if (trimmed.length === 0) return []
  const orFilter = trimmed.map((n) => `name.ilike.%${n}%`).join(',')
  const { data, error } = await supabase
    .from('global_recipes')
    .select('*')
    .eq('language', lang)
    .or(orFilter)
    .not('image_url', 'is', null)
    .limit(50)
  if (error) {
    console.error('searchGlobalRecipesByNames:', error)
    return []
  }
  const rows = (data ?? []) as RawRecipeRow[]
  const seen = new Set<string>()
  const result: AIRecipe[] = []
  for (const r of rows) {
    if (seen.has(r.id)) continue
    seen.add(r.id)
    if (Array.isArray(r.ingredients) && r.ingredients.length > 0 && parseInstructions(r.instructions).length > 0) {
      result.push(mapRow(r))
    }
  }
  return result
}

/** Загрузка одного рецепта по UUID (для открытия из поиска по названию). */
export async function getGlobalRecipeById(id: string): Promise<AIRecipe | null> {
  if (!isSupabaseConfigured() || !id) return null
  const recipes = await getGlobalRecipesByIds([id])
  return recipes[0] ?? null
}

/** Saves a new recipe to the global pool using check-then-insert to avoid duplicates per (mealdb_id, language). */
export async function saveGlobalRecipe(recipe: AIRecipe, mealdbId?: string): Promise<string | null> {
  if (!isSupabaseConfigured()) return null
  const resolvedMealdbId = mealdbId ?? recipe.mealdb_id ?? null
  const lang = recipe.language ?? 'ru'

  // Check for existing record by (mealdb_id, language) to avoid duplicates
  if (resolvedMealdbId) {
    const { data: existing } = await supabase
      .from('global_recipes')
      .select('id')
      .eq('mealdb_id', resolvedMealdbId)
      .eq('language', lang)
      .maybeSingle()
    if (existing?.id) return existing.id as string
  }

  const { data, error } = await supabase
    .from('global_recipes')
    .insert({
      name: recipe.name,
      description: recipe.description,
      instructions: recipe.instructions,
      ingredients: recipe.ingredients,
      cooking_time: recipe.cooking_time,
      difficulty: recipe.difficulty,
      image_url: recipe.image_url ?? null,
      youtube_url: recipe.youtube_url ?? null,
      mealdb_id: resolvedMealdbId,
      language: lang,
      source: 'mealdb',
    })
    .select('id')
    .single()

  if (error) {
    console.error('saveGlobalRecipe insert error:', error)
    return null
  }
  return (data?.id as string) ?? null
}

/**
 * Loads recipes by UUID and returns them in the requested language.
 * For recipes with a mealdb_id, looks up the translated version in global_recipes.
 * For missing translations, triggers background translation+save and returns originals.
 */
export async function getGlobalRecipesInLanguage(
  recipeIds: string[],
  lang: 'ru' | 'en'
): Promise<AIRecipe[]> {
  if (!isSupabaseConfigured() || recipeIds.length === 0) return []

  const originals = await getGlobalRecipesByIds(recipeIds)
  if (originals.length === 0) return []

  const withMealdbId = originals.filter((r) => r.mealdb_id)
  const withoutMealdbId = originals.filter((r) => !r.mealdb_id)

  if (withMealdbId.length === 0) return originals

  const mealdbIds = withMealdbId.map((r) => r.mealdb_id!)

  // Find existing translated versions in the target language
  const { data, error } = await supabase
    .from('global_recipes')
    .select('*')
    .in('mealdb_id', mealdbIds)
    .eq('language', lang)

  const translatedByMealdbId = new Map<string, AIRecipe>()
  if (!error && data) {
    for (const r of data as RawRecipeRow[]) {
      if (r.mealdb_id) translatedByMealdbId.set(r.mealdb_id, mapRow(r))
    }
  }

  // For missing translations, trigger background translation+save
  const missingMealdbIds = mealdbIds.filter((id) => !translatedByMealdbId.has(id))
  if (missingMealdbIds.length > 0) {
    // Dynamic import to avoid potential circular dependency at load time
    import('./aiRecipes').then(({ translateRecipeToOtherLanguage }) => {
      for (const orig of withMealdbId.filter((r) => missingMealdbIds.includes(r.mealdb_id!))) {
        translateRecipeToOtherLanguage(orig)
          .then((other) => saveGlobalRecipe(other))
          .catch(() => {})
      }
    }).catch(() => {})
  }

  return [
    ...withMealdbId.map((orig) => translatedByMealdbId.get(orig.mealdb_id!) ?? orig),
    ...withoutMealdbId,
  ]
}
