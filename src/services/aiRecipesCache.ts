import { AIRecipe } from './aiRecipes'

const CACHE_KEY = 'w2e_ai_random_cache'
const CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const CACHE_REFRESH_AGE_MS = 3 * 24 * 60 * 60 * 1000 // refresh after 3 days

interface CacheEntry {
  recipes: AIRecipe[]
  savedAt: number
}

/**
 * Saves AI recipe metadata to localStorage (no images — DALL-E URLs expire).
 * Images are regenerated from DALL-E on each session using the cached text.
 */
export function saveAIRecipesToCache(recipes: AIRecipe[]): void {
  try {
    const toSave: AIRecipe[] = recipes.map(({ image_url: _img, ...rest }) => rest)
    const entry: CacheEntry = { recipes: toSave, savedAt: Date.now() }
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
