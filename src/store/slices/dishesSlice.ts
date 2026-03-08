import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Dish } from '../../types'
import * as dishesService from '../../services/dishes'
import { FindDishesOptions } from '../../services/dishes'
import { suggestDishesByIngredients, fetchPopularDishes, PopularDishSuggestion } from '../../services/openai'
import { fetchRecipesFromWeb, fetchRecipesProgressively, generateDishPhoto, AIRecipe } from '../../services/aiRecipes'
import { loadSeedFromCache, saveSeedToCache, SEED_COUNT } from '../../services/seedRecipes'

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
}

// ─── Simple thunks (defined before slice so they can go in extraReducers) ─────

export const findDishes = createAsyncThunk(
  'dishes/findByIngredients',
  async ({ ingredientIds, options }: { ingredientIds: number[]; options?: FindDishesOptions }) => {
    return await dishesService.findDishesByIngredients(ingredientIds, options)
  }
)

export const randomizeMeatDishes = createAsyncThunk(
  'dishes/randomizeMeat',
  async () => {
    const allDishes = await dishesService.getAllDishes()
    return dishesService.randomizeDishes(allDishes)
  }
)

export const fetchPopularDishSuggestions = createAsyncThunk(
  'dishes/fetchPopular',
  async () => {
    return await fetchPopularDishes()
  }
)

export const fetchSuggestedDishes = createAsyncThunk(
  'dishes/suggestByAi',
  async (ingredientNames: string[]) => {
    return await suggestDishesByIngredients(ingredientNames)
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
    },

    // Called when web search finishes and photo phase starts
    setLoadingStep: (state, action: PayloadAction<LoadingStep>) => {
      state.loadingStep = action.payload
    },

    // Called as each dish becomes ready — shows SwipeDeck after the first one
    addAIDish: (state, action: PayloadAction<{ recipe: AIRecipe; index: number }>) => {
      const { recipe, index } = action.payload
      const id = -(index + 1)
      if (state.dishes.find((d) => d.id === id)) return // dedupe
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
      })
      state.aiDishRecipes[id] = recipe
      // As soon as first dish is ready, hide the full-page spinner
      state.loading = false
    },

    setLoadingMore: (state, action: PayloadAction<boolean>) => {
      state.loadingMore = action.payload
    },

    // Called when all loading is done (or failed)
    finishAIRandom: (state, action: PayloadAction<string | null>) => {
      state.loading = false
      state.loadingMore = false
      state.loadingStep = null
      if (action.payload) state.error = action.payload
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
        state.dishes = action.payload.slice(0, FREE_TIER_LIMIT)
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

export const { clearDishes, startAIRandom, setLoadingStep, setLoadingMore, addAIDish, finishAIRandom } = dishesSlice.actions
export type { PopularDishSuggestion }
export default dishesSlice.reducer

// ─── Helper: generate photos and dispatch addAIDish progressively ──────────────

async function generatePhotosForRecipes(
  recipes: AIRecipe[],
  dispatch: (action: unknown) => void,
  indexOffset = 0
): Promise<{ successCount: number; successful: AIRecipe[] }> {
  let successCount = 0
  const successful: AIRecipe[] = []

  await Promise.allSettled(
    recipes.map(async (recipe, i) => {
      try {
        const clone = { ...recipe }
        // If recipe already has a photo (TheMealDB), use it directly
        if (!clone.image_url) {
          clone.image_url = await generateDishPhoto(clone.name)
        }
        if (!clone.image_url) return // never show without photo
        dispatch(addAIDish({ recipe: clone, index: indexOffset + i }))
        successCount++
        successful.push(clone)
      } catch {
        // Skip on error
      }
    })
  )

  return { successCount, successful }
}

// ─── Progressive AI randomizer thunk ──────────────────────────────────────────

/**
 * Randomizer with 20-recipe seed cache:
 *
 * Scenario A — seed cache exists and fresh (30-day TTL):
 *   Dispatch all 20 cached recipes immediately — SwipeDeck opens instantly.
 *
 * Scenario B — no seed cache (first run):
 *   1. Fetch SEED_COUNT random meals from TheMealDB in parallel.
 *   2. Translate each with GPT-4o-mini progressively — first card appears in ~3s.
 *   3. Save all translated recipes to seed cache for next sessions.
 *
 * After user swipes through to ≤3 remaining, SwipeDeck dispatches loadMoreWebDishes.
 */
export const generateAIRandomDishes = () => async (dispatch: (action: unknown) => void) => {
  dispatch(startAIRandom())

  const cached = loadSeedFromCache()

  if (cached.length > 0) {
    // ── Scenario A: serve all cached recipes instantly ──────────────────────
    dispatch(setLoadingStep('photos'))
    cached.forEach((recipe, i) => {
      dispatch(addAIDish({ recipe, index: i }))
    })
    dispatch(finishAIRandom(null))
  } else {
    // ── Scenario B: first run — fetch progressively from TheMealDB + GPT ───
    let successful: AIRecipe[] = []
    try {
      dispatch(setLoadingMore(true))
      successful = await fetchRecipesProgressively(SEED_COUNT, (recipe, i) => {
        dispatch(addAIDish({ recipe, index: i }))
      })
    } catch (e) {
      dispatch(finishAIRandom(e instanceof Error ? e.message : 'Ошибка загрузки рецептов'))
      return
    }

    if (successful.length > 0) {
      saveSeedToCache(successful)
    }

    dispatch(finishAIRandom(
      successful.length === 0 ? 'Не удалось загрузить рецепты. Проверьте интернет-соединение.' : null
    ))
  }
}

// ─── Load-more thunk: called by SwipeDeck when nearing the end ────────────────

/**
 * Fetches 5 more recipes from TheMealDB and appends them to the current deck.
 * Uses the current dish count as the ID offset so IDs don't collide.
 * Called automatically when the user has ≤3 cards remaining.
 */
export const loadMoreWebDishes = () => async (
  dispatch: (action: unknown) => void,
  getState: () => { dishes: DishesState }
) => {
  const currentCount = getState().dishes.dishes.length
  dispatch(setLoadingMore(true))

  try {
    const recipes = await fetchRecipesFromWeb(5)
    await generatePhotosForRecipes(recipes, dispatch, currentCount)
  } catch {
    // Silently fail — user still has existing cards to swipe
  }

  dispatch(setLoadingMore(false))
}
