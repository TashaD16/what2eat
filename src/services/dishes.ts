import { getDatabase } from './database'
import { Dish, Ingredient } from '../types'

// Базовые ингредиенты, которые могут быть в любом блюде (специи, масла)
// Получаем их ID динамически из базы данных
async function getBasicIngredientIds(): Promise<number[]> {
  const db = getDatabase()
  const basicNames = ['Соль', 'Перец черный', 'Масло растительное', 'Масло сливочное']
  const placeholders = basicNames.map(() => '?').join(',')
  
  const stmt = db.prepare(`
    SELECT id FROM ingredients 
    WHERE name IN (${placeholders})
  `)
  stmt.bind(basicNames)
  
  const ids: number[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    ids.push(row.id as number)
  }
  stmt.free()
  
  return ids
}

export interface FindDishesOptions {
  allowMissing?: number
  vegetarianOnly?: boolean
  veganOnly?: boolean
}

export async function findDishesByIngredients(
  ingredientIds: number[],
  options: FindDishesOptions = {}
): Promise<Dish[]> {
  const { allowMissing = 0, vegetarianOnly = false, veganOnly = false } = options
  if (ingredientIds.length === 0) {
    return []
  }

  const db = getDatabase()
  
  try {
    // Получаем ID базовых ингредиентов динамически
    const basicIngredientIds = await getBasicIngredientIds()
    console.log('Basic ingredient IDs:', basicIngredientIds)
    
    // Расширяем список выбранных ингредиентов базовыми (специи, масла)
    const allAllowedIngredients = [...ingredientIds, ...basicIngredientIds]
    const selectedPlaceholders = ingredientIds.map(() => '?').join(',')
    
    console.log('Finding dishes for ingredients:', ingredientIds)
    console.log('All allowed ingredients (selected + basic):', allAllowedIngredients)
    
    // Шаг 1: Получаем все блюда-кандидаты одним запросом
    const dietaryFilter = veganOnly
      ? 'AND d.is_vegan = 1'
      : vegetarianOnly
      ? 'AND d.is_vegetarian = 1'
      : ''
    const dishesQuery = `
      SELECT DISTINCT
        d.id,
        d.name,
        d.description,
        d.image_url,
        d.cooking_time,
        d.difficulty,
        d.servings,
        d.estimated_cost,
        d.is_vegetarian,
        d.is_vegan
      FROM dishes d
      JOIN dish_ingredients di ON d.id = di.dish_id
      WHERE di.ingredient_id IN (${selectedPlaceholders})
      ${dietaryFilter}
      ORDER BY d.name
      LIMIT 50
    `
    
    const dishesStmt = db.prepare(dishesQuery)
    dishesStmt.bind(ingredientIds)
    
    const candidateDishes: Dish[] = []
    const candidateDishIds: number[] = []
    
    while (dishesStmt.step()) {
      const row = dishesStmt.getAsObject()
      const dishId = row.id as number
      candidateDishIds.push(dishId)
      candidateDishes.push({
        id: dishId,
        name: row.name as string,
        description: (row.description as string) || null,
        image_url: (row.image_url as string) || null,
        cooking_time: row.cooking_time as number,
        difficulty: row.difficulty as Dish['difficulty'],
        servings: row.servings as number,
        estimated_cost: (row.estimated_cost as number) ?? null,
        is_vegetarian: Boolean(row.is_vegetarian),
        is_vegan: Boolean(row.is_vegan),
      })
    }
    dishesStmt.free()
    
    console.log(`Found ${candidateDishIds.length} candidate dishes`)
    
    if (candidateDishIds.length === 0) {
      return []
    }
    
    // Шаг 2: Получаем ВСЕ ингредиенты для всех кандидатов одним запросом
    const dishIdsPlaceholders = candidateDishIds.map(() => '?').join(',')
    const ingredientsQuery = `
      SELECT dish_id, ingredient_id
      FROM dish_ingredients
      WHERE dish_id IN (${dishIdsPlaceholders})
    `
    
    const ingredientsStmt = db.prepare(ingredientsQuery)
    ingredientsStmt.bind(candidateDishIds)
    
    // Группируем ингредиенты по блюдам
    const dishIngredientsMap = new Map<number, number[]>()
    
    while (ingredientsStmt.step()) {
      const row = ingredientsStmt.getAsObject()
      const dishId = row.dish_id as number
      const ingredientId = row.ingredient_id as number
      
      if (!dishIngredientsMap.has(dishId)) {
        dishIngredientsMap.set(dishId, [])
      }
      dishIngredientsMap.get(dishId)!.push(ingredientId)
    }
    ingredientsStmt.free()
    
    console.log(`Loaded ingredients for ${dishIngredientsMap.size} dishes`)

    // Шаг 2.5: Загружаем details всех уникальных ингредиентов одним запросом
    const allUniqueIngredientIds = [
      ...new Set([...dishIngredientsMap.values()].flat()),
    ]
    const ingredientDetailsMap = new Map<number, Ingredient>()
    if (allUniqueIngredientIds.length > 0) {
      const detailsPlaceholders = allUniqueIngredientIds.map(() => '?').join(',')
      const detailsStmt = db.prepare(
        `SELECT id, name, category, image_url FROM ingredients WHERE id IN (${detailsPlaceholders})`
      )
      detailsStmt.bind(allUniqueIngredientIds)
      while (detailsStmt.step()) {
        const r = detailsStmt.getAsObject()
        ingredientDetailsMap.set(r.id as number, {
          id: r.id as number,
          name: r.name as string,
          category: r.category as Ingredient['category'],
          image_url: (r.image_url as string) || null,
        })
      }
      detailsStmt.free()
    }

    // Шаг 3: Получаем ID всех овощей (они могут быть гарниром)
    const vegetablesStmt = db.prepare(`
      SELECT id FROM ingredients WHERE category = 'vegetables'
    `)
    const vegetableIds: number[] = []
    while (vegetablesStmt.step()) {
      const row = vegetablesStmt.getAsObject()
      vegetableIds.push(row.id as number)
    }
    vegetablesStmt.free()
    
    // Шаг 4: Фильтруем блюда в JavaScript
    const validDishes: Dish[] = []
    
    console.log('=== FILTERING DISHES ===')
    console.log('Selected ingredient IDs:', ingredientIds)
    console.log('Basic ingredient IDs:', basicIngredientIds)
    console.log('All allowed ingredients:', allAllowedIngredients)
    console.log('Vegetable IDs (can be used as garnish):', vegetableIds)
    console.log('Candidate dishes:', candidateDishes.map(d => ({ id: d.id, name: d.name })))
    
    for (const dish of candidateDishes) {
      const dishIngredientIds = dishIngredientsMap.get(dish.id) || []
      
      console.log(`\nChecking dish: "${dish.name}" (id=${dish.id})`)
      console.log(`  All dish ingredients:`, dishIngredientIds)
      
      // Исключаем овощи из проверки (они могут быть гарниром)
      const nonVegetableIngredients = dishIngredientIds.filter(id => 
        !vegetableIds.includes(id)
      )
      
      console.log(`  Non-vegetable ingredients:`, nonVegetableIngredients)
      
      // Находим неовощные ингредиенты, которых нет в списке разрешенных
      const disallowedIngredients = nonVegetableIngredients.filter(id => 
        !allAllowedIngredients.includes(id)
      )
      
      // Проверяем, что все неовощные ингредиенты блюда входят в список разрешенных
      const hasOnlyAllowedIngredients = disallowedIngredients.length === 0
      
      // Проверяем, что блюдо содержит хотя бы один выбранный ингредиент
      // (овощи могут быть гарниром, но если пользователь их выбрал, они тоже учитываются)
      const hasSelectedIngredient = dishIngredientIds.some(id => 
        ingredientIds.includes(id)
      )
      
      console.log(`  Disallowed non-vegetable ingredients:`, disallowedIngredients)
      console.log(`  hasOnlyAllowedIngredients:`, hasOnlyAllowedIngredients)
      console.log(`  hasSelectedIngredient:`, hasSelectedIngredient)
      
      if (!hasOnlyAllowedIngredients) {
        console.log(`  ❌ REJECTED: contains disallowed non-vegetable ingredients`)
      } else if (!hasSelectedIngredient) {
        console.log(`  ❌ REJECTED: does not contain any selected ingredient`)
      } else {
        console.log(`  ✅ ACCEPTED`)
      }
      
      const acceptDish = allowMissing > 0
        ? disallowedIngredients.length <= allowMissing && hasSelectedIngredient
        : hasOnlyAllowedIngredients && hasSelectedIngredient

      if (acceptDish) {
        const matchCount = dishIngredientIds.filter(id => ingredientIds.includes(id)).length
        const dishIngredients = dishIngredientIds
          .map(id => ingredientDetailsMap.get(id))
          .filter(Boolean) as Ingredient[]
        validDishes.push({
          ...dish,
          ingredients: dishIngredients,
          match_count: matchCount,
          _missingIds: disallowedIngredients,
        } as Dish & { _missingIds: number[] })
      }
    }

    console.log(`\n=== FILTERING COMPLETE ===`)
    console.log(`Valid dishes found: ${validDishes.length}`)

    // Шаг 5: если есть недостающие ингредиенты — подгружаем их детали одним запросом
    const allMissingIds = [
      ...new Set(
        (validDishes as unknown as (Dish & { _missingIds: number[] })[])
          .flatMap(d => d._missingIds || [])
      ),
    ]
    const missingDetailsMap = new Map<number, Ingredient>()
    if (allMissingIds.length > 0) {
      const missingPlaceholders = allMissingIds.map(() => '?').join(',')
      const missingStmt = db.prepare(
        `SELECT id, name, category, image_url FROM ingredients WHERE id IN (${missingPlaceholders})`
      )
      missingStmt.bind(allMissingIds)
      while (missingStmt.step()) {
        const r = missingStmt.getAsObject()
        missingDetailsMap.set(r.id as number, {
          id: r.id as number,
          name: r.name as string,
          category: r.category as Ingredient['category'],
          image_url: (r.image_url as string) || null,
        })
      }
      missingStmt.free()
    }

    // Назначаем missing_ingredients и убираем временное поле
    const result = validDishes
      .sort((a, b) => {
        if (b.match_count! !== a.match_count!) return b.match_count! - a.match_count!
        return a.name.localeCompare(b.name)
      })
      .slice(0, 15)
      .map(dish => {
        const d = dish as Dish & { _missingIds?: number[] }
        const { _missingIds, ...cleanDish } = d
        const missing = (_missingIds || []).map(id => missingDetailsMap.get(id)).filter(Boolean) as Ingredient[]
        return { ...cleanDish, missing_ingredients: missing.length > 0 ? missing : undefined }
      })

    console.log(`Returning ${result.length} valid dishes`)

    return result
  } catch (error) {
    console.error('Error finding dishes:', error)
    return []
  }
}

