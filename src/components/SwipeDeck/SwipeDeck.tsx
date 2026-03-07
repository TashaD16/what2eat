import { useRef, useState, useCallback, useEffect } from 'react'
import TinderCard from 'react-tinder-card'
import { motion } from 'framer-motion'

interface CardAPI {
  swipe(dir?: string): Promise<void>
  restoreCard(): Promise<void>
}
import { Box, Typography, IconButton, Button, Chip, Collapse } from '@mui/material'
import { Close, Favorite, ArrowBack, Info, Restaurant, ExpandMore, ExpandLess, OpenInNew, AccessTime } from '@mui/icons-material'
import { Dish } from '../../types'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { swipeDish, markSessionComplete, resetSwipe } from '../../store/slices/swipeSlice'
import { fetchSuggestedDishes } from '../../store/slices/dishesSlice'
import SwipeCard from './SwipeCard'

interface SwipeDeckProps {
  dishes: Dish[]
  onDishSelect: (dishId: number) => void
  onComplete: () => void
  onBack: () => void
}

export default function SwipeDeck({ dishes, onDishSelect, onComplete, onBack }: SwipeDeckProps) {
  const dispatch = useAppDispatch()
  const { currentIndex } = useAppSelector((state) => state.swipe)
  const { suggestedDishNames, popularSuggestions } = useAppSelector((state) => state.dishes)
  const { ingredients, selectedIngredients } = useAppSelector((state) => state.ingredients)
  const [swipeDirection, setSwipeDirection] = useState<Record<number, 'left' | 'right'>>({})
  const [popularExpanded, setPopularExpanded] = useState(false)

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
      dispatch(swipeDish({ dishId, direction: dir }))
      setSwipeDirection(prev => ({ ...prev, [dishId]: dir }))
    },
    [dispatch]
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
      onDishSelect(dishes[topDishIndex].id)
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
