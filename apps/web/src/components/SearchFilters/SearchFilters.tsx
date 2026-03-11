import { useState } from 'react'
import {
  Box,
  Paper,
  Typography,
  Chip,
  Collapse,
  TextField,
  InputAdornment,
  Badge,
  Switch,
  FormControlLabel,
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

  const noMeat = vegetarianOnly || veganOnly

  const handleNoMeatToggle = () => {
    if (noMeat) {
      if (veganOnly) dispatch(toggleVegan())
      if (vegetarianOnly) dispatch(toggleVegetarian())
    } else {
      dispatch(toggleVegetarian())
    }
  }

  const activeCount = [noMeat, cuisine != null, allowMissing, budgetEnabled].filter(Boolean).length

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
      {/* Header */}
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

        {/* Active chips when collapsed */}
        {!expanded && activeCount > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {noMeat && (
              <Chip label="Без мяса" size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(76,175,80,0.2)', color: '#81c784' }} />
            )}
            {cuisine && (
              <Chip label={CUISINE_OPTIONS.find((o) => o.value === cuisine)?.label} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(25,118,210,0.2)', color: '#64b5f6' }} />
            )}
            {allowMissing && (
              <Chip label="Докупить" size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(255,152,0,0.2)', color: '#ffb74d' }} />
            )}
            {budgetEnabled && (
              <Chip label={budgetLimit ? `≤${budgetLimit}₽` : 'Бюджет'} size="small" sx={{ height: 20, fontSize: '0.68rem', bgcolor: 'rgba(156,39,176,0.2)', color: '#ce93d8' }} />
            )}
          </Box>
        )}

        <Badge badgeContent={activeCount} color="primary" sx={{ mr: 0.5 }}>
          <ExpandMore sx={{ fontSize: 20, color: 'rgba(255,255,255,0.35)', transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </Badge>
      </Box>

      {/* Expanded */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2, pt: 0.5, display: 'flex', flexDirection: 'column', gap: 2 }}>

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
      </Collapse>
    </Paper>
  )
}
