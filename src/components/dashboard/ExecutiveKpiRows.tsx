'use client'

import React, { useState } from 'react'
import { 
  TrendingUp, 
  Layers, 
  ShieldCheck, 
  Target, 
  SlidersHorizontal,
  Workflow
} from 'lucide-react'
import { KpiInfoTrigger } from '@/components/ui/KpiInfoTrigger'
import { MicroSparkline } from '@/components/ui/MicroSparkline'
import { FinancialWaterfallModal } from '@/components/dashboard/FinancialWaterfallModal'
import { FinancialWhatIfModal } from '@/components/dashboard/FinancialWhatIfModal'
import { cn } from '@/lib/utils'

interface DynamicKpis {
  ingresosVentas: number
  totalCobradoVentas: number
  saldoPorCobrar: number
  tasaCobranza: number
  gananciaNeta: number
  costoDirectoTotal?: number
  margenPorcentaje: number
  markupPorcentaje?: number
  ticketPromedio: number
  margenUnitarioPromedio: number
  [key: string]: any
}

interface GastoState {
  gastoDisponibleHoy: number
  saldoActualCaja: number
  totalBlindadoMes: number
}

interface BreakEvenState {
  cobertura: number
  superavit: number
  pedidosFaltantes: number
  totalFijos: number
}

interface ExecutiveKpiRowsProps {
  dynamicKpis: DynamicKpis
  gasto: GastoState
  breakEven: BreakEvenState
  filteredVentasCount: number
  totalPiezasPeriodo: number
  onInfoClick: (key: string) => void
  formatCurrency: (val: number) => string
  sparklineData?: {
    ventas: number[]
    margen: number[]
    caja: number[]
    cobertura: number[]
  }
  capitalInmovilizado?: number
  className?: string
}

