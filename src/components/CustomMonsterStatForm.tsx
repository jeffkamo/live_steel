import type { GroupColorId, Monster } from '../types'
import {
  GROUP_COLOR_STAT_BLOCK_CARD,
  MARIP_HEADERS,
  type CustomMonsterPatch,
} from '../data'

const statBlockVeneerClass =
  'bg-[linear-gradient(165deg,rgb(250_250_250/0.98)_0%,rgb(244_244_245/0.98)_55%)] shadow-[inset_0_1px_0_rgb(251_191_36/0.12)] dark:bg-[linear-gradient(165deg,rgb(39_39_42/0.95)_0%,rgb(9_9_11/0.98)_55%)] dark:shadow-[inset_0_1px_0_rgb(251_191_36/0.07)]'

const statBlockCardBaseClass = `rounded-md bg-zinc-100/80 dark:bg-zinc-950/35 px-3 pt-2.5 pb-6 ${statBlockVeneerClass}`
const statBlockCardBorderDefault =
  'border border-amber-200/90 border-l-2 border-l-amber-600/70 dark:border-amber-950/55 dark:border-l-amber-700/45'

const labelClass =
  'mb-1 block text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-500'
const inputClass =
  'w-full rounded border border-zinc-300/85 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-950/80 px-2 py-1.5 font-sans text-xs text-zinc-900 dark:text-zinc-100 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-600 focus:border-amber-700/50 focus:ring-1 focus:ring-amber-500/35'

/** Matches {@link StatBlock} core-stats MARIP letter cells (Draw Steel glyph font). */
const maripGlyphBoxClass =
  'inline-flex h-6 min-w-6 shrink-0 items-center justify-center rounded border border-zinc-300 dark:border-zinc-600/50 bg-zinc-50 dark:bg-zinc-950/80 font-draw-steel text-sm text-zinc-700 dark:text-zinc-300'

function parseNonNegInt(raw: string): number {
  const n = Number.parseInt(raw.trim(), 10)
  if (Number.isNaN(n) || n < 0) return 0
  return n
}

function parseOptionalNegInt(raw: string): number {
  const t = raw.trim()
  if (t === '' || t === '-') return 0
  const n = Number.parseInt(t, 10)
  return Number.isNaN(n) ? 0 : n
}

