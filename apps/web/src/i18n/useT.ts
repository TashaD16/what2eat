import { useAppSelector } from '../hooks/redux'
import { translations } from './translations'

export function useT() {
  const lang = useAppSelector((state) => state.lang.lang)
  return translations[lang]
}
