import type { Ics201CursorState } from '@/lib/ics201-cursor-sync'
import { Ics201RemoteCaretsOverlay } from '@/features/ics201/Ics201RemoteCaretsOverlay'

type Ics201RemoteTextCursorsProps = {
  value: string
  cursors: Ics201CursorState[]
  className?: string
  fieldKey?: string
}

/** @deprecated Use Ics201RemoteCaretsOverlay directly */
export function Ics201RemoteTextCursors({
  value,
  cursors,
  className,
  fieldKey = 'content',
}: Ics201RemoteTextCursorsProps) {
  return (
    <Ics201RemoteCaretsOverlay
      value={value}
      cursors={cursors}
      fieldKey={fieldKey}
      variant="multiline"
      className={className}
    />
  )
}

export type { Ics201CursorState }
