import type { IapAppendableForms } from '@/features/iap/export'
import type { IapChecklistFormId } from '@/features/iap/types'
import type { OperationalPeriodSnapshotBundle } from '@/lib/operational-period-types'
import {
  resolveHistoricalIcs202View,
  resolveHistoricalIcs203View,
  resolveHistoricalIcs204View,
  resolveHistoricalIcs205View,
  resolveHistoricalIcs206View,
  resolveHistoricalIcs208View,
} from '@/lib/operational-period-snapshot-view'

export type IapChecklistNavTab =
  | 'briefing'
  | 'form-ICS-202'
  | 'form-ICS-203'
  | 'form-ICS-204'
  | 'form-ICS-205'
  | 'form-ICS-206'
  | 'form-ICS-208'

export const IAP_CHECKLIST_FORM_TABS: Partial<Record<IapChecklistFormId, IapChecklistNavTab>> = {
  'ics-202': 'form-ICS-202',
  'ics-203': 'form-ICS-203',
  'ics-204': 'form-ICS-204',
  'ics-205': 'form-ICS-205',
  'ics-206': 'form-ICS-206',
  'ics-208': 'form-ICS-208',
}

export function isIapChecklistFormLinkable(formId: IapChecklistFormId): boolean {
  return formId in IAP_CHECKLIST_FORM_TABS
}

export function buildIapAppendableFormsFromSnapshotBundle(
  bundle: OperationalPeriodSnapshotBundle | null
): IapAppendableForms {
  if (!bundle) {
    return {}
  }

  return {
    ics202: resolveHistoricalIcs202View(bundle)?.form ?? null,
    ics203: resolveHistoricalIcs203View(bundle)?.form ?? null,
    ics204: resolveHistoricalIcs204View(bundle)?.forms ?? null,
    ics205: resolveHistoricalIcs205View(bundle)?.form ?? null,
    ics206: resolveHistoricalIcs206View(bundle)?.form ?? null,
    ics208: resolveHistoricalIcs208View(bundle)?.form ?? null,
  }
}
