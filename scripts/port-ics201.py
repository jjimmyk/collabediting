#!/usr/bin/env python3
"""Port ICS-201 implementation from 6626 App.tsx into main App.tsx."""

from pathlib import Path

SRC = Path("/Users/jimmyking/PRATUS OG MVP 52426 - Incident Workspace 6626/src/App.tsx")
DST = Path("/Users/jimmyking/PRATUS OG MVP 52426/src/App.tsx")


def read_lines(path: Path) -> list[str]:
    return path.read_text(encoding="utf-8").splitlines(keepends=True)


def slice_lines(lines: list[str], start: int, end: int) -> str:
    return "".join(lines[start - 1 : end])


def replace_once(text: str, old: str, new: str, label: str) -> str:
    if old not in text:
        raise RuntimeError(f"Patch failed ({label}): marker not found")
    return text.replace(old, new, 1)


def main() -> None:
    src_lines = read_lines(SRC)
    text = DST.read_text(encoding="utf-8")

    # --- imports ---
    text = replace_once(
        text,
        "import Point from '@arcgis/core/geometry/Point'\nimport FeatureLayer",
        "import Point from '@arcgis/core/geometry/Point'\nimport type Polygon from '@arcgis/core/geometry/Polygon'\nimport * as webMercatorUtils from '@arcgis/core/geometry/support/webMercatorUtils'\nimport FeatureLayer",
        "imports-polygon",
    )
    text = replace_once(
        text,
        "import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'\nimport Zoom",
        """import SketchViewModel from '@arcgis/core/widgets/Sketch/SketchViewModel'
import {
  PDFBool,
  PDFDocument,
  PDFName,
  type PDFFont,
  type PDFPage,
  rgb,
  StandardFonts,
} from 'pdf-lib'
import Zoom""",
        "imports-pdf-lib",
    )

    # --- types ---
    old_type = """type Ics201FormState = {
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
}"""
    new_type = slice_lines(src_lines, 558, 606)
    text = replace_once(text, old_type, new_type.rstrip("\n"), "ics201-type")

    # --- PDF helpers + docx blocks + export options ---
    old_build = "function buildIcs201DocxBlocks(form: Ics201FormState): DocxBlock[] {"
    idx = text.index(old_build)
    end_marker = "\n\nfunction buildIcs209DocxBlocks("
    end_idx = text.index(end_marker, idx)
    pdf_section = slice_lines(src_lines, 1419, 2019).rstrip("\n")
    text = text[:idx] + pdf_section + text[end_idx:]

    # --- generator types + baseline ---
    old_gen_start = "type Ics201FormStateForGenerator = {"
    old_gen_end = "const BASELINE_SAFETY_ANALYSIS: Ics201FormStateForGenerator['safetyAnalysis'] = ["
    gen_start_idx = text.index(old_gen_start)
    gen_end_idx = text.index(old_gen_end, gen_start_idx)
    gen_section = slice_lines(src_lines, 2749, 2916).rstrip("\n") + "\n\n"
    text = text[:gen_start_idx] + gen_section + text[gen_end_idx:]

    # --- refs ---
    text = replace_once(
        text,
        "  const createIncidentSketchViewModelRef = useRef<SketchViewModel | null>(null)\n",
        """  const createIncidentSketchViewModelRef = useRef<SketchViewModel | null>(null)
  const ics201SketchLayerRef = useRef<GraphicsLayer | null>(null)
  const ics201SketchViewModelRef = useRef<SketchViewModel | null>(null)
  const [isDrawingIcs201Polygon, setIsDrawingIcs201Polygon] = useState(false)
""",
        "ics201-refs",
    )

    # --- pratusAi intent + section generation ---
    text = replace_once(
        text,
        """  const [pratusAiIntent, setPratusAiIntent] = useState<
    'default' | 'ics201-generation' | 'sitrep-generation' | 'event-rule-generation' | 'notification-rule-generation'
  >('default')""",
        """  const [pratusAiIntent, setPratusAiIntent] = useState<
    | 'default'
    | 'ics201-generation'
    | 'sitrep-generation'
    | 'ics201-section-generation'
    | 'event-rule-generation'
    | 'notification-rule-generation'
  >('default')
  type Ics201SectionId =
    | 'report-info'
    | 'incident-briefing'
    | 'map-sketch'
    | 'current-situation'
    | 'objectives'
    | 'actions'
    | 'org-chart'
    | 'resources'
    | 'safety-analysis'
  const ICS201_SECTION_LABELS: Record<Ics201SectionId, string> = {
    'report-info': 'Report Identification',
    'incident-briefing': 'ICS-201 Incident Briefing',
    'map-sketch': 'Map Sketch',
    'current-situation': 'Current Situation',
    objectives: 'Objectives',
    actions: 'Actions',
    'org-chart': 'Organization Chart',
    resources: 'Resources Summary',
    'safety-analysis': 'Safety Analysis',
  }
  const ICS201_SECTION_PROMPTS: Record<Ics201SectionId, string> = {
    'report-info':
      'Draft the Report Identification fields for the current ICS-201 (Incident Name, Incident Location, and Date/Time Initiated) using the latest incident data, current operational period, and prior versions for continuity.',
    'incident-briefing':
      'Draft the ICS-201 Incident Briefing header fields (Incident Name, Incident Number, Date/Time Prepared, Prepared By, Operational Period start/end, and Jurisdiction/Agency) using the latest incident metadata and the current operational period.',
    'map-sketch':
      'Propose a tightened incident perimeter polygon (5–8 vertices, WGS84 lat/lon) around the current area of operations using the latest situation summary, mapped resources, and any prior ICS-201 perimeter for reference.',
    'current-situation':
      'Write a concise Current Situation summary for the ICS-201 that reflects the latest incident posture, weather, status of life-safety operations, and impacts to the area of operations. Keep it within the 1,000-character strict-structure limit and avoid duplicating other sections.',
    objectives:
      'Draft a numbered set of SMART operational-period objectives for the ICS-201, aligned to the current Incident Commander priorities. Cover life safety, incident stabilization, property/environmental protection, and continuity of operations. Keep the combined text within the strict-structure character limit.',
    actions:
      'Draft a set of priority actions for the current operational period with task, owner (ICS role), start time, and end time. Align each action to one of the ICS-201 objectives and the current operational tempo.',
    'org-chart':
      'Populate the ICS-201 Organization Chart (Incident Commander, Operations, Planning, Logistics, Finance/Admin Section Chiefs, Public Information Officer, Safety Officer, Liaison Officer) using the current roster and the latest staffing assignments.',
    resources:
      'Draft a Resources Summary for the ICS-201 (category, identifier, quantity, status, assignment) drawn from the resources currently checked in or ordered for this incident.',
    'safety-analysis':
      'Draft the ICS-201 Safety Analysis (hazard, mitigation, PPE, medical plan) covering the top operational hazards for the current operational period, drawing from the situation summary, weather, and any prior safety analyses.',
  }
  const [pratusAiIcs201Section, setPratusAiIcs201Section] = useState<Ics201SectionId | null>(null)
  const openIcs201SectionGeneration = (section: Ics201SectionId) => {
    setPratusAiIntent('ics201-section-generation')
    setPratusAiIcs201Section(section)
    setPratusAiDraftMessage(ICS201_SECTION_PROMPTS[section])
    setIsPratusAiDrawerOpen(true)
  }""",
        "pratus-ai-intent",
    )

    # --- INITIAL_ICS201_FORM + state ---
    old_initial_marker = "  const INITIAL_ICS201_FORM: Ics201FormState = {"
    old_initial_end = "  const [ics201Form, setIcs201Form] = useState<Ics201FormState>(INITIAL_ICS201_FORM)\n"
    init_start = text.index(old_initial_marker)
    init_end = text.index(old_initial_end, init_start) + len(old_initial_end)
    initial_block = slice_lines(src_lines, 3655, 3866).rstrip("\n") + "\n"
    text = text[:init_start] + initial_block + text[init_end:]

    # --- map sketch layer init ---
    text = replace_once(
        text,
        """    if (!drawLocationLayerRef.current) {
      drawLocationLayerRef.current = new GraphicsLayer()
    }
    const analyticsCategoryLayers""",
        """    if (!drawLocationLayerRef.current) {
      drawLocationLayerRef.current = new GraphicsLayer()
    }
    if (!ics201SketchLayerRef.current) {
      ics201SketchLayerRef.current = new GraphicsLayer({
        id: 'ics201-map-sketch-layer',
        title: 'ICS-201 Map Sketch',
        listMode: 'hide',
      })
    }
    const analyticsCategoryLayers""",
        "map-sketch-layer-init",
    )

    text = replace_once(
        text,
        """    if (!mapViewRef.current) {
      const femaLayer = femaRegionsLayerRef.current
      const map = new ArcGISMap({
        basemap: 'streets-navigation-vector',
        layers: femaLayer
          ? [
              femaLayer,
              graphicsLayer,
              ...analyticsCategoryLayers,
              ...analyticsResolutionLayers,
              drawLocationLayerRef.current,
            ]
          : [
              graphicsLayer,
              ...analyticsCategoryLayers,
              ...analyticsResolutionLayers,
              drawLocationLayerRef.current,
            ],
      })""",
        """    if (!mapViewRef.current) {
      const femaLayer = femaRegionsLayerRef.current
      const sketchLayer = ics201SketchLayerRef.current
      const baseLayers = femaLayer
        ? [
            femaLayer,
            graphicsLayer,
            ...analyticsCategoryLayers,
            ...analyticsResolutionLayers,
            drawLocationLayerRef.current,
          ]
        : [
            graphicsLayer,
            ...analyticsCategoryLayers,
            ...analyticsResolutionLayers,
            drawLocationLayerRef.current,
          ]
      const map = new ArcGISMap({
        basemap: 'streets-navigation-vector',
        layers: sketchLayer ? [...baseLayers, sketchLayer] : baseLayers,
      })""",
        "map-view-sketch-layer",
    )

    text = replace_once(
        text,
        """  useEffect(() => {
    return () => {
      mapViewRef.current?.destroy()
      mapViewRef.current = null
      mapGraphicsRef.current = new globalThis.Map()
      mapGraphicsLayerRef.current = null
      femaRegionsLayerRef.current = null
      femaRegionGraphicsRef.current = new globalThis.Map()
      drawLocationLayerRef.current = null
      drawLocationGraphicRef.current = null
      analyticsCategoryLayersRef.current = new globalThis.Map()""",
        """  useEffect(() => {
    return () => {
      if (ics201SketchViewModelRef.current) {
        try {
          ics201SketchViewModelRef.current.destroy()
        } catch {
          /* ignore */
        }
        ics201SketchViewModelRef.current = null
      }
      mapViewRef.current?.destroy()
      mapViewRef.current = null
      mapGraphicsRef.current = new globalThis.Map()
      mapGraphicsLayerRef.current = null
      femaRegionsLayerRef.current = null
      femaRegionGraphicsRef.current = new globalThis.Map()
      drawLocationLayerRef.current = null
      drawLocationGraphicRef.current = null
      ics201SketchLayerRef.current = null
      analyticsCategoryLayersRef.current = new globalThis.Map()""",
        "map-cleanup-sketch",
    )

    # insert map sketch effects after map cleanup effect closing
    sketch_effects = slice_lines(src_lines, 7275, 7403)
    marker_after_cleanup = """      analyticsResolutionBulkZoomRecordsRef.current = null
    }
  }, [])

  useEffect(() => {
    const shouldShowModalMap"""
    text = replace_once(
        text,
        marker_after_cleanup,
        """      analyticsResolutionBulkZoomRecordsRef.current = null
    }
  }, [])

""" + sketch_effects + """
  useEffect(() => {
    const shouldShowModalMap""",
        "map-sketch-effects",
    )

    # --- ics201-section-generation handler ---
    section_handler = slice_lines(src_lines, 9125, 9441)
    text = replace_once(
        text,
        """    if (pratusAiIntent === 'ics201-generation') {""",
        section_handler + "\n    if (pratusAiIntent === 'ics201-generation') {",
        "section-generation-handler",
    )

    # --- saveIcs201Section ---
    text = replace_once(
        text,
        """  const updateIcs201Field = <K extends keyof Ics201FormState>(field: K, value: Ics201FormState[K]) => {
    setIcs201Form((previous) => ({
      ...previous,
      [field]: value,
    }))
  }
  const updateIcs201Objective""",
        """  const updateIcs201Field = <K extends keyof Ics201FormState>(field: K, value: Ics201FormState[K]) => {
    setIcs201Form((previous) => ({
      ...previous,
      [field]: value,
    }))
  }
  const saveIcs201Section = (nextForm: Ics201FormState) => {
    const savedForm = cloneIcs201FormState(nextForm)
    setIcs201Form(savedForm)
    setIcs201Versions((previous) => {
      const newVersion: Ics201Version = {
        id: `${Date.now()}-draft-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        authorName: 'You',
        authorColor: '#16a34a',
        snapshot: cloneIcs201FormState(savedForm),
        signatures: [],
      }
      return [...previous, newVersion].slice(-100)
    })
  }
  const updateIcs201Objective""",
        "save-ics201-section",
    )

    # --- briefing header toolbar ---
    old_header = """                {activeTab === 'briefing' && isInExerciseWorkspace && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label="Export ICS-201 as Word document"
                    title="Export ICS-201 as Word document"
                    onClick={() => {
                      const safeIncident =
                        ics201Form.incidentName.trim().replace(/[^a-zA-Z0-9-_]+/g, '_') ||
                        'Exercise'
                      const stamp = new Date()
                        .toISOString()
                        .slice(0, 16)
                        .replace(/[:T]/g, '-')
                      downloadDocx(
                        `ICS-201_${safeIncident}_${stamp}.docx`,
                        buildIcs201DocxBlocks(ics201Form)
                      )
                    }}
                  >
                    <DownloadIcon className="h-4 w-4" />
                  </Button>
                )}"""
    new_header = slice_lines(src_lines, 11358, 11497).rstrip("\n")
    new_header = new_header.replace(
        "{activeTab === 'briefing' && (",
        "{activeTab === 'briefing' && (isInIncidentWorkspace || isInExerciseWorkspace) && (",
        1,
    )
    text = replace_once(text, old_header, new_header, "briefing-header")

    # --- briefing content UI ---
    old_briefing_start = "                {activeTab === 'briefing' && isInExerciseWorkspace && (\n                  <div className=\"space-y-3\">"
    old_briefing_end = "                )}\n\n                {activeTab === 'msel' && isInExerciseWorkspace && ("
    brief_start = text.index(old_briefing_start)
    brief_end = text.index(old_briefing_end, brief_start)
    briefing_ui = slice_lines(src_lines, 13869, 15997).rstrip("\n")
    briefing_ui = briefing_ui.replace(
        "{activeTab === 'briefing' && (",
        "{activeTab === 'briefing' && (isInIncidentWorkspace || isInExerciseWorkspace) && (",
        1,
    )
    text = text[:brief_start] + briefing_ui + "\n\n" + text[brief_end:]

    # --- preview dialog ---
    preview_dialog = slice_lines(src_lines, 24710, 24848)
    text = replace_once(
        text,
        "      <Dialog open={isIcs201VersionDialogOpen} onOpenChange={setIsIcs201VersionDialogOpen}>",
        preview_dialog + "\n      <Dialog open={isIcs201VersionDialogOpen} onOpenChange={setIsIcs201VersionDialogOpen}>",
        "preview-dialog",
    )

    # --- Forms dropdown for incident workspace ---
    text = replace_once(
        text,
        "                    {isInExerciseWorkspace && (\n                      <>\n                        <DropdownMenu>",
        "                    {(isInIncidentWorkspace || isInExerciseWorkspace) && (\n                      <>\n                        <DropdownMenu>",
        "forms-dropdown-gate",
    )

    # --- seed ICS-201 on workspace enter ---
    text = replace_once(
        text,
        """    setIcs201Form((previous) => ({
      ...previous,
      incidentName: incident.name,
      currentSituationSummary: incident.summary,
      preparedBy: incident.lead,
      jurisdiction: incident.region,
    }))""",
        """    setIcs201Form((previous) => ({
      ...cloneIcs201FormState({
        ...INITIAL_ICS201_FORM,
        incidentName: incident.name,
        incidentLocation: incident.location ?? previous.incidentLocation,
        currentSituationSummary: incident.summary,
        preparedBy: incident.lead,
        jurisdiction: incident.region,
      }),
    }))""",
        "seed-incident",
    )
    text = replace_once(
        text,
        """    setIcs201Form((previous) => ({
      ...previous,
      incidentName: exercise.name,
      currentSituationSummary: exercise.summary,
      preparedBy: exercise.lead,
      jurisdiction: exercise.region,
    }))""",
        """    setIcs201Form((previous) => ({
      ...cloneIcs201FormState({
        ...INITIAL_ICS201_FORM,
        incidentName: exercise.name,
        incidentLocation: exercise.location ?? previous.incidentLocation,
        currentSituationSummary: exercise.summary,
        preparedBy: exercise.lead,
        jurisdiction: exercise.region,
      }),
    }))""",
        "seed-exercise",
    )

    # --- pratus AI drawer label ---
    text = replace_once(
        text,
        "                    pratusAiIntent === 'ics201-generation' ||",
        "                    pratusAiIntent === 'ics201-generation' ||\n                    pratusAiIntent === 'ics201-section-generation' ||",
        "pratus-ai-drawer-label",
    )

    # --- version snapshots use clone ---
    text = text.replace(
        "snapshot: INITIAL_ICS201_FORM,",
        "snapshot: cloneIcs201FormState(INITIAL_ICS201_FORM),",
        1,
    )

    DST.write_text(text, encoding="utf-8")
    print("ICS-201 port applied successfully.")


if __name__ == "__main__":
    main()
