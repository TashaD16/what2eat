import { getDatabase } from './database'
import { Recipe, RecipeStep, RecipeIngredient } from '@what2eat/types'

export async function getRecipeByDishId(dishId: number): Promise<Recipe | null> {
  const db = getDatabase()
  
  // Получаем рецепт и информацию о блюде
  const stmt = db.prepare(`
    SELECT
      r.id,
      r.dish_id,
      d.name as dish_name,
      d.description,
      r.instructions,
      d.cooking_time,
      d.difficulty,
      d.servings,
      d.image_url
    FROM recipes r
    JOIN dishes d ON r.dish_id = d.id
    WHERE r.dish_id = ?
  `)
  stmt.bind([dishId])
  
  if (!stmt.step()) {
    stmt.free()
    return null
  }
  
  const row = stmt.getAsObject()
  stmt.free()
  
  // Парсим инструкции из JSON
  let instructions: RecipeStep[] = []
  try {
    instructions = JSON.parse(row.instructions as string) as RecipeStep[]
  } catch (e) {
    console.error('Error parsing instructions:', e)
  }
  
  // Получаем ингредиенты рецепта
  const ingredientsStmt = db.prepare(`
    SELECT 
      ri.ingredient_id,
      i.name as ingredient_name,
      ri.quantity,
      ri.unit
    FROM recipe_ingredients ri
    JOIN ingredients i ON ri.ingredient_id = i.id
    WHERE ri.recipe_id = ?
    ORDER BY i.name
  `)
  ingredientsStmt.bind([row.id])
  
  const ingredients: RecipeIngredient[] = []
  while (ingredientsStmt.step()) {
    const ingRow = ingredientsStmt.getAsObject()
    ingredients.push({
      ingredient_id: ingRow.ingredient_id as number,
      ingredient_name: ingRow.ingredient_name as string,
      quantity: ingRow.quantity as number,
      unit: ingRow.unit as string,
    })
  }
  ingredientsStmt.free()
  
  return {
    id: row.id as number,
    dish_id: row.dish_id as number,
    dish_name: row.dish_name as string,
    description: (row.description as string) || null,
    instructions,
    ingredients,
    cooking_time: row.cooking_time as number,
    difficulty: row.difficulty as Recipe['difficulty'],
    servings: row.servings as number,
    image_url: (row.image_url as string) || null,
  }
}

