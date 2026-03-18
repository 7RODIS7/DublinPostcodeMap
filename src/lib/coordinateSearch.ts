export type ParsedCoordinateInput = {
  coordinates: [number, number]
  zoom?: number
}

const QUERY_PARAM_KEYS = ['query', 'q', 'll', 'center', 'destination', 'origin']

function toFiniteNumber(raw: string | null): number | null {
  if (!raw) {
    return null
  }

  const value = Number(raw.trim())
  return Number.isFinite(value) ? value : null
}

function normalizeZoom(rawZoom: number | null): number | undefined {
  if (rawZoom === null) {
    return undefined
  }

  return Math.max(1, Math.min(22, rawZoom))
}

function isValidCoordinates(lat: number, lng: number): boolean {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
}

function buildParsedCoordinateInput(
  lat: number | null,
  lng: number | null,
  zoom?: number | null,
): ParsedCoordinateInput | null {
  if (lat === null || lng === null || !isValidCoordinates(lat, lng)) {
    return null
  }

  return {
    coordinates: [lat, lng],
    zoom: normalizeZoom(zoom ?? null),
  }
}

function extractCoordinatesFromText(text: string): ParsedCoordinateInput | null {
  const atPattern =
    /@(-?\d{1,3}(?:\.\d+)?),(-?\d{1,3}(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?z?/i
  const atMatch = text.match(atPattern)
  if (atMatch) {
    return buildParsedCoordinateInput(
      toFiniteNumber(atMatch[1]),
      toFiniteNumber(atMatch[2]),
      toFiniteNumber(atMatch[3] ?? null),
    )
  }

  const dataPattern = /!3d(-?\d{1,3}(?:\.\d+)?)!4d(-?\d{1,3}(?:\.\d+)?)/i
  const dataMatch = text.match(dataPattern)
  if (dataMatch) {
    return buildParsedCoordinateInput(
      toFiniteNumber(dataMatch[1]),
      toFiniteNumber(dataMatch[2]),
    )
  }

  const pairPattern = /(-?\d{1,3}(?:\.\d+)?)[,\s]+(-?\d{1,3}(?:\.\d+)?)/g
  for (const match of text.matchAll(pairPattern)) {
    const parsed = buildParsedCoordinateInput(
      toFiniteNumber(match[1]),
      toFiniteNumber(match[2]),
    )

    if (parsed) {
      return parsed
    }
  }

  return null
}

export function parseCoordinateInput(rawInput: string): ParsedCoordinateInput | null {
  const trimmedInput = rawInput.trim()
  if (!trimmedInput) {
    return null
  }

  try {
    const url = new URL(trimmedInput)
    const urlZoom = normalizeZoom(
      toFiniteNumber(url.searchParams.get('z') ?? url.searchParams.get('zoom')),
    )
    const parsedFromLatLngParams = buildParsedCoordinateInput(
      toFiniteNumber(url.searchParams.get('lat')),
      toFiniteNumber(
        url.searchParams.get('lng') ??
          url.searchParams.get('lon') ??
          url.searchParams.get('long'),
      ),
      urlZoom,
    )
    if (parsedFromLatLngParams) {
      return parsedFromLatLngParams
    }

    for (const key of QUERY_PARAM_KEYS) {
      const value = url.searchParams.get(key)
      if (!value) {
        continue
      }

      const parsedValue = extractCoordinatesFromText(value)
      if (parsedValue) {
        return {
          coordinates: parsedValue.coordinates,
          zoom: parsedValue.zoom ?? urlZoom,
        }
      }
    }
  } catch {
    // Ignore invalid URLs and continue with raw text parsing.
  }

  return extractCoordinatesFromText(trimmedInput)
}

export function formatCoordinates(
  coordinates: [number, number],
  precision = 5,
): string {
  return `${coordinates[0].toFixed(precision)}, ${coordinates[1].toFixed(precision)}`
}
