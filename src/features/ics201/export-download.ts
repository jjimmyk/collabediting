import {
  clip,
  endPath,
  PDFBool,
  PDFDocument,
  PDFName,
  popGraphicsState,
  pushGraphicsState,
  rectangle,
  rgb,
  StandardFonts,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib'
import {
  computeClippedImageLayout,
  type PdfImageRect,
} from '@/features/ics201/map-sketch-geometry'
import type { Ics201ActionRow, Ics201FormState } from '@/features/ics201/types'
import { formatIcs201ObjectiveExportLine } from '@/features/ics201/utils'
import type { DocxBlock, DocxOptions } from '@/lib/docx-blocks'

export const ICS201_TEMPLATE_URL = `${import.meta.env.BASE_URL}ics-201-incident-briefing.pdf`
export const ICS201_PAGE_CHAR_LIMIT = 300
const ICS201_TEMPLATE_PAGE_COUNT = 4
export const ICS201_MAP_SKETCH_FIELD =
  '3 MapSketch include sketch showing the total area of operations the incident sitearea overflight results trajectories impacted shorelines or other graphics depicting situational and response statusRow1'
const ICS201_CURRENT_SITUATION_FIELD = '4 Current SituationRow1'
const ICS201_OBJECTIVES_FIELD = 'RESPONSE OBJECTIVESRow1_2'
const ICS201_SAFETY_FIELD = 'SAFETY MESSAGERow1_2'
const ICS201_CURRENT_ACTIONS_FIELD = 'CURRENT ACTIONS STRATEGIES and TACTICSRow1_2'

const FLEXIBLE_PDF_PAGE = { widthPt: 612, heightPt: 792 }
const FLEXIBLE_PDF_MARGIN = 48
const FLEXIBLE_MAP_SKETCH_HEIGHT = 220

type Ics201TemplatePaginatedSection = {
  sourcePageIndex: number
  fieldName: string
  text: string
}

export function splitIcs201TextIntoPageChunks(text: string, limit = ICS201_PAGE_CHAR_LIMIT): string[] {
  const trimmed = text.trim()
  if (trimmed.length === 0) return ['']
  if (trimmed.length <= limit) return [trimmed]

  const chunks: string[] = []
  let start = 0
  while (start < trimmed.length) {
    let end = Math.min(start + limit, trimmed.length)
    if (end < trimmed.length) {
      const slice = trimmed.slice(start, end)
      const newlineAt = slice.lastIndexOf('\n')
      if (newlineAt >= limit - 120) {
        end = start + newlineAt + 1
      }
    }
    chunks.push(trimmed.slice(start, end))
    start = end
  }
  return chunks
}

function wrapPdfLinesForWidth(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const lines: string[] = []
  const paragraphs = text.split('\n')
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean)
    if (words.length === 0) {
      lines.push('')
      continue
    }
    let current = ''
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        current = candidate
        continue
      }
      if (current) {
        lines.push(current)
        current = ''
      }
      if (font.widthOfTextAtSize(word, fontSize) <= maxWidth) {
        current = word
        continue
      }
      let remaining = word
      while (remaining.length > 0) {
        let cut = remaining.length
        while (
          cut > 1 &&
          font.widthOfTextAtSize(remaining.slice(0, cut), fontSize) > maxWidth
        ) {
          cut -= 1
        }
        lines.push(remaining.slice(0, cut))
        remaining = remaining.slice(cut)
      }
    }
    if (current) {
      lines.push(current)
    }
  }
  return lines
}

export function drawTextInWidgetRect(
  page: PDFPage,
  font: PDFFont,
  rect: PdfImageRect,
  text: string,
  options: { fontSize?: number; lineHeight?: number; maskBackground?: boolean } = {}
): void {
  const fontSize = options.fontSize ?? 9
  const lineHeight = options.lineHeight ?? 11
  const padding = 4

  if (options.maskBackground) {
    page.drawRectangle({
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      color: rgb(1, 1, 1),
      borderWidth: 0,
    })
  }

  const maxWidth = Math.max(1, rect.width - padding * 2)
  const lines = wrapPdfLinesForWidth(text, font, fontSize, maxWidth)
  let y = rect.y + rect.height - padding - fontSize
  const minY = rect.y + padding
  for (const line of lines) {
    if (y < minY) break
    page.drawText(line, {
      x: rect.x + padding,
      y,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    })
    y -= lineHeight
  }
}

