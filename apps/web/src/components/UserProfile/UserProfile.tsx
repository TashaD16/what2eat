import {
  Box, Typography, Button, TextField, ToggleButtonGroup, ToggleButton,
  Select, MenuItem, FormControl, InputLabel, Chip, Divider, Paper, Tabs, Tab, List, ListItem, ListItemIcon, ListItemText,
  Switch, FormControlLabel, CircularProgress, Snackbar, Alert,
} from '@mui/material'
import { ArrowBack, CheckCircle, Lock, OpenInNew } from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { setProfile, clearSaved, persistUserProfile } from '../../store/slices/userProfileSlice'
import { setCaloriesMax, setProteinMax, setFatMax, setCarbsMax } from '../../store/slices/filtersSlice'
import { setLang } from '../../store/slices/langSlice'
import { UserProfileData, calculateKBJU, getMealDistribution } from '../../services/userProfile'
import { getSubscription, createCheckoutSession, isPro, Subscription } from '../../services/subscription'
import { useT } from '../../i18n/useT'
import { useThemeMode } from '../../contexts/ThemeContext'

const STRIPE_PRICE_ID = import.meta.env.VITE_STRIPE_PRICE_ID as string | undefined
const STRIPE_CUSTOMER_PORTAL_URL = import.meta.env.VITE_STRIPE_CUSTOMER_PORTAL_URL as string | undefined

interface UserProfileProps {
  onBack: () => void
  initialTab?: number
}

