import { WORKSPACE_ROSTER_POSITIONS } from '@/lib/ics-positions'
import {
  getDefaultRosterTemplate,
  getRosterTemplateBySlug,
} from '@/features/roster/roster-template-catalog'
import type {
  BuildTeamDraftCustomPosition,
  BuildTeamDraftMember,
  BuildTeamRosterDraft,
  RosterTemplateEffectTiming,
} from '@/features/roster/roster-template-types'
import { DEFAULT_NEW_CUSTOM_POSITION_TYPE } from '@/features/roster/workspace-position-type'
import { inferDefaultPositionType } from '@/features/roster/workspace-position-type'
import { emptyWorkspacePositionCatalog } from '@/features/roster/workspace-positions'

const INCIDENT_COMMANDER_POSITION = 'Incident Commander'

export function isCreatorIncidentCommanderDraftMember(member: BuildTeamDraftMember): boolean {
  return (
    member.assignmentKind === 'ics_position' &&
    member.icsPositions.includes(INCIDENT_COMMANDER_POSITION) &&
    member.status === 'active'
  )
}

export function ensureCreatorInBuildTeamDraft(
  draft: BuildTeamRosterDraft,
  creator: { email: string; userId: string | null }
): BuildTeamRosterDraft {
  const normalizedEmail = creator.email.trim().toLowerCase()
  if (!normalizedEmail) {
    return draft
  }

  const withoutCreator = draft.draftMembers.filter(
    (member) => member.email.trim().toLowerCase() !== normalizedEmail
  )

  const creatorMember: BuildTeamDraftMember = {
    id: `draft-member-creator-${normalizedEmail.replace(/[^a-z0-9]+/g, '-')}`,
    email: creator.email.trim(),
    assignmentKind: 'ics_position',
    icsPositions: [INCIDENT_COMMANDER_POSITION],
    orgChartReportsTo: null,
    password: '',
    personSource: creator.userId ? 'add_existing' : 'invite_new',
    existingUserId: creator.userId,
    status: 'active',
  }

  return {
    ...draft,
    draftMembers: [creatorMember, ...withoutCreator],
  }
}

export function createDefaultBuildTeamRosterDraft(): BuildTeamRosterDraft {
  return createBuildTeamRosterDraftFromTemplate(getDefaultRosterTemplate().slug, 'immediate')
}

export function createBuildTeamRosterDraftFromTemplate(
  templateSlug: string,
  effectTiming: RosterTemplateEffectTiming = 'immediate'
): BuildTeamRosterDraft {
  const template = getRosterTemplateBySlug(templateSlug) ?? getDefaultRosterTemplate()
  const visible = new Set(template.definition.positions)
  const archivedStandardPositions = WORKSPACE_ROSTER_POSITIONS.filter(
    (position) => !visible.has(position)
  )
  const catalog = emptyWorkspacePositionCatalog()
  const positionSettings: BuildTeamRosterDraft['positionSettings'] = {}

  for (const position of template.definition.positions) {
    positionSettings[position] = {
      positionType: inferDefaultPositionType(position, catalog),
      customTypeLabel: null,
      allowWorkAssignment: true,
    }
  }

  return {
    templateSlug: template.slug,
    effectTiming,
    visibleStandardPositions: [...template.definition.positions],
    archivedStandardPositions,
    customPositions: [],
    singleResourceSlots: [...template.definition.singleResourceSlots],
    draftMembers: [],
    positionSettings,
  }
}

function preserveCreatorDraftMembers(draft: BuildTeamRosterDraft): BuildTeamDraftMember[] {
  return draft.draftMembers.filter(isCreatorIncidentCommanderDraftMember)
}

export function applyTemplateToBuildTeamDraft(
  draft: BuildTeamRosterDraft,
  templateSlug: string,
  preserveUserEdits: boolean
): BuildTeamRosterDraft {
  const next = createBuildTeamRosterDraftFromTemplate(templateSlug, 'immediate')
  const creatorMembers = preserveCreatorDraftMembers(draft)

  if (!preserveUserEdits) {
    return {
      ...next,
      draftMembers: creatorMembers,
    }
  }

  return {
    ...next,
    customPositions: draft.customPositions,
    draftMembers: draft.draftMembers,
    positionSettings: {
      ...next.positionSettings,
      ...draft.positionSettings,
    },
  }
}

