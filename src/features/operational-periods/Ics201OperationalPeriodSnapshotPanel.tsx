import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import type { Ics201FormState } from '@/features/ics201/types'
import { formatOperationalPeriodLabel } from '@/lib/operational-period-utils'

type Ics201OperationalPeriodSnapshotPanelProps = {
  form: Ics201FormState
  periodNumber: number
  glassItemBorderClasses: string
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm">{value || '—'}</p>
    </div>
  )
}

export function Ics201OperationalPeriodSnapshotPanel({
  form,
  periodNumber,
  glassItemBorderClasses,
}: Ics201OperationalPeriodSnapshotPanelProps) {
  return (
    <div className="space-y-3">
      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent>
          <ItemTitle>{formatOperationalPeriodLabel(periodNumber)} snapshot</ItemTitle>
          <ItemDescription>
            Read-only ICS-201 Incident Briefing captured when this operational period was started.
          </ItemDescription>
        </ItemContent>
      </Item>

      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent className="space-y-4">
          <ReadOnlyField label="Incident Name" value={form.incidentName} />
          <ReadOnlyField label="Incident Location" value={form.incidentLocation} />
          <ReadOnlyField
            label="Operational Period"
            value={`${form.operationalPeriodStart} – ${form.operationalPeriodEnd}`}
          />
          <ReadOnlyField label="Current Situation" value={form.currentSituationSummary} />
          <ReadOnlyField label="Objectives" value={form.objectives.join('\n')} />
          <ReadOnlyField
            label="Actions"
            value={form.actions.map((row) => `${row.task} (${row.owner})`).join('\n')}
          />
          <ReadOnlyField
            label="Resources"
            value={form.resources
              .map((row) => `${row.category}: ${row.identifier} × ${row.quantity}`)
              .join('\n')}
          />
          <ReadOnlyField
            label="Safety Analysis"
            value={form.safetyAnalysis.map((row) => row.hazard).join('\n')}
          />
        </ItemContent>
      </Item>
    </div>
  )
}
