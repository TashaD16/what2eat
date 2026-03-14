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
  async ({ base64, mimeType, ingredientNames, lang }: { base64: string; mimeType: string; ingredientNames: string[]; lang?: 'ru' | 'en' }) => {
    return await detectIngredientsFromImage(base64, mimeType, ingredientNames, lang ?? 'ru')
  }
)

export const analyzeCalories = createAsyncThunk(
  'photo/analyzeCalories',
  async ({ base64, mimeType, lang }: { base64: string; mimeType: string; lang?: 'ru' | 'en' }) => {
    return await estimateCaloriesFromImage(base64, mimeType, lang ?? 'ru')
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
    setError: (state, action: { payload: string }) => {
      state.status = 'error'
      state.error = action.payload
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
        state.error = action.error.message || 'Photo analysis error'
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
        state.error = action.error.message || 'Calorie estimation error'
      })
  },
})

export const { clearPhoto, setError } = photoSlice.actions
export default photoSlice.reducer
