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
        bgcolor: '#0a0a0a',
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 380 }}>
        {/* Logo / title */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            variant="h3"
            sx={{ fontWeight: 900, color: 'white', letterSpacing: '-0.02em', mb: 0.5 }}
          >
            what2eat
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.4)' }}>
            Планировщик блюд для двоих
          </Typography>
        </Box>

        {/* Card */}
        <Box
          sx={{
            bgcolor: '#141414',
            borderRadius: 4,
            border: '1px solid rgba(255,255,255,0.08)',
            p: 3.5,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', mb: 2.5 }}>
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
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                borderColor: 'rgba(255,255,255,0.5)',
                bgcolor: 'rgba(255,255,255,0.05)',
              },
            }}
          >
            Войти через Google
          </Button>

          <Divider sx={{ mb: 2.5, borderColor: 'rgba(255,255,255,0.1)' }}>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.3)', px: 1 }}>
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
              sx={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', '&:hover': { color: 'white' } }}
            >
              {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
