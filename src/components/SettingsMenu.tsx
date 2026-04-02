import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { ColorScheme } from '../theme'

const OPTIONS: { value: ColorScheme; label: string; description: string }[] = [
  { value: 'light', label: 'Light', description: 'Always use light appearance' },
  { value: 'dark', label: 'Dark', description: 'Always use dark appearance' },
  { value: 'system', label: 'System', description: 'Match device setting' },
]

function CogIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.397-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

export function SettingsMenu({
  colorScheme,
  onColorSchemeChange,
}: {
  colorScheme: ColorScheme
  onColorSchemeChange: (next: ColorScheme) => void
}) {
  const [open, setOpen] = useState(false)
  const [panelEntered, setPanelEntered] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dialogId = useId()
  const titleId = useId()

  const closePanel = useCallback(() => {
    setOpen(false)
    setPanelEntered(false)
  }, [])

  const toggleOpen = useCallback(() => {
    if (open) {
      closePanel()
      return
    }
    setOpen(true)
    setPanelEntered(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPanelEntered(true))
    })
  }, [open, closePanel])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, closePanel])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node
      if (panelRef.current?.contains(t) || buttonRef.current?.contains(t)) return
      closePanel()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, closePanel])

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label="Settings"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? dialogId : undefined}
        onClick={toggleOpen}
        className="fixed right-4 top-4 z-[102] inline-flex cursor-pointer items-center justify-center rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-200/80 hover:text-zinc-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600/60 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:hover:text-zinc-200 dark:focus-visible:outline-amber-500/60 md:right-8 md:top-8"
      >
        <CogIcon className="h-5 w-5" />
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-[100] bg-zinc-950/40 backdrop-blur-[2px] transition-opacity duration-200 dark:bg-black/55"
            aria-hidden
            onClick={closePanel}
          />
          <div
            className="pointer-events-none fixed inset-x-0 top-0 z-[101] flex justify-center px-3 pt-3 md:px-6 md:pt-5"
          >
            <div
              ref={panelRef}
              id={dialogId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              className={`pointer-events-auto w-full max-w-md rounded-b-xl border border-zinc-200/90 bg-zinc-50/98 shadow-2xl shadow-zinc-900/10 ring-1 ring-zinc-950/5 transition-transform duration-300 ease-out will-change-transform motion-reduce:transition-none dark:border-zinc-700/90 dark:bg-zinc-900/98 dark:shadow-black/40 dark:ring-white/5 ${
                panelEntered ? 'translate-y-0' : '-translate-y-[110%]'
              }`}
            >
              <div className="border-b border-zinc-200/80 px-4 py-3 dark:border-zinc-700/80">
                <h2
                  id={titleId}
                  className="font-sans text-sm font-semibold tracking-wide text-zinc-900 dark:text-zinc-100"
                >
                  Settings
                </h2>
                <p className="mt-0.5 font-sans text-xs text-zinc-600 dark:text-zinc-400">
                  Appearance
                </p>
              </div>
              <div className="px-4 py-3">
                <fieldset>
                  <legend className="sr-only">Color mode</legend>
                  <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Color mode">
                    {OPTIONS.map((opt) => {
                      const selected = colorScheme === opt.value
                      return (
                        <label
                          key={opt.value}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                            selected
                              ? 'border-amber-500/55 bg-amber-50/90 dark:border-amber-500/45 dark:bg-amber-950/35'
                              : 'border-transparent bg-zinc-100/50 hover:border-zinc-300/80 dark:bg-zinc-800/40 dark:hover:border-zinc-600/80'
                          }`}
                        >
                          <input
                            type="radio"
                            name="color-scheme"
                            value={opt.value}
                            checked={selected}
                            onChange={() => onColorSchemeChange(opt.value)}
                            className="mt-0.5 size-4 shrink-0 cursor-pointer accent-amber-600 dark:accent-amber-500"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block font-sans text-sm font-medium text-zinc-900 dark:text-zinc-100">
                              {opt.label}
                            </span>
                            <span className="mt-0.5 block font-sans text-xs text-zinc-600 dark:text-zinc-400">
                              {opt.description}
                            </span>
                          </span>
                        </label>
                      )
                    })}
                  </div>
                </fieldset>
              </div>
              <div className="flex justify-end border-t border-zinc-200/80 px-4 py-2.5 dark:border-zinc-700/80">
                <button
                  type="button"
                  onClick={closePanel}
                  className="cursor-pointer rounded-md px-3 py-1.5 font-sans text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600/60 dark:text-zinc-300 dark:hover:bg-zinc-800/90 dark:focus-visible:outline-amber-500/60"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  )
}
