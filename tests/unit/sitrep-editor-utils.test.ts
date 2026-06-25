import { describe, expect, it } from 'vitest'
import { createInitialSitrepForm } from '@/features/sitrep/constants'
import {
  filterSitrepVersionsForMode,
  getLatestSitrepVersion,
  getLatestUnsignedSitrepVersion,
  isSitrepVersionSigned,
  isSitrepVersionSubmitted,
  resolveSitrepEditorState,
} from '@/features/sitrep/editor-utils'
import { createLocalSitrepVersion } from '@/features/sitrep/utils'

const baseForm = createInitialSitrepForm()

function makeVersion(overrides?: Partial<ReturnType<typeof createLocalSitrepVersion>>) {
  return createLocalSitrepVersion(baseForm, 'Alice', '#16a34a', {
    authorRole: 'Technical Specialist',
    ...overrides,
  })
}

describe('sitrep editor utils', () => {
  it('resolves latest and unsigned versions', () => {
    const signed = makeVersion({ signatures: [{ name: 'Alice', role: 'TS', signedAt: 1 }] })
    const draft = makeVersion()
    const versions = [signed, draft]

    expect(getLatestSitrepVersion(versions)?.id).toBe(draft.id)
    expect(getLatestUnsignedSitrepVersion(versions)?.id).toBe(draft.id)
    expect(isSitrepVersionSigned(signed)).toBe(true)
    expect(isSitrepVersionSigned(draft)).toBe(false)
  })

  it('locks form when viewing historical version', () => {
    const draft = makeVersion()
    const state = resolveSitrepEditorState({
      versions: [draft],
      viewingSitrepVersion: draft,
      isCreatingSignedSitrepVersion: false,
      sitrepReviewTargetId: null,
    })

    expect(state.isFormLocked).toBe(true)
    expect(state.canEditSections).toBe(false)
  })

  it('allows editing latest unsigned draft on current tab', () => {
    const draft = makeVersion()
    const state = resolveSitrepEditorState({
      versions: [draft],
      viewingSitrepVersion: null,
      isCreatingSignedSitrepVersion: false,
      sitrepReviewTargetId: null,
    })

    expect(state.isFormLocked).toBe(false)
    expect(state.canEditSections).toBe(true)
    expect(state.canShowSectionAiControls).toBe(true)
  })

  it('locks form when latest is signed unless creating signed version or reviewing', () => {
    const signed = makeVersion({ signatures: [{ name: 'Alice', role: 'TS', signedAt: 1 }] })
    const locked = resolveSitrepEditorState({
      versions: [signed],
      viewingSitrepVersion: null,
      isCreatingSignedSitrepVersion: false,
      sitrepReviewTargetId: null,
    })
    const signing = resolveSitrepEditorState({
      versions: [signed],
      viewingSitrepVersion: null,
      isCreatingSignedSitrepVersion: true,
      sitrepReviewTargetId: null,
    })

    expect(locked.isFormLocked).toBe(true)
    expect(signing.isFormLocked).toBe(false)
    expect(signing.canEditSections).toBe(true)
  })

  it('filters versions by view mode', () => {
    const signed = makeVersion({ signatures: [{ name: 'Alice', role: 'TS', signedAt: 1 }] })
    const draft = makeVersion()
    const submitted = makeVersion({
      submittedForReviewTo: [{ name: 'SUL', role: 'Situation Unit Leader' }],
      submittedForReviewAt: Date.now(),
    })
    const versions = [signed, draft, submitted]

    expect(filterSitrepVersionsForMode(versions, 'historical')).toHaveLength(3)
    expect(filterSitrepVersionsForMode(versions, 'drafts')).toHaveLength(2)
    expect(filterSitrepVersionsForMode(versions, 'review-queue')).toHaveLength(1)
    expect(isSitrepVersionSubmitted(submitted)).toBe(true)
  })
})