/**
 * Получает все блюда из базы данных
 */
export async function getAllDishes(): Promise<Dish[]> {
  const db = getDatabase()

  try {
    const dishesStmt = db.prepare(`
      SELECT DISTINCT d.id, d.name, d.description, d.image_url, d.cooking_time, d.difficulty, d.servings, d.estimated_cost, d.is_vegetarian, d.is_vegan
      FROM dishes d
      ORDER BY d.name
    `)

    const dishes: Dish[] = []
    const dishIds: number[] = []
    while (dishesStmt.step()) {
      const row = dishesStmt.getAsObject()
      const dishId = row.id as number
      dishIds.push(dishId)
      dishes.push({
        id: dishId,
        name: row.name as string,
        description: (row.description as string) || null,
        image_url: (row.image_url as string) || null,
        cooking_time: row.cooking_time as number,
        difficulty: row.difficulty as Dish['difficulty'],
        servings: row.servings as number,
        estimated_cost: (row.estimated_cost as number) ?? null,
        is_vegetarian: Boolean(row.is_vegetarian),
        is_vegan: Boolean(row.is_vegan),
      })
    }
    dishesStmt.free()

    if (dishIds.length === 0) return dishes

    const idsPlaceholders = dishIds.map(() => '?').join(',')
    const ingStmt = db.prepare(`SELECT dish_id, ingredient_id FROM dish_ingredients WHERE dish_id IN (${idsPlaceholders})`)
    ingStmt.bind(dishIds)
    const ingMap = new Map<number, number[]>()
    while (ingStmt.step()) {
      const r = ingStmt.getAsObject()
      const dId = r.dish_id as number
      if (!ingMap.has(dId)) ingMap.set(dId, [])
      ingMap.get(dId)!.push(r.ingredient_id as number)
    }
    ingStmt.free()

    const allIngIds = [...new Set([...ingMap.values()].flat())]
    const ingDetailsMap = new Map<number, Ingredient>()
    if (allIngIds.length > 0) {
      const detailsStmt = db.prepare(`SELECT id, name, category, image_url FROM ingredients WHERE id IN (${allIngIds.map(() => '?').join(',')})`)
      detailsStmt.bind(allIngIds)
      while (detailsStmt.step()) {
        const r = detailsStmt.getAsObject()
        ingDetailsMap.set(r.id as number, { id: r.id as number, name: r.name as string, category: r.category as Ingredient['category'], image_url: (r.image_url as string) || null })
      }
      detailsStmt.free()
    }

    return dishes.map(dish => ({
      ...dish,
      ingredients: (ingMap.get(dish.id) || []).map(id => ingDetailsMap.get(id)).filter(Boolean) as Ingredient[],
    }))
  } catch (error) {
    console.error('Error getting all dishes:', error)
    return []
  }
}

