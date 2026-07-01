import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Ics201CursorState } from '@/lib/ics201-cursor-sync'
import { cn } from '@/lib/utils'

type CaretPosition = {
  userId: string
  top: number
  left: number
  color: string
  label: string
  selectionRects: Array<{ top: number; left: number; width: number; height: number }>
}

type Ics201RemoteCaretsOverlayProps = {
  value: string
  cursors: Ics201CursorState[]
  fieldKey: string
  variant?: 'multiline' | 'singleline'
  className?: string
}

function measureCaretPosition(
  text: string,
  offset: number,
  mirror: HTMLDivElement
): { top: number; left: number } {
  const clamped = Math.max(0, Math.min(offset, text.length))
  mirror.textContent = text.slice(0, clamped)
  const marker = document.createElement('span')
  marker.textContent = '\u200b'
  mirror.appendChild(marker)
  const top = marker.offsetTop
  const left = marker.offsetLeft
  mirror.removeChild(marker)
  return { top, left }
}

function measureSelectionRects(
  text: string,
  anchor: number,
  head: number,
  mirror: HTMLDivElement
): Array<{ top: number; left: number; width: number; height: number }> {
  const start = Math.min(anchor, head)
  const end = Math.max(anchor, head)
  if (start === end) return []

  mirror.textContent = ''
  const before = document.createTextNode(text.slice(0, start))
  const selected = document.createElement('span')
  selected.textContent = text.slice(start, end) || '\u200b'
  const after = document.createTextNode(text.slice(end))
  mirror.appendChild(before)
  mirror.appendChild(selected)
  mirror.appendChild(after)

  const mirrorRect = mirror.getBoundingClientRect()
  const rects = Array.from(selected.getClientRects()).map((rect) => ({
    top: rect.top - mirrorRect.top,
    left: rect.left - mirrorRect.left,
    width: rect.width,
    height: rect.height,
  }))
  return rects
}

export function Ics201RemoteCaretsOverlay({
  value,
  cursors,
  fieldKey,
  variant = 'multiline',
  className,
}: Ics201RemoteCaretsOverlayProps) {
  const mirrorRef = useRef<HTMLDivElement>(null)
  const [positions, setPositions] = useState<CaretPosition[]>([])

  const visibleCursors = useMemo(
    () => cursors.filter((cursor) => cursor.fieldKey === fieldKey),
    [cursors, fieldKey]
  )

  useLayoutEffect(() => {
    const mirror = mirrorRef.current
    if (!mirror) return
    const next = visibleCursors.map((cursor) => {
      const headPos = measureCaretPosition(value, cursor.head, mirror)
      const selectionRects = measureSelectionRects(value, cursor.anchor, cursor.head, mirror)
      return {
        userId: cursor.userId,
        top: headPos.top,
        left: headPos.left,
        color: cursor.userColor,
        label: cursor.userInitials,
        selectionRects,
      }
    })
    setPositions(next)
  }, [value, visibleCursors])

  const mirrorClasses =
    variant === 'singleline'
      ? 'whitespace-pre overflow-hidden px-2 text-xs leading-8'
      : 'whitespace-pre-wrap break-words px-2.5 py-2 text-xs'

  return (
    <>
      <div
        ref={mirrorRef}
        aria-hidden
        className={cn(
          'pointer-events-none invisible absolute inset-0',
          mirrorClasses,
          className
        )}
      />
      {positions.map((position) => (
        <div key={position.userId} className="pointer-events-none absolute inset-0 z-10">
          {position.selectionRects.map((rect, index) => (
            <div
              key={`${position.userId}-sel-${index}`}
              className="absolute rounded-sm opacity-30"
              style={{
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                backgroundColor: position.color,
              }}
            />
          ))}
          <div
            className="absolute"
            style={{ top: position.top, left: position.left }}
          >
            <div className="h-4 w-0.5" style={{ backgroundColor: position.color }} />
            <span
              className="mt-0.5 inline-block rounded px-1 py-0.5 text-[9px] font-semibold text-white"
              style={{ backgroundColor: position.color }}
            >
              {position.label}
            </span>
          </div>
        </div>
      ))}
    </>
  )
}
