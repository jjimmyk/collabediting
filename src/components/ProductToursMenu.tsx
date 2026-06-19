import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  getProductTourOptions,
  type ProductTourId,
} from '@/features/product-tours/registry'
import { cn } from '@/lib/utils'

type ProductToursMenuProps = {
  className?: string
  isOnHub: boolean
  isInWorkspace: boolean
  onStartTour: (tourId: ProductTourId) => void
}

export function ProductToursMenu({
  className,
  isOnHub,
  isInWorkspace,
  onStartTour,
}: ProductToursMenuProps) {
  const options = getProductTourOptions({ isOnHub, isInWorkspace })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className={cn(
            'h-10 shrink-0 gap-1 !border-2 !border-black font-medium dark:!border-white',
            className
          )}
          aria-label="Product Tours"
          data-hub-tutorial="product-tours"
          data-ics201-tutorial="workspace-menu"
        >
          Product Tours
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.id}
            disabled={option.disabled}
            className="flex flex-col items-start gap-0.5 py-2"
            onSelect={() => {
              if (!option.disabled) {
                onStartTour(option.id)
              }
            }}
          >
            <span className="font-medium">{option.label}</span>
            {option.disabled && option.disabledReason ? (
              <span className="text-xs font-normal text-muted-foreground">
                {option.disabledReason}
              </span>
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
