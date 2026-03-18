import type {
  Feature,
  FeatureCollection,
  LineString,
  MultiLineString,
  MultiPolygon,
  Polygon,
} from 'geojson'

export type PostalFeatureProperties = {
  id: string
  name: string
  zoneType: PostalAreaKind
  isApproximate?: boolean
  boundary?: string
  sourceId?: string
  sourceType?: string
  sourceName?: string
}

export type PostalFeature = Feature<Polygon | MultiPolygon, PostalFeatureProperties>
export type PostalFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  PostalFeatureProperties
>

export type PostalAreaKind = 'legacy-district' | 'routing-key'
export type TransportLayerKey = 'rail' | 'luas' | 'bus' | 'metro'

export type DistrictMetadata = {
  id: string
  name: string
  shortName: string
  sortOrder: number
  zoneType: PostalAreaKind
  boundaryNote?: string
  aliases: string[]
  highlights: string[]
  ratings: DistrictRatings
}

export type DistrictGrade = 'A' | 'B' | 'C' | 'D'
export type DistrictMetricKey =
  | 'safety'
  | 'transit'
  | 'parks'
  | 'schools'
  | 'amenities'
  | 'value'
export type DistrictLifestyleTag =
  | 'family-friendly'
  | 'quiet'
  | 'walkable'
  | 'no-car-friendly'
  | 'coastal'
  | 'village-feel'
  | 'mixed'
export type DistrictSortMode =
  | 'postal'
  | 'overall'
  | 'safety'
  | 'transit'
  | 'parks'
  | 'schools'
  | 'amenities'
  | 'value'
export type MapLabelMode = 'compact' | 'extended'

export type DistrictRatings = {
  overall: DistrictGrade
  summary: string
  metrics: Record<DistrictMetricKey, number>
}

export type DistrictSubarea = {
  id: string
  name: string
  districtId: string
  kind: 'neighborhood' | 'street' | 'point'
  coordinates?: [number, number]
  note?: string
  zoom?: number
}

export type DistrictWithSubareas = DistrictMetadata & {
  lifestyleTags: DistrictLifestyleTag[]
  subareas: DistrictSubarea[]
}

export type TransportFeatureProperties = {
  id: string
  network: TransportLayerKey
  label: string
  operator: string
  routeShortName: string
  routeLongName: string
  color: string
  status?: 'operational' | 'planned'
  note?: string
  constructionType?: string
}

export type TransportFeature = Feature<
  LineString | MultiLineString,
  TransportFeatureProperties
>
export type TransportFeatureCollection = FeatureCollection<
  LineString | MultiLineString,
  TransportFeatureProperties
>
export type TransportLayerVisibility = Record<TransportLayerKey, boolean>

export type FocusRequest =
  | {
      kind: 'reset'
      nonce: number
    }
  | {
      kind: 'district'
      districtId: string
      nonce: number
    }
  | {
      kind: 'subarea'
      districtId: string
      subareaId: string
      coordinates: [number, number]
      zoom?: number
      nonce: number
    }
  | {
      kind: 'coordinates'
      coordinates: [number, number]
      zoom?: number
      nonce: number
    }
