import { cn } from '@/lib/utils'

import type { ReactNode } from 'react'

export function highlightMatchText(text: string, query: string): ReactNode {
  const normalizedQuery = query.trim()
  if (!normalizedQuery) return text

  const lowerText = text.toLowerCase()
  const lowerQuery = normalizedQuery.toLowerCase()
  const index = lowerText.indexOf(lowerQuery)
  if (index < 0) return text

  return (
    <>
      {text.slice(0, index)}
      <span className="font-semibold text-foreground">{text.slice(index, index + normalizedQuery.length)}</span>
      {text.slice(index + normalizedQuery.length)}
    </>
  )
}

export function hubAorMatchItemClassName(
  isDirectMatch: boolean,
  isPathMatch: boolean,
  selected: boolean
): string {
  return cn(
    isDirectMatch && 'ring-2 ring-primary bg-primary/5 font-semibold',
    !isDirectMatch && isPathMatch && 'ring-1 ring-primary/40',
    selected && 'bg-primary/5'
  )
}
