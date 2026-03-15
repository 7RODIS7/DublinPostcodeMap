import { readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const currentDirectory = path.dirname(fileURLToPath(import.meta.url))
const repositoryRoot = path.resolve(currentDirectory, '..')
const geoJsonPath = path.join(repositoryRoot, 'public', 'data', 'dublin-transport.geojson')

function getLineStrings(geometry) {
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

function getFeatureBounds(feature) {
  let minLat = Infinity
  let maxLat = -Infinity
  let minLng = Infinity
  let maxLng = -Infinity

  for (const lineString of getLineStrings(feature.geometry)) {
    for (const [lng, lat] of lineString) {
      minLat = Math.min(minLat, lat)
      maxLat = Math.max(maxLat, lat)
      minLng = Math.min(minLng, lng)
      maxLng = Math.max(maxLng, lng)
    }
  }

  return { minLat, maxLat, minLng, maxLng }
}

async function main() {
  const raw = await readFile(geoJsonPath, 'utf8')
  const data = JSON.parse(raw)
  const counts = new Map()

  for (const feature of data.features) {
    const network = feature.properties?.network ?? 'unknown'
    counts.set(network, (counts.get(network) ?? 0) + 1)
  }

  for (const network of ['rail', 'luas', 'bus', 'metro']) {
    if (!counts.get(network)) {
      throw new Error(`Missing transport network in overlay output: ${network}`)
    }
  }

  const railFeatures = data.features.filter((feature) => feature.properties?.network === 'rail')
  const railMinLat = Math.min(...railFeatures.map((feature) => getFeatureBounds(feature).minLat))
  if (railMinLat > 53.31) {
    throw new Error(
      `Rail coverage still looks too far north (min latitude ${railMinLat.toFixed(6)}).`,
    )
  }

  const metroFeature = data.features.find((feature) => feature.properties?.network === 'metro')
  if (!metroFeature) {
    throw new Error('MetroLink planned feature is missing.')
  }

  const metroBounds = getFeatureBounds(metroFeature)
  if (metroBounds.maxLat < 53.47 || metroBounds.minLat > 53.34) {
    throw new Error('MetroLink bounds look implausible for the official Swords-to-city alignment.')
  }

  console.log(
    `Transport overlay OK: ${counts.get('rail')} rail, ${counts.get('luas')} luas, ${counts.get('bus')} bus, ${counts.get('metro')} metro feature(s).`,
  )
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
