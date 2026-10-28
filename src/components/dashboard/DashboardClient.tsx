'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  ComposedChart, 
  Bar, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend
} from 'recharts'
import { 
  TrendingUp, 
  ShieldCheck, 
  Wallet, 
  RefreshCw, 
  Trophy, 
  Users, 
  ShoppingBag, 
  Package, 
  ArrowUpRight,
  Dice5,
  Dices
} from 'lucide-react'

import { DateFilterControl } from '@/components/ui/DateFilterControl'
import { DateRange, getPresetDateRange, isDateInRange, formatFechaEvolucion, MESES_ES } from '@/lib/date-utils'
import { formatCurrency, getInitials, formatClienteNombre } from '@/lib/utils'
import { ExecutiveKpiRows } from '@/components/dashboard/ExecutiveKpiRows'
import { OperationalPulseBar } from '@/components/dashboard/OperationalPulseBar'
import { AcquisitionChannelsCard } from '@/components/dashboard/AcquisitionChannelsCard'
import { KpiExplainerModal } from '@/components/ui/KpiExplainerModal'

// Paleta de colores minimalista para gastos (Donut Chart)
const DONUT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#8b5cf6', '#ec4899']

// Configuración de los 3 gráficos analíticos para Juegos de Mesa
const EVOLUCION_CONFIG = {
  MARGEN: {
    title: 'Margen Real por Pedido',
    description: 'Facturación vendida vs. costo de adquisición por día'
  },
  FLUJO: {
    title: 'Flujo Diario de Caja',
    description: 'Cobranzas recibidas vs. egresos de la tienda por fecha real'
  },
  ACUMULADO: {
    title: 'Curva Acumulativa del Período',
    description: 'Tendencia acumulada de cobranzas vs. egresos a la fecha'
  },
  TODOS: {
    title: 'Análisis Financiero Completo (3 Gráficos)',
    description: 'Margen comercial, flujo de caja y curva acumulada'
  }
}