/**
 * Получает все блюда, которые содержат мясные ингредиенты (мясо, сосиски, фарш)
 * @returns Массив блюд с мясными ингредиентами
 */
export async function getDishesWithMeat(): Promise<Dish[]> {
  const db = getDatabase()
  
  try {
    // Получаем ID всех мясных ингредиентов (категория 'meat')
    const meatStmt = db.prepare(`
      SELECT id FROM ingredients WHERE category = 'meat'
    `)
    const meatIngredientIds: number[] = []
    while (meatStmt.step()) {
      const row = meatStmt.getAsObject()
      meatIngredientIds.push(row.id as number)
    }
    meatStmt.free()
    
    if (meatIngredientIds.length === 0) {
      return []
    }
    
    // Получаем все блюда, которые содержат хотя бы один мясной ингредиент
    const placeholders = meatIngredientIds.map(() => '?').join(',')
    const dishesQuery = `
      SELECT DISTINCT
        d.id,
        d.name,
        d.description,
        d.image_url,
        d.cooking_time,
        d.difficulty,
        d.servings,
        d.estimated_cost,
        d.is_vegetarian,
        d.is_vegan
      FROM dishes d
      JOIN dish_ingredients di ON d.id = di.dish_id
      WHERE di.ingredient_id IN (${placeholders})
      ORDER BY d.name
    `

    const dishesStmt = db.prepare(dishesQuery)
    dishesStmt.bind(meatIngredientIds)

    const dishes: Dish[] = []
    const dishIds: number[] = []
    while (dishesStmt.step()) {
      const row = dishesStmt.getAsObject()
      const dishId = row.id as number
      dishIds.push(dishId)
      dishes.push({
        id: dishId,
        name: row.name as string,
        description: (row.description as string) || null,
        image_url: (row.image_url as string) || null,
        cooking_time: row.cooking_time as number,
        difficulty: row.difficulty as Dish['difficulty'],
        servings: row.servings as number,
        estimated_cost: (row.estimated_cost as number) ?? null,
        is_vegetarian: Boolean(row.is_vegetarian),
        is_vegan: Boolean(row.is_vegan),
      })
    }
    dishesStmt.free()

    if (dishIds.length === 0) {
      return dishes
    }

    // Загружаем ингредиенты для всех блюд одним batch-запросом
    const meatDishIdsPlaceholders = dishIds.map(() => '?').join(',')
    const meatDishIngredientsStmt = db.prepare(`
      SELECT dish_id, ingredient_id
      FROM dish_ingredients
      WHERE dish_id IN (${meatDishIdsPlaceholders})
    `)
    meatDishIngredientsStmt.bind(dishIds)
    const meatDishIngredientsMap = new Map<number, number[]>()
    while (meatDishIngredientsStmt.step()) {
      const r = meatDishIngredientsStmt.getAsObject()
      const dId = r.dish_id as number
      const iId = r.ingredient_id as number
      if (!meatDishIngredientsMap.has(dId)) meatDishIngredientsMap.set(dId, [])
      meatDishIngredientsMap.get(dId)!.push(iId)
    }
    meatDishIngredientsStmt.free()

    const allMeatDishIngredientIds = [...new Set([...meatDishIngredientsMap.values()].flat())]
    const meatIngredientDetailsMap = new Map<number, Ingredient>()
    if (allMeatDishIngredientIds.length > 0) {
      const meatIngPlaceholders = allMeatDishIngredientIds.map(() => '?').join(',')
      const meatIngDetailsStmt = db.prepare(
        `SELECT id, name, category, image_url FROM ingredients WHERE id IN (${meatIngPlaceholders})`
      )
      meatIngDetailsStmt.bind(allMeatDishIngredientIds)
      while (meatIngDetailsStmt.step()) {
        const r = meatIngDetailsStmt.getAsObject()
        meatIngredientDetailsMap.set(r.id as number, {
          id: r.id as number,
          name: r.name as string,
          category: r.category as Ingredient['category'],
          image_url: (r.image_url as string) || null,
        })
      }
      meatIngDetailsStmt.free()
    }

    return dishes.map(dish => ({
      ...dish,
      ingredients: (meatDishIngredientsMap.get(dish.id) || [])
        .map(id => meatIngredientDetailsMap.get(id))
        .filter(Boolean) as Ingredient[],
    }))
  } catch (error) {
    console.error('Error getting dishes with meat:', error)
    return []
  }
}

