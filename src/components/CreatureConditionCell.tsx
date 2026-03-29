import { useEffect, useRef, useState } from 'react'
import type { ConditionEntry, ConditionState } from '../types'
import { CONDITION_CATALOG, findConditionOnMonster } from '../data'
import { ConditionIcon } from './ConditionIcon'
import { ConditionCatalogIconStrip } from './ConditionCatalogIconStrip'

const conditionPickerRowBtn =
  'rounded-md px-2 py-1.5 text-left font-sans text-[0.72rem] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-amber-600/70'

const conditionPickerDurationPill =
  'shrink-0 rounded-full border px-1.5 py-0.5 font-sans text-[0.58rem] font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-amber-600/70'

export function CreatureConditionCell({
  monsterName,
  conditions,
  onRemove,
  onAddOrSetCondition,
  turnComplete,
  seActPhaseGlow,
  onConfirmEot,
  isEotConfirmed,
}: {
  monsterName: string
  conditions: readonly ConditionEntry[]
  onRemove: (index: number) => void
  onAddOrSetCondition: (label: string, state: ConditionState) => void
  turnComplete: boolean
  seActPhaseGlow?: boolean
  onConfirmEot?: (label: string) => void
  isEotConfirmed?: (label: string) => boolean
}) {
  const [open, setOpen] = useState(false)
  const cellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const onDocMouseDown = (e: MouseEvent) => {
      const el = cellRef.current
      if (el && !el.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const rowTone =
    'transition-opacity duration-200 ease-out motion-reduce:transition-none ' +
    (turnComplete ? 'opacity-[0.52]' : 'opacity-100')

  return (
    <div
      ref={cellRef}
      className={`relative flex h-full min-h-0 w-full cursor-pointer flex-col justify-center rounded-md p-3 outline-none transition-[background-color] duration-200 ease-out motion-reduce:transition-none hover:bg-zinc-800/35 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:p-3.5 ${rowTone}`}
      role="group"
      tabIndex={0}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={`Conditions for ${monsterName}. Click outside the condition icons to open advanced options (duration). Click an icon to add or remove that condition.`}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen((o) => !o)
        }
      }}
    >
      <div className="flex w-full flex-col justify-center">
        <ConditionCatalogIconStrip
          conditions={conditions}
          interactive
          turnActed={turnComplete}
          seActPhaseGlow={seActPhaseGlow}
          isEotConfirmed={isEotConfirmed}
          onToggleLabel={(label) => {
            const existing = conditions.find((c) => c.label === label)
            if (existing) {
              if (turnComplete && existing.state === 'eot' && onConfirmEot && !(isEotConfirmed?.(label))) {
                onConfirmEot(label)
                return
              }
              const idx = conditions.findIndex((c) => c.label === label)
              onRemove(idx)
            } else {
              onAddOrSetCondition(label, 'neutral')
            }
          }}
        />
      </div>
      {open ? (
        <div
          data-condition-picker
          className="absolute left-0 top-full z-50 mt-1 w-[min(20rem,calc(100vw-2rem))] max-h-[min(22rem,55vh)] overflow-y-auto rounded-lg border border-zinc-500/75 bg-zinc-900 py-1.5 pl-2 pr-1.5 shadow-xl shadow-black/50 ring-1 ring-black/25"
          role="dialog"
          aria-label={`Add condition to ${monsterName}`}
          onClick={(e) => e.stopPropagation()}
        >
          <ul className="flex flex-col gap-0.5" role="list">
            {CONDITION_CATALOG.map((label) => {
              const active = findConditionOnMonster(conditions, label)
              const dimmed = active === undefined
              return (
                <li key={label}>
                  <div
                    className={`flex items-center gap-1.5 rounded-md py-0.5 pl-1 pr-0.5 ${dimmed ? 'opacity-50' : ''}`}
                  >
                    <button
                      type="button"
                      className={`${conditionPickerRowBtn} flex min-w-0 flex-1 items-center gap-2 truncate text-zinc-100 hover:bg-zinc-800/80 ${dimmed ? 'text-zinc-400' : ''}`}
                      onClick={() => {
                        onAddOrSetCondition(label, 'neutral')
                      }}
                    >
                      <ConditionIcon label={label} className="size-3.5 shrink-0 opacity-90" />
                      <span className="min-w-0 truncate">{label}</span>
                    </button>
                    <button
                      type="button"
                      title="End of turn"
                      aria-label={`Add ${label} as end of turn on ${monsterName}`}
                      className={`${conditionPickerDurationPill} ${
                        active?.state === 'eot'
                          ? 'border-amber-500/80 bg-amber-500/15 text-amber-200'
                          : 'border-zinc-600/90 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200'
                      }`}
                      onClick={() => {
                        onAddOrSetCondition(label, 'eot')
                      }}
                    >
                      EoT
                    </button>
                    <button
                      type="button"
                      title="Save ends"
                      aria-label={`Add ${label} as save ends on ${monsterName}`}
                      className={`${conditionPickerDurationPill} ${
                        active?.state === 'se'
                          ? 'border-purple-500/80 bg-purple-500/15 text-purple-200'
                          : 'border-zinc-600/90 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200'
                      }`}
                      onClick={() => {
                        onAddOrSetCondition(label, 'se')
                      }}
                    >
                      SE
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
