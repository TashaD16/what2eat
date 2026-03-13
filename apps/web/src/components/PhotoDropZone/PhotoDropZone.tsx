import { useState, useRef, useCallback } from 'react'
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Divider,
} from '@mui/material'
import { CameraAlt, CloudUpload, CheckCircle } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { analyzeIngredients, clearPhoto } from '../../store/slices/photoSlice'
import { prepareImageForApi, convertHeicToJpegFile, isHeic } from '../../utils/imageUtils'

interface PhotoDropZoneProps {
  onDetected: (ids: number[]) => void
}

export default function PhotoDropZone({ onDetected }: PhotoDropZoneProps) {
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const { status, error } = useAppSelector((state) => state.photo)
  const { ingredients } = useAppSelector((state) => state.ingredients)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [detectedCount, setDetectedCount] = useState<number | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    dispatch(clearPhoto())
    setDetectedCount(null)

    let fileToUse = file
    if (isHeic(file)) {
      try { fileToUse = await convertHeicToJpegFile(file) } catch { return }
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

  const isAnalyzing = status === 'analyzing'

  // ── Preview state ──────────────────────────────────────────────────────────
  if (previewUrl) {
    return (
      <Box sx={{ mb: 1.5 }}>
        <Box
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !isAnalyzing && cameraInputRef.current?.click()}
          sx={{
            position: 'relative',
            borderRadius: 3,
            overflow: 'hidden',
            cursor: isAnalyzing ? 'default' : 'pointer',
            border: '1.5px solid',
            borderColor: isLight ? 'rgba(32,201,151,0.25)' : 'rgba(32,201,151,0.20)',
          }}
        >
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

          <Box
            component="img"
            src={previewUrl}
            sx={{ width: '100%', maxHeight: 260, objectFit: 'cover', display: 'block' }}
          />

          {isAnalyzing && (
            <Box sx={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.45)', gap: 1.5,
            }}>
              <CircularProgress size={36} sx={{ color: '#20C997' }} />
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                Анализирую фото...
              </Typography>
            </Box>
          )}

          {status === 'done' && detectedCount !== null && detectedCount > 0 && (
            <Box sx={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)' }}>
              <Chip
                icon={<CheckCircle sx={{ fontSize: '16px !important' }} />}
                label={`Найдено ${detectedCount} продуктов`}
                color="success"
                size="small"
                sx={{ fontWeight: 700, boxShadow: '0 2px 8px rgba(0,0,0,0.25)' }}
              />
            </Box>
          )}

          {!isAnalyzing && (
            <Box sx={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: 'rgba(0,0,0,0.38)', py: 0.75, gap: 0.75,
            }}>
              <CameraAlt sx={{ fontSize: 15, color: 'rgba(255,255,255,0.8)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.72rem' }}>
                Нажмите, чтобы переснять
              </Typography>
            </Box>
          )}
        </Box>

        {status === 'error' && error && (
          <Alert severity="error" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>{error}</Alert>
        )}
        {status === 'done' && detectedCount === 0 && (
          <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>
            Продукты не распознаны. Попробуйте другое фото.
          </Alert>
        )}
      </Box>
    )
  }

  // ── Idle state ─────────────────────────────────────────────────────────────
  return (
    <Box
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      sx={{
        mb: 1.5,
        border: '1.5px solid',
        borderColor: isLight ? 'rgba(32,201,151,0.22)' : 'rgba(32,201,151,0.18)',
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: isLight ? 'rgba(236,253,245,0.85)' : 'rgba(8,18,35,0.7)',
      }}
    >
      {/* Hidden inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
      <input ref={galleryInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />

      {/* Primary — camera */}
      <Box
        onClick={() => cameraInputRef.current?.click()}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 1.25, py: 1.25, px: 2, cursor: 'pointer',
          transition: 'background 0.18s ease',
          '&:hover': {
            bgcolor: isLight ? 'rgba(32,201,151,0.10)' : 'rgba(32,201,151,0.12)',
          },
        }}
      >
        <Box sx={{
          width: 34, height: 34, borderRadius: '50%',
          border: '1.5px solid rgba(32,201,151,0.55)',
          bgcolor: 'rgba(32,201,151,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <CameraAlt sx={{ fontSize: 17, color: '#20C997' }} />
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F9B6E' }}>
          Сфотографировать
        </Typography>
      </Box>

      {/* Divider */}
      <Divider sx={{ mx: 2 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', px: 1, fontSize: '0.72rem' }}>
          или
        </Typography>
      </Divider>

      {/* Secondary — gallery */}
      <Box
        onClick={() => galleryInputRef.current?.click()}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 1, py: 1, px: 2, cursor: 'pointer',
          transition: 'background 0.18s ease',
          '&:hover': {
            bgcolor: isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)',
          },
        }}
      >
        <CloudUpload sx={{ fontSize: 16, color: 'text.disabled' }} />
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          загрузить из галереи
        </Typography>
      </Box>
    </Box>
  )
}
