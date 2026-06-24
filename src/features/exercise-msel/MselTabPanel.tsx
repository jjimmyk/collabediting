import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { ExerciseMselState, MselInject, MselMode } from './types'
import { FunctionalMselInjectsEditor } from './FunctionalMselInjectsEditor'
import { TabletopMselInjectsEditor } from './TabletopMselInjectsEditor'

export type MselTabPanelProps = {
  workspaceName: string
  isTabletopWorkspace: boolean
  mode: MselMode
  onModeChange: (mode: MselMode) => void
  objectives: ExerciseMselState['objectives']
  injects: MselInject[]
  expandedInjectId: number | null
  onExpandedInjectIdChange: (injectId: number | null) => void
  onInjectsChange: (updater: (previous: MselInject[]) => MselInject[]) => void
  activePlacementInjectId: number | null
  onStartPlacement: (injectId: number) => void
  onFocusOnMap: (inject: MselInject) => void
}

export function MselTabPanel({
  workspaceName,
  isTabletopWorkspace,
  mode,
  onModeChange,
  objectives,
  injects,
  expandedInjectId,
  onExpandedInjectIdChange,
  onInjectsChange,
  activePlacementInjectId,
  onStartPlacement,
  onFocusOnMap,
}: MselTabPanelProps) {
  return (
    <div className="space-y-3">
      <div className="rounded-md border px-3 py-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">MSEL</p>
            <p className="text-xs text-muted-foreground">Exercise workspace for {workspaceName}</p>
          </div>
          {isTabletopWorkspace && (
            <ToggleGroup
              type="single"
              value={mode}
              onValueChange={(value) => {
                if (value === 'functional' || value === 'tabletop') {
                  onModeChange(value)
                }
              }}
              variant="outline"
              size="sm"
              data-testid="msel-mode-toggle"
            >
              <ToggleGroupItem value="functional" aria-label="Functional MSEL mode">
                Functional
              </ToggleGroupItem>
              <ToggleGroupItem value="tabletop" aria-label="Tabletop MSEL mode">
                Tabletop
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      </div>

      {mode === 'tabletop' && isTabletopWorkspace ? (
        <TabletopMselInjectsEditor
          objectives={objectives}
          injects={injects}
          expandedInjectId={expandedInjectId}
          onExpandedInjectIdChange={onExpandedInjectIdChange}
          onInjectsChange={onInjectsChange}
          activePlacementInjectId={activePlacementInjectId}
          onStartPlacement={onStartPlacement}
          onFocusOnMap={onFocusOnMap}
        />
      ) : (
        <FunctionalMselInjectsEditor
          objectives={objectives}
          injects={injects}
          expandedInjectId={expandedInjectId}
          onExpandedInjectIdChange={onExpandedInjectIdChange}
          onInjectsChange={onInjectsChange}
        />
      )}
    </div>
  )
}
