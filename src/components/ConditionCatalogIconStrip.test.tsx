import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConditionCatalogIconStrip } from './ConditionCatalogIconStrip'
import { CONDITION_CATALOG } from '../data'
import type { ConditionEntry } from '../types'

describe('ConditionCatalogIconStrip', () => {
  const noConditions: ConditionEntry[] = []
  const withBleeding: ConditionEntry[] = [{ label: 'Bleeding', state: 'neutral' }]
  const withBleedingEot: ConditionEntry[] = [{ label: 'Bleeding', state: 'eot' }]

  describe('non-interactive mode', () => {
    it('renders all 12 condition icons as span[role="img"]', () => {
      render(<ConditionCatalogIconStrip conditions={noConditions} interactive={false} />)
      for (const label of CONDITION_CATALOG) {
        expect(screen.getByTitle(`${label} (inactive)`)).toBeInTheDocument()
      }
    })

    it('does not render buttons', () => {
      render(<ConditionCatalogIconStrip conditions={noConditions} interactive={false} />)
      expect(screen.queryAllByRole('button')).toHaveLength(0)
    })

    it('marks active conditions with neutral tooltip', () => {
      render(<ConditionCatalogIconStrip conditions={withBleeding} interactive={false} />)
      expect(screen.getByTitle('Bleeding (neutral)')).toBeInTheDocument()
    })

    it('marks active conditions with EoT tooltip', () => {
      render(<ConditionCatalogIconStrip conditions={withBleedingEot} interactive={false} />)
      expect(screen.getByTitle('Bleeding (End of turn)')).toBeInTheDocument()
    })
  })

  describe('interactive mode', () => {
    it('renders all 12 condition icons as buttons', () => {
      const onToggle = vi.fn()
      render(<ConditionCatalogIconStrip conditions={noConditions} interactive onToggleLabel={onToggle} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBe(12)
    })

    it('labels inactive conditions as "Add <label>"', () => {
      const onToggle = vi.fn()
      render(<ConditionCatalogIconStrip conditions={noConditions} interactive onToggleLabel={onToggle} />)
      expect(screen.getByRole('button', { name: /^Add Bleeding$/i })).toBeInTheDocument()
    })

    it('labels active conditions as "Remove <label>"', () => {
      const onToggle = vi.fn()
      render(<ConditionCatalogIconStrip conditions={withBleeding} interactive onToggleLabel={onToggle} />)
      expect(screen.getByRole('button', { name: /^Remove Bleeding$/i })).toBeInTheDocument()
    })

    it('sets aria-pressed=true for active conditions', () => {
      const onToggle = vi.fn()
      render(<ConditionCatalogIconStrip conditions={withBleeding} interactive onToggleLabel={onToggle} />)
      expect(screen.getByRole('button', { name: /^Remove Bleeding$/i })).toHaveAttribute('aria-pressed', 'true')
    })

    it('sets aria-pressed=false for inactive conditions', () => {
      const onToggle = vi.fn()
      render(<ConditionCatalogIconStrip conditions={noConditions} interactive onToggleLabel={onToggle} />)
      expect(screen.getByRole('button', { name: /^Add Bleeding$/i })).toHaveAttribute('aria-pressed', 'false')
    })

    it('calls onToggleLabel with the condition label on click', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      render(<ConditionCatalogIconStrip conditions={noConditions} interactive onToggleLabel={onToggle} />)
      await user.click(screen.getByRole('button', { name: /^Add Bleeding$/i }))
      expect(onToggle).toHaveBeenCalledWith('Bleeding')
    })

    it('calls onToggleLabel for an active condition click (remove)', async () => {
      const user = userEvent.setup()
      const onToggle = vi.fn()
      render(<ConditionCatalogIconStrip conditions={withBleeding} interactive onToggleLabel={onToggle} />)
      await user.click(screen.getByRole('button', { name: /^Remove Bleeding$/i }))
      expect(onToggle).toHaveBeenCalledWith('Bleeding')
    })
  })
})
