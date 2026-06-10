export const HUB_TUTORIAL_SELECTORS = {
  hubMenu: '[data-hub-tutorial="hub-menu"]',
  sidebarMenu: '[data-hub-tutorial="sidebar-menu"]',
  panelTabs: '[data-hub-tutorial="panel-tabs"]',
  notificationsTab: '[data-hub-tutorial="notifications-tab"]',
  incidentsTab: '[data-hub-tutorial="incidents-tab"]',
  exercisesTab: '[data-hub-tutorial="exercises-tab"]',
  eventsTab: '[data-hub-tutorial="events-tab"]',
  analyticsTab: '[data-hub-tutorial="analytics-tab"]',
  searchBar: '[data-hub-tutorial="search-bar"]',
  mapToggle: '[data-hub-tutorial="map-toggle"]',
  pratusAi: '[data-hub-tutorial="pratus-ai"]',
  hubPanel: '[data-hub-tutorial="hub-panel"]',
} as const

export {
  queryTutorialElement,
  requireTutorialElement,
  waitForTutorialElement,
} from '@/features/ics201/tutorial-selectors'
