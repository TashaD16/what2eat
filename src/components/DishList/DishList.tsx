import { Box, Typography, Grid, CircularProgress, Alert, Button } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useEffect, useRef } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { findDishes, clearDishes } from '../../store/slices/dishesSlice'
import { clearSelection } from '../../store/slices/ingredientsSlice'
import DishCard from './DishCard'

interface DishListProps {
  onDishSelect: (dishId: number) => void
  onBack: () => void
}

export default function DishList({ onDishSelect, onBack }: DishListProps) {
  const dispatch = useAppDispatch()
  const { dishes, loading, error } = useAppSelector((state) => state.dishes)
  const { selectedIngredients } = useAppSelector((state) => state.ingredients)
  const lastSearchedRef = useRef<string>('')

  useEffect(() => {
    // Создаем строку из ID для сравнения, чтобы избежать повторных запросов
    const ingredientIdsString = selectedIngredients.map(id => id).sort().join(',')
    
    if (
      selectedIngredients.length > 0 && 
      dishes.length === 0 && 
      !loading && 
      ingredientIdsString !== lastSearchedRef.current
    ) {
      lastSearchedRef.current = ingredientIdsString
      console.log('DishList: Triggering search for ingredients:', selectedIngredients)
      dispatch(findDishes({ ingredientIds: selectedIngredients }))
    }
  }, [dispatch, selectedIngredients, dishes.length, loading])

  const handleBack = () => {
    dispatch(clearDishes())
    dispatch(clearSelection())
    onBack()
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          {selectedIngredients.length > 0 ? 'Найдено блюд' : 'Рекомендуемые блюда'}: {dishes.length}
        </Typography>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
          Назад
        </Button>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && dishes.length > 0 && (
        <Grid container spacing={3}>
          {dishes.map((dish) => (
            <Grid item xs={12} sm={6} md={4} key={dish.id}>
              <DishCard dish={dish} onSelect={onDishSelect} />
            </Grid>
          ))}
        </Grid>
      )}

      {!loading && dishes.length === 0 && !error && (
        <Alert severity="info">
          Блюда с выбранными ингредиентами не найдены. Попробуйте выбрать другие ингредиенты.
        </Alert>
      )}
    </Box>
  )
}

