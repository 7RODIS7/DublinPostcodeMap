import { useEffect, useState, type FormEvent } from 'react'
import { DistrictMetricPills } from './DistrictMetricPills'
import { formatCoordinates, parseCoordinateInput } from '../lib/coordinateSearch'
import {
  ratingMetricDescriptions,
  ratingMetricLabels,
  ratingMetricOrder,
} from '../lib/districtRatings'
import { lifestyleTagDescriptions, lifestyleTagLabels } from '../data/districtTags'
import type { DistrictDaftRentLink } from '../lib/daft'
import type {
  DistrictWithSubareas,
  MapLabelMode,
  TransportLayerKey,
  TransportLayerVisibility,
} from '../types/districts'

type MapControlsProps = {
  districtCount: number
  isSidebarOpen: boolean
  labelMode: MapLabelMode
  opacity: number
  onCoordinateFocus: (payload: {
    coordinates: [number, number]
    zoom?: number
  }) => void
  onLabelModeChange: (mode: MapLabelMode) => void
  onOpacityChange: (opacity: number) => void
  onResetView: () => void
  onShowDistrictLabelsChange: (enabled: boolean) => void
  onTransportToggle: (layerKey: TransportLayerKey) => void
  onToggleSidebar: () => void
  selectedDistrict: DistrictWithSubareas | null
  selectedDistrictDaftRentLink: DistrictDaftRentLink | null
  selectedDistrictGoogleMapsUrl: string | null
  showDistrictLabels: boolean
  transportAvailable: boolean
  transportVisibility: TransportLayerVisibility
}

