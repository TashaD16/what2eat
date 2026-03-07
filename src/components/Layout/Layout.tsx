import { Box, AppBar, Toolbar, Typography, Container, Button } from '@mui/material'
import { CalendarMonth } from '@mui/icons-material'
import { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  onPlannerClick?: () => void
}

export default function Layout({ children, onPlannerClick }: LayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: '#0A0A0A' }}>
      <AppBar position="sticky" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #FF4D4D 0%, #FF9500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
            }}
          >
            ЧтоЕсть
          </Typography>
          {onPlannerClick && (
            <Button
              onClick={onPlannerClick}
              size="small"
              startIcon={<CalendarMonth sx={{ fontSize: 16 }} />}
              sx={{
                color: 'rgba(255,255,255,0.7)',
                borderRadius: 3,
                px: 2,
                '&:hover': {
                  color: '#fff',
                  background: 'rgba(255,255,255,0.08)',
                },
              }}
            >
              Планировщик
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ flex: 1, pb: 4 }}>
        {children}
      </Container>
    </Box>
  )
}
