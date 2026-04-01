import type { TerrainRowState } from '../types'
import { GROUP_COLOR_STAT_BLOCK_CARD, type CustomTerrainPatch } from '../data'

const statBlockVeneerClass =
  'bg-[linear-gradient(165deg,rgb(39_39_42/0.95)_0%,rgb(9_9_11/0.98)_55%)] shadow-[inset_0_1px_0_rgb(251_191_36/0.07)]'

const statBlockCardBaseClass = `rounded-md bg-zinc-950/35 px-3 pt-2.5 pb-6 ${statBlockVeneerClass}`
const statBlockCardBorderDefault =
  'border border-amber-950/55 border-l-2 border-l-amber-700/45'

const labelClass =
  'mb-1 block text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-500'
const inputClass =
  'w-full rounded border border-zinc-700/80 bg-zinc-950/80 px-2 py-1.5 font-sans text-xs text-zinc-100 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-600 focus:border-amber-700/50 focus:ring-1 focus:ring-amber-500/35'

function parseNonNegInt(raw: string): number {
  const n = Number.parseInt(raw.trim(), 10)
  if (Number.isNaN(n) || n < 0) return 0
  return n
}

export function CustomTerrainStatForm({
  row,
  onPatch,
}: {
  row: TerrainRowState
  onPatch: (patch: CustomTerrainPatch) => void
}) {
  const c = row.custom
  if (!c) return null

  // Terrain isn’t tied to encounter-group colors, but reuse the same accent frame.
  const statCardBorderClass = GROUP_COLOR_STAT_BLOCK_CARD.grey ?? statBlockCardBorderDefault

  return (
    <div role="region" aria-label={`Custom stats for ${row.object}`} className="py-2">
      <div className={`${statBlockCardBaseClass} ${statCardBorderClass}`}>
        <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-400">
          Custom terrain
        </p>

        <div className="space-y-3">
          <div>
            <label htmlFor="custom-t-name" className={labelClass}>
              Name
            </label>
            <input
              id="custom-t-name"
              type="text"
              value={row.object}
              onChange={(e) => onPatch({ object: e.target.value })}
              className={inputClass}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="custom-t-desc" className={labelClass}>
              Description
            </label>
            <textarea
              id="custom-t-desc"
              value={row.note}
              onChange={(e) => onPatch({ note: e.target.value })}
              rows={5}
              spellCheck
              className={`${inputClass} min-h-[6rem] resize-y font-sans leading-relaxed`}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="custom-t-level" className={labelClass}>
                Level
              </label>
              <input
                id="custom-t-level"
                type="number"
                min={0}
                inputMode="numeric"
                value={c.level}
                onChange={(e) => onPatch({ custom: { level: parseNonNegInt(e.target.value) } })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="custom-t-ev" className={labelClass}>
                EV
              </label>
              <input
                id="custom-t-ev"
                type="text"
                value={c.ev ?? ''}
                onChange={(e) => onPatch({ custom: { ev: e.target.value } })}
                placeholder="e.g. 2"
                className={inputClass}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="custom-t-max-stam" className={labelClass}>
                Stamina
              </label>
              <input
                id="custom-t-max-stam"
                type="number"
                min={0}
                inputMode="numeric"
                value={row.stamina[1]}
                onChange={(e) => {
                  const max = parseNonNegInt(e.target.value)
                  onPatch({ stamina: [max, max] })
                }}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="custom-t-size" className={labelClass}>
              Size
            </label>
            <input
              id="custom-t-size"
              type="text"
              value={c.size}
              onChange={(e) => onPatch({ custom: { size: e.target.value } })}
              placeholder="e.g. 2, 3, 4 (or descriptive)"
              className={inputClass}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="custom-t-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="custom-t-notes"
              value={row.notes ?? ''}
              onChange={(e) => onPatch({ notes: e.target.value })}
              rows={5}
              spellCheck
              className={`${inputClass} min-h-[6rem] resize-y font-sans leading-relaxed`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

