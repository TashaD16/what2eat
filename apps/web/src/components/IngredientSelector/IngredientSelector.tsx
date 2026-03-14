import {
  Box,
  Typography,
  Chip,
  TextField,
  InputAdornment,
  Grid,
  Paper,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

const BATCH_SIZE = 20
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { toggleIngredient } from '../../store/slices/ingredientsSlice'
import { ingredientMatchesCuisine } from '../../services/ingredients'
import { IngredientCategory } from '@what2eat/types'
import { useT } from '../../i18n/useT'

export default function IngredientSelector() {
  const dispatch = useAppDispatch()
  const { ingredients, selectedIngredients } = useAppSelector(
    (state) => state.ingredients
  )
  const selectedCuisine = useAppSelector((state) => state.filters.cuisine)
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const t = useT()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | 'all'>('all')
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const filteredIngredients = useMemo(() => {
    let filtered = ingredients

    if (selectedCuisine) {
      filtered = filtered.filter((ing) => ingredientMatchesCuisine(ing, selectedCuisine))
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((ing) => ing.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter((ing) =>
        ing.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [ingredients, selectedCategory, searchQuery, selectedCuisine])

  // Reset visible count when filter changes
  useEffect(() => {
    setVisibleCount(BATCH_SIZE)
  }, [selectedCategory, searchQuery, selectedCuisine])

  // Auto-load more when sentinel enters viewport
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + BATCH_SIZE, filteredIngredients.length))
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [filteredIngredients.length])

  const visibleIngredients = filteredIngredients.slice(0, visibleCount)

  const handleToggle = (id: number) => {
    dispatch(toggleIngredient(id))
  }

  const selectedIngredientNames = useMemo(() => {
    return ingredients
      .filter((ing) => selectedIngredients.includes(ing.id))
      .map((ing) => ing.name)
  }, [ingredients, selectedIngredients])

  return (
    <Box>
      <TextField
        fullWidth
        placeholder={t.searchIngredients}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: 'rgba(0,0,0,0.3)' }} />
            </InputAdornment>
          ),
        }}
      />

      <Tabs
        value={selectedCategory}
        onChange={(_, newValue) => setSelectedCategory(newValue)}
        sx={{ mb: 2 }}
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label={t.all} value="all" />
        {(['meat', 'cereals', 'vegetables', 'dairy', 'spices', 'other'] as IngredientCategory[]).map((key) => {
          const catLabels: Record<IngredientCategory, string> = {
            meat: t.categoryMeat, cereals: t.categoryCereals, vegetables: t.categoryVegetables,
            dairy: t.categoryDairy, spices: t.categorySpices, other: t.categoryOther,
          }
          return <Tab key={key} label={catLabels[key]} value={key} />
        })}
      </Tabs>

      {selectedIngredientNames.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1, display: 'block' }}>
            {t.selectedCount(selectedIngredientNames.length)}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {selectedIngredientNames.map((name) => {
              const ingredient = ingredients.find((ing) => ing.name === name)
              return (
                <Chip
                  key={name}
                  label={name}
                  onDelete={() => ingredient && handleToggle(ingredient.id)}
                  sx={{
                    background: 'linear-gradient(135deg, rgba(32,201,151,0.85) 0%, rgba(56,217,169,0.75) 100%)',
                    border: '1px solid rgba(32,201,151,0.4)',
                    color: 'white',
                    fontWeight: 500,
                    '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#18B383' } },
                  }}
                />
              )
            })}
          </Box>
        </Box>
      )}

      <Grid container spacing={1.5}>
        {visibleIngredients.map((ingredient) => {
          const isSelected = selectedIngredients.includes(ingredient.id)
          return (
            <Grid item xs={6} sm={4} md={3} key={ingredient.id}>
              <motion.div
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Paper
                  sx={{
                    p: 1.5,
                    cursor: 'pointer',
                    border: isSelected ? '1.5px solid rgba(32,201,151,0.6)' : `1px solid ${isLight ? 'rgba(32,201,151,0.15)' : 'rgba(255,255,255,0.07)'}`,
                    bgcolor: isSelected
                      ? (isLight ? 'rgba(32,201,151,0.12)' : 'rgba(32,201,151,0.15)')
                      : (isLight ? 'rgba(240,253,248,0.97)' : 'rgba(8,18,35,0.95)'),
                    boxShadow: isSelected ? '0 0 16px rgba(32,201,151,0.20)' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isSelected
                        ? (isLight ? 'rgba(32,201,151,0.18)' : 'rgba(32,201,151,0.22)')
                        : (isLight ? 'rgba(224,253,244,0.99)' : 'rgba(12,26,48,0.97)'),
                      border: isSelected ? '1.5px solid rgba(32,201,151,0.7)' : '1px solid rgba(32,201,151,0.30)',
                    },
                  }}
                  onClick={() => handleToggle(ingredient.id)}
                >
                  <Typography
                    variant="body2"
                    align="center"
                    sx={{
                      color: isSelected ? '#18B383' : 'text.primary',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {ingredient.name}
                  </Typography>
                </Paper>
              </motion.div>
            </Grid>
          )
        })}
      </Grid>

      {/* Sentinel — triggers next batch load when scrolled into view */}
      <div ref={sentinelRef} style={{ height: 1 }} />

      {filteredIngredients.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', mt: 6 }}>
          {t.notFound}
        </Typography>
      )}
    </Box>
  )
}
