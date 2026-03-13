import { useState, useRef, useCallback } from 'react'
import { Box, Typography, CircularProgress, Alert } from '@mui/material'
import { CloudUpload, CheckCircle } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { analyzeIngredients, clearPhoto } from '../../store/slices/photoSlice'
import { prepareImageForApi, convertHeicToJpegFile, isHeic } from '../../utils/imageUtils'
import { useT } from '../../i18n/useT'

interface PhotoDropZoneProps {
  onDetected: (ids: number[]) => void
}

export default function PhotoDropZone({ onDetected }: PhotoDropZoneProps) {
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const t = useT()
  const { status, error } = useAppSelector((state) => state.photo)
  const { ingredients } = useAppSelector((state) => state.ingredients)
  const [detectedCount, setDetectedCount] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    dispatch(clearPhoto())
    setDetectedCount(null)

    let fileToUse = file
    if (isHeic(file)) {
      try {
        fileToUse = await convertHeicToJpegFile(file)
      } catch {
        return
      }
    }

    let base64: string
    let mimeType: string
    try {
      const prepared = await prepareImageForApi(fileToUse)
      base64 = prepared.base64
      mimeType = prepared.mimeType
    } catch {
      const reader = new FileReader()
      base64 = await new Promise<string>((res, rej) => {
        reader.onload = () => res((reader.result as string).split(',')[1] ?? '')
        reader.onerror = rej
        reader.readAsDataURL(fileToUse)
      })
      mimeType = fileToUse.type
    }

    const ingredientNames = ingredients.map((i) => i.name)
    const result = await dispatch(analyzeIngredients({ base64, mimeType, ingredientNames }))
    if (analyzeIngredients.fulfilled.match(result)) {
      const detectedNames = result.payload as string[]
      const ids = ingredients.filter((i) => detectedNames.includes(i.name)).map((i) => i.id)
      setDetectedCount(ids.length)
      onDetected(ids)
    }
  }, [dispatch, ingredients, onDetected])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const isDone = status === 'done' && detectedCount !== null
  const isAnalyzing = status === 'analyzing'

  return (
    <Box sx={{ mb: 1.5 }}>
      <Box
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => !isAnalyzing && fileInputRef.current?.click()}
        sx={{
          border: '2px dashed',
          borderColor: isDragging
            ? 'rgba(168,85,247,0.7)'
            : isDone
            ? 'rgba(34,197,94,0.5)'
            : 'rgba(168,85,247,0.35)',
          borderRadius: 3,
          px: 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1.5,
          cursor: isAnalyzing ? 'default' : 'pointer',
          bgcolor: isDragging
            ? 'rgba(168,85,247,0.08)'
            : isDone
            ? (isLight ? 'rgba(34,197,94,0.06)' : 'rgba(34,197,94,0.08)')
            : (isLight ? 'rgba(168,85,247,0.04)' : 'rgba(168,85,247,0.06)'),
          transition: 'all 0.2s ease',
          '&:hover': !isAnalyzing ? {
            borderColor: isDone ? 'rgba(34,197,94,0.65)' : 'rgba(168,85,247,0.6)',
            bgcolor: isDone ? 'rgba(34,197,94,0.10)' : 'rgba(168,85,247,0.09)',
          } : {},
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />

        {isAnalyzing ? (
          <>
            <CircularProgress size={18} sx={{ color: '#A855F7' }} />
            <Typography variant="body2" sx={{ color: '#A855F7', fontWeight: 500 }}>
              Анализирую фото...
            </Typography>
          </>
        ) : isDone ? (
          <>
            <CheckCircle sx={{ fontSize: 20, color: '#22C55E' }} />
            <Typography variant="body2" sx={{ color: '#22C55E', fontWeight: 600 }}>
              Найдено {detectedCount} продуктов
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', ml: 'auto' }}>
              Нажмите, чтобы загрузить другое
            </Typography>
          </>
        ) : (
          <>
            <CloudUpload sx={{ fontSize: 20, color: '#A855F7' }} />
            <Typography variant="body2" sx={{ color: '#A855F7', fontWeight: 500 }}>
              {t.uploadPhoto}
            </Typography>
          </>
        )}
      </Box>

      {status === 'error' && error && (
        <Alert severity="error" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>
          {error}
        </Alert>
      )}
      {isDone && detectedCount === 0 && (
        <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>
          Продукты не распознаны. Попробуйте другое фото.
        </Alert>
      )}
    </Box>
  )
}
