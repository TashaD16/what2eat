import { Box, Typography, Button, Chip, CircularProgress, Alert, Divider, List, ListItem, Paper, IconButton, Collapse } from '@mui/material'
import { ArrowBack, AutoAwesome, Save, AccessTime, People, FiberManualRecord, Favorite, Close, Add, Remove, PlayCircleOutline, ExpandMore, ExpandLess } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { clearAIRecipe, saveGeneratedRecipe } from '../../store/slices/aiRecipeSlice'
import { likeDish, unlikeDish, dislikeDish } from '../../store/slices/swipeSlice'
import { useState } from 'react'
import { useT } from '../../i18n/useT'

const DIFFICULTY_COLORS_LOCAL = { easy: '#16a34a', medium: '#D97706', hard: '#dc2626' } as const

interface AIRecipeViewProps {
  dishId: number | null
  onBack: () => void
}

export default function AIRecipeView({ dishId, onBack }: AIRecipeViewProps) {
  const dispatch = useAppDispatch()
  const { generatedRecipe, loading, error } = useAppSelector((state) => state.aiRecipe)
  const { likedDishIds, dislikedDishIds } = useAppSelector((state) => state.swipe)
  const { user } = useAppSelector((state) => state.auth)
  const userId = user?.id
  const t = useT()
  const [saved, setSaved] = useState(false)
  const [servings, setServings] = useState<number | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)

  const isLiked = dishId !== null && likedDishIds.includes(dishId)
  const isDisliked = dishId !== null && dislikedDishIds.includes(dishId)

  const handleBack = () => {
    dispatch(clearAIRecipe())
    onBack()
  }

  const handleSave = async () => {
    if (!generatedRecipe || !user) return
    await dispatch(saveGeneratedRecipe({ userId: user.id, recipe: generatedRecipe }))
    setSaved(true)
  }

  const handleLike = () => {
    if (dishId === null) return
    if (isLiked) {
      dispatch(unlikeDish({ dishId, userId }))
    } else {
      dispatch(likeDish({ dishId, userId }))
    }
  }

  const handleDislike = () => {
    if (dishId === null) return
    if (isLiked) dispatch(unlikeDish({ dishId, userId }))
    dispatch(dislikeDish({ dishId, userId }))
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 8, gap: 2 }}>
        <CircularProgress size={48} />
        <Typography color="text.secondary" sx={{ textAlign: 'center', whiteSpace: 'pre-line' }}>
          {t.searchingRecipe}
        </Typography>
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Button onClick={handleBack} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
          {t.nazad}
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!generatedRecipe) return null

  const recipe = generatedRecipe

  const getYoutubeEmbedUrl = (url: string): string | null => {
    const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)
    return m ? `https://www.youtube.com/embed/${m[1]}?rel=0&modestbranding=1` : null
  }

  const baseServings = 2
  const currentServings = servings ?? baseServings
  const servingsScale = currentServings / baseServings
  const scaleQty = (qty: number | string) => {
    const n = parseFloat(String(qty))
    if (isNaN(n)) return qty
    const scaled = n * servingsScale
    return scaled % 1 === 0 ? scaled : parseFloat(scaled.toFixed(1))
  }

  return (
    <Box>
      {/* Hero photo */}
      <Box
        sx={{
          position: 'relative',
          height: recipe.image_url ? 340 : 'auto',
          borderRadius: 4,
          overflow: recipe.image_url ? 'hidden' : 'visible',
          mb: 3,
        }}
      >
        {recipe.image_url && (
          <>
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
                background: 'linear-gradient(to top, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.3) 50%, transparent 100%)',
              }}
            />
          </>
        )}

        <Box sx={{ position: recipe.image_url ? 'absolute' : 'static', bottom: 0, left: 0, right: 0, p: recipe.image_url ? 3 : 0 }}>
          <Button
            variant="text"
            onClick={handleBack}
            startIcon={<ArrowBack />}
            size="small"
            sx={{ mb: 1.5, color: recipe.image_url ? 'rgba(255,255,255,0.7)' : 'text.secondary', '&:hover': { color: recipe.image_url ? 'white' : 'text.primary' } }}
          >
            {t.nazad}
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <AutoAwesome sx={{ color: '#20C997', fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: '#20C997', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {t.recipeSource}
            </Typography>
          </Box>
          <Typography
            variant="h3"
            sx={{
              color: recipe.image_url ? 'white' : 'text.primary',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              textShadow: recipe.image_url ? '0 2px 16px rgba(0,0,0,0.5)' : 'none',
              mb: recipe.description ? 1 : 0,
            }}
          >
            {recipe.name}
          </Typography>
          {recipe.description && (
            <Typography
              variant="body2"
              sx={{
                color: recipe.image_url ? 'rgba(255,255,255,0.75)' : 'text.secondary',
                lineHeight: 1.5,
                textShadow: recipe.image_url ? '0 1px 8px rgba(0,0,0,0.6)' : 'none',
                maxWidth: 560,
              }}
            >
              {recipe.description}
            </Typography>
          )}
        </Box>

        {/* Like / Dislike + Save buttons */}
        {dishId !== null && recipe.image_url && (
          <Box sx={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 1.5 }}>
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.88 }}>
              <IconButton
                onClick={handleDislike}
                sx={{
                  width: 52, height: 52,
                  background: isDisliked ? 'rgba(255,77,77,0.55)' : 'rgba(255,77,77,0.35)',
                  border: `2px solid ${isDisliked ? 'rgba(255,77,77,0.85)' : 'rgba(255,77,77,0.65)'}`,
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
                  width: 52, height: 52,
                  background: isLiked ? 'rgba(34,197,94,0.55)' : 'rgba(34,197,94,0.35)',
                  border: `2px solid ${isLiked ? 'rgba(34,197,94,0.85)' : 'rgba(34,197,94,0.65)'}`,
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
        )}
      </Box>

      {/* Save button row (when no image) */}
      {!recipe.image_url && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2, gap: 1 }}>
          {dishId !== null && (
            <>
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}>
                <IconButton onClick={handleDislike} sx={{ color: '#FF4D4D', border: '1.5px solid rgba(255,77,77,0.55)', bgcolor: isDisliked ? 'rgba(255,77,77,0.15)' : 'transparent' }}>
                  <Close />
                </IconButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.9 }}>
                <IconButton onClick={handleLike} sx={{ color: '#22C55E', border: '1.5px solid rgba(34,197,94,0.55)', bgcolor: isLiked ? 'rgba(34,197,94,0.15)' : 'transparent' }}>
                  <Favorite />
                </IconButton>
              </motion.div>
            </>
          )}
          {user && !saved && (
            <Button variant="outlined" startIcon={<Save />} onClick={handleSave} size="small">
              {t.save}
            </Button>
          )}
          {saved && <Chip label={t.saved} color="success" size="small" />}
        </Box>
      )}

      {/* Save button (when image exists) */}
      {recipe.image_url && user && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          {!saved ? (
            <Button variant="outlined" startIcon={<Save />} onClick={handleSave} size="small">
              {t.save}
            </Button>
          ) : (
            <Chip label={t.saved} color="success" size="small" />
          )}
        </Box>
      )}

      {/* ── Video section ── */}
      {recipe.youtube_url && (() => {
        const embedUrl = getYoutubeEmbedUrl(recipe.youtube_url)
        if (!embedUrl) return null
        return (
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={<PlayCircleOutline />}
              endIcon={videoOpen ? <ExpandLess /> : <ExpandMore />}
              onClick={() => setVideoOpen((v) => !v)}
              sx={{
                mb: 1.5,
                borderColor: 'rgba(255,0,0,0.4)',
                color: '#e53935',
                '&:hover': { borderColor: 'rgba(255,0,0,0.7)', bgcolor: 'rgba(255,0,0,0.06)' },
              }}
            >
              {t.videoButton}
            </Button>
            <Collapse in={videoOpen}>
              <Box
                sx={{
                  position: 'relative',
                  width: '100%',
                  paddingTop: '56.25%', // 16:9
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
                }}
              >
                <Box
                  component="iframe"
                  src={embedUrl}
                  title={t.videoButton}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  sx={{
                    position: 'absolute',
                    top: 0, left: 0,
                    width: '100%',
                    height: '100%',
                    border: 'none',
                  }}
                />
              </Box>
            </Collapse>
          </Box>
        )
      })()}

      {/* ── 30% / 70% columns ── */}
      <Box sx={{ display: 'flex', gap: 2.5, flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>

        {/* ── Левый блок 30%: Ингредиенты ── */}
        <Box sx={{ width: { xs: '100%', md: '30%' }, flexShrink: 0 }}>
          <Paper
            sx={{
              p: 2.5,
              height: '100%',
              background: (t) =>
                t.palette.mode === 'light'
                  ? 'rgba(230,252,244,0.97)'
                  : 'rgba(8,18,35,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(32,201,151,0.30)',
              boxShadow: '0 4px 24px rgba(32,201,151,0.14)',
            }}
          >
            {/* Мета-чипы */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
              <Chip
                icon={<AccessTime sx={{ fontSize: '14px !important', color: '#0F9B6E !important' }} />}
                label={t.min(recipe.cooking_time)}
                size="small"
                sx={{ bgcolor: 'rgba(32,201,151,0.15)', color: '#0F9B6E', border: '1px solid rgba(32,201,151,0.30)', fontWeight: 600 }}
              />
              <Chip
                label={{ easy: t.easy, medium: t.medium, hard: t.hard }[recipe.difficulty]}
                size="small"
                sx={{ bgcolor: DIFFICULTY_COLORS_LOCAL[recipe.difficulty], color: 'white', fontWeight: 600 }}
              />
            </Box>

            {/* Порции */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(32,201,151,0.10)', border: '1px solid rgba(32,201,151,0.25)', borderRadius: 3, px: 1, py: 0.5, mb: 2, width: 'fit-content' }}>
              <People sx={{ fontSize: 16, color: '#0F9B6E', ml: 0.5 }} />
              <IconButton size="small" onClick={() => setServings(Math.max(1, currentServings - 1))} sx={{ p: 0.25, color: 'text.primary' }}>
                <Remove sx={{ fontSize: 14 }} />
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center', fontWeight: 700, color: '#0F9B6E' }}>
                {currentServings}
              </Typography>
              <IconButton size="small" onClick={() => setServings(currentServings + 1)} sx={{ p: 0.25, color: 'text.primary' }}>
                <Add sx={{ fontSize: 14 }} />
              </IconButton>
              <Typography variant="body2" sx={{ color: '#0F9B6E', mr: 0.5, fontSize: '0.8rem', fontWeight: 500 }}>{t.servings}</Typography>
            </Box>

            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
              {t.ingredients}
            </Typography>
            <List dense disablePadding>
              {recipe.ingredients.map((ing, i) => (
                <ListItem
                  key={i}
                  sx={{
                    px: 0,
                    py: 0.75,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: i < recipe.ingredients.length - 1
                      ? '1px solid rgba(32,201,151,0.14)'
                      : 'none',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <FiberManualRecord sx={{ fontSize: 6, color: '#20C997', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      {ing.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${scaleQty(ing.quantity)} ${ing.unit}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(32,201,151,0.12)',
                      color: '#0F9B6E',
                      border: '1px solid rgba(32,201,151,0.28)',
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
        </Box>

        {/* ── Правый блок 70%: Приготовление ── */}
        <Box sx={{ flex: 1 }}>
          <Paper
            sx={{
              p: 3,
              height: '100%',
              background: (t) =>
                t.palette.mode === 'light'
                  ? 'rgba(240,253,248,0.97)'
                  : 'rgba(8,18,35,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(32,201,151,0.22)',
              boxShadow: '0 4px 24px rgba(32,201,151,0.08)',
            }}
          >
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
              {t.cooking}
            </Typography>
            <Divider sx={{ mb: 2.5 }} />
            {recipe.instructions.length === 0 && (
              <Typography variant="body2" color="text.secondary">
                {t.noInstructions}
              </Typography>
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recipe.instructions.map((step, index) => (
                <motion.div
                  key={step.step}
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
                          background: 'linear-gradient(135deg, #18B383 0%, #20C997 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 12px rgba(32,201,151,0.35)',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'white', fontWeight: 800, fontSize: '0.75rem' }}>
                          {step.step}
                        </Typography>
                      </Box>
                    </Box>
                    <Typography variant="body1" sx={{ color: 'text.primary', lineHeight: 1.6 }}>
                      {step.description}
                    </Typography>
                    {index < recipe.instructions.length - 1 && (
                      <Divider sx={{ width: '100%', mt: 2 }} />
                    )}
                  </ListItem>
                </motion.div>
              ))}
            </Box>
          </Paper>
        </Box>

      </Box>
    </Box>
  )
}
