import { AIRecipe } from './aiRecipes'

const CACHE_KEY = 'w2e_ai_random_cache'
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const CACHE_REFRESH_AGE_MS = 3 * 24 * 60 * 60 * 1000 // refresh after 3 days

interface CacheEntry {
  recipes: AIRecipe[]
  savedAt: number
}

/**
 * Saves AI recipe metadata to localStorage.
 * TheMealDB image URLs are permanent — stored in cache so next session loads instantly.
 */
export function saveAIRecipesToCache(recipes: AIRecipe[]): void {
  try {
    const entry: CacheEntry = { recipes, savedAt: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // localStorage may be unavailable or full — silently ignore
  }
}

/**
 * Loads cached AI recipes.
 * Returns empty array if cache is missing or older than CACHE_MAX_AGE_MS.
 */
export function loadAIRecipesFromCache(): AIRecipe[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return []
    const entry = JSON.parse(raw) as CacheEntry
    if (Date.now() - entry.savedAt > CACHE_MAX_AGE_MS) {
      localStorage.removeItem(CACHE_KEY)
      return []
    }
    return entry.recipes ?? []
  } catch {
    return []
  }
}

/**
 * True if cached data exists but is older than CACHE_REFRESH_AGE_MS.
 * In that case, fetch fresh recipes in background after showing cached ones.
 */
export function isCacheStale(): boolean {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return false
    const entry = JSON.parse(raw) as CacheEntry
    return Date.now() - entry.savedAt > CACHE_REFRESH_AGE_MS
  } catch {
    return false
  }
}
