import type { DragEvent } from 'react'
import type { ConditionState, GroupColorId, Monster } from '../types'
import { rosterCombatStats } from '../bestiary'
import { GROUP_COLOR_BADGE, GROUP_COLOR_LABEL } from '../data'
import { EditableStaminaCell } from './EditableStaminaCell'
import { MaripCluster } from './MaripCluster'
import { StatCluster } from './StatCluster'
import { CreatureConditionCell, type CreatureConditionDnDBinding } from './CreatureConditionCell'
import { ReorderGripIcon } from './ReorderGripIcon'

export function MonsterRowCells({
  monster,
  row,
  ordinal,
  monsterIndex,
  monsterCount,
  groupKey,
  groupNumber,
  groupColor,
  colorMenuOpen,
  colorMenuMonsterIndex,
  onGroupColorOrdinalClick,
  turnComplete,
  seActPhaseGlow,
  onStaminaChange,
  onConditionRemove,
  onConditionAddOrSet,
  monsterCardDrawerOpen = false,
  onMonsterCardNameClick,
  onDelete,
  onConfirmEot,
  isEotConfirmed,
  monsterDrag,
  conditionDnD,
}: {
  monster: Monster
  row: number
  ordinal: number
  monsterIndex: number
  monsterCount: number
  groupKey: string
  groupNumber: number
  groupColor: GroupColorId
  colorMenuOpen: boolean
  colorMenuMonsterIndex: number | null
  onGroupColorOrdinalClick: (monsterIndex: number, anchor: HTMLElement) => void
  turnComplete: boolean
  seActPhaseGlow: boolean
  onStaminaChange: (next: [number, number]) => void
  onConditionRemove: (conditionIndex: number) => void
  onConditionAddOrSet: (label: string, state: ConditionState) => void
  monsterCardDrawerOpen?: boolean
  onMonsterCardNameClick?: () => void
  onDelete?: () => void
  onConfirmEot?: (label: string) => void
  isEotConfirmed?: (label: string) => boolean
  monsterDrag?: {
    groupIndex: number
    monsterIndex: number
    dropHighlighted: boolean
    dropInvalidHover?: boolean
    dropRejectFlash?: boolean
    onDragStart: (e: DragEvent) => void
    onDragEnd: (e: DragEvent) => void
    onDragOver: (e: DragEvent) => void
    onDragLeave: (e: DragEvent) => void
    onDrop: (e: DragEvent) => void
  }
  conditionDnD?: CreatureConditionDnDBinding
}) {
  const [sc, sm] = monster.stamina
  const badge = GROUP_COLOR_BADGE[groupColor]
  const colorLabel = GROUP_COLOR_LABEL[groupColor]
  const hasFeatures = (monster.features?.length ?? 0) > 0
  const bodyCell =
    'flex h-full min-h-[3.75rem] items-center p-3 sm:min-h-[4rem] sm:p-3.5'
  const creatureNameColCell =
    'flex h-full min-h-[3.75rem] items-stretch px-2 py-2 sm:min-h-[4rem] sm:px-2.5 sm:py-2.5'
  const combat = rosterCombatStats(monster)
  const rowTone =
    'transition-opacity duration-200 ease-out motion-reduce:transition-none ' +
    (turnComplete ? 'opacity-[0.52]' : 'opacity-100')

  const monsterDropRing =
    monsterDrag?.dropHighlighted
      ? 'ring-2 ring-inset ring-sky-500/40'
      : monsterDrag?.dropRejectFlash
        ? 'ring-2 ring-inset ring-rose-500/70 motion-safe:animate-pulse'
        : monsterDrag?.dropInvalidHover
          ? 'ring-2 ring-inset ring-rose-500/45'
          : ''

  return (
    <>
      <div
        className={`${creatureNameColCell} min-w-0 ${rowTone} ${monsterDropRing}`}
        style={{ gridColumn: 2, gridRow: row }}
        data-testid="monster-drop-target"
        data-group-index={monsterDrag?.groupIndex}
        data-monster-index={monsterDrag?.monsterIndex}
        onDragOver={monsterDrag?.onDragOver}
        onDragLeave={monsterDrag?.onDragLeave}
        onDrop={monsterDrag?.onDrop}
      >
        <div className="flex min-h-0 min-w-0 flex-1 items-stretch gap-3">
          {monsterDrag != null && (
            <div
              draggable
              onDragStart={monsterDrag.onDragStart}
              onDragEnd={monsterDrag.onDragEnd}
              aria-label={`Reorder ${monster.name} within encounter`}
              className="group flex w-9 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-md border border-transparent transition-[background-color,border-color,box-shadow,color] duration-150 ease-out hover:border-zinc-700/45 hover:bg-zinc-800/55 hover:shadow-sm active:cursor-grabbing motion-reduce:transition-none sm:w-10"
            >
              <ReorderGripIcon className="size-3.5 text-zinc-500 transition-colors group-hover:text-zinc-200 sm:size-4" />
            </div>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            data-group-color-trigger={groupKey}
            aria-label={`Encounter group ${groupNumber}: creature ${ordinal} of ${monsterCount}. Group color ${colorLabel}. Activate to change group color.`}
            aria-expanded={colorMenuOpen && colorMenuMonsterIndex === monsterIndex}
            aria-haspopup="dialog"
            className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums leading-none outline-none transition-[filter,transform] duration-150 ease-out motion-reduce:transition-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.97] sm:size-10 sm:text-base ${badge.border} ${badge.bg} ${badge.text}`}
            onClick={(e) => onGroupColorOrdinalClick(monsterIndex, e.currentTarget)}
          >
            {ordinal}
          </button>
          <div className="min-w-0 flex-1">
            {hasFeatures && onMonsterCardNameClick ? (
              <button
                type="button"
                aria-expanded={monsterCardDrawerOpen}
                aria-controls="monster-stat-card-drawer"
                aria-label={`Stat card for ${monster.name}`}
                onClick={onMonsterCardNameClick}
                className="block w-full min-w-0 cursor-pointer rounded-md px-3 py-2 text-left outline-none transition-[background-color,box-shadow,color] duration-150 ease-out motion-reduce:transition-none hover:bg-zinc-800/55 hover:shadow-sm hover:shadow-black/20 hover:[&>span]:text-amber-50/95 hover:[&>p]:text-zinc-300 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
              >
                <span className="block truncate font-medium leading-tight text-zinc-50 transition-colors duration-150">
                  {monster.name}
                </span>
                <p className="mt-1 truncate text-[0.7rem] leading-snug text-zinc-400 transition-colors duration-150">
                  {monster.subtitle}
                </p>
              </button>
            ) : (
              <>
                <p className="truncate font-medium leading-tight text-zinc-50">{monster.name}</p>
                <p className="mt-1 truncate text-[0.7rem] leading-snug text-zinc-400">{monster.subtitle}</p>
              </>
            )}
          </div>
          {onDelete && (
            <button
              type="button"
              aria-label={`Delete ${monster.name}`}
              onClick={onDelete}
              className="ml-1 shrink-0 cursor-pointer rounded p-1 text-zinc-500 transition-colors duration-150 hover:text-red-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-500/70"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3.5" aria-hidden>
                <path fillRule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          </div>
        </div>
      </div>
      <div
        className={`${bodyCell} relative z-0 justify-center overflow-visible hover:z-20 focus-within:z-20 ${rowTone}`}
        style={{ gridColumn: 3, gridRow: row }}
      >
        <EditableStaminaCell
          current={sc}
          max={sm}
          onChange={onStaminaChange}
          ariaLabel={`Edit stamina for ${monster.name}`}
        />
      </div>
      <div className={`${bodyCell} justify-center ${rowTone}`} style={{ gridColumn: 4, gridRow: row }}>
        <MaripCluster values={monster.marip} />
      </div>
      <div className={`${bodyCell} justify-center ${rowTone}`} style={{ gridColumn: 5, gridRow: row }}>
        <StatCluster fs={combat.fs} spd={combat.spd} stab={combat.stab} />
      </div>
      <div
        className="relative z-0 flex h-full min-h-[3.75rem] w-full items-stretch overflow-visible hover:z-20 focus-within:z-20 has-[[data-condition-picker]]:z-[100] sm:min-h-[4rem]"
        style={{ gridColumn: 6, gridRow: row }}
      >
        <div className="flex min-w-0 flex-1 items-stretch">
          <CreatureConditionCell
            monsterName={monster.name}
            conditions={monster.conditions}
            onRemove={onConditionRemove}
            onAddOrSetCondition={onConditionAddOrSet}
            turnComplete={turnComplete}
            seActPhaseGlow={seActPhaseGlow}
            onConfirmEot={onConfirmEot}
            isEotConfirmed={isEotConfirmed}
            conditionDnD={conditionDnD}
          />
        </div>
      </div>
    </>
  )
}
