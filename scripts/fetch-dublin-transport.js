import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { unzipSync } from 'fflate'
import { parse } from 'csv-parse/sync'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(currentDirectory, '..')
const rawOutputDirectory = path.join(repositoryRoot, 'data', 'raw', 'transport')
const geoJsonOutputPath = path.join(repositoryRoot, 'public', 'data', 'dublin-transport.geojson')

const dublinBounds = {
  minLng: -6.56,
  maxLng: -5.95,
  minLat: 53.18,
  maxLat: 53.56,
}

const gtfsSources = [
  {
    id: 'irish-rail',
    operator: 'Irish Rail',
    network: 'rail',
    selectionStrategy: 'all-shapes',
    url: 'https://www.transportforireland.ie/transitData/Data/GTFS_Irish_Rail.zip',
  },
  {
    id: 'luas',
    operator: 'Luas',
    network: 'luas',
    selectionStrategy: 'all-shapes',
    url: 'https://www.transportforireland.ie/transitData/Data/GTFS_LUAS.zip',
  },
  {
    id: 'dublin-bus',
    operator: 'Dublin Bus',
    network: 'bus',
    selectionStrategy: 'representative',
    url: 'https://www.transportforireland.ie/transitData/Data/GTFS_Dublin_Bus.zip',
  },
  {
    id: 'goahead',
    operator: 'Go-Ahead Ireland',
    network: 'bus',
    selectionStrategy: 'representative',
    url: 'https://www.transportforireland.ie/transitData/Data/GTFS_GoAhead.zip',
  },
]

const metroLinkSource = {
  id: 'metrolink',
  operator: 'MetroLink',
  network: 'metro',
  status: 'planned',
  rawOutputName: 'metrolink-alignment.geojson',
  alignmentUrl:
    'https://services1.arcgis.com/nlVgVHPnclpXUcav/arcgis/rest/services/MetroLink_Web_WFL1/FeatureServer/2/query?where=1%3D1&outFields=ConstructionType&returnGeometry=true&outSR=4326&f=geojson',
  routeMapUrl:
    'https://www.metrolink.ie/media/yokokfjd/metrolink_route_map_2024_update_2.pdf',
  descriptionUrl: 'https://www.metrolink.ie/about-the-project/route-description/',
}

const mainBusRoutes = new Set([
  '13',
  '14',
  '15',
  '16',
  '27',
  '33A',
  '39',
  '41',
  '42',
  '44',
  '45A',
  '45B',
  '47',
  '59',
  '65',
  '73',
  '74',
  '102',
  '104',
  '111',
  '114',
  '120',
  '122',
  '123',
  '130',
  '145',
  '161',
  '220',
  '236',
  '270',
  'C1',
  'C2',
  'C3',
  'C4',
  'E1',
  'E2',
  'F1',
  'F2',
  'G1',
  'G2',
  'H1',
  'H2',
  'H3',
  'L1',
  'L2',
  'L25',
  'N4',
  'S2',
])

const railRouteSelectors = [
  { shortName: 'DART' },
  { shortName: 'Commuter' },
  { longName: 'Dublin - Maynooth' },
  { longName: 'Dublin - Drogheda/Dundalk' },
]

function parseCsvFromZip(archive, filename) {
  const file = archive[filename]
  if (!file) {
    throw new Error(`Missing ${filename} in GTFS archive`)
  }

  return parse(Buffer.from(file), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
    relax_quotes: true,
    trim: true,
  })
}

function parseNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function roundCoordinate(value) {
  return Math.round(value * 1_000_000) / 1_000_000
}

function coordinatesEqual(left, right) {
  return (
    Math.abs(left[0] - right[0]) < 0.000001 &&
    Math.abs(left[1] - right[1]) < 0.000001
  )
}

function clipSegmentToBounds(start, end, bounds) {
  let [x0, y0] = start
  let [x1, y1] = end
  let t0 = 0
  let t1 = 1
  const dx = x1 - x0
  const dy = y1 - y0

  const tests = [
    [-dx, x0 - bounds.minLng],
    [dx, bounds.maxLng - x0],
    [-dy, y0 - bounds.minLat],
    [dy, bounds.maxLat - y0],
  ]

  for (const [p, q] of tests) {
    if (p === 0) {
      if (q < 0) {
        return null
      }
      continue
    }

    const ratio = q / p
    if (p < 0) {
      if (ratio > t1) {
        return null
      }
      if (ratio > t0) {
        t0 = ratio
      }
      continue
    }

    if (ratio < t0) {
      return null
    }
    if (ratio < t1) {
      t1 = ratio
    }
  }

  return [
    [roundCoordinate(x0 + t0 * dx), roundCoordinate(y0 + t0 * dy)],
    [roundCoordinate(x0 + t1 * dx), roundCoordinate(y0 + t1 * dy)],
  ]
}

