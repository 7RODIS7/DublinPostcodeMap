import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import { lifestyleTagLabels } from '../data/districtTags'
import { getDistrictColor } from '../lib/districtColors'
import { districtMetaById } from '../lib/districtUtils'
import { createCoordinateGoogleMapsUrl, createSubareaGoogleMapsUrl } from '../lib/googleMaps'
import {
  getUserPointIconDefinition,
  isUserPointIconKey,
  userPointIconOptions,
} from '../lib/userPoints'
import { clampRating, getOverallScore, ratingMetricLabels } from '../lib/districtRatings'
import { MetricIcon } from './MetricIcon'
import { UserPointIcon } from './UserPointIcon'
import type {
  DistrictGrade,
  DistrictMetricKey,
  DistrictLifestyleTag,
  DistrictSortMode,
  DistrictSubarea,
  DistrictWithSubareas,
  UserSavedPoint,
} from '../types/districts'

const GRADE_PRESET_VALUES: DistrictGrade[] = ['A', 'B']

type DistrictSidebarProps = {
  availableGrades: DistrictGrade[]
  districts: DistrictWithSubareas[]
  isOpen: boolean
  selectedDistrictId: string | null
  selectedGrades: DistrictGrade[]
  selectedLifestyleTags: DistrictLifestyleTag[]
  selectedSavedPointId: string | null
  sortMode: DistrictSortMode
  onDistrictSelect: (districtId: string) => void
  onGradePresetSelect: (preset: 'all' | 'b-plus') => void
  onGradeToggle: (grade: DistrictGrade) => void
  onLifestyleTagToggle: (tag: DistrictLifestyleTag) => void
  onResetFilters: () => void
  onSavedPointClear: () => void
  onSavedPointDelete: (pointId: string) => void
  onSavedPointImport: (
    points: Array<{
      coordinates: [number, number]
      icon: UserSavedPoint['icon']
      name: string
    }>,
  ) => void
  onSavedPointSelect: (pointId: string) => void
  onSavedPointUpdate: (
    pointId: string,
    payload: {
      coordinates: [number, number]
      icon: UserSavedPoint['icon']
      name: string
    },
  ) => void
  onSortModeChange: (sortMode: DistrictSortMode) => void
  onSubareaSelect: (subarea: DistrictSubarea) => void
  onToggleOpen: () => void
  savedPoints: UserSavedPoint[]
}

