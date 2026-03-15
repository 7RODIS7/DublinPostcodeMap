import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { DOMParser } from '@xmldom/xmldom'
import { kml as kmlToGeoJSON } from '@tmcw/togeojson'

const legacyDistrictConfigs = [
  { id: 'dublin-1', code: 'D01', name: 'Dublin 1' },
  { id: 'dublin-2', code: 'D02', name: 'Dublin 2' },
  { id: 'dublin-3', code: 'D03', name: 'Dublin 3' },
  { id: 'dublin-4', code: 'D04', name: 'Dublin 4' },
  { id: 'dublin-5', code: 'D05', name: 'Dublin 5' },
  { id: 'dublin-6', code: 'D06', name: 'Dublin 6' },
  { id: 'dublin-6w', code: 'D6W', name: 'Dublin 6W' },
  { id: 'dublin-7', code: 'D07', name: 'Dublin 7' },
  { id: 'dublin-8', code: 'D08', name: 'Dublin 8' },
  { id: 'dublin-9', code: 'D09', name: 'Dublin 9' },
  { id: 'dublin-10', code: 'D10', name: 'Dublin 10' },
  { id: 'dublin-11', code: 'D11', name: 'Dublin 11' },
  { id: 'dublin-12', code: 'D12', name: 'Dublin 12' },
  { id: 'dublin-13', code: 'D13', name: 'Dublin 13' },
  { id: 'dublin-14', code: 'D14', name: 'Dublin 14' },
  { id: 'dublin-15', code: 'D15', name: 'Dublin 15' },
  { id: 'dublin-16', code: 'D16', name: 'Dublin 16' },
  { id: 'dublin-17', code: 'D17', name: 'Dublin 17' },
  { id: 'dublin-18', code: 'D18', name: 'Dublin 18' },
  { id: 'dublin-20', code: 'D20', name: 'Dublin 20' },
  { id: 'dublin-22', code: 'D22', name: 'Dublin 22' },
  { id: 'dublin-24', code: 'D24', name: 'Dublin 24' },
]

const routingKeyConfigs = [
  { id: 'routing-a94', code: 'A94' },
  { id: 'routing-a96', code: 'A96' },
  { id: 'routing-k32', code: 'K32' },
  { id: 'routing-k34', code: 'K34' },
  { id: 'routing-k36', code: 'K36' },
  { id: 'routing-k45', code: 'K45' },
  { id: 'routing-k56', code: 'K56' },
  { id: 'routing-k67', code: 'K67' },
  { id: 'routing-k78', code: 'K78' },
  { id: 'routing-a41', code: 'A41' },
  { id: 'routing-a42', code: 'A42' },
  { id: 'routing-a45', code: 'A45' },
]

const expectedAreas = [
  ...legacyDistrictConfigs.map((config) => ({
    ...config,
    zoneType: 'legacy-district',
    isApproximate: false,
  })),
  ...routingKeyConfigs.map((config) => ({
    ...config,
    name: config.code,
    zoneType: 'routing-key',
    isApproximate: true,
  })),
]

const areaConfigByCode = new Map(expectedAreas.map((area) => [area.code, area]))
const routingKeyKmlUrl =
  'https://www.google.com/maps/d/kml?mid=1ObFwqV2vtigkclpjea3sUHNhUuw&forcekml=1'
const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(currentDirectory, '..')
const routingKeyKmlPath = path.join(repositoryRoot, 'data', 'raw', 'eircode-routing-keys.kml')
const geoJsonOutputPath = path.join(
  repositoryRoot,
  'public',
  'data',
  'dublin-postal-areas.geojson',
)

function normalizeAreaCode(code) {
  const compact = String(code ?? '').replace(/\s+/g, '').trim().toUpperCase()

  if (/^D[1-9]$/.test(compact)) {
    return `D0${compact.slice(1)}`
  }

  return compact
}

function getRingArea(ring) {
  let area = 0

  for (let index = 0; index < ring.length - 1; index += 1) {
    const [x1, y1] = ring[index]
    const [x2, y2] = ring[index + 1]
    area += x1 * y2 - x2 * y1
  }

  return Math.abs(area / 2)
}

