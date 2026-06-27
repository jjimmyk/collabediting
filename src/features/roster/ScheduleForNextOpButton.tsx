import { CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ScheduleForNextOpButton({
  disabled = false,
  onClick,
  compact = false,
}: {
  disabled?: boolean
  onClick: () => void
  compact?: boolean
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      className={compact ? 'h-7 gap-1 px-2 text-[10px]' : 'h-7 gap-1 px-2 text-[11px]'}
      disabled={disabled}
      onClick={onClick}
    >
      <CalendarClock className="h-3.5 w-3.5 shrink-0" />
      Also schedule for next OP
    </Button>
  )
}
