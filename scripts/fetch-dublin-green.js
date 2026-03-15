import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import osmtogeojson from 'osmtogeojson'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(currentDirectory, '..')
const rawOutputDirectory = path.join(repositoryRoot, 'data', 'raw', 'green')
const rawOutputPath = path.join(rawOutputDirectory, 'dublin-public-green.osm.json')
const derivedOutputDirectory = path.join(repositoryRoot, 'data', 'derived', 'green')
const geoJsonOutputPath = path.join(derivedOutputDirectory, 'dublin-green-spaces.geojson')
const generatedScoresPath = path.join(repositoryRoot, 'src', 'data', 'generatedGreenScores.ts')
const postalAreasPath = path.join(repositoryRoot, 'public', 'data', 'dublin-postal-areas.geojson')

const dublinBounds = {
  minLng: -6.56,
  maxLng: -5.95,
  minLat: 53.18,
  maxLat: 53.56,
}

const overpassEndpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const overpassQuery = `
[out:json][timeout:180];
(
  way["leisure"~"^(park|garden|nature_reserve|recreation_ground|common)$"](${dublinBounds.minLat},${dublinBounds.minLng},${dublinBounds.maxLat},${dublinBounds.maxLng});
  relation["leisure"~"^(park|garden|nature_reserve|recreation_ground|common)$"](${dublinBounds.minLat},${dublinBounds.minLng},${dublinBounds.maxLat},${dublinBounds.maxLng});
  way["landuse"~"^(recreation_ground|village_green)$"](${dublinBounds.minLat},${dublinBounds.minLng},${dublinBounds.maxLat},${dublinBounds.maxLng});
  relation["landuse"~"^(recreation_ground|village_green)$"](${dublinBounds.minLat},${dublinBounds.minLng},${dublinBounds.maxLat},${dublinBounds.maxLng});
  way["natural"~"^(wood|heath|grassland|beach)$"](${dublinBounds.minLat},${dublinBounds.minLng},${dublinBounds.maxLat},${dublinBounds.maxLng});
  relation["natural"~"^(wood|heath|grassland|beach)$"](${dublinBounds.minLat},${dublinBounds.minLng},${dublinBounds.maxLat},${dublinBounds.maxLng});
);
out body;
>;
out skel qt;
`.trim()

function normalizeGeometry(geometry) {
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
    const normalized = normalizeGeometry(nestedGeometry)
    if (!normalized) {
      continue
    }

    if (normalized.type === 'Polygon') {
      polygons.push(normalized.coordinates)
      continue
    }

    polygons.push(...normalized.coordinates)
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

function getFeatureTag(feature, tagName) {
  return feature.properties?.[tagName] ?? feature.properties?.tags?.[tagName] ?? null
}

function isPublicAccessFeature(feature) {
  const access = String(getFeatureTag(feature, 'access') ?? '').toLowerCase()
  const fee = String(getFeatureTag(feature, 'fee') ?? '').toLowerCase()
  const leisure = String(getFeatureTag(feature, 'leisure') ?? '').toLowerCase()
  const landuse = String(getFeatureTag(feature, 'landuse') ?? '').toLowerCase()

  if (['private', 'no', 'customers'].includes(access)) {
    return false
  }

  if (leisure === 'golf_course' || landuse === 'golf_course') {
    return false
  }

  if (fee === 'yes' && access === 'private') {
    return false
  }

  return true
}

function getGeometryBounds(geometry) {
  let minLng = Infinity
  let maxLng = -Infinity
  let minLat = Infinity
  let maxLat = -Infinity

  const polygons =
    geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const [lng, lat] of ring) {
        minLng = Math.min(minLng, lng)
        maxLng = Math.max(maxLng, lng)
        minLat = Math.min(minLat, lat)
        maxLat = Math.max(maxLat, lat)
      }
    }
  }

  return { minLng, maxLng, minLat, maxLat }
}

function bboxIntersects(left, right) {
  return !(
    left.maxLng < right.minLng ||
    left.minLng > right.maxLng ||
    left.maxLat < right.minLat ||
    left.minLat > right.maxLat
  )
}

function pointInRing(point, ring) {
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

function pointInPolygon(point, polygon) {
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

function pointInGeometry(point, geometry) {
  if (geometry.type === 'Polygon') {
    return pointInPolygon(point, geometry.coordinates)
  }

  return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon))
}

function buildGridStep(bounds) {
  const latSpan = bounds.maxLat - bounds.minLat
  const baseStep = latSpan > 0.18 ? 0.005 : latSpan > 0.1 ? 0.004 : 0.003
  const lngStep = baseStep / Math.cos((((bounds.minLat + bounds.maxLat) / 2) * Math.PI) / 180)

  return { latStep: baseStep, lngStep }
}