export function MapControls({
  districtCount,
  isSidebarOpen,
  labelMode,
  opacity,
  onCoordinateFocus,
  onLabelModeChange,
  onOpacityChange,
  onResetView,
  onShowDistrictLabelsChange,
  onTransportToggle,
  onToggleSidebar,
  selectedDistrict,
  selectedDistrictDaftRentLink,
  selectedDistrictGoogleMapsUrl,
  showDistrictLabels,
  transportAvailable,
  transportVisibility,
}: MapControlsProps) {
  const [openPanel, setOpenPanel] = useState<'selection' | 'settings' | 'coordinates' | null>(
    null,
  )
  const [isLegendOpen, setIsLegendOpen] = useState(false)
  const [coordinateQuery, setCoordinateQuery] = useState('')
  const [coordinateError, setCoordinateError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedDistrict) {
      return
    }

    setOpenPanel('selection')
  }, [selectedDistrict])

  function handleCoordinateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const parsed = parseCoordinateInput(coordinateQuery)
    if (!parsed) {
      setCoordinateError('Enter `lat, lng` or paste a Google Maps URL with coordinates.')
      return
    }

    setCoordinateError(null)
    setCoordinateQuery(formatCoordinates(parsed.coordinates, 5))
    onCoordinateFocus(parsed)
  }

  return (
    <div className="map-toolbar">
      <div className="map-toolbar__row">
        <div className="map-toolbar__cluster">
          {!isSidebarOpen ? (
            <button
              type="button"
              className="toolbar-button toolbar-button--glass"
              data-testid="sidebar-toggle-show"
              onClick={onToggleSidebar}
            >
              Show menu
            </button>
          ) : null}
        </div>

        <div className="map-toolbar__cluster map-toolbar__cluster--end map-toolbar__cluster--popover">
          <div className="map-toolbar__actions">
            <button
              type="button"
              className="toolbar-button toolbar-button--dark"
              data-active={openPanel === 'selection'}
              data-testid="selection-toggle"
              onClick={() =>
                setOpenPanel((current) => (current === 'selection' ? null : 'selection'))
              }
            >
              Selection
              {selectedDistrict ? (
                <span className="toolbar-button__badge">{selectedDistrict.shortName}</span>
              ) : null}
            </button>

            <button
              type="button"
              className="toolbar-button toolbar-button--dark"
              data-active={openPanel === 'coordinates'}
              data-testid="coordinates-toggle"
              onClick={() =>
                setOpenPanel((current) => (current === 'coordinates' ? null : 'coordinates'))
              }
            >
              Coordinates
            </button>

            <button
              type="button"
              className="toolbar-button toolbar-button--dark"
              data-active={openPanel === 'settings'}
              data-testid="settings-toggle"
              onClick={() =>
                setOpenPanel((current) => (current === 'settings' ? null : 'settings'))
              }
            >
              Settings
            </button>
          </div>

          {openPanel === 'selection' ? (
            <section className="selection-card map-popover" data-testid="selection-popover">
              <div className="selection-card__topline">
                <p className="map-toolbar__eyebrow">Selection</p>
                <div className="selection-card__tools">
                  {selectedDistrictDaftRentLink && selectedDistrict ? (
                    <a
                      className="selection-card__icon-button"
                      data-testid="selection-daft-rent"
                      data-tooltip="Open rent on Daft.ie"
                      aria-label={`Open rent listings for ${selectedDistrictDaftRentLink.targetName} on Daft.ie`}
                      href={selectedDistrictDaftRentLink.url}
                      rel="noreferrer"
                      target="_blank"
                      title={`Open rent listings for ${selectedDistrictDaftRentLink.targetName} on Daft.ie`}
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path
                          d="M2.7 7.2 8 3l5.3 4.2v5.4a1 1 0 0 1-1 1h-2.4V9.4H6.1v4.2H3.7a1 1 0 0 1-1-1V7.2Z"
                          fill="none"
                          stroke="currentColor"
                          strokeLinejoin="round"
                          strokeWidth="1.2"
                        />
                        <path
                          d="M6.1 13.6V9.4h3.8v4.2"
                          fill="none"
                          stroke="currentColor"
                          strokeLinejoin="round"
                          strokeWidth="1.2"
                        />
                      </svg>
                    </a>
                  ) : null}
                  {selectedDistrictGoogleMapsUrl && selectedDistrict ? (
                    <a
                      className="selection-card__icon-button"
                      data-testid="selection-google-maps"
                      data-tooltip="Open in Google Maps"
                      aria-label="Open selected area in Google Maps"
                      href={selectedDistrictGoogleMapsUrl}
                      rel="noreferrer"
                      target="_blank"
                      title="Open in Google Maps"
                    >
                      <svg viewBox="0 0 16 16" aria-hidden="true">
                        <path
                          d="M8 14c-2.4-2.8-3.8-5.1-3.8-7A3.8 3.8 0 0 1 8 3.2 3.8 3.8 0 0 1 11.8 7c0 1.9-1.4 4.2-3.8 7Z"
                          fill="none"
                          stroke="currentColor"
                          strokeLinejoin="round"
                          strokeWidth="1.2"
                        />
                        <circle cx="8" cy="7" r="1.35" fill="none" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    </a>
                  ) : null}
                  <button
                    type="button"
                    className="selection-card__icon-button"
                    data-tooltip="Show legend"
                    aria-expanded={isLegendOpen}
                    aria-label="Show grade and area legend"
                    onClick={() => setIsLegendOpen((current) => !current)}
                  >
                    ?
                  </button>
                </div>
              </div>

              {selectedDistrict ? (
                <>
                  <div className="selection-card__head selection-card__head--stacked">
                    <strong data-testid="selected-district-name">{selectedDistrict.name}</strong>

                    <div className="selection-card__tags">
                      <span className="selection-card__code">{selectedDistrict.shortName}</span>
                      <span
                        className="grade-pill"
                        data-grade={selectedDistrict.ratings.overall.toLowerCase()}
                      >
                        Grade {selectedDistrict.ratings.overall}
                      </span>
                      {selectedDistrict.lifestyleTags.map((tag) => (
                        <span
                          key={`${selectedDistrict.id}-${tag}`}
                          className="lifestyle-pill lifestyle-pill--primary"
                        >
                          {lifestyleTagLabels[tag]}
                        </span>
                      ))}
                    </div>
                  </div>

                  <p className="selection-card__summary">{selectedDistrict.ratings.summary}</p>

                  {selectedDistrict.highlights.length > 0 ? (
                    <div className="selection-card__notes">
                      <span className="selection-card__notes-label">Local notes</span>
                      <div className="selection-card__highlights">
                        {selectedDistrict.highlights.map((highlight) => (
                          <span
                            key={`${selectedDistrict.id}-${highlight}`}
                            className="selection-note-pill"
                          >
                            {highlight}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <DistrictMetricPills compact ratings={selectedDistrict.ratings} />
                </>
              ) : (
                <>
                  <strong data-testid="selected-district-name">No area selected</strong>
                  <p className="selection-card__summary">
                    Click any map area, label or place in the list to inspect it here.
                  </p>
                </>
              )}

              {isLegendOpen ? (
                <div className="selection-card__legend" data-testid="selection-legend">
                  <div className="selection-card__legend-group">
                    <strong>Grades</strong>
                    <span>A = easiest to recommend overall</span>
                    <span>B = solid option with some trade-offs</span>
                    <span>C = mixed, so the exact pocket matters</span>
                    <span>D = more caution needed before choosing</span>
                  </div>
                  <div className="selection-card__legend-group">
                    <strong>Zone labels</strong>
                    <span>D codes = classic Dublin postal districts</span>
                    <span>A/K codes = outer Dublin and suburban postcode zones</span>
                    <span>Boundary note = lines are a practical guide, especially for A/K areas</span>
                  </div>
                  <div className="selection-card__legend-group">
                    <strong>Metrics</strong>
                    {ratingMetricOrder.map((metricKey) => (
                      <span key={metricKey}>
                        {ratingMetricLabels[metricKey]} = {ratingMetricDescriptions[metricKey]}
                      </span>
                    ))}
                  </div>
                  <div className="selection-card__legend-group">
                    <strong>Lifestyle tags</strong>
                    {(
                      Object.keys(lifestyleTagLabels) as Array<keyof typeof lifestyleTagLabels>
                    ).map((tag) => (
                      <span key={tag}>
                        {lifestyleTagLabels[tag]} = {lifestyleTagDescriptions[tag]}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </section>
          ) : null}

          {openPanel === 'coordinates' ? (
            <section
              className="map-coordinate-search map-popover"
              data-testid="coordinate-search-popover"
            >
              <div className="map-coordinate-search__header">
                <div>
                  <p className="map-toolbar__eyebrow">Jump to point</p>
                  <h2>Coordinates</h2>
                </div>
                <button
                  type="button"
                  className="toolbar-button toolbar-button--soft"
                  onClick={() => {
                    setCoordinateError(null)
                    setCoordinateQuery('')
                  }}
                >
                  Clear
                </button>
              </div>

              <form className="map-coordinate-search__form" onSubmit={handleCoordinateSubmit}>
                <label className="map-coordinate-search__field" htmlFor="coordinate-search-input">
                  <span>Paste `lat, lng` or a Google Maps URL</span>
                  <input
                    id="coordinate-search-input"
                    data-testid="coordinate-search-input"
                    placeholder="53.3498, -6.2603 or https://maps.google.com/..."
                    type="text"
                    value={coordinateQuery}
                    onChange={(event) => {
                      setCoordinateQuery(event.target.value)
                      if (coordinateError) {
                        setCoordinateError(null)
                      }
                    }}
                  />
                </label>

                <p className="map-coordinate-search__hint">
                  Works with plain coordinates and Google Maps links that contain the point.
                </p>

                {coordinateError ? (
                  <p
                    className="map-coordinate-search__error"
                    data-testid="coordinate-search-error"
                  >
                    {coordinateError}
                  </p>
                ) : null}

                <button
                  type="submit"
                  className="map-coordinate-search__submit"
                  data-testid="coordinate-search-submit"
                >
                  Find place
                </button>
              </form>
            </section>
          ) : null}

          {openPanel === 'settings' ? (
            <section className="map-settings map-popover" data-testid="map-settings">
              <div className="map-settings__header">
                <div>
                  <p className="map-toolbar__eyebrow">Map settings</p>
                  <h2>Display</h2>
                  <p>{districtCount} postal areas visible under current filters.</p>
                </div>

                <button
                  type="button"
                  className="toolbar-button toolbar-button--soft"
                  onClick={onResetView}
                >
                  Reset view
                </button>
              </div>

              <div className="map-settings__controls">
                <label className="map-settings__slider">
                  <span>Overlay opacity</span>
                  <strong>{Math.round(opacity * 100)}%</strong>
                  <input
                    type="range"
                    min="0.08"
                    max="0.55"
                    step="0.01"
                    value={opacity}
                    onChange={(event) => onOpacityChange(Number(event.target.value))}
                  />
                </label>

                <label className="map-settings__switch">
                  <span>
                    <strong>Map labels</strong>
                    <small>Show district badges directly inside each visible area.</small>
                  </span>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={showDistrictLabels}
                    className="switch-button"
                    data-testid="district-labels-toggle"
                    data-active={showDistrictLabels}
                    onClick={() => onShowDistrictLabelsChange(!showDistrictLabels)}
                  >
                    <span className="switch-button__track" />
                    <span className="switch-button__label">
                      {showDistrictLabels ? 'On' : 'Off'}
                    </span>
                  </button>
                </label>

                {showDistrictLabels ? (
                  <div className="map-settings__group">
                    <div className="map-settings__group-copy">
                      <strong>Label detail</strong>
                      <small>
                        Compact keeps only the area code. Extended adds score
                        and icon metrics, with a tighter mini-layout used
                        automatically in smaller central districts.
                      </small>
                    </div>

                    <div
                      className="segmented-control"
                      role="radiogroup"
                      aria-label="Map label detail"
                    >
                      <button
                        type="button"
                        className="segmented-control__option"
                        data-active={labelMode === 'compact'}
                        data-testid="district-label-mode-compact"
                        onClick={() => onLabelModeChange('compact')}
                      >
                        <span className="segmented-control__title">Code only</span>
                        <span className="segmented-control__hint">Lowest noise</span>
                      </button>

                      <button
                        type="button"
                        className="segmented-control__option"
                        data-active={labelMode === 'extended'}
                        data-testid="district-label-mode-extended"
                        onClick={() => onLabelModeChange('extended')}
                      >
                        <span className="segmented-control__title">Extended</span>
                        <span className="segmented-control__hint">Grade + stats</span>
                      </button>
                    </div>
                  </div>
                ) : null}

                {transportAvailable ? (
                  <div className="map-settings__group">
                    <div className="map-settings__group-copy">
                      <strong>Transport overlays</strong>
                      <small>
                        Rail, Luas and main buses come from official TFI GTFS. MetroLink is shown as a separate planned alignment.
                      </small>
                    </div>

                    <div className="map-settings__stack">
                      <label className="map-settings__switch">
                        <span>
                          <strong>Rail</strong>
                          <small>DART and key commuter rail branches around Dublin.</small>
                        </span>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={transportVisibility.rail}
                          className="switch-button"
                          data-testid="transport-toggle-rail"
                          data-active={transportVisibility.rail}
                          onClick={() => onTransportToggle('rail')}
                        >
                          <span className="switch-button__track" />
                          <span className="switch-button__label">
                            {transportVisibility.rail ? 'On' : 'Off'}
                          </span>
                        </button>
                      </label>

                      <label className="map-settings__switch">
                        <span>
                          <strong>Luas</strong>
                          <small>Red and Green tram lines.</small>
                        </span>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={transportVisibility.luas}
                          className="switch-button"
                          data-testid="transport-toggle-luas"
                          data-active={transportVisibility.luas}
                          onClick={() => onTransportToggle('luas')}
                        >
                          <span className="switch-button__track" />
                          <span className="switch-button__label">
                            {transportVisibility.luas ? 'On' : 'Off'}
                          </span>
                        </button>
                      </label>

                      <label className="map-settings__switch">
                        <span>
                          <strong>Main buses</strong>
                          <small>Core Dublin Bus and Go-Ahead routes, not every service.</small>
                        </span>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={transportVisibility.bus}
                          className="switch-button"
                          data-testid="transport-toggle-bus"
                          data-active={transportVisibility.bus}
                          onClick={() => onTransportToggle('bus')}
                        >
                          <span className="switch-button__track" />
                          <span className="switch-button__label">
                            {transportVisibility.bus ? 'On' : 'Off'}
                          </span>
                        </button>
                      </label>

                      <label className="map-settings__switch">
                        <span>
                          <strong>MetroLink</strong>
                          <small>Planned Swords to city-centre alignment from the official Railway Order map.</small>
                        </span>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={transportVisibility.metro}
                          className="switch-button"
                          data-testid="transport-toggle-metro"
                          data-active={transportVisibility.metro}
                          onClick={() => onTransportToggle('metro')}
                        >
                          <span className="switch-button__track" />
                          <span className="switch-button__label">
                            {transportVisibility.metro ? 'On' : 'Off'}
                          </span>
                        </button>
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}
        </div>
      </div>
    </div>
  )
}
