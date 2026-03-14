import { supabase, isSupabaseConfigured } from './supabase'
import { AIRecipe } from './aiRecipes'
import { RecipeStep } from '@what2eat/types'

// ─── In-memory recipe cache ────────────────────────────────────────────────────
// First search fetches all recipes for the language and caches them.
// Subsequent searches filter the cache in <10ms instead of making a new network request.
const _recipeCache = new Map<string, { rows: RawRecipeRow[]; ts: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function fetchAllRecipesForLang(lang: string): Promise<RawRecipeRow[]> {
  const cached = _recipeCache.get(lang)
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) return cached.rows

  const { data, error } = await supabase
    .from('global_recipes')
    .select('*')
    .eq('language', lang)
    .not('image_url', 'is', null)
    .limit(3000)

  if (error || !data) return []
  const rows = data as RawRecipeRow[]
  _recipeCache.set(lang, { rows, ts: Date.now() })
  return rows
}

/** Invalidate cache (call after saving new recipes). */
export function invalidateRecipeCache(lang?: string) {
  if (lang) _recipeCache.delete(lang)
  else _recipeCache.clear()
}

/** Pre-fetches all recipes for the language into the in-memory cache.
 *  Call on app init so the first search is instant. */
export function warmRecipeCache(lang: 'ru' | 'en'): void {
  if (isSupabaseConfigured()) {
    fetchAllRecipesForLang(lang).catch(() => {})
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Loads all global recipe IDs for the given language and returns them shuffled. Only returns recipes with an image. */
export async function getShuffledGlobalRecipeIds(lang: 'ru' | 'en' = 'ru', cookingTimeMax?: number | null): Promise<string[]> {
  if (!isSupabaseConfigured()) return []
  let q = supabase
    .from('global_recipes')
    .select('id')
    .eq('language', lang)
    .not('image_url', 'is', null)
  if (cookingTimeMax != null) q = q.lte('cooking_time', cookingTimeMax)
  const { data, error } = await q
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
  calories_per_serving?: number | null
  protein_per_serving?: number | null
  fat_per_serving?: number | null
  carbs_per_serving?: number | null
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
    calories_per_serving: r.calories_per_serving ?? undefined,
    protein_per_serving: r.protein_per_serving ?? undefined,
    fat_per_serving: r.fat_per_serving ?? undefined,
    carbs_per_serving: r.carbs_per_serving ?? undefined,
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
  /** Фильтр по калориям на порцию (null = не фильтровать) */
  caloriesMax?: number | null
  /** Фильтр по белкам на порцию (null = не фильтровать) */
  proteinMax?: number | null
  /** Фильтр по жирам на порцию (null = не фильтровать) */
  fatMax?: number | null
  /** Фильтр по углеводам на порцию (null = не фильтровать) */
  carbsMax?: number | null
  /** Фильтр по времени приготовления в минутах (null = не фильтровать) */
  cookingTimeMax?: number | null
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

/** Always-available kitchen staples — treated like spices, never counted as missing. */
const PANTRY_STAPLES: string[] = [
  // RU
  'вода', 'соль', 'сахар', 'перец молотый', 'черный перец', 'лавровый лист',
  'масло растительное', 'масло подсолнечное', 'уксус', 'укроп', 'петрушка', 'зелень',
  // EN
  'water', 'salt', 'sugar', 'black pepper', 'bay leaf',
  'vegetable oil', 'sunflower oil', 'vinegar', 'dill', 'parsley',
]

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

export interface CombinedSearchResult {
  /** Recipes where ALL ingredients are within selected + spices */
  strict: AIRecipe[]
  /** Recipes with some missing ingredients, sorted by fewest missing first */
  additional: Array<{ recipe: AIRecipe; missingNames: string[] }>
}

/**
 * Single-pass optimized search: returns strict matches AND additional-ingredient matches
 * in one iteration over the cache instead of two separate calls.
 */
export async function searchByIngredients(
  ingredientNames: string[],
  options: Omit<SearchGlobalRecipesOptions, 'strictOnlySelectedAndSpices' | 'maxResults' | 'dbLimit'> = {}
): Promise<CombinedSearchResult> {
  if (!isSupabaseConfigured() || ingredientNames.length === 0) {
    return { strict: [], additional: [] }
  }

  const {
    spiceNames = [],
    lang = 'ru',
    vegetarianOnly = false,
    veganOnly = false,
    cuisine = null,
    caloriesMax = null,
    proteinMax = null,
    fatMax = null,
    carbsMax = null,
    cookingTimeMax = null,
  } = options

  const selLower = ingredientNames.map((n) => n.toLowerCase().trim()).filter(Boolean)
  const spiceLower = (spiceNames as string[]).map((n) => n.toLowerCase().trim()).filter(Boolean)
  const allowedLower = [...selLower, ...spiceLower]

  const allRows = await fetchAllRecipesForLang(lang)
  if (allRows.length === 0) return { strict: [], additional: [] }

  const strictItems: Array<{ recipe: AIRecipe; score: number }> = []
  const additionalItems: Array<{ recipe: AIRecipe; missingNames: string[]; missingCount: number }> = []

  for (const r of allRows) {
    const rawIngs = r.ingredients
    if (!Array.isArray(rawIngs) || rawIngs.length === 0) continue
    const ings = rawIngs as Array<{ name?: string }>

    // Apply cheap numeric filters first — skip early to avoid ingredient parsing
    if (caloriesMax != null && r.calories_per_serving != null && r.calories_per_serving > caloriesMax) continue
    if (proteinMax != null && r.protein_per_serving != null && r.protein_per_serving > proteinMax) continue
    if (fatMax != null && r.fat_per_serving != null && r.fat_per_serving > fatMax) continue
    if (carbsMax != null && r.carbs_per_serving != null && r.carbs_per_serving > carbsMax) continue
    if (cookingTimeMax != null && r.cooking_time != null && r.cooking_time > cookingTimeMax) continue

    // Diet filters
    if (vegetarianOnly || veganOnly) {
      const wordKw = veganOnly ? VEGAN_EXCLUDE_KEYWORDS : MEAT_FISH_KEYWORDS
      const phraseKw = veganOnly ? VEGAN_EXCLUDE_PHRASES : []
      if (recipeHasIngredientKeyword(ings, wordKw, phraseKw)) continue
    }

    // Cuisine filter
    if (cuisine?.trim() && !recipeMatchesCuisine(r, cuisine.trim())) continue

    // Extract ingredient names (only `.name` field — not full JSON, no false positives)
    const ingLower = ings.map((ing) => (ing.name ?? '').toLowerCase().trim()).filter(Boolean)
    if (ingLower.length === 0) continue

    // Score: coverage-aware — (matched/total) * matched favours recipes where selected ingredients cover more of the recipe
    let matchCount = 0
    for (const sel of selLower) {
      if (ingLower.some((name) => name.includes(sel) || sel.includes(name))) matchCount++
    }
    if (matchCount === 0) continue
    const score = ingLower.length > 0 ? (matchCount / ingLower.length) * matchCount : 0

    // Classify as strict or additional in one pass
    const missingNames: string[] = []
    for (let i = 0; i < ings.length; i++) {
      const name = ingLower[i]
      if (!name) continue
      const isAllowed =
        allowedLower.some((a) => name.includes(a) || a.includes(name)) ||
        PANTRY_STAPLES.some((staple) => name.includes(staple) || staple.includes(name))
      if (!isAllowed) missingNames.push((ings[i].name ?? name))
    }

    const mapped = { ...mapRow(r), source_ingredients: ingredientNames }
    if (missingNames.length === 0) {
      strictItems.push({ recipe: mapped, score })
    } else {
      additionalItems.push({ recipe: mapped, missingNames, missingCount: missingNames.length })
    }
  }

  strictItems.sort((a, b) => b.score - a.score)
  additionalItems.sort((a, b) => a.missingCount - b.missingCount)

  return {
    strict: strictItems.map(({ recipe }) => recipe),
    additional: additionalItems.map(({ recipe, missingNames }) => ({ recipe, missingNames })),
  }
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
    dbLimit: _optionDbLimit,
    maxResults = 20,
    caloriesMax = null,
    proteinMax = null,
    fatMax = null,
    carbsMax = null,
    cookingTimeMax = null,
  } = options
  const lowerNames = ingredientNames.map((n) => n.toLowerCase().trim()).filter(Boolean)
  const lowerSpice = spiceNames.map((n) => n.toLowerCase()).filter(Boolean)
  const allowedLower = new Set([...lowerNames, ...lowerSpice])

  // Use in-memory cache — first call fetches all rows, subsequent calls are instant.
  // `_optionDbLimit` is kept for API compatibility but ignored (cache always holds all rows).
  const allRows = await fetchAllRecipesForLang(lang)
  if (allRows.length === 0) return []

  const scored = allRows
    .filter((r) => {
      const ings = r.ingredients
      return Array.isArray(ings) && ings.length > 0
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

  if (caloriesMax != null) {
    filtered = filtered.filter(({ r }) =>
      !r.calories_per_serving || r.calories_per_serving <= caloriesMax
    )
  }
  if (proteinMax != null) {
    filtered = filtered.filter(({ r }) => r.protein_per_serving == null || r.protein_per_serving <= proteinMax!)
  }
  if (fatMax != null) {
    filtered = filtered.filter(({ r }) => r.fat_per_serving == null || r.fat_per_serving <= fatMax!)
  }
  if (carbsMax != null) {
    filtered = filtered.filter(({ r }) => r.carbs_per_serving == null || r.carbs_per_serving <= carbsMax!)
  }
  if (cookingTimeMax != null) {
    filtered = filtered.filter(({ r }) => r.cooking_time == null || r.cooking_time <= cookingTimeMax!)
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
      calories_per_serving: recipe.calories_per_serving ?? null,
      protein_per_serving: recipe.protein_per_serving ?? null,
      fat_per_serving: recipe.fat_per_serving ?? null,
      carbs_per_serving: recipe.carbs_per_serving ?? null,
    })
    .select('id')
    .single()

  if (error) {
    console.error('saveGlobalRecipe insert error:', error)
    return null
  }
  // Invalidate cache so new recipe appears in next search
  invalidateRecipeCache(lang)
  return (data?.id as string) ?? null
}

export interface GetGlobalRecipesInLanguageResult {
  recipes: AIRecipe[]
  /** Resolves when all background translations have been saved; then re-fetch to show translated versions. */
  whenTranslationsSaved: Promise<void>
}

/**
 * Loads recipes by UUID in the requested language.
 * For missing translations: triggers background translation+save, returns originals; whenTranslationsSaved resolves after save — then re-call to get translated versions.
 */
export async function getGlobalRecipesInLanguage(
  recipeIds: string[],
  lang: 'ru' | 'en'
): Promise<GetGlobalRecipesInLanguageResult> {
  const noop = { recipes: [] as AIRecipe[], whenTranslationsSaved: Promise.resolve() as Promise<void> }
  if (!isSupabaseConfigured() || recipeIds.length === 0) return noop

  const originals = await getGlobalRecipesByIds(recipeIds)
  if (originals.length === 0) return noop

  const withMealdbId = originals.filter((r) => r.mealdb_id)
  const mealdbIds = withMealdbId.map((r) => r.mealdb_id!)

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

  const missingMealdbIds = mealdbIds.filter((id) => !translatedByMealdbId.has(id))
  const savePromises: Promise<unknown>[] = []
  if (missingMealdbIds.length > 0) {
    const { translateRecipeToOtherLanguage } = await import('./aiRecipes')
    for (const orig of withMealdbId.filter((r) => missingMealdbIds.includes(r.mealdb_id!))) {
      savePromises.push(
        translateRecipeToOtherLanguage(orig)
          .then((other) => saveGlobalRecipe(other))
          .catch(() => {})
      )
    }
  }

  const byOriginalId = new Map(originals.map((r) => [r.id, r]))
  const recipes: AIRecipe[] = []
  for (const id of recipeIds) {
    const orig = byOriginalId.get(id)
    if (!orig) continue
    if (orig.mealdb_id) {
      recipes.push(translatedByMealdbId.get(orig.mealdb_id) ?? orig)
    } else {
      recipes.push(orig)
    }
  }

  const whenTranslationsSaved = savePromises.length > 0 ? Promise.all(savePromises).then(() => {}) : Promise.resolve()
  return { recipes, whenTranslationsSaved }
}