export function CustomMonsterStatForm({
  monster,
  groupColor,
  onPatch,
}: {
  monster: Monster
  groupColor: GroupColorId | undefined
  onPatch: (patch: CustomMonsterPatch) => void
}) {
  const c = monster.custom
  if (!c) return null

  const marip = monster.marip ?? ([0, 0, 0, 0, 0] as const)
  const statCardBorderClass =
    groupColor != null ? GROUP_COLOR_STAT_BLOCK_CARD[groupColor] : statBlockCardBorderDefault

  const setMaripIndex = (index: number, value: number) => {
    const next = [...marip] as [number, number, number, number, number]
    next[index] = value
    onPatch({ marip: next })
  }

  return (
    <div
      role="region"
      aria-label={`Custom stats for ${monster.name}`}
      data-testid="custom-monster-stat-form"
      className="py-2"
    >
      <div className={`${statBlockCardBaseClass} ${statCardBorderClass}`}>
        <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-widest text-zinc-400">
          Custom creature
        </p>

        <div className="space-y-3">
          <div>
            <label htmlFor="custom-m-name" className={labelClass}>
              Name
            </label>
            <input
              id="custom-m-name"
              type="text"
              value={monster.name}
              onChange={(e) => onPatch({ name: e.target.value })}
              className={inputClass}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="custom-m-level" className={labelClass}>
                Level
              </label>
              <input
                id="custom-m-level"
                type="number"
                min={0}
                inputMode="numeric"
                value={c.level}
                onChange={(e) => onPatch({ custom: { level: parseNonNegInt(e.target.value) } })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="custom-m-ev" className={labelClass}>
                EV
              </label>
              <input
                id="custom-m-ev"
                type="text"
                value={c.ev ?? ''}
                onChange={(e) => onPatch({ custom: { ev: e.target.value } })}
                placeholder="e.g. 3"
                className={inputClass}
                autoComplete="off"
              />
            </div>
            <div>
              <label htmlFor="custom-m-max-stam" className={labelClass}>
                Max stamina
              </label>
              <input
                id="custom-m-max-stam"
                type="number"
                min={0}
                inputMode="numeric"
                value={monster.stamina[1]}
                onChange={(e) => {
                  const max = parseNonNegInt(e.target.value)
                  onPatch({ stamina: [max, max] })
                }}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="custom-m-type" className={labelClass}>
              Monster type
            </label>
            <input
              id="custom-m-type"
              type="text"
              value={c.monsterType}
              onChange={(e) => onPatch({ custom: { monsterType: e.target.value } })}
              placeholder="e.g. Horde · Artillery"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label htmlFor="custom-m-fs" className={labelClass}>
                Free strike
              </label>
              <input
                id="custom-m-fs"
                type="number"
                inputMode="numeric"
                value={monster.fs}
                onChange={(e) => onPatch({ fs: parseOptionalNegInt(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="custom-m-spd" className={labelClass}>
                Speed
              </label>
              <input
                id="custom-m-spd"
                type="number"
                inputMode="numeric"
                value={monster.dist}
                onChange={(e) => onPatch({ dist: parseOptionalNegInt(e.target.value) })}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="custom-m-stab" className={labelClass}>
                Stability
              </label>
              <input
                id="custom-m-stab"
                type="number"
                inputMode="numeric"
                value={monster.stab}
                onChange={(e) => onPatch({ stab: parseOptionalNegInt(e.target.value) })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="custom-m-size" className={labelClass}>
              Size
            </label>
            <input
              id="custom-m-size"
              type="text"
              value={c.size}
              onChange={(e) => onPatch({ custom: { size: e.target.value } })}
              className={inputClass}
            />
          </div>

          <div
            className="grid w-full min-w-0 grid-cols-5 gap-x-1 sm:gap-x-1.5"
            role="group"
            aria-label="Characteristics (MARIP)"
          >
            {MARIP_HEADERS.map(({ letter, title }, i) => (
              <div
                key={letter}
                title={title}
                className="flex min-w-0 flex-col items-center gap-1.5"
              >
                <span
                  className={maripGlyphBoxClass}
                  data-testid="draw-steel-marip-letter"
                  aria-hidden
                >
                  {letter}
                </span>
                <input
                  id={`custom-m-marip-${i}`}
                  type="number"
                  inputMode="numeric"
                  value={marip[i]}
                  onChange={(e) => setMaripIndex(i, parseOptionalNegInt(e.target.value))}
                  aria-label={title}
                  className={`${inputClass} w-full min-w-0 px-1.5 py-1 text-center text-sm tabular-nums`}
                  data-testid="draw-steel-marip-num"
                />
              </div>
            ))}
          </div>

          <div>
            <label htmlFor="custom-m-immunity" className={labelClass}>
              Immunity
            </label>
            <input
              id="custom-m-immunity"
              type="text"
              value={c.immunity}
              onChange={(e) => onPatch({ custom: { immunity: e.target.value } })}
              placeholder="e.g. fire, poison"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="custom-m-weakness" className={labelClass}>
              Weakness
            </label>
            <input
              id="custom-m-weakness"
              type="text"
              value={c.weakness}
              onChange={(e) => onPatch({ custom: { weakness: e.target.value } })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="custom-m-movement" className={labelClass}>
              Movement
            </label>
            <input
              id="custom-m-movement"
              type="text"
              value={c.movement}
              onChange={(e) => onPatch({ custom: { movement: e.target.value } })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="custom-m-notes" className={labelClass}>
              Notes
            </label>
            <textarea
              id="custom-m-notes"
              value={c.notes}
              onChange={(e) => onPatch({ custom: { notes: e.target.value } })}
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
