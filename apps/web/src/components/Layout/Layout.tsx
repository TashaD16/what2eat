import { Box, AppBar, Toolbar, Typography, Container, Button, IconButton, Badge, Avatar, Tooltip } from '@mui/material'
import { CalendarMonth, RestaurantMenu, Login, Logout, DarkMode, LightMode, Person, Inventory2 } from '@mui/icons-material'
import { ReactNode } from 'react'
import { useThemeMode } from '../../contexts/ThemeContext'
import { useT } from '../../i18n/useT'

interface LayoutProps {
  children: ReactNode
  onHomeClick?: () => void
  onPlannerClick?: () => void
  onPantryClick?: () => void
  pantryExpiringCount?: number
  likedCount?: number
  onFavoritesClick?: () => void
  user?: { email?: string } | null
  onAuthClick?: () => void
  onSignOut?: () => void
  lang?: 'ru' | 'en'
  onLangToggle?: () => void
  onProfileClick?: () => void
}

export default function Layout({ children, onHomeClick, onPlannerClick, onPantryClick, pantryExpiringCount, likedCount, onFavoritesClick, user, onAuthClick, onSignOut, lang = 'ru', onLangToggle, onProfileClick }: LayoutProps) {
  const { mode, toggleMode, accent, toggleAccent } = useThemeMode()
  const t = useT()

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
              background: 'linear-gradient(135deg, var(--w2e-primary) 0%, var(--w2e-primary-light) 100%)',
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
              aria-label={t.favorites}
              sx={{
                color: 'text.secondary',
                mr: 0.5,
                '&:hover': { color: 'var(--w2e-primary)', background: 'rgba(var(--w2e-primary-rgb),0.10)' },
              }}
            >
              <Badge badgeContent={likedCount} color="error" max={99}>
                <RestaurantMenu />
              </Badge>
            </IconButton>
          )}

          {onPantryClick && (
            <Tooltip title={t.pantryNav}>
              <IconButton
                onClick={onPantryClick}
                size="small"
                sx={{ color: 'text.secondary', '&:hover': { color: 'var(--w2e-primary)', background: 'rgba(var(--w2e-primary-rgb),0.10)' } }}
              >
                <Badge badgeContent={pantryExpiringCount || undefined} color="warning" max={9}>
                  <Inventory2 sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            </Tooltip>
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
                '&:hover': { color: 'text.primary', background: 'rgba(var(--w2e-primary-rgb),0.10)' },
              }}
            >
              {t.planner}
            </Button>
          )}

          {onLangToggle && (
            <Tooltip title={lang === 'ru' ? t.switchToEn : t.switchToRu}>
              <Button
                onClick={onLangToggle}
                size="small"
                sx={{
                  minWidth: 0,
                  px: 1.25,
                  py: 0.4,
                  ml: 0.5,
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  letterSpacing: '0.04em',
                  borderRadius: 2,
                  border: '1.5px solid',
                  borderColor: lang === 'en' ? 'var(--w2e-primary)' : 'rgba(0,0,0,0.15)',
                  color: lang === 'en' ? 'var(--w2e-primary)' : 'text.secondary',
                  bgcolor: lang === 'en' ? 'rgba(var(--w2e-primary-rgb),0.08)' : 'transparent',
                  '&:hover': { borderColor: 'var(--w2e-primary)', color: 'var(--w2e-primary)', bgcolor: 'rgba(var(--w2e-primary-rgb),0.10)' },
                }}
              >
                {lang === 'ru' ? 'EN' : 'RU'}
              </Button>
            </Tooltip>
          )}

          <Tooltip title={accent === 'green' ? (lang === 'ru' ? 'Оранжевый акцент' : 'Orange accent') : (lang === 'ru' ? 'Зелёный акцент' : 'Green accent')}>
            <IconButton
              onClick={toggleAccent}
              size="small"
              sx={{ ml: 0.5, p: '6px' }}
            >
              <Box sx={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--w2e-primary) 0%, var(--w2e-primary-light) 100%)',
                border: '2px solid',
                borderColor: 'divider',
                boxShadow: '0 0 8px rgba(var(--w2e-primary-rgb),0.5)',
                transition: 'all 0.3s ease',
              }} />
            </IconButton>
          </Tooltip>

          <Tooltip title={mode === 'dark' ? t.lightTheme : t.darkTheme}>
            <IconButton
              onClick={toggleMode}
              size="small"
              sx={{
                ml: 0.5,
                color: 'text.secondary',
                '&:hover': { color: 'var(--w2e-primary)', background: 'rgba(var(--w2e-primary-rgb),0.10)' },
              }}
            >
              {mode === 'dark' ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
            </IconButton>
          </Tooltip>

          {user && onProfileClick && (
            <Tooltip title={t.profileTitle}>
              <IconButton
                onClick={onProfileClick}
                size="small"
                sx={{ ml: 0.5, color: 'text.secondary', '&:hover': { color: 'var(--w2e-primary)' } }}
              >
                <Person fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {user ? (
            <Tooltip title={user.email ?? t.account}>
              <IconButton onClick={onSignOut} size="small" sx={{ ml: 0.5 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: 'var(--w2e-primary)', fontSize: '0.85rem' }}>
                  {user.email?.[0]?.toUpperCase() ?? '?'}
                </Avatar>
              </IconButton>
            </Tooltip>
          ) : (
            <IconButton
              onClick={onAuthClick}
              size="small"
              aria-label={t.signIn}
              sx={{ ml: 0.5, color: 'text.secondary', '&:hover': { color: 'var(--w2e-primary)' } }}
            >
              <Login />
            </IconButton>
          )}

          {user && (
            <Tooltip title={t.signOut}>
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
