/** Outer sticky card chrome — apply to wrapper, not inner status banners. */
export const ICS_FORM_STICKY_CHROME_CLASS =
  'sticky top-0 z-10 space-y-3 rounded-md border bg-card/95 p-3 backdrop-blur-sm'

export const ICS_FORM_STATUS_EMERALD_CLASS =
  'rounded-md border border-emerald-400 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-500 dark:bg-emerald-500/10 dark:text-emerald-200'

export const ICS_FORM_STATUS_AMBER_CLASS =
  'rounded-md border border-amber-400 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500 dark:bg-amber-500/10 dark:text-amber-200'

/** @deprecated Use ICS_FORM_STICKY_CHROME_CLASS on the outer wrapper instead. */
export const ICS_FORM_STICKY_STATUS_CLASS = ICS_FORM_STICKY_CHROME_CLASS
