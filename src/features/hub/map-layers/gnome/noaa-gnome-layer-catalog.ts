export type NoaaGnomeLayerDefinition = {
  id: 'noaa-gnome'
  label: string
  description: string
}

export const NOAA_GNOME_LAYER_ID = 'noaa-gnome' as const

export const NOAA_GNOME_LAYER_DEFINITION: NoaaGnomeLayerDefinition = {
  id: NOAA_GNOME_LAYER_ID,
  label: 'NOAA GNOME',
  description:
    'PyGNOME-style demo oil spill particle trajectory near the Mississippi River Delta (New Orleans).',
}

export function isNoaaGnomeLayerId(value: string): value is typeof NOAA_GNOME_LAYER_ID {
  return value === NOAA_GNOME_LAYER_ID
}
