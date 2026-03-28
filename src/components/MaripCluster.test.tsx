import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MaripCluster } from './MaripCluster'
import type { Marip } from '../types'

describe('MaripCluster', () => {
  it('renders MARIP header letters', () => {
    render(<MaripCluster values={[0, 0, 0, 0, 0]} />)
    for (const letter of ['M', 'A', 'R', 'I', 'P']) {
      expect(screen.getByText(letter)).toBeInTheDocument()
    }
  })

  it('renders header tooltips', () => {
    render(<MaripCluster values={[0, 0, 0, 0, 0]} />)
    expect(screen.getByTitle('Might')).toBeInTheDocument()
    expect(screen.getByTitle('Agility')).toBeInTheDocument()
    expect(screen.getByTitle('Reason')).toBeInTheDocument()
    expect(screen.getByTitle('Intuition')).toBeInTheDocument()
    expect(screen.getByTitle('Presence')).toBeInTheDocument()
  })

  it('renders numeric values', () => {
    const values: Marip = [2, -1, 0, 1, 3]
    render(<MaripCluster values={values} />)
    const group = screen.getByRole('group', { name: /Characteristics \(MARIP\)/i })
    expect(within(group).getByText('2')).toBeInTheDocument()
    expect(within(group).getByText('-1')).toBeInTheDocument()
    expect(within(group).getByText('0')).toBeInTheDocument()
    expect(within(group).getByText('1')).toBeInTheDocument()
    expect(within(group).getByText('3')).toBeInTheDocument()
  })

  it('renders dashes when values is null', () => {
    render(<MaripCluster values={null} />)
    const dashes = screen.getAllByText('—')
    expect(dashes.length).toBe(5)
  })

  it('has correct aria role and label', () => {
    render(<MaripCluster values={[0, 0, 0, 0, 0]} />)
    expect(screen.getByRole('group', { name: 'Characteristics (MARIP)' })).toBeInTheDocument()
  })
})
