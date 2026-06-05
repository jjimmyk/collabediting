export type EventThresholdOperator = '>' | '>=' | '<' | '<=' | '=='

export type EventConditionJoin = 'and' | 'or'

export type EventThresholdCondition = {
  id: number
  dataInputId: string
  operator: EventThresholdOperator
  thresholdValue: string
  /** @deprecated Migrated to logicBlocks */
  joinWithPrevious?: EventConditionJoin
}

export type EventRuleConditionBlock = {
  type: 'condition'
  conditionId: number
  joinWithPrevious?: EventConditionJoin
}

export type EventRuleGroupBlock = {
  type: 'group'
  id: number
  joinWithPrevious?: EventConditionJoin
  internalJoin: EventConditionJoin
  conditionIds: number[]
}

export type EventRuleLogicBlock = EventRuleConditionBlock | EventRuleGroupBlock

export type EventCreationRuleLogic = 'all' | 'any'

export type EventCreationRule = {
  id: number
  name: string
  enabled: boolean
  logic: EventCreationRuleLogic
  conditions: EventThresholdCondition[]
  logicBlocks: EventRuleLogicBlock[]
  eventNameTemplate: string
  severity: 'High' | 'Medium' | 'Low'
  businessUnit: string
  thresholdDescription: string
  sendNotificationOnCreate: boolean
  notificationUserIds: string[]
  notificationGroupIds: string[]
}

export type EventDataInput = {
  id: string
  label: string
  unit: string
  description: string
}

export type AddEventRuleConditionMode = 'compound' | 'independent'

export const EVENT_THRESHOLD_OPERATORS: {
  value: EventThresholdOperator
  label: string
}[] = [
  { value: '>', label: 'is greater than' },
  { value: '>=', label: 'is greater than or equal to' },
  { value: '<', label: 'is less than' },
  { value: '<=', label: 'is less than or equal to' },
  { value: '==', label: 'equals' },
]

export const EVENT_DATA_INPUTS: EventDataInput[] = [
  {
    id: 'coastal-flood-gauge',
    label: 'Coastal flood gauge level',
    unit: 'ft',
    description: 'Mean water level above datum at coastal monitoring stations.',
  },
  {
    id: 'road-debris-index',
    label: 'Road debris accumulation index',
    unit: 'index',
    description: 'Composite score from DOT field sensors and patrol reports.',
  },
  {
    id: 'red-flag-index',
    label: 'Red Flag fire weather index',
    unit: 'index',
    description: 'NWS fire weather index for active burn conditions.',
  },
  {
    id: 'tidal-flood-stage',
    label: 'Tidal flood stage',
    unit: 'ft',
    description: 'Observed tide height relative to minor flood stage.',
  },
  {
    id: 'coastal-erosion-rate',
    label: 'Coastal erosion rate',
    unit: 'ft/day',
    description: 'Daily shoreline retreat measured by USGS coastal sensors.',
  },
  {
    id: 'signal-outage-count',
    label: 'Traffic signal outage count',
    unit: 'signals',
    description: 'Number of traffic signals offline within the monitored corridor.',
  },
  {
    id: 'winter-storm-index',
    label: 'Winter storm severity index',
    unit: 'index',
    description: 'Blended NWS winter storm and ice accumulation forecast index.',
  },
  {
    id: 'air-monitoring-ppm',
    label: 'Perimeter air monitoring (PPM)',
    unit: 'ppm',
    description: 'Downwind perimeter air quality reading at hazmat support zones.',
  },
  {
    id: 'rainfall-rate',
    label: 'Hourly rainfall rate',
    unit: 'in/hr',
    description: 'Observed hourly precipitation from regional radar and gauges.',
  },
  {
    id: 'wind-gust-speed',
    label: 'Sustained wind gust speed',
    unit: 'mph',
    description: 'Peak 1-minute sustained gust across the business unit footprint.',
  },
]

export const getEventDataInputById = (dataInputId: string) =>
  EVENT_DATA_INPUTS.find((input) => input.id === dataInputId)

export const getEventRuleConditionById = (rule: EventCreationRule, conditionId: number) =>
  rule.conditions.find((condition) => condition.id === conditionId)

