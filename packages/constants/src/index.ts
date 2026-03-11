import { IngredientCategory } from '@what2eat/types'

export const INGREDIENT_CATEGORIES: Record<IngredientCategory, string> = {
  meat: 'Мясо',
  cereals: 'Крупы',
  vegetables: 'Овощи',
  dairy: 'Молочные продукты',
  spices: 'Специи',
  other: 'Прочее',
} as const

export const DIFFICULTY_LABELS = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно',
} as const

export const DIFFICULTY_COLORS = {
  easy: '#4caf50',
  medium: '#ff9800',
  hard: '#f44336',
} as const
