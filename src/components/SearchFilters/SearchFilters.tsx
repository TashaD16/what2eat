import {
  Box,
  Paper,
  FormControlLabel,
  Switch,
  TextField,
  InputAdornment,
  Typography,
  Collapse,
} from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import {
  toggleVegetarian,
  toggleVegan,
  toggleAllowMissing,
  toggleBudget,
  setBudgetLimit,
} from '../../store/slices/filtersSlice'

export default function SearchFilters() {
  const dispatch = useAppDispatch()
  const { vegetarianOnly, veganOnly, allowMissing, budgetEnabled, budgetLimit } = useAppSelector(
    (state) => state.filters
  )

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        mb: 2,
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Typography
        variant="caption"
        sx={{
          color: 'rgba(255,255,255,0.35)',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          display: 'block',
          mb: 1.5,
        }}
      >
        Фильтры поиска
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        <FormControlLabel
          control={
            <Switch checked={veganOnly} onChange={() => dispatch(toggleVegan())} size="small" />
          }
          label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Только веганское</Typography>}
        />
        <FormControlLabel
          control={
            <Switch checked={vegetarianOnly} onChange={() => dispatch(toggleVegetarian())} size="small" />
          }
          label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Только вегетарианское</Typography>}
        />
        <FormControlLabel
          control={
            <Switch checked={allowMissing} onChange={() => dispatch(toggleAllowMissing())} size="small" />
          }
          label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Немного докупить</Typography>}
        />
        <FormControlLabel
          control={
            <Switch checked={budgetEnabled} onChange={() => dispatch(toggleBudget())} size="small" />
          }
          label={<Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>Бюджет</Typography>}
        />
      </Box>
      <Collapse in={budgetEnabled}>
        <Box sx={{ mt: 1.5, maxWidth: 160 }}>
          <TextField
            size="small"
            type="number"
            label="Максимум"
            value={budgetLimit ?? ''}
            onChange={(e) => dispatch(setBudgetLimit(e.target.value ? Number(e.target.value) : null))}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
            inputProps={{ min: 1, step: 1 }}
          />
        </Box>
      </Collapse>
    </Paper>
  )
}
