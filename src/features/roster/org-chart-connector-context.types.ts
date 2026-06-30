export type OrgChartSpineLink = {
  parentId: string
  childIds: string[]
  dashed?: boolean
  layout?: 'stack' | 'crossbar'
}

export type OrgChartIcBusLink = {
  commanderId: string
  headerIds: string[]
  dashed?: boolean
}
