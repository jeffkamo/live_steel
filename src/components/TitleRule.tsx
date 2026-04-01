export function TitleRule({ flushBelow = false }: { flushBelow?: boolean } = {}) {
  return (
    <div
      className={`flex w-full items-center gap-0 px-1 ${flushBelow ? 'py-1' : 'py-2'}`}
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
