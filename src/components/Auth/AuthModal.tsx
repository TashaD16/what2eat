import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  Box,
  Typography,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material'
import { Google } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../hooks/redux'
import { signInWithEmail, signUpWithEmail, signInWithGoogle, clearError } from '../../store/slices/authSlice'
import { isSupabaseConfigured } from '../../services/supabase'

interface AuthModalProps {
  open: boolean
  onClose: () => void
}

type Mode = 'signin' | 'signup'

export default function AuthModal({ open, onClose }: AuthModalProps) {
  const dispatch = useAppDispatch()
  const { loading, error } = useAppSelector((state) => state.auth)
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const handleClose = () => {
    setEmail('')
    setPassword('')
    setSuccessMsg(null)
    dispatch(clearError())
    onClose()
  }

  const handleSubmit = async () => {
    if (!email || !password) return
    if (mode === 'signin') {
      const result = await dispatch(signInWithEmail({ email, password }))
      if (signInWithEmail.fulfilled.match(result)) handleClose()
    } else {
      const result = await dispatch(signUpWithEmail({ email, password }))
      if (signUpWithEmail.fulfilled.match(result)) {
        setSuccessMsg('Проверьте почту для подтверждения регистрации')
      }
    }
  }

  const handleGoogle = () => {
    dispatch(signInWithGoogle())
  }

  const switchMode = () => {
    dispatch(clearError())
    setSuccessMsg(null)
    setMode((m) => (m === 'signin' ? 'signup' : 'signin'))
  }

  if (!isSupabaseConfigured()) {
    return (
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Авторизация недоступна</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            Supabase не настроен. Добавьте VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в .env файл.
          </Alert>
          <Button onClick={handleClose} fullWidth sx={{ mt: 2 }}>
            Закрыть
          </Button>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {mode === 'signin' ? 'Войти в аккаунт' : 'Создать аккаунт'}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {successMsg && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMsg}
          </Alert>
        )}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            size="small"
            disabled={loading}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
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
          />
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !email || !password}
            fullWidth
          >
            {loading ? <CircularProgress size={22} /> : mode === 'signin' ? 'Войти' : 'Зарегистрироваться'}
          </Button>

          <Divider sx={{ my: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              или
            </Typography>
          </Divider>

          <Button
            variant="outlined"
            onClick={handleGoogle}
            startIcon={<Google />}
            disabled={loading}
            fullWidth
          >
            Войти через Google
          </Button>

          <Typography
            variant="body2"
            textAlign="center"
            sx={{ color: 'text.secondary', cursor: 'pointer' }}
            onClick={switchMode}
          >
            {mode === 'signin' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
