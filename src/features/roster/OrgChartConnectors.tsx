import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ORG_CHART_CONNECTOR_CLASS } from '@/features/roster/org-chart-layout-tokens'

export function OrgChartVerticalLine({
  className,
  heightClassName = 'h-4',
}: {
  className?: string
  heightClassName?: string
}) {
  return (
    <div
      className={cn('w-0.5 shrink-0', ORG_CHART_CONNECTOR_CLASS, heightClassName, className)}
      aria-hidden
    />
  )
}

export function OrgChartHorizontalLine({ className }: { className?: string }) {
  return (
    <div className={cn('h-0.5 shrink-0', ORG_CHART_CONNECTOR_CLASS, className)} aria-hidden />
  )
}

/** Vertical stem from a parent into a child column or node. */
export function OrgChartColumnStem({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-w-0 w-full flex-col items-center">
      <OrgChartVerticalLine />
      {children}
    </div>
  )
}

/** Connects a parent card wrapper to its child subtree. */
export function OrgChartParentChildLink({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <OrgChartVerticalLine heightClassName="h-5" />
      {children}
    </div>
  )
}

/** Shared horizontal crossbar with vertical drops into each column. */
export function OrgChartCrossbarColumns({
  columns,
  className,
  barInsetClassName = 'left-[4%] right-[4%]',
  columnClassName,
  showInboundStem = true,
}: {
  columns: ReactNode[]
  className?: string
  barInsetClassName?: string
  columnClassName?: string
  showInboundStem?: boolean
}) {
  if (columns.length === 0) return null

  return (
    <div className={cn('relative flex w-full min-w-0 flex-col items-center', className)}>
      {showInboundStem ? <OrgChartVerticalLine heightClassName="h-5" /> : null}
      <div className="relative flex w-full min-w-0 flex-col items-center pt-4">
        <OrgChartHorizontalLine className={cn('absolute top-0', barInsetClassName)} />
        <div className={cn('grid w-full min-w-0 gap-2', columnClassName)}>
          {columns.map((column, index) => (
            <div key={index} className="flex min-w-0 flex-col items-center">
              <OrgChartVerticalLine heightClassName="h-4" />
              {column}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Vertical stack of child nodes under a single inbound stem (no left-rail elbows). */
export function OrgChartVerticalStack({ children }: { children: ReactNode[] }) {
  if (children.length === 0) return null

  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <OrgChartVerticalLine heightClassName="h-5" />
      <div className="flex w-full min-w-0 flex-col items-center gap-2 pt-1">
        {children}
      </div>
    </div>
  )
}

/** Horizontal fork into parallel sub-columns (e.g. Logistics branches). */
export function OrgChartFork({ children }: { children: ReactNode[] }) {
  if (children.length === 0) return null

  return (
    <OrgChartCrossbarColumns
      columns={children.map((child, index) => (
        <div key={index} className="flex min-w-[10rem] shrink-0 flex-col items-center">
          {child}
        </div>
      ))}
      className="w-full"
      barInsetClassName="left-[6%] right-[6%]"
      columnClassName="grid-cols-2 gap-x-6 gap-y-2"
      showInboundStem
    />
  )
}