export function drawClippedMapSketchImage(
  page: PDFPage,
  pngImage: Awaited<ReturnType<PDFDocument['embedPng']>>,
  rect: PdfImageRect,
  padding = 4
): void {
  const layout = computeClippedImageLayout(pngImage.width, pngImage.height, rect, padding)

  page.drawRectangle({
    x: rect.x,
    y: rect.y,
    width: rect.width,
    height: rect.height,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  })

  page.pushOperators(
    pushGraphicsState(),
    rectangle(layout.clipX, layout.clipY, layout.clipWidth, layout.clipHeight),
    clip(),
    endPath()
  )
  page.drawImage(pngImage, {
    x: layout.x,
    y: layout.y,
    width: layout.width,
    height: layout.height,
  })
  page.pushOperators(popGraphicsState())
}

function getPdfTextFieldWidgetRect(
  pdfForm: ReturnType<PDFDocument['getForm']>,
  fieldName: string
): PdfImageRect | null {
  try {
    const widget = pdfForm.getTextField(fieldName).acroField.getWidgets()[0]
    return widget.getRectangle()
  } catch {
    return null
  }
}

function clean(value: string | undefined | null): string {
  return (value ?? '').trim()
}

function joinNonEmpty(parts: Array<string | undefined | null>, separator: string): string {
  return parts.map((part) => clean(part)).filter((part) => part.length > 0).join(separator)
}

function formatAction(action: Ics201ActionRow): string {
  const time = clean(action.time)
  const actionText = clean(action.action)
  if (time.length === 0 && actionText.length === 0) return ''
  return time.length > 0 ? `${time}: ${actionText}` : actionText
}

