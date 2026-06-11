import type { Ics201VersionSignature } from '@/features/ics201/types'

export type Ics206YesNo = '' | 'yes' | 'no'
export type Ics206LevelOfService = '' | 'ALS' | 'BLS'

export type Ics206MedicalAidStationRow = {
  id: number
  name: string
  location: string
  contactNumbersFrequency: string
  paramedicsOnSite: Ics206YesNo
}

export type Ics206TransportationRow = {
  id: number
  ambulanceService: string
  location: string
  contactNumbersFrequency: string
  levelOfService: Ics206LevelOfService
}

export type Ics206HospitalRow = {
  id: number
  hospitalName: string
  addressLatLong: string
  contactNumbersFrequency: string
  travelTimeAir: string
  travelTimeGround: string
  traumaCenterYes: Ics206YesNo
  traumaCenterLevel: string
  burnCenterYes: Ics206YesNo
  helipadYes: Ics206YesNo
}

export type Ics206FormState = {
  id: string
  incidentName: string
  operationalPeriodDateFrom: string
  operationalPeriodDateTo: string
  operationalPeriodTimeFrom: string
  operationalPeriodTimeTo: string
  medicalAidStations: Ics206MedicalAidStationRow[]
  transportation: Ics206TransportationRow[]
  hospitals: Ics206HospitalRow[]
  specialMedicalEmergencyProcedures: string
  aviationAssetsUtilized: boolean
  preparedByName: string
  preparedBySignature: string
  preparedByDateTime: string
  approvedByName: string
  approvedBySignature: string
  approvedByDateTime: string
}

export type Ics206Version = {
  id: string
  createdAt: number
  authorId?: string | null
  authorName: string
  authorColor: string
  snapshot: Ics206FormState
  signatures: Ics201VersionSignature[]
}

export type Ics206DocumentRow = {
  id: string
  workspace_id: string
  form_data: Ics206FormState
  latest_version_id: string | null
  created_at: string
  updated_at: string
  updated_by: string | null
}

export type Ics206VersionRow = {
  id: string
  document_id: string
  created_at: string
  author_id: string | null
  author_name: string
  author_color: string
  snapshot: Ics206FormState
  signatures: Ics201VersionSignature[]
  section_id: string | null
}

export type Ics206DocumentBundle = {
  document: Ics206DocumentRow
  versions: Ics206Version[]
}

export type Ics206SectionId =
  | 'incident-info'
  | 'medical-aid-stations'
  | 'transportation'
  | 'hospitals'
  | 'special-medical-emergency-procedures'
  | 'prepared-by'
  | 'approved-by'

export type Ics206IncidentInfoDraft = Pick<
  Ics206FormState,
  | 'incidentName'
  | 'operationalPeriodDateFrom'
  | 'operationalPeriodDateTo'
  | 'operationalPeriodTimeFrom'
  | 'operationalPeriodTimeTo'
>

export type Ics206SpecialProceduresDraft = Pick<
  Ics206FormState,
  'specialMedicalEmergencyProcedures' | 'aviationAssetsUtilized'
>

export type Ics206PreparedByDraft = Pick<
  Ics206FormState,
  'preparedByName' | 'preparedBySignature' | 'preparedByDateTime'
>

export type Ics206ApprovedByDraft = Pick<
  Ics206FormState,
  'approvedByName' | 'approvedBySignature' | 'approvedByDateTime'
>

export type Ics206FormSectionDrafts = {
  'incident-info'?: Ics206IncidentInfoDraft
  'medical-aid-stations'?: Ics206MedicalAidStationRow[]
  transportation?: Ics206TransportationRow[]
  hospitals?: Ics206HospitalRow[]
  'special-medical-emergency-procedures'?: Ics206SpecialProceduresDraft
  'prepared-by'?: Ics206PreparedByDraft
  'approved-by'?: Ics206ApprovedByDraft
}