const getConditionJoinWithPrevious = (
  condition: EventThresholdCondition,
  conditionIndex: number,
  fallbackLogic: EventCreationRuleLogic = 'all'
): EventConditionJoin => {
  if (conditionIndex === 0) {
    return 'and'
  }

  return condition.joinWithPrevious ?? (fallbackLogic === 'any' ? 'or' : 'and')
}

const nextLogicGroupId = (logicBlocks: EventRuleLogicBlock[]) => {
  const groupIds = logicBlocks
    .filter((block): block is EventRuleGroupBlock => block.type === 'group')
    .map((block) => block.id)

  return groupIds.length > 0 ? Math.max(...groupIds) + 1 : 1
}

const sanitizeLogicBlocks = (logicBlocks: EventRuleLogicBlock[]) =>
  logicBlocks.map((block, index) =>
    index === 0 ? { ...block, joinWithPrevious: undefined } : block
  )

export const normalizeEventCreationRule = (rule: EventCreationRule): EventCreationRule => {
  if (rule.logicBlocks?.length > 0) {
    return {
      ...rule,
      logicBlocks: sanitizeLogicBlocks(rule.logicBlocks),
    }
  }

  if (rule.conditions.length === 0) {
    return { ...rule, logicBlocks: [] }
  }

  const logicBlocks: EventRuleLogicBlock[] = rule.conditions.map((condition, index) => ({
    type: 'condition',
    conditionId: condition.id,
    joinWithPrevious:
      index > 0 ? getConditionJoinWithPrevious(condition, index, rule.logic) : undefined,
  }))

  return {
    ...rule,
    logicBlocks: sanitizeLogicBlocks(logicBlocks),
  }
}

export const formatEventThresholdCondition = (condition: EventThresholdCondition) => {
  const dataInput = getEventDataInputById(condition.dataInputId)
  const operatorLabel =
    EVENT_THRESHOLD_OPERATORS.find((entry) => entry.value === condition.operator)?.label ??
    condition.operator
  const unitSuffix = dataInput?.unit ? ` ${dataInput.unit}` : ''

  return `${dataInput?.label ?? condition.dataInputId} ${operatorLabel} ${condition.thresholdValue}${unitSuffix}`
}

const formatBracketedCondition = (rule: EventCreationRule, conditionId: number) => {
  const condition = getEventRuleConditionById(rule, conditionId)
  if (!condition) {
    return '[Unknown condition]'
  }

  return `[${formatEventThresholdCondition(condition)}]`
}

const formatLogicGroupBlock = (rule: EventCreationRule, block: EventRuleGroupBlock) => {
  const internalJoiner = block.internalJoin === 'or' ? ' | ' : ' AND '
  const inner = block.conditionIds
    .map((conditionId) => {
      const condition = getEventRuleConditionById(rule, conditionId)
      return condition ? formatEventThresholdCondition(condition) : 'Unknown condition'
    })
    .join(internalJoiner)

  return `[${inner}]`
}

const formatLogicBlock = (rule: EventCreationRule, block: EventRuleLogicBlock) => {
  if (block.type === 'condition') {
    return formatBracketedCondition(rule, block.conditionId)
  }

  return formatLogicGroupBlock(rule, block)
}

export const formatEventCreationRuleFormula = (rule: EventCreationRule) => {
  const normalizedRule = normalizeEventCreationRule(rule)

  if (normalizedRule.logicBlocks.length === 0) {
    return 'Add at least one condition.'
  }

  return normalizedRule.logicBlocks
    .map((block, index) => {
      const text = formatLogicBlock(normalizedRule, block)
      if (index === 0) {
        return text
      }

      const join = block.joinWithPrevious ?? 'and'
      return `${join === 'and' ? ' AND ' : ' OR '}${text}`
    })
    .join('')
}

