import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  ORG_CHART_CONNECTOR_CLASS,
  ORG_CHART_FORK_BRANCH_COLUMN_MIN_WIDTH,
  ORG_CHART_LOGISTICS_FORK_MIN_WIDTH,
  ORG_CHART_SUBORDINATE_ARM_WIDTH,
  ORG_CHART_SUBORDINATE_ROW_GAP,
  ORG_CHART_SUBORDINATE_TRUNK_WIDTH,
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

/** Short vertical stem above a child node (parent → child edge). */
export function OrgChartInboundStem({
  children,
  heightClassName = 'h-4',
}: {
  children: ReactNode
  heightClassName?: string
}) {
  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <OrgChartVerticalLine heightClassName={heightClassName} />
      {children}
    </div>
  )
}

/** Connects a parent card wrapper to its child subtree. */
export function OrgChartParentChildLink({ children }: { children: ReactNode }) {
  return <OrgChartInboundStem heightClassName="h-5">{children}</OrgChartInboundStem>
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
      <div className="relative flex w-full min-w-0 flex-col items-center">
        <OrgChartHorizontalLine
          className={cn('absolute top-0 -translate-y-1/2', barInsetClassName)}
        />
        <div className={cn('grid w-max min-w-full gap-x-4', columnClassName)}>
          {columns.map((column, index) => (
            <div key={index} className="flex min-w-0 flex-col items-center">
              <OrgChartVerticalLine heightClassName="h-4" className="-mt-px" />
              {column}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Vertical stack — each child gets its own inbound stem from the parent. */
export function OrgChartVerticalStack({ children }: { children: ReactNode[] }) {
  if (children.length === 0) return null

  return (
    <div className="flex w-full min-w-0 flex-col items-center gap-2">
      {children.map((child, index) => (
        <OrgChartInboundStem key={index}>{child}</OrgChartInboundStem>
      ))}
    </div>
  )
}

/**
 * ICS-style subordinate layout: vertical trunk down from the superior, horizontal
 * arms to the right into each indented child card (Planning/Finance unit stacks, etc.).
 */
export function OrgChartRightIndentStack({
  children,
  connectFromParent = true,
}: {
  children: ReactNode[]
  connectFromParent?: boolean
}) {
  if (children.length === 0) return null

  return (
    <div
      className="flex w-full min-w-0 flex-row items-stretch self-start"
      data-org-chart-layout="right-indent"
    >
      <div
        className={cn(
          'relative flex shrink-0 flex-col items-center',
          ORG_CHART_SUBORDINATE_TRUNK_WIDTH
        )}
      >
        {connectFromParent ? (
          <OrgChartVerticalLine heightClassName="h-4" className="shrink-0" />
        ) : null}
        <div
          className={cn(
            'absolute left-1/2 w-0.5 -translate-x-1/2',
            ORG_CHART_CONNECTOR_CLASS,
            connectFromParent ? 'top-4 bottom-0' : 'top-0 bottom-0'
          )}
          aria-hidden
        />
      </div>
      <div className={cn('flex min-w-0 flex-1 flex-col', ORG_CHART_SUBORDINATE_ROW_GAP)}>
        {children.map((child, index) => (
          <div key={index} className="relative flex min-w-0 items-center">
            <OrgChartHorizontalLine
              className={cn(
                'absolute -left-4 top-1/2 -translate-y-1/2',
                ORG_CHART_SUBORDINATE_ARM_WIDTH
              )}
            />
            <div className="min-w-0 flex-1">{child}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Logistics fork — horizontal when wide + scroll; vertical stack in compact layouts. */
export function OrgChartFork({
  children,
  layout = 'horizontal',
}: {
  children: ReactNode[]
  layout?: 'horizontal' | 'vertical'
}) {
  if (children.length === 0) return null

  if (layout === 'vertical') {
    return (
      <div className="flex w-full min-w-0 flex-col items-center gap-y-4">
        {children.map((child, index) => (
          <OrgChartInboundStem key={index} heightClassName="h-5">
            {child}
          </OrgChartInboundStem>
        ))}
      </div>
    )
  }

  return (
    <OrgChartCrossbarColumns
      columns={children.map((child, index) => (
        <div
          key={index}
          className={cn(
            'flex shrink-0 flex-col items-center',
            ORG_CHART_FORK_BRANCH_COLUMN_MIN_WIDTH
          )}
        >
          {child}
        </div>
      ))}
      className={cn('w-full', ORG_CHART_LOGISTICS_FORK_MIN_WIDTH)}
      barInsetClassName="left-[4%] right-[4%]"
      columnClassName="grid-cols-2 gap-x-8"
      showInboundStem
    />
  )
}
