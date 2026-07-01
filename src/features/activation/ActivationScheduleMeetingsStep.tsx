import { useMemo, useState } from 'react'
import { ChevronDown, Info, Plus, X } from 'lucide-react'
import type { ActivationMeetingScheduleSettings } from '@/features/activation/activation-meeting-schedule-types'
import {
  clampOperationalPeriodDurationValue,
  computeOperationalPeriodWindow,
  formatOperationalPeriodWindowLabel,
  parseAnchorStartIso,
} from '@/features/activation/activation-meeting-schedule-utils'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Item } from '@/components/ui/item'
import { Label } from '@/components/ui/label'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { Switch } from '@/components/ui/switch'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

type ActivationScheduleMeetingsStepProps = {
  settings: ActivationMeetingScheduleSettings
  onChange: (settings: ActivationMeetingScheduleSettings) => void
  incidentStartTime: string
}

function nextMeetingId(settings: ActivationMeetingScheduleSettings): number {
  if (settings.meetings.length === 0) return 1
  return Math.max(...settings.meetings.map((meeting) => meeting.id)) + 1
}

export function ActivationScheduleMeetingsStep({
  settings,
  onChange,
  incidentStartTime,
}: ActivationScheduleMeetingsStepProps) {
  const [expandedMeetingItemId, setExpandedMeetingItemId] = useState<number | null>(null)

  const opWindowPreview = useMemo(() => {
    const anchor = parseAnchorStartIso(incidentStartTime)
    const window = computeOperationalPeriodWindow(anchor, settings)
    return formatOperationalPeriodWindowLabel(window.from, window.to)
  }, [incidentStartTime, settings.plannedDurationUnit, settings.plannedDurationValue])

  const updateSettings = (patch: Partial<ActivationMeetingScheduleSettings>) => {
    onChange({ ...settings, ...patch })
  }

  const updateMeetings = (
    updater: (
      meetings: ActivationMeetingScheduleSettings['meetings']
    ) => ActivationMeetingScheduleSettings['meetings']
  ) => {
    onChange({ ...settings, meetings: updater(settings.meetings) })
  }

  return (
    <div className="grid gap-4">
      <div className="space-y-4 rounded-md border bg-muted/10 p-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Operational period</h3>
          <p className="text-xs text-muted-foreground">
            Set the planned length of each operational period for this workspace.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-[minmax(0,8rem)_minmax(0,10rem)]">
          <div className="grid gap-2">
            <Label htmlFor="activation-op-duration-value">Planned length</Label>
            <Input
              id="activation-op-duration-value"
              type="number"
              min={1}
              max={settings.plannedDurationUnit === 'days' ? 7 : 168}
              value={settings.plannedDurationValue}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10)
                updateSettings({
                  plannedDurationValue: clampOperationalPeriodDurationValue(
                    Number.isNaN(parsed) ? 1 : parsed,
                    settings.plannedDurationUnit
                  ),
                })
              }}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="activation-op-duration-unit">Unit</Label>
            <NativeSelect
              id="activation-op-duration-unit"
              value={settings.plannedDurationUnit}
              onChange={(event) => {
                const unit = event.target.value === 'days' ? 'days' : 'hours'
                updateSettings({
                  plannedDurationUnit: unit,
                  plannedDurationValue: clampOperationalPeriodDurationValue(
                    settings.plannedDurationValue,
                    unit
                  ),
                })
              }}
            >
              <NativeSelectOption value="hours">Hours</NativeSelectOption>
              <NativeSelectOption value="days">Days</NativeSelectOption>
            </NativeSelect>
          </div>
        </div>

        {incidentStartTime ? (
          <p className="text-xs text-muted-foreground">
            Operational Period 1: {opWindowPreview}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Set a start time on Name &amp; Location to preview Operational Period 1.
          </p>
        )}

        <div className="flex items-center justify-between gap-3 rounded-md border bg-background px-3 py-2">
          <div className="space-y-0.5">
            <Label htmlFor="activation-repeat-meetings" className="text-sm">
              Repeat meetings every operational period
            </Label>
            <p className="text-xs text-muted-foreground">
              {settings.repeatMeetingsEachOperationalPeriod
                ? 'Meeting times repeat at the same offset from each operational period start.'
                : 'Meetings apply to the initial operational period only.'}
            </p>
          </div>
          <Switch
            id="activation-repeat-meetings"
            checked={settings.repeatMeetingsEachOperationalPeriod}
            onCheckedChange={(checked) =>
              updateSettings({ repeatMeetingsEachOperationalPeriod: checked })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-start">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              const nextId = nextMeetingId(settings)
              updateMeetings((previous) => [
                {
                  id: nextId,
                  start: '',
                  end: '',
                  meeting: 'New Meeting',
                  attendees: '',
                  agendaItems: ['New agenda item'],
                  createTeamsMeeting: false,
                },
                ...previous,
              ])
              setExpandedMeetingItemId(nextId)
            }}
          >
            <Plus className="mr-1 h-4 w-4" /> Create Meeting
          </Button>
        </div>
        <div className="hidden grid-cols-[2.25rem_repeat(4,minmax(0,1fr))_minmax(0,1fr)] items-center gap-3 px-3 text-xs text-black dark:text-black md:grid">
          <p className="invisible select-none" aria-hidden="true">
            Expand
          </p>
          <p className="pl-1">Start</p>
          <p className="pl-1">End</p>
          <p>Meeting</p>
          <p>Attendees</p>
          <div className="-ml-1 flex items-center gap-1">
            <p>Create Microsoft Teams Meeting</p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5"
                    aria-label="Microsoft Teams meeting info"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-sm">
                  If enabled, a Microsoft Teams calendar event will be created and all attendees
                  will be emailed an invitation.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        {settings.meetings.length === 0 && (
          <div className="rounded-md border border-dashed bg-muted/20 p-4 text-sm text-muted-foreground">
            No scheduled meetings.
          </div>
        )}
        {settings.meetings.map((item) => {
          const isMeetingOpen = expandedMeetingItemId === item.id
          return (
            <Item key={item.id} variant="outline" className="flex-col items-stretch">
              <Collapsible
                open={isMeetingOpen}
                onOpenChange={(open) => setExpandedMeetingItemId(open ? item.id : null)}
              >
                <div className="grid gap-3 p-3 md:grid-cols-[2.25rem_repeat(4,minmax(0,1fr))_minmax(0,1fr)]">
                  <div className="flex items-center">
                    <CollapsibleTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Toggle agenda for meeting row ${item.id}`}
                      >
                        <ChevronDown
                          className={cn(
                            'h-4 w-4 transition-transform',
                            isMeetingOpen && 'rotate-180'
                          )}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <div>
                    <Input
                      type="datetime-local"
                      value={item.start}
                      onChange={(event) => {
                        const value = event.target.value
                        updateMeetings((previous) =>
                          previous.map((meetingItem) =>
                            meetingItem.id === item.id ? { ...meetingItem, start: value } : meetingItem
                          )
                        )
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      type="datetime-local"
                      value={item.end}
                      onChange={(event) => {
                        const value = event.target.value
                        updateMeetings((previous) =>
                          previous.map((meetingItem) =>
                            meetingItem.id === item.id ? { ...meetingItem, end: value } : meetingItem
                          )
                        )
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      value={item.meeting}
                      onChange={(event) => {
                        const value = event.target.value
                        updateMeetings((previous) =>
                          previous.map((meetingItem) =>
                            meetingItem.id === item.id
                              ? { ...meetingItem, meeting: value }
                              : meetingItem
                          )
                        )
                      }}
                    />
                  </div>
                  <div>
                    <Input
                      value={item.attendees}
                      onChange={(event) => {
                        const value = event.target.value
                        updateMeetings((previous) =>
                          previous.map((meetingItem) =>
                            meetingItem.id === item.id
                              ? { ...meetingItem, attendees: value }
                              : meetingItem
                          )
                        )
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id={`teams-meeting-${item.id}`}
                      aria-label={`Create Microsoft Teams Meeting for row ${item.id}`}
                      checked={item.createTeamsMeeting}
                      onCheckedChange={(checked) => {
                        updateMeetings((previous) =>
                          previous.map((meetingItem) =>
                            meetingItem.id === item.id
                              ? { ...meetingItem, createTeamsMeeting: checked }
                              : meetingItem
                          )
                        )
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="ml-auto"
                      aria-label={`Delete meeting row ${item.id}`}
                      onClick={() => {
                        updateMeetings((previous) =>
                          previous.filter((meetingItem) => meetingItem.id !== item.id)
                        )
                        setExpandedMeetingItemId((previous) =>
                          previous === item.id ? null : previous
                        )
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CollapsibleContent>
                  <div className="border-t px-3 py-3">
                    <div className="mb-2 flex items-center justify-between">
                      <Label className="text-xs text-muted-foreground">Agenda</Label>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          updateMeetings((previous) =>
                            previous.map((meetingItem) =>
                              meetingItem.id === item.id
                                ? {
                                    ...meetingItem,
                                    agendaItems: [...meetingItem.agendaItems, 'New agenda item'],
                                  }
                                : meetingItem
                            )
                          )
                        }}
                      >
                        <Plus className="mr-1 h-4 w-4" />
                        Create Agenda Item
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {item.agendaItems.length === 0 && (
                        <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                          No agenda items yet.
                        </div>
                      )}
                      {item.agendaItems.map((agendaItem, agendaIndex) => (
                        <Item
                          key={`${item.id}-agenda-${agendaIndex}`}
                          variant="muted"
                          size="sm"
                          className="flex-nowrap"
                        >
                          <Input
                            className="min-w-0 flex-1"
                            value={agendaItem}
                            onChange={(event) => {
                              const value = event.target.value
                              updateMeetings((previous) =>
                                previous.map((meetingItem) => {
                                  if (meetingItem.id !== item.id) {
                                    return meetingItem
                                  }

                                  return {
                                    ...meetingItem,
                                    agendaItems: meetingItem.agendaItems.map((entry, entryIndex) =>
                                      entryIndex === agendaIndex ? value : entry
                                    ),
                                  }
                                })
                              )
                            }}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="ml-auto"
                            aria-label={`Delete agenda item ${agendaIndex + 1} for meeting row ${item.id}`}
                            onClick={() => {
                              updateMeetings((previous) =>
                                previous.map((meetingItem) => {
                                  if (meetingItem.id !== item.id) {
                                    return meetingItem
                                  }

                                  return {
                                    ...meetingItem,
                                    agendaItems: meetingItem.agendaItems.filter(
                                      (_, entryIndex) => entryIndex !== agendaIndex
                                    ),
                                  }
                                })
                              )
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </Item>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Item>
          )
        })}
      </div>
    </div>
  )
}
