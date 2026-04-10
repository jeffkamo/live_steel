import type { DragEvent } from 'react'

export function InsertDropZone({
  label,
  active,
  invalid,
  rejectFlash,
  onDragOver,
  onDragLeave,
  onDrop,
  className = '',
  extendedGapHit = true,
}: {
  label: string
  active: boolean
  invalid?: boolean
  rejectFlash?: boolean
  onDragOver: (e: DragEvent) => void
  onDragLeave: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
  className?: string
  /** When true, use a tall insert strip that extends into the flex gap so the line stays a stable hover target (DND-005-style). */
  extendedGapHit?: boolean
}) {
  const showLine = active || rejectFlash
  const lineColor = rejectFlash
    ? 'bg-rose-500/70'
    : invalid
      ? 'bg-rose-500/45'
      : 'bg-sky-500/55'

  const line = showLine ? (
    <div className="pointer-events-none absolute inset-x-2 top-1/2 -translate-y-1/2">
      <div className={`h-[3px] w-full rounded-full ${lineColor} shadow-[0_0_0_1px_rgb(0_0_0/0.10)]`} />
    </div>
  ) : null

  if (extendedGapHit) {
    return (
      <div
        role="button"
        tabIndex={-1}
        aria-label={label}
        className={`relative w-full ${className}`}
        data-insert-dropzone
      >
        <div className="pointer-events-none h-3 w-full shrink-0" aria-hidden />
        <div
          aria-hidden
          className="absolute left-0 right-0 z-[5] -top-3 h-6"
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          {line}
        </div>
      </div>
    )
  }

  return (
    <div
      role="button"
      tabIndex={-1}
      aria-label={label}
      className={`relative w-full ${className}`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      data-insert-dropzone
    >
      <div className="relative h-3 w-full">
        {showLine && (
          <div className="absolute inset-x-2 top-1/2 -translate-y-1/2">
            <div className={`h-[3px] w-full rounded-full ${lineColor} shadow-[0_0_0_1px_rgb(0_0_0/0.10)]`} />
          </div>
        )}
      </div>
    </div>
  )
}
