import { Box, Typography, Button, Chip, CircularProgress, Alert, Divider, List, ListItem, Paper, IconButton, Collapse, Dialog, DialogContent, LinearProgress } from '@mui/material'
import { ArrowBack, AutoAwesome, Save, AccessTime, People, FiberManualRecord, Favorite, Close, Add, Remove, PlayCircleOutline, ExpandMore, ExpandLess, Kitchen, NavigateNext, NavigateBefore, Mic, MicOff } from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { clearAIRecipe, saveGeneratedRecipe } from '../../store/slices/aiRecipeSlice'
import { likeDish, unlikeDish, dislikeDish } from '../../store/slices/swipeSlice'
import { useState, useEffect, useRef } from 'react'
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
  const lang = useAppSelector((state) => state.lang.lang)
  const t = useT()
  const [saved, setSaved] = useState(false)
  const [servings, setServings] = useState<number | null>(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const [cookingMode, setCookingMode] = useState(false)
  const [cookingStep, setCookingStep] = useState(0)
  const [voiceActive, setVoiceActive] = useState(false)
  const wakeLockRef = useRef<any>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    if (cookingMode) {
      ;(navigator as any).wakeLock?.request('screen').then((lock: any) => {
        wakeLockRef.current = lock
      }).catch(() => {})
    } else {
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
      setVoiceActive(false)
    }
  }, [cookingMode])

  useEffect(() => {
    if (!voiceActive || !cookingMode) {
      recognitionRef.current?.stop()
      recognitionRef.current = null
      return
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const rec = new SR()
    recognitionRef.current = rec
    rec.continuous = true
    rec.interimResults = false
    rec.lang = lang === 'ru' ? 'ru-RU' : 'en-US'
    rec.onresult = (e: any) => {
      const text: string = e.results[e.results.length - 1][0].transcript.toLowerCase()
      if (/след|вперёд|дальше|next|forward/.test(text)) {
        setCookingStep(s => Math.min(s + 1, generatedRecipe?.instructions.length ?? 0))
      } else if (/назад|предыд|back|previous/.test(text)) {
        setCookingStep(s => Math.max(s - 1, 0))
      }
    }
    rec.onerror = () => setVoiceActive(false)
    rec.start()
    return () => { rec.stop(); recognitionRef.current = null }
  }, [voiceActive, cookingMode, lang, generatedRecipe])

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
            <AutoAwesome sx={{ color: 'var(--w2e-primary)', fontSize: 16 }} />
            <Typography variant="caption" sx={{ color: 'var(--w2e-primary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
                  ? 'rgba(var(--w2e-paper-dark-rgb),0.97)'
                  : 'rgba(8,18,35,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(var(--w2e-primary-rgb),0.30)',
              boxShadow: '0 4px 24px rgba(var(--w2e-primary-rgb),0.14)',
            }}
          >
            {/* Мета-чипы */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
              <Chip
                icon={<AccessTime sx={{ fontSize: '14px !important', color: 'var(--w2e-primary-deep) !important' }} />}
                label={t.min(recipe.cooking_time)}
                size="small"
                sx={{ bgcolor: 'rgba(var(--w2e-primary-rgb),0.15)', color: 'var(--w2e-primary-deep)', border: '1px solid rgba(var(--w2e-primary-rgb),0.30)', fontWeight: 600 }}
              />
              <Chip
                label={{ easy: t.easy, medium: t.medium, hard: t.hard }[recipe.difficulty]}
                size="small"
                sx={{ bgcolor: DIFFICULTY_COLORS_LOCAL[recipe.difficulty], color: 'white', fontWeight: 600 }}
              />
            </Box>

            {/* КБЖУ на порцию: первая строка — ккал, вторая — жиры, углеводы, белки */}
            {(recipe.calories_per_serving || recipe.protein_per_serving || recipe.fat_per_serving || recipe.carbs_per_serving) && (() => {
              const scale = (v: number) => Math.round(v * servingsScale)
              return (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" sx={{ color: 'var(--w2e-primary-deep)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.75 }}>
                    {t.kbjuPerServing}
                  </Typography>
                  {recipe.calories_per_serving && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6, mb: 0.5 }}>
                      <Chip label={`${scale(recipe.calories_per_serving)} ${t.kcalUnit}`} size="small" sx={{ bgcolor: 'rgba(255,167,38,0.15)', color: '#E65100', border: '1px solid rgba(255,167,38,0.35)', fontWeight: 600, fontSize: '0.72rem' }} />
                    </Box>
                  )}
                  {(recipe.fat_per_serving || recipe.carbs_per_serving || recipe.protein_per_serving) && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.6 }}>
                      {recipe.fat_per_serving && (
                        <Chip label={`${t.fatLabel} ${scale(recipe.fat_per_serving)}${t.gUnit}`} size="small" sx={{ bgcolor: 'rgba(239,108,0,0.12)', color: '#BF360C', border: '1px solid rgba(239,108,0,0.3)', fontWeight: 600, fontSize: '0.72rem' }} />
                      )}
                      {recipe.carbs_per_serving && (
                        <Chip label={`${t.carbsLabel} ${scale(recipe.carbs_per_serving)}${t.gUnit}`} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.1)', color: '#6A1B9A', border: '1px solid rgba(156,39,176,0.28)', fontWeight: 600, fontSize: '0.72rem' }} />
                      )}
                      {recipe.protein_per_serving && (
                        <Chip label={`${t.proteinLabel} ${scale(recipe.protein_per_serving)}${t.gUnit}`} size="small" sx={{ bgcolor: 'rgba(66,165,245,0.15)', color: '#1565C0', border: '1px solid rgba(66,165,245,0.35)', fontWeight: 600, fontSize: '0.72rem' }} />
                      )}
                    </Box>
                  )}
                </Box>
              )
            })()}

            {/* Порции */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: 'rgba(var(--w2e-primary-rgb),0.10)', border: '1px solid rgba(var(--w2e-primary-rgb),0.25)', borderRadius: 3, px: 1, py: 0.5, mb: 2, width: 'fit-content' }}>
              <People sx={{ fontSize: 16, color: 'var(--w2e-primary-deep)', ml: 0.5 }} />
              <IconButton size="small" onClick={() => setServings(Math.max(1, currentServings - 1))} sx={{ p: 0.25, color: 'text.primary' }}>
                <Remove sx={{ fontSize: 14 }} />
              </IconButton>
              <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center', fontWeight: 700, color: 'var(--w2e-primary-deep)' }}>
                {currentServings}
              </Typography>
              <IconButton size="small" onClick={() => setServings(currentServings + 1)} sx={{ p: 0.25, color: 'text.primary' }}>
                <Add sx={{ fontSize: 14 }} />
              </IconButton>
              <Typography variant="body2" sx={{ color: 'var(--w2e-primary-deep)', mr: 0.5, fontSize: '0.8rem', fontWeight: 500 }}>{t.servings}</Typography>
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
                      ? '1px solid rgba(var(--w2e-primary-rgb),0.14)'
                      : 'none',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    <FiberManualRecord sx={{ fontSize: 6, color: 'var(--w2e-primary)', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 500 }}>
                      {ing.name}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${scaleQty(ing.quantity)} ${ing.unit}`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(var(--w2e-primary-rgb),0.12)',
                      color: 'var(--w2e-primary-deep)',
                      border: '1px solid rgba(var(--w2e-primary-rgb),0.28)',
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
                  ? 'rgba(var(--w2e-paper-rgb),0.97)'
                  : 'rgba(8,18,35,0.95)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(var(--w2e-primary-rgb),0.22)',
              boxShadow: '0 4px 24px rgba(var(--w2e-primary-rgb),0.08)',
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                {t.cooking}
              </Typography>
              {recipe.instructions.length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<Kitchen sx={{ fontSize: '16px !important' }} />}
                  onClick={() => { setCookingStep(0); setCookingMode(true) }}
                  sx={{ fontSize: '0.72rem', py: 0.4, px: 1.2, borderColor: 'rgba(var(--w2e-primary-rgb),0.5)', color: 'var(--w2e-primary-deep)' }}
                >
                  {t.cookingModeBtn}
                </Button>
              )}
            </Box>
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
                          background: 'linear-gradient(135deg, var(--w2e-primary-dark) 0%, var(--w2e-primary) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 2px 12px rgba(var(--w2e-primary-rgb),0.35)',
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

      {/* ── Полноэкранный режим готовки ── */}
      <Dialog
        open={cookingMode}
        onClose={() => setCookingMode(false)}
        fullScreen
        PaperProps={{
          sx: {
            bgcolor: 'background.default',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Шапка */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          <IconButton onClick={() => setCookingMode(false)} size="small">
            <Close />
          </IconButton>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.secondary', maxWidth: 200, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {recipe.name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
            {((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && (
              <IconButton
                size="small"
                onClick={() => setVoiceActive(v => !v)}
                sx={{ color: voiceActive ? 'var(--w2e-primary)' : 'text.disabled' }}
                title={t.voiceHint}
              >
                {voiceActive ? <Mic fontSize="small" /> : <MicOff fontSize="small" />}
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Прогресс */}
        {cookingStep < recipe.instructions.length && (
          <LinearProgress
            variant="determinate"
            value={(cookingStep / recipe.instructions.length) * 100}
            sx={{ height: 3 }}
          />
        )}

        {/* Контент шага */}
        <DialogContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, p: { xs: 3, sm: 6 } }}>
          <AnimatePresence mode="wait">
            {cookingStep < recipe.instructions.length ? (
              <motion.div
                key={cookingStep}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.25 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%', maxWidth: 560 }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--w2e-primary-dark) 0%, var(--w2e-primary) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(var(--w2e-primary-rgb),0.45)',
                  }}
                >
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 800 }}>
                    {cookingStep + 1}
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: 'text.disabled', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {t.stepOf(cookingStep + 1, recipe.instructions.length)}
                </Typography>
                <Typography variant="h5" sx={{ textAlign: 'center', lineHeight: 1.7, fontWeight: 400, color: 'text.primary' }}>
                  {recipe.instructions[cookingStep].description}
                </Typography>
                {voiceActive && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, color: 'var(--w2e-primary)', opacity: 0.7 }}>
                    <Mic sx={{ fontSize: 14 }} />
                    <Typography variant="caption">{t.voiceHint}</Typography>
                  </Box>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, type: 'spring' }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}
              >
                <Typography sx={{ fontSize: 72 }}>🍽️</Typography>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{t.cookingDone}</Typography>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>

        {/* Навигация */}
        <Box sx={{ display: 'flex', gap: 2, p: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<NavigateBefore />}
            onClick={() => setCookingStep(s => Math.max(0, s - 1))}
            disabled={cookingStep === 0}
            sx={{ flex: 1, py: 1.5, fontSize: '1rem' }}
          >
            {t.nazad}
          </Button>
          {cookingStep < recipe.instructions.length ? (
            <Button
              variant="contained"
              size="large"
              endIcon={<NavigateNext />}
              onClick={() => setCookingStep(s => s + 1)}
              sx={{ flex: 1, py: 1.5, fontSize: '1rem' }}
            >
              {cookingStep === recipe.instructions.length - 1 ? t.finishCooking : t.nextStep}
            </Button>
          ) : (
            <Button
              variant="contained"
              size="large"
              onClick={() => setCookingMode(false)}
              sx={{ flex: 1, py: 1.5, fontSize: '1rem' }}
            >
              {t.nazad}
            </Button>
          )}
        </Box>
      </Dialog>

    </Box>
  )
}
