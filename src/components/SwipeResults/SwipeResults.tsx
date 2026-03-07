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
  Alert,
} from '@mui/material'
import { ArrowBack, ShoppingCart, CalendarMonth, Refresh } from '@mui/icons-material'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { resetSwipe } from '../../store/slices/swipeSlice'
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
  const [planDialog, setPlanDialog] = useState<{ open: boolean; dishId: number | null }>({
    open: false,
    dishId: null,
  })
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('mon')

  const likedDishes = useMemo(
    () => dishes.filter((d) => likedDishIds.includes(d.id)),
    [dishes, likedDishIds]
  )

  const handleRepeat = () => {
    dispatch(resetSwipe())
    onRepeat()
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Button variant="text" onClick={onBack} startIcon={<ArrowBack />}>
          Назад
        </Button>
        <Typography variant="h5">Понравившиеся блюда</Typography>
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

      {likedDishes.length === 0 ? (
        <Alert severity="info" sx={{ mb: 3 }}>
          Вы не выбрали ни одного блюда. Попробуйте ещё раз!
        </Alert>
      ) : (
        <Grid container spacing={2}>
          {likedDishes.map((dish) => (
            <Grid item xs={12} sm={6} md={4} key={dish.id}>
              <Box sx={{ position: 'relative' }}>
                <DishCard dish={dish} onSelect={onDishSelect} />
                <Button
                  size="small"
                  startIcon={<CalendarMonth />}
                  onClick={() => openPlanDialog(dish.id)}
                  sx={{ mt: 1, width: '100%' }}
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
    </Box>
  )
}
