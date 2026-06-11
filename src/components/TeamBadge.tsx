import { getTeamFlag } from '@/lib/teamMeta'

type TeamBadgeProps = {
  team: string
  className?: string
}

export default function TeamBadge({ team, className = '' }: TeamBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="text-xl leading-none">{getTeamFlag(team)}</span>
      <span>{team}</span>
    </span>
  )
}
