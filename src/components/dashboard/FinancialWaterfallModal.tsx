'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { 
  X,
  Workflow,
  Sparkles
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface FinancialWaterfallModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ingresosVentas: number
  costoDirectoTotal: number
  gananciaNeta: number
  totalFijos: number
  superavit: number
  filteredVentasCount: number
}

export function FinancialWaterfallModal({
  open,
  onOpenChange,
  ingresosVentas,
  costoDirectoTotal,
  gananciaNeta,
  totalFijos,
  superavit,
  filteredVentasCount
}: FinancialWaterfallModalProps) {
  // Proporciones relativas a la facturación
  const base = Math.max(1, ingresosVentas)
  const pctCosto = (costoDirectoTotal / base) * 100
  const pctMargen = (gananciaNeta / base) * 100
  const pctFijos = (totalFijos / base) * 100
  const pctNeto = (superavit / base) * 100

  // Anatomía de cada S/ 1.00
  const solCosto = ((costoDirectoTotal / base) * 1).toFixed(2)
  const solFijos = ((totalFijos / base) * 1).toFixed(2)
  const solNeto = ((Math.max(0, superavit) / base) * 1).toFixed(2)

  // Alturas proporcionales para el gráfico SVG (Canvas de 120px de altura efectiva)
  const chartHeight = 110
  const barWidth = 44

  const hFacturacion = chartHeight
  const yFacturacion = 10

  const hCostos = Math.max(6, (pctCosto / 100) * chartHeight)
  const yCostos = yFacturacion // Comienza en el tope de Facturación y baja

  const hMargen = Math.max(6, (pctMargen / 100) * chartHeight)
  const yMargen = yFacturacion + hCostos // Parte desde donde quedaron los costos

  const hFijos = Math.max(6, (pctFijos / 100) * chartHeight)
  const yFijos = yMargen // Comienza en el tope del margen y baja

  const hNeto = Math.max(6, (Math.abs(pctNeto) / 100) * chartHeight)
  const yNeto = Math.min(yFacturacion + chartHeight - hNeto, yFijos + hFijos)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="max-w-lg w-[95vw] rounded-2xl p-5 sm:p-6 bg-card border border-border/60 shadow-xl overflow-hidden text-foreground">
        {/* Cabecera Esbelta Minimalista */}
        <div className="flex items-start justify-between gap-3 border-b border-border/50 pb-3.5">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Workflow className="w-4 h-4 text-indigo-500" />
              <DialogTitle className="text-base font-bold text-foreground tracking-tight">
                Cascada de Flujo Financiero BG
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Flujo descendente desde cada venta de juegos de mesa hasta la utilidad neta.
            </DialogDescription>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            aria-label="Cerrar ventana"
            className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. AUTÉNTICO WATERFALL BRIDGE CHART (SVG CONTINUO) */}
        <div className="py-2.5">
          <div className="w-full bg-muted/20 border border-border/40 rounded-xl p-3 sm:p-4">
            <svg 
              viewBox="0 0 340 160" 
              className="w-full h-auto overflow-visible select-none"
              aria-label="Gráfico de Cascada de Flujo de Fondos Board Games"
            >
              {/* Línea Base de Suelo */}
              <line x1="10" y1="120" x2="330" y2="120" stroke="currentColor" strokeOpacity="0.15" strokeWidth="1" />

              {/* Columna 1: Facturación Bruta (Pilar Base) */}
              <g>
                <rect 
                  x="15" 
                  y={yFacturacion} 
                  width={barWidth} 
                  height={hFacturacion} 
                  rx="4" 
                  className="fill-indigo-500/15 stroke-indigo-500/50" 
                  strokeWidth="1.5"
                />
                <text x="37" y={yFacturacion - 4} textAnchor="middle" className="text-[10px] font-mono font-bold fill-foreground">
                  100%
                </text>
                <text x="37" y="134" textAnchor="middle" className="text-[9px] font-medium fill-muted-foreground">
                  Ventas
                </text>
              </g>

              {/* Línea Guía 1 a 2 */}
              <line x1="59" y1={yFacturacion} x2="80" y2={yFacturacion} stroke="currentColor" strokeOpacity="0.3" strokeDasharray="2 2" />

              {/* Columna 2: (-) Costos Directos (COGS Juegos de Mesa) */}
              <g>
                <rect 
                  x="80" 
                  y={yCostos} 
                  width={barWidth} 
                  height={hCostos} 
                  rx="4" 
                  className="fill-rose-500/20 stroke-rose-500/70" 
                  strokeWidth="1.5"
                />
                <text x="102" y={yCostos + hCostos / 2 + 3} textAnchor="middle" className="text-[9px] font-mono font-bold fill-rose-600 dark:fill-rose-400">
                  -{pctCosto.toFixed(0)}%
                </text>
                <text x="102" y="134" textAnchor="middle" className="text-[9px] font-medium fill-muted-foreground">
                  COGS Stock
                </text>
              </g>

              {/* Línea Guía 2 a 3 */}
              <line x1="124" y1={yMargen} x2="145" y2={yMargen} stroke="currentColor" strokeOpacity="0.3" strokeDasharray="2 2" />

              {/* Columna 3: (=) Margen Bruto (Subtotal flotante) */}
              <g>
                <rect 
                  x="145" 
                  y={yMargen} 
                  width={barWidth} 
                  height={hMargen} 
                  rx="4" 
                  className="fill-emerald-500/15 stroke-emerald-500/60" 
                  strokeWidth="1.5"
                />
                <text x="167" y={yMargen - 4} textAnchor="middle" className="text-[10px] font-mono font-bold fill-emerald-700 dark:fill-emerald-400">
                  {pctMargen.toFixed(0)}%
                </text>
                <text x="167" y="134" textAnchor="middle" className="text-[9px] font-medium fill-muted-foreground">
                  Margen
                </text>
              </g>

              {/* Línea Guía 3 a 4 */}
              <line x1="189" y1={yMargen} x2="210" y2={yMargen} stroke="currentColor" strokeOpacity="0.3" strokeDasharray="2 2" />

              {/* Columna 4: (-) Fijos Blindados (Cae desde el margen) */}
              <g>
                <rect 
                  x="210" 
                  y={yFijos} 
                  width={barWidth} 
                  height={hFijos} 
                  rx="4" 
                  className="fill-amber-500/20 stroke-amber-500/70" 
                  strokeWidth="1.5"
                />
                <text x="232" y={yFijos + hFijos / 2 + 3} textAnchor="middle" className="text-[9px] font-mono font-bold fill-amber-700 dark:fill-amber-400">
                  -{pctFijos.toFixed(0)}%
                </text>
                <text x="232" y="134" textAnchor="middle" className="text-[9px] font-medium fill-muted-foreground">
                  Fijos
                </text>
              </g>

              {/* Línea Guía 4 a 5 */}
              <line x1="254" y1={yNeto} x2="275" y2={yNeto} stroke="currentColor" strokeOpacity="0.3" strokeDasharray="2 2" />

              {/* Columna 5: (=) Beneficio Neto Real (Aterriza en el suelo) */}
              <g>
                <rect 
                  x="275" 
                  y={yNeto} 
                  width={barWidth} 
                  height={hNeto} 
                  rx="4" 
                  className={superavit >= 0 ? 'fill-emerald-600 stroke-emerald-700' : 'fill-rose-600 stroke-rose-700'} 
                  strokeWidth="1.5"
                />
                <text x="297" y={yNeto - 4} textAnchor="middle" className={`text-[10px] font-mono font-bold ${superavit >= 0 ? 'fill-emerald-600 dark:fill-emerald-400' : 'fill-rose-600'}`}>
                  {pctNeto.toFixed(0)}%
                </text>
                <text x="297" y="134" textAnchor="middle" className="text-[9px] font-semibold fill-foreground">
                  Neto Libre
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* 2. ANATOMÍA DE CADA S/ 1.00 (CINTA HORIZONTAL CONTINUA) */}
        <div className="space-y-1.5 py-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              Anatomía de cada S/ 1.00 vendido:
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {filteredVentasCount} pedidos
            </span>
          </div>

          {/* Ribbon Continuo */}
          <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-muted/40">
            <div 
              style={{ width: `${Math.max(5, pctNeto)}%` }} 
              className="h-full bg-emerald-500 transition-all duration-300" 
              title={`Utilidad Neta: ${pctNeto.toFixed(1)}%`} 
            />
            <div 
              style={{ width: `${Math.max(5, pctFijos)}%` }} 
              className="h-full bg-amber-500 transition-all duration-300" 
              title={`Fijos Blindados: ${pctFijos.toFixed(1)}%`} 
            />
            <div 
              style={{ width: `${Math.max(5, pctCosto)}%` }} 
              className="h-full bg-rose-500 transition-all duration-300" 
              title={`Costo Inversión Juegos: ${pctCosto.toFixed(1)}%`} 
            />
          </div>

          {/* Leyenda Horizontal Limpia */}
          <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground pt-0.5">
            <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              S/ {solNeto} Ganancia
            </span>
            <span className="flex items-center gap-1 text-amber-700 dark:text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              S/ {solFijos} Fijos
            </span>
            <span className="flex items-center gap-1 text-rose-700 dark:text-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              S/ {solCosto} Costo Juego
            </span>
          </div>
        </div>

        {/* 3. LEDGER CONTABLE TABULAR MINIMALISTA */}
        <div className="border-t border-border/50 divide-y divide-border/40 text-xs pt-1">
          <div className="py-2 flex items-center justify-between">
            <span className="text-foreground font-medium">Facturación Bruta (Juegos)</span>
            <span className="font-mono font-bold text-foreground tabular-nums">
              {formatCurrency(ingresosVentas)}
            </span>
          </div>

          <div className="py-2 flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="text-rose-500 font-mono">−</span>
              Costo de Adquisición (COGS Juegos Vendidos)
            </span>
            <span className="font-mono text-rose-700 dark:text-rose-400 tabular-nums">
              −{formatCurrency(costoDirectoTotal)}
            </span>
          </div>

          <div className="py-2 flex items-center justify-between font-medium">
            <span className="text-emerald-700 dark:text-emerald-400">Margen Comercial Bruto</span>
            <span className="font-mono text-emerald-700 dark:text-emerald-400 tabular-nums font-semibold">
              +{formatCurrency(gananciaNeta)}
            </span>
          </div>

          <div className="py-2 flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="text-amber-500 font-mono">−</span>
              Costos Fijos Blindados del Mes (BCP/Almacén/Servicios)
            </span>
            <span className="font-mono text-amber-800 dark:text-amber-400 tabular-nums">
              −{formatCurrency(totalFijos)}
            </span>
          </div>

          <div className="py-2.5 flex items-center justify-between font-bold text-sm bg-muted/20 px-2 -mx-2 rounded-lg">
            <span className={superavit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700'}>
              Beneficio Neto Real
            </span>
            <span className={`font-mono tabular-nums ${superavit >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700'}`}>
              {superavit >= 0 ? '+' : ''}{formatCurrency(superavit)}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