export function ExecutiveKpiRows({
  dynamicKpis,
  gasto,
  breakEven,
  filteredVentasCount,
  totalPiezasPeriodo,
  onInfoClick,
  formatCurrency,
  sparklineData,
  capitalInmovilizado = 0,
  className
}: ExecutiveKpiRowsProps) {
  const [isWaterfallOpen, setIsWaterfallOpen] = useState(false)
  const [isWhatIfOpen, setIsWhatIfOpen] = useState(false)

  // 1. Runway y Pista de Liquidez
  const fijosMensuales = gasto.totalBlindadoMes || 1377.68
  const runwayDias = fijosMensuales > 0 
    ? Math.max(0, Math.round((gasto.saldoActualCaja / fijosMensuales) * 30)) 
    : 999
  const runwayMeses = fijosMensuales > 0 
    ? (gasto.saldoActualCaja / fijosMensuales).toFixed(1) 
    : '∞'

  // 2. Estado de Salud Financiera Global
  const isHealthOptimal = breakEven.cobertura >= 100 && runwayDias >= 30
  const isHealthCritical = runwayDias < 15 || gasto.saldoActualCaja <= 0
  const healthLabel = isHealthOptimal
    ? 'Salud Financiera Sólida'
    : isHealthCritical
    ? 'Tensión de Liquidez'
    : 'Vigilancia Operativa'

  const healthDotClass = isHealthOptimal
    ? 'bg-emerald-500'
    : isHealthCritical
    ? 'bg-rose-500'
    : 'bg-amber-500'

  const kpis = [
    {
      id: 'facturacion',
      title: 'Facturación Neta',
      infoKey: 'facturacion_periodo',
      value: formatCurrency(dynamicKpis.ingresosVentas),
      valueColor: 'text-foreground',
      primaryContext: `${filteredVentasCount} pedidos (${totalPiezasPeriodo} juegos) · Ticket prom: ${formatCurrency(dynamicKpis.ticketPromedio)}`,
      sparkline: sparklineData?.ventas,
      sparklineColor: '#6366f1',
      badgeText: dynamicKpis.saldoPorCobrar > 0 
        ? `Por cobrar: ${formatCurrency(dynamicKpis.saldoPorCobrar)}` 
        : `${dynamicKpis.tasaCobranza.toFixed(0)}% cobrado`,
      badgeTone: dynamicKpis.saldoPorCobrar > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'
    },
    {
      id: 'margen',
      title: 'Margen Comercial Real',
      infoKey: 'utilidad_operativa',
      value: `+${formatCurrency(dynamicKpis.gananciaNeta)}`,
      valueColor: dynamicKpis.gananciaNeta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      primaryContext: `Margen: +${formatCurrency(dynamicKpis.margenUnitarioPromedio)} / ped · Costo stock: ${formatCurrency(dynamicKpis.costoDirectoTotal || 0)}`,
      sparkline: sparklineData?.margen,
      sparklineColor: '#10b981',
      badgeText: `${dynamicKpis.margenPorcentaje.toFixed(1)}% margen`,
      badgeTone: 'text-muted-foreground'
    },
    {
      id: 'caja',
      title: 'Caja Líquida Libre',
      infoKey: 'gasto_libre_disponible',
      value: formatCurrency(gasto.gastoDisponibleHoy),
      valueColor: gasto.gastoDisponibleHoy > 0 ? 'text-foreground' : 'text-amber-600 dark:text-amber-400',
      primaryContext: `Saldo: ${formatCurrency(gasto.saldoActualCaja)} · Fijos: ${formatCurrency(gasto.totalBlindadoMes)}${capitalInmovilizado > 0 ? ` · Stock: ${formatCurrency(capitalInmovilizado)}` : ''}`,
      sparkline: sparklineData?.caja,
      sparklineColor: '#0ea5e9',
      badgeText: `Runway: ${runwayDias}d (~${runwayMeses}m)`,
      badgeTone: 'text-muted-foreground'
    },
    {
      id: 'break_even',
      title: 'Punto de Equilibrio & Fijos',
      infoKey: 'break_even',
      value: `${breakEven.cobertura.toFixed(0)}% cubierto`,
      valueColor: 'text-foreground',
      primaryContext: breakEven.superavit >= 0
        ? `+${formatCurrency(breakEven.superavit)} sobre fijos de ${formatCurrency(breakEven.totalFijos)}`
        : `Faltan ${formatCurrency(Math.abs(breakEven.superavit))} (~${breakEven.pedidosFaltantes} peds)`,
      sparkline: sparklineData?.cobertura,
      sparklineColor: '#f59e0b',
      badgeText: breakEven.superavit >= 0 ? 'Fijos Cubiertos' : `Faltan ~${breakEven.pedidosFaltantes} peds`,
      badgeTone: breakEven.superavit >= 0 ? 'text-muted-foreground' : 'text-amber-600 dark:text-amber-400'
    }
  ]

  return (
    <>
      <div className={cn('space-y-2', className)}>
        {/* Barra Superior Esbelta: Estado + Acceso a Cascada P&L y Simulador */}
        <div className="flex items-center justify-between px-0.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-mono uppercase tracking-wider text-[10px] text-muted-foreground/70 font-medium">
              Rendimiento Ejecutivo Board Games
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
              <span className={cn('w-1.5 h-1.5 rounded-full', healthDotClass)} />
              <span>{healthLabel}</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsWaterfallOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/40 transition-colors cursor-pointer"
              title="Abrir desglose en cascada (Waterfall) de ventas a utilidad neta"
            >
              <Workflow className="w-3.5 h-3.5 text-muted-foreground/80" />
              <span>Cascada P&L</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWhatIfOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-border/40 transition-colors cursor-pointer"
              title="Abrir simulador de sensibilidad What-If"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground/80" />
              <span>Simulador</span>
            </button>
          </div>
        </div>

        {/* Panel Unificado Horizontal de 4 Métricas con Hairline Dividers (Estilo Linear/Vercel) */}
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-border/30 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 shadow-2xs">
          {kpis.map((kpi) => (
            <div
              key={kpi.id}
              className="p-4 sm:p-5 flex flex-col justify-between gap-3 group hover:bg-muted/10 transition-colors"
            >
              {/* Header de la Métrica */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 truncate">
                    {kpi.title}
                  </span>
                  <KpiInfoTrigger
                    onClick={() => onInfoClick(kpi.infoKey)}
                    title={`Ver desglose de ${kpi.title}`}
                  />
                </div>

                {kpi.sparkline && kpi.sparkline.length > 1 && (
                  <MicroSparkline
                    data={kpi.sparkline}
                    color={kpi.sparklineColor}
                    width={40}
                    height={13}
                  />
                )}
              </div>

              {/* Métrica Central + Badge Monocromático */}
              <div className="flex items-baseline justify-between gap-2 pt-0.5">
                <span className={cn('text-2xl sm:text-3xl font-mono font-semibold tracking-tight tabular-nums', kpi.valueColor)}>
                  {kpi.value}
                </span>

                <span className={cn('text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-muted/40 border border-border/30 whitespace-nowrap', kpi.badgeTone)}>
                  {kpi.badgeText}
                </span>
              </div>

              {/* Contexto Inferior */}
              <p className="text-[11px] text-muted-foreground/75 truncate pt-2 border-t border-border/20">
                {kpi.primaryContext}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Cascada Financiera (Waterfall) */}
      <FinancialWaterfallModal
        open={isWaterfallOpen}
        onOpenChange={setIsWaterfallOpen}
        ingresosVentas={dynamicKpis.ingresosVentas}
        costoDirectoTotal={dynamicKpis.costoDirectoTotal || 0}
        gananciaNeta={dynamicKpis.gananciaNeta}
        totalFijos={breakEven.totalFijos}
        superavit={breakEven.superavit}
        filteredVentasCount={filteredVentasCount}
      />

      {/* Modal de Simulación What-If */}
      <FinancialWhatIfModal
        open={isWhatIfOpen}
        onOpenChange={setIsWhatIfOpen}
        currentIngresos={dynamicKpis.ingresosVentas}
        currentCostoDirecto={dynamicKpis.costoDirectoTotal || 0}
        currentGanancia={dynamicKpis.gananciaNeta}
        currentFijos={breakEven.totalFijos}
        currentVentasCount={filteredVentasCount}
        currentSaldoCaja={gasto.saldoActualCaja}
      />
    </>
  )
}
