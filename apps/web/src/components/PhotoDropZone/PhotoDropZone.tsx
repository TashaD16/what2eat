import { useState, useRef, useCallback } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
} from '@mui/material'
import { CloudUpload, CheckCircle } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { analyzeIngredients, clearPhoto } from '../../store/slices/photoSlice'
import { prepareImageForApi, convertHeicToJpegFile, isHeic } from '../../utils/imageUtils'

interface PhotoDropZoneProps {
  onDetected: (ids: number[]) => void
}

export default function PhotoDropZone({ onDetected }: PhotoDropZoneProps) {
  const dispatch = useAppDispatch()
  const { status, error } = useAppSelector((state) => state.photo)
  const { ingredients } = useAppSelector((state) => state.ingredients)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [detectedCount, setDetectedCount] = useState<number | null>(null)
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

    const url = URL.createObjectURL(fileToUse)
    setPreviewUrl(url)

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
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <Box sx={{ mb: 1.5 }}>
      <Paper
        variant="outlined"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        sx={{
          border: '2px dashed',
          borderColor: 'primary.light',
          borderRadius: 3,
          p: 3,
          mb: status === 'error' || (status === 'done' && detectedCount === 0) ? 1 : 0,
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
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
        />

        {previewUrl ? (
          <Box sx={{ position: 'relative', width: '100%' }}>
            <Box
              component="img"
              src={previewUrl}
              sx={{ maxHeight: 280, maxWidth: '100%', borderRadius: 2, objectFit: 'contain', display: 'block', mx: 'auto' }}
            />
            {status === 'analyzing' && (
              <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(255,255,255,0.65)', borderRadius: 2, gap: 1 }}>
                <CircularProgress size={32} />
                <Typography variant="body2" color="text.secondary">Анализирую фото...</Typography>
              </Box>
            )}
            {status === 'done' && detectedCount !== null && detectedCount > 0 && (
              <Chip
                icon={<CheckCircle sx={{ fontSize: '16px !important' }} />}
                label={`Найдено ${detectedCount} продуктов`}
                color="success"
                size="small"
                sx={{ position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)', fontWeight: 600 }}
              />
            )}
          </Box>
        ) : (
          <>
            {status === 'analyzing' ? (
              <>
                <CircularProgress size={32} />
                <Typography color="text.secondary">Анализирую фото...</Typography>
              </>
            ) : (
              <>
                <CloudUpload sx={{ fontSize: 48, color: 'primary.light' }} />
                <Typography color="text.secondary">
                  Перетащите фото сюда или нажмите для выбора
                </Typography>
              </>
            )}
          </>
        )}
      </Paper>

      {status === 'error' && error && (
        <Alert severity="error" sx={{ py: 0.5, fontSize: '0.8rem' }}>
          {error}
        </Alert>
      )}
      {status === 'done' && detectedCount === 0 && (
        <Alert severity="warning" sx={{ py: 0.5, fontSize: '0.8rem' }}>
          Продукты не распознаны. Попробуйте другое фото.
        </Alert>
      )}
    </Box>
  )
}
