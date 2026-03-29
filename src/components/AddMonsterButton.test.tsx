import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AddMonsterButton } from './AddMonsterButton'

describe('AddMonsterButton', () => {
  it('renders an "Add monster" button in collapsed state', () => {
    render(<AddMonsterButton onAdd={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Add monster to group/i })).toBeInTheDocument()
  })

  it('opens a search input when clicking the add button', async () => {
    const user = userEvent.setup()
    render(<AddMonsterButton onAdd={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Add monster to group/i }))
    expect(screen.getByRole('textbox', { name: /Search bestiary/i })).toBeInTheDocument()
  })

  it('shows a list of available monsters from the bestiary', async () => {
    const user = userEvent.setup()
    render(<AddMonsterButton onAdd={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Add monster to group/i }))
    const listbox = screen.getByRole('listbox', { name: /Available monsters/i })
    expect(within(listbox).getAllByRole('option').length).toBeGreaterThan(0)
  })

  it('filters monsters as the user types in the search input', async () => {
    const user = userEvent.setup()
    render(<AddMonsterButton onAdd={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Add monster to group/i }))
    const input = screen.getByRole('textbox', { name: /Search bestiary/i })
    await user.type(input, 'Goblin')
    const listbox = screen.getByRole('listbox', { name: /Available monsters/i })
    const options = within(listbox).getAllByRole('option')
    for (const opt of options) {
      expect(opt.textContent?.toLowerCase()).toContain('goblin')
    }
  })

  it('shows "No matches" when search yields no results', async () => {
    const user = userEvent.setup()
    render(<AddMonsterButton onAdd={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Add monster to group/i }))
    await user.type(screen.getByRole('textbox', { name: /Search bestiary/i }), 'zzzzzzzzxxx')
    expect(screen.getByText('No matches')).toBeInTheDocument()
  })

  it('calls onAdd with a Monster object when selecting a bestiary entry', async () => {
    const user = userEvent.setup()
    const onAdd = vi.fn()
    render(<AddMonsterButton onAdd={onAdd} />)
    await user.click(screen.getByRole('button', { name: /Add monster to group/i }))
    await user.type(screen.getByRole('textbox', { name: /Search bestiary/i }), 'Goblin Assassin')
    const listbox = screen.getByRole('listbox', { name: /Available monsters/i })
    const option = within(listbox).getAllByRole('option').find(
      (el) => el.textContent === 'Goblin Assassin',
    )
    expect(option).toBeTruthy()
    await user.click(within(option!).getByRole('button'))
    expect(onAdd).toHaveBeenCalledTimes(1)
    expect(onAdd.mock.calls[0]![0]).toMatchObject({ name: 'Goblin Assassin' })
  })

  it('closes the picker after selecting a monster', async () => {
    const user = userEvent.setup()
    render(<AddMonsterButton onAdd={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Add monster to group/i }))
    await user.type(screen.getByRole('textbox', { name: /Search bestiary/i }), 'Goblin Assassin')
    const listbox = screen.getByRole('listbox', { name: /Available monsters/i })
    const option = within(listbox).getAllByRole('option').find(
      (el) => el.textContent === 'Goblin Assassin',
    )
    await user.click(within(option!).getByRole('button'))
    expect(screen.queryByRole('textbox', { name: /Search bestiary/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Add monster to group/i })).toBeInTheDocument()
  })

  it('closes the picker when Escape is pressed', async () => {
    const user = userEvent.setup()
    render(<AddMonsterButton onAdd={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Add monster to group/i }))
    expect(screen.getByRole('textbox', { name: /Search bestiary/i })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('textbox', { name: /Search bestiary/i })).not.toBeInTheDocument()
  })

  it('ArrowDown from search moves focus to first list option', async () => {
    const user = userEvent.setup()
    render(<AddMonsterButton onAdd={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Add monster to group/i }))
    const input = screen.getByRole('textbox', { name: /Search bestiary/i })
    await user.click(input)
    await user.keyboard('{ArrowDown}')
    const listbox = screen.getByRole('listbox', { name: /Available monsters/i })
    const firstOptionBtn = within(listbox).getAllByRole('button')[0]
    expect(document.activeElement).toBe(firstOptionBtn)
  })

  it('ArrowUp from first option returns focus to search', async () => {
    const user = userEvent.setup()
    render(<AddMonsterButton onAdd={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Add monster to group/i }))
    const input = screen.getByRole('textbox', { name: /Search bestiary/i })
    await user.click(input)
    await user.keyboard('{ArrowDown}{ArrowUp}')
    expect(document.activeElement).toBe(input)
  })

  it('closes the picker when clicking the close button', async () => {
    const user = userEvent.setup()
    render(<AddMonsterButton onAdd={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Add monster to group/i }))
    expect(screen.getByRole('textbox', { name: /Search bestiary/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Close monster picker/i }))
    expect(screen.queryByRole('textbox', { name: /Search bestiary/i })).not.toBeInTheDocument()
  })
})
