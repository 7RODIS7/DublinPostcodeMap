import { getUserPointIconDefinition } from '../lib/userPoints'
import type { UserPointIconKey } from '../types/districts'

type UserPointIconProps = {
  iconKey: UserPointIconKey
  className?: string
}

export function UserPointIcon({ iconKey, className }: UserPointIconProps) {
  const icon = getUserPointIconDefinition(iconKey)

  return (
    <span
      aria-hidden="true"
      className={className}
      dangerouslySetInnerHTML={{ __html: icon.svg }}
    />
  )
}
