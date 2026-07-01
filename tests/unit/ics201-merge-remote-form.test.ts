import { describe, expect, it } from 'vitest'
import { createInitialIcs201Form } from '@/features/ics201/constants'
import { mergeRemoteIcs201FormUpdate } from '@/features/ics201/merge-remote-form-update'
import { cloneIcs201FormState } from '@/features/ics201/utils'

const noEditingFlags = {
  reportInfo: false,
  incidentBriefing: false,
  mapSketch: false,
  currentSituation: false,
  objectives: false,
  actions: false,
  orgChart: false,
  resources: false,
  safetyAnalysis: false,
} as const

describe('mergeRemoteIcs201FormUpdate', () => {
  it('applies remote updates to sections the local user is not editing', () => {
    const local = createInitialIcs201Form()
    local.actions = [{ id: 1, task: 'Local', owner: '', startTime: '', endTime: '', status: '' }]
    const remote = cloneIcs201FormState(local)
    remote.actions = [{ id: 1, task: 'Remote', owner: 'B', startTime: '', endTime: '', status: '' }]

    const merged = mergeRemoteIcs201FormUpdate(local, remote, noEditingFlags)

    expect(merged.actions[0]?.task).toBe('Remote')
    expect(merged.actions[0]?.owner).toBe('B')
  })

  it('keeps local section data while editing that section', () => {
    const local = createInitialIcs201Form()
    local.actions = [{ id: 1, task: 'Local draft', owner: 'A', startTime: '', endTime: '', status: '' }]
    const remote = cloneIcs201FormState(local)
    remote.actions = [{ id: 1, task: 'Remote', owner: 'B', startTime: '', endTime: '', status: '' }]
    remote.orgChart.incidentCommander = 'Remote IC'

    const merged = mergeRemoteIcs201FormUpdate(local, remote, {
      ...noEditingFlags,
      actions: true,
    })

    expect(merged.actions[0]?.task).toBe('Local draft')
    expect(merged.orgChart.incidentCommander).toBe('Remote IC')
  })

  it('preserves live Yjs objectives when connected and not editing objectives', () => {
    const local = createInitialIcs201Form()
    local.objectives = [{ id: 1, kind: 'O', objective: 'Local' }]
    const remote = cloneIcs201FormState(local)
    remote.objectives = [{ id: 1, kind: 'O', objective: 'Remote' }]

    const merged = mergeRemoteIcs201FormUpdate(
      local,
      remote,
      noEditingFlags,
      {
        objectivesConnected: true,
        objectives: [{ id: 1, kind: 'O', objective: 'Live Yjs' }],
      }
    )

    expect(merged.objectives[0]?.objective).toBe('Live Yjs')
  })

  it('preserves fresher draft-live overlay over stale postgres for incidentLocation', () => {
    const local = createInitialIcs201Form()
    local.incidentLocation = 'A brand new incident'
    const remote = cloneIcs201FormState(local)
    remote.incidentLocation = 'Old location from postgres'

    const merged = mergeRemoteIcs201FormUpdate(local, remote, noEditingFlags, {
      draftLiveOverlay: {
        'reportInfo.incidentLocation': {
          value: 'A brand new incident',
          updatedAt: Date.now(),
        },
      },
    })

    expect(merged.incidentLocation).toBe('A brand new incident')
  })

  it('ignores expired draft-live overlay entries', () => {
    const local = createInitialIcs201Form()
    const remote = cloneIcs201FormState(local)
    remote.incidentLocation = 'Postgres value'

    const merged = mergeRemoteIcs201FormUpdate(local, remote, noEditingFlags, {
      draftLiveOverlay: {
        'reportInfo.incidentLocation': {
          value: 'Stale overlay',
          updatedAt: Date.now() - 10_000,
        },
      },
    })

    expect(merged.incidentLocation).toBe('Postgres value')
  })
})
