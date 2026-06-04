export type NotificationThresholdOperator = '>' | '>=' | '<' | '<=' | '=='

export type NotificationConditionJoin = 'and' | 'or'

export type NotificationThresholdCondition = {
  id: number
  dataInputId: string
  operator: NotificationThresholdOperator
  thresholdValue: string
  /** @deprecated Migrated to logicBlocks */
  joinWithPrevious?: NotificationConditionJoin
}

export type NotificationRuleConditionBlock = {
  type: 'condition'
  conditionId: number
  joinWithPrevious?: NotificationConditionJoin
}

export type NotificationRuleGroupBlock = {
  type: 'group'
  id: number
  joinWithPrevious?: NotificationConditionJoin
  internalJoin: NotificationConditionJoin
  conditionIds: number[]
}

export type NotificationRuleLogicBlock = NotificationRuleConditionBlock | NotificationRuleGroupBlock

export type NotificationCreationRuleLogic = 'all' | 'any'

export type NotificationCreationRule = {
  id: number
  name: string
  enabled: boolean
  logic: NotificationCreationRuleLogic
  conditions: NotificationThresholdCondition[]
  logicBlocks: NotificationRuleLogicBlock[]
  notificationTitleTemplate: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  category: string
  thresholdDescription: string
  sendNotificationOnCreate: boolean
  notificationUserIds: string[]
  notificationGroupIds: string[]
}

export type NotificationDataInput = {
  id: string
  label: string
  unit: string
  description: string
}

export type AddNotificationRuleConditionMode = 'compound' | 'independent'

export const NOTIFICATION_THRESHOLD_OPERATORS: {
  value: NotificationThresholdOperator
  label: string
}[] = [
  { value: '>', label: 'is greater than' },
  { value: '>=', label: 'is greater than or equal to' },
  { value: '<', label: 'is less than' },
  { value: '<=', label: 'is less than or equal to' },
  { value: '==', label: 'equals' },
]

export const NOTIFICATION_DATA_INPUTS: NotificationDataInput[] = [
  {
    id: 'customers-without-power',
    label: 'Customers without power',
    unit: 'customers',
    description: 'Estimated customer accounts offline within the monitored service area.',
  },
  {
    id: 'feeder-offline-count',
    label: 'Feeder offline count',
    unit: 'feeders',
    description: 'Number of distribution feeders reported offline by utility SCADA.',
  },
  {
    id: 'road-closure-count',
    label: 'Active road closure count',
    unit: 'closures',
    description: 'DOT-reported full or partial roadway closures in the corridor.',
  },
  {
    id: 'traffic-delay-minutes',
    label: 'Average traffic delay',
    unit: 'minutes',
    description: 'Mean travel-time delay across monitored corridor segments.',
  },
  {
    id: 'shelter-occupancy-percent',
    label: 'Shelter occupancy rate',
    unit: '%',
    description: 'Current shelter capacity utilization across assigned mass-care sites.',
  },
  {
    id: 'signal-outage-count',
    label: 'Traffic signal outage count',
    unit: 'signals',
    description: 'Number of traffic signals offline within the monitored corridor.',
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
    description: 'Peak 1-minute sustained gust across the monitored footprint.',
  },
  {
    id: 'air-monitoring-ppm',
    label: 'Perimeter air monitoring (PPM)',
    unit: 'ppm',
    description: 'Downwind perimeter air quality reading at hazmat support zones.',
  },
  {
    id: 'winter-storm-index',
    label: 'Winter storm severity index',
    unit: 'index',
    description: 'Blended NWS winter storm and ice accumulation forecast index.',
  },
]

export const getNotificationDataInputById = (dataInputId: string) =>
  NOTIFICATION_DATA_INPUTS.find((input) => input.id === dataInputId)

export const getNotificationRuleConditionById = (rule: NotificationCreationRule, conditionId: number) =>
  rule.conditions.find((condition) => condition.id === conditionId)

const getConditionJoinWithPrevious = (
  condition: NotificationThresholdCondition,
  conditionIndex: number,
  fallbackLogic: NotificationCreationRuleLogic = 'all'
): NotificationConditionJoin => {
  if (conditionIndex === 0) {
    return 'and'
  }

  return condition.joinWithPrevious ?? (fallbackLogic === 'any' ? 'or' : 'and')
}

