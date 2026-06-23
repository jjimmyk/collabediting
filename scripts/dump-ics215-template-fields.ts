import fs from 'node:fs'
import path from 'node:path'
import { PDFDocument } from 'pdf-lib'

const templatePath = path.resolve('public/ics-215-cg-template.pdf')
const outputPath = path.resolve('src/features/ics215/export-template-resource-field-map.json')

async function main() {
  const bytes = fs.readFileSync(templatePath)
  const doc = await PDFDocument.load(bytes)
  const form = doc.getForm()
  const rhnByPrefix = { REQ: 'required', Have: 'have', Need: 'need' } as const

  const cells: Array<{ name: string; rhn: string; x: number; y: number }> = []
  for (const field of form.getFields()) {
    const name = field.getName()
    let rhn: string | null = null
    for (const [prefix, key] of Object.entries(rhnByPrefix)) {
      if (name.startsWith(`${prefix} Row `)) {
        rhn = key
        break
      }
    }
    if (!rhn) continue
    try {
      const rect = field.acroField.getWidgets()[0].getRectangle()
      cells.push({ name, rhn, x: rect.x, y: rect.y })
    } catch {
      // skip
    }
  }

  function cluster(values: number[], tolerance = 2): number[] {
    const sorted = [...values].sort((a, b) => b - a)
    const centers: number[] = []
    for (const value of sorted) {
      if (!centers.find((center) => Math.abs(center - value) <= tolerance)) {
        centers.push(value)
      }
    }
    return centers.sort((a, b) => b - a)
  }

  const yCenters = cluster(cells.map((cell) => cell.y))
  const tierOrder = ['required', 'have', 'need'] as const
  const resourceFields: Record<string, Record<string, Record<string, string>>> = {
    required: {},
    have: {},
    need: {},
  }

  for (let assignmentRow = 0; assignmentRow < 8; assignmentRow += 1) {
    for (let tier = 0; tier < 3; tier += 1) {
      const yCenter = yCenters[assignmentRow * 3 + tier]
      const rhn = tierOrder[tier]
      resourceFields[rhn][assignmentRow + 1] = {}
      cells
        .filter((cell) => cell.rhn === rhn && Math.abs(cell.y - yCenter) <= 2)
        .sort((a, b) => a.x - b.x)
        .forEach((cell, index) => {
          resourceFields[rhn][assignmentRow + 1][index + 1] = cell.name
        })
    }
  }

  const fieldNames = form.getFields().map((field) => field.getName())
  const totalsFields: Record<string, Record<string, string>> = {
    required: {},
    have: {},
    need: {},
  }
  for (let resourceCol = 1; resourceCol <= 12; resourceCol += 1) {
    totalsFields.required[resourceCol] =
      fieldNames.find(
        (name) => name === `Total REQ Row ${resourceCol}` || name === `Total Req Row ${resourceCol}`
      ) ?? ''
    totalsFields.have[resourceCol] =
      fieldNames.find((name) => name === `Total on Hand Row ${resourceCol}`) ?? ''
    totalsFields.need[resourceCol] =
      fieldNames.find((name) => name === `Total Needed Row ${resourceCol}`) ?? ''
  }

  const korHeaders: Record<string, string> = {}
  for (let resourceCol = 1; resourceCol <= 12; resourceCol += 1) {
    korHeaders[resourceCol] = `KoR Row ${resourceCol}`
  }

  const output = {
    formPageIndex: 1,
    assignmentRowsPerPage: 8,
    resourceColsPerPage: 12,
    headerFields: {
      incidentName: '1 Incident Name',
      incidentLocation: '2 Incident Location',
      datePrepared: 'Date1_af_date',
      opFrom: 'OP_From',
      opTo: 'OP_To',
      preparedBy: '15 Prepared By Name  Position',
      pageNumber: 'Text3',
      pageTotal: 'Text4',
    },
    assignmentFields: {
      assignee: '5 Division Group Other LocationRow',
      workAssignment: '6 Work AssignmentsRow',
      overhead: '8 Overhead PositionsRow',
      specialEquipment: '9 Special Equipment  SuppliesRow',
      reportingLocation: '10 Reporting LocationRow',
      arrivalTime: '11 Requested Arrival TimeRow',
    },
    korHeaders,
    resourceFields,
    totalsFields,
  }

  fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`Wrote ${outputPath}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