export default function UserProfile({ onBack, initialTab = 0 }: UserProfileProps) {
  const dispatch = useAppDispatch()
  const t = useT()
  const { user } = useAppSelector((state) => state.auth)
  const { profile, saved } = useAppSelector((state) => state.userProfile)
  const lang = useAppSelector((state) => state.lang.lang)
  const { mode, toggleMode, accent, toggleAccent } = useThemeMode()

  const [tab, setTab] = useState(initialTab)

  // Subscription state
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [subLoading, setSubLoading] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const [gender, setGender] = useState<'male' | 'female'>(profile?.gender ?? 'male')
  const [age, setAge] = useState<string>(String(profile?.age ?? 25))
  const [height, setHeight] = useState<string>(String(profile?.height ?? 170))
  const [weight, setWeight] = useState<string>(String(profile?.weight ?? 70))
  const [activity, setActivity] = useState<UserProfileData['activity']>(profile?.activity ?? 'moderate')
  const [goal, setGoal] = useState<UserProfileData['goal']>(profile?.goal ?? 'maintenance')
  const [goalIntensity, setGoalIntensity] = useState<UserProfileData['goalIntensity']>(profile?.goalIntensity ?? 'light')
  const [mealsPerDay, setMealsPerDay] = useState<3 | 4 | 5>(profile?.mealsPerDay ?? 3)

  // КБЖУ edit state: null = display mode
  const [kbjuEdit, setKbjuEdit] = useState<{ calories: number; protein: number; fat: number; carbs: number } | null>(null)
  const [showIntro, setShowIntro] = useState(() => localStorage.getItem('w2e_show_intro') !== 'false')

  const handleToggleIntro = (checked: boolean) => {
    setShowIntro(checked)
    localStorage.setItem('w2e_show_intro', checked ? 'true' : 'false')
  }

  useEffect(() => {
    if (profile) {
      setGender(profile.gender)
      setAge(String(profile.age))
      setHeight(String(profile.height))
      setWeight(String(profile.weight))
      setActivity(profile.activity)
      setGoal(profile.goal ?? 'maintenance')
      setGoalIntensity(profile.goalIntensity ?? 'light')
      setMealsPerDay(profile.mealsPerDay ?? 3)
    }
  }, [profile])

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => dispatch(clearSaved()), 2500)
      return () => clearTimeout(timer)
    }
  }, [saved, dispatch])

  // Load subscription status when billing tab is active
  useEffect(() => {
    if (tab !== 2 || !user) return
    setSubLoading(true)
    getSubscription(user.id)
      .then(setSubscription)
      .finally(() => setSubLoading(false))
  }, [tab, user])

  // Detect return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('stripe') === 'success') {
      setPaymentSuccess(true)
      window.history.replaceState({}, '', window.location.pathname)
      // Refresh subscription after successful payment
      if (user) {
        getSubscription(user.id).then(setSubscription)
      }
    }
  }, [user])

  const currentProfile: UserProfileData = {
    gender,
    age: parseInt(age) || 25,
    height: parseInt(height) || 170,
    weight: parseInt(weight) || 70,
    activity,
    goal,
    goalIntensity,
    mealsPerDay,
  }
  const preview = calculateKBJU(currentProfile)

  // The displayed КБЖУ values (editable override or calculated)
  const displayKbju = kbjuEdit ?? preview

  const handleSave = () => {
    dispatch(setProfile(currentProfile))
    if (user) dispatch(persistUserProfile({ userId: user.id, profile: currentProfile }))
    setKbjuEdit(null)
  }

  const handleSetGoal = () => {
    dispatch(setCaloriesMax(displayKbju.calories))
    dispatch(setProteinMax(displayKbju.protein))
    dispatch(setFatMax(displayKbju.fat))
    dispatch(setCarbsMax(displayKbju.carbs))
    onBack()
  }

  const ACTIVITY_OPTIONS: { value: UserProfileData['activity']; label: string }[] = [
    { value: 'sedentary', label: t.activitySedentary },
    { value: 'light', label: t.activityLight },
    { value: 'moderate', label: t.activityModerate },
    { value: 'active', label: t.activityActive },
    { value: 'very_active', label: t.activityVeryActive },
  ]

  const FREE_FEATURES = [t.caloriesLabel, 'AI ' + t.aiRecipe, t.favorites]
  const PRO_FEATURES = [t.unlimitedAI, t.personalNutritionPlan, t.prioritySupport]

  const handleUpgrade = async () => {
    if (!STRIPE_PRICE_ID || !user) return
    setCheckoutLoading(true)
    try {
      const successUrl = `${window.location.origin}/?stripe=success`
      const cancelUrl = window.location.href
      const url = await createCheckoutSession(STRIPE_PRICE_ID, successUrl, cancelUrl)
      window.location.href = url
    } catch (err) {
      console.error('Checkout error:', err)
      setCheckoutLoading(false)
    }
  }

  const intensityPct = {
    loss:        { light: '-10%', moderate: '-20%' },
    maintenance: { light: '0%',   moderate: '0%'   },
    gain:        { light: '+5%',  moderate: '+15%'  },
  }

  const mealLabels: Record<string, string> = {
    breakfast: t.mealBreakfast,
    lunch:     t.mealLunch,
    snack:     t.mealSnack,
    snack2:    t.mealSnack,
    dinner:    t.mealDinner,
  }

  return (
    <Box sx={{ maxWidth: 580, mx: 'auto' }}>
      <Button onClick={onBack} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        {t.nazad}
      </Button>

      <Typography variant="h5" fontWeight={800} mb={2}>
        {t.profileTitle}
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label={t.profileTitle} />
        <Tab label={t.generalSettings} />
        <Tab label={t.billingTitle} />
      </Tabs>

      {/* === Tab 0: Profile === */}
      {tab === 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Gender */}
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>{t.gender}</Typography>
            <ToggleButtonGroup value={gender} exclusive onChange={(_, v) => { if (v) setGender(v) }} size="small">
              <ToggleButton value="male">{t.male}</ToggleButton>
              <ToggleButton value="female">{t.female}</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Numeric fields */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label={t.age} type="number" value={age}
              onChange={(e) => setAge(e.target.value)} size="small"
              inputProps={{ min: 10, max: 100 }}
              InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, whiteSpace: 'nowrap' }}>{t.years}</Typography> }}
              sx={{ width: 110 }}
            />
            <TextField
              label={t.height} type="number" value={height}
              onChange={(e) => setHeight(e.target.value)} size="small"
              inputProps={{ min: 100, max: 250 }}
              InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>cm</Typography> }}
              sx={{ width: 110 }}
            />
            <TextField
              label={t.weight} type="number" value={weight}
              onChange={(e) => setWeight(e.target.value)} size="small"
              inputProps={{ min: 20, max: 300 }}
              InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>kg</Typography> }}
              sx={{ width: 110 }}
            />
          </Box>

          {/* Activity */}
          <FormControl size="small" sx={{ maxWidth: 260 }}>
            <InputLabel>{t.activity}</InputLabel>
            <Select value={activity} label={t.activity} onChange={(e) => setActivity(e.target.value as UserProfileData['activity'])}>
              {ACTIVITY_OPTIONS.map((opt) => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
            </Select>
          </FormControl>

          {/* Goal */}
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>{t.goalLabel}</Typography>
            <ToggleButtonGroup value={goal} exclusive onChange={(_, v) => { if (v) setGoal(v) }} size="small">
              <ToggleButton value="loss">{t.goalLoss}</ToggleButton>
              <ToggleButton value="maintenance">{t.goalMaintenance}</ToggleButton>
              <ToggleButton value="gain">{t.goalGain}</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Goal intensity (only for loss/gain) */}
          {goal !== 'maintenance' && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>{t.goalIntensityLabel}</Typography>
              <ToggleButtonGroup value={goalIntensity} exclusive onChange={(_, v) => { if (v) setGoalIntensity(v) }} size="small">
                <ToggleButton value="light">
                  {t.goalIntensityLight(intensityPct[goal].light)}
                </ToggleButton>
                <ToggleButton value="moderate">
                  {t.goalIntensityModerate(intensityPct[goal].moderate)}
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          )}

          {/* Meals per day */}
          <Box>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>{t.mealsPerDayLabel}</Typography>
            <ToggleButtonGroup value={mealsPerDay} exclusive onChange={(_, v) => { if (v) setMealsPerDay(v) }} size="small">
              <ToggleButton value={3}>3</ToggleButton>
              <ToggleButton value={4}>4</ToggleButton>
              <ToggleButton value={5}>5</ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Cartoonish save button */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleSave}
              sx={{
                borderRadius: '50px',
                border: '2.5px dashed rgba(var(--w2e-primary-rgb),0.65)',
                bgcolor: 'rgba(var(--w2e-primary-rgb),0.07)',
                color: 'var(--w2e-primary-deep)',
                fontWeight: 800,
                fontSize: '0.88rem',
                px: 3,
                py: 0.9,
                textTransform: 'none',
                boxShadow: '0 3px 14px rgba(var(--w2e-primary-rgb),0.15)',
                '&:hover': { bgcolor: 'rgba(var(--w2e-primary-rgb),0.14)', borderColor: 'var(--w2e-primary)', borderStyle: 'dashed', boxShadow: '0 5px 20px rgba(var(--w2e-primary-rgb),0.28)' },
              }}
            >
              {t.saveProfile}
            </Button>
            {saved && <Chip label={t.profileSaved} color="success" size="small" />}
          </Box>

          <Divider />

          {/* КБЖУ section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>{t.calculatedKbju}</Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'var(--w2e-primary-deep)', fontWeight: 600, mb: 1.5 }}>
              {t.dailyCaloriesNorm}
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: 'rgba(var(--w2e-primary-rgb),0.35)', bgcolor: 'rgba(var(--w2e-primary-rgb),0.04)' }}>
              {kbjuEdit ? (
                /* Edit mode: 4 text fields */
                <Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 2 }}>
                    <TextField
                      label={t.caloriesLabel} type="number" size="small"
                      value={kbjuEdit.calories}
                      onChange={(e) => setKbjuEdit({ ...kbjuEdit, calories: Number(e.target.value) })}
                      InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>{t.kcalUnit}</Typography> }}
                    />
                    <TextField
                      label={t.proteinLabel} type="number" size="small"
                      value={kbjuEdit.protein}
                      onChange={(e) => setKbjuEdit({ ...kbjuEdit, protein: Number(e.target.value) })}
                      InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>{t.gUnit}</Typography> }}
                    />
                    <TextField
                      label={t.fatLabel} type="number" size="small"
                      value={kbjuEdit.fat}
                      onChange={(e) => setKbjuEdit({ ...kbjuEdit, fat: Number(e.target.value) })}
                      InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>{t.gUnit}</Typography> }}
                    />
                    <TextField
                      label={t.carbsLabel} type="number" size="small"
                      value={kbjuEdit.carbs}
                      onChange={(e) => setKbjuEdit({ ...kbjuEdit, carbs: Number(e.target.value) })}
                      InputProps={{ endAdornment: <Typography variant="caption" sx={{ ml: 0.5 }}>{t.gUnit}</Typography> }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="contained" onClick={() => setKbjuEdit(null)}
                    >{t.applyKbju}</Button>
                    <Button size="small" variant="text" onClick={() => setKbjuEdit(null)}
                      sx={{ color: 'text.secondary' }}
                    >{t.resetKbju}</Button>
                  </Box>
                </Box>
              ) : (
                /* Display mode: chips + meal distribution */
                <Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                    <Chip label={`${displayKbju.calories} ${t.kcalUnit}`} sx={{ bgcolor: 'rgba(255,167,38,0.15)', color: '#E65100', border: '1px solid rgba(255,167,38,0.35)', fontWeight: 700 }} />
                    <Chip label={`${t.proteinLabel} ${displayKbju.protein}${t.gUnit}`} sx={{ bgcolor: 'rgba(66,165,245,0.15)', color: '#1565C0', border: '1px solid rgba(66,165,245,0.35)', fontWeight: 600 }} />
                    <Chip label={`${t.fatLabel} ${displayKbju.fat}${t.gUnit}`} sx={{ bgcolor: 'rgba(239,108,0,0.12)', color: '#BF360C', border: '1px solid rgba(239,108,0,0.3)', fontWeight: 600 }} />
                    <Chip label={`${t.carbsLabel} ${displayKbju.carbs}${t.gUnit}`} sx={{ bgcolor: 'rgba(156,39,176,0.1)', color: '#6A1B9A', border: '1px solid rgba(156,39,176,0.28)', fontWeight: 600 }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                    <Button size="small" variant="outlined" onClick={() => setKbjuEdit({ ...displayKbju })}
                      sx={{ borderColor: 'rgba(var(--w2e-primary-rgb),0.45)', color: 'var(--w2e-primary-deep)', '&:hover': { borderColor: 'var(--w2e-primary)', bgcolor: 'rgba(var(--w2e-primary-rgb),0.06)' } }}
                    >{t.editKbju}</Button>
                    <Button size="small" variant="outlined" onClick={handleSetGoal}
                      sx={{ borderColor: 'rgba(var(--w2e-primary-rgb),0.45)', color: 'var(--w2e-primary-deep)', '&:hover': { borderColor: 'var(--w2e-primary)', bgcolor: 'rgba(var(--w2e-primary-rgb),0.06)' } }}
                    >{t.setAsGoal}</Button>
                  </Box>

                  {/* Meal distribution */}
                  <Divider sx={{ mb: 1.5 }} />
                  <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
                    {t.mealDistributionTitle}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    {getMealDistribution(displayKbju, mealsPerDay).map((meal, i) => (
                      <Box
                        key={i}
                        sx={{
                          display: 'flex', alignItems: 'baseline', gap: 1,
                          fontSize: '0.78rem', flexWrap: 'wrap',
                        }}
                      >
                        <Typography variant="caption" fontWeight={700} sx={{ minWidth: 72, color: 'text.primary' }}>
                          {mealLabels[meal.name]}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ minWidth: 32 }}>
                          {Math.round(meal.pct * 100)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#E65100', fontWeight: 600 }}>
                          {meal.calories} {t.kcalUnit}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t.proteinAbbr}{meal.protein}{t.gUnit} / {t.fatAbbr}{meal.fat}{t.gUnit} / {t.carbsAbbr}{meal.carbs}{t.gUnit}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
            </Paper>

            {/* Side disclaimer */}
            <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', mt: 1.5, fontSize: '0.7rem', lineHeight: 1.45, fontStyle: 'italic', borderLeft: '2px solid rgba(0,0,0,0.12)', pl: 1 }}>
              {t.disclaimerShort}
            </Typography>
          </Box>
        </Box>
      )}

      {/* === Tab 1: General Settings === */}
      {tab === 1 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>{t.themeLabel}</Typography>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, v) => { if (v && v !== mode) toggleMode() }}
              size="small"
            >
              <ToggleButton value="light">{t.lightTheme}</ToggleButton>
              <ToggleButton value="dark">{t.darkTheme}</ToggleButton>
            </ToggleButtonGroup>
          </Box>
          <Box>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>{t.accentColor}</Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {(['green', 'orange'] as const).map((a) => {
                const colors = { green: { main: '#20C997', light: '#38D9A9' }, orange: { main: '#F97316', light: '#FB923C' } }
                const c = colors[a]
                const label = a === 'green' ? t.accentGreen : t.accentOrange
                return (
                  <Box
                    key={a}
                    onClick={() => { if (accent !== a) toggleAccent() }}
                    sx={{
                      display: 'flex', alignItems: 'center', gap: 1,
                      px: 1.5, py: 0.75,
                      borderRadius: 3,
                      border: '2px solid',
                      borderColor: accent === a ? c.main : 'rgba(0,0,0,0.12)',
                      cursor: accent === a ? 'default' : 'pointer',
                      bgcolor: accent === a ? `rgba(${a === 'green' ? '32,201,151' : '249,115,22'},0.08)` : 'transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: c.main, bgcolor: `rgba(${a === 'green' ? '32,201,151' : '249,115,22'},0.08)` },
                    }}
                  >
                    <Box sx={{
                      width: 20, height: 20, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${c.main} 0%, ${c.light} 100%)`,
                      boxShadow: accent === a ? `0 0 8px ${c.main}88` : 'none',
                      flexShrink: 0,
                    }} />
                    <Typography variant="body2" sx={{ color: accent === a ? c.main : 'text.secondary', fontWeight: accent === a ? 600 : 400 }}>
                      {label}
                    </Typography>
                  </Box>
                )
              })}
            </Box>
          </Box>

          <Box>
            <FormControlLabel
              control={
                <Switch
                  checked={showIntro}
                  onChange={(e) => handleToggleIntro(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--w2e-primary)' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: 'var(--w2e-primary)' },
                  }}
                />
              }
              label={
                <Typography variant="body2">{t.showIntroVideo}</Typography>
              }
            />
          </Box>

          <Box>
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              {t.interfaceLanguage}
            </Typography>
            <ToggleButtonGroup
              value={lang}
              exclusive
              onChange={(_, v) => { if (v) dispatch(setLang(v)) }}
              size="small"
            >
              <ToggleButton value="ru">Русский</ToggleButton>
              <ToggleButton value="en">English</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>
      )}

      {/* === Tab 2: Billing === */}
      {tab === 2 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {subLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={28} sx={{ color: 'var(--w2e-primary)' }} />
            </Box>
          ) : (
            <>
              {/* Current plan badge */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="body1" color="text.secondary">{t.currentPlan}:</Typography>
                {isPro(subscription) ? (
                  <Chip
                    label={t.proActive}
                    size="small"
                    sx={{ bgcolor: 'rgba(99,102,241,0.15)', color: '#4338CA', border: '1px solid rgba(99,102,241,0.4)', fontWeight: 700 }}
                  />
                ) : (
                  <Chip label={t.freePlan} variant="outlined" size="small" sx={{ borderColor: 'var(--w2e-primary)', color: 'var(--w2e-primary-deep)', fontWeight: 700 }} />
                )}
              </Box>

              {/* Free plan card */}
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>{t.planIncluded} — {t.freePlan}</Typography>
                <List dense disablePadding>
                  {FREE_FEATURES.map((f) => (
                    <ListItem key={f} disableGutters sx={{ py: 0.25 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle sx={{ fontSize: 16, color: 'var(--w2e-primary)' }} /></ListItemIcon>
                      <ListItemText primary={<Typography variant="body2">{f}</Typography>} />
                    </ListItem>
                  ))}
                </List>
              </Paper>

              {/* Pro plan card */}
              <Paper
                variant="outlined"
                sx={{ p: 2, borderRadius: 3, borderColor: 'rgba(99,102,241,0.45)', bgcolor: 'rgba(99,102,241,0.04)' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <Typography variant="subtitle2" fontWeight={800}>{t.proPlan}</Typography>
                  {isPro(subscription) && (
                    <Chip label="✓" size="small" sx={{ bgcolor: 'rgba(99,102,241,0.15)', color: '#4338CA', fontWeight: 700, fontSize: '0.7rem' }} />
                  )}
                </Box>

                <List dense disablePadding sx={{ mb: 2 }}>
                  {PRO_FEATURES.map((f) => (
                    <ListItem key={f} disableGutters sx={{ py: 0.25 }}>
                      <ListItemIcon sx={{ minWidth: 28 }}>
                        {isPro(subscription)
                          ? <CheckCircle sx={{ fontSize: 16, color: 'rgba(99,102,241,0.8)' }} />
                          : <Lock sx={{ fontSize: 16, color: 'rgba(99,102,241,0.55)' }} />
                        }
                      </ListItemIcon>
                      <ListItemText primary={
                        <Typography variant="body2" color={isPro(subscription) ? 'text.primary' : 'text.secondary'}>{f}</Typography>
                      } />
                    </ListItem>
                  ))}
                </List>

                {isPro(subscription) ? (
                  <Box>
                    {subscription?.current_period_end && (
                      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        {t.validUntil(new Date(subscription.current_period_end).toLocaleDateString(lang === 'ru' ? 'ru-RU' : 'en-US'))}
                      </Typography>
                    )}
                    {STRIPE_CUSTOMER_PORTAL_URL && (
                      <Button
                        variant="outlined"
                        size="small"
                        endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
                        href={STRIPE_CUSTOMER_PORTAL_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ borderColor: 'rgba(99,102,241,0.5)', color: '#4338CA', '&:hover': { borderColor: '#4338CA', bgcolor: 'rgba(99,102,241,0.06)' } }}
                      >
                        {t.manageSubscription}
                      </Button>
                    )}
                  </Box>
                ) : (
                  <Box>
                    <Button
                      variant="contained"
                      disabled={checkoutLoading || !STRIPE_PRICE_ID}
                      onClick={handleUpgrade}
                      startIcon={checkoutLoading ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : undefined}
                      sx={{
                        bgcolor: 'rgba(99,102,241,0.85)',
                        '&:hover': { bgcolor: '#4338CA' },
                        '&.Mui-disabled': {
                          bgcolor: STRIPE_PRICE_ID ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.25)',
                          color: 'rgba(99,102,241,0.55)',
                        },
                      }}
                    >
                      {t.upgradeToPro}
                    </Button>
                    {!STRIPE_PRICE_ID && (
                      <Typography variant="caption" color="text.disabled" display="block" mt={1} fontSize="0.7rem">
                        {t.paymentUnavailable}
                      </Typography>
                    )}
                  </Box>
                )}
              </Paper>
            </>
          )}
        </Box>
      )}

      <Snackbar
        open={paymentSuccess}
        autoHideDuration={6000}
        onClose={() => setPaymentSuccess(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setPaymentSuccess(false)} sx={{ width: '100%' }}>
          {t.paymentSuccess}
        </Alert>
      </Snackbar>
    </Box>
  )
}
