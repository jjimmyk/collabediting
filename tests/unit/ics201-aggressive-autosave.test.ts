import { describe, expect, it, vi } from 'vitest'
import { Ics201AutosaveScheduler, ICS201_TIER1_IDLE_MS } from '@/lib/ics201-autosave-scheduler'
import { createInitialIcs201Form } from '@/features/ics201/constants'
import { hashIcs201FormStateSync } from '@/lib/ics201-content-hash'
import { pruneStaleIcs201Cursors, ICS201_CURSOR_STALE_MS } from '@/lib/ics201-cursor-sync'
import type { Ics201CursorState } from '@/lib/ics201-cursor-sync'

describe('Ics201AutosaveScheduler', () => {
  it('runs tier1 after idle debounce', async () => {
    vi.useFakeTimers()
    const onTier1 = vi.fn()
    const scheduler = new Ics201AutosaveScheduler({
      idleMs: 100,
      maxWaitMs: 500,
      checkpointPauseMs: 10_000,
      onTier1,
      onTier2Checkpoint: vi.fn(),
    })

    scheduler.markDirty()
    vi.advanceTimersByTime(99)
    expect(onTier1).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    await Promise.resolve()
    expect(onTier1).toHaveBeenCalledTimes(1)
    scheduler.destroy()
    vi.useRealTimers()
  })

  it('runs tier1 on max wait during continuous edits', async () => {
    vi.useFakeTimers()
    const onTier1 = vi.fn()
    const scheduler = new Ics201AutosaveScheduler({
      idleMs: ICS201_TIER1_IDLE_MS,
      maxWaitMs: 200,
      checkpointPauseMs: 10_000,
      onTier1,
      onTier2Checkpoint: vi.fn(),
    })

    scheduler.markDirty()
    vi.advanceTimersByTime(150)
    scheduler.markDirty()
    vi.advanceTimersByTime(150)
    await Promise.resolve()
    expect(onTier1).toHaveBeenCalled()
    scheduler.destroy()
    vi.useRealTimers()
  })
})

describe('hashIcs201FormStateSync', () => {
  it('returns stable hash for identical forms', () => {
    const form = createInitialIcs201Form()
    expect(hashIcs201FormStateSync(form)).toBe(hashIcs201FormStateSync(form))
  })

  it('returns different hash when form changes', () => {
    const left = createInitialIcs201Form()
    const right = { ...createInitialIcs201Form(), incidentName: 'Changed' }
    expect(hashIcs201FormStateSync(left)).not.toBe(hashIcs201FormStateSync(right))
  })
})

describe('pruneStaleIcs201Cursors', () => {
  it('removes cursors older than stale threshold', () => {
    const now = Date.now()
    const cursors = new Map<string, Ics201CursorState>([
      [
        'fresh',
        {
          userId: 'fresh',
          userColor: '#000',
          userInitials: 'FR',
          sectionId: 'current-situation',
          fieldKey: 'content',
          anchor: 0,
          head: 0,
          updatedAt: now,
        },
      ],
      [
        'stale',
        {
          userId: 'stale',
          userColor: '#000',
          userInitials: 'ST',
          sectionId: 'current-situation',
          fieldKey: 'content',
          anchor: 0,
          head: 0,
          updatedAt: now - ICS201_CURSOR_STALE_MS - 1,
        },
      ],
    ])

    const pruned = pruneStaleIcs201Cursors(cursors, now)
    expect(pruned.has('fresh')).toBe(true)
    expect(pruned.has('stale')).toBe(false)
  })
})
