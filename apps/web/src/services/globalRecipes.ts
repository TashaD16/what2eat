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
  /** Только вегетарианские (без мяса/рыбы) */
  vegetarianOnly?: boolean
  /** Только веганские (без мяса/рыбы/молочки/яиц) */
  veganOnly?: boolean
  /** Кухня: russian, italian, asian, american — фильтр по названию/описанию */
  cuisine?: string | null
  /** Лимит строк из БД (для быстрой первой порции — меньше = быстрее) */
  dbLimit?: number
  /** Максимум рецептов в ответе (для первой порции — 5, потом подгрузка) */
  maxResults?: number
}

// Ключевые слова мяса/рыбы для фильтра вегетарианства (ru + en). Только целые слова, чтобы не отсекать "eggplant".
const MEAT_FISH_KEYWORDS = new Set([
  'мясо', 'говядина', 'свинина', 'баранина', 'курица', 'индейка', 'утка', 'фарш', 'бекон', 'колбаса', 'сосиски',
  'рыба', 'лосось', 'треска', 'сельдь', 'тунец', 'креветки', 'кальмар', 'мидии', 'моллюск',
  'meat', 'beef', 'pork', 'lamb', 'chicken', 'turkey', 'duck', 'minced', 'bacon', 'sausage', 'fish',
  'salmon', 'cod', 'herring', 'tuna', 'shrimp', 'prawn', 'squid', 'mussel', 'seafood',
])
const VEGAN_EXCLUDE_KEYWORDS = new Set([
  ...MEAT_FISH_KEYWORDS,
  'молоко', 'сливки', 'сыр', 'творог', 'сметана', 'яйцо', 'яйца', 'мёд', 'яичный',
  'milk', 'cream', 'cheese', 'butter', 'egg', 'eggs', 'honey', 'yogurt', 'yoghurt',
])
// Многословные фразы (проверяем как подстроку)
const VEGAN_EXCLUDE_PHRASES = ['масло сливочное', 'сливочное масло', 'butter']

function getWords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[\s,;]+/)
    .map((w) => w.replace(/[^\p{L}]/gu, ''))
    .filter(Boolean)
}

function recipeHasIngredientKeyword(
  ingredients: Array<{ name?: string }>,
  wordKeywords: Set<string>,
  phraseKeywords: string[]
): boolean {
  const text = ingredients
    .map((ing) => (ing.name ?? '').trim().toLowerCase())
    .join(' ')
  const words = new Set(getWords(text))
  if (phraseKeywords.some((phrase) => text.includes(phrase))) return true
  return [...wordKeywords].some((kw) => words.has(kw))
}

function recipeMatchesCuisine(recipe: { name: string; description?: string }, cuisine: string): boolean {
  const c = cuisine.toLowerCase()
  const name = (recipe.name ?? '').toLowerCase()
  const desc = (recipe.description ?? '').toLowerCase()
  const combined = `${name} ${desc}`
  const map: Record<string, string[]> = {
    russian: ['русск', 'russian', 'борщ', 'блин', 'пельмен', 'солянк', 'окрошк', 'гречк', 'каша'],
    italian: ['итальян', 'italian', 'паста', 'pasta', 'пицц', 'pizza', 'ризотто', 'ризотто'],
    asian: ['азиат', 'asian', 'суши', 'sushi', 'рис', 'rice', 'лапша', 'noodle', 'соус соев', 'soy'],
    american: ['америк', 'american', 'бургер', 'burger', 'стейк', 'steak', 'барбекю', 'bbq'],
  }
  const terms = map[c] ?? [c]
  return terms.some((t) => combined.includes(t))
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

  const {
    strictOnlySelectedAndSpices = false,
    spiceNames = [],
    lang = 'ru',
    vegetarianOnly = false,
    veganOnly = false,
    cuisine = null,
    dbLimit: optionDbLimit,
    maxResults = 20,
  } = options
  const lowerNames = ingredientNames.map((n) => n.toLowerCase().trim()).filter(Boolean)
  const lowerSpice = spiceNames.map((n) => n.toLowerCase()).filter(Boolean)
  const allowedLower = new Set([...lowerNames, ...lowerSpice])

  const fetchLimit =
    optionDbLimit ?? (vegetarianOnly || veganOnly ? 1500 : 500)
  const { data, error } = await supabase
    .from('global_recipes')
    .select('*')
    .eq('language', lang)
    .limit(fetchLimit)

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
      const ings = (r.ingredients ?? []) as Array<{ name?: string }>
      const ingText = JSON.stringify(ings).toLowerCase()
      // Считаем совпадения: имя ингредиента в рецепте содержит выбранное имя или наоборот
      const score = lowerNames.filter((n) => {
        if (!n) return false
        return ingText.includes(n) || ings.some((ing) => (ing.name ?? '').toLowerCase().includes(n))
      }).length
      return { r, score }
    })
    .filter(({ score }) => score > 0)

  let filtered = scored
  if (strictOnlySelectedAndSpices && allowedLower.size > 0) {
    filtered = scored.filter(({ r }) => {
      const ings = (r.ingredients ?? []) as Array<{ name?: string }>
      return ings.every((ing) => {
        const name = (ing.name ?? '').trim().toLowerCase()
        if (!name) return true
        if (allowedLower.has(name)) return true
        // Допускаем подвариант: "куриная грудка" при выбранном "курица"
        return [...allowedLower].some((a) => name.includes(a))
      })
    })
  }

  if (vegetarianOnly || veganOnly) {
    const wordKeywords = veganOnly ? VEGAN_EXCLUDE_KEYWORDS : MEAT_FISH_KEYWORDS
    const phraseKeywords = veganOnly ? VEGAN_EXCLUDE_PHRASES : []
    filtered = filtered.filter(
      ({ r }) =>
        !recipeHasIngredientKeyword(
          (r.ingredients ?? []) as Array<{ name?: string }>,
          wordKeywords,
          phraseKeywords
        )
    )
  }
  if (cuisine && cuisine.trim()) {
    filtered = filtered.filter(({ r }) => recipeMatchesCuisine(r, cuisine.trim()))
  }

  filtered.sort((a, b) => b.score - a.score)

  return filtered.slice(0, maxResults).map(({ r }) => ({
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
