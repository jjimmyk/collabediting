import fieldMap from '@/features/ics215/export-template-resource-field-map.json'

export type Ics215TemplateRhnField = 'required' | 'have' | 'need'

type StringRecord = Record<string, string>

type ResourceFieldMap = Record<
  Ics215TemplateRhnField,
  Record<string, Record<string, string>>
>

type TotalsFieldMap = Record<Ics215TemplateRhnField, Record<string, string>>

const map = fieldMap as {
  formPageIndex: number
  assignmentRowsPerPage: number
  resourceColsPerPage: number
  headerFields: {
    incidentName: string
    incidentLocation: string
    datePrepared: string
    opFrom: string
    opTo: string
    preparedBy: string
    pageNumber: string
    pageTotal: string
  }
  assignmentFields: {
    assignee: string
    workAssignment: string
    overhead: string
    specialEquipment: string
    reportingLocation: string
    arrivalTime: string
  }
  korHeaders: StringRecord
  resourceFields: ResourceFieldMap
  totalsFields: TotalsFieldMap
}

export const ICS215_TEMPLATE_FIELD_MAP = map

export function ics215TemplateHeaderField(
  key: keyof typeof map.headerFields
): string {
  return map.headerFields[key]
}

export function ics215TemplateAssignmentField(
  key: keyof typeof map.assignmentFields,
  slot: number
): string {
  return `${map.assignmentFields[key]}${slot}`
}

export function ics215TemplateKorHeaderField(resourceColSlot: number): string {
  return map.korHeaders[String(resourceColSlot)] ?? `KoR Row ${resourceColSlot}`
}

export function ics215TemplateResourceField(
  rhn: Ics215TemplateRhnField,
  assignmentSlot: number,
  resourceColSlot: number
): string | undefined {
  return map.resourceFields[rhn]?.[String(assignmentSlot)]?.[String(resourceColSlot)]
}

export function ics215TemplateTotalsField(
  rhn: Ics215TemplateRhnField,
  resourceColSlot: number
): string | undefined {
  const name = map.totalsFields[rhn]?.[String(resourceColSlot)]
  return name && name.length > 0 ? name : undefined
}

export function listIcs215TemplateFormFieldNames(): string[] {
  const names = new Set<string>()
  Object.values(map.headerFields).forEach((name) => names.add(name))
  for (let slot = 1; slot <= map.assignmentRowsPerPage; slot += 1) {
    for (const prefix of Object.values(map.assignmentFields)) {
      names.add(`${prefix}${slot}`)
    }
  }
  for (let rc = 1; rc <= map.resourceColsPerPage; rc += 1) {
    names.add(ics215TemplateKorHeaderField(rc))
  }
  for (const rhn of ['required', 'have', 'need'] as const) {
    for (let ar = 1; ar <= map.assignmentRowsPerPage; ar += 1) {
      for (let rc = 1; rc <= map.resourceColsPerPage; rc += 1) {
        const name = ics215TemplateResourceField(rhn, ar, rc)
        if (name) names.add(name)
      }
    }
    for (let rc = 1; rc <= map.resourceColsPerPage; rc += 1) {
      const name = ics215TemplateTotalsField(rhn, rc)
      if (name) names.add(name)
    }
  }
  return [...names]
}
