import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ConsequenceEngineMapEmbed } from '@/features/hub/fusion-centers/ConsequenceEngineMapEmbed'

type FusionCascadingImpactsEmbedProps = {
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}

export function FusionCascadingImpactsEmbed({
  visible,
  onVisibleChange,
}: FusionCascadingImpactsEmbedProps) {
  return (
    <div className="mt-4 space-y-2 border-t pt-3">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor="fusion-cascade-impacts" className="text-sm font-medium">
          View Cascading Impacts
        </Label>
        <Switch
          id="fusion-cascade-impacts"
          checked={visible}
          onCheckedChange={onVisibleChange}
          aria-label="View Cascading Impacts"
        />
      </div>
      {visible ? <ConsequenceEngineMapEmbed enabled={visible} /> : null}
      <p className="text-[11px] text-muted-foreground">
        Consequence engine projection from Port of Houston cyber incident hub.
      </p>
    </div>
  )
}
