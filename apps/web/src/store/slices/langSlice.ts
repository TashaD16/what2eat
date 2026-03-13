import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export type Lang = 'ru' | 'en'

const STORAGE_KEY = 'w2e_lang'

function loadLang(): Lang {
  try { return (localStorage.getItem(STORAGE_KEY) as Lang) ?? 'en' } catch { return 'en' }
}

const langSlice = createSlice({
  name: 'lang',
  initialState: { lang: loadLang() } as { lang: Lang },
  reducers: {
    setLang: (state, action: PayloadAction<Lang>) => {
      state.lang = action.payload
      try { localStorage.setItem(STORAGE_KEY, action.payload) } catch { /* ignore */ }
    },
  },
})

export const { setLang } = langSlice.actions
export default langSlice.reducer
