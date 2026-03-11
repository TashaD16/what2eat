import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Collapse,
  TextField,
  InputAdornment,
  Badge,
} from '@mui/material'
import { ExpandMore, Tune } from '@mui/icons-material'
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
  const [expanded, setExpanded] = useState(false)

  const dietValue = veganOnly ? 'vegan' : vegetarianOnly ? 'vegetarian' : 'all'

  const handleDietChange = (_: React.MouseEvent, value: string | null) => {
    if (!value) return
    if (value === 'vegan') {
      if (!veganOnly) dispatch(toggleVegan())
    } else if (value === 'vegetarian') {
      if (!vegetarianOnly) dispatch(toggleVegetarian())
    } else {
      if (veganOnly) dispatch(toggleVegan())
      if (vegetarianOnly) dispatch(toggleVegetarian())
    }
  }

  const activeCount = [
    vegetarianOnly || veganOnly,
    cuisine != null,
    allowMissing,
    budgetEnabled,
  ].filter(Boolean).length

  return (
    <Paper
      variant="outlined"
      sx={{
        mb: 2,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}
    >
      {/* Header row */}
      <Box
        onClick={() => setExpanded((v) => !v)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 1.25,
          cursor: 'pointer',
          userSelect: 'none',
          '&:hover': { background: 'rgba(255,255,255,0.03)' },
        }}
      >
        <Tune sx={{ fontSize: 16, color: 'rgba(255,255,255,0.45)' }} />
        <Typography
          variant="caption"
          sx={{
            color: 'rgba(255,255,255,0.45)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            flex: 1,
          }}
        >
          Фильтры
        </Typography>

        {/* Active filter chips shown when collapsed */}
        {!expanded && activeCount > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {(vegetarianOnly || veganOnly) && (
              <Chip
                label={veganOnly ? 'Веган' : 'Вегет.'}
                size="small"
                sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(76,175,80,0.2)', color: '#81c784' }}
              />
            )}
            {cuisine && (
              <Chip
                label={CUISINE_OPTIONS.find((o) => o.value === cuisine)?.label}
                size="small"
                sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(25,118,210,0.2)', color: '#64b5f6' }}
              />
            )}
            {allowMissing && (
              <Chip
                label="Докупить"
                size="small"
                sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(255,152,0,0.2)', color: '#ffb74d' }}
              />
            )}
            {budgetEnabled && (
              <Chip
                label="Бюджет"
                size="small"
                sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(156,39,176,0.2)', color: '#ce93d8' }}
              />
            )}
          </Box>
        )}

        <Badge badgeContent={activeCount} color="primary" sx={{ mr: 0.5 }}>
          <ExpandMore
            sx={{
              fontSize: 20,
              color: 'rgba(255,255,255,0.35)',
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
            }}
          />
        </Badge>
      </Box>

      {/* Expanded content */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Diet filter */}
          <Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', mb: 0.75, display: 'block' }}>
              Питание
            </Typography>
            <ToggleButtonGroup
              exclusive
              value={dietValue}
              onChange={handleDietChange}
              size="small"
              sx={{
                '& .MuiToggleButton-root': {
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.78rem',
                  color: 'rgba(255,255,255,0.5)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  '&.Mui-selected': {
                    color: '#81c784',
                    bgcolor: 'rgba(76,175,80,0.15)',
                    borderColor: 'rgba(76,175,80,0.4)',
                    '&:hover': { bgcolor: 'rgba(76,175,80,0.2)' },
                  },
                },
              }}
            >
              <ToggleButton value="all">Все</ToggleButton>
              <ToggleButton value="vegetarian">Вегетарианское</ToggleButton>
              <ToggleButton value="vegan">Веганское</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Cuisine filter */}
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

          {/* Allow missing + Budget */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            <Chip
              label="Немного докупить"
              size="small"
              clickable
              onClick={() => dispatch(toggleAllowMissing())}
              variant={allowMissing ? 'filled' : 'outlined'}
              sx={{
                fontSize: '0.78rem',
                ...(allowMissing
                  ? { bgcolor: 'rgba(255,152,0,0.25)', color: '#ffb74d', borderColor: 'rgba(255,152,0,0.5)' }
                  : { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }),
              }}
            />
            <Chip
              label={budgetEnabled && budgetLimit ? `Бюджет ≤ ${budgetLimit}₽` : 'Бюджет'}
              size="small"
              clickable
              onClick={() => dispatch(toggleBudget())}
              variant={budgetEnabled ? 'filled' : 'outlined'}
              sx={{
                fontSize: '0.78rem',
                ...(budgetEnabled
                  ? { bgcolor: 'rgba(156,39,176,0.25)', color: '#ce93d8', borderColor: 'rgba(156,39,176,0.5)' }
                  : { color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.15)' }),
              }}
            />
          </Box>

          {/* Budget input */}
          <Collapse in={budgetEnabled}>
            <TextField
              size="small"
              type="number"
              label="Максимум"
              value={budgetLimit ?? ''}
              onChange={(e) => dispatch(setBudgetLimit(e.target.value ? Number(e.target.value) : null))}
              InputProps={{
                endAdornment: <InputAdornment position="end">₽</InputAdornment>,
              }}
              inputProps={{ min: 1, step: 1 }}
              sx={{ maxWidth: 160 }}
            />
          </Collapse>
        </Box>
      </Collapse>
    </Paper>
  )
}
