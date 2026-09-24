'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, Check, X, RotateCcw } from 'lucide-react'
import { DatePreset, DateRange, getPresetDateRange, getMonthYearDateRange, MESES_ES, formatToYMD } from '@/lib/date-utils'

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
  const [customFrom, setCustomFrom] = useState(value.from || '')
  const [customTo, setCustomTo] = useState(value.to || '')
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Sync internal custom inputs if value changes externally
  useEffect(() => {
    if (value.from) setCustomFrom(value.from)
    if (value.to) setCustomTo(value.to)
  }, [value.from, value.to])

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

  const handleApplyCustom = () => {
    if (customFrom || customTo) {
      onChange({
        from: customFrom || null,
        to: customTo || null,
        preset: 'PERSONALIZADO'
      })
      setIsOpen(false)
    }
  }

  const handleSelectMonth = (monthIndex: number, year: number) => {
    const newRange = getMonthYearDateRange(year, monthIndex + 1)
    onChange(newRange)
    setIsOpen(false)
  }

  // Label description for button display
  const getDisplayLabel = () => {
    if (value.preset === 'ESTE_MES') {
      const now = new Date()
      return `${MESES_ES[now.getMonth()]} ${now.getFullYear()} (Mes Actual)`
    }
    if (value.preset === 'MES_ANTERIOR') {
      const prev = new Date()
      prev.setMonth(prev.getMonth() - 1)
      return `${MESES_ES[prev.getMonth()]} ${prev.getFullYear()} (Mes Anterior)`
    }
    if (value.preset === 'ULTIMOS_30_DIAS') {
      return 'Últimos 30 días'
    }
    if (value.preset === 'ESTE_ANIO') {
      return `Año ${new Date().getFullYear()}`
    }
    if (value.preset === 'TODO') {
      return 'Todo el Historial'
    }
    if (value.from && value.to) {
      return `${value.from} al ${value.to}`
    }
    if (value.from) {
      return `Desde ${value.from}`
    }
    if (value.to) {
      return `Hasta ${value.to}`
    }
    return 'Seleccionar Fecha'
  }

  const currentYear = new Date().getFullYear()
  const years = [currentYear - 1, currentYear, currentYear + 1]

  const isCurrentMonthActive = value.preset === 'ESTE_MES'
  const isAllActive = value.preset === 'TODO'

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
        <span className="truncate max-w-[190px] sm:max-w-[240px]">{getDisplayLabel()}</span>
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
            {value.preset !== 'ESTE_MES' && (
              <button
                type="button"
                onClick={() => handleSelectPreset('ESTE_MES')}
                className="text-[10px] text-[#A36F4C] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                Ir a Mes Actual
              </button>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleSelectPreset('ESTE_MES')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'ESTE_MES'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <span>📅 Mes Actual</span>
              {value.preset === 'ESTE_MES' && <Check className="h-3 w-3" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('MES_ANTERIOR')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'MES_ANTERIOR'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <span>⏮️ Mes Anterior</span>
              {value.preset === 'MES_ANTERIOR' && <Check className="h-3 w-3" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('ULTIMOS_30_DIAS')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'ULTIMOS_30_DIAS'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <span>⏱️ Últimos 30 días</span>
              {value.preset === 'ULTIMOS_30_DIAS' && <Check className="h-3 w-3" />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectPreset('ESTE_ANIO')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'ESTE_ANIO'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'bg-[#F8F6F2] text-[#241C15] hover:bg-[#EFE5D8]'
              }`}
            >
              <span>🗓️ Este Año ({currentYear})</span>
              {value.preset === 'ESTE_ANIO' && <Check className="h-3 w-3" />}
            </button>
          </div>

          {/* Quick Month Matrix Picker */}
          <div className="pt-2 border-t border-[#E2D9CC]/70 space-y-1.5">
            <span className="text-[10px] font-bold text-[#75695D] uppercase tracking-wider block">
              Seleccionar Mes Específico ({currentYear}):
            </span>
            <div className="grid grid-cols-4 gap-1">
              {MESES_ES.map((mes, idx) => {
                const now = new Date()
                const isThisMonth = now.getFullYear() === currentYear && now.getMonth() === idx
                return (
                  <button
                    key={mes}
                    type="button"
                    onClick={() => handleSelectMonth(idx, currentYear)}
                    className={`py-1 text-[11px] rounded font-bold transition-colors cursor-pointer text-center ${
                      value.preset === 'PERSONALIZADO' && value.from === formatToYMD(new Date(currentYear, idx, 1))
                        ? 'bg-[#A36F4C] text-white'
                        : isThisMonth
                        ? 'bg-[#FDF6E2] text-[#8C6D1F] border border-[#E8D49B] hover:bg-[#F9ECCF]'
                        : 'bg-[#FAF8F5] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA]'
                    }`}
                  >
                    {mes.substring(0, 3)}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="pt-2 border-t border-[#E2D9CC]/70 space-y-2">
            <span className="text-[10px] font-bold text-[#75695D] uppercase tracking-wider block">
              Rango Personalizado:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-semibold text-[#75695D] block mb-0.5">Desde</label>
                <input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-[#E2D9CC] bg-[#F8F6F2] text-xs font-mono font-medium text-[#241C15] focus:bg-white outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-[#75695D] block mb-0.5">Hasta</label>
                <input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full h-8 px-2 rounded-lg border border-[#E2D9CC] bg-[#F8F6F2] text-xs font-mono font-medium text-[#241C15] focus:bg-white outline-none"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={handleApplyCustom}
              disabled={!customFrom && !customTo}
              className="w-full h-8 rounded-lg bg-[#241C15] hover:bg-[#3D3126] text-white text-xs font-bold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              Aplicar Rango
            </button>
          </div>

          {/* Option for All Time */}
          {showAllOption && (
            <div className="pt-1.5 border-t border-[#E2D9CC]/70">
              <button
                type="button"
                onClick={() => handleSelectPreset('TODO')}
                className={`w-full py-1.5 rounded-lg text-xs font-bold text-center transition-colors cursor-pointer ${
                  value.preset === 'TODO'
                    ? 'bg-[#75695D] text-white'
                    : 'bg-[#FAF8F5] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA]'
                }`}
              >
                🌐 Ver Todo el Historial Acumulado
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
