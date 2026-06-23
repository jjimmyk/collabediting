import type { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

type OrgChartNodeDetailDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  contentClassName?: string
  children: ReactNode
}

export function OrgChartNodeDetailDialog({
  open,
  onOpenChange,
  title,
  description,
  contentClassName,
  children,
}: OrgChartNodeDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[min(85vh,48rem)] w-full max-w-[calc(100%-2rem)] overflow-y-auto sm:max-w-2xl',
          contentClassName
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
