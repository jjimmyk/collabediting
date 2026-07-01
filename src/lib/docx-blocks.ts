export type DocxBlock =
  | { kind: 'title'; text: string }
  | { kind: 'subtitle'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; text: string }
  | { kind: 'bullet'; text: string }
  | { kind: 'image'; png: Uint8Array; widthPx?: number; heightPx?: number }

export type DocxHeaderFooterCell = {
  label: string
  value?: string
}

export type DocxHeaderFooter = {
  cells: DocxHeaderFooterCell[]
  topLines?: string[]
}

export type DocxOptions = {
  header?: DocxHeaderFooter
  footer?: DocxHeaderFooter
}
