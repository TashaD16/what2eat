import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { Box, Button, CircularProgress, Alert, Typography, TextField, Paper, InputAdornment, List, ListItemButton, ListItemText, Badge, Chip, Collapse, IconButton, Tooltip } from '@mui/material'
import { Casino, AutoAwesome, Search, Close, Tune, Add, Edit, DeleteOutline } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from './hooks/redux'
import { fetchIngredients, toggleIngredient, setSelectedIngredients } from './store/slices/ingredientsSlice'
import { findDishes, generateAIRandomDishes, addAIDishes, setLoading } from './store/slices/dishesSlice'
import { fetchRecipe } from './store/slices/recipeSlice'
import { resetSwipe, syncFavoritesFromSupabase, migrateLocalFavorites, loadFavoritesFromSupabase } from './store/slices/swipeSlice'
import { setLang } from './store/slices/langSlice'
import { initAuth, signOut } from './store/slices/authSlice'
import { generateAIRecipe, setGeneratedRecipe } from './store/slices/aiRecipeSlice'
import { supabase, isSupabaseConfigured } from './services/supabase'
import { searchGlobalRecipesByIngredients, searchGlobalRecipesByName, getGlobalRecipeById, saveGlobalRecipe } from './services/globalRecipes'
import { searchRecipesByIngredients } from './services/aiRecipes'
import Layout from './components/Layout'
import IngredientSelector from './components/IngredientSelector'
import RecipeView from './components/RecipeView'
import SearchFilters from './components/SearchFilters'
import SwipeDeck from './components/SwipeDeck'
import SwipeResults from './components/SwipeResults'
import ShoppingList from './components/ShoppingList'
import WeeklyPlanner from './components/WeeklyPlanner'
import PhotoDropZone from './components/PhotoDropZone'
import AuthModal from './components/Auth'
import LoginScreen from './components/Auth/LoginScreen'
import AIRecipeView from './components/AIRecipeView'
import { useT } from './i18n/useT'

type View = 'ingredients' | 'dishes' | 'swipe_results' | 'recipe' | 'shopping_list' | 'weekly_planner' | 'ai_recipe'

