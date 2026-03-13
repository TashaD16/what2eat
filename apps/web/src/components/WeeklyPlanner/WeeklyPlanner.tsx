import { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material'
import { ArrowBack, Add, Delete, MenuBook, ShoppingCart } from '@mui/icons-material'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { assignDishToDay, removeDishFromDay, DayOfWeek } from '../../store/slices/weeklyPlannerSlice'
import { useT } from '../../i18n/useT'

interface WeeklyPlannerProps {
  onDishSelect: (dishId: number) => void
  onBack: () => void
  onShoppingList?: (dishIds: number[]) => void
}

export default function WeeklyPlanner({ onDishSelect, onBack, onShoppingList }: WeeklyPlannerProps) {
  const dispatch = useAppDispatch()
  const t = useT()
  const DAY_LABELS: Record<DayOfWeek, string> = {
    mon: t.mon, tue: t.tue, wed: t.wed,
    thu: t.thu, fri: t.fri, sat: t.sat, sun: t.sun,
  }
  const DAYS = Object.keys(DAY_LABELS) as DayOfWeek[]
  const { plan } = useAppSelector((state) => state.weeklyPlanner)
  const { dishes } = useAppSelector((state) => state.dishes)
  const { likedDishIds } = useAppSelector((state) => state.swipe)

  const [addDialog, setAddDialog] = useState<{ open: boolean; day: DayOfWeek | null }>({
    open: false,
    day: null,
  })
  const [selectedDishId, setSelectedDishId] = useState<number | ''>('')

  const availableDishes = useMemo(
    () => dishes.filter((d) => likedDishIds.includes(d.id)),
    [dishes, likedDishIds]
  )

  const dishById = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes])

  const openAdd = (day: DayOfWeek) => {
    setSelectedDishId('')
    setAddDialog({ open: true, day })
  }

  const handleAdd = () => {
    if (addDialog.day && selectedDishId !== '') {
      dispatch(assignDishToDay({ day: addDialog.day, dishId: selectedDishId as number }))
    }
    setAddDialog({ open: false, day: null })
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Button variant="text" onClick={onBack} startIcon={<ArrowBack />}>
          {t.back}
        </Button>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>{t.weeklyPlannerTitle}</Typography>
        {onShoppingList && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<ShoppingCart />}
            onClick={() => {
              const ids = DAYS.map((d) => plan[d]).filter((id): id is number => id != null)
              onShoppingList(ids)
            }}
            disabled={DAYS.every((d) => plan[d] == null)}
          >
            {t.shoppingList}
          </Button>
        )}
      </Box>

      <Grid container spacing={1.5}>
        {DAYS.map((day) => {
          const dishId = plan[day]
          const dish = dishId != null ? dishById.get(dishId) : undefined

          return (
            <Grid item xs={12} sm={6} md={3} key={day}>
              <Paper
                variant="outlined"
                sx={{
                  p: 1.5,
                  minHeight: 120,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                }}
              >
                <Typography variant="subtitle2" color="text.secondary" fontWeight={700}>
                  {DAY_LABELS[day]}
                </Typography>

                {dish ? (
                  <>
                    <Typography variant="body2" fontWeight={500} sx={{ flexGrow: 1 }}>
                      {dish.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton size="small" onClick={() => onDishSelect(dish.id)} color="primary">
                        <MenuBook fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => dispatch(removeDishFromDay(day))}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconButton onClick={() => openAdd(day)} color="primary">
                      <Add />
                    </IconButton>
                  </Box>
                )}
              </Paper>
            </Grid>
          )
        })}
      </Grid>

      <Dialog open={addDialog.open} onClose={() => setAddDialog({ open: false, day: null })}>
        <DialogTitle>{t.chooseDish}</DialogTitle>
        <DialogContent sx={{ minWidth: 280, pt: 2 }}>
          {availableDishes.length === 0 ? (
            <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
              {t.swipeFirstHint}
            </Typography>
          ) : (
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t.dish}</InputLabel>
              <Select
                value={selectedDishId}
                label={t.dish}
                onChange={(e) => setSelectedDishId(e.target.value as number)}
              >
                {availableDishes.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <Button
            variant="contained"
            fullWidth
            onClick={handleAdd}
            disabled={selectedDishId === '' || availableDishes.length === 0}
          >
            {t.add}
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  )
}
