import type { UserPointIconKey } from '../types/districts'

type UserPointIconDefinition = {
  key: UserPointIconKey
  label: string
  color: string
  background: string
  svg: string
}

export const userPointIconOptions: UserPointIconDefinition[] = [
  {
    key: 'home',
    label: 'Home',
    color: '#115847',
    background: '#d8f0e7',
    svg: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.7 7.2 8 3l5.3 4.2v5.1a1 1 0 0 1-1 1H9.7V9.7H6.3v3.6H3.7a1 1 0 0 1-1-1V7.2Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.25"/></svg>',
  },
  {
    key: 'work',
    label: 'Work',
    color: '#204f7e',
    background: '#dbeafb',
    svg: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.6 5.2c0-.9.7-1.6 1.6-1.6h7.6c.9 0 1.6.7 1.6 1.6v6.1c0 .7-.5 1.2-1.2 1.2H3.8c-.7 0-1.2-.5-1.2-1.2V5.2Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.2"/><path d="M6 3.6v-1c0-.3.3-.6.6-.6h2.8c.3 0 .6.3.6.6v1M2.6 7.3h10.8" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.2"/></svg>',
  },
  {
    key: 'pin',
    label: 'Point',
    color: '#9b4d24',
    background: '#fce4d8',
    svg: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 14c-2.4-2.8-3.8-5.1-3.8-7A3.8 3.8 0 0 1 8 3.2 3.8 3.8 0 0 1 11.8 7c0 1.9-1.4 4.2-3.8 7Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.2"/><circle cx="8" cy="7" r="1.3" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
  },
  {
    key: 'heart',
    label: 'Favorite',
    color: '#8b2552',
    background: '#fde1ee',
    svg: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13.5 3.3 9.1A2.9 2.9 0 0 1 7.8 5.4L8 5.7l.2-.3a2.9 2.9 0 0 1 4.5 3.7L8 13.5Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.2"/></svg>',
  },
  {
    key: 'star',
    label: 'Shortlist',
    color: '#8a6100',
    background: '#f7edbf',
    svg: '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m8 2.4 1.7 3.5 3.8.6-2.7 2.6.7 3.7L8 11l-3.5 1.8.7-3.7-2.7-2.6 3.8-.6L8 2.4Z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.2"/></svg>',
  },
]

export const userPointIconKeys = userPointIconOptions.map((option) => option.key)

export const userPointIconsByKey = Object.fromEntries(
  userPointIconOptions.map((option) => [option.key, option]),
) as Record<UserPointIconKey, UserPointIconDefinition>

export function isUserPointIconKey(value: unknown): value is UserPointIconKey {
  return typeof value === 'string' && value in userPointIconsByKey
}

export function getUserPointIconDefinition(
  iconKey: UserPointIconKey,
): UserPointIconDefinition {
  return userPointIconsByKey[iconKey]
}
