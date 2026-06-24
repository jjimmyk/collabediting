import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from 'react'
import { ChevronDown, Pencil, Plus, Search, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  addEventRuleCondition,
  createEventCreationRule,
  deriveEventCreationRuleLogic,
  EVENT_DATA_INPUTS,
  EVENT_THRESHOLD_OPERATORS,
  formatEventCreationRuleFormula,
  formatEventCreationRuleNaturalLanguageSummary,
  getEventCreationRuleSearchText,
  getEventRuleConditionById,
  normalizeEventCreationRule,
  removeEventRuleCondition,
  updateEventRuleCondition,
  updateEventRuleGroupInternalJoin,
  updateEventRuleLogicBlockJoin,
  type AddEventRuleConditionMode,
  type EventConditionJoin,
  type EventCreationRule,
  type EventRuleLogicBlock,
} from '@/data/event-threshold-rules'
import {
  EVENT_NOTIFICATION_USER_GROUPS,
  EVENT_NOTIFICATION_USERS,
  getEventNotificationUserById,
  getEventNotificationUserGroupById,
} from '@/data/event-notification-recipients'

type EventsSettingsPageProps = {
  rules: EventCreationRule[]
  onRulesChange: Dispatch<SetStateAction<EventCreationRule[]>>
  businessUnitOptions: string[]
  onGenerateRule: () => void
}

const cloneEventCreationRule = (rule: EventCreationRule): EventCreationRule =>
  structuredClone(normalizeEventCreationRule(rule))

type PendingAddConditionState = {
  ruleId: number
  step: 'attachment' | 'join'
  mode?: AddEventRuleConditionMode
}

