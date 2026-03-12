import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material'
import { AccessTime, People, AttachMoney, ShoppingCart, DeleteOutline } from '@mui/icons-material'
import { motion } from 'framer-motion'
import { Dish, Difficulty } from '@what2eat/types'
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@what2eat/constants'
import { getDishImageUrl } from '../../utils/imageUtils'

interface DishCardProps {
  dish: Dish
  onSelect: (dishId: number) => void
  onRemove?: (dishId: number) => void
}

export default function DishCard({ dish, onSelect, onRemove }: DishCardProps) {
  const getDifficultyColor = (difficulty: Difficulty) => {
    return DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.easy
  }

  const imageUrl = getDishImageUrl(dish.name, dish.image_url)
  const fallbackUrl = `https://source.unsplash.com/featured/600x400/?food,cooking`

  return (
    <motion.div
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      whileTap={{ scale: 0.98 }}
      style={{ height: '100%' }}
    >
      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {onRemove && (
          <Tooltip title="Убрать из списка" placement="top">
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onRemove(dish.id) }}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 2,
                bgcolor: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(4px)',
                color: 'rgba(255,255,255,0.8)',
                '&:hover': { bgcolor: 'rgba(220,50,50,0.8)', color: 'white' },
              }}
            >
              <DeleteOutline fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        <CardMedia
          component="img"
          image={imageUrl}
          alt={dish.name}
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            e.currentTarget.src = fallbackUrl
          }}
          sx={{ height: 200, objectFit: 'cover' }}
        />
        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 2.5 }}>
          <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 700, lineHeight: 1.3 }}>
            {dish.name}
          </Typography>
          {dish.description && (
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, flexGrow: 1, lineHeight: 1.5 }}>
              {dish.description}
            </Typography>
          )}
          <Box sx={{ display: 'flex', gap: 0.75, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              icon={<AccessTime sx={{ fontSize: '14px !important' }} />}
              label={`${dish.cooking_time} мин`}
              size="small"
              variant="outlined"
            />
            <Chip
              icon={<People sx={{ fontSize: '14px !important' }} />}
              label={`${dish.servings} порц.`}
              size="small"
              variant="outlined"
            />
            <Chip
              label={DIFFICULTY_LABELS[dish.difficulty]}
              size="small"
              sx={{ bgcolor: getDifficultyColor(dish.difficulty), color: 'white', fontWeight: 600 }}
            />
            {dish.estimated_cost != null && (
              <Chip
                icon={<AttachMoney sx={{ fontSize: '14px !important', color: '#15803d !important' }} />}
                label={`$${dish.estimated_cost.toFixed(0)}`}
                size="small"
                sx={{
                  bgcolor: 'rgba(22,163,74,0.1)',
                  color: '#15803d',
                  border: '1px solid rgba(22,163,74,0.25)',
                }}
              />
            )}
            {dish.is_vegan && (
              <Chip label="Веган" size="small" sx={{ bgcolor: 'rgba(22,163,74,0.1)', color: '#15803d', border: '1px solid rgba(22,163,74,0.25)' }} />
            )}
            {!dish.is_vegan && dish.is_vegetarian && (
              <Chip label="Вегетар." size="small" sx={{ bgcolor: 'rgba(217,119,6,0.08)', color: '#b45309', border: '1px solid rgba(217,119,6,0.20)' }} />
            )}
          </Box>
          {dish.match_count !== undefined && (
            <Typography variant="caption" sx={{ color: 'text.disabled', mb: 1, display: 'block' }}>
              Совпадений: {dish.match_count}
            </Typography>
          )}
          {dish.missing_ingredients && dish.missing_ingredients.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                mb: 1.5,
                bgcolor: 'rgba(251,191,36,0.08)',
                border: '1px solid rgba(251,191,36,0.2)',
                borderRadius: 2,
                px: 1.25,
                py: 0.75,
              }}
            >
              <ShoppingCart sx={{ fontSize: 13, color: '#b45309' }} />
              <Typography variant="caption" sx={{ color: '#b45309', fontWeight: 500 }}>
                Докупить: {dish.missing_ingredients.map(i => i.name).join(', ')}
              </Typography>
            </Box>
          )}
          <Button
            variant="contained"
            fullWidth
            onClick={() => onSelect(dish.id)}
            sx={{ mt: 'auto' }}
          >
            Посмотреть рецепт
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
