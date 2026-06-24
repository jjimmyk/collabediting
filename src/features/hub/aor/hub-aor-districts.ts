import type { HubAorCoastGuardArea, HubAorDistrict } from '@/features/hub/aor/hub-aor-types'

export const USCG_COAST_GUARD_AREAS: HubAorCoastGuardArea[] = [
  {
    key: 'atlantic',
    name: 'Atlantic Area',
    districtIds: [1, 2, 3, 4, 5, 6, 7],
    location: [-76.5, 36.8],
  },
  {
    key: 'pacific',
    name: 'Pacific Area',
    districtIds: [8, 9, 10],
    location: [-140.0, 42.0],
  },
]

const ATLANTIC = 'atlantic' as const
const PACIFIC = 'pacific' as const

export const HUB_AOR_DISTRICTS: HubAorDistrict[] = [
  {
    id: 1,
    areaKey: ATLANTIC,
    name: 'USCG District 1 — Northeast',
    lead: 'District Commander — Boston, MA',
    incidents: 0,
    priority: 'Low',
    population: '14.8M',
    lastUpdate: '2026-05-09 08:30 EST',
    evacuationStatus: 'None',
    notes: 'CT, ME, MA, NH, RI, VT — steady-state DOT operations.',
    sitrep:
      'Steady-state DOT operations across CT, ME, MA, NH, RI, VT. NWS marine forecasts stable; no active surface-transport disruptions reported.',
    sitrepUpdatedBy: 'District Commander Boston, MA',
    sitrepSources: [
      'NWS Marine Forecast (WFO Boston, Caribou, Gray)',
      'Mass511 / 511CT / 511NH traffic feeds',
      'USCG First District COTP log',
      'FAA OIS — BOS/BDL/PWM',
    ],
    location: [-71.5, 43.8],
  },
  {
    id: 2,
    areaKey: ATLANTIC,
    name: 'USCG District 1 — New York',
    lead: 'District Commander — New York, NY',
    incidents: 0,
    priority: 'Low',
    population: '31.5M',
    lastUpdate: '2026-05-09 08:32 EST',
    evacuationStatus: 'None',
    notes: 'NJ, NY, PR, USVI — monitoring downstream coastal impacts.',
    sitrep:
      'Monitoring downstream coastal swell from Atlantic system. Port of NY/NJ traffic normal; PR/USVI EOC reports no DOT impacts at this time.',
    sitrepUpdatedBy: 'District Commander New York, NY',
    sitrepSources: [
      'NHC Atlantic basin swell guidance',
      'PANYNJ TRANSCOM port traffic feed',
      'USCG Sector NY COTP log',
      'PR/USVI EOC WebEOC reports',
      '511NY traffic API',
    ],
    location: [-74.5, 41.8],
  },
  {
    id: 3,
    areaKey: ATLANTIC,
    name: 'USCG District 5 — Mid-Atlantic',
    lead: 'District Commander — Philadelphia, PA',
    incidents: 0,
    priority: 'Medium',
    population: '32.1M',
    lastUpdate: '2026-05-09 08:34 EST',
    evacuationStatus: 'None',
    notes: 'DE, DC, MD, PA, VA, WV — staging ESF-1 backfill assets for Region 4.',
    sitrep:
      'ESF-1 backfill assets staged at Richmond and Petersburg in support of Region 4. I-95 corridor flowing southbound; contraflow plans on standby pending FDOT request.',
    sitrepUpdatedBy: 'District Commander Philadelphia, PA',
    sitrepSources: [
      'FHWA ESF-1 staging tracker',
      'VDOT 511 / Maryland CHART probe data',
      'USCG District 5 — Mid-Atlantic operations center',
      'I-95 Corridor Coalition contraflow plan',
      'PennDOT 511 / DelDOT DelTrac',
    ],
    location: [-78.0, 39.2],
  },
  {
    id: 4,
    areaKey: ATLANTIC,
    name: 'USCG District 7 — Southeast',
    lead: 'District Commander — Atlanta, GA',
    incidents: 8,
    priority: 'High',
    population: '67.2M',
    lastUpdate: '2026-05-09 09:46 EST',
    evacuationStatus: 'Active',
    notes:
      'AL, FL, GA, KY, MS, NC, SC, TN — major hurricane response, multi-state contraflow active.',
    sitrep:
      'Multi-state contraflow active on I-75/I-95; FDOT TMC managing Wildwood gridlock. 8 active DOT incidents; FEMA airlift staging at MCO holding through current ground stop.',
    sitrepUpdatedBy: 'District Commander Atlanta, GA',
    sitrepSources: [
      'FDOT SunGuide TMC live traffic feed',
      'FAA NAS Status / OIS — MCO ground stop',
      'NHC advisories on Hurricane Edgar',
      'FL/GA/SC/AL State EOC ESF-1 reports',
      'FEMA WebEOC / IRRIS logistics tracker',
      'INRIX/HERE corridor probe data',
    ],
    location: [-84.5, 32.5],
  },
  {
    id: 5,
    areaKey: ATLANTIC,
    name: 'USCG District 9 — Great Lakes',
    lead: 'District Commander — Chicago, IL',
    incidents: 0,
    priority: 'Low',
    population: '52.6M',
    lastUpdate: '2026-05-09 08:28 EST',
    evacuationStatus: 'None',
    notes: 'IL, IN, MI, MN, OH, WI — steady-state DOT operations.',
    sitrep:
      'Steady-state DOT operations across IL, IN, MI, MN, OH, WI. Lake-effect bands forecast for upper MI; salt brine staged but no closures in effect.',
    sitrepUpdatedBy: 'District Commander Chicago, IL',
    sitrepSources: [
      'NWS WFO Marquette / Gaylord / Milwaukee',
      'MDOT / MnDOT / WisDOT 511 winter ops',
      'NOAA GLERL ice cover analysis',
      'IDOT Gateway / OHGO traffic feeds',
    ],
    location: [-87.5, 43.5],
  },
  {
    id: 6,
    areaKey: ATLANTIC,
    name: 'USCG District 8 — Gulf',
    lead: 'District Commander — Denton, TX',
    incidents: 3,
    priority: 'High',
    population: '41.0M',
    lastUpdate: '2026-05-09 10:30 CST',
    evacuationStatus: 'Recommended',
    notes:
      'AR, LA, NM, OK, TX — United States Coast Guard Garyville refinery fire, MPLX pipeline release, and Hurricane Edgar Gulf Coast asset protection active.',
    sitrep:
      'United States Coast Guard Garyville refinery fire in crude/vacuum unit; MPLX crude pipeline release at Sabine River crossing with USCG spill coordination; Hurricane Edgar driving controlled shutdowns at Texas City and Louisiana assets. PHMSA and LDEQ on-scene.',
    sitrepUpdatedBy: 'District Commander Denton, TX',
    sitrepSources: [
      'United States Coast Guard Garyville unified command status board',
      'MPLX pipeline control center incident log',
      'PHMSA NRC hazmat incident log',
      'NWS WFO Houston/Galveston — Hurricane Edgar advisory',
      'Louisiana DEQ spill and air monitoring feed',
      'USCG Sector Houston-Galveston marine safety broadcast',
    ],
    location: [-97.5, 32.5],
  },
  {
    id: 7,
    areaKey: ATLANTIC,
    name: 'USCG District 8 — Inland',
    lead: 'District Commander — Kansas City, MO',
    incidents: 0,
    priority: 'Low',
    population: '14.3M',
    lastUpdate: '2026-05-09 08:25 EST',
    evacuationStatus: 'None',
    notes: 'IA, KS, MO, NE — steady-state DOT operations.',
    sitrep:
      'Steady-state DOT operations across IA, KS, MO, NE. NWS severe weather outlook marginal; FRA monitoring elevated grain-train activity but no incidents reported.',
    sitrepUpdatedBy: 'District Commander Kansas City, MO',
    sitrepSources: [
      'NWS SPC Day-1 Convective Outlook',
      'FRA Office of Safety incident database',
      'Iowa DOT 511 / KCSCOUT traffic feeds',
      'KDOT KanDrive / NDOR 511',
    ],
    location: [-94.5, 40.5],
  },
  {
    id: 8,
    areaKey: PACIFIC,
    name: 'USCG District 11 — Southwest',
    lead: 'District Commander — Denver, CO',
    incidents: 0,
    priority: 'Low',
    population: '12.5M',
    lastUpdate: '2026-05-09 08:20 EST',
    evacuationStatus: 'None',
    notes: 'CO, MT, ND, SD, UT, WY — steady-state DOT operations.',
    sitrep:
      'Steady-state DOT operations across CO, MT, ND, SD, UT, WY. CDOT chain laws stood down; mountain pass forecasts clear through next 48 hours.',
    sitrepUpdatedBy: 'District Commander Denver, CO',
    sitrepSources: [
      'CDOT / WYDOT / MDT 511 mountain-pass APIs',
      'NWS WFO Boulder / Salt Lake / Riverton',
      'AASHTO Snow & Ice Pooled Fund reports',
      'UDOT CommuterLink probe data',
    ],
    location: [-107.0, 44.5],
  },
  {
    id: 9,
    areaKey: PACIFIC,
    name: 'USCG District 11 — Pacific',
    lead: 'District Commander — Oakland, CA',
    incidents: 0,
    priority: 'Medium',
    population: '50.5M',
    lastUpdate: '2026-05-09 08:18 EST',
    evacuationStatus: 'None',
    notes: 'AZ, CA, HI, NV, Pacific Territories — wildfire watch, otherwise steady-state.',
    sitrep:
      'CAL FIRE Red Flag Warning posted for inland CA; Caltrans staging detour resources along SR-1. Pacific territories nominal; HI DOT reports normal ops.',
    sitrepUpdatedBy: 'District Commander Oakland, CA',
    sitrepSources: [
      'CAL FIRE Incident Information feed',
      'NWS WFO Hanford / LA / San Diego Red Flag warnings',
      'Caltrans QuickMap traffic API',
      'HDOT GoAkamai feed',
      'ADOT az511 / NDOT NVRoads',
    ],
    location: [-118.5, 37.0],
  },
  {
    id: 10,
    areaKey: PACIFIC,
    name: 'USCG District 13 — Pacific Northwest',
    lead: 'District Commander — Bothell, WA',
    incidents: 0,
    priority: 'Low',
    population: '14.4M',
    lastUpdate: '2026-05-09 09:46 PST',
    evacuationStatus: 'None',
    notes: 'AK, ID, OR, WA — steady-state operations; United States Coast Guard Martinez refinery in routine monitoring posture.',
    sitrep:
      'Steady-state operations across AK, ID, OR, WA. United States Coast Guard Martinez refinery conducting planned maintenance with no active ERP activations. NWS marine forecasts stable; no DOT transport disruptions reported.',
    sitrepUpdatedBy: 'District Commander Bothell, WA',
    sitrepSources: [
      'NWS WFO Seattle / Portland marine forecast',
      'WSDOT traffic cameras — I-5 corridor',
      'United States Coast Guard Martinez refinery operations status',
      'USCG Sector Puget Sound marine safety broadcast',
    ],
    location: [-122.12, 38.02],
  },
]

export type FemaAorItem = HubAorDistrict

export function getHubAorDistrictById(id: number): HubAorDistrict | undefined {
  return HUB_AOR_DISTRICTS.find((district) => district.id === id)
}

export function districtNodeId(districtId: number): string {
  return `district-${districtId}`
}
