import { useState } from 'react'
import { Box, Typography, Chip, Skeleton } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { AccessTime, AttachMoney, ShoppingCart } from '@mui/icons-material'
import { Dish } from '@what2eat/types'
import { DIFFICULTY_COLORS } from '@what2eat/constants'
import { getDishImageUrl } from '../../utils/imageUtils'
import { useT } from '../../i18n/useT'

interface SwipeCardProps {
  dish: Dish
  swipeDirection: 'left' | 'right' | null
}

export default function SwipeCard({ dish, swipeDirection }: SwipeCardProps) {
  const imageUrl = getDishImageUrl(dish.name, dish.image_url)
  const fallbackUrl = getDishImageUrl(dish.name, null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const t = useT()

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: 4,
        overflow: 'hidden',
        boxShadow: isLight
          ? '0 24px 64px rgba(var(--w2e-primary-rgb),0.22), 0 8px 32px rgba(0,0,0,0.10)'
          : '0 24px 64px rgba(0,0,0,0.60)',
        border: isLight ? '1px solid rgba(var(--w2e-primary-rgb),0.20)' : 'none',
        cursor: 'grab',
        bgcolor: '#111',
        '&:active': { cursor: 'grabbing' },
      }}
    >
      {/* Skeleton shimmer while image loads */}
      {!imgLoaded && (
        <Skeleton
          variant="rectangular"
          animation="wave"
          sx={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            bgcolor: 'rgba(255,255,255,0.06)',
            '&::after': {
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent)',
            },
          }}
        />
      )}

      {/* Photo */}
      <Box
        component="img"
        src={imageUrl}
        alt={dish.name}
        onLoad={() => setImgLoaded(true)}
        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
          e.currentTarget.src = fallbackUrl
          setImgLoaded(true)
        }}
        sx={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'block',
          opacity: imgLoaded ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      />

      {/* Gradient overlay */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '72%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)',
        }}
      />

      {/* Content */}
      <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, p: 3 }}>
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 800,
            mb: 1.5,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            textShadow: '0 2px 12px rgba(0,0,0,0.5)',
          }}
        >
          {dish.name}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: dish.missing_ingredients?.length ? 1.5 : 0 }}>
          <Chip
            icon={<AccessTime sx={{ color: 'white !important', fontSize: 14 }} />}
            label={t.min(dish.cooking_time)}
            size="small"
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              color: 'white',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              fontWeight: 500,
            }}
          />
          <Chip
            label={{ easy: t.easy, medium: t.medium, hard: t.hard }[dish.difficulty]}
            size="small"
            sx={{ bgcolor: DIFFICULTY_COLORS[dish.difficulty], color: 'white', fontWeight: 600 }}
          />
          {dish.estimated_cost != null && (
            <Chip
              icon={<AttachMoney sx={{ color: 'white !important', fontSize: 14 }} />}
              label={`$${dish.estimated_cost.toFixed(0)}`}
              size="small"
              sx={{
                bgcolor: 'rgba(34,197,94,0.3)',
                color: '#4ade80',
                border: '1px solid rgba(34,197,94,0.4)',
                fontWeight: 600,
              }}
            />
          )}
          {dish.is_vegan && (
            <Chip
              label={t.vegan}
              size="small"
              sx={{ bgcolor: 'rgba(34,197,94,0.25)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.35)' }}
            />
          )}
          {!dish.is_vegan && dish.is_vegetarian && (
            <Chip
              label={t.vegetarian}
              size="small"
              sx={{ bgcolor: 'rgba(251,191,36,0.2)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.3)' }}
            />
          )}
        </Box>

        {dish.missing_ingredients && dish.missing_ingredients.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.75,
              bgcolor: 'rgba(251,191,36,0.12)',
              border: '1px solid rgba(251,191,36,0.25)',
              borderRadius: 2,
              px: 1.5,
              py: 0.75,
            }}
          >
            <ShoppingCart sx={{ fontSize: 14, color: '#fbbf24' }} />
            <Typography variant="caption" sx={{ color: '#fbbf24', fontWeight: 500 }}>
              {t.toBuy(dish.missing_ingredients.map(i => i.name).join(', '))}
            </Typography>
          </Box>
        )}
      </Box>

      {/* YES overlay */}
      {swipeDirection === 'right' && (
        <Box
          sx={{
            position: 'absolute',
            top: 28,
            left: 24,
            border: '3px solid #22C55E',
            borderRadius: 2,
            px: 2,
            py: 0.75,
            transform: 'rotate(-12deg)',
            boxShadow: '0 0 24px rgba(34,197,94,0.5)',
            background: 'rgba(34,197,94,0.1)',
          }}
        >
          <Typography sx={{ color: '#22C55E', fontWeight: 900, fontSize: 28, letterSpacing: 3, lineHeight: 1 }}>
            {t.yes}
          </Typography>
        </Box>
      )}

      {/* NO overlay */}
      {swipeDirection === 'left' && (
        <Box
          sx={{
            position: 'absolute',
            top: 28,
            right: 24,
            border: '3px solid #FF4D4D',
            borderRadius: 2,
            px: 2,
            py: 0.75,
            transform: 'rotate(12deg)',
            boxShadow: '0 0 24px rgba(255,77,77,0.5)',
            background: 'rgba(255,77,77,0.1)',
          }}
        >
          <Typography sx={{ color: '#FF4D4D', fontWeight: 900, fontSize: 28, letterSpacing: 3, lineHeight: 1 }}>
            {t.no}
          </Typography>
        </Box>
      )}
    </Box>
  )
}
