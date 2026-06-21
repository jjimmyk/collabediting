export const ORG_CHART_CONNECTOR_CLASS = 'bg-muted-foreground/70'

export const ORG_CHART_POSITION_CARD_MIN_WIDTH = 'min-w-[10rem]'
export const ORG_CHART_POSITION_CARD_MAX_WIDTH = 'max-w-[12rem]'
export const ORG_CHART_POSITION_CARD_WIDTH =
  `${ORG_CHART_POSITION_CARD_MIN_WIDTH} ${ORG_CHART_POSITION_CARD_MAX_WIDTH}`

/** Org-chart canvas grows past the viewport; roster panel scrolls horizontally. */
export const ORG_CHART_CANVAS_MIN_WIDTH = 'min-w-[84rem]'

export const ORG_CHART_SECTION_COLUMN_MIN_WIDTH = 'min-w-[14rem]'
export const ORG_CHART_LOGISTICS_COLUMN_MIN_WIDTH = 'min-w-[28rem]'

/** Logistics Service / Support fork columns (horizontal layout). */
export const ORG_CHART_FORK_BRANCH_COLUMN_MIN_WIDTH = 'min-w-[12rem]'
export const ORG_CHART_LOGISTICS_FORK_MIN_WIDTH = 'min-w-[26rem]'

/** ~4× prior org-chart asset footprint (7–9rem → 28–36rem). */
export const ORG_CHART_ASSET_CARD_MIN_WIDTH = 'min-w-[28rem]'
export const ORG_CHART_ASSET_CARD_MAX_WIDTH = 'max-w-[36rem]'
export const ORG_CHART_ASSET_CARD_WIDTH =
  `${ORG_CHART_ASSET_CARD_MIN_WIDTH} ${ORG_CHART_ASSET_CARD_MAX_WIDTH}`

export const LOGISTICS_SECTION_LABEL = 'Logistics Section'

export function orgChartSectionColumnClassName(sectionLabel: string): string {
  return sectionLabel === LOGISTICS_SECTION_LABEL
    ? ORG_CHART_LOGISTICS_COLUMN_MIN_WIDTH
    : ORG_CHART_SECTION_COLUMN_MIN_WIDTH
}
