import {
  Box,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
} from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  toggleVegetarian,
  toggleVegan,
  toggleAllowMissing,
  toggleBudget,
  setBudgetLimit,
  setCuisine,
} from '../../store/slices/filtersSlice'
import { useT } from '../../i18n/useT'

export default function SearchFilters() {
  const dispatch = useAppDispatch()
  const t = useT()
  const { vegetarianOnly, veganOnly, allowMissing, budgetEnabled, budgetLimit, cuisine } =
    useAppSelector((state) => state.filters)
  const CUISINE_OPTIONS = [
    { value: null, label: t.allCuisines },
    { value: 'russian', label: t.russian },
    { value: 'italian', label: t.italian },
    { value: 'asian', label: t.asian },
    { value: 'american', label: t.american },
  ] as const

  const NUTRITION_OPTIONS = [
    { value: 'any' as const, label: t.nutritionAny },
    { value: 'vegetarian' as const, label: t.vegetarianFilter },
    { value: 'vegan' as const, label: t.veganFilter },
  ]

  const nutritionValue = veganOnly ? 'vegan' : vegetarianOnly ? 'vegetarian' : 'any'

  const handleNutritionChange = (value: 'any' | 'vegetarian' | 'vegan') => {
    if (value === 'vegan') {
      if (!veganOnly) dispatch(toggleVegan())
    } else if (value === 'vegetarian') {
      if (veganOnly) dispatch(toggleVegan())
      if (!vegetarianOnly) dispatch(toggleVegetarian())
    } else {
      if (veganOnly) dispatch(toggleVegan())
      if (vegetarianOnly) dispatch(toggleVegetarian())
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* Кухня */}
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block' }}>
          {t.cuisine}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {CUISINE_OPTIONS.map((opt) => (
            <Chip
              key={String(opt.value)}
              label={opt.label}
              size="small"
              clickable
              onClick={() => dispatch(setCuisine(opt.value))}
              variant={cuisine === opt.value ? 'filled' : 'outlined'}
              sx={{
                fontSize: '0.78rem',
                ...(cuisine === opt.value
                  ? { bgcolor: 'rgba(29,78,216,0.12)', color: '#1d4ed8', borderColor: 'rgba(29,78,216,0.35)' }
                  : { color: 'text.secondary', borderColor: 'rgba(0,0,0,0.15)' }),
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Питание: Любое | Вегетарианское | Веганское */}
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block' }}>
          {t.nutrition}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {NUTRITION_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              size="small"
              clickable
              onClick={() => handleNutritionChange(opt.value)}
              variant={nutritionValue === opt.value ? 'filled' : 'outlined'}
              sx={{
                fontSize: '0.78rem',
                ...(nutritionValue === opt.value
                  ? { bgcolor: 'rgba(29,78,216,0.12)', color: '#1d4ed8', borderColor: 'rgba(29,78,216,0.35)' }
                  : { color: 'text.secondary', borderColor: 'rgba(0,0,0,0.15)' }),
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Бюджет в одну строку */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Бюджет */}
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5, display: 'block' }}>
            {t.budget}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={allowMissing}
                  onChange={() => dispatch(toggleAllowMissing())}
                  size="small"
                  color="warning"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: allowMissing ? '#ffb74d' : 'text.secondary', fontSize: '0.82rem' }}>
                  {t.buyMissing}
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={budgetEnabled}
                  onChange={() => dispatch(toggleBudget())}
                  size="small"
                  color="secondary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: budgetEnabled ? '#ce93d8' : 'text.secondary', fontSize: '0.82rem' }}>
                  {t.limit}
                </Typography>
              }
            />
            {budgetEnabled && (
              <TextField
                size="small"
                type="number"
                placeholder={t.sum}
                value={budgetLimit ?? ''}
                onChange={(e) => dispatch(setBudgetLimit(e.target.value ? Number(e.target.value) : null))}
                InputProps={{ endAdornment: <InputAdornment position="end">₽</InputAdornment> }}
                inputProps={{ min: 1, step: 100 }}
                sx={{ maxWidth: 120 }}
              />
            )}
          </Box>
        </Box>

      </Box>
    </Box>
  )
}
