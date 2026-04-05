import type {
  CaptainRef,
  ConditionEntry,
  CustomMonsterStats,
  CustomTerrainStats,
  EncounterGroup,
  EncounterGroupSeed,
  GroupColorId,
  Marip,
  MinionEntry,
  Monster,
  MonsterFeature,
  MonsterSeed,
  TerrainRowSeed,
  TerrainRowState,
} from './types'
import {
  bestiarySubtitle,
  deriveInitials,
  featuresForMonster,
  lookupStatblock,
  maxStaminaForBestiaryName,
  minionInterval,
  type BestiaryStatblock,
} from './bestiary'
export const GROUP_COLOR_ORDER: readonly GroupColorId[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'white',
  'grey',
  'black',
] as const

export const GROUP_COLOR_LABEL: Record<GroupColorId, string> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  pink: 'Pink',
  white: 'White',
  grey: 'Grey',
  black: 'Black',
}

/** Tailwind class bundles for creature ordinal rings (full strings for the compiler). */
export const GROUP_COLOR_BADGE: Record<
  GroupColorId,
  { border: string; bg: string; text: string }
> = {
  red: {
    border: 'border-red-500/90',
    bg: 'bg-red-100/90 dark:bg-red-950/55',
    text: 'text-red-900 dark:text-red-100',
  },
  orange: {
    border: 'border-orange-500/90',
    bg: 'bg-orange-100/90 dark:bg-orange-950/55',
    text: 'text-orange-900 dark:text-orange-100',
  },
  yellow: {
    border: 'border-yellow-400/90',
    bg: 'bg-yellow-100/85 dark:bg-yellow-950/45',
    text: 'text-yellow-900 dark:text-yellow-100',
  },
  green: {
    border: 'border-emerald-500/90',
    bg: 'bg-emerald-100/90 dark:bg-emerald-950/55',
    text: 'text-emerald-900 dark:text-emerald-100',
  },
  blue: {
    border: 'border-sky-500/90',
    bg: 'bg-sky-100/90 dark:bg-sky-950/55',
    text: 'text-sky-900 dark:text-sky-100',
  },
  purple: {
    border: 'border-violet-500/90',
    bg: 'bg-violet-100/90 dark:bg-violet-950/55',
    text: 'text-violet-900 dark:text-violet-100',
  },
  pink: {
    border: 'border-pink-500/90',
    bg: 'bg-pink-100/90 dark:bg-pink-950/55',
    text: 'text-pink-900 dark:text-pink-100',
  },
  white: {
    border: 'border-zinc-400/90 dark:border-zinc-100/90',
    bg: 'bg-white/90 dark:bg-zinc-100/15',
    text: 'text-zinc-800 dark:text-zinc-50',
  },
  grey: {
    border: 'border-zinc-400/90',
    bg: 'bg-zinc-200/90 dark:bg-zinc-800/65',
    text: 'text-zinc-800 dark:text-zinc-200',
  },
  black: {
    border: 'border-zinc-600/95',
    bg: 'bg-zinc-800/90 dark:bg-black/80',
    text: 'text-zinc-100 dark:text-zinc-300',
  },
}

/**
 * Stat block card frame in the monster drawer: subtle perimeter + stronger left accent,
 * keyed to encounter group color (matches ordinal badge hue).
 */
export const GROUP_COLOR_STAT_BLOCK_CARD: Record<GroupColorId, string> = {
  red: 'border border-red-200/90 border-l-2 border-l-red-500/75 dark:border-red-950/55',
  orange: 'border border-orange-200/90 border-l-2 border-l-orange-500/75 dark:border-orange-950/55',
  yellow: 'border border-yellow-200/90 border-l-2 border-l-yellow-400/80 dark:border-yellow-950/50',
  green: 'border border-emerald-200/90 border-l-2 border-l-emerald-500/75 dark:border-emerald-950/55',
  blue: 'border border-sky-200/90 border-l-2 border-l-sky-500/75 dark:border-sky-950/55',
  purple: 'border border-violet-200/90 border-l-2 border-l-violet-500/75 dark:border-violet-950/55',
  pink: 'border border-pink-200/90 border-l-2 border-l-pink-500/75 dark:border-pink-950/55',
  white: 'border border-zinc-300/80 border-l-2 border-l-zinc-500/70 dark:border-zinc-200/25 dark:border-l-zinc-100/85',
  grey: 'border border-zinc-300/80 border-l-2 border-l-zinc-500/75 dark:border-zinc-700/70 dark:border-l-zinc-400/80',
  black: 'border border-zinc-400/85 border-l-2 border-l-zinc-600/85 dark:border-zinc-950/80 dark:border-l-zinc-500/80',
}

export const GROUP_COLOR_PREVIEW_HEX: Record<GroupColorId, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#0ea5e9',
  purple: '#8b5cf6',
  pink: '#ec4899',
  white: '#f4f4f5',
  grey: '#a1a1aa',
  black: '#18181b',
}

/**
 * Solo rows and horde minions each get a unique ordinal within the encounter group; squad parent
 * rows are not numbered. Keys: `${monsterIndex}` for solo, `${monsterIndex}:${minionIndex}` for minions.
 */
export function buildCreatureOrdinalMap(monsters: readonly Monster[]): Map<string, number> {
  const map = new Map<string, number>()
  let n = 0
  for (let i = 0; i < monsters.length; i++) {
    const m = monsters[i]!
    if (m.minions?.length) {
      for (let j = 0; j < m.minions.length; j++) {
        n++
        map.set(`${i}:${j}`, n)
      }
    } else {
      n++
      map.set(`${i}`, n)
    }
  }
  return map
}

export function totalCreaturesInGroup(monsters: readonly Monster[]): number {
  let n = 0
  for (const m of monsters) {
    if (m.minions?.length) n += m.minions.length
    else n += 1
  }
  return n
}

export const ENCOUNTER_GROUPS: readonly EncounterGroupSeed[] = [
  {
    monsters: [
      {
        name: 'Goblin Assassin 1',
        subtitle: 'Level 1 · Horde Ambusher',
        initials: 'GA',
        stamina: [5, 15],
        marip: [-2, 2, 0, 0, -2],
        fs: -1,
        dist: 4,
        stab: 0,
        conditions: ['Weakened', 'Slowed'],
      },
      {
        name: 'Goblin Warrior',
        subtitle: 'Level 1 · Horde Harrier',
        initials: 'GW',
        stamina: [15, 15],
        marip: [-2, 2, 0, 0, -1],
        fs: 1,
        dist: 6,
        stab: 0,
        conditions: ['Grabbed'],
      },
    ],
  },
  {
    monsters: [
      {
        name: 'Goblin Underboss',
        subtitle: 'Level 1 · Horde Support',
        initials: 'GU',
        stamina: [15, 15],
        marip: [-1, 2, 0, 0, 1],
        fs: 1,
        dist: 5,
        stab: 0,
        conditions: ['Judged'],
      },
    ],
  },
  {
    monsters: [
      {
        name: 'Minions',
        subtitle: 'Level 1 · Minion Brute',
        initials: 'M',
        stamina: [20, 20],
        marip: [-1, 0, 0, 0, -1],
        fs: 0,
        dist: 3,
        stab: 0,
        conditions: ['Taunted'],
        minions: [
          { name: 'Goblin Spinecleaver 1', initials: 'GS1', conditions: [] },
          { name: 'Goblin Spinecleaver 2', initials: 'GS2', conditions: ['Bleeding'] },
          { name: 'Goblin Spinecleaver 3', initials: 'GS3', conditions: [] },
          { name: 'Goblin Spinecleaver 4', initials: 'GS4', conditions: [] },
        ],
      },
    ],
  },
  {
    monsters: [
      {
        name: 'Minotaur Sunderer',
        subtitle: 'Level 3 · Elite Brute',
        initials: 'MS',
        stamina: [8, 120],
        marip: [2, 1, 0, 2, -1],
        fs: 6,
        dist: 6,
        stab: 2,
        conditions: ['Bleeding', 'Dazed'],
      },
      {
        name: 'Gnoll Cackler',
        subtitle: 'Level 2 · Horde Hexer',
        initials: 'GC',
        stamina: [15, 15],
        marip: [0, 0, 2, 2, 2],
        fs: 2,
        dist: 5,
        stab: 1,
        conditions: ['Restrained'],
      },
      {
        name: 'Goblin Stinker',
        subtitle: 'Level 1 · Horde Controller',
        initials: 'GS',
        stamina: [10, 10],
        marip: [-2, 1, 0, 0, 2],
        fs: 1,
        dist: 5,
        stab: 0,
        conditions: [],
      },
    ],
  },
] as const

