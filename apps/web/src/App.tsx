import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Box, Button, CircularProgress, Alert, Typography, TextField, Paper, InputAdornment, List, ListItemButton, ListItemText, Badge, Chip, Drawer, Collapse, IconButton } from '@mui/material'
import { Casino, CameraAlt, AutoAwesome, Search, Close, Tune, Add, Edit } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from './hooks/redux'
import { fetchIngredients, toggleIngredient } from './store/slices/ingredientsSlice'
import { findDishes, generateAIRandomDishes, addAIDish } from './store/slices/dishesSlice'
import { fetchRecipe } from './store/slices/recipeSlice'
import { resetSwipe, syncFavoritesFromSupabase, migrateLocalFavorites } from './store/slices/swipeSlice'
import { initAuth, signOut } from './store/slices/authSlice'
import { generateAIRecipe, setGeneratedRecipe } from './store/slices/aiRecipeSlice'
import { initDatabase } from './services/database'
import { searchDishesByName } from './services/dishes'
import { supabase, isSupabaseConfigured } from './services/supabase'
import { searchGlobalRecipesByIngredients } from './services/globalRecipes'
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
import LoginScreen from './components/Auth/LoginScreen'
import AIRecipeView from './components/AIRecipeView'

type View = 'ingredients' | 'photo' | 'dishes' | 'swipe_results' | 'recipe' | 'shopping_list' | 'weekly_planner' | 'ai_recipe'

