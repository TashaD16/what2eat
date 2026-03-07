import { useState, useRef, useCallback } from 'react'
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material'
import { CameraAlt, RestaurantMenu, ArrowBack, CloudUpload, Check } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { analyzeIngredients, analyzeCalories, clearPhoto } from '../../store/slices/photoSlice'
import { setSelectedIngredients } from '../../store/slices/ingredientsSlice'
import CalorieCard from '../CalorieCard'

interface PhotoUploadProps {
  onIngredientsConfirmed: (ingredientIds: number[]) => void
  onBack: () => void
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve({ base64, mimeType: file.type })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PhotoUpload({ onIngredientsConfirmed, onBack }: PhotoUploadProps) {
  const dispatch = useAppDispatch()
  const { status, detectedIngredientNames, calorieEstimate, error } = useAppSelector(
    (state) => state.photo
  )
  const { ingredients } = useAppSelector((state) => state.ingredients)

  const [tab, setTab] = useState(0)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedNames, setSelectedNames] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      dispatch(clearPhoto())
      setSelectedNames(new Set())

      const { base64, mimeType } = await fileToBase64(file)

      if (tab === 0) {
        const ingredientNames = ingredients.map((i) => i.name)
        const result = await dispatch(analyzeIngredients({ base64, mimeType, ingredientNames }))
        if (analyzeIngredients.fulfilled.match(result)) {
          setSelectedNames(new Set(result.payload))
        }
      } else {
        dispatch(analyzeCalories({ base64, mimeType }))
      }
    },
    [dispatch, ingredients, tab]
  )

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const toggleName = (name: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const handleConfirm = () => {
    const ids = ingredients
      .filter((i) => selectedNames.has(i.name))
      .map((i) => i.id)
    dispatch(setSelectedIngredients(ids))
    onIngredientsConfirmed(ids)
  }

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTab(newValue)
    setPreviewUrl(null)
    dispatch(clearPhoto())
    setSelectedNames(new Set())
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button variant="text" onClick={onBack} startIcon={<ArrowBack />}>
          Назад
        </Button>
        <Typography variant="h5">Анализ фото</Typography>
      </Box>

      <Tabs value={tab} onChange={handleTabChange} sx={{ mb: 3 }}>
        <Tab icon={<CameraAlt />} iconPosition="start" label="Определить продукты" />
        <Tab icon={<RestaurantMenu />} iconPosition="start" label="Калории блюда" />
      </Tabs>

      {/* Зона загрузки */}
      <Paper
        variant="outlined"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        sx={{
          border: '2px dashed',
          borderColor: 'primary.light',
          borderRadius: 3,
          p: 3,
          mb: 3,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: 'grey.50',
          '&:hover': { bgcolor: 'grey.100' },
          minHeight: previewUrl ? 'auto' : 180,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
        }}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />
        {previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            sx={{ maxHeight: 280, maxWidth: '100%', borderRadius: 2, objectFit: 'contain' }}
          />
        ) : (
          <>
            <CloudUpload sx={{ fontSize: 48, color: 'primary.light' }} />
            <Typography color="text.secondary">
              Перетащите фото сюда или нажмите для выбора
            </Typography>
          </>
        )}
      </Paper>

      {/* Индикатор загрузки */}
      {status === 'analyzing' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={24} />
          <Typography>Анализирую фото...</Typography>
        </Box>
      )}

      {/* Ошибка */}
      {status === 'error' && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Вкладка 1: найденные ингредиенты */}
      {tab === 0 && status === 'done' && (
        <Box>
          {detectedIngredientNames.length === 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Ингредиенты не распознаны. Попробуйте другое фото.
            </Alert>
          ) : (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Найденные продукты — отметьте нужные:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {detectedIngredientNames.map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    onClick={() => toggleName(name)}
                    color={selectedNames.has(name) ? 'primary' : 'default'}
                    icon={selectedNames.has(name) ? <Check /> : undefined}
                    clickable
                  />
                ))}
              </Box>
              <Button
                variant="contained"
                size="large"
                onClick={handleConfirm}
                disabled={selectedNames.size === 0}
              >
                Найти блюда ({selectedNames.size} продуктов)
              </Button>
            </>
          )}
        </Box>
      )}

      {/* Вкладка 2: калории */}
      {tab === 1 && status === 'done' && calorieEstimate && (
        <Box sx={{ maxWidth: 400 }}>
          <CalorieCard estimate={calorieEstimate} />
        </Box>
      )}
    </Box>
  )
}
