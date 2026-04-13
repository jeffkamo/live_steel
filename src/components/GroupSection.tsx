import { useCallback, useEffect, useRef, useState } from 'react'
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
import { ROSTER_GRID_TEMPLATE, buildCreatureOrdinalMap, totalCreaturesInGroup } from '../data'
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
  onDuplicateMonster,
  onDeleteMinion,
  onDuplicateMinion,
  onConvertMonsterToSquad,
  onDeleteEncounterGroup,
  onDuplicateEncounterGroup,
  duplicateEncounterGroupDisabled = false,
  onAddMonster,
  onConfirmEot,
  isEotConfirmed,
  encounterGroupDragHandle,
  encounterGroupReorderMenu,
  monsterReorderMenu,
  minionReorderMenu,
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
  encounterGroupReorderMenu?: {
    onMoveUp: () => void
    onMoveDown: () => void
    moveUpDisabled: boolean
    moveDownDisabled: boolean
  }
  monsterReorderMenu?: {
    onMoveUp: (monsterIndex: number) => void
    onMoveDown: (monsterIndex: number) => void
  }
  minionReorderMenu?: {
    onMoveUp: (monsterIndex: number, minionIndex: number) => void
    onMoveDown: (monsterIndex: number, minionIndex: number) => void
  }
  monsterDrag?: {
    thisGroupIndex: number
    getDragSource?: () => { fromGroup: number; fromMonster: number; fromMinion?: number } | null
    dropTarget: {
      groupIndex: number
      monsterIndex: number
      minionIndex: number | null
      invalid: boolean
    } | null
    dropRejectFlash: {
      groupIndex: number
      monsterIndex: number
      minionIndex: number | null
      id: number
    } | null
    onMonsterDragStart: (monsterIndex: number, e: DragEvent, fromMinion?: number) => void
    onMonsterDragEnd: (e: DragEvent) => void
    onMonsterDragOver: (monsterIndex: number, minionIndex: number | null, e: DragEvent) => void
    onMonsterDragLeave: (monsterIndex: number, minionIndex: number | null, e: DragEvent) => void
    onMonsterDrop: (monsterIndex: number, minionIndex: number | null, e: DragEvent) => void
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
  onDuplicateMonster?: (monsterIndex: number) => void
  onDeleteMinion?: (monsterIndex: number, minionIndex: number) => void
  onDuplicateMinion?: (monsterIndex: number, minionIndex: number) => void
  onConvertMonsterToSquad?: (monsterIndex: number) => void
  onDeleteEncounterGroup?: () => void
  onDuplicateEncounterGroup?: () => void
  duplicateEncounterGroupDisabled?: boolean
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
  const [colorMenu, setColorMenu] = useState<GroupColorMenuState>({
    open: false,
    anchor: null,
    monsterIndex: null,
  })
  const [squadsCollapsed, setSquadsCollapsed] = useState(false)
  const encounterCardDragImageRef = useRef<HTMLDivElement | null>(null)

  const hasSquads = group.monsters.some((m) => (m.minions?.length ?? 0) > 0)
  useEffect(() => {
    if (!hasSquads) setSquadsCollapsed(false)
  }, [hasSquads])

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

  const creatureOrdinalMap = buildCreatureOrdinalMap(group.monsters)
  const totalCreatures = totalCreaturesInGroup(group.monsters)

  let currentRow = 1
  const monsterRows: { monsterIndex: number; startRow: number; rowCount: number }[] = []
  for (let i = 0; i < group.monsters.length; i++) {
    const m = group.monsters[i]!
    const isMinion = m.minions && m.minions.length > 0
    let count = 1
    if (isMinion) count += squadsCollapsed ? 0 : m.minions!.length
    monsterRows.push({ monsterIndex: i, startRow: currentRow, rowCount: count })
    currentRow += count
  }
  const totalGridRows = Math.max(currentRow - 1, 1)
  const addRowCount = onAddMonster ? 1 : 0
  const gridRowCount = totalGridRows + addRowCount

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
    const t = monsterDrag.dropTarget
    const f = monsterDrag.dropRejectFlash
    const hoverPos =
      t != null && t.groupIndex === monsterDrag.thisGroupIndex && t.minionIndex === null
        ? t.monsterIndex === i
          ? ('top' as const)
          : t.monsterIndex === i + 1
            ? ('bottom' as const)
            : null
        : null
    const rejectPos =
      f != null && f.groupIndex === monsterDrag.thisGroupIndex && f.minionIndex === null
        ? f.monsterIndex === i
          ? ('top' as const)
          : f.monsterIndex === i + 1
            ? ('bottom' as const)
            : null
        : null
    return {
      groupIndex: monsterDrag.thisGroupIndex,
      monsterIndex: i,
      dropHighlighted: hoverPos != null && t != null && !t.invalid,
      dropInvalidHover: hoverPos != null && t != null && t.invalid,
      dropRejectFlash: rejectPos != null,
      insertLineAt: hoverPos ?? rejectPos ?? 'top',
      onDragStart: (e: DragEvent) => monsterDrag.onMonsterDragStart(i, e),
      onDragEnd: monsterDrag.onMonsterDragEnd,
      onDragOver: (e: DragEvent) => {
        const src = monsterDrag.getDragSource?.()
        if (src && src.fromMinion == null && src.fromGroup === monsterDrag.thisGroupIndex && src.fromMonster === i) {
          // Hovering over the active dragging row: treat as no-op.
          monsterDrag.onMonsterDragOver(i, null, e)
          return
        }
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const y = e.clientY
        const hasPointer = !(e.clientX === 0 && e.clientY === 0)
        const insertIndex =
          rect.height <= 0
            ? (() => {
                const src2 = monsterDrag.getDragSource?.()
                if (src2 && src2.fromMinion == null && src2.fromGroup === monsterDrag.thisGroupIndex) {
                  return src2.fromMonster > i ? i : i + 1
                }
                return i + 1
              })()
            : rect.height > 0 && y >= rect.top && y <= rect.bottom
            ? hasPointer
              ? y < rect.top + rect.height / 2
                ? i
                : i + 1
              : // Synthetic events (tests) have no pointer coords; assume bottom-half behavior.
                i + 1
            : i
        monsterDrag.onMonsterDragOver(insertIndex, null, e)
      },
      onDragLeave: (e: DragEvent) => {
        monsterDrag.onMonsterDragLeave(i, null, e)
        monsterDrag.onMonsterDragLeave(i + 1, null, e)
      },
      onDrop: (e: DragEvent) => {
        const src = monsterDrag.getDragSource?.()
        if (src && src.fromMinion == null && src.fromGroup === monsterDrag.thisGroupIndex && src.fromMonster === i) {
          monsterDrag.onMonsterDrop(i, null, e)
          return
        }
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const y = e.clientY
        const hasPointer = !(e.clientX === 0 && e.clientY === 0)
        const insertIndex =
          rect.height <= 0
            ? (() => {
                const src2 = monsterDrag.getDragSource?.()
                if (src2 && src2.fromMinion == null && src2.fromGroup === monsterDrag.thisGroupIndex) {
                  return src2.fromMonster > i ? i : i + 1
                }
                return i + 1
              })()
            : rect.height > 0 && y >= rect.top && y <= rect.bottom
            ? hasPointer
              ? y < rect.top + rect.height / 2
                ? i
                : i + 1
              : i + 1
            : i
        monsterDrag.onMonsterDrop(insertIndex, null, e)
      },
    }
  }

  const minionRowDrag = (parentMonsterIndex: number, minionIndex: number) => {
    if (monsterDrag == null) return undefined
    const t = monsterDrag.dropTarget
    const f = monsterDrag.dropRejectFlash
    const hoverPos =
      t != null && t.groupIndex === monsterDrag.thisGroupIndex && t.monsterIndex === parentMonsterIndex
        ? t.minionIndex === minionIndex
          ? ('top' as const)
          : t.minionIndex === minionIndex + 1
            ? ('bottom' as const)
            : null
        : null
    const rejectPos =
      f != null && f.groupIndex === monsterDrag.thisGroupIndex && f.monsterIndex === parentMonsterIndex
        ? f.minionIndex === minionIndex
          ? ('top' as const)
          : f.minionIndex === minionIndex + 1
            ? ('bottom' as const)
            : null
        : null
    return {
      groupIndex: monsterDrag.thisGroupIndex,
      monsterIndex: parentMonsterIndex,
      minionIndex,
      dropHighlighted: hoverPos != null && t != null && !t.invalid,
      dropInvalidHover: hoverPos != null && t != null && t.invalid,
      dropRejectFlash: rejectPos != null,
      insertLineAt: hoverPos ?? rejectPos ?? 'top',
      onDragStart: (e: DragEvent) =>
        monsterDrag.onMonsterDragStart(parentMonsterIndex, e, minionIndex),
      onDragEnd: monsterDrag.onMonsterDragEnd,
      onDragOver: (e: DragEvent) => {
        const src = monsterDrag.getDragSource?.()
        if (
          src &&
          src.fromMinion != null &&
          src.fromGroup === monsterDrag.thisGroupIndex &&
          src.fromMonster === parentMonsterIndex &&
          src.fromMinion === minionIndex
        ) {
          monsterDrag.onMonsterDragOver(parentMonsterIndex, minionIndex, e)
          return
        }
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const y = e.clientY
        const hasPointer = !(e.clientX === 0 && e.clientY === 0)
        const insertIndex =
          rect.height <= 0
            ? (() => {
                const src2 = monsterDrag.getDragSource?.()
                if (
                  src2 &&
                  src2.fromMinion != null &&
                  src2.fromGroup === monsterDrag.thisGroupIndex &&
                  src2.fromMonster === parentMonsterIndex
                ) {
                  return src2.fromMinion > minionIndex ? minionIndex : minionIndex + 1
                }
                return minionIndex + 1
              })()
            : rect.height > 0 && y >= rect.top && y <= rect.bottom
            ? hasPointer
              ? y < rect.top + rect.height / 2
                ? minionIndex
                : minionIndex + 1
              : minionIndex + 1
            : minionIndex
        monsterDrag.onMonsterDragOver(parentMonsterIndex, insertIndex, e)
      },
      onDragLeave: (e: DragEvent) => {
        monsterDrag.onMonsterDragLeave(parentMonsterIndex, minionIndex, e)
        monsterDrag.onMonsterDragLeave(parentMonsterIndex, minionIndex + 1, e)
      },
      onDrop: (e: DragEvent) => {
        const src = monsterDrag.getDragSource?.()
        if (
          src &&
          src.fromMinion != null &&
          src.fromGroup === monsterDrag.thisGroupIndex &&
          src.fromMonster === parentMonsterIndex &&
          src.fromMinion === minionIndex
        ) {
          monsterDrag.onMonsterDrop(parentMonsterIndex, minionIndex, e)
          return
        }
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
        const y = e.clientY
        const hasPointer = !(e.clientX === 0 && e.clientY === 0)
        const insertIndex =
          rect.height <= 0
            ? (() => {
                const src2 = monsterDrag.getDragSource?.()
                if (
                  src2 &&
                  src2.fromMinion != null &&
                  src2.fromGroup === monsterDrag.thisGroupIndex &&
                  src2.fromMonster === parentMonsterIndex
                ) {
                  return src2.fromMinion > minionIndex ? minionIndex : minionIndex + 1
                }
                return minionIndex + 1
              })()
            : rect.height > 0 && y >= rect.top && y <= rect.bottom
            ? hasPointer
              ? y < rect.top + rect.height / 2
                ? minionIndex
                : minionIndex + 1
              : minionIndex + 1
            : minionIndex
        monsterDrag.onMonsterDrop(parentMonsterIndex, insertIndex, e)
      },
    }
  }

  return (
    <div
      ref={encounterGroupDragHandle != null ? encounterCardDragImageRef : undefined}
      className={`grid min-w-0 items-stretch overflow-visible rounded-lg border border-zinc-200/95 bg-white font-sans shadow-sm dark:border-transparent dark:bg-zinc-900/80 dark:shadow-none ${
        encounterGroupDragHandle != null ? 'group/encounter-card' : ''
      }`}
      style={{
        gridTemplateColumns: ROSTER_GRID_TEMPLATE,
        gridTemplateRows: `repeat(${gridRowCount}, minmax(0, auto))`,
      }}
    >
      <GroupTurnColumn
        gridRowSpan={gridRowCount}
        acted={turnActed}
        onToggle={onToggleTurn}
        turnAriaLabel={turnAriaLabel}
        squadsCollapse={
          hasSquads
            ? {
                collapsed: squadsCollapsed,
                onToggle: () => setSquadsCollapsed((c) => !c),
              }
            : undefined
        }
        encounterGroupDragHandle={encounterGroupDragHandle}
        encounterCardDragImageRef={encounterCardDragImageRef}
        encounterGroupReorderMenu={encounterGroupReorderMenu}
        onDeleteEncounterGroup={onDeleteEncounterGroup}
        onDuplicateEncounterGroup={onDuplicateEncounterGroup}
        duplicateEncounterGroupDisabled={duplicateEncounterGroupDisabled}
      />
      {monsterDrag != null && group.monsters.length === 0 && (
        <div
          data-testid="empty-group-monster-drop-target"
          data-group-index={monsterDrag.thisGroupIndex}
          className={`flex min-h-[3.75rem] items-center justify-center rounded border border-dashed border-zinc-400/90 dark:border-zinc-700/80 px-3 text-sm text-zinc-600 dark:text-zinc-500 sm:min-h-[4rem] ${
            monsterDrag.dropTarget?.groupIndex === monsterDrag.thisGroupIndex &&
            monsterDrag.dropTarget?.monsterIndex === 0
              ? 'bg-sky-100/90 ring-2 ring-inset ring-sky-500/45 dark:bg-sky-950/25 dark:ring-sky-500/40'
              : ''
          }`}
          style={{ gridColumn: '2 / -1', gridRow: 1 }}
          onDragOver={(e) => monsterDrag.onMonsterDragOver(0, null, e)}
          onDragLeave={(e) => monsterDrag.onMonsterDragLeave(0, null, e)}
          onDrop={(e) => monsterDrag.onMonsterDrop(0, null, e)}
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
        const hasStatBlock =
          (monster.features?.length ?? 0) > 0 || monster.custom != null
        const statCardDrawerView =
          monsterCardDrawer != null &&
          monsterCardDrawer.groupIndex === thisGroupIndex &&
          monsterCardDrawer.monsterIndex === i
            ? monsterCardDrawer.view
            : null
        const monsterCardDrawerOpen = statCardDrawerView?.kind === 'standard'
        const onMonsterCardNameClick =
          hasStatBlock && onToggleMonsterCard
            ? () => onToggleMonsterCard(i, { kind: 'standard' })
            : undefined

        if (isMinion) {
          return (
            <MinionGroupRow
              key={`${groupKey}-${monster.name}-${i}`}
              monster={monster}
              row={startRow}
              creatureOrdinalMap={creatureOrdinalMap}
              monsterIndex={i}
              encounterGroupIndex={thisGroupIndex}
              totalCreatures={totalCreatures}
              groupKey={groupKey}
              groupNumber={groupNumber}
              groupColor={group.color}
              colorMenuOpen={colorMenu.open}
              colorMenuMonsterIndex={colorMenu.monsterIndex}
              onGroupColorOrdinalClick={onGroupColorOrdinalClick}
              turnComplete={turnActed}
              seActPhaseGlow={seActPhaseGlow}
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
                hasStatBlock && onToggleMonsterCard
                  ? (view) => onToggleMonsterCard(i, view)
                  : undefined
              }
              onDelete={
                onDeleteMonster != null ? () => onDeleteMonster(i) : undefined
              }
              onDuplicate={
                onDuplicateMonster != null ? () => onDuplicateMonster(i) : undefined
              }
              onDeleteMinion={
                onDeleteMinion != null
                  ? (minionIndex) => onDeleteMinion(i, minionIndex)
                  : undefined
              }
              onDuplicateMinion={
                onDuplicateMinion != null
                  ? (minionIndex) => onDuplicateMinion(i, minionIndex)
                  : undefined
              }
              onConfirmEot={onConfirmEot ? (label, minionIndex) => onConfirmEot(i, label, minionIndex) : undefined}
              isEotConfirmed={isEotConfirmed ? (label, minionIndex) => isEotConfirmed(i, label, minionIndex) : undefined}
              monsterDrag={monsterRowDrag(i)}
              conditionDnDParent={bindConditionDnD(i, null)}
              conditionDnDForMinion={(mni) => bindConditionDnD(i, mni)}
              minionRowDrag={(mni) => minionRowDrag(i, mni)}
              parentRowReorderMenu={
                monsterReorderMenu != null
                  ? {
                      onMoveUp: () => monsterReorderMenu.onMoveUp(i),
                      onMoveDown: () => monsterReorderMenu.onMoveDown(i),
                      moveUpDisabled: i === 0,
                      moveDownDisabled: i === group.monsters.length - 1,
                    }
                  : undefined
              }
              minionReorderMenu={
                minionReorderMenu != null
                  ? {
                      onMoveUp: (mni) => minionReorderMenu.onMoveUp(i, mni),
                      onMoveDown: (mni) => minionReorderMenu.onMoveDown(i, mni),
                    }
                  : undefined
              }
              squadsCollapsed={squadsCollapsed}
            />
          )
        }

        return (
          <MonsterRowCells
            key={`${groupKey}-${monster.name}-${i}`}
            monster={monster}
            row={startRow}
            ordinal={creatureOrdinalMap.get(`${i}`)!}
            monsterIndex={i}
            totalCreatures={totalCreatures}
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
            onDuplicate={
              onDuplicateMonster != null ? () => onDuplicateMonster(i) : undefined
            }
            onConvertToSquad={
              onConvertMonsterToSquad != null ? () => onConvertMonsterToSquad(i) : undefined
            }
            onConfirmEot={onConfirmEot ? (label) => onConfirmEot(i, label) : undefined}
            isEotConfirmed={isEotConfirmed ? (label) => isEotConfirmed(i, label) : undefined}
            monsterDrag={monsterRowDrag(i)}
            conditionDnD={bindConditionDnD(i, null)}
            rowReorderMenu={
              monsterReorderMenu != null
                ? {
                    onMoveUp: () => monsterReorderMenu.onMoveUp(i),
                    onMoveDown: () => monsterReorderMenu.onMoveDown(i),
                    moveUpDisabled: i === 0,
                    moveDownDisabled: i === group.monsters.length - 1,
                  }
                : undefined
            }
          />
        )
      })}
      {onAddMonster && (
        <div
          style={{ gridColumn: '2 / -1', gridRow: totalGridRows + 1 }}
          className="flex min-h-0 items-center px-3 py-2"
        >
          <AddMonsterButton onAdd={onAddMonster} />
        </div>
      )}
    </div>
  )
}
