import { useEffect, useState } from 'react'
import { DistrictSidebar } from './components/DistrictSidebar'
import { DublinMap } from './components/DublinMap'
import { MapControls } from './components/MapControls'
import { districtMeta } from './data/districtMeta'
import { districtLifestyleTagsById } from './data/districtTags'
import { districtSubareas } from './data/subareas'
import { createDistrictDaftRentLink } from './lib/daft'
import { normalizePostalFeatureCollection } from './lib/districtUtils'
import {
  estimateGoogleMapsZoom,
  findFeatureAtPoint,
  getBoundsCenter,
  getFeatureFocusBounds,
} from './lib/geo'
import { createDistrictGoogleMapsUrl } from './lib/googleMaps'
import { matchesSelectedGrades, sortDistricts } from './lib/districtRatings'
import { isUserPointIconKey } from './lib/userPoints'
import type {
  DistrictGrade,
  DistrictLifestyleTag,
  DistrictSortMode,
  DistrictSubarea,
  DistrictWithSubareas,
  FocusRequest,
  MapLabelMode,
  PostalFeatureCollection,
  TransportFeatureCollection,
  TransportLayerKey,
  TransportLayerVisibility,
  UserPointIconKey,
  UserSavedPoint,
} from './types/districts'

const INITIAL_OPACITY = 0.22
const GRADE_ORDER: DistrictGrade[] = ['A', 'B', 'C', 'D']
const DEFAULT_TRANSPORT_VISIBILITY: TransportLayerVisibility = {
  rail: true,
  luas: true,
  bus: false,
  metro: false,
}
const STORAGE_KEYS = {
  grades: 'dublin-map:selected-grades',
  lifestyleTags: 'dublin-map:selected-lifestyle-tags',
  sortMode: 'dublin-map:sort-mode',
  sidebarOpen: 'dublin-map:sidebar-open',
  showDistrictLabels: 'dublin-map:show-district-labels',
  districtLabelMode: 'dublin-map:district-label-mode',
  overlayOpacity: 'dublin-map:overlay-opacity',
  transportVisibility: 'dublin-map:transport-visibility',
  savedPoints: 'dublin-map:user-saved-points',
} as const

const allDistricts: DistrictWithSubareas[] = districtMeta.map((district) => ({
  ...district,
  lifestyleTags: districtLifestyleTagsById[district.id] ?? [],
  subareas: districtSubareas.filter((subarea) => subarea.districtId === district.id),
}))
const AVAILABLE_GRADES: DistrictGrade[] = GRADE_ORDER.filter((grade) =>
  allDistricts.some((district) => district.ratings.overall === grade),
)
const DEFAULT_GRADE_SELECTION: DistrictGrade[] = AVAILABLE_GRADES
const GRADE_PRESET_B_PLUS: DistrictGrade[] = AVAILABLE_GRADES.filter(
  (grade) => grade === 'A' || grade === 'B',
)
const allDistrictsById = Object.fromEntries(allDistricts.map((district) => [district.id, district]))
const allowedLifestyleTags: DistrictLifestyleTag[] = [
  'family-friendly',
  'quiet',
  'walkable',
  'no-car-friendly',
  'coastal',
  'village-feel',
  'mixed',
]
const allowedSortModes: DistrictSortMode[] = [
  'postal',
  'overall',
  'safety',
  'transit',
  'parks',
  'schools',
  'amenities',
  'value',
]

function readStoredValue<T>(key: string, fallback: T, parser: (raw: string) => T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const raw = window.localStorage.getItem(key)
  if (!raw) {
    return fallback
  }

  try {
    return parser(raw)
  } catch {
    return fallback
  }
}

function persistValue(key: string, value: unknown) {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(key, JSON.stringify(value))
}

