export class BettingError extends Error {
  status = 422
  code = 'BETTING_ERROR'
}

export class BettingClosedError extends BettingError {
  code = 'BETTING_CLOSED'
  message = 'Las apuestas están cerradas.'
}

export class InvalidBetError extends BettingError {
  code = 'INVALID_BET'
  message = 'La apuesta no es válida.'
}
