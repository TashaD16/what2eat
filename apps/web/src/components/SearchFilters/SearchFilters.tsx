import {
  Box,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  IconButton,
} from '@mui/material'
import Close from '@mui/icons-material/Close'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  toggleVegetarian,
  toggleVegan,
  toggleAllowMissing,
  toggleBudget,
  setBudgetLimit,
  setCuisine,
  setCaloriesMax,
  setProteinMax,
  setFatMax,
  setCarbsMax,
  setCookingTimeMax,
} from '../../store/slices/filtersSlice'
import { useT } from '../../i18n/useT'

export default function SearchFilters() {
  const dispatch = useAppDispatch()
  const t = useT()
  const { vegetarianOnly, veganOnly, allowMissing, budgetEnabled, budgetLimit, cuisine, caloriesMax, proteinMax, fatMax, carbsMax, cookingTimeMax } =
    useAppSelector((state) => state.filters)
  const COOKING_TIME_OPTIONS = [
    { value: null, label: t.allCuisines },
    { value: 20, label: t.min(20) },
    { value: 40, label: t.min(40) },
    { value: 65, label: t.min(65) },
  ] as const

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

      {/* Время готовки */}
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block' }}>
          {t.cookingTimeFilter}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
          {COOKING_TIME_OPTIONS.map((opt) => (
            <Chip
              key={String(opt.value)}
              label={opt.label}
              size="small"
              clickable
              onClick={() => dispatch(setCookingTimeMax(opt.value))}
              variant={cookingTimeMax === opt.value ? 'filled' : 'outlined'}
              sx={{
                fontSize: '0.78rem',
                ...(cookingTimeMax === opt.value
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

      {/* КБЖУ в одну строку */}
      <Box>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.75, display: 'block' }}>
          {t.kbjuMax}
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {([
            { label: t.caloriesLabel, unit: t.kcalUnit, value: caloriesMax, step: 50, min: 100, set: (v: number | null) => dispatch(setCaloriesMax(v)) },
            { label: t.proteinLabel, unit: t.gUnit, value: proteinMax, step: 5, min: 1, set: (v: number | null) => dispatch(setProteinMax(v)) },
            { label: t.fatLabel, unit: t.gUnit, value: fatMax, step: 5, min: 1, set: (v: number | null) => dispatch(setFatMax(v)) },
            { label: t.carbsLabel, unit: t.gUnit, value: carbsMax, step: 5, min: 1, set: (v: number | null) => dispatch(setCarbsMax(v)) },
          ] as const).map(({ label, unit, value, step, min, set }) => (
            <TextField
              key={label}
              size="small"
              type="number"
              placeholder={label}
              value={value ?? ''}
              onChange={(e) => set(e.target.value ? Number(e.target.value) : null)}
              InputProps={{
                endAdornment: <InputAdornment position="end">{unit}</InputAdornment>,
                ...(value != null && {
                  startAdornment: (
                    <InputAdornment position="start">
                      <IconButton size="small" onClick={() => set(null)} edge="start">
                        <Close fontSize="inherit" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }),
              }}
              inputProps={{ min, step }}
              sx={{ width: 120 }}
            />
          ))}
        </Box>
      </Box>

    </Box>
  )
}
