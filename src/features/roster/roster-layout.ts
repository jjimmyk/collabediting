export type RosterPanelLayoutMode = 'wide' | 'medium' | 'compact'

export function rosterGridClassName(layoutMode: RosterPanelLayoutMode): string {
  switch (layoutMode) {
    case 'compact':
      return 'grid grid-cols-1 gap-2 pt-px'
    case 'medium':
      return 'grid grid-cols-1 gap-2 pt-px sm:grid-cols-2'
    default:
      return 'grid gap-2 pt-px sm:grid-cols-2 xl:grid-cols-3'
  }
}

export function rosterOrgSectionColumnsClassName(layoutMode: RosterPanelLayoutMode): string {
  switch (layoutMode) {
    case 'compact':
      return 'grid-cols-1'
    case 'medium':
      return 'grid-cols-2'
    default:
      return 'grid-cols-5'
  }
}

export function rosterOrgCommandStaffClassName(layoutMode: RosterPanelLayoutMode): string {
  switch (layoutMode) {
    case 'compact':
      return 'flex w-full min-w-0 flex-col items-stretch gap-2'
    case 'medium':
      return 'grid w-full min-w-0 grid-cols-2 gap-x-6 gap-y-2 justify-items-center'
    default:
      return 'grid w-full min-w-0 grid-cols-2 gap-x-10 gap-y-2 justify-items-center'
  }
}

export function rosterOrgCommandStaffCrossbarClassName(layoutMode: RosterPanelLayoutMode): string {
  switch (layoutMode) {
    case 'compact':
      return 'grid-cols-1'
    case 'medium':
      return 'grid-cols-2'
    default:
      return 'grid-cols-4'
  }
}

/** @deprecated Use rosterOrgSectionColumnsClassName with OrgChartCrossbarColumns */
export function rosterOrgBranchClassName(layoutMode: RosterPanelLayoutMode): string {
  switch (layoutMode) {
    case 'compact':
      return 'flex w-full min-w-0 flex-col items-stretch gap-4'
    case 'medium':
      return 'grid w-full min-w-0 grid-cols-1 gap-4 sm:grid-cols-2'
    default:
      return 'grid w-full min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5'
  }
}
