import type { MultiPolygon, Polygon } from 'geojson'
import type L from 'leaflet'
import polylabel from 'polylabel'
import type { PostalFeature } from '../types/districts'

const LABEL_PRECISION = 0.00001

function getRingArea(ring: number[][]): number {
  let area = 0

  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index]
    const [x2, y2] = ring[index + 1]
    area += x1 * y2 - x2 * y1
  }

  return Math.abs(area / 2)
}

function getPolygonArea(polygon: number[][][]): number {
  return polygon.reduce((sum, ring) => sum + getRingArea(ring), 0)
}

export function getBestPolygon(geometry: Polygon | MultiPolygon): number[][][] {
  if (geometry.type === 'Polygon') {
    return geometry.coordinates as number[][][]
  }

  const polygons = geometry.coordinates as number[][][][]
  return polygons.reduce((bestPolygon, polygon) =>
    getPolygonArea(polygon) > getPolygonArea(bestPolygon) ? polygon : bestPolygon,
  )
}

export function getFeatureLabelPlacement(feature: PostalFeature): {
  position: L.LatLngExpression
  coordinates: [number, number]
  distance: number
} {
  const polygon = getBestPolygon(feature.geometry)
  const point = polylabel(polygon, LABEL_PRECISION)
  const coordinates: [number, number] = [point[1], point[0]]

  return {
    position: coordinates,
    coordinates,
    distance: point.distance ?? 0,
  }
}

export function getPolygonBounds(polygon: number[][][]): [[number, number], [number, number]] {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  for (const ring of polygon) {
    for (const [lng, lat] of ring) {
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
    }
  }

  return [
    [minLat, minLng],
    [maxLat, maxLng],
  ]
}

export function getFeatureFocusBounds(feature: PostalFeature): [[number, number], [number, number]] {
  return getPolygonBounds(getBestPolygon(feature.geometry))
}

export function getBoundsCenter(bounds: [[number, number], [number, number]]): [number, number] {
  const [[south, west], [north, east]] = bounds
  return [(south + north) / 2, (west + east) / 2]
}

export function estimateGoogleMapsZoom(bounds: [[number, number], [number, number]]): number {
  const [[south, west], [north, east]] = bounds
  const latSpan = Math.abs(north - south)
  const lngSpan = Math.abs(east - west)
  const maxSpan = Math.max(latSpan, lngSpan)

  if (maxSpan >= 0.24) {
    return 11
  }

  if (maxSpan >= 0.12) {
    return 12
  }

  if (maxSpan >= 0.06) {
    return 13
  }

  if (maxSpan >= 0.03) {
    return 14
  }

  return 15
}

function pointInRing(point: [number, number], ring: number[][]): boolean {
  const [lat, lng] = point
  let inside = false

  for (
    let index = 0, previous = ring.length - 1;
    index < ring.length;
    previous = index, index += 1
  ) {
    const x1 = ring[index][0]
    const y1 = ring[index][1]
    const x2 = ring[previous][0]
    const y2 = ring[previous][1]

    const intersects =
      (y1 > lat) !== (y2 > lat) &&
      lng < ((x2 - x1) * (lat - y1)) / (y2 - y1) + x1

    if (intersects) {
      inside = !inside
    }
  }

  return inside
}

function pointInPolygon(point: [number, number], polygon: number[][][]): boolean {
  if (!pointInRing(point, polygon[0])) {
    return false
  }

  for (let index = 1; index < polygon.length; index += 1) {
    if (pointInRing(point, polygon[index])) {
      return false
    }
  }

  return true
}

export function pointInGeometry(
  point: [number, number],
  geometry: Polygon | MultiPolygon,
): boolean {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates as number[][][])
  }

  return (geometry.coordinates as number[][][][]).some((polygon) =>
    pointInPolygon(point, polygon),
  )
}

export function findFeatureAtPoint(
  features: PostalFeature[],
  point: [number, number],
): PostalFeature | null {
  return features.find((feature) => pointInGeometry(point, feature.geometry)) ?? null
}
