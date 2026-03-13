import { useRef, useCallback, useMemo, useState } from 'react'
import { Box, Typography, CircularProgress, Alert } from '@mui/material'
import { CameraAlt } from '@mui/icons-material'
import { useTheme } from '@mui/material/styles'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { analyzeIngredients, clearPhoto } from '../../store/slices/photoSlice'
import { prepareImageForApi, convertHeicToJpegFile, isHeic } from '../../utils/imageUtils'

interface PhotoDropZoneProps {
  onDetected: (ids: number[]) => void
  onPhotoSelected?: () => void
}

/** True on phones and tablets — any device with touch + mobile UA */
function useIsMobile() {
  return useMemo(() => {
    const ua = navigator.userAgent
    const mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    const hasTouch = navigator.maxTouchPoints > 0 && 'ontouchstart' in window
    return mobileUA || hasTouch
  }, [])
}

export default function PhotoDropZone({ onDetected, onPhotoSelected }: PhotoDropZoneProps) {
  const dispatch = useAppDispatch()
  const theme = useTheme()
  const isLight = theme.palette.mode === 'light'
  const isMobile = useIsMobile()
  const { status, error } = useAppSelector((state) => state.photo)
  const { ingredients } = useAppSelector((state) => state.ingredients)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [detectedCount, setDetectedCount] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) return
    onPhotoSelected?.()
    dispatch(clearPhoto())
    setDetectedCount(null)

    let fileToUse = file
    if (isHeic(file)) {
      try { fileToUse = await convertHeicToJpegFile(file) } catch { return }
    }

    setPreviewUrl(URL.createObjectURL(fileToUse))

    let base64: string
    let mimeType: string
    try {
      const p = await prepareImageForApi(fileToUse)
      base64 = p.base64
      mimeType = p.mimeType
    } catch {
      const reader = new FileReader()
      base64 = await new Promise<string>((res, rej) => {
        reader.onload = () => res((reader.result as string).split(',')[1] ?? '')
        reader.onerror = rej
        reader.readAsDataURL(fileToUse)
      })
      mimeType = fileToUse.type
    }

    const result = await dispatch(analyzeIngredients({
      base64, mimeType, ingredientNames: ingredients.map((i) => i.name),
    }))
    if (analyzeIngredients.fulfilled.match(result)) {
      const names = result.payload as string[]
      const ids = ingredients.filter((i) => names.includes(i.name)).map((i) => i.id)
      setDetectedCount(ids.length)
      onDetected(ids)
    }
  }, [dispatch, ingredients, onDetected, onPhotoSelected])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const isAnalyzing = status === 'analyzing'

  // ── After photo selected: show preview ─────────────────────────────────────
  if (previewUrl) {
    return (
      <Box sx={{ mb: 1.5 }}>
        <Box
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => !isAnalyzing && inputRef.current?.click()}
          sx={{
            position: 'relative', borderRadius: 3, overflow: 'hidden', cursor: isAnalyzing ? 'default' : 'pointer',
            border: '1.5px solid', borderColor: isLight ? 'rgba(32,201,151,0.25)' : 'rgba(32,201,151,0.20)',
          }}
        >
          <input ref={inputRef} type="file" accept="image/*"
            {...(isMobile ? { capture: 'environment' as const } : {})}
            style={{ display: 'none' }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
          />
          <Box component="img" src={previewUrl}
            sx={{ width: '100%', maxHeight: 240, objectFit: 'cover', display: 'block' }} />
          {isAnalyzing && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.45)', gap: 1.5 }}>
              <CircularProgress size={32} sx={{ color: '#20C997' }} />
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>Анализирую фото...</Typography>
            </Box>
          )}
          {!isAnalyzing && (
            <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.35)', py: 0.6, gap: 0.75 }}>
              <CameraAlt sx={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }} />
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.7rem' }}>Нажмите, чтобы переснять</Typography>
            </Box>
          )}
        </Box>
        {status === 'error' && error && <Alert severity="error" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>{error}</Alert>}
        {status === 'done' && detectedCount === 0 && <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>Продукты не распознаны. Попробуйте другое фото.</Alert>}
      </Box>
    )
  }

  // ── Idle: single button ────────────────────────────────────────────────────
  return (
    <Box sx={{ mb: 1.5 }}>
      <input ref={inputRef} type="file" accept="image/*"
        {...(isMobile ? { capture: 'environment' as const } : {})}
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }}
      />
      <Box
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.25,
          py: 1.25, px: 2, cursor: 'pointer', borderRadius: 3,
          border: '1.5px solid', borderColor: isLight ? 'rgba(32,201,151,0.30)' : 'rgba(32,201,151,0.22)',
          bgcolor: isLight ? 'rgba(236,253,245,0.85)' : 'rgba(8,18,35,0.7)',
          transition: 'all 0.18s ease',
          '&:hover': {
            borderColor: 'rgba(32,201,151,0.55)',
            bgcolor: isLight ? 'rgba(32,201,151,0.08)' : 'rgba(32,201,151,0.10)',
          },
        }}
      >
        <Box sx={{ width: 32, height: 32, borderRadius: '50%', border: '1.5px solid rgba(32,201,151,0.50)', bgcolor: 'rgba(32,201,151,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <CameraAlt sx={{ fontSize: 16, color: '#20C997' }} />
        </Box>
        <Typography variant="body2" sx={{ fontWeight: 600, color: '#0F9B6E' }}>
          {isMobile ? 'Сфотографировать' : 'Сфотографировать или загрузить'}
        </Typography>
      </Box>
    </Box>
  )
}
