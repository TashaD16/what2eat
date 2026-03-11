import { Ingredient } from './ingredient'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Dish {
  id: number
  name: string
  description: string | null
  image_url: string | null
  cooking_time: number
  difficulty: Difficulty
  servings: number
  estimated_cost: number | null
  is_vegetarian: boolean
  is_vegan: boolean
  ingredients?: Ingredient[]
  match_count?: number
  missing_ingredients?: Ingredient[]
}

