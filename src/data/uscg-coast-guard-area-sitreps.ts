import type { UscgCoastGuardAreaKey } from '@/data/uscg-coast-guard-area-geometries'

export type UscgCoastGuardAreaSitrep = {
  reportingPeriod: string
  lastUpdate: string
  sitrep: string
  sitrepUpdatedBy: string
  sitrepSources: string[]
}

export const USCG_COAST_GUARD_AREA_SITREPS: Record<
  UscgCoastGuardAreaKey,
  UscgCoastGuardAreaSitrep
> = {
  atlantic: {
    reportingPeriod: '06/08/2026 06:00 – 18:00 UTC',
    lastUpdate: '06/08/2026 10:15 UTC',
    sitrep:
      'Hurricane Edgar continues to drive elevated posture across Atlantic Area districts. District 7 (Southeast) reports active evacuation operations with eight concurrent incidents and multi-state contraflow on I-75/I-95. District 8 Gulf maintains USCG-led spill coordination at United States Coast Guard Garyville and the MPLX Sabine River crossing while executing hurricane sortie plans for Texas City and Louisiana energy assets. CGC Forward (WMEC-911) is on Hampton Roads port security patrol; Gulfstream C-20B is staged at AIRSTA Elizabeth City for district liaison flights; RB-M VC4 remains on SAR standby at Station Portsmouth. District 5 has staged ESF-1 backfill assets in support of Region 4. Districts 1, 2, and 9 remain steady-state with no maritime transport disruptions reported.',
    sitrepUpdatedBy: 'Atlantic Area Command Center',
    sitrepSources: [
      'USCG Atlantic Area Common Operating Picture',
      'District 7 Southeast operations center SITREP',
      'District 8 Gulf unified command status board',
      'NHC Hurricane Edgar advisory cycle 18',
      'ALMIS cutter and aviation readiness feed',
      'Sector Virginia / Sector Houston-Galveston COTP logs',
    ],
  },
  pacific: {
    reportingPeriod: '06/08/2026 06:00 – 18:00 UTC',
    lastUpdate: '06/08/2026 09:40 UTC',
    sitrep:
      'Pacific Area maintains routine offshore patrol and hurricane contingency posture. USCGC Bertholf (WMSL-750) is conducting offshore patrol on the California outer continental shelf with counter-narcotics and living marine resources enforcement tasking. MH-60T Jayhawk at Air Station Kodiak is on long-range SAR alert for Pacific Northwest storm response; RB-S PS2 is conducting Honolulu harbor security and recreational boating safety patrol. District 11 Pacific is monitoring CAL FIRE Red Flag conditions with pre-staged coastal detour resources along SR-1. Districts 11 Southwest and 13 Pacific Northwest report steady-state operations with stable marine forecasts and no active ERP activations.',
    sitrepUpdatedBy: 'Pacific Area Command Center',
    sitrepSources: [
      'USCG Pacific Area Common Operating Picture',
      'District 11 Pacific operations center SITREP',
      'District 13 Pacific Northwest marine forecast feed',
      'CAL FIRE Incident Information system',
      'ALMIS cutter and aviation readiness feed',
      'Sector Honolulu / District 11 command center logs',
    ],
  },
}
