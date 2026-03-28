import { useCallback, useState } from 'react'
import type { ConditionState, EncounterGroup, GroupColorId, GroupColorMenuState } from '../types'
import { ROSTER_GRID_TEMPLATE } from '../data'
import { GroupTurnColumn } from './TurnColumnCell'
import { GroupColorPickerPopover } from './GroupColorPickerPopover'
import { MonsterRowCells } from './MonsterRowCells'

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
}) {
  const n = group.monsters.length
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

  return (
    <div
      className="grid items-stretch overflow-visible rounded-lg bg-zinc-900/80"
      style={{
        gridTemplateColumns: ROSTER_GRID_TEMPLATE,
        gridTemplateRows: `repeat(${n}, minmax(0, auto))`,
      }}
    >
      <GroupTurnColumn
        gridRowSpan={n}
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
      {group.monsters.map((monster, i) => (
        <MonsterRowCells
          key={`${groupKey}-${monster.name}-${i}`}
          monster={monster}
          row={i + 1}
          ordinal={i + 1}
          monsterIndex={i}
          monsterCount={n}
          groupKey={groupKey}
          groupNumber={groupNumber}
          groupColor={group.color}
          colorMenuOpen={colorMenu.open}
          colorMenuMonsterIndex={colorMenu.monsterIndex}
          onGroupColorOrdinalClick={onGroupColorOrdinalClick}
          turnComplete={turnActed}
          onStaminaChange={(st) => onMonsterStaminaChange(i, st)}
          onConditionRemove={(ci) => onMonsterConditionRemove(i, ci)}
          onConditionAddOrSet={(label, state) => onMonsterConditionAddOrSet(i, label, state)}
        />
      ))}
    </div>
  )
}
