import { useMemo, useState } from 'react'
import { Check, DownloadIcon, FileText, History, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/components/ui/item'
import type { Ics201FormState, Ics201Version } from '@/features/ics201/types'
import { refreshIcs201ResourceDenormalizedFields } from '@/features/ics201/resource-summary-utils'
import { formatIcs201ObjectiveKindLabel } from '@/features/ics201/constants'
import {
  ICS201_ACTION_COLUMN_LABELS,
  ICS201_BOX_LABELS,
  ICS201_RESOURCE_COLUMN_LABELS,
  ICS201_SAFETY_13_SUBLABELS,
} from '@/features/ics201/field-labels'
import { cloneIcs201FormState, ics201VersionAuthorLabel } from '@/features/ics201/utils'
import { formatOperationalPeriodLabel } from '@/lib/operational-period-utils'

type Ics201OperationalPeriodSnapshotPanelProps = {
  form: Ics201FormState
  versions: Ics201Version[]
  periodNumber: number
  glassItemBorderClasses: string
  onExportWord?: (form: Ics201FormState) => void
  onExportPdf?: (form: Ics201FormState) => void
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm">{value || '—'}</p>
    </div>
  )
}

export function Ics201OperationalPeriodSnapshotPanel({
  form: initialForm,
  versions,
  periodNumber,
  glassItemBorderClasses,
  onExportWord,
  onExportPdf,
}: Ics201OperationalPeriodSnapshotPanelProps) {
  const latestVersion = versions[versions.length - 1] ?? null
  const [viewingVersion, setViewingVersion] = useState<Ics201Version | null>(null)
  const [displayForm, setDisplayForm] = useState(() => cloneIcs201FormState(initialForm))
  const [versionDialogKind, setVersionDialogKind] = useState<'all' | 'signed' | null>(null)

  const signedVersionsCount = versions.filter((version) => version.signatures.length > 0).length
  const canExport = Boolean(onExportWord || onExportPdf)

  const dialogVersions = useMemo(() => {
    if (versionDialogKind === 'signed') {
      return versions.filter((version) => version.signatures.length > 0)
    }
    return versions
  }, [versionDialogKind, versions])

  const versionAuthorDisplay = (version: Ics201Version) =>
    ics201VersionAuthorLabel(version, { rosterMembers: [] })

  const handleViewVersion = (version: Ics201Version) => {
    setDisplayForm(cloneIcs201FormState(version.snapshot))
    setViewingVersion(version)
    setVersionDialogKind(null)
  }

  const handleViewLatest = () => {
    if (latestVersion) {
      setDisplayForm(cloneIcs201FormState(latestVersion.snapshot))
    } else {
      setDisplayForm(cloneIcs201FormState(initialForm))
    }
    setViewingVersion(null)
  }

  return (
    <div className="space-y-3">
      {viewingVersion ? (
        <div className="flex items-center justify-between rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex flex-wrap items-center gap-2">
            <History className="h-3.5 w-3.5" />
            <span>
              Viewing frozen version from{' '}
              <span className="font-semibold">
                {new Date(viewingVersion.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>{' '}
              by{' '}
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                style={{ backgroundColor: viewingVersion.authorColor }}
              >
                {versionAuthorDisplay(viewingVersion)}
              </span>
              .
            </span>
            {viewingVersion.signatures.length > 0 ? (
              <span
                className="flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300"
                title={viewingVersion.signatures
                  .map(
                    (signature) =>
                      `${signature.name} (${signature.role}) at ${new Date(
                        signature.signedAt
                      ).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}`
                  )
                  .join(', ')}
              >
                <Check className="h-3 w-3" />
                Signed by{' '}
                {viewingVersion.signatures
                  .map((signature) => `${signature.name} (${signature.role})`)
                  .join(', ')}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-7 gap-1 text-xs"
            onClick={handleViewLatest}
          >
            <X className="h-3.5 w-3.5" />
            View latest
          </Button>
        </div>
      ) : latestVersion ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-400 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-200">
          <span>
            Viewing latest frozen{' '}
            <span className="font-semibold">
              {latestVersion.signatures.length > 0 ? 'signed' : 'draft'}
            </span>{' '}
            version from{' '}
            <span className="font-semibold">
              {new Date(latestVersion.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>{' '}
            by{' '}
            <span
              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: latestVersion.authorColor }}
            >
              {versionAuthorDisplay(latestVersion)}
            </span>
            .
          </span>
        </div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {versions.length > 1 ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-7 gap-1 text-xs"
              onClick={() => setVersionDialogKind('all')}
            >
              <History className="h-3.5 w-3.5" />
              Version history
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                {versions.length}
              </Badge>
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={signedVersionsCount === 0}
              className="h-7 gap-1 text-xs"
              onClick={() => setVersionDialogKind('signed')}
            >
              <Check className="h-3.5 w-3.5" />
              Signed Versions
              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                {signedVersionsCount}
              </Badge>
            </Button>
          </>
        ) : null}
        {canExport ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                aria-label="Export ICS-201 snapshot"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Export ICS-201 snapshot</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {onExportWord ? (
                <DropdownMenuItem onSelect={() => onExportWord(displayForm)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Word (.docx)
                </DropdownMenuItem>
              ) : null}
              {onExportPdf ? (
                <DropdownMenuItem onSelect={() => onExportPdf(displayForm)}>
                  <FileText className="mr-2 h-4 w-4" />
                  PDF (.pdf)
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent>
          <ItemTitle>{formatOperationalPeriodLabel(periodNumber)} snapshot</ItemTitle>
          <ItemDescription>
            Read-only ICS-201 Incident Briefing captured when this operational period was started.
            {versions.length > 1
              ? ' Browse all frozen signed and unsigned versions above.'
              : null}
          </ItemDescription>
        </ItemContent>
      </Item>

      <Item variant="outline" className={glassItemBorderClasses}>
        <ItemContent className="space-y-4">
          <ReadOnlyField label={ICS201_BOX_LABELS.incidentName} value={displayForm.incidentName} />
          <ReadOnlyField
            label={ICS201_BOX_LABELS.incidentLocation}
            value={displayForm.incidentLocation}
          />
          <ReadOnlyField
            label="Operational Period"
            value={`${displayForm.operationalPeriodStart} – ${displayForm.operationalPeriodEnd}`}
          />
          <ReadOnlyField
            label={ICS201_BOX_LABELS.currentSituation}
            value={displayForm.currentSituationSummary}
          />
          <ReadOnlyField
            label={ICS201_BOX_LABELS.objectives}
            value={displayForm.objectives
              .map(
                (row, index) =>
                  `${index + 1}. ${formatIcs201ObjectiveKindLabel(row.kind) ? `[${formatIcs201ObjectiveKindLabel(row.kind)}] ` : ''}${row.objective}`
              )
              .join('\n')}
          />
          <ReadOnlyField
            label={ICS201_BOX_LABELS.actions}
            value={displayForm.actions
              .map((row) =>
                row.time
                  ? `${ICS201_ACTION_COLUMN_LABELS.time} ${row.time} — ${row.action}`
                  : row.action
              )
              .join('\n')}
          />
          <ReadOnlyField
            label={ICS201_BOX_LABELS.resources}
            value={displayForm.resources
              .map((row) => {
                const assetsByKey =
                  row.assetKey && row.resourceSnapshot
                    ? { [row.assetKey]: row.resourceSnapshot }
                    : undefined
                const resource = refreshIcs201ResourceDenormalizedFields(row, assetsByKey)
                return [
                  resource.resource,
                  resource.resourceIdentifier,
                  resource.dateTimeOrdered &&
                    `${ICS201_RESOURCE_COLUMN_LABELS.dateTimeOrdered}: ${resource.dateTimeOrdered}`,
                  resource.eta && `${ICS201_RESOURCE_COLUMN_LABELS.eta}: ${resource.eta}`,
                  resource.onScene && `${ICS201_RESOURCE_COLUMN_LABELS.onScene}: Yes`,
                  resource.notes,
                ]
                  .filter(Boolean)
                  .join(' · ')
              })
              .join('\n')}
          />
          <ReadOnlyField
            label={`${ICS201_BOX_LABELS.safetyAnalysis} — ${ICS201_SAFETY_13_SUBLABELS.A}`}
            value={displayForm.safetyAnalysisBox13.safetyOfficer}
          />
          <ReadOnlyField
            label={`${ICS201_BOX_LABELS.safetyAnalysis} — ${ICS201_SAFETY_13_SUBLABELS.D}`}
            value={displayForm.safetyAnalysisBox13.safetyNotes}
          />
          {displayForm.safetyAnalysisBox13.involvesHazmat === true ? (
            <ReadOnlyField
              label={ICS201_BOX_LABELS.hazmatAssessment}
              value={
                displayForm.hazmatAssessmentBox15.sopAndSafeWorkPractices ||
                displayForm.hazmatAssessmentBox15.emergencyProcedures ||
                '—'
              }
            />
          ) : null}
        </ItemContent>
      </Item>

      <Dialog
        open={versionDialogKind !== null}
        onOpenChange={(open) => {
          if (!open) setVersionDialogKind(null)
        }}
      >
        <DialogContent className="!w-[60vw] !max-w-[60vw] sm:!max-w-[60vw]">
          <div className="flex items-center gap-2 px-1 pb-2 text-sm font-semibold">
            <History className="h-4 w-4" />
            {versionDialogKind === 'signed'
              ? 'ICS-201 signed versions'
              : 'ICS-201 version history'}
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Frozen when {formatOperationalPeriodLabel(periodNumber)} started
            </span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border">
            {dialogVersions.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No versions found.
              </div>
            ) : (
              <ul className="divide-y">
                {[...dialogVersions]
                  .reverse()
                  .map((version, index) => {
                    const created = new Date(version.createdAt)
                    const preview =
                      version.snapshot.currentSituationSummary.slice(0, 80) +
                      (version.snapshot.currentSituationSummary.length > 80 ? '…' : '')
                    const isLatest =
                      latestVersion?.id === version.id && !viewingVersion
                    const isViewing = viewingVersion?.id === version.id
                    return (
                      <li
                        key={version.id}
                        className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted/40"
                      >
                        <div className="flex w-32 shrink-0 flex-col">
                          <span className="font-medium">
                            {isLatest ? 'Latest' : `v${dialogVersions.length - index}`}
                          </span>
                          <span className="text-muted-foreground">
                            {created.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <span
                          className="flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: version.authorColor }}
                        >
                          {versionAuthorDisplay(version)}
                        </span>
                        <span className="flex-1 truncate text-muted-foreground">
                          {preview || '(no summary changes)'}
                        </span>
                        {version.signatures.length > 0 ? (
                          <span
                            className="flex max-w-[18rem] items-center gap-1 truncate rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300"
                            title={version.signatures
                              .map(
                                (signature) =>
                                  `${signature.name} (${signature.role}) at ${new Date(
                                    signature.signedAt
                                  ).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`
                              )
                              .join(', ')}
                          >
                            <Check className="h-3 w-3" />
                            <span className="truncate">
                              Signed by{' '}
                              {version.signatures
                                .map((signature) => `${signature.name} (${signature.role})`)
                                .join(', ')}
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full border border-muted-foreground/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Unsigned
                          </span>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={isLatest || isViewing}
                          onClick={() => handleViewVersion(version)}
                        >
                          View
                        </Button>
                      </li>
                    )
                  })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
