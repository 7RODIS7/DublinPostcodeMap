import type {
  DistrictGrade,
  DistrictMetricKey,
  DistrictRatings,
  DistrictSortMode,
  DistrictWithSubareas,
} from '../types/districts'

export const ratingMetricOrder: DistrictMetricKey[] = [
  'safety',
  'transit',
  'parks',
  'schools',
  'amenities',
  'value',
]

export const ratingMetricLabels: Record<DistrictMetricKey, string> = {
  safety: 'Safety',
  transit: 'Transport',
  parks: 'Green',
  schools: 'Schools',
  amenities: 'Amenities',
  value: 'Value',
}

export const ratingMetricDescriptions: Record<DistrictMetricKey, string> = {
  safety: 'Personal safety and general day-to-day calm.',
  transit: 'Public transport reach and commute convenience.',
  parks:
    'Usable public parks, beaches, seafront walks and outdoor green access from public OSM-tagged spaces, excluding private club land where tagged.',
  schools: 'Choice and perceived strength of nearby schools.',
  amenities: 'Shops, cafes, sports, groceries and everyday local convenience.',
  value: 'Balance between housing cost and overall quality of life.',
}

export const gradeDescriptions: Record<DistrictGrade, string> = {
  A: 'Strong fit',
  B: 'Good fit',
  C: 'Mixed',
  D: 'Needs care',
}

const gradeRank: Record<DistrictGrade, number> = {
  A: 4,
  B: 3,
  C: 2,
  D: 1,
}

export function clampRating(score: number): number {
  return Math.max(0, Math.min(5, Math.round(score)))
}

export function getOverallGradeTone(ratings: DistrictRatings): string {
  return ratings.overall.toLowerCase()
}

export function getOverallScore(ratings: DistrictRatings): number {
  const total = ratingMetricOrder.reduce((sum, metricKey) => sum + ratings.metrics[metricKey], 0)
  return Math.round((total / ratingMetricOrder.length) * 10) / 10
}

export function getGradeDescription(grade: DistrictGrade): string {
  return gradeDescriptions[grade]
}

export function matchesSelectedGrades(
  grade: DistrictGrade,
  selectedGrades: DistrictGrade[],
): boolean {
  if (selectedGrades.length === 0) {
    return false
  }

  return selectedGrades.includes(grade)
}

export function sortDistricts(
  districts: DistrictWithSubareas[],
  sortMode: DistrictSortMode,
): DistrictWithSubareas[] {
  const sorted = [...districts]

  sorted.sort((left, right) => {
    if (sortMode === 'postal') {
      return left.sortOrder - right.sortOrder
    }

    if (sortMode === 'overall') {
      const gradeDiff = gradeRank[right.ratings.overall] - gradeRank[left.ratings.overall]
      if (gradeDiff !== 0) {
        return gradeDiff
      }

      return getOverallScore(right.ratings) - getOverallScore(left.ratings)
    }

    const metricKey = sortMode
    const metricDiff = right.ratings.metrics[metricKey] - left.ratings.metrics[metricKey]
    if (metricDiff !== 0) {
      return metricDiff
    }

    return left.sortOrder - right.sortOrder
  })

  return sorted
}
