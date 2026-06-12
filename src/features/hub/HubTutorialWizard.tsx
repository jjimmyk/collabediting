import { useEffect, useRef } from 'react'
import { driver, type Config, type DriveStep, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import {
  HUB_TUTORIAL_SELECTORS,
  requireTutorialElement,
  waitForTutorialElement,
} from '@/features/hub/tutorial-selectors'

type HubTab =
  | 'notifications'
  | 'incident-list'
  | 'exercises'
  | 'events'
  | 'analytics'

type HubTutorialWizardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToTab: (tab: HubTab) => void
  onEnsurePanelOpen: () => void
}

function buildHubTutorialSteps(
  onNavigateToTab: (tab: HubTab) => void,
  onEnsurePanelOpen: () => void,
  refreshTour: () => void
): DriveStep[] {
  const ensureTabVisible = (tab: HubTab, selector: string) => {
    onEnsurePanelOpen()
    onNavigateToTab(tab)
    window.setTimeout(() => {
      void waitForTutorialElement(selector).then((element) => {
        if (element) {
          refreshTour()
        }
      })
    }, 120)
  }

  return [
    {
      element: HUB_TUTORIAL_SELECTORS.hubMenu,
      popover: {
        title: 'Welcome to PRATUS Coach',
        description:
          'This tour walks you through The Hub — your home for incidents, exercises, events, and operational awareness across United States Coast Guard.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.sidebarMenu,
      popover: {
        title: 'Navigation menu',
        description:
          'Open the menu to jump between The Hub, File Manager, and your incident or exercise workspaces.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.panelTabs,
      popover: {
        title: 'Hub panel tabs',
        description:
          'These icons switch the left panel between Notifications, Incidents, Exercises, Events, Analytics, and more.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.notificationsTab,
      onHighlightStarted: () => {
        ensureTabVisible('notifications', HUB_TUTORIAL_SELECTORS.hubPanel)
      },
      popover: {
        title: 'Notifications',
        description:
          'Monitor operational alerts and action items. Filter by severity, category, or business unit to focus on what matters.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.incidentsTab,
      onHighlightStarted: () => {
        ensureTabVisible('incident-list', HUB_TUTORIAL_SELECTORS.hubPanel)
      },
      popover: {
        title: 'Incidents',
        description:
          'Browse and create incidents. Select an incident to enter its workspace for forms, roster, and operational tools.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.exercisesTab,
      onHighlightStarted: () => {
        ensureTabVisible('exercises', HUB_TUTORIAL_SELECTORS.hubPanel)
      },
      popover: {
        title: 'Exercises',
        description:
          'Plan and run training exercises. Open an exercise workspace to practice with MSEL injects and ICS forms.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.eventsTab,
      onHighlightStarted: () => {
        ensureTabVisible('events', HUB_TUTORIAL_SELECTORS.hubPanel)
      },
      popover: {
        title: 'Events',
        description:
          'Track operational events across business units. Events can feed incident creation and automated notification rules.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.analyticsTab,
      onHighlightStarted: () => {
        ensureTabVisible('analytics', HUB_TUTORIAL_SELECTORS.hubPanel)
      },
      popover: {
        title: 'Analytics',
        description:
          'View trends and summaries across your operational data to support decision-making.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: () => requireTutorialElement(HUB_TUTORIAL_SELECTORS.hubPanel),
      popover: {
        title: 'Panel content',
        description:
          'Each tab loads its list or dashboard here. Use search and filters within the panel to find records quickly.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.searchBar,
      popover: {
        title: 'Global search',
        description:
          'Search across notifications, assets, incidents, exercises, events, and map features. Apply filters or zoom to results on the map.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.mapToggle,
      popover: {
        title: 'Map view',
        description:
          'Toggle the map on or off. When visible, the panel shares the screen so you can work with geospatial context.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.pratusAi,
      popover: {
        title: 'PRATUS AI',
        description:
          'Open the AI assistant to draft forms, generate rules, and get help with operational workflows.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.hubMenu,
      popover: {
        title: "You're ready",
        description:
          'Explore incidents and exercises from The Hub anytime. Use the Start Here button next to the header to restart PRATUS Coach.',
        side: 'bottom',
        align: 'start',
        doneBtnText: 'Finish',
      },
    },
  ]
}

function createHubTutorialDriver(steps: DriveStep[], onClosedByUser: () => void): Driver {
  const config: Config = {
    steps,
    animate: true,
    smoothScroll: true,
    allowClose: true,
    overlayOpacity: 0.45,
    stagePadding: 10,
    stageRadius: 8,
    popoverOffset: 12,
    showProgress: true,
    progressText: '{{current}} of {{total}}',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Finish',
    popoverClass: 'pratus-ics201-tutorial-popover',
    onDestroyed: () => {
      onClosedByUser()
    },
  }

  return driver(config)
}

export function HubTutorialWizard({
  open,
  onOpenChange,
  onNavigateToTab,
  onEnsurePanelOpen,
}: HubTutorialWizardProps) {
  const driverRef = useRef<Driver | null>(null)
  const suppressCloseRef = useRef(false)
  const onNavigateToTabRef = useRef(onNavigateToTab)
  const onEnsurePanelOpenRef = useRef(onEnsurePanelOpen)
  const onOpenChangeRef = useRef(onOpenChange)

  onNavigateToTabRef.current = onNavigateToTab
  onEnsurePanelOpenRef.current = onEnsurePanelOpen
  onOpenChangeRef.current = onOpenChange

  const destroyTour = () => {
    if (!driverRef.current) {
      return
    }

    suppressCloseRef.current = true
    driverRef.current.destroy()
    driverRef.current = null
    suppressCloseRef.current = false
  }

  useEffect(() => {
    if (!open) {
      destroyTour()
      return
    }

    onEnsurePanelOpenRef.current()

    const refreshTour = () => {
      driverRef.current?.refresh()
    }

    const steps = buildHubTutorialSteps(
      (tab) => onNavigateToTabRef.current(tab),
      () => onEnsurePanelOpenRef.current(),
      refreshTour
    )

    destroyTour()
    const tour = createHubTutorialDriver(steps, () => {
      if (suppressCloseRef.current) {
        return
      }
      onOpenChangeRef.current(false)
    })
    driverRef.current = tour
    tour.drive()

    return () => {
      destroyTour()
    }
  }, [open])

  return null
}
