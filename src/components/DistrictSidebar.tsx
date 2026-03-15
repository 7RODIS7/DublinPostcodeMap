import { useState } from 'react'
import { lifestyleTagLabels } from '../data/districtTags'
import { getDistrictColor } from '../lib/districtColors'
import { createSubareaGoogleMapsUrl } from '../lib/googleMaps'
import { clampRating, getOverallScore, ratingMetricLabels } from '../lib/districtRatings'
import { MetricIcon } from './MetricIcon'
import type {
  DistrictGrade,
  DistrictMetricKey,
  DistrictLifestyleTag,
  DistrictSortMode,
  DistrictSubarea,
  DistrictWithSubareas,
} from '../types/districts'

type DistrictSidebarProps = {
  districts: DistrictWithSubareas[]
  isOpen: boolean
  selectedDistrictId: string | null
  selectedGrades: DistrictGrade[]
  selectedLifestyleTags: DistrictLifestyleTag[]
  sortMode: DistrictSortMode
  onDistrictSelect: (districtId: string) => void
  onGradePresetSelect: (preset: 'all' | 'b-plus') => void
  onGradeToggle: (grade: DistrictGrade) => void
  onLifestyleTagToggle: (tag: DistrictLifestyleTag) => void
  onResetFilters: () => void
  onSortModeChange: (sortMode: DistrictSortMode) => void
  onSubareaSelect: (subarea: DistrictSubarea) => void
  onToggleOpen: () => void
}

