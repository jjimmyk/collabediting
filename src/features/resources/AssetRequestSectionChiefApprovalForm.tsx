import { Input } from '@/components/ui/input'
import { Ics213rrFieldRow, Ics213rrNumberedBox } from '@/features/resources/ics-213rr-form-layout'
import type { CreateResourceRequestInput } from '@/lib/ics-213rr-resource-request'

type AssetRequestSectionChiefApprovalFormProps = {
  value: CreateResourceRequestInput
  onChange: (next: CreateResourceRequestInput) => void
  idPrefix?: string
}

export function AssetRequestSectionChiefApprovalForm({
  value,
  onChange,
  idPrefix = 'asset-request-section-chief',
}: AssetRequestSectionChiefApprovalFormProps) {
  const patch = (patchValue: Partial<CreateResourceRequestInput>) => {
    onChange({ ...value, ...patchValue })
  }

  return (
    <Ics213rrNumberedBox title="7. Section Chief / Command Staff Approval">
      <div className="grid gap-3 sm:grid-cols-2">
        <Ics213rrFieldRow label="Name" htmlFor={`${idPrefix}-name`}>
          <Input
            id={`${idPrefix}-name`}
            value={value.sectionChiefApprovalName}
            onChange={(event) => patch({ sectionChiefApprovalName: event.target.value })}
            className="h-9 text-xs"
          />
        </Ics213rrFieldRow>
        <Ics213rrFieldRow label="Position" htmlFor={`${idPrefix}-position`}>
          <Input
            id={`${idPrefix}-position`}
            value={value.sectionChiefApprovalPosition}
            onChange={(event) => patch({ sectionChiefApprovalPosition: event.target.value })}
            className="h-9 text-xs"
          />
        </Ics213rrFieldRow>
        <Ics213rrFieldRow label="Signature" htmlFor={`${idPrefix}-signature`}>
          <Input
            id={`${idPrefix}-signature`}
            value={value.sectionChiefApprovalSignature}
            onChange={(event) => patch({ sectionChiefApprovalSignature: event.target.value })}
            className="h-9 text-xs"
          />
        </Ics213rrFieldRow>
        <Ics213rrFieldRow label="Date/time" htmlFor={`${idPrefix}-datetime`}>
          <Input
            id={`${idPrefix}-datetime`}
            value={value.sectionChiefApprovalDateTime}
            onChange={(event) => patch({ sectionChiefApprovalDateTime: event.target.value })}
            className="h-9 text-xs"
          />
        </Ics213rrFieldRow>
      </div>
    </Ics213rrNumberedBox>
  )
}