function mapGreenScore(coverageRatio, featureCount) {
  let score = 1

  if (coverageRatio >= 0.03 || featureCount >= 2) {
    score += 1
  }

  if (coverageRatio >= 0.07 || featureCount >= 4) {
    score += 1
  }

  if (coverageRatio >= 0.12 || featureCount >= 7) {
    score += 1
  }

  if (coverageRatio >= 0.2 || featureCount >= 11) {
    score += 1
  }

  return Math.max(1, Math.min(5, score))
}

async function fetchOverpassJson() {
  let lastError = null

  for (const endpoint of overpassEndpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=UTF-8',
          'User-Agent': 'DublinPostcodeMap/1.0 (public reference map)',
        },
        body: overpassQuery,
      })

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Failed to fetch public green spaces from Overpass.')
}

function pickPublicGreenFeatures(overpassData) {
  const geoJson = osmtogeojson(overpassData)

  return geoJson.features
    .map((feature) => {
      const geometry = normalizeGeometry(feature.geometry)
      if (!geometry) {
        return null
      }

      const cleanedFeature = {
        type: 'Feature',
        properties: {
          id: feature.id ?? feature.properties?.id ?? null,
          name: feature.properties?.name ?? null,
          leisure: getFeatureTag(feature, 'leisure'),
          landuse: getFeatureTag(feature, 'landuse'),
          natural: getFeatureTag(feature, 'natural'),
          access: getFeatureTag(feature, 'access'),
        },
        geometry,
      }

      return isPublicAccessFeature(cleanedFeature) ? cleanedFeature : null
    })
    .filter(Boolean)
}

function computeGreenScores(postalAreas, greenFeatures) {
  const diagnostics = {}
  const scores = {}

  const greenFeaturesWithBounds = greenFeatures.map((feature) => ({
    ...feature,
    bounds: getGeometryBounds(feature.geometry),
  }))

  for (const district of postalAreas.features) {
    const districtBounds = getGeometryBounds(district.geometry)
    const { latStep, lngStep } = buildGridStep(districtBounds)
    const relevantGreenFeatures = greenFeaturesWithBounds.filter((feature) =>
      bboxIntersects(districtBounds, feature.bounds),
    )

    let sampleCount = 0
    let greenSampleCount = 0
    const matchedFeatureIds = new Set()

    for (
      let lat = districtBounds.minLat + latStep / 2;
      lat <= districtBounds.maxLat;
      lat += latStep
    ) {
      for (
        let lng = districtBounds.minLng + lngStep / 2;
        lng <= districtBounds.maxLng;
        lng += lngStep
      ) {
        const point = [lat, lng]
        if (!pointInGeometry(point, district.geometry)) {
          continue
        }

        sampleCount += 1

        for (const greenFeature of relevantGreenFeatures) {
          if (!pointInGeometry(point, greenFeature.geometry)) {
            continue
          }

          greenSampleCount += 1
          if (greenFeature.properties.id) {
            matchedFeatureIds.add(greenFeature.properties.id)
          }
          break
        }
      }
    }

    const coverageRatio = sampleCount > 0 ? greenSampleCount / sampleCount : 0
    const accessibleFeatureCount = matchedFeatureIds.size
    const score = mapGreenScore(coverageRatio, accessibleFeatureCount)

    scores[district.properties.id] = score
    diagnostics[district.properties.id] = {
      score,
      coverageRatio: Math.round(coverageRatio * 1000) / 1000,
      accessibleFeatureCount,
      sampleCount,
    }
  }

  return { scores, diagnostics }
}

async function main() {
  console.log('Fetching public-access green spaces for Dublin...')
  const overpassData = await fetchOverpassJson()
  const postalAreas = JSON.parse(await readFile(postalAreasPath, 'utf8'))
  const greenFeatures = pickPublicGreenFeatures(overpassData)
  const { scores, diagnostics } = computeGreenScores(postalAreas, greenFeatures)

  await mkdir(rawOutputDirectory, { recursive: true })
  await mkdir(derivedOutputDirectory, { recursive: true })
  await writeFile(rawOutputPath, JSON.stringify(overpassData, null, 2))
  await writeFile(
    geoJsonOutputPath,
    JSON.stringify(
      {
        type: 'FeatureCollection',
        name: 'Dublin public green spaces',
        generatedAt: new Date().toISOString(),
        source: 'OpenStreetMap via Overpass API',
        features: greenFeatures,
      },
      null,
      2,
    ),
  )

  const generatedSource = `export const greenScoresById: Record<string, number> = ${JSON.stringify(
    scores,
    null,
    2,
  )} as const

export const greenScoreDiagnosticsById = ${JSON.stringify(diagnostics, null, 2)} as const
`

  await writeFile(generatedScoresPath, generatedSource)

  console.log(
    `Saved ${greenFeatures.length} public green features and green scores for ${Object.keys(scores).length} postal areas.`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
