import { useRef, useState, useCallback } from 'react'
import TinderCard from 'react-tinder-card'
import { motion } from 'framer-motion'

interface CardAPI {
  swipe(dir?: string): Promise<void>
  restoreCard(): Promise<void>
}
import { Box, Typography, IconButton, Button } from '@mui/material'
import { Close, Favorite, ArrowBack, Info } from '@mui/icons-material'
import { Dish } from '../../types'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { swipeDish, markSessionComplete, resetSwipe } from '../../store/slices/swipeSlice'
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
  const [swipeDirection, setSwipeDirection] = useState<Record<number, 'left' | 'right'>>({})

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
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, mb: 2 }}>
          Блюда не найдены
        </Typography>
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
    </Box>
  )
}
