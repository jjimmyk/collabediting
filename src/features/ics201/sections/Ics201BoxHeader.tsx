import type { ReactNode } from 'react'
import { ItemTitle } from '@/components/ui/item'
import { cn } from '@/lib/utils'

export type Ics201BoxHeaderProps = {
  title: string
  subsectionTitle?: string
  editors?: ReactNode
  actions?: ReactNode
  className?: string
}

export function Ics201BoxHeader({
  title,
  subsectionTitle,
  editors,
  actions,
  className,
}: Ics201BoxHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-2', className)}>
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <ItemTitle className="text-xs leading-snug">{title}</ItemTitle>
          {editors}
        </div>
        {subsectionTitle ? (
          <p className="text-[11px] font-medium text-muted-foreground">{subsectionTitle}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </div>
  )
}
