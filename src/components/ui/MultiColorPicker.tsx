'use client'

import React, { useState, useMemo } from 'react'
import { Palette, Check, X, Search, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export interface FilamentoColorOption {
  id: string
  nombreColor: string
  codigoHex?: string | null
  tipoMaterial?: string | null
  marca?: string | null
  stockGramos?: number | null
  stockBobinas?: number
  numeroBobina?: number | null
  estado?: string
  alertaCritica?: boolean
}

interface MultiColorPickerProps {
  selectedColorIds: string[]
  onChange: (colorIds: string[]) => void
  filamentos: FilamentoColorOption[]
  label?: string
  placeholder?: string
  className?: string
  compact?: boolean
  maxColors?: number
}

export function MultiColorPicker({
  selectedColorIds = [],
  onChange,
  filamentos = [],
  label,
  placeholder = 'Seleccionar colores...',
  className = '',
  compact = false,
  maxColors = 8,
}: MultiColorPickerProps) {
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  // Map of filaments for quick lookup
  const filamentoMap = useMemo(() => {
    const map = new Map<string, FilamentoColorOption>()
    filamentos.forEach(f => map.set(f.id, f))
    return map
  }, [filamentos])

  // Get selected filament objects
  const selectedFilamentos = useMemo(() => {
    return selectedColorIds
      .map(id => filamentoMap.get(id))
      .filter((f): f is FilamentoColorOption => Boolean(f))
  }, [selectedColorIds, filamentoMap])

  // Filter available filaments by search query
  const filteredFilamentos = useMemo(() => {
    if (!search.trim()) return filamentos
    const q = search.toLowerCase()
    return filamentos.filter(f => 
      f.nombreColor.toLowerCase().includes(q) ||
      (f.tipoMaterial && f.tipoMaterial.toLowerCase().includes(q)) ||
      (f.marca && f.marca.toLowerCase().includes(q))
    )
  }, [filamentos, search])

  const handleToggleColor = (id: string) => {
    if (selectedColorIds.includes(id)) {
      onChange(selectedColorIds.filter(cId => cId !== id))
    } else {
      if (selectedColorIds.length >= maxColors) return
      onChange([...selectedColorIds, id])
    }
  }

  const handleRemoveColor = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    onChange(selectedColorIds.filter(cId => cId !== id))
  }

  const handleClearAll = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
      e.preventDefault()
    }
    onChange([])
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Header Label and Clear button */}
      {label && (
        <div className="flex items-center justify-between">
          <Label className="text-[11px] text-[#241C15] font-bold flex items-center gap-1.5">
            <Palette className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>{label}</span>
            {selectedColorIds.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-[#EFE5D8] text-[#633E20] border border-[#D4BEA7]">
                {selectedColorIds.length} {selectedColorIds.length === 1 ? 'color' : 'colores'}
              </span>
            )}
          </Label>
          {selectedColorIds.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="text-[10px] text-[#A34335] hover:underline font-semibold cursor-pointer"
            >
              Quitar todos
            </button>
          )}
        </div>
      )}

      {/* Selected Color Badges / Pills Container */}
      <div 
        onClick={() => setIsOpen(prev => !prev)}
        className="min-h-[36px] p-1.5 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] hover:border-[#A36F4C] transition-colors cursor-pointer flex flex-wrap items-center gap-1.5 shadow-2xs"
      >
        {selectedFilamentos.length === 0 ? (
          <div className="flex items-center justify-between w-full px-1 text-xs text-[#75695D]">
            <span className="italic">{placeholder}</span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#A36F4C]">
              <span>Elegir</span>
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
              {selectedFilamentos.map((f, idx) => {
                const stockGramos = f.stockGramos ?? 1000
                const esBajo = stockGramos < 300 || Boolean(f.alertaCritica)

                return (
                  <span
                    key={f.id}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-[#F8F6F2] border border-[#DCD3C6] text-xs font-bold text-[#241C15] shadow-2xs group"
                  >
                    <span 
                      className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0 shadow-xs"
                      style={{ backgroundColor: f.codigoHex || '#1E1E1E' }}
                    />
                    <span className="truncate max-w-[120px]">{f.nombreColor}</span>
                    {esBajo && (
                      <span className="text-[10px] text-[#854D0E]" title="Bajo stock en bobina">⚠️</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveColor(f.id, e)}
                      className="text-[#75695D] hover:text-[#A34335] hover:bg-[#EAE4DC] rounded-full p-0.5 transition-colors cursor-pointer"
                      title="Eliminar este color"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )
              })}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#A36F4C] pr-1">
              {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </div>
          </>
        )}
      </div>

      {/* Expandable Multi-Color Selector Palette */}
      {isOpen && (
        <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DCD3C6] space-y-2 animate-in fade-in-50 duration-150 shadow-sm">
          {/* Quick Search and Selection Counter */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#75695D]" />
              <Input
                type="text"
                placeholder="Buscar color o material..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-7 pl-8 text-xs bg-[#FFFFFF] border-[#E2D9CC] rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            {selectedColorIds.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="h-7 text-[11px] text-[#A34335] border-red-200 hover:bg-red-50 px-2 rounded-lg"
              >
                Limpiar ({selectedColorIds.length})
              </Button>
            )}
          </div>

          {/* Color Chips Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-44 overflow-y-auto pr-0.5">
            {filteredFilamentos.map(f => {
              const isSelected = selectedColorIds.includes(f.id)
              const g = f.stockGramos ?? 1000
              const esBajoStock = g < 300 || Boolean(f.alertaCritica)

              const chipClasses = isSelected
                ? 'bg-[#EFE5D8] text-[#633E20] border-[#A36F4C] ring-2 ring-[#A36F4C] shadow-2xs font-bold'
                : esBajoStock
                  ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] hover:bg-[#FEF08A] hover:border-[#EAB308] font-medium shadow-2xs'
                  : 'bg-[#FFFFFF] text-[#241C15] border-[#E2D9CC] hover:bg-[#F8F6F2] hover:border-[#A36F4C] font-medium shadow-2xs'

              const tooltipText = esBajoStock
                ? `⚠️ ${f.nombreColor}: Bajo stock (${g}g disponibles)`
                : `${f.nombreColor} (${g}g disponibles en taller)`

              return (
                <button
                  key={f.id}
                  type="button"
                  title={tooltipText}
                  onClick={() => handleToggleColor(f.id)}
                  className={`flex items-center gap-1.5 p-1.5 rounded-xl border text-xs transition-all cursor-pointer text-left active:scale-[0.98] ${chipClasses}`}
                >
                  <span 
                    className="w-3 h-3 rounded-full border border-black/20 flex-shrink-0 shadow-xs"
                    style={{ backgroundColor: f.codigoHex || '#1E1E1E' }}
                  />
                  <div className="flex items-center justify-between min-w-0 flex-1 gap-1">
                    <span className="truncate text-[11px]">{f.nombreColor}</span>
                    <span className="text-[10px] font-mono text-[#75695D] flex-shrink-0">
                      {esBajoStock ? `⚠️${g}g` : `${g}g`}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="h-3.5 w-3.5 text-[#633E20] stroke-[2.5] flex-shrink-0" />
                  )}
                </button>
              )
            })}
          </div>

          {filteredFilamentos.length === 0 && (
            <div className="py-2 text-center text-xs text-[#75695D] italic">
              No se encontraron colores con &quot;{search}&quot;
            </div>
          )}

          {/* Quick Selection Summary info */}
          <div className="flex items-center justify-between pt-1 border-t border-[#E2D9CC]/60 text-[10px] text-[#75695D]">
            <span>
              {selectedColorIds.length === 0
                ? 'Toca cualquier color para asignarlo.'
                : `${selectedColorIds.length} color(es) asignados para este producto.`}
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-[#A36F4C] font-bold hover:underline cursor-pointer"
            >
              Cerrar paleta
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
