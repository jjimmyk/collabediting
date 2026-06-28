import { Input } from '@/components/ui/input'
import { Ics213rrFieldRow, Ics213rrNumberedBox } from '@/features/resources/ics-213rr-form-layout'
import type { CreateResourceRequestInput } from '@/lib/ics-213rr-resource-request'

type AssetRequestRequestedByFormProps = {
  value: CreateResourceRequestInput
  onChange: (next: CreateResourceRequestInput) => void
  idPrefix?: string
}

export function AssetRequestRequestedByForm({
  value,
  onChange,
  idPrefix = 'asset-request-requested-by',
}: AssetRequestRequestedByFormProps) {
  const patch = (patchValue: Partial<CreateResourceRequestInput>) => {
    onChange({ ...value, ...patchValue })
  }

  return (
    <Ics213rrNumberedBox title="6. Requested by">
      <div className="grid gap-3 sm:grid-cols-2">
        <Ics213rrFieldRow label="Name" htmlFor={`${idPrefix}-name`}>
          <Input
            id={`${idPrefix}-name`}
            value={value.requestedByName}
            onChange={(event) => patch({ requestedByName: event.target.value })}
            className="h-9 text-xs"
          />
        </Ics213rrFieldRow>
        <Ics213rrFieldRow label="Position" htmlFor={`${idPrefix}-position`}>
          <Input
            id={`${idPrefix}-position`}
            value={value.requestedByPosition}
            onChange={(event) => patch({ requestedByPosition: event.target.value })}
            className="h-9 text-xs"
          />
        </Ics213rrFieldRow>
      </div>
      <Ics213rrFieldRow label="Date/time" htmlFor={`${idPrefix}-datetime`}>
        <Input
          id={`${idPrefix}-datetime`}
          value={value.requestedByDateTime}
          onChange={(event) => patch({ requestedByDateTime: event.target.value })}
          className="h-9 text-xs"
        />
      </Ics213rrFieldRow>
    </Ics213rrNumberedBox>
  )
}