export async function fillIcs201TemplatePdf(
  form: Ics201FormState,
  options: { paginated: boolean; mapSketchPng?: Uint8Array | null }
): Promise<Uint8Array> {
  const { paginated, mapSketchPng } = options
  const response = await fetch(ICS201_TEMPLATE_URL)
  if (!response.ok) {
    throw new Error(`Unable to load ICS-201 template (${response.status})`)
  }
  const templateBytes = await response.arrayBuffer()
  const blankTemplate = paginated ? await PDFDocument.load(templateBytes) : null
  const pdfDoc = await PDFDocument.load(templateBytes)
  const pdfForm = pdfDoc.getForm()
  const fieldNames = new Set(pdfForm.getFields().map((field) => field.getName()))

  const setText = (name: string, value: string) => {
    if (!fieldNames.has(name)) return
    try {
      const field = pdfForm.getTextField(name)
      field.disableRichFormatting()
      field.setText(value ?? '')
    } catch {
      // Field exists but is not a writable text field — skip rather than fail.
    }
  }

  const operationalPeriod = joinNonEmpty(
    [
      form.operationalPeriodStart.replace('T', ' '),
      form.operationalPeriodEnd ? `To: ${form.operationalPeriodEnd.replace('T', ' ')}` : '',
    ],
    '   '
  )

  const currentSituation = clean(form.currentSituationSummary)

  const objectivesText = form.objectives
    .filter((row) => row.objective.trim().length > 0)
    .map((row, index) => formatIcs201ObjectiveExportLine(row, index))
    .join('\n')

  const box13 = form.safetyAnalysisBox13
  const safetyParts = joinNonEmpty(
    [
      box13.safetyOfficer ? `Safety Officer: ${box13.safetyOfficer}` : '',
      box13.safetyNotes ? `Safety Notes: ${box13.safetyNotes}` : '',
      box13.ppeNotes ? `PPE Notes: ${box13.ppeNotes}` : '',
      box13.involvesHazmat === true ? 'HAZMAT: Yes' : box13.involvesHazmat === false ? 'HAZMAT: No' : '',
    ],
    '\n'
  )
  const safetyText = safetyParts

  const currentActionsText = form.actions
    .map(formatAction)
    .filter((line) => line.length > 0)
    .join('\n')
  const plannedActionsText = ''

  const templateSections: Ics201TemplatePaginatedSection[] = paginated
    ? [
        { sourcePageIndex: 1, fieldName: ICS201_OBJECTIVES_FIELD, text: objectivesText },
        { sourcePageIndex: 1, fieldName: ICS201_SAFETY_FIELD, text: safetyText },
      ]
    : []

  const writeSectionText = (fieldName: string, text: string) => {
    if (!paginated) {
      setText(fieldName, text)
      return
    }
    const isPaginatedSection = templateSections.some(
      (section) => section.fieldName === fieldName
    )
    if (!isPaginatedSection) {
      setText(fieldName, text)
      return
    }
    const chunks = splitIcs201TextIntoPageChunks(text)
    setText(fieldName, chunks[0] ?? '')
  }

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const situationRect = getPdfTextFieldWidgetRect(pdfForm, ICS201_CURRENT_SITUATION_FIELD)
  const mapSketchRect = getPdfTextFieldWidgetRect(pdfForm, ICS201_MAP_SKETCH_FIELD)
  const situationChunks = paginated
    ? splitIcs201TextIntoPageChunks(currentSituation)
    : [currentSituation]

  setText(ICS201_CURRENT_SITUATION_FIELD, '')
  try {
    const situationField = pdfForm.getTextField(ICS201_CURRENT_SITUATION_FIELD)
    situationField.disableRichFormatting()
    situationField.updateAppearances(helvetica)
  } catch {
    // Field may not support appearance refresh; drawn text below is authoritative.
  }
  if (situationRect) {
    const page0 = pdfDoc.getPage(0)
    const firstChunk = situationChunks[0] ?? ''
    drawTextInWidgetRect(page0, helvetica, situationRect, firstChunk, {
      maskBackground: true,
    })
  }

  setText('1 Incident NameRow1', form.incidentName)
  setText('From', operationalPeriod)
  setText(ICS201_MAP_SKETCH_FIELD, '')

  if (mapSketchRect) {
    const page0 = pdfDoc.getPage(0)
    if (mapSketchPng && mapSketchPng.byteLength > 0) {
      const pngImage = await pdfDoc.embedPng(mapSketchPng)
      drawClippedMapSketchImage(page0, pngImage, mapSketchRect)
    } else if (form.mapSketchPolygon.length === 0) {
      drawTextInWidgetRect(page0, helvetica, mapSketchRect, 'No map sketch drawn.', {
        maskBackground: true,
      })
    } else {
      drawTextInWidgetRect(page0, helvetica, mapSketchRect, 'Map sketch unavailable.', {
        maskBackground: true,
      })
    }
  }

  writeSectionText(ICS201_OBJECTIVES_FIELD, objectivesText)
  writeSectionText(ICS201_SAFETY_FIELD, safetyText)
  const actionsBlock = joinNonEmpty(
    [
      currentActionsText ? `CURRENT ACTIONS, STRATEGIES, and TACTICS:\n${currentActionsText}` : '',
      plannedActionsText ? `PLANNED ACTIONS:\n${plannedActionsText}` : '',
    ],
    '\n\n'
  )
  if (paginated) {
    templateSections.push({
      sourcePageIndex: 1,
      fieldName: ICS201_CURRENT_ACTIONS_FIELD,
      text: actionsBlock,
    })
  }
  writeSectionText(ICS201_CURRENT_ACTIONS_FIELD, actionsBlock)
  setText('Text1', plannedActionsText)

  const actionRowNumbers = [1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23]
  form.actions.forEach((action, index) => {
    if (index >= actionRowNumbers.length) return
    const rowNumber = actionRowNumbers[index]
    setText(`TIMERow${rowNumber}`, clean(action.time))
    setText(`ACTIONSRow${rowNumber}`, clean(action.action))
  })

  setText('Incident Commander', form.orgChart.commandNames[0] ?? '')
  setText('Safety Officer', form.orgChart.safetyOfficer)
  setText('Liaison Officer', form.orgChart.liaisonOfficer)
  setText('Public Information Officer', form.orgChart.publicInformationOfficer)
  setText('Operations SectionRow1', form.orgChart.operationsSectionChief)
  setText('Planning SectionRow1', form.orgChart.planningSectionChief)
  setText('Logistics SectionRow1', form.orgChart.logisticsSectionChief)
  setText('Finance SectionRow1', form.orgChart.financeSectionChief)

  form.resources.forEach((resource, index) => {
    const rowNumber = index + 1
    if (rowNumber > 13) return
    setText(
      `Resource OrderedRow${rowNumber}`,
      joinNonEmpty([resource.dateTimeOrdered, resource.resource], ' ')
    )
    setText(`DescriptionIdentificationRow${rowNumber}`, resource.resourceIdentifier)
    setText(
      `LocationAssignmentStatusRow${rowNumber}`,
      joinNonEmpty(
        [resource.notes, resource.eta ? `ETA: ${resource.eta}` : '', resource.onScene ? '(On Scene)' : ''],
        ' '
      )
    )
  })

  setText(
    'NamePosition',
    joinNonEmpty([form.preparedByName || form.preparedBy, form.preparedByPositionTitle], ' / ')
  )
  setText(
    'Date  TimeSignature',
    joinNonEmpty(
      [
        form.preparedBySignature,
        form.preparedDateTime ? `(${form.preparedDateTime})` : '',
      ],
      '  '
    )
  )

  if (paginated && blankTemplate) {
    const insertsAfterOriginalPage = Array.from(
      { length: ICS201_TEMPLATE_PAGE_COUNT },
      () => 0
    )

    if (situationChunks.length > 1 && situationRect) {
      for (let chunkIndex = 1; chunkIndex < situationChunks.length; chunkIndex += 1) {
        const [copiedPage] = await pdfDoc.copyPages(blankTemplate, [0])
        const insertIndex = insertsAfterOriginalPage[0] + 1
        pdfDoc.insertPage(insertIndex, copiedPage)
        insertsAfterOriginalPage[0] += 1
        for (let pageIndex = 1; pageIndex < insertsAfterOriginalPage.length; pageIndex += 1) {
          insertsAfterOriginalPage[pageIndex] += 1
        }
        drawTextInWidgetRect(copiedPage, helvetica, situationRect, situationChunks[chunkIndex] ?? '', {
          maskBackground: true,
        })
      }
    }

    for (const section of templateSections) {
      const chunks = splitIcs201TextIntoPageChunks(section.text)
      if (chunks.length <= 1) continue

      const rect = getPdfTextFieldWidgetRect(pdfForm, section.fieldName)
      if (!rect) continue

      for (let chunkIndex = 1; chunkIndex < chunks.length; chunkIndex += 1) {
        const [copiedPage] = await pdfDoc.copyPages(blankTemplate, [section.sourcePageIndex])
        const insertIndex =
          section.sourcePageIndex + insertsAfterOriginalPage[section.sourcePageIndex] + 1
        pdfDoc.insertPage(insertIndex, copiedPage)
        insertsAfterOriginalPage[section.sourcePageIndex] += 1
        for (
          let pageIndex = section.sourcePageIndex + 1;
          pageIndex < insertsAfterOriginalPage.length;
          pageIndex += 1
        ) {
          insertsAfterOriginalPage[pageIndex] += 1
        }
        drawTextInWidgetRect(copiedPage, helvetica, rect, chunks[chunkIndex] ?? '', {
          maskBackground: true,
        })
      }
    }
  }

  pdfForm.acroForm.dict.set(PDFName.of('NeedAppearances'), PDFBool.True)

  return pdfDoc.save({ updateFieldAppearances: false })
}

