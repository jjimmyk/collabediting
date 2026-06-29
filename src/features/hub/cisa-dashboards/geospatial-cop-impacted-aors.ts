export type GeospatialCopImpactedAorRecord = {
  id: string
  copMapKey: string
  name: string
  region: string
  riskScore: number
  mapLocation: [number, number]
  summary: string
  terminalOperators: string[]
  cargoTypes: string[]
  interdependencies: string[]
}

/** Houston Ship Channel near Barbours Cut / Bayport. */
export function isOnWaterNearPortHouston(longitude: number, latitude: number): boolean {
  if (longitude < -95.055 || longitude > -94.975) {
    return false
  }

  if (latitude < 29.565 || latitude > 29.635) {
    return false
  }

  if (longitude < -95.035 && latitude > 29.605) {
    return false
  }

  return true
}

/** Sabine-Neches ship channel near Port Beaumont terminals. */
export function isOnWaterNearPortBeaumont(longitude: number, latitude: number): boolean {
  if (longitude < -94.082 || longitude > -94.038) {
    return false
  }

  if (latitude < 30.048 || latitude > 30.092) {
    return false
  }

  if (longitude < -94.068 && latitude > 30.078) {
    return false
  }

  return true
}

/** Galveston Bay ship channel off Port Texas City. */
export function isOnWaterNearPortTexasCity(longitude: number, latitude: number): boolean {
  if (longitude < -94.918 || longitude > -94.858) {
    return false
  }

  if (latitude < 29.338 || latitude > 29.382) {
    return false
  }

  if (longitude > -94.892 && latitude > 29.372) {
    return false
  }

  return true
}

export function isImpactedAorOnWater(aorId: string, longitude: number, latitude: number): boolean {
  if (aorId === 'port-houston') {
    return isOnWaterNearPortHouston(longitude, latitude)
  }

  if (aorId === 'port-beaumont') {
    return isOnWaterNearPortBeaumont(longitude, latitude)
  }

  if (aorId === 'port-texas-city') {
    return isOnWaterNearPortTexasCity(longitude, latitude)
  }

  return false
}

export const GEOSPATIAL_COP_IMPACTED_AORS: GeospatialCopImpactedAorRecord[] = [
  {
    id: 'port-houston',
    copMapKey: 'geospatial-cop-aor-port-houston',
    name: 'Port of Houston',
    region: 'Houston Ship Channel · Harris County TX',
    riskScore: 99,
    mapLocation: [-95.018, 29.608],
    summary:
      'Primary outage node; regional power disruption and terminal automation loss across Barbours Cut, Bayport, and Turning Basin berths.',
    terminalOperators: [
      'Port Houston',
      'Barbours Cut Container Terminal',
      'Bayport Terminal Partners',
      'Enterprise Products (Bayport)',
    ],
    cargoTypes: [
      'Container',
      'Petrochemical',
      'LPG / NGL',
      'Bulk grain',
    ],
    interdependencies: [
      'CenterPoint Energy 138 kV transmission feed',
      'Barbours Cut substation T-14',
      'MPLX Ship Channel pipeline manifold',
      'USCG VTS Houston one-way traffic control',
    ],
  },
  {
    id: 'port-beaumont',
    copMapKey: 'geospatial-cop-aor-port-beaumont',
    name: 'Port Beaumont',
    region: 'Sabine-Neches Waterway · Jefferson County TX',
    riskScore: 82,
    mapLocation: [-94.052, 30.07],
    summary:
      'Elevated cascading risk from Houston Ship Channel power disruption; refinery feedstock delays and Sabine tug availability constraints under review.',
    terminalOperators: [
      'Port of Beaumont Navigation District',
      'Jefferson Energy Companies',
      'Sunoco Logistics',
    ],
    cargoTypes: [
      'Crude oil',
      'Military cargo',
      'Project breakbulk',
      'LPG',
    ],
    interdependencies: [
      'Sabine Pass LNG export queue',
      'Motiva Port Arthur refinery feedstock',
      'Jefferson County OEM grid liaison',
    ],
  },
  {
    id: 'port-texas-city',
    copMapKey: 'geospatial-cop-aor-port-texas-city',
    name: 'Port Texas City',
    region: 'Galveston Bay · Texas City TX',
    riskScore: 74,
    mapLocation: [-94.872, 29.351],
    summary:
      'Chemical berth scheduling impacted by upstream terminal automation loss; mutual aid staging with Port Houston unified command.',
    terminalOperators: [
      'Port of Texas City',
      'Valero Texas City Refinery',
      'Marathon Galveston Bay Refinery',
      'NuStar Energy',
    ],
    cargoTypes: [
      'Chemical intermediates',
      'Refined products',
      'Anhydrous ammonia',
      'Molten sulfur',
    ],
    interdependencies: [
      'Galveston-Texas City pilot dispatch',
      'Texas City dike vessel traffic sequencing',
      'Marathon tank farm SCADA uplink',
    ],
  },
]

for (const aor of GEOSPATIAL_COP_IMPACTED_AORS) {
  const [longitude, latitude] = aor.mapLocation
  if (!isImpactedAorOnWater(aor.id, longitude, latitude)) {
    throw new Error(`Impacted AOR ${aor.id} map location must be on water`)
  }
}
