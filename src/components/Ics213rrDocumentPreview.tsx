import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import {
  getIcs213rrPriorityLabel,
  type ResourceRequestItem,
} from '@/lib/ics-213rr-resource-request'

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-border/60 py-2 sm:grid-cols-[minmax(9rem,34%)_1fr] sm:gap-3">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="text-sm">{value.trim() || '—'}</span>
    </div>
  )
}

function PreviewSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="space-y-1">
      <h3 className="text-sm font-semibold text-[#1F4E79] dark:text-blue-300">{title}</h3>
      <div className="rounded-md border bg-muted/10 px-3">{children}</div>
    </section>
  )
}

function CheckboxLine({ checked, label }: { checked: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 py-1 text-sm">
      <span
        className={cn(
          'inline-flex h-4 w-4 items-center justify-center rounded border text-[10px] font-bold',
          checked && 'border-primary bg-primary text-primary-foreground'
        )}
        aria-hidden
      >
        {checked ? '✓' : ''}
      </span>
      <span>{label}</span>
    </div>
  )
}

export function Ics213rrDocumentPreview({ request }: { request: ResourceRequestItem }) {
  const orderPlacedBy = [
    request.orderPlacedBySpul ? 'SPUL' : null,
    request.orderPlacedByProc ? 'PROC' : null,
    request.orderPlacedByOther
      ? `Other${request.orderPlacedByOtherText ? `: ${request.orderPlacedByOtherText}` : ''}`
      : null,
  ]
    .filter(Boolean)
    .join(', ')

  return (
    <div className="space-y-4">
      <div className="border-b pb-3">
        <p className="text-lg font-bold uppercase tracking-wide">
          Resource Request (ICS 213RR-CG)
        </p>
        <p className="text-xs text-muted-foreground">
          Marathon · Department of Homeland Security · ICS 213RR-CG (07/25)
        </p>
      </div>

      <PreviewSection title="1. Incident Name">
        <PreviewField label="Incident Name" value={request.incidentName} />
      </PreviewSection>

      <PreviewSection title="2. Date/Time">
        <PreviewField label="Date/Time Initiated" value={request.dateTimeInitiated} />
      </PreviewSection>

      <PreviewSection title="3. Resource Request Number">
        <PreviewField label="Resource Request Number" value={request.requestNumber} />
      </PreviewSection>

      <PreviewSection title="4. Order">
        <PreviewField label="a. Quantity" value={String(request.orderQuantity)} />
        <PreviewField label="b. Kind" value={request.orderKind} />
        <PreviewField label="c. Type" value={request.orderType} />
        <PreviewField
          label="d. Priority"
          value={getIcs213rrPriorityLabel(request.orderPriority)}
        />
        <PreviewField label="e. Detailed Item Description" value={request.orderDetailedDescription} />
        <PreviewField
          label="f. Requested Reporting Location"
          value={request.orderRequestedReportingLocation}
        />
        <PreviewField label="Location Date/Time" value={request.orderLocationDateTime} />
        <PreviewField label="g. Order # (LSC)" value={request.orderNumberLsc} />
        <PreviewField label="h. ETA (LSC)" value={request.orderEtaLsc} />
        <PreviewField label="i. Cost (LSC)" value={request.orderCostLsc} />
      </PreviewSection>

      <PreviewSection title="5. Suggested Source(s) of Supply and Suitable Substitutes">
        <PreviewField label="Suggested Sources / Substitutes" value={request.suggestedSourcesAndSubstitutes} />
      </PreviewSection>

      <PreviewSection title="6. Requested By">
        <PreviewField label="Name" value={request.requestedByName} />
        <PreviewField label="Position" value={request.requestedByPosition} />
        <PreviewField label="Date/Time" value={request.requestedByDateTime} />
      </PreviewSection>

      <PreviewSection title="7. Section Chief / Command Staff Approval">
        <PreviewField label="Name" value={request.sectionChiefApprovalName} />
        <PreviewField label="Position" value={request.sectionChiefApprovalPosition} />
        <PreviewField label="Signature" value={request.sectionChiefApprovalSignature} />
        <PreviewField label="Date/Time" value={request.sectionChiefApprovalDateTime} />
      </PreviewSection>

      <PreviewSection title="8. RESL">
        <CheckboxLine checked={request.reslTacticalResources} label="a. Tactical resources or personnel" />
        <CheckboxLine checked={request.reslResourceAvailable} label="b. Resource available" />
        <CheckboxLine checked={request.reslResourceNotAvailable} label="c. Resource not available" />
      </PreviewSection>

      <PreviewSection title="9. RESL Review/Signature">
        <PreviewField label="Name" value={request.reslReviewName} />
        <PreviewField label="Signature" value={request.reslReviewSignature} />
        <PreviewField label="Date/Time" value={request.reslReviewDateTime} />
      </PreviewSection>

      <PreviewSection title="10. Requisition / Purchase Order #">
        <PreviewField label="Requisition / Purchase Order #" value={request.requisitionPurchaseOrderNumber} />
      </PreviewSection>

      <PreviewSection title="11. Supplier (Name/Phone/Fax/Email)">
        <PreviewField label="Supplier" value={request.supplierNamePhoneFaxEmail} />
      </PreviewSection>

      <PreviewSection title="12. Notes">
        <PreviewField label="Notes" value={request.notes} />
      </PreviewSection>

      <PreviewSection title="13. Logistics Section Approval">
        <PreviewField label="Name" value={request.logisticsApprovalName} />
        <PreviewField label="Position" value={request.logisticsApprovalPosition} />
        <PreviewField label="Signature" value={request.logisticsApprovalSignature} />
        <PreviewField label="Date/Time" value={request.logisticsApprovalDateTime} />
      </PreviewSection>

      <PreviewSection title="14. Order Placed By">
        <PreviewField label="Order Placed By" value={orderPlacedBy} />
        <PreviewField label="Signature" value={request.orderPlacedSignature} />
        <PreviewField label="Date/Time" value={request.orderPlacedDateTime} />
      </PreviewSection>

      <PreviewSection title="15. Reply / Comments from Finance">
        <PreviewField label="Finance Reply / Comments" value={request.financeReplyComments} />
      </PreviewSection>

      <PreviewSection title="16. Finance Section Approval">
        <PreviewField label="Name" value={request.financeApprovalName} />
        <PreviewField label="Position" value={request.financeApprovalPosition} />
        <PreviewField label="Signature" value={request.financeApprovalSignature} />
        <PreviewField label="Date/Time" value={request.financeApprovalDateTime} />
      </PreviewSection>
    </div>
  )
}
