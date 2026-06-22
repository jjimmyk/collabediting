export const USCG_TUTORIAL_SELECTORS = {
  moreMenu: '[data-uscg-tutorial="more-menu"]',
  workspaceHeader: '[data-uscg-tutorial="workspace-header"]',
  incidentComplexity: '[data-uscg-tutorial="incident-complexity"]',
  saveSettings: '[data-uscg-tutorial="save-settings"]',
  operationalPeriodsPreview: '[data-uscg-tutorial="operational-periods-preview"]',
  startOperationalPeriod: '[data-uscg-tutorial="start-operational-period"]',
} as const

export {
  queryTutorialElement,
  requireTutorialElement,
  waitForTutorialElement,
} from '@/features/ics201/tutorial-selectors'
