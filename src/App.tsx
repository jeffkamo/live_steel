import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Marip = readonly [number, number, number, number, number]

type ConditionState = 'neutral' | 'eot' | 'se'

type ConditionEntry = {
  label: string
  state: ConditionState
}

type Monster = {
  name: string
  subtitle: string
  initials: string
  stamina: [number, number]
  marip: Marip | null
  fs: number
  dist: number
  stab: number
  conditions: readonly ConditionEntry[]
}

type GroupColorId =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'white'
  | 'grey'
  | 'black'

const GROUP_COLOR_ORDER: readonly GroupColorId[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'white',
  'grey',
  'black',
] as const

const GROUP_COLOR_LABEL: Record<GroupColorId, string> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  pink: 'Pink',
  white: 'White',
  grey: 'Grey',
  black: 'Black',
}

/** Tailwind class bundles for creature ordinal rings (full strings for the compiler). */
const GROUP_COLOR_BADGE: Record<
  GroupColorId,
  { border: string; bg: string; text: string }
> = {
  red: {
    border: 'border-red-500/90',
    bg: 'bg-red-950/55',
    text: 'text-red-100',
  },
  orange: {
    border: 'border-orange-500/90',
    bg: 'bg-orange-950/55',
    text: 'text-orange-100',
  },
  yellow: {
    border: 'border-yellow-400/90',
    bg: 'bg-yellow-950/45',
    text: 'text-yellow-100',
  },
  green: {
    border: 'border-emerald-500/90',
    bg: 'bg-emerald-950/55',
    text: 'text-emerald-100',
  },
  blue: {
    border: 'border-sky-500/90',
    bg: 'bg-sky-950/55',
    text: 'text-sky-100',
  },
  purple: {
    border: 'border-violet-500/90',
    bg: 'bg-violet-950/55',
    text: 'text-violet-100',
  },
  pink: {
    border: 'border-pink-500/90',
    bg: 'bg-pink-950/55',
    text: 'text-pink-100',
  },
  white: {
    border: 'border-zinc-100/90',
    bg: 'bg-zinc-100/15',
    text: 'text-zinc-50',
  },
  grey: {
    border: 'border-zinc-400/90',
    bg: 'bg-zinc-800/65',
    text: 'text-zinc-200',
  },
  black: {
    border: 'border-zinc-600/95',
    bg: 'bg-black/80',
    text: 'text-zinc-300',
  },
}

const GROUP_COLOR_PREVIEW_HEX: Record<GroupColorId, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#0ea5e9',
  purple: '#8b5cf6',
  pink: '#ec4899',
  white: '#f4f4f5',
  grey: '#a1a1aa',
  black: '#18181b',
}

type EncounterGroup = {
  monsters: Monster[]
  color: GroupColorId
}

/** Static encounter data uses plain condition names; clone maps them to {@link ConditionEntry}. */
type MonsterSeed = Omit<Monster, 'conditions'> & { conditions: readonly string[] }

type EncounterGroupSeed = {
  monsters: readonly MonsterSeed[]
}

type TerrainRowState = {
  object: string
  stamina: [number, number]
  note: string
  conditions: readonly ConditionEntry[]
}

type TerrainRowSeed = Omit<TerrainRowState, 'conditions'> & { conditions: readonly string[] }

const ENCOUNTER_GROUPS: readonly EncounterGroupSeed[] = [
  {
    monsters: [
      {
        name: 'Goblin Assassin 1',
        subtitle: 'Level 1 Horde · Ambusher',
        initials: 'GA',
        stamina: [5, 15],
        marip: [-2, 2, 0, 0, -2],
        fs: -1,
        dist: 4,
        stab: 0,
        conditions: ['Weakened', 'Slowed'],
      },
      {
        name: 'Goblin Raider',
        subtitle: 'Level 1 Horde · Skirmisher',
        initials: 'GR',
        stamina: [8, 12],
        marip: [0, 1, 0, 0, 0],
        fs: 0,
        dist: 5,
        stab: 0,
        conditions: ['Grabbed'],
      },
    ],
  },
  {
    monsters: [
      {
        name: 'Goblin Underboss',
        subtitle: 'Level 2 Solo · Commander',
        initials: 'GU',
        stamina: [22, 22],
        marip: [0, 1, 1, 0, 1],
        fs: 2,
        dist: 5,
        stab: 1,
        conditions: ['Judged'],
      },
    ],
  },
  {
    monsters: [
      {
        name: 'Minions',
        subtitle: 'Horde · Captain: Goblin Assassin 1',
        initials: 'M',
        stamina: [12, 12],
        marip: [-1, 0, 0, 0, -1],
        fs: 0,
        dist: 3,
        stab: 0,
        conditions: ['Taunted'],
      },
    ],
  },
  {
    monsters: [
      {
        name: 'Ironwood Sentinel',
        subtitle: 'Level 3 Elite · Bruiser',
        initials: 'IS',
        stamina: [8, 24],
        marip: [2, -1, 0, 1, 2],
        fs: 1,
        dist: 2,
        stab: 2,
        conditions: ['Bleeding', 'Dazed'],
      },
      {
        name: 'Arcane Echo',
        subtitle: 'Level 2 Horde · Caster',
        initials: 'AE',
        stamina: [3, 10],
        marip: [1, 3, 2, 0, 1],
        fs: 3,
        dist: 6,
        stab: -1,
        conditions: ['Restrained'],
      },
      {
        name: 'Reserve slot',
        subtitle: 'Drop-in threat or hazard',
        initials: '—',
        stamina: [0, 0],
        marip: null,
        fs: 0,
        dist: 0,
        stab: 0,
        conditions: [],
      },
    ],
  },
] as const

