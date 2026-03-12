import React, { Component, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { store } from './store'
import App from './App'
import './index.css'

class ErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  componentDidCatch(error: Error) {
    this.setState({ error: error.message + '\n' + error.stack })
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: '#fef2f2', color: '#dc2626', padding: 24, fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 13 }}>
          {this.state.error}
        </div>
      )
    }
    return this.props.children
  }
}

const theme = createTheme({
  palette: {
    mode: 'light',
    background: {
      default: 'transparent',
      paper: 'rgba(255,255,255,0.82)',
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
      primary: '#0F172A',
      secondary: '#475569',
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
          backgroundImage: "url('/desktop.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundAttachment: 'fixed',
          backgroundRepeat: 'no-repeat',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,0,0,0.15) transparent',
        },
        '*::-webkit-scrollbar': { width: '6px' },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(0,0,0,0.15)',
          borderRadius: '3px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(15,23,42,0.08)',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(15,23,42,0.08)',
        },
        outlined: {
          background: 'rgba(255,255,255,0.92)',
          border: '1px solid rgba(15,23,42,0.10)',
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
          boxShadow: '0 4px 20px rgba(32,201,151,0.30)',
          '&:hover': {
            background: 'linear-gradient(135deg, #0F9B6E 0%, #18B383 100%)',
            boxShadow: '0 6px 28px rgba(32,201,151,0.45)',
          },
          '&.Mui-disabled': {
            background: 'rgba(0,0,0,0.08)',
            color: 'rgba(0,0,0,0.30)',
          },
        },
        outlined: {
          borderColor: 'rgba(15,23,42,0.20)',
          '&:hover': {
            borderColor: 'rgba(15,23,42,0.35)',
            background: 'rgba(0,0,0,0.04)',
          },
        },
        text: {
          '&:hover': { background: 'rgba(0,0,0,0.05)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
        outlined: { borderColor: 'rgba(15,23,42,0.15)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(15,23,42,0.08)',
          borderRadius: 20,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(15,23,42,0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(15,23,42,0.30)' },
            '&.Mui-focused fieldset': { borderColor: '#20C997' },
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': { color: '#20C997' },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#20C997',
          },
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
        root: { borderRadius: 12, border: '1px solid rgba(0,0,0,0.1)' },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(15,23,42,0.10)' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'rgba(255,255,255,0.96)',
          border: '1px solid rgba(15,23,42,0.10)',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <App />
        </ThemeProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
)
