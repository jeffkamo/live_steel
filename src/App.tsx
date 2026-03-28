import { Fragment } from 'react'

type Marip = readonly [number, number, number, number, number]

type Monster = {
  name: string
  subtitle: string
  initials: string
  stamina: readonly [number, number]
  marip: Marip | null
  fs: number
  dist: number
  stab: number
  conditions: readonly string[]
}

type EncounterGroup = {
  monsters: readonly Monster[]
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

/** 6 columns: group | creatures | stamina | M A R I P | FS/Dist/Stab | conditions */
const ROSTER_GRID_TEMPLATE =
  '5.5rem minmax(0,1.25fr) minmax(5.25rem,7rem) minmax(5.75rem,7.25rem) 7.25rem minmax(0,1.05fr)'

const rosterGridClass =
  'grid grid-cols-[5.5rem_minmax(0,1.25fr)_minmax(5.25rem,7rem)_minmax(5.75rem,7.25rem)_7.25rem_minmax(0,1.05fr)]'

const terrainGridClass = 'grid grid-cols-[minmax(0,1.35fr)_minmax(4.5rem,6.5rem)_minmax(0,1.2fr)]'

function TitleRule() {
  return (
    <div className="flex w-full items-center gap-0 px-1 py-3" aria-hidden>
      <div className="h-px flex-1 bg-zinc-400/65" />
      <div
        className="mx-2 size-2 shrink-0 rotate-45 border border-zinc-400/75 bg-zinc-950"
        style={{ marginTop: '-1px' }}
      />
      <div className="h-px flex-1 bg-zinc-400/65" />
    </div>
  )
}

function StaminaIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path d="M10 17.5c-.35 0-.68-.12-.95-.35l-4.1-3.65A5.62 5.62 0 0 1 3.25 10c0-3.1 2.52-5.62 5.62-5.62 1.45 0 2.8.55 3.82 1.45l.33.3.33-.3A5.58 5.58 0 0 1 13.38 4.4c3.1 0 5.62 2.52 5.62 5.62 0 1.45-.55 2.8-1.55 3.82l-4.15 3.68c-.27.23-.6.35-.95.35Z" />
    </svg>
  )
}

function StaminaCell({ current, max }: { current: number; max: number }) {
  const empty = max === 0 && current === 0
  return (
    <div className="flex w-full items-center justify-center text-center">
      {empty ? (
        <span className="text-sm text-zinc-400">—</span>
      ) : (
        <div className="flex items-center justify-center gap-1.5 tabular-nums">
          <span className="text-sm text-zinc-50">
            {current} / {max}
          </span>
          <StaminaIcon className="size-4 shrink-0 text-rose-300" />
        </div>
      )}
    </div>
  )
}

const MARIP_HEADERS = ['M', 'A', 'R', 'I', 'P'] as const

