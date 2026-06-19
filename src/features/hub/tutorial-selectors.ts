export const HUB_TUTORIAL_SELECTORS = {
  productTours: '[data-hub-tutorial="product-tours"]',
  panelTabs: '[data-hub-tutorial="panel-tabs"]',
  notificationsTab: '[data-hub-tutorial="notifications-tab"]',
  businessUnitsTab: '[data-hub-tutorial="business-units-tab"]',
  eventsTab: '[data-hub-tutorial="events-tab"]',
  moreMenu: '[data-hub-tutorial="more-menu"]',
  hubPanel: '[data-hub-tutorial="hub-panel"]',
} as const

export {
  queryTutorialElement,
  requireTutorialElement,
  waitForTutorialElement,
} from '@/features/ics201/tutorial-selectors'