function estimateArea(geometry) {
  if (!geometry) {
    return 0
  }

  if (geometry.type === 'Polygon') {
    return geometry.coordinates.reduce((sum, ring) => sum + getRingArea(ring), 0)
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.reduce(
      (sum, polygon) => sum + polygon.reduce((ringSum, ring) => ringSum + getRingArea(ring), 0),
      0,
    )
  }

  return 0
}

function toPolygonalGeometry(geometry) {
  if (!geometry) {
    return null
  }

  if (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon') {
    return geometry
  }

  if (geometry.type !== 'GeometryCollection') {
    return null
  }

  const polygons = []

  for (const nestedGeometry of geometry.geometries ?? []) {
    const polygonal = toPolygonalGeometry(nestedGeometry)

    if (!polygonal) {
      continue
    }

    if (polygonal.type === 'Polygon') {
      polygons.push(polygonal.coordinates)
      continue
    }

    polygons.push(...polygonal.coordinates)
  }

  if (polygons.length === 0) {
    return null
  }

  if (polygons.length === 1) {
    return {
      type: 'Polygon',
      coordinates: polygons[0],
    }
  }

  return {
    type: 'MultiPolygon',
    coordinates: polygons,
  }
}

function pickPreferredFeature(currentFeature, nextFeature) {
  if (!currentFeature) {
    return nextFeature
  }

  return estimateArea(nextFeature.geometry) > estimateArea(currentFeature.geometry)
    ? nextFeature
    : currentFeature
}

async function fetchPostalAreaKml() {
  const response = await fetch(routingKeyKmlUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Postal area KML request failed with ${response.status} ${response.statusText}`)
  }

  return response.text()
}

function extractPostalAreaFeatures(kmlText) {
  const xmlDocument = new DOMParser().parseFromString(kmlText, 'text/xml')
  const geoJson = kmlToGeoJSON(xmlDocument)
  const uniqueFeatures = new Map()

  for (const feature of geoJson.features) {
    const polygonalGeometry = toPolygonalGeometry(feature.geometry)

    if (!polygonalGeometry || !feature.properties) {
      continue
    }

    const code = normalizeAreaCode(feature.properties.name)
    const areaConfig = areaConfigByCode.get(code)

    if (!areaConfig) {
      continue
    }

    const cleanedFeature = {
      type: 'Feature',
      id: `postal-area/${code}`,
      properties: {
        id: areaConfig.id,
        name: areaConfig.name,
        zoneType: areaConfig.zoneType,
        isApproximate: areaConfig.isApproximate,
        boundary: areaConfig.zoneType === 'routing-key' ? 'routing_key' : 'postal_district',
        sourceId: code,
        sourceType: 'curated-open-postcode-map',
        sourceName: 'Open Dublin postcode map (KML export)',
      },
      geometry: polygonalGeometry,
    }

    uniqueFeatures.set(
      areaConfig.id,
      pickPreferredFeature(uniqueFeatures.get(areaConfig.id), cleanedFeature),
    )
  }

  return uniqueFeatures
}

async function main() {
  console.log('Fetching unified Dublin postal area geometry from the open postcode KML...')
  const routingKeyKml = await fetchPostalAreaKml()

  await mkdir(path.dirname(routingKeyKmlPath), { recursive: true })
  await writeFile(routingKeyKmlPath, routingKeyKml)

  const featureMap = extractPostalAreaFeatures(routingKeyKml)
  const missingAreaIds = expectedAreas
    .map((area) => area.id)
    .filter((areaId) => !featureMap.has(areaId))

  if (missingAreaIds.length > 0) {
    throw new Error(
      `Missing expected postal areas: ${missingAreaIds.join(', ')}. Check ${routingKeyKmlPath}.`,
    )
  }

  const features = expectedAreas.map((area) => featureMap.get(area.id))

  await mkdir(path.dirname(geoJsonOutputPath), { recursive: true })
  await writeFile(
    geoJsonOutputPath,
    JSON.stringify(
      {
        type: 'FeatureCollection',
        name: 'Dublin postal areas',
        generatedAt: new Date().toISOString(),
        sources: [
          'Open Dublin postcode map (KML export)',
          'Curated normalization to Dublin D districts and Dublin-area A/K postal zones',
        ],
        features,
      },
      null,
      2,
    ),
  )

  console.log(`Saved ${features.length} postal areas to ${geoJsonOutputPath}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
