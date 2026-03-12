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
  easy: '#16a34a',
  medium: '#c2410c',
  hard: '#dc2626',
} as const