export const TERRAIN_ROWS: readonly TerrainRowSeed[] = [
  {
    object: 'Toppled barricade — light cover along the eastern lane.',
    stamina: [6, 8] as const,
    note: 'Burning; end of round 1d4 to adjacent.',
  },
  {
    object: 'Ritual circle (inactive). Chalk smeared, runes still warm.',
    stamina: [0, 0] as const,
    note: 'Anyone ending turn inside tests Stability (15+).',
  },
] as const

/** Master list for the add-condition picker (sorted for stable UI). */
export const CONDITION_CATALOG: readonly string[] = [
  'Bleeding',
  'Dazed',
  'Frightened',
  'Grabbed',
  'Judged',
  'Marked',
  'Prone',
  'Restrained',
  'Slowed',
  'Surprised',
  'Taunted',
  'Weakened',
].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

export const MARIP_HEADERS = [
  { letter: 'M', title: 'Might' },
  { letter: 'A', title: 'Agility' },
  { letter: 'R', title: 'Reason' },
  { letter: 'I', title: 'Intuition' },
  { letter: 'P', title: 'Presence' },
] as const

/** 6 columns: group | creatures (shrinks first) | stamina | MARIP | FS/SPD/Stab | conditions (width = icon row) */
export const ROSTER_GRID_TEMPLATE =
  '5.5rem minmax(0,1fr) minmax(7rem,8.5rem) minmax(5.75rem,7.25rem) 7.25rem max-content'

/** MIME type for HTML5 drag payload: source encounter group index (stringified). */
export const ENCOUNTER_GROUP_DRAG_MIME = 'application/x-live-steel-encounter-group-index'

/** MIME type for HTML5 drag payload: JSON {@link MonsterDragPayload}. */
export const MONSTER_DRAG_MIME = 'application/x-live-steel-monster-ref'

/** Drag payload: top-level creature omits `fromMinion`; minion child rows include it. */
export type MonsterDragPayload = {
  fromGroup: number
  fromMonster: number
  fromMinion?: number
}

export function parseMonsterDragPayload(raw: string): MonsterDragPayload | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    if (typeof o.fromGroup !== 'number' || !Number.isInteger(o.fromGroup)) return null
    if (typeof o.fromMonster !== 'number' || !Number.isInteger(o.fromMonster)) return null
    const payload: MonsterDragPayload = { fromGroup: o.fromGroup, fromMonster: o.fromMonster }
    if (o.fromMinion != null) {
      if (typeof o.fromMinion !== 'number' || !Number.isInteger(o.fromMinion)) return null
      payload.fromMinion = o.fromMinion
    }
    return payload
  } catch {
    return null
  }
}

/**
 * Whether a drop target accepts the current drag: top-level monsters on top-level rows, or solo
 * creatures onto a horde minion row to join that squad; minions on horde minion rows (reorder / move).
 */
export function monsterDragDropIsValid(
  source: MonsterDragPayload,
  toGroup: number,
  toMonster: number,
  toMinion: number | null,
  groups: readonly EncounterGroup[],
): boolean {
  const destMonster = groups[toGroup]?.monsters[toMonster]
  const destHorde = (destMonster?.minions?.length ?? 0) > 0

  const fromMini = source.fromMinion
  const fromG = source.fromGroup
  const fromParent = source.fromMonster
  if (fromMini == null) {
    const src = groups[fromG]?.monsters[fromParent]
    const srcIsSolo = (src?.minions?.length ?? 0) === 0
    if (toMinion == null) {
      return !(fromG === toGroup && fromParent === toMonster)
    }
    if (!destHorde || !srcIsSolo) return false
    return !(fromG === toGroup && fromParent === toMonster)
  }
  if (toMinion == null || !destHorde) return false
  if (fromG === toGroup && fromParent === toMonster) {
    return fromMini !== toMinion
  }
  return true
}

/** Reorder minions within one parent monster; returns null if indices are invalid or no-op. */
export function reorderMinionsInHorde(
  groups: EncounterGroup[],
  groupIndex: number,
  parentMonsterIndex: number,
  fromMinion: number,
  toMinion: number,
): EncounterGroup[] | null {
  const g = groups[groupIndex]
  if (!g) return null
  const parent = g.monsters[parentMonsterIndex]
  const minions = parent?.minions
  if (!minions || minions.length === 0) return null
  const n = minions.length
  if (fromMinion < 0 || fromMinion >= n || toMinion < 0 || toMinion > n) return null
  const insertIndex = computeMonsterInsertIndex(0, fromMinion, 0, toMinion)
  if (insertIndex === null) return null
  const nextMinions = [...minions]
  const [moved] = nextMinions.splice(fromMinion, 1)
  nextMinions.splice(insertIndex, 0, moved!)
  return groups.map((gr, gi) => {
    if (gi !== groupIndex) return gr
    return {
      ...gr,
      monsters: gr.monsters.map((mon, mi) => {
        if (mi !== parentMonsterIndex) return mon
        const st = nextHordePoolStamina(mon, nextMinions)
        return { ...mon, minions: nextMinions, stamina: st }
      }),
    }
  })
}

/**
 * Move one minion from a horde into another (or reorder within the same horde).
 * If the source horde becomes empty, the parent becomes a solo monster (`minions` removed).
 */
export function transferMinionBetweenHordes(
  groups: EncounterGroup[],
  fromGroup: number,
  fromMonster: number,
  fromMinion: number,
  toGroup: number,
  toMonster: number,
  toMinion: number,
): EncounterGroup[] | null {
  if (fromGroup === toGroup && fromMonster === toMonster) {
    return reorderMinionsInHorde(groups, fromGroup, fromMonster, fromMinion, toMinion)
  }

  const fromG = groups[fromGroup]
  const toG = groups[toGroup]
  if (!fromG || !toG) return null
  const fromParent = fromG.monsters[fromMonster]
  const toParent = toG.monsters[toMonster]
  const fromList = fromParent?.minions
  const toList = toParent?.minions
  if (!fromList || fromMinion < 0 || fromMinion >= fromList.length) return null
  if (!toList || toList.length === 0) return null
  if (toMinion < 0 || toMinion > toList.length) return null

  const moved = fromList[fromMinion]!
  const movedMax = minionAliveMaxContribution(moved, fromParent, fromList)
  const oldFromMax = hordePoolMaxAliveFromMinions(fromParent, fromList)
  const share =
    oldFromMax > 0 ? Math.min(fromParent.stamina[0], Math.round((fromParent.stamina[0] * movedMax) / oldFromMax)) : 0

  const nextFromMinions = [...fromList]
  nextFromMinions.splice(fromMinion, 1)
  const fromParentNext: Monster =
    nextFromMinions.length === 0
      ? (() => {
          const { minions: _drop, ...rest } = fromParent
          return { ...rest, stamina: staminaAfterHordeDemotedToSolo(fromParent) }
        })()
      : {
          ...fromParent,
          minions: nextFromMinions,
          stamina: normalizeStamina(
            fromParent.stamina[0] - share,
            hordePoolMaxFromMinions(fromParent, nextFromMinions),
          ),
        }

  const nextToMinions = [...toList]
  nextToMinions.splice(toMinion, 0, moved)
  const toStamina = nextHordePoolStamina(toParent, nextToMinions, { addCurrent: share })
  const toParentNext: Monster = { ...toParent, minions: nextToMinions, stamina: toStamina }

  return groups.map((gr, gi) => {
    if (gi !== fromGroup && gi !== toGroup) return gr
    return {
      ...gr,
      monsters: gr.monsters.map((m, mi) => {
        if (gi === fromGroup && mi === fromMonster) return fromParentNext
        if (gi === toGroup && mi === toMonster) return toParentNext
        return m
      }),
    }
  })
}

