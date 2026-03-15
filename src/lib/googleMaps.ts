import type { DistrictMetadata, DistrictSubarea } from '../types/districts'

function createGoogleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

function createGoogleMapsAreaUrl(
  coordinates: [number, number],
  zoom: number,
): string {
  const [lat, lng] = coordinates
  return `https://www.google.com/maps/@?api=1&map_action=map&center=${lat},${lng}&zoom=${zoom}`
}

function getHumanAlias(district: Pick<DistrictMetadata, 'aliases' | 'name' | 'shortName'>): string | null {
  return (
    district.aliases.find((alias) => {
      const normalized = alias.trim().toLowerCase()
      return (
        normalized !== district.name.trim().toLowerCase() &&
        normalized !== district.shortName.trim().toLowerCase()
      )
    }) ?? null
  )
}

export function createDistrictGoogleMapsUrl(
  district: Pick<DistrictMetadata, 'name' | 'shortName' | 'aliases' | 'zoneType'>,
  options?: {
    center?: [number, number]
    zoom?: number
  },
): string {
  if (options?.center) {
    return createGoogleMapsAreaUrl(options.center, options.zoom ?? 13)
  }

  const humanAlias = getHumanAlias(district)

  if (district.zoneType === 'routing-key') {
    const query = [district.name, humanAlias, 'County Dublin', 'Ireland']
      .filter(Boolean)
      .join(', ')

    return createGoogleMapsSearchUrl(query)
  }

  return createGoogleMapsSearchUrl(`${district.name}, Dublin, Ireland`)
}

export function createSubareaGoogleMapsUrl(
  subarea: Pick<DistrictSubarea, 'name' | 'coordinates' | 'zoom'>,
  district: Pick<DistrictMetadata, 'name' | 'shortName' | 'zoneType'>,
): string {
  if (subarea.coordinates) {
    return createGoogleMapsAreaUrl(subarea.coordinates, subarea.zoom ?? 16)
  }

  const query = [
    subarea.name,
    district.zoneType === 'routing-key' ? district.shortName : district.name,
    'Dublin',
    'Ireland',
  ]
    .filter(Boolean)
    .join(', ')

  return createGoogleMapsSearchUrl(query)
}
