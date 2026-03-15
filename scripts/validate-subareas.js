import fs from 'node:fs'

const validationCheckpoints = [
  {
    name: 'Blackrock core',
    districtId: 'routing-a94',
    coordinates: [53.3015, -6.1778],
  },
  {
    name: 'Dun Laoghaire centre',
    districtId: 'routing-a96',
    coordinates: [53.2943, -6.1349],
  },
  {
    name: 'Cabinteely',
    districtId: 'dublin-18',
    coordinates: [53.2612843, -6.1505691],
  },
  {
    name: 'Beech Park',
    districtId: 'dublin-18',
    coordinates: [53.273893, -6.1677585],
  },
  {
    name: 'Shanganagh Vale',
    districtId: 'dublin-18',
    coordinates: [53.2526033, -6.1404151],
  },
  {
    name: "St Lawrence's College",
    districtId: 'dublin-18',
    coordinates: [53.2505035, -6.1388104],
  },
  {
    name: 'Portmarnock station',
    districtId: 'dublin-13',
    coordinates: [53.4176576, -6.1513171],
  },
  {
    name: 'Portmarnock Hotel',
    districtId: 'dublin-13',
    coordinates: [53.4295846, -6.1261412],
  },
  {
    name: 'Malahide village',
    districtId: 'routing-k36',
    coordinates: [53.4509, -6.1545],
  },
]

function parseSubareas(text) {
  const items = []

  for (const match of text.matchAll(
    /(street|neighborhood|point)\('([^']+)', '([^']+)', '([^']+)'(?:, \[([^\]]+)\])?/g,
  )) {
    const coordinates = match[5]
      ? match[5].split(',').map((value) => Number(value.trim()))
      : null

    items.push({
      kind: match[1],
      id: match[2],
      name: match[3],
      districtId: match[4],
      coordinates,
    })
  }

  return items
}

function pointInRing(point, ring) {
  const [lat, lng] = point
  let inside = false

  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
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

const geojson = JSON.parse(fs.readFileSync('public/data/dublin-postal-areas.geojson', 'utf8'))
const subareas = parseSubareas(fs.readFileSync('src/data/subareas.ts', 'utf8'))
const featureById = new Map(geojson.features.map((feature) => [feature.properties.id, feature]))
const checkpoints = [
  ...subareas
    .filter((subarea) => subarea.coordinates)
    .map((subarea) => ({
      name: subarea.name,
      districtId: subarea.districtId,
      coordinates: subarea.coordinates,
    })),
  ...validationCheckpoints,
]
const invalid = []

for (const checkpoint of checkpoints) {
  const feature = featureById.get(checkpoint.districtId)
  if (!feature) {
    invalid.push(`${checkpoint.name}: unknown district ${checkpoint.districtId}`)
    continue
  }

  const containingAreaIds = geojson.features
    .filter((candidate) => pointInGeometry(checkpoint.coordinates, candidate.geometry))
    .map((candidate) => candidate.properties.id)

  if (!containingAreaIds.includes(checkpoint.districtId)) {
    invalid.push(
      `${checkpoint.name} (${checkpoint.districtId}) lies outside its district polygon at ${checkpoint.coordinates.join(', ')}`,
    )
    continue
  }

  if (containingAreaIds.length > 1) {
    invalid.push(
      `${checkpoint.name} (${checkpoint.districtId}) overlaps multiple postal areas: ${containingAreaIds.join(', ')}`,
    )
  }
}

if (invalid.length > 0) {
  console.error('Subarea validation failed:')
  for (const entry of invalid) {
    console.error(`- ${entry}`)
  }
  process.exit(1)
}

console.log(
  `Validated ${subareas.length} subareas and ${validationCheckpoints.length} seam checkpoints against ${geojson.features.length} postal areas.`,
)
