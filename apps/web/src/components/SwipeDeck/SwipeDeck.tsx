import { useRef, useState, useCallback, useEffect } from 'react'
import TinderCard from 'react-tinder-card'
import { motion, AnimatePresence } from 'framer-motion'

interface CardAPI {
  swipe(dir?: string): Promise<void>
  restoreCard(): Promise<void>
}
import {
  Box, Typography, IconButton, Button, Chip, Collapse,
  Dialog, DialogContent, DialogTitle, List, ListItem, CircularProgress,
} from '@mui/material'
import {
  Close, Favorite, ArrowBack, Info, Restaurant,
  ExpandMore, ExpandLess, OpenInNew, AccessTime, People,
  FiberManualRecord, MenuBook, WorkspacePremium,
} from '@mui/icons-material'
import { Dish } from '@what2eat/types'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { swipeDish, markSessionComplete, resetSwipe, StoredDish } from '../../store/slices/swipeSlice'
import { fetchSuggestedDishes, loadMoreWebDishes, loadSuggestedRecipesByNames, generateSuggestedRecipesByAI, FREE_TIER_LIMIT } from '../../store/slices/dishesSlice'
import SwipeCard from './SwipeCard'
import { useT } from '../../i18n/useT'
const btnContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.7 } },
}
const btnItemVariant = {
  hidden: { opacity: 0, y: 24, scale: 0.6 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 380, damping: 16 } },
}

interface SwipeDeckProps {
  dishes: Dish[]
  loadingMore?: boolean
  onDishSelect: (dishId: number) => void
  onComplete: () => void
  onBack: () => void
  onLoadMoreSearchResults?: () => void
  onShowProfile?: () => void
}

