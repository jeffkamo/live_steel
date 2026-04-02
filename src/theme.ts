export type ColorScheme = 'light' | 'dark' | 'system'

export const COLOR_SCHEME_STORAGE_KEY = 'live-steel-color-scheme'

export function readStoredColorScheme(): ColorScheme | null {
  if (typeof window === 'undefined') return null
  try {
    const v = localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)
    if (v === 'light' || v === 'dark' || v === 'system') return v
  } catch {
    /* private mode / SecurityError */
  }
  return null
}

export function prefersDarkColorScheme(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches === true
}

export function applyDocumentDarkClass(isDark: boolean): void {
  document.documentElement.classList.toggle('dark', isDark)
}
