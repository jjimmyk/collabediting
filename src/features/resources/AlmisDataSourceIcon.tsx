import { Database } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export function AlmisDataSourceIcon() {
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className="inline-flex shrink-0 items-center text-muted-foreground"
            aria-label="External Data Source: ALMIS"
          >
            <Database className="h-3.5 w-3.5" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">External Data Source: ALMIS</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
