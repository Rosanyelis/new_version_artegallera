import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health': { paramsTuple?: []; params?: {} }
    'ready': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.event': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'admin.events.store': { paramsTuple?: []; params?: {} }
    'admin.rounds.store': { paramsTuple: [ParamValue,ParamValue]; params: {'eventId': ParamValue,'slug': ParamValue} }
    'admin.events.transition': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'action': ParamValue} }
    'admin.rounds.transition': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'slug': ParamValue,'id': ParamValue,'action': ParamValue} }
  }
  GET: {
    'health': { paramsTuple?: []; params?: {} }
    'ready': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.event': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
  }
  HEAD: {
    'health': { paramsTuple?: []; params?: {} }
    'ready': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'session.create': { paramsTuple?: []; params?: {} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.event': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
  }
  POST: {
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'admin.events.store': { paramsTuple?: []; params?: {} }
    'admin.rounds.store': { paramsTuple: [ParamValue,ParamValue]; params: {'eventId': ParamValue,'slug': ParamValue} }
    'admin.events.transition': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'action': ParamValue} }
    'admin.rounds.transition': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'slug': ParamValue,'id': ParamValue,'action': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}