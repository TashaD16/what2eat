import { supabase } from './supabase'

export interface UserProfileData {
  gender: 'male' | 'female'
  age: number
  height: number // cm
  weight: number // kg
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
  goal: 'loss' | 'maintenance' | 'gain'
  goalIntensity: 'light' | 'moderate'
  mealsPerDay: 3 | 4 | 5
}

export interface KBJUGoal {
  calories: number
  protein: number
  fat: number
  carbs: number
}

export interface MealDistribution {
  name: string
  pct: number
  calories: number
  protein: number
  fat: number
  carbs: number
}

export function calculateKBJU(profile: UserProfileData): KBJUGoal {
  const {
    gender, age, height, weight, activity,
    goal = 'maintenance', goalIntensity = 'light',
  } = profile

  // BMR (Mifflin-St Jeor)
  const bmr = gender === 'male'
    ? 10 * weight + 6.25 * height - 5 * age + 5
    : 10 * weight + 6.25 * height - 5 * age - 161

  // TDEE
  const activityMap: Record<UserProfileData['activity'], number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  }
  const tdee = bmr * (activityMap[activity] ?? 1.2)

  // Goal adjustment
  const adjustMap = {
    loss:        { light: -0.10, moderate: -0.20 },
    maintenance: { light:  0,    moderate:  0    },
    gain:        { light: +0.05, moderate: +0.15 },
  }
  const adj = adjustMap[goal][goalIntensity] ?? 0
  const calories = Math.round(tdee * (1 + adj))

  // Weight-based macros
  const proteinPerKg = goal === 'loss' ? 2.0 : goal === 'gain' ? 1.8 : 1.5
  const protein = Math.round(weight * proteinPerKg)
  const fat     = Math.round(weight * 0.9)
  const carbs   = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))

  return { calories, protein, fat, carbs }
}

const MEAL_DISTRIBUTIONS: Record<3 | 4 | 5, { name: string; pct: number }[]> = {
  3: [
    { name: 'breakfast', pct: 0.28 },
    { name: 'lunch',     pct: 0.40 },
    { name: 'dinner',    pct: 0.32 },
  ],
  4: [
    { name: 'breakfast', pct: 0.25 },
    { name: 'lunch',     pct: 0.35 },
    { name: 'snack',     pct: 0.15 },
    { name: 'dinner',    pct: 0.25 },
  ],
  5: [
    { name: 'breakfast', pct: 0.20 },
    { name: 'snack',     pct: 0.10 },
    { name: 'lunch',     pct: 0.35 },
    { name: 'snack2',    pct: 0.10 },
    { name: 'dinner',    pct: 0.25 },
  ],
}

export function getMealDistribution(kbju: KBJUGoal, mealsPerDay: 3 | 4 | 5): MealDistribution[] {
  return MEAL_DISTRIBUTIONS[mealsPerDay].map((m) => ({
    name: m.name,
    pct: m.pct,
    calories: Math.round(kbju.calories * m.pct),
    protein:  Math.round(kbju.protein  * m.pct),
    fat:      Math.round(kbju.fat      * m.pct),
    carbs:    Math.round(kbju.carbs    * m.pct),
  }))
}

export async function loadUserProfile(userId: string): Promise<UserProfileData | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('gender, age, height_cm, weight_kg, activity, goal, goal_intensity, meals_per_day')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return {
    gender: data.gender ?? 'male',
    age: data.age ?? 25,
    height: data.height_cm ?? 170,
    weight: data.weight_kg ?? 70,
    activity: data.activity ?? 'moderate',
    goal: data.goal ?? 'maintenance',
    goalIntensity: data.goal_intensity ?? 'light',
    mealsPerDay: data.meals_per_day ?? 3,
  }
}

export async function saveUserProfile(userId: string, profile: UserProfileData): Promise<void> {
  await supabase.from('user_profiles').upsert({
    id: userId,
    gender: profile.gender,
    age: profile.age,
    height_cm: profile.height,
    weight_kg: profile.weight,
    activity: profile.activity,
    goal: profile.goal,
    goal_intensity: profile.goalIntensity,
    meals_per_day: profile.mealsPerDay,
  })
}
