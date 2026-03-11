import { AIRecipe } from './aiRecipes'

const SEED_KEY = 'w2e_seed_recipes_v1'
const SEED_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days

/** Number of recipes pre-loaded from TheMealDB on first randomizer run. */
export const SEED_COUNT = 20

interface SeedEntry {
  recipes: AIRecipe[]
  savedAt: number
}

/**
 * Reads seed recipes from localStorage.
 * Returns [] if cache is missing or older than 30 days.
 */
export function loadSeedFromCache(): AIRecipe[] {
  try {
    const raw = localStorage.getItem(SEED_KEY)
    if (!raw) return []
    const entry = JSON.parse(raw) as SeedEntry
    if (Date.now() - entry.savedAt > SEED_MAX_AGE_MS) {
      localStorage.removeItem(SEED_KEY)
      return []
    }
    return entry.recipes ?? []
  } catch {
    return []
  }
}

/**
 * Saves seed recipes to localStorage.
 * Called after a successful fetch so next session loads instantly.
 */
export function saveSeedToCache(recipes: AIRecipe[]): void {
  try {
    const entry: SeedEntry = { recipes, savedAt: Date.now() }
    localStorage.setItem(SEED_KEY, JSON.stringify(entry))
  } catch {
    // localStorage unavailable or full — silently ignore
  }
}
