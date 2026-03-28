const KEY = 'w2e_pantry_v1'

export interface PantryItem {
  id: string
  name: string
  ingredientId?: number
  expiresAt?: string // YYYY-MM-DD
  addedAt: string
}

function getToday(): string {
  return new Date().toISOString().split('T')[0]
}

export function getPantry(): PantryItem[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PantryItem[]) : []
  } catch {
    return []
  }
}

function save(items: PantryItem[]): void {
  localStorage.setItem(KEY, JSON.stringify(items))
}

export function addPantryItem(item: Omit<PantryItem, 'id' | 'addedAt'>): PantryItem {
  const items = getPantry()
  const newItem: PantryItem = { ...item, id: crypto.randomUUID(), addedAt: getToday() }
  save([...items, newItem])
  return newItem
}

export function removePantryItem(id: string): void {
  save(getPantry().filter(i => i.id !== id))
}

export type ExpiryStatus = 'expired' | 'soon' | 'ok'

export function getExpiryStatus(item: PantryItem): ExpiryStatus {
  if (!item.expiresAt) return 'ok'
  const today = new Date(getToday())
  const exp = new Date(item.expiresAt)
  const diff = Math.floor((exp.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return 'expired'
  if (diff <= 2) return 'soon'
  return 'ok'
}

/** Returns the count of items expiring soon or already expired */
export function getExpiringCount(): number {
  return getPantry().filter(i => getExpiryStatus(i) !== 'ok').length
}
