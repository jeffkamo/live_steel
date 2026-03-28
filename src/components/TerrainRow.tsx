import type { TerrainRowState } from '../types'
import { terrainGridClass } from '../data'
import { EditableStaminaCell } from './EditableStaminaCell'
import { ConditionCatalogIconStrip } from './ConditionCatalogIconStrip'

export function TerrainRow({
  row,
  onStaminaChange,
}: {
  row: TerrainRowState
  onStaminaChange: (next: [number, number]) => void
}) {
  const [tc, tm] = row.stamina
  return (
    <div className={`${terrainGridClass} overflow-visible rounded-lg bg-zinc-900/80`}>
      <div className="flex h-full min-h-[3.75rem] items-center p-3 sm:min-h-[4rem] sm:p-3.5">
        <p className="text-[0.8rem] leading-relaxed text-zinc-100">{row.object}</p>
      </div>
      <div className="relative z-0 flex h-full min-h-[3.75rem] items-center justify-center overflow-visible p-3 hover:z-20 focus-within:z-20 sm:min-h-[4rem] sm:p-3.5">
        <EditableStaminaCell
          current={tc}
          max={tm}
          onChange={onStaminaChange}
          ariaLabel={`Edit stamina for terrain: ${row.object.slice(0, 48)}${row.object.length > 48 ? '…' : ''}`}
        />
      </div>
      <div className="flex h-full min-h-[3.75rem] flex-col justify-center gap-3 p-3 sm:min-h-[4rem] sm:p-3.5">
        <p className="text-[0.75rem] leading-snug text-zinc-400">{row.note}</p>
        <ConditionCatalogIconStrip conditions={row.conditions} interactive={false} />
      </div>
    </div>
  )
}
