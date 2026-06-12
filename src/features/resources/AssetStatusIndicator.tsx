import { Triangle } from 'lucide-react'
import type { AssetStatus } from '@/features/resources/types'
import { cn } from '@/lib/utils'

const ASSET_STATUS_CONFIG: Record<
  AssetStatus,
  { label: string; className: string; rotationClassName: string }
> = {
  FMC: {
    label: 'FMC',
    className: 'text-green-500',
    rotationClassName: '',
  },
  PMC: {
    label: 'PMC',
    className: 'text-yellow-500',
    rotationClassName: 'rotate-90',
  },
  NMC: {
    label: 'NMC',
    className: 'text-red-500',
    rotationClassName: 'rotate-180',
  },
}

type AssetStatusIndicatorProps = {
  status: AssetStatus
  updatedAt?: string
  showLabel?: boolean
  className?: string
}

export function AssetStatusIndicator({
  status,
  updatedAt,
  showLabel = true,
  className,
}: AssetStatusIndicatorProps) {
  const config = ASSET_STATUS_CONFIG[status]

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 text-xs font-semibold',
        config.className,
        className
      )}
      aria-label={
        updatedAt
          ? `Asset status: ${config.label}, last updated ${updatedAt}`
          : `Asset status: ${config.label}`
      }
    >
      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
        <Triangle
          className={cn('h-3 w-3 fill-current', config.rotationClassName)}
          aria-hidden
        />
      </span>
      {updatedAt ? (
        <span className="font-normal tabular-nums text-muted-foreground">{updatedAt}</span>
      ) : null}
      {showLabel ? config.label : null}
    </span>
  )
}
