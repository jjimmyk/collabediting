import { describe, expect, it } from 'vitest'
import { buildWorkspaceHaveLinkIndex } from '@/features/ics215/build-workspace-have-link-index'
import { formatHaveLinkLocation } from '@/features/ics215/ics215-have-asset-link'
import type { Ics215WorkAssignmentRow } from '@/features/ics215/types'

describe('buildWorkspaceHaveLinkIndex', () => {
  const resourceColumns = [{ id: 'engines', label: 'Engines' }]
  const workAssignmentTargetOptions = [
    { value: 'position:Operations', label: 'Operations', targetType: 'position' as const },
  ]

  it('maps linked roster refs to Have cell locations', () => {
    const workAssignments: Ics215WorkAssignmentRow[] = [
      {
        id: 1,
        assignee: 'position:Operations',
        workAssignment: 'Branch direct',
        resourceValues: {
          engines: {
            required: '2',
            have: '1',
            need: '1',
            linkedHaveRefs: ['member:u1::Operations'],
            haveSource: 'linked-roster',
          },
        },
      },
    ]

    const index = buildWorkspaceHaveLinkIndex({
      workAssignments,
      resourceColumns,
      workAssignmentTargetOptions,
    })

    const location = index.get('member:u1::Operations')
    expect(location).toBeDefined()
    expect(location?.columnLabel).toBe('Engines')
    expect(formatHaveLinkLocation(location!)).toContain('Engines Have')
  })

  it('excludes the active Have cell when requested', () => {
    const workAssignments: Ics215WorkAssignmentRow[] = [
      {
        id: 1,
        assignee: 'position:Operations',
        workAssignment: 'Branch direct',
        resourceValues: {
          engines: {
            required: '1',
            have: '1',
            need: '0',
            linkedHaveRefs: ['member:u1::Operations'],
            haveSource: 'linked-roster',
          },
        },
      },
    ]

    const index = buildWorkspaceHaveLinkIndex({
      workAssignments,
      resourceColumns,
      workAssignmentTargetOptions,
      exclude: { rowId: 1, columnId: 'engines' },
    })

    expect(index.has('member:u1::Operations')).toBe(false)
  })
})
