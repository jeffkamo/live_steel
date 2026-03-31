import type { DragEvent } from 'react'
import type { TerrainRowState } from '../types'
import { terrainGridClass } from '../data'
import { EditableStaminaCell } from './EditableStaminaCell'
import { ReorderGripWithMenu } from './ReorderGripWithMenu'

export function TerrainRow({
  row,
  rowIndex,
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
  const gripMenuItems = [
    ...(onDelete != null
      ? [{ id: 'delete', label: 'Delete', onSelect: onDelete, destructive: true } as const]
      : []),
  ]
  return (
    <div
      className={`${terrainGridClass} overflow-visible rounded-lg bg-zinc-900/80 ${
        isDrawerOpen ? 'ring-1 ring-amber-500/40' : ''
      }`}
    >
      <div className="flex h-full min-h-[3.75rem] items-stretch gap-1 p-1 sm:min-h-[4rem] sm:p-1.5">
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
            className="min-w-0 flex-1 cursor-pointer rounded-md px-2 py-2 text-left text-[0.8rem] leading-relaxed text-zinc-100 transition-colors hover:bg-zinc-800/70 hover:text-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500/60"
            aria-label={`View stat block for ${row.object}`}
          >
            {row.object}
          </button>
        ) : (
          <p className="min-w-0 flex-1 px-2 py-2 text-[0.8rem] leading-relaxed text-zinc-100">{row.object}</p>
        )}
      </div>
      <div className="relative z-0 flex h-full min-h-[3.75rem] items-center justify-center overflow-visible p-3 hover:z-20 focus-within:z-20 sm:min-h-[4rem] sm:p-3.5">
        <EditableStaminaCell
          current={tc}
          max={tm}
          onChange={onStaminaChange}
          ariaLabel={`Edit stamina for terrain: ${row.object.slice(0, 48)}${row.object.length > 48 ? '…' : ''}`}
        />
      </div>
      <div className="flex h-full min-h-[3.75rem] items-center gap-2 p-3 sm:min-h-[4rem] sm:p-3.5">
        <p className="min-w-0 flex-1 text-[0.75rem] leading-snug text-zinc-400">{row.note}</p>
      </div>
    </div>
  )
}
