import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import {
  addFavoriteLocalDish,
  removeFavoriteLocalDish,
  getUserFavoriteDishIds,
  migrateLocalFavoritesToSupabase,
  addFavoriteGlobalRecipe,
  removeFavoriteGlobalRecipe,
  getUserFavoriteGlobalRecipeIds,
} from '../../services/favorites'
import { getGlobalRecipesInLanguage } from '../../services/globalRecipes'
import { Difficulty } from '@what2eat/types'

const STORAGE_KEY_LIKED = 'w2e_liked_dish_ids'
const STORAGE_KEY_DISLIKED = 'w2e_disliked_dish_ids'
const STORAGE_KEY_LIKED_DISHES = 'w2e_liked_dishes'

/** Full dish data stored per liked item — persists across sessions */
export interface StoredDish {
  id: number
  recipeId?: string  // UUID from global_recipes (for Supabase sync)
  mealdb_id?: string // TheMealDB idMeal — used for cross-language lookup
  name: string
  description: string | null
  image_url: string | null
  cooking_time: number
  difficulty: Difficulty
  servings: number
  estimated_cost: number | null
  is_vegetarian: boolean
  is_vegan: boolean
}

function loadLikedIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIKED)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function saveLikedIds(ids: number[]) {
  try { localStorage.setItem(STORAGE_KEY_LIKED, JSON.stringify(ids)) } catch { /* ignore */ }
}

function loadDislikedIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISLIKED)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function saveDislikedIds(ids: number[]) {
  try { localStorage.setItem(STORAGE_KEY_DISLIKED, JSON.stringify(ids)) } catch { /* ignore */ }
}

function loadLikedDishes(): StoredDish[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIKED_DISHES)
    return raw ? (JSON.parse(raw) as StoredDish[]) : []
  } catch {
    return []
  }
}

function saveLikedDishes(dishes: StoredDish[]) {
  try { localStorage.setItem(STORAGE_KEY_LIKED_DISHES, JSON.stringify(dishes)) } catch { /* ignore */ }
}

interface SwipeState {
  likedDishIds: number[]
  dislikedDishIds: number[]
  currentIndex: number
  sessionComplete: boolean
  likedDishes: StoredDish[]  // full data, persisted in localStorage + Supabase
}

const initialState: SwipeState = {
  likedDishIds: loadLikedIds(),
  dislikedDishIds: loadDislikedIds(),
  currentIndex: 0,
  sessionComplete: false,
  likedDishes: loadLikedDishes(),
}

// Sync favorites from Supabase after login
export const syncFavoritesFromSupabase = createAsyncThunk(
  'swipe/syncFromSupabase',
  async (userId: string) => {
    const ids = await getUserFavoriteDishIds(userId)
    return ids
  }
)

// Migrate localStorage favorites to Supabase after first login
export const migrateLocalFavorites = createAsyncThunk(
  'swipe/migrateLocal',
  async ({ userId, localIds }: { userId: string; localIds: number[] }) => {
    await migrateLocalFavoritesToSupabase(userId, localIds)
    return localIds
  }
)

// Load full dish data for favorites from Supabase (by UUID), in the given language
export const loadFavoritesFromSupabase = createAsyncThunk(
  'swipe/loadFavorites',
  async (
    { userId, lang = 'ru' }: { userId: string; lang?: 'ru' | 'en' },
    { dispatch }
  ): Promise<StoredDish[]> => {
    const recipeIds = await getUserFavoriteGlobalRecipeIds(userId)
    if (recipeIds.length === 0) return []
    const { recipes, whenTranslationsSaved } = await getGlobalRecipesInLanguage(recipeIds, lang)
    whenTranslationsSaved.then(() => dispatch(reloadLikedDishesInLanguage(lang)))
    return recipes.map((recipe, i): StoredDish => ({
      id: -(10000 + i),
      recipeId: recipe.id,
      mealdb_id: recipe.mealdb_id,
      name: recipe.name,
      description: recipe.description ?? null,
      image_url: recipe.image_url ?? null,
      cooking_time: recipe.cooking_time,
      difficulty: recipe.difficulty,
      servings: 2,
      estimated_cost: null,
      is_vegetarian: false,
      is_vegan: false,
    }))
  }
)

