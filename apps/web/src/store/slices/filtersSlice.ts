import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface FiltersState {
  vegetarianOnly: boolean
  veganOnly: boolean
  allowMissing: boolean
  budgetEnabled: boolean
  budgetLimit: number | null
  cuisine: string | null
}

const initialState: FiltersState = {
  vegetarianOnly: false,
  veganOnly: false,
  allowMissing: false,
  budgetEnabled: false,
  budgetLimit: null,
  cuisine: null,
}

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    toggleVegetarian: (state) => {
      state.vegetarianOnly = !state.vegetarianOnly
      if (state.vegetarianOnly) state.veganOnly = false
    },
    toggleVegan: (state) => {
      state.veganOnly = !state.veganOnly
      if (state.veganOnly) state.vegetarianOnly = false
    },
    toggleAllowMissing: (state) => {
      state.allowMissing = !state.allowMissing
    },
    toggleBudget: (state) => {
      state.budgetEnabled = !state.budgetEnabled
    },
    setBudgetLimit: (state, action) => {
      state.budgetLimit = action.payload
    },
    setCuisine: (state, action: PayloadAction<string | null>) => {
      state.cuisine = action.payload
    },
  },
})

export const { toggleVegetarian, toggleVegan, toggleAllowMissing, toggleBudget, setBudgetLimit, setCuisine } =
  filtersSlice.actions
export default filtersSlice.reducer
