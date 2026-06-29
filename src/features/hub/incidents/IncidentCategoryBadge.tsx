import { Badge } from '@/components/ui/badge'

const INCIDENT_CATEGORY_COLORS: Record<string, [number, number, number]> = {
  'Refinery Operations': [220, 38, 38],
  'Pipeline / Hazmat': [234, 88, 12],
  'Severe Weather': [37, 99, 235],
  Exercise: [147, 51, 234],
  'Port & Energy Infrastructure': [217, 119, 6],
}

const DEFAULT_INCIDENT_CATEGORY_COLOR: [number, number, number] = [100, 116, 139]

function getIncidentCategoryColorHex(category: string) {
  const [red, green, blue] =
    INCIDENT_CATEGORY_COLORS[category] ?? DEFAULT_INCIDENT_CATEGORY_COLOR
  return `rgb(${red}, ${green}, ${blue})`
}

export function IncidentCategoryBadge({ category }: { category: string }) {
  const label = category.trim() || 'Uncategorized'

  return (
    <Badge variant="secondary" className="gap-1.5">
      <span
        className="inline-block h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: getIncidentCategoryColorHex(label) }}
        aria-hidden="true"
      />
      {label}
    </Badge>
  )
}