export function remapCaptainIdsAfterMonsterRemovedFromGroup(
  groups: EncounterGroup[],
  groupIndex: number,
  removedMonsterIndex: number,
): EncounterGroup[] {
  return groups.map((g) => ({
    ...g,
    monsters: g.monsters.map((m) => {
      if (!m.captainId) return m
      const ref = m.captainId
      if (ref.groupIndex === groupIndex && ref.monsterIndex === removedMonsterIndex) {
        return { ...m, captainId: null }
      }
      if (ref.groupIndex === groupIndex && ref.monsterIndex > removedMonsterIndex) {
        return { ...m, captainId: { ...ref, monsterIndex: ref.monsterIndex - 1 } }
      }
      return m
    }),
  }))
}

/**
 * Merge a solo top-level monster into another creature's horde at `toMinion` (insert-before index).
 * Removes the solo row and remaps captain ids that referenced it.
 */
export function mergeTopLevelMonsterIntoHorde(
  groups: EncounterGroup[],
  fromGroup: number,
  fromMonster: number,
  toGroup: number,
  toMonster: number,
  toMinion: number,
): EncounterGroup[] | null {
  const solo = groups[fromGroup]?.monsters[fromMonster]
  const targetPre = groups[toGroup]?.monsters[toMonster]
  if (!solo || (solo.minions?.length ?? 0) > 0) return null
  const horde = targetPre?.minions
  if (!targetPre || !horde || horde.length === 0) return null
  if (toMinion < 0 || toMinion > horde.length) return null
  if (fromGroup === toGroup && fromMonster === toMonster) return null

  const entry: MinionEntry = {
    name: solo.name,
    initials: solo.initials,
    conditions: [...solo.conditions],
    dead: false,
  }

  let next: EncounterGroup[]

  if (fromGroup === toGroup) {
    next = groups.map((g, gi) => {
      if (gi !== fromGroup) return g
      const monsters = g.monsters.map((m) => ({
        ...m,
        minions: m.minions ? m.minions.map((x) => ({ ...x })) : undefined,
      }))
      if (!monsters[fromMonster]) return g
      monsters.splice(fromMonster, 1)
      const targetIdx = fromMonster < toMonster ? toMonster - 1 : toMonster
      const parent = monsters[targetIdx]
      if (!parent?.minions) return g
      const nextH = [...parent.minions]
      nextH.splice(toMinion, 0, entry)
      const st = nextHordePoolStamina(parent, nextH, { addCurrent: solo.stamina[0] })
      monsters[targetIdx] = { ...parent, minions: nextH, stamina: st }
      return { ...g, monsters }
    })
  } else {
    next = groups.map((g, gi) => {
      if (gi === fromGroup) {
        const monsters = g.monsters
          .filter((_, i) => i !== fromMonster)
          .map((m) => ({
            ...m,
            minions: m.minions ? m.minions.map((x) => ({ ...x })) : undefined,
          }))
        return { ...g, monsters }
      }
      if (gi === toGroup) {
        const monsters = g.monsters.map((m) => ({
          ...m,
          minions: m.minions ? m.minions.map((x) => ({ ...x })) : undefined,
        }))
        const parent = monsters[toMonster]
        if (!parent?.minions) return g
        const nextH = [...parent.minions]
        nextH.splice(toMinion, 0, entry)
        const st = nextHordePoolStamina(parent, nextH, { addCurrent: solo.stamina[0] })
        monsters[toMonster] = { ...parent, minions: nextH, stamina: st }
        return { ...g, monsters }
      }
      return g
    })
  }

  return remapCaptainIdsAfterMonsterRemovedFromGroup(next, fromGroup, fromMonster)
}

export function remapEotConfirmedAfterSoloMergedIntoHorde(
  prev: ReadonlyMap<number, ReadonlySet<string>>,
  groupCount: number,
  fromGroup: number,
  fromMonster: number,
  toGroup: number,
  toMonsterBeforeRemove: number,
  toMinion: number,
): Map<number, Set<string>> {
  const out = new Map<number, Set<string>>()
  const targetMonsterSameGroup =
    fromGroup === toGroup && fromMonster < toMonsterBeforeRemove
      ? toMonsterBeforeRemove - 1
      : toMonsterBeforeRemove

  if (fromGroup === toGroup) {
    for (let gi = 0; gi < groupCount; gi++) {
      const src = prev.get(gi) ?? new Set<string>()
      if (gi !== fromGroup) {
        out.set(gi, new Set(src))
        continue
      }
      const movedTails: string[] = []
      const dst = new Set<string>()
      for (const key of src) {
        const parts = key.split(':')
        if (parts.length < 2) {
          dst.add(key)
          continue
        }
        const mi = Number(parts[0])
        if (!Number.isFinite(mi)) {
          dst.add(key)
          continue
        }
        if (parts.length === 2) {
          const tail = parts[1]!
          if (mi === fromMonster) {
            movedTails.push(tail)
            continue
          }
          const nmi = mi > fromMonster ? mi - 1 : mi
          dst.add(`${nmi}:${tail}`)
          continue
        }
        const mni = Number(parts[1])
        if (!Number.isFinite(mni)) {
          dst.add(key)
          continue
        }
        const tail = parts.slice(2).join(':')
        const nmi = mi > fromMonster ? mi - 1 : mi
        let nmni = mni
        if (nmi === targetMonsterSameGroup && mni >= toMinion) nmni += 1
        dst.add(`${nmi}:${nmni}:${tail}`)
      }
      for (const t of movedTails) {
        dst.add(`${targetMonsterSameGroup}:${toMinion}:${t}`)
      }
      out.set(gi, dst)
    }
    return out
  }

  const extractFrom = (
    src: ReadonlySet<string>,
  ): { next: Set<string>; movedTails: string[] } => {
    const movedTails: string[] = []
    const dst = new Set<string>()
    for (const key of src) {
      const parts = key.split(':')
      if (parts.length < 2) {
        dst.add(key)
        continue
      }
      const mi = Number(parts[0])
      if (!Number.isFinite(mi)) {
        dst.add(key)
        continue
      }
      if (parts.length === 2) {
        const tail = parts[1]!
        if (mi === fromMonster) {
          movedTails.push(tail)
          continue
        }
        const nmi = mi > fromMonster ? mi - 1 : mi
        dst.add(`${nmi}:${tail}`)
        continue
      }
      const mni = Number(parts[1])
      if (!Number.isFinite(mni)) {
        dst.add(key)
        continue
      }
      const tail = parts.slice(2).join(':')
      const nmi = mi > fromMonster ? mi - 1 : mi
      dst.add(`${nmi}:${mni}:${tail}`)
    }
    return { next: dst, movedTails }
  }

  const mergeDest = (src: ReadonlySet<string>, tails: readonly string[]): Set<string> => {
    const dst = new Set<string>()
    for (const key of src) {
      const parts = key.split(':')
      if (parts.length < 3) {
        dst.add(key)
        continue
      }
      const mi = Number(parts[0])
      const mni = Number(parts[1])
      if (!Number.isFinite(mi) || !Number.isFinite(mni)) {
        dst.add(key)
        continue
      }
      const tail = parts.slice(2).join(':')
      if (mi === toMonsterBeforeRemove && mni >= toMinion) {
        dst.add(`${mi}:${mni + 1}:${tail}`)
        continue
      }
      dst.add(key)
    }
    for (const t of tails) {
      dst.add(`${toMonsterBeforeRemove}:${toMinion}:${t}`)
    }
    return dst
  }

  const { next: afterFrom, movedTails } = extractFrom(prev.get(fromGroup) ?? new Set<string>())

  for (let gi = 0; gi < groupCount; gi++) {
    if (gi === fromGroup) {
      out.set(gi, afterFrom)
    } else if (gi === toGroup) {
      out.set(gi, mergeDest(prev.get(toGroup) ?? new Set<string>(), movedTails))
    } else {
      out.set(gi, new Set(prev.get(gi) ?? []))
    }
  }
  return out
}

