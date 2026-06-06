import { useEffect, useRef } from 'react'
import { driver, type Config, type DriveStep, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import {
  ICS201_TUTORIAL_SELECTORS,
  requireTutorialElement,
  waitForTutorialElement,
} from '@/features/ics201/tutorial-selectors'

type Ics201TutorialWizardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceName: string
  workspaceKind: 'incident' | 'exercise'
  onNavigateToIcs201: () => void
}

function buildTutorialSteps(
  workspaceName: string,
  workspaceKind: 'incident' | 'exercise',
  onNavigateToIcs201: () => void,
  refreshTour: () => void
): DriveStep[] {
  const kindLabel = workspaceKind === 'exercise' ? 'exercise' : 'incident'

  const ensureBriefingVisible = () => {
    onNavigateToIcs201()
    window.setTimeout(() => {
      void waitForTutorialElement(ICS201_TUTORIAL_SELECTORS.panel).then(() => {
        refreshTour()
      })
    }, 120)
  }

  return [
    {
      element: ICS201_TUTORIAL_SELECTORS.workspaceMenu,
      popover: {
        title: 'Welcome to the ICS-201 tutorial',
        description: `You're in the ${kindLabel} workspace "${workspaceName}". This walkthrough highlights each control in place so you can see exactly where to click.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: ICS201_TUTORIAL_SELECTORS.formsMenu,
      popover: {
        title: 'Open the ICS-201 form',
        description:
          'Click Forms, then choose ICS-201 Incident Briefing. The left panel switches to the briefing form for this workspace.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: () => requireTutorialElement(ICS201_TUTORIAL_SELECTORS.panel),
      onHighlightStarted: () => {
        ensureBriefingVisible()
      },
      popover: {
        title: 'ICS-201 form overview',
        description:
          'The briefing is organized into collapsible sections — Report Information, Current Situation, Objectives, Actions, Organization, Resources, and Safety Analysis. The banner at the top shows the latest draft or signed version.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: () => requireTutorialElement(ICS201_TUTORIAL_SELECTORS.currentSituation),
      onHighlightStarted: () => {
        ensureBriefingVisible()
      },
      popover: {
        title: 'Edit sections',
        description:
          'Use the pencil icon to edit a section. Current Situation and Objectives support live co-editing — avatar badges show teammates editing the same section.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: () => requireTutorialElement(ICS201_TUTORIAL_SELECTORS.generateDraft),
      onHighlightStarted: () => {
        ensureBriefingVisible()
      },
      popover: {
        title: 'Generate a draft with Pratus AI',
        description:
          'Generate Draft opens Pratus AI with ICS-201 context. Select data sources and send the prompt to populate all sections automatically, then review and edit.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: () => requireTutorialElement(ICS201_TUTORIAL_SELECTORS.versionHistory),
      onHighlightStarted: () => {
        ensureBriefingVisible()
      },
      popover: {
        title: 'Versions and signing',
        description:
          'Version history lists every saved draft. When ready for approval, use Create New Signed Version, review the form, and sign at the bottom.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: () => requireTutorialElement(ICS201_TUTORIAL_SELECTORS.exportMenu),
      onHighlightStarted: () => {
        ensureBriefingVisible()
      },
      popover: {
        title: 'Export the ICS-201',
        description:
          'Use the download icon to export Word or PDF. Choose Flexible, Paginated, or Strict structure mode depending on regulator requirements.',
        side: 'bottom',
        align: 'end',
      },
    },
    {
      element: ICS201_TUTORIAL_SELECTORS.workspaceMenu,
      popover: {
        title: "You're ready",
        description:
          'Open Forms → ICS-201 Incident Briefing anytime from this workspace. Use the ⋮ menu here to restart this tutorial.',
        side: 'bottom',
        align: 'start',
        doneBtnText: 'Finish',
      },
    },
  ]
}

function createTutorialDriver(
  steps: DriveStep[],
  onOpenChange: (open: boolean) => void
): Driver {
  let activeDriver: Driver | null = null

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
      onOpenChange(false)
      activeDriver = null
    },
  }

  activeDriver = driver(config)
  return activeDriver
}

export function Ics201TutorialWizard({
  open,
  onOpenChange,
  workspaceName,
  workspaceKind,
  onNavigateToIcs201,
}: Ics201TutorialWizardProps) {
  const driverRef = useRef<Driver | null>(null)

  useEffect(() => {
    if (!open) {
      driverRef.current?.destroy()
      driverRef.current = null
      return
    }

    const refreshTour = () => {
      driverRef.current?.refresh()
    }

    const steps = buildTutorialSteps(
      workspaceName,
      workspaceKind,
      onNavigateToIcs201,
      refreshTour
    )

    driverRef.current?.destroy()
    const tour = createTutorialDriver(steps, onOpenChange)
    driverRef.current = tour
    tour.drive()

    return () => {
      tour.destroy()
      if (driverRef.current === tour) {
        driverRef.current = null
      }
    }
  }, [open, onNavigateToIcs201, onOpenChange, workspaceKind, workspaceName])

  return null
}
