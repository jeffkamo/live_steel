import { useCallback, useEffect, useId, useState } from 'react'
import { applyStaminaDelta, normalizeStamina } from '../data'
import { StaminaGlyph, staminaGlyphStatus } from './StaminaGlyph'

const staminaBumpMinusClass =
  'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-500/75 bg-zinc-800/40 font-sans text-[0.58rem] font-semibold tabular-nums text-zinc-300 transition-colors hover:border-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 active:bg-zinc-900 sm:h-9 sm:w-9 sm:text-[0.62rem]'

const staminaBumpPlusClass =
  'flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full border border-zinc-200/85 bg-zinc-800/30 font-sans text-[0.58rem] font-semibold tabular-nums text-zinc-50 transition-colors hover:border-white hover:bg-zinc-700/50 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/60 active:bg-zinc-900 sm:h-9 sm:w-9 sm:text-[0.62rem]'

const staminaInlineInputClass =
  'w-9 min-w-[2.25rem] max-w-[3.5rem] rounded border-0 bg-transparent py-0.5 text-center font-sans text-xs font-medium tabular-nums text-zinc-950 outline-none ring-0 focus:ring-0 [appearance:textfield] sm:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'

export function EditableStaminaCell({
  current,
  max,
  onChange,
  ariaLabel,
  renderDisplay,
}: {
  current: number
  max: number
  onChange: (next: [number, number]) => void
  ariaLabel: string
  renderDisplay?: (current: number, max: number) => React.ReactNode
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
        {renderDisplay ? (
          renderDisplay(current, max)
        ) : empty ? (
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
