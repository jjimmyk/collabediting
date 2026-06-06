export const ICS201_TUTORIAL_SELECTORS = {
  workspaceMenu: '[data-ics201-tutorial="workspace-menu"]',
  formsMenu: '[data-ics201-tutorial="forms-menu"]',
  panel: '[data-ics201-tutorial="ics201-panel"]',
  currentSituation: '[data-ics201-tutorial="ics201-current-situation"]',
  generateDraft: '[data-ics201-tutorial="ics201-generate-draft"]',
  versionHistory: '[data-ics201-tutorial="ics201-version-history"]',
  exportMenu: '[data-ics201-tutorial="ics201-export"]',
} as const

export function queryTutorialElement(selector: string): Element | undefined {
  return document.querySelector(selector) ?? undefined
}

export function requireTutorialElement(selector: string): Element {
  return queryTutorialElement(selector) ?? document.body
}

export function waitForTutorialElement(
  selector: string,
  timeoutMs = 2500
): Promise<Element | undefined> {
  const existing = queryTutorialElement(selector)
  if (existing) {
    return Promise.resolve(existing)
  }

  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs

    const attempt = () => {
      const element = queryTutorialElement(selector)
      if (element) {
        resolve(element)
        return
      }
      if (Date.now() >= deadline) {
        resolve(undefined)
        return
      }
      window.requestAnimationFrame(attempt)
    }

    attempt()
  })
}
