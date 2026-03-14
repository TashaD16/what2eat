import { configureStore } from '@reduxjs/toolkit'
import ingredientsReducer from './slices/ingredientsSlice'
import dishesReducer from './slices/dishesSlice'
import recipeReducer from './slices/recipeSlice'
import filtersReducer from './slices/filtersSlice'
import swipeReducer from './slices/swipeSlice'
import weeklyPlannerReducer from './slices/weeklyPlannerSlice'
import photoReducer from './slices/photoSlice'
import authReducer from './slices/authSlice'
import aiRecipeReducer from './slices/aiRecipeSlice'
import langReducer from './slices/langSlice'
import userProfileReducer from './slices/userProfileSlice'

export const store = configureStore({
  reducer: {
    ingredients: ingredientsReducer,
    dishes: dishesReducer,
    recipe: recipeReducer,
    filters: filtersReducer,
    swipe: swipeReducer,
    weeklyPlanner: weeklyPlannerReducer,
    photo: photoReducer,
    auth: authReducer,
    aiRecipe: aiRecipeReducer,
    lang: langReducer,
    userProfile: userProfileReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

