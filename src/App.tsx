import { useCallback, useEffect, useId, useState } from 'react'

type Marip = readonly [number, number, number, number, number]

type Monster = {
  name: string
  subtitle: string
  initials: string
  stamina: [number, number]
  marip: Marip | null
  fs: number
  dist: number
  stab: number
  conditions: readonly string[]
}

type EncounterGroup = {
  monsters: Monster[]
}

type TerrainRowState = {
  object: string
  stamina: [number, number]
  note: string
  conditions: readonly string[]
}

const ENCOUNTER_GROUPS: readonly EncounterGroup[] = [
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
        conditions: ['Winded', 'Slowed'],
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
        conditions: ['Flanked'],
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
        conditions: ['Covering fire'],
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
        conditions: ['Silenced'],
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

const TERRAIN_ROWS = [
  {
    object: 'Toppled barricade — light cover along the eastern lane.',
    stamina: [6, 8] as const,
    note: 'Burning; end of round 1d4 to adjacent.',
    conditions: ['Hazard', 'Difficult'],
  },
  {
    object: 'Ritual circle (inactive). Chalk smeared, runes still warm.',
    stamina: [0, 0] as const,
    note: 'Anyone ending turn inside tests Stability (15+).',
    conditions: ['Zone'],
  },
] as const

function cloneEncounterGroups(): EncounterGroup[] {
  return ENCOUNTER_GROUPS.map((group) => ({
    monsters: group.monsters.map((m) => ({
      name: m.name,
      subtitle: m.subtitle,
      initials: m.initials,
      stamina: [m.stamina[0], m.stamina[1]] as [number, number],
      marip: m.marip === null ? null : ([...m.marip] as unknown as Marip),
      fs: m.fs,
      dist: m.dist,
      stab: m.stab,
      conditions: [...m.conditions],
    })),
  }))
}

function cloneTerrainRows(): TerrainRowState[] {
  return TERRAIN_ROWS.map((r) => ({
    object: r.object,
    stamina: [r.stamina[0], r.stamina[1]] as [number, number],
    note: r.note,
    conditions: [...r.conditions],
  }))
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

function ConditionPills({ labels }: { labels: readonly string[] }) {
  if (labels.length === 0) {
    return (
      <p className="w-full text-left font-sans text-[0.7rem] italic text-zinc-400">No active conditions</p>
    )
  }
  return (
    <div className="flex w-full flex-wrap content-center items-center justify-start gap-2">
      {labels.map((c) => (
        <span
          key={c}
          className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-center font-sans text-[0.65rem] font-medium tracking-tight text-zinc-950"
        >
          {c}
        </span>
      ))}
    </div>
  )
}

function TurnColumnCell({
  acted,
  onToggle,
  label,
  gridRowSpan,
}: {
  acted: boolean
  onToggle: () => void
  label: string
  gridRowSpan: number
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={acted}
      aria-label={label}
      style={{ gridColumn: 1, gridRow: `1 / span ${gridRowSpan}` }}
      className={`flex h-full min-h-0 w-full min-w-0 flex-col items-center justify-center gap-2 px-2 py-3 text-center transition-[opacity,background-color] duration-200 ease-out motion-reduce:transition-none hover:bg-zinc-800/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500/70 sm:px-3 sm:py-4 ${
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

function MonsterRowCells({
  monster,
  row,
  turnComplete,
  onStaminaChange,
}: {
  monster: Monster
  row: number
  turnComplete: boolean
  onStaminaChange: (next: [number, number]) => void
}) {
  const [sc, sm] = monster.stamina
  const bodyCell =
    'flex h-full min-h-[3.75rem] items-center p-3 sm:min-h-[4rem] sm:p-3.5'
  const rowTone =
    'transition-opacity duration-200 ease-out motion-reduce:transition-none ' +
    (turnComplete ? 'opacity-[0.52]' : 'opacity-100')

  return (
    <>
      <div className={`${bodyCell} ${rowTone}`} style={{ gridColumn: 2, gridRow: row }}>
        <div className="flex w-full items-center gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full border-2 border-amber-500/85 text-[0.55rem] font-semibold tabular-nums text-zinc-100 sm:size-10"
            aria-hidden
          >
            {monster.initials}
          </div>
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
        className={`flex h-full min-h-[3.75rem] w-full items-center justify-start p-3 sm:min-h-[4rem] sm:p-3.5 ${rowTone}`}
        style={{ gridColumn: 6, gridRow: row }}
      >
        <ConditionPills labels={monster.conditions} />
      </div>
    </>
  )
}

function GroupSection({
  group,
  groupKey,
  turnActed,
  onToggleTurn,
  turnAriaLabel,
  onMonsterStaminaChange,
}: {
  group: EncounterGroup
  groupKey: string
  turnActed: boolean
  onToggleTurn: () => void
  turnAriaLabel: string
  onMonsterStaminaChange: (monsterIndex: number, stamina: [number, number]) => void
}) {
  const n = group.monsters.length

  return (
    <div
      className="grid items-stretch overflow-visible rounded-lg bg-zinc-900/80"
      style={{
        gridTemplateColumns: ROSTER_GRID_TEMPLATE,
        gridTemplateRows: `repeat(${n}, minmax(0, auto))`,
      }}
    >
      <TurnColumnCell
        acted={turnActed}
        onToggle={onToggleTurn}
        label={turnAriaLabel}
        gridRowSpan={n}
      />
      {group.monsters.map((monster, i) => (
        <MonsterRowCells
          key={`${groupKey}-${monster.name}-${i}`}
          monster={monster}
          row={i + 1}
          turnComplete={turnActed}
          onStaminaChange={(st) => onMonsterStaminaChange(i, st)}
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
        <ConditionPills labels={row.conditions} />
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

  const patchTerrainStamina = useCallback((rowIndex: number, stamina: [number, number]) => {
    setTerrainRows((prev) =>
      prev.map((r, ri) =>
        ri === rowIndex ? { ...r, stamina: [stamina[0], stamina[1]] } : r,
      ),
    )
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
              turnActed={groupTurnActed[gi] ?? false}
              onToggleTurn={() => toggleGroupTurn(gi)}
              turnAriaLabel={`Encounter group ${gi + 1}: turn ${groupTurnActed[gi] ? 'acted' : 'pending'}`}
              onMonsterStaminaChange={(mi, st) => patchMonsterStamina(gi, mi, st)}
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
