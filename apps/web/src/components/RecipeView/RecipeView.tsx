import { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  Divider,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Grid,
  IconButton,
} from '@mui/material'
import { ArrowBack, AccessTime, People, FiberManualRecord, Favorite, Close, Add, Remove } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { clearRecipe } from '../../store/slices/recipeSlice'
import { likeDish, unlikeDish, dislikeDish } from '../../store/slices/swipeSlice'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@what2eat/constants'
import { Difficulty } from '@what2eat/types'
import { getDishImageUrl } from '../../utils/imageUtils'

interface RecipeViewProps {
  onBack: () => void
}

export default function RecipeView({ onBack }: RecipeViewProps) {
  const dispatch = useAppDispatch()
  const { currentRecipe, loading, error } = useAppSelector((state) => state.recipe)
  const { likedDishIds, dislikedDishIds } = useAppSelector((state) => state.swipe)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const [servings, setServings] = useState<number | null>(null)

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
  const dishId = currentRecipe.dish_id
  const isLiked = likedDishIds.includes(dishId)
  const isDisliked = dislikedDishIds.includes(dishId)
  const baseServings = currentRecipe.servings
  const currentServings = servings ?? baseServings
  const servingsScale = currentServings / baseServings

  const scaleQty = (qty: number) => {
    const scaled = qty * servingsScale
    // Show integer if clean, else 1 decimal place
    return scaled % 1 === 0 ? scaled : parseFloat(scaled.toFixed(1))
  }

  const handleLike = () => {
    if (isLiked) {
      dispatch(unlikeDish({ dishId, userId }))
    } else {
      dispatch(likeDish({ dishId, userId }))
    }
  }

  const handleDislike = () => {
    if (isLiked) dispatch(unlikeDish({ dishId, userId }))
    dispatch(dislikeDish({ dishId, userId }))
  }

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
              mb: currentRecipe.description ? 1 : 0,
            }}
          >
            {currentRecipe.dish_name}
          </Typography>
          {currentRecipe.description && (
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.75)',
                lineHeight: 1.5,
                textShadow: '0 1px 8px rgba(0,0,0,0.6)',
                maxWidth: 560,
              }}
            >
              {currentRecipe.description}
            </Typography>
          )}
        </Box>

        {/* Like / Dislike buttons on photo */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            display: 'flex',
            gap: 1.5,
          }}
        >
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}>
            <IconButton
              onClick={handleDislike}
              sx={{
                width: 52,
                height: 52,
                background: isDisliked ? 'rgba(255,77,77,0.35)' : 'rgba(255,77,77,0.18)',
                border: `2px solid ${isDisliked ? 'rgba(255,77,77,0.85)' : isLiked ? 'rgba(255,77,77,0.7)' : 'rgba(255,77,77,0.4)'}`,
                backdropFilter: 'blur(10px)',
                color: '#FF4D4D',
                '&:hover': { background: 'rgba(255,77,77,0.32)' },
              }}
            >
              <Close sx={{ fontSize: 24 }} />
            </IconButton>
          </motion.div>

          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}>
            <IconButton
              onClick={handleLike}
              sx={{
                width: 52,
                height: 52,
                background: isLiked ? 'rgba(34,197,94,0.35)' : 'rgba(34,197,94,0.18)',
                border: `2px solid ${isLiked ? 'rgba(34,197,94,0.85)' : 'rgba(34,197,94,0.4)'}`,
                backdropFilter: 'blur(10px)',
                color: '#22C55E',
                boxShadow: isLiked ? '0 0 16px rgba(34,197,94,0.4)' : 'none',
                '&:hover': { background: 'rgba(34,197,94,0.32)' },
              }}
            >
              <Favorite sx={{ fontSize: 24 }} />
            </IconButton>
          </motion.div>
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
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, border: '1px solid rgba(255,255,255,0.23)', borderRadius: 4, px: 1, py: 0.25 }}>
                <People sx={{ fontSize: 18, color: 'text.secondary', ml: 0.5 }} />
                <IconButton size="small" onClick={() => setServings(Math.max(1, currentServings - 1))} sx={{ p: 0.25 }}>
                  <Remove sx={{ fontSize: 16 }} />
                </IconButton>
                <Typography variant="body2" sx={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>
                  {currentServings}
                </Typography>
                <IconButton size="small" onClick={() => setServings(currentServings + 1)} sx={{ p: 0.25 }}>
                  <Add sx={{ fontSize: 16 }} />
                </IconButton>
                <Typography variant="body2" sx={{ color: 'text.secondary', mr: 0.5 }}>порций</Typography>
              </Box>
              <Chip
                label={DIFFICULTY_LABELS[currentRecipe.difficulty]}
                sx={{ bgcolor: getDifficultyColor(currentRecipe.difficulty), color: 'white', fontWeight: 600 }}
              />
            </Box>
          </Paper>

          <Paper sx={{ p: 2.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: 'rgba(255,255,255,0.9)' }}>
              Ингредиенты
            </Typography>
            <List dense disablePadding>
              {currentRecipe.ingredients.map((ing, index) => (
                <ListItem
                  key={index}
                  sx={{
                    px: 0,
                    py: 0.75,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: index < currentRecipe.ingredients.length - 1
                      ? '1px solid rgba(255,255,255,0.06)'
                      : 'none',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <FiberManualRecord sx={{ fontSize: 6, color: '#FF9500', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
                      {ing.ingredient_name}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${scaleQty(ing.quantity)} ${ing.unit}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,149,0,0.12)',
                      color: '#FF9500',
                      border: '1px solid rgba(255,149,0,0.25)',
                      fontWeight: 600,
                      fontSize: '0.72rem',
                      height: 22,
                      flexShrink: 0,
                    }}
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
