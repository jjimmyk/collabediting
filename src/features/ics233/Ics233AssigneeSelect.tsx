import {
  ICS233_ASSIGNMENT_OPTION_GROUPS,
  type Ics233AssignmentOption,
} from '@/lib/ics233-workflow'

type Ics233AssigneeSelectProps = {
  value: string
  options: Ics233AssignmentOption[]
  onChange: (value: string) => void
  className?: string
  autoFocus?: boolean
  onBlur?: () => void
  onClick?: (event: React.MouseEvent<HTMLSelectElement>) => void
}

export function Ics233AssigneeSelect({
  value,
  options,
  onChange,
  className = 'h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none',
  autoFocus,
  onBlur,
  onClick,
}: Ics233AssigneeSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onBlur={onBlur}
      onClick={onClick}
      className={className}
      autoFocus={autoFocus}
    >
      {ICS233_ASSIGNMENT_OPTION_GROUPS.map((group) => (
        <optgroup key={group} label={group}>
          {options
            .filter((option) => option.group === group)
            .map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
        </optgroup>
      ))}
    </select>
  )
}
