export const ORG_CHART_CONNECTOR_CLASS = 'bg-muted-foreground/70'

/** Stroke width for org chart connector lines. */
export const ORG_CHART_CONNECTOR_LINE_WIDTH = 'w-0.5'

/** Connector border for continuous vertical trunks (matches line stroke). */
export const ORG_CHART_CONNECTOR_BORDER_CLASS = 'border-muted-foreground/70'
export const ORG_CHART_CONNECTOR_BORDER_WIDTH = 'border-l-2'

/** Short vertical stub between a parent card and its child subtree. */
export const ORG_CHART_CONNECTOR_STEM_HEIGHT = 'h-4'

/** Vertical drop from a crossbar into each column. */
export const ORG_CHART_CONNECTOR_DROP_HEIGHT = 'h-4'

/** Vertical trunk gutter beside right-indented subordinates. */
export const ORG_CHART_SUBORDINATE_TRUNK_WIDTH = 'w-2'

/** Horizontal channel between trunk and card — arms span this, cards start after it. */
export const ORG_CHART_SUBORDINATE_ARM_CHANNEL_WIDTH = 'w-6'

/** Vertical gap between stacked subordinate rows (Food → Medical reference spacing). */
export const ORG_CHART_SUBORDINATE_ROW_GAP = 'gap-2'

/** Gap between a position card and its child subtree — matches subordinate row gap. */
export const ORG_CHART_CARD_TO_CHILDREN_GAP = 'gap-2'

/** Renders org chart cards above connector lines. */
export const ORG_CHART_CARD_LAYER_CLASS = 'relative z-10 bg-background'

/** Horizontal anchor for spine connectors — 10% from card left edge (ICS 207 reference). */
export const ORG_CHART_SPINE_ANCHOR_RATIO = 0.1

/** Gap between IC / root children and centered command staff row. */
export const ORG_CHART_WIDE_COMMAND_STAFF_MARGIN_TOP = 'mt-10'

/** Gap between section header row and sub-hierarchy row in wide layout. */
export const ORG_CHART_WIDE_SUB_HIERARCHY_MARGIN_TOP = 'mt-14'

/** Gap between command staff (or IC) and section header row in wide layout. */
export const ORG_CHART_WIDE_GROUPS_ROW_MARGIN_TOP = 'mt-12'

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

/** Crossbar horizontal line inset — spans first through last column drop centers. */
export function orgChartCrossbarBarInsetClassName(columnCount: number): string {
  if (columnCount <= 1) {
    return 'left-1/2 right-1/2'
  }
  return `left-[calc(50%/${columnCount})] right-[calc(50%/${columnCount})]`
}
