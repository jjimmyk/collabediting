#!/usr/bin/env node
/**
 * Runs every scripts/verify-*.ts regression script.
 * Exits non-zero on the first failure.
 */
import { spawnSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const scriptsDir = join(root, 'scripts')
const verifyScripts = readdirSync(scriptsDir)
  .filter((name) => name.startsWith('verify-') && name.endsWith('.ts'))
  .sort()

if (verifyScripts.length === 0) {
  console.error('No verify-*.ts scripts found in scripts/')
  process.exit(1)
}

console.log(`Running ${verifyScripts.length} verify scripts...\n`)

const failures = []

for (const script of verifyScripts) {
  const label = script.replace(/^verify-/, '').replace(/\.ts$/, '')
  process.stdout.write(`→ verify:${label} ... `)

  const result = spawnSync('npx', ['vite-node', join('scripts', script)], {
    cwd: root,
    stdio: 'pipe',
    encoding: 'utf8',
    env: process.env,
  })

  if (result.status === 0) {
    console.log('ok')
    continue
  }

  console.log('FAILED')
  failures.push({ script, code: result.status ?? 1, stderr: result.stderr, stdout: result.stdout })
}

if (failures.length > 0) {
  console.error(`\n${failures.length} verify script(s) failed:\n`)
  for (const failure of failures) {
    console.error(`--- ${failure.script} (exit ${failure.code}) ---`)
    if (failure.stdout?.trim()) console.error(failure.stdout.trim())
    if (failure.stderr?.trim()) console.error(failure.stderr.trim())
    console.error('')
  }
  process.exit(1)
}

console.log(`\nAll ${verifyScripts.length} verify scripts passed.`)
