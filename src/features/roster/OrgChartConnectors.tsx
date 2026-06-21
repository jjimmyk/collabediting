import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  ORG_CHART_CARD_HALF_WIDTH_REM,
  ORG_CHART_CONNECTOR_CLASS,
} from '@/features/roster/org-chart-layout-tokens'

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

/** Vertical stack with a left rail and horizontal elbows to each child. */
export function OrgChartLeftRailStack({ children }: { children: ReactNode[] }) {
  if (children.length === 0) return null

  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <OrgChartVerticalLine heightClassName="h-5" />
      <div className="flex w-full min-w-0 flex-col items-center gap-2 pt-1">
        {children.map((child, index) => (
          <div key={index} className="relative flex w-full min-w-0 items-center justify-center">
            <div
              className="pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center"
              style={{ right: `calc(50% + ${ORG_CHART_CARD_HALF_WIDTH_REM}rem)` }}
              aria-hidden
            >
              <OrgChartHorizontalLine className="w-6" />
              {index < children.length - 1 ? (
                <div
                  className={cn(
                    'absolute left-0 top-1/2 h-[calc(100%+0.5rem)] w-0.5',
                    ORG_CHART_CONNECTOR_CLASS
                  )}
                />
              ) : null}
            </div>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Horizontal fork into parallel sub-columns (e.g. Logistics branches). */
export function OrgChartFork({ children }: { children: ReactNode[] }) {
  if (children.length === 0) return null

  return (
    <OrgChartCrossbarColumns
      columns={children}
      className="w-full"
      barInsetClassName="left-[10%] right-[10%]"
      columnClassName="grid-cols-2 gap-3"
      showInboundStem
    />
  )
}
