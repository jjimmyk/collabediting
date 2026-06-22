export type ProductTourId = 'the-hub' | 'workspace'

export type ProductTourOption = {
  id: ProductTourId
  label: string
  disabled: boolean
  disabledReason?: string
}

export function getProductTourOptions(params: {
  isOnHub: boolean
  isInWorkspace: boolean
  isUscgInitialResponse?: boolean
}): ProductTourOption[] {
  const { isOnHub, isInWorkspace, isUscgInitialResponse = false } = params

  return [
    {
      id: 'the-hub',
      label: 'The Hub',
      disabled: !isOnHub,
      disabledReason: isInWorkspace
        ? 'Return to The Hub home to start this tour.'
        : undefined,
    },
    {
      id: 'workspace',
      label: isUscgInitialResponse ? 'USCG ICS Workspace Tour' : 'Workspace Tour',
      disabled: !isInWorkspace,
      disabledReason: !isInWorkspace
        ? 'Open an incident or exercise workspace to start this tour.'
        : undefined,
    },
  ]
}
