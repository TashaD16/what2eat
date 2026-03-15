import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../../services/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  initialized: boolean
}

const initialState: AuthState = {
  user: null,
  session: null,
  loading: false,
  error: null,
  initialized: false,
}

export const initAuth = createAsyncThunk('auth/init', async (_, { rejectWithValue }) => {
  if (!isSupabaseConfigured()) return { user: null, session: null, oauthError: null }

  // Detect OAuth error redirected back from provider (e.g. Google disabled_client)
  const params = new URLSearchParams(window.location.search)
  const hashParams = new URLSearchParams(window.location.hash.replace('#', ''))
  const oauthError = params.get('error_description') || hashParams.get('error_description') || null
  if (oauthError) {
    // Clean up URL so the error doesn't persist on refresh
    window.history.replaceState({}, '', window.location.pathname)
    return rejectWithValue(decodeURIComponent(oauthError.replace(/\+/g, ' ')))
  }

  const { data } = await supabase.auth.getSession()
  return { user: data.session?.user ?? null, session: data.session }
})

export const signInWithEmail = createAsyncThunk(
  'auth/signInWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return rejectWithValue(error.message)
    return { user: data.user, session: data.session }
  }
)

export const signUpWithEmail = createAsyncThunk(
  'auth/signUpWithEmail',
  async ({ email, password }: { email: string; password: string }, { rejectWithValue }) => {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) return rejectWithValue(error.message)

    // Supabase returns success even for existing emails (prevents enumeration).
    // Detect existing unconfirmed account: user has no identities.
    if (!data.session && data.user?.identities?.length === 0) {
      // Try signing in — if it works, return the session
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (!signInError && signInData.session) {
        return { user: signInData.user, session: signInData.session, needsConfirmation: false }
      }
      return rejectWithValue('This email is already registered. Please sign in or reset your password.')
    }

    // If session exists — email confirmation disabled, logged in immediately
    if (data.session) {
      return { user: data.user, session: data.session, needsConfirmation: false }
    }

    // Session null, new user → needs email confirmation
    return { user: data.user, session: null, needsConfirmation: true }
  }
)

export const signInWithGoogle = createAsyncThunk('auth/signInWithGoogle', async (_, { rejectWithValue }) => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  })
  if (error) return rejectWithValue(error.message)
  return null
})

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await supabase.auth.signOut()
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setSession: (state, action: PayloadAction<{ user: User | null; session: Session | null }>) => {
      state.user = action.payload.user
      state.session = action.payload.session
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.session = action.payload.session
        state.initialized = true
      })
      .addCase(initAuth.rejected, (state, action) => {
        state.initialized = true
        state.error = action.payload as string ?? null
      })
      .addCase(signInWithEmail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signInWithEmail.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.session = action.payload.session
      })
      .addCase(signInWithEmail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(signUpWithEmail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signUpWithEmail.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.session = action.payload.session
      })
      .addCase(signUpWithEmail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(signInWithGoogle.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(signInWithGoogle.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(signInWithGoogle.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(signOut.fulfilled, (state) => {
        state.user = null
        state.session = null
      })
  },
})

export const { setSession, clearError } = authSlice.actions
export default authSlice.reducer
