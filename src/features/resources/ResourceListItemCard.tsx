import { useEffect, useState, type ReactNode } from 'react'
import { Check, ChevronDown, Map as MapIcon, Pencil, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Item, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item'
import { AssetListHeaderRow, ASSET_LIST_ROW_GRID_CLASS } from '@/features/resources/AssetListHeaderRow'
import { AssetStatusIndicator } from '@/features/resources/AssetStatusIndicator'
import { AlmisDataSourceIcon } from '@/features/resources/AlmisDataSourceIcon'
import type { AssetWorkspaceOption, ResourceCostUnitType, ResourceListItemData } from '@/features/resources/types'
import { ASSET_STATUS_OPTIONS, type AssetStatus } from '@/features/resources/types'
import { AssetWorkspaceAssignmentSelect } from '@/features/resources/AssetWorkspaceAssignmentSelect'
import { UNASSIGNED_WORKSPACE_FIELD } from '@/features/resources/asset-workspace-assignment-display'
import { RosterMemberCheckInStatusSelect } from '@/features/roster/RosterMemberCheckInStatusSelect'
import type { WorkspaceMemberCheckInStatus } from '@/lib/workspace-types'
import {
  formatResourceCostPerUnit,
  formatResourceCostUnitType,
  getResourceWorkspaceAssignmentLabel,
} from '@/features/resources/utils'
import { cn } from '@/lib/utils'

type ResourceListItemCardProps = {
  resource: ResourceListItemData
  glassItemBorderClasses: string
  selected?: boolean
  open?: boolean
  defaultOpen?: boolean
  editable?: boolean
  onOpenChange?: (open: boolean) => void
  onHeaderClick?: () => void
  onFocusMap?: () => void
  onSave?: (resource: ResourceListItemData) => void
  showMapAction?: boolean
  workspaceOptions?: AssetWorkspaceOption[]
  onAssignmentChange?: (workspaceId: string | null) => void
  showInlineAssignment?: boolean
  assignmentDisabled?: boolean
  headerAddon?: ReactNode
  footerAddon?: ReactNode
  showEditButton?: boolean
  headerActions?: ReactNode
  readOnlyWorkspaceAssignmentFields?: boolean
  organizationManaged?: boolean
  canEditAssetCheckInStatus?: boolean
  isUpdatingAssetCheckInStatus?: boolean
  onAssetCheckInStatusChange?: (status: WorkspaceMemberCheckInStatus) => void
  variant?: 'default' | 'orgChart'
}

const COST_UNIT_TYPE_OPTIONS: ResourceCostUnitType[] = ['per day', 'per hour', 'to purchase']

function ResourceFieldLabel({ children }: { children: ReactNode }) {
  return <span className="font-medium">{children}</span>
}

function AlmisLockedValue({ children }: { children: ReactNode }) {
  return (
    <p className="flex flex-wrap items-center gap-1 text-muted-foreground">
      {children}
      <AlmisDataSourceIcon />
    </p>
  )
}

function IncidentAssignmentSubfield({
  label,
  isEditing,
  value,
  field,
  onRenderInput,
}: {
  label: string
  isEditing: boolean
  value: string
  field: keyof ResourceListItemData
  onRenderInput: (
    field: keyof ResourceListItemData,
    value: string | number,
    options?: { type?: 'text' | 'number'; className?: string }
  ) => ReactNode
}) {
  return (
    <div className="space-y-1">
      <ResourceFieldLabel>{label}</ResourceFieldLabel>
      {isEditing ? onRenderInput(field, value) : <p>{value || '—'}</p>}
    </div>
  )
}

export function ResourceListItemCard({
  resource,
  glassItemBorderClasses,
  selected = false,
  open,
  defaultOpen = false,
  editable = false,
  onOpenChange,
  onHeaderClick,
  onFocusMap,
  onSave,
  showMapAction = true,
  workspaceOptions = [],
  onAssignmentChange,
  showInlineAssignment,
  assignmentDisabled = false,
  headerAddon,
  footerAddon,
  showEditButton = true,
  headerActions,
  readOnlyWorkspaceAssignmentFields = true,
  organizationManaged = false,
  canEditAssetCheckInStatus = false,
  isUpdatingAssetCheckInStatus = false,
  onAssetCheckInStatusChange,
  variant = 'default',
}: ResourceListItemCardProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState<ResourceListItemData | null>(null)
  const isOpen = open ?? internalOpen
  const activeResource = isEditing && draft ? draft : resource
  const showAssignmentInline = showInlineAssignment ?? Boolean(onAssignmentChange)
  const isOrgChartVariant = variant === 'orgChart'

  useEffect(() => {
    if (!isEditing) {
      setDraft(null)
    }
  }, [resource, isEditing])

  const handleOpenChange = (nextOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(nextOpen)
    }
    onOpenChange?.(nextOpen)
  }

  const patchDraft = <K extends keyof ResourceListItemData>(
    field: K,
    value: ResourceListItemData[K]
  ) => {
    setDraft((previous) => (previous ? { ...previous, [field]: value } : previous))
  }

  const startEditing = (event: React.MouseEvent) => {
    event.stopPropagation()
    setDraft({
      ...resource,
      mapLocation: [...resource.mapLocation] as [number, number],
    })
    setIsEditing(true)
    handleOpenChange(true)
  }

  const cancelEditing = (event: React.MouseEvent) => {
    event.stopPropagation()
    setIsEditing(false)
    setDraft(null)
  }

  const saveEditing = (event: React.MouseEvent) => {
    event.stopPropagation()
    if (!draft || !onSave) {
      return
    }

    if (organizationManaged) {
      onSave({
        ...draft,
        quantity: Number(draft.quantity) || 0,
        costPerUnit: Number(draft.costPerUnit) || 0,
        mapLocation: [...draft.mapLocation] as [number, number],
      })
    } else {
      onSave({
        ...draft,
        assetStatus: resource.assetStatus,
        assetStatusUpdatedAt: resource.assetStatusUpdatedAt,
        currentLocation: resource.currentLocation,
        opcon: resource.opcon,
        unitType: resource.unitType,
        unitName: resource.unitName,
        quantity: Number(draft.quantity) || 0,
        costPerUnit: Number(draft.costPerUnit) || 0,
      })
    }
    setIsEditing(false)
    setDraft(null)
  }

  const renderEditableInput = (
    field: keyof ResourceListItemData,
    value: string | number,
    options?: { type?: 'text' | 'number'; className?: string }
  ) => (
    <Input
      type={options?.type ?? 'text'}
      value={value}
      onClick={(event) => event.stopPropagation()}
      onChange={(event) => {
        const nextValue =
          options?.type === 'number' ? Number(event.target.value) : event.target.value
        patchDraft(field, nextValue as ResourceListItemData[typeof field])
      }}
      className={cn('h-8 text-xs', options?.className)}
    />
  )

  return (
    <Item
      variant="outline"
      className={cn(
        'flex-col items-stretch p-0',
        glassItemBorderClasses,
        selected &&
          'relative z-10 ring-2 ring-primary/60 ring-offset-2 ring-offset-background bg-primary/5'
      )}
    >
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        <div
          className={cn(
            'flex items-center gap-2',
            isOrgChartVariant ? 'px-2 py-1.5' : 'px-3 py-2.5',
            onHeaderClick && !isEditing && 'cursor-pointer'
          )}
          onClick={isEditing ? undefined : onHeaderClick}
        >
          <ItemContent className="min-w-0">
            {isOrgChartVariant ? (
              <div
                className="flex min-w-0 items-center gap-1.5"
                aria-label={`Asset status: ${resource.assetStatus}, last updated ${resource.assetStatusUpdatedAt}`}
              >
                <AssetStatusIndicator status={resource.assetStatus} showLabel={false} />
                {isEditing ? (
                  renderEditableInput('name', activeResource.name, {
                    className: 'text-[11px] font-medium',
                  })
                ) : (
                  <ItemTitle className="truncate text-[11px] font-semibold leading-snug">
                    {resource.name}
                  </ItemTitle>
                )}
              </div>
            ) : (
              <div
                className={ASSET_LIST_ROW_GRID_CLASS}
                aria-label={`Asset status: ${resource.assetStatus}, last updated ${resource.assetStatusUpdatedAt}`}
              >
                <div className="min-w-0">
                  {isEditing ? (
                    renderEditableInput('name', activeResource.name, { className: 'font-medium' })
                  ) : (
                    <ItemTitle className="truncate">{resource.name}</ItemTitle>
                  )}
                </div>
                <AssetStatusIndicator
                  status={activeResource.assetStatus}
                  showLabel={false}
                  className="justify-self-center"
                />
                {isEditing && organizationManaged ? (
                  <Select
                    value={activeResource.assetStatus}
                    onValueChange={(value) => patchDraft('assetStatus', value as AssetStatus)}
                  >
                    <SelectTrigger className="h-7 w-full text-[11px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSET_STATUS_OPTIONS.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="text-xs font-normal tabular-nums text-muted-foreground whitespace-nowrap">
                    {activeResource.assetStatusUpdatedAt}
                  </span>
                )}
                <span className="justify-self-center">
                  {organizationManaged ? null : <AlmisDataSourceIcon />}
                </span>
              </div>
            )}
            {headerAddon}
          </ItemContent>
          <ItemActions>
            {isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Save asset changes"
                  onClick={saveEditing}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Cancel asset edits"
                  onClick={cancelEditing}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                {headerActions}
                {editable && showEditButton ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Edit asset"
                    onClick={startEditing}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                ) : null}
                {showMapAction && onFocusMap ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Zoom map to asset"
                    onClick={(event) => {
                      event.stopPropagation()
                      onFocusMap()
                    }}
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                ) : null}
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Toggle asset details"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ChevronDown
                      className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                    />
                  </Button>
                </CollapsibleTrigger>
              </>
            )}
          </ItemActions>
        </div>
        {showAssignmentInline && onAssignmentChange ? (
          <div
            className="border-t px-3 py-2"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="space-y-1">
              <ResourceFieldLabel>Incident / Exercise workspace:</ResourceFieldLabel>
              <AssetWorkspaceAssignmentSelect
                value={activeResource.assignedWorkspaceId}
                options={workspaceOptions}
                compact
                disabled={assignmentDisabled}
                onChange={onAssignmentChange}
              />
            </div>
          </div>
        ) : null}
        <CollapsibleContent>
          <div
            className={cn(
              'border-t py-2',
              isOrgChartVariant ? 'px-2 text-xs' : 'px-3 text-sm'
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <ResourceFieldLabel>Current Location:</ResourceFieldLabel>
                {isEditing && organizationManaged ? (
                  renderEditableInput('currentLocation', activeResource.currentLocation)
                ) : (
                  <AlmisLockedValue>
                    <span>{resource.currentLocation}</span>
                  </AlmisLockedValue>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Datetime Ordered:</ResourceFieldLabel>
                {isEditing ? (
                  renderEditableInput('datetimeOrdered', activeResource.datetimeOrdered)
                ) : (
                  <p>{activeResource.datetimeOrdered}</p>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>OPCON:</ResourceFieldLabel>
                {isEditing && organizationManaged ? (
                  renderEditableInput('opcon', activeResource.opcon)
                ) : (
                  <AlmisLockedValue>
                    <span>{resource.opcon}</span>
                  </AlmisLockedValue>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>TACON:</ResourceFieldLabel>
                {isEditing ? (
                  renderEditableInput('tacon', activeResource.tacon)
                ) : (
                  <p>{activeResource.tacon}</p>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Point of Contact:</ResourceFieldLabel>
                {isEditing ? (
                  renderEditableInput('pointOfContact', activeResource.pointOfContact)
                ) : (
                  <p>{activeResource.pointOfContact}</p>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Owning Organization:</ResourceFieldLabel>
                {isEditing ? (
                  renderEditableInput('owningOrganization', activeResource.owningOrganization)
                ) : (
                  <p>{activeResource.owningOrganization}</p>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Quantity:</ResourceFieldLabel>
                {isEditing ? (
                  renderEditableInput('quantity', activeResource.quantity, { type: 'number' })
                ) : (
                  <p>{activeResource.quantity}</p>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Unit Type:</ResourceFieldLabel>
                {isEditing && organizationManaged ? (
                  renderEditableInput('unitType', activeResource.unitType)
                ) : (
                  <AlmisLockedValue>
                    <span>{resource.unitType}</span>
                  </AlmisLockedValue>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Unit Name:</ResourceFieldLabel>
                {isEditing && organizationManaged ? (
                  renderEditableInput('unitName', activeResource.unitName)
                ) : (
                  <AlmisLockedValue>
                    <span>{resource.unitName}</span>
                  </AlmisLockedValue>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Cost Unit Type:</ResourceFieldLabel>
                {isEditing ? (
                  <Select
                    value={activeResource.costUnitType}
                    onValueChange={(value) =>
                      patchDraft('costUnitType', value as ResourceCostUnitType)
                    }
                  >
                    <SelectTrigger className="h-8 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {COST_UNIT_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {formatResourceCostUnitType(option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p>{formatResourceCostUnitType(activeResource.costUnitType)}</p>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Cost per Unit:</ResourceFieldLabel>
                {isEditing ? (
                  renderEditableInput('costPerUnit', activeResource.costPerUnit, { type: 'number' })
                ) : (
                  <p>{formatResourceCostPerUnit(activeResource.costPerUnit)}</p>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Hull/Tail Number:</ResourceFieldLabel>
                {isEditing ? (
                  renderEditableInput('hullTailNumber', activeResource.hullTailNumber)
                ) : (
                  <p>{activeResource.hullTailNumber}</p>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Symbology:</ResourceFieldLabel>
                {isEditing ? (
                  renderEditableInput('symbology', activeResource.symbology)
                ) : (
                  <p>{activeResource.symbology}</p>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Lat:</ResourceFieldLabel>
                {isEditing ? (
                  renderEditableInput('latitude', activeResource.latitude)
                ) : (
                  <p>{activeResource.latitude}</p>
                )}
              </div>
              <div className="space-y-1">
                <ResourceFieldLabel>Long:</ResourceFieldLabel>
                {isEditing ? (
                  renderEditableInput('longitude', activeResource.longitude)
                ) : (
                  <p>{activeResource.longitude}</p>
                )}
              </div>
              <div className="col-span-2 space-y-1">
                <ResourceFieldLabel>Capabilities:</ResourceFieldLabel>
                {isEditing ? (
                  <Textarea
                    value={activeResource.capabilities}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => patchDraft('capabilities', event.target.value)}
                    className="min-h-16 text-xs"
                  />
                ) : (
                  <p>{activeResource.capabilities}</p>
                )}
              </div>
              <div className="col-span-2 rounded-md border bg-muted/20 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {showAssignmentInline ? 'Operational Assignment Details' : 'Workspace Assignment'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {!showAssignmentInline ? (
                    <div className="col-span-2 space-y-1">
                      <ResourceFieldLabel>Incident / Exercise workspace:</ResourceFieldLabel>
                      {onAssignmentChange ? (
                        <AssetWorkspaceAssignmentSelect
                          value={activeResource.assignedWorkspaceId}
                          options={workspaceOptions}
                          disabled={assignmentDisabled}
                          onChange={onAssignmentChange}
                        />
                      ) : (
                        <p>{getResourceWorkspaceAssignmentLabel(activeResource) || 'Unassigned'}</p>
                      )}
                    </div>
                  ) : null}
                  <IncidentAssignmentSubfield
                    label="Current Op Period:"
                    isEditing={isEditing && !readOnlyWorkspaceAssignmentFields}
                    value={resource.currentOpPeriod}
                    field="currentOpPeriod"
                    onRenderInput={renderEditableInput}
                  />
                  <IncidentAssignmentSubfield
                    label="Next Op Period:"
                    isEditing={isEditing && !readOnlyWorkspaceAssignmentFields}
                    value={resource.nextOpPeriod}
                    field="nextOpPeriod"
                    onRenderInput={renderEditableInput}
                  />
                  <IncidentAssignmentSubfield
                    label="Current Op Period Assignment:"
                    isEditing={isEditing && !readOnlyWorkspaceAssignmentFields}
                    value={resource.currentOpPeriodAssignment}
                    field="currentOpPeriodAssignment"
                    onRenderInput={renderEditableInput}
                  />
                  <IncidentAssignmentSubfield
                    label="Next Op Period Assignment:"
                    isEditing={isEditing && !readOnlyWorkspaceAssignmentFields}
                    value={resource.nextOpPeriodAssignment}
                    field="nextOpPeriodAssignment"
                    onRenderInput={renderEditableInput}
                  />
                  <div className="space-y-1">
                    <ResourceFieldLabel>Check-in Status:</ResourceFieldLabel>
                    {canEditAssetCheckInStatus &&
                    onAssetCheckInStatusChange &&
                    resource.assignedWorkspaceId ? (
                      <RosterMemberCheckInStatusSelect
                        memberId={resource.assetKey}
                        value={resource.assetCheckInStatus ?? 'not_arrived'}
                        canEdit
                        isUpdating={isUpdatingAssetCheckInStatus}
                        onChange={(_memberId, status) => onAssetCheckInStatusChange(status)}
                      />
                    ) : (
                      <p>
                        {resource.checkInStatus &&
                        resource.checkInStatus !== UNASSIGNED_WORKSPACE_FIELD
                          ? resource.checkInStatus
                          : UNASSIGNED_WORKSPACE_FIELD}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
        {footerAddon}
      </Collapsible>
    </Item>
  )
}