const nextLogicGroupId = (logicBlocks: NotificationRuleLogicBlock[]) => {
  const groupIds = logicBlocks
    .filter((block): block is NotificationRuleGroupBlock => block.type === 'group')
    .map((block) => block.id)

  return groupIds.length > 0 ? Math.max(...groupIds) + 1 : 1
}

const sanitizeLogicBlocks = (logicBlocks: NotificationRuleLogicBlock[]) =>
  logicBlocks.map((block, index) =>
    index === 0 ? { ...block, joinWithPrevious: undefined } : block
  )

export const normalizeNotificationCreationRule = (rule: NotificationCreationRule): NotificationCreationRule => {
  if (rule.logicBlocks?.length > 0) {
    return {
      ...rule,
      logicBlocks: sanitizeLogicBlocks(rule.logicBlocks),
    }
  }

  if (rule.conditions.length === 0) {
    return { ...rule, logicBlocks: [] }
  }

  const logicBlocks: NotificationRuleLogicBlock[] = rule.conditions.map((condition, index) => ({
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

export const formatNotificationThresholdCondition = (condition: NotificationThresholdCondition) => {
  const dataInput = getNotificationDataInputById(condition.dataInputId)
  const operatorLabel =
    NOTIFICATION_THRESHOLD_OPERATORS.find((entry) => entry.value === condition.operator)?.label ??
    condition.operator
  const unitSuffix = dataInput?.unit ? ` ${dataInput.unit}` : ''

  return `${dataInput?.label ?? condition.dataInputId} ${operatorLabel} ${condition.thresholdValue}${unitSuffix}`
}

const formatBracketedCondition = (rule: NotificationCreationRule, conditionId: number) => {
  const condition = getNotificationRuleConditionById(rule, conditionId)
  if (!condition) {
    return '[Unknown condition]'
  }

  return `[${formatNotificationThresholdCondition(condition)}]`
}

const formatLogicGroupBlock = (rule: NotificationCreationRule, block: NotificationRuleGroupBlock) => {
  const internalJoiner = block.internalJoin === 'or' ? ' | ' : ' AND '
  const inner = block.conditionIds
    .map((conditionId) => {
      const condition = getNotificationRuleConditionById(rule, conditionId)
      return condition ? formatNotificationThresholdCondition(condition) : 'Unknown condition'
    })
    .join(internalJoiner)

  return `[${inner}]`
}

const formatLogicBlock = (rule: NotificationCreationRule, block: NotificationRuleLogicBlock) => {
  if (block.type === 'condition') {
    return formatBracketedCondition(rule, block.conditionId)
  }

  return formatLogicGroupBlock(rule, block)
}

export const formatNotificationCreationRuleFormula = (rule: NotificationCreationRule) => {
  const normalizedRule = normalizeNotificationCreationRule(rule)

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

export const deriveNotificationCreationRuleLogic = (rule: NotificationCreationRule): NotificationCreationRuleLogic => {
  const normalizedRule = normalizeNotificationCreationRule(rule)
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

export const formatNotificationCreationRuleNaturalLanguageSummary = (rule: NotificationCreationRule) => {
  const normalizedRule = normalizeNotificationCreationRule(rule)
  const hasCompleteConditions = normalizedRule.conditions.every(
    (condition) => condition.thresholdValue.trim().length > 0
  )

  if (normalizedRule.conditions.length === 0 || !hasCompleteConditions) {
    return 'Complete the threshold conditions to generate an automated notification.'
  }

  const category = normalizedRule.category.trim() || 'the selected category'
  const notificationTitle = normalizedRule.notificationTitleTemplate.replace('{category}', category)
  const formula = formatNotificationCreationRuleFormula(normalizedRule)

  return `Automatically send a ${normalizedRule.severity.toLowerCase()} severity notification "${notificationTitle}" for ${category} when ${formula.toLowerCase()}.`
}

export const getNotificationCreationRuleSearchText = (rule: NotificationCreationRule) => {
  const normalizedRule = normalizeNotificationCreationRule(rule)

  return [
    normalizedRule.name,
    normalizedRule.category,
    normalizedRule.thresholdDescription,
    normalizedRule.notificationTitleTemplate,
    normalizedRule.severity,
    normalizedRule.enabled ? 'active enabled' : 'disabled',
    normalizedRule.logic === 'all' ? 'and logic' : 'or logic',
    'compound independent group',
    formatNotificationCreationRuleFormula(normalizedRule),
    formatNotificationCreationRuleNaturalLanguageSummary(normalizedRule),
    normalizedRule.sendNotificationOnCreate ? 'send notification notify' : 'no notification',
    ...normalizedRule.notificationUserIds,
    ...normalizedRule.notificationGroupIds,
    ...normalizedRule.logicBlocks.flatMap((block) =>
      block.type === 'group'
        ? [block.internalJoin, String(block.id), 'group compound']
        : ['condition independent']
    ),
    ...normalizedRule.conditions.flatMap((condition) => {
      const dataInput = getNotificationDataInputById(condition.dataInputId)
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

export const buildNotificationRuleGenerationPrompt = (categoryOptions: string[]) => {
  const dataInputList = NOTIFICATION_DATA_INPUTS.map(
    (input) => `- ${input.label} (${input.unit}): ${input.description}`
  ).join('\n')
  const categories =
    categoryOptions.length > 0
      ? categoryOptions.join('; ')
      : 'available notification categories in the hub'

  return `Help me create an automated notification rule for British Petroleum emergency operations.

I need a rule that auto-sends a notification when monitored data crosses defined thresholds. Please propose a complete rule including:
1. One or more conditions (data input, operator, threshold value)
2. Logic: compound groups using AND/OR, e.g. [condition A] AND [condition B | condition C]
3. Notification title template, severity (Critical/High/Medium/Low), category, and threshold description

Available monitored data inputs:
${dataInputList}

Available categories: ${categories}

Respond with a clear natural-language summary of the rule logic, then list each field in a structured format I can enter into the Notification Settings formula builder.`
}

export const DEFAULT_NOTIFICATION_CREATION_RULES: NotificationCreationRule[] = [
  {
    id: 1,
    name: 'Power outage threshold',
    enabled: true,
    logic: 'all',
    conditions: [
      {
        id: 1,
        dataInputId: 'customers-without-power',
        operator: '>=',
        thresholdValue: '15000',
      },
    ],
    logicBlocks: [{ type: 'condition', conditionId: 1 }],
    notificationTitleTemplate: 'Power Outage Alert — {category}',
    severity: 'Critical',
    category: 'Power',
    thresholdDescription: 'Customer outage count exceeded dispatch threshold',
    sendNotificationOnCreate: true,
    notificationUserIds: ['user-rivera', 'user-chen'],
    notificationGroupIds: ['group-r4-watch'],
  },
  {
    id: 2,
    name: 'Transport corridor disruption',
    enabled: true,
    logic: 'any',
    conditions: [
      {
        id: 2,
        dataInputId: 'road-closure-count',
        operator: '>=',
        thresholdValue: '3',
      },
      {
        id: 3,
        dataInputId: 'traffic-delay-minutes',
        operator: '>',
        thresholdValue: '30',
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
    notificationTitleTemplate: 'Transport Disruption — {category}',
    severity: 'High',
    category: 'Transport',
    thresholdDescription: 'Corridor closure or delay threshold reached',
    sendNotificationOnCreate: true,
    notificationUserIds: ['user-park'],
    notificationGroupIds: ['group-dot-tmc', 'group-esf-1'],
  },
  {
    id: 3,
    name: 'Shelter capacity warning',
    enabled: false,
    logic: 'all',
    conditions: [
      {
        id: 4,
        dataInputId: 'shelter-occupancy-percent',
        operator: '>=',
        thresholdValue: '85',
      },
      {
        id: 5,
        dataInputId: 'rainfall-rate',
        operator: '>',
        thresholdValue: '1.5',
      },
    ],
    logicBlocks: [
      { type: 'condition', conditionId: 4 },
      { type: 'condition', conditionId: 5, joinWithPrevious: 'and' },
    ],
    notificationTitleTemplate: 'Shelter Capacity Warning — {category}',
    severity: 'Medium',
    category: 'Shelter',
    thresholdDescription: 'Shelter occupancy threshold exceeded during active weather',
    sendNotificationOnCreate: false,
    notificationUserIds: [],
    notificationGroupIds: [],
  },
]

export const createNotificationThresholdCondition = (
  existingConditions: NotificationThresholdCondition[]
): NotificationThresholdCondition => ({
  id:
    existingConditions.length > 0
      ? Math.max(...existingConditions.map((condition) => condition.id)) + 1
      : 1,
  dataInputId: NOTIFICATION_DATA_INPUTS[0]?.id ?? 'customers-without-power',
  operator: '>=',
  thresholdValue: '',
})

export const createNotificationCreationRule = (existingRules: NotificationCreationRule[]): NotificationCreationRule => {
  const firstCondition = createNotificationThresholdCondition([])

  return {
    id: existingRules.length > 0 ? Math.max(...existingRules.map((rule) => rule.id)) + 1 : 1,
    name: 'New notification rule',
    enabled: true,
    logic: 'all',
    conditions: [firstCondition],
    logicBlocks: [{ type: 'condition', conditionId: firstCondition.id }],
    notificationTitleTemplate: 'Threshold Notification — {category}',
    severity: 'Medium',
    category: '',
    thresholdDescription: '',
    sendNotificationOnCreate: true,
    notificationUserIds: [],
    notificationGroupIds: [],
  }
}

export const addNotificationRuleCondition = (
  rule: NotificationCreationRule,
  options: {
    mode: AddNotificationRuleConditionMode
    join: NotificationConditionJoin
  }
): NotificationCreationRule => {
  const normalizedRule = normalizeNotificationCreationRule(rule)
  const newCondition = createNotificationThresholdCondition(normalizedRule.conditions)
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
      logic: deriveNotificationCreationRuleLogic({ ...normalizedRule, conditions, logicBlocks }),
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
    logic: deriveNotificationCreationRuleLogic({ ...normalizedRule, conditions, logicBlocks }),
  }
}

export const removeNotificationRuleCondition = (
  rule: NotificationCreationRule,
  conditionId: number
): NotificationCreationRule => {
  const normalizedRule = normalizeNotificationCreationRule(rule)

  if (normalizedRule.conditions.length <= 1) {
    return normalizedRule
  }

  const conditions = normalizedRule.conditions.filter((condition) => condition.id !== conditionId)
  const logicBlocks = sanitizeLogicBlocks(
    normalizedRule.logicBlocks.flatMap((block): NotificationRuleLogicBlock[] => {
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
    logic: deriveNotificationCreationRuleLogic({ ...normalizedRule, conditions, logicBlocks }),
  }
}

export const updateNotificationRuleLogicBlockJoin = (
  rule: NotificationCreationRule,
  blockIndex: number,
  join: NotificationConditionJoin
): NotificationCreationRule => {
  const normalizedRule = normalizeNotificationCreationRule(rule)
  const logicBlocks = normalizedRule.logicBlocks.map((block, index) =>
    index === blockIndex ? { ...block, joinWithPrevious: join } : block
  )

  return {
    ...normalizedRule,
    logicBlocks: sanitizeLogicBlocks(logicBlocks),
    logic: deriveNotificationCreationRuleLogic({ ...normalizedRule, logicBlocks }),
  }
}

export const updateNotificationRuleGroupInternalJoin = (
  rule: NotificationCreationRule,
  groupId: number,
  join: NotificationConditionJoin
): NotificationCreationRule => {
  const normalizedRule = normalizeNotificationCreationRule(rule)
  const logicBlocks = normalizedRule.logicBlocks.map((block) =>
    block.type === 'group' && block.id === groupId ? { ...block, internalJoin: join } : block
  )

  return {
    ...normalizedRule,
    logicBlocks,
    logic: deriveNotificationCreationRuleLogic({ ...normalizedRule, logicBlocks }),
  }
}

export const updateNotificationRuleCondition = (
  rule: NotificationCreationRule,
  conditionId: number,
  updater: (condition: NotificationThresholdCondition) => NotificationThresholdCondition
): NotificationCreationRule => {
  const normalizedRule = normalizeNotificationCreationRule(rule)

  return {
    ...normalizedRule,
    conditions: normalizedRule.conditions.map((condition) =>
      condition.id === conditionId ? updater(condition) : condition
    ),
  }
}
