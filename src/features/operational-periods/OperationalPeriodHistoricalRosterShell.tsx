import type { ReactNode } from 'react'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { formatOperationalPeriodLabel } from '@/lib/operational-period-utils'

type OperationalPeriodHistoricalRosterShellProps = {
  isViewingHistorical: boolean
  isLoading: boolean
  error: string | null
  periodNumber: number
  hasSnapshot: boolean
  glassItemBorderClasses: string
  children: ReactNode
}

export function OperationalPeriodHistoricalRosterShell({
  isViewingHistorical,
  isLoading,
  error,
  periodNumber,
  hasSnapshot,
  glassItemBorderClasses,
  children,
}: OperationalPeriodHistoricalRosterShellProps) {
  if (!isViewingHistorical) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent>
          <ItemTitle>Loading roster snapshot…</ItemTitle>
        </ItemContent>
      </Item>
    )
  }

  if (error) {
    return (
      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent>
          <ItemTitle>Could not load roster snapshot</ItemTitle>
          <ItemDescription>{error}</ItemDescription>
        </ItemContent>
      </Item>
    )
  }

  if (!hasSnapshot) {
    return (
      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent>
          <ItemTitle>No roster snapshot</ItemTitle>
          <ItemDescription>
            {formatOperationalPeriodLabel(periodNumber)} does not include a frozen roster copy.
            Periods started before roster snapshots were enabled may not have one.
          </ItemDescription>
        </ItemContent>
      </Item>
    )
  }

  return <>{children}</>
}
