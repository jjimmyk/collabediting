import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Ics201SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type Ics201SaveStatusIndicatorProps = {
  status: Ics201SaveStatus
  className?: string
}

export function Ics201SaveStatusIndicator({ status, className }: Ics201SaveStatusIndicatorProps) {
  if (status === 'idle') return null

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px]',
        status === 'error' ? 'text-destructive' : 'text-muted-foreground',
        className
      )}
    >
      {status === 'saving' ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Saving…
        </>
      ) : status === 'saved' ? (
        <>
          <Check className="h-3 w-3" />
          All changes saved
        </>
      ) : (
        'Save failed — retrying…'
      )}
    </span>
  )
}
