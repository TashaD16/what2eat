import { Recipe } from '@what2eat/types'

/**
 * Локальная БД удалена — рецепты только из Supabase (global_recipes).
 * Открытие рецепта идёт через AIRecipeView и getGlobalRecipeById.
 */
export async function getRecipeByDishId(_dishId?: number): Promise<Recipe | null> {
  return null
}
