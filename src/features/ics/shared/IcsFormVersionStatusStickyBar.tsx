import type { ReactNode } from 'react'
import { Check, ChevronDown, History, Lock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import {
  ICS_FORM_STATUS_AMBER_CLASS,
  ICS_FORM_STATUS_EMERALD_CLASS,
  ICS_FORM_STICKY_CHROME_CLASS,
} from '@/features/ics/shared/ics-form-sticky-status'

type IcsFormVersionStatusStickyBarProps = {
  variant: 'latest' | 'past'
  statusContent: ReactNode
  leadingActions?: ReactNode
  versionsButton?: ReactNode
}

export function IcsFormSignedVersionsLockMessage({
  message = 'Signed versions are locked from edits.',
}: {
  message?: string
}) {
  return (
    <div className="flex items-center gap-2 text-muted-foreground">
      <Lock className="h-3.5 w-3.5" />
      <span>{message}</span>
    </div>
  )
}

export function IcsFormVersionsMenuButton({
  historyCount,
  signedCount,
  onOpenHistory,
  onOpenSigned,
  tutorialId,
}: {
  historyCount: number
  signedCount: number
  onOpenHistory: () => void
  onOpenSigned: () => void
  tutorialId?: string
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          data-ics201-tutorial={tutorialId}
        >
          <History className="h-3.5 w-3.5" />
          Versions
          <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
            {historyCount}
          </Badge>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 text-xs">
        <DropdownMenuItem className="text-xs" onSelect={onOpenHistory}>
          <History className="mr-2 h-3.5 w-3.5" />
          Version history
          <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">
            {historyCount}
          </Badge>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs"
          disabled={signedCount === 0}
          onSelect={onOpenSigned}
        >
          <Check className="mr-2 h-3.5 w-3.5" />
          Signed versions
          <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">
            {signedCount}
          </Badge>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function IcsFormVersionStatusStickyBar({
  variant,
  statusContent,
  leadingActions,
  versionsButton,
}: IcsFormVersionStatusStickyBarProps) {
  if (variant === 'past') {
    return (
      <div className={ICS_FORM_STICKY_CHROME_CLASS}>
        <div className={cn(ICS_FORM_STATUS_AMBER_CLASS, 'flex flex-col gap-2')}>{statusContent}</div>
      </div>
    )
  }

  return (
    <div className={ICS_FORM_STICKY_CHROME_CLASS}>
      <div className={cn(ICS_FORM_STATUS_EMERALD_CLASS, 'flex flex-wrap items-center gap-x-3 gap-y-2')}>
        <div className="min-w-0 shrink">{statusContent}</div>
        {leadingActions ? (
          <div className="flex min-w-0 flex-wrap items-center gap-2">{leadingActions}</div>
        ) : null}
        {versionsButton ? (
          <div className="ml-auto flex shrink-0 items-center">{versionsButton}</div>
        ) : null}
      </div>
    </div>
  )
}
