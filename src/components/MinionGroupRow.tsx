import { useState, useRef, useEffect, useCallback } from 'react'
import type { CaptainRef, ConditionState, EncounterGroup, GroupColorId, Monster } from '../types'
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
  allGroups,
  onCaptainChange,
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
  statBlockExpanded?: boolean
  onToggleStatBlock?: () => void
}) {
  const [sc, sm] = monster.stamina
  const badge = GROUP_COLOR_BADGE[groupColor]
  const colorLabel = GROUP_COLOR_LABEL[groupColor]
  const minions = monster.minions ?? []
  const hasFeatures = (monster.features?.length ?? 0) > 0

  const [captainDropdownOpen, setCaptainDropdownOpen] = useState(false)
  const captainDropdownRef = useRef<HTMLDivElement>(null)

  const closeCaptainDropdown = useCallback(() => setCaptainDropdownOpen(false), [])

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

  const candidateMonsters: { groupIndex: number; monsterIndex: number; name: string; ordinal: number; color: GroupColorId }[] = []
  if (allGroups) {
    for (let gi = 0; gi < allGroups.length; gi++) {
      const g = allGroups[gi]!
      for (let mi = 0; mi < g.monsters.length; mi++) {
        const m = g.monsters[mi]!
        if (m.minions && m.minions.length > 0) continue
        candidateMonsters.push({
          groupIndex: gi,
          monsterIndex: mi,
          name: m.name,
          ordinal: mi + 1,
          color: g.color,
        })
      }
    }
  }

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
            <div className="relative mt-1.5" ref={captainDropdownRef}>
              {captainMonster && captainGroupColor ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-zinc-800/80 px-2.5 py-0.5 text-xs leading-tight"
                  data-testid="captain-pill"
                >
                  <span className="text-[0.6rem] font-medium uppercase tracking-wider text-zinc-500">Captain</span>
                  <span
                    className={`inline-flex size-5 items-center justify-center rounded-full border text-[0.6rem] font-semibold tabular-nums leading-none ${GROUP_COLOR_BADGE[captainGroupColor].border} ${GROUP_COLOR_BADGE[captainGroupColor].bg} ${GROUP_COLOR_BADGE[captainGroupColor].text}`}
                  >
                    {captainRef!.monsterIndex + 1}
                  </span>
                  <span className="truncate text-zinc-200">{captainMonster.name}</span>
                  <button
                    type="button"
                    aria-label={`Change captain for ${monster.name}`}
                    onClick={() => setCaptainDropdownOpen((v) => !v)}
                    className="ml-0.5 cursor-pointer text-zinc-400 transition-colors hover:text-zinc-100"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3" aria-hidden>
                      <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L3.05 10.476a1 1 0 0 0-.27.481l-.57 2.565a.75.75 0 0 0 .897.897l2.565-.57a1 1 0 0 0 .481-.27l7.963-7.963a1.75 1.75 0 0 0 0-2.475l-.628-.628ZM11.72 3.22a.25.25 0 0 1 .354 0l.628.628a.25.25 0 0 1 0 .354L5.134 11.77l-1.27.282.282-1.27 7.574-7.562Z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove captain from ${monster.name}`}
                    data-testid="remove-captain"
                    onClick={() => onCaptainChange?.(null)}
                    className="ml-0.5 cursor-pointer text-zinc-500 transition-colors hover:text-red-400"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-3" aria-hidden>
                      <path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
                    </svg>
                  </button>
                </span>
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
                  className="absolute left-0 top-full z-50 mt-1 max-h-52 min-w-[14rem] overflow-y-auto rounded-lg border border-zinc-700/80 bg-zinc-900 shadow-xl"
                  role="listbox"
                  aria-label={`Select captain for ${monster.name}`}
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
