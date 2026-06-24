import assert from 'node:assert/strict'
import {
  expectedSpineHorizontalArmLengthPx,
  orgChartLayoutRect,
  resolveSpineAnchorX,
  spineConnectLines,
} from '../src/features/roster/org-chart-connector-draw'
import {
  ORG_CHART_CARD_TO_CHILDREN_GAP_PX,
  ORG_CHART_SPINE_ANCHOR_RATIO,
  ORG_CHART_SUBORDINATE_ARM_CHANNEL_PX,
  orgChartSpineAnchorPx,
  orgChartSubordinateIndentPx,
} from '../src/features/roster/org-chart-layout-tokens'

const CARD_WIDTH = 160
const PARENT_LEFT = 100
const PARENT_TOP = 40
const PARENT_HEIGHT = 80
const CHILD_LEFT_NESTED = PARENT_LEFT + orgChartSubordinateIndentPx(CARD_WIDTH)
const CHILD_TOP = PARENT_TOP + PARENT_HEIGHT + ORG_CHART_CARD_TO_CHILDREN_GAP_PX + 20

assert.equal(orgChartSpineAnchorPx(CARD_WIDTH), 16, 'spine anchor should be 10% of card width')
assert.equal(
  orgChartSubordinateIndentPx(CARD_WIDTH),
  16 + ORG_CHART_SUBORDINATE_ARM_CHANNEL_PX,
  'nested indent should be anchor plus arm channel'
)
assert.equal(
  expectedSpineHorizontalArmLengthPx(),
  ORG_CHART_SUBORDINATE_ARM_CHANNEL_PX,
  'nested horizontal arm should match arm channel width'
)

function mockRect(left: number, top: number, width: number, height: number) {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    width,
    height,
    x: left,
    y: top,
    toJSON: () => ({}),
  }
}

function mockChart(zoom: number) {
  return {
    getBoundingClientRect: () => mockRect(0, 0, 800 * zoom, 600 * zoom),
    dataset: { orgChartZoom: String(zoom) },
  } as unknown as HTMLElement
}

function mockElement(left: number, top: number, width: number, height: number, zoom: number) {
  return {
    getBoundingClientRect: () =>
      mockRect(left * zoom, top * zoom, width * zoom, height * zoom),
  } as unknown as HTMLElement
}

for (const zoom of [0.5, 0.65, 1, 1.5]) {
  const chart = mockChart(zoom)
  const parent = mockElement(PARENT_LEFT, PARENT_TOP, CARD_WIDTH, PARENT_HEIGHT, zoom)
  const child = mockElement(CHILD_LEFT_NESTED, CHILD_TOP, CARD_WIDTH, PARENT_HEIGHT, zoom)

  const parentRect = orgChartLayoutRect(chart, parent, zoom)
  const childRect = orgChartLayoutRect(chart, child, zoom)
  const spineX = resolveSpineAnchorX(parentRect, ORG_CHART_SPINE_ANCHOR_RATIO)

  assert.equal(
    spineX,
    PARENT_LEFT + CARD_WIDTH * ORG_CHART_SPINE_ANCHOR_RATIO,
    `spine anchor should be zoom-invariant at zoom ${zoom}`
  )

  const lines = spineConnectLines(chart, parent, [child], ORG_CHART_SPINE_ANCHOR_RATIO, zoom)
  assert.equal(lines.length, 2, `should emit vertical and horizontal segments at zoom ${zoom}`)

  const vertical = lines[0]
  const horizontal = lines[1]

  assert.equal(vertical.x1, vertical.x2, `vertical spine should be straight at zoom ${zoom}`)
  assert.equal(
    vertical.y1,
    parentRect.bottom + ORG_CHART_CARD_TO_CHILDREN_GAP_PX,
    `spine should start below parent gap at zoom ${zoom}`
  )
  assert.equal(horizontal.y1, horizontal.y2, `horizontal arm should be straight at zoom ${zoom}`)
  assert.equal(horizontal.x1, spineX, `horizontal arm should start at spine at zoom ${zoom}`)
  assert.equal(horizontal.x2, childRect.left, `horizontal arm should end at child left at zoom ${zoom}`)

  const armLength = horizontal.x2 - horizontal.x1
  assert.ok(
    Math.abs(armLength - ORG_CHART_SUBORDINATE_ARM_CHANNEL_PX) < 0.01,
    `nested arm length should match arm channel at zoom ${zoom}, got ${armLength}`
  )
}

console.log('verify-org-chart-spine-geometry: all checks passed')
