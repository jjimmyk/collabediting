/**
 * Ensures api/ routes do not import frontend src/ code (breaks Vercel serverless bundling).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const apiDir = join(process.cwd(), 'api')
const forbiddenPatterns = [
  /from\s+['"]\.\.\/src\//,
  /from\s+['"]@\/\//,
  /import\s*\(\s*['"]\.\.\/src\//,
  /import\s*\(\s*['"]@\//,
]

function collectTsFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...collectTsFiles(fullPath))
      continue
    }
    if (entry.endsWith('.ts')) {
      files.push(fullPath)
    }
  }
  return files
}

const violations: Array<{ file: string; line: number; text: string }> = []

for (const filePath of collectTsFiles(apiDir)) {
  const relative = filePath.replace(`${process.cwd()}/`, '')
  const lines = readFileSync(filePath, 'utf8').split('\n')
  lines.forEach((line, index) => {
    if (forbiddenPatterns.some((pattern) => pattern.test(line))) {
      violations.push({ file: relative, line: index + 1, text: line.trim() })
    }
  })
}

if (violations.length > 0) {
  console.error('API import boundary violations (api/ must not import src/ or @/):\n')
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}`)
    console.error(`    ${v.text}\n`)
  }
  process.exit(1)
}

console.log(`verify-api-import-boundary: ${collectTsFiles(apiDir).length} api files OK`)
