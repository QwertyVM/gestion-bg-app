'use client'

import React, { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { 
  Sparkles, 
  RotateCcw, 
  TrendingUp, 
  TrendingDown, 
  SlidersHorizontal 
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface FinancialWhatIfModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentIngresos: number
  currentCostoDirecto: number
  currentGanancia: number
  currentFijos: number
  currentVentasCount: number
  currentSaldoCaja: number
}

export function FinancialWhatIfModal({
  open,
  onOpenChange,
  currentIngresos,
  currentCostoDirecto,
  currentGanancia,
  currentFijos,
  currentVentasCount,
  currentSaldoCaja
}: FinancialWhatIfModalProps) {
  // Controles de Simulación
  const [volumeDeltaPct, setVolumeDeltaPct] = useState<number>(0) // -40% a +60%
  const [priceDeltaPct, setPriceDeltaPct] = useState<number>(0)   // -20% a +30%
  const [fixedCostsDelta, setFixedCostsDelta] = useState<number>(0) // -400 a +800

  const handleReset = () => {
    setVolumeDeltaPct(0)
    setPriceDeltaPct(0)
    setFixedCostsDelta(0)
  }

  // Cálculos reactivos de la simulación
  const simulation = useMemo(() => {
    const volumeMultiplier = 1 + volumeDeltaPct / 100
    const priceMultiplier = 1 + priceDeltaPct / 100

    // Pedidos proyectados
    const projectedOrders = Math.max(0, Math.round(currentVentasCount * volumeMultiplier))

    // Ticket promedio base
    const baseTicket = currentVentasCount > 0 ? currentIngresos / currentVentasCount : 0
    const newTicket = baseTicket * priceMultiplier

    // Nueva facturación proyectada
    const newIngresos = projectedOrders * newTicket

    // Costo directo unitario promedio (adquisición de juegos por pedido)
    const baseDirectUnitCost = currentVentasCount > 0 ? currentCostoDirecto / currentVentasCount : 0
    const newCostoDirecto = projectedOrders * baseDirectUnitCost

    // Nueva ganancia operativa (Margen Comercial)
    const newGanancia = newIngresos - newCostoDirecto
    const newMargenPct = newIngresos > 0 ? (newGanancia / newIngresos) * 100 : 0

    // Nuevos costos fijos mensuales
    const newFijos = Math.max(0, currentFijos + fixedCostsDelta)

    // Nuevo margen unitario por pedido
    const newMargenUnit = projectedOrders > 0 ? newGanancia / projectedOrders : 0

    // Nuevo Punto de Equilibrio
    const newPedidosEquilibrio = newMargenUnit > 0 ? Math.ceil(newFijos / newMargenUnit) : 999
    const newCobertura = newFijos > 0 ? (newGanancia / newFijos) * 100 : 100
    const newSuperavit = newGanancia - newFijos

    // Nuevo Runway estimado (días de cobertura con saldo en caja y nueva tasa de fijos)
    const newRunwayDias = newFijos > 0 ? Math.max(0, Math.round((currentSaldoCaja / newFijos) * 30)) : 999

    return {
      projectedOrders,
      newIngresos,
      newCostoDirecto,
      newGanancia,
      newMargenPct,
      newFijos,
      newPedidosEquilibrio,
      newCobertura,
      newSuperavit,
      newRunwayDias,
      gananciaDelta: newGanancia - currentGanancia,
      superavitDelta: newSuperavit - (currentGanancia - currentFijos)
    }
  }, [
    volumeDeltaPct,
    priceDeltaPct,
    fixedCostsDelta,
    currentVentasCount,
    currentIngresos,
    currentCostoDirecto,
    currentGanancia,
    currentFijos,
    currentSaldoCaja
  ])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto rounded-2xl p-5 sm:p-6">
        <DialogHeader className="space-y-1 text-left border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <SlidersHorizontal className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Simulador de Sensibilidad Board Games
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Prueba escenarios: ¿qué ocurre si aumentas volumen, ajustas precios o cambian fijos?
                </DialogDescription>
              </div>
            </div>

            {(volumeDeltaPct !== 0 || priceDeltaPct !== 0 || fixedCostsDelta !== 0) && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-2 py-1 rounded-md hover:bg-muted"
                title="Restablecer valores"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </DialogHeader>

        {/* Sliders Interactivos */}
        <div className="space-y-4 py-3 border-b border-border/60">
          {/* Slider 1: Volumen de Ventas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                Volumen de Pedidos de Juegos
              </span>
              <span className={`font-mono font-bold text-xs ${
                volumeDeltaPct > 0 ? 'text-emerald-700 dark:text-emerald-400' : volumeDeltaPct < 0 ? 'text-rose-600' : 'text-muted-foreground'
              }`}>
                {volumeDeltaPct > 0 ? `+${volumeDeltaPct}%` : `${volumeDeltaPct}%`} ({simulation.projectedOrders} peds)
              </span>
            </div>
            <input 
              type="range" 
              min="-40" 
              max="60" 
              step="5" 
              value={volumeDeltaPct}
              onChange={(e) => setVolumeDeltaPct(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>-40% (Baja demanda)</span>
              <span>Base ({currentVentasCount} peds)</span>
              <span>+60% (Campaña/Navidad)</span>
            </div>
          </div>

          {/* Slider 2: Precios de Venta */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                Ajuste en Precios de Venta
              </span>
              <span className={`font-mono font-bold text-xs ${
                priceDeltaPct > 0 ? 'text-emerald-700 dark:text-emerald-400' : priceDeltaPct < 0 ? 'text-rose-600' : 'text-muted-foreground'
              }`}>
                {priceDeltaPct > 0 ? `+${priceDeltaPct}%` : `${priceDeltaPct}%`}
              </span>
            </div>
            <input 
              type="range" 
              min="-20" 
              max="30" 
              step="5" 
              value={priceDeltaPct}
              onChange={(e) => setPriceDeltaPct(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>-20% (Descuentos)</span>
              <span>Precio Base</span>
              <span>+30% (Incremento)</span>
            </div>
          </div>

          {/* Slider 3: Costos Fijos */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                Variación en Costos Fijos Mensuales
              </span>
              <span className={`font-mono font-bold text-xs ${
                fixedCostsDelta > 0 ? 'text-rose-600' : fixedCostsDelta < 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-muted-foreground'
              }`}>
                {fixedCostsDelta > 0 ? `+${formatCurrency(fixedCostsDelta)}` : fixedCostsDelta < 0 ? `-${formatCurrency(Math.abs(fixedCostsDelta))}` : 'Sin cambios'}
              </span>
            </div>
            <input 
              type="range" 
              min="-400" 
              max="800" 
              step="50" 
              value={fixedCostsDelta}
              onChange={(e) => setFixedCostsDelta(Number(e.target.value))}
              className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>-S/ 400 (Ahorro)</span>
              <span>Fijos Actuales ({formatCurrency(currentFijos)})</span>
              <span>+S/ 800 (Alquiler/Publicidad)</span>
            </div>
          </div>
        </div>

        {/* Matriz Comparativa: Base vs Simulado */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 py-3">
          {/* Tarjeta 1: Utilidad Libre Proyectada */}
          <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Utilidad Libre Proyectada
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className={`text-lg font-mono font-bold tracking-tight tabular-nums ${
                simulation.newSuperavit >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'
              }`}>
                {simulation.newSuperavit >= 0 ? '+' : ''}{formatCurrency(simulation.newSuperavit)}
              </span>
              <span className={`inline-flex items-center text-[11px] font-mono font-medium ${
                simulation.superavitDelta >= 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600'
              }`}>
                {simulation.superavitDelta >= 0 ? <TrendingUp className="w-3 h-3 mr-0.5" /> : <TrendingDown className="w-3 h-3 mr-0.5" />}
                {simulation.superavitDelta >= 0 ? '+' : ''}{formatCurrency(simulation.superavitDelta)}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Margen neto proyectado: <strong className="font-mono text-foreground">{simulation.newMargenPct.toFixed(1)}%</strong>
            </p>
          </div>

          {/* Tarjeta 2: Nuevo Punto de Equilibrio */}
          <div className="p-3.5 rounded-xl bg-card border border-border/70 space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Nuevo Punto de Equilibrio
            </span>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-lg font-mono font-bold tracking-tight text-foreground tabular-nums">
                {simulation.newCobertura.toFixed(0)}% cubierto
              </span>
              <span className="text-[11px] font-mono text-muted-foreground">
                Meta: {simulation.newPedidosEquilibrio} peds
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {simulation.newSuperavit >= 0 
                ? 'Fijos cubiertos con superávit'
                : `Faltan ~${Math.max(0, simulation.newPedidosEquilibrio - simulation.projectedOrders)} pedidos para cubrir costos`
              }
            </p>
          </div>
        </div>

        {/* Resumen Táctico */}
        <div className="p-3.5 rounded-xl bg-indigo-500/5 border border-indigo-500/15 text-xs space-y-1">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            Conclusión del Escenario:
          </p>
          <p className="text-muted-foreground text-[11px] leading-relaxed">
            {simulation.newSuperavit > (currentGanancia - currentFijos)
              ? `Este escenario incrementa tu beneficio neto en ${formatCurrency(simulation.superavitDelta)}. Tu pista de liquidez (runway) se situaría en ~${simulation.newRunwayDias} días de operación segura.`
              : `Bajo estos parámetros el beneficio neto se reduce en ${formatCurrency(Math.abs(simulation.superavitDelta))}. Deberías vigilar la absorción de compras de inventario y fijos.`
            }
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