/** Remap minion-slot EoT keys after moving a minion to another horde (or another parent in the same group). */
export function remapEotConfirmedAfterMinionTransferBetweenHordes(
  prev: ReadonlyMap<number, ReadonlySet<string>>,
  groupCount: number,
  fromGroup: number,
  fromMonster: number,
  fromMinion: number,
  toGroup: number,
  toMonster: number,
  toMinion: number,
): Map<number, Set<string>> {
  if (fromGroup === toGroup && fromMonster === toMonster) {
    return remapEotConfirmedAfterMinionReorder(
      prev,
      groupCount,
      fromGroup,
      fromMonster,
      fromMinion,
      toMinion,
    )
  }

  const out = new Map<number, Set<string>>()

  if (fromGroup === toGroup) {
    for (let gi = 0; gi < groupCount; gi++) {
      const src = prev.get(gi) ?? new Set<string>()
      if (gi !== fromGroup) {
        out.set(gi, new Set(src))
        continue
      }
      const movedTails: string[] = []
      const dst = new Set<string>()
      for (const key of src) {
        const parts = key.split(':')
        if (parts.length < 3) {
          dst.add(key)
          continue
        }
        const mi = Number(parts[0])
        const mni = Number(parts[1])
        if (!Number.isFinite(mi) || !Number.isFinite(mni)) {
          dst.add(key)
          continue
        }
        const tail = parts.slice(2).join(':')
        if (mi === fromMonster && mni === fromMinion) {
          movedTails.push(tail)
          continue
        }
        let nmni = mni
        if (mi === fromMonster && mni > fromMinion) nmni = mni - 1
        if (mi === toMonster && mni >= toMinion) nmni += 1
        dst.add(`${mi}:${nmni}:${tail}`)
      }
      for (const t of movedTails) {
        dst.add(`${toMonster}:${toMinion}:${t}`)
      }
      out.set(gi, dst)
    }
    return out
  }

  const extractFromSource = (
    src: ReadonlySet<string>,
  ): { next: Set<string>; movedTails: string[] } => {
    const movedTails: string[] = []
    const dst = new Set<string>()
    for (const key of src) {
      const parts = key.split(':')
      if (parts.length < 3) {
        dst.add(key)
        continue
      }
      const mi = Number(parts[0])
      const mni = Number(parts[1])
      if (!Number.isFinite(mi) || !Number.isFinite(mni)) {
        dst.add(key)
        continue
      }
      const tail = parts.slice(2).join(':')
      if (mi === fromMonster && mni === fromMinion) {
        movedTails.push(tail)
        continue
      }
      if (mi === fromMonster && mni > fromMinion) {
        dst.add(`${mi}:${mni - 1}:${tail}`)
        continue
      }
      dst.add(key)
    }
    return { next: dst, movedTails }
  }

  const mergeIntoDest = (
    src: ReadonlySet<string>,
    movedTails: readonly string[],
  ): Set<string> => {
    const dst = new Set<string>()
    for (const key of src) {
      const parts = key.split(':')
      if (parts.length < 3) {
        dst.add(key)
        continue
      }
      const mi = Number(parts[0])
      const mni = Number(parts[1])
      if (!Number.isFinite(mi) || !Number.isFinite(mni)) {
        dst.add(key)
        continue
      }
      const tail = parts.slice(2).join(':')
      if (mi === toMonster && mni >= toMinion) {
        dst.add(`${mi}:${mni + 1}:${tail}`)
        continue
      }
      dst.add(key)
    }
    for (const t of movedTails) {
      dst.add(`${toMonster}:${toMinion}:${t}`)
    }
    return dst
  }

  const { next: afterFrom, movedTails } = extractFromSource(prev.get(fromGroup) ?? new Set<string>())

  for (let gi = 0; gi < groupCount; gi++) {
    if (gi === fromGroup) {
      out.set(gi, afterFrom)
    } else if (gi === toGroup) {
      out.set(gi, mergeIntoDest(prev.get(toGroup) ?? new Set<string>(), movedTails))
    } else {
      out.set(gi, new Set(prev.get(gi) ?? []))
    }
  }

  return out
}

/** After a minion is removed from its parent, map an open minion stat-card slot on that parent. */
export function mapMinionDrawerSlotAfterMinionRemoved(fromMinion: number, slot: number): number | null {
  if (slot === fromMinion) return null
  if (slot > fromMinion) return slot - 1
  return slot
}

/** After a minion is inserted into a parent, map an open minion stat-card slot on that parent. */
export function mapMinionDrawerSlotAfterMinionInserted(toMinion: number, slot: number): number {
  if (slot >= toMinion) return slot + 1
  return slot
}

/** Map a minion slot index after reordering minions `fromMinion` → drop target `toMinion`. */
export function mapMinionIndexAfterReorder(
  fromMinion: number,
  toMinion: number,
  oldMinionIndex: number,
): number {
  const ins = computeMonsterInsertIndex(0, fromMinion, 0, toMinion)
  if (ins === null) return oldMinionIndex
  if (oldMinionIndex === fromMinion) return ins
  let i = oldMinionIndex > fromMinion ? oldMinionIndex - 1 : oldMinionIndex
  if (i >= ins) i += 1
  return i
}

