import type { DragEvent } from 'react'
import { ReorderGripWithMenu } from './ReorderGripWithMenu'

export function TurnColumnCell({
  acted,
  onToggle,
  label,
}: {
  acted: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={acted}
      aria-label={label}
      className="flex min-h-0 w-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-2 py-3 text-center transition-[background-color] duration-200 ease-out motion-reduce:transition-none hover:bg-zinc-300 dark:hover:bg-zinc-800/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500/70 sm:px-3 sm:py-4"
    >
      <span className="text-[0.65rem] uppercase tracking-wide text-zinc-700 dark:text-zinc-300">Turn</span>
      <span
        className={`inline-block size-2 shrink-0 rotate-45 border border-zinc-400/75 transition-colors ${
          acted ? 'bg-zinc-400/80' : 'bg-zinc-50 dark:bg-zinc-950'
        }`}
        aria-hidden
      />
    </button>
  )
}

export function GroupTurnColumn({
  gridRowSpan,
  acted,
  onToggle,
  turnAriaLabel,
  encounterGroupDragHandle,
  encounterGroupReorderMenu,
  onDeleteEncounterGroup,
  onDuplicateEncounterGroup,
  duplicateEncounterGroupDisabled = false,
}: {
  gridRowSpan: number
  acted: boolean
  onToggle: () => void
  turnAriaLabel: string
  encounterGroupDragHandle?: {
    onDragStart: (e: DragEvent) => void
    onDragEnd: (e: DragEvent) => void
    ariaLabel: string
  }
  encounterGroupReorderMenu?: {
    onMoveUp: () => void
    onMoveDown: () => void
    moveUpDisabled: boolean
    moveDownDisabled: boolean
  }
  onDeleteEncounterGroup?: () => void
  onDuplicateEncounterGroup?: () => void
  duplicateEncounterGroupDisabled?: boolean
}) {
  const encounterGripMenuItems = [
    ...(encounterGroupReorderMenu != null
      ? [
          {
            id: 'move-up',
            label: 'Move up',
            disabled: encounterGroupReorderMenu.moveUpDisabled,
            onSelect: encounterGroupReorderMenu.onMoveUp,
          },
          {
            id: 'move-down',
            label: 'Move down',
            disabled: encounterGroupReorderMenu.moveDownDisabled,
            onSelect: encounterGroupReorderMenu.onMoveDown,
          },
        ] as const
      : []),
    ...(onDuplicateEncounterGroup != null
      ? [{
          id: 'duplicate-group',
          label: 'Duplicate',
          onSelect: onDuplicateEncounterGroup,
          disabled: duplicateEncounterGroupDisabled,
        }]
      : []),
    ...(onDeleteEncounterGroup != null
      ? [{ id: 'delete-group', label: 'Delete', onSelect: onDeleteEncounterGroup, destructive: true }]
      : []),
  ]
  return (
    <div
      style={{ gridColumn: 1, gridRow: `1 / span ${gridRowSpan}` }}
      className={`flex h-full min-h-0 w-full min-w-0 flex-row items-stretch overflow-visible border-r border-zinc-200/95 dark:border-zinc-800/60 bg-zinc-50/95 dark:bg-zinc-900/80 transition-opacity duration-200 ease-out motion-reduce:transition-none has-[[data-grip-menu-open]]:opacity-100 has-[[data-grip-menu-open]]:z-[200] ${
        acted ? 'opacity-[0.38]' : 'opacity-100'
      }`}
    >
      {encounterGroupDragHandle != null && (
        <div className="flex h-full min-h-0 shrink-0 items-stretch border-r border-zinc-200/90 dark:border-zinc-800/60 p-1 sm:p-1.5">
          <ReorderGripWithMenu
            reorderAriaLabel={encounterGroupDragHandle.ariaLabel}
            onDragStart={encounterGroupDragHandle.onDragStart}
            onDragEnd={encounterGroupDragHandle.onDragEnd}
            menuItems={encounterGripMenuItems}
            className="group flex w-7 cursor-grab touch-none select-none items-center justify-center rounded-md border border-transparent transition-[background-color,border-color,box-shadow,color] duration-150 ease-out hover:border-zinc-700/45 hover:bg-zinc-300 dark:hover:bg-zinc-800/55 hover:shadow-sm active:cursor-grabbing motion-reduce:transition-none sm:w-8"
            iconClassName="size-3.5 text-zinc-600 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-200 sm:size-4"
          />
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TurnColumnCell acted={acted} onToggle={onToggle} label={turnAriaLabel} />
      </div>
    </div>
  )
}
