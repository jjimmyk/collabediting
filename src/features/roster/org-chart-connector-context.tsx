import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react'
import type { OrgChartIcBusLink, OrgChartSpineLink } from '@/features/roster/org-chart-connector-context.types'

export type { OrgChartIcBusLink, OrgChartSpineLink }

type RedrawListener = () => void

type OrgChartConnectorContextValue = {
  chartRef: RefObject<HTMLDivElement | null>
  spineLinksRef: RefObject<OrgChartSpineLink[]>
  icBusRef: RefObject<OrgChartIcBusLink | null>
  registerCard: (id: string, element: HTMLElement | null) => void
  getCardElement: (id: string) => HTMLElement | null
  registerSpine: (link: OrgChartSpineLink) => void
  unregisterSpine: (parentId: string) => void
  registerIcBus: (link: OrgChartIcBusLink | null) => void
  subscribeRedraw: (listener: RedrawListener) => () => void
}

const OrgChartConnectorContext = createContext<OrgChartConnectorContextValue | null>(null)

function spineLinksEqual(a: OrgChartSpineLink, b: OrgChartSpineLink): boolean {
  return (
    a.parentId === b.parentId &&
    a.childIds.length === b.childIds.length &&
    a.childIds.every((id, index) => id === b.childIds[index])
  )
}

function icBusEqual(a: OrgChartIcBusLink | null, b: OrgChartIcBusLink | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.commanderId === b.commanderId &&
    a.headerIds.length === b.headerIds.length &&
    a.headerIds.every((id, index) => id === b.headerIds[index])
  )
}

export function OrgChartConnectorProvider({ children }: { children: ReactNode }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef(new Map<string, HTMLElement>())
  const spineLinksRef = useRef<OrgChartSpineLink[]>([])
  const icBusRef = useRef<OrgChartIcBusLink | null>(null)
  const listenersRef = useRef(new Set<RedrawListener>())

  const notifyRedraw = useCallback(() => {
    requestAnimationFrame(() => {
      for (const listener of listenersRef.current) {
        listener()
      }
    })
  }, [])

  const subscribeRedraw = useCallback((listener: RedrawListener) => {
    listenersRef.current.add(listener)
    return () => {
      listenersRef.current.delete(listener)
    }
  }, [])

  const registerCard = useCallback(
    (id: string, element: HTMLElement | null) => {
      const current = cardsRef.current.get(id)
      if (element) {
        if (current === element) return
        cardsRef.current.set(id, element)
      } else {
        if (!cardsRef.current.has(id)) return
        cardsRef.current.delete(id)
      }
      notifyRedraw()
    },
    [notifyRedraw]
  )

  const getCardElement = useCallback((id: string) => cardsRef.current.get(id) ?? null, [])

  const registerSpine = useCallback(
    (link: OrgChartSpineLink) => {
      const index = spineLinksRef.current.findIndex((entry) => entry.parentId === link.parentId)
      if (index >= 0) {
        if (spineLinksEqual(spineLinksRef.current[index], link)) return
        spineLinksRef.current[index] = link
      } else {
        spineLinksRef.current.push(link)
      }
      notifyRedraw()
    },
    [notifyRedraw]
  )

  const unregisterSpine = useCallback(
    (parentId: string) => {
      const next = spineLinksRef.current.filter((entry) => entry.parentId !== parentId)
      if (next.length === spineLinksRef.current.length) return
      spineLinksRef.current = next
      notifyRedraw()
    },
    [notifyRedraw]
  )

  const registerIcBus = useCallback(
    (link: OrgChartIcBusLink | null) => {
      if (icBusEqual(icBusRef.current, link)) return
      icBusRef.current = link
      notifyRedraw()
    },
    [notifyRedraw]
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
      subscribeRedraw,
    }),
    [
      registerCard,
      getCardElement,
      registerSpine,
      unregisterSpine,
      registerIcBus,
      subscribeRedraw,
    ]
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
