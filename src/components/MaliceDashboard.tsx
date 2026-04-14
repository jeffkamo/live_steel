import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { CustomMaliceFeatureData, EncounterGroup, MaliceRowRef, PowerRollEffect } from '../types'
import {
  CORE_MALICE_FEATURES,
  compactPowerRollEffect,
  defaultCustomMaliceFeatureData,
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

const FORM_LABEL_CLASS =
  'mb-1 block text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-500'
const FORM_INPUT_CLASS =
  'w-full rounded border border-zinc-300/85 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-950/80 px-2 py-1.5 font-sans text-xs text-zinc-900 dark:text-zinc-100 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-600 focus:border-amber-700/50 focus:ring-1 focus:ring-amber-500/35'


/** Leading core rows (Brutal Effectiveness, Malicious Strike, …); monster rows may only reorder below this block. */
function corePrefixLength(rows: readonly MaliceRowRef[]): number {
  let n = 0
  while (n < rows.length && rows[n]!.kind === 'core') n++
  return n
}

function isReorderableMaliceRow(row: MaliceRowRef | undefined): boolean {
  return row?.kind === 'monster' || row?.kind === 'custom'
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
  const [maliceDropHoverInsert, setMaliceDropHoverInsert] = useState<number | null>(null)
  const [maliceDragging, setMaliceDragging] = useState(false)
  const maliceMonsterRowElsRef = useRef<Map<string, HTMLDivElement>>(new Map())
  const [customMaliceEditId, setCustomMaliceEditId] = useState<string | null>(null)

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

  const addDisabled = uiLocked

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
    if (uiLocked) setAddOpen(false)
  }, [uiLocked])

  useEffect(() => {
    if (customMaliceEditId == null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCustomMaliceEditId(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [customMaliceEditId])

  useEffect(() => {
    if (customMaliceEditId == null) return
    if (!rows.some((r) => r.kind === 'custom' && r.id === customMaliceEditId)) {
      setCustomMaliceEditId(null)
    }
  }, [customMaliceEditId, rows])

  /** Move a monster malice row to insert before index `to` (in the pre-move array). Core prefix stays fixed. */
  const moveRow = useCallback(
    (from: number, to: number) => {
      if (from < 0 || from >= rows.length || to < 0 || to > rows.length) return
      const next = [...rows]
      if (!isReorderableMaliceRow(next[from])) return
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
      if (row == null || !isReorderableMaliceRow(row)) return
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

  const addCustomMalice = useCallback(() => {
    const id = globalThis.crypto?.randomUUID?.() ?? `malice-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    onMaliceRowsChange([...rows, { kind: 'custom', id, custom: defaultCustomMaliceFeatureData() }])
    setAddOpen(false)
    setCustomMaliceEditId(id)
  }, [onMaliceRowsChange, rows])

  const patchCustomMaliceRow = useCallback(
    (id: string, patch: Partial<CustomMaliceFeatureData>) => {
      onMaliceRowsChange(
        rows.map((r) => {
          if (r.kind !== 'custom' || r.id !== id) return r
          const merged: CustomMaliceFeatureData = { ...r.custom, ...patch }
          if (patch.powerRoll !== undefined) {
            merged.powerRoll = compactPowerRollEffect({ ...r.custom.powerRoll, ...patch.powerRoll })
          } else {
            merged.powerRoll = compactPowerRollEffect(merged.powerRoll)
          }
          if (merged.rollFollowUp != null && merged.rollFollowUp.trim() === '') {
            delete merged.rollFollowUp
          }
          return { ...r, custom: merged }
        }),
      )
    },
    [onMaliceRowsChange, rows],
  )

  const onMaliceDragStart = useCallback(
    (index: number, e: React.DragEvent) => {
      if (uiLocked) return
      if (!isReorderableMaliceRow(rows[index])) return
      e.dataTransfer.setData(MALICE_DRAG_MIME, String(index))
      e.dataTransfer.effectAllowed = 'move'
      setMaliceDragging(true)
    },
    [rows, uiLocked],
  )

  const onMaliceDragEnd = useCallback(() => {
    setMaliceDropHoverInsert(null)
    setMaliceDragging(false)
  }, [])

  const onMaliceDropAtInsert = useCallback(
    (insertIndex: number, e: React.DragEvent) => {
      e.preventDefault()
      setMaliceDropHoverInsert(null)
      setMaliceDragging(false)
      if (uiLocked) return
      const raw = e.dataTransfer.getData(MALICE_DRAG_MIME)
      const from = Number.parseInt(raw, 10)
      if (Number.isNaN(from)) return
      if (!isReorderableMaliceRow(rows[from])) return
      moveRow(from, insertIndex)
    },
    [moveRow, rows, uiLocked],
  )

  const canDragMaliceRowOver = useCallback((e: React.DragEvent): boolean => {
    return [...e.dataTransfer.types].includes(MALICE_DRAG_MIME)
  }, [])

  const setHoverInsertFrom = useCallback(
    (from: number, toInsert: number, e: React.DragEvent) => {
      const clampedTo = Math.max(toInsert, corePrefix)
      // Determine whether the drop would be a no-op after removal.
      if (!Number.isNaN(from) && isReorderableMaliceRow(rows[from])) {
        const nextLen = rows.length - 1
        let ins = clampedTo
        if (from < clampedTo) ins -= 1
        ins = Math.max(ins, corePrefix)
        ins = Math.min(ins, nextLen)
        if (ins === from) {
          e.dataTransfer.dropEffect = 'none'
          setMaliceDropHoverInsert(null)
          return
        }
      }
      e.dataTransfer.dropEffect = 'move'
      setMaliceDropHoverInsert(clampedTo)
    },
    [corePrefix, rows],
  )

  const onMaliceInsertZoneDragOver = useCallback(
    (insertIndex: number, e: React.DragEvent) => {
      if (uiLocked) return
      if (!canDragMaliceRowOver(e)) return
      e.stopPropagation()
      e.preventDefault()
      const raw = e.dataTransfer.getData(MALICE_DRAG_MIME)
      const from = Number.parseInt(raw, 10)
      if (Number.isNaN(from) || !isReorderableMaliceRow(rows[from])) return
      setHoverInsertFrom(from, insertIndex, e)
    },
    [canDragMaliceRowOver, rows, setHoverInsertFrom, uiLocked],
  )

  const onMaliceInsertZoneDragLeave = useCallback((insertIndex: number, e: React.DragEvent) => {
    e.stopPropagation()
    // Some browsers report (0,0) during HTML5 dragging; don't treat that as a real leave.
    if (e.clientX === 0 && e.clientY === 0) return
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
    if (inside) return
    // Keep the extreme-edge indicator stable when you drag beyond the list bounds.
    // This makes the top edge behave like the bottom edge (which tends to "stick" once activated).
    if (insertIndex === corePrefix || insertIndex === rows.length) return
    setMaliceDropHoverInsert((v) => (v === insertIndex ? null : v))
  }, [corePrefix, rows.length])

  const onMaliceInsertZoneDrop = useCallback(
    (insertIndex: number, e: React.DragEvent) => {
      if (uiLocked) return
      e.stopPropagation()
      onMaliceDropAtInsert(insertIndex, e)
    },
    [onMaliceDropAtInsert, uiLocked],
  )

  const onMaliceContainerDragOver = useCallback(
    (e: React.DragEvent) => {
      if (uiLocked) return
      if (maliceDropHoverInsert == null) return
      if (!canDragMaliceRowOver(e)) return
      e.preventDefault()
      const raw = e.dataTransfer.getData(MALICE_DRAG_MIME)
      const from = Number.parseInt(raw, 10)
      if (Number.isNaN(from) || !isReorderableMaliceRow(rows[from])) return
      // Keep dropEffect accurate even when dropping "outside" rows (e.g. beyond top/bottom edge).
      setHoverInsertFrom(from, maliceDropHoverInsert, e)
    },
    [canDragMaliceRowOver, maliceDropHoverInsert, rows, setHoverInsertFrom, uiLocked],
  )

  const onMaliceContainerDrop = useCallback(
    (e: React.DragEvent) => {
      if (uiLocked) return
      if (maliceDropHoverInsert == null) return
      if (!canDragMaliceRowOver(e)) return
      onMaliceDropAtInsert(maliceDropHoverInsert, e)
    },
    [canDragMaliceRowOver, maliceDropHoverInsert, onMaliceDropAtInsert, uiLocked],
  )

  const onMonsterRowDragOver = useCallback(
    (index: number, e: React.DragEvent) => {
      if (uiLocked) return
      if (!isReorderableMaliceRow(rows[index])) return
      if (!canDragMaliceRowOver(e)) return
      e.preventDefault()
      const raw = e.dataTransfer.getData(MALICE_DRAG_MIME)
      const from = Number.parseInt(raw, 10)
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const y = e.clientY
      // Drag events can bubble from child drop zones; also some browsers can report coords outside
      // the current target during a drag. Don't "snap" the indicator to the top in that case.
      if (!(y >= rect.top && y <= rect.bottom)) return
      const to =
        rect.height > 0 && y < rect.top + rect.height / 2 ? index : index + 1
      if (Number.isNaN(from) || !isReorderableMaliceRow(rows[from])) return
      setHoverInsertFrom(from, to, e)
    },
    [canDragMaliceRowOver, rows, setHoverInsertFrom, uiLocked],
  )

  const onMonsterRowDragLeave = useCallback(
    (index: number, e: React.DragEvent) => {
      if (!isReorderableMaliceRow(rows[index])) return
      // During HTML5 drag, `relatedTarget` is frequently `null` (even when moving within the row),
      // which can cause the insert indicator to flicker/disappear right when you hover the line itself.
      // Use pointer position vs bounding box instead.
      // Some browsers report (0,0) during HTML5 dragging; don't treat that as a real leave.
      if (e.clientX === 0 && e.clientY === 0) return
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const x = e.clientX
      const y = e.clientY
      const inside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom
      if (inside) return
      setMaliceDropHoverInsert((v) => (v === index || v === index + 1 ? null : v))
    },
    [rows],
  )

  const onMonsterRowDrop = useCallback(
    (index: number, e: React.DragEvent) => {
      if (uiLocked) return
      if (!isReorderableMaliceRow(rows[index])) return
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const y = e.clientY
      const to =
        rect.height > 0 && y >= rect.top && y <= rect.bottom
          ? y < rect.top + rect.height / 2
            ? index
            : index + 1
          : index
      const clampedTo = Math.max(to, corePrefix)
      const raw = e.dataTransfer.getData(MALICE_DRAG_MIME)
      const from = Number.parseInt(raw, 10)
      if (!Number.isNaN(from) && isReorderableMaliceRow(rows[from])) {
        const nextLen = rows.length - 1
        let ins = clampedTo
        if (from < clampedTo) ins -= 1
        ins = Math.max(ins, corePrefix)
        ins = Math.min(ins, nextLen)
        if (ins === from) {
          setMaliceDropHoverInsert(null)
          return
        }
      }
      onMaliceDropAtInsert(clampedTo, e)
    },
    [corePrefix, onMaliceDropAtInsert, rows, uiLocked],
  )

  const editingCustomMalice = useMemo(() => {
    if (customMaliceEditId == null) return undefined
    const r = rows.find((x) => x.kind === 'custom' && x.id === customMaliceEditId)
    return r?.kind === 'custom' ? r : undefined
  }, [customMaliceEditId, rows])

  return (
    <>
    <div className="rounded-lg border border-zinc-200/95 bg-white font-sans shadow-sm dark:border-transparent dark:bg-zinc-900/80 dark:shadow-none">
      <div className="border-b border-zinc-200/90 bg-zinc-50/90 px-3 py-2.5 dark:border-zinc-800/90 dark:bg-zinc-950/40">
        <div className="mb-2">
          <h3 className="font-sans text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
            Malice
          </h3>
        </div>
        <div className="relative">
          {/* Extended edge drop zones so dropping slightly outside the list still works. */}
          <div
            aria-hidden
            className={`absolute left-0 right-0 top-0 -translate-y-full h-12 ${
              maliceDragging ? 'pointer-events-auto z-[150]' : 'pointer-events-none'
            }`}
            onDragOver={(e) => onMaliceInsertZoneDragOver(corePrefix, e)}
            onDragLeave={(e) => onMaliceInsertZoneDragLeave(corePrefix, e)}
            onDrop={(e) => onMaliceInsertZoneDrop(corePrefix, e)}
          />
          <div
            aria-hidden
            className={`absolute left-0 right-0 bottom-0 translate-y-full h-12 ${
              maliceDragging ? 'pointer-events-auto z-[150]' : 'pointer-events-none'
            }`}
            onDragOver={(e) => onMaliceInsertZoneDragOver(rows.length, e)}
            onDragLeave={(e) => onMaliceInsertZoneDragLeave(rows.length, e)}
            onDrop={(e) => onMaliceInsertZoneDrop(rows.length, e)}
          />
          <ul className="space-y-2" onDragOver={onMaliceContainerDragOver} onDrop={onMaliceContainerDrop}>
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
              } else if (row.kind === 'custom') {
                const c = row.custom
                name = c.name
                cost = c.cost
                effect = c.description
                monsterTag = 'Custom'
              } else {
                const resolved = findMalicePickForFeatureKey(encounterGroups, row.featureOptionKey)
                if (!resolved) return null
                name = resolved.pick.name
                cost = resolved.pick.cost
                effect = resolved.pick.effect
                monsterEffectBlocks = resolved.pick.effects
                monsterTag = resolved.pick.listTag ?? maliceMonsterFamilyTag(resolved.monster)
              }

              const customPowerRoll =
                row.kind === 'custom' ? compactPowerRollEffect(row.custom.powerRoll) : undefined

            const isReorderableRow = isReorderableMaliceRow(row)
            const menuItems: ReorderGripMenuItem[] = []
            if (!uiLocked && isReorderableRow) {
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

            const rowLayoutClass = uiLocked ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 items-stretch gap-2'
            const showInsertTop = !uiLocked && isReorderableRow && maliceDropHoverInsert === index
            const showInsertBottom =
              !uiLocked && isReorderableRow && index === rows.length - 1 && maliceDropHoverInsert === rows.length

              return (
                <li key={row.kind === 'core' ? `core-${row.coreId}` : row.id}>
                  <div
                  ref={
                    !uiLocked && isReorderableRow
                      ? (el) => {
                          const id = row.kind === 'monster' || row.kind === 'custom' ? row.id : ''
                          if (el) maliceMonsterRowElsRef.current.set(id, el)
                          else maliceMonsterRowElsRef.current.delete(id)
                        }
                      : undefined
                  }
                  className={`group/row-reorder relative ${rowLayoutClass} rounded-md border border-zinc-200/80 bg-white/90 px-2 py-2 transition-shadow dark:border-zinc-700/70 dark:bg-zinc-900/60 has-[[data-grip-menu-open]]:z-[200]`}
                  onDragOver={uiLocked || !isReorderableRow ? undefined : (e) => onMonsterRowDragOver(index, e)}
                  onDragLeave={uiLocked || !isReorderableRow ? undefined : (e) => onMonsterRowDragLeave(index, e)}
                  onDrop={uiLocked || !isReorderableRow ? undefined : (e) => onMonsterRowDrop(index, e)}
                >
                {!uiLocked && isReorderableRow && (
                  <>
                    {/* Insert target that extends into the inter-row gap so the line is a stable drop target. */}
                    <div
                      aria-hidden
                      className="absolute left-0 right-0 -top-3 h-6"
                      onDragOver={(e) => onMaliceInsertZoneDragOver(index, e)}
                      onDragLeave={(e) => onMaliceInsertZoneDragLeave(index, e)}
                      onDrop={(e) => onMaliceInsertZoneDrop(index, e)}
                    >
                      {showInsertTop && (
                        <div className="pointer-events-none absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-sky-500/55 shadow-[0_0_0_1px_rgb(0_0_0/0.10)]" />
                      )}
                    </div>
                    {index === rows.length - 1 && (
                      <div
                        aria-hidden
                        className="absolute left-0 right-0 -bottom-3 h-6"
                        onDragOver={(e) => onMaliceInsertZoneDragOver(rows.length, e)}
                        onDragLeave={(e) => onMaliceInsertZoneDragLeave(rows.length, e)}
                        onDrop={(e) => onMaliceInsertZoneDrop(rows.length, e)}
                      >
                        {showInsertBottom && (
                          <div className="pointer-events-none absolute left-2 right-2 top-1/2 -translate-y-1/2 h-[3px] rounded-full bg-sky-500/55 shadow-[0_0_0_1px_rgb(0_0_0/0.10)]" />
                        )}
                      </div>
                    )}
                  </>
                )}
                {!uiLocked && isReorderableRow ? (
                  <div className="pointer-events-none absolute top-0 left-0 z-[110] flex h-full items-center">
                    <div className="-translate-x-1/2">
                      <ReorderGripWithMenu
                        reorderAriaLabel={`Reorder or remove malice feature: ${name}`}
                        onDragStart={(e) => onMaliceDragStart(index, e)}
                        onDragEnd={onMaliceDragEnd}
                        getDragImageElement={() =>
                          row.kind === 'monster' || row.kind === 'custom'
                            ? maliceMonsterRowElsRef.current.get(row.id) ?? null
                            : null
                        }
                        menuItems={menuItems}
                        className="h-9 shrink-0 cursor-grab touch-none select-none rounded-md sm:h-10"
                        iconClassName="text-zinc-700 dark:text-zinc-200"
                      />
                    </div>
                  </div>
                ) : null}
                <div
                  className={`min-w-0 w-full font-sans ${
                    row.kind === 'custom' && !uiLocked
                      ? 'cursor-pointer rounded-sm outline-none ring-offset-2 hover:bg-zinc-100/85 focus-visible:ring-2 focus-visible:ring-amber-500/45 dark:hover:bg-zinc-800/55'
                      : ''
                  }`}
                  role={row.kind === 'custom' && !uiLocked ? 'button' : undefined}
                  tabIndex={row.kind === 'custom' && !uiLocked ? 0 : undefined}
                  onClick={
                    row.kind === 'custom' && !uiLocked ? () => setCustomMaliceEditId(row.id) : undefined
                  }
                  onKeyDown={
                    row.kind === 'custom' && !uiLocked
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            setCustomMaliceEditId(row.id)
                          }
                        }
                      : undefined
                  }
                >
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
                  {row.kind === 'custom' ? (
                    <>
                      <p className="mt-1 font-sans text-[0.72rem] leading-snug text-zinc-600 dark:text-zinc-400">
                        {row.custom.description}
                      </p>
                      {customPowerRoll != null && (
                        <div className="mt-1 space-y-1">
                          <EffectBlock eff={customPowerRoll} />
                        </div>
                      )}
                      {(row.custom.rollFollowUp ?? '').trim() !== '' && (
                        <p className="mt-1 font-sans text-[0.72rem] leading-snug text-zinc-600 dark:text-zinc-400">
                          {row.custom.rollFollowUp}
                        </p>
                      )}
                    </>
                  ) : monsterEffectBlocks != null && monsterEffectBlocks.length > 0 ? (
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
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
        {!uiLocked && (
          <div className="relative mt-2" ref={addAnchorRef}>
            <button
              type="button"
              disabled={addDisabled}
              aria-label="Add Malice feature"
              aria-expanded={addOpen}
              aria-haspopup="menu"
              aria-controls={addOpen ? addMenuId : undefined}
              onClick={() => !addDisabled && setAddOpen((o) => !o)}
              className={`flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 font-sans text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 ${
                !addDisabled
                  ? 'border-zinc-400 text-zinc-700 hover:border-zinc-500 hover:bg-zinc-100/95 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900/60 dark:hover:text-zinc-200'
                  : 'cursor-not-allowed border-zinc-200 text-zinc-600 opacity-60 dark:border-zinc-800 dark:text-zinc-600'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5 shrink-0" aria-hidden>
                <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
              </svg>
              Add Malice feature
            </button>
            {addOpen && !addDisabled && (
              <div
                id={addMenuId}
                role="menu"
                className="absolute left-0 right-0 top-full z-[120] mt-1 max-h-64 overflow-y-auto rounded-lg border border-zinc-300/85 bg-white py-1 shadow-xl dark:border-zinc-700/80 dark:bg-zinc-900"
              >
                <button
                  type="button"
                  role="menuitem"
                  className="flex w-full min-w-0 justify-start border-b border-zinc-200/90 px-3 py-2 text-left font-sans text-xs font-medium text-zinc-900 hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  onClick={addCustomMalice}
                >
                  Custom malice feature
                </button>
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
                      className="flex w-full min-w-0 justify-start px-3 py-1.5 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      onClick={() => addPick(o.featureOptionKey)}
                    >
                      <span className="inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="min-w-0 break-words font-sans text-xs font-medium text-zinc-900 dark:text-zinc-100">
                          {o.name}
                        </span>
                        <span className="shrink-0 font-sans text-xs font-medium tabular-nums text-amber-800 dark:text-amber-200/95">
                          {o.cost}
                        </span>
                        <span className={MONSTER_TAG_CLASS} title={o.monsterTag}>
                          {o.monsterTag}
                        </span>
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    {editingCustomMalice != null && (
      <div className="fixed inset-0 z-[400] flex justify-end">
        <button
          type="button"
          aria-label="Close custom malice editor"
          className="absolute inset-0 bg-black/45 dark:bg-black/60"
          onClick={() => setCustomMaliceEditId(null)}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="custom-malice-edit-title"
          className="relative z-[410] flex h-full w-full max-w-md flex-col border-l border-zinc-200/90 bg-white font-sans shadow-2xl dark:border-zinc-800 dark:bg-zinc-950"
        >
          <div className="flex items-center justify-between border-b border-zinc-200/90 px-4 py-3 dark:border-zinc-800">
            <h2 id="custom-malice-edit-title" className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {editingCustomMalice.custom.name.trim() !== ''
                ? editingCustomMalice.custom.name
                : 'Custom malice feature'}
            </h2>
            <button
              type="button"
              aria-label="Close"
              className="rounded-md px-2 py-1 text-xs text-zinc-600 hover:bg-zinc-200/80 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              onClick={() => setCustomMaliceEditId(null)}
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              <div>
                <label htmlFor="custom-malice-name" className={FORM_LABEL_CLASS}>
                  Name
                </label>
                <input
                  id="custom-malice-name"
                  type="text"
                  value={editingCustomMalice.custom.name}
                  onChange={(e) =>
                    patchCustomMaliceRow(editingCustomMalice.id, { name: e.target.value })
                  }
                  autoComplete="off"
                  className={FORM_INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="custom-malice-cost" className={FORM_LABEL_CLASS}>
                  Malice cost
                </label>
                <input
                  id="custom-malice-cost"
                  type="text"
                  value={editingCustomMalice.custom.cost}
                  onChange={(e) =>
                    patchCustomMaliceRow(editingCustomMalice.id, { cost: e.target.value })
                  }
                  placeholder="e.g. 1 Malice"
                  autoComplete="off"
                  className={FORM_INPUT_CLASS}
                />
              </div>
              <div>
                <label htmlFor="custom-malice-desc" className={FORM_LABEL_CLASS}>
                  Description
                </label>
                <textarea
                  id="custom-malice-desc"
                  value={editingCustomMalice.custom.description}
                  onChange={(e) =>
                    patchCustomMaliceRow(editingCustomMalice.id, { description: e.target.value })
                  }
                  rows={4}
                  spellCheck
                  className={`${FORM_INPUT_CLASS} min-h-[5rem] resize-y font-sans leading-relaxed`}
                />
              </div>
              <fieldset className="rounded-md border border-zinc-200/85 px-3 py-3 dark:border-zinc-700/80">
                <legend className="px-1 font-sans text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
                  Power roll (optional)
                </legend>
                <div className="space-y-3">
                  <div>
                    <label htmlFor="custom-malice-pr-roll" className={FORM_LABEL_CLASS}>
                      Roll line
                    </label>
                    <input
                      id="custom-malice-pr-roll"
                      type="text"
                      value={editingCustomMalice.custom.powerRoll?.roll ?? ''}
                      onChange={(e) =>
                        patchCustomMaliceRow(editingCustomMalice.id, {
                          powerRoll: { ...editingCustomMalice.custom.powerRoll, roll: e.target.value },
                        })
                      }
                      autoComplete="off"
                      className={FORM_INPUT_CLASS}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    {(['tier1', 'tier2', 'tier3'] as const).map((tier) => (
                      <div key={tier}>
                        <label htmlFor={`custom-malice-pr-${tier}`} className={FORM_LABEL_CLASS}>
                          {tier === 'tier1' ? 'Tier 1' : tier === 'tier2' ? 'Tier 2' : 'Tier 3'}
                        </label>
                        <textarea
                          id={`custom-malice-pr-${tier}`}
                          value={editingCustomMalice.custom.powerRoll?.[tier] ?? ''}
                          onChange={(e) =>
                            patchCustomMaliceRow(editingCustomMalice.id, {
                              powerRoll: {
                                ...editingCustomMalice.custom.powerRoll,
                                [tier]: e.target.value,
                              },
                            })
                          }
                          rows={2}
                          className={`${FORM_INPUT_CLASS} resize-y font-sans leading-snug`}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label htmlFor="custom-malice-pr-effect" className={FORM_LABEL_CLASS}>
                      Effect within power roll
                    </label>
                    <textarea
                      id="custom-malice-pr-effect"
                      value={editingCustomMalice.custom.powerRoll?.effect ?? ''}
                      onChange={(e) =>
                        patchCustomMaliceRow(editingCustomMalice.id, {
                          powerRoll: { ...editingCustomMalice.custom.powerRoll, effect: e.target.value },
                        })
                      }
                      rows={3}
                      spellCheck
                      className={`${FORM_INPUT_CLASS} resize-y font-sans leading-relaxed`}
                    />
                  </div>
                </div>
              </fieldset>
              <div>
                <label htmlFor="custom-malice-follow" className={FORM_LABEL_CLASS}>
                  Effect after roll (optional)
                </label>
                <textarea
                  id="custom-malice-follow"
                  value={editingCustomMalice.custom.rollFollowUp ?? ''}
                  onChange={(e) =>
                    patchCustomMaliceRow(editingCustomMalice.id, { rollFollowUp: e.target.value })
                  }
                  rows={3}
                  spellCheck
                  placeholder="e.g. follow-up text after resolving the roll"
                  className={`${FORM_INPUT_CLASS} min-h-[4rem] resize-y font-sans leading-relaxed`}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
