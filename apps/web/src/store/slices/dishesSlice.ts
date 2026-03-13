import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Dish } from '@what2eat/types'
import * as dishesService from '../../services/dishes'
import { FindDishesOptions } from '../../services/dishes'
import { suggestDishesByIngredients, fetchPopularDishes, PopularDishSuggestion } from '../../services/openai'
import {
  fetchRecipesFromWeb,
  fetchRecipesProgressively,
  generateDishPhoto,
  AIRecipe,
  searchRecipesByDishNames,
  translateRecipeToOtherLanguage,
  generateRecipeByIngredients,
} from '../../services/aiRecipes'
import { loadSeedFromCache, saveSeedToCache, SEED_COUNT } from '../../services/seedRecipes'
import { isSupabaseConfigured } from '../../services/supabase'
import {
  getShuffledGlobalRecipeIds,
  getGlobalRecipesByIds,
  saveGlobalRecipe,
  searchGlobalRecipesByNames,
} from '../../services/globalRecipes'

// Max dishes shown in ingredient search results
export const FREE_TIER_LIMIT = 5

export type LoadingStep = 'search' | 'photos' | null

interface DishesState {
  dishes: Dish[]
  aiDishRecipes: Record<number, AIRecipe>
  aiRandomMode: boolean      // true while in randomizer mode (enables auto-load-more)
  loadingStep: LoadingStep   // which phase of AI loading we're in
  loadingMore: boolean       // background loading after first dish appears
  suggestedDishNames: string[]
  popularSuggestions: PopularDishSuggestion[]
  loading: boolean
  error: string | null
  globalRecipeQueue: string[]      // shuffled UUIDs not yet shown
  globalRecipesExhausted: boolean  // true when queue is empty
}

const initialState: DishesState = {
  dishes: [],
  aiDishRecipes: {},
  aiRandomMode: false,
  loadingStep: null,
  loadingMore: false,
  suggestedDishNames: [],
  popularSuggestions: [],
  loading: false,
  error: null,
  globalRecipeQueue: [],
  globalRecipesExhausted: false,
}

// ─── Simple thunks (defined before slice so they can go in extraReducers) ─────

export const findDishes = createAsyncThunk(
  'dishes/findByIngredients',
  async ({ ingredientIds, options }: { ingredientIds: number[]; options?: FindDishesOptions }) => {
    return await dishesService.findDishesByIngredients(ingredientIds, options)
  }
)

/** Локальная БД удалена — рандомайзер использует только generateAIRandomDishes (Supabase global_recipes). */
export const randomizeMeatDishes = createAsyncThunk(
  'dishes/randomizeMeat',
  async (): Promise<Dish[]> => []
)

export const fetchPopularDishSuggestions = createAsyncThunk(
  'dishes/fetchPopular',
  async () => {
    return await fetchPopularDishes()
  }
)

export const fetchSuggestedDishes = createAsyncThunk(
  'dishes/suggestByAi',
  async ({ ingredientNames, lang }: { ingredientNames: string[]; lang: 'ru' | 'en' }) => {
    return await suggestDishesByIngredients(ingredientNames, lang)
  }
)

// ─── Slice ─────────────────────────────────────────────────────────────────────

