import { type ChangeEvent, useEffect, useRef, useState } from 'react'
import ArcGISMap from '@arcgis/core/Map'
import Graphic from '@arcgis/core/Graphic'
import Point from '@arcgis/core/geometry/Point'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import MapView from '@arcgis/core/views/MapView'
import {
  Box,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Bell,
  FileText,
  History,
  Map as MapIcon,
  Menu,
  MoreHorizontal,
  MoreVertical,
  Lock,
  Moon,
  Plus,
  Pencil,
  Search,
  Shield,
  Square,
  Sun,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from '@/components/ui/item'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import pratusLogo from '@/assets/pratus-logo.png'

type NotificationItem = {
  id: number
  title: string
  severity: 'Critical' | 'High' | 'Medium' | 'Low'
  status: 'New' | 'Acknowledged' | 'Resolved'
  category: 'Power' | 'Transport' | 'Shelter'
  timestamp: string
  owner: string
  summary: string
  impact: string
  location: [number, number]
}

type ResourceItem = {
  id: number
  name: string
  owner: string
  status: 'Assigned' | 'Staged' | 'Available'
  type: string
  teamLead: string
  eta: string
  location: string
  notes: string
  mapLocation: [number, number]
  currentLocation: string
  datetimeOrdered: string
  opcon: string
  tacon: string
  pointOfContact: string
  owningOrganization: string
  quantity: number
  unit: string
  hullTailNumber: string
  symbology: string
  latitude: string
  longitude: string
  capabilities: string
  currentOpPeriod: string
  nextOpPeriod: string
  currentOpPeriodAssignment: string
  nextOpPeriodAssignment: string
  checkInStatus: string
}

type AorItem = {
  id: number
  itemType: 'Objective' | 'Action'
  parentObjectiveId?: number
  objectiveClassification?: 'O' | 'M' | 'O&M'
  assignee?: string
  dueDate?: string
  dueTime?: string
  dueTimezone?: string
  actionLocationAddress?: string
  actionLatitude?: string
  actionLongitude?: string
  name: string
  lead: string
  incidents: number
  priority: 'High' | 'Medium' | 'Low'
  population: string
  lastUpdate: string
  evacuationStatus: 'None' | 'Recommended' | 'Active'
  notes: string
  location: [number, number]
}

type RosterPositionItem = {
  id: number
  position: string
  staffingStatus: 'Filled' | 'Partially Filled' | 'Gap'
  shift: string
  supervisor: string
  assignedUsers: string[]
  notes: string
  location: [number, number]
}

type SafetyAnalysisItem = {
  id: number
  hazard: string
  riskLevel: 'High' | 'Medium' | 'Low'
  status: 'Mitigating' | 'Monitoring' | 'Closed'
  owner: string
  controls: string
  reviewedAt: string
  notes: string
  location: [number, number]
}

type ReportItem = {
  id: number
  title: string
  reportType: 'SitRep' | 'Resource Status' | 'Damage Assessment'
  status: 'Draft' | 'Submitted' | 'Approved'
  author: string
  dueBy: string
  summary: string
  location: [number, number]
}

type IncidentBriefingItem = {
  id: number
  title: string
  priority: 'High' | 'Medium' | 'Low'
  presenter: string
  briefingTime: string
  audience: string
  summary: string
  location: [number, number]
}

type CalendarItem = {
  id: number
  title: string
  eventType: 'Briefing' | 'Operational Period' | 'Deadline'
  status: 'Scheduled' | 'In Progress' | 'Complete'
  timeWindow: string
  owner: string
  notes: string
  location: [number, number]
}

type LeftTab =
  | 'notifications'
  | 'resources'
  | 'aors'
  | 'incidents'
  | 'safety'
  | 'calendar'
  | 'reports'
  | 'briefing'
  | `form-${string}`
type PratusPlanStatus = 'pending' | 'accepted' | 'cancelled'
type PratusAssignmentRecommendation = {
  assignment: string
  unitLabel: string
  resourceId: number
}
type PratusMessagePlan = {
  action: 'add-3-objectives' | 'draft-ics-204-recommendation'
  status: PratusPlanStatus
  steps: string[]
}
type PratusAiMessage = {
  id: number
  role: 'assistant' | 'user'
  content: string
  plan?: PratusMessagePlan
  recommendations?: PratusAssignmentRecommendation[]
}
type SearchResult = {
  id: string
  kind:
    | 'notification'
    | 'resource'
    | 'aor'
    | 'roster'
    | 'safety'
    | 'calendar'
    | 'report'
    | 'briefing'
  title: string
  subtitle: string
  location: [number, number]
  scale: number
}
type AssigneeOption = {
  name: string
  position: string
  availability: 'Available'
}
type Ics201ActionRow = {
  id: number
  task: string
  owner: string
  startTime: string
  endTime: string
  status: string
}
type Ics201ResourceSummaryRow = {
  id: number
  category: string
  identifier: string
  quantity: string
  status: string
  assignment: string
}
type Ics201SafetyRow = {
  id: number
  hazard: string
  mitigation: string
  ppe: string
  medicalPlan: string
}
type Ics204ResourceAssignedRow = {
  id: number
  resourceIdentifier: string
  leader: string
  contact: string
  location: string
}
type Ics204ResourceRequirementRow = {
  id: number
  resource: string
  required: string
  have: string
  need: string
}
type Ics204WorkAssignmentRow = {
  id: number
  assignment: string
  priority: string
  resourceRequirements: Ics204ResourceRequirementRow[]
  overheadPositions: string
  specialEquipmentSupplies: string
  reportingLocation: string
  requestedArrivalTime: string
}
type Ics233TaskRow = {
  id: number
  task: string
  assignee: string
  pointOfContact: string
  pocBriefed: 'Yes' | 'No'
  start: string
  deadline: string
  status: 'Not Started' | 'In Progress' | 'Complete' | 'Cannot Complete'
}
type Ics201FormState = {
  incidentName: string
  incidentNumber: string
  preparedDateTime: string
  operationalPeriodStart: string
  operationalPeriodEnd: string
  jurisdiction: string
  preparedBy: string
  mapSketchDescription: string
  mapSketchLegend: string
  currentSituationSummary: string
  weatherForecast: string
  projectedIncidentCourse: string
  objectives: string[]
  actions: Ics201ActionRow[]
  orgChart: {
    incidentCommander: string
    operationsSectionChief: string
    planningSectionChief: string
    logisticsSectionChief: string
    financeSectionChief: string
    publicInformationOfficer: string
    safetyOfficer: string
    liaisonOfficer: string
  }
  resources: Ics201ResourceSummaryRow[]
  safetyAnalysis: Ics201SafetyRow[]
}
type Ics204FormState = {
  id: number
  assignedUnit: string
  branch: string
  division: string
  group: string
  stagingArea: string
  sectionChief: string
  branchDirector: string
  divisionGroupSupervisor: string
  resourcesAssigned: Ics204ResourceAssignedRow[]
  workAssignments: Ics204WorkAssignmentRow[]
  specialInstructions: string
  communications: string
}

function App() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const leftPanelRef = useRef<HTMLDivElement | null>(null)
  const searchComponentRef = useRef<HTMLDivElement | null>(null)
  const mapViewRef = useRef<MapView | null>(null)
  const mapGraphicsLayerRef = useRef<GraphicsLayer | null>(null)
  const drawLocationLayerRef = useRef<GraphicsLayer | null>(null)
  const drawLocationGraphicRef = useRef<Graphic | null>(null)
  const mapGraphicsRef = useRef(new globalThis.Map<string, Graphic>())
  const [isObjectivesOpen, setIsObjectivesOpen] = useState(true)
  const [panelWidthMode, setPanelWidthMode] = useState<'one-third' | 'one-half'>(
    'one-half'
  )
  const [activeTab, setActiveTab] = useState<LeftTab>('notifications')
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [selectedPanelItemId, setSelectedPanelItemId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchExpanded, setIsSearchExpanded] = useState(false)
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false)
  const [isMapVisible, setIsMapVisible] = useState(true)
  const [selectedSearchResult, setSelectedSearchResult] = useState<SearchResult | null>(null)
  const [appliedFilterQuery, setAppliedFilterQuery] = useState<string | null>(null)
  const [appliedFilterLabel, setAppliedFilterLabel] = useState<string | null>(null)
  const [isAddFormsOpen, setIsAddFormsOpen] = useState(false)
  const [selectedIcsForms, setSelectedIcsForms] = useState<string[]>([])
  const [draftIcsForms, setDraftIcsForms] = useState<string[]>([])
  const [selectedTopBarButton, setSelectedTopBarButton] = useState<string | null>(null)
  const [isPratusAiDrawerOpen, setIsPratusAiDrawerOpen] = useState(false)
  const [isPlanningPDialogOpen, setIsPlanningPDialogOpen] = useState(false)
  const [expandedIcs204FormId, setExpandedIcs204FormId] = useState<number | null>(1)
  const [expandedIcs204WorkAssignmentKey, setExpandedIcs204WorkAssignmentKey] = useState<string | null>(null)
  const [pratusAiMessages, setPratusAiMessages] = useState<PratusAiMessage[]>([])
  const [pratusAiDraftMessage, setPratusAiDraftMessage] = useState('')
  const [isPratusAiSelectingContext, setIsPratusAiSelectingContext] = useState(false)
  const [isPratusAiLoading, setIsPratusAiLoading] = useState(false)
  const pratusAiLoadingTimerRef = useRef<number | null>(null)
  const [ics204ResourcePickerFormId, setIcs204ResourcePickerFormId] = useState<number | null>(null)
  const [ics204ResourceNameFilter, setIcs204ResourceNameFilter] = useState('')
  const [ics204ResourceCurrentLocationFilter, setIcs204ResourceCurrentLocationFilter] = useState('')
  const [ics204ResourceCurrentOpFilter, setIcs204ResourceCurrentOpFilter] = useState('all')
  const [ics204ResourceNextOpFilter, setIcs204ResourceNextOpFilter] = useState('all')
  const [pratusAiSelectedContexts, setPratusAiSelectedContexts] = useState<
    Array<{ id: string; label: string }>
  >([])
  const [pratusAiDataSources, setPratusAiDataSources] = useState({
    web: true,
    incidentData: true,
    files: false,
  })
  const [pratusAiSelectedFiles, setPratusAiSelectedFiles] = useState<string[]>([])
  const [selectedPratusResourceId, setSelectedPratusResourceId] = useState<number | null>(null)
  const INITIAL_ICS201_FORM: Ics201FormState = {
    incidentName: 'Incident Alpha',
    incidentNumber: 'ALPHA-2026-001',
    preparedDateTime: '2026-04-25 16:00 UTC',
    operationalPeriodStart: '2026-04-25 12:00 UTC',
    operationalPeriodEnd: '2026-04-26 00:00 UTC',
    jurisdiction: 'State Emergency Operations Center',
    preparedBy: 'Planning Section Chief',
    mapSketchDescription:
      'Map sketch should depict current incident perimeter, branch/division boundaries, staging areas, access control points, evacuation routes, and shelter locations.',
    mapSketchLegend:
      'Legend: Red = active incident area, Orange = control lines, Blue = staging, Green = shelter/resource hubs.',
    currentSituationSummary:
      'Severe weather impacts continue across multiple districts. Road closures and utility disruptions are driving shelter demand and dynamic resource allocation.',
    weatherForecast:
      'Next 12 hours: scattered thunderstorms, wind gusts 25-35 mph, localized flash-flood risk in low-lying corridors.',
    projectedIncidentCourse:
      'Expect sustained transportation and power disruptions through next operational period with elevated public safety messaging requirements.',
    objectives: [
      'Protect life safety in high-risk flood corridors.',
      'Maintain access for emergency medical transport routes.',
      'Stabilize shelter operations and staffing coverage.',
    ],
    actions: [
      {
        id: 1,
        task: 'Deploy barricade teams to South Connector choke points.',
        owner: 'Operations Branch I',
        startTime: '2026-04-25 16:30 UTC',
        endTime: '2026-04-25 20:30 UTC',
        status: 'In Progress',
      },
      {
        id: 2,
        task: 'Coordinate utility assessment sweep for North Levee Sector.',
        owner: 'Infrastructure Group',
        startTime: '2026-04-25 17:00 UTC',
        endTime: '2026-04-25 22:00 UTC',
        status: 'Planned',
      },
    ],
    orgChart: {
      incidentCommander: 'R. Morgan',
      operationsSectionChief: 'T. Hale',
      planningSectionChief: 'A. Rivera',
      logisticsSectionChief: 'J. Nguyen',
      financeSectionChief: 'D. Ortiz',
      publicInformationOfficer: 'M. Wells',
      safetyOfficer: 'K. Simmons',
      liaisonOfficer: 'R. Patel',
    },
    resources: [
      {
        id: 1,
        category: 'USAR',
        identifier: 'Urban Search Team Alpha',
        quantity: '2',
        status: 'Assigned',
        assignment: 'North Levee Sector',
      },
      {
        id: 2,
        category: 'Medical',
        identifier: 'Medical Strike Team',
        quantity: '1',
        status: 'Available',
        assignment: 'South Aid Station',
      },
    ],
    safetyAnalysis: [
      {
        id: 1,
        hazard: 'Flooded roadways and unseen washouts',
        mitigation: 'Use spotters; enforce route checks before convoy movement',
        ppe: 'High-visibility PPE and water-resistant boots',
        medicalPlan: 'Nearest treatment: Central Medical Corridor',
      },
      {
        id: 2,
        hazard: 'Downed power infrastructure',
        mitigation: 'Maintain exclusion zones and utility escort procedures',
        ppe: 'Electrical hazard gloves and insulated tools',
        medicalPlan: 'EMS support staged at Grid N-4',
      },
    ],
  }
  const [ics201Form, setIcs201Form] = useState<Ics201FormState>(INITIAL_ICS201_FORM)
  const ics201Collaborators = [
    { id: 'maya', name: 'Maya Chen', initials: 'MC', color: '#ef4444' },
    { id: 'diego', name: 'Diego Alvarez', initials: 'DA', color: '#3b82f6' },
  ] as const
  type Ics201VersionSignature = {
    name: string
    role: string
    signedAt: number
  }
  type Ics201Version = {
    id: string
    createdAt: number
    authorName: string
    authorColor: string
    snapshot: Ics201FormState
    signatures: Ics201VersionSignature[]
  }
  const [ics201Versions, setIcs201Versions] = useState<Ics201Version[]>(() => {
    const now = Date.now()
    const authors: Array<{ name: string; color: string }> = [
      { name: 'You', color: '#16a34a' },
      { name: 'Maya Chen', color: '#ef4444' },
      { name: 'Diego Alvarez', color: '#3b82f6' },
      { name: 'A. Rivera', color: '#16a34a' },
    ]
    const signers: Array<{ name: string; role: string }> = [
      { name: 'R. Morgan', role: 'Incident Commander' },
      { name: 'A. Rivera', role: 'Planning Section Chief' },
      { name: 'T. Hale', role: 'Operations Section Chief' },
      { name: 'K. Simmons', role: 'Safety Officer' },
      { name: 'Maya Chen', role: 'Situation Unit Leader' },
    ]
    const signedIndices = new Set([1, 3, 5, 7, 9])
    let signedCursor = 0
    return Array.from({ length: 10 }, (_, index) => {
      const minutesAgo = (10 - index) * 2
      const createdAt = now - minutesAgo * 60_000
      const author = authors[index % authors.length]
      const isSigned = signedIndices.has(index)
      const signatures: Ics201VersionSignature[] = []
      if (isSigned) {
        const signer = signers[signedCursor % signers.length]
        signedCursor += 1
        signatures.push({
          name: signer.name,
          role: signer.role,
          signedAt: createdAt + 30_000,
        })
      }
      return {
        id: `seed-v${index + 1}`,
        createdAt,
        authorName: author.name,
        authorColor: author.color,
        snapshot: INITIAL_ICS201_FORM,
        signatures,
      }
    })
  })
  const [isIcs201VersionDialogOpen, setIsIcs201VersionDialogOpen] = useState(false)
  const [isIcs201SignedVersionsDialogOpen, setIsIcs201SignedVersionsDialogOpen] = useState(false)
  const [isCreatingSignedIcs201Version, setIsCreatingSignedIcs201Version] = useState(false)
  const [isIcs201SignNameDialogOpen, setIsIcs201SignNameDialogOpen] = useState(false)
  const [ics201SignNameInput, setIcs201SignNameInput] = useState('You')
  const [viewingIcs201Version, setViewingIcs201Version] = useState<Ics201Version | null>(null)
  const liveIcs201FormRef = useRef<Ics201FormState | null>(null)
  const [ics204Forms, setIcs204Forms] = useState<Ics204FormState[]>([
    {
      id: 1,
      assignedUnit: 'Division A Task Force',
      branch: 'Operations Branch',
      division: 'Division A',
      group: 'Evacuation Group',
      stagingArea: 'North Staging',
      sectionChief: 'T. Hale',
      branchDirector: 'R. Patel',
      divisionGroupSupervisor: 'K. Simmons',
      resourcesAssigned: [
        {
          id: 1,
          resourceIdentifier: 'USAR Team Alpha',
          leader: 'Capt. J. Nguyen',
          contact: '555-0142',
          location: 'North Levee Sector',
        },
      ],
      workAssignments: [
        {
          id: 1,
          assignment: 'Clear debris and establish access lane at River Bend Corridor',
          priority: 'High',
          resourceRequirements: [
            {
              id: 1,
              resource: 'Debris Team',
              required: '2',
              have: '1',
              need: '1',
            },
          ],
          overheadPositions: 'Task Force Leader, Safety Officer',
          specialEquipmentSupplies: 'Excavator, traffic cones, fuel trailer',
          reportingLocation: 'River Bend Staging',
          requestedArrivalTime: '13:00',
        },
      ],
      specialInstructions: 'Maintain responder accountability checks every 60 minutes.',
      communications:
        'Primary: Tac Channel 3 (155.160). Alternate: Command Net 1. Medical emergency code: MED-ALPHA.',
    },
  ])
  type Ics204Version = {
    id: string
    createdAt: number
    authorName: string
    authorColor: string
    snapshot: Ics204FormState
    signatures: Ics201VersionSignature[]
  }
  const seedIcs204Versions = (form: Ics204FormState): Ics204Version[] => {
    const now = Date.now()
    const authors: Array<{ name: string; color: string }> = [
      { name: 'You', color: '#16a34a' },
      { name: 'Maya Chen', color: '#ef4444' },
      { name: 'Diego Alvarez', color: '#3b82f6' },
      { name: form.divisionGroupSupervisor || 'A. Rivera', color: '#16a34a' },
    ]
    const signers: Array<{ name: string; role: string }> = [
      { name: form.sectionChief || 'T. Hale', role: 'Operations Section Chief' },
      { name: form.branchDirector || 'R. Patel', role: 'Branch Director' },
    ]
    return Array.from({ length: 5 }, (_, index) => {
      const minutesAgo = (5 - index) * 3
      const createdAt = now - minutesAgo * 60_000
      const author = authors[index % authors.length]
      const isSigned = index === 2 || index === 4
      const signatures: Ics201VersionSignature[] = []
      if (isSigned) {
        const signer = signers[index === 4 ? 0 : 1]
        signatures.push({
          name: signer.name,
          role: signer.role,
          signedAt: createdAt + 30_000,
        })
      }
      return {
        id: `seed-204-${form.id}-v${index + 1}`,
        createdAt,
        authorName: author.name,
        authorColor: author.color,
        snapshot: form,
        signatures,
      }
    })
  }
  const [ics204VersionsById, setIcs204VersionsById] = useState<Record<number, Ics204Version[]>>(() => {
    const initial: Record<number, Ics204Version[]> = {}
    ;[
      {
        id: 1,
        assignedUnit: 'Division A Task Force',
        branch: 'Operations Branch',
        division: 'Division A',
        group: 'Evacuation Group',
        stagingArea: 'North Staging',
        sectionChief: 'T. Hale',
        branchDirector: 'R. Patel',
        divisionGroupSupervisor: 'K. Simmons',
        resourcesAssigned: [],
        workAssignments: [],
        specialInstructions: '',
        communications: '',
      } as Ics204FormState,
    ].forEach((form) => {
      initial[form.id] = seedIcs204Versions(form)
    })
    return initial
  })
  const [viewingIcs204VersionByFormId, setViewingIcs204VersionByFormId] = useState<
    Record<number, Ics204Version | null>
  >({})
  const [isCreatingSignedIcs204ByFormId, setIsCreatingSignedIcs204ByFormId] = useState<
    Record<number, boolean>
  >({})
  const [ics204VersionDialog, setIcs204VersionDialog] = useState<
    { formId: number; kind: 'all' | 'signed' } | null
  >(null)
  const [ics204SignDialog, setIcs204SignDialog] = useState<
    | {
        formId: number
        mode: 'new-version' | 'review'
        role: string
      }
    | null
  >(null)
  const [ics204SignNameInput, setIcs204SignNameInput] = useState('You')
  const [ics204AssignedByFormId, setIcs204AssignedByFormId] = useState<Record<number, boolean>>({})
  const [ics204AssignConfirmDialog, setIcs204AssignConfirmDialog] = useState<{
    formId: number
  } | null>(null)
  const liveIcs204FormsRef = useRef<Record<number, Ics204FormState>>({})
  const [ics233Rows, setIcs233Rows] = useState<Ics233TaskRow[]>([
    {
      id: 1,
      task: 'Coordinate branch staffing relief handoff',
      assignee: 'Planning Section Staffing Cell',
      pointOfContact: 'M. Bennett (555-0113)',
      pocBriefed: 'Yes',
      start: '2026-04-29T13:00',
      deadline: '2026-04-29T15:00',
      status: 'In Progress',
    },
    {
      id: 2,
      task: 'Validate perimeter sweep coverage by division',
      assignee: 'Law Group 1',
      pointOfContact: 'Capt. R. Wallace (555-0104)',
      pocBriefed: 'No',
      start: '2026-04-29T13:15',
      deadline: '2026-04-29T16:00',
      status: 'Not Started',
    },
  ])
  const [activeIcs233CellEdit, setActiveIcs233CellEdit] = useState<{
    rowId: number
    field: keyof Omit<Ics233TaskRow, 'id'>
  } | null>(null)
  const [ics233TaskDraftEdit, setIcs233TaskDraftEdit] = useState<{ rowId: number; value: string } | null>(null)
  const [ics233Filters, setIcs233Filters] = useState({
    task: '',
    assignee: 'all',
    pointOfContact: 'all',
    pocBriefed: 'all',
    startMode: 'all',
    start: '',
    deadlineMode: 'all',
    deadline: '',
    status: 'all',
  })
  const [ics233ViewMode, setIcs233ViewMode] = useState<'table' | 'list'>('table')
  const [expandedIcs233RowId, setExpandedIcs233RowId] = useState<number | null>(null)
  const [selectedIcs233RowId, setSelectedIcs233RowId] = useState<number | null>(null)
  const [isIcs233RowModalEditing, setIsIcs233RowModalEditing] = useState(false)
  const [aorSectionSearchQuery, setAorSectionSearchQuery] = useState('')
  const [inlineAorDraft, setInlineAorDraft] = useState<{
    itemType: 'Objective' | 'Action'
    objectiveClassification: 'O' | 'M' | 'O&M'
    assignee: string
    dueDate: string
    dueTime: string
    dueTimezone: string
    actionLocationAddress: string
    actionLatitude: string
    actionLongitude: string
    name: string
    notes: string
  } | null>(null)
  const [inlineChildActionDraft, setInlineChildActionDraft] = useState<{
    objectiveId: number
    assignee: string
    dueDate: string
    dueTime: string
    dueTimezone: string
    actionLocationAddress: string
    actionLatitude: string
    actionLongitude: string
    name: string
  } | null>(null)
  const [editingActionDraft, setEditingActionDraft] = useState<{
    id: number
    name: string
  } | null>(null)
  const [expandedChildActionId, setExpandedChildActionId] = useState<number | null>(null)
  const [drawMapTarget, setDrawMapTarget] = useState<
    | { type: 'existing-action'; actionId: number }
    | { type: 'inline-action' }
    | { type: 'inline-child-action' }
    | null
  >(null)
  const [pendingAssigneeSelections, setPendingAssigneeSelections] = useState<Record<string, string>>({})
  const [assigneeSearchQuery, setAssigneeSearchQuery] = useState('')
  const [appearanceMode, setAppearanceMode] = useState<'light' | 'dark' | 'glass'>(
    'light'
  )
  const [notifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: 'Power outage reported in North Levee Sector',
      severity: 'Critical',
      status: 'New',
      category: 'Power',
      timestamp: '2026-03-28 08:12',
      owner: 'Dispatch',
      summary: 'Multiple feeders offline. Crews requested for immediate assessment.',
      impact: '18,400 customers without power',
      location: [-96.7969, 32.7767],
    },
    {
      id: 2,
      title: 'Road closure expanded near central corridor',
      severity: 'High',
      status: 'Acknowledged',
      category: 'Transport',
      timestamp: '2026-03-28 08:27',
      owner: 'Traffic Ops',
      summary: 'Closure now includes eastbound lanes due to debris and utility hazards.',
      impact: '6-mile diversion and 42-minute delay',
      location: [-97.7431, 30.2672],
    },
    {
      id: 3,
      title: 'Public shelter occupancy update',
      severity: 'Medium',
      status: 'Resolved',
      category: 'Shelter',
      timestamp: '2026-03-28 08:45',
      owner: 'Mass Care',
      summary: 'Shelter capacity increased and overflow queue cleared.',
      impact: '312 residents reallocated safely',
      location: [-95.3698, 29.7604],
    },
  ])
  const [resources] = useState<ResourceItem[]>([
    {
      id: 1,
      name: 'Urban Search Team Alpha',
      owner: 'Ops Section',
      status: 'Assigned',
      type: 'USAR Team',
      teamLead: 'Capt. J. Nguyen',
      eta: 'On-site',
      location: 'Grid N-4',
      notes: 'Conducting structure sweeps and victim triage.',
      mapLocation: [-96.8005, 32.7812],
      currentLocation: '---',
      datetimeOrdered: '04/07/2026 21:00 UTC',
      opcon: '---',
      tacon: '---',
      pointOfContact: '---',
      owningOrganization: '---',
      quantity: 2,
      unit: '---',
      hullTailNumber: '---',
      symbology: '---',
      latitude: '---',
      longitude: '---',
      capabilities: 'Station Miami Beach; Miami - Welcome Incident Incident Details',
      currentOpPeriod: '---',
      nextOpPeriod: '---',
      currentOpPeriodAssignment: '---',
      nextOpPeriodAssignment: 'Division A perimeter sweep',
      checkInStatus: 'Onsite',
    },
    {
      id: 2,
      name: 'Mobile Command Unit',
      owner: 'Logistics',
      status: 'Staged',
      type: 'Comms Vehicle',
      teamLead: 'Lt. A. Rivera',
      eta: '12 min',
      location: 'Central Staging',
      notes: 'Ready for deployment, pending final route clearance.',
      mapLocation: [-97.7406, 30.2711],
      currentLocation: '---',
      datetimeOrdered: '04/07/2026 21:00 UTC',
      opcon: '---',
      tacon: '---',
      pointOfContact: '---',
      owningOrganization: '---',
      quantity: 2,
      unit: '---',
      hullTailNumber: '---',
      symbology: '---',
      latitude: '---',
      longitude: '---',
      capabilities: 'Station Miami Beach; Miami - Welcome Incident Incident Details',
      currentOpPeriod: '---',
      nextOpPeriod: '---',
      currentOpPeriodAssignment: '---',
      nextOpPeriodAssignment: '---',
      checkInStatus: 'Onsite',
    },
    {
      id: 3,
      name: 'Medical Strike Team',
      owner: 'Medical Branch',
      status: 'Available',
      type: 'EMS Unit',
      teamLead: 'Dr. S. Cole',
      eta: '8 min',
      location: 'South Aid Station',
      notes: 'Available for surge support and patient transport.',
      mapLocation: [-95.3642, 29.7542],
      currentLocation: '---',
      datetimeOrdered: '04/07/2026 21:00 UTC',
      opcon: '---',
      tacon: '---',
      pointOfContact: '---',
      owningOrganization: '---',
      quantity: 2,
      unit: '---',
      hullTailNumber: '---',
      symbology: '---',
      latitude: '---',
      longitude: '---',
      capabilities: 'Station Miami Beach; Miami - Welcome Incident Incident Details',
      currentOpPeriod: '---',
      nextOpPeriod: '---',
      currentOpPeriodAssignment: '---',
      nextOpPeriodAssignment: 'Central medical corridor standby',
      checkInStatus: 'Onsite',
    },
  ])
  const [aors, setAors] = useState<AorItem[]>([
    {
      id: 1,
      itemType: 'Objective',
      objectiveClassification: 'O',
      name: 'Protect North Levee Sector',
      lead: 'Branch Director K. Simmons',
      incidents: 3,
      priority: 'High',
      population: '84,200',
      lastUpdate: '09:12',
      evacuationStatus: 'Recommended',
      notes: 'Reinforce levee access points and maintain egress routes for Riverside and Elm Bend.',
      location: [-96.7894, 32.788],
    },
    {
      id: 2,
      itemType: 'Objective',
      objectiveClassification: 'M',
      name: 'Stabilize Central Medical Corridor',
      lead: 'Branch Director R. Patel',
      incidents: 2,
      priority: 'High',
      population: '126,900',
      lastUpdate: '09:04',
      evacuationStatus: 'Recommended',
      notes: 'Keep ambulance ingress open; coordinate debris removal at 3 priority intersections.',
      location: [-97.7515, 30.2639],
    },
    {
      id: 3,
      itemType: 'Action',
      assignee: 'T. Hale',
      dueDate: '2026-03-28',
      dueTime: '10:30',
      dueTimezone: 'America/Chicago',
      actionLocationAddress: '',
      actionLatitude: '29.7446',
      actionLongitude: '-95.3553',
      name: 'Deploy barricade teams to South Connector',
      lead: 'Operations Group Supervisor T. Hale',
      incidents: 1,
      priority: 'Medium',
      population: '63,400',
      lastUpdate: '08:58',
      evacuationStatus: 'None',
      notes: 'Place traffic control and route signage at three choke points by 10:30.',
      location: [-95.3553, 29.7446],
    },
    {
      id: 4,
      itemType: 'Action',
      assignee: 'Jules Patel',
      dueDate: '2026-03-28',
      dueTime: '11:00',
      dueTimezone: 'America/Chicago',
      actionLocationAddress: '',
      actionLatitude: '32.7961',
      actionLongitude: '-96.8041',
      name: 'Conduct utilities safety sweep in North Reach',
      lead: 'Utilities Task Force Lead M. Carter',
      incidents: 2,
      priority: 'High',
      population: '84,200',
      lastUpdate: '09:16',
      evacuationStatus: 'Recommended',
      notes: 'Verify de-energized lines and clear public access routes before period shift.',
      location: [-96.8041, 32.7961],
    },
  ])
  const [rosterPositions] = useState<RosterPositionItem[]>([
    {
      id: 1,
      position: 'Operations Section Chief',
      staffingStatus: 'Filled',
      shift: 'Day (0600-1800)',
      supervisor: 'IC Morgan',
      assignedUsers: ['Dana Wright'],
      notes: 'Leads field operations and branch coordination across active objectives.',
      location: [-96.8121, 32.8024],
    },
    {
      id: 2,
      position: 'Safety Officer',
      staffingStatus: 'Partially Filled',
      shift: 'Day/Night overlap',
      supervisor: 'IC Morgan',
      assignedUsers: ['Jules Patel', 'Rina Chen'],
      notes: 'Coverage gap after 2200; relief request submitted for overnight rotation.',
      location: [-97.7332, 30.2825],
    },
    {
      id: 3,
      position: 'Public Information Officer',
      staffingStatus: 'Gap',
      shift: 'Pending assignment',
      supervisor: 'Unified Command',
      assignedUsers: ['Unassigned'],
      notes: 'Priority fill needed before next media briefing cycle.',
      location: [-95.3404, 29.7368],
    },
  ])
  const [safetyAnalyses] = useState<SafetyAnalysisItem[]>([
    {
      id: 1,
      hazard: 'Levee access roads softening under heavy equipment load',
      riskLevel: 'High',
      status: 'Mitigating',
      owner: 'Safety Officer Team',
      controls: 'Single-lane convoy control, reduced axle loads, hourly road checks.',
      reviewedAt: '09:20',
      notes: 'Escalate to geotech support if rut depth exceeds threshold at checkpoint 3.',
      location: [-96.801, 32.795],
    },
    {
      id: 2,
      hazard: 'Downed power lines near Central Medical Corridor staging',
      riskLevel: 'High',
      status: 'Monitoring',
      owner: 'Utilities Branch',
      controls: 'Hot-zone perimeter, spotter assignment, utility lockout verification.',
      reviewedAt: '09:06',
      notes: 'Maintain exclusion zone until utility confirms de-energized status.',
      location: [-97.744, 30.274],
    },
    {
      id: 3,
      hazard: 'Fatigue risk during extended shelter support operations',
      riskLevel: 'Medium',
      status: 'Mitigating',
      owner: 'Logistics Section',
      controls: 'Mandatory rest cycles, hydration checks, supervisor sign-off per shift.',
      reviewedAt: '08:54',
      notes: 'Night shift staffing request in progress to reduce overtime accumulation.',
      location: [-95.352, 29.747],
    },
  ])
  const [reports] = useState<ReportItem[]>([
    {
      id: 1,
      title: 'Morning Operational SitRep',
      reportType: 'SitRep',
      status: 'Submitted',
      author: 'Planning Section',
      dueBy: 'Completed 08:45',
      summary: 'Consolidated overnight impacts, objective status, and immediate priorities.',
      location: [-96.7894, 32.788],
    },
    {
      id: 2,
      title: 'Resource Assignment Snapshot',
      reportType: 'Resource Status',
      status: 'Draft',
      author: 'Logistics Section',
      dueBy: '10:00',
      summary: 'Pending final staffing updates for overnight safety coverage and shelter ops.',
      location: [-97.7515, 30.2639],
    },
    {
      id: 3,
      title: 'South Sector Damage Assessment',
      reportType: 'Damage Assessment',
      status: 'Approved',
      author: 'Field Assessment Unit',
      dueBy: 'Completed 08:20',
      summary: 'Verified localized structural damage with no additional displacement required.',
      location: [-95.3553, 29.7446],
    },
  ])
  const [incidentBriefings] = useState<IncidentBriefingItem[]>([
    {
      id: 1,
      title: 'North Reach Tactical Brief',
      priority: 'High',
      presenter: 'IC Morgan',
      briefingTime: '09:45',
      audience: 'Ops, Safety, Engineering',
      summary: 'Focus on levee reinforcement tasking and contingency trigger conditions.',
      location: [-96.8121, 32.8024],
    },
    {
      id: 2,
      title: 'Medical Corridor Coordination Brief',
      priority: 'High',
      presenter: 'Branch Director R. Patel',
      briefingTime: '10:00',
      audience: 'Transport, Utilities, EMS',
      summary: 'Align lane restoration sequencing with ambulance ingress requirements.',
      location: [-97.7332, 30.2825],
    },
    {
      id: 3,
      title: 'Shelter Continuity Brief',
      priority: 'Medium',
      presenter: 'Branch Director L. Alvarez',
      briefingTime: '10:20',
      audience: 'Mass Care, Logistics, PIO',
      summary: 'Review generator resilience, staffing posture, and public messaging cadence.',
      location: [-95.3404, 29.7368],
    },
  ])
  const [calendarItems] = useState<CalendarItem[]>([
    {
      id: 1,
      title: 'Operational Period Briefing',
      eventType: 'Briefing',
      status: 'Scheduled',
      timeWindow: '11:00-11:30',
      owner: 'Planning Section',
      notes: 'Review current objectives, hazards, and branch assignments.',
      location: [-96.8012, 32.7898],
    },
    {
      id: 2,
      title: 'Ops Period 3 Start',
      eventType: 'Operational Period',
      status: 'Scheduled',
      timeWindow: '12:00',
      owner: 'Operations Section',
      notes: 'Shift transition and field tasking handoff.',
      location: [-97.7428, 30.2716],
    },
    {
      id: 3,
      title: 'ICS-214 Submission Cutoff',
      eventType: 'Deadline',
      status: 'In Progress',
      timeWindow: '13:30',
      owner: 'Documentation Unit',
      notes: 'All section activity logs due for period closeout packet.',
      location: [-95.3497, 29.7459],
    },
  ])

  useEffect(() => {
    if (!mapContainerRef.current) {
      return
    }

    if (!mapGraphicsLayerRef.current) {
      mapGraphicsLayerRef.current = new GraphicsLayer()
    }
    if (!drawLocationLayerRef.current) {
      drawLocationLayerRef.current = new GraphicsLayer()
    }
    const graphicsLayer = mapGraphicsLayerRef.current
    const pointGraphics = [
      ...notifications.map((item) => ({
        mapKey: `notification-${item.id}`,
        title: item.title,
        kind: 'Notification',
        coordinates: item.location,
        color: [220, 38, 38, 0.9] as [number, number, number, number],
        status: item.status,
        owner: item.owner,
        timestamp: item.timestamp,
        impact: item.impact,
      })),
      ...resources.map((item) => ({
        mapKey: `resource-${item.id}`,
        title: item.name,
        kind: 'Resource',
        coordinates: item.mapLocation,
        color: [14, 116, 144, 0.9] as [number, number, number, number],
        status: item.status,
        owner: item.owner,
        timestamp: item.eta,
        impact: `${item.type} at ${item.location}`,
      })),
      ...safetyAnalyses.map((item) => ({
        mapKey: `safety-${item.id}`,
        title: item.hazard,
        kind: 'Safety Analysis',
        coordinates: item.location,
        color: [245, 158, 11, 0.9] as [number, number, number, number],
        status: item.status,
        owner: item.owner,
        timestamp: item.reviewedAt,
        impact: item.controls,
      })),
      ...calendarItems.map((item) => ({
        mapKey: `calendar-${item.id}`,
        title: item.title,
        kind: 'Calendar Event',
        coordinates: item.location,
        color: [59, 130, 246, 0.9] as [number, number, number, number],
        status: item.status,
        owner: item.owner,
        timestamp: item.timeWindow,
        impact: `${item.eventType} • ${item.notes}`,
      })),
      ...reports.map((item) => ({
        mapKey: `report-${item.id}`,
        title: item.title,
        kind: 'Report',
        coordinates: item.location,
        color: [16, 185, 129, 0.9] as [number, number, number, number],
        status: item.status,
        owner: item.author,
        timestamp: item.dueBy,
        impact: `${item.reportType} • ${item.summary}`,
      })),
      ...incidentBriefings.map((item) => ({
        mapKey: `briefing-${item.id}`,
        title: item.title,
        kind: 'Incident Briefing ICS-201',
        coordinates: item.location,
        color: [168, 85, 247, 0.9] as [number, number, number, number],
        status: item.priority,
        owner: item.presenter,
        timestamp: item.briefingTime,
        impact: item.summary,
      })),
    ].map((item) => {
      const graphic = new Graphic({
        geometry: {
          type: 'point',
          longitude: item.coordinates[0],
          latitude: item.coordinates[1],
        },
        symbol: {
          type: 'simple-marker',
          color: item.color,
          size: 10,
          outline: {
            color: [255, 255, 255, 1],
            width: 1.2,
          },
        },
        attributes: {
          mapKey: item.mapKey,
          title: item.title,
          kind: item.kind,
          status: item.status,
          owner: item.owner,
          timestamp: item.timestamp,
          impact: item.impact,
        },
        popupTemplate: {
          title: '{title}',
          content:
            '<b>Type:</b> {kind}<br/><b>Status:</b> {status}<br/><b>Owner:</b> {owner}<br/><b>Updated:</b> {timestamp}<br/><b>Impact:</b> {impact}',
        },
      })
      return { mapKey: item.mapKey, graphic }
    })
    const aorPolygonGraphics = aors
      .filter((item) => item.itemType === 'Objective')
      .map((item) => {
      const [longitude, latitude] = item.location
      const lonOffset = 0.12
      const latOffset = 0.09

      const graphic = new Graphic({
        geometry: {
          type: 'polygon',
          rings: [
            [
              [longitude - lonOffset, latitude - latOffset],
              [longitude + lonOffset, latitude - latOffset],
              [longitude + lonOffset, latitude + latOffset],
              [longitude - lonOffset, latitude + latOffset],
              [longitude - lonOffset, latitude - latOffset],
            ],
          ],
        },
        symbol: {
          type: 'simple-fill',
          color: [124, 58, 237, 0.05], // 95% transparency
          outline: {
            color: [255, 255, 255, 1],
            width: 1.2,
          },
        },
        attributes: {
          mapKey: `aor-${item.id}`,
          title: item.name,
          kind: item.itemType,
          lead: item.lead,
          incidents: item.incidents,
          population: item.population,
          evacuationStatus: item.evacuationStatus,
          lastUpdate: item.lastUpdate,
        },
        popupTemplate: {
          title: '{title}',
          content:
            '<b>Type:</b> {kind}<br/><b>Lead:</b> {lead}<br/><b>Linked Incidents:</b> {incidents}<br/><b>Population:</b> {population}<br/><b>Evacuation:</b> {evacuationStatus}<br/><b>Updated:</b> {lastUpdate}',
        },
      })

      return { mapKey: `aor-${item.id}`, graphic }
    })
    const rosterPolygonGraphics = rosterPositions.map((item) => {
      const [longitude, latitude] = item.location
      const lonOffset = 0.08
      const latOffset = 0.06

      const graphic = new Graphic({
        geometry: {
          type: 'polygon',
          rings: [
            [
              [longitude - lonOffset, latitude - latOffset],
              [longitude + lonOffset, latitude - latOffset],
              [longitude + lonOffset, latitude + latOffset],
              [longitude - lonOffset, latitude + latOffset],
              [longitude - lonOffset, latitude - latOffset],
            ],
          ],
        },
        symbol: {
          type: 'simple-fill',
          color: [234, 88, 12, 0.05], // 95% transparency
          outline: {
            color: [255, 255, 255, 1],
            width: 1.2,
          },
        },
        attributes: {
          mapKey: `incident-${item.id}`,
          title: item.position,
          kind: 'Roster Position',
          status: item.staffingStatus,
          supervisor: item.supervisor,
          shift: item.shift,
          assignedUsers: item.assignedUsers.join(', '),
          summary: item.notes,
        },
        popupTemplate: {
          title: '{title}',
          content:
            '<b>Type:</b> {kind}<br/><b>Staffing:</b> {status}<br/><b>Supervisor:</b> {supervisor}<br/><b>Shift:</b> {shift}<br/><b>Assigned:</b> {assignedUsers}<br/>{summary}',
        },
      })

      return { mapKey: `incident-${item.id}`, graphic }
    })
    const allGraphics = [...pointGraphics, ...aorPolygonGraphics, ...rosterPolygonGraphics]
    mapGraphicsRef.current = new globalThis.Map(
      allGraphics.map((entry) => [entry.mapKey, entry.graphic])
    )
    graphicsLayer.removeAll()
    graphicsLayer.addMany(allGraphics.map((entry) => entry.graphic))

    if (!mapViewRef.current) {
      const map = new ArcGISMap({
        basemap: 'streets-navigation-vector',
        layers: [graphicsLayer, drawLocationLayerRef.current],
      })

      const view = new MapView({
        container: mapContainerRef.current,
        map,
        center: [-98.5795, 39.8283],
        zoom: 4,
        popup: {
          dockEnabled: false,
          dockOptions: {
            buttonEnabled: false,
            breakpoint: false,
          },
        },
      })
      mapViewRef.current = view
    }
  }, [
    aors,
    incidentBriefings,
    calendarItems,
    notifications,
    reports,
    resources,
    rosterPositions,
    safetyAnalyses,
  ])

  useEffect(() => {
    return () => {
      mapViewRef.current?.destroy()
      mapViewRef.current = null
      mapGraphicsRef.current = new globalThis.Map()
      mapGraphicsLayerRef.current = null
      drawLocationLayerRef.current = null
      drawLocationGraphicRef.current = null
    }
  }, [])

  useEffect(() => {
    // Ensure ArcGIS view recalculates after horizontal layout changes.
    const frame = requestAnimationFrame(() => {
      mapViewRef.current?.resize()
    })
    return () => cancelAnimationFrame(frame)
  }, [isPratusAiDrawerOpen, isObjectivesOpen, panelWidthMode, isMapVisible])

  useEffect(() => {
    if (!isPratusAiSelectingContext) {
      return
    }

    const handleContextSelection = (event: globalThis.MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target) {
        return
      }

      const contextTarget = target.closest<HTMLElement>('[data-pratus-context-id]')
      const contextId = contextTarget?.dataset.pratusContextId
      if (!contextTarget || !contextId) {
        return
      }

      const contextLabel = contextTarget.dataset.pratusContextLabel || contextId
      event.preventDefault()
      event.stopPropagation()
      setPratusAiSelectedContexts((previous) =>
        previous.some((entry) => entry.id === contextId)
          ? previous
          : [...previous, { id: contextId, label: contextLabel }]
      )
      setIsPratusAiSelectingContext(false)
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsPratusAiSelectingContext(false)
      }
    }

    document.addEventListener('click', handleContextSelection, true)
    window.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('click', handleContextSelection, true)
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isPratusAiSelectingContext])

  useEffect(() => {
    if (!isPratusAiDrawerOpen) {
      setIsPratusAiSelectingContext(false)
      setIsPratusAiLoading(false)
      if (pratusAiLoadingTimerRef.current) {
        window.clearTimeout(pratusAiLoadingTimerRef.current)
        pratusAiLoadingTimerRef.current = null
      }
    }
  }, [isPratusAiDrawerOpen])

  useEffect(() => {
    return () => {
      if (pratusAiLoadingTimerRef.current) {
        window.clearTimeout(pratusAiLoadingTimerRef.current)
        pratusAiLoadingTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const storedAppearance = window.localStorage.getItem('hub-appearance')
    if (
      storedAppearance === 'light' ||
      storedAppearance === 'dark' ||
      storedAppearance === 'glass'
    ) {
      setAppearanceMode(storedAppearance)
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setAppearanceMode(prefersDark ? 'dark' : 'light')
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', appearanceMode === 'dark')
    root.classList.toggle('glass-mode', appearanceMode === 'glass')
    window.localStorage.setItem('hub-appearance', appearanceMode)
  }, [appearanceMode])

  const isGlassMode = appearanceMode === 'glass'
  const glassPanelClasses = isGlassMode
    ? 'glass-organic glass-organic-panel'
    : 'bg-background/95'
  const glassCardClasses = isGlassMode
    ? 'bg-transparent border-transparent shadow-none ring-0'
    : ''
  const glassSearchClasses = isGlassMode
    ? 'glass-organic glass-organic-search'
    : 'bg-background/95'
  const glassSearchResultsClasses = isGlassMode
    ? 'glass-organic glass-organic-results'
    : 'bg-background/95'
  const glassItemBorderClasses = isGlassMode ? 'border-black dark:border-black' : ''
  const glassIconButtonClasses = isGlassMode
    ? 'glass-organic border-white/25 bg-transparent text-foreground'
    : ''
  const glassToggleGroupClasses = isGlassMode
    ? 'glass-organic border-white/25 bg-transparent'
    : ''
  const glassToggleItemClasses = isGlassMode
    ? 'glass-organic border-white/25 bg-transparent data-[state=on]:border-black data-[state=on]:bg-white/45 data-[state=on]:text-black data-[state=on]:shadow-[0_6px_16px_rgba(0,0,0,0.35)]'
    : ''
  const selectedGlassTabClasses = (isSelected: boolean) =>
    cn(
      glassIconButtonClasses,
      isGlassMode && 'relative z-10 overflow-visible',
      isGlassMode &&
        (isSelected
          ? '!border-black !bg-black !text-white shadow-[0_10px_24px_rgba(0,0,0,0.7)]'
          : '!border-white/20 !bg-white/10 !text-foreground/80 hover:!bg-white/20 hover:!text-foreground')
    )
  const selectedGlassIconButtonClasses = (isSelected: boolean) =>
    cn(
      glassIconButtonClasses,
      isGlassMode &&
        (isSelected
          ? '!border-black !bg-black !text-white shadow-[0_10px_24px_rgba(0,0,0,0.7)]'
          : '!border-white/20 !bg-white/10 !text-foreground/80 hover:!bg-white/20 hover:!text-foreground')
    )
  const activeFormTabLabel = activeTab.startsWith('form-') ? activeTab.replace('form-', '') : null
  const getPratusContextLabelForTab = (tab: LeftTab) => {
    if (tab === 'notifications') return 'Notifications'
    if (tab === 'resources') return 'Resources'
    if (tab === 'aors') return 'Objectives & Actions'
    if (tab === 'incidents') return 'Incident Roster'
    if (tab === 'safety') return 'Safety Analysis'
    if (tab === 'calendar') return 'Calendar'
    if (tab === 'reports') return 'Reports'
    if (tab === 'briefing') return 'Incident Briefing ICS-201'
    if (tab === 'form-ICS-204') return 'ICS-204 Assignment List'
    if (tab.startsWith('form-')) return tab.replace('form-', '')
    return 'Panel Content'
  }
  const isCompactPanelTabs = isMapVisible && panelWidthMode === 'one-third'
  const actionAssigneeOptions: AssigneeOption[] = [
    {
      name: 'K. Simmons',
      position: 'Branch Director',
      availability: 'Available',
    },
    {
      name: 'R. Patel',
      position: 'Branch Director',
      availability: 'Available',
    },
    {
      name: 'T. Hale',
      position: 'Operations Group Supervisor',
      availability: 'Available',
    },
    {
      name: 'M. Carter',
      position: 'Utilities Task Force Lead',
      availability: 'Available',
    },
    {
      name: 'Dana Wright',
      position: 'Operations Section Chief',
      availability: 'Available',
    },
    {
      name: 'Jules Patel',
      position: 'Safety Officer',
      availability: 'Available',
    },
    {
      name: 'Rina Chen',
      position: 'Safety Officer',
      availability: 'Available',
    },
  ]
  const defaultActionDueTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  const actionDueTimezoneOptions = Array.from(
    new Set([
      defaultActionDueTimezone,
      'America/Chicago',
      'America/New_York',
      'America/Denver',
      'America/Los_Angeles',
      'UTC',
    ])
  )
  const getDefaultActionDueDate = () => new Date().toISOString().slice(0, 10)
  const getDefaultActionDueTime = () => '17:00'
  const formatCoordinate = (value: number) => value.toFixed(4)
  const assigneeDropdownGridClasses =
    'grid w-full grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.4fr)] items-center gap-3'
  const assigneeDropdownRowGridClasses =
    'grid w-full grid-cols-[auto_minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.4fr)] items-center gap-3'

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!searchComponentRef.current) {
        return
      }

      if (!searchComponentRef.current.contains(event.target as Node)) {
        setIsSearchResultsOpen(false)
      }
    }

    window.addEventListener('mousedown', onPointerDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
    }
  }, [])

  const focusMapItem = async (
    mapKey: string,
    location: [number, number],
    scale = 50000
  ) => {
    if (!mapViewRef.current) {
      return
    }

    const view = mapViewRef.current
    const targetGraphic = mapGraphicsRef.current.get(mapKey)
    const [longitude, latitude] = location

    try {
      await view.goTo(
        {
          center: location,
          scale,
        },
        {
          animate: false,
        }
      )
    } catch {
      // Ignore interrupted goTo calls from rapid clicks.
      return
    }

    if (targetGraphic) {
      const popupLocation = new Point({
        longitude,
        latitude,
      })

      view.openPopup({
        features: [targetGraphic],
        location: popupLocation,
      })

      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve())
      })

      const popupElement = document.querySelector(
        '.esri-popup__main-container'
      ) as HTMLElement | null
      const mapElement = mapContainerRef.current

      if (!popupElement || !mapElement) {
        return
      }

      const popupRect = popupElement.getBoundingClientRect()
      const mapRect = mapElement.getBoundingClientRect()
      const popupLeft = popupRect.left - mapRect.left
      const popupRight = popupRect.right - mapRect.left
      const popupTop = popupRect.top - mapRect.top
      const popupBottom = popupRect.bottom - mapRect.top
      const leftBlockWidth = leftPanelRef.current?.getBoundingClientRect().width ?? 0
      const padding = 12
      const safeLeft = leftBlockWidth + padding
      const safeRight = view.width - padding
      const safeTop = padding
      const safeBottom = view.height - padding

      let shiftX = 0
      let shiftY = 0
      if (popupLeft < safeLeft) {
        shiftX = safeLeft - popupLeft
      } else if (popupRight > safeRight) {
        shiftX = safeRight - popupRight
      }

      if (popupTop < safeTop) {
        shiftY = safeTop - popupTop
      } else if (popupBottom > safeBottom) {
        shiftY = safeBottom - popupBottom
      }

      if (shiftX !== 0 || shiftY !== 0) {
        const adjustedCenter = view.toMap({
          x: view.width / 2 - shiftX,
          y: view.height / 2 - shiftY,
        })

        if (adjustedCenter) {
          try {
            await view.goTo(
              {
                center: adjustedCenter,
                scale: view.scale,
              },
              {
                animate: false,
              }
            )
          } catch {
            return
          }

          view.openPopup({
            features: [targetGraphic],
            location: popupLocation,
          })
        }
      }
    }
  }

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const searchFilteredNotifications = notifications.filter((item) => {
    if (!normalizedQuery) {
      return true
    }

    return [
      item.title,
      item.summary,
      item.owner,
      item.status,
      item.severity,
      item.timestamp,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  })
  const searchFilteredResources = resources.filter((item) => {
    if (!normalizedQuery) {
      return true
    }

    return [
      item.name,
      item.owner,
      item.status,
      item.type,
      item.location,
      item.notes,
      item.currentLocation,
      item.datetimeOrdered,
      item.opcon,
      item.tacon,
      item.pointOfContact,
      item.owningOrganization,
      String(item.quantity),
      item.unit,
      item.hullTailNumber,
      item.symbology,
      item.latitude,
      item.longitude,
      item.capabilities,
      item.currentOpPeriod,
      item.nextOpPeriod,
      item.currentOpPeriodAssignment,
      item.nextOpPeriodAssignment,
      item.checkInStatus,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  })
  const searchFilteredAors = aors.filter((item) => {
    if (!normalizedQuery) {
      return true
    }

    return [
      item.itemType,
      item.assignee ?? '',
      item.dueDate ?? '',
      item.dueTime ?? '',
      item.dueTimezone ?? '',
      item.actionLocationAddress ?? '',
      item.actionLatitude ?? '',
      item.actionLongitude ?? '',
      item.name,
      item.lead,
      item.priority,
      String(item.incidents),
      item.lastUpdate,
      item.notes,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  })
  const searchFilteredRosterPositions = rosterPositions.filter((item) => {
    if (!normalizedQuery) {
      return true
    }

    return [
      item.position,
      item.staffingStatus,
      item.shift,
      item.supervisor,
      item.assignedUsers.join(' '),
      item.notes,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  })
  const searchFilteredSafetyAnalyses = safetyAnalyses.filter((item) => {
    if (!normalizedQuery) {
      return true
    }

    return [
      item.hazard,
      item.riskLevel,
      item.status,
      item.owner,
      item.controls,
      item.notes,
      item.reviewedAt,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  })
  const searchFilteredCalendarItems = calendarItems.filter((item) => {
    if (!normalizedQuery) {
      return true
    }

    return [item.title, item.eventType, item.status, item.timeWindow, item.owner, item.notes]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  })
  const searchFilteredReports = reports.filter((item) => {
    if (!normalizedQuery) {
      return true
    }

    return [item.title, item.reportType, item.status, item.author, item.dueBy, item.summary]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  })
  const searchFilteredIncidentBriefings = incidentBriefings.filter((item) => {
    if (!normalizedQuery) {
      return true
    }

    return [item.title, item.priority, item.presenter, item.briefingTime, item.audience, item.summary]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery)
  })
  const normalizedAppliedFilterQuery = appliedFilterQuery?.trim().toLowerCase() ?? ''
  const cardFilteredNotifications = notifications.filter((item) => {
    if (!normalizedAppliedFilterQuery) {
      return true
    }

    return [
      item.title,
      item.summary,
      item.owner,
      item.status,
      item.severity,
      item.timestamp,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedAppliedFilterQuery)
  })
  const cardFilteredResources = resources.filter((item) => {
    if (!normalizedAppliedFilterQuery) {
      return true
    }

    return [
      item.name,
      item.owner,
      item.status,
      item.type,
      item.location,
      item.notes,
      item.currentLocation,
      item.datetimeOrdered,
      item.opcon,
      item.tacon,
      item.pointOfContact,
      item.owningOrganization,
      String(item.quantity),
      item.unit,
      item.hullTailNumber,
      item.symbology,
      item.latitude,
      item.longitude,
      item.capabilities,
      item.currentOpPeriod,
      item.nextOpPeriod,
      item.currentOpPeriodAssignment,
      item.nextOpPeriodAssignment,
      item.checkInStatus,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedAppliedFilterQuery)
  })
  const cardFilteredAors = aors.filter((item) => {
    if (!normalizedAppliedFilterQuery) {
      return true
    }

    return [
      item.itemType,
      item.name,
      item.lead,
      item.priority,
      String(item.incidents),
      item.lastUpdate,
      item.notes,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedAppliedFilterQuery)
  })
  const normalizedAorSectionSearchQuery = aorSectionSearchQuery.trim().toLowerCase()
  const matchesAorSectionSearchQuery = (item: AorItem) => {
    if (!normalizedAorSectionSearchQuery) {
      return true
    }

    return [
      item.itemType,
      item.name,
      item.notes,
      item.lead,
      item.assignee ?? '',
      item.dueDate ?? '',
      item.dueTime ?? '',
      item.dueTimezone ?? '',
      item.actionLocationAddress ?? '',
      item.actionLatitude ?? '',
      item.actionLongitude ?? '',
      item.objectiveClassification ?? '',
      item.parentObjectiveId ? 'child action' : '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedAorSectionSearchQuery)
  }
  const objectiveIdsWithMatchingChildren = new Set(
    cardFilteredAors
      .filter(
        (item) =>
          item.itemType === 'Action' &&
          Boolean(item.parentObjectiveId) &&
          matchesAorSectionSearchQuery(item)
      )
      .map((item) => item.parentObjectiveId as number)
  )
  const topLevelCardFilteredAors = cardFilteredAors
    .filter((item) => !item.parentObjectiveId)
    .filter(
      (item) =>
        matchesAorSectionSearchQuery(item) ||
        (item.itemType === 'Objective' && objectiveIdsWithMatchingChildren.has(item.id))
    )
  const getChildActionsForObjective = (objectiveId: number) => {
    const childActions = cardFilteredAors.filter(
      (item) => item.itemType === 'Action' && item.parentObjectiveId === objectiveId
    )
    if (!normalizedAorSectionSearchQuery) {
      return childActions
    }
    return childActions.filter((item) => matchesAorSectionSearchQuery(item))
  }
  const normalizedAssigneeQuery = assigneeSearchQuery.trim().toLowerCase()
  const filteredActionAssigneeOptions = actionAssigneeOptions.filter((assignee) => {
    if (!normalizedAssigneeQuery) {
      return true
    }

    return [assignee.name, assignee.position].join(' ').toLowerCase().includes(normalizedAssigneeQuery)
  })
  const getAssigneeAvailabilityStatus = (assigneeName: string) => {
    const assignedAction = aors.find((item) => item.itemType === 'Action' && item.assignee === assigneeName)
    if (assignedAction) {
      return `Assigned: ${assignedAction.name}`
    }

    const assigneeRecord = actionAssigneeOptions.find((item) => item.name === assigneeName)
    return assigneeRecord?.availability ?? 'Available'
  }
  const getAvailabilityBadgeClassName = (availabilityStatus: string) =>
    cn(
      'w-full justify-center truncate text-[10px]',
      availabilityStatus === 'Available' &&
        'border-green-600 text-green-700 dark:border-green-500 dark:text-green-400'
    )
  const getObjectiveClassificationLabel = (classification?: 'O' | 'M' | 'O&M') => {
    if (classification === 'O') {
      return 'Operational'
    }
    if (classification === 'M') {
      return 'Managerial'
    }
    return 'Operational & Managerial'
  }
  const getDerivedActionStatus = (item: AorItem) =>
    item.itemType === 'Action' ? (item.assignee ? 'Assigned' : 'Unassigned') : ''
  const cardFilteredRosterPositions = rosterPositions.filter((item) => {
    if (!normalizedAppliedFilterQuery) {
      return true
    }

    return [
      item.position,
      item.staffingStatus,
      item.shift,
      item.supervisor,
      item.assignedUsers.join(' '),
      item.notes,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedAppliedFilterQuery)
  })
  const cardFilteredSafetyAnalyses = safetyAnalyses.filter((item) => {
    if (!normalizedAppliedFilterQuery) {
      return true
    }

    return [
      item.hazard,
      item.riskLevel,
      item.status,
      item.owner,
      item.controls,
      item.notes,
      item.reviewedAt,
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedAppliedFilterQuery)
  })
  const cardFilteredCalendarItems = calendarItems.filter((item) => {
    if (!normalizedAppliedFilterQuery) {
      return true
    }

    return [item.title, item.eventType, item.status, item.timeWindow, item.owner, item.notes]
      .join(' ')
      .toLowerCase()
      .includes(normalizedAppliedFilterQuery)
  })
  const cardFilteredReports = reports.filter((item) => {
    if (!normalizedAppliedFilterQuery) {
      return true
    }

    return [item.title, item.reportType, item.status, item.author, item.dueBy, item.summary]
      .join(' ')
      .toLowerCase()
      .includes(normalizedAppliedFilterQuery)
  })
  const searchResults: SearchResult[] = normalizedQuery
    ? [
        ...searchFilteredNotifications.map((item) => ({
          id: `notification-${item.id}`,
          kind: 'notification' as const,
          title: item.title,
          subtitle: `${item.severity} • ${item.status}`,
          location: item.location,
          scale: 45000,
        })),
        ...searchFilteredResources.map((item) => ({
          id: `resource-${item.id}`,
          kind: 'resource' as const,
          title: item.name,
          subtitle: `${item.status} • ${item.type}`,
          location: item.mapLocation,
          scale: 30000,
        })),
        ...searchFilteredAors.map((item) => ({
          id: `aor-${item.id}`,
          kind: 'aor' as const,
          title: item.name,
          subtitle: `${item.itemType} • ${item.priority} • ${item.lead}`,
          location: item.location,
          scale: 120000,
        })),
        ...searchFilteredRosterPositions.map((item) => ({
          id: `incident-${item.id}`,
          kind: 'roster' as const,
          title: item.position,
          subtitle: `${item.staffingStatus} • ${item.shift}`,
          location: item.location,
          scale: 60000,
        })),
        ...searchFilteredSafetyAnalyses.map((item) => ({
          id: `safety-${item.id}`,
          kind: 'safety' as const,
          title: item.hazard,
          subtitle: `${item.riskLevel} Risk • ${item.status}`,
          location: item.location,
          scale: 50000,
        })),
        ...searchFilteredCalendarItems.map((item) => ({
          id: `calendar-${item.id}`,
          kind: 'calendar' as const,
          title: item.title,
          subtitle: `${item.eventType} • ${item.timeWindow}`,
          location: item.location,
          scale: 50000,
        })),
        ...searchFilteredReports.map((item) => ({
          id: `report-${item.id}`,
          kind: 'report' as const,
          title: item.title,
          subtitle: `${item.reportType} • ${item.status}`,
          location: item.location,
          scale: 50000,
        })),
        ...searchFilteredIncidentBriefings.map((item) => ({
          id: `briefing-${item.id}`,
          kind: 'briefing' as const,
          title: item.title,
          subtitle: `${item.priority} • ${item.briefingTime}`,
          location: item.location,
          scale: 50000,
        })),
      ]
    : []

  const handleFilterByResult = (result: SearchResult) => {
    if (result.kind === 'aor') {
      setActiveTab('aors')
    }

    if (result.kind === 'roster') {
      setActiveTab('incidents')
    }
    if (result.kind === 'safety') {
      setActiveTab('safety')
    }
    if (result.kind === 'calendar') {
      setActiveTab('calendar')
    }
    if (result.kind === 'report') {
      setActiveTab('reports')
    }
    if (result.kind === 'briefing') {
      setActiveTab('briefing')
    }

    setSearchQuery(result.title)
    setAppliedFilterQuery(result.title)
    setAppliedFilterLabel(result.title)
    setExpandedItemId(result.id)
  }

  const toggleExpandedItem = (key: string) => {
    setExpandedItemId((previous) => (previous === key ? null : key))
  }

  const updateAorActionTiming = (
    aorId: number,
    updates: Partial<Pick<AorItem, 'dueDate' | 'dueTime' | 'dueTimezone'>>
  ) => {
    setAors((previous) =>
      previous.map((item) => (item.id === aorId && item.itemType === 'Action' ? { ...item, ...updates } : item))
    )
  }

  const updateAorActionLocation = (
    aorId: number,
    updates: Partial<Pick<AorItem, 'actionLocationAddress' | 'actionLatitude' | 'actionLongitude'>>
  ) => {
    setAors((previous) =>
      previous.map((item) => {
        if (item.id !== aorId || item.itemType !== 'Action') {
          return item
        }

        const nextItem: AorItem = {
          ...item,
          ...updates,
        }

        const latitude = Number(nextItem.actionLatitude)
        const longitude = Number(nextItem.actionLongitude)
        if (
          !Number.isNaN(latitude) &&
          !Number.isNaN(longitude) &&
          latitude >= -90 &&
          latitude <= 90 &&
          longitude >= -180 &&
          longitude <= 180
        ) {
          nextItem.location = [longitude, latitude]
        }

        return nextItem
      })
    )
  }

  useEffect(() => {
    if (!drawMapTarget || !mapViewRef.current) {
      return
    }

    const view = mapViewRef.current
    const container = view.container as HTMLDivElement | null
    if (!container) {
      return
    }
    const previousCursor = container.style.cursor
    container.style.cursor = 'crosshair'

    const clickHandle = view.on('click', (event) => {
      if (!event.mapPoint) {
        return
      }

      event.stopPropagation()
      const { latitude: rawLatitude, longitude: rawLongitude } = event.mapPoint
      if (typeof rawLatitude !== 'number' || typeof rawLongitude !== 'number') {
        return
      }
      const latitude = formatCoordinate(rawLatitude)
      const longitude = formatCoordinate(rawLongitude)
      if (drawMapTarget.type === 'existing-action') {
        updateAorActionLocation(drawMapTarget.actionId, {
          actionLatitude: latitude,
          actionLongitude: longitude,
          actionLocationAddress: '',
        })
      } else if (drawMapTarget.type === 'inline-action') {
        setInlineAorDraft((previous) =>
          previous && previous.itemType === 'Action'
            ? {
                ...previous,
                actionLatitude: latitude,
                actionLongitude: longitude,
                actionLocationAddress: '',
              }
            : previous
        )
      } else if (drawMapTarget.type === 'inline-child-action') {
        setInlineChildActionDraft((previous) =>
          previous
            ? {
                ...previous,
                actionLatitude: latitude,
                actionLongitude: longitude,
                actionLocationAddress: '',
              }
            : previous
        )
      }
      if (drawLocationLayerRef.current) {
        if (drawLocationGraphicRef.current) {
          drawLocationLayerRef.current.remove(drawLocationGraphicRef.current)
        }
        const drawPointGraphic = new Graphic({
          geometry: {
            type: 'point',
            longitude: rawLongitude,
            latitude: rawLatitude,
          },
          symbol: {
            type: 'simple-marker',
            color: [14, 165, 233, 0.95],
            size: 12,
            outline: {
              color: [255, 255, 255, 1],
              width: 1.5,
            },
          },
        })
        drawLocationLayerRef.current.add(drawPointGraphic)
        drawLocationGraphicRef.current = drawPointGraphic
      }
      setDrawMapTarget(null)
    })

    return () => {
      clickHandle.remove()
      container.style.cursor = previousCursor
    }
  }, [drawMapTarget])

  const startEditingAction = (aorId: number, name: string) => {
    setEditingActionDraft({
      id: aorId,
      name,
    })
  }

  const saveEditingAction = () => {
    if (!editingActionDraft?.name.trim()) {
      return
    }

    setAors((previous) =>
      previous.map((item) =>
        item.id === editingActionDraft.id && item.itemType === 'Action'
          ? {
              ...item,
              name: editingActionDraft.name.trim(),
            }
          : item
      )
    )
    setEditingActionDraft(null)
  }

  const setAorAssignee = (aorId: number, assignee: string) => {
    setAors((previous) =>
      previous.map((item) => {
        if (item.id !== aorId || item.itemType !== 'Action') {
          return item
        }
        return {
          ...item,
          assignee: assignee || undefined,
        }
      })
    )
  }

  const setInlineActionAssignee = (assignee: string) => {
    setInlineAorDraft((previous) => {
      if (!previous || previous.itemType !== 'Action') {
        return previous
      }
      return {
        ...previous,
        assignee,
      }
    })
  }

  const setInlineChildActionAssignee = (assignee: string) => {
    setInlineChildActionDraft((previous) => {
      if (!previous) {
        return previous
      }
      return {
        ...previous,
        assignee,
      }
    })
  }

  const getPendingAssigneeSelection = (pickerKey: string, fallbackAssignee?: string) =>
    pendingAssigneeSelections[pickerKey] ?? fallbackAssignee ?? ''

  const setPendingAssigneeSelection = (pickerKey: string, assignee: string) => {
    setPendingAssigneeSelections((previous) => ({
      ...previous,
      [pickerKey]: assignee,
    }))
  }

  const startInlineAorDraft = (itemType: 'Objective' | 'Action') => {
    setEditingActionDraft(null)
    setInlineChildActionDraft(null)
    setInlineAorDraft({
      itemType,
      objectiveClassification: 'O',
      assignee: '',
      dueDate: getDefaultActionDueDate(),
      dueTime: getDefaultActionDueTime(),
      dueTimezone: defaultActionDueTimezone,
      actionLocationAddress: '',
      actionLatitude: '',
      actionLongitude: '',
      name: '',
      notes: '',
    })
  }

  const submitInlineAorDraft = () => {
    if (!inlineAorDraft?.name.trim()) {
      return
    }

    const nextId = aors.reduce((max, item) => Math.max(max, item.id), 0) + 1
    const now = new Date()
    const lastUpdate = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const baseLocation: [number, number] = aors[0]?.location ?? [-96.7894, 32.788]
    const jitter = (Math.random() - 0.5) * 0.1
    const fallbackLocation: [number, number] = [baseLocation[0] + jitter, baseLocation[1] + jitter / 1.3]
    const inputLatitude = Number(inlineAorDraft.actionLatitude)
    const inputLongitude = Number(inlineAorDraft.actionLongitude)
    const hasValidInputCoordinates =
      !Number.isNaN(inputLatitude) &&
      !Number.isNaN(inputLongitude) &&
      inputLatitude >= -90 &&
      inputLatitude <= 90 &&
      inputLongitude >= -180 &&
      inputLongitude <= 180
    const newLocation: [number, number] =
      inlineAorDraft.itemType === 'Action' && hasValidInputCoordinates
        ? [inputLongitude, inputLatitude]
        : fallbackLocation
    const actionLatitude = formatCoordinate(newLocation[1])
    const actionLongitude = formatCoordinate(newLocation[0])

    const newItem: AorItem = {
      id: nextId,
      itemType: inlineAorDraft.itemType,
      objectiveClassification:
        inlineAorDraft.itemType === 'Objective' ? inlineAorDraft.objectiveClassification : undefined,
      assignee: inlineAorDraft.itemType === 'Action' ? inlineAorDraft.assignee || undefined : undefined,
      dueDate: inlineAorDraft.itemType === 'Action' ? inlineAorDraft.dueDate : undefined,
      dueTime: inlineAorDraft.itemType === 'Action' ? inlineAorDraft.dueTime : undefined,
      dueTimezone: inlineAorDraft.itemType === 'Action' ? inlineAorDraft.dueTimezone : undefined,
      actionLocationAddress:
        inlineAorDraft.itemType === 'Action'
          ? inlineAorDraft.actionLocationAddress.trim() || undefined
          : undefined,
      actionLatitude:
        inlineAorDraft.itemType === 'Action'
          ? inlineAorDraft.actionLatitude.trim() || actionLatitude
          : undefined,
      actionLongitude:
        inlineAorDraft.itemType === 'Action'
          ? inlineAorDraft.actionLongitude.trim() || actionLongitude
          : undefined,
      name: inlineAorDraft.name.trim(),
      lead:
        inlineAorDraft.itemType === 'Objective'
          ? 'Branch Director (Unassigned)'
          : 'Operations Lead (Unassigned)',
      incidents: 0,
      priority: 'Medium',
      population: 'TBD',
      lastUpdate,
      evacuationStatus: 'None',
      notes: inlineAorDraft.notes.trim() || `${inlineAorDraft.itemType} added by user.`,
      location: newLocation,
    }

    setAors((previous) => [newItem, ...previous])
    setActiveTab('aors')
    setExpandedItemId(`aor-${nextId}`)
    setInlineAorDraft(null)
  }

  const startInlineChildActionDraft = (objectiveId: number) => {
    setEditingActionDraft(null)
    setInlineAorDraft(null)
    setExpandedItemId(`aor-${objectiveId}`)
    setInlineChildActionDraft({
      objectiveId,
      assignee: '',
      dueDate: getDefaultActionDueDate(),
      dueTime: getDefaultActionDueTime(),
      dueTimezone: defaultActionDueTimezone,
      actionLocationAddress: '',
      actionLatitude: '',
      actionLongitude: '',
      name: '',
    })
  }

  const submitInlineChildActionDraft = () => {
    if (!inlineChildActionDraft?.name.trim()) {
      return
    }

    const nextId = aors.reduce((max, item) => Math.max(max, item.id), 0) + 1
    const now = new Date()
    const lastUpdate = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    const parentObjective = aors.find((item) => item.id === inlineChildActionDraft.objectiveId)
    const baseLocation: [number, number] = parentObjective?.location ?? aors[0]?.location ?? [-96.7894, 32.788]
    const jitter = (Math.random() - 0.5) * 0.05
    const fallbackLocation: [number, number] = [baseLocation[0] + jitter, baseLocation[1] + jitter / 1.3]
    const inputLatitude = Number(inlineChildActionDraft.actionLatitude)
    const inputLongitude = Number(inlineChildActionDraft.actionLongitude)
    const hasValidInputCoordinates =
      !Number.isNaN(inputLatitude) &&
      !Number.isNaN(inputLongitude) &&
      inputLatitude >= -90 &&
      inputLatitude <= 90 &&
      inputLongitude >= -180 &&
      inputLongitude <= 180
    const newLocation: [number, number] = hasValidInputCoordinates
      ? [inputLongitude, inputLatitude]
      : fallbackLocation
    const actionLatitude = formatCoordinate(newLocation[1])
    const actionLongitude = formatCoordinate(newLocation[0])

    const newChildAction: AorItem = {
      id: nextId,
      itemType: 'Action',
      parentObjectiveId: inlineChildActionDraft.objectiveId,
      assignee: inlineChildActionDraft.assignee || undefined,
      dueDate: inlineChildActionDraft.dueDate,
      dueTime: inlineChildActionDraft.dueTime,
      dueTimezone: inlineChildActionDraft.dueTimezone,
      actionLocationAddress: inlineChildActionDraft.actionLocationAddress.trim() || undefined,
      actionLatitude: inlineChildActionDraft.actionLatitude.trim() || actionLatitude,
      actionLongitude: inlineChildActionDraft.actionLongitude.trim() || actionLongitude,
      name: inlineChildActionDraft.name.trim(),
      lead: 'Operations Lead (Unassigned)',
      incidents: 0,
      priority: 'Medium',
      population: 'TBD',
      lastUpdate,
      evacuationStatus: 'None',
      notes: '',
      location: newLocation,
    }

    setAors((previous) => [newChildAction, ...previous])
    setExpandedItemId(`aor-${inlineChildActionDraft.objectiveId}`)
    setInlineChildActionDraft(null)
  }

  const deleteAorItem = (aorId: number) => {
    const aorKey = `aor-${aorId}`
    setAors((previous) => previous.filter((item) => item.id !== aorId && item.parentObjectiveId !== aorId))
    setExpandedItemId((previous) => (previous === aorKey ? null : previous))
    setSelectedPanelItemId((previous) => (previous === aorKey ? null : previous))
    setInlineChildActionDraft((previous) => (previous && previous.objectiveId === aorId ? null : previous))
    setEditingActionDraft(null)
  }
  const togglePratusAiSource = (source: 'web' | 'incidentData' | 'files', checked: boolean) => {
    setPratusAiDataSources((previous) => ({
      ...previous,
      [source]: checked,
    }))
    if (source === 'files' && !checked) {
      setPratusAiSelectedFiles([])
    }
  }
  const handlePratusAiFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (!selectedFiles) {
      setPratusAiSelectedFiles([])
      return
    }
    setPratusAiSelectedFiles(Array.from(selectedFiles).map((file) => file.name))
  }
  const handlePratusPlanDecision = (messageId: number, decision: 'accepted' | 'cancelled') => {
    if (isPratusAiLoading) {
      return
    }
    setIsPratusAiLoading(true)
    if (pratusAiLoadingTimerRef.current) {
      window.clearTimeout(pratusAiLoadingTimerRef.current)
      pratusAiLoadingTimerRef.current = null
    }
    pratusAiLoadingTimerRef.current = window.setTimeout(() => {
      let shouldApplyPlan = false
      setPratusAiMessages((previous) =>
        previous.map((message) => {
          if (message.id !== messageId || !message.plan || message.plan.status !== 'pending') {
            return message
          }
          shouldApplyPlan = decision === 'accepted'
          return {
            ...message,
            plan: {
              ...message.plan,
              status: decision,
            },
          }
        })
      )

      if (shouldApplyPlan) {
        let firstNewObjectiveId = 0
        setAors((previous) => {
          const nextIdStart = previous.reduce((max, item) => Math.max(max, item.id), 0) + 1
          firstNewObjectiveId = nextIdStart
          const now = new Date()
          const lastUpdate = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
          const baseLocation: [number, number] = previous[0]?.location ?? [-96.7894, 32.788]
          const newObjectives: AorItem[] = [
            {
              id: nextIdStart,
              itemType: 'Objective',
              objectiveClassification: 'O',
              name: 'Establish life-safety perimeter checks by sector',
              lead: 'Planning Section (PRATUS Proposed)',
              incidents: 0,
              priority: 'High',
              population: 'TBD',
              lastUpdate,
              evacuationStatus: 'Recommended',
              notes: '',
              location: [baseLocation[0] + 0.01, baseLocation[1] + 0.01],
            },
            {
              id: nextIdStart + 1,
              itemType: 'Objective',
              objectiveClassification: 'M',
              name: 'Synchronize branch staffing and handoff timeline',
              lead: 'Planning Section (PRATUS Proposed)',
              incidents: 0,
              priority: 'Medium',
              population: 'TBD',
              lastUpdate,
              evacuationStatus: 'None',
              notes: '',
              location: [baseLocation[0] + 0.015, baseLocation[1] - 0.006],
            },
            {
              id: nextIdStart + 2,
              itemType: 'Objective',
              objectiveClassification: 'O&M',
              name: 'Publish operational priorities for next op period',
              lead: 'Planning Section (PRATUS Proposed)',
              incidents: 0,
              priority: 'High',
              population: 'TBD',
              lastUpdate,
              evacuationStatus: 'None',
              notes: '',
              location: [baseLocation[0] - 0.012, baseLocation[1] + 0.008],
            },
          ]
          return [...newObjectives, ...previous]
        })
        if (firstNewObjectiveId > 0) {
          setActiveTab('aors')
          setExpandedItemId(`aor-${firstNewObjectiveId}`)
        }
      }

      setIsPratusAiLoading(false)
      pratusAiLoadingTimerRef.current = null
    }, 1400)
  }
  const submitPratusAiMessage = () => {
    if (isPratusAiLoading) {
      return
    }
    const trimmedMessage = pratusAiDraftMessage.trim()
    if (!trimmedMessage) {
      return
    }
    const timestampSeed = Date.now()
    setPratusAiMessages((previous) => [
      ...previous,
      { id: timestampSeed, role: 'user', content: trimmedMessage },
    ])
    setPratusAiDraftMessage('')
    setIsPratusAiLoading(true)
    if (pratusAiLoadingTimerRef.current) {
      window.clearTimeout(pratusAiLoadingTimerRef.current)
      pratusAiLoadingTimerRef.current = null
    }
    pratusAiLoadingTimerRef.current = window.setTimeout(() => {
      setPratusAiMessages((previous) => [
        ...previous,
        {
          id: timestampSeed + 1,
          role: 'assistant',
          content:
            'Based on your current objectives, here are recommended work assignment sets:\n\n' +
            '- Perimeter control and life-safety sweeps in Division A/B.\n' +
            '- Branch staffing synchronization and relief handoff scheduling.\n' +
            '- Next operational-period briefing prep and assignment distribution.\n' +
            '\nSelect a recommended unit below to review full resource details.\n\n' +
            'Do you want PRATUS AI to create draft ICS-204s for these assignments?',
          recommendations: [
            {
              assignment: 'Perimeter control and life-safety sweeps in Division A/B.',
              unitLabel: 'Urban Search Team Alpha',
              resourceId: 1,
            },
            {
              assignment: 'Branch staffing synchronization and relief handoff scheduling.',
              unitLabel: 'Mobile Command Unit',
              resourceId: 2,
            },
            {
              assignment: 'Next operational-period briefing prep and assignment distribution.',
              unitLabel: 'Medical Strike Team',
              resourceId: 3,
            },
          ],
          plan: {
            action: 'draft-ics-204-recommendation',
            status: 'pending',
            steps: [
              'Map existing objectives to concrete work assignment sets',
              'Pair each assignment with currently available resources',
              'Create draft ICS-204 entries for review and refinement',
            ],
          },
        },
      ])
      setIsPratusAiLoading(false)
      pratusAiLoadingTimerRef.current = null
    }, 1600)
  }
  const updateIcs201Field = <K extends keyof Ics201FormState>(field: K, value: Ics201FormState[K]) => {
    setIcs201Form((previous) => ({
      ...previous,
      [field]: value,
    }))
  }
  const updateIcs201Objective = (index: number, value: string) => {
    setIcs201Form((previous) => ({
      ...previous,
      objectives: previous.objectives.map((objective, objectiveIndex) =>
        objectiveIndex === index ? value : objective
      ),
    }))
  }
  const addIcs201Objective = () => {
    setIcs201Form((previous) => ({
      ...previous,
      objectives: [...previous.objectives, ''],
    }))
  }
  const updateIcs201Action = (actionId: number, field: keyof Ics201ActionRow, value: string) => {
    setIcs201Form((previous) => ({
      ...previous,
      actions: previous.actions.map((action) =>
        action.id === actionId
          ? {
              ...action,
              [field]: value,
            }
          : action
      ),
    }))
  }
  const addIcs201Action = () => {
    setIcs201Form((previous) => ({
      ...previous,
      actions: [
        ...previous.actions,
        {
          id: previous.actions.length === 0 ? 1 : Math.max(...previous.actions.map((item) => item.id)) + 1,
          task: '',
          owner: '',
          startTime: '',
          endTime: '',
          status: 'Planned',
        },
      ],
    }))
  }
  const updateIcs201OrgChartField = (
    field: keyof Ics201FormState['orgChart'],
    value: string
  ) => {
    setIcs201Form((previous) => ({
      ...previous,
      orgChart: {
        ...previous.orgChart,
        [field]: value,
      },
    }))
  }
  const updateIcs201Resource = (
    resourceId: number,
    field: keyof Ics201ResourceSummaryRow,
    value: string
  ) => {
    setIcs201Form((previous) => ({
      ...previous,
      resources: previous.resources.map((resource) =>
        resource.id === resourceId
          ? {
              ...resource,
              [field]: value,
            }
          : resource
      ),
    }))
  }
  const addIcs201Resource = () => {
    setIcs201Form((previous) => ({
      ...previous,
      resources: [
        ...previous.resources,
        {
          id:
            previous.resources.length === 0
              ? 1
              : Math.max(...previous.resources.map((item) => item.id)) + 1,
          category: '',
          identifier: '',
          quantity: '',
          status: 'Planned',
          assignment: '',
        },
      ],
    }))
  }
  const updateIcs201SafetyAnalysis = (
    rowId: number,
    field: keyof Ics201SafetyRow,
    value: string
  ) => {
    setIcs201Form((previous) => ({
      ...previous,
      safetyAnalysis: previous.safetyAnalysis.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
            }
          : row
      ),
    }))
  }
  const addIcs201SafetyAnalysis = () => {
    setIcs201Form((previous) => ({
      ...previous,
      safetyAnalysis: [
        ...previous.safetyAnalysis,
        {
          id:
            previous.safetyAnalysis.length === 0
              ? 1
              : Math.max(...previous.safetyAnalysis.map((item) => item.id)) + 1,
          hazard: '',
          mitigation: '',
          ppe: '',
          medicalPlan: '',
        },
      ],
    }))
  }
  const addIcs204Form = () => {
    let createdId = 1
    let createdForm: Ics204FormState | null = null
    setIcs204Forms((previous) => {
      const nextId = previous.length === 0 ? 1 : Math.max(...previous.map((form) => form.id)) + 1
      createdId = nextId
      const newForm: Ics204FormState = {
        id: nextId,
        assignedUnit: `New Unit ${nextId}`,
        branch: '',
        division: '',
        group: '',
        stagingArea: '',
        sectionChief: '',
        branchDirector: '',
        divisionGroupSupervisor: '',
        resourcesAssigned: [],
        workAssignments: [],
        specialInstructions: '',
        communications: '',
      }
      createdForm = newForm
      return [...previous, newForm]
    })
    setExpandedIcs204FormId(createdId)
    if (createdForm) {
      const initialVersion: Ics204Version = {
        id: `seed-204-${createdId}-v1`,
        createdAt: Date.now(),
        authorName: 'You',
        authorColor: '#16a34a',
        snapshot: createdForm,
        signatures: [],
      }
      setIcs204VersionsById((previous) => ({ ...previous, [createdId]: [initialVersion] }))
    }
  }
  const updateIcs204Field = <K extends keyof Omit<Ics204FormState, 'id'>>(
    formId: number,
    field: K,
    value: Ics204FormState[K]
  ) => {
    setIcs204Forms((previous) =>
      previous.map((form) =>
        form.id === formId
          ? {
              ...form,
              [field]: value,
            }
          : form
      )
    )
  }
  const updateIcs204ResourceAssigned = (
    formId: number,
    rowId: number,
    field: keyof Ics204ResourceAssignedRow,
    value: string
  ) => {
    setIcs204Forms((previous) =>
      previous.map((form) =>
        form.id === formId
          ? {
              ...form,
              resourcesAssigned: form.resourcesAssigned.map((row) =>
                row.id === rowId
                  ? {
                      ...row,
                      [field]: value,
                    }
                  : row
              ),
            }
          : form
      )
    )
  }
  const addIcs204ResourceAssigned = (formId: number, resource: ResourceItem) => {
    setIcs204Forms((previous) =>
      previous.map((form) =>
        form.id === formId
          ? {
              ...form,
              resourcesAssigned: [
                ...form.resourcesAssigned,
                {
                  id:
                    form.resourcesAssigned.length === 0
                      ? 1
                      : Math.max(...form.resourcesAssigned.map((row) => row.id)) + 1,
                  resourceIdentifier: resource.name,
                  leader: resource.teamLead,
                  contact:
                    resource.pointOfContact && resource.pointOfContact !== '---'
                      ? resource.pointOfContact
                      : resource.owner,
                  location:
                    resource.currentLocation && resource.currentLocation !== '---'
                      ? resource.currentLocation
                      : resource.location,
                },
              ],
            }
          : form
      )
    )
    setIcs204ResourcePickerFormId(null)
  }
  const deleteIcs204ResourceAssignedRow = (formId: number, rowId: number) => {
    setIcs204Forms((previous) =>
      previous.map((form) =>
        form.id === formId
          ? {
              ...form,
              resourcesAssigned: form.resourcesAssigned.filter((row) => row.id !== rowId),
            }
          : form
      )
    )
  }
  const updateIcs204WorkAssignment = (
    formId: number,
    rowId: number,
    field: Exclude<keyof Ics204WorkAssignmentRow, 'resourceRequirements'>,
    value: string
  ) => {
    setIcs204Forms((previous) =>
      previous.map((form) =>
        form.id === formId
          ? {
              ...form,
              workAssignments: form.workAssignments.map((row) =>
                row.id === rowId
                  ? {
                      ...row,
                      [field]: value,
                    }
                  : row
              ),
            }
          : form
      )
    )
  }
  const addIcs204WorkAssignment = (formId: number) => {
    setIcs204Forms((previous) =>
      previous.map((form) =>
        form.id === formId
          ? {
              ...form,
              workAssignments: [
                ...form.workAssignments,
                {
                  id:
                    form.workAssignments.length === 0
                      ? 1
                      : Math.max(...form.workAssignments.map((row) => row.id)) + 1,
                  assignment: '',
                  priority: '',
                  resourceRequirements: [],
                  overheadPositions: '',
                  specialEquipmentSupplies: '',
                  reportingLocation: '',
                  requestedArrivalTime: '',
                },
              ],
            }
          : form
      )
    )
  }
  const addIcs204ResourceRequirementRow = (formId: number, workAssignmentId: number) => {
    setIcs204Forms((previous) =>
      previous.map((form) =>
        form.id === formId
          ? {
              ...form,
              workAssignments: form.workAssignments.map((workAssignment) =>
                workAssignment.id === workAssignmentId
                  ? {
                      ...workAssignment,
                      resourceRequirements: [
                        ...workAssignment.resourceRequirements,
                        {
                          id:
                            workAssignment.resourceRequirements.length === 0
                              ? 1
                              : Math.max(...workAssignment.resourceRequirements.map((row) => row.id)) + 1,
                          resource: '',
                          required: '',
                          have: '',
                          need: '',
                        },
                      ],
                    }
                  : workAssignment
              ),
            }
          : form
      )
    )
  }
  const updateIcs204ResourceRequirementCell = (
    formId: number,
    workAssignmentId: number,
    requirementId: number,
    field: keyof Ics204ResourceRequirementRow,
    value: string
  ) => {
    setIcs204Forms((previous) =>
      previous.map((form) =>
        form.id === formId
          ? {
              ...form,
              workAssignments: form.workAssignments.map((workAssignment) =>
                workAssignment.id === workAssignmentId
                  ? {
                      ...workAssignment,
                      resourceRequirements: workAssignment.resourceRequirements.map((requirement) =>
                        requirement.id === requirementId
                          ? {
                              ...requirement,
                              [field]: value,
                            }
                          : requirement
                      ),
                    }
                  : workAssignment
              ),
            }
          : form
      )
    )
  }
  const deleteIcs204ResourceRequirementRow = (
    formId: number,
    workAssignmentId: number,
    requirementId: number
  ) => {
    setIcs204Forms((previous) =>
      previous.map((form) =>
        form.id === formId
          ? {
              ...form,
              workAssignments: form.workAssignments.map((workAssignment) =>
                workAssignment.id === workAssignmentId
                  ? {
                      ...workAssignment,
                      resourceRequirements: workAssignment.resourceRequirements.filter(
                        (requirement) => requirement.id !== requirementId
                      ),
                    }
                  : workAssignment
              ),
            }
          : form
      )
    )
  }
  const updateIcs233Row = <K extends keyof Omit<Ics233TaskRow, 'id'>>(
    rowId: number,
    field: K,
    value: Ics233TaskRow[K]
  ) => {
    setIcs233Rows((previous) =>
      previous.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
            }
          : row
      )
    )
  }
  const deleteIcs233Row = (rowId: number) => {
    setIcs233Rows((previous) => previous.filter((row) => row.id !== rowId))
    if (activeIcs233CellEdit?.rowId === rowId) {
      setActiveIcs233CellEdit(null)
    }
    if (expandedIcs233RowId === rowId) {
      setExpandedIcs233RowId(null)
    }
    if (selectedIcs233RowId === rowId) {
      setSelectedIcs233RowId(null)
      setIsIcs233RowModalEditing(false)
    }
  }
  const ics233AssigneeOptions = [
    'Planning Section Staffing Cell',
    'Law Group 1',
    'Urban Search Team Alpha',
    'Medical Strike Team',
    'Mobile Command Unit',
  ]
  const ics233PointOfContactOptions = [
    'M. Bennett (555-0113)',
    'Capt. R. Wallace (555-0104)',
    'Capt. J. Nguyen (555-0142)',
    'Dr. S. Cole (555-0158)',
    'Lt. A. Rivera (555-0171)',
  ]
  const filteredIcs233Rows = ics233Rows.filter((row) => {
    const matchesTask = row.task.toLowerCase().includes(ics233Filters.task.trim().toLowerCase())
    const matchesAssignee =
      ics233Filters.assignee === 'all' || row.assignee === ics233Filters.assignee
    const matchesPoc =
      ics233Filters.pointOfContact === 'all' || row.pointOfContact === ics233Filters.pointOfContact
    const matchesPocBriefed =
      ics233Filters.pocBriefed === 'all' || row.pocBriefed === ics233Filters.pocBriefed
    const startFilterTime = ics233Filters.start ? new Date(ics233Filters.start).getTime() : null
    const rowStartTime = row.start ? new Date(row.start).getTime() : null
    const deadlineFilterTime = ics233Filters.deadline ? new Date(ics233Filters.deadline).getTime() : null
    const rowDeadlineTime = row.deadline ? new Date(row.deadline).getTime() : null
    const matchesStart =
      ics233Filters.startMode === 'all' ||
      startFilterTime === null ||
      rowStartTime === null ||
      (ics233Filters.startMode === 'before' && rowStartTime <= startFilterTime) ||
      (ics233Filters.startMode === 'after' && rowStartTime >= startFilterTime)
    const matchesDeadline =
      ics233Filters.deadlineMode === 'all' ||
      deadlineFilterTime === null ||
      rowDeadlineTime === null ||
      (ics233Filters.deadlineMode === 'before' && rowDeadlineTime <= deadlineFilterTime) ||
      (ics233Filters.deadlineMode === 'after' && rowDeadlineTime >= deadlineFilterTime)
    const matchesStatus = ics233Filters.status === 'all' || row.status === ics233Filters.status
    return (
      matchesTask &&
      matchesAssignee &&
      matchesPoc &&
      matchesPocBriefed &&
      matchesStart &&
      matchesDeadline &&
      matchesStatus
    )
  })
  const selectedIcs233Row =
    selectedIcs233RowId === null ? null : ics233Rows.find((row) => row.id === selectedIcs233RowId) ?? null
  const selectedPratusResource =
    selectedPratusResourceId === null
      ? null
      : resources.find((resource) => resource.id === selectedPratusResourceId) ?? null
  const ics204AttachableResources: ResourceItem[] = [
    ...resources,
    {
      id: 901,
      name: 'Law Group 1',
      owner: 'Operations Section',
      status: 'Assigned',
      type: 'Law Enforcement Team',
      teamLead: 'Capt. R. Wallace',
      eta: 'On-site',
      location: 'Division A Command Post',
      notes: 'Traffic and perimeter enforcement team.',
      mapLocation: [-96.7831, 32.7912],
      currentLocation: 'Division A Command Post',
      datetimeOrdered: '04/07/2026 21:00 UTC',
      opcon: 'Operations',
      tacon: 'Division A',
      pointOfContact: 'CAPT Wallace (555-0104)',
      owningOrganization: 'Metro Police',
      quantity: 1,
      unit: 'Team',
      hullTailNumber: 'N/A',
      symbology: 'Law',
      latitude: '32.7912',
      longitude: '-96.7831',
      capabilities: 'Perimeter control, route security, crowd control',
      currentOpPeriod: 'Current',
      nextOpPeriod: 'Next',
      currentOpPeriodAssignment: 'Division A perimeter hold',
      nextOpPeriodAssignment: 'Division B handoff perimeter sweep',
      checkInStatus: 'Onsite',
    } as ResourceItem,
    {
      id: 902,
      name: 'Planning Section Staffing Cell',
      owner: 'Planning Section',
      status: 'Available',
      type: 'Planning Support Team',
      teamLead: 'M. Bennett',
      eta: 'Ready now',
      location: 'Planning Tent',
      notes: 'Staffing and handoff scheduling support.',
      mapLocation: [-96.7869, 32.7871],
      currentLocation: 'Planning Tent',
      datetimeOrdered: '04/07/2026 21:00 UTC',
      opcon: 'Planning',
      tacon: 'Planning',
      pointOfContact: 'M. Bennett (555-0113)',
      owningOrganization: 'SEOC',
      quantity: 1,
      unit: 'Cell',
      hullTailNumber: 'N/A',
      symbology: 'Staff',
      latitude: '32.7871',
      longitude: '-96.7869',
      capabilities: 'Staffing matrix, shift handoff, assignment coordination',
      currentOpPeriod: 'Current',
      nextOpPeriod: 'Next',
      currentOpPeriodAssignment: 'Situation board updates',
      nextOpPeriodAssignment: '---',
      checkInStatus: 'Onsite',
    } as ResourceItem,
  ].slice(0, 5)
  const normalizedIcs204ResourceQuery = ics204ResourceNameFilter.trim().toLowerCase()
  const filteredIcs204AttachableResources = ics204AttachableResources.filter((resource) => {
    const isScheduledCurrentOp =
      resource.currentOpPeriodAssignment.trim().length > 0 &&
      resource.currentOpPeriodAssignment !== '---'
    const isScheduledNextOp =
      resource.nextOpPeriodAssignment.trim().length > 0 &&
      resource.nextOpPeriodAssignment !== '---'
    const haystack = [
      resource.name,
      resource.owner,
      resource.type,
      resource.location,
      resource.notes,
      resource.teamLead,
    ]
      .join(' ')
      .toLowerCase()
    const matchesName =
      normalizedIcs204ResourceQuery.length === 0 || haystack.includes(normalizedIcs204ResourceQuery)
    const matchesCurrentLocation =
      ics204ResourceCurrentLocationFilter.trim().length === 0 ||
      resource.currentLocation.toLowerCase().includes(ics204ResourceCurrentLocationFilter.trim().toLowerCase())
    const matchesCurrentOp =
      ics204ResourceCurrentOpFilter === 'all' ||
      (ics204ResourceCurrentOpFilter === 'scheduled' && isScheduledCurrentOp) ||
      (ics204ResourceCurrentOpFilter === 'available' && !isScheduledCurrentOp)
    const matchesNextOp =
      ics204ResourceNextOpFilter === 'all' ||
      (ics204ResourceNextOpFilter === 'scheduled' && isScheduledNextOp) ||
      (ics204ResourceNextOpFilter === 'available' && !isScheduledNextOp)
    return matchesName && matchesCurrentLocation && matchesCurrentOp && matchesNextOp
  })

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <div
        className={cn(
          'absolute inset-x-0 top-0 z-50 h-14 border-b px-4 shadow-lg backdrop-blur transition-colors duration-200',
          glassPanelClasses,
          !isGlassMode && 'backdrop-blur supports-[backdrop-filter]:bg-background/80'
        )}
      >
        <div className="flex h-full items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <img src={pratusLogo} alt="Pratus logo" className="h-6 w-auto object-contain" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Open menu"
              className={glassIconButtonClasses}
            >
              <Menu className="h-4 w-4" />
            </Button>
            <span className="font-semibold">Incident Alpha</span>
            <span className="text-muted-foreground">My Position: Incident Commander</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Open Planning-P status modal"
              className={glassIconButtonClasses}
              onClick={() => setIsPlanningPDialogOpen(true)}
            >
              <span className="text-xs font-semibold">P</span>
            </Button>
          </div>
          <div className="flex items-start gap-2">
            {appliedFilterLabel && (
              <div
                className={cn(
                  'flex h-10 items-center gap-1 rounded-full border px-3 text-xs shadow-md',
                  glassSearchClasses
                )}
              >
                <span className="font-medium">Filter Applied:</span>
                <span>{appliedFilterLabel}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  aria-label="Clear applied filter"
                  onClick={() => {
                    setAppliedFilterLabel(null)
                    setAppliedFilterQuery(null)
                  }}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            <div
              ref={searchComponentRef}
              className={cn(
                'relative transition-all duration-200',
                isSearchExpanded || normalizedQuery ? 'w-[28rem]' : 'w-64'
              )}
            >
              <div
                className={cn(
                  'flex min-h-10 items-center gap-2 rounded-md border px-3 shadow-md',
                  glassSearchClasses
                )}
              >
                <Search className="h-4 w-4 text-muted-foreground" />
                {selectedSearchResult && (
                  <div className="inline-flex items-center gap-1 rounded-full border bg-muted px-2 py-1 text-xs">
                    <span className="max-w-44 truncate">{selectedSearchResult.title}</span>
                    <button
                      type="button"
                      className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-muted-foreground/10"
                      aria-label="Clear selected search result"
                      onClick={() => {
                        setSelectedSearchResult(null)
                        setSearchQuery('')
                        setIsSearchResultsOpen(false)
                      }}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <input
                  value={searchQuery}
                  onChange={(event) => {
                    const nextValue = event.target.value
                    setSearchQuery(nextValue)
                    setIsSearchResultsOpen(nextValue.trim().length > 0)
                    if (
                      selectedSearchResult &&
                      nextValue.trim().toLowerCase() !== selectedSearchResult.title.toLowerCase()
                    ) {
                      setSelectedSearchResult(null)
                    }
                  }}
                  onFocus={() => {
                    setIsSearchExpanded(true)
                    if (searchQuery.trim()) {
                      setIsSearchResultsOpen(true)
                    }
                  }}
                  onBlur={() => {
                    if (!searchQuery.trim()) {
                      setIsSearchExpanded(false)
                    }
                  }}
                  placeholder={selectedSearchResult ? '' : 'Search'}
                  aria-label="Search all list items"
                  className="h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />
              </div>
              {isSearchResultsOpen && normalizedQuery && (
                <Card
                  className={cn(
                    'absolute top-full left-0 z-50 mt-2 max-h-[45vh] w-full overflow-y-auto shadow-md',
                    glassSearchResultsClasses
                  )}
                >
                  <CardContent className="space-y-2 p-2">
                    {searchResults.length === 0 ? (
                      <div className="rounded-md border p-2 text-sm text-muted-foreground">
                        No results found.
                      </div>
                    ) : (
                      searchResults.map((result) => (
                        <div
                          key={result.id}
                          className="cursor-pointer rounded-md border p-2 hover:bg-muted/40"
                          role="button"
                          tabIndex={0}
                          onClick={() => {
                            setSelectedSearchResult(result)
                            setSearchQuery('')
                            setIsSearchResultsOpen(false)
                            void focusMapItem(result.id, result.location, result.scale)
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              setSelectedSearchResult(result)
                              setSearchQuery('')
                              setIsSearchResultsOpen(false)
                              void focusMapItem(result.id, result.location, result.scale)
                            }
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium">{result.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {result.kind.toUpperCase()} • {result.subtitle}
                              </p>
                            </div>
                            {(
                              result.kind === 'aor' ||
                              result.kind === 'roster' ||
                              result.kind === 'safety' ||
                              result.kind === 'calendar' ||
                              result.kind === 'report' ||
                              result.kind === 'briefing'
                            ) && (
                              <div className="flex items-center gap-1">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    handleFilterByResult(result)
                                  }}
                                >
                                  Apply Filter
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    void focusMapItem(result.id, result.location, result.scale)
                                  }}
                                >
                                  Zoom to
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn('h-10', glassIconButtonClasses)}
              onClick={() => setIsMapVisible((previous) => !previous)}
            >
              {isMapVisible ? 'Exit Map' : 'Show Map'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn('h-10 gap-2', glassIconButtonClasses)}
              onClick={() => setIsPratusAiDrawerOpen((previous) => !previous)}
            >
              <img src={pratusLogo} alt="" className="h-4 w-auto object-contain" aria-hidden="true" />
              PRATUS AI
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex overflow-hidden">
      <div className="relative min-w-0 flex-1 overflow-hidden">
      <div
        ref={mapContainerRef}
        className={cn(
          'absolute inset-0 transition-[right,opacity] duration-200',
          'right-0',
          isMapVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
      />
      <div
        ref={leftPanelRef}
        className={cn(
          'absolute top-14 left-0 z-10 h-[calc(100%-3.5rem)] transition-[width] duration-300',
          isObjectivesOpen
            ? isMapVisible
              ? panelWidthMode === 'one-half'
                ? 'w-[50vw] max-w-[50vw]'
                : 'w-[33.333vw] max-w-[33.333vw]'
              : 'w-full max-w-full'
            : 'w-14'
        )}
      >
      <Collapsible
        open={isObjectivesOpen}
        onOpenChange={setIsObjectivesOpen}
        className={cn(
          'h-full shadow-lg backdrop-blur',
          isMapVisible ? 'border-r border-border' : 'border-r-0',
          glassPanelClasses
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center justify-between border-b px-3">
            {isObjectivesOpen ? (
              <>
                <TooltipProvider>
                  <div className="flex items-center gap-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant={isGlassMode ? 'outline' : activeTab === 'notifications' ? 'default' : 'outline'}
                          className={selectedGlassTabClasses(activeTab === 'notifications')}
                          onClick={() => setActiveTab('notifications')}
                          aria-label="Open Notifications tab"
                        >
                          <Bell className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>Notifications</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant={isGlassMode ? 'outline' : activeTab === 'resources' ? 'default' : 'outline'}
                          className={selectedGlassTabClasses(activeTab === 'resources')}
                          onClick={() => setActiveTab('resources')}
                          aria-label="Open Resources tab"
                        >
                          <Box className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>Resources</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant={isGlassMode ? 'outline' : activeTab === 'aors' ? 'default' : 'outline'}
                          className={selectedGlassTabClasses(activeTab === 'aors')}
                          onClick={() => setActiveTab('aors')}
                          aria-label="Open Objectives & Actions tab"
                          data-pratus-context-id="tab:aors"
                          data-pratus-context-label="Objectives & Actions"
                        >
                          <Target className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>Objectives &amp; Actions</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant={isGlassMode ? 'outline' : activeTab === 'incidents' ? 'default' : 'outline'}
                          className={selectedGlassTabClasses(activeTab === 'incidents')}
                          onClick={() => setActiveTab('incidents')}
                          aria-label="Open Incident Roster tab"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>Incident Roster</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant={isGlassMode ? 'outline' : activeTab === 'safety' ? 'default' : 'outline'}
                          className={selectedGlassTabClasses(activeTab === 'safety')}
                          onClick={() => setActiveTab('safety')}
                          aria-label="Open Safety Analysis tab"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>Safety Analysis</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant={isGlassMode ? 'outline' : activeTab === 'calendar' ? 'default' : 'outline'}
                          className={selectedGlassTabClasses(activeTab === 'calendar')}
                          onClick={() => setActiveTab('calendar')}
                          aria-label="Open Calendar tab"
                        >
                          <CalendarDays className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>Calendar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="icon"
                          variant={isGlassMode ? 'outline' : activeTab === 'reports' ? 'default' : 'outline'}
                          className={selectedGlassTabClasses(activeTab === 'reports')}
                          onClick={() => setActiveTab('reports')}
                          aria-label="Open Reports tab"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" sideOffset={6}>Reports</TooltipContent>
                    </Tooltip>
                    {!isCompactPanelTabs && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            type="button"
                            size="icon"
                            variant={isGlassMode ? 'outline' : activeTab === 'briefing' ? 'default' : 'outline'}
                            className={selectedGlassTabClasses(activeTab === 'briefing')}
                            onClick={() => setActiveTab('briefing')}
                            aria-label="Open Incident Briefing ICS-201 tab"
                            data-has-form-badge="true"
                            data-pratus-context-id="tab:briefing"
                            data-pratus-context-label="Incident Briefing ICS-201"
                          >
                            <span className="relative inline-flex h-4 w-4 items-center justify-center">
                              <FileText className="h-4 w-4" />
                              <span
                                className={cn(
                                  'absolute -right-2 -bottom-2 rounded bg-foreground px-0.5 py-px text-[7px] leading-none text-background',
                                  isGlassMode && 'z-20'
                                )}
                              >
                                201
                              </span>
                            </span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" sideOffset={6}>
                          Incident Briefing ICS-201
                        </TooltipContent>
                      </Tooltip>
                    )}
                    {selectedIcsForms.map((form) => {
                      const formTabId = `form-${form}` as LeftTab
                      const formNumber = form.replace('ICS-', '')
                      return (
                        <Tooltip key={form}>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              size="icon"
                              variant={isGlassMode ? 'outline' : activeTab === formTabId ? 'default' : 'outline'}
                              className={selectedGlassTabClasses(activeTab === formTabId)}
                              onClick={() => setActiveTab(formTabId)}
                              aria-label={`Open ${form} tab`}
                              data-has-form-badge="true"
                              data-pratus-context-id={`tab:${formTabId}`}
                              data-pratus-context-label={form}
                            >
                              <span className="relative inline-flex h-4 w-4 items-center justify-center">
                                <FileText className="h-4 w-4" />
                                <span
                                  className={cn(
                                    'absolute -right-2 -bottom-2 rounded bg-foreground px-0.5 py-px text-[7px] leading-none text-background',
                                    isGlassMode && 'z-20'
                                  )}
                                >
                                  {formNumber}
                                </span>
                              </span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" sideOffset={6}>
                            {form}
                          </TooltipContent>
                        </Tooltip>
                      )
                    })}
                    <DropdownMenu
                      open={isAddFormsOpen}
                      onOpenChange={(open) => {
                        setIsAddFormsOpen(open)
                        if (open) {
                          setDraftIcsForms(selectedIcsForms)
                        }
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        {isCompactPanelTabs ? (
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            aria-label="More options"
                            className={glassIconButtonClasses}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className={glassIconButtonClasses}
                          >
                            + Add
                          </Button>
                        )}
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-48">
                        {isCompactPanelTabs && (
                          <>
                            <DropdownMenuItem onClick={() => setActiveTab('briefing')}>
                              Incident Briefing ICS-201
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        <DropdownMenuLabel>Add ICS Forms</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <div className="px-1 pb-1">
                          <Button
                            type="button"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setSelectedIcsForms(draftIcsForms)
                              if (draftIcsForms.length > 0) {
                                setActiveTab(`form-${draftIcsForms[0]}` as LeftTab)
                              }
                              setIsAddFormsOpen(false)
                            }}
                          >
                            Add Selected
                          </Button>
                        </div>
                        <DropdownMenuSeparator />
                        {['ICS-204', 'ICS-233', 'ICS-208', 'ICS-209'].map((form) => (
                          <DropdownMenuItem
                            key={form}
                            onSelect={(event) => {
                              event.preventDefault()
                              setDraftIcsForms((previous) =>
                                previous.includes(form)
                                  ? previous.filter((item) => item !== form)
                                  : [...previous, form]
                              )
                            }}
                            className="gap-2"
                          >
                            <Checkbox
                              checked={draftIcsForms.includes(form)}
                              onCheckedChange={(checked) => {
                                setDraftIcsForms((previous) => {
                                  if (checked) {
                                    return previous.includes(form) ? previous : [...previous, form]
                                  }
                                  return previous.filter((item) => item !== form)
                                })
                              }}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Select ${form}`}
                            />
                            {form}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TooltipProvider>
                <div className="flex items-center gap-2">
                  <ToggleGroup
                    type="single"
                    value={appearanceMode}
                    onValueChange={(value) => {
                      if (
                        value === 'light' ||
                        value === 'dark' ||
                        value === 'glass'
                      ) {
                        setAppearanceMode(value)
                      }
                    }}
                    variant="outline"
                    size="sm"
                    spacing={0}
                    aria-label="Appearance mode"
                    className={glassToggleGroupClasses}
                  >
                    <ToggleGroupItem
                      value="light"
                      aria-label="Light mode"
                      className={glassToggleItemClasses}
                    >
                      <Sun className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="dark"
                      aria-label="Dark mode"
                      className={glassToggleItemClasses}
                    >
                      <Moon className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="glass"
                      aria-label="Glass mode"
                      className={glassToggleItemClasses}
                    >
                      <Square className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className={selectedGlassIconButtonClasses(selectedTopBarButton === 'toggle-panel')}
                      aria-label="Toggle objectives panel"
                      onClick={() => setSelectedTopBarButton('toggle-panel')}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </CollapsibleTrigger>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className={selectedGlassIconButtonClasses(selectedTopBarButton === 'panel-width-options')}
                        aria-label="Open panel width options"
                        onClick={() => setSelectedTopBarButton('panel-width-options')}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPanelWidthMode('one-half')}>
                        Panel width: 1/2
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setPanelWidthMode('one-third')}>
                        Panel width: 1/3
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="ml-auto">
                <CollapsibleTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className={selectedGlassIconButtonClasses(selectedTopBarButton === 'expand-panel')}
                    aria-label="Expand panel"
                    onClick={() => setSelectedTopBarButton('expand-panel')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
              </div>
            )}
          </div>

          <CollapsibleContent className="flex-1 overflow-hidden p-4">
            <Card
              className={cn(
                'h-full min-h-0',
                glassCardClasses,
                isPratusAiSelectingContext && 'cursor-crosshair ring-2 ring-dashed ring-primary/40'
              )}
              data-pratus-context-id={`tab:${activeTab}`}
              data-pratus-context-label={getPratusContextLabelForTab(activeTab)}
            >
              <CardHeader
                className={cn(
                  (activeTab === 'aors' || activeTab === 'form-ICS-233') &&
                    'flex flex-row items-center justify-between gap-3 space-y-0'
                )}
              >
                <CardTitle className="text-base">
                  {activeTab === 'notifications' && 'Notifications'}
                  {activeTab === 'resources' && 'Resources'}
                  {activeTab === 'aors' && 'Objectives & Actions'}
                  {activeTab === 'incidents' && 'Incident Roster'}
                  {activeTab === 'safety' && 'Safety Analysis'}
                  {activeTab === 'calendar' && 'Calendar'}
                  {activeTab === 'reports' && 'Reports'}
                  {activeTab === 'briefing' && 'Incident Briefing ICS-201'}
                  {activeTab === 'form-ICS-204' && 'ICS-204 Assignment List'}
                  {activeTab !== 'form-ICS-204' && activeFormTabLabel}
                </CardTitle>
                {activeTab === 'aors' && (
                  <div className="flex w-80 items-center gap-2 rounded-md border px-2 py-1.5">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      value={aorSectionSearchQuery}
                      onChange={(event) => setAorSectionSearchQuery(event.target.value)}
                      placeholder="Search objectives & actions"
                      aria-label="Search objectives and actions"
                      className="w-full bg-transparent text-xs outline-none"
                    />
                  </div>
                )}
                {activeTab === 'form-ICS-233' && (
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={ics233ViewMode === 'table' ? 'default' : 'outline'}
                      onClick={() => setIcs233ViewMode('table')}
                    >
                      Table
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={ics233ViewMode === 'list' ? 'default' : 'outline'}
                      onClick={() => setIcs233ViewMode('list')}
                    >
                      List
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent className="min-h-0 flex-1 space-y-2 overflow-y-auto [scrollbar-gutter:stable]">
                {activeTab === 'notifications' && (
                  cardFilteredNotifications.length === 0 ? (
                    <Item variant="outline" className={glassItemBorderClasses}>
                      <ItemContent>
                        <ItemTitle>No matching notifications</ItemTitle>
                        <ItemDescription>Try a broader search term.</ItemDescription>
                      </ItemContent>
                    </Item>
                  ) : (
                    cardFilteredNotifications.map((item) => {
                    const key = `notification-${item.id}`
                    const isOpen = expandedItemId === key
                    return (
                      <Item
                        key={item.id}
                        variant="outline"
                        className={cn(
                          'flex-col items-stretch p-0',
                          glassItemBorderClasses,
                          selectedPanelItemId === key && 'ring-2 ring-primary/60 bg-primary/5'
                        )}
                      >
                        <Collapsible
                          open={isOpen}
                          onOpenChange={(open) => setExpandedItemId(open ? key : null)}
                        >
                          <div
                            className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                            onClick={() => toggleExpandedItem(key)}
                          >
                            <ItemContent>
                              <ItemTitle>{item.title}</ItemTitle>
                              <ItemDescription>{item.summary}</ItemDescription>
                            </ItemContent>
                            <ItemActions>
                              <Badge variant="secondary">{item.severity}</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Zoom map to notification"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setSelectedPanelItemId(key)
                                  void
                                  focusMapItem(`notification-${item.id}`, item.location, 45000)
                                }}
                              >
                                <MapIcon className="h-4 w-4" />
                              </Button>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Toggle notification details"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <ChevronDown
                                    className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                                  />
                                </Button>
                              </CollapsibleTrigger>
                            </ItemActions>
                          </div>
                          <CollapsibleContent>
                            <div className="border-t px-3 py-2 text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <p>
                                  <span className="font-medium">Status:</span> {item.status}
                                </p>
                                <p>
                                  <span className="font-medium">Owner:</span> {item.owner}
                                </p>
                              </div>
                              <p className="mt-2">
                                <span className="font-medium">Time:</span> {item.timestamp}
                              </p>
                              <p className="mt-1">
                                <span className="font-medium">Impact:</span> {item.impact}
                              </p>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </Item>
                    )
                    })
                  )
                )}

                {activeTab === 'resources' && (
                  cardFilteredResources.length === 0 ? (
                    <Item variant="outline" className={glassItemBorderClasses}>
                      <ItemContent>
                        <ItemTitle>No matching resources</ItemTitle>
                        <ItemDescription>Try a broader search term.</ItemDescription>
                      </ItemContent>
                    </Item>
                  ) : (
                    cardFilteredResources.map((resource) => {
                    const key = `resource-${resource.id}`
                    const isOpen = expandedItemId === key
                    return (
                      <Item
                        key={resource.id}
                        variant="outline"
                        className={cn(
                          'flex-col items-stretch p-0',
                          glassItemBorderClasses,
                          selectedPanelItemId === key && 'ring-2 ring-primary/60 bg-primary/5'
                        )}
                      >
                        <Collapsible
                          open={isOpen}
                          onOpenChange={(open) => setExpandedItemId(open ? key : null)}
                        >
                          <div
                            className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                            onClick={() => toggleExpandedItem(key)}
                          >
                            <ItemContent>
                              <ItemTitle>{resource.name}</ItemTitle>
                              <ItemDescription>{resource.notes}</ItemDescription>
                            </ItemContent>
                            <ItemActions>
                              <Badge variant="secondary">{resource.status}</Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Zoom map to resource"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  setSelectedPanelItemId(key)
                                  void
                                  focusMapItem(`resource-${resource.id}`, resource.mapLocation, 30000)
                                }}
                              >
                                <MapIcon className="h-4 w-4" />
                              </Button>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Toggle resource details"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <ChevronDown
                                    className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                                  />
                                </Button>
                              </CollapsibleTrigger>
                            </ItemActions>
                          </div>
                          <CollapsibleContent>
                            <div className="border-t px-3 py-2 text-sm">
                              <div className="grid grid-cols-2 gap-2">
                                <p>
                                  <span className="font-medium">Current Location:</span>{' '}
                                  {resource.currentLocation}
                                </p>
                                <p>
                                  <span className="font-medium">Datetime Ordered:</span>{' '}
                                  {resource.datetimeOrdered}
                                </p>
                                <p>
                                  <span className="font-medium">OPCON:</span> {resource.opcon}
                                </p>
                                <p>
                                  <span className="font-medium">TACON:</span> {resource.tacon}
                                </p>
                                <p>
                                  <span className="font-medium">Point of Contact:</span>{' '}
                                  {resource.pointOfContact}
                                </p>
                                <p>
                                  <span className="font-medium">Owning Organization:</span>{' '}
                                  {resource.owningOrganization}
                                </p>
                                <p>
                                  <span className="font-medium">Quantity:</span> {resource.quantity}
                                </p>
                                <p>
                                  <span className="font-medium">Unit:</span> {resource.unit}
                                </p>
                                <p>
                                  <span className="font-medium">Hull/Tail Number:</span>{' '}
                                  {resource.hullTailNumber}
                                </p>
                                <p>
                                  <span className="font-medium">Symbology:</span> {resource.symbology}
                                </p>
                                <p>
                                  <span className="font-medium">Lat:</span> {resource.latitude}
                                </p>
                                <p>
                                  <span className="font-medium">Long:</span> {resource.longitude}
                                </p>
                                <p className="col-span-2">
                                  <span className="font-medium">Capabilities:</span>{' '}
                                  {resource.capabilities}
                                </p>
                                <p>
                                  <span className="font-medium">Current Op Period:</span>{' '}
                                  {resource.currentOpPeriod}
                                </p>
                                <p>
                                  <span className="font-medium">Next Op Period:</span>{' '}
                                  {resource.nextOpPeriod}
                                </p>
                                <p>
                                  <span className="font-medium">Current Op Period Assignment:</span>{' '}
                                  {resource.currentOpPeriodAssignment}
                                </p>
                                <p>
                                  <span className="font-medium">Next Op Period Assignment:</span>{' '}
                                  {resource.nextOpPeriodAssignment}
                                </p>
                                <p>
                                  <span className="font-medium">Check-in Status:</span>{' '}
                                  {resource.checkInStatus}
                                </p>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </Item>
                    )
                    })
                  )
                )}

                {activeTab === 'aors' && (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startInlineAorDraft('Objective')}
                      >
                        + Add Objective
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => startInlineAorDraft('Action')}
                      >
                        + Add Action
                      </Button>
                    </div>
                    {inlineAorDraft && (
                      <Item
                        variant="outline"
                        className={cn('mb-2 flex-col items-stretch p-0', glassItemBorderClasses)}
                      >
                        <div className="space-y-2 px-3 py-2.5">
                          <p className="text-xs font-medium text-muted-foreground">
                            New {inlineAorDraft.itemType}
                          </p>
                          <input
                            value={inlineAorDraft.name}
                            onChange={(event) =>
                              setInlineAorDraft((previous) =>
                                previous
                                  ? {
                                      ...previous,
                                      name: event.target.value,
                                    }
                                  : previous
                              )
                            }
                            placeholder={`${inlineAorDraft.itemType} name`}
                            className="h-9 w-full rounded-md border bg-transparent px-2 text-sm outline-none"
                          />
                          {inlineAorDraft.itemType === 'Objective' && (
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Type:</span>
                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  inlineAorDraft.objectiveClassification === 'O' ? 'default' : 'outline'
                                }
                                onClick={() =>
                                  setInlineAorDraft((previous) =>
                                    previous
                                      ? {
                                          ...previous,
                                          objectiveClassification: 'O',
                                        }
                                      : previous
                                  )
                                }
                              >
                                O
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  inlineAorDraft.objectiveClassification === 'M' ? 'default' : 'outline'
                                }
                                onClick={() =>
                                  setInlineAorDraft((previous) =>
                                    previous
                                      ? {
                                          ...previous,
                                          objectiveClassification: 'M',
                                        }
                                      : previous
                                  )
                                }
                              >
                                M
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={
                                  inlineAorDraft.objectiveClassification === 'O&M'
                                    ? 'default'
                                    : 'outline'
                                }
                                onClick={() =>
                                  setInlineAorDraft((previous) =>
                                    previous
                                      ? {
                                          ...previous,
                                          objectiveClassification: 'O&M',
                                        }
                                      : previous
                                  )
                                }
                              >
                                O&amp;M
                              </Button>
                            </div>
                          )}
                          {inlineAorDraft.itemType === 'Action' && (
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs text-muted-foreground">Assignee:</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button type="button" size="sm" variant="outline">
                                      {inlineAorDraft.assignee || 'Select Assignee'}
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="start" className="w-[60rem]">
                                    <div className="px-2 pt-2">
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        className="w-fit"
                                        disabled={!getPendingAssigneeSelection('inline-action', inlineAorDraft.assignee)}
                                        onClick={() =>
                                          setInlineActionAssignee(
                                            getPendingAssigneeSelection('inline-action', inlineAorDraft.assignee)
                                          )
                                        }
                                      >
                                        Assign to Selected Resource
                                      </Button>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <div className="px-2 py-1.5">
                                      <div className="flex h-8 items-center gap-2 rounded-md border px-2">
                                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                                        <input
                                          value={assigneeSearchQuery}
                                          onChange={(event) => setAssigneeSearchQuery(event.target.value)}
                                          onKeyDown={(event) => event.stopPropagation()}
                                          placeholder="Search responders..."
                                          className="w-full bg-transparent text-xs outline-none"
                                        />
                                      </div>
                                    </div>
                                    <DropdownMenuSeparator />
                                    <div className={cn('px-2 py-1.5 text-[11px] font-semibold text-muted-foreground', assigneeDropdownGridClasses)}>
                                      <span>Resource</span>
                                      <span>Positions</span>
                                      <span>Current Work Availability</span>
                                    </div>
                                    <DropdownMenuSeparator />
                                    {filteredActionAssigneeOptions.map((assignee) => (
                                      <DropdownMenuItem
                                        key={assignee.name}
                                        onSelect={(event) => {
                                          event.preventDefault()
                                          setPendingAssigneeSelection('inline-action', assignee.name)
                                        }}
                                        className="px-2"
                                      >
                                        <div className={assigneeDropdownRowGridClasses}>
                                          <input
                                            type="radio"
                                            checked={
                                              getPendingAssigneeSelection(
                                                'inline-action',
                                                inlineAorDraft.assignee
                                              ) === assignee.name
                                            }
                                            onChange={() =>
                                              setPendingAssigneeSelection('inline-action', assignee.name)
                                            }
                                            onClick={(event) => event.stopPropagation()}
                                            className="h-3.5 w-3.5"
                                            aria-label={`Select ${assignee.name}`}
                                          />
                                          <span className="truncate text-xs">{assignee.name}</span>
                                          <span className="truncate text-xs text-muted-foreground">
                                            {assignee.position}
                                          </span>
                                          <Badge
                                            variant={
                                              getAssigneeAvailabilityStatus(assignee.name).startsWith('Assigned:')
                                                ? 'secondary'
                                                : 'outline'
                                            }
                                            className={getAvailabilityBadgeClassName(
                                              getAssigneeAvailabilityStatus(assignee.name)
                                            )}
                                          >
                                            {getAssigneeAvailabilityStatus(assignee.name)}
                                          </Badge>
                                        </div>
                                      </DropdownMenuItem>
                                    ))}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              <span className="text-xs text-muted-foreground">Due by:</span>
                              <div className="grid grid-cols-3 gap-2">
                                <input
                                  type="date"
                                  value={inlineAorDraft.dueDate}
                                  onChange={(event) =>
                                    setInlineAorDraft((previous) =>
                                      previous
                                        ? {
                                            ...previous,
                                            dueDate: event.target.value,
                                          }
                                        : previous
                                    )
                                  }
                                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                />
                                <input
                                  type="time"
                                  value={inlineAorDraft.dueTime}
                                  onChange={(event) =>
                                    setInlineAorDraft((previous) =>
                                      previous
                                        ? {
                                            ...previous,
                                            dueTime: event.target.value,
                                          }
                                        : previous
                                    )
                                  }
                                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                />
                                <select
                                  value={inlineAorDraft.dueTimezone}
                                  onChange={(event) =>
                                    setInlineAorDraft((previous) =>
                                      previous
                                        ? {
                                            ...previous,
                                            dueTimezone: event.target.value,
                                          }
                                        : previous
                                    )
                                  }
                                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                >
                                  {actionDueTimezoneOptions.map((timezone) => (
                                    <option key={timezone} value={timezone}>
                                      {timezone}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <span className="text-xs text-muted-foreground">Location:</span>
                              <div className="space-y-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={drawMapTarget?.type === 'inline-action' ? 'default' : 'outline'}
                                  className="w-fit"
                                  onClick={() =>
                                    setDrawMapTarget((previous) =>
                                      previous?.type === 'inline-action' ? null : { type: 'inline-action' }
                                    )
                                  }
                                >
                                  Draw on Map
                                </Button>
                                <input
                                  value={inlineAorDraft.actionLocationAddress}
                                  onChange={(event) =>
                                    setInlineAorDraft((previous) =>
                                      previous
                                        ? {
                                            ...previous,
                                            actionLocationAddress: event.target.value,
                                          }
                                        : previous
                                    )
                                  }
                                  placeholder="Address (optional)"
                                  className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <input
                                    value={inlineAorDraft.actionLatitude}
                                    onChange={(event) =>
                                      setInlineAorDraft((previous) =>
                                        previous
                                          ? {
                                              ...previous,
                                              actionLatitude: event.target.value,
                                            }
                                          : previous
                                      )
                                    }
                                    placeholder="Latitude"
                                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                  />
                                  <input
                                    value={inlineAorDraft.actionLongitude}
                                    onChange={(event) =>
                                      setInlineAorDraft((previous) =>
                                        previous
                                          ? {
                                              ...previous,
                                              actionLongitude: event.target.value,
                                            }
                                          : previous
                                      )
                                    }
                                    placeholder="Longitude"
                                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => setInlineAorDraft(null)}
                            >
                              Cancel
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={submitInlineAorDraft}
                              disabled={!inlineAorDraft.name.trim()}
                            >
                              Add {inlineAorDraft.itemType}
                            </Button>
                          </div>
                        </div>
                      </Item>
                    )}
                    {topLevelCardFilteredAors.length === 0 ? (
                      <Item variant="outline" className={glassItemBorderClasses}>
                        <ItemContent>
                          <ItemTitle>No matching objectives or actions</ItemTitle>
                          <ItemDescription>Try a broader search term.</ItemDescription>
                        </ItemContent>
                      </Item>
                    ) : (
                      topLevelCardFilteredAors.map((aor) => {
                    const key = `aor-${aor.id}`
                    const isOpen = expandedItemId === key
                    const childActions = aor.itemType === 'Objective' ? getChildActionsForObjective(aor.id) : []
                    const isChildActionDraftOpen =
                      inlineChildActionDraft?.objectiveId === aor.id && aor.itemType === 'Objective'
                    return (
                      <Item
                        key={aor.id}
                        variant="outline"
                        className={cn(
                          'flex-col items-stretch p-0',
                          glassItemBorderClasses,
                          selectedPanelItemId === key && 'ring-2 ring-primary/60 bg-primary/5'
                        )}
                      >
                        <Collapsible
                          open={isOpen}
                          onOpenChange={(open) => setExpandedItemId(open ? key : null)}
                        >
                          <div
                            className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                            onClick={() => toggleExpandedItem(key)}
                          >
                            <ItemContent>
                              {aor.itemType === 'Action' && editingActionDraft?.id === aor.id ? (
                                <input
                                  value={editingActionDraft.name}
                                  onChange={(event) =>
                                    setEditingActionDraft((previous) =>
                                      previous
                                        ? {
                                            ...previous,
                                            name: event.target.value,
                                          }
                                        : previous
                                    )
                                  }
                                  onClick={(event) => event.stopPropagation()}
                                  className="h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none"
                                />
                              ) : (
                                <ItemTitle>{aor.name}</ItemTitle>
                              )}
                            </ItemContent>
                            <ItemActions>
                              <Badge variant="outline">{aor.itemType}</Badge>
                              {aor.itemType === 'Action' && (
                                <Badge variant="secondary">{getDerivedActionStatus(aor)}</Badge>
                              )}
                              {aor.itemType === 'Action' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Zoom map to action"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setSelectedPanelItemId(key)
                                    void focusMapItem(`aor-${aor.id}`, aor.location, 120000)
                                  }}
                                >
                                  <MapIcon className="h-4 w-4" />
                                </Button>
                              )}
                              {aor.itemType === 'Action' &&
                                (editingActionDraft?.id === aor.id ? (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        saveEditingAction()
                                      }}
                                      disabled={!editingActionDraft.name.trim()}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        setEditingActionDraft(null)
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                  </>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Edit action"
                                    onClick={(event) => {
                                      event.stopPropagation()
                                      startEditingAction(aor.id, aor.name)
                                    }}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                ))}
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Delete ${aor.itemType.toLowerCase()}`}
                                className="text-destructive hover:text-destructive"
                                onClick={(event) => {
                                  event.stopPropagation()
                                  deleteAorItem(aor.id)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              <CollapsibleTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Toggle objective details"
                                  onClick={(event) => event.stopPropagation()}
                                >
                                  <ChevronDown
                                    className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                                  />
                                </Button>
                              </CollapsibleTrigger>
                            </ItemActions>
                          </div>
                          <CollapsibleContent>
                            <div className="border-t px-3 py-2 text-sm">
                              {aor.itemType === 'Objective' && (
                                <p className="mt-1">
                                  <span className="font-medium">Type:</span>{' '}
                                  {getObjectiveClassificationLabel(aor.objectiveClassification)}
                                </p>
                              )}
                              {aor.itemType === 'Action' && (
                                <div className="mt-3 space-y-2 rounded-md border p-2">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Assignee:</span>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button type="button" size="sm" variant="outline">
                                          {aor.assignee || 'Select Assignee'}
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="start" className="w-[60rem]">
                                        <div className="px-2 pt-2">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="w-fit"
                                            disabled={
                                              !getPendingAssigneeSelection(`existing-action-${aor.id}`, aor.assignee)
                                            }
                                            onClick={() =>
                                              setAorAssignee(
                                                aor.id,
                                                getPendingAssigneeSelection(
                                                  `existing-action-${aor.id}`,
                                                  aor.assignee
                                                )
                                              )
                                            }
                                          >
                                            Assign to Selected Resource
                                          </Button>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <div className="px-2 py-1.5">
                                          <div className="flex h-8 items-center gap-2 rounded-md border px-2">
                                            <Search className="h-3.5 w-3.5 text-muted-foreground" />
                                            <input
                                              value={assigneeSearchQuery}
                                              onChange={(event) => setAssigneeSearchQuery(event.target.value)}
                                              onKeyDown={(event) => event.stopPropagation()}
                                              placeholder="Search responders..."
                                              className="w-full bg-transparent text-xs outline-none"
                                            />
                                          </div>
                                        </div>
                                        <DropdownMenuSeparator />
                                        <div className={cn('px-2 py-1.5 text-[11px] font-semibold text-muted-foreground', assigneeDropdownGridClasses)}>
                                          <span>Resource</span>
                                          <span>Positions</span>
                                          <span>Current Work Availability</span>
                                        </div>
                                        <DropdownMenuSeparator />
                                        {filteredActionAssigneeOptions.map((assignee) => (
                                          <DropdownMenuItem
                                            key={assignee.name}
                                            onSelect={(event) => {
                                              event.preventDefault()
                                              setPendingAssigneeSelection(
                                                `existing-action-${aor.id}`,
                                                assignee.name
                                              )
                                            }}
                                            className="px-2"
                                          >
                                            <div className={assigneeDropdownRowGridClasses}>
                                              <input
                                                type="radio"
                                                checked={
                                                  getPendingAssigneeSelection(
                                                    `existing-action-${aor.id}`,
                                                    aor.assignee
                                                  ) === assignee.name
                                                }
                                                onChange={() =>
                                                  setPendingAssigneeSelection(
                                                    `existing-action-${aor.id}`,
                                                    assignee.name
                                                  )
                                                }
                                                onClick={(event) => event.stopPropagation()}
                                                className="h-3.5 w-3.5"
                                                aria-label={`Select ${assignee.name}`}
                                              />
                                              <span className="truncate text-xs">{assignee.name}</span>
                                              <span className="truncate text-xs text-muted-foreground">
                                                {assignee.position}
                                              </span>
                                              <Badge
                                                variant={
                                                  getAssigneeAvailabilityStatus(assignee.name).startsWith('Assigned:')
                                                    ? 'secondary'
                                                    : 'outline'
                                                }
                                                className={getAvailabilityBadgeClassName(
                                                  getAssigneeAvailabilityStatus(assignee.name)
                                                )}
                                              >
                                                {getAssigneeAvailabilityStatus(assignee.name)}
                                              </Badge>
                                            </div>
                                          </DropdownMenuItem>
                                        ))}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-xs text-muted-foreground">Due:</span>
                                    <input
                                      type="date"
                                      value={aor.dueDate ?? ''}
                                      onChange={(event) =>
                                        updateAorActionTiming(aor.id, {
                                          dueDate: event.target.value,
                                        })
                                      }
                                      className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                    />
                                    <input
                                      type="time"
                                      value={aor.dueTime ?? ''}
                                      onChange={(event) =>
                                        updateAorActionTiming(aor.id, {
                                          dueTime: event.target.value,
                                        })
                                      }
                                      className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                    />
                                    <select
                                      value={aor.dueTimezone ?? defaultActionDueTimezone}
                                      onChange={(event) =>
                                        updateAorActionTiming(aor.id, {
                                          dueTimezone: event.target.value,
                                        })
                                      }
                                      className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                    >
                                      {actionDueTimezoneOptions.map((timezone) => (
                                        <option key={timezone} value={timezone}>
                                          {timezone}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Location:</span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant={
                                        drawMapTarget?.type === 'existing-action' &&
                                        drawMapTarget.actionId === aor.id
                                          ? 'default'
                                          : 'outline'
                                      }
                                      className="w-fit"
                                      onClick={() =>
                                        setDrawMapTarget((previous) =>
                                          previous?.type === 'existing-action' &&
                                          previous.actionId === aor.id
                                            ? null
                                            : { type: 'existing-action', actionId: aor.id }
                                        )
                                      }
                                    >
                                      Draw on Map
                                    </Button>
                                    <input
                                      value={aor.actionLocationAddress ?? ''}
                                      onChange={(event) =>
                                        updateAorActionLocation(aor.id, {
                                          actionLocationAddress: event.target.value,
                                        })
                                      }
                                      placeholder="Address (optional)"
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    />
                                    <div className="grid grid-cols-2 gap-2">
                                      <input
                                        value={aor.actionLatitude ?? ''}
                                        onChange={(event) =>
                                          updateAorActionLocation(aor.id, {
                                            actionLatitude: event.target.value,
                                          })
                                        }
                                        placeholder="Latitude"
                                        className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                      />
                                      <input
                                        value={aor.actionLongitude ?? ''}
                                        onChange={(event) =>
                                          updateAorActionLocation(aor.id, {
                                            actionLongitude: event.target.value,
                                          })
                                        }
                                        placeholder="Longitude"
                                        className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                              {aor.itemType === 'Objective' && (
                                <div className="mt-3 rounded-md p-2">
                                  <div className="mb-2 flex items-center justify-between gap-2">
                                    <p className="text-sm font-medium">Child Actions</p>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="outline"
                                      onClick={() => startInlineChildActionDraft(aor.id)}
                                    >
                                      + Add Child Action
                                    </Button>
                                  </div>
                                  {isChildActionDraftOpen && (
                                    <div className="mb-2 space-y-2 rounded-md border p-2">
                                      <input
                                        value={inlineChildActionDraft?.name ?? ''}
                                        onChange={(event) =>
                                          setInlineChildActionDraft((previous) =>
                                            previous
                                              ? {
                                                  ...previous,
                                                  name: event.target.value,
                                                }
                                              : previous
                                          )
                                        }
                                        placeholder="Child action name"
                                        className="h-9 w-full rounded-md border bg-transparent px-2 text-sm outline-none"
                                      />
                                      <div className="space-y-1">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <span className="text-xs text-muted-foreground">Assignee:</span>
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button type="button" size="sm" variant="outline">
                                                {inlineChildActionDraft?.assignee || 'Select Assignee'}
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="start" className="w-[60rem]">
                                              <div className="px-2 pt-2">
                                                <Button
                                                  type="button"
                                                  size="sm"
                                                  variant="outline"
                                                  className="w-fit"
                                                  disabled={
                                                    !getPendingAssigneeSelection(
                                                      'inline-child-action',
                                                      inlineChildActionDraft?.assignee
                                                    )
                                                  }
                                                  onClick={() =>
                                                    setInlineChildActionAssignee(
                                                      getPendingAssigneeSelection(
                                                        'inline-child-action',
                                                        inlineChildActionDraft?.assignee
                                                      )
                                                    )
                                                  }
                                                >
                                                  Assign to Selected Resource
                                                </Button>
                                              </div>
                                              <DropdownMenuSeparator />
                                              <div className="px-2 py-1.5">
                                                <div className="flex h-8 items-center gap-2 rounded-md border px-2">
                                                  <Search className="h-3.5 w-3.5 text-muted-foreground" />
                                                  <input
                                                    value={assigneeSearchQuery}
                                                    onChange={(event) =>
                                                      setAssigneeSearchQuery(event.target.value)
                                                    }
                                                    onKeyDown={(event) => event.stopPropagation()}
                                                    placeholder="Search responders..."
                                                    className="w-full bg-transparent text-xs outline-none"
                                                  />
                                                </div>
                                              </div>
                                              <DropdownMenuSeparator />
                                              <div className={cn('px-2 py-1.5 text-[11px] font-semibold text-muted-foreground', assigneeDropdownGridClasses)}>
                                                <span>Resource</span>
                                                <span>Positions</span>
                                                <span>Current Work Availability</span>
                                              </div>
                                              <DropdownMenuSeparator />
                                              {filteredActionAssigneeOptions.map((assignee) => (
                                                <DropdownMenuItem
                                                  key={assignee.name}
                                                  onSelect={(event) => {
                                                    event.preventDefault()
                                                    setPendingAssigneeSelection(
                                                      'inline-child-action',
                                                      assignee.name
                                                    )
                                                  }}
                                                  className="px-2"
                                                >
                                                  <div className={assigneeDropdownRowGridClasses}>
                                                    <input
                                                      type="radio"
                                                      checked={
                                                        getPendingAssigneeSelection(
                                                          'inline-child-action',
                                                          inlineChildActionDraft?.assignee
                                                        ) === assignee.name
                                                      }
                                                      onChange={() =>
                                                        setPendingAssigneeSelection(
                                                          'inline-child-action',
                                                          assignee.name
                                                        )
                                                      }
                                                      onClick={(event) => event.stopPropagation()}
                                                      className="h-3.5 w-3.5"
                                                      aria-label={`Select ${assignee.name}`}
                                                    />
                                                    <span className="truncate text-xs">{assignee.name}</span>
                                                    <span className="truncate text-xs text-muted-foreground">
                                                      {assignee.position}
                                                    </span>
                                                    <Badge
                                                      variant={
                                                        getAssigneeAvailabilityStatus(assignee.name).startsWith(
                                                          'Assigned:'
                                                        )
                                                          ? 'secondary'
                                                          : 'outline'
                                                      }
                                                      className={getAvailabilityBadgeClassName(
                                                        getAssigneeAvailabilityStatus(assignee.name)
                                                      )}
                                                    >
                                                      {getAssigneeAvailabilityStatus(assignee.name)}
                                                    </Badge>
                                                  </div>
                                                </DropdownMenuItem>
                                              ))}
                                            </DropdownMenuContent>
                                          </DropdownMenu>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Due by:</span>
                                        <div className="grid grid-cols-3 gap-2">
                                          <input
                                            type="date"
                                            value={inlineChildActionDraft?.dueDate ?? ''}
                                            onChange={(event) =>
                                              setInlineChildActionDraft((previous) =>
                                                previous
                                                  ? {
                                                      ...previous,
                                                      dueDate: event.target.value,
                                                    }
                                                  : previous
                                              )
                                            }
                                            className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                          />
                                          <input
                                            type="time"
                                            value={inlineChildActionDraft?.dueTime ?? ''}
                                            onChange={(event) =>
                                              setInlineChildActionDraft((previous) =>
                                                previous
                                                  ? {
                                                      ...previous,
                                                      dueTime: event.target.value,
                                                    }
                                                  : previous
                                              )
                                            }
                                            className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                          />
                                          <select
                                            value={inlineChildActionDraft?.dueTimezone ?? defaultActionDueTimezone}
                                            onChange={(event) =>
                                              setInlineChildActionDraft((previous) =>
                                                previous
                                                  ? {
                                                      ...previous,
                                                      dueTimezone: event.target.value,
                                                    }
                                                  : previous
                                              )
                                            }
                                            className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                          >
                                            {actionDueTimezoneOptions.map((timezone) => (
                                              <option key={timezone} value={timezone}>
                                                {timezone}
                                              </option>
                                            ))}
                                          </select>
                                        </div>
                                        <span className="text-xs text-muted-foreground">Location:</span>
                                        <div className="space-y-2">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant={
                                              drawMapTarget?.type === 'inline-child-action'
                                                ? 'default'
                                                : 'outline'
                                            }
                                            className="w-fit"
                                            onClick={() =>
                                              setDrawMapTarget((previous) =>
                                                previous?.type === 'inline-child-action'
                                                  ? null
                                                  : { type: 'inline-child-action' }
                                              )
                                            }
                                          >
                                            Draw on Map
                                          </Button>
                                          <input
                                            value={inlineChildActionDraft?.actionLocationAddress ?? ''}
                                            onChange={(event) =>
                                              setInlineChildActionDraft((previous) =>
                                                previous
                                                  ? {
                                                      ...previous,
                                                      actionLocationAddress: event.target.value,
                                                    }
                                                  : previous
                                              )
                                            }
                                            placeholder="Address (optional)"
                                            className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                          />
                                          <div className="grid grid-cols-2 gap-2">
                                            <input
                                              value={inlineChildActionDraft?.actionLatitude ?? ''}
                                              onChange={(event) =>
                                                setInlineChildActionDraft((previous) =>
                                                  previous
                                                    ? {
                                                        ...previous,
                                                        actionLatitude: event.target.value,
                                                      }
                                                    : previous
                                                )
                                              }
                                              placeholder="Latitude"
                                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                            />
                                            <input
                                              value={inlineChildActionDraft?.actionLongitude ?? ''}
                                              onChange={(event) =>
                                                setInlineChildActionDraft((previous) =>
                                                  previous
                                                    ? {
                                                        ...previous,
                                                        actionLongitude: event.target.value,
                                                      }
                                                    : previous
                                                )
                                              }
                                              placeholder="Longitude"
                                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center justify-end gap-2">
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setInlineChildActionDraft(null)}
                                        >
                                          Cancel
                                        </Button>
                                        <Button
                                          type="button"
                                          size="sm"
                                          onClick={submitInlineChildActionDraft}
                                          disabled={!inlineChildActionDraft?.name.trim()}
                                        >
                                          Add Child Action
                                        </Button>
                                      </div>
                                    </div>
                                  )}
                                  {childActions.length === 0 ? (
                                    <p className="text-xs text-muted-foreground">No child actions yet.</p>
                                  ) : (
                                    <div className="space-y-2">
                                      {childActions.map((childAction) => {
                                        const isChildExpanded = expandedChildActionId === childAction.id
                                        return (
                                          <Collapsible
                                            key={childAction.id}
                                            open={isChildExpanded}
                                            onOpenChange={(open) =>
                                              setExpandedChildActionId(open ? childAction.id : null)
                                            }
                                            className="rounded-md border"
                                          >
                                            <div
                                              className="flex cursor-pointer items-center justify-between gap-2 px-2 py-1.5"
                                              onClick={() =>
                                                setExpandedChildActionId((previous) =>
                                                  previous === childAction.id ? null : childAction.id
                                                )
                                              }
                                            >
                                              <p className="text-sm font-medium">{childAction.name}</p>
                                              <div className="flex items-center gap-1.5">
                                                <Badge variant="secondary" className="text-xs">
                                                  {getDerivedActionStatus(childAction)}
                                                </Badge>
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button
                                                      type="button"
                                                      size="sm"
                                                      variant="outline"
                                                      className="h-8 text-xs"
                                                      onClick={(event) => event.stopPropagation()}
                                                    >
                                                      {childAction.assignee || 'Select Assignee'}
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="start" className="w-[60rem]">
                                                    <div className="px-2 pt-2">
                                                      <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="outline"
                                                        className="w-fit"
                                                        disabled={
                                                          !getPendingAssigneeSelection(
                                                            `existing-child-action-${childAction.id}`,
                                                            childAction.assignee
                                                          )
                                                        }
                                                        onClick={() =>
                                                          setAorAssignee(
                                                            childAction.id,
                                                            getPendingAssigneeSelection(
                                                              `existing-child-action-${childAction.id}`,
                                                              childAction.assignee
                                                            )
                                                          )
                                                        }
                                                      >
                                                        Assign to Selected Resource
                                                      </Button>
                                                    </div>
                                                    <DropdownMenuSeparator />
                                                    <div className="px-2 py-1.5">
                                                      <div className="flex h-8 items-center gap-2 rounded-md border px-2">
                                                        <Search className="h-3.5 w-3.5 text-muted-foreground" />
                                                        <input
                                                          value={assigneeSearchQuery}
                                                          onChange={(event) =>
                                                            setAssigneeSearchQuery(event.target.value)
                                                          }
                                                          onKeyDown={(event) => event.stopPropagation()}
                                                          placeholder="Search responders..."
                                                          className="w-full bg-transparent text-xs outline-none"
                                                        />
                                                      </div>
                                                    </div>
                                                    <DropdownMenuSeparator />
                                                    <div
                                                      className={cn(
                                                        'px-2 py-1.5 text-[11px] font-semibold text-muted-foreground',
                                                        assigneeDropdownGridClasses
                                                      )}
                                                    >
                                                      <span>Resource</span>
                                                      <span>Positions</span>
                                                      <span>Current Work Availability</span>
                                                    </div>
                                                    <DropdownMenuSeparator />
                                                    {filteredActionAssigneeOptions.map((assignee) => (
                                                      <DropdownMenuItem
                                                        key={assignee.name}
                                                        onSelect={(event) => {
                                                          event.preventDefault()
                                                          setPendingAssigneeSelection(
                                                            `existing-child-action-${childAction.id}`,
                                                            assignee.name
                                                          )
                                                        }}
                                                        className="px-2"
                                                      >
                                                        <div className={assigneeDropdownRowGridClasses}>
                                                          <input
                                                            type="radio"
                                                            checked={
                                                              getPendingAssigneeSelection(
                                                                `existing-child-action-${childAction.id}`,
                                                                childAction.assignee
                                                              ) === assignee.name
                                                            }
                                                            onChange={() =>
                                                              setPendingAssigneeSelection(
                                                                `existing-child-action-${childAction.id}`,
                                                                assignee.name
                                                              )
                                                            }
                                                            onClick={(event) => event.stopPropagation()}
                                                            className="h-3.5 w-3.5"
                                                            aria-label={`Select ${assignee.name}`}
                                                          />
                                                          <span className="truncate text-xs">
                                                            {assignee.name}
                                                          </span>
                                                          <span className="truncate text-xs text-muted-foreground">
                                                            {assignee.position}
                                                          </span>
                                                          <Badge
                                                            variant={
                                                              getAssigneeAvailabilityStatus(assignee.name).startsWith(
                                                                'Assigned:'
                                                              )
                                                                ? 'secondary'
                                                                : 'outline'
                                                            }
                                                            className={getAvailabilityBadgeClassName(
                                                              getAssigneeAvailabilityStatus(assignee.name)
                                                            )}
                                                          >
                                                            {getAssigneeAvailabilityStatus(assignee.name)}
                                                          </Badge>
                                                        </div>
                                                      </DropdownMenuItem>
                                                    ))}
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  aria-label="Zoom map to child action"
                                                  className="h-8 w-8"
                                                  onClick={(event) => {
                                                    event.stopPropagation()
                                                    void focusMapItem(
                                                      `aor-${childAction.id}`,
                                                      childAction.location,
                                                      120000
                                                    )
                                                  }}
                                                >
                                                  <MapIcon className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  aria-label="Edit child action"
                                                  className="h-8 w-8"
                                                  onClick={(event) => {
                                                    event.stopPropagation()
                                                    startEditingAction(childAction.id, childAction.name)
                                                    setExpandedChildActionId(childAction.id)
                                                  }}
                                                >
                                                  <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  aria-label="Delete child action"
                                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                                  onClick={(event) => {
                                                    event.stopPropagation()
                                                    deleteAorItem(childAction.id)
                                                  }}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <CollapsibleTrigger asChild>
                                                  <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    aria-label="Toggle child action details"
                                                    onClick={(event) => event.stopPropagation()}
                                                  >
                                                    <ChevronDown
                                                      className={cn(
                                                        'h-4 w-4 transition-transform',
                                                        isChildExpanded && 'rotate-180'
                                                      )}
                                                    />
                                                  </Button>
                                                </CollapsibleTrigger>
                                              </div>
                                            </div>
                                            <CollapsibleContent>
                                              <div className="space-y-2 border-t px-2 py-1.5">
                                                {editingActionDraft?.id === childAction.id ? (
                                                  <div className="space-y-2">
                                                    <input
                                                      value={editingActionDraft.name}
                                                      onChange={(event) =>
                                                        setEditingActionDraft((previous) =>
                                                          previous
                                                            ? {
                                                                ...previous,
                                                                name: event.target.value,
                                                              }
                                                            : previous
                                                        )
                                                      }
                                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-sm outline-none"
                                                    />
                                                    <div className="flex items-center gap-1">
                                                      <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 text-xs"
                                                        onClick={() => saveEditingAction()}
                                                        disabled={!editingActionDraft.name.trim()}
                                                      >
                                                        Save
                                                      </Button>
                                                      <Button
                                                        type="button"
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-8 text-xs"
                                                        onClick={() => setEditingActionDraft(null)}
                                                      >
                                                        Cancel
                                                      </Button>
                                                    </div>
                                                  </div>
                                                ) : null}
                                                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                                                  <input
                                                    type="date"
                                                    value={childAction.dueDate ?? ''}
                                                    onChange={(event) =>
                                                      updateAorActionTiming(childAction.id, {
                                                        dueDate: event.target.value,
                                                      })
                                                    }
                                                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                  />
                                                  <input
                                                    type="time"
                                                    value={childAction.dueTime ?? ''}
                                                    onChange={(event) =>
                                                      updateAorActionTiming(childAction.id, {
                                                        dueTime: event.target.value,
                                                      })
                                                    }
                                                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                  />
                                                  <select
                                                    value={childAction.dueTimezone ?? defaultActionDueTimezone}
                                                    onChange={(event) =>
                                                      updateAorActionTiming(childAction.id, {
                                                        dueTimezone: event.target.value,
                                                      })
                                                    }
                                                    className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                  >
                                                    {actionDueTimezoneOptions.map((timezone) => (
                                                      <option key={timezone} value={timezone}>
                                                        {timezone}
                                                      </option>
                                                    ))}
                                                  </select>
                                                </div>
                                                <div className="mt-1 space-y-1">
                                                  <span className="text-xs text-muted-foreground">
                                                    Location:
                                                  </span>
                                                  <Button
                                                    type="button"
                                                    size="sm"
                                                    variant={
                                                      drawMapTarget?.type === 'existing-action' &&
                                                      drawMapTarget.actionId === childAction.id
                                                        ? 'default'
                                                        : 'outline'
                                                    }
                                                    className="w-fit"
                                                    onClick={() =>
                                                      setDrawMapTarget((previous) =>
                                                        previous?.type === 'existing-action' &&
                                                        previous.actionId === childAction.id
                                                          ? null
                                                          : {
                                                              type: 'existing-action',
                                                              actionId: childAction.id,
                                                            }
                                                      )
                                                    }
                                                  >
                                                    Draw on Map
                                                  </Button>
                                                  <input
                                                    value={childAction.actionLocationAddress ?? ''}
                                                    onChange={(event) =>
                                                      updateAorActionLocation(childAction.id, {
                                                        actionLocationAddress: event.target.value,
                                                      })
                                                    }
                                                    placeholder="Address (optional)"
                                                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                                  />
                                                  <div className="grid grid-cols-2 gap-2">
                                                    <input
                                                      value={childAction.actionLatitude ?? ''}
                                                      onChange={(event) =>
                                                        updateAorActionLocation(childAction.id, {
                                                          actionLatitude: event.target.value,
                                                        })
                                                      }
                                                      placeholder="Latitude"
                                                      className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                    />
                                                    <input
                                                      value={childAction.actionLongitude ?? ''}
                                                      onChange={(event) =>
                                                        updateAorActionLocation(childAction.id, {
                                                          actionLongitude: event.target.value,
                                                        })
                                                      }
                                                      placeholder="Longitude"
                                                      className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                    />
                                                  </div>
                                                </div>
                                              </div>
                                            </CollapsibleContent>
                                          </Collapsible>
                                        )
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </Item>
                    )
                      })
                    )}
                  </>
                )}

                {activeTab === 'incidents' && (
                  cardFilteredRosterPositions.length === 0 ? (
                    <Item variant="outline" className={glassItemBorderClasses}>
                      <ItemContent>
                        <ItemTitle>No matching roster positions</ItemTitle>
                        <ItemDescription>Try a broader search term.</ItemDescription>
                      </ItemContent>
                    </Item>
                  ) : (
                    cardFilteredRosterPositions.map((position) => {
                      const key = `incident-${position.id}`
                      const isOpen = expandedItemId === key
                      return (
                        <Item
                          key={position.id}
                          variant="outline"
                          className={cn(
                            'flex-col items-stretch p-0',
                            glassItemBorderClasses,
                            selectedPanelItemId === key && 'ring-2 ring-primary/60 bg-primary/5'
                          )}
                        >
                          <Collapsible
                            open={isOpen}
                            onOpenChange={(open) => setExpandedItemId(open ? key : null)}
                          >
                            <div
                              className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                              onClick={() => toggleExpandedItem(key)}
                            >
                              <ItemContent>
                                <ItemTitle>{position.position}</ItemTitle>
                                <ItemDescription>
                                  Assigned: {position.assignedUsers.join(', ')}
                                </ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <Badge variant="secondary">{position.staffingStatus}</Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Zoom map to roster position"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setSelectedPanelItemId(key)
                                    void
                                    focusMapItem(`incident-${position.id}`, position.location, 60000)
                                  }}
                                >
                                  <MapIcon className="h-4 w-4" />
                                </Button>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Toggle roster position details"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <ChevronDown
                                      className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                                    />
                                  </Button>
                                </CollapsibleTrigger>
                              </ItemActions>
                            </div>
                            <CollapsibleContent>
                              <div className="border-t px-3 py-2 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <p>
                                    <span className="font-medium">Shift:</span> {position.shift}
                                  </p>
                                  <p>
                                    <span className="font-medium">Supervisor:</span> {position.supervisor}
                                  </p>
                                </div>
                                <p className="mt-2">
                                  <span className="font-medium">Staffing:</span>{' '}
                                  {position.assignedUsers.length} assigned
                                </p>
                                <p className="mt-1">
                                  <span className="font-medium">Notes:</span> {position.notes}
                                </p>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </Item>
                      )
                    })
                  )
                )}

                {activeTab === 'safety' && (
                  cardFilteredSafetyAnalyses.length === 0 ? (
                    <Item variant="outline" className={glassItemBorderClasses}>
                      <ItemContent>
                        <ItemTitle>No matching safety analyses</ItemTitle>
                        <ItemDescription>Try a broader search term.</ItemDescription>
                      </ItemContent>
                    </Item>
                  ) : (
                    cardFilteredSafetyAnalyses.map((analysis) => {
                      const key = `safety-${analysis.id}`
                      const isOpen = expandedItemId === key
                      return (
                        <Item
                          key={analysis.id}
                          variant="outline"
                          className={cn(
                            'flex-col items-stretch p-0',
                            glassItemBorderClasses,
                            selectedPanelItemId === key && 'ring-2 ring-primary/60 bg-primary/5'
                          )}
                        >
                          <Collapsible
                            open={isOpen}
                            onOpenChange={(open) => setExpandedItemId(open ? key : null)}
                          >
                            <div
                              className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                              onClick={() => toggleExpandedItem(key)}
                            >
                              <ItemContent>
                                <ItemTitle>{analysis.hazard}</ItemTitle>
                                <ItemDescription>{analysis.controls}</ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <Badge variant="secondary">{analysis.riskLevel}</Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Zoom map to safety analysis"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setSelectedPanelItemId(key)
                                    void focusMapItem(`safety-${analysis.id}`, analysis.location, 50000)
                                  }}
                                >
                                  <MapIcon className="h-4 w-4" />
                                </Button>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Toggle safety analysis details"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <ChevronDown
                                      className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                                    />
                                  </Button>
                                </CollapsibleTrigger>
                              </ItemActions>
                            </div>
                            <CollapsibleContent>
                              <div className="border-t px-3 py-2 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <p>
                                    <span className="font-medium">Status:</span> {analysis.status}
                                  </p>
                                  <p>
                                    <span className="font-medium">Owner:</span> {analysis.owner}
                                  </p>
                                </div>
                                <p className="mt-2">
                                  <span className="font-medium">Reviewed:</span> {analysis.reviewedAt}
                                </p>
                                <p className="mt-1">
                                  <span className="font-medium">Notes:</span> {analysis.notes}
                                </p>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </Item>
                      )
                    })
                  )
                )}

                {activeTab === 'calendar' && (
                  cardFilteredCalendarItems.length === 0 ? (
                    <Item variant="outline" className={glassItemBorderClasses}>
                      <ItemContent>
                        <ItemTitle>No matching calendar events</ItemTitle>
                        <ItemDescription>Try a broader search term.</ItemDescription>
                      </ItemContent>
                    </Item>
                  ) : (
                    cardFilteredCalendarItems.map((event) => {
                      const key = `calendar-${event.id}`
                      const isOpen = expandedItemId === key
                      return (
                        <Item
                          key={event.id}
                          variant="outline"
                          className={cn(
                            'flex-col items-stretch p-0',
                            glassItemBorderClasses,
                            selectedPanelItemId === key && 'ring-2 ring-primary/60 bg-primary/5'
                          )}
                        >
                          <Collapsible
                            open={isOpen}
                            onOpenChange={(open) => setExpandedItemId(open ? key : null)}
                          >
                            <div
                              className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                              onClick={() => toggleExpandedItem(key)}
                            >
                              <ItemContent>
                                <ItemTitle>{event.title}</ItemTitle>
                                <ItemDescription>{event.notes}</ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <Badge variant="secondary">{event.status}</Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Zoom map to calendar event"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setSelectedPanelItemId(key)
                                    void focusMapItem(`calendar-${event.id}`, event.location, 50000)
                                  }}
                                >
                                  <MapIcon className="h-4 w-4" />
                                </Button>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Toggle calendar event details"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <ChevronDown
                                      className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                                    />
                                  </Button>
                                </CollapsibleTrigger>
                              </ItemActions>
                            </div>
                            <CollapsibleContent>
                              <div className="border-t px-3 py-2 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <p>
                                    <span className="font-medium">Type:</span> {event.eventType}
                                  </p>
                                  <p>
                                    <span className="font-medium">Window:</span> {event.timeWindow}
                                  </p>
                                </div>
                                <p className="mt-2">
                                  <span className="font-medium">Owner:</span> {event.owner}
                                </p>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </Item>
                      )
                    })
                  )
                )}

                {activeTab === 'reports' && (
                  cardFilteredReports.length === 0 ? (
                    <Item variant="outline" className={glassItemBorderClasses}>
                      <ItemContent>
                        <ItemTitle>No matching reports</ItemTitle>
                        <ItemDescription>Try a broader search term.</ItemDescription>
                      </ItemContent>
                    </Item>
                  ) : (
                    cardFilteredReports.map((report) => {
                      const key = `report-${report.id}`
                      const isOpen = expandedItemId === key
                      return (
                        <Item
                          key={report.id}
                          variant="outline"
                          className={cn(
                            'flex-col items-stretch p-0',
                            glassItemBorderClasses,
                            selectedPanelItemId === key && 'ring-2 ring-primary/60 bg-primary/5'
                          )}
                        >
                          <Collapsible
                            open={isOpen}
                            onOpenChange={(open) => setExpandedItemId(open ? key : null)}
                          >
                            <div
                              className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                              onClick={() => toggleExpandedItem(key)}
                            >
                              <ItemContent>
                                <ItemTitle>{report.title}</ItemTitle>
                                <ItemDescription>{report.summary}</ItemDescription>
                              </ItemContent>
                              <ItemActions>
                                <Badge variant="secondary">{report.status}</Badge>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Zoom map to report context"
                                  onClick={(event) => {
                                    event.stopPropagation()
                                    setSelectedPanelItemId(key)
                                    void focusMapItem(`report-${report.id}`, report.location, 50000)
                                  }}
                                >
                                  <MapIcon className="h-4 w-4" />
                                </Button>
                                <CollapsibleTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Toggle report details"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    <ChevronDown
                                      className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                                    />
                                  </Button>
                                </CollapsibleTrigger>
                              </ItemActions>
                            </div>
                            <CollapsibleContent>
                              <div className="border-t px-3 py-2 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                  <p>
                                    <span className="font-medium">Type:</span> {report.reportType}
                                  </p>
                                  <p>
                                    <span className="font-medium">Author:</span> {report.author}
                                  </p>
                                </div>
                                <p className="mt-2">
                                  <span className="font-medium">Due:</span> {report.dueBy}
                                </p>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </Item>
                      )
                    })
                  )
                )}

                {activeTab === 'briefing' && (
                  <div className="space-y-3">
                    <div className="sticky top-0 z-10 -mx-2 space-y-3 bg-card px-2 pb-2 pt-1">
                    {viewingIcs201Version && (
                      <div className="flex items-center justify-between rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-200">
                        <div className="flex flex-wrap items-center gap-2">
                          <History className="h-3.5 w-3.5" />
                          <span>
                            You are viewing a past version from{' '}
                            <span className="font-semibold">
                              {new Date(viewingIcs201Version.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>{' '}
                            last edited by{' '}
                            <span
                              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                              style={{ backgroundColor: viewingIcs201Version.authorColor }}
                            >
                              {viewingIcs201Version.authorName}
                            </span>
                            .
                          </span>
                          {(() => {
                            const liveSignatures =
                              ics201Versions.find((entry) => entry.id === viewingIcs201Version.id)
                                ?.signatures ?? viewingIcs201Version.signatures
                            if (liveSignatures.length === 0) {
                              return null
                            }
                            return (
                              <span
                                className="flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300"
                                title={liveSignatures
                                  .map(
                                    (signature) =>
                                      `${signature.name} (${signature.role}) at ${new Date(
                                        signature.signedAt
                                      ).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}`
                                  )
                                  .join(', ')}
                              >
                                <Check className="h-3 w-3" />
                                Signed by{' '}
                                {liveSignatures
                                  .map((signature) => `${signature.name} (${signature.role})`)
                                  .join(', ')}
                              </span>
                            )
                          })()}
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => {
                            if (liveIcs201FormRef.current) {
                              setIcs201Form(liveIcs201FormRef.current)
                              liveIcs201FormRef.current = null
                            }
                            setViewingIcs201Version(null)
                          }}
                        >
                          <X className="h-3.5 w-3.5" />
                          View latest
                        </Button>
                      </div>
                    )}
                    {!viewingIcs201Version && !isCreatingSignedIcs201Version && (
                      <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-400 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-200">
                        {(() => {
                          const latest = ics201Versions[ics201Versions.length - 1]
                          if (!latest) {
                            return <span>You are viewing the latest <span className="font-semibold">draft</span> version.</span>
                          }
                          const versionType = latest.signatures.length > 0 ? 'signed' : 'draft'
                          return (
                            <span>
                              You are viewing the latest <span className="font-semibold">{versionType}</span> version from{' '}
                              <span className="font-semibold">
                                {new Date(latest.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>{' '}
                              last edited by{' '}
                              <span
                                className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                style={{ backgroundColor: latest.authorColor }}
                              >
                                {latest.authorName}
                              </span>
                              .
                            </span>
                          )
                        })()}
                      </div>
                    )}
                    {!isCreatingSignedIcs201Version && (() => {
                      const latestVersion = ics201Versions[ics201Versions.length - 1]
                      const isLatestSigned =
                        !!latestVersion && latestVersion.signatures.length > 0
                      return (
                    <div className="flex items-center justify-between rounded-md border bg-background/70 px-3 py-2 text-xs">
                      {isLatestSigned ? (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Lock className="h-3.5 w-3.5" />
                          <span>Signed versions cannot be edited.</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.2)]" />
                          <div className="flex -space-x-2">
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold text-white"
                              style={{ backgroundColor: '#16a34a' }}
                              title="You"
                            >
                              You
                            </div>
                            {ics201Collaborators.map((collaborator) => (
                              <div
                                key={collaborator.id}
                                className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold text-white"
                                style={{ backgroundColor: collaborator.color }}
                                title={`${collaborator.name} is editing`}
                              >
                                {collaborator.initials}
                              </div>
                            ))}
                          </div>
                          <span className="text-muted-foreground">
                            You, {ics201Collaborators[0].name}, and {ics201Collaborators[1].name} are editing now
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => setIsIcs201VersionDialogOpen(true)}
                        >
                          <History className="h-3.5 w-3.5" />
                          Version history
                          <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                            {ics201Versions.length}
                          </Badge>
                        </Button>
                        {(() => {
                          const signedVersionsCount = ics201Versions.filter(
                            (version) => version.signatures.length > 0
                          ).length
                          return (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={signedVersionsCount === 0}
                              className="h-7 gap-1 text-xs"
                              onClick={() => setIsIcs201SignedVersionsDialogOpen(true)}
                            >
                              <Check className="h-3.5 w-3.5" />
                              Signed Versions
                              <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">
                                {signedVersionsCount}
                              </Badge>
                            </Button>
                          )
                        })()}
                      </div>
                    </div>
                      )
                    })()}
                    <div className="flex items-center justify-start gap-2">
                      {(() => {
                        const latest = ics201Versions[ics201Versions.length - 1]
                        const isLatestSigned = !!latest && latest.signatures.length > 0
                        return (
                          <>
                            {!isLatestSigned && (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1 text-xs"
                                disabled={
                                  viewingIcs201Version !== null ||
                                  isCreatingSignedIcs201Version ||
                                  !latest
                                }
                                onClick={() => {
                                  if (!latest) {
                                    return
                                  }
                                  setIcs201Versions((previous) => {
                                    const next = [...previous]
                                    next[next.length - 1] = {
                                      ...latest,
                                      createdAt: Date.now(),
                                      authorName: 'You',
                                      authorColor: '#16a34a',
                                      snapshot: ics201Form,
                                    }
                                    return next
                                  })
                                }}
                              >
                                Save
                              </Button>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 text-xs"
                              disabled={
                                viewingIcs201Version !== null || isCreatingSignedIcs201Version
                              }
                              onClick={() => {
                                if (isLatestSigned) {
                                  const newVersion: Ics201Version = {
                                    id: `${Date.now()}-draft-${Math.random()
                                      .toString(36)
                                      .slice(2, 8)}`,
                                    createdAt: Date.now(),
                                    authorName: 'You',
                                    authorColor: '#16a34a',
                                    snapshot: ics201Form,
                                    signatures: [],
                                  }
                                  setIcs201Versions((previous) =>
                                    [...previous, newVersion].slice(-100)
                                  )
                                  return
                                }
                                setIsCreatingSignedIcs201Version(true)
                              }}
                            >
                              <Plus className="h-3.5 w-3.5" />
                              {isLatestSigned ? 'Create New Version' : 'Create New Signed Version'}
                            </Button>
                          </>
                        )
                      })()}
                    </div>
                    {isCreatingSignedIcs201Version && !viewingIcs201Version && (
                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-sky-400 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5" />
                          <span>
                            Only you can view and edit this version. Read through it and sign at
                            the bottom. If you sign this version, everyone with permission to view
                            the ICS-201 will see it.
                          </span>
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 gap-1 text-xs"
                          onClick={() => setIsCreatingSignedIcs201Version(false)}
                        >
                          <X className="h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      </div>
                    )}
                    </div>
                    <div
                      className={cn(
                        'space-y-3',
                        (viewingIcs201Version ||
                          (!isCreatingSignedIcs201Version &&
                            (ics201Versions[ics201Versions.length - 1]?.signatures.length ?? 0) >
                              0)) &&
                          'pointer-events-none opacity-70 select-none'
                      )}
                    >
                    <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
                      <div className="px-3 py-2.5">
                        <ItemContent className="space-y-3">
                          <ItemTitle>ICS-201 Incident Briefing</ItemTitle>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={ics201Form.incidentName}
                              onChange={(event) =>
                                updateIcs201Field('incidentName', event.target.value)
                              }
                              placeholder="Incident Name"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.incidentNumber}
                              onChange={(event) =>
                                updateIcs201Field('incidentNumber', event.target.value)
                              }
                              placeholder="Incident Number"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.preparedDateTime}
                              onChange={(event) =>
                                updateIcs201Field('preparedDateTime', event.target.value)
                              }
                              placeholder="Date / Time Prepared"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.preparedBy}
                              onChange={(event) => updateIcs201Field('preparedBy', event.target.value)}
                              placeholder="Prepared By"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.operationalPeriodStart}
                              onChange={(event) =>
                                updateIcs201Field('operationalPeriodStart', event.target.value)
                              }
                              placeholder="Operational Period Start"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.operationalPeriodEnd}
                              onChange={(event) =>
                                updateIcs201Field('operationalPeriodEnd', event.target.value)
                              }
                              placeholder="Operational Period End"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.jurisdiction}
                              onChange={(event) => updateIcs201Field('jurisdiction', event.target.value)}
                              placeholder="Jurisdiction / Agency"
                              className="col-span-2 h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                          </div>
                        </ItemContent>
                      </div>
                    </Item>
                    <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
                      <div className="px-3 py-2.5">
                        <ItemContent className="space-y-2">
                          <ItemTitle>Map Sketch</ItemTitle>
                          <ItemDescription>
                            Capture perimeter, divisions, access routes, shelters, and critical control points.
                          </ItemDescription>
                          <Textarea
                            value={ics201Form.mapSketchDescription}
                            onChange={(event) =>
                              updateIcs201Field('mapSketchDescription', event.target.value)
                            }
                            className="min-h-24 text-xs"
                          />
                          <Textarea
                            value={ics201Form.mapSketchLegend}
                            onChange={(event) => updateIcs201Field('mapSketchLegend', event.target.value)}
                            className="min-h-20 text-xs"
                            placeholder="Map legend and symbols"
                          />
                        </ItemContent>
                      </div>
                    </Item>
                    <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
                      <div className="px-3 py-2.5">
                        <ItemContent className="space-y-2">
                          <ItemTitle>Current Situation</ItemTitle>
                          <Textarea
                            value={ics201Form.currentSituationSummary}
                            onChange={(event) =>
                              updateIcs201Field('currentSituationSummary', event.target.value)
                            }
                            className="min-h-24 text-xs"
                            placeholder="Current situation summary"
                          />
                          <Textarea
                            value={ics201Form.weatherForecast}
                            onChange={(event) => updateIcs201Field('weatherForecast', event.target.value)}
                            className="min-h-20 text-xs"
                            placeholder="Weather forecast and impacts"
                          />
                          <Textarea
                            value={ics201Form.projectedIncidentCourse}
                            onChange={(event) =>
                              updateIcs201Field('projectedIncidentCourse', event.target.value)
                            }
                            className="min-h-20 text-xs"
                            placeholder="Projected incident course"
                          />
                        </ItemContent>
                      </div>
                    </Item>
                    <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
                      <div className="px-3 py-2.5">
                        <ItemContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <ItemTitle>Objectives</ItemTitle>
                            <Button type="button" size="sm" variant="outline" onClick={addIcs201Objective}>
                              + Add Objective
                            </Button>
                          </div>
                          {ics201Form.objectives.map((objective, index) => (
                            <input
                              key={`ics-objective-${index}`}
                              value={objective}
                              onChange={(event) => updateIcs201Objective(index, event.target.value)}
                              placeholder={`Objective ${index + 1}`}
                              className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                          ))}
                        </ItemContent>
                      </div>
                    </Item>
                    <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
                      <div className="px-3 py-2.5">
                        <ItemContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <ItemTitle>Actions</ItemTitle>
                            <Button type="button" size="sm" variant="outline" onClick={addIcs201Action}>
                              + Add Action
                            </Button>
                          </div>
                          {ics201Form.actions.map((action) => (
                            <div key={action.id} className="grid grid-cols-5 gap-2">
                              <input
                                value={action.task}
                                onChange={(event) => updateIcs201Action(action.id, 'task', event.target.value)}
                                placeholder="Action"
                                className="col-span-2 h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                              <input
                                value={action.owner}
                                onChange={(event) => updateIcs201Action(action.id, 'owner', event.target.value)}
                                placeholder="Owner"
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                              <input
                                value={action.startTime}
                                onChange={(event) =>
                                  updateIcs201Action(action.id, 'startTime', event.target.value)
                                }
                                placeholder="Start"
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                              <input
                                value={action.endTime}
                                onChange={(event) =>
                                  updateIcs201Action(action.id, 'endTime', event.target.value)
                                }
                                placeholder="End"
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                            </div>
                          ))}
                        </ItemContent>
                      </div>
                    </Item>
                    <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
                      <div className="px-3 py-2.5">
                        <ItemContent className="space-y-2">
                          <ItemTitle>Organization Chart</ItemTitle>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              value={ics201Form.orgChart.incidentCommander}
                              onChange={(event) =>
                                updateIcs201OrgChartField('incidentCommander', event.target.value)
                              }
                              placeholder="Incident Commander"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.orgChart.operationsSectionChief}
                              onChange={(event) =>
                                updateIcs201OrgChartField('operationsSectionChief', event.target.value)
                              }
                              placeholder="Operations Section Chief"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.orgChart.planningSectionChief}
                              onChange={(event) =>
                                updateIcs201OrgChartField('planningSectionChief', event.target.value)
                              }
                              placeholder="Planning Section Chief"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.orgChart.logisticsSectionChief}
                              onChange={(event) =>
                                updateIcs201OrgChartField('logisticsSectionChief', event.target.value)
                              }
                              placeholder="Logistics Section Chief"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.orgChart.financeSectionChief}
                              onChange={(event) =>
                                updateIcs201OrgChartField('financeSectionChief', event.target.value)
                              }
                              placeholder="Finance/Admin Section Chief"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.orgChart.publicInformationOfficer}
                              onChange={(event) =>
                                updateIcs201OrgChartField('publicInformationOfficer', event.target.value)
                              }
                              placeholder="Public Information Officer"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.orgChart.safetyOfficer}
                              onChange={(event) =>
                                updateIcs201OrgChartField('safetyOfficer', event.target.value)
                              }
                              placeholder="Safety Officer"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                            <input
                              value={ics201Form.orgChart.liaisonOfficer}
                              onChange={(event) =>
                                updateIcs201OrgChartField('liaisonOfficer', event.target.value)
                              }
                              placeholder="Liaison Officer"
                              className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                            />
                          </div>
                        </ItemContent>
                      </div>
                    </Item>
                    <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
                      <div className="px-3 py-2.5">
                        <ItemContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <ItemTitle>Resources Summary</ItemTitle>
                            <Button type="button" size="sm" variant="outline" onClick={addIcs201Resource}>
                              + Add Resource
                            </Button>
                          </div>
                          {ics201Form.resources.map((resource) => (
                            <div key={resource.id} className="grid grid-cols-5 gap-2">
                              <input
                                value={resource.category}
                                onChange={(event) =>
                                  updateIcs201Resource(resource.id, 'category', event.target.value)
                                }
                                placeholder="Category"
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                              <input
                                value={resource.identifier}
                                onChange={(event) =>
                                  updateIcs201Resource(resource.id, 'identifier', event.target.value)
                                }
                                placeholder="Identifier"
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                              <input
                                value={resource.quantity}
                                onChange={(event) =>
                                  updateIcs201Resource(resource.id, 'quantity', event.target.value)
                                }
                                placeholder="Qty"
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                              <input
                                value={resource.status}
                                onChange={(event) =>
                                  updateIcs201Resource(resource.id, 'status', event.target.value)
                                }
                                placeholder="Status"
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                              <input
                                value={resource.assignment}
                                onChange={(event) =>
                                  updateIcs201Resource(resource.id, 'assignment', event.target.value)
                                }
                                placeholder="Assignment"
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                              />
                            </div>
                          ))}
                        </ItemContent>
                      </div>
                    </Item>
                    <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
                      <div className="px-3 py-2.5">
                        <ItemContent className="space-y-3">
                          <div className="flex items-center justify-between">
                            <ItemTitle>Safety Analysis</ItemTitle>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={addIcs201SafetyAnalysis}
                            >
                              + Add Safety Item
                            </Button>
                          </div>
                          {ics201Form.safetyAnalysis.map((safetyRow) => (
                            <div key={safetyRow.id} className="grid grid-cols-2 gap-2">
                              <Textarea
                                value={safetyRow.hazard}
                                onChange={(event) =>
                                  updateIcs201SafetyAnalysis(
                                    safetyRow.id,
                                    'hazard',
                                    event.target.value
                                  )
                                }
                                className="min-h-16 text-xs"
                                placeholder="Hazard"
                              />
                              <Textarea
                                value={safetyRow.mitigation}
                                onChange={(event) =>
                                  updateIcs201SafetyAnalysis(
                                    safetyRow.id,
                                    'mitigation',
                                    event.target.value
                                  )
                                }
                                className="min-h-16 text-xs"
                                placeholder="Mitigation"
                              />
                              <input
                                value={safetyRow.ppe}
                                onChange={(event) =>
                                  updateIcs201SafetyAnalysis(safetyRow.id, 'ppe', event.target.value)
                                }
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                placeholder="PPE"
                              />
                              <input
                                value={safetyRow.medicalPlan}
                                onChange={(event) =>
                                  updateIcs201SafetyAnalysis(
                                    safetyRow.id,
                                    'medicalPlan',
                                    event.target.value
                                  )
                                }
                                className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                placeholder="Medical Plan"
                              />
                            </div>
                          ))}
                        </ItemContent>
                      </div>
                    </Item>
                    {!viewingIcs201Version &&
                      !isCreatingSignedIcs201Version &&
                      (() => {
                        const latest = ics201Versions[ics201Versions.length - 1]
                        const signature = latest?.signatures[0]
                        if (!signature) {
                          return null
                        }
                        const signedAt = new Date(signature.signedAt)
                        return (
                          <Item
                            variant="outline"
                            className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}
                          >
                            <div className="px-3 py-2.5">
                              <ItemContent className="space-y-2">
                                <ItemTitle>Approval</ItemTitle>
                                <div className="grid grid-cols-4 gap-3 text-xs">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                      Name
                                    </span>
                                    <span>{signature.name}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                      Position Title
                                    </span>
                                    <span>{signature.role}</span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                      Signature
                                    </span>
                                    <span className="font-serif text-base italic">
                                      {signature.name}
                                    </span>
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                      Date/Time
                                    </span>
                                    <span>
                                      {signedAt.toLocaleString([], {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </ItemContent>
                            </div>
                          </Item>
                        )
                      })()}
                    </div>
                    {isCreatingSignedIcs201Version && !viewingIcs201Version && (
                      <div className="flex items-center justify-end rounded-md border border-sky-400 bg-sky-50/60 px-3 py-2 dark:border-sky-500 dark:bg-sky-500/10">
                        <Button
                          type="button"
                          size="sm"
                          className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                          onClick={() => {
                            setIcs201SignNameInput('You')
                            setIsIcs201SignNameDialogOpen(true)
                          }}
                        >
                          <Check className="h-3.5 w-3.5" />
                          Sign this version
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'form-ICS-204' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-end">
                      <Button type="button" size="sm" variant="outline" onClick={addIcs204Form}>
                        + Add ICS-204
                      </Button>
                    </div>

                        {ics204Forms.map((form) => {
                          const isFormOpen = expandedIcs204FormId === form.id
                          const formVersions = ics204VersionsById[form.id] ?? []
                          const latestFormVersion = formVersions[formVersions.length - 1]
                          const isLatestFormSigned =
                            !!latestFormVersion && latestFormVersion.signatures.length > 0
                          const viewingPastFormVersion = viewingIcs204VersionByFormId[form.id] ?? null
                          const isDraftingFormSigned = !!isCreatingSignedIcs204ByFormId[form.id]
                          const formIsLocked =
                            !!viewingPastFormVersion ||
                            (!isDraftingFormSigned && isLatestFormSigned)
                          const signedFormVersionsCount = formVersions.filter(
                            (version) => version.signatures.length > 0
                          ).length
                          const latestFormSignature = latestFormVersion?.signatures[0]
                          const latestFormSignatures = latestFormVersion?.signatures ?? []
                          const hasPlanningReview = latestFormSignatures.some(
                            (signature, index) =>
                              index > 0 && signature.role === 'Planning Section Chief'
                          )
                          const hasOperationsReview = latestFormSignatures.some(
                            (signature, index) =>
                              index > 0 && signature.role === 'Operations Section Chief'
                          )
                          const isFormFullySigned =
                            !!latestFormSignature && hasPlanningReview && hasOperationsReview
                          const isFormAssigned = !!ics204AssignedByFormId[form.id]
                          return (
                            <Item
                              key={form.id}
                              variant="outline"
                              className={cn(
                                'relative min-w-0 w-full max-w-full flex-col items-stretch p-0',
                                glassItemBorderClasses
                              )}
                            >
                              <Collapsible
                                open={isFormOpen}
                                onOpenChange={(open) => setExpandedIcs204FormId(open ? form.id : null)}
                              >
                                <div className="relative px-3 py-2.5 pr-32">
                                  <ItemContent className="min-w-0">
                                    <ItemTitle>{form.assignedUnit || `ICS-204 #${form.id}`}</ItemTitle>
                                    <ItemDescription>
                                      Leader:{' '}
                                      {form.divisionGroupSupervisor ||
                                        form.branchDirector ||
                                        form.sectionChief ||
                                        'Unassigned'}{' '}
                                      • Work Assignments: {form.workAssignments.length}
                                    </ItemDescription>
                                  </ItemContent>
                                  <ItemActions className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2 justify-end">
                                    {isFormFullySigned &&
                                      (isFormAssigned ? (
                                        <span className="flex items-center gap-1 rounded-full border border-emerald-400 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:border-emerald-500/60 dark:bg-emerald-500/10 dark:text-emerald-200">
                                          <Check className="h-3 w-3" />
                                          Assigned
                                        </span>
                                      ) : (
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="h-7 gap-1 text-xs"
                                          onClick={(event) => {
                                            event.stopPropagation()
                                            setIcs204AssignConfirmDialog({ formId: form.id })
                                          }}
                                        >
                                          Assign
                                        </Button>
                                      ))}
                                    <CollapsibleTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Toggle ICS-204 details"
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        <ChevronDown
                                          className={cn(
                                            'h-4 w-4 transition-transform',
                                            isFormOpen && 'rotate-180'
                                          )}
                                        />
                                      </Button>
                                    </CollapsibleTrigger>
                                  </ItemActions>
                                </div>
                                <CollapsibleContent>
                                  <div className="min-w-0 max-w-full space-y-3 border-t px-3 py-2.5 pr-6">
                                    <div className="sticky top-0 z-10 -mx-3 space-y-3 border-b bg-card px-3 pb-3 pt-1">
                                    {viewingPastFormVersion && (
                                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-200">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <History className="h-3.5 w-3.5" />
                                          <span>
                                            You are viewing a past version from{' '}
                                            <span className="font-semibold">
                                              {new Date(
                                                viewingPastFormVersion.createdAt
                                              ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                              })}
                                            </span>{' '}
                                            last edited by{' '}
                                            <span
                                              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                              style={{
                                                backgroundColor: viewingPastFormVersion.authorColor,
                                              }}
                                            >
                                              {viewingPastFormVersion.authorName}
                                            </span>
                                            .
                                          </span>
                                          {(() => {
                                            const liveSigs =
                                              formVersions.find(
                                                (entry) => entry.id === viewingPastFormVersion.id
                                              )?.signatures ?? viewingPastFormVersion.signatures
                                            if (liveSigs.length === 0) return null
                                            return (
                                              <span className="flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300">
                                                <Check className="h-3 w-3" />
                                                Signed by{' '}
                                                {liveSigs
                                                  .map(
                                                    (signature) =>
                                                      `${signature.name} (${signature.role})`
                                                  )
                                                  .join(', ')}
                                              </span>
                                            )
                                          })()}
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="h-7 gap-1 text-xs"
                                          onClick={() => {
                                            const live = liveIcs204FormsRef.current[form.id]
                                            if (live) {
                                              setIcs204Forms((previous) =>
                                                previous.map((entry) =>
                                                  entry.id === form.id ? live : entry
                                                )
                                              )
                                              delete liveIcs204FormsRef.current[form.id]
                                            }
                                            setViewingIcs204VersionByFormId((previous) => {
                                              const next = { ...previous }
                                              delete next[form.id]
                                              return next
                                            })
                                          }}
                                        >
                                          <X className="h-3.5 w-3.5" />
                                          View latest
                                        </Button>
                                      </div>
                                    )}
                                    {!viewingPastFormVersion && !isDraftingFormSigned && (
                                      <div className="flex flex-wrap items-center gap-2 rounded-md border border-emerald-400 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-200">
                                        {latestFormVersion ? (
                                          <span>
                                            You are viewing the latest{' '}
                                            <span className="font-semibold">
                                              {isLatestFormSigned ? 'signed' : 'draft'}
                                            </span>{' '}
                                            version from{' '}
                                            <span className="font-semibold">
                                              {new Date(
                                                latestFormVersion.createdAt
                                              ).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                              })}
                                            </span>{' '}
                                            last edited by{' '}
                                            <span
                                              className="rounded px-1.5 py-0.5 text-[10px] font-semibold text-white"
                                              style={{
                                                backgroundColor: latestFormVersion.authorColor,
                                              }}
                                            >
                                              {latestFormVersion.authorName}
                                            </span>
                                            .
                                          </span>
                                        ) : (
                                          <span>You are viewing the latest version.</span>
                                        )}
                                      </div>
                                    )}
                                    {!viewingPastFormVersion && !isDraftingFormSigned && (
                                      <div className="flex items-center justify-between rounded-md border bg-background/70 px-3 py-2 text-xs">
                                        {isLatestFormSigned ? (
                                          <div className="flex items-center gap-2 text-muted-foreground">
                                            <Lock className="h-3.5 w-3.5" />
                                            <span>Signed versions are locked from edits.</span>
                                          </div>
                                        ) : (
                                          <div className="text-muted-foreground">
                                            Draft is editable. Save to update the latest draft or
                                            sign to promote it.
                                          </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-7 gap-1 text-xs"
                                            onClick={() =>
                                              setIcs204VersionDialog({
                                                formId: form.id,
                                                kind: 'all',
                                              })
                                            }
                                          >
                                            <History className="h-3.5 w-3.5" />
                                            Version history
                                            <Badge
                                              variant="secondary"
                                              className="ml-1 h-4 px-1.5 text-[10px]"
                                            >
                                              {formVersions.length}
                                            </Badge>
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            disabled={signedFormVersionsCount === 0}
                                            className="h-7 gap-1 text-xs"
                                            onClick={() =>
                                              setIcs204VersionDialog({
                                                formId: form.id,
                                                kind: 'signed',
                                              })
                                            }
                                          >
                                            <Check className="h-3.5 w-3.5" />
                                            Signed Versions
                                            <Badge
                                              variant="secondary"
                                              className="ml-1 h-4 px-1.5 text-[10px]"
                                            >
                                              {signedFormVersionsCount}
                                            </Badge>
                                          </Button>
                                        </div>
                                      </div>
                                    )}
                                    {!viewingPastFormVersion && !isDraftingFormSigned && (
                                      <div className="flex items-center justify-start gap-2">
                                        {!isLatestFormSigned && (
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="h-7 gap-1 text-xs"
                                            disabled={!latestFormVersion}
                                            onClick={() => {
                                              if (!latestFormVersion) return
                                              setIcs204VersionsById((previous) => {
                                                const existing = previous[form.id] ?? []
                                                if (existing.length === 0) return previous
                                                const next = [...existing]
                                                next[next.length - 1] = {
                                                  ...latestFormVersion,
                                                  createdAt: Date.now(),
                                                  authorName: 'You',
                                                  authorColor: '#16a34a',
                                                  snapshot: form,
                                                }
                                                return { ...previous, [form.id]: next }
                                              })
                                            }}
                                          >
                                            Save
                                          </Button>
                                        )}
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="h-7 gap-1 text-xs"
                                          onClick={() => {
                                            if (isLatestFormSigned) {
                                              const newVersion: Ics204Version = {
                                                id: `${Date.now()}-204-${form.id}-draft-${Math.random()
                                                  .toString(36)
                                                  .slice(2, 8)}`,
                                                createdAt: Date.now(),
                                                authorName: 'You',
                                                authorColor: '#16a34a',
                                                snapshot: form,
                                                signatures: [],
                                              }
                                              setIcs204VersionsById((previous) => ({
                                                ...previous,
                                                [form.id]: [
                                                  ...(previous[form.id] ?? []),
                                                  newVersion,
                                                ].slice(-100),
                                              }))
                                              return
                                            }
                                            setIsCreatingSignedIcs204ByFormId((previous) => ({
                                              ...previous,
                                              [form.id]: true,
                                            }))
                                          }}
                                        >
                                          <Plus className="h-3.5 w-3.5" />
                                          {isLatestFormSigned
                                            ? 'Create New Version'
                                            : 'Create New Signed Version'}
                                        </Button>
                                      </div>
                                    )}
                                    {isDraftingFormSigned && !viewingPastFormVersion && (
                                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-sky-400 bg-sky-50 px-3 py-2 text-xs text-sky-900 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200">
                                        <div className="flex items-center gap-2">
                                          <FileText className="h-3.5 w-3.5" />
                                          <span>
                                            Only you can view and edit this version. Read through
                                            it and sign at the bottom. If you sign this version,
                                            everyone with permission to view the ICS-204 will see
                                            it.
                                          </span>
                                        </div>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          className="h-7 gap-1 text-xs"
                                          onClick={() =>
                                            setIsCreatingSignedIcs204ByFormId((previous) => {
                                              const next = { ...previous }
                                              delete next[form.id]
                                              return next
                                            })
                                          }
                                        >
                                          <X className="h-3.5 w-3.5" />
                                          Cancel
                                        </Button>
                                      </div>
                                    )}
                                    </div>
                                    <div
                                      className={cn(
                                        'space-y-3',
                                        formIsLocked &&
                                          'pointer-events-none opacity-70 select-none'
                                      )}
                                    >
                                    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold">Assigned Unit</p>
                                        <select
                                          value={form.assignedUnit}
                                          onChange={(event) =>
                                            updateIcs204Field(form.id, 'assignedUnit', event.target.value)
                                          }
                                          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                        >
                                          <option value="Division A Task Force">Division A Task Force</option>
                                          <option value="Division B Task Force">Division B Task Force</option>
                                          <option value="Medical Group">Medical Group</option>
                                          <option value="Evacuation Group">Evacuation Group</option>
                                          <option value="Infrastructure Group">Infrastructure Group</option>
                                        </select>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold">Section Chief</p>
                                        <input
                                          value={form.sectionChief}
                                          onChange={(event) =>
                                            updateIcs204Field(form.id, 'sectionChief', event.target.value)
                                          }
                                          className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold">Branch Director</p>
                                        <input
                                          value={form.branchDirector}
                                          onChange={(event) =>
                                            updateIcs204Field(form.id, 'branchDirector', event.target.value)
                                          }
                                          className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                        />
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold">Division/Group Supervisor</p>
                                        <input
                                          value={form.divisionGroupSupervisor}
                                          onChange={(event) =>
                                            updateIcs204Field(
                                              form.id,
                                              'divisionGroupSupervisor',
                                              event.target.value
                                            )
                                          }
                                          className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                        />
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold">Branch</p>
                                        <select
                                          value={form.branch}
                                          onChange={(event) =>
                                            updateIcs204Field(form.id, 'branch', event.target.value)
                                          }
                                          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                        >
                                          <option value="">Select Branch</option>
                                          <option value="Operations Branch">Operations Branch</option>
                                          <option value="Planning Branch">Planning Branch</option>
                                          <option value="Logistics Branch">Logistics Branch</option>
                                          <option value="Medical Branch">Medical Branch</option>
                                        </select>
                                      </div>
                                      <div className="space-y-1 xl:pr-3">
                                        <p className="text-xs font-semibold">Division</p>
                                        <select
                                          value={form.division}
                                          onChange={(event) =>
                                            updateIcs204Field(form.id, 'division', event.target.value)
                                          }
                                          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                        >
                                          <option value="">Select Division</option>
                                          <option value="Division A">Division A</option>
                                          <option value="Division B">Division B</option>
                                          <option value="Division C">Division C</option>
                                          <option value="Division D">Division D</option>
                                        </select>
                                      </div>
                                      <div className="space-y-1">
                                        <p className="text-xs font-semibold">Group</p>
                                        <select
                                          value={form.group}
                                          onChange={(event) =>
                                            updateIcs204Field(form.id, 'group', event.target.value)
                                          }
                                          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                        >
                                          <option value="">Select Group</option>
                                          <option value="Evacuation Group">Evacuation Group</option>
                                          <option value="Infrastructure Group">Infrastructure Group</option>
                                          <option value="Medical Group">Medical Group</option>
                                          <option value="Shelter Group">Shelter Group</option>
                                        </select>
                                      </div>
                                      <div className="space-y-1 xl:pr-3">
                                        <p className="text-xs font-semibold">Staging Area</p>
                                        <select
                                          value={form.stagingArea}
                                          onChange={(event) =>
                                            updateIcs204Field(form.id, 'stagingArea', event.target.value)
                                          }
                                          className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                        >
                                          <option value="">Select Staging Area</option>
                                          <option value="North Staging">North Staging</option>
                                          <option value="South Staging">South Staging</option>
                                          <option value="East Staging">East Staging</option>
                                          <option value="West Staging">West Staging</option>
                                        </select>
                                      </div>
                                    </div>

                                    <div className="space-y-2 xl:pr-3">
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold">Resources Assigned</p>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => setIcs204ResourcePickerFormId(form.id)}
                                        >
                                          + Add Resource
                                        </Button>
                                      </div>
                                      <div className="min-w-0 max-w-full rounded-md border p-2">
                                        <div className="max-w-full overflow-x-auto pr-1 [scrollbar-gutter:stable_both-edges]">
                                          <div className="w-full min-w-0 space-y-2">
                                            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 text-[11px] font-semibold text-muted-foreground">
                                              <span>Resource Identifier</span>
                                              <span>Leader</span>
                                              <span>Contact</span>
                                              <span>Location</span>
                                              <span className="text-right">Actions</span>
                                            </div>
                                            {form.resourcesAssigned.map((row) => (
                                              <div
                                                key={row.id}
                                                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto] gap-2"
                                              >
                                                <input
                                                  value={row.resourceIdentifier}
                                                  onChange={(event) =>
                                                    updateIcs204ResourceAssigned(
                                                      form.id,
                                                      row.id,
                                                      'resourceIdentifier',
                                                      event.target.value
                                                    )
                                                  }
                                                  className="h-8 w-full min-w-0 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                />
                                                <input
                                                  value={row.leader}
                                                  onChange={(event) =>
                                                    updateIcs204ResourceAssigned(
                                                      form.id,
                                                      row.id,
                                                      'leader',
                                                      event.target.value
                                                    )
                                                  }
                                                  className="h-8 w-full min-w-0 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                />
                                                <input
                                                  value={row.contact}
                                                  onChange={(event) =>
                                                    updateIcs204ResourceAssigned(
                                                      form.id,
                                                      row.id,
                                                      'contact',
                                                      event.target.value
                                                    )
                                                  }
                                                  className="h-8 w-full min-w-0 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                />
                                                <input
                                                  value={row.location}
                                                  onChange={(event) =>
                                                    updateIcs204ResourceAssigned(
                                                      form.id,
                                                      row.id,
                                                      'location',
                                                      event.target.value
                                                    )
                                                  }
                                                  className="h-8 w-full min-w-0 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                />
                                                <Button
                                                  type="button"
                                                  variant="ghost"
                                                  size="icon"
                                                  aria-label="Delete assigned resource row"
                                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                                  onClick={() => deleteIcs204ResourceAssignedRow(form.id, row.id)}
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </Button>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="space-y-2 xl:pr-3">
                                      <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold">Work Assignments</p>
                                        <Button
                                          type="button"
                                          size="sm"
                                          variant="outline"
                                          onClick={() => addIcs204WorkAssignment(form.id)}
                                        >
                                          + Add Assignment
                                        </Button>
                                      </div>
                                      <div className="space-y-2">
                                        {form.workAssignments.map((row) => {
                                          const workAssignmentKey = `${form.id}-${row.id}`
                                          const isWorkAssignmentOpen =
                                            expandedIcs204WorkAssignmentKey === workAssignmentKey
                                          return (
                                            <Item
                                              key={row.id}
                                              variant="outline"
                                              className={cn(
                                                'relative min-w-0 w-full max-w-full flex-col items-stretch overflow-hidden p-0 [contain:layout]',
                                                glassItemBorderClasses
                                              )}
                                            >
                                              <Collapsible
                                                open={isWorkAssignmentOpen}
                                                onOpenChange={(open) =>
                                                  setExpandedIcs204WorkAssignmentKey(
                                                    open ? workAssignmentKey : null
                                                  )
                                                }
                                              >
                                                <div className="relative px-3 py-2.5 pr-12">
                                                  <ItemContent className="min-w-0">
                                                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                                                      <input
                                                        value={row.assignment}
                                                        onChange={(event) =>
                                                          updateIcs204WorkAssignment(
                                                            form.id,
                                                            row.id,
                                                            'assignment',
                                                            event.target.value
                                                          )
                                                        }
                                                        placeholder="Work Assignment"
                                                        className="col-span-2 h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                      />
                                                      <input
                                                        value={row.priority}
                                                        onChange={(event) =>
                                                          updateIcs204WorkAssignment(
                                                            form.id,
                                                            row.id,
                                                            'priority',
                                                            event.target.value
                                                          )
                                                        }
                                                        placeholder="Priority"
                                                        className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                      />
                                                    </div>
                                                  </ItemContent>
                                                  <ItemActions className="absolute right-3 top-1/2 w-8 -translate-y-1/2 justify-end">
                                                    <CollapsibleTrigger asChild>
                                                      <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        aria-label="Toggle work assignment details"
                                                        onClick={(event) => event.stopPropagation()}
                                                      >
                                                        <ChevronDown
                                                          className={cn(
                                                            'h-4 w-4 transition-transform',
                                                            isWorkAssignmentOpen && 'rotate-180'
                                                          )}
                                                        />
                                                      </Button>
                                                    </CollapsibleTrigger>
                                                  </ItemActions>
                                                </div>
                                                <CollapsibleContent>
                                                  <div className="min-w-0 max-w-full space-y-2 border-t px-3 py-2.5 pr-6">
                                                    <input
                                                      value={row.requestedArrivalTime}
                                                      onChange={(event) =>
                                                        updateIcs204WorkAssignment(
                                                          form.id,
                                                          row.id,
                                                          'requestedArrivalTime',
                                                          event.target.value
                                                        )
                                                      }
                                                      placeholder="Requested Arrival Time"
                                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                                    />
                                                    <div className="space-y-2 rounded-md border p-2">
                                                      <div className="flex items-center justify-between">
                                                        <p className="text-xs font-semibold">
                                                          Resource Requirements
                                                        </p>
                                                        <Button
                                                          type="button"
                                                          size="sm"
                                                          variant="outline"
                                                          onClick={() =>
                                                            addIcs204ResourceRequirementRow(form.id, row.id)
                                                          }
                                                        >
                                                          + Add Requirement
                                                        </Button>
                                                      </div>
                                                      <div className="grid grid-cols-4 gap-2 text-[11px] font-semibold text-muted-foreground">
                                                        <span>Resource</span>
                                                        <span>Required</span>
                                                        <span>Have</span>
                                                        <span>Need</span>
                                                      </div>
                                                      <div className="max-w-full overflow-x-auto pr-1">
                                                        <div className="w-full min-w-0 space-y-2">
                                                          {row.resourceRequirements.map((requirement) => (
                                                            <div
                                                              key={requirement.id}
                                                              className="flex items-center gap-2"
                                                            >
                                                              <div className="grid flex-1 grid-cols-4 gap-2">
                                                                <input
                                                                  value={requirement.resource}
                                                                  onChange={(event) =>
                                                                    updateIcs204ResourceRequirementCell(
                                                                      form.id,
                                                                      row.id,
                                                                      requirement.id,
                                                                      'resource',
                                                                      event.target.value
                                                                    )
                                                                  }
                                                                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                                />
                                                                <input
                                                                  value={requirement.required}
                                                                  onChange={(event) =>
                                                                    updateIcs204ResourceRequirementCell(
                                                                      form.id,
                                                                      row.id,
                                                                      requirement.id,
                                                                      'required',
                                                                      event.target.value
                                                                    )
                                                                  }
                                                                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                                />
                                                                <input
                                                                  value={requirement.have}
                                                                  onChange={(event) =>
                                                                    updateIcs204ResourceRequirementCell(
                                                                      form.id,
                                                                      row.id,
                                                                      requirement.id,
                                                                      'have',
                                                                      event.target.value
                                                                    )
                                                                  }
                                                                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                                />
                                                                <input
                                                                  value={requirement.need}
                                                                  onChange={(event) =>
                                                                    updateIcs204ResourceRequirementCell(
                                                                      form.id,
                                                                      row.id,
                                                                      requirement.id,
                                                                      'need',
                                                                      event.target.value
                                                                    )
                                                                  }
                                                                  className="h-8 rounded-md border bg-transparent px-2 text-xs outline-none"
                                                                />
                                                              </div>
                                                              <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                aria-label="Delete resource requirement"
                                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                                onClick={() =>
                                                                  deleteIcs204ResourceRequirementRow(
                                                                    form.id,
                                                                    row.id,
                                                                    requirement.id
                                                                  )
                                                                }
                                                              >
                                                                <Trash2 className="h-4 w-4" />
                                                              </Button>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      </div>
                                                    </div>
                                                    <Textarea
                                                      value={row.overheadPositions}
                                                      onChange={(event) =>
                                                        updateIcs204WorkAssignment(
                                                          form.id,
                                                          row.id,
                                                          'overheadPositions',
                                                          event.target.value
                                                        )
                                                      }
                                                      className="min-h-16 text-xs"
                                                      placeholder="Overhead Positions"
                                                    />
                                                    <Textarea
                                                      value={row.specialEquipmentSupplies}
                                                      onChange={(event) =>
                                                        updateIcs204WorkAssignment(
                                                          form.id,
                                                          row.id,
                                                          'specialEquipmentSupplies',
                                                          event.target.value
                                                        )
                                                      }
                                                      className="min-h-16 text-xs"
                                                      placeholder="Special Equipment & Supplies"
                                                    />
                                                    <input
                                                      value={row.reportingLocation}
                                                      onChange={(event) =>
                                                        updateIcs204WorkAssignment(
                                                          form.id,
                                                          row.id,
                                                          'reportingLocation',
                                                          event.target.value
                                                        )
                                                      }
                                                      placeholder="Reporting Location"
                                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                                    />
                                                  </div>
                                                </CollapsibleContent>
                                              </Collapsible>
                                            </Item>
                                          )
                                        })}
                                      </div>
                                    </div>

                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold">Special Instructions</p>
                                      <Textarea
                                        value={form.specialInstructions}
                                        onChange={(event) =>
                                          updateIcs204Field(
                                            form.id,
                                            'specialInstructions',
                                            event.target.value
                                          )
                                        }
                                        className="min-h-20 text-xs"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <p className="text-xs font-semibold">Communications</p>
                                      <Textarea
                                        value={form.communications}
                                        onChange={(event) =>
                                          updateIcs204Field(form.id, 'communications', event.target.value)
                                        }
                                        className="min-h-20 text-xs"
                                      />
                                    </div>
                                    </div>
                                    {!viewingPastFormVersion &&
                                      !isDraftingFormSigned &&
                                      latestFormSignature &&
                                      (() => {
                                        const preparedBy = latestFormSignature
                                        const planningReviewer =
                                          (latestFormVersion?.signatures ?? []).find(
                                            (signature, index) =>
                                              index > 0 &&
                                              signature.role === 'Planning Section Chief'
                                          ) ?? null
                                        const operationsReviewer =
                                          (latestFormVersion?.signatures ?? []).find(
                                            (signature, index) =>
                                              index > 0 &&
                                              signature.role === 'Operations Section Chief'
                                          ) ?? null
                                        const renderFilled = (
                                          label: string,
                                          signature: Ics201VersionSignature
                                        ) => (
                                          <div className="rounded-md border p-3">
                                            <p className="mb-2 text-xs font-semibold">{label}</p>
                                            <div className="grid grid-cols-4 gap-3 text-xs">
                                              <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                                  Name
                                                </span>
                                                <span>{signature.name}</span>
                                              </div>
                                              <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                                  Position Title
                                                </span>
                                                <span>{signature.role}</span>
                                              </div>
                                              <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                                  Signature
                                                </span>
                                                <span className="font-serif text-base italic">
                                                  {signature.name}
                                                </span>
                                              </div>
                                              <div className="flex flex-col gap-0.5">
                                                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                                  Date/Time
                                                </span>
                                                <span>
                                                  {new Date(signature.signedAt).toLocaleString(
                                                    [],
                                                    {
                                                      year: 'numeric',
                                                      month: '2-digit',
                                                      day: '2-digit',
                                                      hour: '2-digit',
                                                      minute: '2-digit',
                                                    }
                                                  )}
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                        )
                                        const renderEmptyReview = (role: string) => (
                                          <button
                                            type="button"
                                            className="flex w-full items-center justify-between rounded-md border border-dashed border-muted-foreground/40 bg-muted/20 px-3 py-3 text-left text-xs transition hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                                            onClick={() => {
                                              setIcs204SignNameInput('You')
                                              setIcs204SignDialog({
                                                formId: form.id,
                                                mode: 'review',
                                                role,
                                              })
                                            }}
                                          >
                                            <div>
                                              <p className="font-semibold">
                                                Review as {role}
                                              </p>
                                              <p className="text-[11px] text-muted-foreground">
                                                Click here to sign as the {role}.
                                              </p>
                                            </div>
                                            <span className="flex items-center gap-1 rounded-full border border-emerald-400 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300">
                                              <Check className="h-3 w-3" /> Sign
                                            </span>
                                          </button>
                                        )
                                        return (
                                          <div className="space-y-2">
                                            {renderFilled('Prepared by', preparedBy)}
                                            {planningReviewer
                                              ? renderFilled(
                                                  'Signed by Planning Section Chief',
                                                  planningReviewer
                                                )
                                              : renderEmptyReview('Planning Section Chief')}
                                            {operationsReviewer
                                              ? renderFilled(
                                                  'Signed by Operations Section Chief',
                                                  operationsReviewer
                                                )
                                              : renderEmptyReview('Operations Section Chief')}
                                          </div>
                                        )
                                      })()}
                                    {isDraftingFormSigned && !viewingPastFormVersion && (
                                      <div className="flex items-center justify-end rounded-md border border-sky-400 bg-sky-50/60 px-3 py-2 dark:border-sky-500 dark:bg-sky-500/10">
                                        <Button
                                          type="button"
                                          size="sm"
                                          className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                                          onClick={() => {
                                            setIcs204SignNameInput('You')
                                            setIcs204SignDialog({
                                              formId: form.id,
                                              mode: 'new-version',
                                              role: 'Operations Section Chief',
                                            })
                                          }}
                                        >
                                          <Check className="h-3.5 w-3.5" />
                                          Sign this version
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </Item>
                          )
                        })}
                  </div>
                )}

                {activeTab === 'form-ICS-233' && (
                  <Item
                    variant="outline"
                    className={cn(
                      'flex-col items-stretch p-0',
                      !isMapVisible && glassItemBorderClasses,
                      isMapVisible && 'border-0 bg-transparent shadow-none'
                    )}
                  >
                    {ics233ViewMode === 'table' ? (
                      <div className="px-3 py-2.5">
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[1540px] border-collapse text-xs">
                            <colgroup>
                              <col className="w-[30rem]" />
                              <col className="w-[16rem]" />
                              <col className="w-[18rem]" />
                              <col className="w-[10rem]" />
                              <col className="w-[13rem]" />
                              <col className="w-[13rem]" />
                              <col className="w-[12rem]" />
                              <col className="w-[10rem]" />
                            </colgroup>
                            <thead>
                              <tr className="border-b text-left text-muted-foreground">
                                <th className="px-2 py-2 font-semibold">Task</th>
                                <th className="px-2 py-2 font-semibold">Assignee</th>
                                <th className="px-2 py-2 font-semibold">Point of Contact</th>
                                <th className="px-2 py-2 font-semibold">POC Briefed</th>
                                <th className="px-2 py-2 font-semibold">Start</th>
                                <th className="px-2 py-2 font-semibold">Deadline</th>
                                <th className="px-2 py-2 font-semibold">Status</th>
                                <th className="px-2 py-2 font-semibold" />
                              </tr>
                              <tr className="border-b bg-muted/20">
                                <th className="px-2 py-2">
                                  <input
                                    value={ics233Filters.task}
                                    onChange={(event) =>
                                      setIcs233Filters((previous) => ({
                                        ...previous,
                                        task: event.target.value,
                                      }))
                                    }
                                    placeholder="Filter task..."
                                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                  />
                                </th>
                                <th className="px-2 py-2">
                                  <select
                                    value={ics233Filters.assignee}
                                    onChange={(event) =>
                                      setIcs233Filters((previous) => ({
                                        ...previous,
                                        assignee: event.target.value,
                                      }))
                                    }
                                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                  >
                                    <option value="all">All</option>
                                    {ics233AssigneeOptions.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                </th>
                                <th className="px-2 py-2">
                                  <select
                                    value={ics233Filters.pointOfContact}
                                    onChange={(event) =>
                                      setIcs233Filters((previous) => ({
                                        ...previous,
                                        pointOfContact: event.target.value,
                                      }))
                                    }
                                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                  >
                                    <option value="all">All</option>
                                    {ics233PointOfContactOptions.map((option) => (
                                      <option key={option} value={option}>
                                        {option}
                                      </option>
                                    ))}
                                  </select>
                                </th>
                                <th className="px-2 py-2">
                                  <select
                                    value={ics233Filters.pocBriefed}
                                    onChange={(event) =>
                                      setIcs233Filters((previous) => ({
                                        ...previous,
                                        pocBriefed: event.target.value,
                                      }))
                                    }
                                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                  >
                                    <option value="all">All</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                  </select>
                                </th>
                                <th className="px-2 py-2">
                                  <div className="space-y-1">
                                    <select
                                      value={ics233Filters.startMode}
                                      onChange={(event) =>
                                        setIcs233Filters((previous) => ({
                                          ...previous,
                                          startMode: event.target.value,
                                        }))
                                      }
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    >
                                      <option value="all">All</option>
                                      <option value="before">Before</option>
                                      <option value="after">After</option>
                                    </select>
                                    <input
                                      type="datetime-local"
                                      value={ics233Filters.start}
                                      onChange={(event) =>
                                        setIcs233Filters((previous) => ({
                                          ...previous,
                                          start: event.target.value,
                                        }))
                                      }
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    />
                                  </div>
                                </th>
                                <th className="px-2 py-2">
                                  <div className="space-y-1">
                                    <select
                                      value={ics233Filters.deadlineMode}
                                      onChange={(event) =>
                                        setIcs233Filters((previous) => ({
                                          ...previous,
                                          deadlineMode: event.target.value,
                                        }))
                                      }
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    >
                                      <option value="all">All</option>
                                      <option value="before">Before</option>
                                      <option value="after">After</option>
                                    </select>
                                    <input
                                      type="datetime-local"
                                      value={ics233Filters.deadline}
                                      onChange={(event) =>
                                        setIcs233Filters((previous) => ({
                                          ...previous,
                                          deadline: event.target.value,
                                        }))
                                      }
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    />
                                  </div>
                                </th>
                                <th className="px-2 py-2">
                                  <select
                                    value={ics233Filters.status}
                                    onChange={(event) =>
                                      setIcs233Filters((previous) => ({
                                        ...previous,
                                        status: event.target.value,
                                      }))
                                    }
                                    className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                  >
                                    <option value="all">All</option>
                                    <option value="Not Started">Not Started</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Complete">Complete</option>
                                    <option value="Cannot Complete">Cannot Complete</option>
                                  </select>
                                </th>
                                <th className="px-2 py-2" />
                              </tr>
                            </thead>
                            <tbody>
                              {filteredIcs233Rows.length === 0 && (
                                <tr>
                                  <td colSpan={8} className="px-2 py-4 text-center text-xs text-muted-foreground">
                                    No rows match the current filters.
                                  </td>
                                </tr>
                              )}
                              {filteredIcs233Rows.map((row) => (
                                <tr
                                  key={row.id}
                                  className="cursor-pointer border-b align-top last:border-b-0 hover:bg-muted/35"
                                  onClick={() => {
                                    setSelectedIcs233RowId(row.id)
                                    setIsIcs233RowModalEditing(false)
                                  }}
                                >
                                  <td className="px-2 py-2">
                                    {activeIcs233CellEdit?.rowId === row.id &&
                                    activeIcs233CellEdit.field === 'task' ? (
                                      <div
                                        className="flex items-center justify-end gap-1"
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        <input
                                          value={ics233TaskDraftEdit?.rowId === row.id ? ics233TaskDraftEdit.value : row.task}
                                          onChange={(event) =>
                                            setIcs233TaskDraftEdit({ rowId: row.id, value: event.target.value })
                                          }
                                          onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                              updateIcs233Row(
                                                row.id,
                                                'task',
                                                ics233TaskDraftEdit?.rowId === row.id
                                                  ? ics233TaskDraftEdit.value
                                                  : row.task
                                              )
                                              setActiveIcs233CellEdit(null)
                                              setIcs233TaskDraftEdit(null)
                                            }
                                            if (event.key === 'Escape') {
                                              setActiveIcs233CellEdit(null)
                                              setIcs233TaskDraftEdit(null)
                                            }
                                          }}
                                          className="h-8 min-w-0 flex-1 rounded-md border bg-transparent px-2 text-xs outline-none"
                                          autoFocus
                                        />
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          aria-label="Save task edit"
                                          className="h-8 w-8"
                                          onClick={() => {
                                            updateIcs233Row(
                                              row.id,
                                              'task',
                                              ics233TaskDraftEdit?.rowId === row.id
                                                ? ics233TaskDraftEdit.value
                                                : row.task
                                            )
                                            setActiveIcs233CellEdit(null)
                                            setIcs233TaskDraftEdit(null)
                                          }}
                                        >
                                          <Check className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          type="button"
                                          size="icon"
                                          variant="ghost"
                                          aria-label="Cancel task edit"
                                          className="h-8 w-8"
                                          onClick={() => {
                                            setActiveIcs233CellEdit(null)
                                            setIcs233TaskDraftEdit(null)
                                          }}
                                        >
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        className="w-full pt-1 text-left text-xs"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setActiveIcs233CellEdit({ rowId: row.id, field: 'task' })
                                          setIcs233TaskDraftEdit({ rowId: row.id, value: row.task })
                                        }}
                                      >
                                        {row.task}
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    {activeIcs233CellEdit?.rowId === row.id &&
                                    activeIcs233CellEdit.field === 'assignee' ? (
                                      <select
                                        value={row.assignee}
                                        onChange={(event) => {
                                          updateIcs233Row(row.id, 'assignee', event.target.value)
                                          setActiveIcs233CellEdit(null)
                                        }}
                                        onBlur={() => setActiveIcs233CellEdit(null)}
                                        onClick={(event) => event.stopPropagation()}
                                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                        autoFocus
                                      >
                                        {ics233AssigneeOptions.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <button
                                        type="button"
                                        className="w-full pt-1 text-left text-xs"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setActiveIcs233CellEdit({ rowId: row.id, field: 'assignee' })
                                        }}
                                      >
                                        {row.assignee}
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    {activeIcs233CellEdit?.rowId === row.id &&
                                    activeIcs233CellEdit.field === 'pointOfContact' ? (
                                      <select
                                        value={row.pointOfContact}
                                        onChange={(event) => {
                                          updateIcs233Row(row.id, 'pointOfContact', event.target.value)
                                          setActiveIcs233CellEdit(null)
                                        }}
                                        onBlur={() => setActiveIcs233CellEdit(null)}
                                        onClick={(event) => event.stopPropagation()}
                                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                        autoFocus
                                      >
                                        {ics233PointOfContactOptions.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <button
                                        type="button"
                                        className="w-full pt-1 text-left text-xs"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setActiveIcs233CellEdit({ rowId: row.id, field: 'pointOfContact' })
                                        }}
                                      >
                                        {row.pointOfContact}
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    {activeIcs233CellEdit?.rowId === row.id &&
                                    activeIcs233CellEdit.field === 'pocBriefed' ? (
                                      <select
                                        value={row.pocBriefed}
                                        onChange={(event) => {
                                          updateIcs233Row(row.id, 'pocBriefed', event.target.value as 'Yes' | 'No')
                                          setActiveIcs233CellEdit(null)
                                        }}
                                        onBlur={() => setActiveIcs233CellEdit(null)}
                                        onClick={(event) => event.stopPropagation()}
                                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                        autoFocus
                                      >
                                        <option value="Yes">Yes</option>
                                        <option value="No">No</option>
                                      </select>
                                    ) : (
                                      <button
                                        type="button"
                                        className="w-full pt-1 text-left text-xs"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setActiveIcs233CellEdit({ rowId: row.id, field: 'pocBriefed' })
                                        }}
                                      >
                                        {row.pocBriefed}
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    {activeIcs233CellEdit?.rowId === row.id &&
                                    activeIcs233CellEdit.field === 'start' ? (
                                      <input
                                        type="datetime-local"
                                        value={row.start}
                                        onChange={(event) => updateIcs233Row(row.id, 'start', event.target.value)}
                                        onBlur={() => setActiveIcs233CellEdit(null)}
                                        onClick={(event) => event.stopPropagation()}
                                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                        autoFocus
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        className="w-full pt-1 text-left text-xs"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setActiveIcs233CellEdit({ rowId: row.id, field: 'start' })
                                        }}
                                      >
                                        {row.start.replace('T', ' ')}
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    {activeIcs233CellEdit?.rowId === row.id &&
                                    activeIcs233CellEdit.field === 'deadline' ? (
                                      <input
                                        type="datetime-local"
                                        value={row.deadline}
                                        onChange={(event) => updateIcs233Row(row.id, 'deadline', event.target.value)}
                                        onBlur={() => setActiveIcs233CellEdit(null)}
                                        onClick={(event) => event.stopPropagation()}
                                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                        autoFocus
                                      />
                                    ) : (
                                      <button
                                        type="button"
                                        className="w-full pt-1 text-left text-xs"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setActiveIcs233CellEdit({ rowId: row.id, field: 'deadline' })
                                        }}
                                      >
                                        {row.deadline.replace('T', ' ')}
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    {activeIcs233CellEdit?.rowId === row.id &&
                                    activeIcs233CellEdit.field === 'status' ? (
                                      <select
                                        value={row.status}
                                        onChange={(event) => {
                                          updateIcs233Row(
                                            row.id,
                                            'status',
                                            event.target.value as Ics233TaskRow['status']
                                          )
                                          setActiveIcs233CellEdit(null)
                                        }}
                                        onBlur={() => setActiveIcs233CellEdit(null)}
                                        onClick={(event) => event.stopPropagation()}
                                        className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                        autoFocus
                                      >
                                        <option value="Not Started">Not Started</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Complete">Complete</option>
                                        <option value="Cannot Complete">Cannot Complete</option>
                                      </select>
                                    ) : (
                                      <button
                                        type="button"
                                        className="w-full pt-1 text-left text-xs"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          setActiveIcs233CellEdit({ rowId: row.id, field: 'status' })
                                        }}
                                      >
                                        {row.status}
                                      </button>
                                    )}
                                  </td>
                                  <td className="px-2 py-2">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        aria-label="Delete ICS-233 row"
                                        className="h-8 w-8 text-destructive hover:text-destructive"
                                        onClick={(event) => {
                                          event.stopPropagation()
                                          deleteIcs233Row(row.id)
                                        }}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 border-t px-3 py-2.5">
                        {filteredIcs233Rows.map((row) => {
                          const isOpen = expandedIcs233RowId === row.id
                          return (
                            <Item
                              key={row.id}
                              variant="outline"
                              className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}
                            >
                              <Collapsible
                                open={isOpen}
                                onOpenChange={(open) => setExpandedIcs233RowId(open ? row.id : null)}
                              >
                                <div
                                  className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
                                  onClick={() => setExpandedIcs233RowId(isOpen ? null : row.id)}
                                >
                                  <ItemContent>
                                    <ItemTitle>{row.task || `Task #${row.id}`}</ItemTitle>
                                    <ItemDescription>
                                      {row.assignee} • {row.status}
                                    </ItemDescription>
                                  </ItemContent>
                                  <ItemActions className="gap-1">
                                    <Button
                                      type="button"
                                      size="icon"
                                      variant="ghost"
                                      aria-label="Delete ICS-233 row"
                                      className="h-8 w-8 text-destructive hover:text-destructive"
                                      onClick={(event) => {
                                        event.stopPropagation()
                                        deleteIcs233Row(row.id)
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <CollapsibleTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        aria-label="Toggle ICS-233 row details"
                                        onClick={(event) => event.stopPropagation()}
                                      >
                                        <ChevronDown
                                          className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')}
                                        />
                                      </Button>
                                    </CollapsibleTrigger>
                                  </ItemActions>
                                </div>
                                <CollapsibleContent>
                                  <div className="grid grid-cols-1 gap-2 border-t px-3 py-2.5 md:grid-cols-2">
                                    <input
                                      value={row.task}
                                      onChange={(event) => updateIcs233Row(row.id, 'task', event.target.value)}
                                      placeholder="Task"
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    />
                                    <select
                                      value={row.assignee}
                                      onChange={(event) => updateIcs233Row(row.id, 'assignee', event.target.value)}
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    >
                                      {ics233AssigneeOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={row.pointOfContact}
                                      onChange={(event) =>
                                        updateIcs233Row(row.id, 'pointOfContact', event.target.value)
                                      }
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    >
                                      {ics233PointOfContactOptions.map((option) => (
                                        <option key={option} value={option}>
                                          {option}
                                        </option>
                                      ))}
                                    </select>
                                    <select
                                      value={row.pocBriefed}
                                      onChange={(event) =>
                                        updateIcs233Row(row.id, 'pocBriefed', event.target.value as 'Yes' | 'No')
                                      }
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    >
                                      <option value="Yes">Yes</option>
                                      <option value="No">No</option>
                                    </select>
                                    <input
                                      type="datetime-local"
                                      value={row.start}
                                      onChange={(event) => updateIcs233Row(row.id, 'start', event.target.value)}
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    />
                                    <input
                                      type="datetime-local"
                                      value={row.deadline}
                                      onChange={(event) => updateIcs233Row(row.id, 'deadline', event.target.value)}
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    />
                                    <select
                                      value={row.status}
                                      onChange={(event) =>
                                        updateIcs233Row(
                                          row.id,
                                          'status',
                                          event.target.value as Ics233TaskRow['status']
                                        )
                                      }
                                      className="h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                                    >
                                      <option value="Not Started">Not Started</option>
                                      <option value="In Progress">In Progress</option>
                                      <option value="Complete">Complete</option>
                                      <option value="Cannot Complete">Cannot Complete</option>
                                    </select>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </Item>
                          )
                        })}
                        {filteredIcs233Rows.length === 0 && (
                          <Item variant="outline" className={glassItemBorderClasses}>
                            <ItemContent>
                              <ItemTitle>No matching tasks</ItemTitle>
                              <ItemDescription>Adjust the table filters to broaden results.</ItemDescription>
                            </ItemContent>
                          </Item>
                        )}
                      </div>
                    )}
                  </Item>
                )}

                {activeTab.startsWith('form-') &&
                  activeFormTabLabel &&
                  activeTab !== 'form-ICS-204' &&
                  activeTab !== 'form-ICS-233' && (
                  <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
                    <div className="px-3 py-2.5">
                      <ItemContent>
                        <ItemTitle>{activeFormTabLabel}</ItemTitle>
                        <ItemDescription>
                          Placeholder content for {activeFormTabLabel}. Configure this tab workflow next.
                        </ItemDescription>
                      </ItemContent>
                    </div>
                  </Item>
                )}
              </CardContent>
            </Card>
          </CollapsibleContent>
        </div>
      </Collapsible>
      </div>
      {isPratusAiDrawerOpen && (
        <aside className="absolute top-14 right-0 z-20 h-[calc(100%-3.5rem)] w-[33.333vw] min-w-[33.333vw] shrink-0 border-l">
          <div
            className={cn(
              'flex h-full flex-col shadow-lg backdrop-blur',
              glassPanelClasses
            )}
          >
            <div
              className={cn(
                'relative flex h-full flex-col rounded-none border-0 shadow-none',
                isGlassMode && '!bg-transparent'
              )}
            >
            <div className="flex items-center justify-end border-b px-4 py-3">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close PRATUS AI drawer"
                className={glassIconButtonClasses}
                onClick={() => setIsPratusAiDrawerOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col justify-end gap-3 p-4">
            {pratusAiMessages.length > 0 && (
              <div
                className={cn(
                  'relative min-h-0 flex-1 space-y-2 overflow-y-auto rounded-md border p-3',
                  glassItemBorderClasses,
                  isGlassMode && 'glass-organic bg-transparent'
                )}
              >
                {pratusAiMessages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      'rounded-md px-3 py-2 text-sm',
                      message.role === 'assistant'
                        ? 'bg-muted text-foreground'
                        : 'ml-6 bg-primary/10 text-foreground'
                    )}
                  >
                    <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {message.role === 'assistant' ? 'PRATUS AI' : 'You'}
                    </p>
                    <p className="whitespace-pre-line">{message.content}</p>
                    {message.role === 'assistant' && message.recommendations && (
                      <div className="mt-2 space-y-1.5">
                        {message.recommendations.map((recommendation, index) => (
                          <div key={`${message.id}-recommendation-${index}`} className="text-xs">
                            <span className="text-muted-foreground">Recommended unit:</span>{' '}
                            <button
                              type="button"
                              className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
                              onClick={() => setSelectedPratusResourceId(recommendation.resourceId)}
                            >
                              {recommendation.unitLabel}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {message.role === 'assistant' && message.plan && (
                      <div className="mt-2 space-y-2 rounded-md border border-border/60 p-2">
                        <p className="text-xs font-semibold">Execution plan</p>
                        <ol className="list-inside list-decimal space-y-1 text-xs text-muted-foreground">
                          {message.plan.steps.map((step, index) => (
                            <li key={`${message.id}-step-${index}`}>{step}</li>
                          ))}
                        </ol>
                        {message.plan.status === 'pending' ? (
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              disabled={isPratusAiLoading}
                              onClick={() => handlePratusPlanDecision(message.id, 'accepted')}
                            >
                              Accept
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={isPratusAiLoading}
                              onClick={() => handlePratusPlanDecision(message.id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <p className="text-xs font-medium text-muted-foreground">
                            {message.plan.status === 'accepted'
                              ? 'Plan accepted. Draft ICS-204 recommendations prepared for review.'
                              : 'Plan cancelled.'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {isPratusAiLoading && (
                  <div
                    className={cn(
                      'pointer-events-none absolute left-3 right-3 bottom-3 z-20 rounded-md border p-3',
                      isGlassMode ? 'glass-organic bg-transparent' : 'bg-muted/70'
                    )}
                  >
                    <div className="space-y-2 animate-pulse">
                      <div className="h-2.5 w-11/12 rounded bg-muted-foreground/35" />
                      <div className="h-2.5 w-9/12 rounded bg-muted-foreground/30" />
                      <div className="h-2.5 w-7/12 rounded bg-muted-foreground/25" />
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Textarea
                value={pratusAiDraftMessage}
                onChange={(event) => setPratusAiDraftMessage(event.target.value)}
                placeholder="Ask PRATUS AI..."
                className={cn(
                  'min-h-24',
                  isGlassMode &&
                    'glass-organic border-white/25 bg-transparent text-foreground placeholder:text-foreground/70'
                )}
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Select attachments and file source"
                        disabled={isPratusAiLoading}
                        className={glassIconButtonClasses}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-72">
                      <DropdownMenuLabel>Attachments</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <div className="space-y-2 px-3 py-2">
                        <label className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={pratusAiDataSources.files}
                            onCheckedChange={(checked) => togglePratusAiSource('files', checked === true)}
                          />
                          <span>File(s)</span>
                        </label>
                        {pratusAiDataSources.files && (
                          <div className="space-y-1 pl-6">
                            <input
                              type="file"
                              multiple
                              onChange={handlePratusAiFileSelection}
                              className="block w-full text-xs"
                            />
                            {pratusAiSelectedFiles.length > 0 && (
                              <p className="text-xs text-muted-foreground">
                                {pratusAiSelectedFiles.join(', ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Web</span>
                    <Switch
                      size="sm"
                      checked={pratusAiDataSources.web}
                      disabled={isPratusAiLoading}
                      onCheckedChange={(checked) => togglePratusAiSource('web', checked === true)}
                    />
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span>Organization Data</span>
                    <Switch
                      size="sm"
                      checked={pratusAiDataSources.incidentData}
                      disabled={isPratusAiLoading}
                      onCheckedChange={(checked) =>
                        togglePratusAiSource('incidentData', checked === true)
                      }
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant={isPratusAiSelectingContext ? 'default' : 'outline'}
                    disabled={isPratusAiLoading}
                    className={glassIconButtonClasses}
                    onClick={() => setIsPratusAiSelectingContext((previous) => !previous)}
                  >
                    Select
                  </Button>
                  <Button
                    type="button"
                    onClick={submitPratusAiMessage}
                    disabled={isPratusAiLoading}
                    className={glassIconButtonClasses}
                  >
                    Send
                  </Button>
                </div>
              </div>
              {pratusAiSelectedContexts.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {pratusAiSelectedContexts.map((context) => (
                    <span
                      key={context.id}
                      className="inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs"
                    >
                      <span>{context.label}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${context.label} from selected context`}
                        className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        onClick={() =>
                          setPratusAiSelectedContexts((previous) =>
                            previous.filter((entry) => entry.id !== context.id)
                          )
                        }
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {isPratusAiSelectingContext && (
                <p className="text-xs text-primary">
                  Selection mode is on. Click a panel component to attach context. Press Esc to
                  cancel.
                </p>
              )}
            </div>
            </div>
            </div>
          </div>
        </aside>
      )}
      </div>
      </div>
      <Dialog
        open={selectedIcs233Row !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedIcs233RowId(null)
            setIsIcs233RowModalEditing(false)
          }
        }}
      >
        <DialogContent className="!w-[68vw] !max-w-[68vw] sm:!max-w-[68vw]">
          {selectedIcs233Row && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">ICS-233 Task Detail</p>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setIsIcs233RowModalEditing((previous) => !previous)}
                  >
                    {isIcs233RowModalEditing ? 'Done' : 'Edit'}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => deleteIcs233Row(selectedIcs233Row.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="col-span-2 space-y-1">
                  <p className="font-semibold">Task</p>
                  {isIcs233RowModalEditing ? (
                    <input
                      value={selectedIcs233Row.task}
                      onChange={(event) => updateIcs233Row(selectedIcs233Row.id, 'task', event.target.value)}
                      className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <p className="rounded-md border px-2 py-2">{selectedIcs233Row.task}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">Assignee</p>
                  {isIcs233RowModalEditing ? (
                    <select
                      value={selectedIcs233Row.assignee}
                      onChange={(event) =>
                        updateIcs233Row(selectedIcs233Row.id, 'assignee', event.target.value)
                      }
                      className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    >
                      {ics233AssigneeOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="rounded-md border px-2 py-2">{selectedIcs233Row.assignee}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">Point of Contact</p>
                  {isIcs233RowModalEditing ? (
                    <select
                      value={selectedIcs233Row.pointOfContact}
                      onChange={(event) =>
                        updateIcs233Row(selectedIcs233Row.id, 'pointOfContact', event.target.value)
                      }
                      className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    >
                      {ics233PointOfContactOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="rounded-md border px-2 py-2">{selectedIcs233Row.pointOfContact}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">POC Briefed</p>
                  {isIcs233RowModalEditing ? (
                    <select
                      value={selectedIcs233Row.pocBriefed}
                      onChange={(event) =>
                        updateIcs233Row(selectedIcs233Row.id, 'pocBriefed', event.target.value as 'Yes' | 'No')
                      }
                      className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  ) : (
                    <p className="rounded-md border px-2 py-2">{selectedIcs233Row.pocBriefed}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">Start</p>
                  {isIcs233RowModalEditing ? (
                    <input
                      type="datetime-local"
                      value={selectedIcs233Row.start}
                      onChange={(event) => updateIcs233Row(selectedIcs233Row.id, 'start', event.target.value)}
                      className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <p className="rounded-md border px-2 py-2">{selectedIcs233Row.start.replace('T', ' ')}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">Deadline</p>
                  {isIcs233RowModalEditing ? (
                    <input
                      type="datetime-local"
                      value={selectedIcs233Row.deadline}
                      onChange={(event) =>
                        updateIcs233Row(selectedIcs233Row.id, 'deadline', event.target.value)
                      }
                      className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    />
                  ) : (
                    <p className="rounded-md border px-2 py-2">
                      {selectedIcs233Row.deadline.replace('T', ' ')}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-semibold">Status</p>
                  {isIcs233RowModalEditing ? (
                    <select
                      value={selectedIcs233Row.status}
                      onChange={(event) =>
                        updateIcs233Row(
                          selectedIcs233Row.id,
                          'status',
                          event.target.value as Ics233TaskRow['status']
                        )
                      }
                      className="h-9 w-full rounded-md border bg-transparent px-2 text-xs outline-none"
                    >
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Complete">Complete</option>
                      <option value="Cannot Complete">Cannot Complete</option>
                    </select>
                  ) : (
                    <p className="rounded-md border px-2 py-2">{selectedIcs233Row.status}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={ics204ResourcePickerFormId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIcs204ResourcePickerFormId(null)
            setIcs204ResourceNameFilter('')
            setIcs204ResourceCurrentLocationFilter('')
            setIcs204ResourceCurrentOpFilter('all')
            setIcs204ResourceNextOpFilter('all')
          }
        }}
      >
        <DialogContent className="!w-[62vw] !max-w-[62vw] sm:!max-w-[62vw]">
          <div className="space-y-3">
            <p className="text-sm font-semibold">Attach Incident Resource</p>
            <p className="text-xs text-muted-foreground">
              Select any resource assigned to this incident to attach it to this ICS-204.
            </p>
            <div className="space-y-2 rounded-md border py-2">
              <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_5.5rem] items-center gap-2 px-3 text-[11px] font-semibold text-muted-foreground">
                <span>Resource</span>
                <span>Current Location</span>
                <span>Current OP</span>
                <span>Next OP</span>
                <span />
              </div>
              <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_5.5rem] gap-2 px-3">
                <input
                  value={ics204ResourceNameFilter}
                  onChange={(event) => setIcs204ResourceNameFilter(event.target.value)}
                  placeholder="Filter resource..."
                  className="h-8 w-full min-w-0 rounded-md border bg-transparent px-2 text-xs outline-none"
                />
                <input
                  value={ics204ResourceCurrentLocationFilter}
                  onChange={(event) => setIcs204ResourceCurrentLocationFilter(event.target.value)}
                  placeholder="Filter location..."
                  className="h-8 w-full min-w-0 rounded-md border bg-transparent px-2 text-xs outline-none"
                />
                <select
                  value={ics204ResourceCurrentOpFilter}
                  onChange={(event) => setIcs204ResourceCurrentOpFilter(event.target.value)}
                  className="h-8 w-full min-w-0 rounded-md border bg-transparent px-2 text-xs outline-none"
                >
                  <option value="all">All</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="available">Available</option>
                </select>
                <select
                  value={ics204ResourceNextOpFilter}
                  onChange={(event) => setIcs204ResourceNextOpFilter(event.target.value)}
                  className="h-8 w-full min-w-0 rounded-md border bg-transparent px-2 text-xs outline-none"
                >
                  <option value="all">All</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="available">Available</option>
                </select>
                <div aria-hidden="true" />
              </div>
            </div>
            <div className="space-y-2">
              {filteredIcs204AttachableResources.length === 0 && (
                <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
                  <div className="px-3 py-2.5">
                    <ItemContent>
                      <ItemTitle>No matching resources</ItemTitle>
                      <ItemDescription>Try a broader search term.</ItemDescription>
                    </ItemContent>
                  </div>
                </Item>
              )}
              {filteredIcs204AttachableResources.map((resource) => {
                const isScheduledCurrentOp =
                  resource.currentOpPeriodAssignment.trim().length > 0 &&
                  resource.currentOpPeriodAssignment !== '---'
                const isScheduledNextOp =
                  resource.nextOpPeriodAssignment.trim().length > 0 &&
                  resource.nextOpPeriodAssignment !== '---'
                return (
                  <Item
                    key={`ics204-resource-option-${resource.id}`}
                    variant="outline"
                    className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}
                  >
                    <div className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_5.5rem] items-center gap-2 px-3 py-2">
                      <p className="truncate text-sm font-medium">{resource.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{resource.currentLocation}</p>
                      <Badge variant={isScheduledCurrentOp ? 'default' : 'outline'}>
                        {isScheduledCurrentOp ? 'Scheduled' : 'Available'}
                      </Badge>
                      <Badge variant={isScheduledNextOp ? 'default' : 'outline'}>
                        {isScheduledNextOp ? 'Scheduled' : 'Available'}
                      </Badge>
                      <ItemActions className="justify-end">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (ics204ResourcePickerFormId !== null) {
                              addIcs204ResourceAssigned(ics204ResourcePickerFormId, resource)
                            }
                          }}
                        >
                          Attach
                        </Button>
                      </ItemActions>
                    </div>
                  </Item>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={selectedPratusResource !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPratusResourceId(null)
          }
        }}
      >
        <DialogContent className="!w-[80vw] !max-w-[80vw] sm:!max-w-[80vw] [&_[data-slot=dialog-close]]:!top-1 [&_[data-slot=dialog-close]]:!right-1">
          {selectedPratusResource && (
            <Item variant="outline" className={cn('flex-col items-stretch p-0', glassItemBorderClasses)}>
              <div className="flex items-center gap-2 px-3 py-2.5">
                <ItemContent>
                  <ItemTitle>{selectedPratusResource.name}</ItemTitle>
                  <ItemDescription>{selectedPratusResource.notes}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge variant="secondary">{selectedPratusResource.status}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Zoom map to selected recommended resource"
                    onClick={() =>
                      void focusMapItem(
                        `resource-${selectedPratusResource.id}`,
                        selectedPratusResource.mapLocation,
                        30000
                      )
                    }
                  >
                    <MapIcon className="h-4 w-4" />
                  </Button>
                </ItemActions>
              </div>
              <div className="border-t px-3 py-2 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <p>
                    <span className="font-medium">Current Location:</span>{' '}
                    {selectedPratusResource.currentLocation}
                  </p>
                  <p>
                    <span className="font-medium">Datetime Ordered:</span>{' '}
                    {selectedPratusResource.datetimeOrdered}
                  </p>
                  <p>
                    <span className="font-medium">OPCON:</span> {selectedPratusResource.opcon}
                  </p>
                  <p>
                    <span className="font-medium">TACON:</span> {selectedPratusResource.tacon}
                  </p>
                  <p>
                    <span className="font-medium">Point of Contact:</span>{' '}
                    {selectedPratusResource.pointOfContact}
                  </p>
                  <p>
                    <span className="font-medium">Owning Organization:</span>{' '}
                    {selectedPratusResource.owningOrganization}
                  </p>
                  <p>
                    <span className="font-medium">Quantity:</span> {selectedPratusResource.quantity}
                  </p>
                  <p>
                    <span className="font-medium">Unit:</span> {selectedPratusResource.unit}
                  </p>
                  <p>
                    <span className="font-medium">Hull/Tail Number:</span>{' '}
                    {selectedPratusResource.hullTailNumber}
                  </p>
                  <p>
                    <span className="font-medium">Symbology:</span> {selectedPratusResource.symbology}
                  </p>
                  <p>
                    <span className="font-medium">Lat:</span> {selectedPratusResource.latitude}
                  </p>
                  <p>
                    <span className="font-medium">Long:</span> {selectedPratusResource.longitude}
                  </p>
                  <p className="col-span-2">
                    <span className="font-medium">Capabilities:</span>{' '}
                    {selectedPratusResource.capabilities}
                  </p>
                  <p>
                    <span className="font-medium">Current Op Period:</span>{' '}
                    {selectedPratusResource.currentOpPeriod}
                  </p>
                  <p>
                    <span className="font-medium">Next Op Period:</span> {selectedPratusResource.nextOpPeriod}
                  </p>
                  <p>
                    <span className="font-medium">Current Op Period Assignment:</span>{' '}
                    {selectedPratusResource.currentOpPeriodAssignment}
                  </p>
                  <p>
                    <span className="font-medium">Next Op Period Assignment:</span>{' '}
                    {selectedPratusResource.nextOpPeriodAssignment}
                  </p>
                  <p>
                    <span className="font-medium">Check-in Status:</span> {selectedPratusResource.checkInStatus}
                  </p>
                </div>
              </div>
            </Item>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={isPlanningPDialogOpen} onOpenChange={setIsPlanningPDialogOpen}>
        <DialogContent className="!w-[75vw] !max-w-[75vw] sm:!max-w-[75vw]">
          <div className="p-1">
            <div className="mx-auto h-[36rem] w-full p-1">
              <div className="relative h-[34.2rem]">
                <div className="absolute inset-x-0 top-0 h-[16.5rem] rounded-[2rem] border-2 border-foreground/30 bg-card/60 p-3">
                  <div className="absolute left-[38%] top-[29%] flex h-[42%] w-[24%] flex-col items-center justify-center rounded-3xl border-2 bg-background/95 p-3 text-center">
                    <img src={pratusLogo} alt="Pratus logo" className="mt-2 h-6 w-auto object-contain" />
                  </div>

                  <div className="absolute bottom-3 left-3 w-[28%] rounded-md border border-rose-400/70 bg-rose-200/70 p-2 text-[10px] font-medium leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="inline-flex h-[1.1em] w-[1.1em] shrink-0 items-center justify-center rounded-full border border-emerald-600 bg-emerald-100 text-[7.5px] font-bold leading-none text-emerald-700">
                        ✓
                      </span>
                      <span>IC / UC Objectives Meeting</span>
                    </div>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">11:30 - 12:00</p>
                  </div>
                  <div className="absolute left-3 top-1/2 w-[28%] -translate-y-1/2 rounded-md border border-yellow-300/80 bg-yellow-200/80 p-2 text-[10px] font-medium leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="inline-flex h-[1.1em] w-[1.1em] shrink-0 items-center justify-center rounded-full border border-emerald-600 bg-emerald-100 text-[7.5px] font-bold leading-none text-emerald-700">
                        ✓
                      </span>
                      <span>Command &amp; General Staff (Strategy) Meeting</span>
                    </div>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">12:15 - 12:45</p>
                  </div>
                  <div className="absolute left-3 top-3 w-[28%] rounded-md border border-indigo-300/80 bg-indigo-200/80 p-2 text-[10px] font-medium leading-tight">
                    <div className="flex items-center gap-1">
                      <span className="inline-flex h-[1.1em] w-[1.1em] shrink-0 items-center justify-center rounded-full border border-emerald-600 bg-emerald-100 text-[7.5px] font-bold leading-none text-emerald-700">
                        ✓
                      </span>
                      <span>Preparing for Tactics Meeting</span>
                    </div>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">12:45 - 13:00</p>
                  </div>
                  <div className="absolute left-[34%] top-3 w-[32%] rounded-md border-2 border-black bg-rose-200/70 p-2 text-[10px] font-semibold leading-tight text-foreground shadow-[0_0_0_2px_rgba(0,0,0,0.15)]">
                    <span>Tactics Meeting (Current)</span>
                    <p className="mt-0.5 text-[9px] text-sky-700/80">13:00 - 14:00</p>
                  </div>
                  <div className="absolute top-3 right-3 bottom-3 flex w-[28%] flex-col justify-between">
                    <div className="rounded-md border border-indigo-300/80 bg-indigo-200/80 p-2 text-[10px] font-medium leading-tight">
                      <span>Preparing for the Planning Meeting</span>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">14:00 - 14:30</p>
                    </div>
                    <div className="rounded-md border border-rose-400/70 bg-rose-200/70 p-2 text-[10px] font-medium leading-tight">
                      <span>Planning Meeting</span>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">14:30 - 15:15</p>
                    </div>
                    <div className="rounded-md border border-indigo-300/80 bg-indigo-200/80 p-2 text-[10px] font-medium leading-tight">
                      <span>IAP Prep &amp; Approval</span>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">15:15 - 16:00</p>
                    </div>
                    <div className="rounded-md border border-yellow-300/80 bg-yellow-200/80 p-2 text-[10px] font-medium leading-tight">
                      <span>Operations Briefing</span>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">16:00 - 16:30</p>
                    </div>
                  </div>
                  <div className="absolute bottom-3 left-[34%] w-[32%] rounded-md border border-green-300/80 bg-green-200/80 p-2 text-[10px] font-medium leading-tight">
                    <span>Execute Plan &amp; Assess Progress</span>
                    <p className="mt-0.5 text-[9px] text-muted-foreground">16:30 - 22:00</p>
                  </div>
                </div>

                <div className="absolute left-[15.5%] top-[16.5rem] h-4 w-px bg-foreground/35" />
                <div className="absolute left-0 top-[17.4rem] h-[15.1rem] w-[31.25%] rounded-xl border-2 border-foreground/30 bg-card/60 p-2">
                  <div className="grid h-full grid-rows-5 gap-1 text-[10px] font-medium leading-tight">
                    <div className="rounded-md border p-2">
                      <div className="flex items-center gap-1">
                        <span className="inline-flex h-[1.1em] w-[1.1em] shrink-0 items-center justify-center rounded-full border border-emerald-600 bg-emerald-100 text-[7.5px] font-bold leading-none text-emerald-700">
                          ✓
                        </span>
                        <span>Initial UC Meeting</span>
                      </div>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">09:00 - 09:20</p>
                    </div>
                    <div className="rounded-md border p-2">
                      <div className="flex items-center gap-1">
                        <span className="inline-flex h-[1.1em] w-[1.1em] shrink-0 items-center justify-center rounded-full border border-emerald-600 bg-emerald-100 text-[7.5px] font-bold leading-none text-emerald-700">
                          ✓
                        </span>
                        <span>Incident Briefing</span>
                      </div>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">09:20 - 09:45</p>
                    </div>
                    <div className="rounded-md border p-2">
                      <div className="flex items-center gap-1">
                        <span className="inline-flex h-[1.1em] w-[1.1em] shrink-0 items-center justify-center rounded-full border border-emerald-600 bg-emerald-100 text-[7.5px] font-bold leading-none text-emerald-700">
                          ✓
                        </span>
                        <span>Initial Response &amp; Assessment</span>
                      </div>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">09:45 - 10:30</p>
                    </div>
                    <div className="rounded-md border p-2">
                      <div className="flex items-center gap-1">
                        <span className="inline-flex h-[1.1em] w-[1.1em] shrink-0 items-center justify-center rounded-full border border-emerald-600 bg-emerald-100 text-[7.5px] font-bold leading-none text-emerald-700">
                          ✓
                        </span>
                        <span>Notifications</span>
                      </div>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">10:30 - 10:45</p>
                    </div>
                    <div className="rounded-md border p-2">
                      <div className="flex items-center gap-1">
                        <span className="inline-flex h-[1.1em] w-[1.1em] shrink-0 items-center justify-center rounded-full border border-emerald-600 bg-emerald-100 text-[7.5px] font-bold leading-none text-emerald-700">
                          ✓
                        </span>
                        <span>Incident / Event</span>
                      </div>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">10:45 - 11:30</p>
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 bottom-[1.7rem] w-[22%] rounded-xl border bg-card/80 p-2">
                  <div className="space-y-2 text-[10px] font-semibold">
                    <div className="rounded-lg border-2 border-indigo-300/90 bg-indigo-200/90 px-2 py-1 text-center">
                      Work Period
                    </div>
                    <div className="rounded-lg border-2 border-rose-400/90 bg-rose-200/90 px-2 py-1 text-center">
                      Working Meeting
                    </div>
                    <div className="rounded-lg border-2 border-yellow-300/90 bg-yellow-200/90 px-2 py-1 text-center">
                      Tasking Meeting
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={isIcs201VersionDialogOpen} onOpenChange={setIsIcs201VersionDialogOpen}>
        <DialogContent className="!w-[60vw] !max-w-[60vw] sm:!max-w-[60vw]">
          <div className="flex items-center gap-2 px-1 pb-2 text-sm font-semibold">
            <History className="h-4 w-4" />
            ICS-201 version history
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Revisions captured as the team collaborates
            </span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border">
            {ics201Versions.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No versions yet.
              </div>
            ) : (
              <ul className="divide-y">
                {[...ics201Versions]
                  .reverse()
                  .map((version, index) => {
                    const created = new Date(version.createdAt)
                    const preview =
                      version.snapshot.currentSituationSummary.slice(0, 80) +
                      (version.snapshot.currentSituationSummary.length > 80 ? '…' : '')
                    return (
                      <li
                        key={version.id}
                        className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted/40"
                      >
                        <div className="flex w-32 shrink-0 flex-col">
                          <span className="font-medium">
                            {index === 0 ? 'Current' : `v${ics201Versions.length - index}`}
                          </span>
                          <span className="text-muted-foreground">
                            {created.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <span
                          className="flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: version.authorColor }}
                        >
                          {version.authorName}
                        </span>
                        <span className="flex-1 truncate text-muted-foreground">
                          {preview || '(no summary changes)'}
                        </span>
                        {version.signatures.length > 0 ? (
                          <span
                            className="flex max-w-[18rem] items-center gap-1 truncate rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300"
                            title={version.signatures
                              .map(
                                (signature) =>
                                  `${signature.name} (${signature.role}) at ${new Date(
                                    signature.signedAt
                                  ).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}`
                              )
                              .join(', ')}
                          >
                            <Check className="h-3 w-3" />
                            <span className="truncate">
                              Signed by{' '}
                              {version.signatures
                                .map((signature) => `${signature.name} (${signature.role})`)
                                .join(', ')}
                            </span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 rounded-full border border-muted-foreground/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            Unsigned
                          </span>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          disabled={index === 0 && !viewingIcs201Version}
                          onClick={() => {
                            if (!viewingIcs201Version) {
                              liveIcs201FormRef.current = ics201Form
                            }
                            setIcs201Form(version.snapshot)
                            setViewingIcs201Version(version)
                            setIsIcs201VersionDialogOpen(false)
                          }}
                        >
                          View
                        </Button>
                      </li>
                    )
                  })}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isIcs201SignedVersionsDialogOpen}
        onOpenChange={setIsIcs201SignedVersionsDialogOpen}
      >
        <DialogContent className="!w-[60vw] !max-w-[60vw] sm:!max-w-[60vw]">
          <div className="flex items-center gap-2 px-1 pb-2 text-sm font-semibold">
            <Check className="h-4 w-4 text-emerald-600" />
            ICS-201 signed versions
            <span className="ml-auto text-xs font-normal text-muted-foreground">
              Versions with at least one signature
            </span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto rounded-md border">
            {(() => {
              const signedVersions = ics201Versions.filter(
                (version) => version.signatures.length > 0
              )
              if (signedVersions.length === 0) {
                return (
                  <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                    No signed versions yet.
                  </div>
                )
              }
              return (
                <ul className="divide-y">
                  {[...signedVersions].reverse().map((version) => {
                    const created = new Date(version.createdAt)
                    const indexInAll = ics201Versions.findIndex((entry) => entry.id === version.id)
                    const versionLabel =
                      indexInAll === ics201Versions.length - 1
                        ? 'Current'
                        : `v${indexInAll + 1}`
                    const preview =
                      version.snapshot.currentSituationSummary.slice(0, 80) +
                      (version.snapshot.currentSituationSummary.length > 80 ? '…' : '')
                    return (
                      <li
                        key={version.id}
                        className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted/40"
                      >
                        <div className="flex w-32 shrink-0 flex-col">
                          <span className="font-medium">{versionLabel}</span>
                          <span className="text-muted-foreground">
                            {created.toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                        <span
                          className="flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold text-white"
                          style={{ backgroundColor: version.authorColor }}
                        >
                          {version.authorName}
                        </span>
                        <span className="flex-1 truncate text-muted-foreground">
                          {preview || '(no summary changes)'}
                        </span>
                        <span
                          className="flex max-w-[20rem] items-center gap-1 truncate rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300"
                          title={version.signatures
                            .map(
                              (signature) =>
                                `${signature.name} (${signature.role}) at ${new Date(
                                  signature.signedAt
                                ).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}`
                            )
                            .join(', ')}
                        >
                          <Check className="h-3 w-3" />
                          <span className="truncate">
                            Signed by{' '}
                            {version.signatures
                              .map((signature) => `${signature.name} (${signature.role})`)
                              .join(', ')}
                          </span>
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => {
                            if (!viewingIcs201Version) {
                              liveIcs201FormRef.current = ics201Form
                            }
                            setIcs201Form(version.snapshot)
                            setViewingIcs201Version(version)
                            setIsIcs201SignedVersionsDialogOpen(false)
                          }}
                        >
                          View
                        </Button>
                      </li>
                    )
                  })}
                </ul>
              )
            })()}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={isIcs201SignNameDialogOpen}
        onOpenChange={(open) => {
          setIsIcs201SignNameDialogOpen(open)
          if (!open) {
            setIcs201SignNameInput('You')
          }
        }}
      >
        <DialogContent className="!w-[24rem] !max-w-[24rem] sm:!max-w-[24rem]">
          <div className="flex items-center gap-2 px-1 pb-1 text-sm font-semibold">
            <Check className="h-4 w-4 text-emerald-600" />
            Confirm your signature
          </div>
          <p className="px-1 text-xs text-muted-foreground">
            Type your name to sign this version. Your signature will be attached to a new entry in
            the ICS-201 version history.
          </p>
          <div className="space-y-1 px-1 pt-2">
            <label className="text-[11px] font-medium text-muted-foreground">Your name</label>
            <input
              autoFocus
              value={ics201SignNameInput}
              onChange={(event) => setIcs201SignNameInput(event.target.value)}
              placeholder="Full name"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-1 pt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setIsIcs201SignNameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={ics201SignNameInput.trim().length === 0}
              className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              onClick={() => {
                const name = ics201SignNameInput.trim()
                if (!name) {
                  return
                }
                const newVersion: Ics201Version = {
                  id: `${Date.now()}-signed-${Math.random().toString(36).slice(2, 8)}`,
                  createdAt: Date.now(),
                  authorName: name,
                  authorColor: '#16a34a',
                  snapshot: ics201Form,
                  signatures: [
                    {
                      name,
                      role: 'Planning Section Chief',
                      signedAt: Date.now(),
                    },
                  ],
                }
                setIcs201Versions((previous) => [...previous, newVersion].slice(-100))
                setIsIcs201SignNameDialogOpen(false)
                setIsCreatingSignedIcs201Version(false)
                setIcs201SignNameInput('You')
              }}
            >
              <Check className="h-3.5 w-3.5" />
              Sign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog
        open={ics204VersionDialog !== null}
        onOpenChange={(open) => {
          if (!open) setIcs204VersionDialog(null)
        }}
      >
        <DialogContent className="!w-[60vw] !max-w-[60vw] sm:!max-w-[60vw]">
          {(() => {
            if (!ics204VersionDialog) return null
            const allVersions = ics204VersionsById[ics204VersionDialog.formId] ?? []
            const shownVersions =
              ics204VersionDialog.kind === 'signed'
                ? allVersions.filter((version) => version.signatures.length > 0)
                : allVersions
            const isSignedOnly = ics204VersionDialog.kind === 'signed'
            const form = ics204Forms.find((entry) => entry.id === ics204VersionDialog.formId)
            const headerLabel = form?.assignedUnit || `ICS-204 #${ics204VersionDialog.formId}`
            return (
              <>
                <div className="flex items-center gap-2 px-1 pb-2 text-sm font-semibold">
                  {isSignedOnly ? (
                    <Check className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <History className="h-4 w-4" />
                  )}
                  {isSignedOnly ? 'Signed versions' : 'Version history'} — {headerLabel}
                  <span className="ml-auto text-xs font-normal text-muted-foreground">
                    {isSignedOnly
                      ? 'Versions with at least one signature'
                      : 'Revisions captured as the team collaborates'}
                  </span>
                </div>
                <div className="max-h-[60vh] overflow-y-auto rounded-md border">
                  {shownVersions.length === 0 ? (
                    <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                      {isSignedOnly ? 'No signed versions yet.' : 'No versions yet.'}
                    </div>
                  ) : (
                    <ul className="divide-y">
                      {[...shownVersions].reverse().map((version) => {
                        const created = new Date(version.createdAt)
                        const indexInAll = allVersions.findIndex(
                          (entry) => entry.id === version.id
                        )
                        const versionLabel =
                          indexInAll === allVersions.length - 1 && !isSignedOnly
                            ? 'Current'
                            : `v${indexInAll + 1}`
                        const preview =
                          (version.snapshot.specialInstructions ||
                            version.snapshot.assignedUnit ||
                            '').slice(0, 80) +
                          ((version.snapshot.specialInstructions ||
                            version.snapshot.assignedUnit ||
                            '').length > 80
                            ? '…'
                            : '')
                        const topIndex = allVersions.length - 1
                        const isTopRow = indexInAll === topIndex
                        return (
                          <li
                            key={version.id}
                            className="flex items-center gap-3 px-3 py-2 text-xs hover:bg-muted/40"
                          >
                            <div className="flex w-32 shrink-0 flex-col">
                              <span className="font-medium">{versionLabel}</span>
                              <span className="text-muted-foreground">
                                {created.toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                })}
                              </span>
                            </div>
                            <span
                              className="flex h-5 items-center gap-1 rounded-full px-2 text-[10px] font-semibold text-white"
                              style={{ backgroundColor: version.authorColor }}
                            >
                              {version.authorName}
                            </span>
                            <span className="flex-1 truncate text-muted-foreground">
                              {preview || '(no summary)'}
                            </span>
                            {version.signatures.length > 0 ? (
                              <span className="flex max-w-[18rem] items-center gap-1 truncate rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-800 dark:border-emerald-500/50 dark:bg-emerald-500/10 dark:text-emerald-300">
                                <Check className="h-3 w-3" />
                                <span className="truncate">
                                  Signed by{' '}
                                  {version.signatures
                                    .map((signature) => `${signature.name} (${signature.role})`)
                                    .join(', ')}
                                </span>
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 rounded-full border border-muted-foreground/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                                Unsigned
                              </span>
                            )}
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              disabled={
                                !isSignedOnly &&
                                isTopRow &&
                                !viewingIcs204VersionByFormId[ics204VersionDialog.formId]
                              }
                              onClick={() => {
                                if (!form) return
                                const formId = ics204VersionDialog.formId
                                if (!viewingIcs204VersionByFormId[formId]) {
                                  liveIcs204FormsRef.current[formId] = form
                                }
                                setIcs204Forms((previous) =>
                                  previous.map((entry) =>
                                    entry.id === formId ? version.snapshot : entry
                                  )
                                )
                                setViewingIcs204VersionByFormId((previous) => ({
                                  ...previous,
                                  [formId]: version,
                                }))
                                setIcs204VersionDialog(null)
                              }}
                            >
                              View
                            </Button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
      <Dialog
        open={ics204AssignConfirmDialog !== null}
        onOpenChange={(open) => {
          if (!open) setIcs204AssignConfirmDialog(null)
        }}
      >
        <DialogContent className="!w-[26rem] !max-w-[26rem] sm:!max-w-[26rem]">
          {(() => {
            if (!ics204AssignConfirmDialog) return null
            const form = ics204Forms.find(
              (entry) => entry.id === ics204AssignConfirmDialog.formId
            )
            const label = form?.assignedUnit || `ICS-204 #${ics204AssignConfirmDialog.formId}`
            return (
              <>
                <div className="flex items-center gap-2 px-1 pb-1 text-sm font-semibold">
                  <Check className="h-4 w-4 text-emerald-600" />
                  Assign ICS-204
                </div>
                <p className="px-1 text-xs text-muted-foreground">
                  Are you sure you want to assign{' '}
                  <span className="font-semibold text-foreground">{label}</span>? Once assigned,
                  personnel will be notified to execute the approved plan.
                </p>
                <div className="flex items-center justify-end gap-2 px-1 pt-3">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-8 text-xs"
                    onClick={() => setIcs204AssignConfirmDialog(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
                    onClick={() => {
                      const formId = ics204AssignConfirmDialog.formId
                      setIcs204AssignedByFormId((previous) => ({
                        ...previous,
                        [formId]: true,
                      }))
                      setIcs204AssignConfirmDialog(null)
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Confirm Assign
                  </Button>
                </div>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>
      <Dialog
        open={ics204SignDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setIcs204SignDialog(null)
            setIcs204SignNameInput('You')
          }
        }}
      >
        <DialogContent className="!w-[24rem] !max-w-[24rem] sm:!max-w-[24rem]">
          <div className="flex items-center gap-2 px-1 pb-1 text-sm font-semibold">
            <Check className="h-4 w-4 text-emerald-600" />
            Confirm your signature
          </div>
          <p className="px-1 text-xs text-muted-foreground">
            {ics204SignDialog?.mode === 'review'
              ? `Type your name to sign as ${ics204SignDialog.role}. Your signature will be added to the current version.`
              : 'Type your name to sign this version. Your signature will be attached to a new entry in the ICS-204 version history.'}
          </p>
          <div className="space-y-1 px-1 pt-2">
            <label className="text-[11px] font-medium text-muted-foreground">Your name</label>
            <input
              autoFocus
              value={ics204SignNameInput}
              onChange={(event) => setIcs204SignNameInput(event.target.value)}
              placeholder="Full name"
              className="h-9 w-full rounded-md border bg-transparent px-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
          </div>
          {ics204SignDialog?.mode === 'review' && (
            <div className="space-y-1 px-1 pt-2">
              <label className="text-[11px] font-medium text-muted-foreground">
                Position Title
              </label>
              <input
                value={ics204SignDialog.role}
                readOnly
                className="h-9 w-full rounded-md border bg-muted/30 px-2 text-sm outline-none"
              />
            </div>
          )}
          <div className="flex items-center justify-end gap-2 px-1 pt-3">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 text-xs"
              onClick={() => setIcs204SignDialog(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={ics204SignNameInput.trim().length === 0}
              className="h-8 gap-1 bg-emerald-600 text-xs text-white hover:bg-emerald-700"
              onClick={() => {
                const name = ics204SignNameInput.trim()
                if (!name || !ics204SignDialog) return
                const formId = ics204SignDialog.formId
                const form = ics204Forms.find((entry) => entry.id === formId)
                if (!form) return
                if (ics204SignDialog.mode === 'review') {
                  setIcs204VersionsById((previous) => {
                    const existing = previous[formId] ?? []
                    if (existing.length === 0) return previous
                    const latestIndex = existing.length - 1
                    const latest = existing[latestIndex]
                    if (
                      latest.signatures.some(
                        (signature, index) =>
                          index > 0 && signature.role === ics204SignDialog.role
                      )
                    ) {
                      return previous
                    }
                    const next = [...existing]
                    next[latestIndex] = {
                      ...latest,
                      signatures: [
                        ...latest.signatures,
                        {
                          name,
                          role: ics204SignDialog.role,
                          signedAt: Date.now(),
                        },
                      ],
                    }
                    return { ...previous, [formId]: next }
                  })
                } else {
                  const newVersion: Ics204Version = {
                    id: `${Date.now()}-204-${formId}-signed-${Math.random()
                      .toString(36)
                      .slice(2, 8)}`,
                    createdAt: Date.now(),
                    authorName: name,
                    authorColor: '#16a34a',
                    snapshot: form,
                    signatures: [
                      {
                        name,
                        role: ics204SignDialog.role,
                        signedAt: Date.now(),
                      },
                    ],
                  }
                  setIcs204VersionsById((previous) => ({
                    ...previous,
                    [formId]: [...(previous[formId] ?? []), newVersion].slice(-100),
                  }))
                  setIsCreatingSignedIcs204ByFormId((previous) => {
                    const next = { ...previous }
                    delete next[formId]
                    return next
                  })
                }
                setIcs204SignDialog(null)
                setIcs204SignNameInput('You')
              }}
            >
              <Check className="h-3.5 w-3.5" />
              Sign
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}

export default App
