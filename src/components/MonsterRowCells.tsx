import type { ConditionState, GroupColorId, Monster } from '../types'
import { GROUP_COLOR_BADGE, GROUP_COLOR_LABEL } from '../data'
import { EditableStaminaCell } from './EditableStaminaCell'
import { MaripCluster } from './MaripCluster'
import { StatCluster } from './StatCluster'
import { CreatureConditionCell } from './CreatureConditionCell'

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
  onStaminaChange,
  onConditionRemove,
  onConditionAddOrSet,
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
  onStaminaChange: (next: [number, number]) => void
  onConditionRemove: (conditionIndex: number) => void
  onConditionAddOrSet: (label: string, state: ConditionState) => void
}) {
  const [sc, sm] = monster.stamina
  const badge = GROUP_COLOR_BADGE[groupColor]
  const colorLabel = GROUP_COLOR_LABEL[groupColor]
  const bodyCell =
    'flex h-full min-h-[3.75rem] items-center p-3 sm:min-h-[4rem] sm:p-3.5'
  const rowTone =
    'transition-opacity duration-200 ease-out motion-reduce:transition-none ' +
    (turnComplete ? 'opacity-[0.52]' : 'opacity-100')

  return (
    <>
      <div className={`${bodyCell} min-w-0 ${rowTone}`} style={{ gridColumn: 2, gridRow: row }}>
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
            {ordinal}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium leading-tight text-zinc-50">{monster.name}</p>
            <p className="mt-1 truncate text-[0.7rem] leading-snug text-zinc-400">{monster.subtitle}</p>
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
        <StatCluster fs={monster.fs} dist={monster.dist} stab={monster.stab} />
      </div>
      <div
        className="relative z-0 flex h-full min-h-[3.75rem] w-full items-stretch overflow-visible hover:z-20 focus-within:z-20 has-[[data-condition-picker]]:z-[100] sm:min-h-[4rem]"
        style={{ gridColumn: 6, gridRow: row }}
      >
        <CreatureConditionCell
          monsterName={monster.name}
          conditions={monster.conditions}
          onRemove={onConditionRemove}
          onAddOrSetCondition={onConditionAddOrSet}
          turnComplete={turnComplete}
        />
      </div>
    </>
  )
}