/** Remap EoT confirmation keys `parent:minion:label` after minion reorder within one parent. */
export function remapEotConfirmedAfterMinionReorder(
  prev: ReadonlyMap<number, ReadonlySet<string>>,
  groupCount: number,
  groupIndex: number,
  parentMonsterIndex: number,
  fromMinion: number,
  toMinion: number,
): Map<number, Set<string>> {
  const ins = computeMonsterInsertIndex(0, fromMinion, 0, toMinion)
  if (ins === null) {
    return new Map(Array.from({ length: groupCount }, (_, i) => [i, new Set(prev.get(i) ?? [])]))
  }
  const out = new Map<number, Set<string>>()
  for (let gi = 0; gi < groupCount; gi++) {
    const src = prev.get(gi) ?? new Set<string>()
    const dst = new Set<string>()
    if (gi !== groupIndex) {
      for (const key of src) dst.add(key)
      out.set(gi, dst)
      continue
    }
    for (const key of src) {
      const parts = key.split(':')
      if (parts.length < 3) {
        dst.add(key)
        continue
      }
      const mi = Number(parts[0])
      const mni = Number(parts[1])
      if (!Number.isFinite(mi) || !Number.isFinite(mni)) {
        dst.add(key)
        continue
      }
      const tail = parts.slice(2).join(':')
      if (mi !== parentMonsterIndex) {
        dst.add(key)
        continue
      }
      if (mni === fromMinion) {
        dst.add(`${mi}:${ins}:${tail}`)
      } else {
        let mni2 = mni > fromMinion ? mni - 1 : mni
        if (mni2 >= ins) mni2 += 1
        dst.add(`${mi}:${mni2}:${tail}`)
      }
    }
    out.set(gi, dst)
  }
  return out
}

/** Remap EoT keys after removing one minion from a horde (or demoting the parent to solo when the last minion is removed). */
export function remapEotConfirmedAfterMinionRemoved(
  prev: ReadonlyMap<number, ReadonlySet<string>>,
  groupCount: number,
  groupIndex: number,
  parentMonsterIndex: number,
  removedMinionIndex: number,
  demotedToSolo: boolean,
): Map<number, Set<string>> {
  const out = new Map<number, Set<string>>()
  for (let gi = 0; gi < groupCount; gi++) {
    const src = prev.get(gi) ?? new Set<string>()
    const dst = new Set<string>()
    if (gi !== groupIndex) {
      for (const key of src) dst.add(key)
      out.set(gi, dst)
      continue
    }
    for (const key of src) {
      const parts = key.split(':')
      if (parts.length < 3) {
        dst.add(key)
        continue
      }
      const mi = Number(parts[0])
      const mni = Number(parts[1])
      if (!Number.isFinite(mi) || !Number.isFinite(mni)) {
        dst.add(key)
        continue
      }
      const tail = parts.slice(2).join(':')
      if (mi !== parentMonsterIndex) {
        dst.add(key)
        continue
      }
      if (demotedToSolo) {
        continue
      }
      if (mni === removedMinionIndex) continue
      const mni2 = mni > removedMinionIndex ? mni - 1 : mni
      dst.add(`${mi}:${mni2}:${tail}`)
    }
    out.set(gi, dst)
  }
  return out
}

/** Move parent-level EoT keys (`mi:label`) to first minion slot (`mi:0:label`) after converting a solo monster to a squad. */
export function remapEotConfirmedAfterConvertToSquad(
  prev: ReadonlyMap<number, ReadonlySet<string>>,
  groupCount: number,
  groupIndex: number,
  monsterIndex: number,
): Map<number, Set<string>> {
  const out = new Map<number, Set<string>>()
  for (let gi = 0; gi < groupCount; gi++) {
    const src = prev.get(gi) ?? new Set<string>()
    const dst = new Set<string>()
    if (gi !== groupIndex) {
      for (const key of src) dst.add(key)
      out.set(gi, dst)
      continue
    }
    for (const key of src) {
      const parts = key.split(':')
      const mi = Number(parts[0])
      if (!Number.isFinite(mi) || mi !== monsterIndex) {
        dst.add(key)
        continue
      }
      if (parts.length >= 3) {
        dst.add(key)
        continue
      }
      const tail = parts.slice(1).join(':')
      dst.add(`${mi}:0:${tail}`)
    }
    out.set(gi, dst)
  }
  return out
}

/** MIME type for HTML5 drag payload: JSON `{ fromGroup, fromMonster, fromMinion?, label }`. */
export const CONDITION_DRAG_MIME = 'application/x-live-steel-condition-ref'

/** Identifies a monster row or a specific minion child for condition transfer. */
export type ConditionCreatureRef = {
  groupIndex: number
  monsterIndex: number
  /** `null` = monster / minion parent row; otherwise minion slot index. */
  minionIndex: number | null
}

export function parseConditionDragPayload(raw: string): {
  fromGroup: number
  fromMonster: number
  fromMinion: number | null
  label: string
} | null {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>
    if (
      typeof o.fromGroup !== 'number' ||
      typeof o.fromMonster !== 'number' ||
      typeof o.label !== 'string' ||
      !Number.isInteger(o.fromGroup) ||
      !Number.isInteger(o.fromMonster)
    ) {
      return null
    }
    let fromMinion: number | null = null
    if (o.fromMinion != null) {
      if (typeof o.fromMinion !== 'number' || !Number.isInteger(o.fromMinion)) return null
      fromMinion = o.fromMinion
    }
    return { fromGroup: o.fromGroup, fromMonster: o.fromMonster, fromMinion, label: o.label }
  } catch {
    return null
  }
}

function creatureRefEquals(a: ConditionCreatureRef, b: ConditionCreatureRef): boolean {
  return (
    a.groupIndex === b.groupIndex &&
    a.monsterIndex === b.monsterIndex &&
    a.minionIndex === b.minionIndex
  )
}

function readConditionEntry(
  groups: readonly EncounterGroup[],
  ref: ConditionCreatureRef,
  label: string,
): ConditionEntry | null {
  const m = groups[ref.groupIndex]?.monsters[ref.monsterIndex]
  if (!m) return null
  if (ref.minionIndex == null) {
    const c = m.conditions.find((x) => x.label === label)
    return c ? { ...c } : null
  }
  const mn = m.minions?.[ref.minionIndex]
  if (!mn) return null
  const c = mn.conditions.find((x) => x.label === label)
  return c ? { ...c } : null
}

function removeConditionFromCreature(
  m: Monster,
  minionIndex: number | null,
  label: string,
): Monster {
  if (minionIndex == null) {
    const idx = m.conditions.findIndex((c) => c.label === label)
    if (idx < 0) return m
    return { ...m, conditions: m.conditions.filter((_, i) => i !== idx) }
  }
  const minions = m.minions
  if (!minions) return m
  const mi = minionIndex
  if (mi < 0 || mi >= minions.length) return m
  return {
    ...m,
    minions: minions.map((mn, i) => {
      if (i !== mi) return mn
      const idx = mn.conditions.findIndex((c) => c.label === label)
      if (idx < 0) return mn
      return { ...mn, conditions: mn.conditions.filter((_, j) => j !== idx) }
    }),
  }
}

function addOrSetConditionOnCreature(
  m: Monster,
  minionIndex: number | null,
  entry: ConditionEntry,
): Monster {
  if (minionIndex == null) {
    const idx = m.conditions.findIndex((c) => c.label === entry.label)
    if (idx >= 0) {
      return {
        ...m,
        conditions: m.conditions.map((c, i) => (i === idx ? { ...c, state: entry.state } : c)),
      }
    }
    return { ...m, conditions: [...m.conditions, { ...entry }] }
  }
  const minions = m.minions
  if (!minions) return m
  const mi = minionIndex
  if (mi < 0 || mi >= minions.length) return m
  return {
    ...m,
    minions: minions.map((mn, i) => {
      if (i !== mi) return mn
      const idx = mn.conditions.findIndex((c) => c.label === entry.label)
      if (idx >= 0) {
        return {
          ...mn,
          conditions: mn.conditions.map((c, j) => (j === idx ? { ...c, state: entry.state } : c)),
        }
      }
      return { ...mn, conditions: [...mn.conditions, { ...entry }] }
    }),
  }
}

/**
 * Remove `label` from `from` and add/set it on `to` with the same {@link ConditionEntry.state}.
 * Returns `null` if source has no such condition or refs are identical.
 */
