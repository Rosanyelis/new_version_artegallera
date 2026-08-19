export default class InvalidStateTransitionError extends Error {
  status = 409
  code = 'INVALID_STATE_TRANSITION'

  constructor(entity: string, from: string, to: string) {
    super(`No se puede cambiar ${entity} de ${from} a ${to}.`)
  }
}