const TERRAIN_ROWS: readonly TerrainRowSeed[] = [
  {
    object: 'Toppled barricade — light cover along the eastern lane.',
    stamina: [6, 8] as const,
    note: 'Burning; end of round 1d4 to adjacent.',
    conditions: ['Slowed', 'Weakened'],
  },
  {
    object: 'Ritual circle (inactive). Chalk smeared, runes still warm.',
    stamina: [0, 0] as const,
    note: 'Anyone ending turn inside tests Stability (15+).',
    conditions: ['Marked'],
  },
] as const

function conditionEntryFromLabel(label: string): ConditionEntry {
  return { label, state: 'neutral' }
}

function cloneEncounterGroups(): EncounterGroup[] {
  return ENCOUNTER_GROUPS.map((group, groupIndex) => ({
    color: GROUP_COLOR_ORDER[groupIndex % GROUP_COLOR_ORDER.length]!,
    monsters: group.monsters.map((m) => ({
      name: m.name,
      subtitle: m.subtitle,
      initials: m.initials,
      stamina: [m.stamina[0], m.stamina[1]] as [number, number],
      marip: m.marip === null ? null : ([...m.marip] as unknown as Marip),
      fs: m.fs,
      dist: m.dist,
      stab: m.stab,
      conditions: m.conditions.map(conditionEntryFromLabel),
    })),
  }))
}

function cloneTerrainRows(): TerrainRowState[] {
  return TERRAIN_ROWS.map((r) => ({
    object: r.object,
    stamina: [r.stamina[0], r.stamina[1]] as [number, number],
    note: r.note,
    conditions: r.conditions.map(conditionEntryFromLabel),
  }))
}

/** Master list for the add-condition picker (sorted for stable UI). */
const CONDITION_CATALOG: readonly string[] = [
  'Bleeding',
  'Dazed',
  'Frightened',
  'Grabbed',
  'Judged',
  'Marked',
  'Prone',
  'Restrained',
  'Slowed',
  'Surprised',
  'Taunted',
  'Weakened',
].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

function findConditionOnMonster(
  conditions: readonly ConditionEntry[],
  label: string,
): ConditionEntry | undefined {
  return conditions.find((c) => c.label === label)
}

/** 6 columns: group | creatures | stamina | characteristics (MARIP) | FS/Dist/Stab | conditions */
const ROSTER_GRID_TEMPLATE =
  '5.5rem minmax(0,1.25fr) minmax(5.25rem,7rem) minmax(5.75rem,7.25rem) 7.25rem minmax(0,1.05fr)'

const terrainGridClass = 'grid grid-cols-[minmax(0,1.35fr)_minmax(4.5rem,6.5rem)_minmax(0,1.2fr)]'

function TitleRule({ flushBelow = false }: { flushBelow?: boolean } = {}) {
  return (
    <div
      className={`flex w-full items-center gap-0 px-1 ${flushBelow ? 'pt-2 pb-0' : 'py-2'}`}
      aria-hidden
    >
      <div className="h-px flex-1 bg-zinc-400/65" />
      <div
        className="mx-2 size-2 shrink-0 rotate-45 border border-zinc-400/75 bg-zinc-950"
        style={{ marginTop: '-1px' }}
      />
      <div className="h-px flex-1 bg-zinc-400/65" />
    </div>
  )
}

const staminaHeartPath =
  'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'

const STAMINA_LABEL_HEALTHY = 'Healthy'
const STAMINA_LABEL_WINDED = 'Winded'
const STAMINA_LABEL_DEAD = 'Dead / unconscious'

type StaminaGlyphStatus = 'none' | 'dead' | 'winded' | 'healthy'

function staminaGlyphStatus(current: number, max: number): StaminaGlyphStatus {
  if (max === 0) {
    return 'none'
  }
  if (current === 0) {
    return 'dead'
  }
  if (current <= Math.floor(max / 2)) {
    return 'winded'
  }
  return 'healthy'
}

function StaminaIcon({
  className,
  broken,
  ariaLabel,
}: {
  className?: string
  broken?: boolean
  ariaLabel: string
}) {
  const clipLeftId = useId()
  const clipRightId = useId()

  if (!broken) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="currentColor"
        role="img"
        aria-label={ariaLabel}
      >
        <path d={staminaHeartPath} />
      </svg>
    )
  }

  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label={ariaLabel}
    >
      <defs>
        <clipPath id={clipLeftId}>
          <rect x="0" y="0" width="11.4" height="24" />
        </clipPath>
        <clipPath id={clipRightId}>
          <rect x="12.6" y="0" width="12" height="24" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipLeftId})`} transform="translate(-0.55 0)">
        <path d={staminaHeartPath} />
      </g>
      <g clipPath={`url(#${clipRightId})`} transform="translate(0.55 0)">
        <path d={staminaHeartPath} />
      </g>
    </svg>
  )
}

/** Filled skull (Material Symbols outline, 960×960 art scaled by viewBox). */
function SkullIcon({ className, ariaLabel }: { className?: string; ariaLabel: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 960 960"
      fill="currentColor"
      role="img"
      aria-label={ariaLabel}
    >
      <path d="M240 880V710q-39-17-68.5-45.5T121.5 600q-20.5-36-31-77T80 440q0-158 112-259T480 80q176 0 288 101t112 259q0 42-10.5 83T838.5 600q-20.5 36-50 64.5T720 710v170H240zm80-80h40v-80h80v80h80v-80h80v80h40V658q38-9 67.5-30t50.5-50q21-29 31.5-64T800 440q0-125-88.5-202.5T480 160q-143 0-231.5 77.5T160 440q0 39 11 74t31.5 64q20.5 29 50.5 50t67 30v142zm120-200h120l-60-120-60 120zm-80-80q33 0 56.5-23.5T420 440q0-33-23.5-56.5T340 360q-33 0-56.5 23.5T260 440q0 33 23.5 56.5T340 520zm280 0q33 0 56.5-23.5T700 440q0-33-23.5-56.5T620 360q-33 0-56.5 23.5T540 440q0 33 23.5 56.5T620 520z" />
    </svg>
  )
}

