import type { DragEvent } from 'react'
import type { TerrainRowState } from '../types'
import { terrainGridClass } from '../data'
import { EditableStaminaCell } from './EditableStaminaCell'

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
    onDragEnd: () => void
    ariaLabel: string
  }
}) {
  const [tc, tm] = row.stamina
  const hasStatBlock = row.terrainName != null
  return (
    <div
      className={`${terrainGridClass} overflow-visible rounded-lg bg-zinc-900/80 ${
        isDrawerOpen ? 'ring-1 ring-amber-500/40' : ''
      }`}
    >
      <div className="flex h-full min-h-[3.75rem] items-center gap-1 p-1 sm:min-h-[4rem] sm:p-1.5">
        {!uiLocked && dragHandle && (
          <button
            type="button"
            draggable
            onDragStart={dragHandle.onDragStart}
            onDragEnd={dragHandle.onDragEnd}
            aria-label={dragHandle.ariaLabel}
            className="shrink-0 cursor-grab touch-none rounded p-0.5 text-zinc-600 transition-colors hover:text-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500/60 active:cursor-grabbing"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5" aria-hidden>
              <path d="M5 3.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM13 3.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm0 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z" />
            </svg>
          </button>
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
        {!uiLocked && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete terrain: ${row.object.slice(0, 48)}`}
            className="shrink-0 cursor-pointer rounded p-1 text-zinc-600 transition-colors hover:bg-zinc-800/80 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500/60"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5" aria-hidden>
              <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11V3.25A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3V3.25a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
