import { useState, useCallback } from 'react'
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
  Paper,
  Alert,
  DialogActions,
  IconButton,
} from '@mui/material'
import { ArrowBack, ShoppingCart, CalendarMonth, Refresh, FavoriteBorder, LocalFireDepartment, EmojiEvents, Favorite, Close, Handshake } from '@mui/icons-material'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { resetSwipe, unlikeDish } from '../../store/slices/swipeSlice'
import { assignDishToDay, DayOfWeek } from '../../store/slices/weeklyPlannerSlice'
import DishCard from '../DishList/DishCard'
import { useT } from '../../i18n/useT'
import { getGamification, markCookedToday, isCookedToday, BADGES } from '../../services/gamification'

interface SwipeResultsProps {
  onDishSelect: (dishId: number) => void
  onBack: () => void
  onRepeat: () => void
  onShoppingList: () => void
}

export default function SwipeResults({ onDishSelect, onBack, onRepeat, onShoppingList }: SwipeResultsProps) {
  const dispatch = useAppDispatch()
  const t = useT()
  const { likedDishes: storedLikedDishes } = useAppSelector((state) => state.swipe)
  const userId = useAppSelector((state) => state.auth.user?.id)
  const DAY_LABELS: Record<DayOfWeek, string> = {
    mon: t.monday, tue: t.tuesday, wed: t.wednesday,
    thu: t.thursday, fri: t.friday, sat: t.saturday, sun: t.sunday,
  }
  const [planDialog, setPlanDialog] = useState<{ open: boolean; dishId: number | null }>({
    open: false,
    dishId: null,
  })
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>('mon')
  const [removedSnack, setRemovedSnack] = useState(false)
  const lang = useAppSelector((state) => state.lang.lang)
  const [gamification, setGamification] = useState(() => getGamification())
  const [cookedToday, setCookedToday] = useState(() => isCookedToday())
  const [newBadgeName, setNewBadgeName] = useState<string | null>(null)

  // Partner voting
  const [partnerDialogOpen, setPartnerDialogOpen] = useState(false)
  const [partnerStep, setPartnerStep] = useState(0)
  const [partnerLikedIds, setPartnerLikedIds] = useState<number[]>([])
  const [partnerVoteDone, setPartnerVoteDone] = useState(false)

  const handlePartnerVote = (dishId: number, liked: boolean, totalDishes: number) => {
    if (liked) setPartnerLikedIds(prev => [...prev, dishId])
    if (partnerStep + 1 >= totalDishes) {
      setPartnerVoteDone(true)
      setPartnerDialogOpen(false)
    } else {
      setPartnerStep(s => s + 1)
    }
  }

  const resetPartnerVote = () => {
    setPartnerStep(0)
    setPartnerLikedIds([])
    setPartnerVoteDone(false)
  }

  const handleMarkCooked = useCallback(() => {
    const { alreadyMarked, newBadges } = markCookedToday()
    if (alreadyMarked) return
    setGamification(getGamification())
    setCookedToday(true)
    if (newBadges.length > 0) {
      const badge = BADGES.find(b => b.id === newBadges[0])
      if (badge) setNewBadgeName(lang === 'ru' ? badge.labelRu : badge.labelEn)
    }
  }, [lang])

  // Nutrition totals across all liked dishes (sum of per-serving values)
  const nutritionTotal = storedLikedDishes.reduce(
    (acc, d) => ({
      calories: acc.calories + (d.calories_per_serving ?? 0),
      protein: acc.protein + (d.protein_per_serving ?? 0),
      fat: acc.fat + (d.fat_per_serving ?? 0),
      carbs: acc.carbs + (d.carbs_per_serving ?? 0),
      hasData: acc.hasData || d.calories_per_serving != null,
    }),
    { calories: 0, protein: 0, fat: 0, carbs: 0, hasData: false }
  )

  // Convert StoredDish → Dish shape expected by DishCard
  const likedDishes = storedLikedDishes.map((d) => ({
    id: d.id,
    name: d.name,
    description: d.description,
    image_url: d.image_url,
    cooking_time: d.cooking_time,
    difficulty: d.difficulty,
    servings: d.servings,
    estimated_cost: d.estimated_cost,
    is_vegetarian: d.is_vegetarian,
    is_vegan: d.is_vegan,
  }))

  const matches = partnerVoteDone
    ? likedDishes.filter(d => partnerLikedIds.includes(d.id))
    : []

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
          {t.back}
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FavoriteBorder sx={{ color: '#FF4D4D', fontSize: 22 }} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t.likedDishes}
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
            {t.shoppingList}
          </Button>
          <Button variant="outlined" startIcon={<Refresh />} onClick={handleRepeat} size="small">
            {t.repeat}
          </Button>
          {likedDishes.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<Handshake />}
              onClick={() => { resetPartnerVote(); setPartnerDialogOpen(true) }}
              size="small"
              sx={{ borderColor: 'rgba(168,85,247,0.5)', color: '#A855F7', '&:hover': { bgcolor: 'rgba(168,85,247,0.07)' } }}
            >
              {t.partnerVoteBtn}
            </Button>
          )}
        </Box>
      </Box>

      {/* Gamification streak panel */}
      <Paper
        sx={{
          mb: 2,
          px: 2,
          py: 1.25,
          background: 'rgba(var(--w2e-tint-rgb),0.50)',
          border: '1px solid rgba(var(--w2e-primary-rgb),0.18)',
          borderRadius: 3,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 1,
          alignItems: 'center',
        }}
      >
        {/* Streak */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 140 }}>
          <Typography sx={{ fontSize: 20 }}>🔥</Typography>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.1, color: 'text.primary' }}>
              {gamification.streak > 0 ? t.streakDays(gamification.streak) : t.markCookedToday}
            </Typography>
            {gamification.totalCooked > 0 && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {t.totalCookedDays(gamification.totalCooked)}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Badges */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {gamification.earnedBadges.map(id => {
            const badge = BADGES.find(b => b.id === id)
            if (!badge) return null
            return (
              <Chip
                key={id}
                label={`${badge.emoji} ${lang === 'ru' ? badge.labelRu : badge.labelEn}`}
                size="small"
                sx={{ bgcolor: 'rgba(var(--w2e-primary-rgb),0.10)', color: 'var(--w2e-primary-deep)', border: '1px solid rgba(var(--w2e-primary-rgb),0.25)', fontSize: '0.68rem', height: 22 }}
              />
            )
          })}
        </Box>

        {/* Mark button */}
        <Button
          variant={cookedToday ? 'text' : 'contained'}
          size="small"
          startIcon={<EmojiEvents sx={{ fontSize: '14px !important' }} />}
          onClick={handleMarkCooked}
          disabled={cookedToday}
          sx={{ fontSize: '0.72rem', py: 0.4, px: 1.2, flexShrink: 0 }}
        >
          {cookedToday ? t.cookedMarked : t.markCookedBtn}
        </Button>
      </Paper>

      {/* Nutrition total */}
      {storedLikedDishes.length > 0 && nutritionTotal.hasData && (
        <Paper
          sx={{
            mb: 2.5,
            px: 2.5,
            py: 1.5,
            background: 'rgba(var(--w2e-tint-rgb),0.60)',
            border: '1px solid rgba(var(--w2e-primary-rgb),0.20)',
            borderRadius: 3,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            alignItems: 'center',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mr: 1 }}>
            <LocalFireDepartment sx={{ fontSize: 18, color: '#FF8F00' }} />
            <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.8rem' }}>
              {t.kbjuPerServing}:
            </Typography>
          </Box>
          {nutritionTotal.calories > 0 && (
            <Chip label={`${nutritionTotal.calories} ${t.kcalUnit}`} size="small" sx={{ bgcolor: 'rgba(255,167,38,0.15)', color: '#E65100', border: '1px solid rgba(255,167,38,0.35)', fontWeight: 600, fontSize: '0.72rem' }} />
          )}
          {nutritionTotal.protein > 0 && (
            <Chip label={`${t.proteinAbbr} ${nutritionTotal.protein}${t.gUnit}`} size="small" sx={{ bgcolor: 'rgba(66,165,245,0.15)', color: '#1565C0', border: '1px solid rgba(66,165,245,0.35)', fontWeight: 600, fontSize: '0.72rem' }} />
          )}
          {nutritionTotal.fat > 0 && (
            <Chip label={`${t.fatAbbr} ${nutritionTotal.fat}${t.gUnit}`} size="small" sx={{ bgcolor: 'rgba(239,108,0,0.12)', color: '#BF360C', border: '1px solid rgba(239,108,0,0.3)', fontWeight: 600, fontSize: '0.72rem' }} />
          )}
          {nutritionTotal.carbs > 0 && (
            <Chip label={`${t.carbsAbbr} ${nutritionTotal.carbs}${t.gUnit}`} size="small" sx={{ bgcolor: 'rgba(156,39,176,0.1)', color: '#6A1B9A', border: '1px solid rgba(156,39,176,0.28)', fontWeight: 600, fontSize: '0.72rem' }} />
          )}
        </Paper>
      )}

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
            {t.noLikedDishes}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled', mb: 3 }}>
            {t.swipeRightHint}
          </Typography>
          <Button variant="contained" onClick={handleRepeat} startIcon={<Refresh />}>
            {t.startSearch}
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
                  {t.toWeeklyPlanner}
                </Button>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Partner matches */}
      {partnerVoteDone && (
        <Paper
          sx={{
            mt: 3,
            p: 2.5,
            background: 'rgba(168,85,247,0.06)',
            border: '1.5px solid rgba(168,85,247,0.25)',
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Handshake sx={{ color: '#A855F7', fontSize: 22 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#7C3AED' }}>
              {matches.length > 0 ? t.partnerMatches : t.partnerNoMatches}
            </Typography>
            <Button size="small" onClick={resetPartnerVote} sx={{ ml: 'auto', color: 'text.disabled', fontSize: '0.7rem' }}>
              {t.partnerReset}
            </Button>
          </Box>
          {matches.length > 0 && (
            <Grid container spacing={2}>
              {matches.map(dish => (
                <Grid item xs={12} sm={6} key={dish.id}>
                  <Paper
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      p: 1.5,
                      border: '1px solid rgba(168,85,247,0.25)',
                      borderRadius: 2,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(168,85,247,0.05)' },
                    }}
                    onClick={() => onDishSelect(dish.id)}
                  >
                    {dish.image_url && (
                      <Box
                        component="img"
                        src={dish.image_url}
                        sx={{ width: 52, height: 52, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0 }}
                      />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{dish.name}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      )}

      {/* Partner voting dialog */}
      <Dialog
        open={partnerDialogOpen}
        onClose={() => setPartnerDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, pt: 2, pb: 0.5 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{t.partnerVoteTitle}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {t.partnerOf(partnerStep + 1, likedDishes.length)}
            </Typography>
            <IconButton size="small" onClick={() => setPartnerDialogOpen(false)}>
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {likedDishes[partnerStep] && (
          <DialogContent sx={{ pt: 1, pb: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
              {likedDishes[partnerStep].image_url && (
                <Box
                  component="img"
                  src={likedDishes[partnerStep].image_url ?? undefined}
                  sx={{ width: '100%', height: 200, objectFit: 'cover', borderRadius: 2 }}
                />
              )}
              <Typography variant="h6" sx={{ fontWeight: 700, textAlign: 'center' }}>
                {likedDishes[partnerStep].name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>{t.partnerVoteHint}</Typography>
            </Box>
          </DialogContent>
        )}

        <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 2, gap: 1.5 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<Close />}
            onClick={() => handlePartnerVote(likedDishes[partnerStep]?.id, false, likedDishes.length)}
            sx={{ borderColor: 'rgba(255,77,77,0.5)', color: '#FF4D4D', '&:hover': { bgcolor: 'rgba(255,77,77,0.06)' } }}
          >
            {t.partnerDislike}
          </Button>
          <Button
            variant="contained"
            fullWidth
            startIcon={<Favorite />}
            onClick={() => handlePartnerVote(likedDishes[partnerStep]?.id, true, likedDishes.length)}
            sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16a34a' } }}
          >
            {t.partnerLike}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Planner dialog */}
      <Dialog open={planDialog.open} onClose={() => setPlanDialog({ open: false, dishId: null })}>
        <DialogTitle>{t.addToPlanner}</DialogTitle>
        <DialogContent sx={{ minWidth: 280, pt: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t.dayOfWeek}</InputLabel>
            <Select
              value={selectedDay}
              label={t.dayOfWeek}
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
            {t.add}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Undo snackbar */}
      <Snackbar
        open={removedSnack}
        autoHideDuration={2500}
        onClose={() => setRemovedSnack(false)}
        message={t.removedFromFavorites}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

      {/* New badge snackbar */}
      <Snackbar
        open={newBadgeName !== null}
        autoHideDuration={3500}
        onClose={() => setNewBadgeName(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setNewBadgeName(null)} sx={{ fontWeight: 600 }}>
          {newBadgeName ? t.newBadgeToast(newBadgeName) : ''}
        </Alert>
      </Snackbar>
    </Box>
  )
}
