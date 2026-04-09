import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from 'react'
import type { TerrainRowState } from '../types'
import { EditableStaminaCell } from './EditableStaminaCell'
import { ReorderGripWithMenu } from './ReorderGripWithMenu'
import { terrainUpgradeOptions } from '../terrainBestiary'
import { tabWrapKeyDown } from '../dropdownA11y'

function TerrainRowUpgrades({
  terrainName,
  selectedUpgrades,
  uiLocked,
  onAddUpgrade,
  onRemoveUpgrade,
}: {
  terrainName: string
  selectedUpgrades: readonly string[]
  uiLocked?: boolean
  onAddUpgrade?: (name: string) => void
  onRemoveUpgrade?: (name: string) => void
}) {
  const options = useMemo(
    () => terrainUpgradeOptions(terrainName).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [terrainName],
  )
  const remaining = useMemo(() => {
    const picked = new Set(selectedUpgrades)
    return options.filter((o) => !picked.has(o.name))
  }, [options, selectedUpgrades])

  const showAdd = !uiLocked && onAddUpgrade != null && remaining.length > 0
  const showAny = showAdd || selectedUpgrades.length > 0

  // Hooks must not be conditional; locking/unlocking changes `showAdd`.
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const close = useCallback(() => setOpen(false), [])
  const openPanel = useCallback(() => {
    returnFocusRef.current = triggerRef.current
    setOpen(true)
  }, [])

  useEffect(() => {
    if (!open) {
      const r = returnFocusRef.current
      returnFocusRef.current = null
      queueMicrotask(() => r?.focus?.())
      return
    }
    const id = requestAnimationFrame(() => {
      const root = containerRef.current
      if (!root) return
      const first = root.querySelector<HTMLButtonElement>('[data-upgrade-option]')
      first?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    function onDocKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        close()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onDocKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onDocKeyDown)
    }
  }, [open, close])

  if (!showAny) return null

  const hasPills = selectedUpgrades.length > 0
  const addControlWrapperClass = hasPills ? 'relative shrink-0' : 'relative inline-flex shrink-0'

  const addControl = showAdd ? (
    <div
      ref={containerRef}
      className={addControlWrapperClass}
      onKeyDownCapture={
        open
          ? (e) => {
              const root = containerRef.current
              if (!root) return
              if (e.key === 'Escape') {
                e.preventDefault()
                close()
                return
              }
              tabWrapKeyDown(e.nativeEvent, root)
            }
          : undefined
      }
    >
      <button
        ref={triggerRef}
        type="button"
        aria-label="Add upgrade"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={open ? close : openPanel}
        className={`inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1.5 font-sans text-[0.7rem] text-zinc-700 transition-colors hover:border-zinc-500 hover:bg-zinc-50/90 dark:border-zinc-700 dark:hover:bg-transparent hover:text-zinc-950 dark:hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 ${
          open ? 'border-zinc-500 bg-zinc-100 dark:bg-zinc-800/80' : 'border-zinc-400'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0" aria-hidden>
          <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
        </svg>
        Add upgrade
      </button>
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 flex max-h-[min(40vh,11rem)] w-max min-w-[11rem] max-w-[min(18rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-2xl ring-1 ring-black/15 dark:ring-black/30">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2">
            <span className="font-sans text-[0.7rem] font-medium text-zinc-700 dark:text-zinc-300">Choose upgrade</span>
            <button
              type="button"
              aria-label="Close upgrade picker"
              onClick={close}
              className="shrink-0 cursor-pointer rounded p-0.5 text-zinc-500 transition-colors hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500/60"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3" aria-hidden>
                <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
              </svg>
            </button>
          </div>
          <ul role="listbox" aria-label="Available upgrades" className="min-h-0 max-h-[min(40vh,9rem)] overflow-y-auto py-1">
            {remaining.map((o) => (
              <li key={o.name} role="option" aria-selected={false}>
                <button
                  type="button"
                  data-upgrade-option
                  onClick={() => {
                    onAddUpgrade?.(o.name)
                    close()
                  }}
                  className="w-full cursor-pointer px-3 py-1.5 text-left font-sans text-xs text-zinc-800 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-950 dark:hover:text-zinc-100 focus-visible:bg-zinc-100 focus-visible:text-zinc-950 dark:focus-visible:bg-zinc-800 dark:focus-visible:text-zinc-100 focus-visible:outline-none"
                >
                  {o.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  ) : null

  return (
    <div className="mt-2" data-testid="terrain-row-upgrades">
      {hasPills ? (
        <div className="space-y-1">
          <div className="font-sans text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-500">
            Active upgrades
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <ul className="contents">
              {selectedUpgrades.map((name) => (
                <li
                  key={name}
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-amber-600/45 bg-amber-50/95 px-2.5 py-1 font-sans text-[0.7rem] text-amber-950 shadow-[inset_0_1px_0_rgb(251_191_36/0.12)] dark:border-amber-500/35 dark:bg-amber-500/10 dark:text-amber-200 dark:shadow-[inset_0_1px_0_rgb(251_191_36/0.10)]"
                >
                  <span className="min-w-0 truncate">{name}</span>
                  {!uiLocked && onRemoveUpgrade != null && (
                    <button
                      type="button"
                      aria-label={`Remove upgrade: ${name}`}
                      onClick={() => onRemoveUpgrade(name)}
                      className="shrink-0 cursor-pointer rounded-full p-0.5 text-amber-800/90 transition-colors hover:bg-amber-200/80 hover:text-amber-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-600/60 dark:text-amber-200/80 dark:hover:bg-amber-500/15 dark:hover:text-amber-100 dark:focus-visible:outline-amber-500/60"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3" aria-hidden>
                        <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
                      </svg>
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {addControl}
          </div>
        </div>
      ) : (
        addControl
      )}
    </div>
  )
}

export function TerrainRow({
  row,
  rowIndex: _rowIndex,
  onStaminaChange,
  onClick,
  isDrawerOpen,
  uiLocked,
  onDelete,
  onDuplicate,
  onAddUpgrade,
  onRemoveUpgrade,
  dragHandle,
  terrainReorderMenu,
}: {
  row: TerrainRowState
  rowIndex: number
  onStaminaChange: (next: [number, number]) => void
  onClick?: () => void
  isDrawerOpen?: boolean
  uiLocked?: boolean
  onDelete?: () => void
  onDuplicate?: () => void
  onAddUpgrade?: (name: string) => void
  onRemoveUpgrade?: (name: string) => void
  dragHandle?: {
    onDragStart: (e: DragEvent) => void
    onDragEnd: (e: DragEvent) => void
    ariaLabel: string
  }
  terrainReorderMenu?: {
    onMoveUp: () => void
    onMoveDown: () => void
    moveUpDisabled: boolean
    moveDownDisabled: boolean
  }
}) {
  const [tc, tm] = row.stamina
  const hasStatBlock = row.terrainName != null || row.custom != null
  const dead = tm > 0 && tc <= 0
  const deadDim = dead ? 'opacity-40' : ''
  const deadStrike = dead ? 'line-through' : ''
  const extraNotes = (row.notes ?? '').trim()
  const gripMenuItems = [
    ...(terrainReorderMenu != null
      ? [
          {
            id: 'move-up',
            label: 'Move up',
            disabled: terrainReorderMenu.moveUpDisabled,
            onSelect: terrainReorderMenu.onMoveUp,
          },
          {
            id: 'move-down',
            label: 'Move down',
            disabled: terrainReorderMenu.moveDownDisabled,
            onSelect: terrainReorderMenu.onMoveDown,
          },
        ] as const
      : []),
    ...(onDuplicate != null ? [{ id: 'duplicate', label: 'Duplicate', onSelect: onDuplicate } as const] : []),
    ...(onDelete != null ? [{ id: 'delete', label: 'Delete', onSelect: onDelete, destructive: true } as const] : []),
  ]
  const creatureNameColCell =
    'flex h-full min-h-[3.75rem] items-stretch px-2 py-2 sm:min-h-[4rem] sm:px-2.5 sm:py-2.5'
  const bodyCell =
    'flex h-full min-h-[3.75rem] items-center p-3 sm:min-h-[4rem] sm:p-3.5'
  return (
    <div
      className={`group/row-reorder relative min-w-0 w-full max-w-full overflow-visible rounded-lg border border-zinc-200/95 bg-white font-sans shadow-sm dark:border-transparent dark:bg-zinc-900/80 dark:shadow-none ${
        isDrawerOpen ? 'ring-1 ring-amber-500/40' : ''
      }`}
    >
      {!uiLocked && dragHandle ? (
        <div className="pointer-events-none absolute top-0 left-0 z-[110] flex h-full items-center">
          <div className="-translate-x-1/2">
            <ReorderGripWithMenu
              reorderAriaLabel={dragHandle.ariaLabel}
              onDragStart={dragHandle.onDragStart}
              onDragEnd={dragHandle.onDragEnd}
              menuItems={gripMenuItems}
              className="h-9 shrink-0 cursor-grab touch-none select-none rounded-md sm:h-10"
              iconClassName="text-zinc-700 dark:text-zinc-200"
            />
          </div>
        </div>
      ) : null}
      <div className="terrain-row min-w-0 w-full">
        <div className="terrain-row__inner py-2 pl-0 pr-2 sm:py-2.5 sm:pr-2.5">
          <div className="terrain-row__top">
            <div className={`terrain-row__identity ${creatureNameColCell} min-w-0 w-full !p-0`}>
              <div className="flex min-h-0 min-w-0 w-full flex-1 items-stretch justify-start py-1 sm:py-1.5">
                {hasStatBlock ? (
                  <button
                    type="button"
                    onClick={onClick}
                    className={`block w-full min-w-0 cursor-pointer rounded-md px-2 py-2 text-left text-sm leading-relaxed break-words text-zinc-900 [overflow-wrap:anywhere] dark:text-zinc-100 transition-colors hover:bg-zinc-200/90 dark:hover:bg-zinc-800/70 hover:text-amber-800 dark:hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500/60 sm:px-2.5 sm:py-2 sm:text-base ${deadDim} ${deadStrike}`}
                    aria-label={`View stat block for ${row.object}`}
                  >
                    {row.object}
                  </button>
                ) : (
                  <p
                    className={`min-w-0 w-full flex-1 break-words px-2 py-2 text-sm leading-relaxed [overflow-wrap:anywhere] text-zinc-900 dark:text-zinc-100 sm:px-2.5 sm:py-2 sm:text-base ${deadDim} ${deadStrike}`}
                  >
                    {row.object}
                  </p>
                )}
              </div>
            </div>
            <div className={`terrain-row__stamina ${bodyCell} relative z-0 min-w-0 justify-center overflow-visible hover:z-20 focus-within:z-20`}>
              <EditableStaminaCell
                current={tc}
                max={tm}
                onChange={onStaminaChange}
                ariaLabel={`Edit stamina for terrain: ${row.object.slice(0, 48)}${row.object.length > 48 ? '…' : ''}`}
              />
            </div>
          </div>
          <div className="terrain-row__note min-w-0">
            <p className="min-w-0 break-words text-sm leading-relaxed text-zinc-700 [overflow-wrap:anywhere] dark:text-zinc-300 sm:text-base">
              {row.note}
            </p>
            {extraNotes !== '' && (
              <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed [overflow-wrap:anywhere] text-zinc-400 sm:text-base">
                {row.notes}
              </p>
            )}
            {row.terrainName != null && (
              <TerrainRowUpgrades
                terrainName={row.terrainName}
                selectedUpgrades={row.upgrades ?? []}
                uiLocked={uiLocked}
                onAddUpgrade={onAddUpgrade}
                onRemoveUpgrade={onRemoveUpgrade}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
