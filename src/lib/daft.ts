import type { DistrictMetadata } from '../types/districts'

const DAFT_BASE_URL = 'https://www.daft.ie'

type DaftRentTarget = {
  slug: string
  targetName: string
}

export type DistrictDaftRentLink = {
  url: string
  targetName: string
}

const routingKeyRentTargetsById: Record<string, DaftRentTarget> = {
  'routing-a94': {
    slug: 'blackrock-dublin',
    targetName: 'Blackrock, Dublin',
  },
  'routing-a96': {
    slug: 'dun-laoghaire-dublin',
    targetName: 'Dun Laoghaire, Dublin',
  },
  'routing-k32': {
    slug: 'balbriggan-dublin',
    targetName: 'Balbriggan, Dublin',
  },
  'routing-k34': {
    slug: 'skerries-dublin',
    targetName: 'Skerries, Dublin',
  },
  'routing-k36': {
    slug: 'malahide-dublin',
    targetName: 'Malahide, Dublin',
  },
  'routing-k45': {
    slug: 'lusk-dublin',
    targetName: 'Lusk, Dublin',
  },
  'routing-k56': {
    slug: 'rush-dublin',
    targetName: 'Rush, Dublin',
  },
  'routing-k67': {
    slug: 'swords-dublin',
    targetName: 'Swords, Dublin',
  },
  'routing-k78': {
    slug: 'lucan-dublin',
    targetName: 'Lucan, Dublin',
  },
  'routing-a41': {
    slug: 'ballyboughal-dublin',
    targetName: 'Ballyboughal, Dublin',
  },
  'routing-a42': {
    slug: 'garristown-dublin',
    targetName: 'Garristown, Dublin',
  },
  'routing-a45': {
    slug: 'oldtown-dublin',
    targetName: 'Oldtown, Dublin',
  },
}

function slugifyDaftPathSegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function createDistrictDaftRentLink(
  district: Pick<DistrictMetadata, 'id' | 'name' | 'zoneType'>,
): DistrictDaftRentLink | null {
  if (district.zoneType === 'legacy-district') {
    const slug = `${slugifyDaftPathSegment(district.name)}-dublin`

    return {
      url: `${DAFT_BASE_URL}/property-for-rent/${slug}`,
      targetName: district.name,
    }
  }

  const target = routingKeyRentTargetsById[district.id]
  if (!target) {
    return null
  }

  return {
    url: `${DAFT_BASE_URL}/property-for-rent/${target.slug}`,
    targetName: target.targetName,
  }
}
