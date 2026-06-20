import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  buildHaveFillTooltip,
  countWorkspaceAssetsForResourceName,
} from '@/features/resources/workspace-asset-have-lookup'
import type { ResourceListItemData } from '@/features/resources/types'
import { cn } from '@/lib/utils'

type ResourceHaveFillButtonProps = {
  resourceName: string
  workspaceAssets: ResourceListItemData[]
  disabled?: boolean
  className?: string
  onFill: () => void
}

export function ResourceHaveFillButton({
  resourceName,
  workspaceAssets,
  disabled = false,
  className,
  onFill,
}: ResourceHaveFillButtonProps) {
  const matchCount = countWorkspaceAssetsForResourceName(workspaceAssets, resourceName)
  const tooltip = buildHaveFillTooltip(
    resourceName,
    matchCount,
    workspaceAssets.length > 0
  )

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || resourceName.trim().length < 2}
            aria-label={`Fill Have from workspace assets for ${resourceName || 'resource'}`}
            className={cn('h-6 w-6 shrink-0 text-muted-foreground hover:text-foreground', className)}
            onClick={(event) => {
              event.stopPropagation()
              onFill()
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
