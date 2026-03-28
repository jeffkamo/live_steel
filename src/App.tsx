const CREATURE_ROW_COUNT = 6
const TERRAIN_ROW_COUNT = 2

/** Shared column template: group | creatures | total EV | stamina | stats | notes */
const rosterGridClass =
  'grid grid-cols-[5.5rem_minmax(0,1.35fr)_6.5rem_minmax(0,1fr)_9.5rem_minmax(0,1.25fr)]'

function TitleRule() {
  return (
    <div
      className="flex w-full items-center gap-0 px-1 py-3"
      aria-hidden
    >
      <div className="h-px flex-1 bg-zinc-500/55" />
      <div
        className="mx-2 size-2 shrink-0 rotate-45 border border-zinc-500/60 bg-zinc-950"
        style={{ marginTop: '-1px' }}
      />
      <div className="h-px flex-1 bg-zinc-500/55" />
    </div>
  )
}

function BlankLine() {
  return (
    <span className="inline-block min-w-[2.5rem] border-b border-zinc-500/70 align-baseline">
      &nbsp;
    </span>
  )
}

function StatLines() {
  const lines = [
    ['Stability', '____'],
    ['Speed', '____'],
    ['Free Strike', '____'],
    ['Distance', '____'],
  ] as const
  return (
    <div className="space-y-1.5 text-[0.7rem] uppercase tracking-wide text-zinc-400">
      {lines.map(([label]) => (
        <div key={label} className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
          <span className="whitespace-nowrap text-zinc-300">{label}:</span>
          <BlankLine />
        </div>
      ))}
    </div>
  )
}

function CreatureRow({ index }: { index: number }) {
  const stripe = index % 2 === 0 ? 'bg-zinc-900/65' : 'bg-zinc-950'
  return (
    <div className={`${rosterGridClass} border-t border-zinc-600/80 ${stripe}`}>
      <div className="flex flex-col items-center justify-start gap-1 border-r border-zinc-600/50 px-1 py-3 text-center text-[0.65rem] uppercase tracking-wide text-zinc-400">
        <span>Turn</span>
        <span
          className="inline-block size-2 rotate-45 border border-zinc-500/55 bg-zinc-950"
          aria-hidden
        />
      </div>
      <div className="relative min-h-[5.5rem] border-r border-zinc-600/50 p-2">
        <span className="absolute bottom-2 right-2 text-[0.65rem] uppercase tracking-wide text-zinc-500">
          EV: <BlankLine />
        </span>
      </div>
      <div className="flex items-start justify-center border-r border-zinc-600/50 p-2 pt-3 text-[0.7rem] text-zinc-500">
        <BlankLine />
      </div>
      <div className="min-h-[5.5rem] border-r border-zinc-600/50 p-2" />
      <div className="border-r border-zinc-600/50 p-2">
        <StatLines />
      </div>
      <div className="min-h-[5.5rem] p-2" />
    </div>
  )
}

function TerrainRow({ index }: { index: number }) {
  const stripe = index % 2 === 0 ? 'bg-zinc-900/65' : 'bg-zinc-950'
  return (
    <div
      className={`grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.25fr)] border-t border-zinc-600/80 ${stripe}`}
    >
      <div className="relative min-h-[4rem] border-r border-zinc-600/50 p-2">
        <span className="absolute bottom-2 left-2 text-[0.65rem] uppercase tracking-wide text-zinc-500">
          EV: <BlankLine />
        </span>
      </div>
      <div className="min-h-[4rem] border-r border-zinc-600/50 p-2" />
      <div className="min-h-[4rem] p-2" />
    </div>
  )
}

function App() {
  return (
    <div className="min-h-svh bg-zinc-950 p-4 font-serif text-zinc-200 antialiased md:p-8">
      <div className="mx-auto max-w-6xl border border-zinc-600/90 shadow-[0_0_0_1px_rgba(0,0,0,0.35)]">
        <header className="border-b border-zinc-600/80 px-4 pt-5 pb-0 text-center">
          <h1 className="text-lg font-normal tracking-[0.2em] text-zinc-100 md:text-xl">
            ENCOUNTER ROSTER
          </h1>
          <TitleRule />
        </header>

        <section aria-label="Creature tracker">
          <div
            className={`${rosterGridClass} border-b border-zinc-600/80 bg-zinc-900/40 text-[0.65rem] font-normal uppercase tracking-wide text-zinc-400`}
          >
            <div className="flex items-end justify-center border-r border-zinc-600/50 px-1 py-2 text-center">
              Group
            </div>
            <div className="flex items-end border-r border-zinc-600/50 px-2 py-2">
              Creatures
            </div>
            <div className="flex flex-col items-center justify-end gap-0.5 border-r border-zinc-600/50 px-1 py-2 text-center leading-tight">
              <span>Total EV:</span>
              <span className="tabular-nums text-zinc-500">0</span>
            </div>
            <div className="flex items-end border-r border-zinc-600/50 px-2 py-2">
              Stamina Tracker
            </div>
            <div className="flex items-end border-r border-zinc-600/50 px-2 py-2">
              Stats
            </div>
            <div className="flex items-end px-2 py-2">Notes / Temporary Effects</div>
          </div>

          {Array.from({ length: CREATURE_ROW_COUNT }, (_, i) => (
            <CreatureRow key={i} index={i} />
          ))}
        </section>

        <section aria-label="Dynamic terrain" className="border-t border-zinc-600/80">
          <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.25fr)] border-b border-zinc-600/80 bg-zinc-900/40 text-[0.65rem] uppercase tracking-wide text-zinc-400">
            <div className="border-r border-zinc-600/50 px-2 py-2">
              Dynamic Terrain Objects
            </div>
            <div className="border-r border-zinc-600/50 px-2 py-2">Stamina Tracker</div>
            <div className="px-2 py-2">Notes / Temporary Effects</div>
          </div>
          {Array.from({ length: TERRAIN_ROW_COUNT }, (_, i) => (
            <TerrainRow key={i} index={i} />
          ))}
        </section>
      </div>
    </div>
  )
}

export default App
