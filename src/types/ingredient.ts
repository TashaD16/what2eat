export type IngredientCategory =
  | 'meat'
  | 'cereals'
  | 'vegetables'
  | 'dairy'
  | 'spices'
  | 'other'

export interface Ingredient {
  id: number
  name: string
  category: IngredientCategory
  image_url: string | null
}

