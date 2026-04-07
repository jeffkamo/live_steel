import { useId } from 'react'
import type { GroupColorId, Monster, MonsterFeature, PowerRollEffect } from '../types'
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

const ABILITY_TYPE_SUGGESTIONS = [
  'Signature Ability',
  'Villain Action 1',
  'Villain Action 2',
  'Villain Action 3',
] as const

/** Matches common `usage` strings in the bestiary stat blocks. */
const USAGE_PRESETS = [
  'Main action',
  'Maneuver',
  'Triggered action',
  'Free triggered action',
  '-',
] as const

const USAGE_SELECT_OTHER = '__usage_other__'

function usageSelectValue(usage: string): string {
  return (USAGE_PRESETS as readonly string[]).includes(usage) ? usage : USAGE_SELECT_OTHER
}

function isEffectivelyBlank(s: string): boolean {
  return s.trim() === ''
}

type AbilityCategory =
  | 'melee_attack'
  | 'ranged_attack'
  | 'area_attack'
  | 'maneuver_self'
  | 'triggered'
  | 'passive_trait'
  | 'special_ability'

const CATEGORY_META: Record<
  AbilityCategory,
  { label: string; icon: string; feature_type: 'ability' | 'trait' }
> = {
  melee_attack: { label: 'Melee attack', icon: '🗡', feature_type: 'ability' },
  ranged_attack: { label: 'Ranged attack', icon: '🏹', feature_type: 'ability' },
  area_attack: { label: 'Area attack', icon: '🔳', feature_type: 'ability' },
  maneuver_self: { label: 'Maneuver / self', icon: '👤', feature_type: 'ability' },
  triggered: { label: 'Triggered / reaction', icon: '❗️', feature_type: 'ability' },
  passive_trait: { label: 'Passive trait', icon: '⭐️', feature_type: 'trait' },
  special_ability: { label: 'Special ability', icon: '❇', feature_type: 'ability' },
}

function normIcon(s: string | undefined): string {
  return (s ?? '').trim().replace(/\uFE0F/g, '')
}

function inferCategory(f: MonsterFeature): AbilityCategory {
  if (f.feature_type === 'trait') return 'passive_trait'
  const ic = normIcon(f.icon)
  if (ic === '🗡' || ic === '⚔') return 'melee_attack'
  if (ic === '🏹') return 'ranged_attack'
  if (ic === '🔳') return 'area_attack'
  if (ic === '👤') return 'maneuver_self'
  if (ic === '❗' || ic === '❕') return 'triggered'
  if (ic === '❇' || ic === '🌀') return 'special_ability'
  return 'melee_attack'
}

/**
 * Bestiary features use `keywords: string[]` (e.g. ["Melee", "Strike"]).
 * The custom form edits a single line; we preserve it verbatim as one array entry
 * so commas, spaces, and partial input (e.g. "Melee, ") round-trip without loss.
 */
function keywordsToEditLine(kw: string[] | undefined): string {
  if (!kw || kw.length === 0) return ''
  if (kw.length === 1) return kw[0]!
  return kw.join(', ')
}

function parsePowerRollFromEffects(effects: PowerRollEffect[] | undefined): {
  roll: string
  tier1: string
  tier2: string
  tier3: string
  rest: PowerRollEffect[]
} {
  const list = effects ?? []
  const idx = list.findIndex(
    (e) =>
      Boolean(e.roll?.trim()) ||
      Boolean(e.tier1?.trim()) ||
      Boolean(e.tier2?.trim()) ||
      Boolean(e.tier3?.trim()),
  )
  if (idx < 0) {
    return { roll: '', tier1: '', tier2: '', tier3: '', rest: [...list] }
  }
  const e = list[idx]!
  const rest = list.filter((_, i) => i !== idx)
  return {
    roll: e.roll ?? '',
    tier1: e.tier1 ?? '',
    tier2: e.tier2 ?? '',
    tier3: e.tier3 ?? '',
    rest,
  }
}

function traitBodyFromEffects(effects: PowerRollEffect[] | undefined): string {
  if (!effects?.length) return ''
  return effects.map((e) => e.effect ?? '').filter(Boolean).join('\n\n')
}

