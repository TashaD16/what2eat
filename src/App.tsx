import { useEffect, useState, useMemo } from 'react'
import { Box, Button, CircularProgress, Alert } from '@mui/material'
import { Casino, CameraAlt } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from './hooks/redux'
import { fetchIngredients } from './store/slices/ingredientsSlice'
import { findDishes, randomizeMeatDishes } from './store/slices/dishesSlice'
import { fetchRecipe } from './store/slices/recipeSlice'
import { resetSwipe } from './store/slices/swipeSlice'
import { initDatabase } from './services/database'
import Layout from './components/Layout'
import IngredientSelector from './components/IngredientSelector'
import RecipeView from './components/RecipeView'
import SearchFilters from './components/SearchFilters'
import SwipeDeck from './components/SwipeDeck'
import SwipeResults from './components/SwipeResults'
import ShoppingList from './components/ShoppingList'
import WeeklyPlanner from './components/WeeklyPlanner'
import PhotoUpload from './components/PhotoUpload'

type View = 'ingredients' | 'photo' | 'dishes' | 'swipe_results' | 'recipe' | 'shopping_list' | 'weekly_planner'

function App() {
  const dispatch = useAppDispatch()
  const [view, setView] = useState<View>('ingredients')
  const [dbInitialized, setDbInitialized] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const { selectedIngredients } = useAppSelector((state) => state.ingredients)
  const { dishes } = useAppSelector((state) => state.dishes)
  const filters = useAppSelector((state) => state.filters)

  useEffect(() => {
    let cancelled = false
    const initializeApp = async () => {
      try {
        await initDatabase()
        if (!cancelled) {
          setDbInitialized(true)
          dispatch(fetchIngredients())
        }
      } catch (error) {
        if (!cancelled) {
          setDbError(`Не удалось инициализировать базу данных: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`)
        }
      }
    }
    initializeApp()
    return () => { cancelled = true }
  }, [dispatch])

  // Применяем бюджетный фильтр поверх найденных блюд
  const visibleDishes = useMemo(() => {
    if (!filters.budgetEnabled || filters.budgetLimit == null) return dishes
    return dishes.filter(
      (d) => d.estimated_cost == null || d.estimated_cost <= filters.budgetLimit!
    )
  }, [dishes, filters.budgetEnabled, filters.budgetLimit])

  const dispatchFindDishes = (ids: number[]) => {
    dispatch(
      findDishes({
        ingredientIds: ids,
        options: {
          allowMissing: filters.allowMissing ? 2 : 0,
          vegetarianOnly: filters.vegetarianOnly,
          veganOnly: filters.veganOnly,
        },
      })
    )
  }

  const handleFindDishes = () => {
    if (selectedIngredients.length > 0) {
      dispatch(resetSwipe())
      dispatchFindDishes(selectedIngredients)
      setView('dishes')
    }
  }

  const handleRandomize = () => {
    dispatch(resetSwipe())
    dispatch(randomizeMeatDishes())
    setView('dishes')
  }

  const handleDishSelect = (dishId: number) => {
    dispatch(fetchRecipe(dishId))
    setView('recipe')
  }

  const handlePhotoIngredientsConfirmed = (ids: number[]) => {
    dispatch(resetSwipe())
    dispatchFindDishes(ids)
    setView('dishes')
  }

  if (!dbInitialized) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          {dbError ? (
            <Alert severity="error">{dbError}</Alert>
          ) : (
            <CircularProgress />
          )}
        </Box>
      </Layout>
    )
  }

  return (
    <Layout onPlannerClick={() => setView('weekly_planner')}>
      {view === 'ingredients' && (
        <Box>
          <IngredientSelector />
          <SearchFilters />
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleFindDishes}
              disabled={selectedIngredients.length === 0}
              sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
            >
              Найти блюда
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={handleRandomize}
              startIcon={<Casino />}
              sx={{ px: 3, py: 1.5 }}
            >
              Рандомайзер
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => setView('photo')}
              startIcon={<CameraAlt />}
              sx={{ px: 3, py: 1.5, borderColor: 'rgba(168,85,247,0.4)', color: '#A855F7', '&:hover': { borderColor: '#A855F7', bgcolor: 'rgba(168,85,247,0.08)' } }}
            >
              Загрузить фото
            </Button>
          </Box>
        </Box>
      )}

      {view === 'photo' && (
        <PhotoUpload
          onIngredientsConfirmed={handlePhotoIngredientsConfirmed}
          onBack={() => setView('ingredients')}
        />
      )}

      {view === 'dishes' && (
        <SwipeDeck
          dishes={visibleDishes}
          onDishSelect={handleDishSelect}
          onComplete={() => setView('swipe_results')}
          onBack={() => setView('ingredients')}
        />
      )}

      {view === 'swipe_results' && (
        <SwipeResults
          onDishSelect={handleDishSelect}
          onBack={() => setView('dishes')}
          onRepeat={() => setView('dishes')}
          onShoppingList={() => setView('shopping_list')}
        />
      )}

      {view === 'recipe' && (
        <RecipeView onBack={() => setView('swipe_results')} />
      )}

      {view === 'shopping_list' && (
        <ShoppingList onBack={() => setView('swipe_results')} />
      )}

      {view === 'weekly_planner' && (
        <WeeklyPlanner
          onDishSelect={handleDishSelect}
          onBack={() => setView('ingredients')}
        />
      )}
    </Layout>
  )
}

export default App