function clipShapeToBounds(points, bounds) {
  if (points.length < 2) {
    return []
  }

  const clippedLineStrings = []
  let currentLine = []

  for (let index = 0; index < points.length - 1; index += 1) {
    const clippedSegment = clipSegmentToBounds(points[index], points[index + 1], bounds)

    if (!clippedSegment) {
      if (currentLine.length >= 2) {
        clippedLineStrings.push(currentLine)
      }
      currentLine = []
      continue
    }

    const [segmentStart, segmentEnd] = clippedSegment

    if (currentLine.length === 0) {
      currentLine = [segmentStart, segmentEnd]
      continue
    }

    if (!coordinatesEqual(currentLine[currentLine.length - 1], segmentStart)) {
      if (currentLine.length >= 2) {
        clippedLineStrings.push(currentLine)
      }
      currentLine = [segmentStart, segmentEnd]
      continue
    }

    if (!coordinatesEqual(currentLine[currentLine.length - 1], segmentEnd)) {
      currentLine.push(segmentEnd)
    }
  }

  if (currentLine.length >= 2) {
    clippedLineStrings.push(currentLine)
  }

  return clippedLineStrings
}

function deriveTransportColor(network, routeShortName) {
  if (network === 'luas') {
    return routeShortName.toLowerCase() === 'red' ? '#c64343' : '#2f8e5b'
  }

  if (network === 'rail') {
    return '#24577f'
  }

  return '#ca7a31'
}

function routeMatchesSelection(source, route) {
  if (source.network === 'luas') {
    return true
  }

  if (source.network === 'rail') {
    return railRouteSelectors.some((selector) => {
      if (selector.shortName) {
        return route.route_short_name === selector.shortName
      }

      return route.route_long_name === selector.longName
    })
  }

  return mainBusRoutes.has(route.route_short_name)
}

function pickRepresentativeShapeIds(trips, selectedRouteIds) {
  const countsByRouteAndDirection = new Map()

  for (const trip of trips) {
    if (!selectedRouteIds.has(trip.route_id) || !trip.shape_id) {
      continue
    }

    const direction = trip.direction_id === '1' ? '1' : '0'
    const directionKey = `${trip.route_id}::${direction}`
    const shapeCounts = countsByRouteAndDirection.get(directionKey) ?? new Map()
    shapeCounts.set(trip.shape_id, (shapeCounts.get(trip.shape_id) ?? 0) + 1)
    countsByRouteAndDirection.set(directionKey, shapeCounts)
  }

  const shapeIdsByRoute = new Map()

  for (const routeId of selectedRouteIds) {
    const shapeIds = []

    for (const direction of ['0', '1']) {
      const shapeCounts = countsByRouteAndDirection.get(`${routeId}::${direction}`)
      if (!shapeCounts) {
        continue
      }

      const [topShapeId] = [...shapeCounts.entries()].sort((left, right) => right[1] - left[1])[0]
      if (!shapeIds.includes(topShapeId)) {
        shapeIds.push(topShapeId)
      }
    }

    if (shapeIds.length === 0) {
      continue
    }

    shapeIdsByRoute.set(routeId, shapeIds)
  }

  return shapeIdsByRoute
}

function collectAllShapeIdsByRoute(trips, selectedRouteIds) {
  const shapeIdsByRoute = new Map()

  for (const trip of trips) {
    if (!selectedRouteIds.has(trip.route_id) || !trip.shape_id) {
      continue
    }

    const shapeIds = shapeIdsByRoute.get(trip.route_id) ?? new Set()
    shapeIds.add(trip.shape_id)
    shapeIdsByRoute.set(trip.route_id, shapeIds)
  }

  return new Map(
    [...shapeIdsByRoute.entries()].map(([routeId, shapeIds]) => [routeId, [...shapeIds]]),
  )
}

function buildShapeMap(shapeRows) {
  const pointsByShapeId = new Map()

  for (const row of shapeRows) {
    const latitude = parseNumber(row.shape_pt_lat)
    const longitude = parseNumber(row.shape_pt_lon)
    const sequence = parseNumber(row.shape_pt_sequence)

    if (latitude === null || longitude === null || sequence === null || !row.shape_id) {
      continue
    }

    const list = pointsByShapeId.get(row.shape_id) ?? []
    list.push({
      sequence,
      coordinates: [roundCoordinate(longitude), roundCoordinate(latitude)],
    })
    pointsByShapeId.set(row.shape_id, list)
  }

  const shapeMap = new Map()

  for (const [shapeId, entries] of pointsByShapeId.entries()) {
    shapeMap.set(
      shapeId,
      entries
        .sort((left, right) => left.sequence - right.sequence)
        .map((entry) => entry.coordinates),
    )
  }

  return shapeMap
}

