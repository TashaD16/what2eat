import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface SwipeState {
  likedDishIds: number[]
  dislikedDishIds: number[]
  currentIndex: number
  sessionComplete: boolean
}

const initialState: SwipeState = {
  likedDishIds: [],
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
        }
      } else {
        if (!state.dislikedDishIds.includes(dishId)) {
          state.dislikedDishIds.push(dishId)
        }
      }
      state.currentIndex += 1
    },
    markSessionComplete: (state) => {
      state.sessionComplete = true
    },
    resetSwipe: (state) => {
      state.likedDishIds = []
      state.dislikedDishIds = []
      state.currentIndex = 0
      state.sessionComplete = false
    },
  },
})

export const { swipeDish, markSessionComplete, resetSwipe } = swipeSlice.actions
export default swipeSlice.reducer