/**
 * Случайно выбирает 3-5 блюд из массива
 * @param dishes Массив блюд для выбора
 * @returns Массив из 3-5 случайно выбранных блюд
 */
export function randomizeDishes(dishes: Dish[]): Dish[] {
  if (dishes.length === 0) {
    return []
  }
  
  // Перемешиваем массив
  const shuffled = [...dishes].sort(() => Math.random() - 0.5)
  
  // Выбираем случайное количество от 3 до 5, но не больше доступных блюд
  const count = Math.min(20, shuffled.length)
  return shuffled.slice(0, count)
}

export async function getDishById(dishId: number): Promise<Dish | null> {
  const db = getDatabase()
  const stmt = db.prepare('SELECT id, name, description, image_url, cooking_time, difficulty, servings, estimated_cost, is_vegetarian, is_vegan FROM dishes WHERE id = ?')
  stmt.bind([dishId])
  
  if (!stmt.step()) {
    stmt.free()
    return null
  }
  
  const row = stmt.getAsObject()
  stmt.free()
  
  // Получаем ингредиенты для блюда
  const ingredientsStmt = db.prepare(`
    SELECT i.* 
    FROM ingredients i
    JOIN dish_ingredients di ON i.id = di.ingredient_id
    WHERE di.dish_id = ?
  `)
  ingredientsStmt.bind([dishId])
  
  const ingredients: Ingredient[] = []
  while (ingredientsStmt.step()) {
    const ingRow = ingredientsStmt.getAsObject()
    ingredients.push({
      id: ingRow.id as number,
      name: ingRow.name as string,
      category: ingRow.category as Ingredient['category'],
      image_url: (ingRow.image_url as string) || null,
    })
  }
  ingredientsStmt.free()
  
  return {
    id: row.id as number,
    name: row.name as string,
    description: (row.description as string) || null,
    image_url: (row.image_url as string) || null,
    cooking_time: row.cooking_time as number,
    difficulty: row.difficulty as Dish['difficulty'],
    servings: row.servings as number,
    estimated_cost: (row.estimated_cost as number) ?? null,
    is_vegetarian: Boolean(row.is_vegetarian),
    is_vegan: Boolean(row.is_vegan),
    ingredients,
  }
}

