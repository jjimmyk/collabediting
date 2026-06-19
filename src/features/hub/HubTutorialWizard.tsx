import { useEffect, useRef } from 'react'
import { driver, type Config, type DriveStep, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import {
  HUB_TUTORIAL_SELECTORS,
  requireTutorialElement,
  waitForTutorialElement,
} from '@/features/hub/tutorial-selectors'

type HubTab = 'notifications' | 'fema-regions' | 'events'

type HubTutorialWizardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigateToTab: (tab: HubTab) => void
  onEnsurePanelOpen: () => void
  onOpenMoreMenu: (open: boolean) => void
  moreMenuLabels: readonly string[]
}

function formatMoreMenuDescription(labels: readonly string[]): string {
  const bulletList = labels.map((label) => `• ${label}`).join('\n')
  return `Open More to reach additional hub views:\n\n${bulletList}\n\nUse search inside the menu to jump quickly to Analytics, Assets, Incidents, and more.`
}

function buildHubTutorialSteps(
  onNavigateToTab: (tab: HubTab) => void,
  onEnsurePanelOpen: () => void,
  onOpenMoreMenu: (open: boolean) => void,
  moreMenuLabels: readonly string[],
  refreshTour: () => void
): DriveStep[] {
  const ensureTabVisible = (tab: HubTab, selector: string) => {
    onOpenMoreMenu(false)
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
      element: HUB_TUTORIAL_SELECTORS.productTours,
      popover: {
        title: 'Welcome to PRATUS Coach',
        description:
          'Product Tours walk you through The Hub — your home for notifications, business units, events, and operational awareness across United States Coast Guard.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.panelTabs,
      popover: {
        title: 'Hub panel tabs',
        description:
          'These icons switch the left panel between Notifications, Business Units, Events, and More.',
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
      element: () => requireTutorialElement(HUB_TUTORIAL_SELECTORS.hubPanel),
      popover: {
        title: 'Notifications panel',
        description:
          'Alerts and tasks load here. Use filters and search within the panel to find what needs attention.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.businessUnitsTab,
      onHighlightStarted: () => {
        ensureTabVisible('fema-regions', HUB_TUTORIAL_SELECTORS.hubPanel)
      },
      popover: {
        title: 'Business Units',
        description:
          'Browse Coast Guard districts and regions. Business units organize incidents, exercises, assets, and reporting scope.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: () => requireTutorialElement(HUB_TUTORIAL_SELECTORS.hubPanel),
      popover: {
        title: 'Business Units panel',
        description:
          'Select a business unit to filter hub data and open workspaces tied to that geography.',
        side: 'right',
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
      element: () => requireTutorialElement(HUB_TUTORIAL_SELECTORS.hubPanel),
      popover: {
        title: 'Events panel',
        description:
          'Review event timelines and details here. Events help you spot emerging situations before they escalate.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.moreMenu,
      onHighlightStarted: () => {
        onEnsurePanelOpen()
        onOpenMoreMenu(true)
        window.setTimeout(() => refreshTour(), 120)
      },
      onDeselected: () => {
        onOpenMoreMenu(false)
      },
      popover: {
        title: 'More menu',
        description: formatMoreMenuDescription(moreMenuLabels),
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: HUB_TUTORIAL_SELECTORS.productTours,
      onHighlightStarted: () => {
        onOpenMoreMenu(false)
      },
      popover: {
        title: "You're ready",
        description:
          'Explore The Hub anytime. Open Product Tours in the menu above The Hub to restart PRATUS Coach or start the Workspace Tour after opening an incident or exercise.',
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
  onOpenMoreMenu,
  moreMenuLabels,
}: HubTutorialWizardProps) {
  const driverRef = useRef<Driver | null>(null)
  const suppressCloseRef = useRef(false)
  const onNavigateToTabRef = useRef(onNavigateToTab)
  const onEnsurePanelOpenRef = useRef(onEnsurePanelOpen)
  const onOpenMoreMenuRef = useRef(onOpenMoreMenu)
  const onOpenChangeRef = useRef(onOpenChange)
  const moreMenuLabelsRef = useRef(moreMenuLabels)

  onNavigateToTabRef.current = onNavigateToTab
  onEnsurePanelOpenRef.current = onEnsurePanelOpen
  onOpenMoreMenuRef.current = onOpenMoreMenu
  onOpenChangeRef.current = onOpenChange
  moreMenuLabelsRef.current = moreMenuLabels

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
      onOpenMoreMenuRef.current(false)
      return
    }

    onEnsurePanelOpenRef.current()

    const refreshTour = () => {
      driverRef.current?.refresh()
    }

    const steps = buildHubTutorialSteps(
      (tab) => onNavigateToTabRef.current(tab),
      () => onEnsurePanelOpenRef.current(),
      (menuOpen) => onOpenMoreMenuRef.current(menuOpen),
      moreMenuLabelsRef.current,
      refreshTour
    )

    destroyTour()
    const tour = createHubTutorialDriver(steps, () => {
      if (suppressCloseRef.current) {
        return
      }
      onOpenMoreMenuRef.current(false)
      onOpenChangeRef.current(false)
    })
    driverRef.current = tour
    tour.drive()

    return () => {
      onOpenMoreMenuRef.current(false)
      destroyTour()
    }
  }, [open])

  return null
}