function StaminaGlyph({ className, status }: { className: string; status: StaminaGlyphStatus }) {
  if (status === 'none') {
    return null
  }
  const label =
    status === 'dead'
      ? STAMINA_LABEL_DEAD
      : status === 'winded'
        ? STAMINA_LABEL_WINDED
        : STAMINA_LABEL_HEALTHY
  const wrapClass = 'pointer-events-auto inline-flex shrink-0'
  if (status === 'dead') {
    return (
      <span className={wrapClass} title={label}>
        <SkullIcon className={className} ariaLabel={label} />
      </span>
    )
  }
  return (
    <span className={wrapClass} title={label}>
      <StaminaIcon className={className} broken={status === 'winded'} ariaLabel={label} />
    </span>
  )
}

function normalizeStamina(cur: number, max: number): [number, number] {
  const m = Math.max(0, Math.round(max))
  if (m === 0) {
    return [0, 0]
  }
  const c = Math.min(m, Math.max(0, Math.round(cur)))
  return [c, m]
}

function applyStaminaDelta(current: number, max: number, delta: number): [number, number] {
  if (max === 0 && current === 0) {
    if (delta <= 0) {
      return [0, 0]
    }
    const v = Math.abs(delta)
    return [v, v]
  }
  if (max === 0) {
    return [0, 0]
  }
  return normalizeStamina(current + delta, max)
}

const staminaBumpMinusClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-500/75 bg-zinc-800/40 font-sans text-[0.58rem] font-semibold tabular-nums text-zinc-300 transition-colors hover:border-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 active:bg-zinc-900 sm:h-9 sm:w-9 sm:text-[0.62rem]'

const staminaBumpPlusClass =
  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-zinc-200/85 bg-zinc-800/30 font-sans text-[0.58rem] font-semibold tabular-nums text-zinc-50 transition-colors hover:border-white hover:bg-zinc-700/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 active:bg-zinc-900 sm:h-9 sm:w-9 sm:text-[0.62rem]'

const staminaInlineInputClass =
  'w-9 min-w-[2.25rem] max-w-[3.5rem] rounded border-0 bg-transparent py-0.5 text-center font-sans text-xs font-medium tabular-nums text-zinc-950 outline-none ring-0 focus:ring-0 [appearance:textfield] sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

