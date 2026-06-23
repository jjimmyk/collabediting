import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useOptionalOrgChartConnectors } from '@/features/roster/org-chart-connector-context'
import { ORG_CHART_CARD_LAYER_CLASS } from '@/features/roster/org-chart-layout-tokens'

type OrgChartCardAnchorProps = {
  id: string
  children: ReactNode
  className?: string
}

export function OrgChartCardAnchor({ id, children, className }: OrgChartCardAnchorProps) {
  const connectors = useOptionalOrgChartConnectors()
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!connectors) return
    connectors.registerCard(id, ref.current)
    return () => connectors.registerCard(id, null)
  }, [connectors, id])

  return (
    <div
      ref={ref}
      data-org-chart-id={id}
      className={cn(ORG_CHART_CARD_LAYER_CLASS, className)}
    >
      {children}
    </div>
  )
}