export function DistrictSidebar({
  availableGrades,
  districts,
  isOpen,
  selectedDistrictId,
  selectedGrades,
  selectedLifestyleTags,
  selectedSavedPointId,
  sortMode,
  onDistrictSelect,
  onGradePresetSelect,
  onGradeToggle,
  onLifestyleTagToggle,
  onResetFilters,
  onSavedPointClear,
  onSavedPointDelete,
  onSavedPointImport,
  onSavedPointSelect,
  onSavedPointUpdate,
  onSortModeChange,
  onSubareaSelect,
  onToggleOpen,
  savedPoints,
}: DistrictSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingPointId, setEditingPointId] = useState<string | null>(null)
  const [editingPointName, setEditingPointName] = useState('')
  const [editingPointIcon, setEditingPointIcon] = useState<UserSavedPoint['icon']>('home')
  const [isEditingPointIconPickerOpen, setIsEditingPointIconPickerOpen] = useState(false)
  const [isSavedPointsExpanded, setIsSavedPointsExpanded] = useState(() => savedPoints.length > 0)
  const [isSavedPointsInfoOpen, setIsSavedPointsInfoOpen] = useState(false)
  const [isSavedPointsMenuOpen, setIsSavedPointsMenuOpen] = useState(false)
  const [savedPointsNotice, setSavedPointsNotice] = useState<string | null>(null)
  const [savedPointsNoticeTone, setSavedPointsNoticeTone] = useState<'neutral' | 'error'>(
    'neutral',
  )
  const [expandedDistrictIds, setExpandedDistrictIds] = useState<Set<string>>(
    () => new Set(selectedDistrictId ? [selectedDistrictId] : []),
  )
  const importInputRef = useRef<HTMLInputElement | null>(null)

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
  const visibleSavedPoints = savedPoints.filter((point) => {
    if (!normalizedQuery) {
      return true
    }

    const districtName = point.districtId ? districtMetaById[point.districtId]?.name ?? '' : ''
    const iconLabel = getUserPointIconDefinition(point.icon).label

    return (
      point.name.toLowerCase().includes(normalizedQuery) ||
      districtName.toLowerCase().includes(normalizedQuery) ||
      iconLabel.toLowerCase().includes(normalizedQuery)
    )
  })

  useEffect(() => {
    if (!selectedDistrictId) {
      return
    }

    setExpandedDistrictIds((current) => {
      if (current.has(selectedDistrictId)) {
        return current
      }

      const next = new Set(current)
      next.add(selectedDistrictId)
      return next
    })
  }, [selectedDistrictId])

  useEffect(() => {
    if (!selectedSavedPointId) {
      return
    }

    setIsSavedPointsExpanded(true)
  }, [selectedSavedPointId])

  useEffect(() => {
    if (!savedPointsNotice) {
      return
    }

    const timerId = window.setTimeout(() => {
      setSavedPointsNotice(null)
      setSavedPointsNoticeTone('neutral')
    }, 2600)

    return () => {
      window.clearTimeout(timerId)
    }
  }, [savedPointsNotice])

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

  function startSavedPointEdit(point: UserSavedPoint) {
    setEditingPointId(point.id)
    setEditingPointName(point.name)
    setEditingPointIcon(point.icon)
    setIsEditingPointIconPickerOpen(false)
    setIsSavedPointsExpanded(true)
    setIsSavedPointsMenuOpen(false)
    setSavedPointsNotice(null)
  }

  function cancelSavedPointEdit() {
    setEditingPointId(null)
    setEditingPointName('')
    setEditingPointIcon('home')
    setIsEditingPointIconPickerOpen(false)
  }

  function handleSavedPointUpdateSubmit(point: UserSavedPoint) {
    const trimmedName = editingPointName.trim()
    if (!trimmedName) {
      setSavedPointsNotice('Add a label before saving changes.')
      setSavedPointsNoticeTone('error')
      return
    }

    onSavedPointUpdate(point.id, {
      coordinates: point.coordinates,
      icon: editingPointIcon,
      name: trimmedName,
    })
    cancelSavedPointEdit()
    setSavedPointsNotice('Saved point updated.')
    setSavedPointsNoticeTone('neutral')
  }

  function handleSavedPointDelete(point: UserSavedPoint) {
    if (!window.confirm(`Delete "${point.name}" from saved points?`)) {
      return
    }

    if (editingPointId === point.id) {
      cancelSavedPointEdit()
    }

    onSavedPointDelete(point.id)
    setSavedPointsNotice(`Deleted "${point.name}".`)
    setSavedPointsNoticeTone('neutral')
  }

  function handleSavedPointsExport() {
    if (savedPoints.length === 0) {
      setSavedPointsNotice('There are no saved points to export yet.')
      setSavedPointsNoticeTone('error')
      return
    }

    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      points: savedPoints.map((point) => ({
        name: point.name,
        icon: point.icon,
        coordinates: point.coordinates,
      })),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'dublin-map-saved-points.json'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    setSavedPointsNotice('Saved points exported to JSON.')
    setSavedPointsNoticeTone('neutral')
    setIsSavedPointsMenuOpen(false)
  }

  async function handleSavedPointsImportFromFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const rawPoints: unknown[] | null = Array.isArray(parsed)
        ? parsed
        : Array.isArray(parsed?.points)
          ? parsed.points
          : null

      if (!rawPoints) {
        throw new Error('Invalid file structure.')
      }

      const importedPoints = rawPoints.flatMap((item: unknown): Array<{
        coordinates: [number, number]
        icon: UserSavedPoint['icon']
        name: string
      }> => {
        const candidate = item as {
          coordinates?: unknown
          icon?: unknown
          name?: unknown
        }

        if (
          typeof candidate.name !== 'string' ||
          !Array.isArray(candidate.coordinates) ||
          candidate.coordinates.length !== 2 ||
          typeof candidate.coordinates[0] !== 'number' ||
          typeof candidate.coordinates[1] !== 'number' ||
          !isUserPointIconKey(candidate.icon)
        ) {
          return []
        }

        const trimmedName = candidate.name.trim()
        if (!trimmedName) {
          return []
        }

        return [
          {
            name: trimmedName,
            icon: candidate.icon,
            coordinates: [candidate.coordinates[0], candidate.coordinates[1]],
          },
        ]
      })

      if (importedPoints.length === 0) {
        throw new Error('No valid saved points found in the file.')
      }

      onSavedPointImport(importedPoints)
      cancelSavedPointEdit()
      setSavedPointsNotice(`Imported ${importedPoints.length} saved point${importedPoints.length === 1 ? '' : 's'}.`)
      setSavedPointsNoticeTone('neutral')
      setIsSavedPointsExpanded(true)
      setIsSavedPointsMenuOpen(false)
    } catch (error) {
      setSavedPointsNotice(
        error instanceof Error ? error.message : 'Failed to import saved points.',
      )
      setSavedPointsNoticeTone('error')
    }
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
    selectedGrades.length !== availableGrades.length ||
    selectedLifestyleTags.length > 0 ||
    sortMode !== 'postal'
  const visiblePlacesCount = districts.reduce((sum, district) => sum + district.subareas.length, 0)
  const isAllGradesSelected = selectedGrades.length === availableGrades.length
  const availableGradePresetValues = GRADE_PRESET_VALUES.filter((grade) =>
    availableGrades.includes(grade),
  )
  const isBPlusSelected =
    selectedGrades.length === availableGradePresetValues.length &&
    availableGradePresetValues.every((grade) => selectedGrades.includes(grade))

  const showBPlusPreset = availableGradePresetValues.length > 0

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
              {showBPlusPreset ? (
                <button
                  type="button"
                  className="filter-chip filter-chip--preset"
                  data-active={isBPlusSelected}
                  data-testid="grade-preset-b-plus"
                  onClick={() => onGradePresetSelect('b-plus')}
                >
                  B+
                </button>
              ) : null}
            </div>

            <div className="sidebar__chip-row">
              {availableGrades.map((grade) => (
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
        {visibleSavedPoints.length === 0 && visibleDistricts.length === 0 ? (
          <div className="sidebar__empty-state">
            No saved points or postal areas match the current filters.
          </div>
        ) : null}

        <section className="saved-points-card" data-testid="saved-points">
          <div className="saved-points-card__head">
            <button
              type="button"
              className="saved-points-card__summary"
              aria-expanded={isSavedPointsExpanded}
              data-testid="saved-points-toggle"
              onClick={() => setIsSavedPointsExpanded((current) => !current)}
            >
              <strong>Saved points</strong>
            </button>

            <div className="saved-points-card__head-actions">
              <span className="saved-points-card__count">{savedPoints.length}</span>
              <button
                type="button"
                className="saved-points-card__icon-button"
                aria-expanded={isSavedPointsInfoOpen}
                aria-label="What are saved points?"
                data-testid="saved-points-info"
                onClick={() => {
                  setIsSavedPointsInfoOpen((current) => !current)
                  setIsSavedPointsMenuOpen(false)
                }}
              >
                ?
              </button>
              <div className="saved-points-card__menu-shell">
                <button
                  type="button"
                  className="saved-points-card__icon-button"
                  aria-expanded={isSavedPointsMenuOpen}
                  aria-label="Saved points options"
                  data-testid="saved-points-options"
                  onClick={() => {
                    setIsSavedPointsMenuOpen((current) => !current)
                    setIsSavedPointsInfoOpen(false)
                  }}
                >
                  <svg viewBox="0 0 16 16" aria-hidden="true">
                    <circle cx="3" cy="8" r="1.2" fill="currentColor" />
                    <circle cx="8" cy="8" r="1.2" fill="currentColor" />
                    <circle cx="13" cy="8" r="1.2" fill="currentColor" />
                  </svg>
                </button>

                {isSavedPointsMenuOpen ? (
                  <div className="saved-points-card__menu" data-testid="saved-points-menu">
                    <button
                      type="button"
                      className="saved-points-card__menu-action"
                      data-testid="saved-points-export"
                      onClick={handleSavedPointsExport}
                    >
                      Export
                    </button>
                    <button
                      type="button"
                      className="saved-points-card__menu-action"
                      data-testid="saved-points-import"
                      onClick={() => importInputRef.current?.click()}
                    >
                      Import
                    </button>
                    <button
                      type="button"
                      className="saved-points-card__menu-action saved-points-card__menu-action--danger"
                      data-testid="saved-points-clear"
                      onClick={() => {
                        if (savedPoints.length === 0) {
                          setSavedPointsNotice('There are no saved points to clear.')
                          setSavedPointsNoticeTone('error')
                          setIsSavedPointsMenuOpen(false)
                          return
                        }

                        if (!window.confirm('Delete all saved points from this browser?')) {
                          return
                        }

                        cancelSavedPointEdit()
                        onSavedPointClear()
                        setSavedPointsNotice('Saved points cleared.')
                        setSavedPointsNoticeTone('neutral')
                        setIsSavedPointsMenuOpen(false)
                      }}
                    >
                      Clear all
                    </button>
                  </div>
                ) : null}
              </div>
              <button
                type="button"
                className="saved-points-card__icon-button"
                aria-label={isSavedPointsExpanded ? 'Collapse saved points' : 'Expand saved points'}
                onClick={() => setIsSavedPointsExpanded((current) => !current)}
              >
                <svg
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  style={{
                    transform: isSavedPointsExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  }}
                >
                  <path
                    d="m4 6 4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.4"
                  />
                </svg>
              </button>
            </div>

            <input
              ref={importInputRef}
              accept="application/json"
              className="saved-points-card__file-input"
              type="file"
              onChange={handleSavedPointsImportFromFile}
            />
          </div>

          {isSavedPointsInfoOpen ? (
            <div className="saved-points-card__popover" data-testid="saved-points-help">
              Right-click the map to save home, office or shortlist spots locally in this browser.
            </div>
          ) : null}

          {savedPointsNotice ? (
            <p className="saved-points-card__notice" data-tone={savedPointsNoticeTone}>
              {savedPointsNotice}
            </p>
          ) : null}

          {isSavedPointsExpanded && savedPoints.length === 0 ? (
            <p className="saved-points-card__empty">
              No saved points yet.
            </p>
          ) : null}

          {isSavedPointsExpanded && savedPoints.length > 0 && visibleSavedPoints.length > 0 ? (
            <div className="saved-points-list">
              {visibleSavedPoints.map((point) => {
                const icon = getUserPointIconDefinition(point.icon)
                const district = point.districtId ? districtMetaById[point.districtId] ?? null : null
                const districtBadge = district?.shortName ?? 'Out'
                const pointGoogleMapsUrl = createCoordinateGoogleMapsUrl(point.coordinates, 17)

                return (
                  <div
                    key={point.id}
                    className="saved-points-list__row"
                    data-selected={selectedSavedPointId === point.id}
                  >
                    <div className="saved-points-list__item">
                      <button
                        type="button"
                        className="saved-points-list__button saved-points-list__button--inline"
                        data-testid={`saved-point-button-${point.id}`}
                        onClick={() => onSavedPointSelect(point.id)}
                      >
                        <span
                          className="saved-points-list__icon"
                          style={{
                            backgroundColor: icon.background,
                            color: icon.color,
                          }}
                        >
                          <UserPointIcon className="saved-points-list__glyph" iconKey={point.icon} />
                        </span>

                        <span className="saved-points-list__main-inline">
                          <span className="saved-points-list__name">{point.name}</span>
                          <span className="saved-points-list__meta">{districtBadge}</span>
                        </span>
                      </button>

                      <div className="saved-points-list__actions">
                        <button
                          type="button"
                          className="saved-points-list__action-icon"
                          aria-label={`Edit ${point.name}`}
                          data-testid={`saved-point-edit-${point.id}`}
                          title="Edit"
                          onClick={() => startSavedPointEdit(point)}
                        >
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path
                              d="M3 11.8V13h1.2l6.5-6.5-1.2-1.2L3 11.8Zm8.4-7.9 1.2 1.2.7-.7a.85.85 0 0 0 0-1.2l-.1-.1a.85.85 0 0 0-1.2 0l-.6.8Z"
                              fill="none"
                              stroke="currentColor"
                              strokeLinejoin="round"
                              strokeWidth="1.2"
                            />
                          </svg>
                        </button>

                        <button
                          type="button"
                          className="saved-points-list__action-icon saved-points-list__action-icon--danger"
                          aria-label={`Delete ${point.name}`}
                          data-testid={`saved-point-delete-${point.id}`}
                          title="Delete"
                          onClick={() => handleSavedPointDelete(point)}
                        >
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <path
                              d="M3.8 4.6h8.4M6.2 4.6V3.5c0-.5.4-.9.9-.9h1.8c.5 0 .9.4.9.9v1.1M5 4.6v7.2c0 .6.4 1 1 1h4c.6 0 1-.4 1-1V4.6M6.8 6.4v4.5M9.2 6.4v4.5"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="1.2"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <a
                      className="saved-points-list__map-action subarea-list__map-action"
                      aria-label={`Open ${point.name} in Google Maps`}
                      data-testid={`saved-point-map-${point.id}`}
                      data-tooltip="Open in Google Maps"
                      href={pointGoogleMapsUrl}
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

                    {editingPointId === point.id ? (
                      <div className="saved-points-editor" data-testid={`saved-point-editor-${point.id}`}>
                        <div className="saved-points-editor__icon-control">
                          <button
                            type="button"
                            className="saved-points-editor__icon-trigger"
                            aria-expanded={isEditingPointIconPickerOpen}
                            aria-label={`Selected icon: ${getUserPointIconDefinition(editingPointIcon).label}`}
                            data-testid={`saved-point-icon-trigger-${point.id}`}
                            onClick={() =>
                              setIsEditingPointIconPickerOpen((current) => !current)
                            }
                          >
                            <span
                              className="saved-points-editor__icon-swatch"
                              style={{
                                backgroundColor: getUserPointIconDefinition(editingPointIcon).background,
                                color: getUserPointIconDefinition(editingPointIcon).color,
                              }}
                            >
                              <UserPointIcon
                                className="saved-points-editor__icon-glyph"
                                iconKey={editingPointIcon}
                              />
                            </span>
                          </button>

                          <input
                            className="saved-points-editor__icon-input"
                            data-testid={`saved-point-name-${point.id}`}
                            placeholder="Saved point label"
                            type="text"
                            value={editingPointName}
                            onChange={(event) => setEditingPointName(event.target.value)}
                          />

                          {isEditingPointIconPickerOpen ? (
                            <div className="saved-points-editor__icon-panel">
                              {userPointIconOptions.map((iconOption) => (
                                <button
                                  key={iconOption.key}
                                  type="button"
                                  className="saved-points-editor__icon"
                                  aria-label={`Use ${iconOption.label} icon`}
                                  data-active={editingPointIcon === iconOption.key}
                                  data-testid={`saved-point-icon-${point.id}-${iconOption.key}`}
                                  title={iconOption.label}
                                  onClick={() => {
                                    setEditingPointIcon(iconOption.key)
                                    setIsEditingPointIconPickerOpen(false)
                                  }}
                                >
                                  <span
                                    className="saved-points-editor__icon-swatch"
                                    style={{
                                      backgroundColor: iconOption.background,
                                      color: iconOption.color,
                                    }}
                                  >
                                    <UserPointIcon
                                      className="saved-points-editor__icon-glyph"
                                      iconKey={iconOption.key}
                                    />
                                  </span>
                                </button>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        <div className="saved-points-editor__actions">
                          <button
                            type="button"
                            className="saved-points-editor__action saved-points-editor__action--primary"
                            data-testid={`saved-point-save-${point.id}`}
                            onClick={() => handleSavedPointUpdateSubmit(point)}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="saved-points-editor__action"
                            onClick={cancelSavedPointEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          ) : null}

          {isSavedPointsExpanded && savedPoints.length > 0 && visibleSavedPoints.length === 0 ? (
            <p className="saved-points-card__empty">
              No saved points match the current search.
            </p>
          ) : null}
        </section>

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
