import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { TerrainRowState } from '../types'
import { terrainNames, terrainRowFromBestiary } from '../terrainBestiary'
import { blankCustomTerrainRow } from '../data'
import { tabWrapKeyDown } from '../dropdownA11y'

export function AddTerrainButton({
  onAdd,
}: {
  onAdd: (terrain: TerrainRowState) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const allNames = useMemo(() => terrainNames().slice().sort((a, b) => a.localeCompare(b)), [])

  const filtered = useMemo(() => {
    if (!query.trim()) return allNames
    const q = query.toLowerCase()
    return allNames.filter((n) => n.toLowerCase().includes(q))
  }, [allNames, query])

  const handleOpen = useCallback(() => {
    returnFocusRef.current = triggerRef.current
    setOpen(true)
    setQuery('')
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const handleSelect = useCallback(
    (name: string) => {
      onAdd(terrainRowFromBestiary(name))
    },
    [onAdd],
  )

  const handleAddCustom = useCallback(() => {
    onAdd(blankCustomTerrainRow())
  }, [onAdd])

  useEffect(() => {
    if (!open) {
      const r = returnFocusRef.current
      returnFocusRef.current = null
      queueMicrotask(() => r?.focus?.())
      return
    }
    const id = requestAnimationFrame(() => inputRef.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    function onDocKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        handleClose()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onDocKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onDocKeyDown)
    }
  }, [open, handleClose])

  const handlePanelKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const root = containerRef.current
      if (!root) return
      if (e.key === 'Escape') {
        e.stopPropagation()
        handleClose()
        return
      }
      tabWrapKeyDown(e.nativeEvent, root)
      const opts = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-terrain-option]'))
      const input = inputRef.current
      if (e.key === 'ArrowDown') {
        const i = opts.indexOf(document.activeElement as HTMLButtonElement)
        if (i >= 0) {
          e.preventDefault()
          opts[(i + 1) % opts.length]?.focus()
        }
        return
      }
      if (e.key === 'ArrowUp') {
        const i = opts.indexOf(document.activeElement as HTMLButtonElement)
        if (i === 0) {
          e.preventDefault()
          input?.focus()
          return
        }
        if (i > 0) {
          e.preventDefault()
          opts[i - 1]?.focus()
          return
        }
        return
      }
      if (e.key === 'Home' && opts.length > 0 && opts.includes(document.activeElement as HTMLButtonElement)) {
        e.preventDefault()
        opts[0]?.focus()
        return
      }
      if (e.key === 'End' && opts.length > 0 && opts.includes(document.activeElement as HTMLButtonElement)) {
        e.preventDefault()
        opts[opts.length - 1]?.focus()
      }
    },
    [handleClose],
  )

  const handleSearchInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key !== 'ArrowDown') {
        handlePanelKeyDown(e as unknown as React.KeyboardEvent<HTMLDivElement>)
        return
      }
      const root = containerRef.current
      if (!root) return
      const opts = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-terrain-option]'))
      if (opts.length === 0) return
      e.preventDefault()
      opts[0]?.focus()
    },
    [handlePanelKeyDown],
  )

  return (
    <div
      ref={containerRef}
      className="relative mt-1 w-full"
      onKeyDownCapture={open ? handlePanelKeyDown : undefined}
    >
      {!open ? (
        <button
          ref={triggerRef}
          type="button"
          aria-label="Add terrain"
          onClick={handleOpen}
          className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-400 dark:border-zinc-700 px-3 py-2 font-sans text-xs text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-50/90 dark:hover:bg-transparent hover:text-zinc-900 dark:hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5" aria-hidden>
            <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
          </svg>
          Add terrain
        </button>
      ) : (
        <>
          <div className="min-h-10 w-full shrink-0" aria-hidden />
          <div className="absolute left-0 right-0 top-0 z-50 flex max-h-[min(50vh,12rem)] flex-col overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-900 shadow-2xl ring-1 ring-black/30">
            <div className="flex shrink-0 items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0 text-zinc-500" aria-hidden>
                <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleSearchInputKeyDown}
                placeholder="Search terrain…"
                aria-label="Search terrain"
                className="min-w-0 flex-1 bg-transparent font-sans text-xs text-zinc-800 dark:text-zinc-200 outline-none placeholder:text-zinc-600"
              />
              <button
                type="button"
                aria-label="Close terrain picker"
                onClick={handleClose}
                className="shrink-0 cursor-pointer rounded p-0.5 text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500/60"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3" aria-hidden>
                  <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                </svg>
              </button>
            </div>
            <ul
              role="listbox"
              aria-label="Available terrain"
              className="min-h-0 flex-1 overflow-y-auto py-1"
            >
              <li role="option" aria-selected={false}>
                <button
                  type="button"
                  data-terrain-option
                  onClick={handleAddCustom}
                  className="w-full cursor-pointer border-b border-zinc-200 dark:border-zinc-800/80 px-3 py-2 text-left font-sans text-xs font-medium text-amber-950 dark:text-amber-200 transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-800 hover:text-amber-950 dark:hover:text-amber-50 focus-visible:bg-zinc-800 focus-visible:text-amber-50 focus-visible:outline-none"
                >
                  Custom terrain
                </button>
              </li>
              {filtered.length === 0 && (
                <li className="px-3 py-2 font-sans text-xs text-zinc-600">
                  No matches
                </li>
              )}
              {filtered.map((name) => (
                <li key={name} role="option" aria-selected={false}>
                  <button
                    type="button"
                    data-terrain-option
                    onClick={() => handleSelect(name)}
                    className="w-full cursor-pointer px-3 py-1.5 text-left font-sans text-xs text-zinc-700 dark:text-zinc-300 transition-colors hover:bg-zinc-300 dark:hover:bg-zinc-800 hover:text-zinc-100 focus-visible:bg-zinc-800 focus-visible:text-zinc-100 focus-visible:outline-none"
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
