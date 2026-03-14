import { ReactNode, useState, useMemo } from 'react'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { ThemeModeContext, ThemeMode, ThemeAccent } from '../contexts/ThemeContext'

const ACCENT_PALETTE = {
  green:  { main: '#20C997', light: '#38D9A9', dark: '#18B383', deep: '#0F9B6E', rgb: '32,201,151',  tintRgb: '204,251,241', paperRgb: '240,253,248', paperDarkRgb: '236,253,245', hoverRgb: '224,253,244' },
  orange: { main: '#F97316', light: '#FB923C', dark: '#EA580C', deep: '#C2410C', rgb: '249,115,22',  tintRgb: '255,237,213', paperRgb: '255,247,237', paperDarkRgb: '255,243,224', hoverRgb: '254,235,200' },
} as const

const buildTheme = (mode: ThemeMode, accent: ThemeAccent) => {
  const p = ACCENT_PALETTE[accent]
  return createTheme({
    palette: {
      mode,
      background: {
        default: mode === 'light' ? `rgb(${p.paperRgb})` : '#08121f',
        paper: mode === 'light' ? `rgba(${p.paperRgb},0.97)` : 'rgba(8,18,35,0.95)',
      },
      primary: { main: p.main, light: p.light, dark: p.dark, contrastText: '#ffffff' },
      secondary: { main: '#FB923C', contrastText: '#0a0a0a' },
      success: { main: '#22C55E' },
      warning: { main: '#FFB74D' },
      info: { main: '#A855F7' },
      error: { main: '#ef4444' },
      text: {
        primary: mode === 'light' ? '#0F172A' : '#E2E8F0',
        secondary: mode === 'light' ? '#475569' : '#8B9CB8',
      },
    },
    typography: {
      fontFamily: "'Plus Jakarta Sans', Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, sans-serif",
      h1: { fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, letterSpacing: '-0.02em' },
      h2: { fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.02em' },
      h3: { fontSize: 'clamp(1.15rem, 2vw, 1.5rem)', fontWeight: 700, letterSpacing: '-0.01em' },
      h4: { fontWeight: 700, letterSpacing: '-0.01em' },
      h5: { fontWeight: 700 },
      h6: { fontWeight: 600 },
      body1: { lineHeight: 1.65 },
    },
    shape: { borderRadius: 16 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          ':root': {
            '--w2e-primary': p.main,
            '--w2e-primary-rgb': p.rgb,
            '--w2e-primary-light': p.light,
            '--w2e-primary-dark': p.dark,
            '--w2e-primary-deep': p.deep,
            '--w2e-tint-rgb': p.tintRgb,
            '--w2e-paper-rgb': p.paperRgb,
            '--w2e-paper-dark-rgb': p.paperDarkRgb,
            '--w2e-hover-rgb': p.hoverRgb,
          } as Record<string, string>,
          body: {
            backgroundImage: mode === 'dark'
              ? "linear-gradient(rgba(5,10,20,0.78), rgba(5,10,20,0.78)), url('/desktop.png')"
              : "linear-gradient(rgba(240,250,245,0.62), rgba(240,250,245,0.62)), url('/desktop.png')",
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            scrollbarWidth: 'thin',
            scrollbarColor: `rgba(${p.rgb},0.40) transparent`,
          },
          '*::-webkit-scrollbar': { width: '6px' },
          '*::-webkit-scrollbar-track': { background: 'transparent' },
          '*::-webkit-scrollbar-thumb': {
            background: `rgba(${p.rgb},0.40)`,
            borderRadius: '3px',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            background: mode === 'light' ? `rgba(${p.paperDarkRgb},0.90)` : 'rgba(10,18,35,0.95)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: mode === 'light' ? `2px solid rgba(${p.rgb},0.35)` : 'none',
            boxShadow: mode === 'dark' ? `0 1px 0 rgba(${p.rgb},0.10)` : 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: mode === 'light' ? `rgba(${p.paperRgb},0.97)` : 'rgba(8,18,35,0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: mode === 'light' ? `1px solid rgba(${p.rgb},0.15)` : '1px solid rgba(255,255,255,0.07)',
          },
          outlined: {
            background: mode === 'light' ? `rgba(${p.tintRgb},0.55)` : 'rgba(20,35,60,0.70)',
            border: `1px solid rgba(${p.rgb},0.22)`,
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { borderRadius: 12, textTransform: 'none', fontWeight: 600 },
          contained: {
            background: `linear-gradient(135deg, ${p.dark} 0%, ${p.main} 100%)`,
            boxShadow: `0 4px 20px rgba(${p.rgb},0.35)`,
            color: '#ffffff',
            '&:hover': {
              background: `linear-gradient(135deg, ${p.deep} 0%, ${p.dark} 100%)`,
              boxShadow: `0 6px 28px rgba(${p.rgb},0.55)`,
            },
            '&.Mui-disabled': {
              background: mode === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)',
              color: mode === 'light' ? 'rgba(0,0,0,0.30)' : 'rgba(255,255,255,0.25)',
            },
          },
          outlined: {
            color: mode === 'light' ? '#0F172A' : '#E2E8F0',
            borderColor: `rgba(${p.rgb},0.35)`,
            background: mode === 'light' ? `rgba(${p.paperRgb},0.97)` : 'rgba(8,18,35,0.95)',
            backdropFilter: 'blur(8px)',
            '&:hover': {
              borderColor: `rgba(${p.rgb},0.65)`,
              background: mode === 'light' ? `rgba(${p.hoverRgb},0.99)` : 'rgba(12,26,48,0.97)',
            },
            '&.Mui-disabled': {
              borderColor: `rgba(${p.rgb},0.12)`,
              color: mode === 'light' ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.20)',
            },
          },
          text: {
            color: mode === 'light' ? '#0F172A' : '#E2E8F0',
            '&:hover': { background: `rgba(${p.rgb},0.10)` },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 20, fontWeight: 500, paddingLeft: 4, paddingRight: 4 },
          outlined: {
            borderColor: mode === 'light' ? `rgba(${p.rgb},0.25)` : `rgba(${p.rgb},0.30)`,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            background: mode === 'light' ? `rgba(${p.paperRgb},0.97)` : 'rgba(8,18,35,0.95)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: mode === 'light' ? `1px solid rgba(${p.rgb},0.15)` : '1px solid rgba(255,255,255,0.07)',
            borderRadius: 20,
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              background: mode === 'light' ? `rgba(${p.paperRgb},0.97)` : 'rgba(8,18,35,0.95)',
              backdropFilter: 'blur(8px)',
              '& fieldset': { borderColor: mode === 'light' ? `rgba(${p.rgb},0.30)` : `rgba(${p.rgb},0.22)` },
              '&:hover fieldset': { borderColor: `rgba(${p.rgb},0.55)` },
              '&.Mui-focused fieldset': {
                borderColor: p.main,
                boxShadow: `0 0 0 3px rgba(${p.rgb},0.15)`,
              },
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-switchBase.Mui-checked': { color: p.main },
            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: p.main },
          },
        },
      },
      MuiTabs: {
        styleOverrides: { indicator: { backgroundColor: p.main } },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
            '&.Mui-selected': { color: p.main },
          },
        },
      },
      MuiAlert: {
        styleOverrides: { root: { borderRadius: 12, border: `1px solid rgba(${p.rgb},0.12)` } },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: mode === 'light' ? `rgba(${p.rgb},0.15)` : `rgba(${p.rgb},0.12)`,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            background: mode === 'light' ? `rgba(${p.paperDarkRgb},0.97)` : 'rgba(10,18,35,0.97)',
            border: `1px solid rgba(${p.rgb},0.22)`,
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
          },
        },
      },
      MuiListItem: { styleOverrides: { root: { borderRadius: 10 } } },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            background: mode === 'light' ? `rgba(${p.paperDarkRgb},0.97)` : 'rgba(10,18,35,0.97)',
            border: `1px solid rgba(${p.rgb},0.18)`,
          },
        },
      },
    },
  })
}

export default function ThemeWrapper({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>(() => (localStorage.getItem('w2e_theme') as ThemeMode) || 'light')
  const [accent, setAccent] = useState<ThemeAccent>(() => (localStorage.getItem('w2e_accent') as ThemeAccent) || 'green')

  const toggleMode = () => {
    const next: ThemeMode = mode === 'light' ? 'dark' : 'light'
    setMode(next)
    localStorage.setItem('w2e_theme', next)
  }

  const toggleAccent = () => {
    const next: ThemeAccent = accent === 'green' ? 'orange' : 'green'
    setAccent(next)
    localStorage.setItem('w2e_accent', next)
  }

  const theme = useMemo(() => buildTheme(mode, accent), [mode, accent])

  return (
    <ThemeModeContext.Provider value={{ mode, toggleMode, accent, toggleAccent }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  )
}
