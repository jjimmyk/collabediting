import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { FEATURE_FLAG_CATALOG } from '@/features/hub/feature-flags/feature-flag-catalog'
import type { FeatureFlagId, FeatureFlagState } from '@/features/hub/feature-flags/feature-flag-catalog'
import { cn } from '@/lib/utils'

type FeatureFlagsPageProps = {
  flags: FeatureFlagState
  glassItemBorderClasses?: string
  onFlagChange: (flagId: FeatureFlagId, enabled: boolean) => void
}

export function FeatureFlagsPage({
  flags,
  glassItemBorderClasses = '',
  onFlagChange,
}: FeatureFlagsPageProps) {
  return (
    <div className="flex min-w-0 flex-col gap-4 pb-2">
      <section
        className={cn(
          'w-full min-w-0 rounded-lg border bg-muted/10 p-3',
          glassItemBorderClasses
        )}
      >
        <p className="text-sm font-medium">Feature flags</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Toggle experimental hub capabilities. Choices are saved locally in your browser.
        </p>
      </section>

      <section
        className={cn('w-full min-w-0 overflow-hidden rounded-lg border', glassItemBorderClasses)}
      >
        <div className="flex flex-col gap-2 px-3 py-3">
          {FEATURE_FLAG_CATALOG.map((flag) => {
            const isEnabled = flags[flag.id]
            return (
              <div
                key={flag.id}
                className="flex items-start justify-between gap-3 rounded-md border bg-background/40 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <Label htmlFor={`feature-flag-${flag.id}`} className="text-xs font-medium">
                    {flag.label}
                  </Label>
                  <p className="mt-0.5 text-xs text-muted-foreground">{flag.description}</p>
                </div>
                <Switch
                  id={`feature-flag-${flag.id}`}
                  checked={isEnabled}
                  onCheckedChange={(checked) => onFlagChange(flag.id, checked === true)}
                  aria-label={`Toggle ${flag.label} feature flag`}
                />
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
