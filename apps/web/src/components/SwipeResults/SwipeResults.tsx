import { useMemo, useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Snackbar,
} from '@mui/material'
import { ArrowBack, ShoppingCart, CalendarMonth, Refresh, FavoriteBorder } from '@mui/icons-material'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { resetSwipe, unlikeDish } from '../../store/slices/swipeSlice'
import { assignDishToDay, DayOfWeek } from '../../store/slices/weeklyPlannerSlice'
import DishCard from '../DishList/DishCard'

const DAY_LABELS: Record<DayOfWeek, string> = {
  mon: 'Понедельник',
  tue: 'Вторник',
  wed: 'Среда',
  thu: 'Четверг',
  fri: 'Пятница',
  sat: 'Суббота',
  sun: 'Воскресенье',
}

interface SwipeResultsProps {
  onDishSelect: (dishId: number) => void
  onBack: () => void
  onRepeat: () => void
  onShoppingList: () => void
}

export default function SwipeResults({ onDishSelect, onBack, onRepeat, onShoppingList }: SwipeResultsProps) {
  const dispatch = useAppDispatch()
  const { likedDishIds } = useAppSelector((state) => state.swipe)
  const { dishes } = useAppSelector((state) => state.dishes)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const [planDialog, setPlanDialog] = useState<{ open: boolean; dishId: number | null }>({
    open: false,
    dishId: null,
  })
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('mon')
  const [removedSnack, setRemovedSnack] = useState(false)

  const likedDishes = useMemo(
    () => dishes.filter((d) => likedDishIds.includes(d.id)),
    [dishes, likedDishIds]
  )

  const handleRepeat = () => {
    dispatch(resetSwipe())
    onRepeat()
  }

  const handleRemove = (dishId: number) => {
    dispatch(unlikeDish({ dishId, userId }))
    setRemovedSnack(true)
  }

  const openPlanDialog = (dishId: number) => {
    setPlanDialog({ open: true, dishId })
  }

  const handleAddToPlan = () => {
    if (planDialog.dishId != null) {
      dispatch(assignDishToDay({ day: selectedDay, dishId: planDialog.dishId }))
    }
    setPlanDialog({ open: false, dishId: null })
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Button variant="text" onClick={onBack} startIcon={<ArrowBack />}>
          Назад
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FavoriteBorder sx={{ color: '#FF4D4D', fontSize: 22 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Понравившиеся блюда
          </Typography>
          {likedDishes.length > 0 && (
            <Chip
              label={likedDishes.length}
              size="small"
              sx={{ bgcolor: '#FF4D4D', color: 'white', fontWeight: 700, height: 22, fontSize: '0.78rem' }}
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<ShoppingCart />}
            onClick={onShoppingList}
            disabled={likedDishes.length === 0}
            size="small"
          >
            Список покупок
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleRepeat} size="small">
            Повторить
          </Button>
        </Box>
      </Box>

      {/* Content */}
      {likedDishes.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
            px: 2,
            borderRadius: 4,
            border: '1px dashed rgba(0,0,0,0.15)',
          }}
        >
          <FavoriteBorder sx={{ fontSize: 52, color: 'rgba(0,0,0,0.15)', mb: 2 }} />
          <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
            Нет понравившихся блюд
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>
            Свайпайте вправо, чтобы сохранить блюдо
          </Typography>
          <Button variant="contained" onClick={handleRepeat} startIcon={<Refresh />}>
            Начать поиск
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {likedDishes.map((dish) => (
            <Grid item xs={12} sm={6} md={4} key={dish.id}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
                <DishCard dish={dish} onSelect={onDishSelect} onRemove={handleRemove} />
                <Button
                  size="small"
                  startIcon={<CalendarMonth />}
                  onClick={() => openPlanDialog(dish.id)}
                  sx={{ width: '100%' }}
                  variant="outlined"
                  color="secondary"
                >
                  В планировщик
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Planner dialog */}
      <Dialog open={planDialog.open} onClose={() => setPlanDialog({ open: false, dishId: null })}>
        <DialogTitle>Добавить в планировщик</DialogTitle>
        <DialogContent sx={{ minWidth: 280, pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>День недели</InputLabel>
            <Select
              value={selectedDay}
              label="День недели"
              onChange={(e) => setSelectedDay(e.target.value as DayOfWeek)}
            >
              {(Object.entries(DAY_LABELS) as [DayOfWeek, string][]).map(([key, label]) => (
                <MenuItem key={key} value={key}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="contained" fullWidth onClick={handleAddToPlan}>
            Добавить
          </Button>
        </DialogContent>
      </Dialog>

      {/* Undo snackbar */}
      <Snackbar
        open={removedSnack}
        autoHideDuration={2500}
        onClose={() => setRemovedSnack(false)}
        message="Блюдо удалено из избранного"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
