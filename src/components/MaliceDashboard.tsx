import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { EncounterGroup, MaliceRowRef, PowerRollEffect } from '../types'
import {
  CORE_MALICE_FEATURES,
  ensureMaliceRows,
  findMalicePickForFeatureKey,
  maliceCostSortKey,
  maliceFeatureOptionKey,
  maliceMonsterFamilyTag,
  malicePicksForMonsterRow,
} from '../malice'
import { ReorderGripWithMenu, type ReorderGripMenuItem } from './ReorderGripWithMenu'
import { EffectBlock } from './StatBlock'

const MALICE_DRAG_MIME = 'application/x-live-steel-malice-row-index'

const MONSTER_TAG_CLASS =
  'inline-flex max-w-[min(16rem,100%)] shrink-0 truncate rounded-md border border-zinc-300/80 bg-zinc-100/90 px-1.5 py-0.5 font-sans text-[0.62rem] font-medium leading-none text-zinc-600 dark:border-zinc-600/70 dark:bg-zinc-800/80 dark:text-zinc-400'

/** Leading core rows (Brutal Effectiveness, Malicious Strike, …); monster rows may only reorder below this block. */
function corePrefixLength(rows: readonly MaliceRowRef[]): number {
  let n = 0
  while (n < rows.length && rows[n]!.kind === 'core') n++
  return n
}

