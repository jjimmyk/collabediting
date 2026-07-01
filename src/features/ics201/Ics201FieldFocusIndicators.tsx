import type { Ics201CursorState } from '@/lib/ics201-cursor-sync'
import { formatIcs201CursorFieldLabel } from '@/lib/ics201-cursor-bindings'

type Ics201FieldFocusIndicatorsProps = {
  cursors: Ics201CursorState[]
  fieldKeyPrefix?: string
  /** Exclude map draw pointers (shown as map pins instead). */
  excludeMapDraw?: boolean
}

export function Ics201FieldFocusIndicators({
  cursors,
  fieldKeyPrefix,
  excludeMapDraw = true,
}: Ics201FieldFocusIndicatorsProps) {
  const focused = cursors.filter((cursor) => {
    if (excludeMapDraw && cursor.fieldKey === 'map:draw') return false
    return fieldKeyPrefix ? cursor.fieldKey.startsWith(fieldKeyPrefix) : true
  })
  if (focused.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5 pb-1">
      {focused.map((cursor) => (
        <span
          key={cursor.userId}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
          style={{ backgroundColor: cursor.userColor }}
        >
          {cursor.userInitials} editing {formatIcs201CursorFieldLabel(cursor.fieldKey)}
        </span>
      ))}
    </div>
  )
}