export const deriveEventCreationRuleLogic = (rule: EventCreationRule): EventCreationRuleLogic => {
  const normalizedRule = normalizeEventCreationRule(rule)
  const topLevelJoins = normalizedRule.logicBlocks
    .slice(1)
    .map((block) => block.joinWithPrevious ?? 'and')

  if (topLevelJoins.length === 0) {
    const onlyBlock = normalizedRule.logicBlocks[0]
    if (onlyBlock?.type === 'group') {
      return onlyBlock.internalJoin === 'or' ? 'any' : 'all'
    }
    return 'all'
  }

  if (topLevelJoins.every((join) => join === 'and')) {
    return 'all'
  }

  if (topLevelJoins.every((join) => join === 'or')) {
    return 'any'
  }

  return 'any'
}

export const formatEventCreationRuleNaturalLanguageSummary = (rule: EventCreationRule) => {
  const normalizedRule = normalizeEventCreationRule(rule)
  const hasCompleteConditions = normalizedRule.conditions.every(
    (condition) => condition.thresholdValue.trim().length > 0
  )

  if (normalizedRule.conditions.length === 0 || !hasCompleteConditions) {
    return 'Complete the threshold conditions to generate an automated event.'
  }

  const businessUnit = normalizedRule.businessUnit.trim() || 'the selected business unit'
  const eventName = normalizedRule.eventNameTemplate.replace('{businessUnit}', businessUnit)
  const formula = formatEventCreationRuleFormula(normalizedRule)

  return `Automatically create a ${normalizedRule.severity.toLowerCase()} severity event "${eventName}" for ${businessUnit} when ${formula.toLowerCase()}.`
}

export const getEventCreationRuleSearchText = (rule: EventCreationRule) => {
  const normalizedRule = normalizeEventCreationRule(rule)

  return [
    normalizedRule.name,
    normalizedRule.businessUnit,
    normalizedRule.thresholdDescription,
    normalizedRule.eventNameTemplate,
    normalizedRule.severity,
    normalizedRule.enabled ? 'active enabled' : 'disabled',
    normalizedRule.logic === 'all' ? 'and logic' : 'or logic',
    'compound independent group',
    formatEventCreationRuleFormula(normalizedRule),
    formatEventCreationRuleNaturalLanguageSummary(normalizedRule),
    normalizedRule.sendNotificationOnCreate ? 'send notification notify' : 'no notification',
    ...normalizedRule.notificationUserIds,
    ...normalizedRule.notificationGroupIds,
    ...normalizedRule.logicBlocks.flatMap((block) =>
      block.type === 'group'
        ? [block.internalJoin, String(block.id), 'group compound']
        : ['condition independent']
    ),
    ...normalizedRule.conditions.flatMap((condition) => {
      const dataInput = getEventDataInputById(condition.dataInputId)
      return [
        condition.dataInputId,
        dataInput?.label ?? '',
        dataInput?.description ?? '',
        condition.operator,
        condition.thresholdValue,
        dataInput?.unit ?? '',
      ]
    }),
  ]
    .join(' ')
    .toLowerCase()
}

export const buildEventRuleGenerationPrompt = (businessUnitOptions: string[]) => {
  const dataInputList = EVENT_DATA_INPUTS.map(
    (input) => `- ${input.label} (${input.unit}): ${input.description}`
  ).join('\n')
  const businessUnits =
    businessUnitOptions.length > 0
      ? businessUnitOptions.join('; ')
      : 'available business units in the hub'

  return `Help me create an automated event creation rule for British Petroleum emergency operations.

I need a rule that auto-creates an event when monitored data crosses defined thresholds. Please propose a complete rule including:
1. One or more conditions (data input, operator, threshold value)
2. Logic: compound groups using AND/OR, e.g. [condition A] AND [condition B | condition C]
3. Event name template, severity (High/Medium/Low), business unit, and threshold description

Available monitored data inputs:
${dataInputList}

Available business units: ${businessUnits}

Respond with a clear natural-language summary of the rule logic, then list each field in a structured format I can enter into the Events Settings formula builder.`
}

