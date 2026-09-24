'use client'

import React from 'react'
import { Dices } from 'lucide-react'

interface BusinessSwitcherProps {
  compact?: boolean
  className?: string
}

export function BusinessSwitcher({ compact = false, className = '' }: BusinessSwitcherProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl bg-white border border-[#E2D9CC] shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Brand Avatar */}
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-2xs bg-[#6366F1] text-white">
            <Dices className="w-4 h-4 stroke-[2.2]" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs tracking-tight text-[#241C15] truncate">
                NOVA Board Games
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border bg-[#EEF2FF] text-[#4338CA] border-[#C7D2FE]">
                BG
              </span>
            </div>
            <p className="text-[10px] text-[#8C7E72] truncate">
              Gestión de Juegos de Mesa
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
