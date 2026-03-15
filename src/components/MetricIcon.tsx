import type { DistrictMetricKey } from '../types/districts'

type MetricIconProps = {
  metricKey: DistrictMetricKey
}

export function MetricIcon({ metricKey }: MetricIconProps) {
  if (metricKey === 'safety') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 1.5 13 3.4v3.9c0 3.2-2.1 5.8-5 7.2-2.9-1.4-5-4-5-7.2V3.4L8 1.5Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.35"
        />
      </svg>
    )
  }

  if (metricKey === 'transit') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <rect
          x="3"
          y="2.5"
          width="10"
          height="8.3"
          rx="2.1"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.35"
        />
        <path
          d="M5 12.5h6M5.2 14l1.1-1.5M10.8 14l-1.1-1.5M5.4 5.4h5.2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
      </svg>
    )
  }

  if (metricKey === 'parks') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M8 2.4c1.7 0 3 1.2 3.2 2.8 1.1.2 2 1.2 2 2.4 0 1.5-1.2 2.7-2.7 2.7H5.4A2.4 2.4 0 0 1 3 7.9c0-1.2.9-2.3 2.1-2.5.4-1.7 1.6-3 2.9-3Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
        <path
          d="M8 10.3v3.3M6.5 13.6h3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
      </svg>
    )
  }

  if (metricKey === 'schools') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="m2.1 5.4 5.9-2.6 5.9 2.6L8 8 2.1 5.4Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.25"
        />
        <path
          d="M4.3 6.4v2.4c0 1.2 1.7 2.1 3.7 2.1s3.7-.9 3.7-2.1V6.4"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
        <path
          d="M13.2 5.7v3.1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.2"
        />
      </svg>
    )
  }

  if (metricKey === 'amenities') {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path
          d="M3 6.1c0-1 .8-1.8 1.8-1.8h6.4c1 0 1.8.8 1.8 1.8v5.4c0 .7-.6 1.3-1.3 1.3H4.3c-.7 0-1.3-.6-1.3-1.3V6.1Z"
          fill="none"
          stroke="currentColor"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
        <path
          d="M5.2 4.3V3.4c0-.8.6-1.4 1.4-1.4h2.8c.8 0 1.4.6 1.4 1.4v.9M3 7.6h10"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.2"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 16 16" aria-hidden="true">
      <circle
        cx="8"
        cy="8"
        r="5.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.25"
      />
      <path
        d="M8.2 4.6c-1.2 0-2 .7-2 1.6 0 .8.5 1.2 1.8 1.5 1.3.3 1.8.6 1.8 1.4 0 .8-.7 1.4-1.8 1.4-1 0-1.7-.3-2.2-.9M8 3.6v8.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.15"
      />
    </svg>
  )
}
