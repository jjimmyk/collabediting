import fs from 'node:fs'
import path from 'node:path'
import { PDFDocument } from 'pdf-lib'

const templatePath =
  process.argv[2] ?? path.resolve('public/ics-204-cg-template.pdf')
const outputPath = path.resolve('src/features/ics204/export-template-field-map.generated.json')

const bytes = fs.readFileSync(templatePath)
const pdf = await PDFDocument.load(bytes)
const form = pdf.getForm()

const fields: Array<{
  name: string
  x: number
  y: number
  w: number
  h: number
}> = []

for (const field of form.getFields()) {
  const name = field.getName()
  try {
    const rect = field.acroField.getWidgets()[0]?.getRectangle()
    if (!rect) continue
    fields.push({
      name,
      x: Math.round(rect.x * 10) / 10,
      y: Math.round(rect.y * 10) / 10,
      w: Math.round(rect.width * 10) / 10,
      h: Math.round(rect.height * 10) / 10,
    })
  } catch {
    fields.push({ name, x: 0, y: 0, w: 0, h: 0 })
  }
}

fs.writeFileSync(outputPath, `${JSON.stringify({ pageCount: pdf.getPageCount(), fields }, null, 2)}\n`)
console.log(`Wrote ${outputPath} (${fields.length} fields)`)
