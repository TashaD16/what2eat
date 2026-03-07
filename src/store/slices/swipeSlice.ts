import { createSlice, PayloadAction } from '@reduxjs/toolkit'

const STORAGE_KEY = 'w2e_liked_dish_ids'

function loadLikedIds(): number[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

function saveLikedIds(ids: number[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
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
  dislikedDishIds: [],
  currentIndex: 0,
  sessionComplete: false,
}

const swipeSlice = createSlice({
  name: 'swipe',
  initialState,
  reducers: {
    swipeDish: (state, action: PayloadAction<{ dishId: number; direction: 'left' | 'right' }>) => {
      const { dishId, direction } = action.payload
      if (direction === 'right') {
        if (!state.likedDishIds.includes(dishId)) {
          state.likedDishIds.push(dishId)
          saveLikedIds(state.likedDishIds)
        }
      } else {
        if (!state.dislikedDishIds.includes(dishId)) {
          state.dislikedDishIds.push(dishId)
        }
      }
      state.currentIndex += 1
    },
    unlikeDish: (state, action: PayloadAction<number>) => {
      state.likedDishIds = state.likedDishIds.filter((id) => id !== action.payload)
      saveLikedIds(state.likedDishIds)
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
    },
  },
})

export const { swipeDish, unlikeDish, markSessionComplete, resetSwipe } = swipeSlice.actions
export default swipeSlice.reducer