async function fetchGtfsZip(source) {
  console.log(`Fetching ${source.operator} GTFS...`)
  const response = await fetch(source.url, {
    headers: {
      'User-Agent': 'DublinPostcodeMap/1.0 (public reference map)',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${source.url}: ${response.status} ${response.statusText}`)
  }

  return Buffer.from(await response.arrayBuffer())
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'DublinPostcodeMap/1.0 (public reference map)',
    },
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

function normalizeLineStrings(geometry) {
  if (!geometry) {
    return []
  }

  if (geometry.type === 'LineString') {
    return [geometry.coordinates]
  }

  if (geometry.type === 'MultiLineString') {
    return geometry.coordinates
  }

  return []
}

function dedupeLineStrings(lineStrings) {
  const seen = new Set()
  const deduped = []

  for (const lineString of lineStrings) {
    const key = JSON.stringify(lineString)
    if (seen.has(key)) {
      continue
    }

    seen.add(key)
    deduped.push(lineString)
  }

  return deduped
}

async function appendMetroLinkFeature(features) {
  console.log('Fetching MetroLink alignment...')
  const rawAlignment = await fetchJson(metroLinkSource.alignmentUrl)
  const rawOutputPath = path.join(rawOutputDirectory, metroLinkSource.rawOutputName)
  await writeFile(rawOutputPath, JSON.stringify(rawAlignment, null, 2))

  const lineStrings = dedupeLineStrings(
    rawAlignment.features.flatMap((feature) =>
      normalizeLineStrings(feature.geometry).flatMap((lineString) =>
        clipShapeToBounds(lineString, dublinBounds),
      ),
    ),
  )

  if (lineStrings.length === 0) {
    return
  }

  features.push({
    type: 'Feature',
    properties: {
      id: metroLinkSource.id,
      network: metroLinkSource.network,
      label: 'MetroLink',
      operator: metroLinkSource.operator,
      routeShortName: 'MetroLink',
      routeLongName: 'Future metro line to Swords via Dublin Airport',
      color: '#7c4ad8',
      status: metroLinkSource.status,
      note: 'Planned alignment from the official MetroLink Railway Order map.',
    },
    geometry: {
      type: 'MultiLineString',
      coordinates: lineStrings,
    },
  })
}

async function main() {
  const features = []

  await mkdir(rawOutputDirectory, { recursive: true })

  for (const source of gtfsSources) {
    const zipBuffer = await fetchGtfsZip(source)
    const rawZipPath = path.join(rawOutputDirectory, `${source.id}.zip`)
    await writeFile(rawZipPath, zipBuffer)

    const archive = unzipSync(new Uint8Array(zipBuffer))
    const routes = parseCsvFromZip(archive, 'routes.txt')
    const trips = parseCsvFromZip(archive, 'trips.txt')
    const shapes = parseCsvFromZip(archive, 'shapes.txt')

    const selectedRoutes = routes.filter((route) => routeMatchesSelection(source, route))
    const selectedRouteIds = new Set(selectedRoutes.map((route) => route.route_id))
    const shapeIdsByRoute =
      source.selectionStrategy === 'all-shapes'
        ? collectAllShapeIdsByRoute(trips, selectedRouteIds)
        : pickRepresentativeShapeIds(trips, selectedRouteIds)
    const shapeMap = buildShapeMap(shapes)

    for (const route of selectedRoutes) {
      const shapeIds = shapeIdsByRoute.get(route.route_id)
      if (!shapeIds || shapeIds.length === 0) {
        continue
      }

      const clippedLineStrings = []
      for (const shapeId of shapeIds) {
        const shapePoints = shapeMap.get(shapeId)
        if (!shapePoints) {
          continue
        }

        clippedLineStrings.push(...clipShapeToBounds(shapePoints, dublinBounds))
      }

      const dedupedLineStrings = dedupeLineStrings(clippedLineStrings)

      if (dedupedLineStrings.length === 0) {
        continue
      }

      features.push({
        type: 'Feature',
        properties: {
          id: `${source.id}-${route.route_short_name}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-'),
          network: source.network,
          label:
            source.network === 'luas'
              ? `Luas ${route.route_short_name}`
              : `${route.route_short_name} ${route.route_long_name}`.trim(),
          operator: source.operator,
          routeShortName: route.route_short_name,
          routeLongName: route.route_long_name,
          color: deriveTransportColor(source.network, route.route_short_name),
          status: 'operational',
        },
        geometry:
          dedupedLineStrings.length === 1
            ? {
                type: 'LineString',
                coordinates: dedupedLineStrings[0],
              }
            : {
                type: 'MultiLineString',
                coordinates: dedupedLineStrings,
              },
      })
    }
  }

  await appendMetroLinkFeature(features)

  await mkdir(path.dirname(geoJsonOutputPath), { recursive: true })
  await writeFile(
    geoJsonOutputPath,
    JSON.stringify(
      {
        type: 'FeatureCollection',
        name: 'Dublin transport overlays',
        generatedAt: new Date().toISOString(),
        sources: [
          ...gtfsSources.map((source) => source.url),
          metroLinkSource.alignmentUrl,
          metroLinkSource.routeMapUrl,
          metroLinkSource.descriptionUrl,
        ],
        bounds: dublinBounds,
        features,
      },
      null,
      2,
    ),
  )

  console.log(`Saved ${features.length} transport features to ${geoJsonOutputPath}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
