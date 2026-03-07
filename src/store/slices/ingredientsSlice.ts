import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Ingredient } from '../../types'
import * as ingredientsService from '../../services/ingredients'

interface IngredientsState {
  ingredients: Ingredient[]
  selectedIngredients: number[]
  loading: boolean
  error: string | null
}

const initialState: IngredientsState = {
  ingredients: [],
  selectedIngredients: [],
  loading: false,
  error: null,
}

export const fetchIngredients = createAsyncThunk(
  'ingredients/fetchAll',
  async () => {
    return await ingredientsService.getAllIngredients()
  }
)

const ingredientsSlice = createSlice({
  name: 'ingredients',
  initialState,
  reducers: {
    toggleIngredient: (state, action: PayloadAction<number>) => {
      const id = action.payload
      const index = state.selectedIngredients.indexOf(id)
      if (index === -1) {
        state.selectedIngredients.push(id)
      } else {
        state.selectedIngredients.splice(index, 1)
      }
    },
    clearSelection: (state) => {
      state.selectedIngredients = []
    },
    setSelectedIngredients: (state, action: PayloadAction<number[]>) => {
      state.selectedIngredients = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchIngredients.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchIngredients.fulfilled, (state, action) => {
        state.loading = false
        state.ingredients = action.payload
      })
      .addCase(fetchIngredients.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch ingredients'
      })
  },
})

export const { toggleIngredient, clearSelection, setSelectedIngredients } =
  ingredientsSlice.actions
export default ingredientsSlice.reducer