type UnpackedAbility = {
  category: AbilityCategory
  name: string
  abilityType: string
  cost: string
  keywordsCsv: string
  usage: string
  distance: string
  target: string
  trigger: string
  roll: string
  tier1: string
  tier2: string
  tier3: string
  traitBody: string
  extraEffects: PowerRollEffect[]
}

function unpackAbility(f: MonsterFeature): UnpackedAbility {
  const category = inferCategory(f)
  const pr = parsePowerRollFromEffects(f.effects)
  return {
    category,
    name: f.name,
    abilityType: f.ability_type ?? '',
    cost: f.cost ?? '',
    keywordsCsv: keywordsToEditLine(f.keywords),
    usage: f.usage ?? '',
    distance: f.distance ?? '',
    target: f.target ?? '',
    trigger: f.trigger ?? '',
    roll: pr.roll,
    tier1: pr.tier1,
    tier2: pr.tier2,
    tier3: pr.tier3,
    traitBody: f.feature_type === 'trait' ? traitBodyFromEffects(f.effects) : '',
    extraEffects: f.feature_type === 'trait' ? [] : pr.rest,
  }
}

function buildFeature(u: UnpackedAbility): MonsterFeature {
  const meta = CATEGORY_META[u.category]
  const base: MonsterFeature = {
    type: 'feature',
    feature_type: meta.feature_type,
    name: u.name,
    icon: meta.icon,
  }
  if (meta.feature_type === 'trait') {
    if (isEffectivelyBlank(u.traitBody)) {
      return base
    }
    return {
      ...base,
      effects: [{ effect: u.traitBody }],
    }
  }
  const out: MonsterFeature = {
    ...base,
    ...(isEffectivelyBlank(u.abilityType) ? {} : { ability_type: u.abilityType }),
    ...(isEffectivelyBlank(u.cost) ? {} : { cost: u.cost }),
    ...(isEffectivelyBlank(u.keywordsCsv) ? {} : { keywords: [u.keywordsCsv] }),
    ...(isEffectivelyBlank(u.usage) ? {} : { usage: u.usage }),
    ...(isEffectivelyBlank(u.distance) ? {} : { distance: u.distance }),
    ...(isEffectivelyBlank(u.target) ? {} : { target: u.target }),
    ...(isEffectivelyBlank(u.trigger) ? {} : { trigger: u.trigger }),
  }
  const effects: PowerRollEffect[] = []
  const hasPowerRoll =
    !isEffectivelyBlank(u.roll) ||
    !isEffectivelyBlank(u.tier1) ||
    !isEffectivelyBlank(u.tier2) ||
    !isEffectivelyBlank(u.tier3)
  if (hasPowerRoll) {
    const pr: PowerRollEffect = {}
    if (!isEffectivelyBlank(u.roll)) pr.roll = u.roll
    if (!isEffectivelyBlank(u.tier1)) pr.tier1 = u.tier1
    if (!isEffectivelyBlank(u.tier2)) pr.tier2 = u.tier2
    if (!isEffectivelyBlank(u.tier3)) pr.tier3 = u.tier3
    effects.push(pr)
  }
  for (const ex of u.extraEffects) {
    const name = ex.name ?? ''
    const effect = ex.effect ?? ''
    const c = ex.cost ?? ''
    if (!isEffectivelyBlank(name) || !isEffectivelyBlank(effect) || !isEffectivelyBlank(c)) {
      const row: PowerRollEffect = {}
      if (!isEffectivelyBlank(name)) row.name = name
      if (!isEffectivelyBlank(c)) row.cost = c
      if (!isEffectivelyBlank(effect)) row.effect = effect
      effects.push(row)
    }
  }
  if (effects.length > 0) {
    out.effects = effects
  }
  return out
}

function defaultFeature(category: AbilityCategory): MonsterFeature {
  const meta = CATEGORY_META[category]
  if (meta.feature_type === 'trait') {
    return { type: 'feature', feature_type: 'trait', name: '', icon: meta.icon }
  }
  const usage =
    category === 'maneuver_self'
      ? 'Maneuver'
      : category === 'triggered'
        ? 'Triggered action'
        : 'Main action'
  const ability_type =
    category === 'melee_attack' || category === 'ranged_attack' || category === 'area_attack'
      ? 'Signature Ability'
      : ''
  return {
    type: 'feature',
    feature_type: 'ability',
    name: '',
    icon: meta.icon,
    ...(ability_type ? { ability_type } : {}),
    usage,
  }
}

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

