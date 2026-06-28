import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Ics213rrFieldRow,
  Ics213rrFormSection,
  Ics213rrNumberedBox,
} from '@/features/resources/ics-213rr-form-layout'
import type { CreateResourceRequestInput } from '@/lib/ics-213rr-resource-request'

type AssetRequestFinanceFormProps = {
  value: CreateResourceRequestInput
  onChange: (next: CreateResourceRequestInput) => void
  idPrefix?: string
}

export function AssetRequestFinanceForm({
  value,
  onChange,
  idPrefix = 'asset-request-finance',
}: AssetRequestFinanceFormProps) {
  const patch = (patchValue: Partial<CreateResourceRequestInput>) => {
    onChange({ ...value, ...patchValue })
  }

  return (
    <Ics213rrFormSection railLabel="Finance">
      <div className="grid gap-3 lg:grid-cols-2">
        <Ics213rrNumberedBox title="15. Reply / Comments from Finance">
          <Textarea
            id={`${idPrefix}-comments`}
            value={value.financeReplyComments}
            onChange={(event) => patch({ financeReplyComments: event.target.value })}
            className="min-h-32 text-xs"
          />
        </Ics213rrNumberedBox>
        <Ics213rrNumberedBox title="16. Finance Section Approval">
          <div className="grid gap-3 sm:grid-cols-2">
            <Ics213rrFieldRow label="Name" htmlFor={`${idPrefix}-finance-name`}>
              <Input
                id={`${idPrefix}-finance-name`}
                value={value.financeApprovalName}
                onChange={(event) => patch({ financeApprovalName: event.target.value })}
                className="h-9 text-xs"
              />
            </Ics213rrFieldRow>
            <Ics213rrFieldRow label="Position" htmlFor={`${idPrefix}-finance-position`}>
              <Input
                id={`${idPrefix}-finance-position`}
                value={value.financeApprovalPosition}
                onChange={(event) => patch({ financeApprovalPosition: event.target.value })}
                className="h-9 text-xs"
              />
            </Ics213rrFieldRow>
            <Ics213rrFieldRow label="Signature" htmlFor={`${idPrefix}-finance-signature`}>
              <Input
                id={`${idPrefix}-finance-signature`}
                value={value.financeApprovalSignature}
                onChange={(event) => patch({ financeApprovalSignature: event.target.value })}
                className="h-9 text-xs"
              />
            </Ics213rrFieldRow>
            <Ics213rrFieldRow label="Date/time" htmlFor={`${idPrefix}-finance-datetime`}>
              <Input
                id={`${idPrefix}-finance-datetime`}
                value={value.financeApprovalDateTime}
                onChange={(event) => patch({ financeApprovalDateTime: event.target.value })}
                className="h-9 text-xs"
              />
            </Ics213rrFieldRow>
          </div>
        </Ics213rrNumberedBox>
      </div>
    </Ics213rrFormSection>
  )
}
