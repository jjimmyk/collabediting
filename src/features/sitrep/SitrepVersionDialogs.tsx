import { Check, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog'
import type { SitrepFormState, SitrepVersion } from '@/features/sitrep/types'

type SitrepVersionDialogsProps = {
  versions: SitrepVersion[]
  form: SitrepFormState
  viewingSitrepVersion: SitrepVersion | null
  isVersionHistoryOpen: boolean
  isSignedVersionsOpen: boolean
  isSignDialogOpen: boolean
  signNameInput: string
  onVersionHistoryOpenChange: (open: boolean) => void
  onSignedVersionsOpenChange: (open: boolean) => void
  onSignDialogOpenChange: (open: boolean) => void
  onSignNameInputChange: (value: string) => void
  onViewVersion: (version: SitrepVersion, options?: { preserveLiveForm?: boolean; viewOnly?: boolean }) => void
  onConfirmSign: () => void
}

export function SitrepVersionDialogs({
  versions,
  viewingSitrepVersion,
  isVersionHistoryOpen,
  isSignedVersionsOpen,
  isSignDialogOpen,
  signNameInput,
  onVersionHistoryOpenChange,
  onSignedVersionsOpenChange,
  onSignDialogOpenChange,
  onSignNameInputChange,
  onViewVersion,
  onConfirmSign,
}: SitrepVersionDialogsProps) {
  const signedVersions = versions.filter((version) => version.signatures.length > 0)

  return (
    <>
      <Dialog open={isVersionHistoryOpen} onOpenChange={onVersionHistoryOpenChange}>
        <DialogContent className="!w-[60vw] !max-w-[60vw] sm:!max-w-[60vw]">
          <DialogTitle className="flex items-center gap-2 px-1 pb-2 text-sm font-semibold">
            <History className="h-4 w-4" />
            SITREP version history
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Revisions captured as the team collaborates
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Browse and open previous SITREP versions for this scope.
          </DialogDescription>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border">
            {versions.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No versions yet.
              </div>
            ) : (
              <ul className="divide-y">
                {[...versions].reverse().map((version, index) => {
                  const created = new Date(version.createdAt)
                  const preview =
                    version.snapshot.executiveSummary.slice(0, 80) +
                    (version.snapshot.executiveSummary.length > 80 ? '…' : '')
                  return (
                    <li
                      key={version.id}
                      className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted/40"
                    >
                      <div className="flex w-32 shrink-0 flex-col">
                        <span className="font-medium">
                          {index === 0 ? 'Current' : `v${versions.length - index}`}
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
                        {version.authorName}
                      </span>
                      <span className="flex-1 truncate text-muted-foreground">
                        {preview || '(no summary changes)'}
                      </span>
                      {version.signatures.length > 0 ? (
                        <span className="flex max-w-[18rem] items-center gap-1 truncate rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300">
                          <Check className="h-3 w-3" />
                          Signed
                        </span>
                      ) : (
                        <span className="rounded-full border border-muted-foreground/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Unsigned
                        </span>
                      )}
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        disabled={index === 0 && !viewingSitrepVersion}
                        onClick={() => {
                          onViewVersion(version, { preserveLiveForm: !viewingSitrepVersion })
                          onVersionHistoryOpenChange(false)
                        }}
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

      <Dialog open={isSignedVersionsOpen} onOpenChange={onSignedVersionsOpenChange}>
        <DialogContent className="!w-[60vw] !max-w-[60vw] sm:!max-w-[60vw]">
          <DialogTitle className="flex items-center gap-2 px-1 pb-2 text-sm font-semibold">
            <Check className="h-4 w-4 text-emerald-600" />
            SITREP signed versions
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Versions with at least one signature
            </span>
          </DialogTitle>
          <DialogDescription className="sr-only">
            Signed SITREP versions for this scope.
          </DialogDescription>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border">
            {signedVersions.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No signed versions yet.
              </div>
            ) : (
              <ul className="divide-y">
                {[...signedVersions].reverse().map((version) => {
                  const created = new Date(version.createdAt)
                  const indexInAll = versions.findIndex((entry) => entry.id === version.id)
                  const versionLabel =
                    indexInAll === versions.length - 1 ? 'Current' : `v${indexInAll + 1}`
                  const preview =
                    version.snapshot.executiveSummary.slice(0, 80) +
                    (version.snapshot.executiveSummary.length > 80 ? '…' : '')
                  return (
                    <li
                      key={version.id}
                      className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted/40"
                    >
                      <div className="flex w-32 shrink-0 flex-col">
                        <span className="font-medium">{versionLabel}</span>
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
                        {version.authorName}
                      </span>
                      <span className="flex-1 truncate text-muted-foreground">
                        {preview || '(no summary changes)'}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => {
                          onViewVersion(version, { preserveLiveForm: !viewingSitrepVersion })
                          onSignedVersionsOpenChange(false)
                        }}
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

      <Dialog open={isSignDialogOpen} onOpenChange={onSignDialogOpenChange}>
        <DialogContent className="!w-[24rem] !max-w-[24rem] sm:!max-w-[24rem]">
          <DialogTitle className="flex items-center gap-2 px-1 pb-1 text-sm font-semibold">
            <Check className="h-4 w-4 text-emerald-600" />
            Confirm your signature
          </DialogTitle>
          <DialogDescription className="px-1 text-xs text-muted-foreground">
            Type your name to sign this version. Your signature will be attached to a new entry in
            the SITREP version history.
          </DialogDescription>
          <div className="space-y-1 px-1 pt-2">
            <label className="text-[11px] font-medium text-muted-foreground">Your name</label>
            <input
              autoFocus
              value={signNameInput}
              onChange={(event) => onSignNameInputChange(event.target.value)}
              placeholder="Full name"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-1 pt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => onSignDialogOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={signNameInput.trim().length === 0}
              className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              onClick={onConfirmSign}
            >
              <Check className="h-3.5 w-3.5" />
              Sign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
