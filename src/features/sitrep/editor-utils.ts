import type { SitrepVersion, SitrepViewMode } from './types'

export const isNonHumanSitrepAuthor = (name: string) =>
  name.trim().toLowerCase() === 'pratus ai'

export function getHumanSitrepAuthorName(
  version: { authorName: string; creatorName: string } | null | undefined
): string {
  if (version) {
    if (!isNonHumanSitrepAuthor(version.authorName)) {
      return version.authorName
    }
    if (!isNonHumanSitrepAuthor(version.creatorName)) {
      return version.creatorName
    }
  }
  return 'You'
}

export function formatSitrepLastEditor(
  version: { authorName: string; authorRole: string } | null | undefined
): string {
  if (!version) {
    return 'You'
  }
  if (version.authorName === 'You') {
    return 'You'
  }
  return [version.authorRole, version.authorName].filter(Boolean).join(' ')
}

export function getSitrepLastEditorLabel(
  version: { authorName: string } | null | undefined
): string {
  return version?.authorName === 'You' ? 'Last edited by' : 'Last updated by'
}

export function getLatestSitrepVersion(versions: SitrepVersion[]): SitrepVersion | null {
  if (versions.length === 0) {
    return null
  }
  return versions[versions.length - 1] ?? null
}

export function isSitrepVersionSigned(version: SitrepVersion): boolean {
  return version.signatures.length > 0
}

export function getLatestUnsignedSitrepVersion(versions: SitrepVersion[]): SitrepVersion | null {
  for (let index = versions.length - 1; index >= 0; index -= 1) {
    const version = versions[index]
    if (!isSitrepVersionSigned(version)) {
      return version
    }
  }
  return null
}

export function isSitrepVersionSubmitted(version: SitrepVersion): boolean {
  return (version.submittedForReviewTo?.length ?? 0) > 0
}

export function getSitrepVersionLabel(
  versionId: string,
  versions: SitrepVersion[]
): string {
  const indexInAll = versions.findIndex((entry) => entry.id === versionId)
  if (indexInAll === -1) {
    return 'draft'
  }
  return indexInAll === versions.length - 1 ? 'latest' : `v${indexInAll + 1}`
}

export type SitrepEditorState = {
  latestVersion: SitrepVersion | null
  latestUnsignedVersion: SitrepVersion | null
  isLatestSigned: boolean
  isFormLocked: boolean
  canEditSections: boolean
  canShowSectionAiControls: boolean
  signedVersionsCount: number
  workingVersion: SitrepVersion | null
}

export function resolveSitrepEditorState(params: {
  versions: SitrepVersion[]
  viewingSitrepVersion: SitrepVersion | null
  isCreatingSignedSitrepVersion: boolean
  sitrepReviewTargetId: string | null
}): SitrepEditorState {
  const latestVersion = getLatestSitrepVersion(params.versions)
  const latestUnsignedVersion = getLatestUnsignedSitrepVersion(params.versions)
  const isLatestSigned = !!latestVersion && isSitrepVersionSigned(latestVersion)
  const signedVersionsCount = params.versions.filter((version) =>
    isSitrepVersionSigned(version)
  ).length

  const reviewTarget = params.sitrepReviewTargetId
    ? params.versions.find((entry) => entry.id === params.sitrepReviewTargetId) ?? null
    : null
  const isReviewingFromQueue = reviewTarget !== null

  const isFormLocked =
    !!params.viewingSitrepVersion ||
    (isLatestSigned && !params.isCreatingSignedSitrepVersion && !isReviewingFromQueue)

  const canEditSections =
    !params.viewingSitrepVersion &&
    (params.isCreatingSignedSitrepVersion ||
      isReviewingFromQueue ||
      (!isLatestSigned && !!latestUnsignedVersion))

  const canShowSectionAiControls =
    canEditSections && !isReviewingFromQueue && !params.isCreatingSignedSitrepVersion

  const workingVersion =
    params.viewingSitrepVersion ??
    reviewTarget ??
    (params.isCreatingSignedSitrepVersion ? latestUnsignedVersion : latestUnsignedVersion) ??
    latestVersion

  return {
    latestVersion,
    latestUnsignedVersion,
    isLatestSigned,
    isFormLocked,
    canEditSections,
    canShowSectionAiControls,
    signedVersionsCount,
    workingVersion,
  }
}

export function filterSitrepVersionsForMode(
  versions: SitrepVersion[],
  mode: Exclude<SitrepViewMode, 'current'>
): SitrepVersion[] {
  const reversed = [...versions].reverse()
  if (mode === 'historical') {
    return reversed
  }
  if (mode === 'drafts') {
    return reversed.filter((version) => !isSitrepVersionSigned(version))
  }
  return reversed
    .filter(
      (version) =>
        !isSitrepVersionSigned(version) &&
        (version.submittedForReviewTo?.filter(
          (recipient) => recipient.role === 'Situation Unit Leader'
        ).length ?? 0) > 0
    )
    .slice(0, 1)
}

export const sitrepViewModeEmptyLabel: Record<Exclude<SitrepViewMode, 'current'>, string> = {
  historical: 'No versions yet.',
  drafts: 'No draft versions yet.',
  'review-queue': 'No drafts awaiting your review.',
}

export function clearSitrepSectionEdits(): Record<
  import('./types').SitrepSection,
  string | null
> {
  return {
    'executive-summary': null,
    'ongoing-incidents': null,
    'readiness-assessment': null,
    'risk-to-mission': null,
    'outstanding-rfi-rfr': null,
    'previous-critical-incident-comms': null,
    'general-comments': null,
    imagery: null,
  }
}
