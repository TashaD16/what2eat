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

const CUISINE_OPTIONS = [
  { value: null, label: 'Все' },
  { value: 'russian', label: 'Русская' },
  { value: 'italian', label: 'Итальянская' },
  { value: 'asian', label: 'Азиатская' },
  { value: 'american', label: 'Американская' },
] as const

export default function SearchFilters() {
  const dispatch = useAppDispatch()
  const { vegetarianOnly, veganOnly, allowMissing, budgetEnabled, budgetLimit, cuisine } =
    useAppSelector((state) => state.filters)

  const noMeat = vegetarianOnly || veganOnly

  const handleNoMeatToggle = () => {
    if (noMeat) {
      if (veganOnly) dispatch(toggleVegan())
      if (vegetarianOnly) dispatch(toggleVegetarian())
    } else {
      dispatch(toggleVegetarian())
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

      {/* Кухня */}
      <Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mb: 0.75, display: 'block' }}>
          Кухня
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
                  ? { bgcolor: 'rgba(25,118,210,0.3)', color: '#90caf9', borderColor: 'rgba(25,118,210,0.5)' }
                  : { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }),
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Питание + Бюджет в одну строку */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* Питание */}
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mb: 0.5, display: 'block' }}>
            Питание
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={noMeat}
                onChange={handleNoMeatToggle}
                size="small"
                color="success"
              />
            }
            label={
              <Typography variant="body2" sx={{ color: noMeat ? '#81c784' : 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                Без мяса
              </Typography>
            }
          />
        </Box>

        {/* Бюджет */}
        <Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mb: 0.5, display: 'block' }}>
            Бюджет
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
                <Typography variant="body2" sx={{ color: allowMissing ? '#ffb74d' : 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                  Докупить
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
                <Typography variant="body2" sx={{ color: budgetEnabled ? '#ce93d8' : 'rgba(255,255,255,0.5)', fontSize: '0.82rem' }}>
                  Лимит
                </Typography>
              }
            />
            {budgetEnabled && (
              <TextField
                size="small"
                type="number"
                placeholder="Сумма"
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
