import { cn } from '@/lib/utils'

type PlanningPCircularProgressProps = {
  percent: number
  label: string
  inverted?: boolean
  className?: string
  size?: number
}

export function PlanningPCircularProgress({
  percent,
  label,
  inverted = false,
  className,
  size = 20,
}: PlanningPCircularProgressProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  const strokeWidth = 2.5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference - (clamped / 100) * circumference

  return (
    <span
      className={cn('relative inline-flex shrink-0 items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-label={`${label}: ${clamped}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90"
        aria-hidden="true"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className={inverted ? 'text-primary-foreground/30' : 'text-muted-foreground/30'}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className={cn(
            'transition-[stroke-dashoffset]',
            inverted ? 'text-primary-foreground' : 'text-primary'
          )}
        />
      </svg>
      <span
        className={cn(
          'absolute text-[7px] font-semibold tabular-nums leading-none',
          inverted ? 'text-primary-foreground' : 'text-foreground'
        )}
      >
        {clamped}
      </span>
    </span>
  )
}
