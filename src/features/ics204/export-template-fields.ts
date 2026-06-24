import fieldMap from '@/features/ics204/export-template-field-map.json'

const map = fieldMap as {
  formPageIndex: number
  resourceRowsPerPage: number
  communicationRowsPerPage: number
  headerFields: Record<string, string>
  personnelFields: Record<string, { name: string; contact: string }>
  resourceRowFields: Record<string, string>
  resourceRow204ACheckboxNumbers: number[]
  largeTextFields: Record<string, string>
  communicationRowFields: Record<string, string>
  emergencyFields: Record<string, string>
  signatureFields: Record<string, string>
  largeTextRects: Record<
    string,
    { width: number; height: number; fontSize: number; lineHeight: number; padding: number }
  >
}

export const ICS204_TEMPLATE_FIELD_MAP = map

export function ics204TemplateHeaderField(key: keyof typeof map.headerFields): string {
  return map.headerFields[key]
}

export function ics204TemplatePersonnelField(
  role: keyof typeof map.personnelFields,
  part: 'name' | 'contact'
): string {
  return map.personnelFields[role][part]
}

export function ics204TemplateResourceRowField(
  key: keyof typeof map.resourceRowFields,
  slot: number
): string {
  if (key === 'has204A') {
    const checkboxNumber = map.resourceRow204ACheckboxNumbers[slot - 1]
    return checkboxNumber ? `Check Box${checkboxNumber}` : ''
  }
  return `${map.resourceRowFields[key]}${slot}`
}

export function ics204TemplateCommunicationRowField(
  key: keyof typeof map.communicationRowFields,
  slot: number
): string {
  return `${map.communicationRowFields[key]}${slot}`
}

export function ics204TemplateLargeTextField(key: keyof typeof map.largeTextFields): string {
  return map.largeTextFields[key]
}

export function ics204TemplateEmergencyField(key: keyof typeof map.emergencyFields): string {
  return map.emergencyFields[key]
}

export function ics204TemplateSignatureField(key: keyof typeof map.signatureFields): string {
  return map.signatureFields[key]
}

export function ics204TemplateLargeTextRect(key: keyof typeof map.largeTextRects) {
  return map.largeTextRects[key]
}

export function listIcs204TemplateFormFieldNames(): string[] {
  const names = new Set<string>()
  Object.values(map.headerFields).forEach((name) => names.add(name))
  Object.values(map.personnelFields).forEach((entry) => {
    names.add(entry.name)
    names.add(entry.contact)
  })
  for (let slot = 1; slot <= map.resourceRowsPerPage; slot += 1) {
    for (const key of Object.keys(map.resourceRowFields) as Array<keyof typeof map.resourceRowFields>) {
      const name = ics204TemplateResourceRowField(key, slot)
      if (name) names.add(name)
    }
  }
  Object.values(map.largeTextFields).forEach((name) => names.add(name))
  for (let slot = 1; slot <= map.communicationRowsPerPage; slot += 1) {
    for (const key of Object.keys(map.communicationRowFields) as Array<
      keyof typeof map.communicationRowFields
    >) {
      names.add(ics204TemplateCommunicationRowField(key, slot))
    }
  }
  Object.values(map.emergencyFields).forEach((name) => names.add(name))
  Object.values(map.signatureFields).forEach((name) => names.add(name))
  return [...names]
}
