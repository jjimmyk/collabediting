import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from 'react'
import type { OrgChartIcBusLink, OrgChartSpineLink } from '@/features/roster/org-chart-connector-context.types'

export type { OrgChartIcBusLink, OrgChartSpineLink }

type OrgChartConnectorContextValue = {
  chartRef: RefObject<HTMLDivElement | null>
  spineLinksRef: RefObject<OrgChartSpineLink[]>
  icBusRef: RefObject<OrgChartIcBusLink | null>
  registerCard: (id: string, element: HTMLElement | null) => void
  getCardElement: (id: string) => HTMLElement | null
  registerSpine: (link: OrgChartSpineLink) => void
  unregisterSpine: (parentId: string) => void
  registerIcBus: (link: OrgChartIcBusLink | null) => void
  revision: number
}

const OrgChartConnectorContext = createContext<OrgChartConnectorContextValue | null>(null)

export function OrgChartConnectorProvider({ children }: { children: ReactNode }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef(new Map<string, HTMLElement>())
  const spineLinksRef = useRef<OrgChartSpineLink[]>([])
  const icBusRef = useRef<OrgChartIcBusLink | null>(null)
  const [revision, setRevision] = useState(0)

  const bump = useCallback(() => setRevision((value) => value + 1), [])

  const registerCard = useCallback(
    (id: string, element: HTMLElement | null) => {
      if (element) cardsRef.current.set(id, element)
      else cardsRef.current.delete(id)
      bump()
    },
    [bump]
  )

  const getCardElement = useCallback((id: string) => cardsRef.current.get(id) ?? null, [])

  const registerSpine = useCallback(
    (link: OrgChartSpineLink) => {
      const index = spineLinksRef.current.findIndex((entry) => entry.parentId === link.parentId)
      if (index >= 0) spineLinksRef.current[index] = link
      else spineLinksRef.current.push(link)
      bump()
    },
    [bump]
  )

  const unregisterSpine = useCallback(
    (parentId: string) => {
      const next = spineLinksRef.current.filter((entry) => entry.parentId !== parentId)
      if (next.length === spineLinksRef.current.length) return
      spineLinksRef.current = next
      bump()
    },
    [bump]
  )

  const registerIcBus = useCallback(
    (link: OrgChartIcBusLink | null) => {
      icBusRef.current = link
      bump()
    },
    [bump]
  )

  const value = useMemo(
    () => ({
      chartRef,
      spineLinksRef,
      icBusRef,
      registerCard,
      getCardElement,
      registerSpine,
      unregisterSpine,
      registerIcBus,
      revision,
    }),
    [registerCard, getCardElement, registerSpine, unregisterSpine, registerIcBus, revision]
  )

  return (
    <OrgChartConnectorContext.Provider value={value}>{children}</OrgChartConnectorContext.Provider>
  )
}

export function useOrgChartConnectors() {
  const context = useContext(OrgChartConnectorContext)
  if (!context) {
    throw new Error('useOrgChartConnectors must be used within OrgChartConnectorProvider')
  }
  return context
}

export function useOptionalOrgChartConnectors() {
  return useContext(OrgChartConnectorContext)
}
