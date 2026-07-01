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
import { Ics214ExportPreviewDialog } from '@/features/ics214/Ics214ExportPreviewDialog'
import { Ics214FormSections } from '@/features/ics214/Ics214FormSections'
import {
  buildIcs214DocxBlocks,
  buildIcs214ExportOptions,
  ics214ExportFilenameBase,
  type Ics214DocxBlock,
} from '@/features/ics214/export'
import type {
  Ics214FormSectionDrafts,
  Ics214FormState,
  Ics214SectionId,
  Ics214Version,
} from '@/features/ics214/types'
import { cloneIcs214FormState, getIcs214FormForExport } from '@/features/ics214/utils'
import {
  IcsFormSignedVersionsLockMessage,
  IcsFormVersionsMenuButton,
  IcsFormVersionStatusStickyBar,
} from '@/features/ics/shared/IcsFormVersionStatusStickyBar'
import { cn } from '@/lib/utils'

type ExportBlock = Ics214DocxBlock
type ExportOptions = ReturnType<typeof buildIcs214ExportOptions>

type Ics214WorkspacePanelProps = {
  form: Ics214FormState | null
  setForm: React.Dispatch<React.SetStateAction<Ics214FormState | null>>
  versions: Ics214Version[]
  canEdit: boolean
  isLoading: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  incidentName: string
  editingSections: Partial<Record<Ics214SectionId, boolean>>
  sectionDrafts: Ics214FormSectionDrafts
  onStartSectionEdit: (section: Ics214SectionId) => void
  onCancelSectionEdit: (section: Ics214SectionId) => void
  onSaveSection: (section: Ics214SectionId) => void
  onGenerateSection: (section: Ics214SectionId) => void
  onPatchSectionDraft: <S extends Ics214SectionId>(
    section: S,
    value: Ics214FormSectionDrafts[S]
  ) => void
  onAppendVersion: (
    form: Ics214FormState,
    signatures?: Ics201VersionSignature[],
    authorNameOverride?: string
  ) => void
  onSignReview: (
    form: Ics214FormState,
    latestVersion: Ics214Version,
    signature: Ics201VersionSignature
  ) => void
  downloadDocx: (filename: string, blocks: ExportBlock[], options?: ExportOptions) => void
  downloadPdf: (filename: string, blocks: ExportBlock[], options?: ExportOptions) => void
}

export function Ics214WorkspacePanel({
  form,
  setForm,
  versions,
  canEdit,
  isLoading,
  isSaving,
  glassItemBorderClasses,
  incidentName,
  editingSections,
  sectionDrafts,
  onStartSectionEdit,
  onCancelSectionEdit,
  onSaveSection,
  onGenerateSection,
  onPatchSectionDraft,
  onAppendVersion,
  onSignReview,
  downloadDocx,
  downloadPdf,
}: Ics214WorkspacePanelProps) {
  const liveFormRef = useRef<Ics214FormState | null>(null)
  const [viewingPastVersion, setViewingPastVersion] = useState<Ics214Version | null>(null)
  const [isCreatingSignedVersion, setIsCreatingSignedVersion] = useState(false)
  const [versionDialogKind, setVersionDialogKind] = useState<'all' | 'signed' | null>(null)
  const [signDialog, setSignDialog] = useState<{
    mode: 'new-version' | 'review'
    role: string
  } | null>(null)
  const [signNameInput, setSignNameInput] = useState('You')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewBlocks, setPreviewBlocks] = useState<Ics214DocxBlock[]>([])

  const latestVersion = versions[versions.length - 1] ?? null
  const isLatestSigned = !!latestVersion && latestVersion.signatures.length > 0
  const formIsLocked =
    !!viewingPastVersion || (!isCreatingSignedVersion && isLatestSigned)
  const signedVersionsCount = versions.filter((version) => version.signatures.length > 0).length

  const getExportForm = () => {
    if (!form) return null
    return getIcs214FormForExport(form, sectionDrafts)
  }

  const getExportContext = () => ({ incidentName })

  const openPreview = () => {
    const exportForm = getExportForm()
    if (!exportForm) return
    setPreviewBlocks(buildIcs214DocxBlocks(exportForm, getExportContext()))
    setIsPreviewOpen(true)
  }

  const exportWord = (blocks?: ExportBlock[]) => {
    const exportForm = getExportForm()
    if (!exportForm) return
    const context = getExportContext()
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    downloadDocx(
      `ICS-214_${ics214ExportFilenameBase(exportForm)}_${stamp}.docx`,
      blocks ?? buildIcs214DocxBlocks(exportForm, context),
      buildIcs214ExportOptions(exportForm, context)
    )
  }

  const exportPdf = (blocks?: ExportBlock[]) => {
    const exportForm = getExportForm()
    if (!exportForm) return
    const context = getExportContext()
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    downloadPdf(
      `ICS-214_${ics214ExportFilenameBase(exportForm)}_${stamp}.pdf`,
      blocks ?? buildIcs214DocxBlocks(exportForm, context),
      buildIcs214ExportOptions(exportForm, context)
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

  const viewVersion = (version: Ics214Version) => {
    if (!form) return
    if (!viewingPastVersion) {
      liveFormRef.current = cloneIcs214FormState(form)
    }
    setForm(cloneIcs214FormState(version.snapshot))
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
        Loading ICS-214 form…
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
        ICS-214 form unavailable.
      </div>
    )
  }

  const latestSignature = latestVersion?.signatures[0]
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
                aria-label="Export ICS-214"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Export ICS-214</DropdownMenuLabel>
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
          <Ics214FormSections
            form={form}
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
          renderSignatureBlock('Prepared by', latestSignature)}

        {isCreatingSignedVersion && !viewingPastVersion && (
          <div className="flex items-center justify-end rounded-md border border-sky-400 bg-sky-50/60 px-3 py-2 dark:border-sky-500 dark:bg-sky-500/10">
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              onClick={() => {
                setSignNameInput('You')
                setSignDialog({ mode: 'new-version', role: 'Unit Leader' })
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
            {versionDialogKind === 'signed' ? 'Signed versions' : 'Version history'} — ICS-214
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
                    version.snapshot.entries[0]?.notableActivities ||
                    version.snapshot.unitName ||
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
                : 'Sign this ICS-214 version'}
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

      <Ics214ExportPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        title={`ICS-214 Preview — ${form.incidentName || incidentName || 'Activity Log'}`}
        blocks={previewBlocks}
        onExportWord={() => exportWord(previewBlocks)}
        onExportPdf={() => exportPdf(previewBlocks)}
      />
    </>
  )
}
