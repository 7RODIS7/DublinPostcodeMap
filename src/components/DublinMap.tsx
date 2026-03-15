import { useEffect, useRef, useState } from 'react'
import type { Layer, Path, PathOptions } from 'leaflet'
import L from 'leaflet'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Marker,
  Pane,
  TileLayer,
  useMap,
} from 'react-leaflet'
import { districtMetaById } from '../lib/districtUtils'
import { getDistrictColor } from '../lib/districtColors'
import { getFeatureFocusBounds, getFeatureLabelPlacement } from '../lib/geo'
import { clampRating, getOverallScore } from '../lib/districtRatings'
import type {
  FocusRequest,
  MapLabelMode,
  DistrictMetricKey,
  PostalFeature,
  PostalFeatureCollection,
  TransportFeature,
  TransportFeatureCollection,
  TransportLayerKey,
  TransportLayerVisibility,
} from '../types/districts'

const DUBLIN_CENTER: L.LatLngTuple = [53.3498, -6.2603]
const DUBLIN_ZOOM = 11
const FULL_EXTENDED_LABEL_MIN_DISTANCE = 0.018
const MICRO_EXTENDED_LABEL_MIN_DISTANCE = 0.006

type DublinMapProps = {
  data: PostalFeatureCollection | null
  focusRequest: FocusRequest | null
  isLoading: boolean
  labelMode: MapLabelMode
  loadError: string | null
  overlayOpacity: number
  selectedDistrictId: string | null
  showDistrictLabels: boolean
  transportData: TransportFeatureCollection | null
  transportVisibility: TransportLayerVisibility
  visibleDistrictIds: string[]
  onDistrictSelect: (districtId: string) => void
}

type MapLabelVariant = 'compact' | 'micro' | 'extended'
const transportLayerOrder: TransportLayerKey[] = ['rail', 'luas', 'metro', 'bus']

function buildDistrictStyle(
  districtId: string,
  selectedDistrictId: string | null,
  overlayOpacity: number,
  visibleDistrictIds: Set<string>,
): PathOptions {
  const isSelected = districtId === selectedDistrictId
  const isVisible = visibleDistrictIds.has(districtId)
  const zoneType = districtMetaById[districtId]?.zoneType ?? 'legacy-district'
  const dashArray = isSelected ? undefined : zoneType === 'routing-key' ? '3 7' : '6 6'

  return {
    color: isSelected
      ? '#18242b'
      : isVisible
        ? 'rgba(255, 255, 255, 0.96)'
        : 'rgba(255, 255, 255, 0.38)',
    dashArray,
    fillColor: getDistrictColor(districtId),
    fillOpacity: isSelected
      ? Math.min(overlayOpacity + 0.12, 0.5)
      : isVisible
        ? overlayOpacity
        : Math.min(overlayOpacity, 0.06),
    opacity: isVisible ? 0.95 : 0.55,
    weight: isSelected ? 3.5 : isVisible ? 1.7 : 1.1,
  }
}

function buildHoverStyle(districtId: string, overlayOpacity: number): PathOptions {
  const zoneType = districtMetaById[districtId]?.zoneType ?? 'legacy-district'

  return {
    color: '#18242b',
    dashArray: zoneType === 'routing-key' ? '2 4' : undefined,
    fillColor: getDistrictColor(districtId),
    fillOpacity: Math.min(overlayOpacity + 0.18, 0.58),
    opacity: 1,
    weight: 4,
  }
}

