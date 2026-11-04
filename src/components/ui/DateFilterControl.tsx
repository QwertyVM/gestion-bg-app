'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Check, RotateCcw } from 'lucide-react'
import { 
  DatePreset, 
  DateRange, 
  getPresetDateRange, 
  getMonthYearDateRange, 
  getMonthFromDateRange, 
  MESES_ES, 
  formatFechaEvolucion 
} from '@/lib/date-utils'

interface DateFilterControlProps {
  value: DateRange
  onChange: (range: DateRange) => void
  label?: string
  align?: 'left' | 'right'
  className?: string
  showAllOption?: boolean
  variant?: 'default' | 'unified'
}

export function DateFilterControl({
  value,
  onChange,
  label = 'Filtrar por Fecha',
  align = 'right',
  className = '',
  showAllOption = true,
  variant = 'default',
}: DateFilterControlProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Año visualizado en el selector de meses
  const monthInfo = getMonthFromDateRange(value)
  const [matrixYear, setMatrixYear] = useState(() => {
    return monthInfo.isMonth ? monthInfo.year : new Date().getFullYear()
  })

  // Sincronizar año si cambia externamente el valor y el menú se abre
  useEffect(() => {
    if (isOpen) {
      if (monthInfo.isMonth) {
        setMatrixYear(monthInfo.year)
      }
    }
  }, [isOpen, value]) // eslint-disable-line react-hooks/exhaustive-deps

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
    if (monthInfo.isMonth) {
      const now = new Date()
      const isCurrentMonth = now.getFullYear() === monthInfo.year && (now.getMonth() + 1) === monthInfo.month
      if (isCurrentMonth) {
        return `${MESES_ES[monthInfo.month - 1]} ${monthInfo.year} (Mes Actual)`
      }
      return `${MESES_ES[monthInfo.month - 1]} ${monthInfo.year}`
    }

    if (value.preset === 'ESTE_MES') {
      const now = new Date()
      return `${MESES_ES[now.getMonth()]} ${now.getFullYear()} (Mes Actual)`
    }
    if (value.preset === 'MES_ANTERIOR') {
      const prev = new Date()
      prev.setMonth(prev.getMonth() - 1)
      return `${MESES_ES[prev.getMonth()]} ${prev.getFullYear()}`
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

  const PRESET_ORDER: DatePreset[] = ['TODO', 'ESTE_MES', 'ESTA_SEMANA', 'SEMANA_ANTERIOR', 'ULTIMOS_3_MESES']

  const handlePrevPreset = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Si estamos en un mes específico, navegar al mes anterior
    if (monthInfo.isMonth) {
      let prevMonth = monthInfo.month - 1
      let prevYear = monthInfo.year
      if (prevMonth < 1) {
        prevMonth = 12
        prevYear -= 1
      }
      onChange(getMonthYearDateRange(prevYear, prevMonth))
      return
    }

    if (value.preset === 'ESTA_SEMANA') {
      handleSelectPreset('SEMANA_ANTERIOR')
      return
    }

    if (value.preset === 'TODO') {
      const now = new Date()
      onChange(getMonthYearDateRange(now.getFullYear(), now.getMonth() + 1))
      return
    }

    const currentIndex = PRESET_ORDER.indexOf(value.preset)
    if (currentIndex > 0) {
      handleSelectPreset(PRESET_ORDER[currentIndex - 1])
    } else {
      handleSelectPreset(PRESET_ORDER[PRESET_ORDER.length - 1])
    }
  }

  const handleNextPreset = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Si estamos en un mes específico, navegar al mes siguiente
    if (monthInfo.isMonth) {
      let nextMonth = monthInfo.month + 1
      let nextYear = monthInfo.year
      if (nextMonth > 12) {
        nextMonth = 1
        nextYear += 1
      }
      onChange(getMonthYearDateRange(nextYear, nextMonth))
      return
    }

    if (value.preset === 'SEMANA_ANTERIOR') {
      handleSelectPreset('ESTA_SEMANA')
      return
    }

    if (value.preset === 'ESTA_SEMANA') {
      handleSelectPreset('ESTE_MES')
      return
    }

    const currentIndex = PRESET_ORDER.indexOf(value.preset)
    if (currentIndex >= 0 && currentIndex < PRESET_ORDER.length - 1) {
      handleSelectPreset(PRESET_ORDER[currentIndex + 1])
    } else {
      handleSelectPreset('TODO')
    }
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {variant === 'unified' ? (
        <div className="h-10 rounded-xl border border-border bg-background inline-flex items-center overflow-hidden shadow-2xs">
          <button
            type="button"
            title="Período anterior"
            onClick={handlePrevPreset}
            className="h-full px-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer border-r border-border/70"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="h-full px-3 text-xs font-semibold text-foreground flex items-center gap-1.5 hover:bg-secondary/40 transition-colors cursor-pointer"
          >
            <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="truncate max-w-[120px] sm:max-w-[170px]">{getDisplayLabel()}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 ml-0.5" />
          </button>
          <button
            type="button"
            title="Período siguiente"
            onClick={handleNextPreset}
            className="h-full px-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors cursor-pointer border-l border-border/70"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        /* Trigger Button */
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
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute mt-1.5 w-76 sm:w-84 rounded-2xl bg-card border border-border shadow-2xl z-50 p-3.5 space-y-3 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-border/70">
            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {label}
            </span>
            {value.preset !== 'TODO' && (
              <button
                type="button"
                onClick={() => handleSelectPreset('TODO')}
                className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
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
                    ? 'bg-muted-foreground text-background shadow-2xs'
                    : 'bg-secondary/60 text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <span>🌐 Histórico Completo</span>
                {value.preset === 'TODO' && <Check className="h-3.5 w-3.5" />}
              </button>
            )}

            <button
              type="button"
              onClick={() => handleSelectPreset('ESTE_MES')}
              className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-colors flex items-center justify-between cursor-pointer ${
                value.preset === 'ESTE_MES'
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-secondary/60 text-foreground hover:bg-accent hover:text-accent-foreground'
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
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-secondary/60 text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <div className="flex flex-col">
                <span>📆 Esta Semana (Lun - Dom)</span>
                <span className={`text-[10px] font-normal ${value.preset === 'ESTA_SEMANA' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
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
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-secondary/60 text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <div className="flex flex-col">
                <span>⏪ Semana Pasada (Última semana)</span>
                <span className={`text-[10px] font-normal ${value.preset === 'SEMANA_ANTERIOR' ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
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
                  ? 'bg-primary text-primary-foreground shadow-2xs'
                  : 'bg-secondary/60 text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <span>⏱️ Hace 3 meses</span>
              {value.preset === 'ULTIMOS_3_MESES' && <Check className="h-3.5 w-3.5" />}
            </button>
          </div>

          {/* Selector de Meses Específicos con Matriz Anual */}
          <div className="pt-2.5 border-t border-border/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-3 w-3 text-primary" />
                Filtrar por Mes:
              </span>
              <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5 border border-border/50">
                <button
                  type="button"
                  title="Año anterior"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMatrixYear((prev) => prev - 1)
                  }}
                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="text-xs font-mono font-bold text-foreground px-1">
                  {matrixYear}
                </span>
                <button
                  type="button"
                  title="Año siguiente"
                  onClick={(e) => {
                    e.stopPropagation()
                    setMatrixYear((prev) => prev + 1)
                  }}
                  className="h-5 w-5 flex items-center justify-center rounded hover:bg-background text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* Matriz 4x3 de Meses */}
            <div className="grid grid-cols-4 gap-1.5">
              {MESES_ES.map((mes, idx) => {
                const now = new Date()
                const monthNum = idx + 1
                const isCurrentCalendarMonth = now.getFullYear() === matrixYear && now.getMonth() === idx
                const isSelected = monthInfo.isMonth && monthInfo.year === matrixYear && monthInfo.month === monthNum

                return (
                  <button
                    key={mes}
                    type="button"
                    onClick={() => {
                      const newRange = getMonthYearDateRange(matrixYear, monthNum)
                      onChange(newRange)
                      setIsOpen(false)
                    }}
                    className={`py-1.5 text-[11px] rounded-lg font-bold transition-all cursor-pointer text-center relative ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : isCurrentCalendarMonth
                        ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                        : 'bg-secondary/50 text-muted-foreground hover:text-foreground hover:bg-secondary'
                    }`}
                  >
                    <span>{mes.substring(0, 3)}</span>
                    {isCurrentCalendarMonth && !isSelected && (
                      <span className="absolute top-1 right-1 w-1 h-1 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
