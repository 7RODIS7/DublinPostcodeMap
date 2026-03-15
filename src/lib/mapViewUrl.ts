export type SharedMapView = {
  center: [number, number]
  zoom: number
}

const LAT_PARAM = 'lat'
const LNG_PARAM = 'lng'
const ZOOM_PARAM = 'z'

function isFiniteInRange(value: number, min: number, max: number): boolean {
  return Number.isFinite(value) && value >= min && value <= max
}

export function parseSharedMapView(urlLike: string): SharedMapView | null {
  try {
    const url = new URL(urlLike)
    const lat = Number(url.searchParams.get(LAT_PARAM))
    const lng = Number(url.searchParams.get(LNG_PARAM))
    const zoom = Number(url.searchParams.get(ZOOM_PARAM))

    if (
      !isFiniteInRange(lat, -90, 90) ||
      !isFiniteInRange(lng, -180, 180) ||
      !isFiniteInRange(zoom, 1, 22)
    ) {
      return null
    }

    return {
      center: [lat, lng],
      zoom,
    }
  } catch {
    return null
  }
}

export function createSharedMapViewUrl(
  urlLike: string,
  center: [number, number],
  zoom: number,
): string {
  const url = new URL(urlLike)
  url.searchParams.set(LAT_PARAM, center[0].toFixed(5))
  url.searchParams.set(LNG_PARAM, center[1].toFixed(5))
  url.searchParams.set(ZOOM_PARAM, String(Math.round(zoom * 100) / 100))
  url.hash = ''
  return url.toString()
}