export default function SwipeDeck({ dishes, loadingMore = false, onDishSelect, onComplete, onBack, onLoadMoreSearchResults, onShowProfile }: SwipeDeckProps) {
  const dispatch = useAppDispatch()
  const { currentIndex } = useAppSelector((state) => state.swipe)
  const { suggestedDishNames, popularSuggestions, aiRandomMode, aiDishRecipes, loading: dishesLoading } = useAppSelector((state) => state.dishes)
  const { ingredients, selectedIngredients } = useAppSelector((state) => state.ingredients)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const lang = useAppSelector((state) => state.lang.lang)
  const t = useT()
  const [swipeDirection, setSwipeDirection] = useState<Record<number, 'left' | 'right'>>({})
  const [popularExpanded, setPopularExpanded] = useState(false)
  const [infoDish, setInfoDish] = useState<typeof dishes[0] | null>(null)
  const suggestedLoadStartedRef = useRef(false)

  const selectedNamesKey = ingredients
    .filter((i) => selectedIngredients.includes(i.id))
    .map((i) => i.name)
    .join(',')

  const remaining = dishes.length - currentIndex
  const topDishIndex = currentIndex

  useEffect(() => {
    const selectedNames = selectedNamesKey.split(',').filter(Boolean)
    if (dishes.length === 0 && selectedNames.length > 0 && suggestedDishNames.length === 0) {
      dispatch(fetchSuggestedDishes({ ingredientNames: selectedNames, lang }))
    }
  }, [dishes.length, selectedNamesKey, dispatch, suggestedDishNames.length, lang])

  // When AI suggested dish names appear and we still have no dishes, load those recipes from DB and show in swipe
  useEffect(() => {
    if (dishes.length === 0 && suggestedDishNames.length > 0 && !suggestedLoadStartedRef.current) {
      suggestedLoadStartedRef.current = true
      dispatch(loadSuggestedRecipesByNames({ names: suggestedDishNames, lang }))
    }
    if (dishes.length > 0) suggestedLoadStartedRef.current = false
  }, [dishes.length, suggestedDishNames.length, suggestedDishNames, lang, dispatch])

  // Auto-load 5 more recipes from TheMealDB when ≤3 cards remain in randomizer mode
  useEffect(() => {
    if (aiRandomMode && remaining > 0 && remaining <= 3 && !loadingMore) {
      dispatch(loadMoreWebDishes())
    }
  }, [aiRandomMode, remaining, loadingMore, dispatch])

  // Auto-load next batch from ingredient search queue when ≤3 cards remain
  useEffect(() => {
    if (!aiRandomMode && remaining > 0 && remaining <= 3 && onLoadMoreSearchResults) {
      onLoadMoreSearchResults()
    }
  }, [aiRandomMode, remaining, onLoadMoreSearchResults])

  const cardRefsStore = useRef<(CardAPI | null)[]>([])
  while (cardRefsStore.current.length < dishes.length) cardRefsStore.current.push(null)

  const getCardRef = (index: number) => (el: CardAPI | null) => {
    cardRefsStore.current[index] = el
  }

  const handleSwipe = useCallback(
    (direction: string, dishId: number) => {
      const dir = direction === 'right' ? 'right' : 'left'
      const currentDish = dishes.find((d) => d.id === dishId)
      const aiRecipe = aiDishRecipes[dishId]
      const storedDish: StoredDish | undefined = currentDish
        ? {
            id: dishId,
            recipeId: aiRecipe?.id,
            mealdb_id: aiRecipe?.mealdb_id,
            name: currentDish.name,
            description: currentDish.description,
            image_url: currentDish.image_url,
            cooking_time: currentDish.cooking_time,
            difficulty: currentDish.difficulty,
            servings: currentDish.servings,
            estimated_cost: currentDish.estimated_cost,
            is_vegetarian: currentDish.is_vegetarian,
            is_vegan: currentDish.is_vegan,
            calories_per_serving: aiRecipe?.calories_per_serving,
            protein_per_serving: aiRecipe?.protein_per_serving,
            fat_per_serving: aiRecipe?.fat_per_serving,
            carbs_per_serving: aiRecipe?.carbs_per_serving,
          }
        : undefined
      dispatch(swipeDish({ dishId, direction: dir, userId, dish: storedDish }))
      setSwipeDirection(prev => ({ ...prev, [dishId]: dir }))
    },
    [dispatch, userId, dishes, aiDishRecipes]
  )

  // Trigger completion when all cards are swiped
  useEffect(() => {
    if (remaining === 0 && dishes.length > 0) {
      dispatch(markSessionComplete())
      onComplete()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  const swipe = (dir: 'left' | 'right') => {
    const card = cardRefsStore.current[topDishIndex]
    if (card) card.swipe(dir)
  }

  const handleInfoClick = () => {
    if (topDishIndex >= 0 && topDishIndex < dishes.length) {
      setInfoDish(dishes[topDishIndex])
    }
  }

  const handleReset = () => {
    dispatch(resetSwipe())
  }

  if (dishes.length === 0) {
    const hasSuggested = suggestedDishNames.length > 0
    return (
      <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
        {hasSuggested && dishesLoading ? (
          <>
            <CircularProgress size={48} sx={{ color: 'primary.main', mb: 2 }} />
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 3 }}>
              {t.searchingSuggestedRecipes}
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 700, mb: 2 }}>
              {t.noDisheFound}
            </Typography>
            {hasSuggested && (
              <Box sx={{ mb: 3, textAlign: 'left', maxWidth: 360, mx: 'auto' }}>
                <Typography variant="subtitle2" sx={{ color: 'text.secondary', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Restaurant fontSize="small" /> {t.aiSuggests}
                </Typography>
                <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'text.primary' }}>
                  {suggestedDishNames.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => dispatch(generateSuggestedRecipesByAI({ names: suggestedDishNames, lang }))}
                  sx={{ mt: 2 }}
                >
                  {t.generateWithAI}
                </Button>
              </Box>
            )}
          </>
        )}
        <Button variant="outlined" onClick={onBack} startIcon={<ArrowBack />} sx={{ mt: 1 }}>
          {t.changeIngredients}
        </Button>
      </Box>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 4 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.05 }}
        style={{ width: '100%' }}
      >
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button variant="text" onClick={onBack} startIcon={<ArrowBack />} size="small">
          {t.back}
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: remaining > 0 ? 'text.secondary' : '#22C55E',
              fontWeight: 600,
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {remaining > 0 ? t.dishesLeft(remaining) : t.allSeen}
          </Typography>
          {loadingMore && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CircularProgress size={12} sx={{ color: 'var(--w2e-primary)' }} />
              <Typography variant="caption" sx={{ color: 'var(--w2e-primary)', fontSize: '0.65rem' }}>
                {t.loadingMore}
              </Typography>
            </Box>
          )}
        </Box>
        <Button variant="text" onClick={handleReset} size="small" sx={{ color: 'text.disabled', fontSize: '0.75rem' }}>
          {t.fromStart}
        </Button>
      </Box>
      </motion.div>

      {/* Card stack */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
        style={{ position: 'relative', width: '100%', maxWidth: 400, marginBottom: 32 }}
      >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          height: 520,
          overflow: 'visible',
        }}
      >
        {/* Ambient glow — very slow radial bloom spreading outward from card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: [0, 0, 0.75, 0.5], scale: [0.3, 0.55, 1.15, 1.0] }}
          transition={{ duration: 5.0, ease: [0.16, 1, 0.3, 1], times: [0, 0.2, 0.78, 1], delay: 0.1 }}
          style={{
            position: 'absolute',
            inset: '-60px',
            borderRadius: '48px',
            background: 'radial-gradient(ellipse at 50% 60%, rgba(var(--w2e-primary-rgb),0.32) 0%, rgba(var(--w2e-primary-rgb),0.10) 45%, transparent 70%)',
            filter: 'blur(40px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {/* Outer halo — widest spread, slowest */}
        <motion.div
          initial={{ opacity: 0, scale: 0.2 }}
          animate={{ opacity: [0, 0, 0.35, 0.22], scale: [0.2, 0.35, 1.35, 1.1] }}
          transition={{ duration: 5.5, ease: [0.16, 1, 0.3, 1], times: [0, 0.18, 0.78, 1], delay: 0.1 }}
          style={{
            position: 'absolute',
            inset: '-90px',
            borderRadius: '60px',
            background: 'radial-gradient(ellipse at 50% 60%, rgba(var(--w2e-primary-rgb),0.18) 0%, rgba(var(--w2e-primary-rgb),0.05) 50%, transparent 70%)',
            filter: 'blur(56px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {/* Continuous pulse */}
        <motion.div
          animate={{ opacity: [0.25, 0.48, 0.25], scale: [0.96, 1.05, 0.96] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 5.6 }}
          style={{
            position: 'absolute',
            inset: '-50px',
            borderRadius: '44px',
            background: 'radial-gradient(ellipse at 50% 60%, rgba(var(--w2e-primary-rgb),0.18) 0%, rgba(var(--w2e-primary-rgb),0.05) 50%, transparent 70%)',
            filter: 'blur(32px)',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
        {remaining === 0 ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(var(--w2e-tint-rgb),0.55)',
              borderRadius: 4,
              border: '1px solid rgba(var(--w2e-primary-rgb),0.20)',
            }}
          >
            <Typography variant="h5" sx={{ color: 'text.secondary', fontWeight: 700, mb: 3 }}>
              {t.allDishesViewed}
            </Typography>
            <Button variant="contained" onClick={onComplete} size="large" sx={{ px: 4 }}>
              {t.viewResults}
            </Button>
          </Box>
        ) : (
          dishes.map((dish, index) => {
            const isVisible = index >= currentIndex
            if (!isVisible) return null
            return (
              <Box
                key={dish.id}
                data-testid="swipe-card"
                sx={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  zIndex: dishes.length - index,
                }}
              >
                <TinderCard
                  ref={getCardRef(index)}
                  onSwipe={(dir) => handleSwipe(dir, dish.id)}
                  preventSwipe={['up', 'down']}
                  swipeRequirementType="position"
                  swipeThreshold={80}
                >
                  <Box sx={{ width: '100%', height: 520 }}>
                    <SwipeCard
                      dish={dish}
                      swipeDirection={swipeDirection[dish.id] ?? null}
                      caloriesPerServing={aiDishRecipes[dish.id]?.calories_per_serving}
                    />
                  </Box>
                </TinderCard>
              </Box>
            )
          })
        )}
      </Box>
      </motion.div>

      {/* Controls */}
      <AnimatePresence>
      {remaining > 0 && (
        <motion.div
          variants={btnContainerVariants}
          initial="hidden"
          animate="visible"
          style={{ display: 'flex', gap: 20, alignItems: 'center', position: 'relative', zIndex: 10 }}
        >
          <motion.div variants={btnItemVariant} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <IconButton
              onClick={() => swipe('left')}
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'rgba(255,77,77,0.28)',
                border: '2px solid rgba(255,77,77,0.75)',
                color: '#FF4D4D',
                boxShadow: '0 4px 16px rgba(255,77,77,0.35), 0 0 40px rgba(255,77,77,0.22)',
                transition: 'box-shadow 0.25s ease, background 0.25s ease',
                '&:hover': {
                  background: 'rgba(255,77,77,0.40)',
                  boxShadow: '0 4px 20px rgba(255,77,77,0.50), 0 0 60px rgba(255,77,77,0.30)',
                },
              }}
            >
              <Close sx={{ fontSize: 30 }} />
            </IconButton>
          </motion.div>

          <motion.div variants={btnItemVariant} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <IconButton
              onClick={handleInfoClick}
              sx={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'rgba(168,85,247,0.28)',
                border: '2px solid rgba(168,85,247,0.75)',
                color: '#A855F7',
                boxShadow: '0 4px 14px rgba(168,85,247,0.30), 0 0 32px rgba(168,85,247,0.18)',
                transition: 'box-shadow 0.25s ease, background 0.25s ease',
                '&:hover': {
                  background: 'rgba(168,85,247,0.40)',
                  boxShadow: '0 4px 18px rgba(168,85,247,0.45), 0 0 50px rgba(168,85,247,0.28)',
                },
              }}
            >
              <Info sx={{ fontSize: 24 }} />
            </IconButton>
          </motion.div>

          <motion.div variants={btnItemVariant} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <IconButton
              onClick={() => swipe('right')}
              sx={{
                width: 68,
                height: 68,
                borderRadius: '50%',
                background: 'rgba(34,197,94,0.28)',
                border: '2px solid rgba(34,197,94,0.75)',
                color: '#22C55E',
                boxShadow: '0 4px 16px rgba(34,197,94,0.35), 0 0 40px rgba(34,197,94,0.22)',
                transition: 'box-shadow 0.25s ease, background 0.25s ease',
                '&:hover': {
                  background: 'rgba(34,197,94,0.40)',
                  boxShadow: '0 4px 20px rgba(34,197,94,0.50), 0 0 60px rgba(34,197,94,0.30)',
                },
              }}
            >
              <Favorite sx={{ fontSize: 30 }} />
            </IconButton>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Free tier banner */}
      {!aiRandomMode && dishes.length >= FREE_TIER_LIMIT && onShowProfile && (
        <Box
          sx={{
            mt: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.75,
            borderRadius: 2,
            bgcolor: 'rgba(var(--w2e-primary-rgb),0.07)',
            border: '1px solid rgba(var(--w2e-primary-rgb),0.18)',
          }}
        >
          <WorkspacePremium sx={{ fontSize: 16, color: 'var(--w2e-primary-deep)' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', flex: 1 }}>
            {t.freeTierBanner}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            onClick={onShowProfile}
            sx={{ fontSize: '0.68rem', py: 0.25, px: 1, borderColor: 'rgba(var(--w2e-primary-rgb),0.45)', color: 'var(--w2e-primary-deep)', minWidth: 0 }}
          >
            {t.unlockMoreWithPro}
          </Button>
        </Box>
      )}

      {/* Dish info dialog */}
      <Dialog
        open={infoDish !== null}
        onClose={() => setInfoDish(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: (t) => t.palette.mode === 'light' ? 'rgba(var(--w2e-paper-dark-rgb),0.97)' : 'rgba(8,18,35,0.97)', backgroundImage: 'none', borderRadius: 4, overflow: 'hidden', border: '1px solid rgba(var(--w2e-primary-rgb),0.20)' } }}
      >
        {infoDish && (
          <>
            <Box sx={{ position: 'relative', height: 220 }}>
              <Box
                component="img"
                src={infoDish.image_url ?? undefined}
                alt={infoDish.name}
                sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
              <Box sx={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(20,20,20,1) 0%, rgba(20,20,20,0.3) 60%, transparent 100%)',
              }} />
              <IconButton
                onClick={() => setInfoDish(null)}
                size="small"
                sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.75)' } }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <DialogTitle sx={{ pb: 0.5, pt: 1.5, px: 2.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>
                {infoDish.name}
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ px: 2.5, pt: 1, pb: 2 }}>
              {infoDish.description && (
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.6 }}>
                  {infoDish.description}
                </Typography>
              )}

              {/* Info chips */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                <Chip
                  icon={<AccessTime sx={{ fontSize: '13px !important', color: 'var(--w2e-primary-deep) !important' }} />}
                  label={t.min(infoDish.cooking_time)}
                  size="small"
                  sx={{ bgcolor: 'rgba(var(--w2e-primary-rgb),0.12)', color: 'var(--w2e-primary-deep)', border: '1px solid rgba(var(--w2e-primary-rgb),0.25)' }}
                />
                <Chip
                  icon={<People sx={{ fontSize: '13px !important', color: 'var(--w2e-primary-deep) !important' }} />}
                  label={t.servingsShort(infoDish.servings)}
                  size="small"
                  sx={{ bgcolor: 'rgba(var(--w2e-primary-rgb),0.12)', color: 'var(--w2e-primary-deep)', border: '1px solid rgba(var(--w2e-primary-rgb),0.25)' }}
                />
                {infoDish.is_vegan && (
                  <Chip label={t.vegan} size="small" sx={{ bgcolor: 'rgba(22,163,74,0.1)', color: '#15803d', border: '1px solid rgba(22,163,74,0.25)' }} />
                )}
                {!infoDish.is_vegan && infoDish.is_vegetarian && (
                  <Chip label={t.vegetarian} size="small" sx={{ bgcolor: 'rgba(180,83,9,0.08)', color: '#b45309', border: '1px solid rgba(180,83,9,0.2)' }} />
                )}
              </Box>

              {/* Ingredients */}
              {infoDish.ingredients && infoDish.ingredients.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', mb: 1 }}>
                    {t.mainIngredients}
                  </Typography>
                  <List dense disablePadding>
                    {infoDish.ingredients.slice(0, 6).map((ing) => (
                      <ListItem key={ing.id} sx={{ px: 0, py: 0.4 }}>
                        <FiberManualRecord sx={{ fontSize: 6, color: 'var(--w2e-primary)', mr: 1, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: 'text.primary' }}>{ing.name}</Typography>
                      </ListItem>
                    ))}
                    {infoDish.ingredients.length > 6 && (
                      <Typography variant="caption" sx={{ color: 'text.disabled', pl: 2.5 }}>
                        {t.andMore(infoDish.ingredients.length - 6)}
                      </Typography>
                    )}
                  </List>
                </Box>
              )}

              <Button
                variant="contained"
                fullWidth
                startIcon={<MenuBook />}
                onClick={() => { setInfoDish(null); onDishSelect(infoDish.id) }}
                sx={{ mt: 2.5, py: 1.25, fontWeight: 700 }}
              >
                {t.openFullRecipe}
              </Button>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Popular internet recipes section */}
      {popularSuggestions.length > 0 && (
        <Box sx={{ width: '100%', maxWidth: 440, mt: 3 }}>
          <Box
            component="button"
            onClick={() => setPopularExpanded((v) => !v)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              width: '100%',
              bgcolor: 'transparent',
              border: '1px solid rgba(180,83,9,0.25)',
              borderRadius: 2,
              px: 2,
              py: 1.25,
              cursor: 'pointer',
              color: '#b45309',
              '&:hover': { bgcolor: 'rgba(180,83,9,0.05)' },
            }}
          >
            <Restaurant sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1, textAlign: 'left', color: '#b45309' }}>
              {t.popularInternetRecipes}
            </Typography>
            {popularExpanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
          </Box>

          <Collapse in={popularExpanded}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
              {popularSuggestions.map((dish) => (
                <Box
                  key={dish.name}
                  sx={{
                    bgcolor: 'rgba(var(--w2e-tint-rgb),0.50)',
                    border: '1px solid rgba(var(--w2e-primary-rgb),0.18)',
                    borderRadius: 3,
                    p: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ color: 'text.primary', fontWeight: 700, lineHeight: 1.3 }}>
                      {dish.name}
                    </Typography>
                    <Box
                      component="a"
                      href={`https://yandex.ru/search/?text=${encodeURIComponent(`рецепт ${dish.name}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.4,
                        color: '#1d4ed8',
                        textDecoration: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      {t.findRecipe}
                      <OpenInNew sx={{ fontSize: 12 }} />
                    </Box>
                  </Box>

                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                    {dish.description}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                    {dish.cookingTime && (
                      <Chip
                        icon={<AccessTime sx={{ fontSize: '12px !important', color: 'rgba(0,0,0,0.35) !important' }} />}
                        label={dish.cookingTime}
                        size="small"
                        sx={{ bgcolor: 'rgba(0,0,0,0.06)', color: 'text.secondary', height: 22, fontSize: '0.68rem' }}
                      />
                    )}
                    {(dish.mainIngredients ?? []).map((ing) => (
                      <Chip
                        key={ing}
                        label={ing}
                        size="small"
                        sx={{ bgcolor: 'rgba(180,83,9,0.08)', color: '#b45309', border: '1px solid rgba(180,83,9,0.18)', height: 22, fontSize: '0.68rem' }}
                      />
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
    </motion.div>
  )
}
