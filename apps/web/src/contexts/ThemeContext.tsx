import { createContext, useContext } from 'react'

export type ThemeMode = 'light' | 'dark'
export type ThemeAccent = 'green' | 'orange'

export interface ThemeModeContextValue {
  mode: ThemeMode
  toggleMode: () => void
  accent: ThemeAccent
  toggleAccent: () => void
}

export const ThemeModeContext = createContext<ThemeModeContextValue>({
  mode: 'light',
  toggleMode: () => {},
  accent: 'green',
  toggleAccent: () => {},
})

export const useThemeMode = () => useContext(ThemeModeContext)
