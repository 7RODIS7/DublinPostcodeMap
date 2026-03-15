import { districtMeta } from '../data/districtMeta'
import type { PostalFeature, PostalFeatureCollection } from '../types/districts'

export const districtMetaById = Object.fromEntries(
  districtMeta.map((district) => [district.id, district]),
)

export function normalizeDistrictName(name: string): string {
  const compact = name.replace(/\s+/g, ' ').trim()
  const match = compact.match(/^dublin\s+(\d{1,2})\s*(w)?$/i)
  if (!match) {
    return compact
  }

  const suffix = match[2] ? 'W' : ''
  return `Dublin ${match[1]}${suffix}`
}

export function districtNameToId(name: string): string | null {
  const normalized = normalizeDistrictName(name)
  const match = normalized.match(/^Dublin\s+(\d{1,2})(W)?$/)

  if (!match) {
    return null
  }

  const suffix = match[2] ? 'w' : ''
  return `dublin-${match[1]}${suffix}`
}

export function normalizePostalFeatureCollection(
  rawData: PostalFeatureCollection,
): PostalFeatureCollection {
  const uniqueFeatures = new Map<string, PostalFeature>()

  for (const feature of rawData.features) {
    const explicitId =
      typeof feature.properties?.id === 'string' ? feature.properties.id : null

    if (explicitId && districtMetaById[explicitId]) {
      const district = districtMetaById[explicitId]

      uniqueFeatures.set(explicitId, {
        ...feature,
        properties: {
          ...feature.properties,
          id: explicitId,
          name: district.name,
          zoneType: district.zoneType,
          isApproximate:
            feature.properties?.isApproximate ?? (district.zoneType === 'routing-key'),
        },
      })
      continue
    }

    const rawName = typeof feature.properties?.name === 'string' ? feature.properties.name : ''
    const normalizedName = normalizeDistrictName(rawName)
    const districtId = districtNameToId(normalizedName)

    if (!districtId || !districtMetaById[districtId]) {
      continue
    }

    uniqueFeatures.set(districtId, {
      ...feature,
      properties: {
        ...feature.properties,
        id: districtId,
        name: normalizedName,
        zoneType: districtMetaById[districtId].zoneType,
        isApproximate: false,
      },
    })
  }

  return {
    ...rawData,
    features: Array.from(uniqueFeatures.values()).sort((left, right) => {
      const leftOrder = districtMetaById[left.properties.id]?.sortOrder ?? Infinity
      const rightOrder = districtMetaById[right.properties.id]?.sortOrder ?? Infinity
      return leftOrder - rightOrder
    }),
  }
}
