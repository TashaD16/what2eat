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
import { IngredientCategory } from '@what2eat/types'
import { useT } from '../../i18n/useT'

const STORAGE_KEY = 'what2eat_shopping_checked'

interface ShoppingListProps {
  onBack: () => void
  plannerDishIds?: number[]
}

interface ShoppingItem {
  name: string
  quantity: string
  unit: string
  category: IngredientCategory | 'other'
  key: string
}

export default function ShoppingList({ onBack, plannerDishIds }: ShoppingListProps) {
  const { likedDishIds } = useAppSelector((state) => state.swipe)
  const { dishes, aiDishRecipes } = useAppSelector((state) => state.dishes)
  const { ingredients: ingredientList, selectedIngredients } = useAppSelector((state) => state.ingredients)
  const t = useT()
  const catLabels: Record<IngredientCategory, string> = {
    meat: t.categoryMeat, cereals: t.categoryCereals, vegetables: t.categoryVegetables,
    dairy: t.categoryDairy, spices: t.categorySpices, other: t.categoryOther,
  }
  const [copied, setCopied] = useState(false)

  const sourceDishIds = plannerDishIds ?? likedDishIds

  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set()
    } catch {
      return new Set()
    }
  })

  const inferCategory = useMemo(() => (name: string): IngredientCategory => {
    const lower = name.toLowerCase()
    const found = ingredientList.find((i) =>
      i.name.toLowerCase().includes(lower) || lower.includes(i.name.toLowerCase())
    )
    return found?.category ?? 'other'
  }, [ingredientList])

  const shoppingItems = useMemo((): ShoppingItem[] => {
    const byKey = new Map<string, ShoppingItem>()

    const addOrMerge = (name: string, quantity: string, unit: string, category: IngredientCategory | 'other') => {
      const key = name.toLowerCase().trim()
      if (byKey.has(key)) {
        const existing = byKey.get(key)!
        if (quantity) {
          if (existing.unit === unit && unit) {
            const existQty = parseFloat(existing.quantity)
            const newQty = parseFloat(quantity)
            if (!isNaN(existQty) && !isNaN(newQty)) {
              existing.quantity = String(Math.round((existQty + newQty) * 10) / 10)
            } else {
              existing.quantity = [existing.quantity, quantity].filter(Boolean).join(', ')
            }
          } else if (!existing.quantity) {
            existing.quantity = quantity
            existing.unit = unit
          } else {
            const suffix = unit ? `${quantity} ${unit}` : quantity
            existing.quantity = [existing.quantity + (existing.unit ? ' ' + existing.unit : ''), suffix].join(' + ')
            existing.unit = ''
          }
        }
      } else {
        byKey.set(key, { name, quantity, unit, category, key })
      }
    }

    const sourceDishes = dishes.filter((d) => sourceDishIds.includes(d.id))

    for (const dish of sourceDishes) {
      const recipe = aiDishRecipes[dish.id]
      if (recipe) {
        for (const ing of recipe.ingredients) {
          addOrMerge(ing.name, ing.quantity ?? '', ing.unit ?? '', inferCategory(ing.name))
        }
      } else {
        for (const ing of dish.ingredients ?? []) {
          if (!selectedIngredients.includes(ing.id)) {
            addOrMerge(ing.name, '', '', ing.category)
          }
        }
      }
    }

    return Array.from(byKey.values())
  }, [dishes, sourceDishIds, aiDishRecipes, selectedIngredients, inferCategory])

  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingItem[]>()
    for (const item of shoppingItems) {
      if (!map.has(item.category)) map.set(item.category, [])
      map.get(item.category)!.push(item)
    }
    return map
  }, [shoppingItems])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...checked]))
  }, [checked])

  const toggleCheck = (key: string) => {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const clearChecked = () => {
    setChecked(new Set())
    localStorage.removeItem(STORAGE_KEY)
  }

  const formatQty = (item: ShoppingItem) => {
    if (!item.quantity) return ''
    return item.unit ? `${item.quantity} ${item.unit}` : item.quantity
  }

  const copyToClipboard = () => {
    const lines: string[] = [t.shoppingListHeader]
    for (const [category, items] of grouped.entries()) {
      const label = catLabels[category as IngredientCategory] ?? category
      lines.push(`${label}:`)
      items.forEach((item) => {
        const qty = formatQty(item)
        lines.push(`  • ${item.name}${qty ? ` — ${qty}` : ''}`)
      })
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
          {t.back}
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart color="primary" />
          <Typography variant="h5">
            {plannerDishIds ? t.weeklyShoppingList : t.shoppingListTitle}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={copied ? t.copied : t.copyList}>
            <Button
              variant="text"
              size="small"
              onClick={copyToClipboard}
              disabled={shoppingItems.length === 0}
              startIcon={copied ? <Check /> : <ContentCopy />}
              color={copied ? 'success' : 'inherit'}
            >
              {copied ? t.doneButton : t.copy}
            </Button>
          </Tooltip>
          <Button variant="text" size="small" color="secondary" onClick={clearChecked}>
            {t.reset}
          </Button>
        </Box>
      </Box>

      {shoppingItems.length === 0 ? (
        <Alert severity="info">
          {t.emptyShoppingList}
        </Alert>
      ) : (
        <Box>
          {Array.from(grouped.entries()).map(([category, items]) => (
            <Paper key={category} variant="outlined" sx={{ mb: 2 }}>
              <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  {catLabels[category as IngredientCategory] ?? category}
                </Typography>
              </Box>
              <Divider />
              <List dense disablePadding>
                {items.map((item) => {
                  const qty = formatQty(item)
                  return (
                    <ListItem
                      key={item.key}
                      dense
                      sx={{ px: 2, textDecoration: checked.has(item.key) ? 'line-through' : 'none', opacity: checked.has(item.key) ? 0.5 : 1 }}
                    >
                      <Checkbox
                        edge="start"
                        checked={checked.has(item.key)}
                        onChange={() => toggleCheck(item.key)}
                        size="small"
                      />
                      <ListItemText
                        primary={item.name}
                        secondary={qty || undefined}
                        secondaryTypographyProps={{ sx: { fontSize: '0.78rem', color: 'var(--w2e-primary-deep)', fontWeight: 500 } }}
                      />
                    </ListItem>
                  )
                })}
              </List>
            </Paper>
          ))}
          <Typography variant="caption" color="text.secondary">
            {t.boughtOf(checked.size, shoppingItems.length)}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
