export type MselMode = 'functional' | 'tabletop'

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
  mode: MselMode
  objectives: ExerciseObjective[]
  injects: MselInject[]
}

export const MSEL_INJECT_MAP_KIND = 'msel-inject' as const
