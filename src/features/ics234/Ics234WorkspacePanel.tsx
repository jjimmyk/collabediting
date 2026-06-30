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
import { Ics234ExportPreviewDialog } from '@/features/ics234/Ics234ExportPreviewDialog'
import { Ics234FormSections } from '@/features/ics234/Ics234FormSections'
import {
  buildIcs234DocxBlocks,
  buildIcs234ExportOptions,
  ics234ExportFilenameBase,
  type Ics234DocxBlock,
} from '@/features/ics234/export'
import type {
  Ics234FormSectionDrafts,
  Ics234FormState,
  Ics234MatrixItemDraft,
  Ics234MatrixItemEditState,
  Ics234MatrixItemRef,
  Ics234SectionId,
  Ics234Version,
} from '@/features/ics234/types'
import { cloneIcs234FormState, getIcs234FormForExport } from '@/features/ics234/utils'
import { cn } from '@/lib/utils'

type ExportBlock = Ics234DocxBlock
type ExportOptions = ReturnType<typeof buildIcs234ExportOptions>

type Ics234WorkspacePanelProps = {
  form: Ics234FormState | null
  setForm: React.Dispatch<React.SetStateAction<Ics234FormState | null>>
  versions: Ics234Version[]
  canEdit: boolean
  isLoading: boolean
  isSaving: boolean
  glassItemBorderClasses: string
  incidentName: string
  editingSections: Partial<Record<Ics234SectionId, boolean>>
  sectionDrafts: Ics234FormSectionDrafts
  editingMatrixItem: Ics234MatrixItemEditState | null
  onStartSectionEdit: (section: Ics234SectionId) => void
  onCancelSectionEdit: (section: Ics234SectionId) => void
  onSaveSection: (section: Ics234SectionId) => void
  onGenerateSection: (section: Ics234SectionId) => void
  onPatchSectionDraft: <S extends Ics234SectionId>(
    section: S,
    value: Ics234FormSectionDrafts[S]
  ) => void
  onStartMatrixItemEdit: (ref: Ics234MatrixItemRef) => void
  onCancelMatrixItemEdit: () => void
  onPatchMatrixItemDraft: (draft: Ics234MatrixItemDraft) => void
  onSaveMatrixItem: () => void
  onGenerateMatrixItem: (ref: Ics234MatrixItemRef) => void
  onAddMatrixObjective: () => void
  onAddMatrixStrategy: (objectiveId: number) => void
  onAddMatrixTactic: (objectiveId: number, strategyId: number) => void
  onDeleteMatrixObjective: (objectiveId: number) => void
  onDeleteMatrixStrategy: (objectiveId: number, strategyId: number) => void
  onDeleteMatrixTactic: (objectiveId: number, strategyId: number, tacticId: number) => void
  onAppendVersion: (
    form: Ics234FormState,
    signatures?: Ics201VersionSignature[],
    authorNameOverride?: string
  ) => void
  onSignReview: (
    form: Ics234FormState,
    latestVersion: Ics234Version,
    signature: Ics201VersionSignature
  ) => void
  downloadDocx: (filename: string, blocks: ExportBlock[], options?: ExportOptions) => void
  downloadPdf: (filename: string, blocks: ExportBlock[], options?: ExportOptions) => void
}

