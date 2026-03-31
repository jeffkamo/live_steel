import type { DragEvent } from 'react'
import type { TerrainRowState } from '../types'
import { terrainGridClass } from '../data'
import { EditableStaminaCell } from './EditableStaminaCell'
import { ReorderGripWithMenu } from './ReorderGripWithMenu'

export function TerrainRow({
  row,
  rowIndex: _rowIndex,
  onStaminaChange,
  onClick,
  isDrawerOpen,
  uiLocked,
  onDelete,
  dragHandle,
}: {
  row: TerrainRowState
  rowIndex: number
  onStaminaChange: (next: [number, number]) => void
  onClick?: () => void
  isDrawerOpen?: boolean
  uiLocked?: boolean
  onDelete?: () => void
  dragHandle?: {
    onDragStart: (e: DragEvent) => void
    onDragEnd: (e: DragEvent) => void
    ariaLabel: string
  }
}) {
  const [tc, tm] = row.stamina
  const hasStatBlock = row.terrainName != null
  const dead = tm > 0 && tc <= 0
  const deadDim = dead ? 'opacity-40' : ''
  const deadStrike = dead ? 'line-through' : ''
  const gripMenuItems = [
    ...(onDelete != null
      ? [{ id: 'delete', label: 'Delete', onSelect: onDelete, destructive: true } as const]
      : []),
  ]
  const creatureNameColCell =
    'flex h-full min-h-[3.75rem] items-stretch px-2 py-2 sm:min-h-[4rem] sm:px-2.5 sm:py-2.5'
  const bodyCell =
    'flex h-full min-h-[3.75rem] items-center p-3 sm:min-h-[4rem] sm:p-3.5'
  return (
    <div
      className={`${terrainGridClass} overflow-visible rounded-lg bg-zinc-900/80 ${
        isDrawerOpen ? 'ring-1 ring-amber-500/40' : ''
      }`}
    >
      <div className={`${creatureNameColCell} min-w-0`} style={{ gridColumn: '1 / 3' }}>
        <div className="flex min-h-0 min-w-0 flex-1 items-stretch gap-1 p-1 sm:p-1.5">
        {!uiLocked && dragHandle && (
          <ReorderGripWithMenu
            reorderAriaLabel={dragHandle.ariaLabel}
            onDragStart={dragHandle.onDragStart}
            onDragEnd={dragHandle.onDragEnd}
            menuItems={gripMenuItems}
            className="group flex w-9 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-md border border-transparent transition-[background-color,border-color,box-shadow,color] duration-150 ease-out hover:border-zinc-700/45 hover:bg-zinc-800/55 hover:shadow-sm active:cursor-grabbing motion-reduce:transition-none sm:w-10"
            iconClassName="size-3.5 text-zinc-500 transition-colors group-hover:text-zinc-200 sm:size-4"
          />
        )}
        {hasStatBlock ? (
          <button
            type="button"
            onClick={onClick}
            className={`min-w-0 flex-1 cursor-pointer rounded-md px-2 py-2 text-left text-sm leading-relaxed text-zinc-100 transition-colors hover:bg-zinc-800/70 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500/60 sm:text-base ${deadDim} ${deadStrike}`}
            aria-label={`View stat block for ${row.object}`}
          >
            {row.object}
          </button>
        ) : (
          <p className={`min-w-0 flex-1 px-2 py-2 text-sm leading-relaxed text-zinc-100 sm:text-base ${deadDim} ${deadStrike}`}>
            {row.object}
          </p>
        )}
      </div>
      </div>
      <div
        className={`${bodyCell} relative z-0 w-full justify-center overflow-visible hover:z-20 focus-within:z-20`}
        style={{ gridColumn: 3 }}
      >
        <EditableStaminaCell
          current={tc}
          max={tm}
          onChange={onStaminaChange}
          ariaLabel={`Edit stamina for terrain: ${row.object.slice(0, 48)}${row.object.length > 48 ? '…' : ''}`}
        />
      </div>
      <div className={`${bodyCell} min-w-0 gap-2`} style={{ gridColumn: '4 / -1' }}>
        <p className="min-w-0 flex-1 text-sm leading-relaxed text-zinc-300 sm:text-base">{row.note}</p>
      </div>
    </div>
  )
}
