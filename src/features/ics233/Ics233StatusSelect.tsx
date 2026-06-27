import {
  getIcs233AssigneeStatusSelectOptions,
  ICS233_ALL_STATUS_OPTIONS,
  type Ics233ActionStatus,
} from '@/lib/ics233-workflow'

type Ics233StatusSelectProps = {
  value: Ics233ActionStatus
  isAssignedToCurrentUser: boolean
  onChange: (status: Ics233ActionStatus) => void
  className?: string
  autoFocus?: boolean
  onBlur?: () => void
  onClick?: (event: React.MouseEvent<HTMLSelectElement>) => void
}

export function Ics233StatusSelect({
  value,
  isAssignedToCurrentUser,
  onChange,
  className = 'h-8 w-full rounded-md border bg-transparent px-2 text-xs outline-none',
  autoFocus,
  onBlur,
  onClick,
}: Ics233StatusSelectProps) {
  const options = isAssignedToCurrentUser
    ? getIcs233AssigneeStatusSelectOptions(value)
    : ICS233_ALL_STATUS_OPTIONS

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as Ics233ActionStatus)}
      onBlur={onBlur}
      onClick={onClick}
      className={className}
      autoFocus={autoFocus}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}
