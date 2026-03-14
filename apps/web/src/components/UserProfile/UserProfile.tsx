import {
  Box, Typography, Button, TextField, ToggleButtonGroup, ToggleButton,
  Select, MenuItem, FormControl, InputLabel, Chip, Divider, Paper, Tabs, Tab, List, ListItem, ListItemIcon, ListItemText,
} from '@mui/material'
import { ArrowBack, CheckCircle, Lock } from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { setProfile, clearSaved, persistUserProfile } from '../../store/slices/userProfileSlice'
import { setCaloriesMax } from '../../store/slices/filtersSlice'
import { setLang } from '../../store/slices/langSlice'
import { UserProfileData, calculateKBJU } from '../../services/userProfile'
import { useT } from '../../i18n/useT'
import { useThemeMode } from '../../contexts/ThemeContext'

interface UserProfileProps {
  onBack: () => void
}

export default function UserProfile({ onBack }: UserProfileProps) {
  const dispatch = useAppDispatch()
  const t = useT()
  const { user } = useAppSelector((state) => state.auth)
  const { profile, saved } = useAppSelector((state) => state.userProfile)
  const lang = useAppSelector((state) => state.lang.lang)
  const { mode, toggleMode } = useThemeMode()

  const [tab, setTab] = useState(0)
  const [gender, setGender] = useState<'male' | 'female'>(profile?.gender ?? 'male')
  const [age, setAge] = useState<string>(String(profile?.age ?? 25))
  const [height, setHeight] = useState<string>(String(profile?.height ?? 170))
  const [weight, setWeight] = useState<string>(String(profile?.weight ?? 70))
  const [activity, setActivity] = useState<UserProfileData['activity']>(profile?.activity ?? 'moderate')

  // КБЖУ edit state: null = display mode
  const [kbjuEdit, setKbjuEdit] = useState<{ calories: number; protein: number; fat: number; carbs: number } | null>(null)

  useEffect(() => {
    if (profile) {
      setGender(profile.gender)
      setAge(String(profile.age))
      setHeight(String(profile.height))
      setWeight(String(profile.weight))
      setActivity(profile.activity)
    }
  }, [profile])

  useEffect(() => {
    if (saved) {
      const timer = setTimeout(() => dispatch(clearSaved()), 2500)
      return () => clearTimeout(timer)
    }
  }, [saved, dispatch])

  const currentProfile: UserProfileData = {
    gender,
    age: parseInt(age) || 25,
    height: parseInt(height) || 170,
    weight: parseInt(weight) || 70,
    activity,
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
  const PRO_FEATURES = ['Безлимитный AI', 'Персональный КБЖУ-план', 'Приоритетная поддержка']

  return (
    <Box sx={{ maxWidth: 580, mx: 'auto' }}>
      <Button onClick={onBack} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        {t.nazad}
      </Button>

      <Typography variant="h5" fontWeight={800} mb={2}>
        {t.profileTitle}
      </Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Tab label={lang === 'ru' ? 'Профиль' : 'Profile'} />
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

          {/* Cartoonish save button */}
          <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
            <Button
              variant="outlined"
              onClick={handleSave}
              sx={{
                borderRadius: '50px',
                border: '2.5px dashed rgba(32,201,151,0.65)',
                bgcolor: 'rgba(32,201,151,0.07)',
                color: '#0F9B6E',
                fontWeight: 800,
                fontSize: '0.88rem',
                px: 3,
                py: 0.9,
                textTransform: 'none',
                boxShadow: '0 3px 14px rgba(32,201,151,0.15)',
                '&:hover': { bgcolor: 'rgba(32,201,151,0.14)', borderColor: '#20C997', borderStyle: 'dashed', boxShadow: '0 5px 20px rgba(32,201,151,0.28)' },
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
            <Typography variant="body2" color="#0F9B6E" fontWeight={600} mb={1.5}>
              {t.dailyCaloriesNorm}
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: 'rgba(32,201,151,0.35)', bgcolor: 'rgba(32,201,151,0.04)' }}>
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
                      sx={{ bgcolor: '#20C997', '&:hover': { bgcolor: '#18B383' } }}
                    >{t.applyKbju}</Button>
                    <Button size="small" variant="text" onClick={() => setKbjuEdit(null)}
                      sx={{ color: 'text.secondary' }}
                    >{t.resetKbju}</Button>
                  </Box>
                </Box>
              ) : (
                /* Display mode: chips */
                <Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1.5 }}>
                    <Chip label={`${displayKbju.calories} ${t.kcalUnit}`} sx={{ bgcolor: 'rgba(255,167,38,0.15)', color: '#E65100', border: '1px solid rgba(255,167,38,0.35)', fontWeight: 700 }} />
                    <Chip label={`${t.proteinLabel} ${displayKbju.protein}${t.gUnit}`} sx={{ bgcolor: 'rgba(66,165,245,0.15)', color: '#1565C0', border: '1px solid rgba(66,165,245,0.35)', fontWeight: 600 }} />
                    <Chip label={`${t.fatLabel} ${displayKbju.fat}${t.gUnit}`} sx={{ bgcolor: 'rgba(239,108,0,0.12)', color: '#BF360C', border: '1px solid rgba(239,108,0,0.3)', fontWeight: 600 }} />
                    <Chip label={`${t.carbsLabel} ${displayKbju.carbs}${t.gUnit}`} sx={{ bgcolor: 'rgba(156,39,176,0.1)', color: '#6A1B9A', border: '1px solid rgba(156,39,176,0.28)', fontWeight: 600 }} />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => setKbjuEdit({ ...displayKbju })}
                      sx={{ borderColor: 'rgba(32,201,151,0.45)', color: '#0F9B6E', '&:hover': { borderColor: '#20C997', bgcolor: 'rgba(32,201,151,0.06)' } }}
                    >{t.editKbju}</Button>
                    <Button size="small" variant="outlined" onClick={handleSetGoal}
                      sx={{ borderColor: 'rgba(32,201,151,0.45)', color: '#0F9B6E', '&:hover': { borderColor: '#20C997', bgcolor: 'rgba(32,201,151,0.06)' } }}
                    >{t.setAsGoal}</Button>
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
            <Typography variant="subtitle2" color="text.secondary" mb={1}>
              {lang === 'ru' ? 'Язык интерфейса' : 'Interface language'}
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="body1" color="text.secondary">{t.currentPlan}:</Typography>
            <Chip label={t.freePlan} variant="outlined" size="small" sx={{ borderColor: '#20C997', color: '#0F9B6E', fontWeight: 700 }} />
          </Box>

          {/* Free plan card */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>{t.planIncluded} — {t.freePlan}</Typography>
            <List dense disablePadding>
              {FREE_FEATURES.map((f) => (
                <ListItem key={f} disableGutters sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}><CheckCircle sx={{ fontSize: 16, color: '#20C997' }} /></ListItemIcon>
                  <ListItemText primary={<Typography variant="body2">{f}</Typography>} />
                </ListItem>
              ))}
            </List>
          </Paper>

          {/* Pro plan card */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 3, borderColor: 'rgba(99,102,241,0.45)', bgcolor: 'rgba(99,102,241,0.04)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={800}>{t.proPlan}</Typography>
              <Chip label={lang === 'ru' ? 'Скоро' : 'Coming soon'} size="small" sx={{ bgcolor: 'rgba(99,102,241,0.12)', color: '#4338CA', fontWeight: 600, fontSize: '0.7rem' }} />
            </Box>
            <List dense disablePadding sx={{ mb: 2 }}>
              {PRO_FEATURES.map((f) => (
                <ListItem key={f} disableGutters sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 28 }}><Lock sx={{ fontSize: 16, color: 'rgba(99,102,241,0.55)' }} /></ListItemIcon>
                  <ListItemText primary={<Typography variant="body2" color="text.secondary">{f}</Typography>} />
                </ListItem>
              ))}
            </List>
            <Button
              variant="contained"
              disabled
              sx={{ bgcolor: 'rgba(99,102,241,0.7)', '&.Mui-disabled': { bgcolor: 'rgba(99,102,241,0.25)', color: 'rgba(99,102,241,0.55)' } }}
            >
              {t.upgradePlan}
            </Button>
            <Typography variant="caption" color="text.disabled" display="block" mt={1} fontSize="0.7rem">
              {lang === 'ru' ? 'Оплата недоступна в текущей версии' : 'Payment not available in the current version'}
            </Typography>
          </Paper>
        </Box>
      )}
    </Box>
  )
}
