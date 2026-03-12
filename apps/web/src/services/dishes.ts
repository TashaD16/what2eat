import { Dish } from '@what2eat/types'

/** Опции поиска блюд (используются при поиске в global_recipes по ингредиентам). */
export interface FindDishesOptions {
  allowMissing?: number
  vegetarianOnly?: boolean
  veganOnly?: boolean
  cuisine?: string | null
}

/**
 * Поиск блюд по ингредиентам в локальной БД отключён — все рецепты берутся из Supabase (global_recipes).
 * Возвращает пустой массив; блюда подгружаются через searchGlobalRecipesByIngredients в App.
 */
export async function findDishesByIngredients(
  _ingredientIds: number[],
  _options?: FindDishesOptions
): Promise<Dish[]> {
  return []
}
