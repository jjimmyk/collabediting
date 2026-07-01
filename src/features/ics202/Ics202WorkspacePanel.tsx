import { useRef, useState } from 'react'
import {
  Check,
  DownloadIcon,
  Eye,
  FileText,
  History,
  Lock,
  Plus,
  X,
} from 'lucide-react'
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
import { Input } from '@/components/ui/input'
import type { Ics201VersionSignature } from '@/features/ics201/types'
import { Ics202ExportPreviewDialog } from '@/features/ics202/Ics202ExportPreviewDialog'
import { Ics202FormSections } from '@/features/ics202/Ics202FormSections'
import {
  buildIcs202ExportLayout,
  downloadIcs202Docx,
  downloadIcs202Pdf,
  ics202ExportFilenameBase,
  paginateIcs202Export,
  type Ics202PhysicalPage,
} from '@/features/ics202/export'
import type {
  Ics202FormSectionDrafts,
  Ics202FormState,
  Ics202PreparedByDraft,
  Ics202SectionId,
  Ics202Version,
} from '@/features/ics202/types'
import {
  cloneIcs202FormState,
  getIcs202FormForExport,
  mergePreparedByIntoForm,
  resolveIcs202PreparedByFromVersion,
  type Ics202PreparedByRosterMember,
} from '@/features/ics202/utils'
import {
  IcsFormSignedVersionsLockMessage,
  IcsFormVersionsMenuButton,
  IcsFormVersionStatusStickyBar,
} from '@/features/ics/shared/IcsFormVersionStatusStickyBar'
import { cn } from '@/lib/utils'

type Ics202WorkspacePanelProps = {
  form: Ics202FormState | null
  setForm: React.Dispatch<React.SetStateAction<Ics202FormState | null>>
  versions: Ics202Version[]
  canEdit: boolean
  isLoading: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  incidentName: string
  profileEmail: string | null
  rosterMembers: Ics202PreparedByRosterMember[]
  editingSections: Partial<Record<Ics202SectionId, boolean>>
  sectionDrafts: Ics202FormSectionDrafts
  onStartSectionEdit: (section: Ics202SectionId) => void
  onCancelSectionEdit: (section: Ics202SectionId) => void
  onSaveSection: (section: Ics202SectionId) => void
  onGenerateSection: (section: Ics202SectionId) => void
  onPatchSectionDraft: <S extends Ics202SectionId>(
    section: S,
    value: Ics202FormSectionDrafts[S]
  ) => void
  onAppendVersion: (
    form: Ics202FormState,
    signatures?: Ics201VersionSignature[],
    authorNameOverride?: string
  ) => void
  onSignReview: (
    form: Ics202FormState,
    latestVersion: Ics202Version,
    signature: Ics201VersionSignature
  ) => void
}

