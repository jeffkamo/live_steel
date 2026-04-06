import type { DragEvent } from 'react'
import type { ConditionState, GroupColorId, Monster } from '../types'
import { rosterCombatStats } from '../bestiary'
import { GROUP_COLOR_BADGE, GROUP_COLOR_LABEL } from '../data'
import { EditableStaminaCell } from './EditableStaminaCell'
import { MaripCluster } from './MaripCluster'
import { StatCluster } from './StatCluster'
import { CreatureConditionCell, type CreatureConditionDnDBinding } from './CreatureConditionCell'
import { ReorderGripWithMenu } from './ReorderGripWithMenu'

export function MonsterRowCells({
  monster,
  row,
  ordinal,
  monsterIndex,
  totalCreatures,
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
  onDuplicate,
  onConvertToSquad,
  onConfirmEot,
  isEotConfirmed,
  monsterDrag,
  rowReorderMenu,
  conditionDnD,
}: {
  monster: Monster
  row: number
  ordinal: number
  monsterIndex: number
  totalCreatures: number
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
  onDuplicate?: () => void
  onConvertToSquad?: () => void
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
  rowReorderMenu?: {
    onMoveUp: () => void
    onMoveDown: () => void
    moveUpDisabled: boolean
    moveDownDisabled: boolean
  }
  conditionDnD?: CreatureConditionDnDBinding
}) {
  const [sc, sm] = monster.stamina
  const dead = sm > 0 && sc <= 0
  const deadDim = dead ? 'opacity-40' : ''
  const deadStrike = dead ? 'line-through' : ''
  const badge = GROUP_COLOR_BADGE[groupColor]
  const colorLabel = GROUP_COLOR_LABEL[groupColor]
  const hasStatBlock =
    (monster.features?.length ?? 0) > 0 || monster.custom != null
  const bodyCell =
    'flex h-full min-h-[3.75rem] items-center p-3 sm:min-h-[4rem] sm:p-3.5'
  const creatureNameColCell =
    'flex h-full min-h-[3.75rem] items-stretch px-2 py-2 sm:min-h-[4rem] sm:px-2.5 sm:py-2.5'
  const combat = rosterCombatStats(monster)
  const isMinion = /\bminion\b/i.test(monster.subtitle)
  const gripMenuItems = [
    ...(rowReorderMenu != null
      ? [
          {
            id: 'move-up',
            label: 'Move up',
            disabled: rowReorderMenu.moveUpDisabled,
            onSelect: rowReorderMenu.onMoveUp,
          },
          {
            id: 'move-down',
            label: 'Move down',
            disabled: rowReorderMenu.moveDownDisabled,
            onSelect: rowReorderMenu.onMoveDown,
          },
        ]
      : []),
    ...(onDuplicate != null
      ? [{ id: 'duplicate', label: 'Duplicate', onSelect: onDuplicate } as const]
      : []),
    ...(onConvertToSquad != null
      ? [{
          id: 'convert-squad',
          label: isMinion ? 'Convert to Squad' : 'Convert to Squad (minions only)',
          onSelect: onConvertToSquad,
          disabled: !isMinion,
        } as const]
      : []),
    ...(onDelete != null
      ? [{ id: 'delete', label: 'Delete', onSelect: onDelete, destructive: true } as const]
      : []),
  ]
  const rowTone =
    'transition-opacity duration-200 ease-out motion-reduce:transition-none ' +
    (turnComplete ? 'opacity-[0.38]' : 'opacity-100')

  const monsterDropRing =
    monsterDrag?.dropHighlighted
      ? 'ring-2 ring-inset ring-sky-500/40'
      : monsterDrag?.dropRejectFlash
        ? 'ring-2 ring-inset ring-rose-500/70 motion-safe:animate-pulse'
        : monsterDrag?.dropInvalidHover
          ? 'ring-2 ring-inset ring-rose-500/45'
          : ''

  const lockedOrdinalBalancePad = monsterDrag == null ? 'pl-1 sm:pl-1.5' : ''

  return (
    <div
      className={`roster-creature ${rowTone} has-[[data-grip-menu-open]]:opacity-100 has-[[data-grip-menu-open]]:z-[200] ${monsterDropRing}`}
      style={{ gridColumn: 2, gridRow: row }}
      data-testid="monster-drop-target"
      data-group-index={monsterDrag?.groupIndex}
      data-monster-index={monsterDrag?.monsterIndex}
      onDragOver={monsterDrag?.onDragOver}
      onDragLeave={monsterDrag?.onDragLeave}
      onDrop={monsterDrag?.onDrop}
    >
      <div className="roster-creature__grid">
        <div className={`roster-creature__name ${creatureNameColCell} min-w-0 ${deadDim}`}>
          <div className={`flex min-h-0 min-w-0 flex-1 items-stretch gap-3 ${lockedOrdinalBalancePad}`}>
            {monsterDrag != null && (
              <ReorderGripWithMenu
                reorderAriaLabel={`Reorder ${monster.name} within encounter`}
                onDragStart={monsterDrag.onDragStart}
                onDragEnd={monsterDrag.onDragEnd}
                menuItems={gripMenuItems}
                className="group flex w-9 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-md border border-transparent transition-[background-color,border-color,box-shadow,color] duration-150 ease-out hover:border-zinc-700/45 hover:bg-zinc-300 dark:hover:bg-zinc-800/55 hover:shadow-sm active:cursor-grabbing motion-reduce:transition-none sm:w-10"
                iconClassName="size-3.5 text-zinc-600 transition-colors group-hover:text-zinc-900 dark:group-hover:text-zinc-200 sm:size-4"
              />
            )}
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <button
                type="button"
                data-group-color-trigger={groupKey}
                aria-label={`Encounter group ${groupNumber}: creature ${ordinal} of ${totalCreatures}. Group color ${colorLabel}. Activate to change group color.`}
                aria-expanded={colorMenuOpen && colorMenuMonsterIndex === monsterIndex}
                aria-haspopup="dialog"
                className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums leading-none outline-none transition-[filter,transform] duration-150 ease-out motion-reduce:transition-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950 active:scale-[0.97] sm:size-10 sm:text-base ${badge.border} ${badge.bg} ${badge.text}`}
                onClick={(e) => onGroupColorOrdinalClick(monsterIndex, e.currentTarget)}
              >
                {ordinal}
              </button>
              <div className="min-w-0 flex-1">
                {hasStatBlock && onMonsterCardNameClick ? (
                  <button
                    type="button"
                    aria-expanded={monsterCardDrawerOpen}
                    aria-controls="monster-stat-card-drawer"
                    aria-label={`Stat card for ${monster.name}`}
                    onClick={onMonsterCardNameClick}
                    className="block w-full min-w-0 cursor-pointer rounded-md px-3 py-2 text-left outline-none transition-[background-color,box-shadow,color] duration-150 ease-out motion-reduce:transition-none hover:bg-zinc-200/95 dark:hover:bg-zinc-800/55 hover:shadow-sm hover:shadow-black/20 hover:[&>span]:text-amber-900 dark:hover:[&>span]:text-amber-50/95 hover:[&>p]:text-zinc-600 dark:hover:[&>p]:text-zinc-300 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950"
                  >
                    <span className={`block truncate font-medium leading-tight text-zinc-900 dark:text-zinc-50 transition-colors duration-150 ${deadStrike}`}>
                      {monster.name}
                    </span>
                    <p className="mt-1 truncate text-[0.7rem] leading-snug text-zinc-600 dark:text-zinc-400 transition-colors duration-150">
                      {monster.subtitle}
                    </p>
                  </button>
                ) : (
                  <>
                    <p className={`truncate font-medium leading-tight text-zinc-900 dark:text-zinc-50 ${deadStrike}`}>{monster.name}</p>
                    <p className="mt-1 truncate text-[0.7rem] leading-snug text-zinc-600 dark:text-zinc-400">{monster.subtitle}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="roster-creature__mid">
          <div
            className={`roster-creature__stamina ${bodyCell} relative z-0 min-w-0 justify-center overflow-x-clip overflow-y-visible hover:z-20 focus-within:z-20`}
          >
            <EditableStaminaCell
              current={sc}
              max={sm}
              onChange={onStaminaChange}
              ariaLabel={`Edit stamina for ${monster.name}`}
              dimContent={turnComplete}
            />
          </div>
          <div className={`roster-creature__marip ${bodyCell} justify-center ${rowTone}`}>
            <MaripCluster values={monster.marip} />
          </div>
          <div className={`roster-creature__stats ${bodyCell} justify-center ${rowTone}`}>
            <StatCluster fs={combat.fs} spd={combat.spd} stab={combat.stab} />
          </div>
        </div>
        <div
          className="roster-creature__conditions relative z-0 flex h-full min-h-[3.75rem] w-full min-w-0 items-stretch overflow-visible hover:z-20 focus-within:z-20 has-[[data-condition-picker]]:z-[100] sm:min-h-[4rem]"
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
      </div>
    </div>
  )
}
