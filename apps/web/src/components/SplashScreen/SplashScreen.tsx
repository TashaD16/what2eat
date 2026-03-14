import { useState, useEffect, useRef } from 'react'
import { Box, Button } from '@mui/material'
import { SkipNext } from '@mui/icons-material'
import { useT } from '../../i18n/useT'

interface SplashScreenProps {
  onDone: () => void
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const t = useT()
  const [opacity, setOpacity] = useState(1)
  const doneRef = useRef(false)

  const handleDone = () => {
    if (doneRef.current) return
    doneRef.current = true
    setOpacity(0)
    setTimeout(onDone, 400)
  }

  useEffect(() => {
    // Safety: always proceed after 20 seconds even if video stalls
    const timeout = setTimeout(handleDone, 20_000)
    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        bgcolor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        opacity,
        transition: 'opacity 0.4s ease',
      }}
    >
      <video
        src="/wooow_1.mp4"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onEnded={handleDone}
        playsInline
        autoPlay
        muted
      />

      <Button
        onClick={handleDone}
        endIcon={<SkipNext />}
        sx={{
          position: 'absolute',
          bottom: 36,
          right: 24,
          color: 'rgba(255,255,255,0.85)',
          bgcolor: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.22)',
          borderRadius: '50px',
          px: 2.5,
          py: 0.8,
          fontWeight: 600,
          fontSize: '0.9rem',
          textTransform: 'none',
          '&:hover': {
            bgcolor: 'rgba(0,0,0,0.65)',
            color: '#fff',
            borderColor: 'rgba(255,255,255,0.5)',
          },
        }}
      >
        {t.skipIntro}
      </Button>
    </Box>
  )
}
