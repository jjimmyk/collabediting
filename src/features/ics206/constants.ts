import type { Ics206SectionId } from '@/features/ics206/types'

export const ICS206_SECTION_LABELS: Record<Ics206SectionId, string> = {
  'incident-info': 'Incident Information',
  'medical-aid-stations': 'Medical Aid Stations',
  transportation: 'Transportation',
  hospitals: 'Hospitals',
  'special-medical-emergency-procedures': 'Special Medical Emergency Procedures',
  'prepared-by': 'Prepared By (Medical Unit Leader)',
  'approved-by': 'Approved By (Safety Officer)',
}

export const ICS206_SECTION_PROMPTS: Record<Ics206SectionId, string> = {
  'incident-info':
    'Draft ICS-206 Incident Information including incident name and operational period date/time from/to for the current workspace.',
  'medical-aid-stations':
    'Draft ICS-206 Medical Aid Stations with name, location, contact number(s)/frequency, and whether paramedics are on site for each station.',
  transportation:
    'Draft ICS-206 Transportation entries with ambulance service, location, contact number(s)/frequency, and level of service (ALS or BLS) for each provider.',
  hospitals:
    'Draft ICS-206 Hospitals with hospital name, address/latitude/longitude, contact info, travel times (air and ground), trauma center level, burn center, and helipad availability.',
  'special-medical-emergency-procedures':
    'Draft ICS-206 Special Medical Emergency Procedures including reporting instructions and whether aviation assets are utilized for rescue.',
  'prepared-by':
    'Draft the Prepared By block with name, signature, and date/time for the Medical Unit Leader.',
  'approved-by':
    'Draft the Approved By block with name, signature, and date/time for the Safety Officer.',
}

export const ICS206_DEFAULT_MEDICAL_AID_STATION_COUNT = 6
export const ICS206_DEFAULT_TRANSPORTATION_COUNT = 4
export const ICS206_DEFAULT_HOSPITAL_COUNT = 6
