import { useEffect, useState } from 'react'
import { Loader2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { OrgMemberSearchResult } from '@/lib/workspace-service'

export function OrgMemberSearchPickerPopover({
  label,
  disabled,
  onSearch,
  onSelect,
  position,
}: {
  label: string
  disabled: boolean
  onSearch: (query: string, position?: string) => Promise<OrgMemberSearchResult[]>
  onSelect: (userId: string) => void
  position?: string
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<OrgMemberSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      return
    }

    const trimmed = query.trim()
    const timeout = window.setTimeout(() => {
      setIsSearching(true)
      void onSearch(trimmed, position)
        .then((nextResults) => {
          setResults(nextResults)
        })
        .catch(() => {
          setResults([])
        })
        .finally(() => {
          setIsSearching(false)
        })
    }, trimmed.length > 0 ? 250 : 0)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [onSearch, open, position, query])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 min-w-[6.5rem] flex-1 gap-1 px-2 text-[11px]"
          disabled={disabled}
        >
          <UserPlus className="h-3.5 w-3.5 shrink-0" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 space-y-2 p-2">
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name or email"
          className="h-8 text-xs"
          autoFocus
        />
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {isSearching ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading people…
            </div>
          ) : results.length === 0 ? (
            <p className="px-1 py-4 text-center text-[11px] text-muted-foreground">
              {query.trim()
                ? 'No matching organization members found.'
                : 'No organization members are available for this position.'}
            </p>
          ) : (
            results.map((result) => (
              <Button
                key={result.id ?? result.email}
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto min-h-8 w-full flex-col items-start justify-start gap-0.5 px-2 py-1.5 text-left text-xs"
                onClick={() => {
                  if (!result.id) return
                  onSelect(result.id)
                  setOpen(false)
                }}
              >
                <span className="truncate font-medium">{result.email}</span>
                {result.fullName ? (
                  <span className="truncate text-[11px] text-muted-foreground">
                    {result.fullName}
                  </span>
                ) : null}
              </Button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function MemberPickerPopover({
  label,
  members,
  disabled,
  onSelect,
}: {
  label: string
  members: Array<{ id: string; email: string }>
  disabled: boolean
  onSelect: (memberId: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 min-w-[6.5rem] flex-1 gap-1 px-2 text-[11px]"
          disabled={disabled || members.length === 0}
        >
          <UserPlus className="h-3.5 w-3.5 shrink-0" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-2">
        <div className="max-h-56 space-y-1 overflow-y-auto">
          {members.map((member) => (
            <Button
              key={member.id}
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start truncate text-xs"
              onClick={() => {
                onSelect(member.id)
                setOpen(false)
              }}
            >
              {member.email}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}
