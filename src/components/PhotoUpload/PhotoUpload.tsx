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
  Menu,
  MenuItem,
  ListItemText,
  TextField,
  Divider,
} from '@mui/material'
import { CameraAlt, RestaurantMenu, ArrowBack, CloudUpload, Check, Edit, Add } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { analyzeIngredients, analyzeCalories, clearPhoto, setError } from '../../store/slices/photoSlice'
import { setSelectedIngredients } from '../../store/slices/ingredientsSlice'
import { prepareImageForApi, convertHeicToJpegFile, isHeic } from '../../utils/imageUtils'
import CalorieCard from '../CalorieCard'

interface PhotoUploadProps {
  onIngredientsConfirmed: (ingredientIds: number[]) => void
  onBack: () => void
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
  const [customIngredients, setCustomIngredients] = useState<string[]>([])

  const [addProductAnchor, setAddProductAnchor] = useState<null | HTMLElement>(null)
  const [addSearchQuery, setAddSearchQuery] = useState('')

  const [replaceAnchor, setReplaceAnchor] = useState<null | HTMLElement>(null)
  const [replaceName, setReplaceName] = useState<string | null>(null)
  const [replaceSearchQuery, setReplaceSearchQuery] = useState('')

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return
      dispatch(clearPhoto())
      setSelectedNames(new Set())
      setCustomIngredients([])

      let fileToUse = file
      if (isHeic(file)) {
        try {
          fileToUse = await convertHeicToJpegFile(file)
        } catch {
          dispatch(setError('Не удалось конвертировать фото. Попробуйте другое фото или формат JPEG.'))
          return
        }
      }

      const url = URL.createObjectURL(fileToUse)
      setPreviewUrl(url)

      let base64: string
      let mimeType: string
      try {
        const prepared = await prepareImageForApi(fileToUse)
        base64 = prepared.base64
        mimeType = prepared.mimeType
      } catch {
        const supported = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if (!supported.includes(file.type)) {
          dispatch(
            setError(
              'Формат не поддерживается. Загрузите JPEG или PNG. iPhone: Настройки → Камера → Форматы → «Наиболее совместимые».'
            )
          )
          return
        }
        const reader = new FileReader()
        const result = await new Promise<string>((res, rej) => {
          reader.onload = () => res((reader.result as string).split(',')[1] ?? '')
          reader.onerror = rej
          reader.readAsDataURL(fileToUse)
        })
        base64 = result
        mimeType = fileToUse.type
      }

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

  const handleReplace = (oldName: string, newName: string) => {
    setSelectedNames((prev) => {
      const next = new Set(prev)
      next.delete(oldName)
      next.add(newName)
      return next
    })
    setReplaceAnchor(null)
    setReplaceName(null)
    setReplaceSearchQuery('')
  }