export default function App() {
  const [postalData, setPostalData] = useState<PostalFeatureCollection | null>(null)
  const [transportData, setTransportData] = useState<TransportFeatureCollection | null>(null)
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(null)
  const [selectedSavedPointId, setSelectedSavedPointId] = useState<string | null>(null)
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null)
  const [selectedGrades, setSelectedGrades] = useState<DistrictGrade[]>(() =>
    readStoredValue(STORAGE_KEYS.grades, DEFAULT_GRADE_SELECTION, (raw) => {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) {
        return DEFAULT_GRADE_SELECTION
      }

      const grades = parsed.filter((item): item is DistrictGrade =>
        AVAILABLE_GRADES.includes(item),
      )

      return grades.length > 0 ? grades : DEFAULT_GRADE_SELECTION
    }),
  )
  const [selectedLifestyleTags, setSelectedLifestyleTags] = useState<DistrictLifestyleTag[]>(() =>
    readStoredValue(STORAGE_KEYS.lifestyleTags, [], (raw) => {
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed.filter((item): item is DistrictLifestyleTag =>
        allowedLifestyleTags.includes(item),
      )
    }),
  )
  const [sortMode, setSortMode] = useState<DistrictSortMode>(() =>
    readStoredValue(STORAGE_KEYS.sortMode, 'postal', (raw) => {
      const parsed = JSON.parse(raw)
      return allowedSortModes.includes(parsed) ? parsed : 'postal'
    }),
  )
  const [isSidebarOpen, setIsSidebarOpen] = useState(() =>
    readStoredValue(STORAGE_KEYS.sidebarOpen, true, (raw) => JSON.parse(raw) !== false),
  )
  const [showDistrictLabels, setShowDistrictLabels] = useState(() =>
    readStoredValue(
      STORAGE_KEYS.showDistrictLabels,
      true,
      (raw) => JSON.parse(raw) !== false,
    ),
  )
  const [districtLabelMode, setDistrictLabelMode] = useState<MapLabelMode>(() =>
    readStoredValue(STORAGE_KEYS.districtLabelMode, 'compact', (raw) => {
      const parsed = JSON.parse(raw)
      return parsed === 'extended' ? 'extended' : 'compact'
    }),
  )
  const [overlayOpacity, setOverlayOpacity] = useState(() =>
    readStoredValue(STORAGE_KEYS.overlayOpacity, INITIAL_OPACITY, (raw) => {
      const parsed = Number(JSON.parse(raw))
      if (Number.isNaN(parsed)) {
        return INITIAL_OPACITY
      }
      return Math.max(0.08, Math.min(0.55, parsed))
    }),
  )
  const [transportVisibility, setTransportVisibility] = useState<TransportLayerVisibility>(() =>
    readStoredValue(STORAGE_KEYS.transportVisibility, DEFAULT_TRANSPORT_VISIBILITY, (raw) => {
      const parsed = JSON.parse(raw)
      return {
        rail: parsed?.rail !== false,
        luas: parsed?.luas !== false,
        bus: parsed?.bus === true,
        metro: parsed?.metro === true,
      }
    }),
  )
  const [savedPoints, setSavedPoints] = useState<UserSavedPoint[]>(() =>
    readStoredValue(STORAGE_KEYS.savedPoints, [], (raw) => {
      const parsed = JSON.parse(raw)

      if (!Array.isArray(parsed)) {
        return []
      }

      return parsed.flatMap((item): UserSavedPoint[] => {
        if (
          typeof item?.id !== 'string' ||
          typeof item?.name !== 'string' ||
          !Array.isArray(item?.coordinates) ||
          item.coordinates.length !== 2 ||
          typeof item.coordinates[0] !== 'number' ||
          typeof item.coordinates[1] !== 'number' ||
          !isUserPointIconKey(item?.icon)
        ) {
          return []
        }

        return [
          {
            id: item.id,
            name: item.name.trim(),
            icon: item.icon,
            coordinates: [item.coordinates[0], item.coordinates[1]],
            districtId: typeof item?.districtId === 'string' ? item.districtId : null,
            createdAt:
              typeof item?.createdAt === 'string'
                ? item.createdAt
                : new Date().toISOString(),
          },
        ]
      })
    }),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadPostalData() {
      try {
        setIsLoading(true)
        setLoadError(null)

        const dataUrl = new URL(
          `${import.meta.env.BASE_URL}data/dublin-postal-areas.geojson`,
          window.location.href,
        )
        const response = await fetch(dataUrl)
        if (!response.ok) {
          throw new Error(
            'GeoJSON file not found. Run `npm run fetch:districts` to generate the postal area polygons.',
          )
        }

        const rawData = (await response.json()) as PostalFeatureCollection
        const normalized = normalizePostalFeatureCollection(rawData)

        if (!isCancelled) {
          setPostalData(normalized)
        }
      } catch (error) {
        if (!isCancelled) {
          const message =
            error instanceof Error
              ? error.message
              : 'Failed to load Dublin postal area geometry.'
          setLoadError(message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadPostalData()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function loadTransportData() {
      try {
        const dataUrl = new URL(
          `${import.meta.env.BASE_URL}data/dublin-transport.geojson`,
          window.location.href,
        )
        const response = await fetch(dataUrl)
        if (!response.ok) {
          return
        }

        const rawData = (await response.json()) as TransportFeatureCollection
        if (!isCancelled) {
          setTransportData(rawData)
        }
      } catch {
        if (!isCancelled) {
          setTransportData(null)
        }
      }
    }

    void loadTransportData()

    return () => {
      isCancelled = true
    }
  }, [])

  useEffect(() => {
    persistValue(STORAGE_KEYS.grades, selectedGrades)
  }, [selectedGrades])

  useEffect(() => {
    persistValue(STORAGE_KEYS.lifestyleTags, selectedLifestyleTags)
  }, [selectedLifestyleTags])

  useEffect(() => {
    persistValue(STORAGE_KEYS.sortMode, sortMode)
  }, [sortMode])

  useEffect(() => {
    persistValue(STORAGE_KEYS.sidebarOpen, isSidebarOpen)
  }, [isSidebarOpen])

  useEffect(() => {
    persistValue(STORAGE_KEYS.showDistrictLabels, showDistrictLabels)
  }, [showDistrictLabels])

  useEffect(() => {
    persistValue(STORAGE_KEYS.districtLabelMode, districtLabelMode)
  }, [districtLabelMode])

  useEffect(() => {
    persistValue(STORAGE_KEYS.overlayOpacity, overlayOpacity)
  }, [overlayOpacity])

  useEffect(() => {
    persistValue(STORAGE_KEYS.transportVisibility, transportVisibility)
  }, [transportVisibility])

  useEffect(() => {
    persistValue(STORAGE_KEYS.savedPoints, savedPoints)
  }, [savedPoints])

  function getDistrictIdForCoordinates(coordinates: [number, number]): string | null {
    return postalData
      ? findFeatureAtPoint(postalData.features, coordinates)?.properties.id ?? null
      : null
  }

  function handleDistrictSelect(districtId: string) {
    setSelectedSavedPointId(null)
    setSelectedDistrictId(districtId)
    setFocusRequest((previous): FocusRequest => ({
      kind: 'district',
      districtId,
      nonce: (previous?.nonce ?? 0) + 1,
    }))
  }

  function handleSubareaSelect(subarea: DistrictSubarea) {
    setSelectedSavedPointId(null)
    setSelectedDistrictId(subarea.districtId)

    if (!subarea.coordinates) {
      setFocusRequest((previous): FocusRequest => ({
        kind: 'district',
        districtId: subarea.districtId,
        nonce: (previous?.nonce ?? 0) + 1,
      }))
      return
    }

    const coordinates = subarea.coordinates

    setFocusRequest((previous): FocusRequest => ({
      kind: 'subarea',
      districtId: subarea.districtId,
      subareaId: subarea.id,
      coordinates,
      zoom: subarea.zoom ?? 14,
      nonce: (previous?.nonce ?? 0) + 1,
    }))
  }

  function handleResetView() {
    setSelectedSavedPointId(null)
    setFocusRequest((previous): FocusRequest => ({
      kind: 'reset',
      nonce: (previous?.nonce ?? 0) + 1,
    }))
  }

  function handleCoordinateFocus(payload: {
    coordinates: [number, number]
    zoom?: number
  }) {
    setSelectedSavedPointId(null)
    const matchingDistrictId = getDistrictIdForCoordinates(payload.coordinates)

    setSelectedDistrictId(matchingDistrictId)
    setFocusRequest((previous): FocusRequest => ({
      kind: 'coordinates',
      coordinates: payload.coordinates,
      zoom: payload.zoom ?? 16,
      nonce: (previous?.nonce ?? 0) + 1,
    }))
  }

  function handleGradeToggle(grade: DistrictGrade) {
    setSelectedGrades((current) =>
      current.includes(grade)
        ? current.length === 1
          ? current
          : current.filter((item) => item !== grade)
        : [...current, grade].sort((left, right) =>
            GRADE_ORDER.indexOf(left) - GRADE_ORDER.indexOf(right),
          ),
    )
  }

  function handleGradePresetSelect(preset: 'all' | 'b-plus') {
    setSelectedGrades(preset === 'b-plus' ? GRADE_PRESET_B_PLUS : DEFAULT_GRADE_SELECTION)
  }

  function handleLifestyleTagToggle(tag: DistrictLifestyleTag) {
    setSelectedLifestyleTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag],
    )
  }

  function handleResetFilters() {
    setSelectedGrades(DEFAULT_GRADE_SELECTION)
    setSelectedLifestyleTags([])
    setSortMode('postal')
  }

  function handleTransportToggle(layerKey: TransportLayerKey) {
    setTransportVisibility((current) => ({
      ...current,
      [layerKey]: !current[layerKey],
    }))
  }

  function handleSavedPointCreate(payload: {
    coordinates: [number, number]
    icon: UserPointIconKey
    name: string
  }) {
    const matchingDistrictId = getDistrictIdForCoordinates(payload.coordinates)
    const pointId = `saved-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const nextPoint: UserSavedPoint = {
      id: pointId,
      name: payload.name.trim(),
      icon: payload.icon,
      coordinates: payload.coordinates,
      districtId: matchingDistrictId,
      createdAt: new Date().toISOString(),
    }

    setSavedPoints((current) => [nextPoint, ...current])
    setSelectedSavedPointId(pointId)
    setSelectedDistrictId(matchingDistrictId)
    setFocusRequest((previous): FocusRequest => ({
      kind: 'saved-point',
      pointId,
      coordinates: payload.coordinates,
      zoom: 16,
      nonce: (previous?.nonce ?? 0) + 1,
    }))
  }

  function handleSavedPointUpdate(
    pointId: string,
    payload: {
      coordinates: [number, number]
      icon: UserPointIconKey
      name: string
    },
  ) {
    const matchingDistrictId = getDistrictIdForCoordinates(payload.coordinates)

    setSavedPoints((current) =>
      current.map((point) =>
        point.id === pointId
          ? {
              ...point,
              name: payload.name.trim(),
              icon: payload.icon,
              coordinates: payload.coordinates,
              districtId: matchingDistrictId,
            }
          : point,
      ),
    )

    if (selectedSavedPointId === pointId) {
      setSelectedDistrictId(matchingDistrictId)
      setFocusRequest((previous): FocusRequest => ({
        kind: 'saved-point',
        pointId,
        coordinates: payload.coordinates,
        zoom: 16,
        nonce: (previous?.nonce ?? 0) + 1,
      }))
    }
  }

  function handleSavedPointSelect(pointId: string) {
    const savedPoint = savedPoints.find((point) => point.id === pointId)

    if (!savedPoint) {
      return
    }

    setSelectedSavedPointId(pointId)
    setSelectedDistrictId(savedPoint.districtId)
    setFocusRequest((previous): FocusRequest => ({
      kind: 'saved-point',
      pointId,
      coordinates: savedPoint.coordinates,
      zoom: 16,
      nonce: (previous?.nonce ?? 0) + 1,
    }))
  }

  function handleSavedPointDelete(pointId: string) {
    setSavedPoints((current) => current.filter((point) => point.id !== pointId))
    setSelectedSavedPointId((current) => (current === pointId ? null : current))
  }

  function handleSavedPointsImport(
    importedPoints: Array<{
      coordinates: [number, number]
      icon: UserPointIconKey
      name: string
    }>,
  ) {
    const nextPoints: UserSavedPoint[] = importedPoints.map((point, index) => ({
      id: `saved-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
      name: point.name.trim(),
      icon: point.icon,
      coordinates: point.coordinates,
      districtId: getDistrictIdForCoordinates(point.coordinates),
      createdAt: new Date().toISOString(),
    }))

    setSavedPoints(nextPoints)
    setSelectedSavedPointId(null)
    setSelectedDistrictId(null)
  }

  function handleSavedPointsClear() {
    setSavedPoints([])
    setSelectedSavedPointId(null)
    setSelectedDistrictId(null)
  }

  const filteredDistricts = allDistricts.filter((district) => {
    if (!matchesSelectedGrades(district.ratings.overall, selectedGrades)) {
      return false
    }

    if (
      selectedLifestyleTags.length > 0 &&
      !selectedLifestyleTags.every((tag) => district.lifestyleTags.includes(tag))
    ) {
      return false
    }

    return true
  })
  const visibleDistricts = sortDistricts(filteredDistricts, sortMode)
  const visibleDistrictIds = visibleDistricts.map((district) => district.id)

  if (
    selectedDistrictId &&
    !visibleDistrictIds.includes(selectedDistrictId) &&
    allDistrictsById[selectedDistrictId]
  ) {
    visibleDistrictIds.push(selectedDistrictId)
  }

  const selectedDistrict = selectedDistrictId ? allDistrictsById[selectedDistrictId] ?? null : null
  const selectedSavedPoint = selectedSavedPointId
    ? savedPoints.find((point) => point.id === selectedSavedPointId) ?? null
    : null
  const selectedDistrictFeature =
    selectedDistrictId && postalData
      ? postalData.features.find((feature) => feature.properties.id === selectedDistrictId) ?? null
      : null
  const selectedDistrictGoogleMapsUrl = selectedDistrict
    ? createDistrictGoogleMapsUrl(selectedDistrict, selectedDistrictFeature
        ? {
            center: getBoundsCenter(getFeatureFocusBounds(selectedDistrictFeature)),
            zoom: estimateGoogleMapsZoom(getFeatureFocusBounds(selectedDistrictFeature)),
          }
        : undefined)
    : null
  const selectedDistrictDaftRentLink = selectedDistrict
    ? createDistrictDaftRentLink(selectedDistrict)
    : null

  return (
    <main className="app-shell" data-sidebar-open={isSidebarOpen} data-testid="app-shell">
      <DistrictSidebar
        availableGrades={AVAILABLE_GRADES}
        districts={visibleDistricts}
        isOpen={isSidebarOpen}
        selectedDistrictId={selectedDistrictId}
        selectedGrades={selectedGrades}
        selectedLifestyleTags={selectedLifestyleTags}
        sortMode={sortMode}
        onDistrictSelect={handleDistrictSelect}
        onGradePresetSelect={handleGradePresetSelect}
        onGradeToggle={handleGradeToggle}
        onLifestyleTagToggle={handleLifestyleTagToggle}
        onResetFilters={handleResetFilters}
        onSavedPointClear={handleSavedPointsClear}
        onSavedPointDelete={handleSavedPointDelete}
        onSavedPointImport={handleSavedPointsImport}
        onSavedPointSelect={handleSavedPointSelect}
        onSavedPointUpdate={handleSavedPointUpdate}
        onSortModeChange={setSortMode}
        onSubareaSelect={handleSubareaSelect}
        onToggleOpen={() => setIsSidebarOpen(false)}
        savedPoints={savedPoints}
        selectedSavedPointId={selectedSavedPointId}
      />

      <section className="map-panel">
        <div className="map-stage">
          <MapControls
            districtCount={visibleDistricts.length}
            isSidebarOpen={isSidebarOpen}
            labelMode={districtLabelMode}
            onCoordinateFocus={handleCoordinateFocus}
            onResetView={handleResetView}
            onSavedPointDelete={handleSavedPointDelete}
            opacity={overlayOpacity}
            onLabelModeChange={setDistrictLabelMode}
            onOpacityChange={setOverlayOpacity}
            onShowDistrictLabelsChange={setShowDistrictLabels}
            onTransportToggle={handleTransportToggle}
            onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
            selectedDistrict={selectedDistrict}
            selectedDistrictDaftRentLink={selectedDistrictDaftRentLink}
            selectedDistrictGoogleMapsUrl={selectedDistrictGoogleMapsUrl}
            selectedSavedPoint={selectedSavedPoint}
            showDistrictLabels={showDistrictLabels}
            transportAvailable={Boolean(transportData?.features.length)}
            transportVisibility={transportVisibility}
          />

          <DublinMap
            data={postalData}
            focusRequest={focusRequest}
            isLoading={isLoading}
            loadError={loadError}
            overlayOpacity={overlayOpacity}
            onSavedPointCreate={handleSavedPointCreate}
            selectedDistrictId={selectedDistrictId}
            selectedSavedPointId={selectedSavedPointId}
            labelMode={districtLabelMode}
            onSavedPointSelect={handleSavedPointSelect}
            showDistrictLabels={showDistrictLabels}
            savedPoints={savedPoints}
            transportData={transportData}
            transportVisibility={transportVisibility}
            visibleDistrictIds={visibleDistrictIds}
            onDistrictSelect={handleDistrictSelect}
          />
        </div>
      </section>
    </main>
  )
}
