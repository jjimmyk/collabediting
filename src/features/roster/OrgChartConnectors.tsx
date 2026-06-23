import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  ORG_CHART_CONNECTOR_BORDER_CLASS,
  ORG_CHART_CONNECTOR_BORDER_WIDTH,
  ORG_CHART_CONNECTOR_CLASS,
  ORG_CHART_CONNECTOR_DROP_HEIGHT,
  ORG_CHART_CONNECTOR_LINE_WIDTH,
  ORG_CHART_CONNECTOR_STEM_HEIGHT,
  ORG_CHART_FORK_BRANCH_COLUMN_MIN_WIDTH,
  ORG_CHART_LOGISTICS_FORK_MIN_WIDTH,
  ORG_CHART_SUBORDINATE_ARM_CHANNEL_WIDTH,
  ORG_CHART_SUBORDINATE_ROW_GAP,
  orgChartCrossbarBarInsetClassName,
} from '@/features/roster/org-chart-layout-tokens'

export function OrgChartVerticalLine({
  className,
  heightClassName = ORG_CHART_CONNECTOR_STEM_HEIGHT,
}: {
  className?: string
  heightClassName?: string
}) {
  return (
    <div
      className={cn(
        ORG_CHART_CONNECTOR_LINE_WIDTH,
        'shrink-0',
        ORG_CHART_CONNECTOR_CLASS,
        heightClassName,
        className
      )}
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
  heightClassName = ORG_CHART_CONNECTOR_STEM_HEIGHT,
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
  return <OrgChartInboundStem>{children}</OrgChartInboundStem>
}

/** Segment of the center spine below Incident Commander. */
export function OrgChartCenterSpine({
  heightClassName = ORG_CHART_CONNECTOR_STEM_HEIGHT,
}: {
  heightClassName?: string
}) {
  return <OrgChartVerticalLine heightClassName={heightClassName} />
}

/**
 * ICS 207 command-staff row — center spine with horizontal arms to left/right columns.
 * Arms terminate at the arm channel edge; cards sit outside the channel.
 */
export function OrgChartSpineTeeRow({
  left,
  right,
}: {
  left: ReactNode[]
  right: ReactNode[]
}) {
  if (left.length === 0 && right.length === 0) return null

  return (
    <div className="relative flex w-full min-w-0 flex-row items-stretch">
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col justify-center',
          ORG_CHART_SUBORDINATE_ROW_GAP,
          'items-end'
        )}
      >
        {left.map((node, index) => (
          <div key={index} className="flex max-w-full flex-row items-center">
            {node}
            <div
              className={cn(
                'flex shrink-0 items-center',
                ORG_CHART_SUBORDINATE_ARM_CHANNEL_WIDTH
              )}
            >
              <OrgChartHorizontalLine className="w-full" />
            </div>
          </div>
        ))}
      </div>
      <div className="relative mx-0 w-0.5 shrink-0 self-stretch" aria-hidden>
        <div
          className={cn(
            'absolute inset-y-0 left-0',
            ORG_CHART_CONNECTOR_LINE_WIDTH,
            ORG_CHART_CONNECTOR_CLASS
          )}
        />
      </div>
      <div
        className={cn(
          'flex min-w-0 flex-1 flex-col justify-center',
          ORG_CHART_SUBORDINATE_ROW_GAP,
          'items-start'
        )}
      >
        {right.map((node, index) => (
          <div key={index} className="flex max-w-full flex-row items-center">
            <div
              className={cn(
                'flex shrink-0 items-center',
                ORG_CHART_SUBORDINATE_ARM_CHANNEL_WIDTH
              )}
            >
              <OrgChartHorizontalLine className="w-full" />
            </div>
            {node}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Shared horizontal crossbar with vertical drops into each column. */
export function OrgChartCrossbarColumns({
  columns,
  className,
  barInsetClassName,
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

  const resolvedBarInset =
    barInsetClassName ?? orgChartCrossbarBarInsetClassName(columns.length)

  return (
    <div className={cn('relative flex w-full min-w-0 flex-col items-center', className)}>
      {showInboundStem ? (
        <OrgChartVerticalLine heightClassName={ORG_CHART_CONNECTOR_STEM_HEIGHT} />
      ) : null}
      <div className="relative flex w-full min-w-0 flex-col items-center">
        <OrgChartHorizontalLine
          className={cn('absolute top-0 -translate-y-1/2', resolvedBarInset)}
        />
        <div className={cn('grid w-max min-w-full gap-x-4', columnClassName)}>
          {columns.map((column, index) => (
            <div key={index} className="flex min-w-0 flex-col items-center">
              <OrgChartVerticalLine
                heightClassName={ORG_CHART_CONNECTOR_DROP_HEIGHT}
                className="-mt-px"
              />
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
    <div className={cn('flex w-full min-w-0 flex-col items-center', ORG_CHART_SUBORDINATE_ROW_GAP)}>
      {children.map((child, index) => (
        <OrgChartInboundStem key={index}>{child}</OrgChartInboundStem>
      ))}
    </div>
  )
}

/**
 * ICS-style subordinate layout: one continuous border-left trunk, arm channel, then card.
 * The trunk runs through row gaps so vertical lines never break between subordinates.
 */
export function OrgChartRightIndentStack({
  children,
  connectFromParent = false,
}: {
  children: ReactNode[]
  connectFromParent?: boolean
}) {
  if (children.length === 0) return null

  return (
    <div
      className="flex w-full min-w-0 flex-col self-start"
      data-org-chart-layout="right-indent"
    >
      {connectFromParent ? (
        <div
          className={cn(
            'flex flex-row items-start',
            ORG_CHART_SUBORDINATE_ARM_CHANNEL_WIDTH
          )}
        >
          <OrgChartVerticalLine heightClassName={ORG_CHART_CONNECTOR_STEM_HEIGHT} />
        </div>
      ) : null}
      <div
        className={cn(
          'flex flex-col',
          ORG_CHART_SUBORDINATE_ROW_GAP,
          ORG_CHART_CONNECTOR_BORDER_WIDTH,
          ORG_CHART_CONNECTOR_BORDER_CLASS
        )}
      >
        {children.map((child, index) => (
          <div key={index} className="flex min-w-0 flex-row items-center">
            <div
              className={cn(
                'flex shrink-0 items-center',
                ORG_CHART_SUBORDINATE_ARM_CHANNEL_WIDTH
              )}
            >
              <OrgChartHorizontalLine className="w-full" />
            </div>
            <div className="min-w-0 shrink-0">{child}</div>
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
      <div className={cn('flex w-full min-w-0 flex-col items-center', ORG_CHART_SUBORDINATE_ROW_GAP)}>
        {children.map((child, index) => (
          <OrgChartInboundStem key={index}>{child}</OrgChartInboundStem>
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
      columnClassName="grid-cols-2 gap-x-8"
      showInboundStem
    />
  )
}
