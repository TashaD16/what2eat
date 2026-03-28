import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, CircularProgress, Alert, Typography, Box,
} from '@mui/material'
import { Link, AutoAwesome } from '@mui/icons-material'
import { useT } from '../../i18n/useT'
import { useAppSelector } from '../../hooks/redux'
import { importRecipeFromText, AIRecipe } from '../../services/aiRecipes'

interface ImportRecipeDialogProps {
  open: boolean
  onClose: () => void
  onImported: (recipe: AIRecipe) => void
}

export default function ImportRecipeDialog({ open, onClose, onImported }: ImportRecipeDialogProps) {
  const t = useT()
  const lang = useAppSelector((state) => state.lang.lang)
  const [source, setSource] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    if (!source.trim()) return
    setLoading(true)
    setError(null)
    try {
      const recipe = await importRecipeFromText(source.trim(), lang)
      onImported(recipe)
      setSource('')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.importError)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (loading) return
    setSource('')
    setError(null)
    onClose()
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 4 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Link sx={{ color: 'var(--w2e-primary)' }} />
        {t.importRecipeTitle}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {t.importRecipeHint}
        </Typography>

        <TextField
          fullWidth
          multiline
          minRows={4}
          maxRows={10}
          placeholder={t.importRecipePlaceholder}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          disabled={loading}
          autoFocus
        />

        {error && (
          <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>
        )}

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2, color: 'text.secondary' }}>
            <CircularProgress size={18} />
            <Typography variant="body2">{t.importRecipeLoading}</Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={handleClose} disabled={loading}>{t.cancel ?? 'Отмена'}</Button>
        <Button
          variant="contained"
          startIcon={<AutoAwesome />}
          onClick={handleImport}
          disabled={!source.trim() || loading}
        >
          {t.importRecipeBtn}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
