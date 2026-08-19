import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BettingPanel } from './main.js'

const event = { id: 1, name: 'Jornada de prueba' } as never
const wallet = { availableBalance: '500.00', heldBalance: '0.00', totalBalance: '500.00' }
const closedRound = {
  id: 1,
  round_number: 1,
  status: 'pending',
  betting_status: 'closed',
  bettingSides: [
    { id: 1, name: 'Rojo', code: 'RED', color: 'red' },
    { id: 2, name: 'Verde', code: 'GREEN', color: 'green' },
  ],
}
const openRound = { ...closedRound, status: 'betting_open', betting_status: 'open' }

describe('BettingPanel', () => {
  afterEach(() => cleanup())

  it('keeps betting controls disabled while the round is closed', () => {
    render(<BettingPanel event={event} round={closedRound} wallet={wallet} onBet={vi.fn()} />)
    expect(screen.getByText('APUESTAS CERRADAS')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'CONFIRMAR APUESTA' })).toBeDisabled()
  })

  it('selects a side, accepts a quick amount and submits the bet', async () => {
    const onBet = vi.fn(() => Promise.resolve())
    render(<BettingPanel event={event} round={openRound} wallet={wallet} onBet={onBet} />)
    fireEvent.click(screen.getAllByRole('button', { name: /Apuesta al Rojo/ })[0])
    fireEvent.click(screen.getByRole('button', { name: '100' }))
    fireEvent.click(screen.getByRole('button', { name: 'CONFIRMAR APUESTA' }))

    await waitFor(() => expect(onBet).toHaveBeenCalledWith(openRound.bettingSides[0], '100'))
  })
})
