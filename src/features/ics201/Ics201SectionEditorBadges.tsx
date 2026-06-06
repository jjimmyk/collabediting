import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { Ics201CollaboratorPresence } from '@/features/ics201/types'

type Ics201SectionEditorBadgesProps = {
  editors: Ics201CollaboratorPresence[]
}

export function Ics201SectionEditorBadges({ editors }: Ics201SectionEditorBadgesProps) {
  if (editors.length === 0) {
    return null
  }

  return (
    <TooltipProvider delayDuration={150}>
      {editors.map((editor) => (
        <Tooltip key={editor.id}>
          <TooltipTrigger asChild>
            <div
              className="flex h-5 w-5 cursor-default items-center justify-center rounded-full border-2 border-background text-[9px] font-semibold text-white"
              style={{ backgroundColor: editor.color }}
              aria-label={`${editor.position} ${editor.email} is editing this section`}
            >
              {editor.initials}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <div className="font-medium">{editor.position}</div>
            <div className="opacity-80">{editor.email}</div>
            <div className="opacity-80">Editing this section</div>
          </TooltipContent>
        </Tooltip>
      ))}
    </TooltipProvider>
  )
}
