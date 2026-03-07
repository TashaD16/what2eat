import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material'
import { ArrowBack, AccessTime, People } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { clearRecipe } from '../../store/slices/recipeSlice'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '../../utils/constants'
import { Difficulty } from '../../types'
import { getDishImageUrl } from '../../utils/imageUtils'

interface RecipeViewProps {
  onBack: () => void
}

export default function RecipeView({ onBack }: RecipeViewProps) {
  const dispatch = useAppDispatch()
  const { currentRecipe, loading, error } = useAppSelector((state) => state.recipe)

  const handleBack = () => {
    dispatch(clearRecipe())
    onBack()
  }

  const getDifficultyColor = (difficulty: Difficulty) => {
    return DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.easy
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 8 }}>
        <CircularProgress sx={{ color: '#FF4D4D' }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
          Назад
        </Button>
      </Box>
    )
  }

  if (!currentRecipe) {
    return (
      <Box>
        <Alert severity="info">Рецепт не найден</Alert>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />} sx={{ mt: 2 }}>
          Назад
        </Button>
      </Box>
    )
  }

  const imageUrl = getDishImageUrl(currentRecipe.dish_name, currentRecipe.image_url)

  return (
    <Box>
      {/* Hero image with overlay */}
      <Box
        sx={{
          position: 'relative',
          height: 340,
          borderRadius: 4,
          overflow: 'hidden',
          mb: 3,
        }}
      >
        <Box
          component="img"
          src={imageUrl}
          alt={currentRecipe.dish_name}
          sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.3) 50%, transparent 100%)',
          }}
        />
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 3 }}>
          <Button
            variant="text"
            onClick={handleBack}
            startIcon={<ArrowBack />}
            size="small"
            sx={{ mb: 1.5, color: 'rgba(255,255,255,0.7)', '&:hover': { color: 'white' } }}
          >
            Назад
          </Button>
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              textShadow: '0 2px 16px rgba(0,0,0,0.5)',
            }}
          >
            {currentRecipe.dish_name}
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2.5, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'rgba(255,255,255,0.9)' }}>
              Информация
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Chip
                icon={<AccessTime />}
                label={`${currentRecipe.cooking_time} минут`}
                variant="outlined"
              />
              <Chip
                icon={<People />}
                label={`${currentRecipe.servings} порций`}
                variant="outlined"
              />
              <Chip
                label={DIFFICULTY_LABELS[currentRecipe.difficulty]}
                sx={{ bgcolor: getDifficultyColor(currentRecipe.difficulty), color: 'white', fontWeight: 600 }}
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'rgba(255,255,255,0.9)' }}>
              Ингредиенты
            </Typography>
            <List dense disablePadding>
              {currentRecipe.ingredients.map((ing, index) => (
                <ListItem key={index} sx={{ px: 0, py: 0.5 }}>
                  <ListItemText
                    primary={<Typography variant="body2" sx={{ fontWeight: 500 }}>{ing.ingredient_name}</Typography>}
                    secondary={<Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>{ing.quantity} {ing.unit}</Typography>}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2.5, color: 'rgba(255,255,255,0.9)' }}>
              Инструкция
            </Typography>
            <Divider sx={{ mb: 2.5 }} />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {currentRecipe.instructions.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.07, duration: 0.3 }}
                >
                  <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start', px: 0, py: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #FF4D4D 0%, #FF9500 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 12px rgba(255,77,77,0.35)',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>
                          {step.step}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>
                      {step.description}
                    </Typography>
                    {index < currentRecipe.instructions.length - 1 && (
                      <Divider sx={{ width: '100%', mt: 2 }} />
                    )}
                  </ListItem>
                </motion.div>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
