import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Dish } from '../../types'
import * as dishesService from '../../services/dishes'
import { FindDishesOptions } from '../../services/dishes'
import { suggestDishesByIngredients, fetchPopularDishes, PopularDishSuggestion } from '../../services/openai'
import { fetchRecipesFromWeb, generateDishPhoto, AIRecipe } from '../../services/aiRecipes'
import { loadAIRecipesFromCache, saveAIRecipesToCache, isCacheStale } from '../../services/aiRecipesCache'

// Max dishes shown to free users in both randomizer and ingredient search
export const FREE_TIER_LIMIT = 5

export type LoadingStep = 'search' | 'photos' | null

interface DishesState {
  dishes: Dish[]
  aiDishRecipes: Record<number, AIRecipe>
  loadingStep: LoadingStep    // which phase of AI loading we're in
  loadingMore: boolean        // background photo loading after first dish appears
  suggestedDishNames: string[]
  popularSuggestions: PopularDishSuggestion[]
  loading: boolean
  error: string | null
}

const initialState: DishesState = {
  dishes: [],
  aiDishRecipes: {},
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
      state.loadingStep = 'search'
      state.loadingMore = false
    },

    // Called when web search finishes and DALL-E starts
    setLoadingStep: (state, action: PayloadAction<LoadingStep>) => {
      state.loadingStep = action.payload
    },

    // Called as each dish+photo becomes ready — shows SwipeDeck after the first one
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

    // Called when all photos are done (or failed)
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

// ─── Progressive AI randomizer thunk (defined after slice so it can use actions) ──

/**
 * Generates photos for a list of recipe texts (from cache or internet).
 * Dispatches addAIDish as each photo completes.
 * Returns the count of successfully loaded dishes.
 */
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
        clone.image_url = await generateDishPhoto(clone.name)
        dispatch(addAIDish({ recipe: clone, index: indexOffset + i }))
        successCount++
        successful.push(clone)
      } catch {
        // Skip dish if DALL-E fails — never show without photo
      }
    })
  )

  return { successCount, successful }
}

/**
 * Progressive AI randomizer with localStorage cache:
 *
 * Scenario A — cache exists and fresh:
 *   1. Immediately generate DALL-E photos for cached recipe texts (no web search)
 *   2. SwipeDeck opens after first photo is ready (~5-8s)
 *
 * Scenario B — cache empty or stale:
 *   1. Web search for FREE_TIER_LIMIT recipes
 *   2. Generate DALL-E photos progressively
 *   3. Save recipe texts to cache for next session
 *
 * Scenario C — cache stale (>3 days):
 *   Same as A, but also refresh cache in background after dishes are shown.
 */
export const generateAIRandomDishes = () => async (dispatch: (action: unknown) => void) => {
  dispatch(startAIRandom())

  const cached = loadAIRecipesFromCache()
  const stale = isCacheStale()

  if (cached.length > 0) {
    // ── Scenario A / C: serve from cache ──────────────────────────────────────
    dispatch(setLoadingStep('photos'))
    dispatch(setLoadingMore(false))

    const { successCount } = await generatePhotosForRecipes(cached, dispatch)

    dispatch(finishAIRandom(successCount === 0 ? 'Не удалось создать фото. Проверьте интернет-соединение.' : null))

    // If cache is stale, silently refresh in background (don't show loading)
    if (stale) {
      fetchRecipesFromWeb(FREE_TIER_LIMIT)
        .then((fresh) => {
          saveAIRecipesToCache(fresh)
        })
        .catch(() => {/* ignore background refresh errors */})
    }
  } else {
    // ── Scenario B: no cache — fetch from internet ────────────────────────────
    let recipes: AIRecipe[]
    try {
      dispatch(setLoadingStep('search'))
      recipes = await fetchRecipesFromWeb(FREE_TIER_LIMIT)
    } catch (e) {
      dispatch(finishAIRandom(e instanceof Error ? e.message : 'Ошибка поиска рецептов в интернете'))
      return
    }

    dispatch(setLoadingStep('photos'))
    dispatch(setLoadingMore(true))

    const { successCount, successful } = await generatePhotosForRecipes(recipes, dispatch)

    // Save recipe texts to cache for next sessions
    if (successful.length > 0) {
      saveAIRecipesToCache(successful)
    }

    dispatch(finishAIRandom(successCount === 0 ? 'Не удалось создать фото ни для одного блюда' : null))
  }
}
