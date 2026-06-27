type ArcGisLoadable = {
  load?: () => Promise<unknown>
}

export function isArcGisAbortError(error: unknown): boolean {
  if (error === null || typeof error !== 'object') {
    return false
  }
  const candidate = error as { name?: string; message?: string; type?: string }
  return (
    candidate.name === 'AbortError' ||
    candidate.type === 'error' && /abort/i.test(candidate.message ?? '') ||
    /abort/i.test(candidate.message ?? '')
  )
}

export function voidArcGisWhen(whenable: { when?: () => Promise<unknown> } | null | undefined) {
  if (!whenable || typeof whenable.when !== 'function') {
    return
  }
  void whenable.when().catch((error) => {
    if (!isArcGisAbortError(error)) {
      console.warn('ArcGIS when() failed', error)
    }
  })
}

export function voidArcGisLoad(loadable: ArcGisLoadable | null | undefined) {
  if (!loadable || typeof loadable.load !== 'function') {
    return
  }
  void loadable.load().catch((error) => {
    if (!isArcGisAbortError(error)) {
      console.warn('ArcGIS load failed', error)
    }
  })
}

export function voidArcGisMapLoads(map: { basemap?: ArcGisLoadable | null; layers?: Iterable<ArcGisLoadable> } | null | undefined) {
  if (!map) {
    return
  }
  voidArcGisLoad(map.basemap ?? undefined)
  if (map.layers) {
    for (const layer of map.layers) {
      voidArcGisLoad(layer)
    }
  }
}

export function safeDestroyMapView(view: { destroyed?: boolean; destroy?: () => void } | null | undefined) {
  if (!view || view.destroyed || typeof view.destroy !== 'function') {
    return
  }
  try {
    view.destroy()
  } catch (error) {
    if (!isArcGisAbortError(error)) {
      console.warn('MapView destroy failed', error)
    }
  }
}

let arcGisAbortRejectionGuardInstalled = false

export function installArcGisAbortRejectionGuard() {
  if (arcGisAbortRejectionGuardInstalled || typeof window === 'undefined') {
    return
  }
  arcGisAbortRejectionGuardInstalled = true
  window.addEventListener('unhandledrejection', (event) => {
    if (isArcGisAbortError(event.reason)) {
      event.preventDefault()
    }
  })
}
