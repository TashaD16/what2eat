import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { generateRecipeByIngredients, saveAIRecipe, AIRecipe } from '../../services/aiRecipes'
import { loadAIRecipesFromCache, saveAIRecipesToCache } from '../../services/aiRecipesCache'

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
  async (
    { ingredientNames, cuisine }: { ingredientNames: string[]; cuisine?: string | null },
    { rejectWithValue }
  ) => {
    try {
      return await generateRecipeByIngredients(ingredientNames, cuisine)
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
    setGeneratedRecipe: (state, action: PayloadAction<AIRecipe>) => {
      state.generatedRecipe = action.payload
      state.error = null
      state.loading = false
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
        // Add this recipe to the randomizer cache so it's available next time
        const existing = loadAIRecipesFromCache()
        const alreadyCached = existing.some((r) => r.name === action.payload.name)
        if (!alreadyCached) {
          saveAIRecipesToCache([...existing, action.payload].slice(-5))
        }
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

export const { clearAIRecipe, setGeneratedRecipe } = aiRecipeSlice.actions
export default aiRecipeSlice.reducer
