import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatCluster } from './StatCluster'

describe('StatCluster', () => {
  it('renders FS, Dist, Stab headers', () => {
    render(<StatCluster fs={2} dist={5} stab={1} />)
    expect(screen.getByTitle('Free strike')).toHaveTextContent('FS')
    expect(screen.getByTitle('Distance')).toHaveTextContent('Dist')
    expect(screen.getByTitle('Stability')).toHaveTextContent('Stab')
  })

  it('renders numeric values', () => {
    render(<StatCluster fs={2} dist={5} stab={1} />)
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders negative values', () => {
    render(<StatCluster fs={-1} dist={4} stab={0} />)
    expect(screen.getByText('-1')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renders zero values', () => {
    render(<StatCluster fs={0} dist={0} stab={0} />)
    const zeros = screen.getAllByText('0')
    expect(zeros.length).toBe(3)
  })
})
