import type {
  Ics201HazmatAssessmentBox15,
  Ics201HazmatClassificationId,
  Ics201HazmatPotentialHazardId,
  Ics201HazmatProcedureId,
  Ics201KnownHazardId,
  Ics201PpeId,
  Ics201SafetyAnalysisBox13,
  Ics201WeatherConditions,
} from './types'

export const ICS201_KNOWN_HAZARD_GROUPS: ReadonlyArray<{
  group: 'Physical Hazards' | 'Environmental Hazards' | 'Other Hazards'
  options: ReadonlyArray<{ id: Ics201KnownHazardId; label: string }>
}> = [
  {
    group: 'Physical Hazards',
    options: [
      { id: 'severeWeather', label: 'Severe Weather' },
      { id: 'onWaterResponse', label: 'On-Water Response' },
      { id: 'flooding', label: 'Flooding' },
      { id: 'heat', label: 'Heat' },
      { id: 'iceWinterConditions', label: 'Ice / Winter Conditions' },
      { id: 'debrisInWater', label: 'Debris in Water' },
    ],
  },
  {
    group: 'Environmental Hazards',
    options: [
      { id: 'oilPetroleum', label: 'Oil / Petroleum Products' },
      { id: 'flammableGas', label: 'Flammable Gas' },
      { id: 'radiological', label: 'Radiological' },
      { id: 'poisonToxins', label: 'Poison / Toxins' },
      { id: 'bloodBornePathogens', label: 'Blood-Borne Pathogens' },
      { id: 'biologicalDisease', label: 'Biological Disease' },
      { id: 'hazardousMaterials', label: 'Hazardous Materials' },
      { id: 'explosives', label: 'Explosives' },
      { id: 'humanRemains', label: 'Human Remains' },
      { id: 'nuclear', label: 'Nuclear' },
      { id: 'fire', label: 'Fire' },
    ],
  },
  {
    group: 'Other Hazards',
    options: [
      { id: 'terrorism', label: 'Terrorism' },
      { id: 'civilDisturbance', label: 'Civil Disturbance' },
      { id: 'traumaticIncidentStress', label: 'Traumatic Incident Stress' },
      { id: 'criminalViolence', label: 'Criminal Violence' },
      { id: 'wildlifeEncounters', label: 'Wildlife Encounters' },
    ],
  },
]

export const ICS201_PPE_OPTIONS: ReadonlyArray<{ id: Ics201PpeId; label: string }> = [
  { id: 'lifeJackets', label: 'Life Jackets' },
  { id: 'steelToedBoots', label: 'Steel-Toed Boots' },
  { id: 'hardHat', label: 'Hard Hat' },
  { id: 'eyeProtection', label: 'Eye Protection' },
  { id: 'gloves', label: 'Gloves' },
  { id: 'masks', label: 'Masks' },
  { id: 'hearingProtection', label: 'Hearing Protection' },
  { id: 'protectiveClothing', label: 'Protective Clothing' },
  { id: 'respirators', label: 'Respirators' },
  { id: 'faceShields', label: 'Face Shields' },
  { id: 'fallProtectionGear', label: 'Fall-Protection Gear' },
  { id: 'gasDetectors', label: 'Gas Detectors' },
]

export const ICS201_HAZMAT_CLASSIFICATION_OPTIONS: ReadonlyArray<{
  id: Ics201HazmatClassificationId
  label: string
}> = [
  { id: 'oilPetroleumProducts', label: 'Oil / Petroleum Products' },
  { id: 'flammableLiquid', label: 'Flammable Liquid' },
  { id: 'explosives', label: 'Explosives' },
  { id: 'gases', label: 'Gases' },
  { id: 'flammableSolid', label: 'Flammable Solid' },
  { id: 'flammableGas', label: 'Flammable Gas' },
  { id: 'oxidizer', label: 'Oxidizer' },
  { id: 'poisonToxic', label: 'Poison (Toxic)' },
  { id: 'poisonInhalationHazard', label: 'Poison Inhalation Hazard' },
  { id: 'radioactive', label: 'Radioactive' },
  { id: 'corrosive', label: 'Corrosive' },
  { id: 'dangerousWhenWet', label: 'Dangerous When Wet' },
  { id: 'otherMiscellaneous', label: 'Other / Miscellaneous' },
]

