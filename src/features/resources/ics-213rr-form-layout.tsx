import type { ReactNode } from 'react'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export function Ics213rrFieldRow({
  label,
  htmlFor,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="text-xs">
        {label}
      </Label>
      {children}
    </div>
  )
}

export function Ics213rrNumberedBox({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn('space-y-3 rounded-md border bg-background p-3', className)}>
      <p className="text-xs font-semibold text-foreground">{title}</p>
      {children}
    </div>
  )
}

export function Ics213rrFormSection({
  railLabel,
  children,
}: {
  railLabel: string
  children: ReactNode
}) {
  return (
    <div className="flex overflow-hidden rounded-md border bg-muted/10">
      <div
        className="flex w-10 shrink-0 items-center justify-center border-r bg-muted/30 px-1 py-4"
        aria-hidden
      >
        <span className="rotate-180 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground [writing-mode:vertical-rl]">
          {railLabel}
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-3 p-3">{children}</div>
    </div>
  )
}

export function Ics213rrCheckboxRow({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string
  label: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-xs">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onCheckedChange(event.target.checked)}
        className="h-4 w-4 rounded border border-input"
      />
      <span>{label}</span>
    </label>
  )
}
