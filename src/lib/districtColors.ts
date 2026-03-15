import { districtMeta } from '../data/districtMeta'

const districtPalette = [
  '#d95f4f',
  '#c8642a',
  '#b98a20',
  '#8e9f27',
  '#519a55',
  '#1d9c79',
  '#1c8e95',
  '#2786b7',
  '#426fd0',
  '#655fd5',
  '#8d5fc4',
  '#b85ea7',
  '#cc5c82',
  '#d06d61',
  '#cb8554',
  '#af9652',
  '#7ea05e',
  '#489876',
  '#348e90',
  '#2f7ca1',
  '#4b6cb2',
  '#775ca6',
  '#3f7d6b',
  '#2e93a0',
  '#6b8f23',
  '#c2782d',
  '#a75f73',
  '#4a6fb3',
  '#8f6c42',
  '#4c8c7a',
  '#a3533d',
  '#587fbd',
  '#7a6aa8',
  '#2f8f57',
] as const

const districtColorById = Object.fromEntries(
  districtMeta.map((district, index) => [district.id, districtPalette[index]]),
)

export function getDistrictColor(districtId: string): string {
  return districtColorById[districtId] ?? '#5f7c7a'
}
