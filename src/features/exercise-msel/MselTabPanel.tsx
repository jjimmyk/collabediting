import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import type { ExerciseMselState, MselInject, MselInjectDelivery, MselViewTab } from './types'
import { FunctionalMselInjectsEditor } from './FunctionalMselInjectsEditor'
import { TabletopMselInjectsEditor } from './TabletopMselInjectsEditor'
import { InjectsReceivedList } from './InjectsReceivedList'

export type MselTabPanelProps = {
  workspaceName: string
  isTabletopWorkspace: boolean
  viewTab: MselViewTab
  onViewTabChange: (tab: MselViewTab) => void
  objectives: ExerciseMselState['objectives']
  injects: MselInject[]
  expandedInjectId: number | null
  onExpandedInjectIdChange: (injectId: number | null) => void
  onInjectsChange: (updater: (previous: MselInject[]) => MselInject[]) => void
  activePlacementInjectId: number | null
  onStartPlacement: (injectId: number) => void
  onFocusOnMap: (inject: MselInject) => void
  onFocusDeliveryOnMap?: (delivery: MselInjectDelivery) => void
  deliveryCountByInjectId: Record<number, number>
  onSendInject: (inject: MselInject) => void
  deliveries: MselInjectDelivery[]
  profileEmail?: string | null
  showMineOnly: boolean
  onShowMineOnlyChange: (value: boolean) => void
}

export function MselTabPanel({
  workspaceName,
  isTabletopWorkspace,
  viewTab,
  onViewTabChange,
  objectives,
  injects,
  expandedInjectId,
  onExpandedInjectIdChange,
  onInjectsChange,
  activePlacementInjectId,
  onStartPlacement,
  onFocusOnMap,
  onFocusDeliveryOnMap,
  deliveryCountByInjectId,
  onSendInject,
  deliveries,
  profileEmail,
  showMineOnly,
  onShowMineOnlyChange,
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
              value={viewTab}
              onValueChange={(value) => {
                if (value === 'schedule' || value === 'received') {
                  onViewTabChange(value)
                }
              }}
              variant="outline"
              size="sm"
              data-testid="msel-view-toggle"
            >
              <ToggleGroupItem value="schedule" aria-label="Inject Schedule">
                Inject Schedule
              </ToggleGroupItem>
              <ToggleGroupItem value="received" aria-label="Injects Received">
                Injects Received
              </ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      </div>

      {isTabletopWorkspace && viewTab === 'received' && (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <Checkbox
            id="msel-received-mine-only"
            checked={showMineOnly}
            onCheckedChange={(checked) => onShowMineOnlyChange(checked === true)}
          />
          <Label htmlFor="msel-received-mine-only" className="text-sm font-normal">
            Show only injects sent to me
          </Label>
        </div>
      )}

      {isTabletopWorkspace && viewTab === 'received' ? (
        <InjectsReceivedList
          deliveries={deliveries}
          objectives={objectives}
          recipientFilterEmail={showMineOnly ? profileEmail : null}
          onFocusOnMap={
            onFocusDeliveryOnMap
              ? (delivery) => onFocusDeliveryOnMap(delivery)
              : undefined
          }
        />
      ) : isTabletopWorkspace ? (
        <TabletopMselInjectsEditor
          objectives={objectives}
          injects={injects}
          expandedInjectId={expandedInjectId}
          onExpandedInjectIdChange={onExpandedInjectIdChange}
          onInjectsChange={onInjectsChange}
          activePlacementInjectId={activePlacementInjectId}
          onStartPlacement={onStartPlacement}
          onFocusOnMap={onFocusOnMap}
          deliveryCountByInjectId={deliveryCountByInjectId}
          onSendInject={onSendInject}
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
