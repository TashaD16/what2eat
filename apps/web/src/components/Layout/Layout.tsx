import { Box, AppBar, Toolbar, Typography, Container, Button, IconButton, Badge, Avatar, Tooltip } from '@mui/material'
import { CalendarMonth, RestaurantMenu, Login, Logout, DarkMode, LightMode } from '@mui/icons-material'
import { ReactNode } from 'react'
import { useThemeMode } from '../../contexts/ThemeContext'

interface LayoutProps {
  children: ReactNode
  onHomeClick?: () => void
  onPlannerClick?: () => void
  likedCount?: number
  onFavoritesClick?: () => void
  user?: { email?: string } | null
  onAuthClick?: () => void
  onSignOut?: () => void
}

export default function Layout({ children, onHomeClick, onPlannerClick, likedCount, onFavoritesClick, user, onAuthClick, onSignOut }: LayoutProps) {
  const { mode, toggleMode } = useThemeMode()

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', bgcolor: 'transparent' }}>
      <AppBar position="sticky" sx={{ mb: 3 }}>
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            onClick={onHomeClick}
            sx={{
              flexGrow: 1,
              fontWeight: 900,
              background: 'linear-gradient(135deg, #20C997 0%, #38D9A9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em',
              cursor: onHomeClick ? 'pointer' : 'default',
              userSelect: 'none',
            }}
          >
            what2eat
          </Typography>

          {likedCount != null && likedCount > 0 && onFavoritesClick && (
            <IconButton
              onClick={onFavoritesClick}
              aria-label="Избранные блюда"
              sx={{
                color: 'text.secondary',
                mr: 0.5,
                '&:hover': { color: '#20C997', background: 'rgba(32,201,151,0.10)' },
              }}
            >
              <Badge badgeContent={likedCount} color="error" max={99}>
                <RestaurantMenu />
              </Badge>
            </IconButton>
          )}

          {onPlannerClick && (
            <Button
              onClick={onPlannerClick}
              size="small"
              startIcon={<CalendarMonth sx={{ fontSize: 16 }} />}
              sx={{
                color: 'text.secondary',
                borderRadius: 3,
                px: 2,
                '&:hover': { color: 'text.primary', background: 'rgba(32,201,151,0.10)' },
              }}
            >
              Планировщик
            </Button>
          )}

          <Tooltip title={mode === 'dark' ? 'Светлая тема' : 'Тёмная тема'}>
            <IconButton
              onClick={toggleMode}
              size="small"
              sx={{
                ml: 0.5,
                color: 'text.secondary',
                '&:hover': { color: '#20C997', background: 'rgba(32,201,151,0.10)' },
              }}
            >
              {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>

          {user ? (
            <Tooltip title={user.email ?? 'Аккаунт'}>
              <IconButton onClick={onSignOut} size="small" sx={{ ml: 0.5 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#20C997', fontSize: '0.85rem' }}>
                  {user.email?.[0]?.toUpperCase() ?? '?'}
                </Avatar>
              </IconButton>
            </Tooltip>
          ) : (
            <IconButton
              onClick={onAuthClick}
              size="small"
              aria-label="Войти"
              sx={{ ml: 0.5, color: 'text.secondary', '&:hover': { color: '#20C997' } }}
            >
              <Login />
            </IconButton>
          )}

          {user && (
            <Tooltip title="Выйти">
              <IconButton
                onClick={onSignOut}
                size="small"
                sx={{ color: 'text.disabled', '&:hover': { color: '#f44336' } }}
              >
                <Logout fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ flex: 1, pb: 4 }}>
        {children}
      </Container>
    </Box>
  )
}
