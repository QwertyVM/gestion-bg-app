'use client'

import React, { useState, useMemo } from 'react'
import { 
  ShoppingBag, 
  Tag, 
  Palette, 
  Package, 
  Calculator, 
  Sparkles, 
  Plus, 
  Minus, 
  CreditCard, 
  Check, 
  X,
  Loader2 
} from 'lucide-react'

// Categorías principales
export const CATEGORIAS_EGRESO = [
  { id: 'INSUMO', label: 'Insumo / Materiales' },
  { id: 'ACTIVO_FIJO', label: 'Activo Fijo / Herramientas' },
  { id: 'EMPAQUE', label: 'Empaque / Despacho' },
  { id: 'SERVICIO', label: 'Servicios / Publicidad' },
] as const

// Presentaciones frecuentes
export const PRESENTACIONES_RAPIDAS = [
  'Bobina 1Kg',
  'Refill 1Kg',
  'Unidad',
  'Pack x10',
  'Pack x50',
]

// Medios de pago
export const MEDIOS_PAGO = [
  'YAPE / PLIN',
  'BCP Transferencia',
  'Tarjeta Débito/Crédito',
  'Efectivo en Taller',
]

export interface EgresoFormData {
  categoria: string
  subcategoria: string
  itemConcepto: string
  especificacionColor: string | null
  presentacion: string | null
  cantidad: number
  costoUnitario: number
  costoEnvio: number
  metodoPago: string
}

interface FormRegistrarEgresoProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: EgresoFormData) => Promise<void>
  initialData?: Partial<EgresoFormData>
  existingTags?: string[]
  isEditing?: boolean
}

