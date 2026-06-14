import type { ReactNode } from 'react'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import { formatOperationalPeriodLabel } from '@/lib/operational-period-utils'

type OperationalPeriodHistoricalFormShellProps = {
  isViewingHistorical: boolean
  isLoading: boolean
  error: string | null
  periodNumber: number
  formLabel: string
  hasSnapshot: boolean
  glassItemBorderClasses: string
  children: ReactNode
}

export function OperationalPeriodHistoricalFormShell({
  isViewingHistorical,
  isLoading,
  error,
  periodNumber,
  formLabel,
  hasSnapshot,
  glassItemBorderClasses,
  children,
}: OperationalPeriodHistoricalFormShellProps) {
  if (!isViewingHistorical) {
    return <>{children}</>
  }

  if (isLoading) {
    return (
      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent>
          <ItemTitle>Loading operational period snapshot…</ItemTitle>
        </ItemContent>
      </Item>
    )
  }

  if (error) {
    return (
      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent>
          <ItemTitle>Could not load snapshot</ItemTitle>
          <ItemDescription>{error}</ItemDescription>
        </ItemContent>
      </Item>
    )
  }

  if (!hasSnapshot) {
    return (
      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent>
          <ItemTitle>No {formLabel} snapshot</ItemTitle>
          <ItemDescription>
            {formatOperationalPeriodLabel(periodNumber)} does not include a frozen copy of this
            form. Periods started before full form coverage was enabled may only include Planning-P
            core forms.
          </ItemDescription>
        </ItemContent>
      </Item>
    )
  }

  return <>{children}</>
}
