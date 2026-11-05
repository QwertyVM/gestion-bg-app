'use client'

import { useState, useRef, useEffect } from 'react'
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Check, RotateCcw, Clock } from 'lucide-react'
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
  const now = new Date()
  const [matrixYear, setMatrixYear] = useState(() => {
    return monthInfo.isMonth ? monthInfo.year : now.getFullYear()
  })

  // Sincronizar año si cambia externamente el valor y el menú se abre
  useEffect(() => {
    if (isOpen && monthInfo.isMonth) {
      setMatrixYear(monthInfo.year)
    }
  }, [isOpen, value, monthInfo.isMonth, monthInfo.year])

  // Cerrar al hacer clic fuera
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

  // Navegación mensual directa con los botones de flecha (‹ y ›)
  const handlePrevMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    let currentY = monthInfo.isMonth ? monthInfo.year : now.getFullYear()
    let currentM = monthInfo.isMonth ? monthInfo.month : (now.getMonth() + 1)
    let prevMonth = currentM - 1
    let prevYear = currentY
    if (prevMonth < 1) {
      prevMonth = 12
      prevYear -= 1
    }
    onChange(getMonthYearDateRange(prevYear, prevMonth))
  }

  const handleNextMonth = (e: React.MouseEvent) => {
    e.stopPropagation()
    let currentY = monthInfo.isMonth ? monthInfo.year : now.getFullYear()
    let currentM = monthInfo.isMonth ? monthInfo.month : (now.getMonth() + 1)
    let nextMonth = currentM + 1
    let nextYear = currentY
    if (nextMonth > 12) {
      nextMonth = 1
      nextYear += 1
    }
    onChange(getMonthYearDateRange(nextYear, nextMonth))
  }

  // Etiqueta para el botón principal
  const getDisplayLabel = () => {
    if (monthInfo.isMonth) {
      const isCurrentMonth = now.getFullYear() === monthInfo.year && (now.getMonth() + 1) === monthInfo.month
      const monthName = MESES_ES[monthInfo.month - 1]
      return isCurrentMonth ? `${monthName} ${monthInfo.year}` : `${monthName} ${monthInfo.year}`
    }

    if (value.preset === 'ESTE_MES') {
      return `${MESES_ES[now.getMonth()]} ${now.getFullYear()}`
    }
    if (value.preset === 'MES_ANTERIOR') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return `${MESES_ES[prev.getMonth()]} ${prev.getFullYear()}`
    }
    if (value.preset === 'ESTA_SEMANA') {
      return 'Esta Semana'
    }
    if (value.preset === 'SEMANA_ANTERIOR') {
      return 'Semana Pasada'
    }
    if (value.preset === 'ULTIMOS_3_MESES') {
      return 'Últimos 3 meses'
    }
    if (value.preset === 'TODO') {
      return 'Histórico Completo'
    }
    if (value.from && value.to) {
      return `${formatFechaEvolucion(value.from)} - ${formatFechaEvolucion(value.to)}`
    }
    return 'Histórico'
  }

  const isCurrentMonthActive = (monthInfo.isMonth && monthInfo.year === now.getFullYear() && monthInfo.month === (now.getMonth() + 1)) || value.preset === 'ESTE_MES'
  const isAllActive = value.preset === 'TODO'

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Selector Compacto & Ergonómico */}
      <div className="h-9 sm:h-10 rounded-xl border border-input bg-card text-foreground inline-flex items-center overflow-hidden shadow-2xs hover:border-primary/40 transition-colors">
        <button
          type="button"
          title="Mes anterior"
          onClick={handlePrevMonth}
          className="h-full px-2 sm:px-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer border-r border-border"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="h-full px-2.5 sm:px-3 text-xs font-semibold text-foreground flex items-center gap-1.5 hover:bg-secondary/60 transition-colors cursor-pointer select-none"
        >
          <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate max-w-[130px] sm:max-w-[180px] font-medium">{getDisplayLabel()}</span>
          {isCurrentMonthActive && (
            <span className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.2 rounded bg-primary/10 text-primary uppercase">
              Actual
            </span>
          )}
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 ml-0.5" />
        </button>

        <button
          type="button"
          title="Mes siguiente"
          onClick={handleNextMonth}
          className="h-full px-2 sm:px-2.5 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors cursor-pointer border-l border-border"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Popover Desplegable para Seleccionar Mes */}
      {isOpen && (
        <div
          className={`absolute mt-1.5 w-[calc(100vw-2rem)] max-w-xs sm:w-80 rounded-2xl bg-card border border-border shadow-xl z-50 p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header con Año y Controles */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" />
              {label}
            </span>

            {/* Selector de Año */}
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5 border border-border">
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
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Meses del Año {matrixYear}
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {MESES_ES.map((mes, idx) => {
                const monthNum = idx + 1
                const isCurrentCalendarMonth = now.getFullYear() === matrixYear && now.getMonth() === idx
                const isSelected = monthInfo.isMonth 
                  ? (monthInfo.year === matrixYear && monthInfo.month === monthNum)
                  : (value.preset === 'ESTE_MES' && matrixYear === now.getFullYear() && idx === now.getMonth())

                return (
                  <button
                    key={mes}
                    type="button"
                    onClick={() => {
                      const newRange = getMonthYearDateRange(matrixYear, monthNum)
                      onChange(newRange)
                      setIsOpen(false)
                    }}
                    className={`py-2 text-xs rounded-xl font-bold transition-all cursor-pointer text-center relative ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : isCurrentCalendarMonth
                        ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
                        : 'bg-secondary/70 text-foreground hover:bg-secondary'
                    }`}
                  >
                    <span>{mes.substring(0, 3)}</span>
                    {isCurrentCalendarMonth && !isSelected && (
                      <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Accesos Rápidos: Mes Actual / Histórico */}
          <div className="pt-2 border-t border-border flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleSelectPreset('ESTE_MES')}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer border ${
                isCurrentMonthActive
                  ? 'bg-primary/10 border-primary/30 text-primary'
                  : 'bg-secondary/50 border-border text-foreground hover:bg-secondary'
              }`}
            >
              📅 Mes Actual
            </button>

            {showAllOption && (
              <button
                type="button"
                onClick={() => handleSelectPreset('TODO')}
                className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold text-center transition-colors cursor-pointer border ${
                  isAllActive
                    ? 'bg-primary/10 border-primary/30 text-primary'
                    : 'bg-secondary/50 border-border text-foreground hover:bg-secondary'
                }`}
              >
                🌐 Ver Histórico
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
