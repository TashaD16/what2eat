const KEY = 'w2e_gamification_v1'

export interface GamificationState {
  streak: number
  longestStreak: number
  lastCookedDate: string | null
  totalCooked: number
  earnedBadges: string[]
}

export interface BadgeDefinition {
  id: string
  emoji: string
  labelRu: string
  labelEn: string
}

export const BADGES: BadgeDefinition[] = [
  { id: 'first_recipe', emoji: '🍳', labelRu: 'Первый рецепт', labelEn: 'First recipe' },
  { id: 'streak_3',     emoji: '🔥', labelRu: '3 дня подряд',  labelEn: '3-day streak' },
  { id: 'streak_7',     emoji: '🌟', labelRu: '7 дней подряд', labelEn: '7-day streak' },
  { id: 'streak_14',    emoji: '🏅', labelRu: '2 недели',       labelEn: '2-week streak' },
  { id: 'total_10',     emoji: '📚', labelRu: '10 дней готовки', labelEn: '10 days cooked' },
  { id: 'total_30',     emoji: '🏆', labelRu: '30 дней готовки', labelEn: '30 days cooked' },
]

const BADGE_CONDITIONS: Record<string, (s: GamificationState) => boolean> = {
  first_recipe: (s) => s.totalCooked >= 1,
  streak_3:     (s) => s.streak >= 3,
  streak_7:     (s) => s.streak >= 7,
  streak_14:    (s) => s.streak >= 14,
  total_10:     (s) => s.totalCooked >= 10,
  total_30:     (s) => s.totalCooked >= 30,
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

function getInitialState(): GamificationState {
  return { streak: 0, longestStreak: 0, lastCookedDate: null, totalCooked: 0, earnedBadges: [] }
}

export function getGamification(): GamificationState {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as GamificationState) : getInitialState()
  } catch {
    return getInitialState()
  }
}

function save(state: GamificationState): void {
  localStorage.setItem(KEY, JSON.stringify(state))
}

export function isCookedToday(): boolean {
  return getGamification().lastCookedDate === getToday()
}

/** Marks today as cooked. Returns newly earned badge IDs (empty if already marked today). */
export function markCookedToday(): { alreadyMarked: boolean; newBadges: string[] } {
  const state = getGamification()
  const today = getToday()

  if (state.lastCookedDate === today) {
    return { alreadyMarked: true, newBadges: [] }
  }

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const newStreak = state.lastCookedDate === yesterdayStr ? state.streak + 1 : 1
  const newTotal = state.totalCooked + 1
  const newLongest = Math.max(state.longestStreak, newStreak)

  const updated: GamificationState = {
    ...state,
    streak: newStreak,
    longestStreak: newLongest,
    lastCookedDate: today,
    totalCooked: newTotal,
  }

  const newBadges = BADGES
    .filter(b => !state.earnedBadges.includes(b.id) && BADGE_CONDITIONS[b.id]?.(updated))
    .map(b => b.id)

  updated.earnedBadges = [...state.earnedBadges, ...newBadges]
  save(updated)
  return { alreadyMarked: false, newBadges }
}