export function EventsSettingsPage({
  rules,
  onRulesChange,
  businessUnitOptions,
  onGenerateRule,
}: EventsSettingsPageProps) {
  const [ruleSearchQuery, setRuleSearchQuery] = useState('')
  const [expandedRuleIds, setExpandedRuleIds] = useState<Set<number>>(() => new Set())
  const [editingRuleId, setEditingRuleId] = useState<number | null>(null)
  const [ruleDrafts, setRuleDrafts] = useState<Record<number, EventCreationRule>>({})
  const [unsavedNewRuleIds, setUnsavedNewRuleIds] = useState<Set<number>>(() => new Set())
  const [scrollToRuleId, setScrollToRuleId] = useState<number | null>(null)
  const [pendingAddCondition, setPendingAddCondition] = useState<PendingAddConditionState | null>(
    null
  )

  const normalizedRuleSearchQuery = ruleSearchQuery.trim().toLowerCase()
  const filteredRules = useMemo(
    () =>
      normalizedRuleSearchQuery
        ? rules.filter((rule) => getEventCreationRuleSearchText(rule).includes(normalizedRuleSearchQuery))
        : rules,
    [normalizedRuleSearchQuery, rules]
  )

  const updateRuleDraft = (
    ruleId: number,
    updater: (rule: EventCreationRule) => EventCreationRule
  ) => {
    setRuleDrafts((previous) => {
      const current =
        previous[ruleId] ?? rules.find((rule) => rule.id === ruleId) ?? createEventCreationRule(rules)
      return {
        ...previous,
        [ruleId]: updater(current),
      }
    })
  }

  const startEditingRule = (rule: EventCreationRule) => {
    setPendingAddCondition(null)
    setRuleDrafts((previous) => ({
      ...previous,
      [rule.id]: cloneEventCreationRule(rule),
    }))
    setEditingRuleId(rule.id)
    setExpandedRuleIds((previous) => new Set(previous).add(rule.id))
  }

  const saveRuleDraft = (ruleId: number) => {
    const draft = ruleDrafts[ruleId]
    if (!draft) {
      return
    }

    onRulesChange((previous) =>
      previous.map((rule) =>
        rule.id === ruleId
          ? cloneEventCreationRule(
              normalizeEventCreationRule({
                ...draft,
                logic: deriveEventCreationRuleLogic(draft),
              })
            )
          : rule
      )
    )
    setRuleDrafts((previous) => {
      const next = { ...previous }
      delete next[ruleId]
      return next
    })
    setEditingRuleId((previous) => (previous === ruleId ? null : previous))
    setPendingAddCondition((previous) => (previous?.ruleId === ruleId ? null : previous))
    setUnsavedNewRuleIds((previous) => {
      if (!previous.has(ruleId)) {
        return previous
      }
      const next = new Set(previous)
      next.delete(ruleId)
      return next
    })
    toast.success(`Saved rule "${draft.name}".`)
  }

  const cancelRuleDraft = (ruleId: number) => {
    const isUnsavedNew = unsavedNewRuleIds.has(ruleId)

    setRuleDrafts((previous) => {
      const next = { ...previous }
      delete next[ruleId]
      return next
    })
    setEditingRuleId((previous) => (previous === ruleId ? null : previous))
    setPendingAddCondition((previous) => (previous?.ruleId === ruleId ? null : previous))

    if (isUnsavedNew) {
      onRulesChange((previous) => previous.filter((rule) => rule.id !== ruleId))
      setUnsavedNewRuleIds((previous) => {
        const next = new Set(previous)
        next.delete(ruleId)
        return next
      })
      setExpandedRuleIds((previous) => {
        const next = new Set(previous)
        next.delete(ruleId)
        return next
      })
    }
  }

  const removeRule = (ruleId: number) => {
    onRulesChange((previous) => previous.filter((rule) => rule.id !== ruleId))
    setExpandedRuleIds((previous) => {
      const next = new Set(previous)
      next.delete(ruleId)
      return next
    })
    setUnsavedNewRuleIds((previous) => {
      if (!previous.has(ruleId)) {
        return previous
      }
      const next = new Set(previous)
      next.delete(ruleId)
      return next
    })
    cancelRuleDraft(ruleId)
  }

  const addRule = () => {
    if (editingRuleId !== null) {
      cancelRuleDraft(editingRuleId)
    }

    const nextRule = createEventCreationRule(rules)
    onRulesChange((previous) => [...previous, nextRule])
    setUnsavedNewRuleIds((previous) => new Set(previous).add(nextRule.id))
    setRuleDrafts((previous) => ({
      ...previous,
      [nextRule.id]: cloneEventCreationRule(nextRule),
    }))
    setEditingRuleId(nextRule.id)
    setExpandedRuleIds((previous) => new Set(previous).add(nextRule.id))
    setRuleSearchQuery('')
    setScrollToRuleId(nextRule.id)
  }

  useEffect(() => {
    if (scrollToRuleId === null) {
      return
    }

    const element = document.getElementById(`event-rule-${scrollToRuleId}`)
    if (!element) {
      return
    }

    element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    setScrollToRuleId(null)
  }, [scrollToRuleId, rules, expandedRuleIds])

  const toggleRuleExpanded = (ruleId: number, open: boolean) => {
    if (!open && editingRuleId === ruleId) {
      cancelRuleDraft(ruleId)
    }

    setExpandedRuleIds((previous) => {
      const next = new Set(previous)
      if (open) {
        next.add(ruleId)
      } else {
        next.delete(ruleId)
      }
      return next
    })
  }

  const toggleNotificationUser = (rule: EventCreationRule, userId: string) => {
    updateRuleDraft(rule.id, (current) => ({
      ...current,
      notificationUserIds: current.notificationUserIds.includes(userId)
        ? current.notificationUserIds.filter((entry) => entry !== userId)
        : [...current.notificationUserIds, userId],
    }))
  }

  const toggleNotificationGroup = (rule: EventCreationRule, groupId: string) => {
    updateRuleDraft(rule.id, (current) => ({
      ...current,
      notificationGroupIds: current.notificationGroupIds.includes(groupId)
        ? current.notificationGroupIds.filter((entry) => entry !== groupId)
        : [...current.notificationGroupIds, groupId],
    }))
  }

  const renderNotificationSettingsEditor = (rule: EventCreationRule) => (
    <div className="space-y-3 rounded-md border bg-muted/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Event notifications</p>
          <p className="text-xs text-muted-foreground">
            Notify selected users and groups when this rule auto-creates an event.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id={`event-rule-send-notification-${rule.id}`}
            checked={rule.sendNotificationOnCreate}
            onCheckedChange={(checked) =>
              updateRuleDraft(rule.id, (current) => ({
                ...current,
                sendNotificationOnCreate: checked,
              }))
            }
          />
          <Label htmlFor={`event-rule-send-notification-${rule.id}`}>Send notification</Label>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label>Users to notify</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full justify-between text-xs font-normal"
                disabled={!rule.sendNotificationOnCreate}
              >
                <span className="truncate">
                  {rule.notificationUserIds.length > 0
                    ? `${rule.notificationUserIds.length} user${
                        rule.notificationUserIds.length === 1 ? '' : 's'
                      } selected`
                    : 'Select users'}
                </span>
                <ChevronDown className="ml-1 h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 w-72 overflow-y-auto">
              {EVENT_NOTIFICATION_USERS.map((user) => (
                <DropdownMenuItem
                  key={user.id}
                  className="pr-2"
                  onSelect={(selectEvent) => {
                    selectEvent.preventDefault()
                    toggleNotificationUser(rule, user.id)
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={rule.notificationUserIds.includes(user.id)}
                      className="pointer-events-none mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.role}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="grid gap-1.5">
          <Label>User groups to notify</Label>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full justify-between text-xs font-normal"
                disabled={!rule.sendNotificationOnCreate}
              >
                <span className="truncate">
                  {rule.notificationGroupIds.length > 0
                    ? `${rule.notificationGroupIds.length} group${
                        rule.notificationGroupIds.length === 1 ? '' : 's'
                      } selected`
                    : 'Select user groups'}
                </span>
                <ChevronDown className="ml-1 h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 w-72 overflow-y-auto">
              {EVENT_NOTIFICATION_USER_GROUPS.map((group) => (
                <DropdownMenuItem
                  key={group.id}
                  className="pr-2"
                  onSelect={(selectEvent) => {
                    selectEvent.preventDefault()
                    toggleNotificationGroup(rule, group.id)
                  }}
                >
                  <div className="flex items-start gap-2">
                    <Checkbox
                      checked={rule.notificationGroupIds.includes(group.id)}
                      className="pointer-events-none mt-0.5"
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-sm">{group.name}</p>
                      <p className="text-xs text-muted-foreground">{group.description}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {rule.sendNotificationOnCreate &&
        (rule.notificationUserIds.length > 0 || rule.notificationGroupIds.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {rule.notificationUserIds.map((userId) => {
              const user = getEventNotificationUserById(userId)
              if (!user) {
                return null
              }

              return (
                <Badge key={userId} variant="secondary">
                  {user.name}
                </Badge>
              )
            })}
            {rule.notificationGroupIds.map((groupId) => {
              const group = getEventNotificationUserGroupById(groupId)
              if (!group) {
                return null
              }

              return (
                <Badge key={groupId} variant="outline">
                  {group.name}
                </Badge>
              )
            })}
          </div>
        )}
    </div>
  )

  const renderNotificationSettingsReadOnly = (rule: EventCreationRule) => (
    <div className="space-y-2 rounded-md border bg-muted/10 p-3 text-sm">
      <p>
        <span className="font-medium">Send notification:</span>{' '}
        {rule.sendNotificationOnCreate ? 'Yes' : 'No'}
      </p>
      {rule.sendNotificationOnCreate && (
        <>
          <p>
            <span className="font-medium">Users:</span>{' '}
            {rule.notificationUserIds.length > 0
              ? rule.notificationUserIds
                  .map((userId) => getEventNotificationUserById(userId)?.name)
                  .filter(Boolean)
                  .join('; ')
              : 'None selected'}
          </p>
          <p>
            <span className="font-medium">User groups:</span>{' '}
            {rule.notificationGroupIds.length > 0
              ? rule.notificationGroupIds
                  .map((groupId) => getEventNotificationUserGroupById(groupId)?.name)
                  .filter(Boolean)
                  .join('; ')
              : 'None selected'}
          </p>
        </>
      )}
    </div>
  )

  const addConditionToRule = (
    ruleId: number,
    mode: AddEventRuleConditionMode,
    join: EventConditionJoin
  ) => {
    updateRuleDraft(ruleId, (current) => addEventRuleCondition(current, { mode, join }))
    setPendingAddCondition(null)
  }

  const renderJoinSelector = (
    value: EventConditionJoin,
    onChange: (join: EventConditionJoin) => void,
    label?: string
  ) => (
    <div className="flex items-center gap-2 px-1">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-7 w-[5.5rem] text-xs font-semibold uppercase">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="and">AND</SelectItem>
          <SelectItem value="or">OR</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  const renderConditionEditor = (
    rule: EventCreationRule,
    conditionId: number,
    options?: { compact?: boolean }
  ) => {
    const condition = getEventRuleConditionById(rule, conditionId)
    if (!condition) {
      return null
    }

    const selectedInput = EVENT_DATA_INPUTS.find((input) => input.id === condition.dataInputId)
    const canRemove = rule.conditions.length > 1

    return (
      <div
        className={cn(
          'grid gap-2 rounded-md border bg-muted/20 p-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,8rem)_auto]',
          options?.compact && 'bg-background/80'
        )}
      >
        <div className="grid gap-1.5">
          <Label>Data input</Label>
          <Select
            value={condition.dataInputId}
            onValueChange={(value) =>
              updateRuleDraft(rule.id, (current) =>
                updateEventRuleCondition(current, conditionId, (entry) => ({
                  ...entry,
                  dataInputId: value,
                }))
              )
            }
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Select data input" />
            </SelectTrigger>
            <SelectContent>
              {EVENT_DATA_INPUTS.map((input) => (
                <SelectItem key={input.id} value={input.id}>
                  {input.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedInput && (
            <p className="text-[11px] text-muted-foreground">{selectedInput.description}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label>Operator</Label>
          <Select
            value={condition.operator}
            onValueChange={(value: typeof condition.operator) =>
              updateRuleDraft(rule.id, (current) =>
                updateEventRuleCondition(current, conditionId, (entry) => ({
                  ...entry,
                  operator: value,
                }))
              )
            }
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_THRESHOLD_OPERATORS.map((operator) => (
                <SelectItem key={operator.value} value={operator.value}>
                  {operator.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-1.5">
          <Label>Threshold{selectedInput?.unit ? ` (${selectedInput.unit})` : ''}</Label>
          <Input
            value={condition.thresholdValue}
            onChange={(event) =>
              updateRuleDraft(rule.id, (current) =>
                updateEventRuleCondition(current, conditionId, (entry) => ({
                  ...entry,
                  thresholdValue: event.target.value,
                }))
              )
            }
            placeholder="0"
            className="h-8"
          />
        </div>

        <div className="flex items-end justify-end">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            aria-label="Remove condition"
            disabled={!canRemove}
            onClick={() =>
              updateRuleDraft(rule.id, (current) => removeEventRuleCondition(current, conditionId))
            }
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  const renderLogicGroupBlock = (
    rule: EventCreationRule,
    block: Extract<EventRuleLogicBlock, { type: 'group' }>
  ) => (
    <div className="relative rounded-md border border-primary/30 bg-primary/5 p-3">
      <p className="mb-3 text-[11px] font-medium uppercase tracking-wide text-primary/80">
        Compound rule
      </p>
      <div className="space-y-3 border-l-2 border-primary/40 pl-4">
        {block.conditionIds.map((conditionId, conditionIndex) => (
          <div key={conditionId} className="relative space-y-2">
            {conditionIndex > 0 && (
              <div className="absolute -left-4 top-3 h-px w-3 bg-primary/40" aria-hidden="true" />
            )}
            {conditionIndex > 0 &&
              renderJoinSelector(block.internalJoin, (join) =>
                updateRuleDraft(rule.id, (current) =>
                  updateEventRuleGroupInternalJoin(current, block.id, join)
                )
              )}
            {renderConditionEditor(rule, conditionId, { compact: true })}
          </div>
        ))}
      </div>
    </div>
  )

  const renderLogicBlock = (
    rule: EventCreationRule,
    block: EventRuleLogicBlock,
    blockIndex: number
  ) => {
    if (block.type === 'group') {
      return renderLogicGroupBlock(rule, block)
    }

    return renderConditionEditor(rule, block.conditionId)
  }

  const renderAddConditionPanel = (rule: EventCreationRule) => {
    const pending = pendingAddCondition?.ruleId === rule.id ? pendingAddCondition : null

    if (!pending) {
      return (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => setPendingAddCondition({ ruleId: rule.id, step: 'attachment' })}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add Condition
        </Button>
      )
    }

    if (pending.step === 'attachment') {
      return (
        <div className="mt-3 space-y-3 rounded-md border border-dashed bg-muted/20 p-3">
          <p className="text-sm text-muted-foreground">
            Attach the next condition to the rule above, or add it as an independent rule.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setPendingAddCondition({
                  ruleId: rule.id,
                  step: 'join',
                  mode: 'compound',
                })
              }
            >
              Compound with above
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                setPendingAddCondition({
                  ruleId: rule.id,
                  step: 'join',
                  mode: 'independent',
                })
              }
            >
              Independent rule
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setPendingAddCondition(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )
    }

    return (
      <div className="mt-3 space-y-3 rounded-md border border-dashed bg-muted/20 p-3">
        <p className="text-sm text-muted-foreground">
          {pending.mode === 'compound'
            ? 'Connect within the compound group using:'
            : 'Connect this independent rule to the logic above using:'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-w-[4.5rem] font-semibold"
            onClick={() => addConditionToRule(rule.id, pending.mode ?? 'independent', 'and')}
          >
            AND
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="min-w-[4.5rem] font-semibold"
            onClick={() => addConditionToRule(rule.id, pending.mode ?? 'independent', 'or')}
          >
            OR
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              setPendingAddCondition({
                ruleId: rule.id,
                step: 'attachment',
              })
            }
          >
            Back
          </Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setPendingAddCondition(null)}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  const renderRuleEditor = (rule: EventCreationRule) => {
    const normalizedRule = normalizeEventCreationRule(rule)

    return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="grid min-w-[14rem] flex-1 gap-1.5">
          <Label htmlFor={`event-rule-name-${rule.id}`}>Rule name</Label>
          <Input
            id={`event-rule-name-${rule.id}`}
            value={rule.name}
            onChange={(event) =>
              updateRuleDraft(rule.id, (current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch
            id={`event-rule-enabled-${rule.id}`}
            checked={rule.enabled}
            onCheckedChange={(checked) =>
              updateRuleDraft(rule.id, (current) => ({
                ...current,
                enabled: checked,
              }))
            }
          />
          <Label htmlFor={`event-rule-enabled-${rule.id}`}>Enabled</Label>
        </div>
      </div>

      <div className="rounded-md border bg-background/80 p-3">
        <p className="text-sm font-medium">Logic / formula builder</p>
        <p className="mt-3 text-sm font-medium">Create an Event when</p>

        <div className="mt-3 space-y-3">
          {normalizedRule.logicBlocks.map((block, blockIndex) => (
            <div key={block.type === 'group' ? `group-${block.id}` : `condition-${block.conditionId}`}>
              {blockIndex > 0 &&
                renderJoinSelector(block.joinWithPrevious ?? 'and', (join) =>
                  updateRuleDraft(rule.id, (current) =>
                    updateEventRuleLogicBlockJoin(current, blockIndex, join)
                  )
                )}
              {renderLogicBlock(normalizedRule, block, blockIndex)}
            </div>
          ))}
        </div>

        {renderAddConditionPanel(normalizedRule)}

        <div className="mt-3 rounded-md border border-dashed bg-background px-3 py-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Formula preview
          </p>
          <p className="mt-1 text-sm">
            Create an Event when{' '}
            <span className="font-medium">{formatEventCreationRuleFormula(normalizedRule)}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`event-rule-template-${rule.id}`}>Event name template</Label>
          <Input
            id={`event-rule-template-${rule.id}`}
            value={rule.eventNameTemplate}
            onChange={(event) =>
              updateRuleDraft(rule.id, (current) => ({
                ...current,
                eventNameTemplate: event.target.value,
              }))
            }
            placeholder="Threshold Event — {businessUnit}"
          />
        </div>
        <div className="grid gap-1.5">
          <Label>District</Label>
          <Select
            value={rule.businessUnit || undefined}
            onValueChange={(value) =>
              updateRuleDraft(rule.id, (current) => ({
                ...current,
                businessUnit: value,
              }))
            }
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue placeholder="Select district" />
            </SelectTrigger>
            <SelectContent>
              {businessUnitOptions.map((businessUnit) => (
                <SelectItem key={businessUnit} value={businessUnit}>
                  {businessUnit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label>Severity</Label>
          <Select
            value={rule.severity}
            onValueChange={(value: EventCreationRule['severity']) =>
              updateRuleDraft(rule.id, (current) => ({
                ...current,
                severity: value,
              }))
            }
          >
            <SelectTrigger className="h-8 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5 md:col-span-2">
          <Label htmlFor={`event-rule-threshold-description-${rule.id}`}>
            Threshold description
          </Label>
          <Textarea
            id={`event-rule-threshold-description-${rule.id}`}
            value={rule.thresholdDescription}
            onChange={(event) =>
              updateRuleDraft(rule.id, (current) => ({
                ...current,
                thresholdDescription: event.target.value,
              }))
            }
            placeholder="Shown on auto-created events when this rule fires."
            className="min-h-20 text-sm"
          />
        </div>
      </div>

      {renderNotificationSettingsEditor(rule)}

      <div className="flex justify-end gap-2 border-t pt-3">
        <Button type="button" size="sm" variant="outline" onClick={() => cancelRuleDraft(rule.id)}>
          Cancel
        </Button>
        <Button type="button" size="sm" onClick={() => saveRuleDraft(rule.id)}>
          Save
        </Button>
      </div>
    </div>
    )
  }

  const renderRuleReadOnly = (rule: EventCreationRule) => (
    <div className="space-y-3">
      <div className="grid gap-2 text-sm md:grid-cols-2">
        <p>
          <span className="font-medium">Rule name:</span> {rule.name}
        </p>
        <p>
          <span className="font-medium">Enabled:</span> {rule.enabled ? 'Yes' : 'No'}
        </p>
        <p className="md:col-span-2">
          <span className="font-medium">Formula:</span> {formatEventCreationRuleFormula(rule)}
        </p>
        <p>
          <span className="font-medium">Event name template:</span> {rule.eventNameTemplate}
        </p>
        <p>
          <span className="font-medium">District:</span>{' '}
          {rule.businessUnit || 'Not set'}
        </p>
        <p>
          <span className="font-medium">Severity:</span> {rule.severity}
        </p>
        <p className="md:col-span-2">
          <span className="font-medium">Threshold description:</span>{' '}
          {rule.thresholdDescription || 'Not set'}
        </p>
      </div>
      {renderNotificationSettingsReadOnly(rule)}
    </div>
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">
          Configure logic that auto-creates events when monitored data inputs cross defined
          thresholds.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" className="gap-1" onClick={onGenerateRule}>
            <Sparkles className="h-3.5 w-3.5" />
            Generate Rule
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={addRule}>
            <Plus className="mr-1 h-4 w-4" />
            Add Rule
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium">Automated Event Rules</p>
          <div className="flex h-8 w-full max-w-sm items-center gap-2 rounded-md border px-2 text-xs">
            <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input
              value={ruleSearchQuery}
              onChange={(event) => setRuleSearchQuery(event.target.value)}
              placeholder="Search rules by name, data input, district, or logic"
              aria-label="Search automated event rules"
              className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1 [scrollbar-gutter:stable]">
          {rules.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              No event creation rules yet. Add a rule or use Generate Rule to start building threshold
              logic.
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground">
              No rules match your search.
            </div>
          ) : (
            filteredRules.map((rule) => {
              const isOpen = expandedRuleIds.has(rule.id)
              const isEditing = editingRuleId === rule.id
              const draftRule = ruleDrafts[rule.id]
              const summary = formatEventCreationRuleNaturalLanguageSummary(rule)

              return (
                <Collapsible
                  key={rule.id}
                  id={`event-rule-${rule.id}`}
                  open={isOpen}
                  onOpenChange={(open) => toggleRuleExpanded(rule.id, open)}
                  className={cn(
                    'rounded-md border bg-muted/10',
                    isEditing && 'border-primary/40 ring-1 ring-primary/20'
                  )}
                >
                  <div className="flex items-start gap-2 p-3">
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="flex min-w-0 flex-1 items-start gap-2 rounded-md text-left transition-colors hover:bg-muted/30"
                      >
                        <ChevronDown
                          className={cn(
                            'mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                            isOpen && 'rotate-180'
                          )}
                        />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium">{rule.name}</p>
                            {isEditing && <Badge variant="secondary">Editing</Badge>}
                            <Badge variant={rule.enabled ? 'default' : 'outline'}>
                              {rule.enabled ? 'Active' : 'Disabled'}
                            </Badge>
                            {rule.sendNotificationOnCreate && (
                              <Badge variant="outline">Notify on create</Badge>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
                          <div className="flex flex-wrap gap-2">
                            {rule.businessUnit && (
                              <Badge variant="outline" className="max-w-full truncate">
                                {rule.businessUnit}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label={`Edit rule ${rule.name}`}
                      disabled={isEditing}
                      onClick={() => startEditingRule(rule)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      aria-label={`Delete rule ${rule.name}`}
                      onClick={() => removeRule(rule.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <CollapsibleContent className="border-t px-3 pb-4 pt-3">
                    {isEditing && draftRule
                      ? renderRuleEditor(draftRule)
                      : renderRuleReadOnly(rule)}
                  </CollapsibleContent>
                </Collapsible>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
