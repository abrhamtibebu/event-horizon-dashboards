interface MetricSparklineProps {
  values: number[]
}

export function MetricSparkline({ values }: MetricSparklineProps) {
  const series = values.filter((value) => Number.isFinite(value))
  if (series.length < 2) return null

  const width = 96
  const height = 32
  const min = Math.min(...series)
  const max = Math.max(...series)
  const span = max - min || 1
  const points = series
    .map((value, index) => {
      const x = (index / (series.length - 1)) * width
      const y = height - ((value - min) / span) * (height - 4) - 2
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="text-primary" aria-hidden>
      <polyline fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" points={points} />
    </svg>
  )
}
