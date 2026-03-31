import { useState, useRef, useEffect, useCallback } from 'react'
import type { DragEvent } from 'react'
import type {
  CaptainRef,
  ConditionState,
  EncounterGroup,
  GroupColorId,
  Monster,
  MonsterCardDrawerView,
} from '../types'
import { minionInterval, rosterCombatStats, suggestedDeadCount } from '../bestiary'
import { GROUP_COLOR_BADGE, GROUP_COLOR_LABEL, buildCreatureOrdinalMap } from '../data'
import { EditableStaminaCell } from './EditableStaminaCell'
import { MinionStaminaDisplay } from './MinionStaminaDisplay'
import { MinionStaminaEditor } from './MinionStaminaEditor'
import { MaripCluster } from './MaripCluster'
import { StaminaHeartFullIcon, StaminaSkullIcon } from './StaminaGlyph'
import { StatCluster } from './StatCluster'
import { CreatureConditionCell, type CreatureConditionDnDBinding } from './CreatureConditionCell'
import { ReorderGripWithMenu } from './ReorderGripWithMenu'
import { focusRelativeIn, listFocusableIn, tabWrapKeyDown } from '../dropdownA11y'

type MinionRowDragBinding = {
  groupIndex: number
  monsterIndex: number
  minionIndex: number
  dropHighlighted: boolean
  dropInvalidHover?: boolean
  dropRejectFlash?: boolean
  onDragStart: (e: DragEvent) => void
  onDragEnd: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
}

