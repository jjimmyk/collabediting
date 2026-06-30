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
  icBusLinksRef: RefObject<OrgChartIcBusLink[]>
  registerCard: (id: string, element: HTMLElement | null) => void
  getCardElement: (id: string) => HTMLElement | null
  registerSpine: (link: OrgChartSpineLink) => void
  unregisterSpine: (link: OrgChartSpineLink) => void
  setIcBusLinks: (links: OrgChartIcBusLink[]) => void
  subscribeRedraw: (listener: RedrawListener) => () => void
}

const OrgChartConnectorContext = createContext<OrgChartConnectorContextValue | null>(null)

function spineLinksEqual(a: OrgChartSpineLink, b: OrgChartSpineLink): boolean {
  return (
    a.parentId === b.parentId &&
    a.dashed === b.dashed &&
    a.layout === b.layout &&
    a.childIds.length === b.childIds.length &&
    a.childIds.every((id, index) => id === b.childIds[index])
  )
}

function spineLinkRegistryKey(link: OrgChartSpineLink): string {
  return `${link.parentId}:${link.dashed ? 'dashed' : 'solid'}:${link.layout ?? 'stack'}`
}

function icBusEqual(a: OrgChartIcBusLink | null, b: OrgChartIcBusLink | null): boolean {
  if (a === b) return true
  if (!a || !b) return false
  return (
    a.commanderId === b.commanderId &&
    a.dashed === b.dashed &&
    a.headerIds.length === b.headerIds.length &&
    a.headerIds.every((id, index) => id === b.headerIds[index])
  )
}

function icBusLinksEqual(a: OrgChartIcBusLink[], b: OrgChartIcBusLink[]): boolean {
  if (a.length !== b.length) return false
  return a.every((link, index) => icBusEqual(link, b[index]))
}

export function OrgChartConnectorProvider({ children }: { children: ReactNode }) {
  const chartRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef(new Map<string, HTMLElement>())
  const spineLinksRef = useRef<OrgChartSpineLink[]>([])
  const icBusLinksRef = useRef<OrgChartIcBusLink[]>([])
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
      const registryKey = spineLinkRegistryKey(link)
      const index = spineLinksRef.current.findIndex(
        (entry) => spineLinkRegistryKey(entry) === registryKey
      )
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
    (link: OrgChartSpineLink) => {
      const registryKey = spineLinkRegistryKey(link)
      const next = spineLinksRef.current.filter(
        (entry) => spineLinkRegistryKey(entry) !== registryKey
      )
      if (next.length === spineLinksRef.current.length) return
      spineLinksRef.current = next
      notifyRedraw()
    },
    [notifyRedraw]
  )

  const setIcBusLinks = useCallback(
    (links: OrgChartIcBusLink[]) => {
      if (icBusLinksEqual(icBusLinksRef.current, links)) return
      icBusLinksRef.current = links
      notifyRedraw()
    },
    [notifyRedraw]
  )

  const value = useMemo(
    () => ({
      chartRef,
      spineLinksRef,
      icBusLinksRef,
      registerCard,
      getCardElement,
      registerSpine,
      unregisterSpine,
      setIcBusLinks,
      subscribeRedraw,
    }),
    [
      registerCard,
      getCardElement,
      registerSpine,
      unregisterSpine,
      setIcBusLinks,
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
