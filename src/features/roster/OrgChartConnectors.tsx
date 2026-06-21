import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function OrgChartVerticalLine({
  className,
  heightClassName = 'h-4',
}: {
  className?: string
  heightClassName?: string
}) {
  return <div className={cn('w-px shrink-0 bg-border', heightClassName, className)} aria-hidden />
}

export function OrgChartHorizontalLine({ className }: { className?: string }) {
  return <div className={cn('h-px shrink-0 bg-border', className)} aria-hidden />
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

/** Shared horizontal crossbar with vertical drops into each column. */
export function OrgChartCrossbarColumns({
  columns,
  className,
  barInsetClassName = 'left-[6%] right-[6%]',
  columnClassName,
}: {
  columns: ReactNode[]
  className?: string
  barInsetClassName?: string
  columnClassName?: string
}) {
  if (columns.length === 0) return null

  return (
    <div className={cn('relative flex w-full min-w-0 flex-col items-center pt-4', className)}>
      <OrgChartHorizontalLine className={cn('absolute top-0', barInsetClassName)} />
      <div
        className={cn('grid w-full min-w-0 gap-2', columnClassName)}
      >
        {columns.map((column, index) => (
          <div key={index} className="flex min-w-0 flex-col items-center">
            <OrgChartVerticalLine heightClassName="h-4" />
            {column}
          </div>
        ))}
      </div>
    </div>
  )
}

/** Vertical stack with a left rail and horizontal elbows to each child. */
export function OrgChartLeftRailStack({ children }: { children: ReactNode[] }) {
  if (children.length === 0) return null

  return (
    <div className="flex w-full min-w-0 flex-col items-center">
      <OrgChartVerticalLine />
      <div className="flex w-full min-w-0 flex-col items-center gap-2 pt-1">
        {children.map((child, index) => (
          <div key={index} className="relative flex w-full min-w-0 items-center justify-center">
            <div
              className="pointer-events-none absolute top-1/2 flex -translate-y-1/2 items-center"
              style={{ right: 'calc(50% + 5.5rem)' }}
              aria-hidden
            >
              <OrgChartHorizontalLine className="w-5" />
              {index < children.length - 1 ? (
                <div className="absolute left-0 top-1/2 h-[calc(100%+0.5rem)] w-px bg-border" />
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
    <div className="flex w-full min-w-0 flex-col items-center">
      <OrgChartVerticalLine />
      <OrgChartCrossbarColumns
        columns={children}
        className="pt-4"
        barInsetClassName="left-[8%] right-[8%]"
        columnClassName="gap-3"
      />
    </div>
  )
}
