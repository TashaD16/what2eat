import { Box, Typography, Paper, LinearProgress } from '@mui/material'
import { CalorieEstimate } from '../../services/openai'
import { useT } from '../../i18n/useT'

interface CalorieCardProps {
  estimate: CalorieEstimate
}

interface MacroRow {
  label: string
  value: number
  unit: string
  color: string
  max: number
}

export default function CalorieCard({ estimate }: CalorieCardProps) {
  const t = useT()
  const macros: MacroRow[] = [
    { label: t.proteinLabel, value: estimate.protein, unit: t.gUnit, color: '#1976d2', max: 60 },
    { label: t.fatLabel, value: estimate.fat, unit: t.gUnit, color: '#ed6c02', max: 80 },
    { label: t.carbsLabel, value: estimate.carbs, unit: t.gUnit, color: '#2e7d32', max: 120 },
  ]

  return (
    <Paper sx={{ p: 3 }}>
      {estimate.description && (
        <Typography variant="subtitle1" gutterBottom>
          {estimate.description}
        </Typography>
      )}

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 100,
          height: 100,
          borderRadius: '50%',
          border: '6px solid',
          borderColor: 'primary.main',
          mx: 'auto',
          mb: 3,
        }}
      >
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight={700} color="primary">
            {estimate.calories}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t.kcalUnit}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {macros.map((m) => (
          <Box key={m.label}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">{m.label}</Typography>
              <Typography variant="body2" fontWeight={600}>
                {m.value} {m.unit}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min((m.value / m.max) * 100, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'grey.200',
                '& .MuiLinearProgress-bar': { bgcolor: m.color, borderRadius: 4 },
              }}
            />
          </Box>
        ))}
      </Box>
    </Paper>
  )
}