export function MaliceDashboard({
  encounterGroups,
  maliceRows,
  uiLocked,
  onMaliceRowsChange,
}: {
  encounterGroups: readonly EncounterGroup[]
  maliceRows: MaliceRowRef[] | undefined
  uiLocked: boolean
  onMaliceRowsChange: (next: MaliceRowRef[]) => void
}): React.JSX.Element {
  const rows = useMemo(() => ensureMaliceRows(maliceRows), [maliceRows])
  const corePrefix = useMemo(() => corePrefixLength(rows), [rows])
  const addMenuId = useId()
  const [addOpen, setAddOpen] = useState(false)
  const addAnchorRef = useRef<HTMLDivElement>(null)
  const [maliceDragFrom, setMaliceDragFrom] = useState<number | null>(null)
  const [maliceDropHover, setMaliceDropHover] = useState<number | null>(null)

  const totalCreatures = useMemo(
    () => encounterGroups.reduce((n, g) => n + g.monsters.length, 0),
    [encounterGroups],
  )

  const addOptions = useMemo(() => {
    const used = new Set<string>()
    for (const r of rows) {
      if (r.kind === 'monster') used.add(r.featureOptionKey)
    }
    const seenInEncounter = new Set<string>()
    const opts: { featureOptionKey: string; name: string; cost: string; monsterTag: string }[] = []
    for (const g of encounterGroups) {
      for (const m of g.monsters) {
        const picks = malicePicksForMonsterRow(m)
        for (const p of picks) {
          const key = maliceFeatureOptionKey(p)
          if (used.has(key) || seenInEncounter.has(key)) continue
          seenInEncounter.add(key)
          opts.push({
            featureOptionKey: key,
            name: p.name,
            cost: p.cost,
            monsterTag: p.listTag ?? maliceMonsterFamilyTag(m),
          })
        }
      }
    }
    opts.sort((a, b) => {
      const byCost = maliceCostSortKey(a.cost) - maliceCostSortKey(b.cost)
      if (byCost !== 0) return byCost
      const byName = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
      if (byName !== 0) return byName
      return a.monsterTag.localeCompare(b.monsterTag, undefined, { sensitivity: 'base' })
    })
    return opts
  }, [encounterGroups, rows])

  const addDisabled = uiLocked || totalCreatures === 0

  const closeAddMenu = useCallback(() => setAddOpen(false), [])

  useEffect(() => {
    if (!addOpen) return
    const handler = (e: MouseEvent) => {
      const el = addAnchorRef.current
      if (el && !el.contains(e.target as Node)) closeAddMenu()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [addOpen, closeAddMenu])

  useEffect(() => {
    if (totalCreatures === 0) setAddOpen(false)
  }, [totalCreatures])

  /** Move a monster malice row to insert before index `to` (in the pre-move array). Core prefix stays fixed. */
  const moveRow = useCallback(
    (from: number, to: number) => {
      if (from < 0 || from >= rows.length || to < 0 || to > rows.length) return
      const next = [...rows]
      if (next[from]?.kind !== 'monster') return
      const prefix = corePrefixLength(next)
      const [x] = next.splice(from, 1)
      let insert = to
      if (from < to) insert -= 1
      insert = Math.max(insert, prefix)
      insert = Math.min(insert, next.length)
      next.splice(insert, 0, x!)
      onMaliceRowsChange(next)
    },
    [onMaliceRowsChange, rows],
  )

  const removeAt = useCallback(
    (index: number) => {
      const row = rows[index]
      if (row == null || row.kind !== 'monster') return
      const next = rows.filter((_, i) => i !== index)
      onMaliceRowsChange(next)
    },
    [onMaliceRowsChange, rows],
  )

  const addPick = useCallback(
    (featureOptionKey: string) => {
      const id = globalThis.crypto?.randomUUID?.() ?? `malice-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      onMaliceRowsChange([...rows, { kind: 'monster', id, featureOptionKey }])
      setAddOpen(false)
    },
    [onMaliceRowsChange, rows],
  )

  const onMaliceDragStart = useCallback(
    (index: number, e: React.DragEvent) => {
      if (uiLocked) return
      if (rows[index]?.kind !== 'monster') return
      e.dataTransfer.setData(MALICE_DRAG_MIME, String(index))
      e.dataTransfer.effectAllowed = 'move'
      setMaliceDragFrom(index)
    },
    [rows, uiLocked],
  )

  const onMaliceDragEnd = useCallback(() => {
    setMaliceDragFrom(null)
    setMaliceDropHover(null)
  }, [])

  const onMaliceDropOnRow = useCallback(
    (targetIndex: number, e: React.DragEvent) => {
      e.preventDefault()
      setMaliceDropHover(null)
      setMaliceDragFrom(null)
      if (uiLocked) return
      const raw = e.dataTransfer.getData(MALICE_DRAG_MIME)
      const from = Number.parseInt(raw, 10)
      if (Number.isNaN(from)) return
      if (rows[from]?.kind !== 'monster' || rows[targetIndex]?.kind !== 'monster') return
      if (from === targetIndex) return
      /** Adjacent move down: drop target is the next row, so insert before `targetIndex + 1` (matches encounter monster DnD semantics). */
      const insertBefore =
        from < targetIndex && targetIndex === from + 1 ? targetIndex + 1 : targetIndex
      moveRow(from, insertBefore)
    },
    [moveRow, rows, uiLocked],
  )

  return (
    <div className="rounded-lg border border-zinc-200/95 bg-white font-sans shadow-sm dark:border-transparent dark:bg-zinc-900/80 dark:shadow-none">
      <div className="border-b border-zinc-200/90 bg-zinc-50/90 px-3 py-2.5 dark:border-zinc-800/90 dark:bg-zinc-950/40">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-sans text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Malice
          </h3>
          <div className="relative" ref={addAnchorRef}>
            <button
              type="button"
              disabled={addDisabled}
              aria-expanded={addOpen}
              aria-haspopup="menu"
              aria-controls={addOpen ? addMenuId : undefined}
              onClick={() => !addDisabled && setAddOpen((o) => !o)}
              className={`rounded-md px-2.5 py-1 font-sans text-xs transition-colors ${
                !addDisabled
                  ? 'bg-zinc-200/95 text-zinc-900 hover:bg-zinc-300/95 dark:bg-zinc-800/90 dark:text-zinc-100 dark:hover:bg-zinc-700/90'
                  : 'cursor-not-allowed bg-zinc-100 text-zinc-400 dark:bg-zinc-900 dark:text-zinc-600'
              }`}
            >
              + Add Malice feature
            </button>
            {addOpen && !addDisabled && (
              <div
                id={addMenuId}
                role="menu"
                className="absolute right-0 z-[120] mt-1 max-h-64 min-w-[14rem] overflow-y-auto rounded-lg border border-zinc-300/85 bg-white py-1 shadow-xl dark:border-zinc-700/80 dark:bg-zinc-900"
              >
                {addOptions.length === 0 ? (
                  <div className="px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400">
                    No creature malice features to add (or all are already listed).
                  </div>
                ) : (
                  addOptions.map((o) => (
                    <button
                      key={o.featureOptionKey}
                      type="button"
                      role="menuitem"
                      className="flex w-full flex-col gap-1 px-3 py-2 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      onClick={() => addPick(o.featureOptionKey)}
                    >
                      <span className="min-w-0 font-sans text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {o.name}
                      </span>
                      <span className={`${MONSTER_TAG_CLASS} self-start`} title={o.monsterTag}>
                        {o.monsterTag}
                      </span>
                      <span className="font-sans text-[0.65rem] font-medium text-amber-800 dark:text-amber-200/95">
                        {o.cost}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
        <ul className="space-y-2">
          {rows.map((row, index) => {
            let name: string
            let cost: string
            let effect: string
            let monsterTag: string | null = null
            let monsterEffectBlocks: PowerRollEffect[] | undefined
            if (row.kind === 'core') {
              const c = CORE_MALICE_FEATURES[row.coreId]
              name = c.name
              cost = c.cost
              effect = c.effect
            } else {
              const resolved = findMalicePickForFeatureKey(encounterGroups, row.featureOptionKey)
              if (!resolved) return null
              name = resolved.pick.name
              cost = resolved.pick.cost
              effect = resolved.pick.effect
              monsterEffectBlocks = resolved.pick.effects
              monsterTag = resolved.pick.listTag ?? maliceMonsterFamilyTag(resolved.monster)
            }

            const isMonsterRow = row.kind === 'monster'
            const menuItems: ReorderGripMenuItem[] = []
            if (!uiLocked && isMonsterRow) {
              menuItems.push({
                id: 'up',
                label: 'Move up',
                disabled: index === corePrefix,
                onSelect: () => moveRow(index, index - 1),
              })
              menuItems.push({
                id: 'down',
                label: 'Move down',
                disabled: index === rows.length - 1,
                onSelect: () => moveRow(index, index + 2),
              })
              menuItems.push({
                id: 'remove',
                label: 'Remove',
                destructive: true,
                onSelect: () => removeAt(index),
              })
            }

            const monsterDropRing =
              isMonsterRow &&
              maliceDropHover === index &&
              maliceDragFrom != null &&
              maliceDragFrom !== index
                ? 'ring-2 ring-inset ring-sky-500/40'
                : ''

            const rowLayoutClass = uiLocked
              ? 'grid grid-cols-1 gap-3'
              : 'grid grid-cols-[2.25rem_minmax(0,1fr)] items-stretch gap-3 sm:grid-cols-[2.5rem_minmax(0,1fr)]'

            return (
              <li
                key={row.kind === 'core' ? `core-${row.coreId}` : row.id}
                className={`${rowLayoutClass} rounded-md border border-zinc-200/80 bg-white/90 px-2 py-2 transition-shadow dark:border-zinc-700/70 dark:bg-zinc-900/60 has-[[data-grip-menu-open]]:z-[200] ${monsterDropRing}`}
                onDragOver={
                  uiLocked || !isMonsterRow
                    ? undefined
                    : (e) => {
                        if (![...e.dataTransfer.types].includes(MALICE_DRAG_MIME)) return
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                        setMaliceDropHover(index)
                      }
                }
                onDragLeave={
                  uiLocked || !isMonsterRow
                    ? undefined
                    : (e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                          setMaliceDropHover((v) => (v === index ? null : v))
                        }
                      }
                }
                onDrop={uiLocked || !isMonsterRow ? undefined : (e) => onMaliceDropOnRow(index, e)}
              >
                {!uiLocked && isMonsterRow ? (
                  <ReorderGripWithMenu
                    reorderAriaLabel={`Reorder or remove malice feature: ${name}`}
                    onDragStart={(e) => onMaliceDragStart(index, e)}
                    onDragEnd={onMaliceDragEnd}
                    menuItems={menuItems}
                    className="group flex h-full min-h-0 w-full cursor-grab touch-none select-none items-center justify-center rounded-md border border-transparent transition-[background-color,border-color,box-shadow,color] duration-150 ease-out hover:border-zinc-700/45 hover:bg-zinc-300 dark:hover:bg-zinc-800/55 hover:shadow-sm active:cursor-grabbing motion-reduce:transition-none"
                    iconClassName="size-3.5 text-zinc-600 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-200 sm:size-4"
                  />
                ) : !uiLocked ? (
                  <div className="min-h-0 min-w-0" aria-hidden />
                ) : null}
                <div className="min-w-0 font-sans">
                  {monsterTag != null ? (
                    <>
                      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <span className="min-w-0 font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {name}
                        </span>
                        <span className="shrink-0 font-sans text-xs font-medium text-amber-800 dark:text-amber-200/95">
                          {cost}
                        </span>
                      </div>
                      <div className="mt-0.5">
                        <span className={`${MONSTER_TAG_CLASS} self-start`} title={monsterTag}>
                          {monsterTag}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-sans text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {name}
                      </span>
                      <span className="font-sans text-xs font-medium text-amber-800 dark:text-amber-200/95">
                        {cost}
                      </span>
                    </div>
                  )}
                  {monsterEffectBlocks != null && monsterEffectBlocks.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {monsterEffectBlocks.map((eff, ei) => (
                        <EffectBlock key={ei} eff={eff} />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 font-sans text-[0.72rem] leading-snug text-zinc-600 dark:text-zinc-400">
                      {effect}
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
