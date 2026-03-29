import type { ConditionState, GroupColorId, Monster } from '../types'
import { GROUP_COLOR_BADGE, GROUP_COLOR_LABEL } from '../data'
import { EditableStaminaCell } from './EditableStaminaCell'
import { MinionStaminaDisplay } from './MinionStaminaDisplay'
import { MaripCluster } from './MaripCluster'
import { StatCluster } from './StatCluster'
import { CreatureConditionCell } from './CreatureConditionCell'
import { StatBlock } from './StatBlock'

const chevronDown = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="size-4"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
      clipRule="evenodd"
    />
  </svg>
)

const chevronUp = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="size-4"
    aria-hidden
  >
    <path
      fillRule="evenodd"
      d="M14.78 11.78a.75.75 0 0 1-1.06 0L10 8.06l-3.72 3.72a.75.75 0 1 1-1.06-1.06l4.25-4.25a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06Z"
      clipRule="evenodd"
    />
  </svg>
)

export function MinionGroupRow({
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
  expanded,
  onToggleExpanded,
  onStaminaChange,
  onConditionRemove,
  onConditionAddOrSet,
  onMinionDeadChange,
  onMinionConditionRemove,
  onMinionConditionAddOrSet,
  statBlockExpanded = false,
  onToggleStatBlock,
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
  expanded: boolean
  onToggleExpanded: () => void
  onStaminaChange: (next: [number, number]) => void
  onConditionRemove: (conditionIndex: number) => void
  onConditionAddOrSet: (label: string, state: ConditionState) => void
  onMinionDeadChange: (minionIndex: number, dead: boolean) => void
  onMinionConditionRemove: (minionIndex: number, conditionIndex: number) => void
  onMinionConditionAddOrSet: (
    minionIndex: number,
    label: string,
    state: ConditionState,
  ) => void
  statBlockExpanded?: boolean
  onToggleStatBlock?: () => void
}) {
  const [sc, sm] = monster.stamina
  const badge = GROUP_COLOR_BADGE[groupColor]
  const colorLabel = GROUP_COLOR_LABEL[groupColor]
  const minions = monster.minions ?? []
  const hasFeatures = (monster.features?.length ?? 0) > 0

  const bodyCell =
    'flex h-full min-h-[3.75rem] items-center p-3 sm:min-h-[4rem] sm:p-3.5'
  const rowTone =
    'transition-opacity duration-200 ease-out motion-reduce:transition-none ' +
    (turnComplete ? 'opacity-[0.52]' : 'opacity-100')

  return (
    <>
      {/* --- parent minion summary row --- */}
      <div
        className={`${bodyCell} min-w-0 ${rowTone}`}
        style={{ gridColumn: 2, gridRow: row }}
      >
        <div className="flex w-full min-w-0 items-center gap-3">
          <button
            type="button"
            data-group-color-trigger={groupKey}
            aria-label={`Encounter group ${groupNumber}: creature ${ordinal} of ${monsterCount}. Group color ${colorLabel}. Activate to change group color.`}
            aria-expanded={colorMenuOpen && colorMenuMonsterIndex === monsterIndex}
            aria-haspopup="dialog"
            className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums leading-none outline-none transition-[filter,transform] duration-150 ease-out motion-reduce:transition-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.97] sm:size-10 sm:text-base ${badge.border} ${badge.bg} ${badge.text}`}
            onClick={(e) => onGroupColorOrdinalClick(monsterIndex, e.currentTarget)}
          >
            <span className="sr-only">{ordinal}</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium leading-tight text-zinc-50">
              {monster.name}
            </p>
            <p className="mt-1 truncate text-[0.7rem] leading-snug text-zinc-400">
              {monster.subtitle}
            </p>
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
          renderDisplay={(cur, mx) => (
            <MinionStaminaDisplay
              current={cur}
              max={mx}
              parentName={monster.name}
              firstMinionName={minions[0]?.name}
              minionCount={minions.length}
            />
          )}
        />
      </div>
      <div
        className={`${bodyCell} justify-center ${rowTone}`}
        style={{ gridColumn: 4, gridRow: row }}
      >
        <MaripCluster values={monster.marip} />
      </div>
      <div
        className={`${bodyCell} justify-center ${rowTone}`}
        style={{ gridColumn: 5, gridRow: row }}
      >
        <StatCluster fs={monster.fs} dist={monster.dist} stab={monster.stab} />
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
          />
          {hasFeatures && onToggleStatBlock && (
            <button
              type="button"
              aria-expanded={statBlockExpanded}
              aria-label={
                statBlockExpanded
                  ? `Collapse stat block for ${monster.name}`
                  : `Expand stat block for ${monster.name}`
              }
              onClick={onToggleStatBlock}
              className={`flex shrink-0 cursor-pointer items-center justify-center px-1 text-zinc-500 transition-colors hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500/70 ${rowTone}`}
            >
              {statBlockExpanded ? chevronUp : chevronDown}
            </button>
          )}
          <button
            type="button"
            aria-expanded={expanded}
            aria-label={
              expanded
                ? `Collapse individual ${monster.name}`
                : `Expand individual ${monster.name}`
            }
            onClick={onToggleExpanded}
            className={`flex shrink-0 cursor-pointer items-center justify-center px-2 text-zinc-400 transition-colors hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500/70 ${rowTone}`}
          >
            {expanded ? chevronUp : chevronDown}
          </button>
        </div>
      </div>

      {/* --- expanded child rows --- */}
      {expanded &&
        minions.map((minion, mi) => {
          const childRow = row + 1 + mi
          return (
            <MinionChildRow
              key={`${groupKey}-minion-${mi}`}
              minion={minion}
              minionIndex={mi}
              minionCount={minions.length}
              parentMonster={monster}
              gridRow={childRow}
              groupColor={groupColor}
              groupNumber={groupNumber}
              turnComplete={turnComplete}
              onDeadChange={(dead) => onMinionDeadChange(mi, dead)}
              onConditionRemove={(ci) => onMinionConditionRemove(mi, ci)}
              onConditionAddOrSet={(label, state) =>
                onMinionConditionAddOrSet(mi, label, state)
              }
            />
          )
        })}

      {/* --- stat block row --- */}
      {statBlockExpanded && hasFeatures && (
        <div
          className="border-t border-zinc-800/50 px-4 pb-3"
          style={{
            gridColumn: '2 / -1',
            gridRow: row + 1 + (expanded ? minions.length : 0),
          }}
        >
          <StatBlock features={monster.features!} monsterName={monster.name} />
        </div>
      )}
    </>
  )
}

function MinionChildRow({
  minion,
  minionIndex,
  minionCount,
  parentMonster,
  gridRow,
  groupColor,
  groupNumber,
  turnComplete,
  onDeadChange,
  onConditionRemove,
  onConditionAddOrSet,
}: {
  minion: { name: string; initials: string; conditions: readonly import('../types').ConditionEntry[]; dead: boolean }
  minionIndex: number
  minionCount: number
  parentMonster: Monster
  gridRow: number
  groupColor: GroupColorId
  groupNumber: number
  turnComplete: boolean
  onDeadChange: (dead: boolean) => void
  onConditionRemove: (conditionIndex: number) => void
  onConditionAddOrSet: (label: string, state: ConditionState) => void
}) {
  const badge = GROUP_COLOR_BADGE[groupColor]
  const bodyCell =
    'flex h-full min-h-[3rem] items-center p-2 sm:min-h-[3.25rem] sm:p-2.5'
  const deadDim = minion.dead ? 'opacity-40' : ''
  const rowTone =
    'transition-opacity duration-200 ease-out motion-reduce:transition-none ' +
    (turnComplete ? 'opacity-[0.52]' : 'opacity-100')

  return (
    <>
      <div
        className={`${bodyCell} min-w-0 border-t border-zinc-800/60 ${rowTone}`}
        style={{ gridColumn: 2, gridRow: gridRow }}
      >
        <div className={`flex w-full min-w-0 items-center gap-3 pl-6 ${deadDim}`}>
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[0.65rem] font-semibold tabular-nums leading-none sm:size-8 sm:text-xs ${badge.border} ${badge.bg} ${badge.text}`}
            aria-label={`${minion.name}: minion ${minionIndex + 1} of ${minionCount} in group ${groupNumber}`}
          >
            {minionIndex + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-medium leading-tight text-zinc-200 ${minion.dead ? 'line-through' : ''}`}>
              {minion.name}
            </p>
          </div>
        </div>
      </div>
      <div
        className={`${bodyCell} justify-center border-t border-zinc-800/60 ${rowTone}`}
        style={{ gridColumn: 3, gridRow: gridRow }}
      >
        <label className="relative inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={minion.dead}
            onChange={(e) => onDeadChange(e.target.checked)}
            className="peer sr-only"
            aria-label={`${minion.name}: ${minion.dead ? 'dead' : 'alive'}`}
          />
          <span
            className={`flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${
              minion.dead
                ? 'bg-red-900/70'
                : 'bg-emerald-900/50'
            }`}
          >
            <span
              className={`inline-block size-4 rounded-full transition-all duration-200 ${
                minion.dead
                  ? 'translate-x-[1.375rem] bg-red-400'
                  : 'translate-x-1 bg-emerald-400'
              }`}
            />
          </span>
          <span className={`select-none text-xs font-medium ${minion.dead ? 'text-red-400' : 'text-emerald-400'}`}>
            {minion.dead ? 'Dead' : 'Alive'}
          </span>
        </label>
      </div>
      <div
        className={`${bodyCell} justify-center border-t border-zinc-800/60 ${rowTone} ${deadDim}`}
        style={{ gridColumn: 4, gridRow: gridRow }}
      >
        <MaripCluster values={parentMonster.marip} />
      </div>
      <div
        className={`${bodyCell} justify-center border-t border-zinc-800/60 ${rowTone} ${deadDim}`}
        style={{ gridColumn: 5, gridRow: gridRow }}
      >
        <StatCluster
          fs={parentMonster.fs}
          dist={parentMonster.dist}
          stab={parentMonster.stab}
        />
      </div>
      <div
        className={`relative z-0 flex h-full min-h-[3rem] w-full items-stretch overflow-visible border-t border-zinc-800/60 hover:z-20 focus-within:z-20 has-[[data-condition-picker]]:z-[100] sm:min-h-[3.25rem] ${deadDim}`}
        style={{ gridColumn: 6, gridRow: gridRow }}
      >
        <CreatureConditionCell
          monsterName={minion.name}
          conditions={minion.conditions}
          onRemove={onConditionRemove}
          onAddOrSetCondition={onConditionAddOrSet}
          turnComplete={turnComplete}
        />
      </div>
    </>
  )
}