export function Ics202WorkspacePanel({
  form,
  setForm,
  versions,
  canEdit,
  isLoading,
  isSaving,
  glassItemBorderClasses,
  incidentName,
  profileEmail,
  rosterMembers,
  editingSections,
  sectionDrafts,
  onStartSectionEdit,
  onCancelSectionEdit,
  onSaveSection,
  onGenerateSection,
  onPatchSectionDraft,
  onAppendVersion,
  onSignReview,
}: Ics202WorkspacePanelProps) {
  const liveFormRef = useRef<Ics202FormState | null>(null)
  const [viewingPastVersion, setViewingPastVersion] = useState<Ics202Version | null>(null)
  const [isCreatingSignedVersion, setIsCreatingSignedVersion] = useState(false)
  const [versionDialogKind, setVersionDialogKind] = useState<'all' | 'signed' | null>(null)
  const [signDialog, setSignDialog] = useState<{
    mode: 'new-version' | 'review'
    role: string
  } | null>(null)
  const [signNameInput, setSignNameInput] = useState('You')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewPages, setPreviewPages] = useState<Ics202PhysicalPage[]>([])

  const latestVersion = versions[versions.length - 1] ?? null
  const isLatestSigned = !!latestVersion && latestVersion.signatures.length > 0
  const formIsLocked =
    !!viewingPastVersion || (!isCreatingSignedVersion && isLatestSigned)
  const signedVersionsCount = versions.filter((version) => version.signatures.length > 0).length

  const getExportForm = () => {
    if (!form) return null
    return getIcs202FormForExport(form, sectionDrafts)
  }

  const getRelevantVersion = (): Ics202Version | null =>
    viewingPastVersion ?? latestVersion ?? null

  const resolvePreparedByFields = (): Ics202PreparedByDraft => {
    const relevantVersion = getRelevantVersion()
    if (!relevantVersion) {
      return {
        preparedByName: form?.preparedByName ?? '',
        preparedByPositionTitle: form?.preparedByPositionTitle ?? '',
        preparedBySignature: form?.preparedBySignature ?? '',
        preparedDateTime: form?.preparedDateTime ?? '',
      }
    }
    return resolveIcs202PreparedByFromVersion(relevantVersion, rosterMembers, profileEmail)
  }

  const getExportFormWithPreparedBy = () => {
    const exportForm = getExportForm()
    if (!exportForm) return null
    const relevantVersion = getRelevantVersion()
    if (!relevantVersion) return exportForm
    return mergePreparedByIntoForm(exportForm, relevantVersion, rosterMembers, profileEmail)
  }

  const getExportContext = () => ({ incidentName })

  const openPreview = () => {
    const exportForm = getExportFormWithPreparedBy()
    if (!exportForm) return
    setPreviewPages(
      paginateIcs202Export(buildIcs202ExportLayout(exportForm, getExportContext()))
    )
    setIsPreviewOpen(true)
  }

  const exportWord = () => {
    const exportForm = getExportFormWithPreparedBy()
    if (!exportForm) return
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    downloadIcs202Docx(
      `ICS-202_${ics202ExportFilenameBase(exportForm)}_${stamp}.docx`,
      buildIcs202ExportLayout(exportForm, getExportContext())
    )
  }

  const exportPdf = () => {
    const exportForm = getExportFormWithPreparedBy()
    if (!exportForm) return
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    downloadIcs202Pdf(
      `ICS-202_${ics202ExportFilenameBase(exportForm)}_${stamp}.pdf`,
      buildIcs202ExportLayout(exportForm, getExportContext())
    )
  }

  const restoreLiveForm = () => {
    const live = liveFormRef.current
    if (live) {
      setForm(live)
      liveFormRef.current = null
    }
    setViewingPastVersion(null)
  }

  const viewVersion = (version: Ics202Version) => {
    if (!form) return
    if (!viewingPastVersion) {
      liveFormRef.current = cloneIcs202FormState(form)
    }
    setForm(cloneIcs202FormState(version.snapshot))
    setViewingPastVersion(version)
    setVersionDialogKind(null)
  }

  const renderSignatureBlock = (
    label: string,
    signature: Ics201VersionSignature
  ) => (
    <div className="rounded-md border p-3">
      <p className="mb-2 text-xs font-semibold">{label}</p>
      <div className="grid grid-cols-4 gap-3 text-xs">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Name</span>
          <span>{signature.name}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Position Title
          </span>
          <span>{signature.role}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Signature
          </span>
          <span className="font-serif text-base italic">{signature.name}</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Date/Time
          </span>
          <span>
            {new Date(signature.signedAt).toLocaleString([], {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  )

  const renderEmptyReview = (role: string) => (
    <button
      type="button"
      className="flex w-full items-center justify-between rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-3 py-3 text-left text-xs transition hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
      onClick={() => {
        setSignNameInput('You')
        setSignDialog({ mode: 'review', role })
      }}
    >
      <div>
        <p className="font-semibold">Review as {role}</p>
        <p className="text-[11px] text-muted-foreground">Click here to sign as the {role}.</p>
      </div>
      <span className="flex items-center gap-1 rounded-full border border-emerald-400 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
        <Check className="h-3 w-3" /> Sign
      </span>
    </button>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
        Loading ICS-202 form…
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
        ICS-202 form unavailable.
      </div>
    )
  }

  const latestSignature = latestVersion?.signatures[0]
  const incidentCommanderReviewer =
    latestVersion?.signatures.find(
      (signature, index) => index > 0 && signature.role === 'Incident Commander'
    ) ?? null

  const shownVersions =
    versionDialogKind === 'signed'
      ? versions.filter((version) => version.signatures.length > 0)
      : versions

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                aria-label="Export ICS-202"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Export ICS-202</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={openPreview}>
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => exportWord()}>
                <FileText className="mr-2 h-4 w-4" />
                Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => exportPdf()}>
                <FileText className="mr-2 h-4 w-4" />
                PDF (.pdf)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {viewingPastVersion && (
          <IcsFormVersionStatusStickyBar
            variant="past"
            statusContent={
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <History className="h-3.5 w-3.5" />
                  <span>
                    You are viewing a past version from{' '}
                    <span className="font-semibold">
                      {new Date(viewingPastVersion.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>{' '}
                    last edited by{' '}
                    <span
                      className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                      style={{ backgroundColor: viewingPastVersion.authorColor }}
                    >
                      {viewingPastVersion.authorName}
                    </span>
                    .
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={restoreLiveForm}
                >
                  <X className="h-3.5 w-3.5" />
                  View latest
                </Button>
              </div>
            }
          />
        )}

        {!viewingPastVersion && !isCreatingSignedVersion && (
          <IcsFormVersionStatusStickyBar
            variant="latest"
            statusContent={
              latestVersion ? (
                <span>
                  You are viewing the latest{' '}
                  <span className="font-semibold">{isLatestSigned ? 'signed' : 'draft'}</span>{' '}
                  version from{' '}
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
                    {latestVersion.authorName}
                  </span>
                  .
                </span>
              ) : (
                <span>You are viewing the latest version.</span>
              )
            }
            leadingActions={
              isLatestSigned ? <IcsFormSignedVersionsLockMessage /> : undefined
            }
            versionsButton={
              <IcsFormVersionsMenuButton
                historyCount={versions.length}
                signedCount={signedVersionsCount}
                onOpenHistory={() => setVersionDialogKind('all')}
                onOpenSigned={() => setVersionDialogKind('signed')}
              />
            }
          />
        )}

        <div className="space-y-3 rounded-md border bg-card/95 p-3 backdrop-blur-sm">
          {!viewingPastVersion && !isCreatingSignedVersion && (
            <div className="flex items-center justify-start gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                disabled={!canEdit || isSaving}
                onClick={() => {
                  if (isLatestSigned) {
                    onAppendVersion(form, [])
                    return
                  }
                  setIsCreatingSignedVersion(true)
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                {isLatestSigned ? 'Create New Version' : 'Create New Signed Version'}
              </Button>
            </div>
          )}

          {isCreatingSignedVersion && !viewingPastVersion && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-sky-400 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                <span>
                  Only you can view and edit this version. Read through it and sign at the bottom.
                </span>
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                onClick={() => setIsCreatingSignedVersion(false)}
              >
                <X className="h-3.5 w-3.5" />
                Cancel
              </Button>
            </div>
          )}
        </div>

        <div
          className={cn(
            'space-y-3',
            formIsLocked && 'pointer-events-none opacity-70 select-none'
          )}
        >
          <Ics202FormSections
            form={form}
            preparedBy={resolvePreparedByFields()}
            canEdit={canEdit}
            formIsLocked={formIsLocked}
            isSaving={isSaving}
            glassItemBorderClasses={glassItemBorderClasses}
            editingSections={editingSections}
            drafts={sectionDrafts}
            onStartSectionEdit={onStartSectionEdit}
            onCancelSectionEdit={onCancelSectionEdit}
            onSaveSection={onSaveSection}
            onGenerateSection={onGenerateSection}
            onPatchDraft={onPatchSectionDraft}
          />
        </div>

        {!viewingPastVersion &&
          !isCreatingSignedVersion &&
          latestSignature &&
          (() => (
            <div className="space-y-2">
              {renderSignatureBlock('Prepared by', latestSignature)}
              {incidentCommanderReviewer
                ? renderSignatureBlock('Signed by Incident Commander', incidentCommanderReviewer)
                : renderEmptyReview('Incident Commander')}
            </div>
          ))()}

        {isCreatingSignedVersion && !viewingPastVersion && (
          <div className="flex items-center justify-end rounded-md border border-sky-400 bg-sky-50/60 px-3 py-2 dark:border-sky-500 dark:bg-sky-500/10">
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              onClick={() => {
                setSignNameInput('You')
                setSignDialog({ mode: 'new-version', role: 'Planning Section Chief' })
              }}
            >
              <Check className="h-3.5 w-3.5" />
              Sign this version
            </Button>
          </div>
        )}
      </div>

      <Dialog
        open={versionDialogKind !== null}
        onOpenChange={(open) => {
          if (!open) setVersionDialogKind(null)
        }}
      >
        <DialogContent className="!w-[60vw] !max-w-[60vw] sm:!max-w-[60vw]">
          <div className="flex items-center gap-2 px-1 pb-2 text-sm font-semibold">
            {versionDialogKind === 'signed' ? (
              <Check className="h-4 w-4 text-emerald-600" />
            ) : (
              <History className="h-4 w-4" />
            )}
            {versionDialogKind === 'signed' ? 'Signed versions' : 'Version history'} — ICS-202
          </div>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border">
            {shownVersions.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                {versionDialogKind === 'signed' ? 'No signed versions yet.' : 'No versions yet.'}
              </div>
            ) : (
              <ul className="divide-y">
                {[...shownVersions].reverse().map((version) => {
                  const indexInAll = versions.findIndex((entry) => entry.id === version.id)
                  const versionLabel =
                    indexInAll === versions.length - 1 && versionDialogKind === 'all'
                      ? 'Current'
                      : `v${indexInAll + 1}`
                  const preview = (
                    version.snapshot.commandEmphasis ||
                    version.snapshot.objectives[0]?.objective ||
                    version.snapshot.incidentName ||
                    ''
                  ).slice(0, 80)
                  return (
                    <li
                      key={version.id}
                      className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted/40"
                    >
                      <div className="flex w-32 shrink-0 flex-col">
                        <span className="font-medium">{versionLabel}</span>
                        <span className="text-muted-foreground">
                          {new Date(version.createdAt).toLocaleTimeString([], {
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
                        {version.authorName}
                      </span>
                      <span className="flex-1 truncate text-muted-foreground">
                        {preview || '(no summary)'}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => viewVersion(version)}
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

      <Dialog
        open={signDialog !== null}
        onOpenChange={(open) => {
          if (!open) setSignDialog(null)
        }}
      >
        <DialogContent className="sm:max-w-md">
          <div className="space-y-3 px-1">
            <p className="text-sm font-semibold">
              {signDialog?.mode === 'review'
                ? `Sign as ${signDialog.role}`
                : 'Sign this ICS-202 version'}
            </p>
            <Input
              value={signNameInput}
              onChange={(event) => setSignNameInput(event.target.value)}
              placeholder="Your name"
              className="h-8 text-xs"
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 text-xs"
                onClick={() => setSignDialog(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={signNameInput.trim().length === 0}
                className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                onClick={() => {
                  const name = signNameInput.trim()
                  if (!name || !signDialog || !latestVersion) return
                  if (signDialog.mode === 'review') {
                    if (
                      latestVersion.signatures.some(
                        (signature, index) =>
                          index > 0 && signature.role === signDialog.role
                      )
                    ) {
                      setSignDialog(null)
                      setSignNameInput('You')
                      return
                    }
                    onSignReview(form, latestVersion, {
                      name,
                      role: signDialog.role,
                      signedAt: Date.now(),
                    })
                  } else {
                    onAppendVersion(
                      form,
                      [{ name, role: signDialog.role, signedAt: Date.now() }],
                      name
                    )
                    setIsCreatingSignedVersion(false)
                  }
                  setSignDialog(null)
                  setSignNameInput('You')
                }}
              >
                <Check className="h-3.5 w-3.5" />
                Sign
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Ics202ExportPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        title={`ICS-202 Preview — ${form.incidentName || incidentName || 'Incident Objectives'}`}
        pages={previewPages}
        onExportWord={() => exportWord()}
        onExportPdf={() => exportPdf()}
      />
    </>
  )
}
