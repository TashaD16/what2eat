import { getDatabase } from './database'
import { Ingredient } from '@what2eat/types'

export async function getAllIngredients(): Promise<Ingredient[]> {
  const db = getDatabase()
  const result = db.exec('SELECT * FROM ingredients ORDER BY category, name')
  
  if (result.length === 0) {
    return []
  }

  const rows = result[0].values
  return rows.map((row) => ({
    id: row[0] as number,
    name: row[1] as string,
    category: row[2] as Ingredient['category'],
    image_url: row[3] as string | null,
  }))
}

export async function getIngredientsByCategory(
  category: Ingredient['category']
): Promise<Ingredient[]> {
  const db = getDatabase()
  const stmt = db.prepare('SELECT * FROM ingredients WHERE category = ? ORDER BY name')
  stmt.bind([category])
  
  const ingredients: Ingredient[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    ingredients.push({
      id: row.id as number,
      name: row.name as string,
      category: row.category as Ingredient['category'],
      image_url: (row.image_url as string) || null,
    })
  }
  stmt.free()
  
  return ingredients
}

export async function searchIngredients(query: string): Promise<Ingredient[]> {
  const db = getDatabase()
  const stmt = db.prepare(
    'SELECT * FROM ingredients WHERE name LIKE ? ORDER BY name'
  )
  stmt.bind([`%${query}%`])
  
  const ingredients: Ingredient[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    ingredients.push({
      id: row.id as number,
      name: row.name as string,
      category: row.category as Ingredient['category'],
      image_url: (row.image_url as string) || null,
    })
  }
  stmt.free()
  
  return ingredients
}

