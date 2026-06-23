import { useCallback, useLayoutEffect, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useOptionalOrgChartConnectors } from '@/features/roster/org-chart-connector-context'
import { ORG_CHART_CARD_LAYER_CLASS } from '@/features/roster/org-chart-layout-tokens'

type OrgChartCardAnchorProps = {
  id: string
  children: ReactNode
  className?: string
}

export function OrgChartCardAnchor({ id, children, className }: OrgChartCardAnchorProps) {
  const registerCard = useOptionalOrgChartConnectors()?.registerCard
  const nodeRef = useRef<HTMLDivElement | null>(null)

  const syncRegistration = useCallback(
    (node: HTMLDivElement | null) => {
      nodeRef.current = node
      registerCard?.(id, node)
    },
    [id, registerCard]
  )

  useLayoutEffect(() => {
    registerCard?.(id, nodeRef.current)
    return () => registerCard?.(id, null)
  }, [id, registerCard])

  return (
    <div
      ref={syncRegistration}
      data-org-chart-id={id}
      className={cn(ORG_CHART_CARD_LAYER_CLASS, className)}
    >
      {children}
    </div>
  )
}
