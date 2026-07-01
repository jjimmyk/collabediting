import type { Ics201CursorState } from '@/lib/ics201-cursor-sync'
import { bindIcs201InputCursorHandlers } from '@/lib/ics201-cursor-bindings'
import { useIcs201DraftLivePublish } from '@/features/ics201/Ics201DraftLiveContext'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'
import { Ics201RemoteCaretsOverlay } from '@/features/ics201/Ics201RemoteCaretsOverlay'

type Ics201RemoteFieldCaretsProps = {
  fieldKey: string
  value: string
  cursors: Ics201CursorState[]
  publish: (fieldKey: string, anchor: number, head: number) => void
  clear: () => void
  className?: string
  inputClassName?: string
  placeholder?: string
  autoFocus?: boolean
  type?: string
  step?: string
  'aria-label'?: string
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export function Ics201RemoteFieldCarets({
  fieldKey,
  value,
  cursors,
  publish,
  clear,
  className,
  inputClassName,
  placeholder,
  autoFocus,
  type = 'text',
  step,
  'aria-label': ariaLabel,
  onChange,
}: Ics201RemoteFieldCaretsProps) {
  const handlers = bindIcs201InputCursorHandlers(fieldKey, publish, clear)
  const publishDraftLive = useIcs201DraftLivePublish()

  return (
    <div className={cn('relative', className)}>
      <input
        autoFocus={autoFocus}
        type={type}
        step={step}
        value={value}
        onChange={(event) => {
          onChange(event)
          publishDraftLive?.(fieldKey, event.target.value)
        }}
        placeholder={placeholder}
        aria-label={ariaLabel}
        className={cn(
          'h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none',
          inputClassName
        )}
        {...handlers}
      />
      <Ics201RemoteCaretsOverlay
        value={value}
        cursors={cursors}
        fieldKey={fieldKey}
        variant="singleline"
      />
    </div>
  )
}

type Ics201RemoteFieldCaretsViewProps = {
  fieldKey: string
  value: string
  cursors: Ics201CursorState[]
  className?: string
  children?: React.ReactNode
}

export function Ics201RemoteTextareaCarets({
  fieldKey,
  value,
  cursors,
  publish,
  clear,
  className,
  placeholder,
  onChange,
}: {
  fieldKey: string
  value: string
  cursors: Ics201CursorState[]
  publish: (fieldKey: string, anchor: number, head: number) => void
  clear: () => void
  className?: string
  placeholder?: string
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void
}) {
  const handlers = bindIcs201InputCursorHandlers(fieldKey, publish, clear)
  const publishDraftLive = useIcs201DraftLivePublish()

  return (
    <div className="relative">
      <Textarea
        value={value}
        onChange={(event) => {
          onChange(event)
          publishDraftLive?.(fieldKey, event.target.value)
        }}
        placeholder={placeholder}
        className={cn('min-h-16 text-xs', className)}
        {...handlers}
      />
      <Ics201RemoteCaretsOverlay
        value={value}
        cursors={cursors}
        fieldKey={fieldKey}
        variant="multiline"
        className="min-h-16 text-xs"
      />
    </div>
  )
}

export function Ics201RemoteTextareaCaretsView({
  fieldKey,
  value,
  cursors,
  className,
  children,
}: {
  fieldKey: string
  value: string
  cursors: Ics201CursorState[]
  className?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'relative min-h-16 rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs',
        className
      )}
    >
      {children ?? (value || <span className="text-muted-foreground">—</span>)}
      <Ics201RemoteCaretsOverlay
        value={value}
        cursors={cursors}
        fieldKey={fieldKey}
        variant="multiline"
        className="min-h-16 px-2.5 py-2 text-xs"
      />
    </div>
  )
}

export function Ics201RemoteFieldCaretsView({
  fieldKey,
  value,
  cursors,
  className,
  children,
}: Ics201RemoteFieldCaretsViewProps) {
  return (
    <div className={cn('relative rounded-md border border-dashed border-border/60 bg-muted/20 px-2.5 py-2 text-xs', className)}>
      {children ?? (value || <span className="text-muted-foreground">—</span>)}
      <Ics201RemoteCaretsOverlay
        value={value}
        cursors={cursors}
        fieldKey={fieldKey}
        variant="singleline"
        className="px-2.5 py-2 text-xs"
      />
    </div>
  )
}