export const ICS201_HAZMAT_POTENTIAL_HAZARD_OPTIONS: ReadonlyArray<{
  id: Ics201HazmatPotentialHazardId
  label: string
}> = [
  {
    id: 'noKnownHazards',
    label:
      'The atmosphere contains no known hazards and work conditions preclude splashes, immersion, or potential for unexpected inhalation contact with hazardous levels of any chemicals or pollutants.',
  },
  {
    id: 'airPurifyingCriteriaMet',
    label:
      'Concentrations or types of airborne substances are known and the criteria for using air purifying respirators are met.',
  },
  {
    id: 'scbaRequired',
    label:
      'Highest level of respiratory protection is needed, but lesser level of skin protection is needed. (SCBA)',
  },
  {
    id: 'levelARequired',
    label: 'Greatest level of skin, respiratory, and eye protection is needed. (Level A)',
  },
]

export const ICS201_HAZMAT_PROCEDURE_OPTIONS: ReadonlyArray<{
  id: Ics201HazmatProcedureId
  label: string
}> = [
  { id: 'securityPerimeter', label: 'Security Perimeter' },
  { id: 'evacuationProcedures', label: 'Evacuation Procedures' },
  { id: 'medicalTriage', label: 'Medical Triage' },
  { id: 'safetyZone', label: 'Safety Zone' },
  { id: 'warningDangerSigns', label: 'Warning / Danger Signs' },
  { id: 'safetyBriefingsForResponders', label: 'Safety Briefings for Responders' },
]

export function createEmptyKnownHazards(): Record<Ics201KnownHazardId, boolean> {
  const entries = ICS201_KNOWN_HAZARD_GROUPS.flatMap((group) =>
    group.options.map((option) => [option.id, false] as const)
  )
  return Object.fromEntries(entries) as Record<Ics201KnownHazardId, boolean>
}

export function createEmptyRequiredPpe(): Record<Ics201PpeId, boolean> {
  return Object.fromEntries(ICS201_PPE_OPTIONS.map((option) => [option.id, false])) as Record<
    Ics201PpeId,
    boolean
  >
}

export function createEmptyHazmatClassification(): Record<Ics201HazmatClassificationId, boolean> {
  return Object.fromEntries(
    ICS201_HAZMAT_CLASSIFICATION_OPTIONS.map((option) => [option.id, false])
  ) as Record<Ics201HazmatClassificationId, boolean>
}

export function createEmptyHazmatPotentialHazards(): Record<
  Ics201HazmatPotentialHazardId,
  boolean
> {
  return Object.fromEntries(
    ICS201_HAZMAT_POTENTIAL_HAZARD_OPTIONS.map((option) => [option.id, false])
  ) as Record<Ics201HazmatPotentialHazardId, boolean>
}

export function createEmptyHazmatProcedures(): Record<Ics201HazmatProcedureId, boolean> {
  return Object.fromEntries(
    ICS201_HAZMAT_PROCEDURE_OPTIONS.map((option) => [option.id, false])
  ) as Record<Ics201HazmatProcedureId, boolean>
}

export function createEmptyWeatherConditions(): Ics201WeatherConditions {
  return {
    temp: '',
    conditions: '',
    wind: '',
    tides: '',
    seaState: '',
    waterTemp: '',
    forecast: '',
  }
}

export function createEmptySafetyAnalysisBox13(
  safetyOfficer = ''
): Ics201SafetyAnalysisBox13 {
  return {
    safetyOfficer,
    knownHazards: createEmptyKnownHazards(),
    weather: createEmptyWeatherConditions(),
    safetyNotes: '',
    requiredPpe: createEmptyRequiredPpe(),
    ppeNotes: '',
    involvesHazmat: null,
  }
}

export function createEmptyHazmatAssessmentBox15(): Ics201HazmatAssessmentBox15 {
  return {
    classification: createEmptyHazmatClassification(),
    products: [
      { id: 1, material: '', qty: '', physState: '', niosh: '', specificGravity: '', ph: '', idlh: '', flashPoint: '', lel: '', uel: '' },
      { id: 2, material: '', qty: '', physState: '', niosh: '', specificGravity: '', ph: '', idlh: '', flashPoint: '', lel: '', uel: '' },
      { id: 3, material: '', qty: '', physState: '', niosh: '', specificGravity: '', ph: '', idlh: '', flashPoint: '', lel: '', uel: '' },
    ],
    potentialHazards: createEmptyHazmatPotentialHazards(),
    requiredProcedures: createEmptyHazmatProcedures(),
    airMonitoringRequired: null,
    sopAndSafeWorkPractices: '',
    decontaminationProcedures: '',
    medicalMonitoringRequired: null,
    medicalTreatmentTransportInPlace: null,
    emergencyProcedures: '',
  }
}
