import { describe, expect, it } from 'vitest'
import { applyIcs201DraftFieldPatchToDrafts } from '@/features/ics201/draft-live-overlay'

describe('applyIcs201DraftFieldPatchToDrafts', () => {
  it('updates report info draft when editing report info', () => {
    let draft = { incidentName: 'A', incidentLocation: 'Old', dateInitiated: '', timeInitiated: '', preparedByName: '', preparedByPositionTitle: '', preparedBySignature: '', preparedDateTime: '' }
    applyIcs201DraftFieldPatchToDrafts(
      { fieldKey: 'reportInfo.incidentLocation', value: 'A brand new incident' },
      {
        reportInfo: true,
        incidentBriefing: false,
        mapSketch: false,
        currentSituation: false,
        objectives: false,
        actions: false,
        orgChart: false,
        resources: false,
        safetyAnalysis: false,
      },
      {
        setReportInfoDraft: (updater) => {
          draft = updater(draft)
        },
      }
    )
    expect(draft.incidentLocation).toBe('A brand new incident')
  })

  it('does not update report info draft when editing a different section', () => {
    let draft = { incidentName: 'A', incidentLocation: 'Old', dateInitiated: '', timeInitiated: '', preparedByName: '', preparedByPositionTitle: '', preparedBySignature: '', preparedDateTime: '' }
    applyIcs201DraftFieldPatchToDrafts(
      { fieldKey: 'reportInfo.incidentLocation', value: 'Remote value' },
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
      },
      {
        setReportInfoDraft: (updater) => {
          draft = updater(draft)
        },
      }
    )
    expect(draft.incidentLocation).toBe('Old')
  })
})
