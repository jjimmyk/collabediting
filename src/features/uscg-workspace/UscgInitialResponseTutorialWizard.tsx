import { useEffect, useRef } from 'react'
import { driver, type Config, type DriveStep, type Driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import {
  ICS201_TUTORIAL_SELECTORS,
  requireTutorialElement,
  waitForTutorialElement,
} from '@/features/ics201/tutorial-selectors'
import {
  USCG_TUTORIAL_SELECTORS,
} from '@/features/uscg-workspace/tutorial-selectors'

type UscgInitialResponseTutorialWizardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceName: string
  workspaceKind: 'incident' | 'exercise'
  onNavigateToIcs201: () => void
  onNavigateToWorkspaceSettings: () => void
}

function buildTutorialSteps(
  workspaceName: string,
  workspaceKind: 'incident' | 'exercise',
  onNavigateToIcs201: () => void,
  onNavigateToWorkspaceSettings: () => void,
  refreshTour: () => void
): DriveStep[] {
  const kindLabel = workspaceKind === 'exercise' ? 'exercise' : 'incident'
  const settingsLabel = workspaceKind === 'exercise' ? 'Exercise Settings' : 'Incident Settings'

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

  const ensureSettingsVisible = (selector: string) => {
    onNavigateToWorkspaceSettings()
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
        description: `You're in the USCG ICS ${kindLabel} workspace "${workspaceName}" at Initial Response complexity. This tour walks through the ICS-201 briefing, upgrading to Planning-P, and starting operational periods.`,
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
          'Use the pencil icon to edit a section. Current Situation and Objectives support live co-editing — avatar badges show teammates editing the same section.',
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
      element: USCG_TUTORIAL_SELECTORS.moreMenu,
      popover: {
        title: `Open ${settingsLabel}`,
        description: `When the incident grows beyond initial response, open More and choose ${settingsLabel} to upgrade the workspace workflow.`,
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: () => requireTutorialElement(USCG_TUTORIAL_SELECTORS.incidentComplexity),
      onHighlightStarted: () => {
        ensureSettingsVisible(USCG_TUTORIAL_SELECTORS.incidentComplexity)
      },
      popover: {
        title: 'Upgrade to Planning-P',
        description:
          'Change Incident Complexity from Initial Response to Planning-P. Planning-P unlocks the Planning P phase stepper, extended ICS forms, and operational period controls.',
        side: 'right',
        align: 'start',
      },
    },
    {
      element: () => requireTutorialElement(USCG_TUTORIAL_SELECTORS.saveSettings),
      onHighlightStarted: () => {
        ensureSettingsVisible(USCG_TUTORIAL_SELECTORS.saveSettings)
      },
      popover: {
        title: 'Save your workflow upgrade',
        description:
          'Click Save changes to apply Planning-P. The workspace header updates with your position badge and the Planning P phase stepper.',
        side: 'top',
        align: 'end',
      },
    },
    {
      element: USCG_TUTORIAL_SELECTORS.workspaceHeader,
      popover: {
        title: 'Planning P stepper',
        description:
          'After saving Planning-P, the phase stepper appears next to the workspace name. Use it to track Objectives through Demobilization and open phase-specific tasks and forms.',
        side: 'bottom',
        align: 'start',
      },
    },
    {
      element: () => requireTutorialElement(USCG_TUTORIAL_SELECTORS.operationalPeriodsPreview),
      onHighlightStarted: () => {
        ensureSettingsVisible(USCG_TUTORIAL_SELECTORS.operationalPeriodsPreview)
      },
      popover: {
        title: 'Start an operational period',
        description:
          'Once Planning-P is saved, return to Incident Settings. A Start OP 1 button appears here. Starting an operational period freezes current ICS forms as a snapshot and clones them into the next working period.',
        side: 'top',
        align: 'start',
      },
    },
    {
      element: ICS201_TUTORIAL_SELECTORS.workspaceMenu,
      popover: {
        title: "You're ready",
        description:
          'Complete the ICS-201, upgrade to Planning-P when ready, then start OP 1 from Incident Settings. Restart this tour anytime from Product Tours in the sidebar menu.',
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

export function UscgInitialResponseTutorialWizard({
  open,
  onOpenChange,
  workspaceName,
  workspaceKind,
  onNavigateToIcs201,
  onNavigateToWorkspaceSettings,
}: UscgInitialResponseTutorialWizardProps) {
  const driverRef = useRef<Driver | null>(null)
  const suppressCloseRef = useRef(false)
  const onNavigateToIcs201Ref = useRef(onNavigateToIcs201)
  const onNavigateToWorkspaceSettingsRef = useRef(onNavigateToWorkspaceSettings)
  const onOpenChangeRef = useRef(onOpenChange)
  const workspaceNameRef = useRef(workspaceName)
  const workspaceKindRef = useRef(workspaceKind)

  onNavigateToIcs201Ref.current = onNavigateToIcs201
  onNavigateToWorkspaceSettingsRef.current = onNavigateToWorkspaceSettings
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
      () => onNavigateToWorkspaceSettingsRef.current(),
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
