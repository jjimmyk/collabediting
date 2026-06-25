import { useMemo } from 'react'
import { resolveSitrepEditorState } from '@/features/sitrep/editor-utils'
import type { SitrepVersion } from '@/features/sitrep/types'

type UseSitrepEditorStateOptions = {
  versions: SitrepVersion[]
  viewingSitrepVersion: SitrepVersion | null
  isCreatingSignedSitrepVersion: boolean
  sitrepReviewTargetId: string | null
}

export function useSitrepEditorState({
  versions,
  viewingSitrepVersion,
  isCreatingSignedSitrepVersion,
  sitrepReviewTargetId,
}: UseSitrepEditorStateOptions) {
  return useMemo(
    () =>
      resolveSitrepEditorState({
        versions,
        viewingSitrepVersion,
        isCreatingSignedSitrepVersion,
        sitrepReviewTargetId,
      }),
    [versions, viewingSitrepVersion, isCreatingSignedSitrepVersion, sitrepReviewTargetId]
  )
}
