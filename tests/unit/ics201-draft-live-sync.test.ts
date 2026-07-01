import { describe, expect, it } from 'vitest'
import { createInitialIcs201Form } from '@/features/ics201/constants'
import {
  applyIcs201DraftFieldPatch,
  fieldKeyToSectionId,
  isEditingIcs201Section,
} from '@/lib/ics201-draft-live-sync'

describe('ics201-draft-live-sync', () => {
  it('maps field keys to section ids', () => {
    expect(fieldKeyToSectionId('orgChart.incidentCommander')).toBe('org-chart')
    expect(fieldKeyToSectionId('actions:3.action')).toBe('actions')
    expect(fieldKeyToSectionId('mapSketch:0.lat')).toBe('map-sketch')
  })

  it('applies org chart field patches', () => {
    const form = createInitialIcs201Form()
    const next = applyIcs201DraftFieldPatch(form, {
      fieldKey: 'orgChart.incidentCommander',
      value: 'Jane Doe',
    })
    expect(next.orgChart.commandNames[0]).toBe('Jane Doe')
  })

  it('applies action row patches', () => {
    const form = createInitialIcs201Form()
    form.actions = [{ id: 2, time: '', action: '' }]
    const next = applyIcs201DraftFieldPatch(form, {
      fieldKey: 'actions:2.action',
      value: 'Evacuate zone A',
    })
    expect(next.actions[0]?.action).toBe('Evacuate zone A')
  })

  it('detects when a section is being edited locally', () => {
    expect(
      isEditingIcs201Section(
        {
          reportInfo: false,
          incidentBriefing: false,
          mapSketch: false,
          currentSituation: false,
          objectives: false,
          actions: true,
          orgChart: false,
          resources: false,
          safetyAnalysis: false,
          hazmatAssessment: false,
        },
        'actions'
      )
    ).toBe(true)
    expect(
      isEditingIcs201Section(
        {
          reportInfo: false,
          incidentBriefing: false,
          mapSketch: false,
          currentSituation: false,
          objectives: false,
          actions: true,
          orgChart: false,
          resources: false,
          safetyAnalysis: false,
          hazmatAssessment: false,
        },
        'org-chart'
      )
    ).toBe(false)
  })
})
