import type { HubAorNode } from '@/features/hub/aor/hub-aor-types'
import { districtNodeId } from '@/features/hub/aor/hub-aor-districts'

function node(
  id: string,
  kind: HubAorNode['kind'],
  name: string,
  districtId: number,
  areaKey: HubAorNode['areaKey'],
  parentId: string,
  extras?: Partial<Pick<HubAorNode, 'lead' | 'location' | 'notes'>>
): HubAorNode {
  return {
    id,
    kind,
    name,
    districtId,
    areaKey,
    parentId,
    ...extras,
  }
}

export const HUB_AOR_HIERARCHY_NODES: HubAorNode[] = [
  // District 1 — Northeast
  node('sector-se-new-england', 'sector', 'Sector SE New England', 1, 'atlantic', districtNodeId(1), {
    lead: 'Commander — Boston, MA',
    location: [-70.9, 42.36],
  }),
  node('sector-boston', 'sector', 'Sector Boston', 1, 'atlantic', districtNodeId(1), {
    lead: 'Commander — Boston, MA',
    location: [-71.05, 42.35],
  }),
  node('airsta-cape-cod', 'air_station', 'Air Station Cape Cod', 1, 'atlantic', districtNodeId(1), {
    lead: 'Commanding Officer — Cape Cod, MA',
    location: [-70.52, 41.65],
  }),
  node('station-provincetown', 'sub_unit', 'Station Provincetown', 1, 'atlantic', 'sector-se-new-england', {
    location: [-70.19, 42.05],
  }),
  node('station-boston', 'sub_unit', 'Station Boston', 1, 'atlantic', 'sector-boston', {
    location: [-71.03, 42.36],
  }),
  node('det-cape-cod', 'sub_unit', 'Detachment Cape Cod', 1, 'atlantic', 'airsta-cape-cod', {
    location: [-70.52, 41.65],
  }),

  // District 1 — New York
  node('sector-ny', 'sector', 'Sector New York', 2, 'atlantic', districtNodeId(2), {
    lead: 'Commander — Staten Island, NY',
    location: [-74.07, 40.64],
  }),
  node('station-jones-beach', 'sub_unit', 'Station Jones Beach', 2, 'atlantic', 'sector-ny', {
    location: [-73.5, 40.59],
  }),

  // District 5 — Mid-Atlantic
  node('sector-virginia', 'sector', 'Sector Virginia', 3, 'atlantic', districtNodeId(3), {
    lead: 'Commander — Portsmouth, VA',
    location: [-76.3, 36.84],
  }),
  node('sector-delaware-bay', 'sector', 'Sector Delaware Bay', 3, 'atlantic', districtNodeId(3), {
    lead: 'Commander — Philadelphia, PA',
    location: [-75.14, 39.93],
  }),
  node('airsta-elizabeth-city', 'air_station', 'Air Station Elizabeth City', 3, 'atlantic', districtNodeId(3), {
    lead: 'Commanding Officer — Elizabeth City, NC',
    location: [-76.17, 36.26],
  }),
  node('station-portsmouth', 'sub_unit', 'Station Portsmouth', 3, 'atlantic', 'sector-virginia', {
    location: [-76.3, 36.84],
  }),
  node('station-wachapreague', 'sub_unit', 'Station Wachapreague', 3, 'atlantic', 'sector-virginia', {
    location: [-75.69, 37.61],
  }),

  // District 7 — Southeast
  node('sector-miami', 'sector', 'Sector Miami', 4, 'atlantic', districtNodeId(4), {
    lead: 'Commander — Miami Beach, FL',
    location: [-80.13, 25.79],
  }),
  node('sector-mobile', 'sector', 'Sector Mobile', 4, 'atlantic', districtNodeId(4), {
    lead: 'Commander — Mobile, AL',
    location: [-88.04, 30.69],
  }),
  node('sector-new-orleans-d7', 'sector', 'Sector New Orleans', 4, 'atlantic', districtNodeId(4), {
    lead: 'Commander — New Orleans, LA',
    location: [-90.07, 29.95],
  }),
  node('airsta-clearwater', 'air_station', 'Air Station Clearwater', 4, 'atlantic', districtNodeId(4), {
    lead: 'Commanding Officer — Clearwater, FL',
    location: [-82.69, 27.91],
  }),
  node('station-fort-lauderdale', 'sub_unit', 'Station Fort Lauderdale', 4, 'atlantic', 'sector-miami', {
    location: [-80.11, 26.12],
  }),
  node('station-panama-city', 'sub_unit', 'Station Panama City', 4, 'atlantic', 'sector-mobile', {
    location: [-85.73, 30.16],
  }),

  // District 9 — Great Lakes
  node('sector-detroit', 'sector', 'Sector Detroit', 5, 'atlantic', districtNodeId(5), {
    lead: 'Commander — Detroit, MI',
    location: [-83.05, 42.33],
  }),
  node('sector-lake-michigan', 'sector', 'Sector Lake Michigan', 5, 'atlantic', districtNodeId(5), {
    lead: 'Commander — Milwaukee, WI',
    location: [-87.91, 43.04],
  }),

  // District 8 — Gulf
  node('sector-houston-galveston', 'sector', 'Sector Houston-Galveston', 6, 'atlantic', districtNodeId(6), {
    lead: 'Commander — Houston, TX',
    location: [-95.27, 29.73],
  }),
  node('sector-new-orleans-d8', 'sector', 'Sector New Orleans', 6, 'atlantic', districtNodeId(6), {
    lead: 'Commander — New Orleans, LA',
    location: [-90.07, 29.95],
  }),
  node('airsta-new-orleans', 'air_station', 'Air Station New Orleans', 6, 'atlantic', districtNodeId(6), {
    lead: 'Commanding Officer — Belle Chasse, LA',
    location: [-89.93, 29.83],
  }),
  node('station-galveston', 'sub_unit', 'Station Galveston', 6, 'atlantic', 'sector-houston-galveston', {
    location: [-94.79, 29.31],
  }),

  // District 8 — Inland
  node('sector-ohio-valley', 'sector', 'Sector Ohio Valley', 7, 'atlantic', districtNodeId(7), {
    lead: 'Commander — Louisville, KY',
    location: [-85.76, 38.25],
  }),

  // District 11 — Southwest
  node('sector-upper-mississippi', 'sector', 'Sector Upper Mississippi River', 8, 'pacific', districtNodeId(8), {
    lead: 'Commander — St. Louis, MO',
    location: [-90.2, 38.63],
  }),

  // District 11 — Pacific
  node('sector-san-francisco', 'sector', 'Sector San Francisco', 9, 'pacific', districtNodeId(9), {
    lead: 'Commander — Alameda, CA',
    location: [-122.3, 37.77],
  }),
  node('sector-honolulu', 'sector', 'Sector Honolulu', 9, 'pacific', districtNodeId(9), {
    lead: 'Commander — Honolulu, HI',
    location: [-157.87, 21.31],
  }),
  node('airsta-kodiak', 'air_station', 'Air Station Kodiak', 9, 'pacific', districtNodeId(9), {
    lead: 'Commanding Officer — Kodiak, AK',
    location: [-152.49, 57.75],
  }),
  node('airsta-barbers-point', 'air_station', 'Air Station Barbers Point', 9, 'pacific', districtNodeId(9), {
    lead: 'Commanding Officer — Kapolei, HI',
    location: [-158.07, 21.32],
  }),
  node('station-honolulu', 'sub_unit', 'Station Honolulu', 9, 'pacific', 'sector-honolulu', {
    location: [-157.87, 21.31],
  }),
  node('station-golden-gate', 'sub_unit', 'Station Golden Gate', 9, 'pacific', 'sector-san-francisco', {
    location: [-122.48, 37.82],
  }),

  // District 13 — Pacific Northwest
  node('sector-puget-sound', 'sector', 'Sector Puget Sound', 10, 'pacific', districtNodeId(10), {
    lead: 'Commander — Seattle, WA',
    location: [-122.33, 47.6],
  }),
  node('airsta-port-angeles', 'air_station', 'Air Station Port Angeles', 10, 'pacific', districtNodeId(10), {
    lead: 'Commanding Officer — Port Angeles, WA',
    location: [-123.43, 48.14],
  }),
  node('station-seattle', 'sub_unit', 'Station Seattle', 10, 'pacific', 'sector-puget-sound', {
    location: [-122.38, 47.6],
  }),
]