export function MinionGroupRow({
  monster,
  row,
  creatureOrdinalMap,
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
  allGroups,
  onCaptainChange,
  onStaminaChange,
  onConditionRemove,
  onConditionAddOrSet,
  onMinionDeadChange,
  onMinionConditionRemove,
  onMinionConditionAddOrSet,
  statCardDrawerView = null,
  onStatCardToggle,
  onDelete,
  onDeleteMinion,
  onConfirmEot,
  isEotConfirmed,
  monsterDrag,
  minionRowDrag,
  conditionDnDParent,
  conditionDnDForMinion,
}: {
  monster: Monster
  row: number
  creatureOrdinalMap: Map<string, number>
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
  allGroups?: readonly EncounterGroup[]
  onCaptainChange?: (captainId: CaptainRef | null) => void
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
  statCardDrawerView?: MonsterCardDrawerView | null
  onStatCardToggle?: (view: MonsterCardDrawerView) => void
  onDelete?: () => void
  onDeleteMinion?: (minionIndex: number) => void
  onConfirmEot?: (label: string, minionIndex?: number) => void
  isEotConfirmed?: (label: string, minionIndex?: number) => boolean
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
  minionRowDrag?: (minionIndex: number) => MinionRowDragBinding | undefined
  conditionDnDParent?: CreatureConditionDnDBinding
  conditionDnDForMinion?: (minionIndex: number) => CreatureConditionDnDBinding | undefined
}) {
  const [sc, sm] = monster.stamina
  const badge = GROUP_COLOR_BADGE[groupColor]
  const colorLabel = GROUP_COLOR_LABEL[groupColor]
  const minions = monster.minions ?? []
  const hasFeatures = (monster.features?.length ?? 0) > 0
  const [poolStamina] = monster.stamina
  const staminaInterval = minionInterval(monster.name, minions[0]?.name)
  const actualDeadCount = minions.filter((m) => m.dead).length
  const suggestedDead =
    staminaInterval != null && minions.length > 0
      ? suggestedDeadCount(poolStamina, staminaInterval, minions.length)
      : 0
  const staminaMismatch =
    staminaInterval != null && minions.length > 0 && suggestedDead !== actualDeadCount
  const needKillCue = staminaMismatch && suggestedDead > actualDeadCount
  const needReviveCue = staminaMismatch && suggestedDead < actualDeadCount

  const [captainDropdownOpen, setCaptainDropdownOpen] = useState(false)
  const captainDropdownRef = useRef<HTMLDivElement>(null)
  const captainMenuRef = useRef<HTMLDivElement>(null)
  const captainReturnFocusRef = useRef<HTMLElement | null>(null)

  const closeCaptainDropdown = useCallback(() => setCaptainDropdownOpen(false), [])

  useEffect(() => {
    if (!captainDropdownOpen) {
      const r = captainReturnFocusRef.current
      captainReturnFocusRef.current = null
      queueMicrotask(() => r?.focus?.())
      return
    }
    captainReturnFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const id = requestAnimationFrame(() => {
      const m = captainMenuRef.current
      if (m) listFocusableIn(m)[0]?.focus()
    })
    return () => cancelAnimationFrame(id)
  }, [captainDropdownOpen])

  useEffect(() => {
    if (!captainDropdownOpen) return
    const handler = (e: MouseEvent) => {
      if (captainDropdownRef.current && !captainDropdownRef.current.contains(e.target as Node)) {
        closeCaptainDropdown()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [captainDropdownOpen, closeCaptainDropdown])

  const captainRef = monster.captainId ?? null
  const captainMonster = captainRef && allGroups
    ? allGroups[captainRef.groupIndex]?.monsters[captainRef.monsterIndex]
    : undefined
  const captainGroupColor = captainRef && allGroups
    ? allGroups[captainRef.groupIndex]?.color
    : undefined
  const captainCreatureOrdinal =
    captainRef && allGroups
      ? buildCreatureOrdinalMap(allGroups[captainRef.groupIndex]!.monsters).get(`${captainRef.monsterIndex}`)
      : undefined

  const candidateMonsters: { groupIndex: number; monsterIndex: number; name: string; ordinal: number; color: GroupColorId }[] = []
  if (allGroups) {
    for (let gi = 0; gi < allGroups.length; gi++) {
      const g = allGroups[gi]!
      const ordMap = buildCreatureOrdinalMap(g.monsters)
      for (let mi = 0; mi < g.monsters.length; mi++) {
        const m = g.monsters[mi]!
        if (m.minions && m.minions.length > 0) continue
        const ord = ordMap.get(`${mi}`)
        if (ord == null) continue
        candidateMonsters.push({
          groupIndex: gi,
          monsterIndex: mi,
          name: m.name,
          ordinal: ord,
          color: g.color,
        })
      }
    }
  }

  const bodyCell =
    'flex h-full min-h-[3.75rem] items-center p-3 sm:min-h-[4rem] sm:p-3.5'
  const creatureNameColCell =
    'flex h-full min-h-[3.75rem] items-stretch px-2 py-2 sm:min-h-[4rem] sm:px-2.5 sm:py-2.5'
  const combat = rosterCombatStats(monster)
  const rowTone =
    'transition-opacity duration-200 ease-out motion-reduce:transition-none ' +
    (turnComplete ? 'opacity-[0.38]' : 'opacity-100')

  const parentGripMenuItems =
    onDelete != null
      ? ([{ id: 'delete', label: 'Delete', onSelect: onDelete, destructive: true }] as const)
      : []

  const parentMonsterDropRing =
    monsterDrag?.dropHighlighted
      ? 'ring-2 ring-inset ring-sky-500/40'
      : monsterDrag?.dropRejectFlash
        ? 'ring-2 ring-inset ring-rose-500/70 motion-safe:animate-pulse'
        : monsterDrag?.dropInvalidHover
          ? 'ring-2 ring-inset ring-rose-500/45'
          : ''

  return (
    <>
      {/* --- parent minion summary row --- */}
      <div
        className={`${creatureNameColCell} min-w-0 ${rowTone} has-[[data-grip-menu-open]]:opacity-100 has-[[data-grip-menu-open]]:z-[200] ${parentMonsterDropRing}`}
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
            <ReorderGripWithMenu
              reorderAriaLabel={`Reorder ${monster.name} within encounter`}
              onDragStart={monsterDrag.onDragStart}
              onDragEnd={monsterDrag.onDragEnd}
              menuItems={parentGripMenuItems}
              className="group flex w-9 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-md border border-transparent transition-[background-color,border-color,box-shadow,color] duration-150 ease-out hover:border-zinc-700/45 hover:bg-zinc-800/55 hover:shadow-sm active:cursor-grabbing motion-reduce:transition-none sm:w-10"
              iconClassName="size-3.5 text-zinc-500 transition-colors group-hover:text-zinc-200 sm:size-4"
            />
          )}
          <div className="flex min-w-0 flex-1 items-center gap-3">
          <button
            type="button"
            data-group-color-trigger={groupKey}
            aria-label={`Encounter group ${groupNumber}: Squad ${monster.name}, group color ${colorLabel}. Activate to change group color.`}
            aria-expanded={colorMenuOpen && colorMenuMonsterIndex === monsterIndex}
            aria-haspopup="dialog"
            className={`flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 text-sm font-semibold tabular-nums leading-none outline-none transition-[filter,transform] duration-150 ease-out motion-reduce:transition-none hover:brightness-110 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 active:scale-[0.97] sm:size-10 sm:text-base ${badge.border} ${badge.bg} ${badge.text}`}
            onClick={(e) => onGroupColorOrdinalClick(monsterIndex, e.currentTarget)}
          ></button>
          <div className="min-w-0 flex-1">
            {hasFeatures && onStatCardToggle ? (
              <button
                type="button"
                aria-expanded={statCardDrawerView?.kind === 'minionParent'}
                aria-controls="monster-stat-card-drawer"
                aria-label={`Stat card for ${monster.name}`}
                onClick={() => onStatCardToggle({ kind: 'minionParent' })}
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
            <div className="relative mt-1.5" ref={captainDropdownRef}>
              {captainMonster && captainGroupColor ? (
                <div
                  className="inline-flex max-w-full items-stretch overflow-hidden rounded-full border border-zinc-700/80 bg-zinc-800/80 text-xs leading-tight"
                  data-testid="captain-pill"
                >
                  <button
                    type="button"
                    aria-label={`Change captain for ${monster.name}`}
                    aria-expanded={captainDropdownOpen}
                    aria-haspopup="listbox"
                    onClick={() => setCaptainDropdownOpen((v) => !v)}
                    className="inline-flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 px-2.5 py-0.5 text-left outline-none transition-colors hover:bg-zinc-700/40 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    <span className="shrink-0 text-[0.6rem] font-medium uppercase tracking-wider text-zinc-500">Captain</span>
                    <span
                      className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.6rem] font-semibold tabular-nums leading-none ${GROUP_COLOR_BADGE[captainGroupColor].border} ${GROUP_COLOR_BADGE[captainGroupColor].bg} ${GROUP_COLOR_BADGE[captainGroupColor].text}`}
                    >
                      {captainCreatureOrdinal ?? captainRef!.monsterIndex + 1}
                    </span>
                    <span className="min-w-0 truncate text-zinc-200">{captainMonster.name}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove captain from ${monster.name}`}
                    data-testid="remove-captain"
                    onClick={() => onCaptainChange?.(null)}
                    className="flex shrink-0 cursor-pointer items-center border-l border-zinc-700/80 px-2 py-0.5 text-zinc-500 transition-colors hover:bg-zinc-700/40 hover:text-red-400 focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3" aria-hidden>
                      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  aria-label={`Assign captain for ${monster.name}`}
                  onClick={() => setCaptainDropdownOpen((v) => !v)}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-dashed border-zinc-600/80 bg-zinc-800/40 px-2.5 py-0.5 text-xs leading-tight text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
                  data-testid="captain-pill"
                >
                  <span className="text-[0.6rem] font-medium uppercase tracking-wider">Captain</span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3" aria-hidden>
                    <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                  </svg>
                </button>
              )}
              {captainDropdownOpen && (
                <div
                  ref={captainMenuRef}
                  className="absolute left-0 top-full z-50 mt-1 max-h-52 min-w-[14rem] overflow-y-auto rounded-lg border border-zinc-700/80 bg-zinc-900 shadow-xl"
                  role="listbox"
                  aria-label={`Select captain for ${monster.name}`}
                  onKeyDown={(e) => {
                    const root = e.currentTarget
                    if (e.key === 'Escape') {
                      e.preventDefault()
                      closeCaptainDropdown()
                      return
                    }
                    tabWrapKeyDown(e.nativeEvent, root)
                    if (e.key === 'ArrowDown') {
                      e.preventDefault()
                      focusRelativeIn(root, 1)
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault()
                      focusRelativeIn(root, -1)
                    } else if (e.key === 'Home') {
                      e.preventDefault()
                      listFocusableIn(root)[0]?.focus()
                    } else if (e.key === 'End') {
                      e.preventDefault()
                      const list = listFocusableIn(root)
                      list[list.length - 1]?.focus()
                    }
                  }}
                >
                  {captainRef && (
                    <button
                      type="button"
                      role="option"
                      aria-selected={false}
                      onClick={() => {
                        onCaptainChange?.(null)
                        closeCaptainDropdown()
                      }}
                      className="flex w-full cursor-pointer items-center gap-2 border-b border-zinc-800 px-3 py-2 text-left text-xs text-red-400 transition-colors hover:bg-zinc-800"
                    >
                      Remove captain
                    </button>
                  )}
                  {candidateMonsters.length === 0 && (
                    <div className="px-3 py-2 text-xs text-zinc-500">No eligible monsters</div>
                  )}
                  {candidateMonsters.map((c) => {
                    const isCurrentCaptain = captainRef?.groupIndex === c.groupIndex && captainRef?.monsterIndex === c.monsterIndex
                    const cBadge = GROUP_COLOR_BADGE[c.color]
                    return (
                      <button
                        type="button"
                        role="option"
                        aria-selected={isCurrentCaptain}
                        key={`captain-${c.groupIndex}-${c.monsterIndex}`}
                        onClick={() => {
                          onCaptainChange?.({ groupIndex: c.groupIndex, monsterIndex: c.monsterIndex })
                          closeCaptainDropdown()
                        }}
                        className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-zinc-800 ${isCurrentCaptain ? 'bg-zinc-800/60 text-zinc-100' : 'text-zinc-300'}`}
                      >
                        <span
                          className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[0.6rem] font-semibold tabular-nums leading-none ${cBadge.border} ${cBadge.bg} ${cBadge.text}`}
                        >
                          {c.ordinal}
                        </span>
                        <span className="truncate">{c.name}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
      <div
        className={`${bodyCell} relative z-0 justify-center overflow-visible hover:z-20 focus-within:z-20`}
        style={{ gridColumn: 3, gridRow: row }}
      >
        <EditableStaminaCell
          current={sc}
          max={sm}
          onChange={onStaminaChange}
          ariaLabel={`Edit stamina for ${monster.name}`}
          dimContent={turnComplete}
          renderDisplay={(cur, mx) => (
            <MinionStaminaDisplay
              current={cur}
              max={mx}
              parentName={monster.name}
              firstMinionName={minions[0]?.name}
              minionCount={minions.length}
              actualDeadCount={minions.filter((m) => m.dead).length}
            />
          )}
          renderEditor={({ current: cur, bump }) => (
            <MinionStaminaEditor
              current={cur}
              bump={bump}
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
            onConfirmEot={onConfirmEot ? (label) => onConfirmEot(label) : undefined}
            isEotConfirmed={isEotConfirmed ? (label) => isEotConfirmed(label) : undefined}
            conditionDnD={conditionDnDParent}
          />
        </div>
      </div>

      {/* --- minion child rows --- */}
      {minions.map((minion, mi) => {
        const childRow = row + 1 + mi
        let lifeToggleCue: 'kill' | 'revive' | null = null
        if (needKillCue && !minion.dead) lifeToggleCue = 'kill'
        else if (needReviveCue && minion.dead) lifeToggleCue = 'revive'
        return (
          <MinionChildRow
            key={`${groupKey}-minion-${mi}`}
            minion={minion}
            minionIndex={mi}
            creatureOrdinal={creatureOrdinalMap.get(`${monsterIndex}:${mi}`)!}
            totalCreatures={totalCreatures}
            parentMonster={monster}
            gridRow={childRow}
            groupColor={groupColor}
            groupNumber={groupNumber}
            turnComplete={turnComplete}
            seActPhaseGlow={seActPhaseGlow}
            lifeToggleCue={lifeToggleCue}
            onDeadChange={(dead) => onMinionDeadChange(mi, dead)}
            onConditionRemove={(ci) => onMinionConditionRemove(mi, ci)}
            onConditionAddOrSet={(label, state) =>
              onMinionConditionAddOrSet(mi, label, state)
            }
            onConfirmEot={onConfirmEot ? (label) => onConfirmEot(label, mi) : undefined}
            isEotConfirmed={isEotConfirmed ? (label) => isEotConfirmed(label, mi) : undefined}
            conditionDnD={conditionDnDForMinion?.(mi)}
            monsterCardDrawerOpen={
              statCardDrawerView?.kind === 'minion' && statCardDrawerView.slot === mi
            }
            onMinionStatCardClick={
                hasFeatures && onStatCardToggle
                  ? () => onStatCardToggle({ kind: 'minion', slot: mi })
                  : undefined
            }
            minionDrag={minionRowDrag?.(mi)}
            onDeleteMinion={onDeleteMinion != null ? () => onDeleteMinion(mi) : undefined}
          />
        )
      })}
    </>
  )
}

function MinionChildRow({
  minion,
  minionIndex: _minionIndex,
  creatureOrdinal,
  totalCreatures,
  parentMonster,
  gridRow,
  groupColor,
  groupNumber,
  turnComplete,
  seActPhaseGlow,
  onDeadChange,
  onConditionRemove,
  onConditionAddOrSet,
  onConfirmEot,
  isEotConfirmed,
  conditionDnD,
  monsterCardDrawerOpen = false,
  onMinionStatCardClick,
  onDeleteMinion,
  minionDrag,
  lifeToggleCue = null,
}: {
  minion: { name: string; initials: string; conditions: readonly import('../types').ConditionEntry[]; dead: boolean }
  minionIndex: number
  creatureOrdinal: number
  totalCreatures: number
  parentMonster: Monster
  gridRow: number
  groupColor: GroupColorId
  groupNumber: number
  turnComplete: boolean
  seActPhaseGlow: boolean
  lifeToggleCue?: 'kill' | 'revive' | null
  onDeadChange: (dead: boolean) => void
  onConditionRemove: (conditionIndex: number) => void
  onConditionAddOrSet: (label: string, state: ConditionState) => void
  onConfirmEot?: (label: string) => void
  isEotConfirmed?: (label: string) => boolean
  conditionDnD?: CreatureConditionDnDBinding
  monsterCardDrawerOpen?: boolean
  onMinionStatCardClick?: () => void
  onDeleteMinion?: () => void
  minionDrag?: MinionRowDragBinding
}) {
  const minionGripMenuItems =
    onDeleteMinion != null
      ? ([{ id: 'delete', label: 'Delete', onSelect: onDeleteMinion, destructive: true }] as const)
      : []
  const badge = GROUP_COLOR_BADGE[groupColor]
  const childCombat = rosterCombatStats(parentMonster)
  const bodyCell =
    'flex h-full min-h-[3rem] items-center p-2 sm:min-h-[3.25rem] sm:p-2.5'
  const nameColCell =
    'flex h-full min-h-[3rem] items-stretch px-2 py-1 sm:min-h-[3.25rem] sm:px-2.5 sm:py-1.5'
  const deadDim = minion.dead ? 'opacity-40' : ''
  const rowTone =
    'transition-opacity duration-200 ease-out motion-reduce:transition-none ' +
    (turnComplete ? 'opacity-[0.38]' : 'opacity-100')

  const minionDropRing =
    minionDrag?.dropHighlighted
      ? 'ring-2 ring-inset ring-sky-500/40'
      : minionDrag?.dropRejectFlash
        ? 'ring-2 ring-inset ring-rose-500/70 motion-safe:animate-pulse'
        : minionDrag?.dropInvalidHover
          ? 'ring-2 ring-inset ring-rose-500/45'
          : ''

  return (
    <>
      <div
        className={`${nameColCell} min-w-0 border-t border-zinc-800/60 ${rowTone} has-[[data-grip-menu-open]]:opacity-100 has-[[data-grip-menu-open]]:z-[200] ${minionDropRing}`}
        style={{ gridColumn: 2, gridRow: gridRow }}
        data-testid="minion-drop-target"
        data-group-index={minionDrag?.groupIndex}
        data-monster-index={minionDrag?.monsterIndex}
        data-minion-index={minionDrag?.minionIndex}
        onDragOver={minionDrag?.onDragOver}
        onDragLeave={minionDrag?.onDragLeave}
        onDrop={minionDrag?.onDrop}
      >
        <div className={`flex min-h-0 min-w-0 flex-1 items-stretch gap-2 pl-6 sm:gap-3 ${deadDim}`}>
          {minionDrag != null && (
            <ReorderGripWithMenu
              reorderAriaLabel={`Reorder ${minion.name} within horde`}
              onDragStart={minionDrag.onDragStart}
              onDragEnd={minionDrag.onDragEnd}
              menuItems={minionGripMenuItems}
              className="group flex w-8 shrink-0 cursor-grab touch-none select-none items-center justify-center rounded-md border border-transparent transition-[background-color,border-color,box-shadow,color] duration-150 ease-out hover:border-zinc-700/45 hover:bg-zinc-800/55 hover:shadow-sm active:cursor-grabbing motion-reduce:transition-none sm:w-9"
              iconClassName="size-3.5 text-zinc-500 transition-colors group-hover:text-zinc-200"
            />
          )}
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-[0.65rem] font-semibold tabular-nums leading-none sm:size-8 sm:text-xs ${badge.border} ${badge.bg} ${badge.text}`}
              aria-label={`${minion.name}: creature ${creatureOrdinal} of ${totalCreatures} in encounter group ${groupNumber}`}
            >
              {creatureOrdinal}
            </span>
            <div className="min-w-0 flex-1">
              {onMinionStatCardClick ? (
                <button
                  type="button"
                  aria-expanded={monsterCardDrawerOpen}
                  aria-controls="monster-stat-card-drawer"
                  aria-label={`Stat card for ${minion.name}`}
                  onClick={onMinionStatCardClick}
                  className="block w-full min-w-0 cursor-pointer rounded-md px-3 py-2 text-left outline-none transition-[background-color,box-shadow,color] duration-150 ease-out motion-reduce:transition-none hover:bg-zinc-800/55 hover:shadow-sm hover:shadow-black/20 hover:[&>span]:text-amber-50/95 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950"
                >
                  <span
                    className={`block truncate text-sm font-medium leading-tight text-zinc-200 transition-colors duration-150 ${minion.dead ? 'line-through' : ''}`}
                  >
                    {minion.name}
                  </span>
                </button>
              ) : (
                <p
                  className={`truncate px-3 py-2 text-sm font-medium leading-tight text-zinc-200 transition-colors duration-150 ease-out motion-reduce:transition-none hover:text-amber-50/95 ${minion.dead ? 'line-through' : ''}`}
                >
                  {minion.name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        className={`${bodyCell} justify-center border-t border-zinc-800/60 ${rowTone}`}
        style={{ gridColumn: 3, gridRow: gridRow }}
      >
        <button
          type="button"
          aria-pressed={minion.dead}
          title={
            minion.dead
              ? 'Dead — click to mark alive'
              : 'Alive — click to mark dead'
          }
          aria-label={
            minion.dead
              ? `${minion.name}: dead. Click to mark alive.`
              : `${minion.name}: alive. Click to mark dead.`
          }
          onClick={() => onDeadChange(!minion.dead)}
          className={`inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1 outline-none transition-[color,transform,box-shadow] duration-200 ease-out motion-reduce:transition-none hover:brightness-125 active:scale-[0.93] focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
            minion.dead ? 'text-zinc-400' : 'text-rose-300'
          } ${
            lifeToggleCue === 'kill'
              ? 'z-[1] ring-2 ring-red-500/80 ring-offset-2 ring-offset-zinc-950 motion-safe:animate-glow-cue-kill motion-reduce:shadow-[0_0_10px_rgba(239,68,68,0.45)]'
              : lifeToggleCue === 'revive'
                ? 'z-[1] ring-2 ring-emerald-500/80 ring-offset-2 ring-offset-zinc-950 motion-safe:animate-glow-cue-revive motion-reduce:shadow-[0_0_10px_rgba(34,197,94,0.45)]'
                : ''
          }`}
        >
          {minion.dead ? (
            <StaminaSkullIcon className="size-5" />
          ) : (
            <StaminaHeartFullIcon className="size-5" />
          )}
        </button>
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
        <StatCluster fs={childCombat.fs} spd={childCombat.spd} stab={childCombat.stab} />
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
          seActPhaseGlow={seActPhaseGlow}
          onConfirmEot={onConfirmEot}
          isEotConfirmed={isEotConfirmed}
          conditionDnD={conditionDnD}
        />
      </div>
    </>
  )
}
