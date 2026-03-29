import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Monster } from '../types'
import { statblockNames } from '../bestiary'
import { monsterFromBestiary } from '../data'

export function AddMonsterButton({
  onAdd,
}: {
  onAdd: (monster: Monster) => void
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const allNames = useMemo(() => statblockNames().slice().sort((a, b) => a.localeCompare(b)), [])

  const filtered = useMemo(() => {
    if (!query.trim()) return allNames
    const q = query.toLowerCase()
    return allNames.filter((n) => n.toLowerCase().includes(q))
  }, [allNames, query])

  const handleOpen = useCallback(() => {
    setOpen(true)
    setQuery('')
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    setQuery('')
  }, [])

  const handleSelect = useCallback(
    (name: string) => {
      onAdd(monsterFromBestiary(name))
      handleClose()
    },
    [onAdd, handleClose],
  )

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open, handleClose])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        handleClose()
      }
    },
    [handleClose],
  )

  if (!open) {
    return (
      <button
        type="button"
        aria-label="Add monster to group"
        onClick={handleOpen}
        className="mt-1 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-zinc-700 px-3 py-2 font-sans text-xs text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5" aria-hidden>
          <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
        </svg>
        Add monster
      </button>
    )
  }

  return (
    <div ref={containerRef} className="relative mt-1" onKeyDown={handleKeyDown}>
      <div className="rounded-md border border-zinc-700 bg-zinc-900">
        <div className="flex items-center gap-2 border-b border-zinc-800 px-3 py-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0 text-zinc-500" aria-hidden>
            <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search bestiary…"
            aria-label="Search bestiary"
            className="min-w-0 flex-1 bg-transparent font-sans text-xs text-zinc-200 outline-none placeholder:text-zinc-600"
          />
          <button
            type="button"
            aria-label="Close monster picker"
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
          aria-label="Available monsters"
          className="max-h-48 overflow-y-auto py-1"
        >
          {filtered.length === 0 && (
            <li className="px-3 py-2 font-sans text-xs text-zinc-600">
              No matches
            </li>
          )}
          {filtered.map((name) => (
            <li key={name} role="option" aria-selected={false}>
              <button
                type="button"
                onClick={() => handleSelect(name)}
                className="w-full cursor-pointer px-3 py-1.5 text-left font-sans text-xs text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-zinc-100 focus-visible:bg-zinc-800 focus-visible:text-zinc-100 focus-visible:outline-none"
              >
                {name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
