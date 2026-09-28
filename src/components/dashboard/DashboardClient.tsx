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
  Legend, 
  ReferenceLine 
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
  Dice5
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

// Configuración de los 3 gráficos analíticos para Juegos de Mesa
const EVOLUCION_CONFIG = {
  MARGEN: {
    title: 'Margen Real por Pedido',
    description: 'Facturación vendida vs. costo base de adquisición por día'
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
      <div className="bg-white border border-[#E5DCD3] rounded-xl shadow-lg p-3 min-w-[220px] max-w-[280px] text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#F5EFEB] pb-1.5 mb-2">
          <span className="font-bold text-[#1F2937]">{formatFechaEvolucion(label, true)}</span>
          <span className="text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-1.5 py-0.5 rounded">
            {margenPct}% margen
          </span>
        </div>
        <div className="space-y-1.5 text-[#6B7280]">
          <div className="flex justify-between items-center">
            <span>Venta Total:</span>
            <span className="font-mono font-bold text-[#1F2937]">S/ {venta.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Costo Base / Compra:</span>
            <span className="font-mono font-medium text-[#75695D]">S/ {costo.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-[#F5EFEB] font-bold">
            <span className="text-[#059669]">Utilidad Neta:</span>
            <span className="font-mono text-sm text-[#059669]">
              +S/ {utilidad.toFixed(2)}
            </span>
          </div>

          {/* Desglose de pedidos del día con Cliente y Juego de Mesa */}
          {pedidos.length > 0 && (
            <div className="pt-2 border-t border-[#F5EFEB] space-y-1">
              <div className="text-[10px] uppercase font-bold text-[#9CA3AF] tracking-wider">
                {pedidos.length === 1 ? 'Detalle del pedido' : `${pedidos.length} pedidos registrados`}:
              </div>
              {pedidos.map((p: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start text-[11px] gap-2 py-0.5">
                  <div className="truncate min-w-0 flex-1">
                    <span className="font-semibold text-[#1F2937] block truncate">{p.cliente}</span>
                    <span className="text-[#6B7280] block text-[10px] truncate">{p.producto}</span>
                  </div>
                  <span className="font-mono font-bold text-[#1F2937] shrink-0">
                    S/ {Number(p.total).toFixed(2)}
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
      <div className="bg-white border border-[#E5DCD3] rounded-xl shadow-lg p-3 min-w-[210px] text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#F5EFEB] pb-1.5 mb-2">
          <span className="font-bold text-[#1F2937]">{formatFechaEvolucion(label, true)}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            isNegative ? 'text-[#DC2626] bg-[#FEF2F2]' : 'text-[#059669] bg-[#ECFDF5]'
          }`}>
            {isNegative ? 'Déficit Día' : 'Superávit Día'}
          </span>
        </div>
        <div className="space-y-1.5 text-[#6B7280]">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              Entradas (Cobros & Inyecciones):
            </span>
            <span className="font-mono font-bold text-[#059669]">S/ {entradas.toFixed(2)}</span>
          </div>
          {Number(data.inyeccionesTotal || 0) > 0 && (
            <div className="flex justify-between items-center pl-3.5 text-[11px] text-[#059669]">
              <span>↳ De inyecciones:</span>
              <span className="font-mono font-medium">S/ {Number(data.inyeccionesTotal).toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              Egresos & Compras (Salidas):
            </span>
            <span className="font-mono font-bold text-[#DC2626]">S/ {salidas.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-[#F5EFEB] font-bold">
            <span className={isNegative ? 'text-[#DC2626]' : 'text-[#059669]'}>Balance Neto:</span>
            <span className={`font-mono text-sm ${isNegative ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
              {isNegative ? `-S/ ${Math.abs(balanceNeto).toFixed(2)}` : `+S/ ${balanceNeto.toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

// Tooltip 3: Curva Acumulada
function CurvaAcumuladaTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const cobranza = Number(data.ingresosAcum || 0)
    const gastos = Number(data.egresosAcum || 0)
    const balance = Number(data.balanceAcum || 0)
    const isNegative = balance < 0

    return (
      <div className="bg-white border border-[#E5DCD3] rounded-xl shadow-lg p-3 min-w-[220px] text-xs font-sans">
        <div className="flex items-center justify-between border-b border-[#F5EFEB] pb-1.5 mb-2">
          <span className="font-bold text-[#1F2937]">{formatFechaEvolucion(label, true)}</span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
            isNegative ? 'text-[#DC2626] bg-[#FEF2F2]' : 'text-[#059669] bg-[#ECFDF5]'
          }`}>
            {isNegative ? 'Déficit Acumulado' : 'Superávit Acumulado'}
          </span>
        </div>
        <div className="space-y-1.5 text-[#6B7280]">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#059669]" />
              Cobranza Acumulada:
            </span>
            <span className="font-mono font-bold text-[#059669]">S/ {cobranza.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#DC2626]" />
              Gastos Acumulados:
            </span>
            <span className="font-mono font-bold text-[#DC2626]">S/ {gastos.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-[#F5EFEB] font-bold">
            <span className={isNegative ? 'text-[#DC2626]' : 'text-[#059669]'}>Balance a la Fecha:</span>
            <span className={`font-mono text-sm ${isNegative ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
              {isNegative ? `-S/ ${Math.abs(balance).toFixed(2)}` : `+S/ ${balance.toFixed(2)}`}
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
  rawIngresosDirectos = []
}: DashboardClientProps) {
  const router = useRouter()
  // Default al historial completo
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDateRange('TODO'))
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [distribucionMode, setDistribucionMode] = useState<'VS' | 'CATEGORIAS'>('VS')
  const [evolucionTab, setEvolucionTab] = useState<'MARGEN' | 'FLUJO' | 'ACUMULADO' | 'TODOS'>('MARGEN')
  const [soloDiasConVentas, setSoloDiasConVentas] = useState(true)
  const [rankingArticulosMode, setRankingArticulosMode] = useState<'RENTABILIDAD' | 'VOLUMEN'>('RENTABILIDAD')

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

    // Cobranzas efectivas dentro del período (considera abonos recibidos en el período de cualquier pedido)
    const totalCobradoVentas = rawVentas.reduce((sum: number, v: any) => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        const pagosEnRango = v.pagos.filter((p: any) => isDateInRange(p.fecha, dateRange.from, dateRange.to))
        return sum + pagosEnRango.reduce((pSum: number, p: any) => pSum + Number(p.monto || 0), 0)
      }
      // Fallback si no hay array de pagos pero la fecha de venta está en rango
      if (isDateInRange(v.fecha, dateRange.from, dateRange.to)) {
        return sum + Number(v.montoPagado || 0)
      }
      return sum
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

  // 5. Saldo y liquidez en caja calculada para el período
  const gasto = useMemo(() => {
    const saldoActualCaja = Math.max(0, (dynamicKpis.totalCobradoVentas + dynamicKpis.totalIngresosDirectos) - dynamicKpis.egresosTotales)
    const gastoDisponibleHoy = saldoActualCaja
    const margenUnitarioPromedio = dynamicKpis.ticketPromedio > 0 ? (dynamicKpis.gananciaNeta / Math.max(1, filteredVentas.length)) : 0
    const pedidosProyectadosMes = filteredVentas.length
    const gananciaProyectadaMes = dynamicKpis.gananciaNeta
    const gastoDisponibleProyectado = saldoActualCaja

    return {
      saldoActualCaja,
      totalBlindadoMes: 0,
      cuotaPrestamoMensual: 0,
      reservaCapexMensual: 0,
      gastosFijosTaller: 0,
      gastoDisponibleHoy,
      gastoDisponibleProyectado,
      pedidosProyectadosMes,
      gananciaProyectadaMes
    }
  }, [dynamicKpis, filteredVentas.length])

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

    // A. Inicializar todos los días del período para rangos continuos (ej. semana o mes de hasta 60 días)
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
            pedidosDetalle: []
          }
          curr.setDate(curr.getDate() + 1)
        }
      }
    }

    // B. Procesar ventas base (Facturación y Costo en la fecha de la venta)
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
          pedidosDetalle: []
        }
      }

      const totalVenta = Number(v.total || 0)
      const costoBaseUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0 
        ? Number(v.costoBaseSnapshot) 
        : (Number(v.producto?.costoBase) || 0)
      const costoProd = costoBaseUnit * Number(v.cantidad || 1)

      timelineMap[vDate].ventaTotal += totalVenta
      timelineMap[vDate].costoProduccion += costoProd
      timelineMap[vDate].utilidad += (totalVenta - costoProd)
      timelineMap[vDate].pedidosCount += 1

      const clienteName = v.cliente || 'Cliente'
      const prodName = v.nombreProductoSnapshot || v.producto?.nombreModelo || 'Juego'
      if (!timelineMap[vDate].pedidosDetalle) timelineMap[vDate].pedidosDetalle = []
      timelineMap[vDate].pedidosDetalle.push({
        cliente: clienteName,
        producto: prodName,
        total: totalVenta
      })

      // Si la venta no tiene pagos registrados, sumar como entrada en su fecha
      if (!v.pagos || v.pagos.length === 0) {
        timelineMap[vDate].entradas += Number(v.montoPagado != null ? v.montoPagado : v.total)
      }
    })

    // C. Procesar cobros reales (entradas) según la fecha efectiva del pago
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

    // D. Procesar egresos e inversiones (salidas) según la fecha del gasto
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

    // E. Procesar ingresos directos / inyecciones de dinero (entradas) según su fecha
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

    // F. Convertir a array ordenado y calcular acumulados
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

  // 7. Datos de Distribución de Egresos vs Ingresos (Donut Chart)
  const comparativaIngresosGastos = useMemo(() => {
    const ingresos = dynamicKpis.totalCobradoVentas + dynamicKpis.totalIngresosDirectos
    const egresos = dynamicKpis.egresosTotales
    const balance = ingresos - egresos
    const totalFlujo = ingresos + egresos

    const ingresosPct = totalFlujo > 0 ? Number(((ingresos / totalFlujo) * 100).toFixed(1)) : 0
    const egresosPct = totalFlujo > 0 ? Number(((egresos / totalFlujo) * 100).toFixed(1)) : 0

    const dataDonut = [
      { name: 'Cobranza en Caja', value: Number(ingresos.toFixed(2)), color: '#059669', pct: ingresosPct },
      { name: 'Gastos & Egresos', value: Number(egresos.toFixed(2)), color: '#DC2626', pct: egresosPct }
    ].filter(d => d.value > 0)

    return {
      ingresos,
      egresos,
      balance,
      ingresosPct,
      egresosPct,
      dataDonut
    }
  }, [dynamicKpis])

  // 7b. Datos de Inversión por Categoría Dinámico (Donut Chart en modo Categorías)
  const graficoInversionDinamico = useMemo(() => {
    if (rawInversiones.length === 0) return initialGraficoInversion

    const categoriasMap: Record<string, number> = {}
    filteredInversiones.forEach((inv: any) => {
      const cat = inv.categoria || 'OTROS'
      categoriasMap[cat] = (categoriasMap[cat] || 0) + Number(inv.costoTotal || 0)
    })

    return Object.entries(categoriasMap).map(([name, value]) => ({
      name,
      value: Number(value.toFixed(2))
    })).filter(c => c.value > 0)
  }, [filteredInversiones, rawInversiones, initialGraficoInversion])

  const totalEgresosCalculado = useMemo(() => {
    return graficoInversionDinamico.reduce((sum, item) => sum + item.value, 0)
  }, [graficoInversionDinamico])

  // 8. Top 5 Clientes Dinámico según el período seleccionado
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

  // 9. Top 5 Juegos en el período seleccionado (Rentabilidad vs Volumen)
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
      const cant = Number(v.cantidad || 1)
      const sub = Number(v.total || 0)

      const costoBaseUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0 
        ? Number(v.costoBaseSnapshot) 
        : (Number(v.producto?.costoBase) || 0)
      const costoProd = costoBaseUnit * cant

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

      articulosMap[artKey].unidadesVendidas += cant
      articulosMap[artKey].totalFacturado += sub
      articulosMap[artKey].costoProduccionTotal += costoProd
      articulosMap[artKey].pedidosCount += 1
      totalUnidades += cant
    })

    const ingresosTotal = dynamicKpis.ingresosVentas

    return Object.values(articulosMap)
      .map((art) => {
        const gananciaNeta = Number((art.totalFacturado - art.costoProduccionTotal).toFixed(2))
        const margenPorcentaje = art.totalFacturado > 0 
          ? Number(((gananciaNeta / art.totalFacturado) * 100).toFixed(1)) 
          : 0

        return {
          id: art.id,
          nombreModelo: art.nombreModelo,
          lineaCategoria: art.lineaCategoria,
          unidadesVendidas: art.unidadesVendidas,
          totalFacturado: Number(art.totalFacturado.toFixed(2)),
          costoProduccionTotal: Number(art.costoProduccionTotal.toFixed(2)),
          gananciaNeta,
          margenPorcentaje,
          pedidosCount: art.pedidosCount,
          precioPromedio: art.unidadesVendidas > 0 ? Number((art.totalFacturado / art.unidadesVendidas).toFixed(2)) : 0,
          porcentajeUnidades: totalUnidades > 0 ? Number(((art.unidadesVendidas / totalUnidades) * 100).toFixed(1)) : 0,
          porcentajeFacturacion: ingresosTotal > 0 ? Number(((art.totalFacturado / ingresosTotal) * 100).toFixed(1)) : 0
        }
      })
      .sort((a, b) => {
        if (rankingArticulosMode === 'RENTABILIDAD') {
          return b.gananciaNeta - a.gananciaNeta || b.totalFacturado - a.totalFacturado
        }
        return b.unidadesVendidas - a.unidadesVendidas || b.totalFacturado - a.totalFacturado
      })
      .slice(0, 5)
  }, [filteredVentas, rawVentas, dynamicKpis.ingresosVentas, initialTopArticulos, rankingArticulosMode])

  // Funciones de renderizado para los 3 gráficos
  const renderMargenChart = (data: any[], heightClass: string = 'h-full') => {
    const displayData = soloDiasConVentas ? data.filter(d => d.ventaTotal > 0) : data
    const chartData = displayData.length > 0 ? displayData : data

    return (
      <div className={`${heightClass} w-full`}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5DCD3" vertical={false} opacity={0.5} />
            <XAxis 
              dataKey="fecha" 
              stroke="#6B7280" 
              fontSize={11} 
              tickLine={false} 
              axisLine={{ stroke: '#E5DCD3' }}
              interval={chartData.length <= 10 ? 0 : 'preserveStartEnd'}
              minTickGap={32}
              tickFormatter={(val) => formatFechaEvolucion(val, false)}
              dy={4}
            />
            <YAxis 
              stroke="#6B7280" 
              fontSize={11} 
              tickLine={false} 
              axisLine={false} 
              tickFormatter={(val) => `${val}`}
            />
            <Tooltip content={<MargenTooltip />} />
            <Legend 
              verticalAlign="top"
              content={() => (
                <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] pb-2 text-[#6B7280]">
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 bg-[#059669] rounded-xs inline-block" />
                    <span>Utilidad Neta</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium">
                    <span className="w-2.5 h-2.5 bg-[#D1C7BD] rounded-xs inline-block" />
                    <span>Costo Base / Compra</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-medium text-[#7C5835]">
                    <span className="w-3.5 h-0.5 bg-[#7C5835] rounded-full inline-block" />
                    <span>Venta Total</span>
                  </div>
                </div>
              )}
            />
            <Bar 
              dataKey="costoProduccion" 
              name="Costo Base" 
              stackId="venta" 
              fill="#D1C7BD" 
              radius={[0, 0, 0, 0]}
              maxBarSize={32}
            />
            <Bar 
              dataKey="utilidad" 
              name="Utilidad Neta" 
              stackId="venta" 
              fill="#059669" 
              radius={[4, 4, 0, 0]}
              maxBarSize={32}
            />
            <Line 
              type="monotone" 
              dataKey="ventaTotal" 
              name="Venta Total" 
              stroke="#7C5835" 
              strokeWidth={2} 
              dot={{ r: 3, fill: '#7C5835', stroke: '#FFFFFF', strokeWidth: 1.5 }}
              activeDot={{ r: 5, fill: '#7C5835', stroke: '#FFFFFF', strokeWidth: 2 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const renderFlujoChart = (data: any[], heightClass: string = 'h-full') => (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5DCD3" vertical={false} opacity={0.5} />
          <XAxis 
            dataKey="fecha" 
            stroke="#6B7280" 
            fontSize={11} 
            tickLine={false} 
            axisLine={{ stroke: '#E5DCD3' }}
            interval={data.length <= 10 ? 0 : 'preserveStartEnd'}
            minTickGap={32}
            tickFormatter={(val) => formatFechaEvolucion(val, false)}
            dy={4}
          />
          <YAxis 
            stroke="#6B7280" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `${val}`}
          />
          <Tooltip content={<FlujoCajaTooltip />} />
          <Legend 
            verticalAlign="top"
            content={() => (
              <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] pb-2 text-[#6B7280]">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 bg-[#059669] rounded-xs inline-block" />
                  <span>Entradas (Cobros & Inyecciones)</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-xs inline-block" />
                  <span>Egresos & Compras</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-[#1F2937]">
                  <span className="w-3.5 h-0.5 bg-[#1F2937] rounded-full inline-block" />
                  <span>Balance Neto</span>
                </div>
              </div>
            )}
          />
          <ReferenceLine y={0} stroke="#D1D5DB" strokeWidth={1} />
          <Bar 
            dataKey="entradas" 
            name="Entradas" 
            fill="#059669" 
            radius={[3, 3, 0, 0]}
            maxBarSize={22}
          />
          <Bar 
            dataKey="salidas" 
            name="Salidas" 
            fill="#DC2626" 
            radius={[3, 3, 0, 0]}
            maxBarSize={22}
          />
          <Line 
            type="monotone" 
            dataKey="balanceNeto" 
            name="Balance Diario" 
            stroke="#1F2937" 
            strokeWidth={2} 
            dot={{ r: 3, fill: '#1F2937', stroke: '#FFFFFF', strokeWidth: 1.5 }}
            activeDot={{ r: 5, fill: '#1F2937', stroke: '#FFFFFF', strokeWidth: 2 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )

  const renderAcumuladoChart = (data: any[], heightClass: string = 'h-full') => (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorIngresosAcum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#059669" stopOpacity={0.25}/>
              <stop offset="95%" stopColor="#059669" stopOpacity={0.0}/>
            </linearGradient>
            <linearGradient id="colorGastosAcum" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#DC2626" stopOpacity={0.15}/>
              <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5DCD3" vertical={false} opacity={0.5} />
          <XAxis 
            dataKey="fecha" 
            stroke="#6B7280" 
            fontSize={11} 
            tickLine={false} 
            axisLine={{ stroke: '#E5DCD3' }}
            interval={data.length <= 10 ? 0 : 'preserveStartEnd'}
            minTickGap={32}
            tickFormatter={(val) => formatFechaEvolucion(val, false)}
            dy={4}
          />
          <YAxis 
            stroke="#6B7280" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(val) => `S/ ${val}`}
          />
          <Tooltip content={<CurvaAcumuladaTooltip />} />
          <Legend 
            verticalAlign="top"
            content={() => (
              <div className="flex flex-wrap items-center justify-end gap-3 text-[11px] pb-2 text-[#6B7280]">
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 bg-[#059669] rounded-xs inline-block" />
                  <span>Cobranza Acumulada</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 bg-[#DC2626] rounded-xs inline-block" />
                  <span>Gastos Acumulados</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-[#7C5835]">
                  <span className="w-3.5 h-0.5 bg-[#7C5835] rounded-full inline-block" />
                  <span>Balance a la Fecha</span>
                </div>
              </div>
            )}
          />
          <Area 
            type="monotone" 
            dataKey="ingresosAcum" 
            name="Cobranza Acumulada" 
            stroke="#059669" 
            strokeWidth={2.5} 
            fill="url(#colorIngresosAcum)" 
          />
          <Area 
            type="monotone" 
            dataKey="egresosAcum" 
            name="Gastos Acumulados" 
            stroke="#DC2626" 
            strokeWidth={2} 
            fill="url(#colorGastosAcum)" 
            strokeDasharray="4 4"
          />
          <Line 
            type="monotone" 
            dataKey="balanceAcum" 
            name="Balance Acumulado" 
            stroke="#7C5835" 
            strokeWidth={2} 
            dot={false}
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
    <div className="space-y-5 animate-in fade-in duration-300 pb-10 max-w-7xl mx-auto">
      {/* ========================================================================= */}
      {/* 1. HEADER MINIMALISTA CON FILTRO DE PERÍODO (HISTÓRICO POR DEFECTO)        */}
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

        {/* KPI 2: Saldo Disponible en Caja */}
        <div className="bg-white border border-[#E5DCD3] rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#6B7280]">Saldo Disponible en Caja</span>
            <div className={`p-1.5 rounded-lg ${gasto.saldoActualCaja > 0 ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-[#FEF3C7] text-[#92400E]'}`}>
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className={`text-2xl font-black font-mono tracking-tight tabular-nums ${gasto.saldoActualCaja > 0 ? 'text-[#059669]' : 'text-[#92400E]'}`}>
              {formatCurrency(gasto.saldoActualCaja)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#6B7280] truncate">
              <span>Cobrado: {formatCurrency(dynamicKpis.totalCobradoVentas)}</span>
              {dynamicKpis.totalIngresosDirectos > 0 && (
                <>
                  <span>•</span>
                  <span>Inyecciones: {formatCurrency(dynamicKpis.totalIngresosDirectos)}</span>
                </>
              )}
              <span>•</span>
              <span>Egresos: {formatCurrency(dynamicKpis.egresosTotales)}</span>
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
              <span>Costo base: {formatCurrency(dynamicKpis.costoFabricacionTotal)}</span>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. GRÁFICOS ANALÍTICOS (EVOLUCIÓN FINANCIERA & DISTRIBUCIÓN DE GASTOS)     */}
      {/* ========================================================================= */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-12">
        
        {/* Gráfico de Evolución y Análisis Financiero (8 cols) */}
        <Card className="lg:col-span-8 bg-white border-[#E5DCD3] shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <CardTitle className="text-[#1F2937] text-sm sm:text-base font-black">
                    {EVOLUCION_CONFIG[evolucionTab].title}
                  </CardTitle>
                  {evolucionTab === 'MARGEN' && (
                    <button
                      type="button"
                      onClick={() => setSoloDiasConVentas(!soloDiasConVentas)}
                      className="text-[10px] text-[#7C5835] hover:text-[#5B4026] bg-[#FAF7F4] hover:bg-[#F2ECE4] border border-[#E5DCD3] px-2 py-0.5 rounded-md font-semibold cursor-pointer transition-colors"
                      title="Alternar entre ver solo días con ventas o todo el calendario"
                    >
                      {soloDiasConVentas ? '⚡ Solo días con ventas' : '📅 Todo el calendario'}
                    </button>
                  )}
                </div>
                <CardDescription className="text-xs text-[#6B7280]">
                  {EVOLUCION_CONFIG[evolucionTab].description}
                </CardDescription>
              </div>

              {/* Selector de los 3 gráficos */}
              <div className="flex items-center p-0.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] shrink-0 overflow-x-auto max-w-full">
                <button
                  type="button"
                  onClick={() => setEvolucionTab('MARGEN')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    evolucionTab === 'MARGEN'
                      ? 'bg-[#A36F4C] text-white shadow-2xs'
                      : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Margen Pedidos
                </button>
                <button
                  type="button"
                  onClick={() => setEvolucionTab('FLUJO')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    evolucionTab === 'FLUJO'
                      ? 'bg-[#A36F4C] text-white shadow-2xs'
                      : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Flujo de Caja
                </button>
                <button
                  type="button"
                  onClick={() => setEvolucionTab('ACUMULADO')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    evolucionTab === 'ACUMULADO'
                      ? 'bg-[#A36F4C] text-white shadow-2xs'
                      : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Curva Acumulada
                </button>
                <button
                  type="button"
                  onClick={() => setEvolucionTab('TODOS')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    evolucionTab === 'TODOS'
                      ? 'bg-[#A36F4C] text-white shadow-2xs'
                      : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Ver los 3
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-3 sm:p-5 pt-0">
            {metricasEvolucion.length === 0 ? (
              <div className="h-[280px] flex items-center justify-center text-xs text-[#6B7280] italic">
                No hay movimientos registrados en el período seleccionado.
              </div>
            ) : evolucionTab === 'MARGEN' ? (
              <div className="h-[280px] sm:h-[320px] w-full">
                {renderMargenChart(metricasEvolucion)}
              </div>
            ) : evolucionTab === 'FLUJO' ? (
              <div className="h-[280px] sm:h-[320px] w-full">
                {renderFlujoChart(metricasEvolucion)}
              </div>
            ) : evolucionTab === 'ACUMULADO' ? (
              <div className="h-[280px] sm:h-[320px] w-full">
                {renderAcumuladoChart(metricasEvolucion)}
              </div>
            ) : (
              <div className="space-y-6 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#1F2937]">1. Margen Comercial por Pedido</span>
                    <span className="text-[10px] text-[#6B7280]">Rentabilidad directa de juegos vendidos</span>
                  </div>
                  <div className="h-[230px] w-full">
                    {renderMargenChart(metricasEvolucion)}
                  </div>
                </div>

                <div className="border-t border-[#F5EFEB] pt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#1F2937]">2. Flujo Diario de Caja Real</span>
                    <span className="text-[10px] text-[#6B7280]">Cobranzas efectivas vs. egresos de la tienda</span>
                  </div>
                  <div className="h-[230px] w-full">
                    {renderFlujoChart(metricasEvolucion)}
                  </div>
                </div>

                <div className="border-t border-[#F5EFEB] pt-4">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#1F2937]">3. Curva Acumulativa del Período</span>
                    <span className="text-[10px] text-[#6B7280]">Crecimiento acumulado y punto de equilibrio</span>
                  </div>
                  <div className="h-[230px] w-full">
                    {renderAcumuladoChart(metricasEvolucion)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Donut de Gastos vs Ingresos / Categorías (4 cols) */}
        <Card className="lg:col-span-4 bg-white border-[#E5DCD3] shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-0">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-[#1F2937] text-sm sm:text-base font-black">
                  {distribucionMode === 'VS' ? 'Gastos vs Ingresos' : 'Distribución de Gastos'}
                </CardTitle>
                <CardDescription className="text-xs text-[#6B7280]">
                  {distribucionMode === 'VS' ? 'Relación de flujo y balance en caja' : 'Egresos y compras de la tienda'}
                </CardDescription>
              </div>

              {/* Selector de Modo */}
              <div className="flex items-center p-0.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC] shrink-0">
                <button
                  type="button"
                  onClick={() => setDistribucionMode('VS')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    distribucionMode === 'VS'
                      ? 'bg-[#A36F4C] text-white shadow-2xs'
                      : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Vs Ingresos
                </button>
                <button
                  type="button"
                  onClick={() => setDistribucionMode('CATEGORIAS')}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                    distribucionMode === 'CATEGORIAS'
                      ? 'bg-[#A36F4C] text-white shadow-2xs'
                      : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Categorías
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-0 space-y-3">
            {distribucionMode === 'VS' ? (
              <>
                {/* Gráfico Donut: Gastos vs Ingresos */}
                <div className="h-[180px] w-full flex items-center justify-center relative">
                  {comparativaIngresosGastos.dataDonut.length === 0 ? (
                    <div className="text-xs text-[#6B7280] italic text-center">
                      Sin movimientos en el período seleccionado.
                    </div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={comparativaIngresosGastos.dataDonut}
                            cx="50%"
                            cy="50%"
                            innerRadius={54}
                            outerRadius={78}
                            paddingAngle={3}
                            dataKey="value"
                            stroke="#FFFFFF"
                            strokeWidth={2}
                          >
                            {comparativaIngresosGastos.dataDonut.map((entry, index) => (
                              <Cell key={`cell-vs-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#FFFFFF', border: '1px solid #E5DCD3', borderRadius: '12px', fontSize: '11px' }}
                            formatter={(val: any, name: any) => [`S/ ${Number(val).toFixed(2)}`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>

                      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-[10px] text-[#6B7280] uppercase font-bold tracking-wider">
                          {comparativaIngresosGastos.balance >= 0 ? 'Superávit' : 'Déficit'}
                        </span>
                        <span className={`text-sm sm:text-base font-black font-mono tabular-nums ${
                          comparativaIngresosGastos.balance >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                        }`}>
                          {comparativaIngresosGastos.balance >= 0 ? '+' : ''}{formatCurrency(comparativaIngresosGastos.balance)}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Desglose comparativo Ingresos vs Gastos */}
                <div className="space-y-2 pt-2 border-t border-[#F5EFEB]">
                  {/* Fila 1: Ingresos */}
                  <div className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#059669]" />
                      <span className="text-[#1F2937] text-[11px] font-semibold">Ingresos Cobrados</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-[#059669] tabular-nums text-[11px]">
                        {formatCurrency(comparativaIngresosGastos.ingresos)}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-mono w-8 text-right font-medium">
                        {comparativaIngresosGastos.ingresosPct}%
                      </span>
                    </div>
                  </div>

                  {/* Fila 2: Gastos */}
                  <div className="flex items-center justify-between text-xs py-0.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-[#DC2626]" />
                      <span className="text-[#1F2937] text-[11px] font-semibold">Gastos & Egresos</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono font-bold text-[#DC2626] tabular-nums text-[11px]">
                        {formatCurrency(comparativaIngresosGastos.egresos)}
                      </span>
                      <span className="text-[10px] text-[#6B7280] font-mono w-8 text-right font-medium">
                        {comparativaIngresosGastos.egresosPct}%
                      </span>
                    </div>
                  </div>

                  {/* Fila 3: Flujo Neto */}
                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#F5EFEB]/80">
                    <span className="text-[11px] text-[#75695D] font-medium">Flujo Neto en Caja</span>
                    <span className={`font-mono font-black text-xs tabular-nums ${
                      comparativaIngresosGastos.balance >= 0 ? 'text-[#059669]' : 'text-[#DC2626]'
                    }`}>
                      {comparativaIngresosGastos.balance >= 0 ? '+' : ''}{formatCurrency(comparativaIngresosGastos.balance)}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Gráfico Donut: Por Categorías */}
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
                        <span className="text-[10px] text-[#6B7280] uppercase font-bold">Total Egresos</span>
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
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ========================================================================= */}
      {/* 4. RANKINGS COMERCIALES (TOP 5 CLIENTES & TOP 5 JUEGOS)                   */}
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
                        {c.pedidosCount} {c.pedidosCount === 1 ? 'pedido' : 'pedidos'} • {c.piezasCount} {c.piezasCount === 1 ? 'juego' : 'juegos'}
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

        {/* TOP 5 JUEGOS MÁS RENTABLES / MÁS VENDIDOS */}
        <Card className="bg-white border-[#E5DCD3] shadow-xs rounded-2xl overflow-hidden flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-[#F5EFEB]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Dice5 className="h-4 w-4 text-[#7C5835]" />
                <CardTitle className="text-sm sm:text-base font-black text-[#1F2937]">
                  {rankingArticulosMode === 'RENTABILIDAD' ? 'Top Juegos Más Rentables' : 'Top Juegos Más Vendidos'}
                </CardTitle>
              </div>

              {/* Selector de ordenamiento: Rentabilidad vs Volumen */}
              <div className="flex items-center gap-2">
                <div className="flex items-center p-0.5 rounded-lg bg-[#FAF8F5] border border-[#E2D9CC] shrink-0">
                  <button
                    type="button"
                    onClick={() => setRankingArticulosMode('RENTABILIDAD')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      rankingArticulosMode === 'RENTABILIDAD'
                        ? 'bg-[#059669] text-white shadow-2xs'
                        : 'text-[#75695D] hover:text-[#241C15]'
                    }`}
                  >
                    💰 Ganancia
                  </button>
                  <button
                    type="button"
                    onClick={() => setRankingArticulosMode('VOLUMEN')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      rankingArticulosMode === 'VOLUMEN'
                        ? 'bg-[#A36F4C] text-white shadow-2xs'
                        : 'text-[#75695D] hover:text-[#241C15]'
                    }`}
                  >
                    📦 Unidades
                  </button>
                </div>

                <Link
                  href="/catalogo"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#7C5835] hover:text-[#5E4328] hover:underline shrink-0"
                >
                  <span>Catálogo</span>
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 flex-1 divide-y divide-[#F5EFEB]">
            {topArticulosDinamico.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280] space-y-2">
                <Dice5 className="h-6 w-6 text-[#B8A99A] mx-auto opacity-50" />
                <p>No hay juegos despachados en este período.</p>
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

                    <div className="w-8 h-8 rounded-lg bg-[#FAF7F4] border border-[#E5DCD3] text-[#7C5835] flex items-center justify-center shrink-0">
                      <Dice5 className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold text-[#1F2937] truncate" title={art.nombreModelo}>
                        {art.nombreModelo}
                      </h4>
                      <p className="text-[11px] text-[#6B7280] truncate">
                        {art.unidadesVendidas} {art.unidadesVendidas === 1 ? 'unidad' : 'unidades'} • en {art.pedidosCount} {art.pedidosCount === 1 ? 'pedido' : 'pedidos'}
                        <span className="mx-1">•</span>
                        <span>Ventas: {formatCurrency(art.totalFacturado)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs sm:text-sm font-mono font-black text-[#059669] tabular-nums">
                      +{formatCurrency(art.gananciaNeta || 0)}
                    </div>
                    <div className="text-[10px] font-medium text-[#6B7280]">
                      {art.margenPorcentaje != null ? `${art.margenPorcentaje.toFixed(0)}% margen` : ''}
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
