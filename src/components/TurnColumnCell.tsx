import type { DragEvent, RefObject } from 'react'
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
      className="flex min-h-0 w-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded-md px-2 py-3 text-center transition-[background-color] duration-200 ease-out motion-reduce:transition-none hover:bg-zinc-300 dark:hover:bg-zinc-800/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500/70 sm:px-3 sm:py-4"
    >
      <span className="font-serif text-[0.65rem] uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
        Turn
      </span>
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
  squadsCollapse,
  encounterGroupDragHandle,
  encounterCardDragImageRef,
  encounterGroupReorderMenu,
  onDeleteEncounterGroup,
  onDuplicateEncounterGroup,
  duplicateEncounterGroupDisabled = false,
}: {
  gridRowSpan: number
  acted: boolean
  onToggle: () => void
  turnAriaLabel: string
  /** When set, shows a minimal chevron control above Turn to hide or show squad minion rows. */
  squadsCollapse?: { collapsed: boolean; onToggle: () => void }
  encounterGroupDragHandle?: {
    onDragStart: (e: DragEvent) => void
    onDragEnd: (e: DragEvent) => void
    ariaLabel: string
  }
  encounterCardDragImageRef?: RefObject<HTMLElement | null>
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
      className={`relative flex h-full min-h-0 w-full min-w-0 flex-row items-stretch overflow-visible border-r border-zinc-200/95 dark:border-zinc-800/60 bg-zinc-50/95 dark:bg-zinc-900/80 transition-opacity duration-200 ease-out motion-reduce:transition-none has-[[data-grip-menu-open]]:opacity-100 has-[[data-grip-menu-open]]:z-[200] ${
        acted ? 'opacity-[0.38]' : 'opacity-100'
      }`}
    >
      {encounterGroupDragHandle != null && (
        <div className="pointer-events-none absolute top-0 left-0 z-[110] flex h-full items-center">
          <div className="-translate-x-1/2">
            <ReorderGripWithMenu
              rowHoverGroup="encounter-card"
              reorderAriaLabel={encounterGroupDragHandle.ariaLabel}
              onDragStart={encounterGroupDragHandle.onDragStart}
              onDragEnd={encounterGroupDragHandle.onDragEnd}
              getDragImageElement={
                encounterCardDragImageRef != null
                  ? () => encounterCardDragImageRef.current
                  : undefined
              }
              menuItems={encounterGripMenuItems}
              className="h-8 shrink-0 cursor-grab touch-none select-none rounded-md sm:h-9"
              iconClassName="text-zinc-700 dark:text-zinc-200"
            />
          </div>
        </div>
      )}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1 p-1 sm:p-1.5">
        {squadsCollapse != null && (
          <button
            type="button"
            data-testid="squads-collapse-toggle"
            onClick={squadsCollapse.onToggle}
            aria-expanded={!squadsCollapse.collapsed}
            aria-label={squadsCollapse.collapsed ? 'Expand squads' : 'Collapse squads'}
            className="flex min-h-11 w-full shrink-0 cursor-pointer items-center justify-center rounded-md border border-zinc-200/95 px-2 py-2 text-zinc-600 transition-colors hover:bg-zinc-200/80 dark:border-zinc-800/60 dark:text-zinc-400 dark:hover:bg-zinc-800/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500/70"
          >
            {squadsCollapse.collapsed ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5 shrink-0"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="size-5 shrink-0"
                aria-hidden
              >
                <path
                  fillRule="evenodd"
                  d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        )}
        <TurnColumnCell acted={acted} onToggle={onToggle} label={turnAriaLabel} />
      </div>
    </div>
  )
}
