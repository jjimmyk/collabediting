import { AlertTriangle, Check, History, Lock, MapPin, Plus, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  formatSitrepLastEditor,
  getHumanSitrepAuthorName,
  getSitrepLastEditorLabel,
} from '@/features/sitrep/editor-utils'
import type { SitrepScopeKind, SitrepVersion, SitrepViewMode } from '@/features/sitrep/types'
import { cn } from '@/lib/utils'

export type SitrepScopeOption = {
  id: string
  kind: SitrepScopeKind
  label: string
}

type SitrepScopeHeaderProps = {
  isInWorkspaceContext: boolean
  scopeKindLabel: string
  scopeLabel: string
  scopeKind?: SitrepScopeKind
  selectedScopeId: string
  scopeOptions: SitrepScopeOption[]
  onScopeChange: (scopeId: string) => void
}

export function SitrepScopeHeader({
  isInWorkspaceContext,
  scopeKindLabel,
  scopeLabel,
  scopeKind,
  selectedScopeId,
  scopeOptions,
  onScopeChange,
}: SitrepScopeHeaderProps) {
  if (isInWorkspaceContext) {
    if (!scopeLabel) {
      return null
    }
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
          SITREP for
        </span>
        <Badge
          variant="outline"
          className={cn(
            'gap-1 border-transparent px-1.5 py-0 font-mono text-[10px] uppercase tracking-wide',
            scopeKind === 'aor'
              ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300'
              : 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
          )}
        >
          {scopeKind === 'aor' ? (
            <MapPin className="h-3 w-3" />
          ) : (
            <AlertTriangle className="h-3 w-3" />
          )}
          {scopeKindLabel}
        </Badge>
        <span className="font-medium text-foreground">{scopeLabel}</span>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-start gap-2">
      <span className="text-base font-semibold text-foreground">SITREP for</span>
      <Select value={selectedScopeId} onValueChange={onScopeChange}>
        <SelectTrigger
          size="sm"
          aria-label="SITREP scope: AOR, incident, or exercise"
          className="h-8 w-[280px] text-xs"
        >
          <SelectValue placeholder="Select scope" />
        </SelectTrigger>
        <SelectContent className="text-xs">
          <SelectGroup>
            <SelectLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Districts
            </SelectLabel>
            {scopeOptions
              .filter((option) => option.kind === 'aor')
              .map((option) => (
                <SelectItem key={option.id} value={option.id} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Incidents
            </SelectLabel>
            {scopeOptions
              .filter((option) => option.kind === 'incident')
              .map((option) => (
                <SelectItem key={option.id} value={option.id} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
          </SelectGroup>
          <SelectGroup>
            <SelectLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Exercises
            </SelectLabel>
            {scopeOptions
              .filter((option) => option.kind === 'exercise')
              .map((option) => (
                <SelectItem key={option.id} value={option.id} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}

type SitrepVersionToolbarProps = {
  latestVersion: SitrepVersion | null
  isLatestSigned: boolean
  signedVersionsCount: number
  versionsCount: number
  isSaving: boolean
  isLoading: boolean
  viewingHistorical: boolean
  isCreatingSignedVersion: boolean
  authorDisplay: (version: SitrepVersion) => string
  onOpenVersionHistory: () => void
  onOpenSignedVersions: () => void
  onCreateSignedOrNewVersion: () => void
  onGenerateDraft?: () => void
  generateDraftDisabled?: boolean
  onRequestApproval?: () => void
  canRequestApproval?: boolean
  approvalRequested?: boolean
}

export function SitrepVersionToolbar({
  latestVersion,
  isLatestSigned,
  signedVersionsCount,
  versionsCount,
  isSaving,
  isLoading,
  viewingHistorical,
  isCreatingSignedVersion,
  authorDisplay,
  onOpenVersionHistory,
  onOpenSignedVersions,
  onCreateSignedOrNewVersion,
  onGenerateDraft,
  generateDraftDisabled = false,
  onRequestApproval,
  canRequestApproval,
  approvalRequested,
}: SitrepVersionToolbarProps) {
  return (
    <>
      {!viewingHistorical && !isCreatingSignedVersion && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-400 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-200">
          {latestVersion ? (
            <span>
              You are viewing the latest{' '}
              <span className="font-semibold">{isLatestSigned ? 'signed' : 'draft'}</span> version
              from{' '}
              <span className="font-semibold">
                {new Date(latestVersion.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>{' '}
              last edited by{' '}
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: latestVersion.authorColor }}
              >
                {authorDisplay(latestVersion)}
              </span>
              .
            </span>
          ) : (
            <span>No SITREP versions yet. Create a draft to get started.</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between rounded-md border bg-background/70 px-3 py-2 text-xs">
        {isLatestSigned && !isCreatingSignedVersion ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            <span>Signed versions cannot be edited.</span>
          </div>
        ) : (
          <span className="text-muted-foreground">
            {isCreatingSignedVersion
              ? 'Review this version and sign at the bottom when ready.'
              : 'Edit any section below. Each save creates a new version.'}
            {isSaving ? ' Saving…' : null}
            {isLoading ? ' Loading…' : null}
          </span>
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={onOpenVersionHistory}
          >
            <History className="h-3.5 w-3.5" />
            Version history
            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
              {versionsCount}
            </Badge>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={signedVersionsCount === 0}
            className="h-7 gap-1 text-xs"
            onClick={onOpenSignedVersions}
          >
            <Check className="h-3.5 w-3.5" />
            Signed Versions
            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
              {signedVersionsCount}
            </Badge>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            disabled={viewingHistorical || isCreatingSignedVersion}
            onClick={onCreateSignedOrNewVersion}
          >
            <Plus className="h-3.5 w-3.5" />
            {isLatestSigned ? 'Create New Version' : 'Create New Signed Version'}
          </Button>
          {onGenerateDraft ? (
            <Button
              type="button"
              size="sm"
              className="h-7 gap-1 bg-blue-600 text-xs text-white hover:bg-blue-700"
              disabled={generateDraftDisabled}
              onClick={onGenerateDraft}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate Draft
            </Button>
          ) : null}
        </div>
        {canRequestApproval && onRequestApproval ? (
          <Button
            type="button"
            size="sm"
            variant={approvalRequested ? 'outline' : 'default'}
            disabled={approvalRequested}
            className={cn(
              'h-7 gap-1 text-xs',
              !approvalRequested && 'bg-emerald-600 text-white hover:bg-emerald-700'
            )}
            onClick={onRequestApproval}
          >
            {approvalRequested ? (
              <>
                <Check className="h-3.5 w-3.5" />
                Approval Requested
              </>
            ) : (
              'Request Approval'
            )}
          </Button>
        ) : null}
      </div>

      {isCreatingSignedVersion && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-sky-400 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200">
          <span>
            Only you can view and edit this version. Read through each section and sign at the
            bottom. If you sign this version, everyone with permission to view the SITREP will see
            it.
          </span>
        </div>
      )}
    </>
  )
}

type SitrepHistoricalBannerProps = {
  version: SitrepVersion
  originMode: SitrepViewMode | null
  onBack: () => void
}

export function SitrepHistoricalBanner({
  version,
  originMode,
  onBack,
}: SitrepHistoricalBannerProps) {
  const backLabelByMode: Record<SitrepViewMode, string> = {
    current: 'View latest',
    historical: 'Back to Historical',
    drafts: 'Back to Drafts',
    'review-queue': 'Back to Review Queue',
  }
  const isViewingSubmittedDraft =
    version.signatures.length === 0 && (version.submittedForReviewTo?.length ?? 0) > 0
  const isViewingUnsignedDraft = version.signatures.length === 0
  const backLabel = originMode
    ? backLabelByMode[originMode]
    : isViewingUnsignedDraft
      ? backLabelByMode.drafts
      : backLabelByMode.current

  return (
    <>
      <div className="flex items-center justify-start gap-2">
        <Button type="button" size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={onBack}>
          ← {backLabel}
        </Button>
      </div>
      <div className="flex flex-col gap-2 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-200">
        <span>
          {isViewingSubmittedDraft ? (
            <>
              You are viewing a draft last edited by{' '}
              <span className="font-semibold">
                {version.authorRole} {version.authorName}
              </span>{' '}
              submitted for review.
            </>
          ) : (
            <>
              You are viewing a past version from{' '}
              <span className="font-semibold">
                {new Date(version.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>{' '}
              last edited by{' '}
              <span className="font-semibold">
                {version.authorRole} {version.authorName}
              </span>
              .
            </>
          )}
        </span>
      </div>
    </>
  )
}

export function SitrepReviewTargetBanner({
  version,
  onExitReview,
}: {
  version: SitrepVersion
  onExitReview: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-7 gap-1 text-xs"
          onClick={onExitReview}
        >
          Back to Review Queue
        </Button>
      </div>
      <div className="rounded-md border border-sky-400 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200">
        <span>
          Reviewing draft created by{' '}
          <span className="font-semibold">
            {version.creatorRole} {version.creatorName}
          </span>{' '}
          · {getSitrepLastEditorLabel(version)}{' '}
          <span className="font-semibold">{formatSitrepLastEditor(version)}</span>
        </span>
      </div>
    </div>
  )
}

export { getHumanSitrepAuthorName, formatSitrepLastEditor, getSitrepLastEditorLabel }
