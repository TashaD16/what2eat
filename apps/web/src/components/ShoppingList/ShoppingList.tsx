import { useMemo, useState, useEffect } from 'react'
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Checkbox,
  Divider,
  Button,
  Alert,
  Paper,
  Tooltip,
} from '@mui/material'
import { ArrowBack, ShoppingCart, ContentCopy, Check } from '@mui/icons-material'
import { useAppSelector } from '../../hooks/redux'
import { INGREDIENT_CATEGORIES } from '@what2eat/constants'
import { Ingredient } from '@what2eat/types'

const STORAGE_KEY = 'what2eat_shopping_checked'

interface ShoppingListProps {
  onBack: () => void
  plannerDishIds?: number[]
}

export default function ShoppingList({ onBack, plannerDishIds }: ShoppingListProps) {
  const { likedDishIds } = useAppSelector((state) => state.swipe)
  const { dishes } = useAppSelector((state) => state.dishes)
  const { selectedIngredients } = useAppSelector((state) => state.ingredients)
  const [copied, setCopied] = useState(false)

  const sourceDishIds = plannerDishIds ?? likedDishIds

  const [checked, setChecked] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? new Set(JSON.parse(saved) as number[]) : new Set()
    } catch {
      return new Set()
    }
  })

  // Собираем список покупок: missing_ingredients лайкнутых блюд
  const shoppingItems = useMemo(() => {
    const likedDishes = dishes.filter((d) => sourceDishIds.includes(d.id))
    const byId = new Map<number, Ingredient>()

    for (const dish of likedDishes) {
      // Недостающие ингредиенты из режима "немного докупить"
      for (const ing of dish.missing_ingredients ?? []) {
        byId.set(ing.id, ing)
      }
      // Все ингредиенты блюда, которых нет у пользователя
      for (const ing of dish.ingredients ?? []) {
        if (!selectedIngredients.includes(ing.id)) {
          byId.set(ing.id, ing)
        }
      }
    }

    return Array.from(byId.values())
  }, [dishes, sourceDishIds, selectedIngredients])

  const grouped = useMemo(() => {
    const map = new Map<string, Ingredient[]>()
    for (const ing of shoppingItems) {
      if (!map.has(ing.category)) map.set(ing.category, [])
      map.get(ing.category)!.push(ing)
    }
    return map
  }, [shoppingItems])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]))
  }, [checked])

  const toggleCheck = (id: number) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const clearChecked = () => {
    const next = new Set<number>()
    setChecked(next)
    localStorage.removeItem(STORAGE_KEY)
  }

  const copyToClipboard = () => {
    const lines: string[] = ['Список покупок:\n']
    for (const [category, items] of grouped.entries()) {
      const label = INGREDIENT_CATEGORIES[category as keyof typeof INGREDIENT_CATEGORIES] ?? category
      lines.push(`${label}:`)
      items.forEach((ing) => lines.push(`  • ${ing.name}`))
      lines.push('')
    }
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Button variant="text" onClick={onBack} startIcon={<ArrowBack />}>
          Назад
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart color="primary" />
          <Typography variant="h5">
            {plannerDishIds ? 'Покупки на неделю' : 'Список покупок'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={copied ? 'Скопировано!' : 'Скопировать список'}>
            <Button
              variant="text"
              size="small"
              onClick={copyToClipboard}
              disabled={shoppingItems.length === 0}
              startIcon={copied ? <Check /> : <ContentCopy />}
              color={copied ? 'success' : 'inherit'}
            >
              {copied ? 'Готово' : 'Копировать'}
            </Button>
          </Tooltip>
          <Button variant="text" size="small" color="secondary" onClick={clearChecked}>
            Сбросить
          </Button>
        </Box>
      </Box>

      {shoppingItems.length === 0 ? (
        <Alert severity="info">
          Список покупок пуст. Понравьтесь блюда с режимом «Немного докупить» или c учётом имеющихся ингредиентов.
        </Alert>
      ) : (
        <Box>
          {Array.from(grouped.entries()).map(([category, items]) => (
            <Paper key={category} variant="outlined" sx={{ mb: 2 }}>
              <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {INGREDIENT_CATEGORIES[category as keyof typeof INGREDIENT_CATEGORIES] ?? category}
                </Typography>
              </Box>
              <Divider />
              <List dense disablePadding>
                {items.map((ing) => (
                  <ListItem
                    key={ing.id}
                    dense
                    sx={{ px: 2, textDecoration: checked.has(ing.id) ? 'line-through' : 'none', opacity: checked.has(ing.id) ? 0.5 : 1 }}
                  >
                    <Checkbox
                      edge="start"
                      checked={checked.has(ing.id)}
                      onChange={() => toggleCheck(ing.id)}
                      size="small"
                    />
                    <ListItemText primary={ing.name} />
                  </ListItem>
                ))}
              </List>
            </Paper>
          ))}
          <Typography variant="caption" color="text.secondary">
            Куплено: {checked.size} из {shoppingItems.length}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
