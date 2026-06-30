import { useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'
import { cn } from '@/lib/utils'
import { useOrgChartConnectors } from '@/features/roster/org-chart-connector-context'
import {
  ORG_CHART_CARD_TO_CHILDREN_GAP,
  orgChartNestedSpineIndentPaddingStyle,
  orgChartSpineAnchorPaddingStyle,
  ORG_CHART_SUBORDINATE_ARM_CHANNEL_WIDTH,
  ORG_CHART_SUBORDINATE_ROW_GAP,
} from '@/features/roster/org-chart-layout-tokens'

export function useOrgChartCardWidthVar(ref: RefObject<HTMLElement | null>): void {
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    const apply = () => {
      el.style.setProperty('--org-chart-card-width', `${el.offsetWidth}px`)
    }

    apply()
    const observer = new ResizeObserver(apply)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
}

export function OrgChartSpineRegister({
  parentId,
  childIds,
  dashed = false,
  layout,
}: {
  parentId: string
  childIds: string[]
  dashed?: boolean
  layout?: 'stack' | 'crossbar'
}) {
  const { registerSpine, unregisterSpine } = useOrgChartConnectors()
  const childKey = childIds.join('\0')

  useLayoutEffect(() => {
    if (childIds.length === 0) return
    const link = { parentId, childIds, dashed, layout }
    registerSpine(link)
    return () => unregisterSpine(link)
  }, [parentId, childKey, childIds, dashed, layout, registerSpine, unregisterSpine])

  return null
}

export function OrgChartSpineChildren({
  parentId,
  childIds,
  dashed = false,
  children,
  className,
}: {
  parentId: string
  childIds: string[]
  dashed?: boolean
  children: ReactNode
  className?: string
}) {
  return (
    <>
      <OrgChartSpineRegister parentId={parentId} childIds={childIds} dashed={dashed} />
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
  const nodeRef = useRef<HTMLDivElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const node = nodeRef.current
    const cardEl = cardRef.current
    if (!node || !cardEl || !nested) return

    const apply = () => {
      node.style.setProperty('--org-chart-card-width', `${cardEl.offsetWidth}px`)
    }

    apply()
    const observer = new ResizeObserver(apply)
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
    <div ref={nodeRef} data-org-chart-spine-node className={cn('flex flex-col', className)}>
      <div ref={cardRef} data-org-chart-card className="w-full">
        {card}
      </div>
      <div
        data-org-chart-spine-group
        className={cn('flex w-full flex-col items-start', ORG_CHART_CARD_TO_CHILDREN_GAP)}
        style={orgChartNestedSpineIndentPaddingStyle()}
      >
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
    <div
      data-org-chart-spine-group
      className={cn('flex flex-row items-start', className)}
      style={orgChartNestedSpineIndentPaddingStyle()}
    >
      <div className={cn('shrink-0', ORG_CHART_SUBORDINATE_ARM_CHANNEL_WIDTH)} aria-hidden />
      {children}
    </div>
  )
}

/** Structural sub-hierarchy under a section chief — anchor indent only, no transform. */
export function OrgChartSectionSubHierarchy({
  headerId,
  children,
  className,
}: {
  headerId: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      data-org-chart-sub-hierarchy
      data-org-chart-sub-hierarchy-for={headerId}
      className={cn('flex w-full flex-col items-start', ORG_CHART_CARD_TO_CHILDREN_GAP, className)}
      style={orgChartSpineAnchorPaddingStyle()}
    >
      {children}
    </div>
  )
}

/** @deprecated Use OrgChartSectionSubHierarchy — transform alignment removed. */
export function OrgChartSubHierarchyColumn({
  headerId,
  children,
  className,
}: {
  headerId: string
  children: ReactNode
  className?: string
}) {
  return (
    <OrgChartSectionSubHierarchy headerId={headerId} className={className}>
      {children}
    </OrgChartSectionSubHierarchy>
  )
}
