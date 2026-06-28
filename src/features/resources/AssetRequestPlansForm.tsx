import { Input } from '@/components/ui/input'
import {
  Ics213rrCheckboxRow,
  Ics213rrFieldRow,
  Ics213rrFormSection,
  Ics213rrNumberedBox,
} from '@/features/resources/ics-213rr-form-layout'
import type { CreateResourceRequestInput } from '@/lib/ics-213rr-resource-request'

type AssetRequestPlansFormProps = {
  value: CreateResourceRequestInput
  onChange: (next: CreateResourceRequestInput) => void
  idPrefix?: string
}

export function AssetRequestPlansForm({
  value,
  onChange,
  idPrefix = 'asset-request-plans',
}: AssetRequestPlansFormProps) {
  const patch = (patchValue: Partial<CreateResourceRequestInput>) => {
    onChange({ ...value, ...patchValue })
  }

  const syncReslTacticalResources = (next: Partial<CreateResourceRequestInput>) => {
    const reslTactical = next.reslTactical ?? value.reslTactical
    const reslPersonnel = next.reslPersonnel ?? value.reslPersonnel
    patch({
      ...next,
      reslTacticalResources: reslTactical || reslPersonnel,
    })
  }

  return (
    <Ics213rrFormSection railLabel="Plans">
      <Ics213rrNumberedBox title="8. RESL">
        <p className="text-xs text-muted-foreground">
          RESL – Check box (a) if request is for tactical resources or personnel. Then note
          availability in Box (b) or (c).
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2 rounded-md border bg-muted/20 p-3">
            <p className="text-xs font-medium">(a)</p>
            <Ics213rrCheckboxRow
              id={`${idPrefix}-tactical`}
              label="Tactical"
              checked={value.reslTactical}
              onCheckedChange={(checked) => syncReslTacticalResources({ reslTactical: checked })}
            />
            <Ics213rrCheckboxRow
              id={`${idPrefix}-personnel`}
              label="Personnel"
              checked={value.reslPersonnel}
              onCheckedChange={(checked) => syncReslTacticalResources({ reslPersonnel: checked })}
            />
          </div>
          <div className="space-y-2 rounded-md border bg-muted/20 p-3">
            <p className="text-xs font-medium">(b)</p>
            <Ics213rrCheckboxRow
              id={`${idPrefix}-available`}
              label="Available"
              checked={value.reslResourceAvailable}
              onCheckedChange={(checked) => patch({ reslResourceAvailable: checked })}
            />
          </div>
          <div className="space-y-2 rounded-md border bg-muted/20 p-3">
            <p className="text-xs font-medium">(c)</p>
            <Ics213rrCheckboxRow
              id={`${idPrefix}-not-available`}
              label="Not Available"
              checked={value.reslResourceNotAvailable}
              onCheckedChange={(checked) => patch({ reslResourceNotAvailable: checked })}
            />
          </div>
        </div>
      </Ics213rrNumberedBox>

      <Ics213rrNumberedBox title="9. RESL Review/Signature">
        <div className="grid gap-3 sm:grid-cols-3">
          <Ics213rrFieldRow label="Name" htmlFor={`${idPrefix}-resl-name`}>
            <Input
              id={`${idPrefix}-resl-name`}
              value={value.reslReviewName}
              onChange={(event) => patch({ reslReviewName: event.target.value })}
              className="h-9 text-xs"
            />
          </Ics213rrFieldRow>
          <Ics213rrFieldRow label="Signature" htmlFor={`${idPrefix}-resl-signature`}>
            <Input
              id={`${idPrefix}-resl-signature`}
              value={value.reslReviewSignature}
              onChange={(event) => patch({ reslReviewSignature: event.target.value })}
              className="h-9 text-xs"
            />
          </Ics213rrFieldRow>
          <Ics213rrFieldRow label="Date/time" htmlFor={`${idPrefix}-resl-datetime`}>
            <Input
              id={`${idPrefix}-resl-datetime`}
              value={value.reslReviewDateTime}
              onChange={(event) => patch({ reslReviewDateTime: event.target.value })}
              className="h-9 text-xs"
            />
          </Ics213rrFieldRow>
        </div>
      </Ics213rrNumberedBox>
    </Ics213rrFormSection>
  )
}
