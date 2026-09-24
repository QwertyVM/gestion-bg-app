'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Search, 
  X, 
  Wrench, 
  ShoppingBag, 
  Truck, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Calendar, 
  BarChart3,
  Eye,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Sparkles,
  ChevronRight,
  Receipt,
  Layers,
  History,
  HelpCircle,
  CalendarDays,
  Filter,
  Check,
  CheckSquare,
  Square,
  SlidersHorizontal,
  Package,
  Megaphone,
  Boxes
} from 'lucide-react'
import { 
  ComposedChart, 
  Bar, 
  Line, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts'
import { formatDate } from '@/lib/utils'

export interface EgresoItem {
  id: string
  persona: string
  categoria: 'ACTIVO_FIJO' | 'INSUMO' | 'SERVICIO' | 'APORTE_CAPITAL'
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

export interface CobranzaRecibidaItem {
  id: string
  ventaId: string
  cliente: string
  modelo: string
  cantidad: number
  monto: number
  fechaPago: string
  metodoPago: string
  tipo: string
  notas?: string | null
  mesOrigenVenta: string
  esDeMesAnterior: boolean
}

export interface ClienteCarteraDetalle {
  ventaId: string
  cliente: string
  modelo: string
  cantidad: number
  totalFacturado: number
  cobradoEnMesOrigen: number
  saldoPendienteAlCierre: number
  cobradoPosterior: number
  saldoPendienteHoy: number
  pagosRealizados: Array<{
    fecha: string
    monto: number
    metodo: string
    tipo: string
  }>
}

export interface MonthlyMovimiento {
  id: string
  fecha: string
  tipo: string
  categoria: string
  subcategoria: string
  concepto: string
  entidad: string
  monto: number
  esIngreso: boolean
  esActivoFijo?: boolean
  incluidoEnCalculo: boolean
  detalle?: string
}

export interface MonthlyCashflowItem {
  monthKey: string // "2026-08"
  nombreMes: string // "Agosto 2026"
  mesCorto: string // "Ago 26"
  anio: number
  numeroMes: number
  esMesActual: boolean
  
  // Facturación de Ventas
  totalFacturadoVentas: number
  cantidadPedidos: number
  cobradoVentasEnMesOrigen: number
  saldoFaltoCobrarAlCierre: number
  recuperadoEnMesesPosteriores: number
  saldoPendienteCobrarHoy: number
  efectividadCobroMesOrigenPct: number
  clientesCartera: ClienteCarteraDetalle[]
  cobranzasRecaudadasEnMes: CobranzaRecibidaItem[]
  
  // Totales Dinámicos según Checklist Activo
  ingresosTotalesCalculados: number
  egresosTotalesCalculados: number
  flujoNetoCalculado: number
  margenCalculadoPct: number

  // Desgloses Reales
  ingresosVentasCobradas: number
  ingresosDirectosDetalle: Record<string, number>
  egresosInsumosDetalle: Record<string, number>
  egresosServiciosDetalle: Record<string, number>
  egresosActivosFijosDetalle: Record<string, number>
  
  // Lista de Movimientos
  movimientos: MonthlyMovimiento[]
}

interface HistoricoMensualClientProps {
  egresos: EgresoItem[]
  ventas: VentaItem[]
  ingresosDirectos?: IngresoDirectoItem[]
}

// Tooltip para el Gráfico Multidimensional
function CustomMonthlyChartTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    const ingresos = Number(data.ingresosTotalesCalculados || 0)
    const egresos = Number(data.egresosTotalesCalculados || 0)
    const faltoCobrar = Number(data.saldoFaltoCobrarAlCierre || 0)
    const neto = Number(data.flujoNetoCalculado || 0)
    const isNetPositive = neto >= 0

    return (
      <div className="bg-[#FFFFFF]/95 backdrop-blur-md border border-[#E2D9CC] p-4 rounded-2xl shadow-xl min-w-[270px] text-xs font-sans">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2D9CC]/70">
          <span className="font-bold text-[#241C15] flex items-center gap-1.5 text-xs">
            <Calendar className="h-3.5 w-3.5 text-[#A36F4C]" />
            {data.nombreMes || label}
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
              Ingresos Seleccionados:
            </span>
            <span className="font-mono font-bold">+S/ {ingresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          <div className="flex justify-between items-center text-[#A36F4C] font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#A36F4C]" />
              Egresos Seleccionados:
            </span>
            <span className="font-mono font-bold">-S/ {egresos.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>

          {faltoCobrar > 0 && (
            <div className="flex justify-between items-center text-[#8C6D1F] font-medium pt-1 border-t border-dashed border-[#E2D9CC]">
              <span className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 text-[#8C6D1F]" />
                Faltó cobrar al cierre:
              </span>
              <span className="font-mono font-bold text-[#8C6D1F]">S/ {faltoCobrar.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}

          <div className="pt-2 mt-2 border-t border-[#E2D9CC] flex justify-between items-center bg-[#FAF8F5] p-2 rounded-xl">
            <span className="font-bold text-[#241C15] flex items-center gap-1">
              <DollarSign className="h-3.5 w-3.5 text-[#1E5E3A]" />
              Flujo Neto Resultante:
            </span>
            <span className={`font-mono font-extrabold text-sm ${isNetPositive ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
              {isNetPositive ? `+S/ ${neto.toFixed(2)}` : `-S/ ${Math.abs(neto).toFixed(2)}`}
            </span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

export function HistoricoMensualClient({
  egresos,
  ventas,
  ingresosDirectos = []
}: HistoricoMensualClientProps) {
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>('TODOS')
  const [selectedMonthDetail, setSelectedMonthDetail] = useState<MonthlyCashflowItem | null>(null)
  const [modalCategoryFilter, setModalCategoryFilter] = useState<'TODOS' | 'INGRESOS' | 'EGRESOS' | 'CARTERA_COBRANZAS'>('TODOS')
  const [modalSearch, setModalSearch] = useState('')
  const [showFiltersPanel, setShowFiltersPanel] = useState(false)

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // =========================================================================
  // 1. DESCUBRIMIENTO DINÁMICO 100% REAL DE TAGS Y CATEGORÍAS EN LA BASE DE DATOS
  // =========================================================================
  const availableTags = useMemo(() => {
    // Categorías reales de ingresos directos en la BD
    const ingresosDirectosCats = Array.from(
      new Set(ingresosDirectos.map(i => (i.categoria || 'Sin categoría').trim()))
    ).filter(Boolean)

    // Subcategorías reales de insumos en la BD
    const insumosSubcats = Array.from(
      new Set(egresos.filter(e => e.categoria === 'INSUMO').map(e => (e.subcategoria || 'Sin subcategoría').trim()))
    ).filter(Boolean)

    // Subcategorías reales de servicios en la BD
    const serviciosSubcats = Array.from(
      new Set(egresos.filter(e => e.categoria === 'SERVICIO').map(e => (e.subcategoria || 'Sin subcategoría').trim()))
    ).filter(Boolean)

    // Subcategorías reales de activos fijos en la BD
    const activosFijosSubcats = Array.from(
      new Set(egresos.filter(e => e.categoria === 'ACTIVO_FIJO').map(e => (e.subcategoria || 'Sin subcategoría').trim()))
    ).filter(Boolean)

    // Aportes de capital si existen
    const hasAportesCapital = egresos.some(e => e.categoria === 'APORTE_CAPITAL')

    // Totales históricos reales por tag
    const totalVentasCobrado = ventas.reduce((sum, v) => {
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        return sum + v.pagos.reduce((pSum, p) => pSum + (Number(p.monto) || 0), 0)
      }
      return sum + (Number(v.montoPagado) || 0)
    }, 0)

    const ingresosDirectosTotales: Record<string, number> = {}
    ingresosDirectos.forEach(i => {
      const k = (i.categoria || 'Sin categoría').trim()
      ingresosDirectosTotales[k] = (ingresosDirectosTotales[k] || 0) + Number(i.monto)
    })

    const insumosTotales: Record<string, number> = {}
    const serviciosTotales: Record<string, number> = {}
    const activosFijosTotales: Record<string, number> = {}

    egresos.forEach(e => {
      const k = (e.subcategoria || 'Sin subcategoría').trim()
      const c = Number(e.costoTotal) || 0
      if (e.categoria === 'INSUMO') insumosTotales[k] = (insumosTotales[k] || 0) + c
      if (e.categoria === 'SERVICIO') serviciosTotales[k] = (serviciosTotales[k] || 0) + c
      if (e.categoria === 'ACTIVO_FIJO') activosFijosTotales[k] = (activosFijosTotales[k] || 0) + c
    })

    return {
      ingresosDirectosCats,
      insumosSubcats,
      serviciosSubcats,
      activosFijosSubcats,
      hasAportesCapital,
      totalVentasCobrado,
      ingresosDirectosTotales,
      insumosTotales,
      serviciosTotales,
      activosFijosTotales
    }
  }, [ingresosDirectos, egresos, ventas])

  // =========================================================================
  // 2. ESTADO DEL CHECKLIST BASADO ESTRICTAMENTE EN DATOS REALES
  // =========================================================================
  const [includeVentas, setIncludeVentas] = useState<boolean>(true)
  
  // Categorías de ingresos directos seleccionadas (por defecto solo ventas directas/servicios, préstamos apagado)
  const [selectedIngresoCats, setSelectedIngresoCats] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    availableTags.ingresosDirectosCats.forEach(cat => {
      const isLoan = cat.toLowerCase().includes('préstamo') || cat.toLowerCase().includes('prestamo')
      init[cat] = !isLoan // Préstamos apagados por defecto en flujo operativo
    })
    return init
  })

  // Subcategorías de Insumos seleccionadas (todas activas por defecto)
  const [selectedInsumos, setSelectedInsumos] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    availableTags.insumosSubcats.forEach(sub => { init[sub] = true })
    return init
  })

  // Subcategorías de Servicios seleccionadas (todas activas por defecto)
  const [selectedServicios, setSelectedServicios] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    availableTags.serviciosSubcats.forEach(sub => { init[sub] = true })
    return init
  })

  // Subcategorías de Activos Fijos seleccionadas (apagadas por defecto para flujo operativo)
  const [selectedActivosFijos, setSelectedActivosFijos] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {}
    availableTags.activosFijosSubcats.forEach(sub => { init[sub] = false })
    return init
  })

  const [includeAportesCapital, setIncludeAportesCapital] = useState<boolean>(false)

  // Presets Rápidos
  const applyPreset = (preset: 'OPERATIVO' | 'TOTAL_CON_MAQUINARIA' | 'SOLO_VENTAS_INSUMOS' | 'TODO_MARCADO' | 'LIMPIAR') => {
    if (preset === 'OPERATIVO') {
      setIncludeVentas(true)
      const ings: Record<string, boolean> = {}
      availableTags.ingresosDirectosCats.forEach(c => {
        ings[c] = !(c.toLowerCase().includes('préstamo') || c.toLowerCase().includes('prestamo'))
      })
      setSelectedIngresoCats(ings)

      const ins: Record<string, boolean> = {}
      availableTags.insumosSubcats.forEach(s => { ins[s] = true })
      setSelectedInsumos(ins)

      const srv: Record<string, boolean> = {}
      availableTags.serviciosSubcats.forEach(s => { srv[s] = true })
      setSelectedServicios(srv)

      const af: Record<string, boolean> = {}
      availableTags.activosFijosSubcats.forEach(s => { af[s] = false })
      setSelectedActivosFijos(af)
      setIncludeAportesCapital(false)
    } else if (preset === 'TOTAL_CON_MAQUINARIA') {
      setIncludeVentas(true)
      const ings: Record<string, boolean> = {}
      availableTags.ingresosDirectosCats.forEach(c => { ings[c] = true })
      setSelectedIngresoCats(ings)

      const ins: Record<string, boolean> = {}
      availableTags.insumosSubcats.forEach(s => { ins[s] = true })
      setSelectedInsumos(ins)

      const srv: Record<string, boolean> = {}
      availableTags.serviciosSubcats.forEach(s => { srv[s] = true })
      setSelectedServicios(srv)

      const af: Record<string, boolean> = {}
      availableTags.activosFijosSubcats.forEach(s => { af[s] = true })
      setSelectedActivosFijos(af)
      setIncludeAportesCapital(true)
    } else if (preset === 'SOLO_VENTAS_INSUMOS') {
      setIncludeVentas(true)
      const ings: Record<string, boolean> = {}
      availableTags.ingresosDirectosCats.forEach(c => { ings[c] = false })
      setSelectedIngresoCats(ings)

      const ins: Record<string, boolean> = {}
      availableTags.insumosSubcats.forEach(s => { ins[s] = true })
      setSelectedInsumos(ins)

      const srv: Record<string, boolean> = {}
      availableTags.serviciosSubcats.forEach(s => { srv[s] = false })
      setSelectedServicios(srv)

      const af: Record<string, boolean> = {}
      availableTags.activosFijosSubcats.forEach(s => { af[s] = false })
      setSelectedActivosFijos(af)
      setIncludeAportesCapital(false)
    } else if (preset === 'TODO_MARCADO') {
      setIncludeVentas(true)
      const ings: Record<string, boolean> = {}
      availableTags.ingresosDirectosCats.forEach(c => { ings[c] = true })
      setSelectedIngresoCats(ings)

      const ins: Record<string, boolean> = {}
      availableTags.insumosSubcats.forEach(s => { ins[s] = true })
      setSelectedInsumos(ins)

      const srv: Record<string, boolean> = {}
      availableTags.serviciosSubcats.forEach(s => { srv[s] = true })
      setSelectedServicios(srv)

      const af: Record<string, boolean> = {}
      availableTags.activosFijosSubcats.forEach(s => { af[s] = true })
      setSelectedActivosFijos(af)
      setIncludeAportesCapital(true)
    } else if (preset === 'LIMPIAR') {
      setIncludeVentas(false)
      const ings: Record<string, boolean> = {}
      availableTags.ingresosDirectosCats.forEach(c => { ings[c] = false })
      setSelectedIngresoCats(ings)

      const ins: Record<string, boolean> = {}
      availableTags.insumosSubcats.forEach(s => { ins[s] = false })
      setSelectedInsumos(ins)

      const srv: Record<string, boolean> = {}
      availableTags.serviciosSubcats.forEach(s => { srv[s] = false })
      setSelectedServicios(srv)

      const af: Record<string, boolean> = {}
      availableTags.activosFijosSubcats.forEach(s => { af[s] = false })
      setSelectedActivosFijos(af)
      setIncludeAportesCapital(false)
    }
  }

  // =========================================================================
  // 3. MODELADO CONTABLE Y RECALCULOS DINÁMICOS MES A MES
  // =========================================================================
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, MonthlyCashflowItem> = {}

    const getMonthKey = (dateStr: string) => {
      if (!dateStr) return '2026-08'
      const d = new Date(dateStr)
      if (isNaN(d.getTime())) return dateStr.slice(0, 7)
      const y = d.getFullYear()
      const m = String(d.getMonth() + 1).padStart(2, '0')
      return `${y}-${m}`
    }

    const monthNames: Record<string, string> = {
      '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril',
      '05': 'Mayo', '06': 'Junio', '07': 'Julio', '08': 'Agosto',
      '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
    }

    const monthShorts: Record<string, string> = {
      '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
      '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
      '09': 'Set', '10': 'Oct', '11': 'Nov', '12': 'Dic'
    }

    const nowStr = new Date().toISOString().slice(0, 7)

    const ensureMonth = (key: string): MonthlyCashflowItem => {
      if (!monthMap[key]) {
        const [yearStr, mStr] = key.split('-')
        const anio = parseInt(yearStr, 10) || 2026
        const numeroMes = parseInt(mStr, 10) || 8
        const nombre = `${monthNames[mStr] || mStr} ${anio}`
        const corto = `${monthShorts[mStr] || mStr} ${yearStr.slice(-2)}`

        monthMap[key] = {
          monthKey: key,
          nombreMes: nombre,
          mesCorto: corto,
          anio,
          numeroMes,
          esMesActual: key === nowStr,
          
          totalFacturadoVentas: 0,
          cantidadPedidos: 0,
          cobradoVentasEnMesOrigen: 0,
          saldoFaltoCobrarAlCierre: 0,
          recuperadoEnMesesPosteriores: 0,
          saldoPendienteCobrarHoy: 0,
          efectividadCobroMesOrigenPct: 0,
          clientesCartera: [],
          cobranzasRecaudadasEnMes: [],
          
          ingresosTotalesCalculados: 0,
          egresosTotalesCalculados: 0,
          flujoNetoCalculado: 0,
          margenCalculadoPct: 0,
          
          ingresosVentasCobradas: 0,
          ingresosDirectosDetalle: {},
          egresosInsumosDetalle: {},
          egresosServiciosDetalle: {},
          egresosActivosFijosDetalle: {},
          
          movimientos: []
        }
      }
      return monthMap[key]
    }

    // 1. PROCESAR VENTAS Y CARTERA POR COBRAR
    ventas.forEach(v => {
      const vMonthKey = getMonthKey(v.fecha)
      const vMonth = ensureMonth(vMonthKey)
      const totalVenta = Number(v.total)
      vMonth.totalFacturadoVentas += totalVenta
      vMonth.cantidadPedidos += 1

      const pagosArray = Array.isArray(v.pagos) ? v.pagos : []
      const pagosMesOrigen = pagosArray.filter(p => getMonthKey(p.fecha) === vMonthKey)
      const sumPagosMesOrigen = pagosMesOrigen.reduce((s, p) => s + Number(p.monto), 0)
      const cobradoEnOrigen = pagosArray.length > 0 ? sumPagosMesOrigen : Number(v.montoPagado)

      const pagosPosteriores = pagosArray.filter(p => getMonthKey(p.fecha) > vMonthKey)
      const sumPagosPosteriores = pagosPosteriores.reduce((s, p) => s + Number(p.monto), 0)

      const faltoCobrarAlCierre = Math.max(0, totalVenta - cobradoEnOrigen)
      const saldoRestanteHoy = Number(v.saldoPendiente)

      vMonth.cobradoVentasEnMesOrigen += cobradoEnOrigen
      vMonth.saldoFaltoCobrarAlCierre += faltoCobrarAlCierre
      vMonth.recuperadoEnMesesPosteriores += sumPagosPosteriores
      vMonth.saldoPendienteCobrarHoy += saldoRestanteHoy

      if (faltoCobrarAlCierre > 0 || pagosPosteriores.length > 0) {
        vMonth.clientesCartera.push({
          ventaId: v.id,
          cliente: v.cliente,
          modelo: v.producto?.nombreModelo || 'Modelo 3D',
          cantidad: Number(v.cantidad),
          totalFacturado: totalVenta,
          cobradoEnMesOrigen: cobradoEnOrigen,
          saldoPendienteAlCierre: faltoCobrarAlCierre,
          cobradoPosterior: sumPagosPosteriores,
          saldoPendienteHoy: saldoRestanteHoy,
          pagosRealizados: pagosArray.map(p => ({
            fecha: p.fecha,
            monto: Number(p.monto),
            metodo: p.metodoPago || 'YAPE',
            tipo: p.tipo || 'ABONO'
          }))
        })
      }
    })

    // 2. PROCESAR COBRANZAS DE VENTAS EN CAJA EFECTIVA
    ventas.forEach((v, vIdx) => {
      const vMonthKey = getMonthKey(v.fecha)
      const codigo = (v as any).codigo || `PED-${String(ventas.length - vIdx).padStart(3, '0')}`
      if (Array.isArray(v.pagos) && v.pagos.length > 0) {
        v.pagos.forEach((p, idx) => {
          if (p.monto > 0) {
            const pMonthKey = getMonthKey(p.fecha)
            const pMonth = ensureMonth(pMonthKey)
            const monto = Number(p.monto)
            
            pMonth.ingresosVentasCobradas += monto
            if (includeVentas) {
              pMonth.ingresosTotalesCalculados += monto
            }

            pMonth.cobranzasRecaudadasEnMes.push({
              id: p.id || `${v.id}-${idx}`,
              ventaId: v.id,
              cliente: v.cliente,
              modelo: v.producto?.nombreModelo || 'Modelo 3D',
              cantidad: Number(v.cantidad),
              monto,
              fechaPago: p.fecha,
              metodoPago: p.metodoPago || 'YAPE',
              tipo: p.tipo || 'ABONO',
              notas: p.notas,
              mesOrigenVenta: vMonthKey,
              esDeMesAnterior: vMonthKey < pMonthKey
            })

            const isSingleFull = ((v.pagos?.length || 0) === 1 && v.saldoPendiente <= 0) || p.tipo === 'PAGO_TOTAL'
            const numAbono = idx + 1
            const tipoLabel = isSingleFull ? 'Pago Total' : `Abono #${numAbono}`
            const concepto = isSingleFull
              ? `Pago Total del pedido ${codigo}: ${v.producto?.nombreModelo || 'Producto 3D'} (x${v.cantidad})`
              : `Abono número ${numAbono} del pedido ${codigo}: ${v.producto?.nombreModelo || 'Producto 3D'} (x${v.cantidad})`

            pMonth.movimientos.push({
              id: `pago-${p.id || `${v.id}-${idx}`}`,
              fecha: p.fecha,
              tipo: 'INGRESO_VENTA',
              categoria: 'Ventas de Pedidos 3D',
              subcategoria: 'Cobranza de Pedidos',
              concepto,
              entidad: v.cliente,
              monto,
              esIngreso: true,
              incluidoEnCalculo: includeVentas,
              detalle: `${p.metodoPago || 'Yape'}${p.notas ? ` • ${p.notas}` : ''}${vMonthKey < pMonthKey ? ` (Pedido originado en ${monthNames[vMonthKey.split('-')[1]]})` : ''}`
            })
          }
        })
      } else if (v.montoPagado > 0) {
        const vMonth = ensureMonth(vMonthKey)
        const monto = Number(v.montoPagado)
        
        vMonth.ingresosVentasCobradas += monto
        if (includeVentas) {
          vMonth.ingresosTotalesCalculados += monto
        }

        vMonth.cobranzasRecaudadasEnMes.push({
          id: `v-${v.id}`,
          ventaId: v.id,
          cliente: v.cliente,
          modelo: v.producto?.nombreModelo || 'Modelo 3D',
          cantidad: Number(v.cantidad),
          monto,
          fechaPago: v.fecha,
          metodoPago: 'PAGO_DIRECTO',
          tipo: 'PAGO_TOTAL',
          mesOrigenVenta: vMonthKey,
          esDeMesAnterior: false
        })

        vMonth.movimientos.push({
          id: `v-${v.id}`,
          fecha: v.fecha,
          tipo: 'INGRESO_VENTA',
          categoria: 'Ventas de Pedidos 3D',
          subcategoria: 'Venta Directa',
          concepto: `Venta: ${v.producto?.nombreModelo || 'Producto 3D'} (x${v.cantidad})`,
          entidad: v.cliente,
          monto,
          esIngreso: true,
          incluidoEnCalculo: includeVentas,
          detalle: 'Pago registrado al crear pedido'
        })
      }
    })

    // 3. PROCESAR INGRESOS DIRECTOS DE BD
    ingresosDirectos.forEach(i => {
      if (i.monto > 0) {
        const iMonthKey = getMonthKey(i.fecha)
        const iMonth = ensureMonth(iMonthKey)
        const monto = Number(i.monto)
        const catName = (i.categoria || 'Sin categoría').trim()

        iMonth.ingresosDirectosDetalle[catName] = (iMonth.ingresosDirectosDetalle[catName] || 0) + monto
        const isIncluded = Boolean(selectedIngresoCats[catName])

        if (isIncluded) {
          iMonth.ingresosTotalesCalculados += monto
        }

        iMonth.movimientos.push({
          id: `ing-${i.id}`,
          fecha: i.fecha,
          tipo: 'INGRESO_DIRECTO',
          categoria: catName,
          subcategoria: catName,
          concepto: i.concepto,
          entidad: i.cliente || 'Taller',
          monto,
          esIngreso: true,
          incluidoEnCalculo: isIncluded,
          detalle: i.notas || i.metodoPago || undefined
        })
      }
    })

    // 4. PROCESAR EGRESOS DE BD
    egresos.forEach(e => {
      if (e.costoTotal > 0) {
        const eMonthKey = getMonthKey(e.createdAt)
        const eMonth = ensureMonth(eMonthKey)
        const costo = Number(e.costoTotal)
        const subName = (e.subcategoria || 'Sin subcategoría').trim()

        let isIncluded = false

        if (e.categoria === 'INSUMO') {
          eMonth.egresosInsumosDetalle[subName] = (eMonth.egresosInsumosDetalle[subName] || 0) + costo
          isIncluded = Boolean(selectedInsumos[subName])
        } else if (e.categoria === 'SERVICIO') {
          eMonth.egresosServiciosDetalle[subName] = (eMonth.egresosServiciosDetalle[subName] || 0) + costo
          isIncluded = Boolean(selectedServicios[subName])
        } else if (e.categoria === 'ACTIVO_FIJO') {
          eMonth.egresosActivosFijosDetalle[subName] = (eMonth.egresosActivosFijosDetalle[subName] || 0) + costo
          isIncluded = Boolean(selectedActivosFijos[subName])
        } else if (e.categoria === 'APORTE_CAPITAL') {
          isIncluded = includeAportesCapital
        }

        if (isIncluded) {
          eMonth.egresosTotalesCalculados += costo
        }

        eMonth.movimientos.push({
          id: `eg-${e.id}`,
          fecha: e.createdAt,
          tipo: `EGRESO_${e.categoria}`,
          categoria: e.categoria === 'ACTIVO_FIJO' ? 'Activo Fijo' : e.categoria === 'INSUMO' ? 'Insumo' : 'Servicio',
          subcategoria: subName,
          concepto: e.itemConcepto,
          entidad: e.persona || 'Taller',
          monto: costo,
          esIngreso: false,
          esActivoFijo: e.categoria === 'ACTIVO_FIJO',
          incluidoEnCalculo: isIncluded,
          detalle: e.subcategoria ? `Tag: ${e.subcategoria}` : undefined
        })
      }
    })

    // Ordenar cronológicamente
    const sorted = Object.values(monthMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey))

    // 5. CÁLCULO FINAL DE RATIOS
    sorted.forEach(m => {
      m.flujoNetoCalculado = Number((m.ingresosTotalesCalculados - m.egresosTotalesCalculados).toFixed(2))
      m.margenCalculadoPct = m.ingresosTotalesCalculados > 0
        ? Math.round((m.flujoNetoCalculado / m.ingresosTotalesCalculados) * 100)
        : 0

      m.efectividadCobroMesOrigenPct = m.totalFacturadoVentas > 0
        ? Number(((m.cobradoVentasEnMesOrigen / m.totalFacturadoVentas) * 100).toFixed(1))
        : 100

      m.movimientos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    })

    return sorted
  }, [
    ventas, 
    ingresosDirectos, 
    egresos, 
    includeVentas, 
    selectedIngresoCats, 
    selectedInsumos, 
    selectedServicios, 
    selectedActivosFijos, 
    includeAportesCapital
  ])

  // Métricas Consolidadas Históricas Globales
  const metricasHistoricas = useMemo(() => {
    const totalMeses = Math.max(1, monthlyData.length)
    const sumaFacturado = monthlyData.reduce((sum, m) => sum + m.totalFacturadoVentas, 0)
    const sumaIngresosCalculados = monthlyData.reduce((sum, m) => sum + m.ingresosTotalesCalculados, 0)
    const sumaEgresosCalculados = monthlyData.reduce((sum, m) => sum + m.egresosTotalesCalculados, 0)
    const sumaFlujoNetoCalculado = sumaIngresosCalculados - sumaEgresosCalculados
    const margenGlobal = sumaIngresosCalculados > 0 ? (sumaFlujoNetoCalculado / sumaIngresosCalculados) * 100 : 0
    const sumaSaldoPendienteActual = monthlyData.reduce((sum, m) => sum + m.saldoPendienteCobrarHoy, 0)

    const activeIngresosCount = (includeVentas ? 1 : 0) + Object.values(selectedIngresoCats).filter(Boolean).length
    const activeInsumosCount = Object.values(selectedInsumos).filter(Boolean).length
    const activeServiciosCount = Object.values(selectedServicios).filter(Boolean).length
    const activeActivosFijosCount = Object.values(selectedActivosFijos).filter(Boolean).length

    const totalActiveCount = activeIngresosCount + activeInsumosCount + activeServiciosCount + activeActivosFijosCount + (includeAportesCapital ? 1 : 0)

    return {
      totalMeses,
      sumaFacturado,
      sumaIngresosCalculados,
      sumaEgresosCalculados,
      sumaFlujoNetoCalculado,
      margenGlobal,
      sumaSaldoPendienteActual,
      activeIngresosCount,
      activeInsumosCount,
      activeServiciosCount,
      activeActivosFijosCount,
      totalActiveCount
    }
  }, [
    monthlyData, 
    includeVentas, 
    selectedIngresoCats, 
    selectedInsumos, 
    selectedServicios, 
    selectedActivosFijos, 
    includeAportesCapital
  ])

  const displayedMonths = useMemo(() => {
    if (selectedMonthFilter === 'TODOS') return monthlyData
    return monthlyData.filter(m => m.monthKey === selectedMonthFilter)
  }, [monthlyData, selectedMonthFilter])

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO DEL MÓDULO                                                  */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#241C15] flex items-center gap-2.5">
              <History className="h-6 w-6 sm:h-7 sm:w-7 text-[#A36F4C] flex-shrink-0" />
              <span>Histórico Mensual</span>
            </h1>
            <span className="text-xs font-bold text-[#1E5E3A] font-mono bg-[#EBF7EE] border border-[#B4E3C0] px-2.5 py-0.5 rounded-full">
              {metricasHistoricas.totalActiveCount} partidas activas
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#75695D] mt-1">
            Evolución de flujo de caja, ingresos cobrados, egresos totales y rentabilidad operativa mes a mes.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFiltersPanel(!showFiltersPanel)}
            className={`h-9 px-3.5 text-xs font-bold rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all ${
              showFiltersPanel
                ? 'bg-[#241C15] text-white border-[#241C15]'
                : 'border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-[#241C15]'
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>{showFiltersPanel ? 'Ocultar Filtros' : 'Filtros Contables'}</span>
          </Button>

          {/* Selector de Mes */}
          <div className="flex items-center gap-1.5 bg-[#FFFFFF] border border-[#E2D9CC] rounded-xl px-3 py-1.5 shadow-2xs">
            <Filter className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span className="text-xs font-semibold text-[#75695D]">Mes:</span>
            <select
              value={selectedMonthFilter}
              onChange={(e) => setSelectedMonthFilter(e.target.value)}
              className="text-xs font-bold text-[#241C15] bg-transparent border-none outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los Meses ({monthlyData.length})</option>
              {monthlyData.map(m => (
                <option key={m.monthKey} value={m.monthKey}>{m.nombreMes}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CHECKLIST 100% REAL DE CONCEPTOS Y TAGS DE LA BASE DE DATOS            */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* 2. CHECKLIST 100% REAL DE CONCEPTOS Y TAGS DE LA BASE DE DATOS            */}
      {/* ========================================================================= */}
      {showFiltersPanel && (
        <div className="bg-white border border-[#E2D9CC] rounded-3xl p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Cabecera del Panel con Presets */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#E2D9CC]/70">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-[#FAF8F5] text-[#A36F4C] border border-[#E2D9CC]">
                  <SlidersHorizontal className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-[#241C15]">
                    Checklist de Partidas Contables
                  </h2>
                  <p className="text-xs text-[#75695D] mt-0.5">
                    Selecciona qué conceptos sumar a los indicadores dinámicos y métricas del taller.
                  </p>
                </div>
              </div>
            </div>

            {/* Presets Rápidos */}
            <div className="flex flex-wrap items-center gap-1.5 self-start lg:self-auto">
              <span className="text-xs font-bold text-[#75695D] mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => applyPreset('OPERATIVO')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#EBF7EE] text-[#1E5E3A] hover:bg-[#D7EFE0] border border-[#B4E3C0] transition-all cursor-pointer active:scale-95"
              >
                Operativo
              </button>
              <button
                type="button"
                onClick={() => applyPreset('TOTAL_CON_MAQUINARIA')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#633E20] hover:bg-[#F4EFEA] border border-[#E2D9CC] transition-all cursor-pointer active:scale-95"
              >
                + Activos Fijos
              </button>
              <button
                type="button"
                onClick={() => applyPreset('SOLO_VENTAS_INSUMOS')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-[#FAF8F5] text-[#241C15] hover:bg-[#F4EFEA] border border-[#E2D9CC] transition-all cursor-pointer active:scale-95"
              >
                Ventas vs Insumos
              </button>
              <button
                type="button"
                onClick={() => applyPreset('TODO_MARCADO')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#75695D] hover:text-[#241C15] hover:bg-[#FAF8F5] border border-transparent hover:border-[#E2D9CC] transition-all cursor-pointer active:scale-95"
              >
                Marcar Todos
              </button>
              <button
                type="button"
                onClick={() => applyPreset('LIMPIAR')}
                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-[#A34335] hover:bg-red-50 border border-transparent hover:border-red-200 transition-all cursor-pointer active:scale-95"
              >
                Limpiar
              </button>
            </div>
          </div>

          {/* Grid de 4 Columnas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* 1. INGRESOS */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]/70">
                  <span className="text-xs font-black text-[#1E5E3A] uppercase tracking-wider flex items-center gap-1.5">
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Ingresos
                  </span>
                  <span className="text-[10px] font-bold font-mono text-[#1E5E3A] bg-[#EBF7EE] border border-[#B4E3C0] px-1.5 py-0.2 rounded-md">
                    {(includeVentas ? 1 : 0) + Object.values(selectedIngresoCats).filter(Boolean).length} activos
                  </span>
                </div>

                <div className="space-y-1.5 mt-2.5 text-xs">
                  {/* Ventas Pedidos 3D */}
                  <div
                    onClick={() => setIncludeVentas(!includeVentas)}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                      includeVentas
                        ? 'bg-white border-[#E2D9CC] shadow-2xs'
                        : 'bg-transparent border-transparent hover:bg-white/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                        includeVentas ? 'bg-[#1E5E3A] border-[#1E5E3A] text-white' : 'bg-white border-[#D4BEA7]'
                      }`}>
                        {includeVentas && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span className="font-bold text-[#241C15] truncate">Ventas (Pedidos 3D)</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#1E5E3A] shrink-0">
                      {formatCurrency(availableTags.totalVentasCobrado)}
                    </span>
                  </div>

                  {/* Categorías Directas */}
                  {availableTags.ingresosDirectosCats.map(cat => {
                    const isChecked = Boolean(selectedIngresoCats[cat])
                    return (
                      <div
                        key={cat}
                        onClick={() => setSelectedIngresoCats(prev => ({ ...prev, [cat]: !prev[cat] }))}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-white border-[#E2D9CC] shadow-2xs'
                            : 'bg-transparent border-transparent hover:bg-white/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            isChecked ? 'bg-[#1E5E3A] border-[#1E5E3A] text-white' : 'bg-white border-[#D4BEA7]'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-[#241C15] truncate">{cat}</span>
                        </div>
                        <span className="font-mono font-semibold text-xs text-[#1E5E3A] shrink-0">
                          {formatCurrency(availableTags.ingresosDirectosTotales[cat] || 0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 2. INSUMOS */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]/70">
                  <span className="text-xs font-black text-[#A36F4C] uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    Insumos
                  </span>
                  <span className="text-[10px] font-bold font-mono text-[#A36F4C] bg-[#FAF8F5] border border-[#E2D9CC] px-1.5 py-0.2 rounded-md">
                    {Object.values(selectedInsumos).filter(Boolean).length} / {availableTags.insumosSubcats.length}
                  </span>
                </div>

                <div className="space-y-1.5 mt-2.5 text-xs max-h-56 overflow-y-auto pr-0.5 scrollbar-thin">
                  {availableTags.insumosSubcats.map(sub => {
                    const isChecked = Boolean(selectedInsumos[sub])
                    return (
                      <div
                        key={sub}
                        onClick={() => setSelectedInsumos(prev => ({ ...prev, [sub]: !prev[sub] }))}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-white border-[#E2D9CC] shadow-2xs'
                            : 'bg-transparent border-transparent hover:bg-white/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            isChecked ? 'bg-[#A36F4C] border-[#A36F4C] text-white' : 'bg-white border-[#D4BEA7]'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-[#241C15] truncate">{sub}</span>
                        </div>
                        <span className="font-mono text-xs text-[#A36F4C] shrink-0">
                          {formatCurrency(availableTags.insumosTotales[sub] || 0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 3. SERVICIOS */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]/70">
                  <span className="text-xs font-black text-[#A36F4C] uppercase tracking-wider flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    Servicios
                  </span>
                  <span className="text-[10px] font-bold font-mono text-[#A36F4C] bg-[#FAF8F5] border border-[#E2D9CC] px-1.5 py-0.2 rounded-md">
                    {Object.values(selectedServicios).filter(Boolean).length} / {availableTags.serviciosSubcats.length}
                  </span>
                </div>

                <div className="space-y-1.5 mt-2.5 text-xs">
                  {availableTags.serviciosSubcats.map(sub => {
                    const isChecked = Boolean(selectedServicios[sub])
                    return (
                      <div
                        key={sub}
                        onClick={() => setSelectedServicios(prev => ({ ...prev, [sub]: !prev[sub] }))}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-white border-[#E2D9CC] shadow-2xs'
                            : 'bg-transparent border-transparent hover:bg-white/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            isChecked ? 'bg-[#A36F4C] border-[#A36F4C] text-white' : 'bg-white border-[#D4BEA7]'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="font-semibold text-[#241C15] truncate">{sub}</span>
                        </div>
                        <span className="font-mono text-xs text-[#A36F4C] shrink-0">
                          {formatCurrency(availableTags.serviciosTotales[sub] || 0)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* 4. ACTIVOS FIJOS (CAPEX) */}
            <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-2.5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]/70">
                  <span className="text-xs font-black text-[#633E20] uppercase tracking-wider flex items-center gap-1.5">
                    <Wrench className="h-3.5 w-3.5" />
                    Activos Fijos (CAPEX)
                  </span>
                  <span className="text-[10px] font-bold font-mono text-[#633E20] bg-[#EFE5D8] border border-[#D4BEA7] px-1.5 py-0.2 rounded-md">
                    {Object.values(selectedActivosFijos).filter(Boolean).length} / {availableTags.activosFijosSubcats.length}
                  </span>
                </div>

                <div className="space-y-1.5 mt-2.5 text-xs">
                  {availableTags.activosFijosSubcats.map(sub => {
                    const isChecked = Boolean(selectedActivosFijos[sub])
                    return (
                      <div
                        key={sub}
                        onClick={() => setSelectedActivosFijos(prev => ({ ...prev, [sub]: !prev[sub] }))}
                        className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                          isChecked
                            ? 'bg-white border-[#D4BEA7] shadow-2xs text-[#633E20]'
                            : 'bg-transparent border-transparent hover:bg-white/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                            isChecked ? 'bg-[#633E20] border-[#633E20] text-white' : 'bg-white border-[#D4BEA7]'
                          }`}>
                            {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                          <span className="font-bold text-[#241C15] truncate">{sub}</span>
                        </div>
                        <span className="font-mono font-bold text-xs text-[#633E20] shrink-0">
                          {formatCurrency(availableTags.activosFijosTotales[sub] || 0)}
                        </span>
                      </div>
                    )
                  })}

                  {availableTags.hasAportesCapital && (
                    <div
                      onClick={() => setIncludeAportesCapital(!includeAportesCapital)}
                      className={`flex items-center justify-between gap-2 p-2 rounded-xl border transition-all cursor-pointer select-none ${
                        includeAportesCapital
                          ? 'bg-white border-[#D4BEA7] shadow-2xs'
                          : 'bg-transparent border-transparent hover:bg-white/60 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all shrink-0 ${
                          includeAportesCapital ? 'bg-[#633E20] border-[#633E20] text-white' : 'bg-white border-[#D4BEA7]'
                        }`}>
                          {includeAportesCapital && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span className="font-semibold text-[#241C15]">Aportes de Capital</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. INDICADORES DINÁMICOS GLOBALES MINIMALISTAS                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1: Flujo Neto Dinámico Calculado */}
        <div className="bg-white border border-[#E2D9CC] shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Flujo Neto Calculado</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
              <ShieldCheck className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className={`text-xl sm:text-2xl font-black font-mono tabular-nums ${metricasHistoricas.sumaFlujoNetoCalculado >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
              {metricasHistoricas.sumaFlujoNetoCalculado >= 0 ? `+${formatCurrency(metricasHistoricas.sumaFlujoNetoCalculado)}` : formatCurrency(metricasHistoricas.sumaFlujoNetoCalculado)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              Margen resultante: <strong className="text-[#241C15]">{metricasHistoricas.margenGlobal.toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* KPI 2: Ingresos Seleccionados */}
        <div className="bg-white border border-[#E2D9CC] shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Ingresos Seleccionados</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
              <ArrowUpRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-[#241C15] tabular-nums">
              {formatCurrency(metricasHistoricas.sumaIngresosCalculados)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              {metricasHistoricas.activeIngresosCount} conceptos activos
            </span>
          </div>
        </div>

        {/* KPI 3: Egresos Seleccionados */}
        <div className="bg-white border border-[#E2D9CC] shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Egresos Seleccionados</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
              <ArrowDownRight className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-[#944917] tabular-nums">
              {formatCurrency(metricasHistoricas.sumaEgresosCalculados)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              {metricasHistoricas.activeInsumosCount + metricasHistoricas.activeServiciosCount + metricasHistoricas.activeActivosFijosCount} tags activos
            </span>
          </div>
        </div>

        {/* KPI 4: Ventas Facturadas Históricas */}
        <div className="bg-white border border-[#E2D9CC] shadow-xs rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Ventas Facturadas</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#633E20]">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black font-mono text-[#633E20] tabular-nums">
              {formatCurrency(metricasHistoricas.sumaFacturado)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              100% cobrado en caja
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. EVOLUCIÓN HISTÓRICA: GRÁFICO COMBINADO                                 */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2D9CC] rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2D9CC]/70">
          <div>
            <h2 className="text-base font-bold text-[#241C15] flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#A36F4C]" />
              <span>Evolución Mensual: Ingresos vs Egresos vs Flujo Neto</span>
            </h2>
            <p className="text-xs text-[#75695D] mt-0.5">
              Comparativa histórica según las partidas y conceptos activos en el filtro contable.
            </p>
          </div>
          <span className="text-xs font-mono text-[#75695D] self-start sm:self-auto bg-[#FAF8F5] px-2.5 py-1 rounded-xl border border-[#E2D9CC]">
            {monthlyData.length} {monthlyData.length === 1 ? 'mes registrado' : 'meses registrados'}
          </span>
        </div>

        {/* Gráfico Recharts */}
        <div className="h-[280px] sm:h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="flujoSuperavitGradHistDin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1E5E3A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#1E5E3A" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" vertical={false} opacity={0.6} />
              <XAxis 
                dataKey="nombreMes" 
                stroke="#75695D" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#E2D9CC' }}
              />
              <YAxis 
                stroke="#75695D" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#E2D9CC' }}
                tickFormatter={(v) => `S/${v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}`}
              />
              <RechartsTooltip content={<CustomMonthlyChartTooltip />} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                formatter={(value) => (
                  <span className="text-xs font-semibold text-[#241C15] mr-3">
                    {value === 'ingresosTotalesCalculados' ? 'Ingresos Seleccionados (+)' : value === 'egresosTotalesCalculados' ? 'Egresos Seleccionados (-)' : 'Flujo Neto Resultante'}
                  </span>
                )}
              />
              
              <Bar dataKey="ingresosTotalesCalculados" name="ingresosTotalesCalculados" fill="#1E5E3A" radius={[6, 6, 0, 0]} maxBarSize={44} />
              <Bar dataKey="egresosTotalesCalculados" name="egresosTotalesCalculados" fill="#A36F4C" radius={[6, 6, 0, 0]} maxBarSize={44} />

              <Area 
                type="monotone" 
                dataKey="flujoNetoCalculado" 
                stroke="none" 
                fill="url(#flujoSuperavitGradHistDin)" 
                legendType="none" 
                tooltipType="none" 
              />

              <Line 
                type="monotone" 
                dataKey="flujoNetoCalculado" 
                name="flujoNetoCalculado" 
                stroke="#241C15" 
                strokeWidth={2.5}
                dot={{ fill: '#241C15', r: 4, strokeWidth: 2, stroke: '#FFFFFF' }}
                activeDot={{ r: 6, fill: '#1E5E3A', stroke: '#FFFFFF', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. TABLA MATRICIAL MENSUAL (ZERO-SCROLL & EDITORIAL LAYOUT)                */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#E2D9CC] rounded-3xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E2D9CC] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
          <div>
            <h2 className="text-base font-bold text-[#241C15] flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-[#A36F4C]" />
              <span>Libro Mayor & Resultados por Mes</span>
            </h2>
            <p className="text-xs text-[#75695D] mt-0.5">
              Consolidado mensual con desglose contable, efectividad de cobranza y acceso a auditoría de partidas.
            </p>
          </div>

          <span className="text-xs text-[#75695D] font-medium">
            Haz clic en <strong className="text-[#241C15]">Auditar</strong> o en cualquier fila para inspeccionar movimientos.
          </span>
        </div>

        <div className="w-full overflow-x-auto no-scrollbar">
          <Table className="w-full">
            <TableHeader className="bg-[#FAF8F5] border-b border-[#E2D9CC]">
              <TableRow className="border-[#E2D9CC] hover:bg-transparent text-xs font-bold text-[#75695D]">
                <TableHead className="px-4 py-3 text-left">Mes / Período</TableHead>
                <TableHead className="px-3 py-3 text-right text-[#1E5E3A]">Ingresos Cobrados</TableHead>
                <TableHead className="px-3 py-3 text-right text-[#A36F4C]">Insumos & Operación</TableHead>
                <TableHead className="px-3 py-3 text-right text-[#633E20]">Activos Fijos</TableHead>
                <TableHead className="px-3 py-3 text-right font-bold text-[#241C15]">Egresos Totales</TableHead>
                <TableHead className="px-4 py-3 text-right font-bold text-[#1E5E3A]">Flujo Neto</TableHead>
                <TableHead className="px-3 py-3 text-center">Margen</TableHead>
                <TableHead className="px-3 py-3 text-center">Cobranza</TableHead>
                <TableHead className="px-4 py-3 text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedMonths.map((m) => {
                const isPos = m.flujoNetoCalculado >= 0
                const sumaInsumosMes = Object.values(m.egresosInsumosDetalle).reduce((s, v) => s + v, 0) + Object.values(m.egresosServiciosDetalle).reduce((s, v) => s + v, 0)
                const sumaActivosFijosMes = Object.values(m.egresosActivosFijosDetalle).reduce((s, v) => s + v, 0)

                return (
                  <TableRow 
                    key={m.monthKey}
                    onClick={() => {
                      setSelectedMonthDetail(m)
                      setModalCategoryFilter('TODOS')
                      setModalSearch('')
                    }}
                    className="border-b border-[#E2D9CC]/60 hover:bg-[#FAF8F5]/80 transition-colors cursor-pointer text-xs group"
                  >
                    {/* 1. Mes */}
                    <TableCell className="px-4 py-3.5 font-bold text-[#241C15]">
                      <div className="flex items-center gap-2">
                        <span className="group-hover:text-[#A36F4C] transition-colors font-bold text-sm">
                          {m.nombreMes}
                        </span>
                        {m.esMesActual && (
                          <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[9px] font-bold px-1.5 py-0">
                            En Curso
                          </Badge>
                        )}
                      </div>
                      <span className="text-[11px] text-[#75695D] font-normal block mt-0.5">
                        {m.cantidadPedidos} pedidos • {m.movimientos.length} movimientos
                      </span>
                    </TableCell>

                    {/* 2. Ingresos Cobrados */}
                    <TableCell className="px-3 py-3.5 text-right font-mono font-bold text-[#1E5E3A] align-middle">
                      +{formatCurrency(m.ingresosTotalesCalculados)}
                    </TableCell>

                    {/* 3. Insumos & Services */}
                    <TableCell className="px-3 py-3.5 text-right font-mono text-[#A36F4C] align-middle">
                      -{formatCurrency(sumaInsumosMes)}
                    </TableCell>

                    {/* 4. Activos Fijos */}
                    <TableCell className="px-3 py-3.5 text-right font-mono text-[#633E20] align-middle">
                      {sumaActivosFijosMes > 0 ? `-${formatCurrency(sumaActivosFijosMes)}` : <span className="text-[#75695D]/50">—</span>}
                    </TableCell>

                    {/* 5. Egresos Totales */}
                    <TableCell className="px-3 py-3.5 text-right font-mono font-bold text-[#944917] align-middle">
                      -{formatCurrency(m.egresosTotalesCalculados)}
                    </TableCell>

                    {/* 6. Flujo Neto */}
                    <TableCell className={`px-4 py-3.5 text-right font-mono font-black text-sm align-middle ${isPos ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
                      {isPos ? `+${formatCurrency(m.flujoNetoCalculado)}` : formatCurrency(m.flujoNetoCalculado)}
                    </TableCell>

                    {/* 7. Margen % */}
                    <TableCell className="px-3 py-3.5 text-center font-mono font-bold align-middle">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] ${
                        m.margenCalculadoPct >= 30
                          ? 'bg-[#EBF7EE] text-[#1E5E3A] border border-[#B4E3C0]'
                          : m.margenCalculadoPct >= 0
                          ? 'bg-[#FAF8F5] text-[#241C15] border border-[#E2D9CC]'
                          : 'bg-red-50 text-[#A34335] border border-red-200'
                      }`}>
                        {m.margenCalculadoPct}%
                      </span>
                    </TableCell>

                    {/* 8. Efectividad de Cobranza */}
                    <TableCell className="px-3 py-3.5 text-center font-mono text-xs text-[#75695D] align-middle">
                      {m.efectividadCobroMesOrigenPct}% cobrado
                    </TableCell>

                    {/* 9. Acción Auditar */}
                    <TableCell className="px-4 py-3.5 text-right align-middle">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedMonthDetail(m)
                          setModalCategoryFilter('TODOS')
                          setModalSearch('')
                        }}
                        className="h-7.5 px-3 text-xs font-bold border-[#E2D9CC] bg-[#FAF8F5] hover:bg-[#F4EFEA] hover:border-[#D4BEA7] text-[#241C15] rounded-xl cursor-pointer shadow-2xs inline-flex items-center gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5 text-[#A36F4C]" />
                        <span>Auditar</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL INTERACTIVO DE AUDITORÍA CONTABLE                                */}
      {/* ========================================================================= */}
      {selectedMonthDetail && (
        <div className="fixed inset-0 isolate z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border border-[#D4BEA7] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#FAF8F5] border-b border-[#E2D9CC] p-4 sm:p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#241C15]">
                    Auditoría Contable: {selectedMonthDetail.nombreMes}
                  </h3>
                  <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-xs font-bold">
                    Cálculo Dinámico Activo
                  </Badge>
                </div>
                <p className="text-xs text-[#75695D] mt-0.5">
                  Desglose exacto de partidas sumadas al cálculo según tu checklist.
                </p>
              </div>

              <button
                onClick={() => setSelectedMonthDetail(null)}
                className="p-1.5 rounded-xl hover:bg-[#EAE4DC] text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Summary KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-4 border-b border-[#E2D9CC] bg-[#FFFFFF]">
              <div className="p-2.5 rounded-xl bg-[#EBF7EE] border border-[#B4E3C0]">
                <span className="text-[10px] font-bold uppercase text-[#1E5E3A] block">Ingresos Sumados</span>
                <span className="font-mono font-extrabold text-sm text-[#1E5E3A]">+{formatCurrency(selectedMonthDetail.ingresosTotalesCalculados)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7]">
                <span className="text-[10px] font-bold uppercase text-[#A36F4C] block">Egresos Sumados</span>
                <span className="font-mono font-extrabold text-sm text-[#A36F4C]">-{formatCurrency(selectedMonthDetail.egresosTotalesCalculados)}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
                <span className="text-[10px] font-bold uppercase text-[#241C15] block">Flujo Neto</span>
                <span className={`font-mono font-black text-sm ${selectedMonthDetail.flujoNetoCalculado >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
                  {selectedMonthDetail.flujoNetoCalculado >= 0 ? `+${formatCurrency(selectedMonthDetail.flujoNetoCalculado)}` : formatCurrency(selectedMonthDetail.flujoNetoCalculado)}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]">
                <span className="text-[10px] font-bold uppercase text-[#75695D] block">Faltó Cobrar / Cartera</span>
                <span className="font-mono font-semibold text-xs text-[#8C6D1F]">
                  S/ {selectedMonthDetail.saldoFaltoCobrarAlCierre.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Toolbar Filters inside Modal */}
            <div className="p-4 border-b border-[#E2D9CC] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-2.5">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#75695D]" />
                <Input
                  placeholder="Buscar en este mes..."
                  value={modalSearch}
                  onChange={(e) => setModalSearch(e.target.value)}
                  className="pl-8 pr-7 h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs rounded-lg"
                />
                {modalSearch && (
                  <button onClick={() => setModalSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#75695D]">
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-[#F4EFEA] p-0.5 rounded-lg border border-[#E2D9CC] self-stretch sm:self-auto overflow-x-auto">
                <button
                  onClick={() => setModalCategoryFilter('TODOS')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    modalCategoryFilter === 'TODOS' ? 'bg-[#241C15] text-white shadow-xs' : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Todos ({selectedMonthDetail.movimientos.length})
                </button>
                <button
                  onClick={() => setModalCategoryFilter('INGRESOS')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    modalCategoryFilter === 'INGRESOS' ? 'bg-[#1E5E3A] text-white shadow-xs' : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Ingresos
                </button>
                <button
                  onClick={() => setModalCategoryFilter('EGRESOS')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                    modalCategoryFilter === 'EGRESOS' ? 'bg-[#A36F4C] text-white shadow-xs' : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  Egresos
                </button>
                {selectedMonthDetail.clientesCartera.length > 0 && (
                  <button
                    onClick={() => setModalCategoryFilter('CARTERA_COBRANZAS')}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      modalCategoryFilter === 'CARTERA_COBRANZAS' ? 'bg-[#8C6D1F] text-white shadow-xs' : 'text-[#75695D] hover:text-[#241C15]'
                    }`}
                  >
                    Cartera ({selectedMonthDetail.clientesCartera.length})
                  </button>
                )}
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]">
              {modalCategoryFilter === 'CARTERA_COBRANZAS' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E2D9CC] text-xs text-[#75695D]">
                    <span className="font-bold text-[#241C15] block">Auditoría de Cuentas por Cobrar Originadas en {selectedMonthDetail.nombreMes}:</span>
                    Al cierre faltaba cobrar <strong className="text-[#8C6D1F]">S/ {selectedMonthDetail.saldoFaltoCobrarAlCierre.toFixed(2)}</strong>. Detalle de liquidaciones:
                  </div>

                  {selectedMonthDetail.clientesCartera.map((c) => (
                    <div key={c.ventaId} className="p-3.5 rounded-2xl bg-[#F8F6F2] border border-[#E2D9CC] space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-extrabold text-sm text-[#241C15] block">{c.cliente}</span>
                          <span className="text-xs text-[#75695D] block">{c.modelo} • Cantidad: {c.cantidad}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-sm text-[#241C15] block">Total: {formatCurrency(c.totalFacturado)}</span>
                          <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold">
                            100% Pagado
                          </Badge>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs pt-1 border-t border-[#E2D9CC]/70">
                        <div>
                          <span className="text-[10px] text-[#75695D] block">Cobrado en {selectedMonthDetail.mesCorto}:</span>
                          <span className="font-mono font-semibold text-[#241C15]">+{formatCurrency(c.cobradoEnMesOrigen)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#8C6D1F] block">Faltó al Cierre:</span>
                          <span className="font-mono font-bold text-[#8C6D1F]">S/ {c.saldoPendienteAlCierre.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#1E5E3A] block">Cobrado Posterior:</span>
                          <span className="font-mono font-extrabold text-[#1E5E3A]">+{formatCurrency(c.cobradoPosterior)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                selectedMonthDetail.movimientos
                  .filter(m => {
                    const matchSearch = m.concepto.toLowerCase().includes(modalSearch.toLowerCase()) || m.entidad.toLowerCase().includes(modalSearch.toLowerCase())
                    if (!matchSearch) return false
                    if (modalCategoryFilter === 'INGRESOS') return m.esIngreso
                    if (modalCategoryFilter === 'EGRESOS') return !m.esIngreso
                    return true
                  })
                  .map(m => (
                    <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border transition-colors gap-2 ${m.incluidoEnCalculo ? 'bg-[#FFFFFF] border-[#E2D9CC]' : 'bg-[#FAF8F5]/50 border-dashed border-[#E2D9CC]/60 opacity-60'}`}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-xs sm:text-sm text-[#241C15] truncate">{m.concepto}</span>
                          <Badge variant="outline" className={`text-[9px] font-bold py-0 px-1.5 ${
                            m.esIngreso 
                              ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                              : m.esActivoFijo
                              ? 'bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7]'
                              : 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]'
                          }`}>
                            {m.subcategoria || m.categoria}
                          </Badge>
                          {!m.incluidoEnCalculo && (
                            <Badge variant="outline" className="text-[8px] bg-neutral-100 text-neutral-500 border-neutral-300">
                              Excluido por Filtro
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-[#75695D] font-mono block mt-0.5">
                          {formatDate(m.fecha)} • {m.entidad} {m.detalle ? `• ${m.detalle}` : ''}
                        </span>
                      </div>

                      <span className={`font-mono font-extrabold text-xs sm:text-sm flex-shrink-0 ${
                        m.esIngreso ? 'text-[#1E5E3A]' : m.esActivoFijo ? 'text-[#633E20]' : 'text-[#A34335]'
                      }`}>
                        {m.esIngreso ? `+${formatCurrency(m.monto)}` : `-${formatCurrency(m.monto)}`}
                      </span>
                    </div>
                  ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-[#FAF8F5] border-t border-[#E2D9CC] p-3.5 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedMonthDetail(null)}
                className="px-4 h-8 text-xs font-bold border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#EAE4DC] text-[#241C15] rounded-xl cursor-pointer"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
