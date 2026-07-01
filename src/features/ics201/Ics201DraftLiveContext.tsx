import { createContext, useContext } from 'react'

export type Ics201DraftLivePublish = (fieldKey: string, value: string) => void

export const Ics201DraftLiveContext = createContext<Ics201DraftLivePublish | null>(null)

export function useIcs201DraftLivePublish() {
  return useContext(Ics201DraftLiveContext)
}
