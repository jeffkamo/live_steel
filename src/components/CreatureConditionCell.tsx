import { useEffect, useRef, useState } from 'react'
import type { DragEvent } from 'react'
import type { ConditionEntry, ConditionState } from '../types'
import { CONDITION_CATALOG, findConditionOnMonster } from '../data'
import { ConditionIcon } from './ConditionIcon'
import { ConditionCatalogIconStrip } from './ConditionCatalogIconStrip'
import { focusRelativeIn, listFocusableIn, tabWrapKeyDown } from '../dropdownA11y'

const conditionPickerRowBtn =
  'rounded-md px-2 py-1.5 text-left font-sans text-[0.72rem] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-amber-600/70'

const conditionPickerDurationPill =
  'shrink-0 rounded-full border px-1.5 py-0.5 font-sans text-[0.58rem] font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-amber-600/70'

export type CreatureConditionDnDBinding = {
  groupIndex: number
  monsterIndex: number
  minionIndex: number | null
  dropHighlight:
    | { groupIndex: number; monsterIndex: number; minionIndex: number | null }
    | null
  onDragStart: (label: string, e: DragEvent) => void
  onDragEnd: () => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
}

export function CreatureConditionCell({
  monsterName,
  conditions,
  onRemove,
  onAddOrSetCondition,
  turnComplete,
  seActPhaseGlow,
  onConfirmEot,
  isEotConfirmed,
  conditionDnD,
}: {
  monsterName: string
  conditions: readonly ConditionEntry[]
  onRemove: (index: number) => void
  onAddOrSetCondition: (label: string, state: ConditionState) => void
  turnComplete: boolean
  seActPhaseGlow?: boolean
  onConfirmEot?: (label: string) => void
  isEotConfirmed?: (label: string) => boolean
  conditionDnD?: CreatureConditionDnDBinding
}) {
  const [open, setOpen] = useState(false)
  const cellRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      const r = returnFocusRef.current
      returnFocusRef.current = null
      queueMicrotask(() => r?.focus?.())
      return
    }
    returnFocusRef.current = cellRef.current
    const id = requestAnimationFrame(() => {
      const p = pickerRef.current
      if (p) listFocusableIn(p)[0]?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [open])

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

  const contentDim =
    'transition-opacity duration-200 ease-out motion-reduce:transition-none ' +
    (turnComplete ? 'opacity-[0.38]' : 'opacity-100')

  const dropRing =
    conditionDnD &&
    conditionDnD.dropHighlight != null &&
    conditionDnD.dropHighlight.groupIndex === conditionDnD.groupIndex &&
    conditionDnD.dropHighlight.monsterIndex === conditionDnD.monsterIndex &&
    conditionDnD.dropHighlight.minionIndex === conditionDnD.minionIndex
      ? 'ring-2 ring-inset ring-emerald-500/45'
      : ''

  return (
    <div
      ref={cellRef}
      data-testid={conditionDnD ? 'condition-drop-target' : undefined}
      data-group-index={conditionDnD?.groupIndex}
      data-monster-index={conditionDnD?.monsterIndex}
      data-minion-index={
        conditionDnD ? (conditionDnD.minionIndex == null ? '' : String(conditionDnD.minionIndex)) : undefined
      }
      onDragOver={conditionDnD?.onDragOver}
      onDragLeave={conditionDnD?.onDragLeave}
      onDrop={conditionDnD?.onDrop}
      className={`relative flex h-full min-h-0 w-full cursor-pointer flex-col justify-center rounded-md p-3 outline-none transition-[background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none hover:bg-zinc-300 dark:hover:bg-zinc-800/35 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 sm:p-3.5 ${dropRing}`}
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
      <div className={`flex w-full flex-col justify-center ${contentDim}`}>
        <ConditionCatalogIconStrip
          conditions={conditions}
          interactive
          turnActed={turnComplete}
          seActPhaseGlow={seActPhaseGlow}
          isEotConfirmed={isEotConfirmed}
          onActiveConditionDragStart={conditionDnD?.onDragStart}
          onActiveConditionDragEnd={conditionDnD?.onDragEnd}
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
          ref={pickerRef}
          data-condition-picker
          className="absolute left-0 top-full z-50 mt-1 w-[min(20rem,calc(100vw-2rem))] max-h-[min(22rem,55vh)] overflow-y-auto rounded-lg border border-zinc-500/75 bg-zinc-100 dark:bg-zinc-900 py-1.5 pl-2 pr-1.5 shadow-xl shadow-black/50 ring-1 ring-black/25"
          role="dialog"
          aria-label={`Add condition to ${monsterName}`}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            const root = e.currentTarget
            if (e.key === 'Escape') {
              e.stopPropagation()
              setOpen(false)
              return
            }
            tabWrapKeyDown(e.nativeEvent, root)
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              focusRelativeIn(root, 1)
            } else if (e.key === 'ArrowUp') {
              e.preventDefault()
              focusRelativeIn(root, -1)
            } else if (e.key === 'Home') {
              e.preventDefault()
              listFocusableIn(root)[0]?.focus()
            } else if (e.key === 'End') {
              e.preventDefault()
              const list = listFocusableIn(root)
              list[list.length - 1]?.focus()
            }
          }}
        >
          <ul className="flex flex-col gap-0.5" role="list">
            {CONDITION_CATALOG.map((label) => {
              const active = findConditionOnMonster(conditions, label)
              const dimmed = active === undefined
              const idx = conditions.findIndex((c) => c.label === label)
              const nameAriaLabel =
                active?.state === 'neutral'
                  ? `Remove ${label} from ${monsterName}`
                  : active
                    ? `Set ${label} to neutral on ${monsterName}`
                    : `Add ${label} as neutral on ${monsterName}`
              const eotAriaLabel =
                active?.state === 'eot'
                  ? `Remove ${label} (end of turn) from ${monsterName}`
                  : `Add ${label} as end of turn on ${monsterName}`
              const seAriaLabel =
                active?.state === 'se'
                  ? `Remove ${label} (save ends) from ${monsterName}`
                  : `Add ${label} as save ends on ${monsterName}`

              return (
                <li key={label}>
                  <div
                    className={`flex items-center gap-1.5 rounded-md py-0.5 pl-1 pr-0.5 ${dimmed ? 'opacity-50' : ''}`}
                  >
                    <button
                      type="button"
                      aria-label={nameAriaLabel}
                      className={`${conditionPickerRowBtn} flex min-w-0 flex-1 items-center gap-2 truncate text-zinc-900 dark:text-zinc-100 hover:bg-zinc-300/85 dark:hover:bg-zinc-800/80 ${dimmed ? 'text-zinc-400' : ''}`}
                      onClick={() => {
                        if (active?.state === 'neutral') {
                          if (idx >= 0) onRemove(idx)
                        } else {
                          onAddOrSetCondition(label, 'neutral')
                        }
                      }}
                    >
                      <ConditionIcon label={label} className="size-3.5 shrink-0 opacity-90" />
                      <span className="min-w-0 truncate">{label}</span>
                    </button>
                    <button
                      type="button"
                      title="End of turn"
                      aria-label={eotAriaLabel}
                      className={`${conditionPickerDurationPill} ${
                        active?.state === 'eot'
                          ? 'border-amber-600/85 bg-amber-100/95 text-amber-950 dark:border-amber-500/80 dark:bg-amber-500/15 dark:text-amber-200'
                          : 'border-zinc-300 dark:border-zinc-600/90 text-zinc-600 hover:border-zinc-500 hover:bg-zinc-200/95 dark:text-zinc-400 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                      onClick={() => {
                        if (active?.state === 'eot') {
                          if (idx >= 0) onRemove(idx)
                        } else {
                          onAddOrSetCondition(label, 'eot')
                        }
                      }}
                    >
                      EoT
                    </button>
                    <button
                      type="button"
                      title="Save ends"
                      aria-label={seAriaLabel}
                      className={`${conditionPickerDurationPill} ${
                        active?.state === 'se'
                          ? 'border-purple-600/85 bg-purple-100/95 text-purple-950 dark:border-purple-500/80 dark:bg-purple-500/15 dark:text-purple-200'
                          : 'border-zinc-300 dark:border-zinc-600/90 text-zinc-600 hover:border-zinc-500 hover:bg-zinc-200/95 dark:text-zinc-400 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }`}
                      onClick={() => {
                        if (active?.state === 'se') {
                          if (idx >= 0) onRemove(idx)
                        } else {
                          onAddOrSetCondition(label, 'se')
                        }
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
