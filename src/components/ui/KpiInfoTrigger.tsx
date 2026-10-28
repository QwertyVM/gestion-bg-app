'use client'

import React from 'react'
import { HelpCircle } from 'lucide-react'

interface KpiInfoTriggerProps {
  onClick: (e: React.MouseEvent) => void
  title?: string
  className?: string
}

export function KpiInfoTrigger({
  onClick,
  title = 'Ver fórmula y explicación detallada',
  className = ''
}: KpiInfoTriggerProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick(e)
      }}
      title={title}
      aria-label={title}
      className={`p-1 -m-1 rounded-md text-muted-foreground/70 hover:text-primary hover:bg-secondary/80 transition-all cursor-pointer inline-flex items-center justify-center ${className}`}
    >
      <HelpCircle className="w-3.5 h-3.5" />
    </button>
  )
}