export const DEFAULT_EVENT_CREATION_RULES: EventCreationRule[] = [
  {
    id: 1,
    name: 'Coastal flood watch',
    enabled: true,
    logic: 'all',
    conditions: [
      {
        id: 1,
        dataInputId: 'coastal-flood-gauge',
        operator: '>=',
        thresholdValue: '2.5',
      },
    ],
    logicBlocks: [{ type: 'condition', conditionId: 1 }],
    eventNameTemplate: 'Coastal Flood Watch — {businessUnit}',
    severity: 'Medium',
    businessUnit: 'BP Business Unit — Southeast',
    thresholdDescription: 'Coastal flood watch threshold reached for BP Business Unit — Southeast',
    sendNotificationOnCreate: true,
    notificationUserIds: ['user-rivera', 'user-chen'],
    notificationGroupIds: ['group-r4-watch'],
  },
  {
    id: 2,
    name: 'Road debris corridor alert',
    enabled: true,
    logic: 'any',
    conditions: [
      {
        id: 2,
        dataInputId: 'road-debris-index',
        operator: '>=',
        thresholdValue: '7',
      },
      {
        id: 3,
        dataInputId: 'rainfall-rate',
        operator: '>',
        thresholdValue: '2.0',
      },
    ],
    logicBlocks: [
      {
        type: 'group',
        id: 1,
        internalJoin: 'or',
        conditionIds: [2, 3],
      },
    ],
    eventNameTemplate: 'Road Debris Accumulation — {businessUnit}',
    severity: 'Medium',
    businessUnit: 'BP Business Unit — Southeast',
    thresholdDescription: 'Roadway debris accumulation threshold reached on I-95 corridor',
    sendNotificationOnCreate: true,
    notificationUserIds: ['user-park'],
    notificationGroupIds: ['group-dot-tmc', 'group-esf-1'],
  },
  {
    id: 3,
    name: 'Red Flag fire weather',
    enabled: false,
    logic: 'all',
    conditions: [
      {
        id: 4,
        dataInputId: 'red-flag-index',
        operator: '>=',
        thresholdValue: '65',
      },
      {
        id: 5,
        dataInputId: 'wind-gust-speed',
        operator: '>',
        thresholdValue: '35',
      },
    ],
    logicBlocks: [
      { type: 'condition', conditionId: 4 },
      { type: 'condition', conditionId: 5, joinWithPrevious: 'and' },
    ],
    eventNameTemplate: 'Red Flag Warning — {businessUnit}',
    severity: 'High',
    businessUnit: 'BP Business Unit — Pacific',
    thresholdDescription: 'Red Flag fire weather index threshold exceeded for Ventura Unit',
    sendNotificationOnCreate: false,
    notificationUserIds: [],
    notificationGroupIds: [],
  },
]

export const createEventThresholdCondition = (
  existingConditions: EventThresholdCondition[]
): EventThresholdCondition => ({
  id:
    existingConditions.length > 0
      ? Math.max(...existingConditions.map((condition) => condition.id)) + 1
      : 1,
  dataInputId: EVENT_DATA_INPUTS[0]?.id ?? 'coastal-flood-gauge',
  operator: '>=',
  thresholdValue: '',
})

export const createEventCreationRule = (existingRules: EventCreationRule[]): EventCreationRule => {
  const firstCondition = createEventThresholdCondition([])

  return {
    id: existingRules.length > 0 ? Math.max(...existingRules.map((rule) => rule.id)) + 1 : 1,
    name: 'New event rule',
    enabled: true,
    logic: 'all',
    conditions: [firstCondition],
    logicBlocks: [{ type: 'condition', conditionId: firstCondition.id }],
    eventNameTemplate: 'Threshold Event — {businessUnit}',
    severity: 'Medium',
    businessUnit: '',
    thresholdDescription: '',
    sendNotificationOnCreate: true,
    notificationUserIds: [],
    notificationGroupIds: [],
  }
}