export async function buildIcs201FlexiblePdfBytes(
  form: Ics201FormState,
  mapSketchPng?: Uint8Array | null
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([FLEXIBLE_PDF_PAGE.widthPt, FLEXIBLE_PDF_PAGE.heightPt])
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  let cursorY = FLEXIBLE_PDF_PAGE.heightPt - FLEXIBLE_PDF_MARGIN
  const contentWidth = FLEXIBLE_PDF_PAGE.widthPt - FLEXIBLE_PDF_MARGIN * 2

  const drawLine = (text: string, size: number, bold = false) => {
    page.drawText(text, {
      x: FLEXIBLE_PDF_MARGIN,
      y: cursorY,
      size,
      font: bold ? boldFont : font,
      color: rgb(0, 0, 0),
    })
    cursorY -= size + 6
  }

  drawLine('Incident Briefing (ICS-201)', 16, true)
  if (form.incidentName.trim()) {
    drawLine(form.incidentName.trim(), 11)
  }

  cursorY -= 8
  drawLine('Map Sketch', 12, true)

  if (mapSketchPng && mapSketchPng.byteLength > 0) {
    const pngImage = await pdfDoc.embedPng(mapSketchPng)
    const imageRect: PdfImageRect = {
      x: FLEXIBLE_PDF_MARGIN,
      y: cursorY - FLEXIBLE_MAP_SKETCH_HEIGHT,
      width: contentWidth,
      height: FLEXIBLE_MAP_SKETCH_HEIGHT,
    }
    drawClippedMapSketchImage(page, pngImage, imageRect)
    cursorY = imageRect.y - 16
  } else {
    drawLine(
      form.mapSketchPolygon.length === 0 ? 'No map sketch drawn.' : 'Map sketch unavailable.',
      10
    )
  }

  const blocks = buildIcs201DocxBlocks(form, mapSketchPng)
  const textBlocks = blocks.filter(
    (block): block is Exclude<DocxBlock, { kind: 'image' }> => block.kind !== 'image'
  )
  const startedSections = new Set<string>()
  for (const block of textBlocks) {
    if (block.kind === 'title' || block.kind === 'subtitle') continue
    if (block.kind === 'heading' && block.text === 'Map Sketch') continue
    if (block.kind === 'heading') {
      if (startedSections.has(block.text)) continue
      startedSections.add(block.text)
      cursorY -= 8
      if (cursorY < FLEXIBLE_PDF_MARGIN + 40) break
      drawLine(block.text, 12, true)
      continue
    }
    if (cursorY < FLEXIBLE_PDF_MARGIN + 20) break
    const prefix = block.kind === 'bullet' ? '• ' : ''
    drawLine(`${prefix}${block.text}`, 10)
  }

  return pdfDoc.save()
}

