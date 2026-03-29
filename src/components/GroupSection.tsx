import { useCallback, useState } from 'react'
import type { CaptainRef, ConditionState, EncounterGroup, GroupColorId, GroupColorMenuState, Monster } from '../types'
import { ROSTER_GRID_TEMPLATE } from '../data'
import { GroupTurnColumn } from './TurnColumnCell'
import { GroupColorPickerPopover } from './GroupColorPickerPopover'
import { MonsterRowCells } from './MonsterRowCells'
import { MinionGroupRow } from './MinionGroupRow'
import { AddMonsterButton } from './AddMonsterButton'

export function GroupSection({
  group,
  groupKey,
  groupNumber,
  thisGroupIndex,
  encounterGroupColors,
  turnActed,
  onToggleTurn,
  turnAriaLabel,
  onGroupColorChange,
  onMonsterStaminaChange,
  onMonsterConditionRemove,
  onMonsterConditionAddOrSet,
  allGroups,
  onMinionCaptainChange,
  onMinionDeadChange,
  onMinionConditionRemove,
  onMinionConditionAddOrSet,
  onDeleteMonster,
  onAddMonster,
}: {
  group: EncounterGroup
  groupKey: string
  groupNumber: number
  thisGroupIndex: number
  encounterGroupColors: readonly GroupColorId[]
  turnActed: boolean
  onToggleTurn: () => void
  turnAriaLabel: string
  onGroupColorChange: (color: GroupColorId) => void
  onMonsterStaminaChange: (monsterIndex: number, stamina: [number, number]) => void
  onMonsterConditionRemove: (monsterIndex: number, conditionIndex: number) => void
  onMonsterConditionAddOrSet: (monsterIndex: number, label: string, state: ConditionState) => void
  allGroups?: readonly EncounterGroup[]
  onMinionCaptainChange?: (monsterIndex: number, captainId: CaptainRef | null) => void
  onMinionDeadChange?: (monsterIndex: number, minionIndex: number, dead: boolean) => void
  onMinionConditionRemove?: (monsterIndex: number, minionIndex: number, conditionIndex: number) => void
  onMinionConditionAddOrSet?: (monsterIndex: number, minionIndex: number, label: string, state: ConditionState) => void
  onDeleteMonster?: (monsterIndex: number) => void
  onAddMonster?: (monster: Monster) => void
}): React.JSX.Element {
  const [expandedMinions, setExpandedMinions] = useState<Record<number, boolean>>({})
  const [expandedStatBlocks, setExpandedStatBlocks] = useState<Record<number, boolean>>({})
  const [colorMenu, setColorMenu] = useState<GroupColorMenuState>({
    open: false,
    anchor: null,
    monsterIndex: null,
  })

  const closeColorMenu = useCallback(() => {
    setColorMenu({ open: false, anchor: null, monsterIndex: null })
  }, [])

  const onGroupColorOrdinalClick = useCallback(
    (monsterIndex: number, anchor: HTMLElement) => {
      setColorMenu((m) => {
        if (m.open && m.monsterIndex === monsterIndex) {
          return { open: false, anchor: null, monsterIndex: null }
        }
        return { open: true, anchor, monsterIndex }
      })
    },
    [],
  )

  const toggleMinionExpanded = useCallback((monsterIndex: number) => {
    setExpandedMinions((prev) => ({ ...prev, [monsterIndex]: !prev[monsterIndex] }))
  }, [])

  const toggleStatBlock = useCallback((monsterIndex: number) => {
    setExpandedStatBlocks((prev) => ({ ...prev, [monsterIndex]: !prev[monsterIndex] }))
  }, [])

  let currentRow = 1
  const monsterRows: { monsterIndex: number; startRow: number; rowCount: number }[] = []
  for (let i = 0; i < group.monsters.length; i++) {
    const m = group.monsters[i]!
    const isMinion = m.minions && m.minions.length > 0
    const minionExpanded = isMinion && !!expandedMinions[i]
    const hasFeatures = (m.features?.length ?? 0) > 0
    const statBlockOpen = hasFeatures && !!expandedStatBlocks[i]
    let count = 1
    if (isMinion && minionExpanded) count += m.minions!.length
    if (statBlockOpen) count += 1
    monsterRows.push({ monsterIndex: i, startRow: currentRow, rowCount: count })
    currentRow += count
  }
  const totalGridRows = Math.max(currentRow - 1, 1)

  return (
    <div
      className="grid items-stretch overflow-visible rounded-lg bg-zinc-900/80"
      style={{
        gridTemplateColumns: ROSTER_GRID_TEMPLATE,
        gridTemplateRows: `repeat(${totalGridRows}, minmax(0, auto))`,
      }}
    >
      <GroupTurnColumn
        gridRowSpan={totalGridRows}
        acted={turnActed}
        onToggle={onToggleTurn}
        turnAriaLabel={turnAriaLabel}
      />
      <GroupColorPickerPopover
        open={colorMenu.open}
        anchor={colorMenu.anchor}
        groupKey={groupKey}
        groupNumber={groupNumber}
        thisGroupIndex={thisGroupIndex}
        encounterGroupColors={encounterGroupColors}
        currentColor={group.color}
        onSelectColor={onGroupColorChange}
        onClose={closeColorMenu}
      />
      {monsterRows.map(({ monsterIndex: i, startRow }) => {
        const monster = group.monsters[i]!
        const isMinion = monster.minions && monster.minions.length > 0

        if (isMinion) {
          return (
            <MinionGroupRow
              key={`${groupKey}-${monster.name}-${i}`}
              monster={monster}
              row={startRow}
              ordinal={i + 1}
              monsterIndex={i}
              monsterCount={group.monsters.length}
              groupKey={groupKey}
              groupNumber={groupNumber}
              groupColor={group.color}
              colorMenuOpen={colorMenu.open}
              colorMenuMonsterIndex={colorMenu.monsterIndex}
              onGroupColorOrdinalClick={onGroupColorOrdinalClick}
              turnComplete={turnActed}
              expanded={!!expandedMinions[i]}
              onToggleExpanded={() => toggleMinionExpanded(i)}
              allGroups={allGroups}
              onCaptainChange={(captainId) =>
                onMinionCaptainChange?.(i, captainId)
              }
              onStaminaChange={(st) => onMonsterStaminaChange(i, st)}
              onConditionRemove={(ci) => onMonsterConditionRemove(i, ci)}
              onConditionAddOrSet={(label, state) =>
                onMonsterConditionAddOrSet(i, label, state)
              }
              onMinionDeadChange={(mi, dead) =>
                onMinionDeadChange?.(i, mi, dead)
              }
              onMinionConditionRemove={(mi, ci) =>
                onMinionConditionRemove?.(i, mi, ci)
              }
              onMinionConditionAddOrSet={(mi, label, state) =>
                onMinionConditionAddOrSet?.(i, mi, label, state)
              }
              statBlockExpanded={!!expandedStatBlocks[i]}
              onToggleStatBlock={() => toggleStatBlock(i)}
              onDelete={() => onDeleteMonster?.(i)}
            />
          )
        }

        return (
          <MonsterRowCells
            key={`${groupKey}-${monster.name}-${i}`}
            monster={monster}
            row={startRow}
            ordinal={i + 1}
            monsterIndex={i}
            monsterCount={group.monsters.length}
            groupKey={groupKey}
            groupNumber={groupNumber}
            groupColor={group.color}
            colorMenuOpen={colorMenu.open}
            colorMenuMonsterIndex={colorMenu.monsterIndex}
            onGroupColorOrdinalClick={onGroupColorOrdinalClick}
            turnComplete={turnActed}
            onStaminaChange={(st) => onMonsterStaminaChange(i, st)}
            onConditionRemove={(ci) => onMonsterConditionRemove(i, ci)}
            onConditionAddOrSet={(label, state) =>
              onMonsterConditionAddOrSet(i, label, state)
            }
            statBlockExpanded={!!expandedStatBlocks[i]}
            onToggleStatBlock={() => toggleStatBlock(i)}
            onDelete={() => onDeleteMonster?.(i)}
          />
        )
      })}
      {onAddMonster && (
        <div
          style={{ gridColumn: '2 / -1', gridRow: totalGridRows + 1 }}
          className="px-3 pb-2"
        >
          <AddMonsterButton onAdd={onAddMonster} />
        </div>
      )}
    </div>
  )
}
