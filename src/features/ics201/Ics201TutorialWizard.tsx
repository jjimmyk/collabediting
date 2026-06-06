import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Ics201TutorialWizardProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  workspaceName: string
  workspaceKind: 'incident' | 'exercise'
  onNavigateToIcs201: () => void
}

type TutorialStep = {
  title: string
  body: string[]
  navigateOnEnter?: boolean
}

function buildTutorialSteps(
  workspaceName: string,
  workspaceKind: 'incident' | 'exercise'
): TutorialStep[] {
  const kindLabel = workspaceKind === 'exercise' ? 'exercise' : 'incident'

  return [
    {
      title: 'Welcome to the ICS-201 Tutorial',
      body: [
        `You're in the ${kindLabel} workspace **${workspaceName}**.`,
        'The ICS-201 Incident Briefing is the standard form for capturing situation, objectives, organization, resources, and safety analysis.',
        'This wizard walks you through how to open the form and use its key features.',
      ],
    },
    {
      title: 'Navigate to the ICS-201',
      body: [
        'In the tab bar below the header, click **Forms** (next to the map tools).',
        'From the dropdown, select **ICS-201 Incident Briefing**.',
        'The left panel will switch to the briefing form for this workspace.',
      ],
      navigateOnEnter: true,
    },
    {
      title: 'ICS-201 form overview',
      body: [
        'The ICS-201 is organized into collapsible sections: Report Information, Incident Briefing, Map Sketch, Current Situation, Objectives, Current & Planned Actions, Organization Chart, Resources Summary, and Safety Analysis.',
        'Expand any section to review its contents. The green banner at the top shows the latest draft or signed version.',
      ],
    },
    {
      title: 'Edit sections',
      body: [
        'Click the **pencil** icon on a section to enter edit mode. Save or cancel when finished.',
        '**Current Situation** and **Objectives** support live co-editing — avatar badges show teammates editing the same section.',
        'Signed versions are read-only. Create a new draft version to make further edits.',
      ],
    },
    {
      title: 'Generate a draft with Pratus AI',
      body: [
        'Click **Generate Draft** at the top of the ICS-201 panel to open Pratus AI.',
        'Select data sources (files, organization data, incident data) and send the prompt to populate all sections automatically.',
        'Review and edit the generated content before saving or signing.',
      ],
    },
    {
      title: 'Versions and signing',
      body: [
        '**Version history** lists every saved draft with timestamps and authors. Open a past version to compare, then return to the latest.',
        'When ready for approval, click **Create New Signed Version**, review the form, and sign at the bottom.',
        '**Signed Versions** shows all approved records visible to the workspace roster.',
      ],
    },
    {
      title: 'Export the ICS-201',
      body: [
        'With the ICS-201 tab open, use the **download** icon in the panel header to export.',
        'Choose **Flexible**, **Paginated**, or **Strict** structure mode depending on regulator requirements.',
        'Export to Word (.docx) or PDF for distribution outside the workspace.',
      ],
    },
    {
      title: "You're ready",
      body: [
        'Open **Forms → ICS-201 Incident Briefing** anytime from this workspace.',
        'Use the **⋮** menu next to the workspace name to restart this tutorial.',
      ],
    },
  ]
}

function renderBodyParagraph(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      )
    }
    return <span key={index}>{part}</span>
  })
}

export function Ics201TutorialWizard({
  open,
  onOpenChange,
  workspaceName,
  workspaceKind,
  onNavigateToIcs201,
}: Ics201TutorialWizardProps) {
  const steps = buildTutorialSteps(workspaceName, workspaceKind)
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    if (open) {
      setStepIndex(0)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }
    if (steps[stepIndex]?.navigateOnEnter) {
      onNavigateToIcs201()
    }
  }, [open, stepIndex, steps, onNavigateToIcs201])

  const step = steps[stepIndex]
  const isFirst = stepIndex === 0
  const isLast = stepIndex === steps.length - 1

  const handleClose = () => {
    onOpenChange(false)
  }

  const handleBack = () => {
    setStepIndex((previous) => Math.max(0, previous - 1))
  }

  const handleNext = () => {
    if (isLast) {
      handleClose()
      return
    }
    setStepIndex((previous) => Math.min(steps.length - 1, previous + 1))
  }

  if (!step) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <GraduationCap className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>{step.title}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Step {stepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
          <div className="space-y-2 pt-1">
            {step.body.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-muted-foreground">
                {renderBodyParagraph(paragraph)}
              </p>
            ))}
          </div>
        </DialogHeader>
        <DialogFooter className="border-t-0 bg-transparent p-0 pt-2 sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
            Skip tutorial
          </Button>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <Button type="button" variant="outline" size="sm" onClick={handleBack}>
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            )}
            <Button type="button" size="sm" onClick={handleNext}>
              {isLast ? 'Finish' : 'Next'}
              {!isLast && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
