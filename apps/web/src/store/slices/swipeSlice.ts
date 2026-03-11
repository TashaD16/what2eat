import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { addFavoriteLocalDish, removeFavoriteLocalDish, getUserFavoriteDishIds, migrateLocalFavoritesToSupabase } from '../../services/favorites'

const STORAGE_KEY_LIKED = 'w2e_liked_dish_ids'
const STORAGE_KEY_DISLIKED = 'w2e_disliked_dish_ids'

function loadLikedIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LIKED)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function saveLikedIds(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY_LIKED, JSON.stringify(ids))
  } catch {
    // localStorage unavailable — ignore
  }
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
  try {
    localStorage.setItem(STORAGE_KEY_DISLIKED, JSON.stringify(ids))
  } catch {
    // localStorage unavailable — ignore
  }
}

interface SwipeState {
  likedDishIds: number[]
  dislikedDishIds: number[]
  currentIndex: number
  sessionComplete: boolean
}

const initialState: SwipeState = {
  likedDishIds: loadLikedIds(),
  dislikedDishIds: loadDislikedIds(),
  currentIndex: 0,
  sessionComplete: false,
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

const swipeSlice = createSlice({
  name: 'swipe',
  initialState,
  reducers: {
    swipeDish: (state, action: PayloadAction<{ dishId: number; direction: 'left' | 'right'; userId?: string }>) => {
      const { dishId, direction, userId } = action.payload
      if (direction === 'right') {
        if (!state.likedDishIds.includes(dishId)) {
          state.likedDishIds.push(dishId)
          saveLikedIds(state.likedDishIds)
          if (userId) addFavoriteLocalDish(userId, dishId)
        }
      } else {
        if (!state.dislikedDishIds.includes(dishId)) {
          state.dislikedDishIds.push(dishId)
          saveDislikedIds(state.dislikedDishIds)
        }
        // Remove from favorites if previously liked
        if (state.likedDishIds.includes(dishId)) {
          state.likedDishIds = state.likedDishIds.filter((id) => id !== dishId)
          saveLikedIds(state.likedDishIds)
          if (userId) removeFavoriteLocalDish(userId, dishId)
        }
      }
      state.currentIndex += 1
    },
    /** Add a dish to favorites without advancing the swipe index. Used from recipe views. */
    likeDish: (state, action: PayloadAction<{ dishId: number; userId?: string }>) => {
      const { dishId, userId } = action.payload
      if (!state.likedDishIds.includes(dishId)) {
        state.likedDishIds.push(dishId)
        saveLikedIds(state.likedDishIds)
        if (userId) addFavoriteLocalDish(userId, dishId)
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
      if (state.likedDishIds.includes(dishId)) {
        state.likedDishIds = state.likedDishIds.filter((id) => id !== dishId)
        saveLikedIds(state.likedDishIds)
        if (userId) removeFavoriteLocalDish(userId, dishId)
      }
    },
    unlikeDish: (state, action: PayloadAction<{ dishId: number; userId?: string }>) => {
      const { dishId, userId } = action.payload
      state.likedDishIds = state.likedDishIds.filter((id) => id !== dishId)
      saveLikedIds(state.likedDishIds)
      if (userId) removeFavoriteLocalDish(userId, dishId)
    },
    markSessionComplete: (state) => {
      state.sessionComplete = true
    },
    resetSwipe: (state) => {
      state.likedDishIds = []
      state.dislikedDishIds = []
      state.currentIndex = 0
      state.sessionComplete = false
      saveLikedIds([])
      saveDislikedIds([])
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncFavoritesFromSupabase.fulfilled, (state, action) => {
        // Merge Supabase favorites with local, deduplicate
        const merged = Array.from(new Set([...state.likedDishIds, ...action.payload]))
        state.likedDishIds = merged
        saveLikedIds(merged)
      })
  },
})

export const { swipeDish, likeDish, unlikeDish, dislikeDish, markSessionComplete, resetSwipe } = swipeSlice.actions
export default swipeSlice.reducer
