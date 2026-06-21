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

export function applyTemplateToBuildTeamDraft(
  draft: BuildTeamRosterDraft,
  templateSlug: string,
  preserveUserEdits: boolean
): BuildTeamRosterDraft {
  const next = createBuildTeamRosterDraftFromTemplate(templateSlug, draft.effectTiming)
  if (!preserveUserEdits) {
    return next
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

export function setDraftEffectTiming(
  draft: BuildTeamRosterDraft,
  effectTiming: RosterTemplateEffectTiming
): BuildTeamRosterDraft {
  return { ...draft, effectTiming }
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
