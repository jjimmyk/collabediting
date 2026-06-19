import type { PlanningPStepId, PlanningPTaskTemplate } from '@/features/planning-p/planning-p-task-types'

export const PLANNING_P_DEFAULT_POSITION = '_default'

type TaskSeed = {
  position: string
  slug: string
  label: string
}

function createTaskId(phaseId: PlanningPStepId, position: string, slug: string): string {
  const positionKey = position === PLANNING_P_DEFAULT_POSITION ? 'default' : position
  return `${phaseId}:${positionKey}:${slug}`
}

function phaseTasks(phaseId: PlanningPStepId, seeds: TaskSeed[]): PlanningPTaskTemplate[] {
  return seeds.map((seed) => ({
    id: createTaskId(phaseId, seed.position, seed.slug),
    phaseId,
    position: seed.position,
    label: seed.label,
  }))
}

const OBJECTIVES_MEETING_TASKS = phaseTasks('objectives-meeting', [
  {
    position: 'Incident Commander',
    slug: 'approve-objectives',
    label: 'Review and approve incident objectives for the operational period',
  },
  {
    position: 'Incident Commander',
    slug: 'confirm-command-priorities',
    label: 'Confirm command priorities and constraints with UC representatives',
  },
  {
    position: 'Planning Section Chief',
    slug: 'draft-objectives',
    label: 'Draft incident objectives for IC / UC review',
  },
  {
    position: 'Planning Section Chief',
    slug: 'collect-section-inputs',
    label: 'Collect section chief inputs needed for objectives discussion',
  },
  {
    position: 'Operations Section Chief',
    slug: 'validate-objectives',
    label: 'Validate that proposed objectives are achievable with current resources',
  },
  {
    position: 'Safety Officer',
    slug: 'review-objectives-safety',
    label: 'Review objectives for safety implications and required controls',
  },
  {
    position: 'Liaison Officer',
    slug: 'coordinate-agency-objectives',
    label: 'Coordinate agency representative input on objectives',
  },
  {
    position: PLANNING_P_DEFAULT_POSITION,
    slug: 'attend-objectives-meeting',
    label: 'Attend the IC / UC objectives meeting and note assigned actions',
  },
])

const CG_STAFF_MEETING_TASKS = phaseTasks('cg-staff-meeting', [
  {
    position: 'Incident Commander',
    slug: 'lead-staff-meeting',
    label: 'Lead the Command & General Staff strategy meeting',
  },
  {
    position: 'Operations Section Chief',
    slug: 'present-operations-update',
    label: 'Present current operations status and key issues',
  },
  {
    position: 'Planning Section Chief',
    slug: 'present-planning-update',
    label: 'Present planning status, timelines, and IAP milestones',
  },
  {
    position: 'Logistics Section Chief',
    slug: 'present-logistics-update',
    label: 'Present logistics support status and anticipated shortfalls',
  },
  {
    position: 'Finance/Admin Section Chief',
    slug: 'present-finance-update',
    label: 'Present cost summary and administrative constraints',
  },
  {
    position: 'Public Information Officer',
    slug: 'present-media-update',
    label: 'Brief staff on media inquiries and public messaging needs',
  },
  {
    position: 'Safety Officer',
    slug: 'present-safety-issues',
    label: 'Brief staff on safety issues and mitigation measures',
  },
  {
    position: PLANNING_P_DEFAULT_POSITION,
    slug: 'participate-staff-meeting',
    label: 'Participate in the C&G staff meeting and capture assigned follow-ups',
  },
])

const PREP_TACTICS_TASKS = phaseTasks('prep-tactics', [
  {
    position: 'Operations Section Chief',
    slug: 'identify-division-needs',
    label: 'Identify division and group resource and tactical needs',
  },
  {
    position: 'Operations Section Chief',
    slug: 'prepare-tactics-agenda',
    label: 'Prepare the tactics meeting agenda and issue list',
  },
  {
    position: 'Resources Unit Leader',
    slug: 'confirm-resource-availability',
    label: 'Confirm resource availability for proposed tactics',
  },
  {
    position: 'Planning Section Chief',
    slug: 'align-tactics-objectives',
    label: 'Ensure proposed tactics align with approved objectives',
  },
  {
    position: 'Logistics Section Chief',
    slug: 'confirm-support-requirements',
    label: 'Confirm logistics support requirements for proposed tactics',
  },
  {
    position: PLANNING_P_DEFAULT_POSITION,
    slug: 'prepare-tactics-inputs',
    label: 'Prepare inputs needed for the tactics meeting',
  },
])

const TACTICS_MEETING_TASKS = phaseTasks('tactics-meeting', [
  {
    position: 'Operations Section Chief',
    slug: 'lead-tactics-meeting',
    label: 'Lead the tactics meeting and document decisions',
  },
  {
    position: 'Operations Section Chief',
    slug: 'assign-tactical-actions',
    label: 'Assign tactical actions to divisions and groups',
  },
  {
    position: 'Logistics Section Chief',
    slug: 'confirm-support-at-tactics',
    label: 'Confirm logistics support for approved tactics',
  },
  {
    position: 'Safety Officer',
    slug: 'review-tactics-safety',
    label: 'Review proposed tactics for safety hazards and controls',
  },
  {
    position: 'Planning Section Chief',
    slug: 'capture-tactics-for-iap',
    label: 'Capture tactics decisions for IAP development',
  },
  {
    position: PLANNING_P_DEFAULT_POSITION,
    slug: 'participate-tactics-meeting',
    label: 'Participate in the tactics meeting and confirm assigned actions',
  },
])

