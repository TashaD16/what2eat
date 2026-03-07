import { Difficulty } from './dish'

export interface RecipeStep {
  step: number
  description: string
}

export interface RecipeIngredient {
  ingredient_id: number
  ingredient_name: string
  quantity: number
  unit: string
}

export interface Recipe {
  id: number
  dish_id: number
  dish_name: string
  instructions: RecipeStep[]
  ingredients: RecipeIngredient[]
  cooking_time: number
  difficulty: Difficulty
  servings: number
  image_url: string | null
}