export function DistrictSidebar({
  districts,
  isOpen,
  selectedDistrictId,
  selectedGrades,
  selectedLifestyleTags,
  sortMode,
  onDistrictSelect,
  onGradePresetSelect,
  onGradeToggle,
  onLifestyleTagToggle,
  onResetFilters,
  onSortModeChange,
  onSubareaSelect,
  onToggleOpen,
}: DistrictSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [expandedDistrictIds, setExpandedDistrictIds] = useState<Set<string>>(
    () => new Set(selectedDistrictId ? [selectedDistrictId] : []),
  )

  const normalizedQuery = searchTerm.trim().toLowerCase()
  const visibleDistricts = districts.filter((district) => {
    if (!normalizedQuery) {
      return true
    }

    const matchesDistrict =
      district.name.toLowerCase().includes(normalizedQuery) ||
      district.shortName.toLowerCase().includes(normalizedQuery) ||
      district.aliases.some((alias) => alias.toLowerCase().includes(normalizedQuery))

    const matchesSubarea = district.subareas.some((subarea) =>
      subarea.name.toLowerCase().includes(normalizedQuery),
    )

    return matchesDistrict || matchesSubarea
  })

  function toggleExpanded(districtId: string) {
    setExpandedDistrictIds((current) => {
      const next = new Set(current)
      if (next.has(districtId)) {
        next.delete(districtId)
      } else {
        next.add(districtId)
      }
      return next
    })
  }

  function getTypeBadgeLabel(zoneType: DistrictWithSubareas['zoneType']) {
    return zoneType === 'routing-key' ? 'Routing key' : null
  }

  function getSubareaKindLabel(kind: DistrictSubarea['kind']) {
    if (kind === 'street') {
      return 'Street'
    }

    if (kind === 'point') {
      return 'Place'
    }

    return 'Neighborhood'
  }

  function getSubareaMapLabel(subarea: DistrictSubarea) {
    return `Open ${subarea.name} in Google Maps`
  }

  function getActiveSortMetric(
    district: DistrictWithSubareas,
  ): { key: 'overall' | DistrictMetricKey; label: string; value: string } | null {
    if (sortMode === 'postal') {
      return null
    }

    if (sortMode === 'overall') {
      return {
        key: 'overall',
        label: 'Overall',
        value: `${getOverallScore(district.ratings).toFixed(1)}`,
      }
    }

    return {
      key: sortMode,
      label: ratingMetricLabels[sortMode],
      value: `${clampRating(district.ratings.metrics[sortMode])}`,
    }
  }

  const hasCustomFilters =
    selectedGrades.length !== 4 || selectedLifestyleTags.length > 0 || sortMode !== 'postal'
  const visiblePlacesCount = districts.reduce((sum, district) => sum + district.subareas.length, 0)
  const isAllGradesSelected = selectedGrades.length === 4
  const isBPlusSelected =
    selectedGrades.length === 2 &&
    selectedGrades.includes('A') &&
    selectedGrades.includes('B')

  return (
    <aside className="sidebar" data-open={isOpen} data-testid="sidebar">
      <header className="sidebar__header">
        <div className="sidebar__header-top">
          <div>
            <p className="sidebar__eyebrow">Dublin map</p>
            <h1>Postal areas</h1>
          </div>

          <button
            type="button"
            className="sidebar__collapse"
            data-testid="sidebar-toggle-hide"
            onClick={onToggleOpen}
          >
            Hide
          </button>
        </div>

        <p className="sidebar__meta-line" data-testid="sidebar-meta">
          {districts.length} areas · {visiblePlacesCount} places
        </p>

        <div className="sidebar__controls">
          <div className="sidebar__filter-block">
            <div className="sidebar__filter-head">
              <span className="search-field__label">Grades</span>
              {hasCustomFilters ? (
                <button
                  type="button"
                  className="sidebar__filter-reset"
                  data-testid="filters-reset"
                  onClick={onResetFilters}
                >
                  Reset
                </button>
              ) : null}
            </div>

            <div className="sidebar__chip-row sidebar__chip-row--preset">
              <button
                type="button"
                className="filter-chip filter-chip--preset"
                data-active={isAllGradesSelected}
                data-testid="grade-preset-all"
                onClick={() => onGradePresetSelect('all')}
              >
                All
              </button>
              <button
                type="button"
                className="filter-chip filter-chip--preset"
                data-active={isBPlusSelected}
                data-testid="grade-preset-b-plus"
                onClick={() => onGradePresetSelect('b-plus')}
              >
                B+
              </button>
            </div>

            <div className="sidebar__chip-row">
              {(['A', 'B', 'C', 'D'] as DistrictGrade[]).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  className="filter-chip filter-chip--grade"
                  data-active={selectedGrades.includes(grade)}
                  data-grade={grade.toLowerCase()}
                  data-testid={`grade-toggle-${grade.toLowerCase()}`}
                    onClick={() => onGradeToggle(grade)}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar__filter-block">
            <div className="sidebar__filter-head sidebar__filter-head--stacked">
              <span className="search-field__label">Lifestyle</span>
              <small>Selected tags must all match.</small>
            </div>

            <div className="sidebar__chip-row">
              {(Object.keys(lifestyleTagLabels) as DistrictLifestyleTag[]).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="filter-chip"
                  data-active={selectedLifestyleTags.includes(tag)}
                  data-testid={`tag-toggle-${tag}`}
                  onClick={() => onLifestyleTagToggle(tag)}
                >
                  {lifestyleTagLabels[tag]}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar__selects sidebar__selects--single">
            <label className="select-field">
              <span>Sort</span>
              <select
                value={sortMode}
                data-testid="sort-mode"
                onChange={(event) =>
                  onSortModeChange(event.target.value as DistrictSortMode)
                }
              >
                <option value="postal">Postal order</option>
                <option value="overall">Best overall</option>
                <option value="safety">Best safety</option>
                <option value="transit">Best transport</option>
                <option value="parks">Best green</option>
                <option value="schools">Best schools</option>
                <option value="amenities">Best amenities</option>
                <option value="value">Best value</option>
              </select>
            </label>
          </div>

          <label className="search-field">
            <span className="search-field__label">Search</span>
            <input
              type="search"
              placeholder="D6, A94, Malahide..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </label>
        </div>
      </header>

      <div className="sidebar__list" data-testid="district-sidebar">
        {visibleDistricts.length === 0 ? (
          <div className="sidebar__empty-state">
            No postal areas match the current filters.
          </div>
        ) : null}

        {visibleDistricts.map((district) => {
          const isExpanded = expandedDistrictIds.has(district.id)
          const isSelected = selectedDistrictId === district.id
          const typeBadgeLabel = getTypeBadgeLabel(district.zoneType)
          const activeSortMetric = getActiveSortMetric(district)

          return (
            <section
              key={district.id}
              className="district-card"
              data-selected={isSelected}
            >
              <div className="district-card__head">
                <span
                  className="district-card__swatch"
                  style={{ backgroundColor: getDistrictColor(district.id) }}
                />

                <button
                  type="button"
                  className="district-card__button"
                  data-testid={`district-button-${district.id}`}
                  onClick={() => onDistrictSelect(district.id)}
                >
                  <span className="district-card__title-row">
                    <span className="district-card__title">{district.name}</span>
                  </span>
                </button>

                <div className="district-card__actions">
                  {typeBadgeLabel ? (
                    <span
                      className="district-card__sort-chip district-card__sort-chip--type"
                      title={typeBadgeLabel}
                    >
                      {typeBadgeLabel}
                    </span>
                  ) : null}

                  {activeSortMetric ? (
                    <span
                      className="district-card__sort-chip"
                      data-metric={activeSortMetric.key}
                      title={`${activeSortMetric.label} ${activeSortMetric.value}${activeSortMetric.key === 'overall' ? '/5' : '/5'}`}
                    >
                      {activeSortMetric.key === 'overall' ? (
                        <span className="district-card__sort-dot" aria-hidden="true" />
                      ) : (
                        <span className="metric-icon" aria-hidden="true">
                          <MetricIcon metricKey={activeSortMetric.key} />
                        </span>
                      )}
                      <span>{activeSortMetric.value}</span>
                    </span>
                  ) : null}

                  <span
                    className="grade-pill"
                    data-grade={district.ratings.overall.toLowerCase()}
                  >
                    {district.ratings.overall}
                  </span>

                  <button
                    type="button"
                    className="district-card__toggle"
                    aria-expanded={isExpanded}
                    aria-label={
                      isExpanded
                        ? `Collapse ${district.name}`
                        : `Expand ${district.name}`
                    }
                    onClick={() => toggleExpanded(district.id)}
                  >
                    {isExpanded ? '−' : '+'}
                  </button>
                </div>
              </div>

              {isExpanded ? (
                <div className="district-card__details">
                  {district.subareas.length > 0 ? (
                    <div className="subarea-list">
                      {district.subareas.map((subarea) => (
                        <div key={subarea.id} className="subarea-list__row">
                          <button
                            type="button"
                            className="subarea-list__item"
                            onClick={() => onSubareaSelect(subarea)}
                          >
                            <span className="subarea-list__main">
                              <span className="subarea-list__name">{subarea.name}</span>
                              <span className="subarea-list__badges">
                                <span className="subarea-list__meta">
                                  {getSubareaKindLabel(subarea.kind)}
                                </span>
                              </span>
                            </span>

                            {subarea.note ? (
                              <span className="subarea-list__note">{subarea.note}</span>
                            ) : null}
                          </button>

                          <a
                            className="subarea-list__map-action"
                            aria-label={getSubareaMapLabel(subarea)}
                            data-tooltip="Open in Google Maps"
                            data-testid={`subarea-map-${subarea.id}`}
                            href={createSubareaGoogleMapsUrl(subarea, district)}
                            rel="noreferrer"
                            target="_blank"
                            title={getSubareaMapLabel(subarea)}
                          >
                            <svg viewBox="0 0 16 16" aria-hidden="true">
                              <path
                                d="M8 14c-2.4-2.8-3.8-5.1-3.8-7A3.8 3.8 0 0 1 8 3.2 3.8 3.8 0 0 1 11.8 7c0 1.9-1.4 4.2-3.8 7Z"
                                fill="none"
                                stroke="currentColor"
                                strokeLinejoin="round"
                                strokeWidth="1.2"
                              />
                              <circle
                                cx="8"
                                cy="7"
                                r="1.35"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.2"
                              />
                            </svg>
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="district-card__placeholder">
                      No subareas added yet.
                    </p>
                  )}
                </div>
              ) : null}
            </section>
          )
        })}
      </div>
    </aside>
  )
}
