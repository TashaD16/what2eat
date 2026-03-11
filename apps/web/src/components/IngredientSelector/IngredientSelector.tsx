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
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { toggleIngredient } from '../../store/slices/ingredientsSlice'
import { INGREDIENT_CATEGORIES } from '@what2eat/constants'
import { IngredientCategory } from '@what2eat/types'

export default function IngredientSelector() {
  const dispatch = useAppDispatch()
  const { ingredients, selectedIngredients } = useAppSelector(
    (state) => state.ingredients
  )
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<IngredientCategory | 'all'>('all')

  const filteredIngredients = useMemo(() => {
    let filtered = ingredients

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((ing) => ing.category === selectedCategory)
    }

    if (searchQuery) {
      filtered = filtered.filter((ing) =>
        ing.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    return filtered
  }, [ingredients, selectedCategory, searchQuery])

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
        placeholder="Поиск ингредиентов..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: 'rgba(255,255,255,0.3)' }} />
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
        <Tab label="Все" value="all" />
        {Object.entries(INGREDIENT_CATEGORIES).map(([key, label]) => (
          <Tab key={key} label={label} value={key} />
        ))}
      </Tabs>

      {selectedIngredientNames.length > 0 && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1, display: 'block' }}>
            Выбрано: {selectedIngredientNames.length}
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
                    background: 'linear-gradient(135deg, rgba(255,77,77,0.3) 0%, rgba(255,149,0,0.3) 100%)',
                    border: '1px solid rgba(255,77,77,0.4)',
                    color: 'white',
                    fontWeight: 500,
                    '& .MuiChip-deleteIcon': { color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#FF4D4D' } },
                  }}
                />
              )
            })}
          </Box>
        </Box>
      )}

      <Grid container spacing={1.5}>
        {filteredIngredients.map((ingredient) => {
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
                    border: isSelected ? '1.5px solid rgba(255,77,77,0.6)' : '1px solid rgba(255,255,255,0.08)',
                    bgcolor: isSelected ? 'rgba(255,77,77,0.12)' : 'rgba(255,255,255,0.04)',
                    boxShadow: isSelected ? '0 0 16px rgba(255,77,77,0.2)' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      bgcolor: isSelected ? 'rgba(255,77,77,0.15)' : 'rgba(255,255,255,0.07)',
                      border: isSelected ? '1.5px solid rgba(255,77,77,0.7)' : '1px solid rgba(255,255,255,0.15)',
                    },
                  }}
                  onClick={() => handleToggle(ingredient.id)}
                >
                  <Typography
                    variant="body2"
                    align="center"
                    sx={{
                      color: isSelected ? '#FF7070' : 'rgba(255,255,255,0.75)',
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

      {filteredIngredients.length === 0 && (
        <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', mt: 6 }}>
          Ингредиенты не найдены
        </Typography>
      )}
    </Box>
  )
}
