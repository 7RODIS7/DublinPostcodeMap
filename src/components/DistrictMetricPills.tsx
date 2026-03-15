import { clampRating, getOverallScore, ratingMetricLabels, ratingMetricOrder } from '../lib/districtRatings'
import type { DistrictRatings } from '../types/districts'

type DistrictMetricPillsProps = {
  ratings: DistrictRatings
  compact?: boolean
}

export function DistrictMetricPills({
  ratings,
  compact = false,
}: DistrictMetricPillsProps) {
  return (
    <div className="metric-grid" data-compact={compact}>
      <article
        className="metric-card metric-card--overall"
        data-grade={ratings.overall.toLowerCase()}
      >
        <span className="metric-card__label">Overall</span>
        <strong className="metric-card__value">{getOverallScore(ratings)}/5</strong>
        <small className="metric-card__caption">Weighted snapshot</small>
      </article>

      {ratingMetricOrder.map((metricKey) => (
        <article key={metricKey} className="metric-card" data-metric={metricKey}>
          <span className="metric-card__label">{ratingMetricLabels[metricKey]}</span>
          <strong className="metric-card__value">
            {clampRating(ratings.metrics[metricKey])}/5
          </strong>
        </article>
      ))}
    </div>
  )
}
