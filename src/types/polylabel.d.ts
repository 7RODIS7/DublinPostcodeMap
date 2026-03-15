declare module 'polylabel' {
  export type PolylabelPoint = [number, number] & {
    distance?: number
  }

  export default function polylabel(
    polygon: number[][][],
    precision?: number,
  ): PolylabelPoint
}