export function addDraftCustomPosition(
  draft: BuildTeamRosterDraft,
  input: Pick<BuildTeamDraftCustomPosition, 'name' | 'reportsTo' | 'positionType' | 'customTypeLabel'>
): BuildTeamRosterDraft {
  const customPosition: BuildTeamDraftCustomPosition = {
    id: `draft-custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: input.name.trim(),
    reportsTo: input.reportsTo,
    positionType: input.positionType,
    customTypeLabel: input.customTypeLabel,
  }

  return {
    ...draft,
    customPositions: [...draft.customPositions, customPosition],
    positionSettings: {
      ...draft.positionSettings,
      [customPosition.name]: {
        positionType: customPosition.positionType,
        customTypeLabel: customPosition.customTypeLabel,
        allowWorkAssignment: false,
      },
    },
  }
}

export function updateDraftCustomPosition(
  draft: BuildTeamRosterDraft,
  positionId: string,
  input: { name?: string; reportsTo?: string }
): BuildTeamRosterDraft {
  const target = draft.customPositions.find((position) => position.id === positionId)
  if (!target) {
    return draft
  }

  const nextName = input.name?.trim() ?? target.name
  const nextReportsTo = input.reportsTo ?? target.reportsTo
  const oldName = target.name

  let customPositions = draft.customPositions.map((position) =>
    position.id === positionId
      ? { ...position, name: nextName, reportsTo: nextReportsTo }
      : position
  )

  if (oldName !== nextName) {
    customPositions = customPositions.map((position) =>
      position.reportsTo === oldName ? { ...position, reportsTo: nextName } : position
    )
  }

  const positionSettings = { ...draft.positionSettings }
  if (oldName !== nextName && positionSettings[oldName]) {
    positionSettings[nextName] = positionSettings[oldName]
    delete positionSettings[oldName]
  }

  const draftMembers = draft.draftMembers.map((member) => {
    let nextMember = member
    if (member.orgChartReportsTo === oldName) {
      nextMember = { ...nextMember, orgChartReportsTo: nextName }
    }
    if (oldName !== nextName && member.icsPositions.includes(oldName)) {
      nextMember = {
        ...nextMember,
        icsPositions: member.icsPositions.map((position) =>
          position === oldName ? nextName : position
        ),
      }
    }
    return nextMember
  })

  return {
    ...draft,
    customPositions,
    positionSettings,
    draftMembers,
  }
}

export function addDraftMember(
  draft: BuildTeamRosterDraft,
  member: Omit<BuildTeamDraftMember, 'id'>
): BuildTeamRosterDraft {
  const nextMember: BuildTeamDraftMember = {
    ...member,
    id: `draft-member-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  }

  return {
    ...draft,
    draftMembers: [...draft.draftMembers, nextMember],
  }
}

export function removeDraftMember(draft: BuildTeamRosterDraft, memberId: string): BuildTeamRosterDraft {
  return {
    ...draft,
    draftMembers: draft.draftMembers.filter((member) => member.id !== memberId),
  }
}

export function normalizeBuildTeamRosterDraftForApply(
  draft: BuildTeamRosterDraft
): BuildTeamRosterDraft {
  return draft.effectTiming === 'immediate' ? draft : { ...draft, effectTiming: 'immediate' }
}

export function createDraftCustomPositionDefaults(): Pick<
  BuildTeamDraftCustomPosition,
  'positionType' | 'customTypeLabel'
> {
  return {
    positionType: DEFAULT_NEW_CUSTOM_POSITION_TYPE,
    customTypeLabel: null,
  }
}

export function hasNonCreatorBuildTeamDraftEdits(draft: BuildTeamRosterDraft): boolean {
  if (draft.customPositions.length > 0) {
    return true
  }

  return draft.draftMembers.some((member) => !isCreatorIncidentCommanderDraftMember(member))
}