const dishesSlice = createSlice({
  name: 'dishes',
  initialState,
  reducers: {
    clearDishes: (state) => {
      state.dishes = []
      state.aiDishRecipes = {}
      state.aiRandomMode = false
      state.suggestedDishNames = []
      state.popularSuggestions = []
      state.loadingStep = null
      state.loadingMore = false
      state.globalRecipeQueue = []
      state.globalRecipesExhausted = false
    },

    // Called at the start of AI randomizer to reset and show loading
    startAIRandom: (state) => {
      state.loading = true
      state.error = null
      state.dishes = []
      state.aiDishRecipes = {}
      state.aiRandomMode = true
      state.loadingStep = 'search'
      state.loadingMore = false
      state.globalRecipeQueue = []
      state.globalRecipesExhausted = false
    },

    // Called when web search finishes and photo phase starts
    setLoadingStep: (state, action: PayloadAction<LoadingStep>) => {
      state.loadingStep = action.payload
    },

    /** Optional missingIngredientNames: when "Buy missing" is on, list of ingredients to buy per dish. */
    addAIDish: (state, action: PayloadAction<{ recipe: AIRecipe; index: number; missingIngredientNames?: string[] }>) => {
      const { recipe, index, missingIngredientNames } = action.payload
      const id = -(index + 1)
      if (state.dishes.find((d) => d.id === id)) return
      const missing = (missingIngredientNames ?? []).map((name) => ({ id: 0, name, category: 'other' as const, image_url: null }))
      state.dishes.push({
        id,
        name: recipe.name,
        description: recipe.description,
        image_url: recipe.image_url ?? null,
        cooking_time: recipe.cooking_time,
        difficulty: recipe.difficulty,
        servings: 2,
        estimated_cost: null,
        is_vegetarian: false,
        is_vegan: false,
        missing_ingredients: missing.length ? missing : undefined,
      })
      state.aiDishRecipes[id] = recipe
      state.loading = false
    },

    addAIDishes: (state, action: PayloadAction<Array<{ recipe: AIRecipe; index: number; missingIngredientNames?: string[] }>>) => {
      for (const { recipe, index, missingIngredientNames } of action.payload) {
        const id = -(index + 1)
        if (state.dishes.find((d) => d.id === id)) continue
        const missing = (missingIngredientNames ?? []).map((name) => ({ id: 0, name, category: 'other' as const, image_url: null }))
        state.dishes.push({
          id,
          name: recipe.name,
          description: recipe.description,
          image_url: recipe.image_url ?? null,
          cooking_time: recipe.cooking_time,
          difficulty: recipe.difficulty,
          servings: 2,
          estimated_cost: null,
          is_vegetarian: false,
          is_vegan: false,
          missing_ingredients: missing.length ? missing : undefined,
        })
        state.aiDishRecipes[id] = recipe
      }
      state.loading = false
      state.loadingMore = false
    },

    /** Заменить список блюд полным результатом поиска (после подгрузки остальных) */
    replaceAIDishes: (state, action: PayloadAction<Array<{ recipe: AIRecipe; index: number; missingIngredientNames?: string[] }>>) => {
      state.dishes = []
      state.aiDishRecipes = {}
      for (const { recipe, index, missingIngredientNames } of action.payload) {
        const id = -(index + 1)
        const missing = (missingIngredientNames ?? []).map((name) => ({ id: 0, name, category: 'other' as const, image_url: null }))
        state.dishes.push({
          id,
          name: recipe.name,
          description: recipe.description,
          image_url: recipe.image_url ?? null,
          cooking_time: recipe.cooking_time,
          difficulty: recipe.difficulty,
          servings: 2,
          estimated_cost: null,
          is_vegetarian: false,
          is_vegan: false,
          missing_ingredients: missing.length ? missing : undefined,
        })
        state.aiDishRecipes[id] = recipe
      }
      state.loading = false
      state.loadingMore = false
    },

    clearSuggestedDishNames: (state) => {
      state.suggestedDishNames = []
    },

    setLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.loadingMore = action.payload
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },

    // Called when all loading is done (or failed)
    finishAIRandom: (state, action: PayloadAction<string | null>) => {
      state.loading = false
      state.loadingMore = false
      state.loadingStep = null
      if (action.payload) state.error = action.payload
    },

    setGlobalRecipeQueue: (state, action: PayloadAction<string[]>) => {
      state.globalRecipeQueue = action.payload
      state.globalRecipesExhausted = action.payload.length === 0
    },

    consumeFromGlobalQueue: (state, action: PayloadAction<number>) => {
      state.globalRecipeQueue = state.globalRecipeQueue.slice(action.payload)
      if (state.globalRecipeQueue.length === 0) state.globalRecipesExhausted = true
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(findDishes.pending, (state) => {
        state.loading = true
        state.error = null
        state.aiRandomMode = false
        state.suggestedDishNames = []
        state.aiDishRecipes = {}
        state.loadingStep = null
        state.loadingMore = false
      })
      .addCase(findDishes.fulfilled, (state, action) => {
        state.loading = false
        // Merge SQLite results with any already-shown global recipes (first shown immediately)
        const fromSearch = action.payload.slice(0, FREE_TIER_LIMIT)
        state.dishes = [...fromSearch, ...state.dishes]
      })
      .addCase(findDishes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to find dishes'
      })
      .addCase(randomizeMeatDishes.pending, (state) => {
        state.loading = true
        state.error = null
        state.aiRandomMode = false
        state.aiDishRecipes = {}
        state.loadingStep = null
        state.loadingMore = false
      })
      .addCase(randomizeMeatDishes.fulfilled, (state, action) => {
        state.loading = false
        state.dishes = action.payload.slice(0, FREE_TIER_LIMIT)
      })
      .addCase(randomizeMeatDishes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to randomize dishes'
      })
      .addCase(fetchSuggestedDishes.fulfilled, (state, action) => {
        state.suggestedDishNames = action.payload
      })
      .addCase(fetchSuggestedDishes.rejected, (state) => {
        state.suggestedDishNames = []
      })
      .addCase(fetchPopularDishSuggestions.pending, (state) => {
        state.popularSuggestions = []
      })
      .addCase(fetchPopularDishSuggestions.fulfilled, (state, action) => {
        state.popularSuggestions = action.payload
      })
      .addCase(fetchPopularDishSuggestions.rejected, (state) => {
        state.popularSuggestions = []
      })
  },
})

