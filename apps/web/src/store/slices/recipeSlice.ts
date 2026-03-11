import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Recipe } from '@what2eat/types'
import * as recipesService from '../../services/recipes'

interface RecipeState {
  currentRecipe: Recipe | null
  loading: boolean
  error: string | null
}

const initialState: RecipeState = {
  currentRecipe: null,
  loading: false,
  error: null,
}

export const fetchRecipe = createAsyncThunk(
  'recipe/fetchByDishId',
  async (dishId: number) => {
    const recipe = await recipesService.getRecipeByDishId(dishId)
    if (!recipe) {
      throw new Error('Recipe not found')
    }
    return recipe
  }
)

const recipeSlice = createSlice({
  name: 'recipe',
  initialState,
  reducers: {
    clearRecipe: (state) => {
      state.currentRecipe = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRecipe.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchRecipe.fulfilled, (state, action) => {
        state.loading = false
        state.currentRecipe = action.payload
      })
      .addCase(fetchRecipe.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch recipe'
      })
  },
})

export const { clearRecipe } = recipeSlice.actions
export default recipeSlice.reducer

