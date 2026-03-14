import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface FiltersState {
  vegetarianOnly: boolean
  veganOnly: boolean
  allowMissing: boolean
  budgetEnabled: boolean
  budgetLimit: number | null
  cuisine: string | null
  caloriesMax: number | null
  proteinMax: number | null
  fatMax: number | null
  carbsMax: number | null
}

const initialState: FiltersState = {
  vegetarianOnly: false,
  veganOnly: false,
  allowMissing: false,
  budgetEnabled: false,
  budgetLimit: null,
  cuisine: null,
  caloriesMax: null,
  proteinMax: null,
  fatMax: null,
  carbsMax: null,
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
    setCaloriesMax: (state, action: PayloadAction<number | null>) => {
      state.caloriesMax = action.payload
    },
    setProteinMax: (state, action: PayloadAction<number | null>) => {
      state.proteinMax = action.payload
    },
    setFatMax: (state, action: PayloadAction<number | null>) => {
      state.fatMax = action.payload
    },
    setCarbsMax: (state, action: PayloadAction<number | null>) => {
      state.carbsMax = action.payload
    },
  },
})

export const { toggleVegetarian, toggleVegan, toggleAllowMissing, toggleBudget, setBudgetLimit, setCuisine, setCaloriesMax, setProteinMax, setFatMax, setCarbsMax } =
  filtersSlice.actions
export default filtersSlice.reducer
