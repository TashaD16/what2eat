import { supabase } from './supabase'

export interface UserProfileData {
  gender: 'male' | 'female'
  age: number
  height: number // cm
  weight: number // kg
  activity: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'
}

export interface KBJUGoal {
  calories: number
  protein: number
  fat: number
  carbs: number
}

const ACTIVITY_FACTORS: Record<UserProfileData['activity'], number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
}

export function calculateKBJU(profile: UserProfileData): KBJUGoal {
  const { gender, age, height, weight, activity } = profile
  const bmr =
    gender === 'male'
      ? 10 * weight + 6.25 * height - 5 * age + 5
      : 10 * weight + 6.25 * height - 5 * age - 161
  const calories = Math.round(bmr * ACTIVITY_FACTORS[activity])
  const protein = Math.round((calories * 0.25) / 4)
  const fat = Math.round((calories * 0.3) / 9)
  const carbs = Math.round((calories * 0.45) / 4)
  return { calories, protein, fat, carbs }
}

export async function loadUserProfile(userId: string): Promise<UserProfileData | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('gender, age, height_cm, weight_kg, activity')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return {
    gender: data.gender ?? 'male',
    age: data.age ?? 25,
    height: data.height_cm ?? 170,
    weight: data.weight_kg ?? 70,
    activity: data.activity ?? 'moderate',
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
  })
}
