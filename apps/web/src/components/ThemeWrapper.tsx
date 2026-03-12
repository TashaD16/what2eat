import { ReactNode, useState, useMemo } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeModeContext, ThemeMode } from '../contexts/ThemeContext'

const buildTheme = (mode: ThemeMode) => createTheme({
  palette: {
    mode,
    background: {
      default: 'transparent',
      paper: mode === 'light' ? 'rgba(236,253,245,0.82)' : 'rgba(15,23,42,0.88)',
    },
    primary: {
      main: '#20C997',
      light: '#38D9A9',
      dark: '#18B383',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FFB74D',
      contrastText: '#0a0a0a',
    },
    success: { main: '#22C55E' },
    warning: { main: '#FFB74D' },
    info: { main: '#A855F7' },
    error: { main: '#ef4444' },
    text: {
      primary: mode === 'light' ? '#0F172A' : '#E2E8F0',
      secondary: mode === 'light' ? '#475569' : '#94A3B8',
    },
  },
  typography: {
    fontFamily: "'Inter', ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif",
    h1: { fontWeight: 900, letterSpacing: '-0.02em' },
    h2: { fontWeight: 800, letterSpacing: '-0.02em' },
    h3: { fontWeight: 700, letterSpacing: '-0.01em' },
    h4: { fontWeight: 700, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 600 },
  },
  shape: { borderRadius: 16 },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundImage: mode === 'dark'
            ? "linear-gradient(rgba(5,10,20,0.78), rgba(5,10,20,0.78)), url('/desktop.png')"
            : "url('/desktop.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(32,201,151,0.25) transparent',
        },
        '*::-webkit-scrollbar': { width: '6px' },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: mode === 'light' ? 'rgba(32,201,151,0.25)' : 'rgba(32,201,151,0.20)',
          borderRadius: '3px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: mode === 'light' ? 'rgba(236,253,245,0.90)' : 'rgba(10,18,35,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(32,201,151,0.18)',
          boxShadow: mode === 'dark' ? '0 1px 0 rgba(32,201,151,0.10)' : 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: mode === 'light' ? 'rgba(236,253,245,0.82)' : 'rgba(15,23,42,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(32,201,151,0.15)',
        },
        outlined: {
          background: mode === 'light' ? 'rgba(204,251,241,0.82)' : 'rgba(20,35,60,0.82)',
          border: '1px solid rgba(32,201,151,0.22)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          background: 'linear-gradient(135deg, #18B383 0%, #20C997 100%)',
          boxShadow: '0 4px 20px rgba(32,201,151,0.35)',
          color: '#ffffff',
          '&:hover': {
            background: 'linear-gradient(135deg, #0F9B6E 0%, #18B383 100%)',
            boxShadow: '0 6px 28px rgba(32,201,151,0.55)',
          },
          '&.Mui-disabled': {
            background: mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
            color: mode === 'light' ? 'rgba(0,0,0,0.30)' : 'rgba(255,255,255,0.25)',
          },
        },
        outlined: {
          color: mode === 'light' ? '#0F172A' : '#E2E8F0',
          borderColor: 'rgba(32,201,151,0.35)',
          background: mode === 'light' ? 'rgba(204,251,241,0.35)' : 'rgba(32,201,151,0.08)',
          backdropFilter: 'blur(8px)',
          '&:hover': {
            borderColor: 'rgba(32,201,151,0.65)',
            background: mode === 'light' ? 'rgba(204,251,241,0.65)' : 'rgba(32,201,151,0.15)',
          },
          '&.Mui-disabled': {
            borderColor: 'rgba(32,201,151,0.12)',
            color: mode === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.20)',
          },
        },
        text: {
          color: mode === 'light' ? '#0F172A' : '#E2E8F0',
          '&:hover': { background: 'rgba(32,201,151,0.10)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
        outlined: {
          borderColor: mode === 'light' ? 'rgba(32,201,151,0.25)' : 'rgba(32,201,151,0.30)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: mode === 'light' ? 'rgba(236,253,245,0.82)' : 'rgba(15,23,42,0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(32,201,151,0.15)',
          borderRadius: 20,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: mode === 'light' ? 'rgba(204,251,241,0.82)' : 'rgba(10,18,35,0.82)',
            backdropFilter: 'blur(8px)',
            '& fieldset': {
              borderColor: mode === 'light' ? 'rgba(32,201,151,0.30)' : 'rgba(32,201,151,0.22)',
            },
            '&:hover fieldset': { borderColor: 'rgba(32,201,151,0.55)' },
            '&.Mui-focused fieldset': {
              borderColor: '#20C997',
              boxShadow: '0 0 0 3px rgba(32,201,151,0.15)',
            },
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': { color: '#20C997' },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#20C997' },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#20C997' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-selected': { color: '#20C997' },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, border: '1px solid rgba(32,201,151,0.12)' },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: mode === 'light' ? 'rgba(32,201,151,0.15)' : 'rgba(32,201,151,0.12)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: mode === 'light' ? 'rgba(236,253,245,0.97)' : 'rgba(10,18,35,0.97)',
          border: '1px solid rgba(32,201,151,0.22)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: mode === 'light' ? 'rgba(236,253,245,0.97)' : 'rgba(10,18,35,0.97)',
          border: '1px solid rgba(32,201,151,0.18)',
        },
      },
    },
  },
})

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => {
    return (localStorage.getItem('w2e_theme') as ThemeMode) || 'light'
  })

  const toggleMode = () => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light'
    setMode(next)
    localStorage.setItem('w2e_theme', next)
  }

  const theme = useMemo(() => buildTheme(mode), [mode])

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
