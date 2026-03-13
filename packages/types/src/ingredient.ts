export type IngredientCategory =
  | 'meat'
  | 'cereals'
  | 'vegetables'
  | 'dairy'
  | 'spices'
  | 'other'

/** Кухни, где ингредиент часто используется. Пустой массив = для всех. */
export type CuisineCode = 'russian' | 'italian' | 'asian' | 'american'

export interface Ingredient {
  id: number
  name: string
  category: IngredientCategory
  image_url: string | null
  /** Кухни, где часто используется. Пустой/отсутствует = для всех кухонь. */
  cuisines?: CuisineCode[]
}

