import { formatQualificationsSummary } from '@/features/roster/person-picker-qualifications'

export function PersonPickerQualificationsLine({
  qualifications,
  className,
}: {
  qualifications?: string[] | null
  className?: string
}) {
  const summary = formatQualificationsSummary(qualifications)
  if (!summary) return null

  return (
    <span className={className ?? 'truncate text-[10px] text-muted-foreground'}>{summary}</span>
  )
}
