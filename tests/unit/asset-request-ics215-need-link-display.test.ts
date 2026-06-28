import { describe, expect, it } from 'vitest'
import {
  formatAssetRequestNeedLinkAssignee,
  formatAssetRequestNeedLinkResourceKind,
  formatAssetRequestNeedLinkSummary,
  hasAssetRequestNeedLink,
} from '@/lib/asset-request-ics215-need-link-display'
import type { ResourceRequestItem } from '@/lib/ics-213rr-resource-request'

const link = {
  workspaceId: 'ws-1',
  rowId: 1,
  columnId: 'helo',
  assigneeKey: 'position:Alpha',
  columnLabel: 'Helicopter · MH-65',
  workAssignment: 'Perimeter',
  reportingLocation: 'ICP',
}

describe('asset-request-ics215-need-link-display', () => {
  it('detects need link on request', () => {
    expect(hasAssetRequestNeedLink({ ics215NeedLink: link })).toBe(true)
    expect(hasAssetRequestNeedLink({} as ResourceRequestItem)).toBe(false)
  })

  it('formats assignee and resource kind', () => {
    expect(formatAssetRequestNeedLinkResourceKind(link)).toBe('Helicopter · MH-65')
    expect(formatAssetRequestNeedLinkAssignee(link, [])).toContain('Alpha')
  })

  it('builds summary line', () => {
    const summary = formatAssetRequestNeedLinkSummary({ ics215NeedLink: link }, [])
    expect(summary).toContain('ICS-215 Need')
    expect(summary).toContain('Helicopter · MH-65')
  })
})
