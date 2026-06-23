import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useOrgChartConnectors } from '@/features/roster/org-chart-connector-context'
import {
  ORG_CHART_SPINE_ANCHOR_RATIO,
  ORG_CHART_SUBORDINATE_ROW_GAP,
} from '@/features/roster/org-chart-layout-tokens'
import { readOrgChartZoom } from '@/features/roster/org-chart-connector-draw'

export function OrgChartSpineRegister({
  parentId,
  childIds,
}: {
  parentId: string
  childIds: string[]
}) {
  const { registerSpine, unregisterSpine } = useOrgChartConnectors()
  const childKey = childIds.join('\0')

  useLayoutEffect(() => {
    if (childIds.length === 0) return
    registerSpine({ parentId, childIds })
    return () => unregisterSpine(parentId)
  }, [parentId, childKey, childIds, registerSpine, unregisterSpine])

  return null
}

export function OrgChartSpineChildren({
  parentId,
  childIds,
  children,
  className,
}: {
  parentId: string
  childIds: string[]
  children: ReactNode
  className?: string
}) {
  return (
    <>
      <OrgChartSpineRegister parentId={parentId} childIds={childIds} />
      <div
        data-org-chart-spine-children
        className={cn('flex flex-col', ORG_CHART_SUBORDINATE_ROW_GAP, className)}
      >
        {children}
      </div>
    </>
  )
}

export function OrgChartSpineNode({
  card,
  nested,
  className,
}: {
  card: ReactNode
  nested?: ReactNode
  className?: string
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!nested) return
    const cardEl = cardRef.current
    const groupEl = groupRef.current
    if (!cardEl || !groupEl) return

    const applyMargin = () => {
      groupEl.style.marginLeft = `${cardEl.offsetWidth * ORG_CHART_SPINE_ANCHOR_RATIO}px`
    }

    applyMargin()
    const observer = new ResizeObserver(applyMargin)
    observer.observe(cardEl)
    return () => observer.disconnect()
  }, [nested])

  if (!nested) {
    return (
      <div data-org-chart-spine-node className={cn('flex flex-col', className)}>
        {card}
      </div>
    )
  }

  return (
    <div data-org-chart-spine-node className={cn('flex flex-col', className)}>
      <div ref={cardRef}>{card}</div>
      <div
        ref={groupRef}
        data-org-chart-spine-group
        className="mt-2.5 flex flex-row items-start"
      >
        <div className="w-7 shrink-0" aria-hidden />
        {nested}
      </div>
    </div>
  )
}

/** @deprecated Use OrgChartSpineNode with nested prop */
export function OrgChartSpineGroup({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div data-org-chart-spine-group className={cn('flex flex-row items-start', className)}>
      <div className="w-7 shrink-0" aria-hidden />
      {children}
    </div>
  )
}

export function OrgChartSubHierarchyColumn({
  headerId,
  children,
  className,
}: {
  headerId: string
  children: ReactNode
  className?: string
}) {
  const columnRef = useRef<HTMLDivElement>(null)
  const { getCardElement, subscribeRedraw } = useOrgChartConnectors()

  useLayoutEffect(() => {
    const column = columnRef.current
    if (!column) return

    const chart = column.closest('[data-org-chart-wide-root]')
    if (!chart) return

    const align = () => {
      const header = getCardElement(headerId)
      if (!header) return
      const chartZoom = readOrgChartZoom(chart as HTMLElement)
      const chartRect = chart.getBoundingClientRect()
      const headerRect = header.getBoundingClientRect()
      const columnRect = column.getBoundingClientRect()
      const scale = chartZoom > 0 ? chartZoom : 1
      const anchor =
        (headerRect.left - chartRect.left + headerRect.width * ORG_CHART_SPINE_ANCHOR_RATIO) /
        scale
      const columnLeft = (columnRect.left - chartRect.left) / scale
      column.style.transform = `translateX(${anchor - columnLeft}px)`
    }

    align()
    const observer = new ResizeObserver(align)
    observer.observe(chart)
    observer.observe(column)
    const unsubscribe = subscribeRedraw(align)
    return () => {
      observer.disconnect()
      unsubscribe()
    }
  }, [getCardElement, headerId, subscribeRedraw])

  return (
    <div
      ref={columnRef}
      data-org-chart-sub-hierarchy
      data-org-chart-sub-hierarchy-for={headerId}
      className={cn('relative flex flex-row items-start', className)}
    >
      {children}
    </div>
  )
}
