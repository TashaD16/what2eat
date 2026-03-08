import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Dish } from '../../types'
import * as dishesService from '../../services/dishes'
import { FindDishesOptions } from '../../services/dishes'
import { suggestDishesByIngredients, fetchPopularDishes, PopularDishSuggestion } from '../../services/openai'
import { fetchRecipesFromWeb, generateDishPhoto, AIRecipe } from '../../services/aiRecipes'

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
 * Progressive AI randomizer:
 * 1. Web search for all FREE_TIER_LIMIT recipes (one call)
 * 2. DALL-E photos generated in parallel — each ready dish appears immediately
 * 3. SwipeDeck opens after the very first dish is ready
 */
export const generateAIRandomDishes = () => async (dispatch: (action: unknown) => void) => {
  dispatch(startAIRandom())

  let recipes: AIRecipe[]
  try {
    recipes = await fetchRecipesFromWeb(FREE_TIER_LIMIT)
  } catch (e) {
    dispatch(finishAIRandom(e instanceof Error ? e.message : 'Ошибка поиска рецептов в интернете'))
    return
  }

  // Switch loading message from "searching" to "creating photos"
  dispatch(setLoadingStep('photos'))
  dispatch(setLoadingMore(true))

  let successCount = 0
  await Promise.allSettled(
    recipes.map(async (recipe, index) => {
      try {
        recipe.image_url = await generateDishPhoto(recipe.name)
        dispatch(addAIDish({ recipe, index }))
        successCount++
      } catch {
        // Skip dish if DALL-E fails — never show without photo
      }
    })
  )

  dispatch(
    finishAIRandom(successCount === 0 ? 'Не удалось создать фото ни для одного блюда' : null)
  )
}