export function Ics234WorkspacePanel({
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
  editingMatrixItem,
  onStartSectionEdit,
  onCancelSectionEdit,
  onSaveSection,
  onGenerateSection,
  onPatchSectionDraft,
  onStartMatrixItemEdit,
  onCancelMatrixItemEdit,
  onPatchMatrixItemDraft,
  onSaveMatrixItem,
  onGenerateMatrixItem,
  onAddMatrixObjective,
  onAddMatrixStrategy,
  onAddMatrixTactic,
  onDeleteMatrixObjective,
  onDeleteMatrixStrategy,
  onDeleteMatrixTactic,
  onAppendVersion,
  onSignReview,
  downloadDocx,
  downloadPdf,
}: Ics234WorkspacePanelProps) {
  const liveFormRef = useRef<Ics234FormState | null>(null)
  const [viewingPastVersion, setViewingPastVersion] = useState<Ics234Version | null>(null)
  const [isCreatingSignedVersion, setIsCreatingSignedVersion] = useState(false)
  const [versionDialogKind, setVersionDialogKind] = useState<'all' | 'signed' | null>(null)
  const [signDialog, setSignDialog] = useState<{
    mode: 'new-version' | 'review'
    role: string
  } | null>(null)
  const [signNameInput, setSignNameInput] = useState('You')
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewBlocks, setPreviewBlocks] = useState<Ics234DocxBlock[]>([])

  const latestVersion = versions[versions.length - 1] ?? null
  const isLatestSigned = !!latestVersion && latestVersion.signatures.length > 0
  const formIsLocked =
    !!viewingPastVersion || (!isCreatingSignedVersion && isLatestSigned)
  const signedVersionsCount = versions.filter((version) => version.signatures.length > 0).length

  const getExportForm = () => {
    if (!form) return null
    return getIcs234FormForExport(form, sectionDrafts)
  }

  const getExportContext = () => ({ incidentName })

  const openPreview = () => {
    const exportForm = getExportForm()
    if (!exportForm) return
    setPreviewBlocks(buildIcs234DocxBlocks(exportForm, getExportContext()))
    setIsPreviewOpen(true)
  }

  const exportWord = (blocks?: ExportBlock[]) => {
    const exportForm = getExportForm()
    if (!exportForm) return
    const context = getExportContext()
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    downloadDocx(
      `ICS-234_${ics234ExportFilenameBase(exportForm)}_${stamp}.docx`,
      blocks ?? buildIcs234DocxBlocks(exportForm, context),
      buildIcs234ExportOptions(exportForm, context)
    )
  }

  const exportPdf = (blocks?: ExportBlock[]) => {
    const exportForm = getExportForm()
    if (!exportForm) return
    const context = getExportContext()
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
    downloadPdf(
      `ICS-234_${ics234ExportFilenameBase(exportForm)}_${stamp}.pdf`,
      blocks ?? buildIcs234DocxBlocks(exportForm, context),
      buildIcs234ExportOptions(exportForm, context)
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

  const viewVersion = (version: Ics234Version) => {
    if (!form) return
    if (!viewingPastVersion) {
      liveFormRef.current = cloneIcs234FormState(form)
    }
    setForm(cloneIcs234FormState(version.snapshot))
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
        Loading ICS-234 form…
      </div>
    )
  }

  if (!form) {
    return (
      <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
        ICS-234 form unavailable.
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
      <div className="min-w-0 w-full max-w-full space-y-3">
        <div className="flex items-center justify-end gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 gap-1 text-xs"
                aria-label="Export ICS-234"
              >
                <DownloadIcon className="h-3.5 w-3.5" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Export ICS-234</DropdownMenuLabel>
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

        <div className="sticky top-0 z-10 space-y-3 rounded-md border bg-card/95 p-3 backdrop-blur-sm">
          {viewingPastVersion && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-200">
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
          )}

          {!viewingPastVersion && !isCreatingSignedVersion && (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-400 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-200">
              {latestVersion ? (
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
              )}
            </div>
          )}

          {!viewingPastVersion && !isCreatingSignedVersion && (
            <div className="flex items-center justify-between rounded-md border bg-background/70 px-3 py-2 text-xs">
              {isLatestSigned ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Signed versions are locked from edits.</span>
                </div>
              ) : (
                <div className="text-muted-foreground">
                  Draft is editable. Use each section&apos;s Save button to update the latest
                  draft, or sign to promote it.
                </div>
              )}
              <div className="flex items-center gap-2">
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
              </div>
            </div>
          )}

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
            'min-w-0 w-full max-w-full space-y-3',
            formIsLocked && 'pointer-events-none opacity-70 select-none'
          )}
        >
          <Ics234FormSections
            form={form}
            canEdit={canEdit}
            formIsLocked={formIsLocked}
            isSaving={isSaving}
            glassItemBorderClasses={glassItemBorderClasses}
            editingSections={editingSections}
            drafts={sectionDrafts}
            editingMatrixItem={editingMatrixItem}
            onStartSectionEdit={onStartSectionEdit}
            onCancelSectionEdit={onCancelSectionEdit}
            onSaveSection={onSaveSection}
            onGenerateSection={onGenerateSection}
            onPatchDraft={onPatchSectionDraft}
            onStartMatrixItemEdit={onStartMatrixItemEdit}
            onCancelMatrixItemEdit={onCancelMatrixItemEdit}
            onPatchMatrixItemDraft={onPatchMatrixItemDraft}
            onSaveMatrixItem={onSaveMatrixItem}
            onGenerateMatrixItem={onGenerateMatrixItem}
            onAddMatrixObjective={onAddMatrixObjective}
            onAddMatrixStrategy={onAddMatrixStrategy}
            onAddMatrixTactic={onAddMatrixTactic}
            onDeleteMatrixObjective={onDeleteMatrixObjective}
            onDeleteMatrixStrategy={onDeleteMatrixStrategy}
            onDeleteMatrixTactic={onDeleteMatrixTactic}
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
            {versionDialogKind === 'signed' ? 'Signed versions' : 'Version history'} — ICS-234
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
                    version.snapshot.objectives[0]?.name ||
                    version.snapshot.objectives[0]?.strategies[0]?.name ||
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
                : 'Sign this ICS-234 version'}
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

      <Ics234ExportPreviewDialog
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        title={`ICS-234 Preview — ${form.incidentName || incidentName || 'Work Analysis Matrix'}`}
        blocks={previewBlocks}
        onExportWord={() => exportWord(previewBlocks)}
        onExportPdf={() => exportPdf(previewBlocks)}
      />
    </>
  )
}