function App() {
  const dispatch = useAppDispatch()
  const [view, setView] = useState<View>('ingredients')
  const [prevView, setPrevView] = useState<View>('swipe_results')
  const [dbInitialized, setDbInitialized] = useState(false)
  const [dbError, setDbError] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [currentAiDishId, setCurrentAiDishId] = useState<number | null>(null)
  const [plannerShoppingDishIds, setPlannerShoppingDishIds] = useState<number[] | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string }>>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const { selectedIngredients, ingredients } = useAppSelector((state) => state.ingredients)
  const { dishes, loading: dishesLoading, loadingMore, loadingStep, aiDishRecipes, error: dishesError } = useAppSelector((state) => state.dishes)
  const filters = useAppSelector((state) => state.filters)
  const { likedDishIds } = useAppSelector((state) => state.swipe)
  const { user, initialized: authInitialized } = useAppSelector((state) => state.auth)

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
    dispatch(generateAIRecipe({ ingredientNames: selectedNames, cuisine: filters.cuisine }))
    setPrevView('ingredients')
    setView('ai_recipe')
  }

  const activeFilterCount = [
    filters.vegetarianOnly || filters.veganOnly,
    filters.cuisine != null,
    filters.allowMissing,
    filters.budgetEnabled,
  ].filter(Boolean).length

  const selectedIngredientObjects = useMemo(
    () => ingredients.filter((i) => selectedIngredients.includes(i.id)),
    [ingredients, selectedIngredients]
  )

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
          cuisine: filters.cuisine,
        },
      })
    )
  }

  const handleFindDishes = async () => {
    if (selectedIngredients.length === 0) return
    dispatch(resetSwipe())
    dispatchFindDishes(selectedIngredients)
    setView('dishes')

    if (isSupabaseConfigured()) {
      const selectedNames = ingredients
        .filter((i) => selectedIngredients.includes(i.id))
        .map((i) => i.name)
      const globalRecipes = await searchGlobalRecipesByIngredients(selectedNames)
      globalRecipes.forEach((recipe, i) => {
        dispatch(addAIDish({ recipe, index: 10000 + i }))
      })
    }
  }

  const handleRandomize = () => {
    dispatch(resetSwipe())
    dispatch(generateAIRandomDishes(filters.cuisine))
    setView('dishes')
  }

  const handleDishSelect = useCallback((dishId: number, from: View = 'swipe_results') => {
    if (dishId < 0) {
      // AI-generated dish from randomizer — show AI recipe view
      const aiRecipe = aiDishRecipes[dishId]
      if (aiRecipe) {
        dispatch(setGeneratedRecipe(aiRecipe))
        setCurrentAiDishId(dishId)
        setPrevView(from)
        setView('ai_recipe')
      }
    } else {
      dispatch(fetchRecipe(dishId))
      setPrevView(from)
      setView('recipe')
    }
  }, [dispatch, aiDishRecipes])

  const handleSearchQueryChange = useCallback(async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    const results = await searchDishesByName(query.trim())
    setSearchResults(results.slice(0, 6).map((d) => ({ id: d.id, name: d.name })))
  }, [])

  const handleSearchSelect = (dishId: number) => {
    setSearchQuery('')
    setSearchResults([])
    handleDishSelect(dishId, 'ingredients')
  }

  const handlePhotoIngredientsConfirmed = (ids: number[]) => {
    dispatch(resetSwipe())
    dispatch(
      findDishes({
        ingredientIds: ids,
        options: {
          allowMissing: filters.allowMissing ? 3 : 2,
          vegetarianOnly: filters.vegetarianOnly,
          veganOnly: filters.veganOnly,
          cuisine: filters.cuisine,
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

  // Show loading spinner while checking auth session
  if (!authInitialized) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#0a0a0a' }}>
        <CircularProgress />
      </Box>
    )
  }

  // Require login before accessing the app
  if (!user) {
    return <LoginScreen />
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
          {/* === Поиск + кнопка фильтров === */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1, position: 'relative' }} ref={searchRef}>
            <TextField
              fullWidth
              placeholder="Найти рецепт по названию..."
              value={searchQuery}
              onChange={(e) => handleSearchQueryChange(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment>,
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <Close sx={{ cursor: 'pointer', color: 'text.secondary', fontSize: 18 }} onClick={() => { setSearchQuery(''); setSearchResults([]) }} />
                  </InputAdornment>
                ) : undefined,
              }}
            />
            <Badge badgeContent={activeFilterCount || undefined} color="primary">
              <IconButton
                onClick={() => setFiltersOpen((v) => !v)}
                sx={{
                  border: '1px solid',
                  borderColor: filtersOpen ? 'primary.main' : 'rgba(255,255,255,0.15)',
                  borderRadius: 1,
                  color: filtersOpen ? 'primary.main' : 'rgba(255,255,255,0.5)',
                }}
              >
                <Tune sx={{ fontSize: 20 }} />
              </IconButton>
            </Badge>
            {searchResults.length > 0 && (
              <Paper sx={{ position: 'absolute', top: '100%', left: 0, right: 48, zIndex: 10, mt: 0.5, maxHeight: 280, overflow: 'auto' }}>
                <List dense disablePadding>
                  {searchResults.map((r) => (
                    <ListItemButton key={r.id} onClick={() => handleSearchSelect(r.id)}>
                      <ListItemText primary={r.name} />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {/* === Панель фильтров === */}
          <Collapse in={filtersOpen}>
            <Paper variant="outlined" sx={{ mb: 2, p: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <SearchFilters />
            </Paper>
          </Collapse>

          {/* === Быстрые действия === */}
          <Box sx={{ mb: 3, mt: filtersOpen ? 0 : 2 }}>
            <Button
              variant="outlined"
              fullWidth
              size="large"
              onClick={() => setView('photo')}
              startIcon={<CameraAlt sx={{ fontSize: 28 }} />}
              sx={{
                py: 2,
                mb: 1.5,
                fontSize: '1.05rem',
                borderColor: 'rgba(168,85,247,0.4)',
                color: '#A855F7',
                '&:hover': { borderColor: '#A855F7', bgcolor: 'rgba(168,85,247,0.08)' },
              }}
            >
              Загрузить фото
            </Button>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleRandomize}
                startIcon={<Casino />}
                sx={{
                  py: 1.75,
                  borderColor: 'rgba(255,255,255,0.2)',
                  '&:hover': { borderColor: 'rgba(255,255,255,0.4)', bgcolor: 'rgba(255,255,255,0.05)' },
                }}
              >
                Рандомайзер
              </Button>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleGenerateAIRecipe}
                disabled={selectedIngredients.length === 0}
                startIcon={<AutoAwesome />}
                sx={{
                  py: 1.75,
                  borderColor: 'rgba(252,187,0,0.4)',
                  color: '#fcbb00',
                  '&:hover': { borderColor: '#fcbb00', bgcolor: 'rgba(252,187,0,0.08)' },
                  '&.Mui-disabled': { borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.2)' },
                }}
              >
                AI-рецепт
              </Button>
            </Box>
          </Box>

          {/* === Кнопка открытия Drawer === */}
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setDrawerOpen(true)}
            startIcon={selectedIngredients.length > 0 ? <Edit /> : <Add />}
            sx={{
              mb: selectedIngredients.length > 0 ? 1 : 2,
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.7)',
              '&:hover': { borderColor: 'rgba(255,255,255,0.4)', bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            {selectedIngredients.length > 0
              ? `Продукты (${selectedIngredients.length})`
              : 'Выбрать продукты'}
          </Button>

          {/* === Чипы выбранных ингредиентов === */}
          {selectedIngredients.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
              {selectedIngredientObjects.map((ing) => (
                <Chip
                  key={ing.id}
                  label={ing.name}
                  size="small"
                  onDelete={() => dispatch(toggleIngredient(ing.id))}
                  sx={{
                    bgcolor: 'rgba(25,118,210,0.15)',
                    color: '#90caf9',
                    borderColor: 'rgba(25,118,210,0.3)',
                    '& .MuiChip-deleteIcon': { color: 'rgba(144,202,249,0.6)', '&:hover': { color: '#90caf9' } },
                  }}
                  variant="outlined"
                />
              ))}
            </Box>
          )}

          {/* === CTA === */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleFindDishes}
            disabled={selectedIngredients.length === 0}
            sx={{ py: 1.75, fontSize: '1rem' }}
          >
            Найти блюда
          </Button>

          {/* === Bottom Drawer === */}
          <Drawer
            anchor="bottom"
            open={drawerOpen}
            onClose={() => setDrawerOpen(false)}
            PaperProps={{ sx: { borderRadius: '16px 16px 0 0', maxHeight: '80vh' } }}
          >
            <Box sx={{ p: 2, pb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Выберите продукты</Typography>
                <Button onClick={() => setDrawerOpen(false)} variant="contained" size="small">
                  Готово{selectedIngredients.length > 0 ? ` (${selectedIngredients.length})` : ''}
                </Button>
              </Box>
              <IngredientSelector />
            </Box>
          </Drawer>
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
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontWeight: 600, mb: 0.5 }}>
                {loadingStep === 'search' ? 'Загружаем рецепты...' : 'Переводим и готовим блюда...'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                {loadingStep === 'search'
                  ? 'Получаем рецепты из открытых источников'
                  : 'Первое блюдо появится через несколько секунд'}
              </Typography>
            </Box>
          </Box>
        ) : dishesError && visibleDishes.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>{dishesError}</Alert>
            <Button
              variant="contained"
              onClick={handleRandomize}
              sx={{ mr: 2 }}
            >
              Попробовать снова
            </Button>
            <Button variant="outlined" onClick={() => setView('ingredients')}>
              На главную
            </Button>
          </Box>
        ) : (
          <SwipeDeck
            dishes={visibleDishes}
            loadingMore={loadingMore}
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
        <ShoppingList
          onBack={() => {
            setPlannerShoppingDishIds(undefined)
            setView(plannerShoppingDishIds ? 'weekly_planner' : 'swipe_results')
          }}
          plannerDishIds={plannerShoppingDishIds}
        />
      )}

      {view === 'weekly_planner' && (
        <WeeklyPlanner
          onDishSelect={handleDishSelect}
          onBack={() => setView('ingredients')}
          onShoppingList={(ids) => {
            setPlannerShoppingDishIds(ids)
            setView('shopping_list')
          }}
        />
      )}

      {view === 'ai_recipe' && (
        <AIRecipeView dishId={currentAiDishId} onBack={() => setView(prevView)} />
      )}

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </Layout>
  )
}

export default App