/** Reload liked dishes in the selected language (from current likedDishes with recipeIds). Missing translations are translated and saved in background; then list is re-fetched. */
export const reloadLikedDishesInLanguage = createAsyncThunk(
  'swipe/reloadLikedInLanguage',
  async (lang: 'ru' | 'en', { getState, dispatch }) => {
    const state = getState() as { swipe: { likedDishes: StoredDish[] } }
    const likedDishes = state.swipe.likedDishes
    const withRecipeId = likedDishes.filter((d): d is StoredDish & { recipeId: string } => Boolean(d.recipeId))
    if (withRecipeId.length === 0) return { lang, updated: likedDishes }
    const recipeIds = withRecipeId.map((d) => d.recipeId)
    const { recipes, whenTranslationsSaved } = await getGlobalRecipesInLanguage(recipeIds, lang)
    whenTranslationsSaved.then(() => dispatch(reloadLikedDishesInLanguage(lang)))
    const recipeByIndex = new Map<string, import('../../services/globalRecipes').GetGlobalRecipesInLanguageResult['recipes'][number]>()
    withRecipeId.forEach((d, i) => {
      if (recipes[i]) recipeByIndex.set(d.recipeId, recipes[i])
    })
    const updated: StoredDish[] = likedDishes.map((d) => {
      if (!d.recipeId) return d
      const recipe = recipeByIndex.get(d.recipeId)
      if (!recipe) return d
      return {
        ...d,
        recipeId: recipe.id,
        mealdb_id: recipe.mealdb_id,
        name: recipe.name,
        description: recipe.description ?? null,
        image_url: recipe.image_url ?? null,
        cooking_time: recipe.cooking_time,
        difficulty: recipe.difficulty,
      }
    })
    return { lang, updated }
  }
)

