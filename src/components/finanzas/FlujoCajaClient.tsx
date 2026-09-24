'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Clock, 
  Search, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Wrench, 
  ShoppingBag, 
  Truck, 
  TrendingUp, 
  BarChart3,
  Calendar
} from 'lucide-react'
import { 
  ComposedChart, 
  Bar, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts'
import { formatDate } from '@/lib/utils'
import { DateRange, getDefaultDateRange, isDateInRange } from '@/lib/date-utils'
import { DateFilterControl } from '@/components/ui/DateFilterControl'
import { useBusiness } from '@/context/BusinessContext'

export interface EgresoItem {
  id: string
  persona: string
  categoria: 'ACTIVO_FIJO' | 'INSUMO' | 'SERVICIO' | 'APORTE_CAPITAL' | 'MERCADERIA' | 'FINANCIERO'
  subcategoria?: string | null
  itemConcepto: string
  especificacionColor?: string | null
  presentacion?: string | null
  cantidad: number
  costoUnitario: number
  costoEnvio?: number | null
  costoTotal: number
  costoPorGramo?: number | null
  createdAt: string
}

export interface PagoVentaItem {
  id: string
  ventaId: string
  fecha: string
  monto: number
  metodoPago: string
  tipo: string
  notas?: string | null
}

export interface VentaItem {
  id: string
  fecha: string
  cliente: string
  cantidad: number
  precioUnitario: number
  total: number
  montoPagado: number
  saldoPendiente: number
  estado: string
  producto: {
    nombreModelo: string
    lineaCategoria: string
  }
  pagos?: PagoVentaItem[]
}

export interface IngresoDirectoItem {
  id: string
  fecha: string
  cliente: string
  concepto: string
  categoria: string
  monto: number
  metodoPago?: string
  notas?: string
}

export interface MonthlyMovimiento {
  id: string
  fecha: string
  tipo: string
  categoria: string
  concepto: string
  entidad: string
  monto: number
  esIngreso: boolean
  esActivoFijo?: boolean
  detalle?: string
}

interface FlujoCajaClientProps {
  egresos: EgresoItem[]
  ventas: VentaItem[]
  ingresosDirectos?: IngresoDirectoItem[]
}

const ITEMS_PER_PAGE = 10

// Custom Tooltip for Evolution Chart
function CustomCashFlowTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const isNetPositive = (data.ingresos || 0) >= (data.egresos || 0)
    const neto = (data.ingresos || 0) - (data.egresos || 0)

    return (
      <div className="bg-[#FFFFFF]/95 backdrop-blur-md border border-[#E2D9CC] p-4 rounded-2xl shadow-xl min-w-[240px] text-xs">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2D9CC]/70">
          <span className="font-bold text-[#241C15] flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-[#A36F4C]" />
            {data.fechaCompleta || label}
          </span>
          <Badge 
            variant="outline" 
            className={`text-[10px] font-bold px-1.5 py-0 ${
              isNetPositive 
                ? 'bg-emerald-50 text-[#1E5E3A] border-emerald-200' 
                : 'bg-red-50 text-[#A34335] border-red-200'
            }`}
          >
            {isNetPositive ? `+S/ ${neto.toFixed(2)}` : `-S/ ${Math.abs(neto).toFixed(2)}`}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[#1E5E3A] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1E5E3A]" />
              Ingresos Cobrados:
            </span>
            <span className="font-mono font-bold">+S/ {Number(data.ingresos || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-[#A36F4C] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A36F4C]" />
              Egresos / Gastos:
            </span>
            <span className="font-mono font-bold">-S/ {Number(data.egresos || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="pt-2 mt-2 border-t border-[#E2D9CC] flex justify-between items-center bg-[#FAF8F5] p-2 rounded-xl">
            <span className="font-bold text-[#241C15] flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5 text-[#241C15]" />
              Saldo Acumulado:
            </span>
            <span className="font-mono font-extrabold text-[#241C15] text-sm">
              S/ {Number(data.saldoAcumulado || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function FlujoCajaClient({ 
  egresos, 
  ventas, 
  ingresosDirectos = [] 
}: FlujoCajaClientProps) {
  const { isBG } = useBusiness()
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'INGRESOS' | 'EGRESOS'>('TODOS')
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange('ESTE_MES'))
  const [currentPage, setCurrentPage] = useState(1)

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Filter raw collections by selected date range
  const ventasEnRango = useMemo(() => {
    return ventas.filter(v => isDateInRange(v.fecha, dateRange.from, dateRange.to))
  }, [ventas, dateRange])

  const ingresosDirectosEnRango = useMemo(() => {
    return ingresosDirectos.filter(i => isDateInRange(i.fecha, dateRange.from, dateRange.to))
  }, [ingresosDirectos, dateRange])

  const egresosEnRango = useMemo(() => {
    return egresos.filter(e => isDateInRange(e.createdAt, dateRange.from, dateRange.to))
  }, [egresos, dateRange])

  // Financial Metrics Calculation over active date range
  const totalIngresosVentas = useMemo(() => {
    return ventasEnRango.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
  }, [ventasEnRango])

  const totalIngresosDirectos = useMemo(() => {
    return ingresosDirectosEnRango.reduce((acc, i) => acc + (i.monto || 0), 0)
  }, [ingresosDirectosEnRango])

  const totalIngresosTotales = totalIngresosVentas + totalIngresosDirectos

  const totalSaldosPorCobrar = useMemo(() => {
    return ventasEnRango.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0)
  }, [ventasEnRango])

  const totalEgresosMaquinaria = useMemo(() => {
    return egresosEnRango
      .filter(e => e.categoria === 'ACTIVO_FIJO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [egresosEnRango])

  const totalEgresosInsumos = useMemo(() => {
    return egresosEnRango
      .filter(e => e.categoria === 'INSUMO' || e.categoria === 'MERCADERIA')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [egresosEnRango])

  const totalEgresosServicios = useMemo(() => {
    return egresosEnRango
      .filter(e => e.categoria === 'SERVICIO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [egresosEnRango])

  const totalEgresosFinancieros = useMemo(() => {
    return egresosEnRango
      .filter(e => e.categoria === 'FINANCIERO')
      .reduce((acc, e) => acc + e.costoTotal, 0)
  }, [egresosEnRango])

  const totalEgresosTotales = egresosEnRango.reduce((acc, e) => acc + e.costoTotal, 0)
  const saldoNetoCaja = totalIngresosTotales - totalEgresosTotales

  // Evolution Chart Timeline Data Calculation
  const chartTimelineData = useMemo(() => {
    const dayMap = new Map<string, { ingresos: number; egresos: number }>()

    // Group Sales Payments by actual payment date
    ventas.forEach(v => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        v.pagos.forEach(p => {
          if (p.monto > 0) {
            const day = p.fecha.split('T')[0]
            const curr = dayMap.get(day) || { ingresos: 0, egresos: 0 }
            curr.ingresos += p.monto
            dayMap.set(day, curr)
          }
        })
      } else if (v.montoPagado > 0) {
        const day = v.fecha.split('T')[0]
        const curr = dayMap.get(day) || { ingresos: 0, egresos: 0 }
        curr.ingresos += v.montoPagado
        dayMap.set(day, curr)
      }
    })

    // Group Direct Incomes
    ingresosDirectos.forEach(i => {
      if (i.monto > 0) {
        const day = i.fecha.split('T')[0]
        const curr = dayMap.get(day) || { ingresos: 0, egresos: 0 }
        curr.ingresos += i.monto
        dayMap.set(day, curr)
      }
    })

    // Group Expenses
    egresos.forEach(e => {
      if (e.costoTotal > 0) {
        const day = e.createdAt.split('T')[0]
        const curr = dayMap.get(day) || { ingresos: 0, egresos: 0 }
        curr.egresos += e.costoTotal
        dayMap.set(day, curr)
      }
    })

    // Chronological Sort (Ascending)
    const sortedDays = Array.from(dayMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))

    let runningBalance = 0
    const points = sortedDays.map(([day, val]) => {
      const netoDia = val.ingresos - val.egresos
      runningBalance += netoDia
      const parts = day.split('-')
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic']
      const dayNum = parseInt(parts[2], 10)
      const monthName = months[parseInt(parts[1], 10) - 1] || ''
      const formattedShort = `${dayNum} ${monthName}`
      const formattedLong = `${dayNum} ${monthName} ${parts[0]}`

      return {
        rawDate: day,
        fechaLabel: formattedShort,
        fechaCompleta: formattedLong,
        ingresos: Number(val.ingresos.toFixed(2)),
        egresos: Number(val.egresos.toFixed(2)),
        neto: Number(netoDia.toFixed(2)),
        saldoAcumulado: Number(runningBalance.toFixed(2)),
      }
    })

    // Filter by date range
    if (dateRange.preset !== 'TODO') {
      const filtered = points.filter(p => isDateInRange(p.rawDate, dateRange.from, dateRange.to))
      return filtered.length > 0 ? filtered : points
    }
    return points
  }, [ventas, ingresosDirectos, egresos, dateRange])

  // Unified Chronological Movements (Libro de Caja Diario)
  const allMovements = useMemo(() => {
    const movements: Array<{
      id: string
      fecha: string
      tipo: 'INGRESO_VENTA' | 'INGRESO_DIRECTO' | 'EGRESO_MAQUINARIA' | 'EGRESO_INSUMO' | 'EGRESO_SERVICIO'
      concepto: string
      entidad: string
      monto: number
      detalle?: string
      isPositive: boolean
    }> = []

    // 1. Incomes from Product Sales & Abonos
    ventas.forEach((v, vIdx) => {
      const codigo = (v as any).codigo || `PED-${String(ventas.length - vIdx).padStart(3, '0')}`
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        v.pagos.forEach((p, idx) => {
          if (p.monto > 0) {
            const isSingleFull = ((v.pagos?.length || 0) === 1 && v.saldoPendiente <= 0) || p.tipo === 'PAGO_TOTAL'
            const numAbono = idx + 1
            const concepto = isSingleFull
              ? `Pago Total del pedido ${codigo}: ${v.producto.nombreModelo} (x${v.cantidad})`
              : `Abono #${numAbono} del pedido ${codigo}: ${v.producto.nombreModelo} (x${v.cantidad})`

            movements.push({
              id: `pago-${p.id || `${v.id}-${idx}`}`,
              fecha: p.fecha,
              tipo: 'INGRESO_VENTA',
              concepto,
              entidad: v.cliente,
              monto: p.monto,
              detalle: `${p.metodoPago || 'Yape'}${p.notas ? ` • ${p.notas}` : ''}${v.saldoPendiente > 0 ? ` (Resta: ${formatCurrency(v.saldoPendiente)})` : ''}`,
              isPositive: true,
            })
          }
        })
      } else if (v.montoPagado > 0) {
        movements.push({
          id: `v-${v.id}`,
          fecha: v.fecha,
          tipo: 'INGRESO_VENTA',
          concepto: `Abono #1 del pedido ${codigo}: ${v.producto.nombreModelo} (x${v.cantidad})`,
          entidad: v.cliente,
          monto: v.montoPagado,
          detalle: v.saldoPendiente > 0 ? `Saldo pend: ${formatCurrency(v.saldoPendiente)}` : 'Cobrado total',
          isPositive: true,
        })
      }
    })

    // 2. Incomes from Direct Services / Other
    ingresosDirectos.forEach(i => {
      movements.push({
        id: `ing-${i.id}`,
        fecha: i.fecha,
        tipo: 'INGRESO_DIRECTO',
        concepto: `${i.categoria}: ${i.concepto}`,
        entidad: i.cliente,
        monto: i.monto,
        detalle: i.metodoPago ? `Método: ${i.metodoPago}` : undefined,
        isPositive: true,
      })
    })

    // 3. Expenses / Egresos
    egresos.forEach(e => {
      if (e.categoria === 'ACTIVO_FIJO') {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_MAQUINARIA',
          concepto: `${isBG ? 'Equipamiento' : 'Maquinaria/Equipo'}: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.presentacion || (isBG ? 'Activo / Equipamiento' : 'Activo / Equipo 3D'),
          isPositive: false,
        })
      } else if (e.categoria === 'MERCADERIA' || (isBG && e.categoria === 'INSUMO')) {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_INSUMO',
          concepto: isBG ? `Compra Juegos: ${e.itemConcepto}` : `Insumo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.subcategoria ? `Tags: ${e.subcategoria}` : (isBG ? 'Stock Juegos de Mesa' : 'Material'),
          isPositive: false,
        })
      } else if (e.categoria === 'FINANCIERO') {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_SERVICIO',
          concepto: `Bancario / ITF: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.subcategoria ? `Banco: ${e.subcategoria}` : 'ITF / Comisión Bancaria',
          isPositive: false,
        })
      } else if (e.categoria === 'INSUMO') {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_INSUMO',
          concepto: `Insumo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.especificacionColor ? `Color: ${e.especificacionColor}` : (e.presentacion || 'Material'),
          isPositive: false,
        })
      } else {
        movements.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: 'EGRESO_SERVICIO',
          concepto: `Gasto Operativo: ${e.itemConcepto}`,
          entidad: e.persona || 'Víctor',
          monto: e.costoTotal,
          detalle: e.subcategoria || 'Servicio / Flete / Operativo',
          isPositive: false,
        })
      }
    })

    // Sort descending by date
    return movements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [ventas, ingresosDirectos, egresos])

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return allMovements.filter(m => {
      const matchDate = isDateInRange(m.fecha, dateRange.from, dateRange.to)
      if (!matchDate) return false

      const matchSearch = 
        m.concepto.toLowerCase().includes(search.toLowerCase()) ||
        m.entidad.toLowerCase().includes(search.toLowerCase()) ||
        (m.detalle && m.detalle.toLowerCase().includes(search.toLowerCase()))

      let matchTipo = true
      if (tipoFilter === 'INGRESOS') matchTipo = m.isPositive
      if (tipoFilter === 'EGRESOS') matchTipo = !m.isPositive

      return matchSearch && matchTipo
    })
  }, [allMovements, dateRange, search, tipoFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / ITEMS_PER_PAGE))
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredMovements.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredMovements, currentPage])

  const [showChart, setShowChart] = useState(true)

  return (
    <div className="space-y-3.5 animate-in fade-in duration-300">
      {/* Header Compacto */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#241C15] flex items-center gap-2.5">
            <div className="p-1.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-2xs">
              <Wallet className="h-5 w-5 stroke-[2.5]" />
            </div>
            <span>Flujo de Caja</span>
          </h1>
          <p className="text-xs text-[#75695D] mt-0.5">
            Balance financiero consolidado entre ingresos cobrados y egresos del taller.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <DateFilterControl
            value={dateRange}
            onChange={(newRange) => {
              setDateRange(newRange)
              setCurrentPage(1)
            }}
          />

          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-[#75695D] hover:text-[#241C15] border border-[#E2D9CC] shadow-2xs transition-all cursor-pointer"
            title={showChart ? "Ocultar gráfico para ver más filas" : "Mostrar gráfico analítico"}
          >
            <BarChart3 className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>{showChart ? "Ocultar Gráfico" : "Ver Gráfico"}</span>
          </button>

          <Link
            href="/historico-mensual"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#633E20] border border-[#D4BEA7] shadow-2xs transition-all"
          >
            <TrendingUp className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>Histórico</span>
          </Link>
        </div>
      </div>

      {/* KPI Financial Overview Strip (Ultra Compacto) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {/* Saldo Neto en Caja */}
        <div className="bg-white border border-[#E2D9CC] shadow-xs rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Saldo Neto en Caja</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#7C5835]">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className={`text-lg sm:text-xl font-black font-mono tabular-nums ${saldoNetoCaja >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
              {formatCurrency(saldoNetoCaja)}
            </div>
            <span className="text-[10px] text-[#75695D] mt-0.5 block truncate">
              Cobrado - Egresos
            </span>
          </div>
        </div>

        {/* Ingresos Cobrados */}
        <div className="bg-white border border-[#E2D9CC] shadow-xs rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Ingresos Cobrados</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-black font-mono tabular-nums text-[#1E5E3A]">
              {formatCurrency(totalIngresosTotales)}
            </div>
            <span className="text-[10px] text-[#75695D] mt-0.5 block truncate">
              Ventas + Directos
            </span>
          </div>
        </div>

        {/* Egresos Totales */}
        <div className="bg-white border border-[#E2D9CC] shadow-xs rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Egresos Totales</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
              <ArrowDownRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-black font-mono tabular-nums text-[#A36F4C]">
              {formatCurrency(totalEgresosTotales)}
            </div>
            <span className="text-[10px] text-[#75695D] mt-0.5 block truncate">
              Insumos + Máquinas + Servicios
            </span>
          </div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-white border border-[#E2D9CC] shadow-xs rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-[11px] font-semibold">Por Cobrar</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#8C6D1F]">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-1">
            <div className="text-lg sm:text-xl font-black font-mono tabular-nums text-[#8C6D1F]">
              {formatCurrency(totalSaldosPorCobrar)}
            </div>
            <span className="text-[10px] text-[#75695D] mt-0.5 block truncate">
              Saldos pendientes
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico Full-Width de Evolución de Caja (Compacto y Opcionalmente Colapsable) */}
      {showChart && (
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] rounded-2xl p-3.5 sm:p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#E2D9CC]/70">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[#A36F4C]" />
                <h3 className="text-sm font-bold text-[#241C15]">
                  Evolución de Caja & Movimientos
                </h3>
              </div>
              <p className="text-[11px] text-[#75695D] mt-0.5">
                Entradas (+), salidas (-) y saldo acumulado a través del tiempo.
              </p>
            </div>
          </div>

          {/* Gráfico ComposedChart Compacto */}
          <div className="h-[180px] sm:h-[195px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartTimelineData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="fechaLabel" 
                  stroke="#75695D" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: '#E2D9CC' }}
                />
                <YAxis 
                  stroke="#75695D" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: '#E2D9CC' }}
                  tickFormatter={(v) => `S/${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
                />
                <RechartsTooltip content={<CustomCashFlowTooltip />} />
                <Legend 
                  verticalAlign="top" 
                  height={28} 
                  iconType="circle"
                  formatter={(value) => (
                    <span className="text-[11px] font-semibold text-[#241C15] mr-3">
                      {value === 'ingresos' ? 'Ingresos (+)' : value === 'egresos' ? 'Egresos (-)' : 'Saldo Acumulado'}
                    </span>
                  )}
                />
                <Bar dataKey="ingresos" name="ingresos" fill="#1E5E3A" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Bar dataKey="egresos" name="egresos" fill="#A36F4C" radius={[3, 3, 0, 0]} maxBarSize={28} />
                <Line 
                  type="monotone" 
                  dataKey="saldoAcumulado" 
                  name="saldoAcumulado" 
                  stroke="#241C15" 
                  strokeWidth={2}
                  dot={{ fill: '#241C15', r: 3, strokeWidth: 1.5, stroke: '#FFFFFF' }}
                  activeDot={{ r: 4.5, fill: '#A36F4C', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* 1-Row Toolbar & Filters */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl p-3 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-80 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
          <Input 
            placeholder="Buscar concepto o cliente..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="pl-9 pr-8 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs md:text-sm rounded-xl h-9 focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC] w-full sm:w-auto justify-center sm:justify-start">
          <button
            onClick={() => { setTipoFilter('TODOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              tipoFilter === 'TODOS'
                ? 'bg-[#241C15] text-white shadow-2xs'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            Todos ({allMovements.length})
          </button>
          <button
            onClick={() => { setTipoFilter('INGRESOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              tipoFilter === 'INGRESOS'
                ? 'bg-[#1E5E3A] text-white shadow-2xs'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
            Ingresos
          </button>
          <button
            onClick={() => { setTipoFilter('EGRESOS'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
              tipoFilter === 'EGRESOS'
                ? 'bg-[#A36F4C] text-white shadow-2xs'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            <ArrowDownRight className="h-3 w-3 stroke-[2.5]" />
            Egresos
          </button>
        </div>
      </div>

      {/* Movements Table (Desktop Zero-Scroll & Mobile Cards) */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] overflow-hidden shadow-2xs rounded-2xl">
        {/* Mobile View: Clean Cards */}
        <div className="block md:hidden divide-y divide-[#E2D9CC]/70">
          {paginatedMovements.length === 0 ? (
            <div className="p-8 text-center text-[#75695D] text-xs">
              No se encontraron movimientos registrados con los filtros aplicados.
            </div>
          ) : (
            paginatedMovements.map((mov) => (
              <div key={mov.id} className="p-3.5 space-y-2 bg-[#FFFFFF] hover:bg-[#FDFBF7] transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-xs text-[#241C15] block truncate">{mov.concepto}</span>
                    <span className="text-[11px] text-[#75695D] font-mono block mt-0.5">
                      {formatDate(mov.fecha)} • {mov.entidad}
                    </span>
                  </div>

                  <span className={`text-sm font-mono font-bold flex-shrink-0 tabular-nums ${
                    mov.isPositive ? 'text-[#1E5E3A]' : 'text-[#A34335]'
                  }`}>
                    {mov.isPositive ? `+${formatCurrency(mov.monto)}` : `-${formatCurrency(mov.monto)}`}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2 text-xs pt-1">
                  <div>
                    {mov.tipo === 'INGRESO_VENTA' ? (
                      <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold gap-1">
                        <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                        Venta
                      </Badge>
                    ) : mov.tipo === 'INGRESO_DIRECTO' ? (
                      <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-bold gap-1">
                        <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                        Ingreso Directo
                      </Badge>
                    ) : mov.tipo === 'EGRESO_MAQUINARIA' ? (
                      <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-[10px] font-semibold gap-1">
                        <Wrench className="h-3 w-3" />
                        Maquinaria
                      </Badge>
                    ) : mov.tipo === 'EGRESO_INSUMO' ? (
                      <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-semibold gap-1">
                        <ShoppingBag className="h-3 w-3" />
                        Insumo
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC] text-[10px] font-semibold gap-1">
                        <Truck className="h-3 w-3" />
                        Gasto Operativo
                      </Badge>
                    )}
                  </div>

                  {mov.detalle && (
                    <span className="text-[11px] text-[#75695D] truncate max-w-[180px]">
                      {mov.detalle}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Clean Zero-Scroll Table */}
        <div className="hidden md:block">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-[#FAF8F5]/80 border-b border-[#E2D9CC]">
              <TableRow className="border-[#E2D9CC] hover:bg-transparent">
                <TableHead className="w-28 px-4 py-2.5 text-xs font-bold text-[#75695D] text-left">Fecha</TableHead>
                <TableHead className="w-36 px-3 py-2.5 text-xs font-bold text-[#75695D] text-left">Tipo</TableHead>
                <TableHead className="px-3 py-2.5 text-xs font-bold text-[#75695D] text-left">Concepto & Detalle</TableHead>
                <TableHead className="w-36 px-3 py-2.5 text-xs font-bold text-[#75695D] text-left">Entidad / Cliente</TableHead>
                <TableHead className="w-36 px-4 py-2.5 text-xs font-bold text-[#75695D] text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMovements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-[#75695D] text-xs">
                    No se encontraron movimientos registrados con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMovements.map((mov) => (
                  <TableRow key={mov.id} className="border-b border-[#E2D9CC]/60 hover:bg-[#FAF8F5]/60 transition-colors">
                    {/* Fecha */}
                    <TableCell className="px-4 py-2.5 text-xs text-[#75695D] font-mono whitespace-nowrap">
                      {formatDate(mov.fecha)}
                    </TableCell>

                    {/* Tipo */}
                    <TableCell className="px-3 py-2.5 whitespace-nowrap">
                      {mov.tipo === 'INGRESO_VENTA' ? (
                        <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[11px] font-bold gap-1">
                          <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                          Venta
                        </Badge>
                      ) : mov.tipo === 'INGRESO_DIRECTO' ? (
                        <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[11px] font-bold gap-1">
                          <ArrowUpRight className="h-3 w-3 stroke-[2.5]" />
                          Ingreso Directo
                        </Badge>
                      ) : mov.tipo === 'EGRESO_MAQUINARIA' ? (
                        <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-[11px] font-semibold gap-1">
                          <Wrench className="h-3 w-3" />
                          Maquinaria
                        </Badge>
                      ) : mov.tipo === 'EGRESO_INSUMO' ? (
                        <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[11px] font-semibold gap-1">
                          <ShoppingBag className="h-3 w-3" />
                          Insumo
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC] text-[11px] font-semibold gap-1">
                          <Truck className="h-3 w-3" />
                          Gasto Operativo
                        </Badge>
                      )}
                    </TableCell>

                    {/* Concepto & Detalle */}
                    <TableCell className="px-3 py-2.5 min-w-0">
                      <span className="font-semibold text-xs text-[#241C15] block truncate" title={mov.concepto}>
                        {mov.concepto}
                      </span>
                      {mov.detalle && (
                        <span className="text-[11px] text-[#75695D] block truncate mt-0.5" title={mov.detalle}>
                          {mov.detalle}
                        </span>
                      )}
                    </TableCell>

                    {/* Entidad / Cliente */}
                    <TableCell className="px-3 py-2.5 text-xs font-medium text-[#241C15] whitespace-nowrap truncate" title={mov.entidad}>
                      {mov.entidad}
                    </TableCell>

                    {/* Monto */}
                    <TableCell className={`px-4 py-2.5 text-right font-mono font-bold tabular-nums whitespace-nowrap text-xs sm:text-sm ${
                      mov.isPositive ? 'text-[#1E5E3A]' : 'text-[#A34335]'
                    }`}>
                      {mov.isPositive ? `+${formatCurrency(mov.monto)}` : `-${formatCurrency(mov.monto)}`}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E2D9CC] bg-[#FAF8F5]/80 text-xs text-[#75695D]">
            <div>
              Mostrando <span className="text-[#241C15] font-bold">{paginatedMovements.length}</span> de <span className="text-[#241C15] font-bold">{filteredMovements.length}</span> movimientos (Página {currentPage} de {totalPages})
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 p-0 cursor-pointer shadow-2xs ${
                      currentPage === page 
                        ? "bg-[#241C15] text-white hover:bg-[#3D332A] font-bold" 
                        : "border-[#E2D9CC] bg-[#FFFFFF] text-[#75695D] hover:bg-[#EAE4DC] hover:text-[#241C15]"
                    }`}
                  >
                    {page}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer shadow-2xs"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