const PREP_PLANNING_TASKS = phaseTasks('prep-planning', [
  {
    position: 'Planning Section Chief',
    slug: 'collect-section-inputs-iap',
    label: 'Collect section inputs required for the planning meeting',
  },
  {
    position: 'Planning Section Chief',
    slug: 'assemble-planning-agenda',
    label: 'Assemble the planning meeting agenda and briefing materials',
  },
  {
    position: 'Situation Unit Leader',
    slug: 'update-situation-summary',
    label: 'Update the situation summary for planning meeting review',
  },
  {
    position: 'Documentation Unit Leader',
    slug: 'prepare-planning-forms',
    label: 'Prepare ICS forms needed for the planning meeting',
  },
  {
    position: 'Resources Unit Leader',
    slug: 'finalize-resource-status',
    label: 'Finalize resource status for planning meeting review',
  },
  {
    position: PLANNING_P_DEFAULT_POSITION,
    slug: 'submit-planning-inputs',
    label: 'Submit planning inputs to the Planning Section',
  },
])

const PLANNING_MEETING_TASKS = phaseTasks('planning-meeting', [
  {
    position: 'Planning Section Chief',
    slug: 'facilitate-planning-meeting',
    label: 'Facilitate the planning meeting and resolve open issues',
  },
  {
    position: 'Documentation Unit Leader',
    slug: 'confirm-doc-requirements',
    label: 'Confirm documentation requirements for the IAP package',
  },
  {
    position: 'Operations Section Chief',
    slug: 'validate-iap-operations',
    label: 'Validate operations content in the draft IAP',
  },
  {
    position: 'Logistics Section Chief',
    slug: 'validate-iap-logistics',
    label: 'Validate logistics support content in the draft IAP',
  },
  {
    position: 'Incident Commander',
    slug: 'review-draft-iap',
    label: 'Review draft IAP content and identify approval issues',
  },
  {
    position: PLANNING_P_DEFAULT_POSITION,
    slug: 'participate-planning-meeting',
    label: 'Participate in the planning meeting and confirm section assignments',
  },
])

const IAP_PREP_TASKS = phaseTasks('iap-prep', [
  {
    position: 'Planning Section Chief',
    slug: 'finalize-iap-package',
    label: 'Finalize the IAP package for IC approval',
  },
  {
    position: 'Documentation Unit Leader',
    slug: 'quality-check-iap',
    label: 'Quality-check IAP forms, attachments, and maps',
  },
  {
    position: 'Incident Commander',
    slug: 'sign-iap',
    label: 'Review and sign the IAP for the operational period',
  },
  {
    position: 'Public Information Officer',
    slug: 'prepare-iap-release',
    label: 'Prepare public release materials aligned with the IAP',
  },
  {
    position: 'Operations Section Chief',
    slug: 'confirm-iap-distribution',
    label: 'Confirm operations elements are ready for IAP distribution',
  },
  {
    position: PLANNING_P_DEFAULT_POSITION,
    slug: 'complete-iap-assignments',
    label: 'Complete assigned IAP preparation tasks before approval',
  },
])

const OPERATIONS_BRIEFING_TASKS = phaseTasks('operations-briefing', [
  {
    position: 'Operations Section Chief',
    slug: 'deliver-ops-briefing',
    label: 'Deliver the operations briefing to assigned personnel',
  },
  {
    position: 'Incident Commander',
    slug: 'attend-ops-briefing',
    label: 'Attend the operations briefing and reinforce command intent',
  },
  {
    position: 'Planning Section Chief',
    slug: 'support-ops-briefing',
    label: 'Support the operations briefing with planning context and maps',
  },
  {
    position: 'Safety Officer',
    slug: 'brief-safety-message',
    label: 'Deliver the safety message during the operations briefing',
  },
  {
    position: 'Logistics Section Chief',
    slug: 'confirm-support-at-briefing',
    label: 'Confirm logistics support arrangements during the briefing',
  },
  {
    position: PLANNING_P_DEFAULT_POSITION,
    slug: 'attend-ops-briefing',
    label: 'Attend the operations briefing and confirm understanding of assignments',
  },
])

export const PLANNING_P_TASK_TEMPLATES: PlanningPTaskTemplate[] = [
  ...OBJECTIVES_MEETING_TASKS,
  ...CG_STAFF_MEETING_TASKS,
  ...PREP_TACTICS_TASKS,
  ...TACTICS_MEETING_TASKS,
  ...PREP_PLANNING_TASKS,
  ...PLANNING_MEETING_TASKS,
  ...IAP_PREP_TASKS,
  ...OPERATIONS_BRIEFING_TASKS,
]