function EditableStaminaCell({
  current,
  max,
  onChange,
  ariaLabel,
}: {
  current: number
  max: number
  onChange: (next: [number, number]) => void
  ariaLabel: string
}) {
  const curFieldId = useId()
  const maxFieldId = useId()
  const [draftCur, setDraftCur] = useState(String(current))
  const [draftMax, setDraftMax] = useState(String(max))

  useEffect(() => {
    setDraftCur(String(current))
    setDraftMax(String(max))
  }, [current, max])

  const commitDraft = useCallback(() => {
    const c = Number.parseInt(draftCur, 10)
    const m = Number.parseInt(draftMax, 10)
    if (Number.isNaN(c) || Number.isNaN(m)) {
      setDraftCur(String(current))
      setDraftMax(String(max))
      return
    }
    onChange(normalizeStamina(c, m))
  }, [draftCur, draftMax, current, max, onChange])

  const bump = (delta: number) => {
    onChange(applyStaminaDelta(current, max, delta))
  }

  const empty = max === 0 && current === 0
  const glyphStatus = staminaGlyphStatus(current, max)

  const baseTextClass =
    'pointer-events-none flex min-h-[2.5rem] w-full items-center justify-center px-1 text-center transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0'

  const editorOverlayClass =
    'pointer-events-none absolute left-1/2 top-1/2 z-50 w-max max-w-[min(22rem,calc(100vw-1.25rem))] -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100'

  return (
    <div
      className="group relative isolate flex w-full min-h-[2.5rem] justify-center rounded-md outline-none focus-within:ring-2 focus-within:ring-amber-500/45 focus-within:ring-offset-2 focus-within:ring-offset-zinc-950"
      aria-label={ariaLabel}
      role="group"
    >
      <div className={baseTextClass}>
        {empty ? (
          <span className="text-sm text-zinc-400">—</span>
        ) : (
          <div className="flex items-center justify-center gap-1.5 tabular-nums">
            <span className="text-sm text-zinc-50">
              {current} / {max}
            </span>
            <StaminaGlyph
              status={glyphStatus}
              className={
                glyphStatus === 'dead'
                  ? 'size-4 shrink-0 text-zinc-400'
                  : 'size-4 shrink-0 text-rose-300'
              }
            />
          </div>
        )}
      </div>
      <div role="dialog" aria-label={`${ariaLabel} — adjust values`} className={editorOverlayClass}>
        <div className="flex flex-nowrap items-center gap-2 rounded-lg border border-zinc-500/80 bg-zinc-900 py-1.5 pl-2 pr-2 shadow-xl shadow-black/50 ring-1 ring-black/20">
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className={staminaBumpMinusClass}
              aria-label="Decrease stamina by 10"
              onClick={() => bump(-10)}
            >
              −10
            </button>
            <button
              type="button"
              className={staminaBumpMinusClass}
              aria-label="Decrease stamina by 1"
              onClick={() => bump(-1)}
            >
              −1
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-md bg-zinc-100 px-2 py-1 shadow-inner shadow-zinc-300/30">
            <label className="sr-only" htmlFor={curFieldId}>
              Current stamina
            </label>
            <input
              id={curFieldId}
              type="number"
              inputMode="numeric"
              min={0}
              className={staminaInlineInputClass}
              value={draftCur}
              onChange={(e) => setDraftCur(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
            />
            <span className="select-none text-sm text-zinc-500" aria-hidden>
              /
            </span>
            <label className="sr-only" htmlFor={maxFieldId}>
              Max stamina
            </label>
            <input
              id={maxFieldId}
              type="number"
              inputMode="numeric"
              min={0}
              className={staminaInlineInputClass}
              value={draftMax}
              onChange={(e) => setDraftMax(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.currentTarget.blur()
                }
              }}
            />
            <StaminaGlyph
              status={glyphStatus}
              className={
                glyphStatus === 'dead'
                  ? 'ml-0.5 size-4 shrink-0 text-zinc-600'
                  : 'ml-0.5 size-4 shrink-0 text-rose-400'
              }
            />
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              className={staminaBumpPlusClass}
              aria-label="Increase stamina by 1"
              onClick={() => bump(1)}
            >
              +1
            </button>
            <button
              type="button"
              className={staminaBumpPlusClass}
              aria-label="Increase stamina by 10"
              onClick={() => bump(10)}
            >
              +10
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const MARIP_HEADERS = [
  { letter: 'M', title: 'Might' },
  { letter: 'A', title: 'Agility' },
  { letter: 'R', title: 'Reason' },
  { letter: 'I', title: 'Intuition' },
  { letter: 'P', title: 'Presence' },
] as const

function MaripCluster({ values }: { values: Marip | null }) {
  const track = 'grid w-full min-w-0 grid-cols-5 gap-x-0.5 text-center'
  return (
    <div
      className="flex w-full min-w-0 flex-col justify-center gap-0"
      role="group"
      aria-label="Characteristics (MARIP)"
    >
      <div
        className={`${track} pb-0.5 text-[0.55rem] uppercase tracking-wide text-zinc-300 sm:text-[0.6rem]`}
      >
        {MARIP_HEADERS.map(({ letter, title }) => (
          <span key={letter} title={title}>
            {letter}
          </span>
        ))}
      </div>
      <div className={`${track} pt-0.5 tabular-nums text-xs text-zinc-50 sm:text-sm`}>
        {values === null
          ? MARIP_HEADERS.map(({ letter }) => (
              <span key={`${letter}-val`} className="text-zinc-400">
                —
              </span>
            ))
          : values.map((v, i) => <span key={i}>{v}</span>)}
      </div>
    </div>
  )
}

function StatCluster({ fs, dist, stab }: { fs: number; dist: number; stab: number }) {
  const track = 'grid w-full min-w-0 grid-cols-3 gap-x-1 text-center'
  return (
    <div className="flex w-full min-w-0 flex-col justify-center gap-0">
      <div className={`${track} pb-0.5 text-[0.6rem] uppercase tracking-wide text-zinc-300`}>
        <span title="Free strike">FS</span>
        <span title="Distance">Dist</span>
        <span title="Stability">Stab</span>
      </div>
      <div className={`${track} pt-0.5 tabular-nums text-sm text-zinc-50`}>
        <span>{fs}</span>
        <span>{dist}</span>
        <span>{stab}</span>
      </div>
    </div>
  )
}

function nextConditionState(state: ConditionState): ConditionState {
  if (state === 'neutral') {
    return 'eot'
  }
  if (state === 'eot') {
    return 'se'
  }
  return 'neutral'
}

function conditionStateAbbrev(state: ConditionState): string | null {
  if (state === 'eot') {
    return 'EoT'
  }
  if (state === 'se') {
    return 'SE'
  }
  return null
}

function conditionStateSpoken(state: ConditionState): string {
  if (state === 'neutral') {
    return 'neutral'
  }
  if (state === 'eot') {
    return 'end of turn'
  }
  return 'save ends'
}

function conditionStateTitle(state: ConditionState): string | undefined {
  if (state === 'eot') {
    return 'End of turn'
  }
  if (state === 'se') {
    return 'Save ends'
  }
  return undefined
}

function conditionPillShellClass(state: ConditionState): string {
  if (state === 'neutral') {
    return 'border border-zinc-600/85 bg-zinc-800/95'
  }
  return 'border border-amber-500/80 bg-amber-500/15'
}

function ConditionPills({
  conditions,
  onRemove,
  onCycleState,
}: {
  conditions: readonly ConditionEntry[]
  onRemove?: (index: number) => void
  onCycleState?: (index: number) => void
}) {
  if (conditions.length === 0) {
    return (
      <p className="w-full text-left font-sans text-[0.7rem] italic text-zinc-400">No active conditions</p>
    )
  }
  const pillText = 'font-sans text-[0.65rem] tracking-tight'
  return (
    <div className="flex w-full flex-wrap content-center items-center justify-start gap-2">
      {conditions.map((c, i) => {
        const abbrev = conditionStateAbbrev(c.state)
        const shell = conditionPillShellClass(c.state)
        const labelTone = c.state === 'neutral' ? 'text-zinc-100' : 'text-amber-100'
        const abbrevTone =
          c.state === 'neutral' ? 'text-zinc-400' : 'text-amber-200/90'
        const removeBtnClass =
          c.state === 'neutral'
            ? 'text-zinc-400 transition-colors hover:bg-zinc-700/90 hover:text-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-amber-600/70'
            : 'text-amber-300/85 transition-colors hover:bg-amber-500/25 hover:text-amber-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-amber-600/70'
        if (onRemove) {
          const pillHover =
            onCycleState != null
              ? 'motion-reduce:transition-none transition-[outline-color] duration-150 ease-out outline outline-2 outline-transparent outline-offset-1 hover:outline-amber-500/60'
              : ''
          return (
            <div
              key={`${i}-${c.label}`}
              className={`inline-flex max-w-full items-center gap-0 rounded-full py-0.5 pl-0 pr-0.5 ${pillText} font-medium ${shell} ${pillHover}`}
              onClick={(e) => e.stopPropagation()}
            >
              {onCycleState ? (
                <button
                  type="button"
                  onClick={() => onCycleState(i)}
                  aria-label={`${c.label}, ${conditionStateSpoken(c.state)}. Cycle duration`}
                  className="inline-flex min-w-0 max-w-full cursor-pointer items-baseline gap-0 rounded-l-full py-0.5 pl-2.5 pr-1 text-left transition-colors focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-amber-600/70"
                >
                  <span className={`min-w-0 truncate font-medium ${labelTone}`}>{c.label}</span>
                  {abbrev ? (
                    <span
                      className={`ml-1 shrink-0 font-normal ${abbrevTone} ${pillText}`}
                      title={conditionStateTitle(c.state)}
                      aria-hidden
                    >
                      · {abbrev}
                    </span>
                  ) : null}
                </button>
              ) : (
                <span
                  className={`inline-flex min-w-0 max-w-full items-baseline py-0.5 pl-2.5 pr-1 ${labelTone}`}
                >
                  <span className={`min-w-0 truncate font-medium ${labelTone}`}>{c.label}</span>
                  {abbrev ? (
                    <span
                      className={`ml-1 shrink-0 font-normal ${abbrevTone} ${pillText}`}
                      title={conditionStateTitle(c.state)}
                      aria-hidden
                    >
                      · {abbrev}
                    </span>
                  ) : null}
                </span>
              )}
              <button
                type="button"
                onClick={() => onRemove(i)}
                aria-label={`Remove ${c.label}`}
                className={`flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full text-[0.7rem] leading-none ${removeBtnClass}`}
              >
                <span aria-hidden>×</span>
              </button>
            </div>
          )
        }
        return (
          <span
            key={`${i}-${c.label}`}
            className={`inline-flex max-w-full items-baseline rounded-full px-2.5 py-0.5 ${pillText} font-medium ${shell} ${labelTone}`}
          >
            <span className={`min-w-0 truncate font-medium ${labelTone}`}>{c.label}</span>
            {abbrev ? (
              <span
                className={`ml-1 shrink-0 font-normal ${abbrevTone} ${pillText}`}
                title={conditionStateTitle(c.state)}
                aria-hidden
              >
                · {abbrev}
              </span>
            ) : null}
          </span>
        )
      })}
    </div>
  )
}

const conditionPickerRowBtn =
  'rounded-md px-2 py-1.5 text-left font-sans text-[0.72rem] font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-amber-600/70'

const conditionPickerDurationPill =
  'shrink-0 rounded-full border px-1.5 py-0.5 font-sans text-[0.58rem] font-semibold tabular-nums transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-amber-600/70'

const groupColorPickerRowBtn =
  'flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left font-sans text-[0.72rem] font-medium text-zinc-100 transition-colors hover:bg-zinc-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-0 focus-visible:outline-amber-600/70'

function GroupColorPreview({ colorId }: { colorId: GroupColorId }) {
  return (
    <span
      className="size-3.5 shrink-0 rounded-sm border border-zinc-600/90 shadow-inner shadow-black/30"
      style={{ backgroundColor: GROUP_COLOR_PREVIEW_HEX[colorId] }}
      aria-hidden
    />
  )
}

function GroupColorSwapIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
    </svg>
  )
}

function otherGroupIndexForColor(
  colorId: GroupColorId,
  encounterGroupColors: readonly GroupColorId[],
  thisGroupIndex: number,
): number | null {
  const idx = encounterGroupColors.findIndex((c, i) => i !== thisGroupIndex && c === colorId)
  return idx >= 0 ? idx : null
}

type GroupColorMenuState = {
  open: boolean
  anchor: HTMLElement | null
  monsterIndex: number | null
}

function GroupColorPickerPopover({
  open,
  anchor,
  groupKey,
  groupNumber,
  thisGroupIndex,
  encounterGroupColors,
  currentColor,
  onSelectColor,
  onClose,
}: {
  open: boolean
  anchor: HTMLElement | null
  groupKey: string
  groupNumber: number
  thisGroupIndex: number
  encounterGroupColors: readonly GroupColorId[]
  currentColor: GroupColorId
  onSelectColor: (color: GroupColorId) => void
  onClose: () => void
}) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null)
  const [hoverRowColorId, setHoverRowColorId] = useState<GroupColorId | null>(null)

  useLayoutEffect(() => {
    if (!open || !anchor) {
      setCoords(null)
      return
    }
    const place = () => {
      const r = anchor.getBoundingClientRect()
      setCoords({ top: r.bottom + 4, left: r.left + r.width / 2 })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, anchor])

  useEffect(() => {
    if (!open) {
      return
    }
    const onDocMouseDown = (e: MouseEvent) => {
      const el = e.target as HTMLElement
      if (menuRef.current?.contains(el)) {
        return
      }
      if (el.closest(`[data-group-color-trigger="${groupKey}"]`)) {
        return
      }
      onClose()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, groupKey, onClose])

  useEffect(() => {
    if (!open) {
      setHoverRowColorId(null)
    }
  }, [open])

  if (!open || !coords) {
    return null
  }

  const otherOwnerOfHovered =
    hoverRowColorId !== null
      ? otherGroupIndexForColor(hoverRowColorId, encounterGroupColors, thisGroupIndex)
      : null
  const hoverWouldSwap =
    hoverRowColorId !== null &&
    hoverRowColorId !== currentColor &&
    otherOwnerOfHovered !== null

  return createPortal(
    <div
      ref={menuRef}
      data-group-color-picker
      style={{
        position: 'fixed',
        top: coords.top,
        left: coords.left,
        transform: 'translateX(-50%)',
        zIndex: 200,
      }}
      className="w-[min(15.5rem,calc(100vw-2rem))] max-h-[min(20rem,50vh)] overflow-y-auto rounded-lg border border-zinc-500/75 bg-zinc-900 py-1.5 pl-2 pr-1.5 shadow-xl shadow-black/50 ring-1 ring-black/25"
      role="dialog"
      aria-label={`Choose color for encounter group ${groupNumber}`}
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="flex flex-col gap-0.5" role="list">
        {GROUP_COLOR_ORDER.map((id) => {
          const selected = id === currentColor
          const otherOwner = otherGroupIndexForColor(id, encounterGroupColors, thisGroupIndex)
          const inUseElsewhere = otherOwner !== null
          const ownerGroupNumber = otherOwner !== null ? otherOwner + 1 : null
          const showSwapIcon =
            hoverWouldSwap && (id === hoverRowColorId || id === currentColor)
          const conflictingGroupNumber =
            otherOwnerOfHovered !== null ? otherOwnerOfHovered + 1 : null

          let rowTitle: string | undefined
          if (hoverWouldSwap && id === hoverRowColorId && conflictingGroupNumber !== null) {
            rowTitle = `Swap with group ${conflictingGroupNumber}: they receive ${GROUP_COLOR_LABEL[currentColor]}, you receive ${GROUP_COLOR_LABEL[id]}.`
          } else if (hoverWouldSwap && id === currentColor && conflictingGroupNumber !== null) {
            rowTitle = `${GROUP_COLOR_LABEL[currentColor]} would move to group ${conflictingGroupNumber}.`
          } else if (inUseElsewhere && ownerGroupNumber !== null) {
            rowTitle = `Used by group ${ownerGroupNumber}. Click to swap colors.`
          }

          return (
            <li
              key={id}
              onMouseEnter={() => setHoverRowColorId(id)}
              onMouseLeave={() => setHoverRowColorId(null)}
            >
              <button
                type="button"
                title={rowTitle}
                className={`${groupColorPickerRowBtn} relative ${selected ? 'bg-zinc-800/90' : ''} ${
                  showSwapIcon ? 'bg-amber-950/35 ring-1 ring-amber-500/45' : ''
                }`}
                onClick={() => {
                  onSelectColor(id)
                  onClose()
                }}
              >
                <GroupColorPreview colorId={id} />
                <span className="min-w-0 flex-1">{GROUP_COLOR_LABEL[id]}</span>
                {inUseElsewhere && ownerGroupNumber !== null ? (
                  <span
                    className="shrink-0 rounded border border-zinc-600/70 px-1 py-px font-sans text-[0.55rem] font-semibold tabular-nums uppercase tracking-wide text-zinc-500"
                    aria-label={`Color in use by group ${ownerGroupNumber}`}
                  >
                    G{ownerGroupNumber}
                  </span>
                ) : null}
                {showSwapIcon ? (
                  <span
                    className="flex size-5 shrink-0 items-center justify-center text-amber-400/95"
                    title="Swap colors"
                  >
                    <GroupColorSwapIcon className="size-4" />
                  </span>
                ) : (
                  <span className="size-5 shrink-0" aria-hidden />
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </div>,
    document.body,
  )
}

function CreatureConditionCell({
  monsterName,
  conditions,
  onRemove,
  onCycleState,
  onAddOrSetCondition,
  turnComplete,
}: {
  monsterName: string
  conditions: readonly ConditionEntry[]
  onRemove: (index: number) => void
  onCycleState: (index: number) => void
  onAddOrSetCondition: (label: string, state: ConditionState) => void
  turnComplete: boolean
}) {
  const [open, setOpen] = useState(false)
  const cellRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) {
      return
    }
    const onDocMouseDown = (e: MouseEvent) => {
      const el = cellRef.current
      if (el && !el.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const rowTone =
    'transition-opacity duration-200 ease-out motion-reduce:transition-none ' +
    (turnComplete ? 'opacity-[0.52]' : 'opacity-100')

  return (
    <div
      ref={cellRef}
      className={`relative flex h-full min-h-0 w-full min-w-0 cursor-pointer flex-col justify-center rounded-md p-3 outline-none transition-[background-color] duration-200 ease-out motion-reduce:transition-none hover:bg-zinc-800/35 focus-visible:ring-2 focus-visible:ring-amber-500/45 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 sm:p-3.5 ${rowTone}`}
      role="group"
      tabIndex={0}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={`Conditions for ${monsterName}. Activate to add a condition.`}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setOpen((o) => !o)
        }
      }}
    >
      <div className="flex w-full min-w-0 flex-col justify-center">
        <ConditionPills
          conditions={conditions}
          onRemove={onRemove}
          onCycleState={onCycleState}
        />
      </div>
      {open ? (
        <div
          data-condition-picker
          className="absolute left-0 top-full z-50 mt-1 w-[min(20rem,calc(100vw-2rem))] max-h-[min(22rem,55vh)] overflow-y-auto rounded-lg border border-zinc-500/75 bg-zinc-900 py-1.5 pl-2 pr-1.5 shadow-xl shadow-black/50 ring-1 ring-black/25"
          role="dialog"
          aria-label={`Add condition to ${monsterName}`}
          onClick={(e) => e.stopPropagation()}
        >
          <ul className="flex flex-col gap-0.5" role="list">
            {CONDITION_CATALOG.map((label) => {
              const active = findConditionOnMonster(conditions, label)
              const dimmed = active !== undefined
              return (
                <li key={label}>
                  <div
                    className={`flex items-center gap-1.5 rounded-md py-0.5 pl-1 pr-0.5 ${dimmed ? 'opacity-50' : ''}`}
                  >
                    <button
                      type="button"
                      className={`${conditionPickerRowBtn} min-w-0 flex-1 truncate text-zinc-100 hover:bg-zinc-800/80 ${dimmed ? 'text-zinc-400' : ''}`}
                      onClick={() => {
                        onAddOrSetCondition(label, 'neutral')
                        setOpen(false)
                      }}
                    >
                      {label}
                    </button>
                    <button
                      type="button"
                      title="End of turn"
                      aria-label={`Add ${label} as end of turn on ${monsterName}`}
                      className={`${conditionPickerDurationPill} ${
                        active?.state === 'eot'
                          ? 'border-amber-500/80 bg-amber-500/15 text-amber-200'
                          : 'border-zinc-600/90 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200'
                      }`}
                      onClick={() => {
                        onAddOrSetCondition(label, 'eot')
                        setOpen(false)
                      }}
                    >
                      EoT
                    </button>
                    <button
                      type="button"
                      title="Save ends"
                      aria-label={`Add ${label} as save ends on ${monsterName}`}
                      className={`${conditionPickerDurationPill} ${
                        active?.state === 'se'
                          ? 'border-amber-500/80 bg-amber-500/15 text-amber-200'
                          : 'border-zinc-600/90 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-200'
                      }`}
                      onClick={() => {
                        onAddOrSetCondition(label, 'se')
                        setOpen(false)
                      }}
                    >
                      SE
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

function TurnColumnCell({
  acted,
  onToggle,
  label,
}: {
  acted: boolean
  onToggle: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={acted}
      aria-label={label}
      className={`flex min-h-0 w-full min-w-0 flex-1 flex-col items-center justify-center gap-2 px-2 py-3 text-center transition-[opacity,background-color] duration-200 ease-out motion-reduce:transition-none hover:bg-zinc-800/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500/70 sm:px-3 sm:py-4 ${
        acted ? 'opacity-[0.52]' : 'opacity-100'
      }`}
    >
      <span className="text-[0.65rem] uppercase tracking-wide text-zinc-300">Turn</span>
      <span
        className={`inline-block size-2 shrink-0 rotate-45 border border-zinc-400/75 transition-colors ${
          acted ? 'bg-zinc-400/80' : 'bg-zinc-950'
        }`}
        aria-hidden
      />
    </button>
  )
}

function GroupTurnColumn({
  gridRowSpan,
  acted,
  onToggle,
  turnAriaLabel,
}: {
  gridRowSpan: number
  acted: boolean
  onToggle: () => void
  turnAriaLabel: string
}) {
  return (
    <div
      style={{ gridColumn: 1, gridRow: `1 / span ${gridRowSpan}` }}
      className="flex min-h-0 w-full min-w-0 flex-col overflow-visible"
    >
      <TurnColumnCell acted={acted} onToggle={onToggle} label={turnAriaLabel} />
    </div>
  )
}

function MonsterRowCells({
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
  onConditionCycleState,
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
  onConditionCycleState: (conditionIndex: number) => void
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
      <div className={`${bodyCell} ${rowTone}`} style={{ gridColumn: 2, gridRow: row }}>
        <div className="flex w-full items-center gap-3">
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
            <p className="font-medium leading-tight text-zinc-50">{monster.name}</p>
            <p className="mt-1 text-[0.7rem] leading-snug text-zinc-400">{monster.subtitle}</p>
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
          onCycleState={onConditionCycleState}
          onAddOrSetCondition={onConditionAddOrSet}
          turnComplete={turnComplete}
        />
      </div>
    </>
  )
}

function GroupSection({
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
  onMonsterConditionCycleState,
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
  onMonsterConditionCycleState: (monsterIndex: number, conditionIndex: number) => void
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
          onConditionCycleState={(ci) => onMonsterConditionCycleState(i, ci)}
          onConditionAddOrSet={(label, state) => onMonsterConditionAddOrSet(i, label, state)}
        />
      ))}
    </div>
  )
}

function TerrainRow({
  row,
  onStaminaChange,
}: {
  row: TerrainRowState
  onStaminaChange: (next: [number, number]) => void
}) {
  const [tc, tm] = row.stamina
  return (
    <div className={`${terrainGridClass} overflow-visible rounded-lg bg-zinc-900/80`}>
      <div className="flex h-full min-h-[3.75rem] items-center p-3 sm:min-h-[4rem] sm:p-3.5">
        <p className="text-[0.8rem] leading-relaxed text-zinc-100">{row.object}</p>
      </div>
      <div className="relative z-0 flex h-full min-h-[3.75rem] items-center justify-center overflow-visible p-3 hover:z-20 focus-within:z-20 sm:min-h-[4rem] sm:p-3.5">
        <EditableStaminaCell
          current={tc}
          max={tm}
          onChange={onStaminaChange}
          ariaLabel={`Edit stamina for terrain: ${row.object.slice(0, 48)}${row.object.length > 48 ? '…' : ''}`}
        />
      </div>
      <div className="flex h-full min-h-[3.75rem] flex-col justify-center gap-3 p-3 sm:min-h-[4rem] sm:p-3.5">
        <p className="text-[0.75rem] leading-snug text-zinc-400">{row.note}</p>
        <ConditionPills conditions={row.conditions} />
      </div>
    </div>
  )
}

function App() {
  const [encounterGroups, setEncounterGroups] = useState(cloneEncounterGroups)
  const [terrainRows, setTerrainRows] = useState(cloneTerrainRows)

  const [groupTurnActed, setGroupTurnActed] = useState(() =>
    ENCOUNTER_GROUPS.map(() => false),
  )

  const patchMonsterStamina = useCallback(
    (groupIndex: number, monsterIndex: number, stamina: [number, number]) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) {
            return g
          }
          return {
            ...g,
            monsters: g.monsters.map((m, mi) =>
              mi === monsterIndex ? { ...m, stamina: [stamina[0], stamina[1]] } : m,
            ),
          }
        }),
      )
    },
    [],
  )

  const patchMonsterConditionRemove = useCallback(
    (groupIndex: number, monsterIndex: number, conditionIndex: number) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) {
            return g
          }
          return {
            ...g,
            monsters: g.monsters.map((m, mi) => {
              if (mi !== monsterIndex) {
                return m
              }
              return {
                ...m,
                conditions: m.conditions.filter((_, ci) => ci !== conditionIndex),
              }
            }),
          }
        }),
      )
    },
    [],
  )

  const patchMonsterConditionCycleState = useCallback(
    (groupIndex: number, monsterIndex: number, conditionIndex: number) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) {
            return g
          }
          return {
            ...g,
            monsters: g.monsters.map((m, mi) => {
              if (mi !== monsterIndex) {
                return m
              }
              return {
                ...m,
                conditions: m.conditions.map((c, ci) =>
                  ci === conditionIndex ? { ...c, state: nextConditionState(c.state) } : c,
                ),
              }
            }),
          }
        }),
      )
    },
    [],
  )

  const patchMonsterConditionAddOrSet = useCallback(
    (groupIndex: number, monsterIndex: number, label: string, state: ConditionState) => {
      setEncounterGroups((prev) =>
        prev.map((g, gi) => {
          if (gi !== groupIndex) {
            return g
          }
          return {
            ...g,
            monsters: g.monsters.map((m, mi) => {
              if (mi !== monsterIndex) {
                return m
              }
              const idx = m.conditions.findIndex((c) => c.label === label)
              if (idx >= 0) {
                return {
                  ...m,
                  conditions: m.conditions.map((c, ci) =>
                    ci === idx ? { ...c, state } : c,
                  ),
                }
              }
              return {
                ...m,
                conditions: [...m.conditions, { label, state }],
              }
            }),
          }
        }),
      )
    },
    [],
  )

  const patchTerrainStamina = useCallback((rowIndex: number, stamina: [number, number]) => {
    setTerrainRows((prev) =>
      prev.map((r, ri) =>
        ri === rowIndex ? { ...r, stamina: [stamina[0], stamina[1]] } : r,
      ),
    )
  }, [])

  const patchGroupColor = useCallback((groupIndex: number, newColor: GroupColorId) => {
    setEncounterGroups((prev) => {
      const otherIdx = prev.findIndex((g, i) => i !== groupIndex && g.color === newColor)
      if (otherIdx < 0) {
        return prev.map((g, i) => (i === groupIndex ? { ...g, color: newColor } : g))
      }
      const oldColor = prev[groupIndex]?.color
      if (oldColor === undefined) {
        return prev
      }
      return prev.map((g, i) => {
        if (i === groupIndex) {
          return { ...g, color: newColor }
        }
        if (i === otherIdx) {
          return { ...g, color: oldColor }
        }
        return g
      })
    })
  }, [])

  const toggleGroupTurn = useCallback((gi: number) => {
    setGroupTurnActed((prev) => {
      const next = [...prev]
      next[gi] = !next[gi]
      return next
    })
  }, [])

  const resetAllTurns = useCallback(() => {
    setGroupTurnActed(ENCOUNTER_GROUPS.map(() => false))
  }, [])

  return (
    <div className="min-h-svh bg-zinc-950 p-4 font-serif text-zinc-100 antialiased md:p-8">
      <div className="mx-auto max-w-6xl">
        <header className="px-4 pt-5 pb-0 text-center">
          <h1 className="text-lg font-normal tracking-[0.2em] text-white md:text-xl">
            Steel Roster
          </h1>
          <p className="mt-1.5 text-[0.65rem] font-normal uppercase tracking-[0.28em] text-zinc-400">
            Encounter roster
          </p>
          <TitleRule flushBelow />
        </header>

        <section aria-label="Creature tracker" className="mt-0 flex flex-col gap-2 px-0">
          <div
            className="grid w-full min-w-0 items-center"
            style={{ gridTemplateColumns: ROSTER_GRID_TEMPLATE }}
          >
            <div className="flex justify-center py-1.5" style={{ gridColumn: 1 }}>
              <button
                type="button"
                onClick={resetAllTurns}
                aria-label="Reset all encounter group turn diamonds to pending"
                className="min-h-10 min-w-[5.25rem] rounded-md px-4 py-2 font-sans text-xs tracking-wide text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60"
              >
                Reset
              </button>
            </div>
          </div>
          {encounterGroups.map((group, gi) => (
            <GroupSection
              key={`encounter-group-${gi}`}
              group={group}
              groupKey={`g${gi}`}
              groupNumber={gi + 1}
              thisGroupIndex={gi}
              encounterGroupColors={encounterGroups.map((g) => g.color)}
              turnActed={groupTurnActed[gi] ?? false}
              onToggleTurn={() => toggleGroupTurn(gi)}
              turnAriaLabel={`Encounter group ${gi + 1}: turn ${groupTurnActed[gi] ? 'acted' : 'pending'}`}
              onGroupColorChange={(c) => patchGroupColor(gi, c)}
              onMonsterStaminaChange={(mi, st) => patchMonsterStamina(gi, mi, st)}
              onMonsterConditionRemove={(mi, ci) => patchMonsterConditionRemove(gi, mi, ci)}
              onMonsterConditionCycleState={(mi, ci) => patchMonsterConditionCycleState(gi, mi, ci)}
              onMonsterConditionAddOrSet={(mi, label, state) =>
                patchMonsterConditionAddOrSet(gi, mi, label, state)
              }
            />
          ))}
        </section>

        <section aria-label="Dynamic terrain" className="mt-8 flex flex-col gap-2 md:mt-10">
          <header className="px-4 pt-2 pb-0 text-center md:pt-3">
            <h2 className="text-lg font-normal tracking-[0.2em] text-white md:text-xl">
              DYNAMIC TERRAIN
            </h2>
            <TitleRule />
          </header>
          {terrainRows.map((row, i) => (
            <TerrainRow key={i} row={row} onStaminaChange={(st) => patchTerrainStamina(i, st)} />
          ))}
        </section>
      </div>
    </div>
  )
}

export default App
