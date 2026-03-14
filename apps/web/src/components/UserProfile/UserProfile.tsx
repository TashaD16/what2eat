import {
  Box,
  Typography,
  Button,
  TextField,
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Divider,
  Paper,
  Alert,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { useState, useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { setProfile, clearSaved, persistUserProfile } from '../../store/slices/userProfileSlice'
import { setCaloriesMax } from '../../store/slices/filtersSlice'
import { UserProfileData, calculateKBJU } from '../../services/userProfile'
import { useT } from '../../i18n/useT'

interface UserProfileProps {
  onBack: () => void
}

export default function UserProfile({ onBack }: UserProfileProps) {
  const dispatch = useAppDispatch()
  const t = useT()
  const { user } = useAppSelector((state) => state.auth)
  const { profile, kbju, saved } = useAppSelector((state) => state.userProfile)

  const [gender, setGender] = useState<'male' | 'female'>(profile?.gender ?? 'male')
  const [age, setAge] = useState<string>(String(profile?.age ?? 25))
  const [height, setHeight] = useState<string>(String(profile?.height ?? 170))
  const [weight, setWeight] = useState<string>(String(profile?.weight ?? 70))
  const [activity, setActivity] = useState<UserProfileData['activity']>(profile?.activity ?? 'moderate')

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
      const t = setTimeout(() => dispatch(clearSaved()), 2500)
      return () => clearTimeout(t)
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

  const handleSave = () => {
    dispatch(setProfile(currentProfile))
    if (user) dispatch(persistUserProfile({ userId: user.id, profile: currentProfile }))
  }

  const handleSetGoal = () => {
    dispatch(setCaloriesMax(preview.calories))
    onBack()
  }

  const ACTIVITY_OPTIONS: { value: UserProfileData['activity']; label: string }[] = [
    { value: 'sedentary', label: t.activitySedentary },
    { value: 'light', label: t.activityLight },
    { value: 'moderate', label: t.activityModerate },
    { value: 'active', label: t.activityActive },
    { value: 'very_active', label: t.activityVeryActive },
  ]

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Button onClick={onBack} startIcon={<ArrowBack />} sx={{ mb: 2 }}>
        {t.nazad}
      </Button>

      <Typography variant="h5" fontWeight={800} mb={3}>
        {t.profileTitle}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* Пол */}
        <Box>
          <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
            {t.gender}
          </Typography>
          <ToggleButtonGroup
            value={gender}
            exclusive
            onChange={(_, v) => { if (v) setGender(v) }}
            size="small"
          >
            <ToggleButton value="male">{t.male}</ToggleButton>
            <ToggleButton value="female">{t.female}</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Числовые поля */}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            label={t.age}
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            size="small"
            inputProps={{ min: 10, max: 100 }}
            InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, whiteSpace: 'nowrap' }}>{t.years}</Typography> }}
            sx={{ width: 120 }}
          />
          <TextField
            label={t.height}
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            size="small"
            inputProps={{ min: 100, max: 250 }}
            InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>cm</Typography> }}
            sx={{ width: 120 }}
          />
          <TextField
            label={t.weight}
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            size="small"
            inputProps={{ min: 20, max: 300 }}
            InputProps={{ endAdornment: <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>kg</Typography> }}
            sx={{ width: 120 }}
          />
        </Box>

        {/* Активность */}
        <FormControl size="small" sx={{ maxWidth: 280 }}>
          <InputLabel>{t.activity}</InputLabel>
          <Select
            value={activity}
            label={t.activity}
            onChange={(e) => setActivity(e.target.value as UserProfileData['activity'])}
          >
            {ACTIVITY_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Кнопка сохранить */}
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          <Button variant="contained" onClick={handleSave}>
            {t.saveProfile}
          </Button>
          {saved && <Chip label={t.profileSaved} color="success" size="small" />}
        </Box>

        <Divider />

        {/* Расчёт КБЖУ */}
        <Box>
          <Typography variant="subtitle1" fontWeight={700} mb={1.5}>
            {t.calculatedKbju}
          </Typography>
          <Paper
            variant="outlined"
            sx={{ p: 2, borderRadius: 3, borderColor: 'rgba(32,201,151,0.35)', bgcolor: 'rgba(32,201,151,0.04)' }}
          >
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                label={`${preview.calories} ${t.kcalUnit}`}
                sx={{ bgcolor: 'rgba(255,167,38,0.15)', color: '#E65100', border: '1px solid rgba(255,167,38,0.35)', fontWeight: 700 }}
              />
              <Chip
                label={`${t.proteinLabel} ${preview.protein}${t.gUnit}`}
                sx={{ bgcolor: 'rgba(66,165,245,0.15)', color: '#1565C0', border: '1px solid rgba(66,165,245,0.35)', fontWeight: 600 }}
              />
              <Chip
                label={`${t.fatLabel} ${preview.fat}${t.gUnit}`}
                sx={{ bgcolor: 'rgba(239,108,0,0.12)', color: '#BF360C', border: '1px solid rgba(239,108,0,0.3)', fontWeight: 600 }}
              />
              <Chip
                label={`${t.carbsLabel} ${preview.carbs}${t.gUnit}`}
                sx={{ bgcolor: 'rgba(156,39,176,0.1)', color: '#6A1B9A', border: '1px solid rgba(156,39,176,0.28)', fontWeight: 600 }}
              />
            </Box>

            {kbju && (
              <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                {t.nutritionGoal}: {kbju.calories} {t.kcalUnit}
              </Typography>
            )}

            <Button variant="outlined" size="small" onClick={handleSetGoal} sx={{ borderColor: 'rgba(32,201,151,0.5)', color: '#0F9B6E', '&:hover': { borderColor: '#20C997', bgcolor: 'rgba(32,201,151,0.08)' } }}>
              {t.setAsGoal}
            </Button>
          </Paper>

          <Alert severity="info" sx={{ mt: 2, fontSize: '0.78rem' }}>
            {t.nutritionDisclaimer}
          </Alert>
        </Box>
      </Box>
    </Box>
  )
}
