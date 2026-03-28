import { useState, useCallback } from 'react'
import {
  Box, Typography, Button, IconButton, Paper, Chip, TextField,
  Autocomplete, Alert, Snackbar,
} from '@mui/material'
import { ArrowBack, Delete, Add, Search, Warning } from '@mui/icons-material'
import { useAppSelector } from '../../hooks/redux'
import { useT } from '../../i18n/useT'
import {
  getPantry, addPantryItem, removePantryItem, getExpiryStatus, PantryItem,
} from '../../services/pantry'
import type { Ingredient } from '@what2eat/types'

interface PantryViewProps {
  onBack: () => void
  onFindRecipes: (ingredientIds: number[]) => void
}

function ExpiryChip({ item, t }: { item: PantryItem; t: ReturnType<typeof useT> }) {
  const status = getExpiryStatus(item)
  if (!item.expiresAt) return null

  const date = new Date(item.expiresAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })
  const color = status === 'expired' ? 'error' : status === 'soon' ? 'warning' : 'default'
  const label = status === 'expired'
    ? `${t.pantryExpired} ${date}`
    : status === 'soon'
    ? `${t.pantryExpiresSoon} ${date}`
    : date

  return (
    <Chip
      size="small"
      icon={status !== 'ok' ? <Warning sx={{ fontSize: '12px !important' }} /> : undefined}
      label={label}
      color={color as any}
      variant={status !== 'ok' ? 'filled' : 'outlined'}
      sx={{ fontSize: '0.68rem', height: 22 }}
    />
  )
}

export default function PantryView({ onBack, onFindRecipes }: PantryViewProps) {
  const t = useT()
  const { ingredients } = useAppSelector((state) => state.ingredients)
  const [items, setItems] = useState<PantryItem[]>(() => getPantry())
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null)
  const [customName, setCustomName] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [addedSnack, setAddedSnack] = useState(false)

  const refresh = useCallback(() => setItems(getPantry()), [])

  const handleAdd = () => {
    const name = selectedIngredient?.name ?? customName.trim()
    if (!name) return
    addPantryItem({
      name,
      ingredientId: selectedIngredient?.id,
      expiresAt: expiresAt || undefined,
    })
    setSelectedIngredient(null)
    setCustomName('')
    setExpiresAt('')
    refresh()
    setAddedSnack(true)
  }

  const handleRemove = (id: string) => {
    removePantryItem(id)
    refresh()
  }

  const handleFindRecipes = () => {
    const ids = items
      .filter(i => i.ingredientId != null)
      .map(i => i.ingredientId as number)
    if (ids.length === 0) return
    onFindRecipes(ids)
  }

  const expiringSoon = items.filter(i => {
    const s = getExpiryStatus(i)
    return s === 'expired' || s === 'soon'
  })

  const knownIngredientIds = items
    .filter(i => i.ingredientId != null)
    .map(i => i.ingredientId as number)

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="text" onClick={onBack} startIcon={<ArrowBack />}>
          {t.back}
        </Button>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          🥦 {t.pantryTitle}
        </Typography>
        {items.length > 0 && (
          <Chip label={items.length} size="small" sx={{ bgcolor: 'rgba(var(--w2e-primary-rgb),0.12)', color: 'var(--w2e-primary-deep)', fontWeight: 700 }} />
        )}
      </Box>

      {/* Expiring warning */}
      {expiringSoon.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2.5, borderRadius: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {t.pantryExpiringWarning(expiringSoon.length)}:
          </Typography>
          <Typography variant="body2">
            {expiringSoon.map(i => i.name).join(', ')}
          </Typography>
        </Alert>
      )}

      {/* Find recipes button */}
      {knownIngredientIds.length > 0 && (
        <Button
          variant="contained"
          fullWidth
          startIcon={<Search />}
          onClick={handleFindRecipes}
          sx={{ mb: 3, py: 1.25, fontWeight: 700 }}
        >
          {t.pantryFindRecipes(knownIngredientIds.length)}
        </Button>
      )}

      {/* Add item form */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          background: 'rgba(var(--w2e-tint-rgb),0.50)',
          border: '1px solid rgba(var(--w2e-primary-rgb),0.20)',
          borderRadius: 3,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
          {t.pantryAddItem}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Autocomplete
            options={ingredients}
            getOptionLabel={(o) => o.name}
            value={selectedIngredient}
            onChange={(_, val) => { setSelectedIngredient(val); if (val) setCustomName('') }}
            renderInput={(params) => (
              <TextField {...params} size="small" label={t.pantrySelectIngredient} />
            )}
          />
          {!selectedIngredient && (
            <TextField
              size="small"
              label={t.pantryCustomName}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
          )}
          <TextField
            size="small"
            type="date"
            label={t.pantryExpiresAt}
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAdd}
            disabled={!selectedIngredient && !customName.trim()}
          >
            {t.pantryAddBtn}
          </Button>
        </Box>
      </Paper>

      {/* Pantry items */}
      {items.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.disabled' }}>
          <Typography sx={{ fontSize: 48 }}>🥦</Typography>
          <Typography variant="body1" sx={{ mt: 1 }}>{t.pantryEmpty}</Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {items.map(item => (
            <Paper
              key={item.id}
              sx={{
                px: 2,
                py: 1.25,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                border: '1px solid',
                borderColor: getExpiryStatus(item) === 'expired'
                  ? 'rgba(211,47,47,0.35)'
                  : getExpiryStatus(item) === 'soon'
                  ? 'rgba(237,108,2,0.35)'
                  : 'rgba(var(--w2e-primary-rgb),0.15)',
                borderRadius: 2,
                bgcolor: getExpiryStatus(item) === 'expired'
                  ? 'rgba(211,47,47,0.05)'
                  : getExpiryStatus(item) === 'soon'
                  ? 'rgba(237,108,2,0.05)'
                  : 'transparent',
              }}
            >
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>{item.name}</Typography>
              <ExpiryChip item={item} t={t} />
              <IconButton size="small" onClick={() => handleRemove(item.id)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                <Delete fontSize="small" />
              </IconButton>
            </Paper>
          ))}
        </Box>
      )}

      <Snackbar
        open={addedSnack}
        autoHideDuration={1800}
        onClose={() => setAddedSnack(false)}
        message={t.pantryAdded}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
