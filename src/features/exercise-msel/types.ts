export type ExerciseObjective = {
  id: number
  name: string
}

export type MselInject = {
  id: number
  objectiveId: number | null
  scheduledTime: string
  category: string
  inject: string
  expectedAction: string
  mapLocation?: [longitude: number, latitude: number] | null
}

export type ExerciseMselState = {
  objectives: ExerciseObjective[]
  injects: MselInject[]
}

export type MselViewTab = 'schedule' | 'received'

export type MselInjectSnapshot = Pick<
  MselInject,
  'id' | 'objectiveId' | 'scheduledTime' | 'category' | 'inject' | 'expectedAction' | 'mapLocation'
>

export type MselInjectDelivery = {
  id: string
  workspaceId: string
  injectId: number
  recipientEmail: string
  title: string
  summary: string
  severity: string
  injectSnapshot: MselInjectSnapshot
  sentByEmail: string | null
  hubNotificationId: string | null
  createdAt: string
}

export type MselInjectDeliveryGroup = {
  injectId: number
  injectSnapshot: MselInjectSnapshot
  deliveries: MselInjectDelivery[]
}

export const MSEL_INJECT_MAP_KIND = 'msel-inject' as const
