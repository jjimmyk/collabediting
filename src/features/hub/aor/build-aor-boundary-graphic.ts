import Graphic from '@arcgis/core/Graphic'
import type { HubAorDistrict } from '@/features/hub/aor/hub-aor-types'
import {
  HUB_AOR_BOUNDARY_OUTLINE_COLOR,
  HUB_AOR_BOUNDARY_STYLES,
} from './hub-aor-boundary-styles'
import type { HubAorBoundaryDefinition } from './hub-aor-boundary-types'

const DISTRICT_POPUP_TEMPLATE = {
  title: '{title}',
  content:
    '<b>Lead:</b> {lead}<br/>' +
    '<b>Active Incidents:</b> {incidents}<br/>' +
    '<b>Population:</b> {population}<br/>' +
    '<b>Evacuation:</b> {evacuationStatus}<br/>' +
    '<b>Priority:</b> {priority}<br/>' +
    '<b>Updated:</b> {lastUpdate}<br/>' +
    '<b>Latest SITREP:</b> {sitrep} <i>(last updated by {sitrepUpdatedBy})</i><br/>' +
    '<b>Ongoing Incidents:</b> {ongoingIncidentsSummary}<br/>' +
    '<b>Data Sources:</b> {sitrepSourcesSummary}',
}

const AREA_POPUP_TEMPLATE = {
  title: '{title}',
  content: '<b>Level:</b> Coast Guard Area<br/><b>Updated:</b> {lastUpdate}',
}

const SECTOR_POPUP_TEMPLATE = {
  title: '{title}',
  content:
    '<b>Level:</b> Sector<br/><b>Lead:</b> {lead}<br/><b>Parent District:</b> {parentDistrict}',
}

function buildDistrictAttributes(
  definition: HubAorBoundaryDefinition,
  district: HubAorDistrict,
  liveSummary?: { executiveSummary: string; sitrepUpdatedBy: string }
) {
  return {
    mapKey: definition.id,
    hubAorBoundaryLevel: definition.level,
    hubAorBoundaryId: definition.id,
    title: district.name,
    kind: 'AOR District',
    lead: district.lead,
    incidents: String(district.incidents),
    population: district.population,
    evacuationStatus: district.evacuationStatus,
    priority: district.priority,
    lastUpdate: district.lastUpdate,
    sitrep: liveSummary?.executiveSummary ?? district.sitrep,
    sitrepUpdatedBy: liveSummary?.sitrepUpdatedBy ?? district.sitrepUpdatedBy,
    ongoingIncidentsSummary: '—',
    sitrepSourcesSummary: district.sitrepSources.join('; '),
  }
}

function buildPopupTemplate(definition: HubAorBoundaryDefinition) {
  if (definition.level === 'district') {
    return DISTRICT_POPUP_TEMPLATE
  }

  if (definition.level === 'sector') {
    return SECTOR_POPUP_TEMPLATE
  }

  return AREA_POPUP_TEMPLATE
}

function buildAttributes(
  definition: HubAorBoundaryDefinition,
  liveSummary?: { executiveSummary: string; sitrepUpdatedBy: string }
) {
  if (definition.level === 'district' && definition.district) {
    return buildDistrictAttributes(definition, definition.district, liveSummary)
  }

  if (definition.level === 'sector' && definition.sector) {
    const parentDistrict = definition.sector.districtId
    return {
      mapKey: definition.id,
      hubAorBoundaryLevel: definition.level,
      hubAorBoundaryId: definition.id,
      title: definition.sector.name,
      kind: 'AOR Sector',
      lead: definition.sector.lead ?? '—',
      parentDistrict: `District ${parentDistrict}`,
    }
  }

  return {
    mapKey: definition.id,
    hubAorBoundaryLevel: definition.level,
    hubAorBoundaryId: definition.id,
    title: definition.label,
    kind: 'AOR Area',
    lastUpdate: '—',
  }
}

export function buildHubAorBoundaryGraphic(
  definition: HubAorBoundaryDefinition,
  liveSummary?: { executiveSummary: string; sitrepUpdatedBy: string }
): Graphic {
  const style = HUB_AOR_BOUNDARY_STYLES[definition.level]

  return new Graphic({
    geometry: {
      type: 'polygon',
      rings: definition.rings,
    },
    symbol: {
      type: 'simple-fill',
      color: style.fillColor,
      outline: {
        color: HUB_AOR_BOUNDARY_OUTLINE_COLOR,
        width: style.outlineWidth,
      },
    },
    attributes: buildAttributes(definition, liveSummary),
    popupTemplate: buildPopupTemplate(definition),
  })
}

export function applyLiveDistrictSummaryToGraphic(
  graphic: Graphic,
  definition: HubAorBoundaryDefinition,
  liveSummary?: { executiveSummary: string; sitrepUpdatedBy: string }
) {
  if (definition.level !== 'district' || !definition.district) {
    return
  }

  graphic.attributes = buildDistrictAttributes(definition, definition.district, liveSummary)
  graphic.popupTemplate = DISTRICT_POPUP_TEMPLATE
}

export function isHubAorBoundaryGraphicAttributes(
  attrs: Record<string, unknown> | undefined
): attrs is Record<string, unknown> & { hubAorBoundaryId: string; mapKey: string } {
  return (
    attrs !== undefined &&
    typeof attrs.hubAorBoundaryId === 'string' &&
    typeof attrs.mapKey === 'string'
  )
}
