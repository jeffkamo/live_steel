import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'

/** Accessible names use `Encounter group ${n}: …`; avoid `/group 1/` matching `group 10`. */
const turnButton = (n: number, state: 'pending' | 'acted') =>
  new RegExp(`^Encounter group ${n}: turn ${state}$`, 'i')

describe('App', () => {
  it('renders app name, encounter roster tagline, and terrain section title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: /^Steel Roster$/i })).toBeInTheDocument()
    expect(screen.getByText(/^Encounter roster$/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /dynamic terrain/i })).toBeInTheDocument()
  })

  it('lists creature tracker and terrain landmarks', () => {
    render(<App />)
    expect(screen.getByRole('region', { name: 'Creature tracker' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Dynamic terrain' })).toBeInTheDocument()
  })

  it('shows roster rows with names, stamina, stats, and conditions', () => {
    render(<App />)
    expect(screen.getByText('Goblin Assassin 1', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Level 1 Horde · Ambusher')).toBeInTheDocument()
    expect(screen.getByText('5 / 15')).toBeInTheDocument()
    expect(screen.getByText('Winded')).toBeInTheDocument()
    expect(screen.getByText('Slowed')).toBeInTheDocument()
    expect(screen.getByText('Ironwood Sentinel', { exact: true })).toBeInTheDocument()
    expect(screen.getByText('Bleeding')).toBeInTheDocument()
  })

  it('renders MARIP headers and numeric row for the first creature in its group', () => {
    render(<App />)
    const nameEl = screen.getByText('Goblin Assassin 1', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    for (const letter of ['M', 'A', 'R', 'I', 'P']) {
      expect(scope.getAllByText(letter).length).toBeGreaterThanOrEqual(1)
    }
    expect(scope.getAllByText('-2').length).toBeGreaterThanOrEqual(1)
    expect(scope.getByText('2')).toBeInTheDocument()
  })

  it('shows placeholder stamina and MARIP for reserve slot', () => {
    render(<App />)
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    const scope = within(groupGrid as HTMLElement)
    expect(scope.getAllByText('—').length).toBeGreaterThanOrEqual(1)
  })

  it('shows “No active conditions” when a creature has none', () => {
    render(<App />)
    const nameEl = screen.getByText('Reserve slot', { exact: true })
    const groupGrid = nameEl.closest('div.grid.items-stretch.rounded-lg')
    expect(groupGrid).toBeTruthy()
    expect(within(groupGrid as HTMLElement).getByText('No active conditions')).toBeInTheDocument()
  })

  it('renders terrain objects, notes, stamina, and condition pills', () => {
    render(<App />)
    const terrain = screen.getByRole('region', { name: 'Dynamic terrain' })
    expect(
      within(terrain).getByText(
        'Toppled barricade — light cover along the eastern lane.',
        { exact: true },
      ),
    ).toBeInTheDocument()
    expect(
      within(terrain).getByText('Burning; end of round 1d4 to adjacent.', { exact: true }),
    ).toBeInTheDocument()
    expect(within(terrain).getByText('Hazard')).toBeInTheDocument()
    expect(within(terrain).getByText('Difficult')).toBeInTheDocument()
    expect(
      within(terrain).getByText('Ritual circle (inactive). Chalk smeared, runes still warm.', {
        exact: true,
      }),
    ).toBeInTheDocument()
    expect(within(terrain).getByText('Zone')).toBeInTheDocument()
  })

  it('toggles per-group turn diamond via Turn column and updates aria state', async () => {
    const user = userEvent.setup()
    render(<App />)

    const group1 = screen.getByRole('button', { name: turnButton(1, 'pending') })
    expect(group1).toHaveAttribute('aria-pressed', 'false')

    await user.click(group1)
    expect(group1).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: turnButton(1, 'acted') })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: turnButton(1, 'acted') }))
    expect(screen.getByRole('button', { name: turnButton(1, 'pending') })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('reset clears all group turn states', async () => {
    const user = userEvent.setup()
    render(<App />)

    const g1 = screen.getByRole('button', { name: turnButton(1, 'pending') })
    const g2 = screen.getByRole('button', { name: turnButton(2, 'pending') })
    await user.click(g1)
    await user.click(g2)
    expect(g1).toHaveAttribute('aria-pressed', 'true')

    await user.click(
      screen.getByRole('button', { name: /Reset all encounter group turn diamonds to pending/i }),
    )

    expect(screen.getByRole('button', { name: turnButton(1, 'pending') })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    expect(screen.getByRole('button', { name: turnButton(2, 'pending') })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('shows stamina editor on hover and applies +1 from the step control', async () => {
    const user = userEvent.setup()
    render(<App />)

    const staminaGroup = screen.getByRole('group', { name: /^Edit stamina for Goblin Assassin 1$/i })
    const dialog = within(staminaGroup).getByRole('dialog', {
      name: /Edit stamina for Goblin Assassin 1 — adjust values/i,
    })
    expect(dialog).toHaveClass('opacity-0')

    await user.hover(staminaGroup)

    await user.click(
      within(staminaGroup).getByRole('button', { name: /^Increase stamina by 1$/i }),
    )
    expect(screen.getByText('6 / 15')).toBeInTheDocument()
  })
})