/** Load AI-suggested dish names: first from global_recipes, then from internet (TheMealDB) if none found. */
export const loadSuggestedRecipesByNames = createAsyncThunk(
  'dishes/loadSuggestedByNames',
  async (
    { names, lang }: { names: string[]; lang: 'ru' | 'en' },
    { dispatch }
  ) => {
    if (names.length === 0) return
    dispatch(setLoading(true))
    try {
      let recipes: AIRecipe[] = []
      if (isSupabaseConfigured()) {
        recipes = await searchGlobalRecipesByNames(names, lang)
      }
      if (recipes.length === 0) {
        try {
          recipes = await searchRecipesByDishNames(names, 5, lang)
          if (recipes.length > 0 && isSupabaseConfigured()) {
            recipes.forEach((r) => {
              saveGlobalRecipe(r).catch(() => {})
              translateRecipeToOtherLanguage(r).then((other) => saveGlobalRecipe(other)).catch(() => {})
            })
          }
        } catch {
          // No API key or network — leave suggested list as is
        }
      }
      if (recipes.length > 0) {
        dispatch(addAIDishes(recipes.map((recipe, i) => ({ recipe, index: i }))))
        dispatch(dishesSlice.actions.clearSuggestedDishNames())
      }
    } finally {
      dispatch(setLoading(false))
    }
  }
)

/** Generate recipes for suggested dish names via AI when DB and internet search returned nothing. */
export const generateSuggestedRecipesByAI = createAsyncThunk(
  'dishes/generateSuggestedByAI',
  async (
    { names, lang }: { names: string[]; lang: 'ru' | 'en' },
    { dispatch }
  ) => {
    if (names.length === 0) return
    dispatch(setLoading(true))
    try {
      const recipes: AIRecipe[] = []
      for (const name of names.slice(0, 5)) {
        try {
          let recipe = await generateRecipeByIngredients([name])
          if (lang === 'en') {
            recipe = await translateRecipeToOtherLanguage(recipe)
          }
          recipe.language = lang
          recipes.push(recipe)
        } catch {
          // skip failed one
        }
      }
      if (recipes.length > 0) {
        dispatch(addAIDishes(recipes.map((recipe, i) => ({ recipe, index: i }))))
        dispatch(dishesSlice.actions.clearSuggestedDishNames())
        if (isSupabaseConfigured()) {
          recipes.forEach((r) => {
            saveGlobalRecipe(r).catch(() => {})
            translateRecipeToOtherLanguage(r).then((other) => saveGlobalRecipe(other)).catch(() => {})
          })
        }
      }
    } finally {
      dispatch(setLoading(false))
    }
  }
)