export const addEventRuleCondition = (
  rule: EventCreationRule,
  options: {
    mode: AddEventRuleConditionMode
    join: EventConditionJoin
  }
): EventCreationRule => {
  const normalizedRule = normalizeEventCreationRule(rule)
  const newCondition = createEventThresholdCondition(normalizedRule.conditions)
  const conditions = [...normalizedRule.conditions, newCondition]
  let logicBlocks = [...normalizedRule.logicBlocks]

  if (logicBlocks.length === 0) {
    return {
      ...normalizedRule,
      conditions,
      logicBlocks: [{ type: 'condition', conditionId: newCondition.id }],
    }
  }

  const lastBlockIndex = logicBlocks.length - 1
  const lastBlock = logicBlocks[lastBlockIndex]

  if (options.mode === 'independent') {
    logicBlocks.push({
      type: 'condition',
      conditionId: newCondition.id,
      joinWithPrevious: options.join,
    })

    return {
      ...normalizedRule,
      conditions,
      logicBlocks: sanitizeLogicBlocks(logicBlocks),
      logic: deriveEventCreationRuleLogic({ ...normalizedRule, conditions, logicBlocks }),
    }
  }

  if (lastBlock.type === 'group') {
    logicBlocks[lastBlockIndex] = {
      ...lastBlock,
      internalJoin: options.join,
      conditionIds: [...lastBlock.conditionIds, newCondition.id],
    }
  } else {
    logicBlocks[lastBlockIndex] = {
      type: 'group',
      id: nextLogicGroupId(logicBlocks),
      joinWithPrevious: lastBlock.joinWithPrevious,
      internalJoin: options.join,
      conditionIds: [lastBlock.conditionId, newCondition.id],
    }
  }

  return {
    ...normalizedRule,
    conditions,
    logicBlocks: sanitizeLogicBlocks(logicBlocks),
    logic: deriveEventCreationRuleLogic({ ...normalizedRule, conditions, logicBlocks }),
  }
}

export const removeEventRuleCondition = (
  rule: EventCreationRule,
  conditionId: number
): EventCreationRule => {
  const normalizedRule = normalizeEventCreationRule(rule)

  if (normalizedRule.conditions.length <= 1) {
    return normalizedRule
  }

  const conditions = normalizedRule.conditions.filter((condition) => condition.id !== conditionId)
  const logicBlocks = sanitizeLogicBlocks(
    normalizedRule.logicBlocks.flatMap((block): EventRuleLogicBlock[] => {
      if (block.type === 'condition') {
        if (block.conditionId === conditionId) {
          return []
        }
        return [block]
      }

      if (!block.conditionIds.includes(conditionId)) {
        return [block]
      }

      const remainingIds = block.conditionIds.filter((id) => id !== conditionId)
      if (remainingIds.length === 0) {
        return []
      }

      if (remainingIds.length === 1) {
        return [
          {
            type: 'condition' as const,
            conditionId: remainingIds[0],
            joinWithPrevious: block.joinWithPrevious,
          },
        ]
      }

      return [{ ...block, conditionIds: remainingIds }]
    })
  )

  return {
    ...normalizedRule,
    conditions,
    logicBlocks,
    logic: deriveEventCreationRuleLogic({ ...normalizedRule, conditions, logicBlocks }),
  }
}

export const updateEventRuleLogicBlockJoin = (
  rule: EventCreationRule,
  blockIndex: number,
  join: EventConditionJoin
): EventCreationRule => {
  const normalizedRule = normalizeEventCreationRule(rule)
  const logicBlocks = normalizedRule.logicBlocks.map((block, index) =>
    index === blockIndex ? { ...block, joinWithPrevious: join } : block
  )

  return {
    ...normalizedRule,
    logicBlocks: sanitizeLogicBlocks(logicBlocks),
    logic: deriveEventCreationRuleLogic({ ...normalizedRule, logicBlocks }),
  }
}

export const updateEventRuleGroupInternalJoin = (
  rule: EventCreationRule,
  groupId: number,
  join: EventConditionJoin
): EventCreationRule => {
  const normalizedRule = normalizeEventCreationRule(rule)
  const logicBlocks = normalizedRule.logicBlocks.map((block) =>
    block.type === 'group' && block.id === groupId ? { ...block, internalJoin: join } : block
  )

  return {
    ...normalizedRule,
    logicBlocks,
    logic: deriveEventCreationRuleLogic({ ...normalizedRule, logicBlocks }),
  }
}

export const updateEventRuleCondition = (
  rule: EventCreationRule,
  conditionId: number,
  updater: (condition: EventThresholdCondition) => EventThresholdCondition
): EventCreationRule => {
  const normalizedRule = normalizeEventCreationRule(rule)

  return {
    ...normalizedRule,
    conditions: normalizedRule.conditions.map((condition) =>
      condition.id === conditionId ? updater(condition) : condition
    ),
  }
}
