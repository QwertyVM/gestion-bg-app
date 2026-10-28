'use client'

import React from 'react'

interface MicroSparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  className?: string
}

export function MicroSparkline({
  data,
  color = 'currentColor',
  width = 54,
  height = 18,
  className = ''
}: MicroSparklineProps) {
  if (!data || data.length < 2) {
    return null
  }

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min === 0 ? 1 : max - min

  const padY = 2
  const effectiveHeight = height - padY * 2

  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width
    const y = height - padY - ((val - min) / range) * effectiveHeight
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const pathD = `M ${points.join(' L ')}`
  const lastPoint = points[points.length - 1].split(',')

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`shrink-0 overflow-visible opacity-80 group-hover:opacity-100 transition-opacity ${className}`}
      aria-hidden="true"
    >
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={lastPoint[0]}
        cy={lastPoint[1]}
        r="2"
        fill={color}
      />
    </svg>
  )
}
