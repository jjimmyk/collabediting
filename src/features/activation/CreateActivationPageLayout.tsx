import type { ReactNode } from 'react'
import { ChevronLeft, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type CreateActivationPageLayoutProps = {
  title: string
  steps: readonly string[]
  currentStep: number
  onStepChange: (step: number) => void
  onCancel: () => void
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
  isCreating: boolean
  isLastStep: boolean
  isBuildTeamStep: boolean
  submitLabel: string
  className?: string
  children: ReactNode
}

export function CreateActivationPageLayout({
  title,
  steps,
  currentStep,
  onStepChange,
  onCancel,
  onBack,
  onNext,
  onSubmit,
  isCreating,
  isLastStep,
  isBuildTeamStep,
  submitLabel,
  className,
  children,
}: CreateActivationPageLayoutProps) {
  return (
    <div className={cn('flex min-h-screen flex-col bg-background', className)}>
      <header className="flex h-14 shrink-0 items-center justify-between border-b px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <h1 className="truncate text-base font-semibold sm:text-lg">{title}</h1>
        </div>
      </header>

      <div className="shrink-0 border-b px-4 py-3 sm:px-6">
        <div
          className={cn(
            'grid gap-2',
            steps.length === 8
              ? 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8'
              : steps.length === 7
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-7'
                : steps.length === 5
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                  : steps.length === 6
                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6'
                    : 'grid-cols-2 sm:grid-cols-4'
          )}
        >
          {steps.map((stepLabel, index) => {
            const isActive = currentStep === index
            const isComplete = currentStep > index
            return (
              <button
                type="button"
                key={stepLabel}
                onClick={() => onStepChange(index)}
                className={cn(
                  'rounded-md border px-2 py-2 text-center text-xs transition-colors hover:bg-muted/40',
                  isActive && 'border-primary bg-primary/10 font-medium',
                  isComplete && 'border-emerald-500 bg-emerald-500/10'
                )}
              >
                <p>{stepLabel}</p>
              </button>
            )
          })}
        </div>
      </div>

      <main
        className={cn(
          'min-h-0 flex-1 px-4 py-4 sm:px-6',
          isBuildTeamStep ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'
        )}
      >
        {children}
      </main>

      <footer className="flex shrink-0 items-center justify-between gap-2 border-t px-4 py-4 sm:px-6">
        <div>
          {currentStep > 0 ? (
            <Button type="button" variant="outline" onClick={onBack}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Button>
          ) : null}
        </div>
        {isLastStep ? (
          <Button type="button" disabled={isCreating} onClick={onSubmit}>
            {isCreating ? 'Creating…' : submitLabel}
          </Button>
        ) : (
          <Button type="button" onClick={onNext}>
            Next
            <ChevronUp className="ml-1 h-4 w-4 rotate-90" />
          </Button>
        )}
      </footer>
    </div>
  )
}
