import { useState } from 'react'
import {
  Box, Button, TextField, Typography, Divider, Alert, CircularProgress, Link,
} from '@mui/material'
import { Google } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { signInWithEmail, signUpWithEmail, signInWithGoogle, clearError } from '../../store/slices/authSlice'

export default function LoginScreen() {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleGoogle = () => {
    dispatch(signInWithGoogle())
  }

  const handleSubmit = async () => {
    if (!email || !password) return
    setSuccessMsg(null)
    if (mode === 'signin') {
      dispatch(signInWithEmail({ email, password }))
    } else {
      const result = await dispatch(signUpWithEmail({ email, password }))
      if (signUpWithEmail.fulfilled.match(result)) {
        setSuccessMsg('Проверьте почту для подтверждения регистрации')
      }
    }
  }

  const switchMode = () => {
    dispatch(clearError())
    setSuccessMsg(null)
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'transparent',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 380 }}>
        {/* Logo / title */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 900, background: 'linear-gradient(135deg, #f97316 0%, #fcbb00 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '-0.02em', mb: 0.5 }}
          >
            what2eat
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Планировщик блюд для двоих
          </Typography>
        </Box>

        {/* Card */}
        <Box
          sx={{
            bgcolor: 'rgba(255,255,255,0.88)',
            borderRadius: 4,
            border: '1px solid rgba(0,0,0,0.1)',
            backdropFilter: 'blur(20px)',
            p: 3.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary', mb: 2.5 }}>
            {mode === 'signin' ? 'Вход в аккаунт' : 'Регистрация'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: '0.8rem' }}>
              {error}
            </Alert>
          )}
          {successMsg && (
            <Alert severity="success" sx={{ mb: 2, fontSize: '0.8rem' }}>
              {successMsg}
            </Alert>
          )}

          {/* Google */}
          <Button
            variant="outlined"
            fullWidth
            onClick={handleGoogle}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={18} /> : <Google />}
            sx={{
              py: 1.4,
              mb: 2.5,
              borderColor: 'rgba(0,0,0,0.2)',
              color: 'text.primary',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                borderColor: 'rgba(0,0,0,0.35)',
                bgcolor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Войти через Google
          </Button>

          <Divider sx={{ mb: 2.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', px: 1 }}>
              или email
            </Typography>
          </Divider>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <TextField
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <TextField
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              size="small"
              disabled={loading}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={handleSubmit}
              disabled={loading || !email || !password}
              sx={{ py: 1.25, fontWeight: 700, borderRadius: 2, mt: 0.5 }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : mode === 'signin' ? (
                'Войти'
              ) : (
                'Зарегистрироваться'
              )}
            </Button>
          </Box>

          <Box sx={{ textAlign: 'center', mt: 2.5 }}>
            <Link
              component="button"
              variant="body2"
              onClick={switchMode}
              sx={{ color: 'text.secondary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}
            >
              {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
