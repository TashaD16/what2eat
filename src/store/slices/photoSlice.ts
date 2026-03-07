import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { detectIngredientsFromImage, estimateCaloriesFromImage, CalorieEstimate } from '../../services/openai'

interface PhotoState {
  status: 'idle' | 'analyzing' | 'done' | 'error'
  detectedIngredientNames: string[]
  calorieEstimate: CalorieEstimate | null
  error: string | null
}

const initialState: PhotoState = {
  status: 'idle',
  detectedIngredientNames: [],
  calorieEstimate: null,
  error: null,
}

export const analyzeIngredients = createAsyncThunk(
  'photo/analyzeIngredients',
  async ({ base64, mimeType, ingredientNames }: { base64: string; mimeType: string; ingredientNames: string[] }) => {
    return await detectIngredientsFromImage(base64, mimeType, ingredientNames)
  }
)

export const analyzeCalories = createAsyncThunk(
  'photo/analyzeCalories',
  async ({ base64, mimeType }: { base64: string; mimeType: string }) => {
    return await estimateCaloriesFromImage(base64, mimeType)
  }
)

const photoSlice = createSlice({
  name: 'photo',
  initialState,
  reducers: {
    clearPhoto: (state) => {
      state.status = 'idle'
      state.detectedIngredientNames = []
      state.calorieEstimate = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(analyzeIngredients.pending, (state) => {
        state.status = 'analyzing'
        state.error = null
      })
      .addCase(analyzeIngredients.fulfilled, (state, action) => {
        state.status = 'done'
        state.detectedIngredientNames = action.payload
      })
      .addCase(analyzeIngredients.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.error.message || 'Ошибка анализа фото'
      })
      .addCase(analyzeCalories.pending, (state) => {
        state.status = 'analyzing'
        state.error = null
        state.calorieEstimate = null
      })
      .addCase(analyzeCalories.fulfilled, (state, action) => {
        state.status = 'done'
        state.calorieEstimate = action.payload
      })
      .addCase(analyzeCalories.rejected, (state, action) => {
        state.status = 'error'
        state.error = action.error.message || 'Ошибка подсчёта калорий'
      })
  },
})

export const { clearPhoto } = photoSlice.actions
export default photoSlice.reducer