function MapInstanceBridge({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap()

  useEffect(() => {
    onReady(map)
  }, [map, onReady])

  return null
}

function getMetricIcon(metricKey: DistrictMetricKey): string {
  if (metricKey === 'safety') {
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1.5 13 3.4v3.9c0 3.2-2.1 5.8-5 7.2-2.9-1.4-5-4-5-7.2V3.4L8 1.5Z" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linejoin="round"/></svg>'
  }

  if (metricKey === 'transit') {
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2.5" width="10" height="8.3" rx="2.1" fill="none" stroke="currentColor" stroke-width="1.35"/><path d="M5 12.5h6M5.2 14l1.1-1.5M10.8 14l-1.1-1.5M5.4 5.4h5.2" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'
  }

  if (metricKey === 'parks') {
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.4c1.7 0 3 1.2 3.2 2.8 1.1.2 2 1.2 2 2.4 0 1.5-1.2 2.7-2.7 2.7H5.4A2.4 2.4 0 0 1 3 7.9c0-1.2.9-2.3 2.1-2.5.4-1.7 1.6-3 2.9-3Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M8 10.3v3.3M6.5 13.6h3" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'
  }

  if (metricKey === 'schools') {
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="m2.1 5.4 5.9-2.6 5.9 2.6L8 8 2.1 5.4Z" fill="none" stroke="currentColor" stroke-width="1.25" stroke-linejoin="round"/><path d="M4.3 6.4v2.4c0 1.2 1.7 2.1 3.7 2.1s3.7-.9 3.7-2.1V6.4" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M13.2 5.7v3.1" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>'
  }

  if (metricKey === 'amenities') {
    return '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 6.1c0-1 .8-1.8 1.8-1.8h6.4c1 0 1.8.8 1.8 1.8v5.4c0 .7-.6 1.3-1.3 1.3H4.3c-.7 0-1.3-.6-1.3-1.3V6.1Z" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/><path d="M5.2 4.3V3.4c0-.8.6-1.4 1.4-1.4h2.8c.8 0 1.4.6 1.4 1.4v.9M3 7.6h10" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  }

  return '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.2" fill="none" stroke="currentColor" stroke-width="1.25"/><path d="M8.2 4.6c-1.2 0-2 .7-2 1.6 0 .8.5 1.2 1.8 1.5 1.3.3 1.8.6 1.8 1.4 0 .8-.7 1.4-1.8 1.4-1 0-1.7-.3-2.2-.9M8 3.6v8.8" fill="none" stroke="currentColor" stroke-width="1.15" stroke-linecap="round"/></svg>'
}

function getMetricsMarkup(districtId: string): string {
  const district = districtMetaById[districtId]

  if (!district) {
    return ''
  }

  const metricKeys: DistrictMetricKey[] = [
    'safety',
    'transit',
    'parks',
    'schools',
    'amenities',
    'value',
  ]

  return metricKeys
    .map((metricKey) => {
      const value = clampRating(district.ratings.metrics[metricKey])
      return `
        <span class="district-label__metric" data-metric="${metricKey}">
          <span class="district-label__metric-icon">${getMetricIcon(metricKey)}</span>
          <span class="district-label__metric-value">${value}</span>
        </span>
      `
    })
    .join('')
}

function createDistrictLabelIcon(
  districtId: string,
  isSelected: boolean,
  variant: MapLabelVariant,
): L.DivIcon {
  const district = districtMetaById[districtId]
  const shortName = district?.shortName ?? districtId
  const overall = district?.ratings.overall?.toLowerCase() ?? 'c'
  const isMicro = variant === 'micro'
  const isExtended = variant === 'extended' && district
  const score = district ? getOverallScore(district.ratings).toFixed(1) : ''
  const labelWidth = isExtended
    ? Math.max(132, shortName.length * 8 + 96)
    : isMicro
      ? Math.max(96, shortName.length * 8 + 66)
      : Math.max(34, shortName.length * 8 + 16)
  const labelHeight = isExtended ? 56 : isMicro ? 40 : 26

  return L.divIcon({
    className: 'district-label-icon',
    html: `
      <button
        type="button"
        class="district-label${isSelected ? ' district-label--selected' : ''}${isExtended ? ' district-label--extended' : isMicro ? ' district-label--micro' : ' district-label--compact'}"
        data-testid="district-label-${districtId}"
        data-grade="${overall}"
        data-zone-type="${district?.zoneType ?? 'legacy-district'}"
        aria-label="${district?.name ?? shortName}"
      >
        <span class="district-label__code">${shortName}</span>
        ${
          isExtended || isMicro
            ? `
        <span class="district-label__details">
          <span class="district-label__summary">
            <span class="district-label__grade">${district.ratings.overall}</span>
            <span class="district-label__score">${score}</span>
          </span>
          <span class="district-label__metrics">${getMetricsMarkup(districtId)}</span>
        </span>
        `
            : ''
        }
      </button>
    `,
    iconSize: [labelWidth, labelHeight],
    iconAnchor: [labelWidth / 2, labelHeight / 2],
  })
}

export function DublinMap({
  data,
  focusRequest,
  isLoading,
  labelMode,
  loadError,
  overlayOpacity,
  selectedDistrictId,
  showDistrictLabels,
  transportData,
  transportVisibility,
  visibleDistrictIds,
  onDistrictSelect,
}: DublinMapProps) {
  const [map, setMap] = useState<L.Map | null>(null)
  const layerByDistrictId = useRef(new Map<string, Path>())
  const featureByDistrictId = useRef(new Map<string, PostalFeature>())
  const interactionState = useRef({
    overlayOpacity,
    selectedDistrictId,
    visibleDistrictIds: new Set(visibleDistrictIds),
  })

  const visibleDistrictIdSet = new Set(visibleDistrictIds)

  interactionState.current = {
    overlayOpacity,
    selectedDistrictId,
    visibleDistrictIds: visibleDistrictIdSet,
  }

  useEffect(() => {
    layerByDistrictId.current.forEach((layer, districtId) => {
      layer.setStyle(
        buildDistrictStyle(
          districtId,
          selectedDistrictId,
          overlayOpacity,
          visibleDistrictIdSet,
        ),
      )
    })

    if (!selectedDistrictId) {
      return
    }

    const activeLayer = layerByDistrictId.current.get(selectedDistrictId)
    activeLayer?.bringToFront()
  }, [overlayOpacity, selectedDistrictId, data, visibleDistrictIds])

  useEffect(() => {
    if (!map || !focusRequest) {
      return
    }

    if (focusRequest.kind === 'reset') {
      map.flyTo(DUBLIN_CENTER, DUBLIN_ZOOM, {
        animate: true,
        duration: 0.85,
      })
      return
    }

    if (focusRequest.kind === 'district') {
      const feature =
        featureByDistrictId.current.get(focusRequest.districtId) ??
        data?.features.find((item) => item.properties.id === focusRequest.districtId)

      if (feature) {
        map.flyToBounds(getFeatureFocusBounds(feature), {
          animate: true,
          duration: 0.8,
          maxZoom: 14,
          padding: [34, 34],
        })
      }
      return
    }

    map.flyTo(focusRequest.coordinates, focusRequest.zoom ?? 14, {
      animate: true,
      duration: 0.8,
    })
  }, [map, focusRequest])

  function handleEachFeature(feature: PostalFeature, layer: Layer) {
    const districtId = feature.properties.id
    const districtName = feature.properties.name

    if (!districtId || !(layer instanceof L.Path)) {
      return
    }

    layerByDistrictId.current.set(districtId, layer)
    featureByDistrictId.current.set(districtId, feature)

    layer.bindTooltip(districtName, {
      className: 'district-tooltip',
      direction: 'top',
      sticky: true,
    })

    layer.on({
      mouseover: () => {
        layer.setStyle(
          buildHoverStyle(districtId, interactionState.current.overlayOpacity),
        )
        layer.bringToFront()
      },
      mouseout: () => {
        layer.setStyle(
          buildDistrictStyle(
            districtId,
            interactionState.current.selectedDistrictId,
            interactionState.current.overlayOpacity,
            interactionState.current.visibleDistrictIds,
          ),
        )
      },
      click: () => {
        onDistrictSelect(districtId)
      },
    })
  }

  const districtLabels = data
    ? data.features
        .filter((feature) => visibleDistrictIdSet.has(feature.properties.id))
        .map((feature) => {
          const placement = getFeatureLabelPlacement(feature)
          let labelVariant: MapLabelVariant = 'compact'

          if (labelMode === 'extended') {
            if (placement.distance >= FULL_EXTENDED_LABEL_MIN_DISTANCE) {
              labelVariant = 'extended'
            } else if (placement.distance >= MICRO_EXTENDED_LABEL_MIN_DISTANCE) {
              labelVariant = 'micro'
            }
          }

          return {
            districtId: feature.properties.id,
            position: placement.position,
            labelVariant,
          }
        })
    : []

  function getTransportLayerData(network: TransportLayerKey): TransportFeatureCollection | null {
    if (!transportData || !transportVisibility[network]) {
      return null
    }

    const features = transportData.features.filter(
      (feature) => feature.properties.network === network,
    )

    if (features.length === 0) {
      return null
    }

    return {
      type: 'FeatureCollection',
      features,
    }
  }

  function buildTransportStyle(feature: TransportFeature | undefined): PathOptions {
    const network = feature?.properties?.network ?? 'bus'
    const color = feature?.properties?.color ?? '#4c6f84'

    if (network === 'rail') {
      return {
        color,
        weight: 4.2,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
        className: 'transport-line transport-line--rail',
      }
    }

    if (network === 'luas') {
      return {
        color,
        weight: 3.8,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
        className: 'transport-line transport-line--luas',
      }
    }

    if (network === 'metro') {
      return {
        color: '#7c4ad8',
        weight: 4,
        opacity: 0.88,
        dashArray: '14 8 3 8',
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
        className: 'transport-line transport-line--metro',
      }
    }

    return {
      color,
      weight: 2.3,
      opacity: 0.42,
      dashArray: '10 8',
      lineCap: 'round',
      lineJoin: 'round',
      interactive: false,
      className: 'transport-line transport-line--bus',
    }
  }

  return (
    <div className="map-canvas" data-testid="map-canvas">
      <MapContainer
        center={DUBLIN_CENTER}
        className="leaflet-shell"
        preferCanvas
        zoom={DUBLIN_ZOOM}
        zoomControl={false}
      >
        <MapInstanceBridge onReady={setMap} />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <Pane name="transport" style={{ zIndex: 330 }}>
          {transportLayerOrder.map((network) => {
            const layerData = getTransportLayerData(network)

            if (!layerData) {
              return null
            }

            return (
              <GeoJSON
                key={`transport-${network}-${layerData.features.length}`}
                data={layerData}
                style={(feature) => buildTransportStyle(feature as TransportFeature)}
              />
            )
          })}
        </Pane>

        {data ? (
          <GeoJSON
            key={data.features.length}
            data={data}
            onEachFeature={handleEachFeature}
            style={(feature) =>
              buildDistrictStyle(
                feature?.properties?.id ?? '',
                selectedDistrictId,
                overlayOpacity,
                visibleDistrictIdSet,
              )
            }
          />
        ) : null}

        {showDistrictLabels
          ? districtLabels.map((label) => (
              <Marker
                key={label.districtId}
                eventHandlers={{
                  click: () => onDistrictSelect(label.districtId),
                }}
                icon={createDistrictLabelIcon(
                  label.districtId,
                  label.districtId === selectedDistrictId,
                  label.labelVariant,
                )}
                keyboard={false}
                position={label.position}
                zIndexOffset={label.districtId === selectedDistrictId ? 900 : 500}
              />
            ))
          : null}

        {focusRequest?.kind === 'subarea' ? (
          <CircleMarker
            center={focusRequest.coordinates}
            pathOptions={{
              color: '#18242b',
              fillColor: '#f08a5d',
              fillOpacity: 0.95,
              weight: 2.5,
            }}
            radius={8}
          />
        ) : null}
      </MapContainer>

      {isLoading ? (
        <div className="map-status">
          <strong>Loading postal areas...</strong>
          <span>GeoJSON is loaded from local static files for fast rendering.</span>
        </div>
      ) : null}

      {loadError ? (
        <div className="map-status map-status--error">
          <strong>Map data unavailable</strong>
          <span>{loadError}</span>
        </div>
      ) : null}
    </div>
  )
}
