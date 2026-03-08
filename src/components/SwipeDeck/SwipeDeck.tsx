import { useRef, useState, useCallback, useEffect } from 'react'
import TinderCard from 'react-tinder-card'
import { motion } from 'framer-motion'

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
  FiberManualRecord, MenuBook,
} from '@mui/icons-material'
import { Dish } from '../../types'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { swipeDish, markSessionComplete, resetSwipe } from '../../store/slices/swipeSlice'
import { fetchSuggestedDishes } from '../../store/slices/dishesSlice'
import SwipeCard from './SwipeCard'

interface SwipeDeckProps {
  dishes: Dish[]
  loadingMore?: boolean
  onDishSelect: (dishId: number) => void
  onComplete: () => void
  onBack: () => void
}

export default function SwipeDeck({ dishes, loadingMore = false, onDishSelect, onComplete, onBack }: SwipeDeckProps) {
  const dispatch = useAppDispatch()
  const { currentIndex } = useAppSelector((state) => state.swipe)
  const { suggestedDishNames, popularSuggestions } = useAppSelector((state) => state.dishes)
  const { ingredients, selectedIngredients } = useAppSelector((state) => state.ingredients)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const [swipeDirection, setSwipeDirection] = useState<Record<number, 'left' | 'right'>>({})
  const [popularExpanded, setPopularExpanded] = useState(false)
  const [infoDish, setInfoDish] = useState<typeof dishes[0] | null>(null)

  const selectedNamesKey = ingredients
    .filter((i) => selectedIngredients.includes(i.id))
    .map((i) => i.name)
    .join(',')

  useEffect(() => {
    const selectedNames = selectedNamesKey.split(',').filter(Boolean)
    if (dishes.length === 0 && selectedNames.length > 0 && suggestedDishNames.length === 0) {
      dispatch(fetchSuggestedDishes(selectedNames))
    }
  }, [dishes.length, selectedNamesKey, dispatch, suggestedDishNames.length])

  const cardRefsStore = useRef<(CardAPI | null)[]>([])
  while (cardRefsStore.current.length < dishes.length) cardRefsStore.current.push(null)

  const getCardRef = (index: number) => (el: CardAPI | null) => {
    cardRefsStore.current[index] = el
  }

  const remaining = dishes.length - currentIndex
  const topDishIndex = dishes.length - 1 - currentIndex

  const handleSwipe = useCallback(
    (direction: string, dishId: number) => {
      const dir = direction === 'right' ? 'right' : 'left'
      dispatch(swipeDish({ dishId, direction: dir, userId }))
      setSwipeDirection(prev => ({ ...prev, [dishId]: dir }))
    },
    [dispatch, userId]
  )

  const handleCardLeft = useCallback(
    (_title: string, newIndex: number) => {
      if (newIndex < 0) {
        dispatch(markSessionComplete())
        onComplete()
      }
    },
    [dispatch, onComplete]
  )

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
    return (
      <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
        <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, mb: 2 }}>
          В базе нет подходящих блюд
        </Typography>
        {suggestedDishNames.length > 0 && (
          <Box sx={{ mb: 3, textAlign: 'left', maxWidth: 360, mx: 'auto' }}>
            <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Restaurant fontSize="small" /> ИИ предлагает приготовить:
            </Typography>
            <Box component="ul" sx={{ m: 0, pl: 2.5, color: 'rgba(255,255,255,0.9)' }}>
              {suggestedDishNames.map((name) => (
                <li key={name}>{name}</li>
              ))}
            </Box>
          </Box>
        )}
        <Button variant="outlined" onClick={onBack} startIcon={<ArrowBack />} sx={{ mt: 1 }}>
          Изменить ингредиенты
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pb: 4 }}>
      {/* Header */}
      <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Button variant="text" onClick={onBack} startIcon={<ArrowBack />} size="small">
          Назад
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="body2"
            sx={{
              color: remaining > 0 ? 'rgba(255,255,255,0.5)' : '#22C55E',
              fontWeight: 600,
              fontSize: '0.8rem',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {remaining > 0 ? `${remaining} блюд осталось` : 'Все просмотрены'}
          </Typography>
          {loadingMore && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CircularProgress size={12} sx={{ color: '#FF9500' }} />
              <Typography variant="caption" sx={{ color: '#FF9500', fontSize: '0.65rem' }}>
                +ещё
              </Typography>
            </Box>
          )}
        </Box>
        <Button variant="text" onClick={handleReset} size="small" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
          Сначала
        </Button>
      </Box>

      {/* Card stack */}
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          height: 520,
          mb: 4,
        }}
      >
        {remaining === 0 ? (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255,255,255,0.03)',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, mb: 3 }}>
              Вы просмотрели все блюда!
            </Typography>
            <Button variant="contained" onClick={onComplete} size="large" sx={{ px: 4 }}>
              Посмотреть результаты
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
                }}
              >
                <TinderCard
                  ref={getCardRef(index)}
                  onSwipe={(dir) => handleSwipe(dir, dish.id)}
                  onCardLeftScreen={(title) => handleCardLeft(title, index - currentIndex - 1)}
                  preventSwipe={['up', 'down']}
                  swipeRequirementType="position"
                  swipeThreshold={80}
                >
                  <Box sx={{ width: '100%', height: 520 }}>
                    <SwipeCard
                      dish={dish}
                      swipeDirection={swipeDirection[dish.id] ?? null}
                    />
                  </Box>
                </TinderCard>
              </Box>
            )
          })
        )}
      </Box>

      {/* Controls */}
      {remaining > 0 && (
        <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <IconButton
              onClick={() => swipe('left')}
              sx={{
                width: 68,
                height: 68,
                background: 'rgba(255,77,77,0.15)',
                border: '2px solid rgba(255,77,77,0.4)',
                color: '#FF4D4D',
                boxShadow: '0 4px 20px rgba(255,77,77,0.2)',
                '&:hover': {
                  background: 'rgba(255,77,77,0.25)',
                  boxShadow: '0 6px 28px rgba(255,77,77,0.4)',
                },
              }}
            >
              <Close sx={{ fontSize: 30 }} />
            </IconButton>
          </motion.div>

          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <IconButton
              onClick={handleInfoClick}
              sx={{
                width: 52,
                height: 52,
                background: 'rgba(168,85,247,0.15)',
                border: '2px solid rgba(168,85,247,0.4)',
                color: '#A855F7',
                boxShadow: '0 4px 16px rgba(168,85,247,0.2)',
                '&:hover': {
                  background: 'rgba(168,85,247,0.25)',
                  boxShadow: '0 6px 24px rgba(168,85,247,0.4)',
                },
              }}
            >
              <Info sx={{ fontSize: 24 }} />
            </IconButton>
          </motion.div>

          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <IconButton
              onClick={() => swipe('right')}
              sx={{
                width: 68,
                height: 68,
                background: 'rgba(34,197,94,0.15)',
                border: '2px solid rgba(34,197,94,0.4)',
                color: '#22C55E',
                boxShadow: '0 4px 20px rgba(34,197,94,0.2)',
                '&:hover': {
                  background: 'rgba(34,197,94,0.25)',
                  boxShadow: '0 6px 28px rgba(34,197,94,0.4)',
                },
              }}
            >
              <Favorite sx={{ fontSize: 30 }} />
            </IconButton>
          </motion.div>
        </Box>
      )}

      {/* Dish info dialog */}
      <Dialog
        open={infoDish !== null}
        onClose={() => setInfoDish(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#141414', backgroundImage: 'none', borderRadius: 4, overflow: 'hidden' } }}
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
              <Typography variant="h5" sx={{ fontWeight: 800, color: 'white', lineHeight: 1.2 }}>
                {infoDish.name}
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ px: 2.5, pt: 1, pb: 2 }}>
              {infoDish.description && (
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', mb: 2, lineHeight: 1.6 }}>
                  {infoDish.description}
                </Typography>
              )}

              {/* Info chips */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
                <Chip
                  icon={<AccessTime sx={{ fontSize: '13px !important', color: 'rgba(255,255,255,0.5) !important' }} />}
                  label={`${infoDish.cooking_time} мин`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                <Chip
                  icon={<People sx={{ fontSize: '13px !important', color: 'rgba(255,255,255,0.5) !important' }} />}
                  label={`${infoDish.servings} порц.`}
                  size="small"
                  sx={{ bgcolor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)' }}
                />
                {infoDish.is_vegan && (
                  <Chip label="Веган" size="small" sx={{ bgcolor: 'rgba(34,197,94,0.2)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.3)' }} />
                )}
                {!infoDish.is_vegan && infoDish.is_vegetarian && (
                  <Chip label="Вегетар." size="small" sx={{ bgcolor: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }} />
                )}
              </Box>

              {/* Ingredients */}
              {infoDish.ingredients && infoDish.ingredients.length > 0 && (
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600, display: 'block', mb: 1 }}>
                    Основные ингредиенты
                  </Typography>
                  <List dense disablePadding>
                    {infoDish.ingredients.slice(0, 6).map((ing) => (
                      <ListItem key={ing.id} sx={{ px: 0, py: 0.4 }}>
                        <FiberManualRecord sx={{ fontSize: 6, color: '#FF9500', mr: 1, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>{ing.name}</Typography>
                      </ListItem>
                    ))}
                    {infoDish.ingredients.length > 6 && (
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', pl: 2.5 }}>
                        и ещё {infoDish.ingredients.length - 6}...
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
                Открыть полный рецепт
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
              border: '1px solid rgba(251,191,36,0.3)',
              borderRadius: 2,
              px: 2,
              py: 1.25,
              cursor: 'pointer',
              color: '#fbbf24',
              '&:hover': { bgcolor: 'rgba(251,191,36,0.06)' },
            }}
          >
            <Restaurant sx={{ fontSize: 18 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, flexGrow: 1, textAlign: 'left', color: '#fbbf24' }}>
              Популярные рецепты из интернета
            </Typography>
            {popularExpanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
          </Box>

          <Collapse in={popularExpanded}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1.5 }}>
              {popularSuggestions.map((dish) => (
                <Box
                  key={dish.name}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 3,
                    p: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.3 }}>
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
                        color: '#60a5fa',
                        textDecoration: 'none',
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Найти рецепт
                      <OpenInNew sx={{ fontSize: 12 }} />
                    </Box>
                  </Box>

                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)', display: 'block', mb: 1 }}>
                    {dish.description}
                  </Typography>

                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                    {dish.cookingTime && (
                      <Chip
                        icon={<AccessTime sx={{ fontSize: '12px !important', color: 'rgba(255,255,255,0.4) !important' }} />}
                        label={dish.cookingTime}
                        size="small"
                        sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)', height: 22, fontSize: '0.68rem' }}
                      />
                    )}
                    {(dish.mainIngredients ?? []).map((ing) => (
                      <Chip
                        key={ing}
                        label={ing}
                        size="small"
                        sx={{ bgcolor: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.2)', height: 22, fontSize: '0.68rem' }}
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
  )
}
