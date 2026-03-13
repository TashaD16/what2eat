/**
 * TheMealDB API — free, no API key required, real food photos.
 * https://www.themealdb.com/api.php
 */

const BASE = 'https://www.themealdb.com/api/json/v1/1'

export interface MealDBMeal {
  idMeal: string
  strMeal: string
  strCategory: string
  strArea: string
  strInstructions: string
  strMealThumb: string
  strTags: string | null
  [key: string]: string | null
}

interface MealListItem {
  idMeal: string
  strMeal: string
  strMealThumb: string
}

async function apiFetch<T>(endpoint: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE}/${endpoint}`)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export async function getRandomMeal(): Promise<MealDBMeal | null> {
  const data = await apiFetch<{ meals: MealDBMeal[] }>('random.php')
  return data?.meals?.[0] ?? null
}

export async function getMealById(id: string): Promise<MealDBMeal | null> {
  const data = await apiFetch<{ meals: MealDBMeal[] }>(`lookup.php?i=${id}`)
  return data?.meals?.[0] ?? null
}

/** Search meals by name (TheMealDB search.php?s=). Returns full meal details. */
export async function searchMealsByName(nameEn: string): Promise<MealDBMeal[]> {
  if (!nameEn.trim()) return []
  const data = await apiFetch<{ meals: MealDBMeal[] | null }>(
    `search.php?s=${encodeURIComponent(nameEn.trim())}`
  )
  return data?.meals ?? []
}

export async function getMealIdsByIngredient(ingredientEn: string): Promise<string[]> {
  const data = await apiFetch<{ meals: MealListItem[] | null }>(
    `filter.php?i=${encodeURIComponent(ingredientEn)}`
  )
  return (data?.meals ?? []).map((m) => m.idMeal)
}

/** Fetch N unique random meals in parallel. */
export async function getRandomMeals(count: number): Promise<MealDBMeal[]> {
  const results = await Promise.all(
    Array.from({ length: count }, () => getRandomMeal())
  )
  // Deduplicate by id
  const seen = new Set<string>()
  return results.filter((m): m is MealDBMeal => {
    if (!m || seen.has(m.idMeal)) return false
    seen.add(m.idMeal)
    return true
  })
}

/**
 * Find meals that contain ALL of the given English ingredient names.
 * Falls back to union (any) if intersection is empty.
 */
export async function findMealsByIngredients(
  ingredientsEn: string[],
  maxResults = 5
): Promise<MealDBMeal[]> {
  if (ingredientsEn.length === 0) return []

  // Get meal ID sets per ingredient
  const idSets = await Promise.all(
    ingredientsEn.map((ing) => getMealIdsByIngredient(ing))
  )

  // Intersection first (require all ingredients)
  const intersection = idSets.reduce((acc, ids) => {
    const set = new Set(ids)
    return acc.filter((id) => set.has(id))
  })

  const candidateIds = intersection.length > 0
    ? intersection
    : idSets.flat() // fallback: union

  // Deduplicate and pick top N
  const unique = [...new Set(candidateIds)].slice(0, maxResults)

  // Fetch full details in parallel
  const meals = await Promise.all(unique.map((id) => getMealById(id)))
  return meals.filter((m): m is MealDBMeal => m !== null)
}

/** Returns meal IDs for a given TheMealDB area (cuisine). */
export async function getMealsByArea(area: string): Promise<string[]> {
  const data = await apiFetch<{ meals: MealListItem[] | null }>(
    `filter.php?a=${encodeURIComponent(area)}`
  )
  return (data?.meals ?? []).map((m) => m.idMeal)
}

/** Maps internal cuisine value to TheMealDB strArea values. */
export function cuisineToMealDbAreas(cuisine: string | null): string[] {
  if (cuisine === 'russian') return ['Russian']
  if (cuisine === 'italian') return ['Italian']
  if (cuisine === 'asian') return ['Japanese', 'Chinese', 'Thai']
  if (cuisine === 'american') return ['American']
  return []
}

/** Extract ingredient list from TheMealDB strIngredient1-20 / strMeasure1-20 fields. */
export function extractIngredients(
  meal: MealDBMeal
): Array<{ nameEn: string; measure: string }> {
  const result: Array<{ nameEn: string; measure: string }> = []
  for (let i = 1; i <= 20; i++) {
    const name = meal[`strIngredient${i}`]
    const measure = meal[`strMeasure${i}`]
    if (name && name.trim()) {
      result.push({ nameEn: name.trim(), measure: (measure ?? '').trim() })
    }
  }
  return result
}

/** Estimate cooking time and difficulty from instruction length. */
export function estimateMeta(
  meal: MealDBMeal
): { cooking_time: number; difficulty: 'easy' | 'medium' | 'hard' } {
  const len = meal.strInstructions?.length ?? 0
  if (len < 600) return { cooking_time: 20, difficulty: 'easy' }
  if (len < 1500) return { cooking_time: 40, difficulty: 'medium' }
  return { cooking_time: 65, difficulty: 'hard' }
}
