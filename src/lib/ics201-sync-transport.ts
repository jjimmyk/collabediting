export type Ics201BroadcastHandler = (event: string, payload: Record<string, unknown>) => void

export type Ics201BroadcastSubscription = {
  send: (event: string, payload: Record<string, unknown>) => void
  unsubscribe: () => void
}

export type Ics201PostgresChangeHandler = (payload: {
  new: Record<string, unknown>
  old: Record<string, unknown>
}) => void

export type Ics201PostgresChangeSubscription = {
  unsubscribe: () => void
}

export type Ics201SyncTransport = {
  subscribeBroadcast: (
    channelName: string,
    handlers: Record<string, Ics201BroadcastHandler>
  ) => Ics201BroadcastSubscription
  subscribePostgresChanges: (options: {
    channelName: string
    table: string
    filter: string
    event?: 'UPDATE' | 'INSERT' | '*'
    handler: Ics201PostgresChangeHandler
  }) => Ics201PostgresChangeSubscription
}

export function isIcs201Il4StrictMode(): boolean {
  return import.meta.env.VITE_ICS201_IL4_STRICT_MODE === 'true'
}
