import type { MonsterFeature, TerrainRowState } from './types'
import { mapFeatures } from './bestiary'
import terrainData from '../data/bestiary/Dynamic Terrain/terrain.json'

export type TerrainStatblock = {
  name: string
  featureblock_type: string
  level: number
  ev: string
  flavor: string
  stamina: string
  size: string
  stats?: { name: string; value: string }[]
  features?: unknown[]
}

export type TerrainUpgradeOption = {
  name: string
  cost?: string
  effect?: string
}

const terrainMap: ReadonlyMap<string, TerrainStatblock> = (() => {
  const map = new Map<string, TerrainStatblock>()
  for (const entry of (terrainData as { terrain: TerrainStatblock[] }).terrain) {
    if (!map.has(entry.name)) {
      map.set(entry.name, entry)
    }
  }
  return map
})()

export function lookupTerrain(name: string): TerrainStatblock | undefined {
  return terrainMap.get(name)
}

export function terrainNames(): readonly string[] {
  return [...terrainMap.keys()]
}

export function terrainFeatures(name: string): MonsterFeature[] {
  const sb = lookupTerrain(name)
  if (!sb?.features) return []
  return mapFeatures(sb.features as Parameters<typeof mapFeatures>[0])
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (v == null || typeof v !== 'object') return null
  return v as Record<string, unknown>
}

export function terrainUpgradeOptions(terrainName: string): TerrainUpgradeOption[] {
  const sb = lookupTerrain(terrainName)
  const features = sb?.features
  if (!features || !Array.isArray(features)) return []

  const upgradesFeatures = features.filter((f) => {
    const r = asRecord(f)
    const name = r?.name
    if (typeof name !== 'string') return false
    const n = name.trim().toLowerCase()
    return n === 'upgrades' || n === 'upgrade'
  })

  const out: TerrainUpgradeOption[] = []
  for (const f of upgradesFeatures) {
    const uf = asRecord(f)
    const effects = uf?.effects
    if (!Array.isArray(effects)) continue
    for (const e of effects) {
      const r = asRecord(e)
      if (!r) continue
      const n = r?.name
      if (typeof n !== 'string' || !n.trim()) continue
      const cost = typeof r.cost === 'string' ? r.cost : undefined
      const effect = typeof r.effect === 'string' ? r.effect : undefined
      out.push({ name: n, ...(cost ? { cost } : {}), ...(effect ? { effect } : {}) })
    }
  }

  // Dedupe by name (some sources may repeat).
  const seen = new Set<string>()
  return out.filter((u) => (seen.has(u.name) ? false : (seen.add(u.name), true)))
}

export function terrainRowFromBestiary(terrainName: string): TerrainRowState {
  const sb = lookupTerrain(terrainName)
  if (!sb) {
    return { object: terrainName, stamina: [0, 0], note: '', terrainName, upgrades: [] }
  }
  const stam = Number.parseInt(sb.stamina, 10)
  const stamina: [number, number] = Number.isNaN(stam) ? [0, 0] : [stam, stam]
  return {
    object: terrainName,
    stamina,
    note: sb.flavor,
    terrainName,
    upgrades: [],
  }
}
