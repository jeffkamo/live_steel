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

export function terrainRowFromBestiary(terrainName: string): TerrainRowState {
  const sb = lookupTerrain(terrainName)
  if (!sb) {
    return { object: terrainName, stamina: [0, 0], note: '', terrainName }
  }
  const stam = Number.parseInt(sb.stamina, 10)
  const stamina: [number, number] = Number.isNaN(stam) ? [0, 0] : [stam, stam]
  return {
    object: terrainName,
    stamina,
    note: sb.flavor,
    terrainName,
  }
}
