export function TurnColumnCell({
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
      className={`flex min-h-0 w-full min-w-0 flex-1 cursor-pointer flex-col items-center justify-center gap-2 px-2 py-3 text-center transition-[opacity,background-color] duration-200 ease-out motion-reduce:transition-none hover:bg-zinc-800/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-amber-500/70 sm:px-3 sm:py-4 ${
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

export function GroupTurnColumn({
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
