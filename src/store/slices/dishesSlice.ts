import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Dish } from '../../types'
import * as dishesService from '../../services/dishes'
import { FindDishesOptions } from '../../services/dishes'
import { suggestDishesByIngredients, fetchPopularDishes, PopularDishSuggestion } from '../../services/openai'
import { generateRandomAIDishes, AIRecipe } from '../../services/aiRecipes'

interface DishesState {
  dishes: Dish[]
  aiDishRecipes: Record<number, AIRecipe>
  suggestedDishNames: string[]
  popularSuggestions: PopularDishSuggestion[]
  loading: boolean
  error: string | null
}

const initialState: DishesState = {
  dishes: [],
  aiDishRecipes: {},
  suggestedDishNames: [],
  popularSuggestions: [],
  loading: false,
  error: null,
}

export const findDishes = createAsyncThunk(
  'dishes/findByIngredients',
  async ({ ingredientIds, options }: { ingredientIds: number[]; options?: FindDishesOptions }) => {
    return await dishesService.findDishesByIngredients(ingredientIds, options)
  }
)

export const randomizeMeatDishes = createAsyncThunk(
  'dishes/randomizeMeat',
  async () => {
    const allDishes = await dishesService.getAllDishes()
    return dishesService.randomizeDishes(allDishes)
  }
)

export const generateAIRandomDishes = createAsyncThunk(
  'dishes/generateAIRandom',
  async () => {
    return await generateRandomAIDishes(5)
  }
)

export const fetchPopularDishSuggestions = createAsyncThunk(
  'dishes/fetchPopular',
  async () => {
    return await fetchPopularDishes()
  }
)

export const fetchSuggestedDishes = createAsyncThunk(
  'dishes/suggestByAi',
  async (ingredientNames: string[]) => {
    return await suggestDishesByIngredients(ingredientNames)
  }
)

const dishesSlice = createSlice({
  name: 'dishes',
  initialState,
  reducers: {
    clearDishes: (state) => {
      state.dishes = []
      state.aiDishRecipes = {}
      state.suggestedDishNames = []
      state.popularSuggestions = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(findDishes.pending, (state) => {
        state.loading = true
        state.error = null
        state.suggestedDishNames = []
        state.aiDishRecipes = {}
      })
      .addCase(findDishes.fulfilled, (state, action) => {
        state.loading = false
        state.dishes = action.payload
      })
      .addCase(findDishes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to find dishes'
      })
      .addCase(randomizeMeatDishes.pending, (state) => {
        state.loading = true
        state.error = null
        state.aiDishRecipes = {}
      })
      .addCase(randomizeMeatDishes.fulfilled, (state, action) => {
        state.loading = false
        state.dishes = action.payload
      })
      .addCase(randomizeMeatDishes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to randomize dishes'
      })
      .addCase(generateAIRandomDishes.pending, (state) => {
        state.loading = true
        state.error = null
        state.dishes = []
        state.aiDishRecipes = {}
      })
      .addCase(generateAIRandomDishes.fulfilled, (state, action) => {
        state.loading = false
        const mapped: Dish[] = []
        const recipeMap: Record<number, AIRecipe> = {}
        action.payload.forEach((recipe, index) => {
          const id = -(index + 1)
          mapped.push({
            id,
            name: recipe.name,
            description: recipe.description,
            image_url: recipe.image_url ?? null,
            cooking_time: recipe.cooking_time,
            difficulty: recipe.difficulty,
            servings: 2,
            estimated_cost: null,
            is_vegetarian: false,
            is_vegan: false,
          })
          recipeMap[id] = recipe
        })
        state.dishes = mapped
        state.aiDishRecipes = recipeMap
      })
      .addCase(generateAIRandomDishes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Не удалось получить рецепты из интернета'
      })
      .addCase(fetchSuggestedDishes.fulfilled, (state, action) => {
        state.suggestedDishNames = action.payload
      })
      .addCase(fetchSuggestedDishes.rejected, (state) => {
        state.suggestedDishNames = []
      })
      .addCase(fetchPopularDishSuggestions.pending, (state) => {
        state.popularSuggestions = []
      })
      .addCase(fetchPopularDishSuggestions.fulfilled, (state, action) => {
        state.popularSuggestions = action.payload
      })
      .addCase(fetchPopularDishSuggestions.rejected, (state) => {
        state.popularSuggestions = []
      })
  },
})

export const { clearDishes } = dishesSlice.actions
export type { PopularDishSuggestion }
export default dishesSlice.reducer
