import type { HubAorBoundaryLevel } from './hub-aor-boundary-types'

type BoundarySymbolStyle = {
  fillColor: [number, number, number, number]
  outlineWidth: number
}

export const HUB_AOR_BOUNDARY_STYLES: Record<HubAorBoundaryLevel, BoundarySymbolStyle> = {
  area: {
    fillColor: [124, 58, 237, 0.04],
    outlineWidth: 1.5,
  },
  district: {
    fillColor: [59, 130, 246, 0.06],
    outlineWidth: 1.2,
  },
  sector: {
    fillColor: [16, 185, 129, 0.08],
    outlineWidth: 1,
  },
}

export const HUB_AOR_BOUNDARY_OUTLINE_COLOR: [number, number, number, number] = [255, 255, 255, 1]
