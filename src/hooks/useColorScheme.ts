import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import {
  type ColorScheme,
  COLOR_SCHEME_STORAGE_KEY,
  applyDocumentDarkClass,
  prefersDarkColorScheme,
  readStoredColorScheme,
} from '../theme'

function subscribeToSystemPreference(onStoreChange: () => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  mq.addEventListener('change', onStoreChange)
  return () => mq.removeEventListener('change', onStoreChange)
}

export function useColorScheme(): {
  colorScheme: ColorScheme
  setColorScheme: (next: ColorScheme) => void
  resolvedDark: boolean
} {
  const systemPrefersDark = useSyncExternalStore(
    subscribeToSystemPreference,
    prefersDarkColorScheme,
    () => false,
  )

  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    () => readStoredColorScheme() ?? 'system',
  )

  const resolvedDark =
    colorScheme === 'dark' ? true : colorScheme === 'light' ? false : systemPrefersDark

  useEffect(() => {
    applyDocumentDarkClass(resolvedDark)
  }, [resolvedDark])

  const setColorScheme = useCallback((next: ColorScheme) => {
    setColorSchemeState(next)
    try {
      localStorage.setItem(COLOR_SCHEME_STORAGE_KEY, next)
    } catch {
      /* ignore quota / private mode */
    }
    const dark =
      next === 'dark' ? true : next === 'light' ? false : prefersDarkColorScheme()
    applyDocumentDarkClass(dark)
  }, [])

  return { colorScheme, setColorScheme, resolvedDark }
}
