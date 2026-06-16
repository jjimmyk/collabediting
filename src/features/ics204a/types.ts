export type Ics204aOtherAttachments = {
  mapChart: string
  weatherForecast: string
  tidesCurrents: string
  notes: string
}

export type Ics204aFormState = {
  incidentName: string
  incidentLocation: string
  operationalPeriodFrom: string
  operationalPeriodTo: string
  branch: string
  divisionGroup: string
  resourceIdentifier: string
  leader: string
  assignmentLocation: string
  workAssignmentSpecialInstructions: string
  siteSafetyPlanLocation: string
  otherAttachments: Ics204aOtherAttachments
  preparedByName: string
  preparedByDateTime: string
  reviewedByPscName: string
  reviewedByPscDateTime: string
  reviewedByOscIscName: string
  reviewedByOscIscDateTime: string
}

export type Ics204aBuildContext = {
  incidentName?: string
  incidentLocation?: string
  operationalPeriodFrom?: string
  operationalPeriodTo?: string
  preparedByName?: string
}
