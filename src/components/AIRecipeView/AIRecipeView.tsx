import { Box, Typography, Button, Chip, CircularProgress, Alert, Divider, List, ListItem, ListItemText } from '@mui/material'
import { ArrowBack, AutoAwesome, Save, AccessTime, Restaurant } from '@mui/icons-material'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { clearAIRecipe, saveGeneratedRecipe } from '../../store/slices/aiRecipeSlice'
import { useState } from 'react'

const DIFFICULTY_LABELS = { easy: 'Просто', medium: 'Средне', hard: 'Сложно' }
const DIFFICULTY_COLORS = { easy: '#4CAF50', medium: '#FF9800', hard: '#f44336' } as const

interface AIRecipeViewProps {
  onBack: () => void
}

export default function AIRecipeView({ onBack }: AIRecipeViewProps) {
  const dispatch = useAppDispatch()
  const { generatedRecipe, loading, error } = useAppSelector((state) => state.aiRecipe)
  const { user } = useAppSelector((state) => state.auth)
  const [saved, setSaved] = useState(false)

  const handleBack = () => {
    dispatch(clearAIRecipe())
    onBack()
  }

  const handleSave = async () => {
    if (!generatedRecipe || !user) return
    await dispatch(saveGeneratedRecipe({ userId: user.id, recipe: generatedRecipe }))
    setSaved(true)
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary" sx={{ textAlign: 'center' }}>
          Ищем рецепт в открытых источниках<br />и переводим на русский...
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Button onClick={handleBack} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
          Назад
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!generatedRecipe) return null

  const recipe = generatedRecipe

  return (
    <Box>
      {/* Hero photo */}
      {recipe.image_url && (
        <Box
          sx={{
            position: 'relative',
            height: 300,
            borderRadius: 4,
            overflow: 'hidden',
            mb: 3,
          }}
        >
          <Box
            component="img"
            src={recipe.image_url}
            alt={recipe.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(10,10,10,0.85) 0%, rgba(10,10,10,0.2) 55%, transparent 100%)',
            }}
          />
          <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <AutoAwesome sx={{ color: '#FF9500', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#FF9500', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Рецепт из открытых источников
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, lineHeight: 1.15, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
              {recipe.name}
            </Typography>
          </Box>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: recipe.image_url ? 2 : 3 }}>
        <Button onClick={handleBack} startIcon={<ArrowBack />}>
          Назад
        </Button>
        {user && !saved && (
          <Button variant="outlined" startIcon={<Save />} onClick={handleSave} size="small">
            Сохранить
          </Button>
        )}
        {saved && (
          <Chip label="Сохранено" color="success" size="small" />
        )}
      </Box>

      {/* Header (when no photo) */}
      {!recipe.image_url && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AutoAwesome sx={{ color: '#FF9500', fontSize: 20 }} />
            <Typography variant="caption" sx={{ color: '#FF9500', fontWeight: 600, textTransform: 'uppercase' }}>
              AI-рецепт
            </Typography>
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            {recipe.name}
          </Typography>
        </Box>
      )}

      {/* Description + chips */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {recipe.description}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            icon={<AccessTime sx={{ fontSize: 16 }} />}
            label={`${recipe.cooking_time} мин`}
            size="small"
            variant="outlined"
          />
          <Chip
            label={DIFFICULTY_LABELS[recipe.difficulty]}
            size="small"
            sx={{ bgcolor: DIFFICULTY_COLORS[recipe.difficulty], color: 'white', fontWeight: 600 }}
          />
        </Box>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Ingredients */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
          <Restaurant sx={{ fontSize: 20 }} /> Ингредиенты
        </Typography>
        <List dense disablePadding>
          {recipe.ingredients.map((ing, i) => (
            <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
              <ListItemText
                primary={
                  <Typography variant="body2">
                    <strong>{ing.name}</strong> — {ing.quantity} {ing.unit}
                  </Typography>
                }
              />
            </ListItem>
          ))}
        </List>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Instructions */}
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
          Приготовление
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {recipe.instructions.map((step) => (
            <Box key={step.step} sx={{ display: 'flex', gap: 2 }}>
              <Box
                sx={{
                  minWidth: 32,
                  height: 32,
                  borderRadius: '50%',
                  bgcolor: '#FF9500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  flexShrink: 0,
                  mt: 0.25,
                }}
              >
                {step.step}
              </Box>
              <Typography variant="body2" sx={{ pt: 0.5, lineHeight: 1.6 }}>
                {step.description}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </Box>
  )
}