// Tooltip 1: Margen por Pedido
function MargenTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const venta = Number(data.ventaTotal || 0)
    const costo = Number(data.costoProduccion || 0)
    const utilidad = Number(data.utilidad || 0)
    const margenPct = data.margenPct || 0
    const pedidos = data.pedidosDetalle || []

    return (
      <div className="bg-popover border border-border/80 rounded-xl shadow-lg p-3 min-w-[220px] max-w-[280px] text-xs font-sans text-popover-foreground">
        <div className="flex items-center justify-between border-b border-border/50 pb-1.5 mb-2">
          <span className="font-bold text-foreground">{formatFechaEvolucion(label, true)}</span>
          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
            {margenPct}% margen
          </span>
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <div className="flex justify-between items-center">
            <span>Venta Total:</span>
            <span className="font-mono font-bold text-foreground">{formatCurrency(venta)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Costo Stock / Compra:</span>
            <span className="font-mono font-medium text-foreground/80">{formatCurrency(costo)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-border/40 font-bold">
            <span className="text-emerald-600 dark:text-emerald-400">Utilidad Comercial:</span>
            <span className="font-mono text-sm text-emerald-600 dark:text-emerald-400">
              +{formatCurrency(utilidad)}
            </span>
          </div>

          {pedidos.length > 0 && (
            <div className="pt-2 border-t border-border/40 space-y-1">
              <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                {pedidos.length === 1 ? 'Detalle del pedido' : `${pedidos.length} pedidos registrados`}:
              </div>
              {pedidos.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start text-[11px] gap-2 py-0.5">
                  <div className="truncate min-w-0 flex-1">
                    <span className="font-semibold text-foreground block truncate">{formatClienteNombre(p.cliente)}</span>
                    <span className="text-muted-foreground block text-[10px] truncate">{p.producto}</span>
                  </div>
                  <span className="font-mono font-bold text-foreground shrink-0">
                    {formatCurrency(Number(p.total))}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

// Tooltip 2: Flujo Diario de Caja
function FlujoCajaTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const entradas = Number(data.entradas || 0)
    const salidas = Number(data.salidas || 0)
    const balanceNeto = Number(data.balanceNeto || 0)
    const isNegative = balanceNeto < 0

    return (
      <div className="bg-popover border border-border/80 rounded-xl shadow-lg p-3 min-w-[210px] text-xs font-sans text-popover-foreground">
        <div className="flex items-center justify-between border-b border-border/50 pb-1.5 mb-2">
          <span className="font-bold text-foreground">{formatFechaEvolucion(label, true)}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
            isNegative 
              ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' 
              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          }`}>
            {isNegative ? 'Déficit Día' : 'Superávit Día'}
          </span>
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Entradas en Caja:
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(entradas)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Salidas / Egresos:
            </span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(salidas)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-border/40 font-bold">
            <span>Balance del Día:</span>
            <span className={`font-mono text-sm ${isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isNegative ? '-' : '+'}{formatCurrency(Math.abs(balanceNeto))}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Tooltip 3: Curva Acumulativa
function AcumuladoTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const cobranza = Number(data.ingresosAcum || 0)
    const gastos = Number(data.egresosAcum || 0)
    const balance = Number(data.balanceAcum || 0)
    const isNegative = balance < 0

    return (
      <div className="bg-popover border border-border/80 rounded-xl shadow-lg p-3 min-w-[210px] text-xs font-sans text-popover-foreground">
        <div className="flex items-center justify-between border-b border-border/50 pb-1.5 mb-2">
          <span className="font-bold text-foreground">{formatFechaEvolucion(label, true)}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
            isNegative 
              ? 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20' 
              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          }`}>
            {isNegative ? 'Balance Negativo' : 'Balance Favorable'}
          </span>
        </div>
        <div className="space-y-1.5 text-muted-foreground">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Cobranza Acumulada:
            </span>
            <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(cobranza)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Gastos Acumulados:
            </span>
            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">{formatCurrency(gastos)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-border/40 font-bold">
            <span className={isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}>Balance a la Fecha:</span>
            <span className={`font-mono text-sm ${isNegative ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isNegative ? '-' : '+'}{formatCurrency(Math.abs(balance))}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export interface TopClienteItem {
  cliente: string
  totalComprado: number
  totalPagado: number
  saldoPendiente: number
  pedidosCount: number
  piezasCount: number
  porcentajeDelTotal: number
  canalPreferido: string | null
  ultimoPedidoFecha: string
}

export interface TopArticuloItem {
  id: string
  nombreModelo: string
  lineaCategoria: string
  unidadesVendidas: number
  totalFacturado: number
  pedidosCount: number
  precioPromedio: number
  porcentajeUnidades: number
  porcentajeFacturacion: number
  costoProduccionTotal?: number
  gananciaNeta?: number
  margenPorcentaje?: number
}

export interface CapacidadGastoData {
  saldoActualCaja: number
  totalBlindadoMes: number
  cuotaPrestamoMensual: number
  reservaCapexMensual: number
  gastosFijosTaller: number
  gastoDisponibleHoy: number
  gastoDisponibleProyectado: number
  pedidosProyectadosMes: number
  gananciaProyectadaMes: number
}

interface DashboardClientProps {
  kpis: {
    ingresosVentas: number
    costoFabricacionTotal: number
    gananciaNeta: number
    margenPorcentaje: number
    totalCobradoVentas: number
    saldoPorCobrar: number
    egresosTotales: number
    ticketPromedio: number
    totalIngresosDirectos: number
  }
  capacidadGasto?: CapacidadGastoData
  graficoEvolucion: { fecha: string; ingresos: number; costo: number; ganancia: number }[]
  graficoInversion: { name: string; value: number }[]
  cuentasPorCobrar?: any[]
  topClientes?: TopClienteItem[]
  topArticulos?: TopArticuloItem[]
  rawVentas?: any[]
  rawInversiones?: any[]
  rawIngresosDirectos?: any[]
  rawProductos?: any[]
}

export function DashboardClient({ 
  kpis: initialKpis, 
  capacidadGasto: initialCapacidadGasto,
  graficoEvolucion: initialGraficoEvolucion, 
  graficoInversion: initialGraficoInversion,
  topClientes: initialTopClientes = [],
  topArticulos: initialTopArticulos = [],
  rawVentas = [],
  rawInversiones = [],
  rawIngresosDirectos = [],
  rawProductos = []
}: DashboardClientProps) {
  const router = useRouter()
  // Default al historial completo
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDateRange('TODO'))
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [evolucionTab, setEvolucionTab] = useState<'MARGEN' | 'FLUJO' | 'ACUMULADO' | 'TODOS'>('MARGEN')
  const [soloDiasConVentas, setSoloDiasConVentas] = useState(true)
  const [rankingArticulosMode, setRankingArticulosMode] = useState<'RENTABILIDAD' | 'VOLUMEN'>('RENTABILIDAD')
  const [selectedKpiExplainer, setSelectedKpiExplainer] = useState<string | null>(null)

  // 1. Filtrar ventas por rango de fecha
  const filteredVentas = useMemo(() => {
    if (!rawVentas || rawVentas.length === 0) return []
    return rawVentas.filter((v: any) => isDateInRange(v.fecha, dateRange.from, dateRange.to))
  }, [rawVentas, dateRange])

  // 2. Filtrar inversiones / egresos por rango de fecha
  const filteredInversiones = useMemo(() => {
    if (!rawInversiones || rawInversiones.length === 0) return []
    return rawInversiones.filter((inv: any) => isDateInRange(inv.fecha, dateRange.from, dateRange.to))
  }, [rawInversiones, dateRange])

  // 3. Filtrar ingresos directos por rango de fecha
  const filteredIngresosDirectos = useMemo(() => {
    if (!rawIngresosDirectos || rawIngresosDirectos.length === 0) return []
    return rawIngresosDirectos.filter((ing: any) => isDateInRange(ing.fecha, dateRange.from, dateRange.to))
  }, [rawIngresosDirectos, dateRange])

  // 4. Calcular KPIs dinámicamente según el período seleccionado
  const dynamicKpis = useMemo(() => {
    if (rawVentas.length === 0 && rawInversiones.length === 0) {
      const gNeta = initialKpis.gananciaNeta
      const iVentas = initialKpis.ingresosVentas
      const tCobrado = initialKpis.totalCobradoVentas
      return {
        ...initialKpis,
        costoDirectoTotal: initialKpis.costoFabricacionTotal,
        tasaCobranza: iVentas > 0 ? (tCobrado / iVentas) * 100 : 100,
        margenUnitarioPromedio: initialKpis.ticketPromedio > 0 ? (gNeta / Math.max(1, filteredVentas.length)) : 0
      }
    }

    const ingresosVentas = filteredVentas.reduce((sum: number, v: any) => sum + Number(v.total || 0), 0)
    
    const costoFabricacionTotal = filteredVentas.reduce((sum: number, v: any) => {
      const costoBaseUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0 
        ? Number(v.costoBaseSnapshot) 
        : (Number(v.producto?.costoBase) || 0)
      return sum + (costoBaseUnit * Number(v.cantidad || 1))
    }, 0)

    const gananciaNeta = ingresosVentas - costoFabricacionTotal
    const margenPorcentaje = costoFabricacionTotal > 0 ? (gananciaNeta / costoFabricacionTotal) * 100 : 0

    // Cobranzas efectivas dentro del período
    const totalCobradoVentas = rawVentas.reduce((sum: number, v: any) => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        const pagosEnRango = v.pagos.filter((p: any) => isDateInRange(p.fecha, dateRange.from, dateRange.to))
        return sum + pagosEnRango.reduce((pSum: number, p: any) => pSum + Number(p.monto || 0), 0)
      }
      if (isDateInRange(v.fecha, dateRange.from, dateRange.to)) {
        return sum + Number(v.montoPagado || 0)
      }
      return sum
    }, 0)

    const saldoPorCobrar = filteredVentas.reduce((sum: number, v: any) => sum + Number(v.saldoPendiente || 0), 0)
    const egresosTotales = filteredInversiones.reduce((sum: number, inv: any) => sum + Number(inv.costoTotal || 0), 0)
    const ticketPromedio = filteredVentas.length > 0 ? ingresosVentas / filteredVentas.length : 0
    const totalIngresosDirectos = filteredIngresosDirectos.reduce((sum: number, i: any) => sum + Number(i.monto || 0), 0)

    const tasaCobranza = ingresosVentas > 0 ? (totalCobradoVentas / ingresosVentas) * 100 : 100
    const margenUnitarioPromedio = filteredVentas.length > 0 ? gananciaNeta / filteredVentas.length : 0

    return {
      ingresosVentas,
      costoFabricacionTotal,
      costoDirectoTotal: costoFabricacionTotal,
      gananciaNeta,
      margenPorcentaje,
      tasaCobranza,
      margenUnitarioPromedio,
      totalCobradoVentas,
      saldoPorCobrar,
      egresosTotales,
      ticketPromedio,
      totalIngresosDirectos
    }
  }, [filteredVentas, filteredInversiones, filteredIngresosDirectos, dateRange, rawVentas, rawInversiones, initialKpis])

  // 5. Saldo y liquidez en caja
  const gasto = useMemo(() => {
    const saldoActualCaja = Math.max(0, (dynamicKpis.totalCobradoVentas + dynamicKpis.totalIngresosDirectos) - dynamicKpis.egresosTotales)
    const totalBlindadoMes = initialCapacidadGasto?.totalBlindadoMes || 350.00
    const gastoDisponibleHoy = Math.max(0, saldoActualCaja - totalBlindadoMes)
    const margenUnitarioPromedio = dynamicKpis.margenUnitarioPromedio
    const pedidosProyectadosMes = filteredVentas.length
    const gananciaProyectadaMes = dynamicKpis.gananciaNeta
    const gastoDisponibleProyectado = gastoDisponibleHoy

    return {
      saldoActualCaja,
      totalBlindadoMes,
      cuotaPrestamoMensual: 0,
      reservaCapexMensual: 0,
      gastosFijosTaller: totalBlindadoMes,
      gastoDisponibleHoy,
      gastoDisponibleProyectado,
      pedidosProyectadosMes,
      gananciaProyectadaMes
    }
  }, [dynamicKpis, filteredVentas.length, initialCapacidadGasto])

  // 5.b Punto de Equilibrio Board Games
  const breakEven = useMemo(() => {
    const totalFijos = gasto.totalBlindadoMes || 350.00
    const ganancia = dynamicKpis.gananciaNeta || 0
    const cobertura = totalFijos > 0 ? (ganancia / totalFijos) * 100 : 100
    const margenUnit = dynamicKpis.margenUnitarioPromedio > 0 ? dynamicKpis.margenUnitarioPromedio : 32
    const pedidosEquilibrio = Math.max(1, Math.ceil(totalFijos / margenUnit))
    const pedidosFaltantes = Math.max(0, pedidosEquilibrio - filteredVentas.length)
    const superavit = ganancia - totalFijos

    return {
      totalFijos,
      cobertura,
      pedidosEquilibrio,
      pedidosFaltantes,
      superavit
    }
  }, [gasto.totalBlindadoMes, dynamicKpis.gananciaNeta, dynamicKpis.margenUnitarioPromedio, filteredVentas.length])

  // Total de unidades de juegos en el período
  const totalPiezasPeriodo = useMemo(() => {
    return filteredVentas.reduce((sum: number, v: any) => sum + Number(v.cantidad || 1), 0)
  }, [filteredVentas])

  // Capital inmovilizado en stock (31 títulos en almacén)
  const capitalInmovilizado = useMemo(() => {
    if (!rawProductos || rawProductos.length === 0) return 0
    return rawProductos.reduce((sum: number, p: any) => {
      const stock = Number(p.stock || 0)
      const costo = Number(p.costoBase || 0)
      return sum + (stock * costo)
    }, 0)
  }, [rawProductos])

  // 6. Métricas y datos para los 3 gráficos financieros
  const metricasEvolucion = useMemo(() => {
    const timelineMap: Record<string, {
      ventaTotal: number
      costoProduccion: number
      utilidad: number
      entradas: number
      salidas: number
      pedidosCount: number
      pedidosDetalle?: { cliente: string; producto: string; total: number }[]
      inyeccionesTotal?: number
    }> = {}

    if (dateRange.from && dateRange.to) {
      const [startYear, startMonth, startDay] = dateRange.from.split('-').map(Number)
      const [endYear, endMonth, endDay] = dateRange.to.split('-').map(Number)
      const curr = new Date(startYear, startMonth - 1, startDay)
      const end = new Date(endYear, endMonth - 1, endDay)

      const diffDays = Math.round((end.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24))
      if (diffDays >= 0 && diffDays <= 60) {
        while (curr <= end) {
          const y = curr.getFullYear()
          const m = String(curr.getMonth() + 1).padStart(2, '0')
          const d = String(curr.getDate()).padStart(2, '0')
          timelineMap[`${y}-${m}-${d}`] = {
            ventaTotal: 0,
            costoProduccion: 0,
            utilidad: 0,
            entradas: 0,
            salidas: 0,
            pedidosCount: 0,
            pedidosDetalle: [],
            inyeccionesTotal: 0
          }
          curr.setDate(curr.getDate() + 1)
        }
      }
    }

    filteredVentas.forEach((v: any) => {
      const vDate = v.fecha ? String(v.fecha).split('T')[0] : ''
      if (!vDate) return

      if (!timelineMap[vDate]) {
        timelineMap[vDate] = {
          ventaTotal: 0,
          costoProduccion: 0,
          utilidad: 0,
          entradas: 0,
          salidas: 0,
          pedidosCount: 0,
          pedidosDetalle: [],
          inyeccionesTotal: 0
        }
      }

      const total = Number(v.total || 0)
      const costoUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0 
        ? Number(v.costoBaseSnapshot) 
        : (Number(v.producto?.costoBase) || 0)
      const costoTotal = costoUnit * Number(v.cantidad || 1)
      const utilidad = total - costoTotal

      timelineMap[vDate].ventaTotal += total
      timelineMap[vDate].costoProduccion += costoTotal
      timelineMap[vDate].utilidad += utilidad
      timelineMap[vDate].pedidosCount += 1

      const clienteNombre = v.cliente || 'Cliente'
      const productoNombre = v.nombreProductoSnapshot || v.producto?.nombreModelo || 'Juego de Mesa'
      if (!timelineMap[vDate].pedidosDetalle) timelineMap[vDate].pedidosDetalle = []
      timelineMap[vDate].pedidosDetalle!.push({ cliente: clienteNombre, producto: productoNombre, total })

      if (!v.pagos || v.pagos.length === 0) {
        timelineMap[vDate].entradas += Number(v.montoPagado != null ? v.montoPagado : v.total)
      }
    })

    rawVentas.forEach((v: any) => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        v.pagos.forEach((p: any) => {
          const pDate = p.fecha ? String(p.fecha).split('T')[0] : ''
          if (!pDate) return
          if (!isDateInRange(pDate, dateRange.from, dateRange.to)) return

          if (!timelineMap[pDate]) {
            timelineMap[pDate] = {
              ventaTotal: 0,
              costoProduccion: 0,
              utilidad: 0,
              entradas: 0,
              salidas: 0,
              pedidosCount: 0,
              pedidosDetalle: []
            }
          }
          timelineMap[pDate].entradas += Number(p.monto || 0)
        })
      }
    })

    filteredInversiones.forEach((inv: any) => {
      const invDate = inv.fecha ? String(inv.fecha).split('T')[0] : ''
      if (!invDate) return

      if (!timelineMap[invDate]) {
        timelineMap[invDate] = {
          ventaTotal: 0,
          costoProduccion: 0,
          utilidad: 0,
          entradas: 0,
          salidas: 0,
          pedidosCount: 0,
          pedidosDetalle: []
        }
      }
      timelineMap[invDate].salidas += Number(inv.costoTotal || 0)
    })

    filteredIngresosDirectos.forEach((ing: any) => {
      const ingDate = ing.fecha ? String(ing.fecha).split('T')[0] : ''
      if (!ingDate) return
      if (!isDateInRange(ingDate, dateRange.from, dateRange.to)) return

      if (!timelineMap[ingDate]) {
        timelineMap[ingDate] = {
          ventaTotal: 0,
          costoProduccion: 0,
          utilidad: 0,
          entradas: 0,
          salidas: 0,
          pedidosCount: 0,
          pedidosDetalle: [],
          inyeccionesTotal: 0
        }
      }
      const montoIng = Number(ing.monto || 0)
      timelineMap[ingDate].entradas += montoIng
      timelineMap[ingDate].inyeccionesTotal = (timelineMap[ingDate].inyeccionesTotal || 0) + montoIng
    })

    const sortedDates = Object.keys(timelineMap).sort()
    let acumCobranzas = 0
    let acumGastos = 0

    return sortedDates.map(dateKey => {
      const d = timelineMap[dateKey]
      acumCobranzas += d.entradas
      acumGastos += d.salidas

      const margenPct = d.ventaTotal > 0 
        ? Number(((d.utilidad / d.ventaTotal) * 100).toFixed(1)) 
        : 0

      return {
        fecha: dateKey,
        ventaTotal: Number(d.ventaTotal.toFixed(2)),
        costoProduccion: Number(d.costoProduccion.toFixed(2)),
        utilidad: Number(d.utilidad.toFixed(2)),
        margenPct,
        entradas: Number(d.entradas.toFixed(2)),
        salidas: Number(d.salidas.toFixed(2)),
        inyeccionesTotal: Number((d.inyeccionesTotal || 0).toFixed(2)),
        balanceNeto: Number((d.entradas - d.salidas).toFixed(2)),
        ingresosAcum: Number(acumCobranzas.toFixed(2)),
        egresosAcum: Number(acumGastos.toFixed(2)),
        balanceAcum: Number((acumCobranzas - acumGastos).toFixed(2)),
        pedidosCount: d.pedidosCount,
        pedidosDetalle: d.pedidosDetalle || []
      }
    })
  }, [filteredVentas, filteredInversiones, filteredIngresosDirectos, rawVentas, dateRange])

  // Sparklines para ExecutiveKpiRows
  const sparklineData = useMemo(() => {
    if (!metricasEvolucion || metricasEvolucion.length === 0) return undefined
    const slice = metricasEvolucion.slice(-14)
    return {
      ventas: slice.map(d => d.ventaTotal),
      margen: slice.map(d => Math.max(0, d.utilidad)),
      caja: slice.map(d => d.ingresosAcum),
      cobertura: slice.map(d => Math.min(100, Math.round((d.utilidad / (breakEven.totalFijos || 1)) * 100)))
    }
  }, [metricasEvolucion, breakEven.totalFijos])

  // Top 5 Clientes Dinámico
  const topClientesDinamico = useMemo(() => {
    if (rawVentas.length === 0) return initialTopClientes

    const clientesMap: Record<string, {
      cliente: string
      totalComprado: number
      totalPagado: number
      saldoPendiente: number
      pedidosCount: number
      piezasCount: number
      canales: Record<string, number>
      ultimoPedidoFecha: string
    }> = {}

    filteredVentas.forEach((v: any) => {
      const nombre = (v.cliente || 'Anónimo').trim()
      const cKey = nombre.toLowerCase()

      if (!clientesMap[cKey]) {
        clientesMap[cKey] = {
          cliente: nombre,
          totalComprado: 0,
          totalPagado: 0,
          saldoPendiente: 0,
          pedidosCount: 0,
          piezasCount: 0,
          canales: {},
          ultimoPedidoFecha: ''
        }
      }

      const total = Number(v.total || 0)
      const pagado = Number(v.montoPagado || 0)
      const saldo = Number(v.saldoPendiente || 0)
      const cant = Number(v.cantidad || 1)

      clientesMap[cKey].totalComprado += total
      clientesMap[cKey].totalPagado += pagado
      clientesMap[cKey].saldoPendiente += saldo
      clientesMap[cKey].pedidosCount += 1
      clientesMap[cKey].piezasCount += cant

      const canal = v.canalVenta || 'Directo'
      clientesMap[cKey].canales[canal] = (clientesMap[cKey].canales[canal] || 0) + 1

      const vFecha = v.fecha ? String(v.fecha).split('T')[0] : ''
      if (vFecha > clientesMap[cKey].ultimoPedidoFecha) {
        clientesMap[cKey].ultimoPedidoFecha = vFecha
      }
    })

    const ingresosTotal = dynamicKpis.ingresosVentas

    return Object.values(clientesMap)
      .sort((a, b) => b.totalComprado - a.totalComprado)
      .slice(0, 5)
      .map(c => {
        let canalPreferido: string | null = null
        let maxCount = 0
        Object.entries(c.canales).forEach(([canal, count]) => {
          if (count > maxCount) {
            maxCount = count
            canalPreferido = canal
          }
        })

        return {
          cliente: c.cliente,
          totalComprado: Number(c.totalComprado.toFixed(2)),
          totalPagado: Number(c.totalPagado.toFixed(2)),
          saldoPendiente: Number(c.saldoPendiente.toFixed(2)),
          pedidosCount: c.pedidosCount,
          piezasCount: c.piezasCount,
          porcentajeDelTotal: ingresosTotal > 0 ? Number(((c.totalComprado / ingresosTotal) * 100).toFixed(1)) : 0,
          canalPreferido,
          ultimoPedidoFecha: c.ultimoPedidoFecha
        }
      })
  }, [filteredVentas, rawVentas, dynamicKpis.ingresosVentas, initialTopClientes])

  // Top 5 Juegos en el período
  const topArticulosDinamico = useMemo(() => {
    if (rawVentas.length === 0) return initialTopArticulos

    const articulosMap: Record<string, {
      id: string
      nombreModelo: string
      lineaCategoria: string
      unidadesVendidas: number
      totalFacturado: number
      costoProduccionTotal: number
      pedidosCount: number
    }> = {}

    let totalUnidades = 0

    filteredVentas.forEach((v: any) => {
      const nombre = v.nombreProductoSnapshot || v.producto?.nombreModelo || 'Juego'
      const artKey = (v.productoId || nombre).trim().toLowerCase()
      const categoria = v.producto?.lineaCategoria || 'General'

      if (!articulosMap[artKey]) {
        articulosMap[artKey] = {
          id: v.productoId || artKey,
          nombreModelo: nombre,
          lineaCategoria: categoria,
          unidadesVendidas: 0,
          totalFacturado: 0,
          costoProduccionTotal: 0,
          pedidosCount: 0
        }
      }

      const total = Number(v.total || 0)
      const cant = Number(v.cantidad || 1)
      const costoUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0 
        ? Number(v.costoBaseSnapshot) 
        : (Number(v.producto?.costoBase) || 0)
      const costoTotal = costoUnit * cant

      articulosMap[artKey].totalFacturado += total
      articulosMap[artKey].unidadesVendidas += cant
      articulosMap[artKey].costoProduccionTotal += costoTotal
      articulosMap[artKey].pedidosCount += 1

      totalUnidades += cant
    })

    const totalFacturadoTotal = dynamicKpis.ingresosVentas

    return Object.values(articulosMap)
      .map(art => {
        const gananciaNeta = art.totalFacturado - art.costoProduccionTotal
        const margenPorcentaje = art.costoProduccionTotal > 0 ? (gananciaNeta / art.costoProduccionTotal) * 100 : 0
        const precioPromedio = art.unidadesVendidas > 0 ? art.totalFacturado / art.unidadesVendidas : 0

        return {
          id: art.id,
          nombreModelo: art.nombreModelo,
          lineaCategoria: art.lineaCategoria,
          unidadesVendidas: art.unidadesVendidas,
          totalFacturado: Number(art.totalFacturado.toFixed(2)),
          pedidosCount: art.pedidosCount,
          precioPromedio: Number(precioPromedio.toFixed(2)),
          porcentajeUnidades: totalUnidades > 0 ? Number(((art.unidadesVendidas / totalUnidades) * 100).toFixed(1)) : 0,
          porcentajeFacturacion: totalFacturadoTotal > 0 ? Number(((art.totalFacturado / totalFacturadoTotal) * 100).toFixed(1)) : 0,
          costoProduccionTotal: Number(art.costoProduccionTotal.toFixed(2)),
          gananciaNeta: Number(gananciaNeta.toFixed(2)),
          margenPorcentaje: Number(margenPorcentaje.toFixed(1))
        }
      })
      .sort((a, b) => {
        if (rankingArticulosMode === 'RENTABILIDAD') {
          return (b.gananciaNeta || 0) - (a.gananciaNeta || 0)
        }
        return b.unidadesVendidas - a.unidadesVendidas
      })
      .slice(0, 5)
  }, [filteredVentas, rawVentas, dynamicKpis.ingresosVentas, rankingArticulosMode, initialTopArticulos])

  const renderMargenChart = (data: any[], heightClass: string = 'h-[280px]') => {
    const chartData = soloDiasConVentas ? data.filter(d => d.ventaTotal > 0) : data

    return (
      <div className={`${heightClass} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" vertical={false} opacity={0.1} />
            <XAxis 
              dataKey="fecha" 
              stroke="currentColor" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: 'currentColor', opacity: 0.15 }}
              interval={chartData.length <= 10 ? 0 : 'preserveStartEnd'}
              minTickGap={32}
              tickFormatter={(val) => formatFechaEvolucion(val, false)}
              dy={4}
              className="text-muted-foreground"
            />
            <YAxis 
              stroke="currentColor" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${val}`}
              className="text-muted-foreground"
            />
            <Tooltip content={<MargenTooltip />} />
            <Legend 
              verticalAlign="top"
              content={() => (
                <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] pb-2 text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block" />
                    <span>Utilidad Comercial</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 bg-muted-foreground/30 rounded-xs inline-block" />
                    <span>Costo Compra Stock</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
                    <span className="w-3.5 h-0.5 bg-indigo-500 rounded-full inline-block" />
                    <span>Venta Total</span>
                  </div>
                </div>
              )}
            />
            <Bar 
              dataKey="costoProduccion" 
              name="Costo Base" 
              stackId="venta" 
              fill="#94a3b8" 
              opacity={0.4}
              radius={[0, 0, 0, 0]}
              maxBarSize={32}
            />
            <Bar 
              dataKey="utilidad" 
              name="Utilidad Comercial" 
              stackId="venta" 
              fill="#10b981" 
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Line 
              type="monotone" 
              dataKey="ventaTotal" 
              name="Venta Total" 
              stroke="#6366f1" 
              strokeWidth={2} 
              dot={{ r: 3, fill: '#6366f1', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#6366f1', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderFlujoChart = (data: any[], heightClass: string = 'h-[280px]') => (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" vertical={false} opacity={0.1} />
          <XAxis 
            dataKey="fecha" 
            stroke="currentColor" 
            fontSize={11} 
            tickLine={false} 
            axisLine={{ stroke: 'currentColor', opacity: 0.15 }}
            minTickGap={32}
            tickFormatter={(val) => formatFechaEvolucion(val, false)}
            dy={4}
            className="text-muted-foreground"
          />
          <YAxis 
            stroke="currentColor" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `${val}`}
            className="text-muted-foreground"
          />
          <Tooltip content={<FlujoCajaTooltip />} />
          <Legend 
            verticalAlign="top"
            content={() => (
              <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] pb-2 text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-xs inline-block" />
                  <span>Cobros en Caja</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 bg-rose-500 rounded-xs inline-block" />
                  <span>Egresos & Compras</span>
                </div>
              </div>
            )}
          />
          <Bar 
            dataKey="entradas" 
            name="Entradas" 
            fill="#10b981" 
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
          <Bar 
            dataKey="salidas" 
            name="Salidas" 
            fill="#f43f5e" 
            radius={[4, 4, 0, 0]}
            maxBarSize={28}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )

  const renderAcumuladoChart = (data: any[], heightClass: string = 'h-[280px]') => (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIngresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorEgresos" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" vertical={false} opacity={0.1} />
          <XAxis 
            dataKey="fecha" 
            stroke="currentColor" 
            fontSize={11} 
            tickLine={false} 
            axisLine={{ stroke: 'currentColor', opacity: 0.15 }}
            minTickGap={32}
            tickFormatter={(val) => formatFechaEvolucion(val, false)}
            dy={4}
            className="text-muted-foreground"
          />
          <YAxis 
            stroke="currentColor" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `${val}`}
            className="text-muted-foreground"
          />
          <Tooltip content={<AcumuladoTooltip />} />
          <Legend 
            verticalAlign="top"
            content={() => (
              <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] pb-2 text-muted-foreground">
                <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-3.5 h-0.5 bg-emerald-500 rounded-full inline-block" />
                  <span>Cobranza Acumulada</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
                  <span className="w-3.5 h-0.5 bg-rose-500 rounded-full inline-block" />
                  <span>Gastos Acumulados</span>
                </div>
              </div>
            )}
          />
          <Area 
            type="monotone" 
            dataKey="ingresosAcum" 
            name="Cobranza Acum." 
            stroke="#10b981" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorIngresos)" 
          />
          <Area 
            type="monotone" 
            dataKey="egresosAcum" 
            name="Gastos Acum." 
            stroke="#f43f5e" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorEgresos)" 
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300 pb-10 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. HEADER MINIMALISTA CON FILTRO DE PERÍODO                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Dashboard Board Games
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Rendimiento comercial de juegos de mesa, tesorería y pulso de pedidos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Selector de Período / Fecha */}
          <DateFilterControl 
            value={dateRange} 
            onChange={setDateRange} 
            label="Período del Dashboard" 
            align="right" 
          />

          <button
            onClick={handleManualRefresh}
            title="Refrescar datos"
            className="p-2 rounded-xl bg-card hover:bg-muted/50 border border-border/40 text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-indigo-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SALUD FINANCIERA EJECUTIVA (RENGLONES MINIMALISTAS DE ALTA DENSIDAD)   */}
      {/* ========================================================================= */}
      <ExecutiveKpiRows
        dynamicKpis={dynamicKpis}
        gasto={gasto}
        breakEven={breakEven}
        filteredVentasCount={filteredVentas.length}
        totalPiezasPeriodo={totalPiezasPeriodo}
        onInfoClick={setSelectedKpiExplainer}
        formatCurrency={formatCurrency}
        sparklineData={sparklineData}
        capitalInmovilizado={capitalInmovilizado}
      />

      {/* ========================================================================= */}
      {/* 2.b PULSO OPERATIVO BOARD GAMES (PREPARACIÓN, ENTREGAS & ALERTAS)          */}
      {/* ========================================================================= */}
      <OperationalPulseBar 
        pedidos={rawVentas} 
        productos={rawProductos}
      />

      {/* ========================================================================= */}
      {/* 3. GRÁFICOS ANALÍTICOS & CANALES DE CAPTACIÓN                              */}
      {/* ========================================================================= */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12 items-stretch">
        
        {/* Gráfico de Evolución y Análisis Financiero (7 cols) */}
        <Card className="lg:col-span-7 bg-card border border-border/40 shadow-2xs rounded-2xl overflow-hidden flex flex-col justify-between min-h-[420px]">
          <CardHeader className="p-4 sm:p-5 pb-2 border-b border-border/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-foreground text-sm font-semibold tracking-tight">
                    {EVOLUCION_CONFIG[evolucionTab].title}
                  </CardTitle>
                  {evolucionTab === 'MARGEN' && (
                    <button
                      type="button"
                      onClick={() => setSoloDiasConVentas(!soloDiasConVentas)}
                      className="text-[10px] text-muted-foreground hover:text-foreground bg-muted/40 border border-border/40 px-2 py-0.5 rounded-md font-medium cursor-pointer transition-colors"
                      title="Alternar entre ver solo días con ventas o todo el calendario"
                    >
                      {soloDiasConVentas ? '⚡ Días con venta' : '📅 Todo el mes'}
                    </button>
                  )}
                </div>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  {EVOLUCION_CONFIG[evolucionTab].description}
                </CardDescription>
              </div>

              {/* Selector de los 3 gráficos */}
              <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/40 border border-border/40 shrink-0 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setEvolucionTab('MARGEN')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    evolucionTab === 'MARGEN'
                      ? 'bg-card text-foreground font-semibold border border-border/40 shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Margen Pedidos
                </button>
                <button
                  type="button"
                  onClick={() => setEvolucionTab('FLUJO')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    evolucionTab === 'FLUJO'
                      ? 'bg-card text-foreground font-semibold border border-border/40 shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Flujo de Caja
                </button>
                <button
                  type="button"
                  onClick={() => setEvolucionTab('ACUMULADO')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    evolucionTab === 'ACUMULADO'
                      ? 'bg-card text-foreground font-semibold border border-border/40 shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Acumulado
                </button>
                <button
                  type="button"
                  onClick={() => setEvolucionTab('TODOS')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap ${
                    evolucionTab === 'TODOS'
                      ? 'bg-card text-foreground font-semibold border border-border/40 shadow-2xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Ver los 3
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-5 pt-3 flex-1 flex flex-col justify-center">
            {metricasEvolucion.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-xs text-muted-foreground italic">
                No hay movimientos registrados en el período seleccionado.
              </div>
            ) : evolucionTab === 'MARGEN' ? (
              renderMargenChart(metricasEvolucion)
            ) : evolucionTab === 'FLUJO' ? (
              renderFlujoChart(metricasEvolucion)
            ) : evolucionTab === 'ACUMULADO' ? (
              renderAcumuladoChart(metricasEvolucion)
            ) : (
              <div className="space-y-6 py-2">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">1. Margen Real por Pedido</h4>
                  {renderMargenChart(metricasEvolucion, 'h-[200px]')}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">2. Flujo Diario de Caja</h4>
                  {renderFlujoChart(metricasEvolucion, 'h-[200px]')}
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2">3. Curva Acumulativa</h4>
                  {renderAcumuladoChart(metricasEvolucion, 'h-[200px]')}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Canales de Captación de Clientes (5 cols) */}
        <div className="lg:col-span-5 h-full">
          <AcquisitionChannelsCard
            ventas={filteredVentas}
            ticketPromedio={dynamicKpis.ticketPromedio}
            totalPedidos={filteredVentas.length}
            className="h-full"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. RANKINGS COMERCIALES (TOP 5 CLIENTES & TOP 5 JUEGOS)                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        
        {/* TOP 5 CLIENTES EN VALOR */}
        <Card className="bg-card border border-border/40 shadow-2xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Top Clientes en Valor
                </CardTitle>
              </div>
              <Link
                href="/pedidos"
                className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <span>Ver pedidos</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 divide-y divide-border/30">
            {topClientesDinamico.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                <Users className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                <p>No hay compras registradas en este período.</p>
              </div>
            ) : (
              topClientesDinamico.map((c, index) => (
                <div 
                  key={`${c.cliente}-${index}`}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-mono text-xs font-semibold text-muted-foreground/60 w-5 tabular-nums text-center shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="w-8 h-8 rounded-full bg-muted border border-border/40 text-muted-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                      {getInitials(c.cliente)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-foreground truncate" title={c.cliente}>
                        {formatClienteNombre(c.cliente)}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {c.pedidosCount} {c.pedidosCount === 1 ? 'pedido' : 'pedidos'} • {c.piezasCount} {c.piezasCount === 1 ? 'juego' : 'juegos'}
                        {c.canalPreferido && ` • ${c.canalPreferido}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-mono font-bold text-foreground tabular-nums">
                      {formatCurrency(c.totalComprado)}
                    </div>
                    <div>
                      {c.saldoPendiente > 0 ? (
                        <span className="text-[10px] font-mono font-medium text-amber-600 dark:text-amber-400">
                          Debe {formatCurrency(c.saldoPendiente)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          Al día
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* TOP 5 JUEGOS MÁS RENTABLES / MÁS VENDIDOS */}
        <Card className="bg-card border border-border/40 shadow-2xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-border/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Dices className="h-4 w-4 text-indigo-500" />
                <CardTitle className="text-sm font-semibold tracking-tight text-foreground">
                  {rankingArticulosMode === 'RENTABILIDAD' ? 'Top Juegos Más Rentables' : 'Top Juegos Más Vendidos'}
                </CardTitle>
              </div>

              {/* Selector de ordenamiento: Rentabilidad vs Volumen */}
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/40 border border-border/40 shrink-0">
                  <button
                    type="button"
                    onClick={() => setRankingArticulosMode('RENTABILIDAD')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                      rankingArticulosMode === 'RENTABILIDAD'
                        ? 'bg-card text-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Margen
                  </button>
                  <button
                    type="button"
                    onClick={() => setRankingArticulosMode('VOLUMEN')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all cursor-pointer ${
                      rankingArticulosMode === 'VOLUMEN'
                        ? 'bg-card text-foreground font-semibold shadow-2xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Unidades
                  </button>
                </div>

                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <span>Catálogo</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 divide-y divide-border/30">
            {topArticulosDinamico.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground space-y-2">
                <Dice5 className="h-6 w-6 text-muted-foreground/40 mx-auto" />
                <p>No hay juegos despachados en este período.</p>
              </div>
            ) : (
              topArticulosDinamico.map((art, index) => (
                <div 
                  key={`${art.id}-${index}`}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-mono text-xs font-semibold text-muted-foreground/60 w-5 tabular-nums text-center shrink-0">
                      {String(index + 1).padStart(2, '0')}
                    </span>

                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Dice5 className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-semibold text-foreground truncate" title={art.nombreModelo}>
                        {art.nombreModelo}
                      </h4>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {art.unidadesVendidas} {art.unidadesVendidas === 1 ? 'unidad' : 'unidades'} • en {art.pedidosCount} {art.pedidosCount === 1 ? 'pedido' : 'pedidos'}
                        <span className="mx-1">•</span>
                        <span>Ventas: {formatCurrency(art.totalFacturado)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatCurrency(art.gananciaNeta || 0)}
                    </div>
                    <div className="text-[10px] font-mono text-muted-foreground">
                      {art.margenPorcentaje != null ? `${art.margenPorcentaje.toFixed(0)}% margen` : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>

      {/* Modal Educativo y de Auditoría de KPIs */}
      <KpiExplainerModal
        isOpen={!!selectedKpiExplainer}
        onClose={() => setSelectedKpiExplainer(null)}
        kpiId={selectedKpiExplainer}
        from={dateRange.from}
        to={dateRange.to}
        negocio="BG"
      />
    </div>
  )
}
