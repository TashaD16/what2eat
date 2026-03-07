import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'

type WeeklyPlan = Record<DayOfWeek, number | null>

interface WeeklyPlannerState {
  plan: WeeklyPlan
}

const STORAGE_KEY = 'what2eat_weekly_plan'

function loadFromStorage(): WeeklyPlan {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as WeeklyPlan
  } catch {
    // ignore
  }
  return { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null }
}

const weeklyPlannerSlice = createSlice({
  name: 'weeklyPlanner',
  initialState: (): WeeklyPlannerState => ({ plan: loadFromStorage() }),
  reducers: {
    assignDishToDay: (state, action: PayloadAction<{ day: DayOfWeek; dishId: number }>) => {
      state.plan[action.payload.day] = action.payload.dishId
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.plan))
    },
    removeDishFromDay: (state, action: PayloadAction<DayOfWeek>) => {
      state.plan[action.payload] = null
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.plan))
    },
  },
})

export const { assignDishToDay, removeDishFromDay } = weeklyPlannerSlice.actions
export default weeklyPlannerSlice.reducer
