import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { generateRecipeByIngredients, saveAIRecipe, AIRecipe } from '../../services/aiRecipes'

interface AIRecipeState {
  generatedRecipe: AIRecipe | null
  loading: boolean
  error: string | null
}

const initialState: AIRecipeState = {
  generatedRecipe: null,
  loading: false,
  error: null,
}

export const generateAIRecipe = createAsyncThunk(
  'aiRecipe/generate',
  async (ingredientNames: string[], { rejectWithValue }) => {
    try {
      return await generateRecipeByIngredients(ingredientNames)
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Ошибка генерации рецепта')
    }
  }
)

export const saveGeneratedRecipe = createAsyncThunk(
  'aiRecipe/save',
  async ({ userId, recipe }: { userId: string; recipe: AIRecipe }, { rejectWithValue }) => {
    try {
      const id = await saveAIRecipe(userId, recipe)
      return id
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Ошибка сохранения рецепта')
    }
  }
)

const aiRecipeSlice = createSlice({
  name: 'aiRecipe',
  initialState,
  reducers: {
    clearAIRecipe: (state) => {
      state.generatedRecipe = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generateAIRecipe.pending, (state) => {
        state.loading = true
        state.error = null
        state.generatedRecipe = null
      })
      .addCase(generateAIRecipe.fulfilled, (state, action) => {
        state.loading = false
        state.generatedRecipe = action.payload
      })
      .addCase(generateAIRecipe.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(saveGeneratedRecipe.fulfilled, (state, action) => {
        if (state.generatedRecipe && action.payload) {
          state.generatedRecipe.id = action.payload
        }
      })
  },
})

export const { clearAIRecipe } = aiRecipeSlice.actions
export default aiRecipeSlice.reducer