export function transferConditionBetweenCreatures(
  groups: EncounterGroup[],
  from: ConditionCreatureRef,
  to: ConditionCreatureRef,
  label: string,
): EncounterGroup[] | null {
  if (creatureRefEquals(from, to)) return null
  const entry = readConditionEntry(groups, from, label)
  if (!entry) return null

  if (from.groupIndex === to.groupIndex && from.monsterIndex === to.monsterIndex) {
    const gi = from.groupIndex
    const mi = from.monsterIndex
    const g = groups[gi]
    if (!g) return null
    const m = g.monsters[mi]
    if (!m) return null
    const after = addOrSetConditionOnCreature(
      removeConditionFromCreature(m, from.minionIndex, label),
      to.minionIndex,
      entry,
    )
    return groups.map((grp, idx) =>
      idx === gi
        ? { ...grp, monsters: grp.monsters.map((mm, i) => (i === mi ? after : mm)) }
        : grp,
    )
  }

  return groups.map((g, gi) => ({
    ...g,
    monsters: g.monsters.map((m, mi) => {
      if (gi === from.groupIndex && mi === from.monsterIndex) {
        return removeConditionFromCreature(m, from.minionIndex, label)
      }
      if (gi === to.groupIndex && mi === to.monsterIndex) {
        return addOrSetConditionOnCreature(m, to.minionIndex, entry)
      }
      return m
    }),
  }))
}

/**
 * Insert index in the per-group monsters array after removing the source monster.
 * `toMonster` is the drop target's monster index in pre-move coordinates (0..length inclusive for append).
 * For same-group moves, this is "insert before that monster" except when the source is directly above
 * the target (`toMonster === fromMonster + 1`): then we insert after the target so the row reads as
 * swapping / moving one step down (otherwise "insert before" would be a no-op).
 */
export function computeMonsterInsertIndex(
  fromGroup: number,
  fromMonster: number,
  toGroup: number,
  toMonster: number,
): number | null {
  if (fromGroup === toGroup && fromMonster === toMonster) return null
  if (fromGroup === toGroup) {
    if (fromMonster < toMonster) {
      if (toMonster === fromMonster + 1) return toMonster
      return toMonster - 1
    }
    return toMonster
  }
  return toMonster
}

function remapCaptainRefAfterMonsterMove(
  ref: CaptainRef,
  fromGroup: number,
  fromMonster: number,
  toGroup: number,
  insertIndex: number,
): CaptainRef {
  const g = ref.groupIndex
  let m = ref.monsterIndex
  if (g === fromGroup && m === fromMonster) {
    return { groupIndex: toGroup, monsterIndex: insertIndex }
  }
  if (g === fromGroup && m > fromMonster) {
    m -= 1
  }
  if (g === toGroup && m >= insertIndex) {
    m += 1
  }
  return { groupIndex: g, monsterIndex: m }
}

/**
 * Move one monster to another index (possibly another group). Remaps {@link Monster.captainId} on all monsters.
 */
export function moveMonsterInEncounterWithCaptainRemap(
  groups: EncounterGroup[],
  fromGroup: number,
  fromMonster: number,
  toGroup: number,
  toMonster: number,
): EncounterGroup[] | null {
  if (fromGroup < 0 || toGroup < 0 || fromGroup >= groups.length || toGroup >= groups.length) {
    return null
  }
  const src = groups[fromGroup]?.monsters
  const destLen = groups[toGroup]?.monsters.length
  if (!src || fromMonster < 0 || fromMonster >= src.length || destLen === undefined) return null
  if (toMonster < 0 || toMonster > destLen) return null

  const insertIndex = computeMonsterInsertIndex(fromGroup, fromMonster, toGroup, toMonster)
  if (insertIndex === null) return null

  const monster = src[fromMonster]!
  const next = groups.map((g) => ({
    ...g,
    monsters: [...g.monsters],
  }))

  next[fromGroup]!.monsters.splice(fromMonster, 1)
  next[toGroup]!.monsters.splice(insertIndex, 0, monster)

  return next.map((g) => ({
    ...g,
    monsters: g.monsters.map((m) => {
      if (!m.captainId) return m
      const ref = remapCaptainRefAfterMonsterMove(
        m.captainId,
        fromGroup,
        fromMonster,
        toGroup,
        insertIndex,
      )
      if (ref.groupIndex === m.captainId.groupIndex && ref.monsterIndex === m.captainId.monsterIndex) {
        return m
      }
      return { ...m, captainId: ref }
    }),
  }))
}

/** Remap EoT confirmation keys after a monster move (indices are per-group). */
export function remapEotConfirmedAfterMonsterMove(
  prev: ReadonlyMap<number, ReadonlySet<string>>,
  groupCount: number,
  fromGroup: number,
  fromMonster: number,
  toGroup: number,
  toMonster: number,
): Map<number, Set<string>> {
  const ins = computeMonsterInsertIndex(fromGroup, fromMonster, toGroup, toMonster)
  if (ins === null) {
    return new Map(Array.from({ length: groupCount }, (_, i) => [i, new Set(prev.get(i) ?? [])]))
  }

  const out = new Map<number, Set<string>>()
  for (let gi = 0; gi < groupCount; gi++) {
    const src = prev.get(gi) ?? new Set<string>()
    const dst = new Set<string>()

    if (gi === fromGroup && gi !== toGroup) {
      for (const key of src) {
        const parts = key.split(':')
        if (parts.length < 2) {
          dst.add(key)
          continue
        }
        const mi = Number(parts[0])
        if (!Number.isFinite(mi)) {
          dst.add(key)
          continue
        }
        if (mi === fromMonster) continue
        const tail = parts.slice(1).join(':')
        if (mi > fromMonster) dst.add(`${mi - 1}:${tail}`)
        else dst.add(key)
      }
    } else if (gi === toGroup && gi !== fromGroup) {
      for (const key of src) {
        const parts = key.split(':')
        if (parts.length < 2) {
          dst.add(key)
          continue
        }
        const mi = Number(parts[0])
        if (!Number.isFinite(mi)) {
          dst.add(key)
          continue
        }
        const tail = parts.slice(1).join(':')
        const newMi = mi >= ins ? mi + 1 : mi
        dst.add(`${newMi}:${tail}`)
      }
      const fromKeys = prev.get(fromGroup) ?? new Set<string>()
      for (const key of fromKeys) {
        const parts = key.split(':')
        if (parts.length < 2) continue
        const mi = Number(parts[0])
        if (!Number.isFinite(mi) || mi !== fromMonster) continue
        const tail = parts.slice(1).join(':')
        dst.add(`${ins}:${tail}`)
      }
    } else if (gi === fromGroup && gi === toGroup) {
      for (const key of src) {
        const parts = key.split(':')
        if (parts.length < 2) {
          dst.add(key)
          continue
        }
        const mi = Number(parts[0])
        if (!Number.isFinite(mi)) {
          dst.add(key)
          continue
        }
        const tail = parts.slice(1).join(':')
        if (mi === fromMonster) {
          dst.add(`${ins}:${tail}`)
        } else {
          const mi2 = mi > fromMonster ? mi - 1 : mi
          const mi3 = mi2 >= ins ? mi2 + 1 : mi2
          dst.add(`${mi3}:${tail}`)
        }
      }
    } else {
      for (const key of src) dst.add(key)
    }

    out.set(gi, dst)
  }
  return out
}

