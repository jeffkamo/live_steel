export type Marip = readonly [number, number, number, number, number]

export type ConditionState = 'neutral' | 'eot' | 'se'

export type ConditionEntry = {
  label: string
  state: ConditionState
}

export type Monster = {
  name: string
  subtitle: string
  initials: string
  stamina: [number, number]
  marip: Marip | null
  fs: number
  dist: number
  stab: number
  conditions: readonly ConditionEntry[]
}

export type GroupColorId =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'white'
  | 'grey'
  | 'black'

export type EncounterGroup = {
  monsters: Monster[]
  color: GroupColorId
}

/** Static encounter data uses plain condition names; clone maps them to {@link ConditionEntry}. */
export type MonsterSeed = Omit<Monster, 'conditions'> & { conditions: readonly string[] }

export type EncounterGroupSeed = {
  monsters: readonly MonsterSeed[]
}

export type TerrainRowState = {
  object: string
  stamina: [number, number]
  note: string
  conditions: readonly ConditionEntry[]
}

export type TerrainRowSeed = Omit<TerrainRowState, 'conditions'> & { conditions: readonly string[] }

export type GroupColorMenuState = {
  open: boolean
  anchor: HTMLElement | null
  monsterIndex: number | null
}
