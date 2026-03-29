import { useCallback, useState } from 'react'
import type { DragEvent } from 'react'
import type {
  CaptainRef,
  ConditionState,
  EncounterGroup,
  GroupColorId,
  GroupColorMenuState,
  Monster,
  MonsterCardDrawerState,
  MonsterCardDrawerView,
} from '../types'
import { ROSTER_GRID_TEMPLATE } from '../data'
import type { CreatureConditionDnDBinding } from './CreatureConditionCell'
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
  seActPhaseGlow,
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
  onConfirmEot,
  isEotConfirmed,
  encounterGroupDragHandle,
  monsterDrag,
  conditionDrag,
  monsterCardDrawer = null,
  onToggleMonsterCard,
}: {
  group: EncounterGroup
  groupKey: string
  groupNumber: number
  thisGroupIndex: number
  encounterGroupColors: readonly GroupColorId[]
  turnActed: boolean
  seActPhaseGlow: boolean
  onToggleTurn: () => void
  turnAriaLabel: string
  encounterGroupDragHandle?: {
    onDragStart: (e: DragEvent) => void
    onDragEnd: (e: DragEvent) => void
    ariaLabel: string
  }
  monsterDrag?: {
    thisGroupIndex: number
    dropTarget: { groupIndex: number; monsterIndex: number } | null
    onMonsterDragStart: (monsterIndex: number, e: DragEvent) => void
    onMonsterDragEnd: (e: DragEvent) => void
    onMonsterDragOver: (monsterIndex: number, e: DragEvent) => void
    onMonsterDragLeave: (monsterIndex: number, e: DragEvent) => void
    onMonsterDrop: (monsterIndex: number, e: DragEvent) => void
  }
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
  onConfirmEot?: (monsterIndex: number, label: string, minionIndex?: number) => void
  isEotConfirmed?: (monsterIndex: number, label: string, minionIndex?: number) => boolean
  conditionDrag?: {
    dropTarget: { groupIndex: number; monsterIndex: number; minionIndex: number | null } | null
    onDragStart: (monsterIndex: number, minionIndex: number | null, label: string, e: DragEvent) => void
    onDragEnd: () => void
    onDragOver: (monsterIndex: number, minionIndex: number | null, e: DragEvent) => void
    onDragLeave: (monsterIndex: number, minionIndex: number | null, e: DragEvent) => void
    onDrop: (monsterIndex: number, minionIndex: number | null, e: DragEvent) => void
  }
  monsterCardDrawer?: MonsterCardDrawerState | null
  onToggleMonsterCard?: (monsterIndex: number, view: MonsterCardDrawerView) => void
}): React.JSX.Element {
  const [expandedMinions, setExpandedMinions] = useState<Record<number, boolean>>({})
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

  let currentRow = 1
  const monsterRows: { monsterIndex: number; startRow: number; rowCount: number }[] = []
  for (let i = 0; i < group.monsters.length; i++) {
    const m = group.monsters[i]!
    const isMinion = m.minions && m.minions.length > 0
    const minionExpanded = isMinion && !!expandedMinions[i]
    let count = 1
    if (isMinion && minionExpanded) count += m.minions!.length
    monsterRows.push({ monsterIndex: i, startRow: currentRow, rowCount: count })
    currentRow += count
  }
  const totalGridRows = Math.max(currentRow - 1, 1)

  const bindConditionDnD = (mi: number, mni: number | null): CreatureConditionDnDBinding | undefined => {
    if (conditionDrag == null) return undefined
    const { dropTarget, onDragStart, onDragEnd, onDragOver, onDragLeave, onDrop } = conditionDrag
    return {
      groupIndex: thisGroupIndex,
      monsterIndex: mi,
      minionIndex: mni,
      dropHighlight: dropTarget,
      onDragStart: (label, e) => onDragStart(mi, mni, label, e),
      onDragEnd,
      onDragOver: (e) => onDragOver(mi, mni, e),
      onDragLeave: (e) => onDragLeave(mi, mni, e),
      onDrop: (e) => onDrop(mi, mni, e),
    }
  }

  const monsterRowDrag = (i: number) => {
    if (monsterDrag == null) return undefined
    return {
      groupIndex: monsterDrag.thisGroupIndex,
      monsterIndex: i,
      dropHighlighted:
        monsterDrag.dropTarget?.groupIndex === monsterDrag.thisGroupIndex &&
        monsterDrag.dropTarget?.monsterIndex === i,
      onDragStart: (e: DragEvent) => monsterDrag.onMonsterDragStart(i, e),
      onDragEnd: monsterDrag.onMonsterDragEnd,
      onDragOver: (e: DragEvent) => monsterDrag.onMonsterDragOver(i, e),
      onDragLeave: (e: DragEvent) => monsterDrag.onMonsterDragLeave(i, e),
      onDrop: (e: DragEvent) => monsterDrag.onMonsterDrop(i, e),
    }
  }

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
        encounterGroupDragHandle={encounterGroupDragHandle}
      />
      {monsterDrag != null && group.monsters.length === 0 && (
        <div
          data-testid="empty-group-monster-drop-target"
          data-group-index={monsterDrag.thisGroupIndex}
          className={`flex min-h-[3.75rem] items-center justify-center rounded border border-dashed border-zinc-700/80 px-3 text-sm text-zinc-500 sm:min-h-[4rem] ${
            monsterDrag.dropTarget?.groupIndex === monsterDrag.thisGroupIndex &&
            monsterDrag.dropTarget?.monsterIndex === 0
              ? 'bg-sky-950/25 ring-2 ring-inset ring-sky-500/40'
              : ''
          }`}
          style={{ gridColumn: '2 / -1', gridRow: 1 }}
          onDragOver={(e) => monsterDrag.onMonsterDragOver(0, e)}
          onDragLeave={(e) => monsterDrag.onMonsterDragLeave(0, e)}
          onDrop={(e) => monsterDrag.onMonsterDrop(0, e)}
        >
          Drop creature here
        </div>
      )}
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
        const hasFeatures = (monster.features?.length ?? 0) > 0
        const statCardDrawerView =
          monsterCardDrawer != null &&
          monsterCardDrawer.groupIndex === thisGroupIndex &&
          monsterCardDrawer.monsterIndex === i
            ? monsterCardDrawer.view
            : null
        const monsterCardDrawerOpen = statCardDrawerView?.kind === 'standard'
        const onMonsterCardNameClick =
          hasFeatures && onToggleMonsterCard
            ? () => onToggleMonsterCard(i, { kind: 'standard' })
            : undefined

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
              seActPhaseGlow={seActPhaseGlow}
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
              statCardDrawerView={statCardDrawerView}
              onStatCardToggle={
                hasFeatures && onToggleMonsterCard
                  ? (view) => onToggleMonsterCard(i, view)
                  : undefined
              }
              onDelete={
                onDeleteMonster != null ? () => onDeleteMonster(i) : undefined
              }
              onConfirmEot={onConfirmEot ? (label, minionIndex) => onConfirmEot(i, label, minionIndex) : undefined}
              isEotConfirmed={isEotConfirmed ? (label, minionIndex) => isEotConfirmed(i, label, minionIndex) : undefined}
              monsterDrag={monsterRowDrag(i)}
              conditionDnDParent={bindConditionDnD(i, null)}
              conditionDnDForMinion={(mni) => bindConditionDnD(i, mni)}
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
            seActPhaseGlow={seActPhaseGlow}
            onStaminaChange={(st) => onMonsterStaminaChange(i, st)}
            onConditionRemove={(ci) => onMonsterConditionRemove(i, ci)}
            onConditionAddOrSet={(label, state) =>
              onMonsterConditionAddOrSet(i, label, state)
            }
            monsterCardDrawerOpen={monsterCardDrawerOpen}
            onMonsterCardNameClick={onMonsterCardNameClick}
            onDelete={
              onDeleteMonster != null ? () => onDeleteMonster(i) : undefined
            }
            onConfirmEot={onConfirmEot ? (label) => onConfirmEot(i, label) : undefined}
            isEotConfirmed={isEotConfirmed ? (label) => isEotConfirmed(i, label) : undefined}
            monsterDrag={monsterRowDrag(i)}
            conditionDnD={bindConditionDnD(i, null)}
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
