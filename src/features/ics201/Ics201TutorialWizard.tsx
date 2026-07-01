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

  const ensureBriefingVisible = (selector: string) => {
    onNavigateToIcs201()
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
      element: ICS201_TUTORIAL_SELECTORS.workspaceMenu,
      popover: {
        title: 'Welcome to PRATUS Coach',
        description: `You're in the ${kindLabel} workspace "${workspaceName}". This walkthrough highlights each control in place so you can see exactly where to click.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: ICS201_TUTORIAL_SELECTORS.formsMenu,
      onDeselected: () => {
        onNavigateToIcs201()
      },
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
        ensureBriefingVisible(ICS201_TUTORIAL_SELECTORS.panel)
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
        ensureBriefingVisible(ICS201_TUTORIAL_SELECTORS.currentSituation)
      },
      popover: {
        title: 'Edit sections',
        description:
          'Use the pencil icon or click a section to edit. Current Situation and Objectives support live co-editing with teammate cursors. Changes autosave continuously; checkpoint versions are created when you pause or leave a section.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: () => requireTutorialElement(ICS201_TUTORIAL_SELECTORS.generateDraft),
      onHighlightStarted: () => {
        ensureBriefingVisible(ICS201_TUTORIAL_SELECTORS.generateDraft)
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
        ensureBriefingVisible(ICS201_TUTORIAL_SELECTORS.versionHistory)
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
        ensureBriefingVisible(ICS201_TUTORIAL_SELECTORS.exportMenu)
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
          'Open Forms → ICS-201 Incident Briefing anytime from this workspace. Use Product Tours in the menu above The Hub to restart PRATUS Coach.',
        side: 'bottom',
        align: 'start',
        doneBtnText: 'Finish',
      },
    },
  ]
}

function createTutorialDriver(
  steps: DriveStep[],
  onClosedByUser: () => void
): Driver {
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

export function Ics201TutorialWizard({
  open,
  onOpenChange,
  workspaceName,
  workspaceKind,
  onNavigateToIcs201,
}: Ics201TutorialWizardProps) {
  const driverRef = useRef<Driver | null>(null)
  const suppressCloseRef = useRef(false)
  const onNavigateToIcs201Ref = useRef(onNavigateToIcs201)
  const onOpenChangeRef = useRef(onOpenChange)
  const workspaceNameRef = useRef(workspaceName)
  const workspaceKindRef = useRef(workspaceKind)

  onNavigateToIcs201Ref.current = onNavigateToIcs201
  onOpenChangeRef.current = onOpenChange
  workspaceNameRef.current = workspaceName
  workspaceKindRef.current = workspaceKind

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

    const refreshTour = () => {
      driverRef.current?.refresh()
    }

    const steps = buildTutorialSteps(
      workspaceNameRef.current,
      workspaceKindRef.current,
      () => onNavigateToIcs201Ref.current(),
      refreshTour
    )

    destroyTour()
    const tour = createTutorialDriver(steps, () => {
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
