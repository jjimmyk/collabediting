import type { ReactNode } from 'react'

type HaveLinkInlineRosterSectionProps = {
  children: ReactNode
}

export function HaveLinkInlineRosterSection({ children }: HaveLinkInlineRosterSectionProps) {
  return (
    <div className="space-y-2 rounded-md border bg-muted/5 p-2">
      <p className="text-[11px] text-muted-foreground">
        Workspace roster — edit assignments while linking. Rows show Have linkage badges.
      </p>
      <div className="max-h-[28rem] min-h-[16rem] overflow-hidden">{children}</div>
    </div>
  )
}
