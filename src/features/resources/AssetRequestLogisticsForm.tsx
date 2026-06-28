import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Ics213rrCheckboxRow,
  Ics213rrFieldRow,
  Ics213rrFormSection,
  Ics213rrNumberedBox,
} from '@/features/resources/ics-213rr-form-layout'
import type { CreateResourceRequestInput } from '@/lib/ics-213rr-resource-request'

type AssetRequestLogisticsFormProps = {
  value: CreateResourceRequestInput
  onChange: (next: CreateResourceRequestInput) => void
  idPrefix?: string
}

export function AssetRequestLogisticsForm({
  value,
  onChange,
  idPrefix = 'asset-request-logistics',
}: AssetRequestLogisticsFormProps) {
  const patch = (patchValue: Partial<CreateResourceRequestInput>) => {
    onChange({ ...value, ...patchValue })
  }

  return (
    <Ics213rrFormSection railLabel="Logistics">
      <div className="grid gap-3 lg:grid-cols-2">
        <Ics213rrNumberedBox title="10. Requisition/Purchase Order #">
          <Input
            id={`${idPrefix}-requisition`}
            value={value.requisitionPurchaseOrderNumber}
            onChange={(event) => patch({ requisitionPurchaseOrderNumber: event.target.value })}
            className="h-9 text-xs"
          />
        </Ics213rrNumberedBox>
        <Ics213rrNumberedBox title="11. Supplier (Name/Phone/Fax/Email)">
          <Input
            id={`${idPrefix}-supplier`}
            value={value.supplierNamePhoneFaxEmail}
            onChange={(event) => patch({ supplierNamePhoneFaxEmail: event.target.value })}
            className="h-9 text-xs"
          />
        </Ics213rrNumberedBox>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Ics213rrNumberedBox title="12. Notes">
          <Textarea
            id={`${idPrefix}-notes`}
            value={value.notes}
            onChange={(event) => patch({ notes: event.target.value })}
            className="min-h-28 text-xs"
          />
        </Ics213rrNumberedBox>
        <Ics213rrNumberedBox title="13. Logistics Section Approval">
          <div className="grid gap-3 sm:grid-cols-2">
            <Ics213rrFieldRow label="Name" htmlFor={`${idPrefix}-logistics-name`}>
              <Input
                id={`${idPrefix}-logistics-name`}
                value={value.logisticsApprovalName}
                onChange={(event) => patch({ logisticsApprovalName: event.target.value })}
                className="h-9 text-xs"
              />
            </Ics213rrFieldRow>
            <Ics213rrFieldRow label="Position" htmlFor={`${idPrefix}-logistics-position`}>
              <Input
                id={`${idPrefix}-logistics-position`}
                value={value.logisticsApprovalPosition}
                onChange={(event) => patch({ logisticsApprovalPosition: event.target.value })}
                className="h-9 text-xs"
              />
            </Ics213rrFieldRow>
            <Ics213rrFieldRow label="Signature" htmlFor={`${idPrefix}-logistics-signature`}>
              <Input
                id={`${idPrefix}-logistics-signature`}
                value={value.logisticsApprovalSignature}
                onChange={(event) => patch({ logisticsApprovalSignature: event.target.value })}
                className="h-9 text-xs"
              />
            </Ics213rrFieldRow>
            <Ics213rrFieldRow label="Date/time" htmlFor={`${idPrefix}-logistics-datetime`}>
              <Input
                id={`${idPrefix}-logistics-datetime`}
                value={value.logisticsApprovalDateTime}
                onChange={(event) => patch({ logisticsApprovalDateTime: event.target.value })}
                className="h-9 text-xs"
              />
            </Ics213rrFieldRow>
          </div>
        </Ics213rrNumberedBox>
      </div>

      <Ics213rrNumberedBox title="14. Order placed by">
        <div className="space-y-3">
          <div className="flex flex-wrap gap-4">
            <Ics213rrCheckboxRow
              id={`${idPrefix}-spul`}
              label="SPUL"
              checked={value.orderPlacedBySpul}
              onCheckedChange={(checked) => patch({ orderPlacedBySpul: checked })}
            />
            <Ics213rrCheckboxRow
              id={`${idPrefix}-proc`}
              label="PROC"
              checked={value.orderPlacedByProc}
              onCheckedChange={(checked) => patch({ orderPlacedByProc: checked })}
            />
            <Ics213rrCheckboxRow
              id={`${idPrefix}-other`}
              label="Other"
              checked={value.orderPlacedByOther}
              onCheckedChange={(checked) => patch({ orderPlacedByOther: checked })}
            />
          </div>
          {value.orderPlacedByOther ? (
            <Ics213rrFieldRow label="Other (specify)" htmlFor={`${idPrefix}-other-text`}>
              <Input
                id={`${idPrefix}-other-text`}
                value={value.orderPlacedByOtherText}
                onChange={(event) => patch({ orderPlacedByOtherText: event.target.value })}
                className="h-9 text-xs"
              />
            </Ics213rrFieldRow>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <Ics213rrFieldRow label="Signature" htmlFor={`${idPrefix}-order-signature`}>
              <Input
                id={`${idPrefix}-order-signature`}
                value={value.orderPlacedSignature}
                onChange={(event) => patch({ orderPlacedSignature: event.target.value })}
                className="h-9 text-xs"
              />
            </Ics213rrFieldRow>
            <Ics213rrFieldRow label="Date/time" htmlFor={`${idPrefix}-order-datetime`}>
              <Input
                id={`${idPrefix}-order-datetime`}
                value={value.orderPlacedDateTime}
                onChange={(event) => patch({ orderPlacedDateTime: event.target.value })}
                className="h-9 text-xs"
              />
            </Ics213rrFieldRow>
          </div>
        </div>
      </Ics213rrNumberedBox>
    </Ics213rrFormSection>
  )
}