function MaripCluster({ values }: { values: Marip | null }) {
  const track = 'grid w-full min-w-0 grid-cols-5 gap-x-0.5 text-center'
  return (
    <div className="flex w-full min-w-0 flex-col justify-center gap-0">
      <div
        className={`${track} pb-0.5 text-[0.55rem] uppercase tracking-wide text-zinc-300 sm:text-[0.6rem]`}
      >
        {MARIP_HEADERS.map((letter) => (
          <span key={letter}>{letter}</span>
        ))}
      </div>
      <div className={`${track} pt-0.5 tabular-nums text-xs text-zinc-50 sm:text-sm`}>
        {values === null
          ? MARIP_HEADERS.map((letter) => (
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

function MonsterRowCells({
  monster,
  rowIndex,
  globalMonsterIndex,
  showRowDivider,
}: {
  monster: Monster
  rowIndex: number
  globalMonsterIndex: number
  showRowDivider: boolean
}) {
  const stripe = globalMonsterIndex % 2 === 0 ? 'bg-zinc-900/65' : 'bg-zinc-950'
  const [sc, sm] = monster.stamina
  const row = rowIndex + 1
  const between = showRowDivider ? 'border-t border-zinc-600/80' : ''
  const shared = `${stripe} ${between}`
  const bodyCell =
    'flex h-full min-h-[3.75rem] items-center border-r border-zinc-600/50 p-3 sm:min-h-[4rem] sm:p-3.5'

  return (
    <Fragment>
      <div className={`${bodyCell} ${shared}`} style={{ gridColumn: 2, gridRow: row }}>
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
        className={`${bodyCell} justify-center ${shared}`}
        style={{ gridColumn: 3, gridRow: row }}
      >
        <StaminaCell current={sc} max={sm} />
      </div>
      <div
        className={`${bodyCell} justify-center ${shared}`}
        style={{ gridColumn: 4, gridRow: row }}
      >
        <MaripCluster values={monster.marip} />
      </div>
      <div
        className={`${bodyCell} justify-center ${shared}`}
        style={{ gridColumn: 5, gridRow: row }}
      >
        <StatCluster fs={monster.fs} dist={monster.dist} stab={monster.stab} />
      </div>
      <div
        className={`flex h-full min-h-[3.75rem] w-full items-center justify-start p-3 sm:min-h-[4rem] sm:p-3.5 ${shared}`}
        style={{ gridColumn: 6, gridRow: row }}
      >
        <ConditionPills labels={monster.conditions} />
      </div>
    </Fragment>
  )
}

function GroupSection({
  group,
  groupKey,
  globalStartIndex,
}: {
  group: EncounterGroup
  groupKey: string
  globalStartIndex: number
}) {
  const n = group.monsters.length

  return (
    <div
      className="grid items-stretch border-t border-zinc-600/80"
      style={{
        gridTemplateColumns: ROSTER_GRID_TEMPLATE,
        gridTemplateRows: `repeat(${n}, minmax(0, auto))`,
      }}
    >
      <div
        className="flex flex-col items-center justify-center gap-2 border-r border-zinc-600/50 bg-zinc-900/40 px-3 py-4 text-center"
        style={{ gridColumn: 1, gridRow: `1 / span ${n}` }}
      >
        <span className="text-[0.65rem] uppercase tracking-wide text-zinc-300">Turn</span>
        <span
          className="inline-block size-2 rotate-45 border border-zinc-400/70 bg-zinc-950"
          aria-hidden
        />
      </div>

      {group.monsters.map((monster, i) => (
        <MonsterRowCells
          key={`${groupKey}-${monster.name}-${i}`}
          monster={monster}
          rowIndex={i}
          globalMonsterIndex={globalStartIndex + i}
          showRowDivider={i > 0}
        />
      ))}
    </div>
  )
}

function TerrainRow({
  row,
  index,
}: {
  row: (typeof TERRAIN_ROWS)[number]
  index: number
}) {
  const stripe = index % 2 === 0 ? 'bg-zinc-900/65' : 'bg-zinc-950'
  const [tc, tm] = row.stamina
  return (
    <div className={`${terrainGridClass} border-t border-zinc-600/80 ${stripe}`}>
      <div className="flex h-full min-h-[3.75rem] items-center border-r border-zinc-600/50 p-3 sm:min-h-[4rem] sm:p-3.5">
        <p className="text-[0.8rem] leading-relaxed text-zinc-100">{row.object}</p>
      </div>
      <div className="flex h-full min-h-[3.75rem] items-center justify-center border-r border-zinc-600/50 p-3 sm:min-h-[4rem] sm:p-3.5">
        <StaminaCell current={tc} max={tm} />
      </div>
      <div className="flex h-full min-h-[3.75rem] flex-col justify-center gap-3 p-3 sm:min-h-[4rem] sm:p-3.5">
        <p className="text-[0.75rem] leading-snug text-zinc-400">{row.note}</p>
        <ConditionPills labels={row.conditions} />
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="min-h-svh bg-zinc-950 p-4 font-serif text-zinc-100 antialiased md:p-8">
      <div className="mx-auto max-w-6xl border border-zinc-600/90 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]">
        <header className="border-b border-zinc-600/80 px-4 pt-5 pb-0 text-center">
          <h1 className="text-lg font-normal tracking-[0.2em] text-white md:text-xl">
            ENCOUNTER ROSTER
          </h1>
          <TitleRule />
        </header>

        <section aria-label="Creature tracker">
          <div
            className={`${rosterGridClass} border-b border-zinc-600/80 bg-zinc-900/40 text-[0.65rem] font-normal uppercase tracking-wide text-zinc-300`}
          >
            <div className="flex items-center justify-center border-r border-zinc-600/50 px-3 py-3 text-center sm:py-3.5">
              Group
            </div>
            <div className="flex items-center border-r border-zinc-600/50 px-3 py-3 sm:py-3.5">
              Creatures
            </div>
            <div className="flex items-center justify-center border-r border-zinc-600/50 px-3 py-3 text-center leading-tight sm:py-3.5">
              Stamina
            </div>
            <div className="flex items-center border-r border-zinc-600/50 px-3 py-3 sm:py-3.5">
              <div className="grid w-full grid-cols-5 gap-x-0.5 text-center text-[0.55rem] leading-tight sm:text-[0.6rem]">
                {MARIP_HEADERS.map((letter) => (
                  <span key={letter}>{letter}</span>
                ))}
              </div>
            </div>
            <div className="flex items-center border-r border-zinc-600/50 px-3 py-3 sm:py-3.5">
              <div className="grid w-full grid-cols-3 gap-x-1 text-center text-[0.6rem] leading-tight">
                <span title="Free strike">FS</span>
                <span title="Distance">Dist</span>
                <span title="Stability">Stab</span>
              </div>
            </div>
            <div className="flex items-center px-3 py-3 sm:py-3.5">Conditions</div>
          </div>

          {ENCOUNTER_GROUPS.map((group, gi) => {
            const globalStartIndex = ENCOUNTER_GROUPS.slice(0, gi).reduce(
              (n, g) => n + g.monsters.length,
              0,
            )
            return (
              <GroupSection
                key={`encounter-group-${gi}`}
                group={group}
                groupKey={`g${gi}`}
                globalStartIndex={globalStartIndex}
              />
            )
          })}
        </section>

        <section aria-label="Dynamic terrain" className="border-t border-zinc-600/80">
          <div
            className={`${terrainGridClass} border-b border-zinc-600/80 bg-zinc-900/40 text-[0.65rem] uppercase tracking-wide text-zinc-300`}
          >
            <div className="flex items-center border-r border-zinc-600/50 px-3 py-3 sm:py-3.5">
              Dynamic Terrain Objects
            </div>
            <div className="flex items-center justify-center border-r border-zinc-600/50 px-3 py-3 text-center sm:py-3.5">
              Stamina
            </div>
            <div className="flex items-center px-3 py-3 sm:py-3.5">Notes / Conditions</div>
          </div>
          {TERRAIN_ROWS.map((row, i) => (
            <TerrainRow key={i} row={row} index={i} />
          ))}
        </section>
      </div>
    </div>
  )
}

export default App
