export const ASSET_LIST_ROW_GRID_CLASS =
  'grid w-full grid-cols-[9.5rem_1rem_11rem_1rem] items-center gap-x-1.5'

/** Matches ResourceListItemCard action buttons: edit, map, expand. */
export const ASSET_LIST_ACTIONS_SPACER_CLASS = 'w-[6.5rem] shrink-0'

type AssetListHeaderRowProps = {
  showActionSpacer?: boolean
}

export function AssetListHeaderRow({ showActionSpacer = true }: AssetListHeaderRowProps) {
  return (
    <div className="flex items-center gap-2 px-3 pb-1 pt-0.5">
      <div className="min-w-0 flex-1">
        <div className={ASSET_LIST_ROW_GRID_CLASS} role="row">
          <span
            className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            role="columnheader"
          >
            Asset ID
          </span>
          <span
            className="col-span-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            role="columnheader"
          >
            Asset Status
          </span>
        </div>
      </div>
      {showActionSpacer ? <div className={ASSET_LIST_ACTIONS_SPACER_CLASS} aria-hidden /> : null}
    </div>
  )
}