  const handleAddProduct = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSelectedNames((prev) => new Set(prev).add(trimmed))
    // If it's a custom (not in DB) ingredient, track it
    if (!ingredients.some((i) => i.name === trimmed)) {
      setCustomIngredients((prev) => prev.includes(trimmed) ? prev : [...prev, trimmed])
    }
    setAddProductAnchor(null)
    setAddSearchQuery('')
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
    setCustomIngredients([])
  }

  // Filtered list for "Add product" menu
  const addFilteredIngredients = ingredients.filter((i) => {
    if (selectedNames.has(i.name)) return false
    if (!addSearchQuery) return true
    return i.name.toLowerCase().startsWith(addSearchQuery.toLowerCase())
  })

  const addQueryIsNew =
    addSearchQuery.trim().length > 0 &&
    !ingredients.some((i) => i.name.toLowerCase() === addSearchQuery.toLowerCase().trim()) &&
    !selectedNames.has(addSearchQuery.trim())

  // Filtered list for "Replace" menu
  const replaceFilteredIngredients = ingredients.filter((i) => {
    if (i.name === replaceName) return false
    if (!replaceSearchQuery) return true
    return i.name.toLowerCase().startsWith(replaceSearchQuery.toLowerCase())
  })

  const replaceQueryIsNew =
    replaceSearchQuery.trim().length > 0 &&
    !ingredients.some((i) => i.name.toLowerCase() === replaceSearchQuery.toLowerCase().trim()) &&
    replaceName !== replaceSearchQuery.trim()

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

      {status === 'analyzing' && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress size={24} />
          <Typography>Анализирую фото...</Typography>
        </Box>
      )}

      {status === 'error' && error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {tab === 0 && status === 'done' && (
        <Box>
          {detectedIngredientNames.length === 0 ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Ингредиенты не распознаны. Попробуйте другое фото.
            </Alert>
          ) : (
            <>
              <Typography variant="subtitle1" gutterBottom>
                Найденные продукты — отметьте нужные, замените ошибочные или добавьте свои:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {[...detectedIngredientNames, ...customIngredients.filter(n => !detectedIngredientNames.includes(n))].map((name) => (
                  <Chip
                    key={name}
                    label={name}
                    onClick={() => toggleName(name)}
                    onDelete={(e) => {
                      e.stopPropagation()
                      setReplaceName(name)
                      setReplaceSearchQuery('')
                      setReplaceAnchor((e.currentTarget as HTMLElement).closest('.MuiChip-root') as HTMLElement)
                    }}
                    deleteIcon={<Edit fontSize="small" />}
                    color={selectedNames.has(name) ? 'primary' : 'default'}
                    icon={selectedNames.has(name) ? <Check /> : undefined}
                    clickable
                  />
                ))}
                <Button
                  size="small"
                  startIcon={<Add />}
                  onClick={(e) => { setAddProductAnchor(e.currentTarget); setAddSearchQuery('') }}
                  sx={{ alignSelf: 'center' }}
                >
                  Добавить продукт
                </Button>
              </Box>

              {/* Replace menu with search */}
              <Menu
                anchorEl={replaceAnchor}
                open={Boolean(replaceAnchor) && Boolean(replaceName)}
                onClose={() => { setReplaceAnchor(null); setReplaceName(null); setReplaceSearchQuery('') }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                slotProps={{ paper: { sx: { maxHeight: 360, width: 240 } } }}
              >
                <Box sx={{ px: 1.5, py: 1 }} onKeyDown={(e) => e.stopPropagation()}>
                  <TextField
                    autoFocus
                    size="small"
                    placeholder="Поиск..."
                    fullWidth
                    value={replaceSearchQuery}
                    onChange={(e) => setReplaceSearchQuery(e.target.value)}
                  />
                </Box>
                <Divider />
                {replaceQueryIsNew && (
                  <MenuItem onClick={() => replaceName && handleReplace(replaceName, replaceSearchQuery.trim())}>
                    <ListItemText
                      primary={`+ Добавить «${replaceSearchQuery.trim()}»`}
                      primaryTypographyProps={{ color: 'primary', fontWeight: 600 }}
                    />
                  </MenuItem>
                )}
                {replaceFilteredIngredients.map((ing) => (
                  <MenuItem key={ing.id} onClick={() => replaceName && handleReplace(replaceName, ing.name)}>
                    <ListItemText primary={ing.name} />
                  </MenuItem>
                ))}
                {replaceFilteredIngredients.length === 0 && !replaceQueryIsNew && (
                  <MenuItem disabled>Ничего не найдено</MenuItem>
                )}
              </Menu>

              {/* Add product menu with search */}
              <Menu
                anchorEl={addProductAnchor}
                open={Boolean(addProductAnchor)}
                onClose={() => { setAddProductAnchor(null); setAddSearchQuery('') }}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                slotProps={{ paper: { sx: { maxHeight: 360, width: 240 } } }}
              >
                <Box sx={{ px: 1.5, py: 1 }} onKeyDown={(e) => e.stopPropagation()}>
                  <TextField
                    autoFocus
                    size="small"
                    placeholder="Поиск или введите название..."
                    fullWidth
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && addSearchQuery.trim()) {
                        e.preventDefault()
                        handleAddProduct(addSearchQuery.trim())
                      }
                    }}
                  />
                </Box>
                <Divider />
                {addQueryIsNew && (
                  <MenuItem onClick={() => handleAddProduct(addSearchQuery.trim())}>
                    <ListItemText
                      primary={`+ Добавить «${addSearchQuery.trim()}»`}
                      primaryTypographyProps={{ color: 'primary', fontWeight: 600 }}
                    />
                  </MenuItem>
                )}
                {addFilteredIngredients.map((ing) => (
                  <MenuItem key={ing.id} onClick={() => handleAddProduct(ing.name)}>
                    <ListItemText primary={ing.name} />
                  </MenuItem>
                ))}
                {addFilteredIngredients.length === 0 && !addQueryIsNew && (
                  <MenuItem disabled>Ничего не найдено</MenuItem>
                )}
              </Menu>

              <Button
                variant="contained"
                size="large"
                onClick={handleConfirm}
                disabled={selectedNames.size === 0}
                sx={{ mt: 1 }}
              >
                Найти блюда ({selectedNames.size} продуктов)
              </Button>
            </>
          )}
        </Box>
      )}

      {tab === 1 && status === 'done' && calorieEstimate && (
        <Box sx={{ maxWidth: 400 }}>
          <CalorieCard estimate={calorieEstimate} />
        </Box>
      )}
    </Box>
  )
}
