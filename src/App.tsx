import { useEffect, useState, useMemo, useCallback } from 'react'
import { Box, Button, CircularProgress, Alert, Typography } from '@mui/material'
import { Casino, CameraAlt, AutoAwesome } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from './hooks/redux'
import { fetchIngredients } from './store/slices/ingredientsSlice'
import { findDishes, generateAIRandomDishes } from './store/slices/dishesSlice'
import { fetchRecipe } from './store/slices/recipeSlice'
import { resetSwipe, syncFavoritesFromSupabase, migrateLocalFavorites } from './store/slices/swipeSlice'
import { initAuth, signOut } from './store/slices/authSlice'
import { generateAIRecipe, setGeneratedRecipe } from './store/slices/aiRecipeSlice'
import { initDatabase } from './services/database'
import { supabase } from './services/supabase'
import Layout from './components/Layout'
import IngredientSelector from './components/IngredientSelector'
import RecipeView from './components/RecipeView'
import SearchFilters from './components/SearchFilters'
import SwipeDeck from './components/SwipeDeck'
import SwipeResults from './components/SwipeResults'
import ShoppingList from './components/ShoppingList'
import WeeklyPlanner from './components/WeeklyPlanner'
import PhotoUpload from './components/PhotoUpload'
import AuthModal from './components/Auth'
import AIRecipeView from './components/AIRecipeView'

type View = 'ingredients' | 'photo' | 'dishes' | 'swipe_results' | 'recipe' | 'shopping_list' | 'weekly_planner' | 'ai_recipe'

function App() {
  const dispatch = useAppDispatch()
  const [view, setView] = useState<View>('ingredients')
  const [prevView, setPrevView] = useState<View>('swipe_results')
  const [dbInitialized, setDbInitialized] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const { selectedIngredients, ingredients } = useAppSelector((state) => state.ingredients)
  const { dishes, loading: dishesLoading, aiDishRecipes } = useAppSelector((state) => state.dishes)
  const filters = useAppSelector((state) => state.filters)
  const { likedDishIds } = useAppSelector((state) => state.swipe)
  const { user } = useAppSelector((state) => state.auth)

  useEffect(() => {
    let cancelled = false
    const initializeApp = async () => {
      try {
        await initDatabase()
        if (!cancelled) {
          setDbInitialized(true)
          dispatch(fetchIngredients())
          dispatch(initAuth())
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

  // Listen to auth state changes from Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Migrate local favorites then sync from Supabase
        const localIds = likedDishIds
        if (localIds.length > 0) {
          dispatch(migrateLocalFavorites({ userId: session.user.id, localIds }))
        }
        dispatch(syncFavoritesFromSupabase(session.user.id))
      }
    })
    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch])

  const handleSignOut = () => {
    dispatch(signOut())
  }

  const handleGenerateAIRecipe = () => {
    const selectedNames = ingredients
      .filter((i) => selectedIngredients.includes(i.id))
      .map((i) => i.name)
    if (selectedNames.length === 0) return
    dispatch(generateAIRecipe(selectedNames))
    setPrevView('ingredients')
    setView('ai_recipe')
  }

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
    dispatch(generateAIRandomDishes())
    setView('dishes')
  }

  const handleDishSelect = useCallback((dishId: number, from: View = 'swipe_results') => {
    if (dishId < 0) {
      // AI-generated dish from randomizer — show AI recipe view
      const aiRecipe = aiDishRecipes[dishId]
      if (aiRecipe) {
        dispatch(setGeneratedRecipe(aiRecipe))
        setPrevView(from)
        setView('ai_recipe')
      }
    } else {
      dispatch(fetchRecipe(dishId))
      setPrevView(from)
      setView('recipe')
    }
  }, [dispatch, aiDishRecipes])

  const handlePhotoIngredientsConfirmed = (ids: number[]) => {
    dispatch(resetSwipe())
    dispatch(
      findDishes({
        ingredientIds: ids,
        options: {
          allowMissing: 3,
          vegetarianOnly: filters.vegetarianOnly,
          veganOnly: filters.veganOnly,
        },
      })
    )
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
    <Layout
      onPlannerClick={() => setView('weekly_planner')}
      likedCount={likedDishIds.length}
      onFavoritesClick={() => setView('swipe_results')}
      user={user}
      onAuthClick={() => setAuthModalOpen(true)}
      onSignOut={handleSignOut}
    >
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
            <Button
              variant="outlined"
              size="large"
              onClick={handleGenerateAIRecipe}
              disabled={selectedIngredients.length === 0}
              startIcon={<AutoAwesome />}
              sx={{ px: 3, py: 1.5, borderColor: 'rgba(255,149,0,0.4)', color: '#FF9500', '&:hover': { borderColor: '#FF9500', bgcolor: 'rgba(255,149,0,0.08)' } }}
            >
              AI-рецепт
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
        dishesLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 3 }}>
            <CircularProgress size={56} sx={{ color: '#FF9500' }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 1.8 }}>
              Ищем рецепты в интернете<br />и создаём фото блюд...
            </Typography>
          </Box>
        ) : (
          <SwipeDeck
            dishes={visibleDishes}
            onDishSelect={(dishId) => handleDishSelect(dishId, 'dishes')}
            onComplete={() => setView('swipe_results')}
            onBack={() => setView('ingredients')}
          />
        )
      )}

      {view === 'swipe_results' && (
        <SwipeResults
          onDishSelect={(dishId) => handleDishSelect(dishId, 'swipe_results')}
          onBack={() => setView('dishes')}
          onRepeat={() => setView('dishes')}
          onShoppingList={() => setView('shopping_list')}
        />
      )}

      {view === 'recipe' && (
        <RecipeView onBack={() => setView(prevView)} />
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

      {view === 'ai_recipe' && (
        <AIRecipeView onBack={() => setView(prevView)} />
      )}

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </Layout>
  )
}

export default App

