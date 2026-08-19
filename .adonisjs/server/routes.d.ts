import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'health': { paramsTuple?: []; params?: {} }
    'ready': { paramsTuple?: []; params?: {} }
    'metrics': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'client.events': { paramsTuple?: []; params?: {} }
    'client.event': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'session.create': { paramsTuple?: []; params?: {} }
    'client.register': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.event': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'admin.events.store': { paramsTuple?: []; params?: {} }
    'admin.rounds.store': { paramsTuple: [ParamValue,ParamValue]; params: {'eventId': ParamValue,'slug': ParamValue} }
    'admin.events.transition': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'action': ParamValue} }
    'admin.rounds.transition': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'slug': ParamValue,'id': ParamValue,'action': ParamValue} }
    'admin.users.index': { paramsTuple?: []; params?: {} }
    'admin.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.betting': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.wallets.adjust': { paramsTuple?: []; params?: {} }
    'admin.moderation.index': { paramsTuple?: []; params?: {} }
    'admin.moderation.state': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.reports.events': { paramsTuple?: []; params?: {} }
    'admin.reports.events.csv': { paramsTuple?: []; params?: {} }
    'admin.reports.bets': { paramsTuple?: []; params?: {} }
    'admin.reports.bets.csv': { paramsTuple?: []; params?: {} }
    'admin.reports.financial': { paramsTuple?: []; params?: {} }
    'admin.reports.financial.csv': { paramsTuple?: []; params?: {} }
    'admin.reports.users': { paramsTuple?: []; params?: {} }
    'admin.reports.users.csv': { paramsTuple?: []; params?: {} }
    'admin.audit.index': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'health': { paramsTuple?: []; params?: {} }
    'ready': { paramsTuple?: []; params?: {} }
    'metrics': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'client.events': { paramsTuple?: []; params?: {} }
    'client.event': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'session.create': { paramsTuple?: []; params?: {} }
    'client.register': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.event': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'admin.users.index': { paramsTuple?: []; params?: {} }
    'admin.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.moderation.index': { paramsTuple?: []; params?: {} }
    'admin.reports.events': { paramsTuple?: []; params?: {} }
    'admin.reports.events.csv': { paramsTuple?: []; params?: {} }
    'admin.reports.bets': { paramsTuple?: []; params?: {} }
    'admin.reports.bets.csv': { paramsTuple?: []; params?: {} }
    'admin.reports.financial': { paramsTuple?: []; params?: {} }
    'admin.reports.financial.csv': { paramsTuple?: []; params?: {} }
    'admin.reports.users': { paramsTuple?: []; params?: {} }
    'admin.reports.users.csv': { paramsTuple?: []; params?: {} }
    'admin.audit.index': { paramsTuple?: []; params?: {} }
  }
  HEAD: {
    'health': { paramsTuple?: []; params?: {} }
    'ready': { paramsTuple?: []; params?: {} }
    'metrics': { paramsTuple?: []; params?: {} }
    'event_stream': { paramsTuple?: []; params?: {} }
    'home': { paramsTuple?: []; params?: {} }
    'client.events': { paramsTuple?: []; params?: {} }
    'client.event': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'session.create': { paramsTuple?: []; params?: {} }
    'client.register': { paramsTuple?: []; params?: {} }
    'new_account.create': { paramsTuple?: []; params?: {} }
    'admin.dashboard': { paramsTuple?: []; params?: {} }
    'admin.event': { paramsTuple: [ParamValue]; params: {'slug': ParamValue} }
    'admin.users.index': { paramsTuple?: []; params?: {} }
    'admin.users.show': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.moderation.index': { paramsTuple?: []; params?: {} }
    'admin.reports.events': { paramsTuple?: []; params?: {} }
    'admin.reports.events.csv': { paramsTuple?: []; params?: {} }
    'admin.reports.bets': { paramsTuple?: []; params?: {} }
    'admin.reports.bets.csv': { paramsTuple?: []; params?: {} }
    'admin.reports.financial': { paramsTuple?: []; params?: {} }
    'admin.reports.financial.csv': { paramsTuple?: []; params?: {} }
    'admin.reports.users': { paramsTuple?: []; params?: {} }
    'admin.reports.users.csv': { paramsTuple?: []; params?: {} }
    'admin.audit.index': { paramsTuple?: []; params?: {} }
  }
  POST: {
    'subscribe': { paramsTuple?: []; params?: {} }
    'unsubscribe': { paramsTuple?: []; params?: {} }
    'new_account.store': { paramsTuple?: []; params?: {} }
    'session.store': { paramsTuple?: []; params?: {} }
    'session.destroy': { paramsTuple?: []; params?: {} }
    'admin.events.store': { paramsTuple?: []; params?: {} }
    'admin.rounds.store': { paramsTuple: [ParamValue,ParamValue]; params: {'eventId': ParamValue,'slug': ParamValue} }
    'admin.events.transition': { paramsTuple: [ParamValue,ParamValue]; params: {'id': ParamValue,'action': ParamValue} }
    'admin.rounds.transition': { paramsTuple: [ParamValue,ParamValue,ParamValue]; params: {'slug': ParamValue,'id': ParamValue,'action': ParamValue} }
    'admin.users.status': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.betting': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.users.role': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
    'admin.wallets.adjust': { paramsTuple?: []; params?: {} }
    'admin.moderation.state': { paramsTuple: [ParamValue]; params: {'id': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}