export function FormRegistrarEgreso({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  existingTags = [],
  isEditing = false,
}: FormRegistrarEgresoProps) {
  const [categoria, setCategoria] = useState(initialData?.categoria || 'INSUMO')
  const [subcategoria, setSubcategoria] = useState(initialData?.subcategoria || (existingTags.length > 0 ? existingTags[0] : ''))
  const [concepto, setConcepto] = useState(initialData?.itemConcepto || '')
  const [color, setColor] = useState(initialData?.especificacionColor || '')
  const [presentacion, setPresentacion] = useState(initialData?.presentacion || 'Bobina 1Kg')
  const [cantidad, setCantidad] = useState(initialData?.cantidad?.toString() || '1')
  const [costoUnitario, setCostoUnitario] = useState(initialData?.costoUnitario?.toString() || '')
  const [costoEnvio, setCostoEnvio] = useState(initialData?.costoEnvio?.toString() || '0')
  const [metodoPago, setMetodoPago] = useState(initialData?.metodoPago || 'YAPE / PLIN')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const formatCurrency = (val: number) =>
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Steppers
  const handleIncrement = () => {
    const current = parseInt(cantidad) || 0
    setCantidad((current + 1).toString())
  }

  const handleDecrement = () => {
    const current = parseInt(cantidad) || 1
    if (current > 1) {
      setCantidad((current - 1).toString())
    }
  }

  // 4. Tarjeta de Cálculo Automático (Live)
  const calculos = useMemo(() => {
    const cant = Math.max(1, parseInt(cantidad) || 1)
    const unit = Math.max(0, parseFloat(costoUnitario) || 0)
    const envio = Math.max(0, parseFloat(costoEnvio) || 0)

    // Total Calculado = (Cantidad * Costo Unit.) + Flete
    const totalCalculado = (cant * unit) + envio

    // Costo Real Unitario = Total Calculado / Cantidad
    const costoRealUnitario = totalCalculado / cant

    // Verificación si es filamento
    const isFilamento = 
      subcategoria.toLowerCase().includes('filamento') || 
      subcategoria.toLowerCase().includes('bobina') ||
      subcategoria.toLowerCase().includes('refill') ||
      concepto.toLowerCase().includes('pla') ||
      concepto.toLowerCase().includes('petg') ||
      concepto.toLowerCase().includes('abs')

    // Gramos totales del lote (1,000 g por cada bobina/refill de 1Kg)
    let totalGramos = cant * 1000
    if (presentacion.toLowerCase().includes('500g')) {
      totalGramos = cant * 500
    }

    // Costo Real por Gramo (S/ por gramo)
    const costoPorGramo = totalGramos > 0 ? totalCalculado / totalGramos : null

    return {
      totalCalculado,
      costoRealUnitario,
      costoPorGramo,
      totalGramos,
      isFilamento,
    }
  }, [cantidad, costoUnitario, costoEnvio, subcategoria, concepto, presentacion])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!concepto.trim() || !costoUnitario) return

    setIsSubmitting(true)
    try {
      let dbCategoria = categoria
      if (categoria === 'EMPAQUE') dbCategoria = 'INSUMO'

      await onSubmit({
        categoria: dbCategoria,
        subcategoria: subcategoria.trim(),
        itemConcepto: concepto.trim(),
        especificacionColor: color.trim() || null,
        presentacion: presentacion.trim() || null,
        cantidad: parseInt(cantidad) || 1,
        costoUnitario: parseFloat(costoUnitario) || 0,
        costoEnvio: parseFloat(costoEnvio) || 0,
        metodoPago,
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-[620px] bg-[#121316] border border-[#26282E] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera del Modal Fija */}
        <div className="px-5 sm:px-6 py-4 border-b border-[#26282E] bg-[#1A1D23]/70 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {isEditing ? 'Editar Egreso / Insumo' : 'Registrar Egreso / Insumo'}
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Control de compras de filamento, packaging y gastos operativos.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Formulario con Scroll Interno y Footer Fijo */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 touch-pan-y">
            {/* 1. Categoría y Subcategoría */}
            <div className="space-y-3">
              {/* Selector de Categoría Principal */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                  <span>Categoría Principal <span className="text-amber-500">*</span></span>
                  <span className="text-[11px] text-zinc-500 font-normal">Tipo de egreso</span>
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-[#1A1D23] border border-[#2A2E39] text-zinc-100 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40 font-medium cursor-pointer"
                >
                  {CATEGORIAS_EGRESO.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tags existentes únicamente */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-amber-400" />
                    Tag / Subcategoría <span className="text-amber-500">*</span>
                  </label>
                  {existingTags.length > 0 && (
                    <span className="text-[11px] text-zinc-500 font-normal">Tags existentes ({existingTags.length})</span>
                  )}
                </div>

                {existingTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {existingTags.map((tag) => {
                      const isSelected = subcategoria.trim().toLowerCase() === tag.trim().toLowerCase()
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setSubcategoria(tag)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/30'
                              : 'bg-[#1A1D23] border border-[#2A2E39] text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                          }`}
                        >
                          {isSelected && <Check className="h-3 w-3 text-amber-400" />}
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                )}

                <input
                  type="text"
                  value={subcategoria}
                  onChange={(e) => setSubcategoria(e.target.value)}
                  placeholder="Escribe o selecciona un tag..."
                  required
                  className="w-full bg-[#1A1D23] border border-[#2A2E39] text-zinc-100 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* 2. Detalles del Insumo */}
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  Concepto / Nombre del Insumo <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  value={concepto}
                  onChange={(e) => setConcepto(e.target.value)}
                  placeholder="Ej: Filamento PLA Matte Negro, Cajas 15x15x15..."
                  required
                  className="w-full bg-[#1A1D23] border border-[#2A2E39] text-zinc-100 placeholder:text-zinc-600 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-zinc-500" />
                    Color / Especificación
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="Ej: Negro / 0.4mm / Transparente"
                    className="w-full bg-[#1A1D23] border border-[#2A2E39] text-zinc-100 placeholder:text-zinc-600 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-zinc-500" />
                    Presentación
                  </label>
                  <select
                    value={presentacion}
                    onChange={(e) => setPresentacion(e.target.value)}
                    className="w-full bg-[#1A1D23] border border-[#2A2E39] text-zinc-100 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {PRESENTACIONES_RAPIDAS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 3. Costos y Cantidades */}
            <div className="p-4 rounded-xl bg-[#181A20] border border-[#26282E] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Cantidad con Stepper */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Cantidad <span className="text-amber-500">*</span>
                  </label>
                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={handleDecrement}
                      className="h-9 px-2.5 bg-[#121316] border border-r-0 border-[#2A2E39] rounded-l-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      required
                      className="w-full bg-[#121316] border border-[#2A2E39] text-white text-center font-mono font-bold text-sm h-9 focus:outline-none focus:border-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleIncrement}
                      className="h-9 px-2.5 bg-[#121316] border border-l-0 border-[#2A2E39] rounded-r-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex items-center justify-center cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Costo Unitario */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Costo Unit. (S/) <span className="text-amber-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 font-semibold">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costoUnitario}
                      onChange={(e) => setCostoUnitario(e.target.value)}
                      placeholder="0.00"
                      required
                      className="w-full pl-8 bg-[#121316] border border-[#2A2E39] text-white text-sm font-mono font-bold h-9 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Flete / Envío */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-300">
                    Flete / Envío (S/)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-500 font-semibold">S/</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={costoEnvio}
                      onChange={(e) => setCostoEnvio(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 bg-[#121316] border border-[#2A2E39] text-white text-sm font-mono h-9 rounded-xl focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Medio de Pago */}
              <div className="pt-2 border-t border-[#26282E] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <label className="text-zinc-400 flex items-center gap-1.5">
                  <CreditCard className="h-3.5 w-3.5 text-zinc-500" />
                  Medio de Pago:
                </label>
                <select
                  value={metodoPago}
                  onChange={(e) => setMetodoPago(e.target.value)}
                  className="bg-[#121316] border border-[#2A2E39] text-zinc-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  {MEDIOS_PAGO.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 4. Tarjeta de Cálculo Automático (Live Preview) */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#1A1D23] to-[#14161B] border border-[#2A2E39] shadow-lg relative overflow-hidden space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Tarjeta de Cálculo Automático (Live)
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                {/* Total Calculado */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Total Calculado</span>
                  <div className="text-lg font-black text-amber-400 font-mono">
                    {formatCurrency(calculos.totalCalculado)}
                  </div>
                  <span className="text-[10px] text-zinc-500 block">(Cant. × Unit.) + Flete</span>
                </div>

                {/* Costo Real Unitario */}
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold">Costo Real Unitario</span>
                  <div className="text-base font-bold text-white font-mono">
                    {formatCurrency(calculos.costoRealUnitario)}
                  </div>
                  <span className="text-[10px] text-zinc-500 block">Total / Cantidad</span>
                </div>

                {/* Costo Real por Gramo */}
                {calculos.costoPorGramo !== null && (
                  <div className="space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-zinc-400 uppercase font-semibold">Costo por Gramo</span>
                    <div className="text-base font-bold text-blue-400 font-mono">
                      S/ {calculos.costoPorGramo.toFixed(4)} <span className="text-xs font-normal text-zinc-400">/ g</span>
                    </div>
                    <span className="text-[10px] text-zinc-500 block">({calculos.totalGramos}g lote total)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. Footer Fijo con Botones Funcionales */}
          <div className="px-5 sm:px-6 py-4 border-t border-[#26282E] bg-[#1A1D23]/70 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="text-zinc-400 hover:text-white hover:bg-zinc-800 text-xs px-4 py-2.5 rounded-xl transition-colors font-medium cursor-pointer active:scale-[0.98]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-zinc-950 font-bold text-xs px-5 py-2.5 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Egreso'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
