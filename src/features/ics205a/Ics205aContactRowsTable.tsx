import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Ics205aContactRowTableCells } from '@/features/ics205a/Ics205aContactRowFields'
import type { Ics205aContactRowOptionsInput } from '@/features/ics205a/ics205a-contact-row-options'
import type { Ics205aContactRow } from '@/features/ics205a/types'

type Ics205aContactRowsTableProps = {
  formId: string
  contactRows: Ics205aContactRow[]
  editingContacts: boolean
  optionsInput: Ics205aContactRowOptionsInput
  onPatchRow: (rowId: number, patch: Partial<Ics205aContactRow>) => void
  onDeleteRow: (rowId: number) => void
}

export function Ics205aContactRowsTable({
  formId,
  contactRows,
  editingContacts,
  optionsInput,
  onPatchRow,
  onDeleteRow,
}: Ics205aContactRowsTableProps) {
  return (
    <div className="min-w-0 max-w-full overflow-x-auto rounded-md border [scrollbar-gutter:stable]">
      <table className="w-max min-w-full border-collapse text-xs">
        <thead>
          <tr className="border-b bg-muted/30 text-left text-muted-foreground">
            <th className="w-10 shrink-0 px-2 py-2 font-semibold">#</th>
            <th className="min-w-[14rem] px-2 py-2 font-semibold">Incident Assigned Position</th>
            <th className="min-w-[14rem] px-2 py-2 font-semibold">Name</th>
            <th className="min-w-[10rem] px-2 py-2 font-semibold">Cell Phone #</th>
            <th className="min-w-[10rem] px-2 py-2 font-semibold">Radio Frequency</th>
            <th className="min-w-[10rem] px-2 py-2 font-semibold">Other</th>
            {editingContacts ? (
              <th className="w-12 shrink-0 px-2 py-2 font-semibold" />
            ) : null}
          </tr>
        </thead>
        <tbody>
          {contactRows.length === 0 ? (
            <tr>
              <td
                colSpan={editingContacts ? 7 : 6}
                className="px-2 py-4 text-center text-muted-foreground"
              >
                No contacts recorded.
              </td>
            </tr>
          ) : (
            contactRows.map((row, index) => (
              <tr key={`${formId}-${row.id}`} className="border-b align-top last:border-b-0">
                <td className="px-2 py-2">{index + 1}</td>
                <Ics205aContactRowTableCells
                  row={row}
                  canEdit={editingContacts}
                  optionsInput={optionsInput}
                  onChange={(patch) => onPatchRow(row.id, patch)}
                />
                {editingContacts ? (
                  <td className="w-12 shrink-0 px-2 py-2 align-top">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label="Delete contact"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => onDeleteRow(row.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                ) : null}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
