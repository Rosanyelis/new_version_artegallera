export class WalletError extends Error {
  status = 422
  code = 'WALLET_ERROR'
}

export class InsufficientFundsError extends WalletError {
  code = 'INSUFFICIENT_FUNDS'
  message = 'El saldo disponible es insuficiente.'
}

export class IdempotencyConflictError extends WalletError {
  code = 'IDEMPOTENCY_CONFLICT'
  message = 'La clave de idempotencia ya fue utilizada para otra operación.'
}

export class WalletNotFoundError extends WalletError {
  status = 404
  code = 'WALLET_NOT_FOUND'
  message = 'La wallet no existe.'
}