export function newEncounterGroupId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `eg-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/**
 * Move one item from `from` to `to` in a copy of the array (inclusive indices, same semantics as splice).
 */
export function moveIndexInArray<T>(items: readonly T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) {
    return [...items]
  }
  const next = [...items]
  const [x] = next.splice(from, 1)
  next.splice(to, 0, x!)
  return next
}

/**
 * After moving the encounter group at `from` to index `to`, map an old group index to its new index.
 */
export function remapEncounterGroupIndex(from: number, to: number, oldGroupIndex: number): number {
  if (oldGroupIndex === from) return to
  if (from < to) {
    if (oldGroupIndex > from && oldGroupIndex <= to) return oldGroupIndex - 1
    return oldGroupIndex
  }
  if (oldGroupIndex >= to && oldGroupIndex < from) return oldGroupIndex + 1
  return oldGroupIndex
}

/** Reorder encounter groups and remap {@link Monster.captainId} group indices to match. */
export function reorderEncounterGroupsWithCaptainRemap(
  groups: EncounterGroup[],
  from: number,
  to: number,
): EncounterGroup[] {
  const moved = moveIndexInArray(groups, from, to)
  return moved.map((g) => ({
    ...g,
    monsters: g.monsters.map((m) => {
      if (!m.captainId) return m
      const ref = m.captainId
      return {
        ...m,
        captainId: {
          groupIndex: remapEncounterGroupIndex(from, to, ref.groupIndex),
          monsterIndex: ref.monsterIndex,
        },
      }
    }),
  }))
}

// Match the roster grid so terrain stamina aligns with monster stamina.
export const terrainGridClass =
  'grid grid-cols-[5.5rem_minmax(0,1fr)_minmax(7rem,8.5rem)_minmax(5.75rem,7.25rem)_7.25rem_23.0625rem]'

export function conditionEntryFromLabel(label: string): ConditionEntry {
  return { label, state: 'neutral' }
}

export function cloneMinionEntries(
  seeds: readonly { name: string; initials: string; conditions: readonly string[]; dead?: boolean }[],
): MinionEntry[] {
  return seeds.map((s) => ({
    name: s.name,
    initials: s.initials,
    conditions: s.conditions.map(conditionEntryFromLabel),
    dead: s.dead ?? false,
  }))
}

/**
 * Resolve features for a monster seed: try the monster's own name in the bestiary first,
 * then fall back to the first minion's name (for minion groups with generic parent names
 * like "Minions"), then use inline seed features.
 */
function resolveFeatures(m: MonsterSeed): MonsterFeature[] {
  const fromName = featuresForMonster(m.name)
  if (fromName && fromName.length > 0) return fromName

  if (m.minions && m.minions.length > 0) {
    const fromMinion = featuresForMonster(m.minions[0]!.name)
    if (fromMinion && fromMinion.length > 0) return fromMinion
  }

  return m.features ? [...m.features] : []
}

export function cloneEncounterGroups(): EncounterGroup[] {
  return []
}

export function cloneMonster(m: Monster): Monster {
  return {
    name: m.name,
    subtitle: m.subtitle,
    initials: m.initials,
    stamina: [m.stamina[0], m.stamina[1]],
    marip: m.marip === null ? null : ([...m.marip] as unknown as Marip),
    fs: m.fs,
    dist: m.dist,
    stab: m.stab,
    conditions: m.conditions.map((c) => ({ ...c })),
    ...(m.minions
      ? { minions: m.minions.map((mn) => ({ ...mn, conditions: mn.conditions.map((c) => ({ ...c })) })) }
      : {}),
    ...(m.features ? { features: [...m.features] } : {}),
    captainId: m.captainId ? { ...m.captainId } : m.captainId,
    ...(m.custom ? { custom: { ...m.custom } } : {}),
  }
}

/** Subtitle line from custom level + type (e.g. "Level 2 · Horde · Artillery"). */
export function formatCustomSubtitle(level: number, monsterType: string): string {
  const parts: string[] = []
  if (level > 0) parts.push(`Level ${level}`)
  const t = monsterType.trim()
  if (t.length > 0) parts.push(t)
  return parts.join(' · ')
}

export function monsterHasStatCard(m: Monster): boolean {
  return (m.features?.length ?? 0) > 0 || m.custom != null
}

export type CustomMonsterPatch = {
  name?: string
  stamina?: [number, number]
  marip?: Marip | null
  fs?: number
  dist?: number
  stab?: number
  custom?: Partial<CustomMonsterStats>
}

export function applyCustomMonsterPatch(m: Monster, patch: CustomMonsterPatch): Monster {
  if (!m.custom) return m
  let custom: CustomMonsterStats = { ...m.custom, ...patch.custom }
  const name = patch.name ?? m.name
  let stamina = patch.stamina ?? m.stamina
  if (patch.stamina != null) {
    const max = stamina[1]
    stamina = [Math.min(stamina[0], max), max] as [number, number]
  }
  const marip = patch.marip !== undefined ? patch.marip : m.marip
  if (!m.minions?.length && patch.stamina != null) {
    custom = { ...custom, perMinionStamina: stamina[1] }
  }
  return {
    ...m,
    name,
    initials: deriveInitials(name),
    stamina: [stamina[0], stamina[1]],
    marip,
    fs: patch.fs ?? m.fs,
    dist: patch.dist ?? m.dist,
    stab: patch.stab ?? m.stab,
    custom,
    subtitle: formatCustomSubtitle(custom.level, custom.monsterType),
  }
}

export type CustomTerrainPatch = {
  object?: string
  stamina?: [number, number]
  note?: string
  notes?: string
  custom?: Partial<CustomTerrainStats>
}

export function applyCustomTerrainPatch(row: TerrainRowState, patch: CustomTerrainPatch): TerrainRowState {
  if (!row.custom) return row
  const nextCustom: CustomTerrainStats = { ...row.custom, ...patch.custom }
  let stamina = patch.stamina ?? row.stamina
  if (patch.stamina != null) {
    const max = stamina[1]
    stamina = [Math.min(stamina[0], max), max] as [number, number]
  }
  return {
    ...row,
    object: patch.object ?? row.object,
    stamina,
    note: patch.note ?? row.note,
    notes: patch.notes ?? row.notes,
    custom: nextCustom,
  }
}

export function cloneTerrainRows(): TerrainRowState[] {
  return []
}

/** Build encounter groups from the example seed data (for tests). */
export function cloneExampleEncounterGroups(): EncounterGroup[] {
  return ENCOUNTER_GROUPS.map((group, groupIndex) => ({
    id: newEncounterGroupId(),
    color: GROUP_COLOR_ORDER[groupIndex % GROUP_COLOR_ORDER.length]!,
    monsters: group.monsters.map((m) => ({
      name: m.name,
      subtitle: m.subtitle,
      initials: m.initials,
      stamina: [m.stamina[0], m.stamina[1]] as [number, number],
      marip: m.marip === null ? null : ([...m.marip] as unknown as Marip),
      fs: m.fs,
      dist: m.dist,
      stab: m.stab,
      conditions: m.conditions.map(conditionEntryFromLabel),
      ...(m.minions ? { minions: cloneMinionEntries(m.minions) } : {}),
      features: resolveFeatures(m),
    })),
  }))
}

/** Build terrain rows from the example seed data (for tests). */
export function cloneExampleTerrainRows(): TerrainRowState[] {
  return TERRAIN_ROWS.map((r) => ({
    object: r.object,
    stamina: [r.stamina[0], r.stamina[1]] as [number, number],
    note: r.note,
    ...(r.terrainName ? { terrainName: r.terrainName } : {}),
  }))
}

export const TERRAIN_DRAG_MIME = 'application/x-live-steel-terrain-index'

/**
 * Create a Monster from a bestiary entry name, with optional ordinal suffix
 * to disambiguate duplicates (e.g. "Goblin Assassin 2").
 */
export function monsterFromBestiary(bestiaryName: string, ordinalSuffix?: number): Monster {
  const sb: BestiaryStatblock | undefined = lookupStatblock(bestiaryName)
  const displayName = ordinalSuffix != null ? `${bestiaryName} ${ordinalSuffix}` : bestiaryName
  if (!sb) {
    return {
      name: displayName,
      subtitle: '',
      initials: deriveInitials(bestiaryName),
      stamina: [0, 0],
      marip: null,
      fs: 0,
      dist: 0,
      stab: 0,
      conditions: [],
      features: [],
    }
  }
  const stam = Number.parseInt(sb.stamina, 10)
  const stamina: [number, number] = Number.isNaN(stam) ? [0, 0] : [stam, stam]
  const features = featuresForMonster(bestiaryName) ?? []
  return {
    name: displayName,
    subtitle: bestiarySubtitle(sb),
    initials: deriveInitials(bestiaryName),
    stamina,
    marip: [sb.might, sb.agility, sb.reason, sb.intuition, sb.presence],
    fs: sb.free_strike,
    dist: sb.speed,
    stab: sb.stability,
    conditions: [],
    features,
  }
}

/** New user-defined creature: zeros for numerics, empty text fields, no bestiary features. */
export function blankCustomMonster(): Monster {
  const custom: CustomMonsterStats = {
    level: 0,
    ev: '',
    perMinionStamina: 0,
    monsterType: '',
    size: '',
    immunity: '',
    weakness: '',
    movement: '',
    notes: '',
  }
  return {
    name: 'Custom monster',
    subtitle: '',
    initials: deriveInitials('Custom monster'),
    stamina: [0, 0],
    marip: [0, 0, 0, 0, 0],
    fs: 0,
    dist: 0,
    stab: 0,
    conditions: [],
    features: [],
    custom,
  }
}

/** New user-defined terrain: zeros for numerics, empty text fields. */
export function blankCustomTerrainRow(): TerrainRowState {
  const custom: CustomTerrainStats = {
    level: 0,
    ev: '',
    size: '',
  }
  return {
    object: 'Custom terrain',
    stamina: [0, 0],
    note: '',
    notes: '',
    custom,
  }
}

export function findConditionOnMonster(
  conditions: readonly ConditionEntry[],
  label: string,
): ConditionEntry | undefined {
  return conditions.find((c) => c.label === label)
}

export function conditionStateTitle(state: ConditionEntry['state']): string | undefined {
  if (state === 'eot') {
    return 'End of turn'
  }
  if (state === 'se') {
    return 'Save ends'
  }
  return undefined
}

export function conditionCatalogTooltip(label: string, active: ConditionEntry | undefined): string {
  if (active === undefined) {
    return `${label} (inactive)`
  }
  if (active.state === 'neutral') {
    return `${label} (neutral)`
  }
  const dur = conditionStateTitle(active.state)
  return dur ? `${label} (${dur})` : label
}

export function normalizeStamina(cur: number, max: number): [number, number] {
  const m = Math.max(0, Math.round(max))
  if (m === 0) {
    return [0, 0]
  }
  const c = Math.min(m, Math.max(0, Math.round(cur)))
  return [c, m]
}

/** Per-minion max stamina for one roster entry (alive or dead slot). */
function minionSlotMaxContribution(
  mn: MinionEntry,
  parent: Monster,
  contextMinions: readonly MinionEntry[],
): number {
  const per = maxStaminaForBestiaryName(mn.name)
  if (per > 0) return per
  const iv = minionInterval(parent.name, contextMinions[0]?.name)
  if (iv != null) return iv
  if (parent.custom != null) {
    const slot = parent.custom.perMinionStamina ?? 0
    if (slot > 0) return slot
  }
  return 0
}

/** Sum of per-minion max stamina for alive minions only (for proportional pool splits). */
export function hordePoolMaxAliveFromMinions(parent: Monster, minions: readonly MinionEntry[]): number {
  let sum = 0
  for (const mn of minions) {
    if (mn.dead) continue
    sum += minionSlotMaxContribution(mn, parent, minions)
  }
  return sum
}

/**
 * Pool stamina ceiling: sum of every minion slot (dead or alive each counts its slot max).
 * Stored as stamina[1] so the pool can be healed up to full roster capacity; current is capped by
 * {@link hordePoolMaxAliveFromMinions} when the roster changes.
 */
export function hordePoolMaxFromMinions(parent: Monster, minions: readonly MinionEntry[]): number {
  let sum = 0
  for (const mn of minions) {
    sum += minionSlotMaxContribution(mn, parent, minions)
  }
  return sum
}

function minionAliveMaxContribution(
  mn: MinionEntry,
  parent: Monster,
  contextMinions: readonly MinionEntry[],
): number {
  if (mn.dead) return 0
  return minionSlotMaxContribution(mn, parent, contextMinions)
}

/** Pool stamina after minion roster change; optional extra current (e.g. incoming solo's current). */
export function nextHordePoolStamina(
  parent: Monster,
  nextMinions: readonly MinionEntry[],
  opts?: { addCurrent?: number },
): [number, number] {
  const fullMax = hordePoolMaxFromMinions(parent, nextMinions)
  let cur = parent.stamina[0]
  if (opts?.addCurrent != null) {
    cur += opts.addCurrent
  }
  return normalizeStamina(cur, fullMax)
}

/** After toggling a minion dead/alive: preserve the current stamina and pool ceiling unchanged. */
export function hordePoolStaminaAfterMinionDeadToggle(
  parent: Monster,
  _nextMinions: readonly MinionEntry[],
): [number, number] {
  return [parent.stamina[0], parent.stamina[1]]
}

/** Solo creature stamina after its horde is removed (bestiary max, current capped). */
export function staminaAfterHordeDemotedToSolo(parent: Monster): [number, number] {
  const max = maxStaminaForBestiaryName(parent.name) || parent.stamina[1]
  return normalizeStamina(parent.stamina[0], max)
}

/** Stamina when a solo becomes a one-minion horde (carry over current, new max from roster). */
export function staminaAfterConvertSoloToHorde(parent: Monster, minions: readonly MinionEntry[]): [number, number] {
  return nextHordePoolStamina(parent, minions)
}

export function applyStaminaDelta(current: number, max: number, delta: number): [number, number] {
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

export function otherGroupIndexForColor(
  colorId: GroupColorId,
  encounterGroupColors: readonly GroupColorId[],
  thisGroupIndex: number,
): number | null {
  const idx = encounterGroupColors.findIndex((c, i) => i !== thisGroupIndex && c === colorId)
  return idx >= 0 ? idx : null
}

export function nextAvailableColor(usedColors: readonly GroupColorId[]): GroupColorId {
  const unused = GROUP_COLOR_ORDER.find((c) => !usedColors.includes(c))
  return unused ?? GROUP_COLOR_ORDER[usedColors.length % GROUP_COLOR_ORDER.length]!
}

export function nextUnusedColor(usedColors: readonly GroupColorId[]): GroupColorId | null {
  return GROUP_COLOR_ORDER.find((c) => !usedColors.includes(c)) ?? null
}

/** Picks a random unused color, or null if all colors are in use. */
export function randomUnusedColor(usedColors: readonly GroupColorId[]): GroupColorId | null {
  const unused = GROUP_COLOR_ORDER.filter((c) => !usedColors.includes(c))
  if (unused.length === 0) return null
  const i = Math.floor(Math.random() * unused.length)
  return unused[i]!
}
