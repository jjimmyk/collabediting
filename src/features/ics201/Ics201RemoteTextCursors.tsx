import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Ics201CursorState } from '@/lib/ics201-cursor-sync'
import { cn } from '@/lib/utils'

type Ics201RemoteTextCursorsProps = {
  value: string
  cursors: Ics201CursorState[]
  className?: string
}

function measureCaretOffset(text: string, offset: number, mirror: HTMLDivElement): number {
  const clamped = Math.max(0, Math.min(offset, text.length))
  mirror.textContent = text.slice(0, clamped)
  const marker = document.createElement('span')
  marker.textContent = '\u200b'
  mirror.appendChild(marker)
  const top = marker.offsetTop
  const left = marker.offsetLeft
  mirror.removeChild(marker)
  return top * 10_000 + left
}

export function Ics201RemoteTextCursors({ value, cursors, className }: Ics201RemoteTextCursorsProps) {
  const mirrorRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<Array<{ userId: string; top: number; left: number; color: string; label: string }>>([])

  const visibleCursors = useMemo(
    () => cursors.filter((cursor) => cursor.fieldKey === 'content'),
    [cursors]
  )

  useLayoutEffect(() => {
    const mirror = mirrorRef.current
    if (!mirror) return
    const next = visibleCursors.map((cursor) => {
      const headOffset = measureCaretOffset(value, cursor.head, mirror)
      const top = Math.floor(headOffset / 10_000)
      const left = headOffset % 10_000
      return {
        userId: cursor.userId,
        top,
        left,
        color: cursor.userColor,
        label: cursor.userInitials,
      }
    })
    setPositions(next)
  }, [value, visibleCursors])

  return (
    <>
      <div
        ref={mirrorRef}
        aria-hidden
        className={cn(
          'pointer-events-none invisible absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-2.5 py-2 text-xs',
          className
        )}
      />
      {positions.map((position) => (
        <div
          key={position.userId}
          className="pointer-events-none absolute z-10"
          style={{ top: position.top + 8, left: position.left + 10 }}
        >
          <div
            className="h-4 w-0.5"
            style={{ backgroundColor: position.color }}
          />
          <span
            className="mt-0.5 inline-block rounded px-1 py-0.5 text-[9px] font-semibold text-white"
            style={{ backgroundColor: position.color }}
          >
            {position.label}
          </span>
        </div>
      ))}
    </>
  )
}
