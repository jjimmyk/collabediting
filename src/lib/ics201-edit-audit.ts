import type { Ics201SectionId } from '@/features/ics201/types'
import { getSupabaseClient } from '@/lib/supabase'

export type Ics201EditAuditEventType = 'form_patch' | 'crdt_persist' | 'checkpoint_version'

export async function appendIcs201EditAudit(input: {
  documentId: string
  userId: string | null
  sectionId: Ics201SectionId | null
  eventType: Ics201EditAuditEventType
  contentHash: string
}): Promise<void> {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { error } = await supabase.from('ics201_edit_audit').insert({
    document_id: input.documentId,
    user_id: input.userId,
    section_id: input.sectionId,
    event_type: input.eventType,
    content_hash: input.contentHash,
  })

  if (error) {
    // Audit failures must not interrupt editing.
    console.warn('ICS-201 edit audit insert failed:', error.message)
  }
}