export const {
  clearDishes, startAIRandom, setLoadingStep, setLoadingMore, setLoading, addAIDish, addAIDishes, replaceAIDishes, finishAIRandom,
  setGlobalRecipeQueue, consumeFromGlobalQueue, clearSuggestedDishNames,
} = dishesSlice.actions
export type { PopularDishSuggestion }
export default dishesSlice.reducer

// ─── Image preloader ───────────────────────────────────────────────────────────

/** Preloads an image URL into the browser cache. Resolves even on error. */
function preloadImage(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = () => resolve()
    img.src = url
  })
}

// ─── Helper: preload image, return preloaded recipe (no dispatch) ──────────────

async function preloadRecipe(
  recipe: AIRecipe,
  index: number,
  skipPreload = false
): Promise<{ recipe: AIRecipe; index: number } | null> {
  try {
    const clone = { ...recipe }
    if (!clone.image_url) {
      clone.image_url = await generateDishPhoto(clone.name)
    }
    if (!clone.image_url) return null
    if (!skipPreload) await preloadImage(clone.image_url)
    return { recipe: clone, index }
  } catch {
    return null
  }
}

/** Preload first card and dispatch immediately (shows SwipeDeck). */
async function dispatchWithPreload(
  recipe: AIRecipe,
  index: number,
  dispatch: (action: unknown) => void,
  skipPreload = false
): Promise<boolean> {
  const result = await preloadRecipe(recipe, index, skipPreload)
  if (!result) return false
  dispatch(addAIDish({ recipe: result.recipe, index: result.index }))
  return true
}

// ─── Batch preload helper — preloads all in parallel, dispatches ONE action ────

async function batchPreloadAndDispatch(
  recipes: AIRecipe[],
  dispatch: (action: unknown) => void,
  indexOffset = 0
): Promise<number> {
  const results = await Promise.allSettled(
    recipes.map((recipe, i) => preloadRecipe(recipe, indexOffset + i))
  )
  const ready = results
    .filter((r): r is PromiseFulfilledResult<{ recipe: AIRecipe; index: number }> =>
      r.status === 'fulfilled' && r.value !== null
    )
    .map((r) => r.value)

  if (ready.length > 0) {
    dispatch(addAIDishes(ready))
  }
  return ready.length
}

// ─── Progressive AI randomizer thunk ──────────────────────────────────────────

/**
 * Randomizer:
 *
 * Scenario A (Supabase configured) — loads from global_recipes pool (no OpenAI cost):
 *   - Fetches all shuffled IDs → stores queue in Redux.
 *   - Loads first 10 records, shows first card immediately.
 *   - Remaining 9 preloaded in background.
 *
 * Scenario B (no Supabase) — legacy localStorage + TheMealDB + GPT fallback:
 *   - Cache hit: dispatch all cached recipes.
 *   - First run: fetch + translate SEED_COUNT meals progressively.
 *
 * When ≤3 cards remain, SwipeDeck auto-dispatches loadMoreWebDishes.
 */
