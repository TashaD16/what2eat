import React, { Component, ReactNode } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { store } from './store'
import App from './App'

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
        <div style={{ background: '#0A0A0A', color: '#FF4D4D', padding: 24, fontFamily: 'monospace', whiteSpace: 'pre-wrap', fontSize: 13 }}>
          {this.state.error}
        </div>
      )
    }
    return this.props.children
  }
}

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#0A0A0A',
      paper: 'rgba(255,255,255,0.05)',
    },
    primary: {
      main: '#FF4D4D',
      light: '#FF7070',
      dark: '#E03535',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#FF9500',
      contrastText: '#ffffff',
    },
    success: { main: '#22C55E' },
    warning: { main: '#FBBF24' },
    info: { main: '#A855F7' },
    error: { main: '#FF4D4D' },
    text: {
      primary: '#FFFFFF',
      secondary: '#9CA3AF',
    },
  },
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
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
          background: '#0A0A0A',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        },
        '*::-webkit-scrollbar': { width: '6px' },
        '*::-webkit-scrollbar-track': { background: 'transparent' },
        '*::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '3px',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'rgba(10,10,10,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'none',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
        },
        outlined: {
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.1)',
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
          background: 'linear-gradient(135deg, #FF4D4D 0%, #FF9500 100%)',
          boxShadow: '0 4px 20px rgba(255,77,77,0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FF3333 0%, #E68600 100%)',
            boxShadow: '0 6px 28px rgba(255,77,77,0.45)',
          },
          '&.Mui-disabled': {
            background: 'rgba(255,255,255,0.08)',
            color: 'rgba(255,255,255,0.25)',
          },
        },
        outlined: {
          borderColor: 'rgba(255,255,255,0.2)',
          '&:hover': {
            borderColor: 'rgba(255,255,255,0.4)',
            background: 'rgba(255,255,255,0.05)',
          },
        },
        text: {
          '&:hover': { background: 'rgba(255,255,255,0.06)' },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
        outlined: { borderColor: 'rgba(255,255,255,0.2)' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': { borderColor: 'rgba(255,255,255,0.15)' },
            '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
            '&.Mui-focused fieldset': { borderColor: '#FF4D4D' },
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-switchBase.Mui-checked': { color: '#FF4D4D' },
          '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#FF4D4D',
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: { backgroundColor: '#FF4D4D' },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          '&.Mui-selected': { color: '#FF4D4D' },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: 'rgba(255,255,255,0.08)' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#141414',
          border: '1px solid rgba(255,255,255,0.12)',
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
