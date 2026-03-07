import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Dish } from '../../types'
import * as dishesService from '../../services/dishes'
import { FindDishesOptions } from '../../services/dishes'

interface DishesState {
  dishes: Dish[]
  loading: boolean
  error: string | null
}

const initialState: DishesState = {
  dishes: [],
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
    const allMeatDishes = await dishesService.getDishesWithMeat()
    return dishesService.randomizeDishes(allMeatDishes)
  }
)

const dishesSlice = createSlice({
  name: 'dishes',
  initialState,
  reducers: {
    clearDishes: (state) => {
      state.dishes = []
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(findDishes.pending, (state) => {
        state.loading = true
        state.error = null
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
      })
      .addCase(randomizeMeatDishes.fulfilled, (state, action) => {
        state.loading = false
        state.dishes = action.payload
      })
      .addCase(randomizeMeatDishes.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to randomize dishes'
      })
  },
})

export const { clearDishes } = dishesSlice.actions
export default dishesSlice.reducer