export function buildIcs201DocxBlocks(
  form: Ics201FormState,
  mapSketchPng?: Uint8Array | null
): DocxBlock[] {
  const blocks: DocxBlock[] = []
  const pushHeading = (text: string) => blocks.push({ kind: 'heading', text })
  const pushParagraph = (text: string | undefined | null) => {
    const trimmed = (text ?? '').trim()
    if (trimmed.length === 0) return
    blocks.push({ kind: 'paragraph', text: trimmed })
  }
  const pushBullet = (text: string | undefined | null) => {
    const trimmed = (text ?? '').trim()
    if (trimmed.length === 0) return
    blocks.push({ kind: 'bullet', text: trimmed })
  }

  blocks.push({ kind: 'title', text: 'Incident Briefing (ICS-201)' })
  const subtitleParts: string[] = []
  if (form.incidentName.trim()) subtitleParts.push(form.incidentName.trim())
  if (form.incidentNumber.trim()) subtitleParts.push(`Incident #${form.incidentNumber.trim()}`)
  if (subtitleParts.length > 0) {
    blocks.push({ kind: 'subtitle', text: subtitleParts.join(' • ') })
  }
  pushHeading('Header')
  pushParagraph(form.incidentName && `Incident Name: ${form.incidentName}`)
  pushParagraph(form.incidentNumber && `Incident Number: ${form.incidentNumber}`)
  pushParagraph(form.incidentLocation && `Incident Location: ${form.incidentLocation}`)
  if (form.dateInitiated.trim() || form.timeInitiated.trim()) {
    pushParagraph(
      `Date/Time Initiated: ${form.dateInitiated.trim() || '—'} ${form.timeInitiated.trim()}`.trim()
    )
  }
  pushParagraph(form.preparedDateTime && `Date / Time Prepared: ${form.preparedDateTime}`)
  pushParagraph(form.preparedBy && `Prepared By: ${form.preparedBy}`)
  if (form.operationalPeriodStart.trim() || form.operationalPeriodEnd.trim()) {
    const opStart = form.operationalPeriodStart.trim().replace('T', ' ') || '—'
    const opEnd = form.operationalPeriodEnd.trim().replace('T', ' ') || '—'
    pushParagraph(`Operational Period: ${opStart} → ${opEnd}`)
  }
  pushParagraph(form.jurisdiction && `Jurisdiction / Agency: ${form.jurisdiction}`)
  pushHeading('Map Sketch')
  if (mapSketchPng && mapSketchPng.byteLength > 0) {
    blocks.push({ kind: 'image', png: mapSketchPng, widthPx: 520, heightPx: 390 })
  } else if (form.mapSketchPolygon.length === 0) {
    pushParagraph('No incident perimeter drawn yet.')
  } else {
    pushParagraph('Map sketch image unavailable.')
  }
  pushHeading('Current Situation')
  pushParagraph(form.currentSituationSummary)
  if (form.weatherForecast.trim()) {
    pushHeading('Weather Forecast')
    pushParagraph(form.weatherForecast)
  }
  if (form.projectedIncidentCourse.trim()) {
    pushHeading('Projected Incident Course')
    pushParagraph(form.projectedIncidentCourse)
  }
  pushHeading('Objectives')
  if (form.objectives.length === 0) {
    pushParagraph('No objectives recorded.')
  } else {
    form.objectives.forEach((row, index) => {
      pushBullet(formatIcs201ObjectiveExportLine(row, index).replace(/^\d+\.\s*/, ''))
    })
  }
  pushHeading('Actions')
  if (form.actions.length === 0) {
    pushParagraph('No actions recorded.')
  } else {
    form.actions.forEach((action) => {
      const text = formatAction(action) || 'Untitled action'
      pushBullet(text)
    })
  }
  pushHeading('Organization Chart')
  const orgEntries: Array<[string, string]> = [
    ['Incident Commander', form.orgChart.commandNames[0] ?? ''],
    ['Operations Section Chief', form.orgChart.operationsSectionChief],
    ['Planning Section Chief', form.orgChart.planningSectionChief],
    ['Logistics Section Chief', form.orgChart.logisticsSectionChief],
    ['Finance Section Chief', form.orgChart.financeSectionChief],
    ['Public Information Officer', form.orgChart.publicInformationOfficer],
    ['Safety Officer', form.orgChart.safetyOfficer],
    ['Liaison Officer', form.orgChart.liaisonOfficer],
  ]
  const populatedOrg = orgEntries.filter(([, name]) => name.trim().length > 0)
  if (populatedOrg.length === 0) {
    pushParagraph('No organization chart entries recorded.')
  } else {
    populatedOrg.forEach(([role, name]) => pushBullet(`${role}: ${name.trim()}`))
  }
  pushHeading('Resources Summary')
  if (form.resources.length === 0) {
    pushParagraph('No resources recorded.')
  } else {
    form.resources.forEach((resource) => {
      const head: string[] = []
      if (resource.resource.trim()) head.push(resource.resource.trim())
      if (resource.resourceIdentifier.trim()) head.push(resource.resourceIdentifier.trim())
      const meta: string[] = []
      if (resource.dateTimeOrdered.trim()) meta.push(`Ordered: ${resource.dateTimeOrdered.trim()}`)
      if (resource.eta.trim()) meta.push(`ETA: ${resource.eta.trim()}`)
      if (resource.onScene) meta.push('On Scene')
      if (resource.notes.trim()) meta.push(resource.notes.trim())
      const text =
        (head.join(' — ') || 'Resource') +
        (meta.length > 0 ? ` (${meta.join(' · ')})` : '')
      pushBullet(text)
    })
  }
  pushHeading('13. Safety Analysis')
  const b13 = form.safetyAnalysisBox13
  pushParagraph(b13.safetyOfficer && `A. Safety Officer: ${b13.safetyOfficer}`)
  pushParagraph(b13.safetyNotes && `D. Safety Notes: ${b13.safetyNotes}`)
  pushParagraph(b13.ppeNotes && `E. PPE Notes: ${b13.ppeNotes}`)
  if (b13.involvesHazmat === true) {
    pushHeading('15. HAZMAT Assessment')
    pushParagraph(form.hazmatAssessmentBox15.sopAndSafeWorkPractices)
    pushParagraph(form.hazmatAssessmentBox15.emergencyProcedures)
  }
  return blocks
}

