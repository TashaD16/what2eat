import { useState, useRef, useEffect } from 'react'
import { Box, Button, Fade } from '@mui/material'
import { SkipNext } from '@mui/icons-material'
import { useT } from '../../i18n/useT'

interface SplashScreenProps {
  onDone: () => void
}

export default function SplashScreen({ onDone }: SplashScreenProps) {
  const t = useT()
  const [visible, setVisible] = useState(true)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handleDone = () => {
    setVisible(false)
    setTimeout(onDone, 350)
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.play().catch(() => {
      // Autoplay blocked — skip intro immediately
      handleDone()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <Fade in={visible} timeout={350}>
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
        }}
      >
        <video
          ref={videoRef}
          src="/wooow_1.mp4"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onEnded={handleDone}
          playsInline
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
    </Fade>
  )
}
