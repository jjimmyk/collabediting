import { describe, expect, it } from 'vitest'
import {
  buildActivationIcs201Prefill,
  formatInitialIncidentReportSummaryForIcs201,
  resolveActivationIcs201DraftForWorkspace,
  createDefaultActivationIcs201Draft,
} from '@/lib/activation-ics201-prefill'

const emptyReport = {
  shortDescription: '',
  facilityLocations: [] as string[],
  facilityLocationOther: '',
  whatHappened: '',
  icNotified: '' as const,
  icNotifiedName: '',
  rpName: '',
  materialReleased: '',
  enterWater: '' as const,
  releaseDischargeRate: '',
  sourceControlled: '' as const,
  scenarios: [] as string[],
}

describe('activation-ics201-prefill', () => {
  it('formats initial incident report fields into current situation summary', () => {
    const summary = formatInitialIncidentReportSummaryForIcs201({
      ...emptyReport,
      shortDescription: 'Release at berth 31',
      whatHappened: 'Hydrocarbon sheen observed',
      icNotified: 'yes',
      icNotifiedName: 'R. Morgan',
      materialReleased: 'Diesel',
    })

    expect(summary).toContain('Release at berth 31')
    expect(summary).toContain('Hydrocarbon sheen observed')
    expect(summary).toContain('IC notified: R. Morgan')
    expect(summary).toContain('Material released: Diesel')
  })

  it('prefills incident ICS-201 report identification and situation', () => {
    const form = buildActivationIcs201Prefill({
      kind: 'incident',
      name: 'Garyville Release',
      region: 'USCG District 8',
      lead: 'planner@example.com',
      geometrySummary: '30.123, -90.456',
      startTimeIso: '2026-06-15T14:30:00.000Z',
      initialReport: {
        ...emptyReport,
        shortDescription: 'Sheen reported near dock',
      },
    })

    expect(form.incidentName).toBe('Garyville Release')
    expect(form.incidentLocation).toBe('30.123, -90.456')
    expect(form.jurisdiction).toBe('USCG District 8')
    expect(form.preparedBy).toBe('planner@example.com')
    expect(form.currentSituationSummary).toBe('Sheen reported near dock')
    expect(form.objectives).toEqual([{ id: 1, kind: 'O', objective: '' }])
  })

  it('maps exercise objectives into ICS-201 objectives rows', () => {
    const form = buildActivationIcs201Prefill({
      kind: 'exercise',
      name: 'Tabletop Alpha',
      region: 'FEMA Region 4',
      lead: 'controller@example.com',
      initialReport: emptyReport,
      exerciseObjectives: [{ name: 'Validate ICP stand-up' }, { name: '' }, { name: 'Test mutual aid' }],
    })

    expect(form.objectives).toEqual([
      { id: 1, kind: 'O', objective: 'Validate ICP stand-up' },
      { id: 2, kind: 'O', objective: 'Test mutual aid' },
    ])
  })

  it('keeps touched activation drafts when resolving for workspace submit', () => {
    const draft = {
      ...createDefaultActivationIcs201Draft(),
      touched: true,
      form: {
        ...createDefaultActivationIcs201Draft().form,
        incidentName: 'Custom Draft Name',
      },
    }

    const resolved = resolveActivationIcs201DraftForWorkspace(draft, {
      kind: 'incident',
      name: 'Wizard Name',
      region: 'Region 1',
      lead: 'lead@example.com',
      initialReport: emptyReport,
    })

    expect(resolved.form.incidentName).toBe('Custom Draft Name')
  })
})
