'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, Check, RotateCcw } from 'lucide-react'
import { DatePreset, DateRange, getPresetDateRange, MESES_ES, formatFechaEvolucion } from '@/lib/date-utils'

interface DateFilterControlProps {
  value: DateRange
  onChange: (range: DateRange) => void
  label?: string
  align?: 'left' | 'right'
  className?: string
  showAllOption?: boolean
}

export function DateFilterControl({
  value,
  onChange,
  label = 'Filtrar por Fecha',
  align = 'right',
  className = '',
  showAllOption = true,
}: DateFilterControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSelectPreset = (preset: DatePreset) => {
    const newRange = getPresetDateRange(preset)
    onChange(newRange)
    setIsOpen(false)
  }

  // Label description for button display
  const getDisplayLabel = () => {
    if (value.preset === 'ESTE_MES') {
      const now = new Date()
      return `${MESES_ES[now.getMonth()]} ${now.getFullYear()} (Mes Actual)`
    }
    if (value.preset === 'ESTA_SEMANA') {
      if (value.from && value.to) {
        return `Esta Semana (${formatFechaEvolucion(value.from)} - ${formatFechaEvolucion(value.to)})`
      }
      return 'Esta Semana (Lun - Dom)'
    }
    if (value.preset === 'SEMANA_ANTERIOR') {
      if (value.from && value.to) {
        return `Semana Pasada (${formatFechaEvolucion(value.from)} - ${formatFechaEvolucion(value.to)})`
      }
      return 'Semana Pasada (Lun - Dom)'
    }
    if (value.preset === 'ULTIMOS_3_MESES') {
      return 'Hace 3 meses'
    }
    if (value.preset === 'TODO') {
      return 'Histórico'
    }
    if (value.from && value.to) {
      return `${formatFechaEvolucion(value.from)} - ${formatFechaEvolucion(value.to)}`
    }
    return 'Histórico'
  }

  const isAllActive = value.preset === 'TODO'
  const estaSemanaRange = getPresetDateRange('ESTA_SEMANA')
  const semanaAnteriorRange = getPresetDateRange('SEMANA_ANTERIOR')

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-9 px-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
          !isAllActive
            ? 'bg-[#FDF6E2] border-[#D4BEA7] text-[#633E20] hover:bg-[#F9ECCF]'
            : 'bg-[#FAF8F5] border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA]'
        }`}
      >
        <Calendar className={`h-3.5 w-3.5 shrink-0 ${!isAllActive ? 'text-[#A36F4C]' : 'text-[#75695D]'}`} />
        <span className="truncate max-w-[210px] sm:max-w-[280px]">{getDisplayLabel()}</span>
        <ChevronDown className="h-3 w-3 text-[#75695D] shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute mt-1.5 w-76 sm:w-84 rounded-2xl bg-[#FFFFFF] border border-[#E2D9CC] shadow-2xl z-50 p-3.5 space-y-3 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]/70">
            <span className="text-[11px] font-bold text-[#241C15] uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[#A36F4C]" />
              {label}
            </span>
            {value.preset !== 'TODO' && (
              <button
                type="button"
                onClick={() => handleSelectPreset('TODO')}
                className="text-[10px] text-[#A36F4C] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                Ir a Histórico
              </button>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-col gap-1.5">
            {showAllOption && (
              <button
                type="button"
                onClick={() => handleSelectPreset('TODO')}
                className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                  value.preset === 'TODO'
                    ? 'bg-[#75695D] text-white shadow-2xs'
                    : 'bg-[#FAF8F5] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA]'
                }`}
              >
                <span>🌐 Histórico</span>
                {value.preset === 'TODO' && <Check className="h-3.5 w-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectPreset('ESTE_MES')}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'ESTE_MES'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <span>📅 Mes Actual ({MESES_ES[new Date().getMonth()]})</span>
              {value.preset === 'ESTE_MES' && <Check className="h-3.5 w-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('ESTA_SEMANA')}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'ESTA_SEMANA'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <div className="flex flex-col">
                <span>📆 Esta Semana (Lun - Dom)</span>
                <span className={`text-[10px] font-normal ${value.preset === 'ESTA_SEMANA' ? 'text-white/80' : 'text-[#75695D]'}`}>
                  {formatFechaEvolucion(estaSemanaRange.from!)} - {formatFechaEvolucion(estaSemanaRange.to!)}
                </span>
              </div>
              {value.preset === 'ESTA_SEMANA' && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('SEMANA_ANTERIOR')}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'SEMANA_ANTERIOR'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <div className="flex flex-col">
                <span>⏪ Semana Pasada (Última semana)</span>
                <span className={`text-[10px] font-normal ${value.preset === 'SEMANA_ANTERIOR' ? 'text-white/80' : 'text-[#75695D]'}`}>
                  {formatFechaEvolucion(semanaAnteriorRange.from!)} - {formatFechaEvolucion(semanaAnteriorRange.to!)}
                </span>
              </div>
              {value.preset === 'SEMANA_ANTERIOR' && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('ULTIMOS_3_MESES')}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'ULTIMOS_3_MESES'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <span>⏱️ Hace 3 meses</span>
              {value.preset === 'ULTIMOS_3_MESES' && <Check className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