export function buildIcs201ExportOptions(form: Ics201FormState): DocxOptions {
  const dateTimeInitiated = [form.dateInitiated.trim(), form.timeInitiated.trim()]
    .filter(Boolean)
    .join(' ')
  return {
    header: {
      topLines: [
        'DEPARTMENT OF HOMELAND SECURITY',
        'MARATHON',
        'INCIDENT BRIEFING (ICS 201-CG)',
      ],
      cells: [
        { label: '1. Incident Name:', value: form.incidentName },
        { label: '2. Incident Location:', value: form.incidentLocation },
        { label: '3. Date / Time Initiated:', value: dateTimeInitiated },
      ],
    },
    footer: {
      topLines: ['Prepared by:'],
      cells: [
        {
          label: 'Name:',
          value: form.preparedByName || form.preparedBy,
        },
        {
          label: 'Position/Title:',
          value: form.preparedByPositionTitle,
        },
        {
          label: 'Signature:',
          value: form.preparedBySignature,
        },
        {
          label: 'Date/Time:',
          value: form.preparedDateTime,
        },
      ],
    },
  }
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  globalThis.setTimeout(() => URL.revokeObjectURL(url), 0)
}

export async function downloadIcs201TemplatePdf(
  filename: string,
  form: Ics201FormState,
  paginated: boolean,
  mapSketchPng?: Uint8Array | null
): Promise<void> {
  const bytes = await fillIcs201TemplatePdf(form, { paginated, mapSketchPng })
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  triggerBlobDownload(blob, filename)
}

export async function downloadIcs201FlexiblePdf(
  filename: string,
  form: Ics201FormState,
  mapSketchPng?: Uint8Array | null
): Promise<void> {
  const bytes = await buildIcs201FlexiblePdfBytes(form, mapSketchPng)
  const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  triggerBlobDownload(blob, filename)
}
