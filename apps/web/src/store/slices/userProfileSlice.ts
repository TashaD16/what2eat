import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { UserProfileData, KBJUGoal, loadUserProfile, saveUserProfile, calculateKBJU } from '../../services/userProfile'

interface UserProfileState {
  profile: UserProfileData | null
  kbju: KBJUGoal | null
  loading: boolean
  saved: boolean
}

const initialState: UserProfileState = {
  profile: null,
  kbju: null,
  loading: false,
  saved: false,
}

export const fetchUserProfile = createAsyncThunk(
  'userProfile/fetch',
  async (userId: string) => {
    return await loadUserProfile(userId)
  }
)

export const persistUserProfile = createAsyncThunk(
  'userProfile/save',
  async ({ userId, profile }: { userId: string; profile: UserProfileData }) => {
    await saveUserProfile(userId, profile)
    return profile
  }
)

const userProfileSlice = createSlice({
  name: 'userProfile',
  initialState,
  reducers: {
    setProfile: (state, action: PayloadAction<UserProfileData>) => {
      state.profile = action.payload
      state.kbju = calculateKBJU(action.payload)
    },
    clearSaved: (state) => {
      state.saved = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false
        if (action.payload) {
          state.profile = action.payload
          state.kbju = calculateKBJU(action.payload)
        }
      })
      .addCase(fetchUserProfile.rejected, (state) => {
        state.loading = false
      })
      .addCase(persistUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload
        state.kbju = calculateKBJU(action.payload)
        state.saved = true
      })
  },
})

export const { setProfile, clearSaved } = userProfileSlice.actions
export default userProfileSlice.reducer