function CustomAbilityCard({
  feature,
  index,
  onChange,
  onRemove,
  abilityTypeListId,
  textareaClass,
}: {
  feature: MonsterFeature
  index: number
  onChange: (next: MonsterFeature) => void
  onRemove: () => void
  abilityTypeListId: string
  textareaClass: string
}) {
  const u = unpackAbility(feature)
  const commit = (partial: Partial<UnpackedAbility>) => {
    onChange(buildFeature({ ...u, ...partial }))
  }

  const isTrait = u.category === 'passive_trait'

  return (
    <div
      className="rounded-md border border-zinc-300/90 bg-zinc-50/90 px-2.5 py-2.5 dark:border-zinc-700/70 dark:bg-zinc-950/50"
      data-testid={`custom-ability-card-${index}`}
    >
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Ability {index + 1}
          <span className="ml-1.5 font-draw-steel text-sm not-uppercase tracking-normal text-zinc-700 dark:text-zinc-300" aria-hidden>
            {CATEGORY_META[u.category].icon.replace(/\uFE0F/g, '')}
          </span>
        </span>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 cursor-pointer rounded px-2 py-0.5 text-[0.65rem] font-medium text-red-700/90 hover:bg-red-500/10 dark:text-red-400/90 dark:hover:bg-red-500/15"
        >
          Remove
        </button>
      </div>

      <div className="space-y-2">
        <div>
          <label className={labelClass} htmlFor={`custom-ab-cat-${index}`}>
            Category
          </label>
          <select
            id={`custom-ab-cat-${index}`}
            className={inputClass}
            value={u.category}
            onChange={(e) => commit({ category: e.target.value as AbilityCategory })}
          >
            {(Object.keys(CATEGORY_META) as AbilityCategory[]).map((key) => (
              <option key={key} value={key}>
                {CATEGORY_META[key].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor={`custom-ab-name-${index}`}>
            Name
          </label>
          <input
            id={`custom-ab-name-${index}`}
            type="text"
            value={u.name}
            onChange={(e) => commit({ name: e.target.value })}
            className={inputClass}
            autoComplete="off"
          />
        </div>

        {isTrait ? (
          <div>
            <label className={labelClass} htmlFor={`custom-ab-trait-${index}`}>
              Trait text
            </label>
            <textarea
              id={`custom-ab-trait-${index}`}
              value={u.traitBody}
              onChange={(e) => commit({ traitBody: e.target.value })}
              rows={4}
              spellCheck
              className={textareaClass}
            />
          </div>
        ) : (
          <>
            <div>
              <label className={labelClass} htmlFor={`custom-ab-atype-${index}`}>
                Ability type
              </label>
              <input
                id={`custom-ab-atype-${index}`}
                type="text"
                value={u.abilityType}
                onChange={(e) => commit({ abilityType: e.target.value })}
                list={abilityTypeListId}
                placeholder="e.g. Signature Ability"
                className={inputClass}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass} htmlFor={`custom-ab-cost-${index}`}>
                  Cost
                </label>
                <input
                  id={`custom-ab-cost-${index}`}
                  type="text"
                  value={u.cost}
                  onChange={(e) => commit({ cost: e.target.value })}
                  placeholder="e.g. 1 Malice"
                  className={inputClass}
                  autoComplete="off"
                />
              </div>
              <div className="min-w-0 space-y-1.5">
                <label className={labelClass} htmlFor={`custom-ab-usage-${index}`}>
                  Usage
                </label>
                <select
                  id={`custom-ab-usage-${index}`}
                  className={inputClass}
                  value={usageSelectValue(u.usage)}
                  onChange={(e) => {
                    const v = e.target.value
                    if (v === USAGE_SELECT_OTHER) {
                      commit({ usage: '' })
                    } else {
                      commit({ usage: v })
                    }
                  }}
                >
                  {USAGE_PRESETS.map((p) => (
                    <option key={p} value={p}>
                      {p === '-' ? '— (dash)' : p}
                    </option>
                  ))}
                  <option value={USAGE_SELECT_OTHER}>Other…</option>
                </select>
                {usageSelectValue(u.usage) === USAGE_SELECT_OTHER ? (
                  <input
                    id={`custom-ab-usage-custom-${index}`}
                    type="text"
                    value={u.usage}
                    onChange={(e) => commit({ usage: e.target.value })}
                    placeholder="Custom usage"
                    className={inputClass}
                    autoComplete="off"
                    aria-label="Custom usage"
                  />
                ) : null}
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor={`custom-ab-kw-${index}`}>
                Keywords
              </label>
              <input
                id={`custom-ab-kw-${index}`}
                type="text"
                value={u.keywordsCsv}
                onChange={(e) => commit({ keywordsCsv: e.target.value })}
                placeholder="Melee, Strike, Weapon"
                className={inputClass}
                autoComplete="off"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label className={labelClass} htmlFor={`custom-ab-dist-${index}`}>
                  Distance
                </label>
                <input
                  id={`custom-ab-dist-${index}`}
                  type="text"
                  value={u.distance}
                  onChange={(e) => commit({ distance: e.target.value })}
                  placeholder="Melee 1, Ranged 5…"
                  className={inputClass}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className={labelClass} htmlFor={`custom-ab-tgt-${index}`}>
                  Target
                </label>
                <input
                  id={`custom-ab-tgt-${index}`}
                  type="text"
                  value={u.target}
                  onChange={(e) => commit({ target: e.target.value })}
                  placeholder="One creature…"
                  className={inputClass}
                  autoComplete="off"
                />
              </div>
            </div>

            <div>
              <label className={labelClass} htmlFor={`custom-ab-trig-${index}`}>
                Trigger
              </label>
              <input
                id={`custom-ab-trig-${index}`}
                type="text"
                value={u.trigger}
                onChange={(e) => commit({ trigger: e.target.value })}
                placeholder="For triggered abilities"
                className={inputClass}
                autoComplete="off"
              />
            </div>

            <div className="rounded border border-zinc-200/90 bg-white/60 px-2 py-2 dark:border-zinc-700/60 dark:bg-zinc-950/40">
              <p className="mb-1.5 text-[0.6rem] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-500">
                Power roll
              </p>
              <div className="space-y-2">
                <div>
                  <label className={labelClass} htmlFor={`custom-ab-roll-${index}`}>
                    Roll line
                  </label>
                  <input
                    id={`custom-ab-roll-${index}`}
                    type="text"
                    value={u.roll}
                    onChange={(e) => commit({ roll: e.target.value })}
                    placeholder="Power Roll + 3"
                    className={inputClass}
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`custom-ab-t1-${index}`}>
                    Tier 1
                  </label>
                  <textarea
                    id={`custom-ab-t1-${index}`}
                    value={u.tier1}
                    onChange={(e) => commit({ tier1: e.target.value })}
                    rows={2}
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`custom-ab-t2-${index}`}>
                    Tier 2
                  </label>
                  <textarea
                    id={`custom-ab-t2-${index}`}
                    value={u.tier2}
                    onChange={(e) => commit({ tier2: e.target.value })}
                    rows={2}
                    className={textareaClass}
                  />
                </div>
                <div>
                  <label className={labelClass} htmlFor={`custom-ab-t3-${index}`}>
                    Tier 3
                  </label>
                  <textarea
                    id={`custom-ab-t3-${index}`}
                    value={u.tier3}
                    onChange={(e) => commit({ tier3: e.target.value })}
                    rows={2}
                    className={textareaClass}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[0.6rem] font-semibold uppercase tracking-wide text-zinc-600 dark:text-zinc-500">
                  Follow-up effects
                </span>
                <button
                  type="button"
                  onClick={() =>
                    commit({
                      extraEffects: [...u.extraEffects, { name: 'Effect', effect: '' }],
                    })
                  }
                  className="shrink-0 cursor-pointer rounded px-2 py-0.5 text-[0.65rem] font-medium text-amber-900/90 hover:bg-amber-500/15 dark:text-amber-200/90 dark:hover:bg-amber-500/20"
                >
                  + Add effect
                </button>
              </div>
              {u.extraEffects.map((ex, ei) => (
                <div
                  key={ei}
                  className="rounded border border-zinc-200/80 px-2 py-2 dark:border-zinc-700/55"
                >
                  <div className="mb-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        commit({
                          extraEffects: u.extraEffects.filter((_, j) => j !== ei),
                        })
                      }
                      className="cursor-pointer text-[0.6rem] text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mb-2">
                    <label className={labelClass} htmlFor={`custom-ab-exn-${index}-${ei}`}>
                      Label
                    </label>
                    <input
                      id={`custom-ab-exn-${index}-${ei}`}
                      type="text"
                      value={ex.name ?? ''}
                      onChange={(e) => {
                        const next = [...u.extraEffects]
                        next[ei] = { ...next[ei]!, name: e.target.value }
                        commit({ extraEffects: next })
                      }}
                      placeholder="Effect"
                      className={inputClass}
                      autoComplete="off"
                    />
                  </div>
                  <div className="mb-2">
                    <label className={labelClass} htmlFor={`custom-ab-exc-${index}-${ei}`}>
                      Cost
                    </label>
                    <input
                      id={`custom-ab-exc-${index}-${ei}`}
                      type="text"
                      value={ex.cost ?? ''}
                      onChange={(e) => {
                        const next = [...u.extraEffects]
                        next[ei] = { ...next[ei]!, cost: e.target.value }
                        commit({ extraEffects: next })
                      }}
                      className={inputClass}
                      autoComplete="off"
                    />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor={`custom-ab-exe-${index}-${ei}`}>
                      Text
                    </label>
                    <textarea
                      id={`custom-ab-exe-${index}-${ei}`}
                      value={ex.effect ?? ''}
                      onChange={(e) => {
                        const next = [...u.extraEffects]
                        next[ei] = { ...next[ei]!, effect: e.target.value }
                        commit({ extraEffects: next })
                      }}
                      rows={2}
                      className={textareaClass}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
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
  const abilityTypeListId = useId().replace(/:/g, '')
  const textareaClass = `${inputClass} min-h-[4rem] resize-y font-sans leading-relaxed`
  const c = monster.custom
  if (!c) return null

  const marip = monster.marip ?? ([0, 0, 0, 0, 0] as const)
  const statCardBorderClass =
    groupColor != null ? GROUP_COLOR_STAT_BLOCK_CARD[groupColor] : statBlockCardBorderDefault

  const features = monster.features ?? []

  const setFeatures = (next: MonsterFeature[]) => {
    onPatch({ features: next })
  }

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
      <datalist id={abilityTypeListId}>
        {ABILITY_TYPE_SUGGESTIONS.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

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

          <div className="border-t border-zinc-300/80 pt-3 dark:border-zinc-700/60">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <span className={labelClass}>Abilities & traits</span>
            </div>
            <p className="mb-2 text-[0.65rem] leading-snug text-zinc-600 dark:text-zinc-500">
              Matches bestiary stat blocks: category sets the Draw Steel icon (melee, ranged, area,
              maneuver, triggered, trait, special). Attacks can include a power roll and tier lines;
              add follow-up effect paragraphs when needed.
            </p>
            <div className="space-y-2">
              {features.map((f, i) => (
                <CustomAbilityCard
                  key={i}
                  feature={f}
                  index={i}
                  abilityTypeListId={abilityTypeListId}
                  textareaClass={textareaClass}
                  onChange={(next) => {
                    const copy = [...features]
                    copy[i] = next
                    setFeatures(copy)
                  }}
                  onRemove={() => setFeatures(features.filter((_, j) => j !== i))}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setFeatures([...features, defaultFeature('melee_attack')])}
              className="mt-2 w-full cursor-pointer rounded border border-dashed border-amber-700/40 bg-amber-500/5 px-3 py-2 text-xs font-medium text-amber-950/90 transition-colors hover:bg-amber-500/10 dark:border-amber-600/35 dark:bg-amber-500/10 dark:text-amber-100/90 dark:hover:bg-amber-500/20"
              data-testid="custom-add-ability"
            >
              + Add ability
            </button>
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
              className={textareaClass}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