export const generateAIRandomDishes = (cuisine?: string | null) => async (
  dispatch: (action: unknown) => void,
  getState: () => { lang?: { lang: 'ru' | 'en' } }
) => {
  dispatch(startAIRandom())
  const lang = getState().lang?.lang ?? 'ru'

  if (isSupabaseConfigured()) {
    // ── Scenario A: Supabase global_recipes (no OpenAI cost) ───────────────
    const ids = await getShuffledGlobalRecipeIds(lang)
    dispatch(setGlobalRecipeQueue(ids))

    if (ids.length === 0) {
      dispatch(finishAIRandom('База рецептов пуста. Запустите seed-global-recipes.'))
      return
    }

    const firstBatch = ids.slice(0, 10)
    dispatch(consumeFromGlobalQueue(10))
    const recipes = await getGlobalRecipesByIds(firstBatch)

    if (recipes.length === 0) {
      dispatch(finishAIRandom('Не удалось загрузить рецепты из базы.'))
      return
    }

    // First card: preload image so it shows without flicker
    await dispatchWithPreload(recipes[0], 0, dispatch)

    // Remaining: preload all in parallel, then dispatch in one batch (no flicker)
    if (recipes.length > 1) {
      dispatch(setLoadingMore(true))
      await batchPreloadAndDispatch(recipes.slice(1), dispatch, 1)
      // setLoadingMore(false) is handled inside addAIDishes reducer
    }

    dispatch(finishAIRandom(null))
  } else {
    // ── Scenario B: no Supabase — localStorage cache + TheMealDB + GPT ────
    const cached = loadSeedFromCache()

    if (cached.length > 0) {
      dispatch(setLoadingStep('photos'))
      await dispatchWithPreload(cached[0], 0, dispatch)
      if (cached.length > 1) {
        dispatch(setLoadingMore(true))
        await batchPreloadAndDispatch(cached.slice(1), dispatch, 1)
        // setLoadingMore(false) handled inside addAIDishes reducer
      }
      dispatch(finishAIRandom(null))
    } else {
      let successful: AIRecipe[] = []
      let firstDispatched = false
      try {
        dispatch(setLoadingMore(true))
        successful = await fetchRecipesProgressively(SEED_COUNT, (recipe, i) => {
          if (!firstDispatched) {
            firstDispatched = true
            dispatchWithPreload(recipe, i, dispatch, true)
          } else {
            dispatchWithPreload(recipe, i, dispatch, false)
          }
        }, cuisine, lang)
      } catch (e) {
        dispatch(finishAIRandom(e instanceof Error ? e.message : 'Ошибка загрузки рецептов'))
        return
      }
      if (successful.length > 0) saveSeedToCache(successful)
      dispatch(finishAIRandom(
        successful.length === 0
          ? 'Не удалось загрузить рецепты. Проверьте интернет-соединение.'
          : null
      ))
    }
  }
}

// ─── Load-more thunk: called by SwipeDeck when nearing the end ────────────────

/**
 * Loads 5 more recipes and appends to the swipe deck without flickering.
 *
 * Priority order:
 *   1. Supabase global_recipes queue (no OpenAI cost)
 *   2. TheMealDB + GPT fallback (when queue exhausted or no Supabase)
 *      → new recipes are also saved back to global_recipes to grow the pool
 */
export const loadMoreWebDishes = () => async (
  dispatch: (action: unknown) => void,
  getState: () => { dishes: DishesState; lang?: { lang: 'ru' | 'en' } }
) => {
  const { globalRecipeQueue, globalRecipesExhausted } = getState().dishes
  const lang = getState().lang?.lang ?? 'ru'
  const currentCount = getState().dishes.dishes.length
  dispatch(setLoadingMore(true))

  try {
    if (globalRecipeQueue.length > 0) {
      // ── Next 5 from Supabase (no OpenAI) ───────────────────────────────
      const nextIds = globalRecipeQueue.slice(0, 5)
      dispatch(consumeFromGlobalQueue(5))
      const recipes = await getGlobalRecipesByIds(nextIds)
      await batchPreloadAndDispatch(recipes, dispatch, currentCount)
    } else if (globalRecipesExhausted || !isSupabaseConfigured()) {
      // ── Fallback: TheMealDB + GPT → save back to grow the pool ─────────
      const recipes = await fetchRecipesFromWeb(5, lang)
      await Promise.allSettled(recipes.map((r) => saveGlobalRecipe(r)))
      await batchPreloadAndDispatch(recipes, dispatch, currentCount)
    }
  } catch {
    // Silently fail — user still has existing cards to swipe
  }

  dispatch(setLoadingMore(false))
}
