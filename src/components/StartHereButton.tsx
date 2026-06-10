import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type StartHereButtonProps = {
  className?: string
  onClick: () => void
  'data-hub-tutorial'?: string
  'data-ics201-tutorial'?: string
}

export function StartHereButton({
  className,
  onClick,
  'data-hub-tutorial': dataHubTutorial,
  'data-ics201-tutorial': dataIcs201Tutorial,
}: StartHereButtonProps) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={cn(
        'h-10 shrink-0 !border-2 !border-black font-medium dark:!border-white',
        className
      )}
      aria-label="Start PRATUS Coach tour"
      data-hub-tutorial={dataHubTutorial}
      data-ics201-tutorial={dataIcs201Tutorial}
      onClick={onClick}
    >
      Start Here
    </Button>
  )
}
