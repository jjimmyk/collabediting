const SEP = '::'

export function positionNodeId(position: string): string {
  return `position${SEP}${position}`
}

export function assetNodeId(assetKey: string): string {
  return `asset${SEP}${assetKey}`
}

export function singleResourceNodeId(memberId: string): string {
  return `single_resource${SEP}${memberId}`
}

export function parseOrgChartNodeId(id: string): {
  kind: 'position' | 'asset' | 'single_resource'
  value: string
} | null {
  const [kind, ...rest] = id.split(SEP)
  const value = rest.join(SEP)
  if (!value) return null
  if (kind === 'position') return { kind: 'position', value }
  if (kind === 'asset') return { kind: 'asset', value }
  if (kind === 'single_resource') return { kind: 'single_resource', value }
  return null
}