function App() {
  const dispatch = useAppDispatch()
  const [view, setView] = useState<View>('ingredients')
  const [prevView, setPrevView] = useState<View>('swipe_results')
  const [appReady, setAppReady] = useState(false)
  const [appError, setAppError] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [currentAiDishId, setCurrentAiDishId] = useState<number | null>(null)
  const [plannerShoppingDishIds, setPlannerShoppingDishIds] = useState<number[] | undefined>(undefined)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ id: string | number; name: string }>>([])
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [selectorOpen, setSelectorOpen] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const selectorRef = useRef<HTMLDivElement>(null)
  const { selectedIngredients, ingredients } = useAppSelector((state) => state.ingredients)
  const { dishes, loading: dishesLoading, loadingMore, loadingStep, aiDishRecipes, error: dishesError } = useAppSelector((state) => state.dishes)
  const filters = useAppSelector((state) => state.filters)
  const { likedDishIds, dislikedDishIds, likedDishes } = useAppSelector((state) => state.swipe)
  const { user, initialized: authInitialized } = useAppSelector((state) => state.auth)
  const lang = useAppSelector((state) => state.lang.lang)
  const t = useT()

  useEffect(() => {
    let cancelled = false
    const initializeApp = async () => {
      try {
        if (!isSupabaseConfigured()) {
          if (!cancelled) setAppError(t.supabaseError)
          return
        }
        dispatch(initAuth())
        await dispatch(fetchIngredients()).unwrap()
        if (!cancelled) setAppReady(true)
      } catch (error) {
        if (!cancelled) {
          setAppError(t.loadError(error instanceof Error ? error.message : 'Unknown error'))
        }
      }
    }
    initializeApp()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        dispatch(loadFavoritesFromSupabase(session.user.id))
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

  const handlePhotoDetected = useCallback((ids: number[]) => {
    if (ids.length > 0) {
      dispatch(setSelectedIngredients(ids))
    }
  }, [dispatch])

  // Close ingredient selector when clicking outside
  useEffect(() => {
    if (!selectorOpen) return
    const handler = (e: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(e.target as Node)) {
        setSelectorOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [selectorOpen])

  useEffect(() => {
    if (!selectorOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelectorOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [selectorOpen])

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

  // Бюджетный фильтр + сортировка: без оценки → лайк → дизлайк
  const visibleDishes = useMemo(() => {
    let list = dishes
    if (filters.budgetEnabled && filters.budgetLimit != null) {
      list = list.filter((d) => d.estimated_cost == null || d.estimated_cost <= filters.budgetLimit!)
    }
    const rank = (id: number) => {
      if (likedDishIds.includes(id)) return 1
      if (dislikedDishIds.includes(id)) return 2
      return 0
    }
    return [...list].sort((a, b) => rank(a.id) - rank(b.id))
  }, [dishes, filters.budgetEnabled, filters.budgetLimit, likedDishIds, dislikedDishIds])

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
    dispatch(setLoading(true))
    setView('dishes')

    if (isSupabaseConfigured()) {
      const selectedNames = ingredients
        .filter((i) => selectedIngredients.includes(i.id))
        .map((i) => i.name)
      const spiceNames = ingredients.filter((i) => i.category === 'spices').map((i) => i.name)
      const globalRecipes = await searchGlobalRecipesByIngredients(selectedNames, {
        strictOnlySelectedAndSpices: !filters.allowMissing,
        spiceNames,
        lang,
      })

      if (globalRecipes.length > 0) {
        // Found in DB — show immediately
        dispatch(addAIDishes(globalRecipes.map((recipe, i) => ({ recipe, index: i }))))
        dispatch(setLoading(false))
      } else {
        // Nothing in DB — generate via TheMealDB + GPT and save back
        try {
          const generated = await searchRecipesByIngredients(selectedNames, 5, lang)
          if (generated.length > 0) {
            // Save to DB in background (no await — don't block UI)
            generated.forEach((r) => saveGlobalRecipe(r))
            dispatch(addAIDishes(generated.map((recipe, i) => ({ recipe, index: i }))))
          }
        } catch { /* silently fail — show empty state */ }
        dispatch(setLoading(false))
      }
    } else {
      dispatchFindDishes(selectedIngredients)
    }
  }

  const handleRandomize = () => {
    dispatch(resetSwipe())
    dispatch(generateAIRandomDishes(filters.cuisine))
    setView('dishes')
  }

  const handleDishSelect = useCallback((dishId: number, from: View = 'swipe_results') => {
    const aiRecipe = aiDishRecipes[dishId]
    if (aiRecipe) {
      dispatch(setGeneratedRecipe(aiRecipe))
      setCurrentAiDishId(dishId)
      setPrevView(from)
      setView('ai_recipe')
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
    if (!isSupabaseConfigured()) return
    const results = await searchGlobalRecipesByName(query.trim())
    setSearchResults(results.slice(0, 6).map((r) => ({ id: r.id, name: r.name })))
  }, [])

  const handleSearchSelect = async (id: string | number) => {
    setSearchQuery('')
    setSearchResults([])
    if (typeof id === 'number') {
      handleDishSelect(id, 'ingredients')
      return
    }
    const recipe = await getGlobalRecipeById(id)
    if (recipe) {
      dispatch(setGeneratedRecipe(recipe))
      setCurrentAiDishId(null)
      setPrevView('ingredients')
      setView('ai_recipe')
    }
  }


  if (!appReady && !appError) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    )
  }
  if (appError) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', p: 2 }}>
          <Alert severity="error" sx={{ maxWidth: 480, textAlign: 'left' }}>{appError}</Alert>
        </Box>
      </Layout>
    )
  }

  // Show loading spinner while checking auth session
  if (!authInitialized) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'transparent' }}>
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
      onHomeClick={() => setView('ingredients')}
      onPlannerClick={() => setView('weekly_planner')}
      likedCount={likedDishes.length}
      onFavoritesClick={() => setView('swipe_results')}
      user={user}
      onAuthClick={() => setAuthModalOpen(true)}
      onSignOut={handleSignOut}
      lang={lang}
      onLangToggle={() => dispatch(setLang(lang === 'ru' ? 'en' : 'ru'))}
    >
      {view === 'ingredients' && (
        <Box>
          {/* === Поиск + кнопка фильтров === */}
          <Box sx={{ display: 'flex', gap: 1, mb: 1, position: 'relative' }} ref={searchRef}>
            <Badge badgeContent={activeFilterCount || undefined} color="primary">
              <IconButton
                onClick={() => setFiltersOpen((v) => !v)}
                sx={{
                  border: '1px solid',
                  borderColor: filtersOpen ? 'primary.main' : 'rgba(0,0,0,0.15)',
                  borderRadius: 1,
                  color: filtersOpen ? 'primary.main' : 'text.secondary',
                }}
              >
                <Tune sx={{ fontSize: 20 }} />
              </IconButton>
            </Badge>
            <TextField
              fullWidth
              placeholder={t.searchPlaceholder}
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
            {searchResults.length > 0 && (
              <Paper sx={{ position: 'absolute', top: '100%', left: 48, right: 0, zIndex: 10, mt: 0.5, maxHeight: 280, overflow: 'auto' }}>
                <List dense disablePadding>
                  {searchResults.map((r) => (
                    <ListItemButton key={String(r.id)} onClick={() => handleSearchSelect(r.id)}>
                      <ListItemText primary={r.name} />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          {/* === Панель фильтров === */}
          <Collapse in={filtersOpen}>
            <Paper variant="outlined" sx={{ mb: 2, p: 2 }}>
              <SearchFilters />
            </Paper>
          </Collapse>

          {/* === Быстрые действия === */}
          <Box sx={{ mb: 3, mt: filtersOpen ? 0 : 2 }}>
            <PhotoDropZone onDetected={handlePhotoDetected} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={handleRandomize}
                startIcon={<Casino />}
                sx={{
                  py: 1.75,
                  borderColor: 'rgba(32,201,151,0.35)',
                  '&:hover': { borderColor: 'rgba(32,201,151,0.60)', bgcolor: 'rgba(204,251,241,0.65)' },
                }}
              >
                {t.randomizer}
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
                  borderColor: 'rgba(32,201,151,0.4)',
                  color: '#20C997',
                  '&:hover': { borderColor: '#20C997', bgcolor: 'rgba(32,201,151,0.08)' },
                  '&.Mui-disabled': { borderColor: 'rgba(0,0,0,0.1)', color: 'rgba(0,0,0,0.25)' },
                }}
              >
                {t.aiRecipe}
              </Button>
            </Box>
          </Box>

          {/* === Выбор продуктов: кнопка + инлайн-панель === */}
          <Box ref={selectorRef} sx={{ mb: selectedIngredients.length > 0 ? 1 : 2 }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setSelectorOpen((v) => !v)}
                startIcon={selectedIngredients.length > 0 ? <Edit /> : <Add />}
                sx={{
                  borderColor: selectorOpen ? 'rgba(32,201,151,0.60)' : 'rgba(32,201,151,0.35)',
                  color: 'text.primary',
                  bgcolor: selectorOpen ? 'rgba(204,251,241,0.35)' : 'transparent',
                  '&:hover': { borderColor: 'rgba(32,201,151,0.60)', bgcolor: 'rgba(204,251,241,0.65)' },
                }}
              >
                {selectedIngredients.length > 0
                  ? t.productsCount(selectedIngredients.length)
                  : t.selectProducts}
              </Button>
              {selectedIngredients.length > 0 && (
                <Tooltip title={t.clearAll}>
                  <IconButton
                    onClick={() => dispatch(setSelectedIngredients([]))}
                    sx={{
                      border: '1px solid rgba(0,0,0,0.15)',
                      borderRadius: 1,
                      color: 'text.secondary',
                      flexShrink: 0,
                      '&:hover': { color: '#f44336', borderColor: 'rgba(244,67,54,0.4)', bgcolor: 'rgba(244,67,54,0.05)' },
                    }}
                  >
                    <DeleteOutline sx={{ fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>

            <Collapse in={selectorOpen} unmountOnExit>
              <Box
                sx={{
                  mt: 1,
                  p: 2,
                  border: '1.5px solid rgba(32,201,151,0.25)',
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{t.choosProducts}</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button onClick={() => setSelectorOpen(false)} variant="contained" size="small">
                      {t.done(selectedIngredients.length)}
                    </Button>
                    <IconButton size="small" onClick={() => setSelectorOpen(false)} sx={{ color: 'text.secondary' }}>
                      <Close fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <IngredientSelector />
              </Box>
            </Collapse>
          </Box>

          {/* === Чипы выбранных ингредиентов === */}
          {selectedIngredients.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2, alignItems: 'center' }}>
              {selectedIngredientObjects.map((ing) => (
                <Chip
                  key={ing.id}
                  label={ing.name}
                  size="small"
                  onDelete={() => dispatch(toggleIngredient(ing.id))}
                  sx={{
                    bgcolor: 'rgba(32,201,151,0.08)',
                    color: '#0F9B6E',
                    borderColor: 'rgba(32,201,151,0.25)',
                    '& .MuiChip-deleteIcon': { color: 'rgba(15,155,110,0.5)', '&:hover': { color: '#0F9B6E' } },
                  }}
                  variant="outlined"
                />
              ))}
              <Chip
                icon={<Add sx={{ fontSize: '14px !important' }} />}
                label={t.addProducts}
                size="small"
                onClick={() => setSelectorOpen(true)}
                variant="outlined"
                sx={{
                  cursor: 'pointer',
                  borderStyle: 'dashed',
                  borderColor: 'rgba(32,201,151,0.40)',
                  color: '#0F9B6E',
                  '& .MuiChip-icon': { color: '#0F9B6E' },
                  '&:hover': { bgcolor: 'rgba(32,201,151,0.08)', borderColor: 'rgba(32,201,151,0.65)' },
                }}
              />
            </Box>
          )}

          {/* === CTA === */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={handleFindDishes}
            disabled={selectedIngredients.length === 0}
            sx={{
              py: 1.75,
              fontSize: '1rem',
              boxShadow: '0 6px 32px rgba(32,201,151,0.50)',
              '&:hover': { boxShadow: '0 8px 40px rgba(32,201,151,0.65)' },
            }}
          >
            {t.findDishes}
          </Button>

        </Box>
      )}

      {view === 'dishes' && (
        dishesLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 10, gap: 3 }}>
            <CircularProgress size={56} sx={{ color: '#20C997' }} />
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ color: 'text.primary', fontWeight: 600, mb: 0.5 }}>
                {loadingStep === 'search' ? t.loadingRecipes : t.translatingRecipes}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {loadingStep === 'search' ? t.fetchingFromSources : t.firstDishSoon}
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
              {t.tryAgain}
            </Button>
            <Button variant="outlined" onClick={() => setView('ingredients')}>
              {t.toHome}
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

