'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  ComposedChart, 
  Bar, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  ReferenceLine
} from 'recharts'
import { 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  Wallet,
  RefreshCw,
  Trophy,
  Users,
  ShoppingBag,
  Package,
  ArrowUpRight
} from 'lucide-react'

import { DateFilterControl } from '@/components/ui/DateFilterControl'
import { DateRange, getPresetDateRange, isDateInRange, formatFechaEvolucion, MESES_ES } from '@/lib/date-utils'

// Paleta de colores minimalista para gastos (Donut Chart)
const DONUT_COLORS = ['#7C5835', '#A36F4C', '#B8A99A', '#059669', '#3B82F6', '#8C6239']

// Obtener iniciales de un nombre
function getInitials(name: string) {
  if (!name) return 'CL'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

// Custom Tooltip limpio y minimalista
function CustomEvolucionTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const ingresos = Number(data.ingresos || 0)
    const costo = Number(data.costo || 0)
    const ganancia = Number(data.ganancia != null ? data.ganancia : (ingresos - costo))
    const isNegative = ganancia < 0

    return (
      <div className="bg-white border border-[#E5DCD3] rounded-xl shadow-lg p-3 min-w-[200px] text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#F5EFEB] pb-1.5 mb-2">
          <span className="font-bold text-[#1F2937]">{formatFechaEvolucion(label, true)}</span>
          <span className={`text-[10px] font-semibold ${isNegative ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
            {isNegative ? 'Pérdida' : 'Utilidad'}
          </span>
        </div>

        <div className="space-y-1.5 text-[#6B7280]">
          <div className="flex justify-between items-center">
            <span>Facturación:</span>
            <span className="font-mono font-semibold text-[#1F2937]">S/ {ingresos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Costo producción:</span>
            <span className="font-mono font-semibold text-[#1F2937]">S/ {costo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-[#F5EFEB] font-bold">
            <span className={isNegative ? 'text-[#DC2626]' : 'text-[#059669]'}>Resultado neto:</span>
            <span className={`font-mono text-sm ${isNegative ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
              {isNegative ? `-S/ ${Math.abs(ganancia).toFixed(2)}` : `+S/ ${ganancia.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Leyenda minimalista
function CustomEvolutionLegend() {
  return (
    <div className="flex items-center justify-end gap-4 text-xs pb-2 text-[#6B7280]">
      <div className="flex items-center gap-1.5 font-medium">
        <span className="w-2.5 h-2.5 bg-[#059669] rounded-xs inline-block" />
        <span>Utilidad Neta</span>
      </div>
      <div className="flex items-center gap-1.5 font-medium">
        <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-xs inline-block" />
        <span>Pérdida / Costo</span>
      </div>
      <div className="flex items-center gap-1.5 font-medium text-[#7C5835]">
        <span className="w-3.5 h-0.5 bg-[#7C5835] rounded-full inline-block" />
        <span>Facturación</span>
      </div>
    </div>
  )
}

export interface TopColorItem {
  id: string
  nombreColor: string
  codigoHex: string
  pedidosCount: number
  unidadesCount: number
  gramosTotal: number
  stockGramosActual: number
  alertaCritica: boolean
  porcentajeUso: number
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
  topColores?: TopColorItem[]
  topClientes?: TopClienteItem[]
  topArticulos?: TopArticuloItem[]
  rawVentas?: any[]
  rawInversiones?: any[]
  rawIngresosDirectos?: any[]
  rawFilamentos?: any[]
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
  rawFilamentos = []
}: DashboardClientProps) {
  const router = useRouter()
  // Default to Mes Actual
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDateRange('ESTE_MES'))
  const [isRefreshing, setIsRefreshing] = useState(false)

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

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
      return initialKpis
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
    const totalCobradoVentas = filteredVentas.reduce((sum: number, v: any) => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        const pagosEnRango = v.pagos.filter((p: any) => isDateInRange(p.fecha, dateRange.from, dateRange.to))
        if (pagosEnRango.length > 0) {
          return sum + pagosEnRango.reduce((pSum: number, p: any) => pSum + Number(p.monto || 0), 0)
        }
      }
      // Fallback si no hay array de pagos pero la fecha de venta está en rango
      return sum + Number(v.montoPagado || 0)
    }, 0)

    const saldoPorCobrar = filteredVentas.reduce((sum: number, v: any) => sum + Number(v.saldoPendiente || 0), 0)
    const egresosTotales = filteredInversiones.reduce((sum: number, inv: any) => sum + Number(inv.costoTotal || 0), 0)
    const ticketPromedio = filteredVentas.length > 0 ? ingresosVentas / filteredVentas.length : 0
    const totalIngresosDirectos = filteredIngresosDirectos.reduce((sum: number, i: any) => sum + Number(i.monto || 0), 0)

    return {
      ingresosVentas,
      costoFabricacionTotal,
      gananciaNeta,
      margenPorcentaje,
      totalCobradoVentas,
      saldoPorCobrar,
      egresosTotales,
      ticketPromedio,
      totalIngresosDirectos
    }
  }, [filteredVentas, filteredInversiones, filteredIngresosDirectos, dateRange, rawVentas, rawInversiones, initialKpis])

  // 5. Capacidad de gasto calculada para el período
  const gasto = useMemo(() => {
    const saldoActualCaja = Math.max(0, (dynamicKpis.totalCobradoVentas + dynamicKpis.totalIngresosDirectos) - dynamicKpis.egresosTotales)
    const cuotaPrestamoMensual = 368.88
    const reservaCapexMensual = 878.00
    const gastosFijosTaller = 111.00
    const totalBlindadoMes = cuotaPrestamoMensual + reservaCapexMensual + gastosFijosTaller
    const gastoDisponibleHoy = Math.max(0, saldoActualCaja - totalBlindadoMes)
    const margenUnitarioPromedio = dynamicKpis.ticketPromedio > 0 ? (dynamicKpis.gananciaNeta / Math.max(1, filteredVentas.length)) : 97.00
    const pedidosProyectadosMes = Math.max(8, Math.min(30, Math.round(filteredVentas.length / Math.max(1, 1)) || 18))
    const gananciaProyectadaMes = pedidosProyectadosMes * margenUnitarioPromedio
    const gastoDisponibleProyectado = Math.max(0, (saldoActualCaja + gananciaProyectadaMes) - totalBlindadoMes)

    return {
      saldoActualCaja,
      totalBlindadoMes,
      cuotaPrestamoMensual,
      reservaCapexMensual,
      gastosFijosTaller,
      gastoDisponibleHoy,
      gastoDisponibleProyectado,
      pedidosProyectadosMes,
      gananciaProyectadaMes
    }
  }, [dynamicKpis, filteredVentas.length])

  // 6. Gráfico de evolución diario dinámico
  const graficoFiltrado = useMemo(() => {
    if (rawVentas.length === 0) return initialGraficoEvolucion

    const timelineMap: Record<string, { ingresos: number; costo: number; ganancia: number }> = {}

    // A. Costos y ventas base
    filteredVentas.forEach((venta: any) => {
      const vDate = String(venta.fecha).split('T')[0]
      if (!timelineMap[vDate]) {
        timelineMap[vDate] = { ingresos: 0, costo: 0, ganancia: 0 }
      }

      const costoBaseUnit = venta.costoBaseSnapshot != null && Number(venta.costoBaseSnapshot) > 0 
        ? Number(venta.costoBaseSnapshot) 
        : (Number(venta.producto?.costoBase) || 0)
      const ventaCosto = costoBaseUnit * Number(venta.cantidad || 1)
      timelineMap[vDate].costo += ventaCosto

      if (!venta.pagos || venta.pagos.length === 0) {
        timelineMap[vDate].ingresos += Number(venta.montoPagado != null ? venta.montoPagado : venta.total)
      }
    })

    // B. Recaudaciones en fecha de pago
    filteredVentas.forEach((venta: any) => {
      if (Array.isArray(venta.pagos) && venta.pagos.length > 0) {
        venta.pagos.forEach((pago: any) => {
          const pDate = String(pago.fecha).split('T')[0]
          if (isDateInRange(pDate, dateRange.from, dateRange.to)) {
            if (!timelineMap[pDate]) {
              timelineMap[pDate] = { ingresos: 0, costo: 0, ganancia: 0 }
            }
            timelineMap[pDate].ingresos += Number(pago.monto || 0)
          }
        })
      }
    })

    return Object.entries(timelineMap)
      .map(([fecha, vals]) => {
        const ingresos = Number(vals.ingresos.toFixed(2))
        const costo = Number(vals.costo.toFixed(2))
        const ganancia = Number((ingresos - costo).toFixed(2))
        return { fecha, ingresos, costo, ganancia }
      })
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
  }, [filteredVentas, rawVentas, dateRange, initialGraficoEvolucion])

  // 7. Distribución de gastos dinámico
  const graficoInversionDinamico = useMemo(() => {
    if (rawInversiones.length === 0) return initialGraficoInversion

    const distribucion = filteredInversiones.reduce((acc: Record<string, number>, inv: any) => {
      let catName = 'Insumos & Materiales'
      if (inv.categoria === 'ACTIVO_FIJO') catName = 'Maquinaria & Equipos'
      else if (inv.categoria === 'SERVICIO') catName = 'Servicios & Operativos'
      else if (inv.categoria === 'APORTE_CAPITAL') catName = 'Aporte Capital'
      
      acc[catName] = (acc[catName] || 0) + Number(inv.costoTotal || 0)
      return acc
    }, {})

    return Object.entries(distribucion).map(([name, value]) => ({ name, value: Number(value) }))
  }, [filteredInversiones, rawInversiones, initialGraficoInversion])

  const totalEgresosCalculado = useMemo(() => {
    return graficoInversionDinamico.reduce((sum, item) => sum + Number(item.value || 0), 0) || dynamicKpis.egresosTotales
  }, [graficoInversionDinamico, dynamicKpis.egresosTotales])

  // 8. Top 5 Clientes en valor en el período seleccionado
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
      const rawCliente = (v.cliente || 'Cliente sin nombre').trim()
      const cKey = rawCliente.toLowerCase()

      if (!clientesMap[cKey]) {
        clientesMap[cKey] = {
          cliente: rawCliente,
          totalComprado: 0,
          totalPagado: 0,
          saldoPendiente: 0,
          pedidosCount: 0,
          piezasCount: 0,
          canales: {},
          ultimoPedidoFecha: String(v.fecha)
        }
      }

      const c = clientesMap[cKey]
      c.totalComprado += Number(v.total || 0)
      c.totalPagado += Number(v.montoPagado || 0)
      c.saldoPendiente += Number(v.saldoPendiente || 0)
      c.pedidosCount += 1
      c.piezasCount += Number(v.cantidad || 1)

      if (v.canalVenta) {
        c.canales[v.canalVenta] = (c.canales[v.canalVenta] || 0) + 1
      }

      const vFecha = String(v.fecha)
      if (new Date(vFecha).getTime() > new Date(c.ultimoPedidoFecha).getTime()) {
        c.ultimoPedidoFecha = vFecha
      }
    })

    const ingresosTotal = dynamicKpis.ingresosVentas

    return Object.values(clientesMap)
      .sort((a, b) => b.totalComprado - a.totalComprado || b.pedidosCount - a.pedidosCount)
      .slice(0, 5)
      .map((c) => {
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

  // 9. Top 5 Artículos más vendidos en el período seleccionado
  const topArticulosDinamico = useMemo(() => {
    if (rawVentas.length === 0) return initialTopArticulos

    const articulosMap: Record<string, {
      id: string
      nombreModelo: string
      lineaCategoria: string
      unidadesVendidas: number
      totalFacturado: number
      pedidosCount: number
    }> = {}

    let totalUnidades = 0

    filteredVentas.forEach((v: any) => {
      const nombre = v.nombreProductoSnapshot || v.producto?.nombreModelo || 'Artículo'
      const artKey = (v.productoId || nombre).trim().toLowerCase()
      const categoria = v.producto?.lineaCategoria || 'General'
      const cant = Number(v.cantidad || 1)
      const sub = Number(v.total || 0)

      if (!articulosMap[artKey]) {
        articulosMap[artKey] = {
          id: v.productoId || artKey,
          nombreModelo: nombre,
          lineaCategoria: categoria,
          unidadesVendidas: 0,
          totalFacturado: 0,
          pedidosCount: 0
        }
      }

      articulosMap[artKey].unidadesVendidas += cant
      articulosMap[artKey].totalFacturado += sub
      articulosMap[artKey].pedidosCount += 1
      totalUnidades += cant
    })

    const ingresosTotal = dynamicKpis.ingresosVentas

    return Object.values(articulosMap)
      .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas || b.totalFacturado - a.totalFacturado)
      .slice(0, 5)
      .map((art) => ({
        id: art.id,
        nombreModelo: art.nombreModelo,
        lineaCategoria: art.lineaCategoria,
        unidadesVendidas: art.unidadesVendidas,
        totalFacturado: Number(art.totalFacturado.toFixed(2)),
        pedidosCount: art.pedidosCount,
        precioPromedio: art.unidadesVendidas > 0 ? Number((art.totalFacturado / art.unidadesVendidas).toFixed(2)) : 0,
        porcentajeUnidades: totalUnidades > 0 ? Number(((art.unidadesVendidas / totalUnidades) * 100).toFixed(1)) : 0,
        porcentajeFacturacion: ingresosTotal > 0 ? Number(((art.totalFacturado / ingresosTotal) * 100).toFixed(1)) : 0
      }))
  }, [filteredVentas, rawVentas, dynamicKpis.ingresosVentas, initialTopArticulos])

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 600)
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-10 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. HEADER MINIMALISTA CON FILTRO DE PERÍODO (MES ACTUAL POR DEFECTO)      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1F2937]">
            Dashboard
          </h1>
          <p className="text-xs text-[#6B7280] mt-0.5">
            Rendimiento comercial y tesorería del período seleccionado.
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
            className="p-2 rounded-xl bg-white hover:bg-[#FAF7F4] border border-[#E5DCD3] text-[#6B7280] hover:text-[#1F2937] transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin text-[#7C5835]' : ''}`} />
          </button>

          <Link
            href="/finanzas/proyecciones"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-[#FAF7F4] text-[#1F2937] border border-[#E5DCD3] shadow-xs transition-all"
          >
            <span>Simulador & Presupuesto</span>
            <ArrowRight className="h-3.5 w-3.5 text-[#7C5835]" />
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GRID DE 4 TARJETAS DE KPIS DINÁMICOS                                   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* KPI 1: Facturación & Utilidad */}
        <div className="bg-white border border-[#E5DCD3] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Facturación del Período</span>
            <div className="p-1.5 rounded-lg bg-[#FAF7F4] text-[#7C5835]">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-[#1F2937] tracking-tight tabular-nums">
              {formatCurrency(dynamicKpis.ingresosVentas)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="font-semibold text-[#059669]">
                +{dynamicKpis.margenPorcentaje.toFixed(1)}% margen
              </span>
              <span className="text-[#6B7280]">•</span>
              <span className="text-[#6B7280] truncate">
                +{formatCurrency(dynamicKpis.gananciaNeta)} util.
              </span>
            </div>
          </div>
        </div>

        {/* KPI 2: Capacidad de Gasto Libre */}
        <div className="bg-white border border-[#E5DCD3] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Gasto Disponible Libre</span>
            <div className={`p-1.5 rounded-lg ${gasto.gastoDisponibleHoy > 0 ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black font-mono tracking-tight tabular-nums ${gasto.gastoDisponibleHoy > 0 ? 'text-[#059669]' : 'text-[#92400E]'}`}>
              {formatCurrency(gasto.gastoDisponibleHoy)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6B7280] truncate">
              <span>Caja: {formatCurrency(gasto.saldoActualCaja)}</span>
              <span>•</span>
              <span title={`Blindado: ${formatCurrency(gasto.totalBlindadoMes)}`}>Blindado: {formatCurrency(gasto.totalBlindadoMes)}</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Cobranzas */}
        <div className="bg-white border border-[#E5DCD3] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Total Cobrado</span>
            <div className="p-1.5 rounded-lg bg-[#FAF7F4] text-[#7C5835]">
              <Wallet className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-[#1F2937] tracking-tight tabular-nums">
              {formatCurrency(dynamicKpis.totalCobradoVentas)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6B7280] truncate">
              {dynamicKpis.saldoPorCobrar > 0 ? (
                <span className="text-[#92400E] font-medium">
                  Por cobrar: {formatCurrency(dynamicKpis.saldoPorCobrar)}
                </span>
              ) : (
                <span className="text-[#059669] font-medium">
                  ✓ Cuentas 100% al día
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI 4: Ticket Promedio */}
        <div className="bg-white border border-[#E5DCD3] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Ticket Promedio</span>
            <div className="p-1.5 rounded-lg bg-[#FAF7F4] text-[#7C5835]">
              <ShoppingBag className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black font-mono text-[#1F2937] tracking-tight tabular-nums">
              {formatCurrency(dynamicKpis.ticketPromedio)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6B7280] truncate">
              <span>Costo prod: {formatCurrency(dynamicKpis.costoFabricacionTotal)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. GRÁFICOS ANALÍTICOS (EVOLUCIÓN FINANCIERA & DISTRIBUCIÓN DE GASTOS)     */}
      {/* ========================================================================= */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
        
        {/* Gráfico de Evolución (8 cols) */}
        <Card className="lg:col-span-8 bg-white border-[#E5DCD3] shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-[#1F2937] text-sm sm:text-base font-black">
                  Evolución Financiera
                </CardTitle>
                <CardDescription className="text-xs text-[#6B7280]">
                  Utilidad neta diaria y volumen de facturación
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-5 pt-0">
            <div className="h-[280px] sm:h-[320px] w-full">
              {graficoFiltrado.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-[#6B7280] italic">
                  No hay movimientos registrados en el período seleccionado.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={graficoFiltrado} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5DCD3" vertical={false} opacity={0.5} />
                    
                    <XAxis 
                      dataKey="fecha" 
                      stroke="#6B7280" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={{ stroke: '#E5DCD3' }}
                      tickFormatter={(val) => formatFechaEvolucion(val, false)}
                      dy={4}
                    />
                    
                    <YAxis 
                      stroke="#6B7280" 
                      fontSize={11} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(val) => val === 0 ? '0' : val < 0 ? `-${Math.abs(val)}` : `${val}`}
                    />
                    
                    <Tooltip content={<CustomEvolucionTooltip />} />
                    <Legend content={<CustomEvolutionLegend />} verticalAlign="top" />

                    <ReferenceLine y={0} stroke="#D1D5DB" strokeWidth={1} />

                    <Bar 
                      dataKey="ganancia" 
                      name="Resultado Neto" 
                      radius={[3, 3, 3, 3]}
                      maxBarSize={28}
                    >
                      {graficoFiltrado.map((entry, index) => (
                        <Cell 
                          key={`bar-cell-${index}`} 
                          fill={entry.ganancia >= 0 ? '#059669' : '#DC2626'} 
                        />
                      ))}
                    </Bar>

                    <Line 
                      type="monotone" 
                      dataKey="ingresos" 
                      name="Facturación"
                      stroke="#7C5835" 
                      strokeWidth={2} 
                      dot={{ r: 3, fill: '#7C5835', stroke: '#FFFFFF', strokeWidth: 1.5 }}
                      activeDot={{ r: 5, fill: '#7C5835', stroke: '#FFFFFF', strokeWidth: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Donut de Gastos (4 cols) */}
        <Card className="lg:col-span-4 bg-white border-[#E5DCD3] shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-0">
            <CardTitle className="text-[#1F2937] text-sm sm:text-base font-black">
              Distribución de Gastos
            </CardTitle>
            <CardDescription className="text-xs text-[#6B7280]">
              Egresos e inversiones en el taller
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-3">
            {/* Gráfico Donut */}
            <div className="h-[180px] w-full flex items-center justify-center relative">
              {graficoInversionDinamico.length === 0 ? (
                <div className="text-xs text-[#6B7280] italic text-center">
                  Sin egresos en el período seleccionado.
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={graficoInversionDinamico}
                        cx="50%"
                        cy="50%"
                        innerRadius={54}
                        outerRadius={78}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="#FFFFFF"
                        strokeWidth={2}
                      >
                        {graficoInversionDinamico.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5DCD3', borderRadius: '12px', fontSize: '11px' }}
                        formatter={(val: any) => [`S/ ${Number(val).toFixed(2)}`, 'Gasto']}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                    <span className="text-[10px] text-[#6B7280] uppercase font-bold">Total</span>
                    <span className="text-sm sm:text-base font-black text-[#1F2937] font-mono tabular-nums">
                      {formatCurrency(totalEgresosCalculado)}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Lista minimalista de categorías */}
            <div className="space-y-1.5 pt-2 border-t border-[#F5EFEB]">
              {graficoInversionDinamico.map((item, idx) => {
                const pct = totalEgresosCalculado > 0 ? ((item.value / totalEgresosCalculado) * 100).toFixed(0) : '0'
                const color = DONUT_COLORS[idx % DONUT_COLORS.length]

                return (
                  <div key={item.name} className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className="text-[#1F2937] truncate text-[11px] font-medium">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-semibold text-[#1F2937] tabular-nums text-[11px]">
                        {formatCurrency(item.value)}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-mono w-7 text-right">
                        {pct}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 4. RANKINGS COMERCIALES (TOP 5 CLIENTES & TOP 5 ARTÍCULOS)                */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        
        {/* TOP 5 CLIENTES EN VALOR */}
        <Card className="bg-white border-[#E5DCD3] shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-[#F5EFEB]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[#7C5835]" />
                <CardTitle className="text-sm sm:text-base font-black text-[#1F2937]">
                  Top Clientes en Valor
                </CardTitle>
              </div>
              <Link
                href="/pedidos"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C5835] hover:text-[#5E4328] hover:underline"
              >
                <span>Ver pedidos</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 divide-y divide-[#F5EFEB]">
            {topClientesDinamico.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280] space-y-2">
                <Users className="h-6 w-6 text-[#B8A99A] mx-auto opacity-50" />
                <p>No hay compras registradas en este período.</p>
              </div>
            ) : (
              topClientesDinamico.map((c, index) => (
                <div 
                  key={`${c.cliente}-${index}`}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#FAF7F4]/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#6B7280] w-4 text-center shrink-0">
                      {index + 1}
                    </span>

                    <div className="w-7 h-7 rounded-lg bg-[#FAF7F4] border border-[#E5DCD3] text-[#7C5835] font-bold text-[11px] flex items-center justify-center shrink-0">
                      {getInitials(c.cliente)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#1F2937] truncate" title={c.cliente}>
                        {c.cliente}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] truncate">
                        {c.pedidosCount} {c.pedidosCount === 1 ? 'pedido' : 'pedidos'} • {c.piezasCount} piezas
                        {c.canalPreferido && ` • ${c.canalPreferido}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-mono font-bold text-[#1F2937] tabular-nums">
                      {formatCurrency(c.totalComprado)}
                    </div>
                    <div>
                      {c.saldoPendiente > 0 ? (
                        <span className="text-[10px] font-medium text-[#92400E]">
                          Debe {formatCurrency(c.saldoPendiente)}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-[#059669]">
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

        {/* TOP 5 ARTÍCULOS MÁS VENDIDOS */}
        <Card className="bg-white border-[#E5DCD3] shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-[#F5EFEB]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-[#7C5835]" />
                <CardTitle className="text-sm sm:text-base font-black text-[#1F2937]">
                  Top Artículos Vendidos
                </CardTitle>
              </div>
              <Link
                href="/catalogo"
                className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C5835] hover:text-[#5E4328] hover:underline"
              >
                <span>Ver catálogo</span>
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 divide-y divide-[#F5EFEB]">
            {topArticulosDinamico.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280] space-y-2">
                <Package className="h-6 w-6 text-[#B8A99A] mx-auto opacity-50" />
                <p>No hay artículos despachados en este período.</p>
              </div>
            ) : (
              topArticulosDinamico.map((art, index) => (
                <div 
                  key={`${art.id}-${index}`}
                  className="px-4 sm:px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#FAF7F4]/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="text-xs font-bold text-[#6B7280] w-4 text-center shrink-0">
                      {index + 1}
                    </span>

                    <div className="w-7 h-7 rounded-lg bg-[#FAF7F4] border border-[#E5DCD3] text-[#7C5835] flex items-center justify-center shrink-0">
                      <Package className="h-3.5 w-3.5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#1F2937] truncate" title={art.nombreModelo}>
                        {art.nombreModelo}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] truncate">
                        {art.lineaCategoria || 'General'} • en {art.pedidosCount} {art.pedidosCount === 1 ? 'pedido' : 'pedidos'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-mono font-bold text-[#1F2937] tabular-nums">
                      {art.unidadesVendidas} <span className="font-sans text-[10px] text-[#6B7280] font-normal">unds.</span>
                    </div>
                    <div className="text-[10px] font-mono text-[#059669]">
                      {formatCurrency(art.totalFacturado)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}

