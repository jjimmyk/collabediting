import Graphic from '@arcgis/core/Graphic'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import { verticesToClosedRing } from '@/features/ics201/map-sketch-geometry'
import type { Ics201FormState, Ics201MapSketchVertex } from '@/features/ics201/types'
import { isArcGisAbortError, safeDestroyMapView } from '@/lib/arcgis-load-abort'

export async function captureMapSketchPngForForm(
  form: Ics201FormState
): Promise<Uint8Array | null> {
  return captureIcs201MapSketchPng(form.mapSketchPolygon)
}

const CAPTURE_WIDTH = 800
const CAPTURE_HEIGHT = 600
const CAPTURE_TIMEOUT_MS = 15_000
const MIN_PNG_BYTES = 1_024

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms)
  })
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(() => {
      reject(new Error(message))
    }, timeoutMs)

    void promise
      .then((value) => {
        globalThis.clearTimeout(timer)
        resolve(value)
      })
      .catch((error: unknown) => {
        globalThis.clearTimeout(timer)
        reject(error)
      })
  })
}

async function waitForViewReady(view: MapView): Promise<void> {
  await view.when()
  let attempts = 0
  while (view.updating && attempts < 60) {
    await sleep(100)
    attempts += 1
  }
}

async function screenshotDataUrlToPng(dataUrl: string): Promise<Uint8Array | null> {
  const response = await fetch(dataUrl)
  if (!response.ok) return null
  return new Uint8Array(await response.arrayBuffer())
}

export async function captureIcs201MapSketchPng(
  vertices: Ics201MapSketchVertex[]
): Promise<Uint8Array | null> {
  if (vertices.length < 3) return null

  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.left = '-10000px'
  container.style.top = '0'
  container.style.width = `${CAPTURE_WIDTH}px`
  container.style.height = `${CAPTURE_HEIGHT}px`
  container.style.opacity = '0'
  container.style.pointerEvents = 'none'
  document.body.appendChild(container)

  let view: MapView | null = null
  try {
    const sketchLayer = new GraphicsLayer({ listMode: 'hide' })
    const ring = verticesToClosedRing(vertices)
    const graphic = new Graphic({
      geometry: {
        type: 'polygon',
        rings: [ring],
      },
      symbol: {
        type: 'simple-fill',
        color: [37, 99, 235, 0.18],
        outline: {
          color: [37, 99, 235, 1],
          width: 2,
        },
      },
    })
    sketchLayer.add(graphic)

    const map = new Map({
      basemap: 'streets-navigation-vector',
      layers: [sketchLayer],
    })

    view = new MapView({
      container,
      map,
      ui: { components: [] },
      constraints: { rotationEnabled: false },
    })

    await withTimeout(view.when(), CAPTURE_TIMEOUT_MS, 'ICS-201 map sketch view failed to initialize')
    const geometry = graphic.geometry
    const goToTarget =
      geometry && 'extent' in geometry && geometry.extent
        ? geometry.extent.expand(1.35)
        : graphic
    await withTimeout(
      view.goTo(goToTarget),
      CAPTURE_TIMEOUT_MS,
      'ICS-201 map sketch zoom timed out'
    )
    await waitForViewReady(view)

    const screenshot = await withTimeout(
      view.takeScreenshot({
        format: 'png',
        width: CAPTURE_WIDTH,
        height: CAPTURE_HEIGHT,
      }),
      CAPTURE_TIMEOUT_MS,
      'ICS-201 map sketch screenshot timed out'
    )

    const png = await screenshotDataUrlToPng(screenshot.dataUrl)
    if (!png || png.byteLength < MIN_PNG_BYTES) return null
    return png
  } catch (error) {
    if (!isArcGisAbortError(error)) {
      console.warn('ICS-201 map sketch capture failed', error)
    }
    return null
  } finally {
    safeDestroyMapView(view)
    container.remove()
  }
}
