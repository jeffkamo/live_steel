/** Focusable controls inside a dropdown/menu root (for Tab wrap and arrow navigation). */
export function listFocusableIn(root: HTMLElement): HTMLElement[] {
  const selector =
    'button:not([disabled]), [href]:not([tabindex="-1"]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
  return Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((el) => {
    if (el.getAttribute('tabindex') === '-1') return false
    if (el.closest('[aria-hidden="true"]')) return false
    if (el.hasAttribute('hidden')) return false
    return true
  })
}

export function focusRelativeIn(root: HTMLElement, delta: 1 | -1): void {
  const list = listFocusableIn(root)
  if (list.length === 0) return
  const active = document.activeElement
  const i = active instanceof HTMLElement ? list.indexOf(active) : -1
  if (i < 0) {
    list[delta > 0 ? 0 : list.length - 1]?.focus()
    return
  }
  const n = (i + delta + list.length) % list.length
  list[n]?.focus()
}

/** Tab / Shift+Tab wrap inside root. Call from capture or bubble on keydown. */
export function tabWrapKeyDown(e: KeyboardEvent, root: HTMLElement): void {
  if (e.key !== 'Tab') return
  const list = listFocusableIn(root)
  if (list.length === 0) return
  const first = list[0]!
  const last = list[list.length - 1]!
  const active = document.activeElement
  if (!(active instanceof HTMLElement) || !root.contains(active)) return
  if (!e.shiftKey && active === last) {
    e.preventDefault()
    first.focus()
  } else if (e.shiftKey && active === first) {
    e.preventDefault()
    last.focus()
  }
}