const swipeSlice = createSlice({
  name: 'swipe',
  initialState,
  reducers: {
    swipeDish: (
      state,
      action: PayloadAction<{
        dishId: number
        direction: 'left' | 'right'
        userId?: string
        dish?: StoredDish
      }>
    ) => {
      const { dishId, direction, userId, dish } = action.payload
      if (direction === 'right') {
        const alreadyLiked =
          state.likedDishIds.includes(dishId) ||
          (dish?.recipeId != null && state.likedDishes.some((d) => d.recipeId === dish.recipeId))
        if (!alreadyLiked) {
          state.likedDishIds.push(dishId)
          saveLikedIds(state.likedDishIds)
          if (dish) {
            state.likedDishes.push(dish)
            saveLikedDishes(state.likedDishes)
          }
          if (userId) addFavoriteLocalDish(userId, dishId)
          if (userId && dish?.recipeId) addFavoriteGlobalRecipe(userId, dish.recipeId)
        }
      } else {
        if (!state.dislikedDishIds.includes(dishId)) {
          state.dislikedDishIds.push(dishId)
          saveDislikedIds(state.dislikedDishIds)
        }
        // Remove from favorites if previously liked
        const existingLiked = state.likedDishes.find((d) => d.id === dishId)
        if (state.likedDishIds.includes(dishId) || existingLiked) {
          state.likedDishIds = state.likedDishIds.filter((id) => id !== dishId)
          saveLikedIds(state.likedDishIds)
          state.likedDishes = state.likedDishes.filter((d) => d.id !== dishId)
          saveLikedDishes(state.likedDishes)
          if (userId) removeFavoriteLocalDish(userId, dishId)
          if (userId && existingLiked?.recipeId) removeFavoriteGlobalRecipe(userId, existingLiked.recipeId)
        }
      }
      state.currentIndex += 1
    },

    /** Add a dish to favorites without advancing the swipe index. Used from recipe views. */
    likeDish: (state, action: PayloadAction<{ dishId: number; userId?: string; dish?: StoredDish }>) => {
      const { dishId, userId, dish } = action.payload
      const alreadyLiked =
        state.likedDishIds.includes(dishId) ||
        (dish?.recipeId != null && state.likedDishes.some((d) => d.recipeId === dish.recipeId))
      if (!alreadyLiked) {
        state.likedDishIds.push(dishId)
        saveLikedIds(state.likedDishIds)
        if (dish) {
          state.likedDishes.push(dish)
          saveLikedDishes(state.likedDishes)
        }
        if (userId) addFavoriteLocalDish(userId, dishId)
        if (userId && dish?.recipeId) addFavoriteGlobalRecipe(userId, dish.recipeId)
      }
      if (state.dislikedDishIds.includes(dishId)) {
        state.dislikedDishIds = state.dislikedDishIds.filter((id) => id !== dishId)
        saveDislikedIds(state.dislikedDishIds)
      }
    },

    /** Mark dish as disliked (from recipe views). */
    dislikeDish: (state, action: PayloadAction<{ dishId: number; userId?: string }>) => {
      const { dishId, userId } = action.payload
      if (!state.dislikedDishIds.includes(dishId)) {
        state.dislikedDishIds.push(dishId)
        saveDislikedIds(state.dislikedDishIds)
      }
      const existingLiked = state.likedDishes.find((d) => d.id === dishId)
      if (state.likedDishIds.includes(dishId) || existingLiked) {
        state.likedDishIds = state.likedDishIds.filter((id) => id !== dishId)
        saveLikedIds(state.likedDishIds)
        state.likedDishes = state.likedDishes.filter((d) => d.id !== dishId)
        saveLikedDishes(state.likedDishes)
        if (userId) removeFavoriteLocalDish(userId, dishId)
        if (userId && existingLiked?.recipeId) removeFavoriteGlobalRecipe(userId, existingLiked.recipeId)
      }
    },

    unlikeDish: (state, action: PayloadAction<{ dishId: number; userId?: string }>) => {
      const { dishId, userId } = action.payload
      const existing = state.likedDishes.find((d) => d.id === dishId)
      state.likedDishIds = state.likedDishIds.filter((id) => id !== dishId)
      saveLikedIds(state.likedDishIds)
      state.likedDishes = state.likedDishes.filter((d) => d.id !== dishId)
      saveLikedDishes(state.likedDishes)
      if (userId) removeFavoriteLocalDish(userId, dishId)
      if (userId && existing?.recipeId) removeFavoriteGlobalRecipe(userId, existing.recipeId)
    },

    markSessionComplete: (state) => {
      state.sessionComplete = true
    },

    /** Reset swipe session — favorites (likedDishes) are intentionally preserved */
    resetSwipe: (state) => {
      state.likedDishIds = []
      state.dislikedDishIds = []
      state.currentIndex = 0
      state.sessionComplete = false
      saveLikedIds([])
      saveDislikedIds([])
      // NOTE: likedDishes is NOT cleared — favorites persist across sessions
    },

    setLikedDishes: (state, action: PayloadAction<StoredDish[]>) => {
      state.likedDishes = action.payload
      saveLikedDishes(state.likedDishes)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncFavoritesFromSupabase.fulfilled, (state, action) => {
        const merged = Array.from(new Set([...state.likedDishIds, ...action.payload]))
        state.likedDishIds = merged
        saveLikedIds(merged)
      })
      .addCase(loadFavoritesFromSupabase.fulfilled, (state, action) => {
        const existingRecipeIds = new Set(state.likedDishes.map((d) => d.recipeId).filter(Boolean))
        const newDishes = action.payload.filter(
          (d) => !d.recipeId || !existingRecipeIds.has(d.recipeId)
        )
        if (newDishes.length > 0) {
          state.likedDishes = [...state.likedDishes, ...newDishes]
          saveLikedDishes(state.likedDishes)
        }
      })
      .addCase(reloadLikedDishesInLanguage.fulfilled, (state, action) => {
        state.likedDishes = action.payload.updated
        saveLikedDishes(state.likedDishes)
      })
  },
})

export const { swipeDish, likeDish, unlikeDish, dislikeDish, markSessionComplete, resetSwipe, setLikedDishes } = swipeSlice.actions
export default swipeSlice.reducer
