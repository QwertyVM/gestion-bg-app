'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  TrendingUp, 
  DollarSign, 
  Clock, 
  Search, 
  X,
  CreditCard,
  Building2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { formatDate } from '@/lib/utils'

export interface InversionItem {
  id: string
  persona: string
  categoria: 'ACTIVO_FIJO' | 'INSUMO' | 'SERVICIO' | 'APORTE_CAPITAL'
  itemConcepto: string
  especificacionColor?: string | null
  presentacion?: string | null
  cantidad: number
  costoUnitario: number
  costoEnvio?: number | null
  costoTotal: number
  costoPorGramo?: number | null
  numeroCuotas?: number | null
  montoCuota?: number | null
  createdAt: string
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
}

interface FlujoCajaClientProps {
  inversiones: InversionItem[]
  ventas: VentaItem[]
}

const ITEMS_PER_PAGE = 5

export function FlujoCajaClient({ inversiones, ventas }: FlujoCajaClientProps) {
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'INGRESOS' | 'EGRESOS'>('TODOS')
  const [currentPage, setCurrentPage] = useState(1)

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

  // Financial Metrics Calculation
  const totalIngresosCobrados = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
  }, [ventas])

  const totalVentasFacturadas = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.total || 0), 0)
  }, [ventas])

  const totalSaldosPorCobrar = useMemo(() => {
    return ventas.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0)
  }, [ventas])

  const totalInyeccionCapital = useMemo(() => {
    return inversiones
      .filter(i => i.categoria === 'APORTE_CAPITAL')
      .reduce((acc, i) => acc + i.costoTotal, 0)
  }, [inversiones])

  const totalEgresosInsumos = useMemo(() => {
    return inversiones
      .filter(i => i.categoria === 'INSUMO' || i.categoria === 'SERVICIO')
      .reduce((acc, i) => acc + i.costoTotal, 0)
  }, [inversiones])

  const totalEgresosActivoFijo = useMemo(() => {
    return inversiones
      .filter(i => i.categoria === 'ACTIVO_FIJO')
      .reduce((acc, i) => acc + i.costoTotal, 0)
  }, [inversiones])

  const totalEgresosTotales = totalEgresosInsumos + totalEgresosActivoFijo
  const balanceNetoCaja = (totalIngresosCobrados + totalInyeccionCapital) - totalEgresosTotales

  // Unified Chronological Movements
  const allMovements = useMemo(() => {
    const movements: Array<{
      id: string
      fecha: string
      tipo: 'INGRESO_VENTA' | 'EGRESO_INSUMO' | 'EGRESO_ACTIVO' | 'APORTE_CAPITAL'
      concepto: string
      entidad: string
      monto: number
      detalle?: string
      isPositive: boolean
    }> = []

    // Add Sales as Incomes
    ventas.forEach(v => {
      if (v.montoPagado > 0) {
        movements.push({
          id: `v-${v.id}`,
          fecha: v.fecha,
          tipo: 'INGRESO_VENTA',
          concepto: `Venta: ${v.producto.nombreModelo} (x${v.cantidad})`,
          entidad: v.cliente,
          monto: v.montoPagado,
          detalle: v.saldoPendiente > 0 ? `Saldo pend: ${formatCurrency(v.saldoPendiente)}` : 'Pagado completo',
          isPositive: true,
        })
      }
    })

    // Add Inversiones as Outflows or Capital Injections
    inversiones.forEach(i => {
      if (i.categoria === 'APORTE_CAPITAL') {
        movements.push({
          id: `inv-${i.id}`,
          fecha: i.createdAt,
          tipo: 'APORTE_CAPITAL',
          concepto: `Inyección de Capital: ${i.itemConcepto}`,
          entidad: i.persona || 'Víctor',
          monto: i.costoTotal,
          detalle: 'Aporte de Capital',
          isPositive: true,
        })
      } else if (i.categoria === 'ACTIVO_FIJO') {
        movements.push({
          id: `inv-${i.id}`,
          fecha: i.createdAt,
          tipo: 'EGRESO_ACTIVO',
          concepto: `Activo Fijo / Equipo: ${i.itemConcepto}`,
          entidad: i.persona || 'Víctor',
          monto: i.costoTotal,
          detalle: i.numeroCuotas ? `${i.numeroCuotas} cuotas de ${formatCurrency(i.montoCuota || 0)}` : 'Contado',
          isPositive: false,
        })
      } else {
        movements.push({
          id: `inv-${i.id}`,
          fecha: i.createdAt,
          tipo: 'EGRESO_INSUMO',
          concepto: `Compra Insumo: ${i.itemConcepto}`,
          entidad: i.persona || 'Víctor',
          monto: i.costoTotal,
          detalle: i.especificacionColor ? `Color: ${i.especificacionColor}` : (i.presentacion || 'Insumo 3D'),
          isPositive: false,
        })
      }
    })

    // Sort descending by date
    return movements.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [ventas, inversiones])

  // Filtered movements
  const filteredMovements = useMemo(() => {
    return allMovements.filter(m => {
      const matchSearch = 
        m.concepto.toLowerCase().includes(search.toLowerCase()) ||
        m.entidad.toLowerCase().includes(search.toLowerCase()) ||
        (m.detalle && m.detalle.toLowerCase().includes(search.toLowerCase()))

      let matchTipo = true
      if (tipoFilter === 'INGRESOS') matchTipo = m.isPositive
      if (tipoFilter === 'EGRESOS') matchTipo = !m.isPositive

      return matchSearch && matchTipo
    })
  }, [allMovements, search, tipoFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / ITEMS_PER_PAGE))
  const paginatedMovements = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredMovements.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredMovements, currentPage])

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <Wallet className="h-8 w-8 text-emerald-500" />
          Flujo de Caja del Taller
        </h1>
        <p className="text-sm text-zinc-400 mt-1">
          Balance consolidado en tiempo real entre ingresos por ventas, inyecciones de capital y egresos operativos.
        </p>
      </div>

      {/* KPI Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Balance Neto en Caja */}
        <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl relative overflow-hidden">
          <div className={`absolute top-0 left-0 right-0 h-1 ${balanceNetoCaja >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Liquidez Neta en Caja
            </span>
            <div className={`text-2xl font-extrabold font-mono mt-1 ${balanceNetoCaja >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(balanceNetoCaja)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-zinc-500">
              (Ingresos + Aportes) - Egresos
            </span>
          </CardContent>
        </Card>

        {/* Ingresos Cobrados (Ventas) */}
        <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/60" />
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ArrowUpRight className="h-3.5 w-3.5" />
              Ingresos Cobrados
            </span>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {formatCurrency(totalIngresosCobrados)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-zinc-500">
              Total facturado: {formatCurrency(totalVentasFacturadas)}
            </span>
          </CardContent>
        </Card>

        {/* Egresos Totales */}
        <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500/60" />
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <ArrowDownRight className="h-3.5 w-3.5" />
              Egresos Totales
            </span>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {formatCurrency(totalEgresosTotales)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-zinc-500">
              Insumos: {formatCurrency(totalEgresosInsumos)} • Activos: {formatCurrency(totalEgresosActivoFijo)}
            </span>
          </CardContent>
        </Card>

        {/* Cuentas por Cobrar */}
        <Card className="bg-zinc-950/60 border-zinc-800 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500/60" />
          <CardHeader className="pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Por Cobrar (Saldos)
            </span>
            <div className="text-2xl font-extrabold text-white font-mono mt-1">
              {formatCurrency(totalSaldosPorCobrar)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <span className="text-xs text-zinc-500">
              Aportes de Capital: {formatCurrency(totalInyeccionCapital)}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Movements Toolbar */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Buscar por concepto o cliente/persona..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 bg-zinc-900/80 border-zinc-800 text-white placeholder:text-zinc-500 text-sm"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Type Filter Pills */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setTipoFilter('TODOS'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tipoFilter === 'TODOS'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({allMovements.length})
              </button>
              <button
                onClick={() => { setTipoFilter('INGRESOS'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  tipoFilter === 'INGRESOS'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowUpRight className="h-3 w-3" />
                Ingresos (+)
              </button>
              <button
                onClick={() => { setTipoFilter('EGRESOS'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  tipoFilter === 'EGRESOS'
                    ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowDownRight className="h-3 w-3" />
                Egresos (-)
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Movements Table */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-zinc-900/70 border-b border-zinc-800">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-left">Fecha</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Tipo</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Concepto & Detalle</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left hidden sm:table-cell">Persona / Cliente</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-right">Monto</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-zinc-500">
                  No se encontraron movimientos registrados en este periodo.
                </TableCell>
              </TableRow>
            ) : (
              paginatedMovements.map((mov) => (
                <TableRow key={mov.id} className="border-zinc-800/60 hover:bg-zinc-900/40 transition-colors">
                  <TableCell className="px-4 py-3 text-xs text-zinc-400 font-mono whitespace-nowrap">
                    {formatDate(mov.fecha)}
                  </TableCell>

                  <TableCell className="px-3 py-3 whitespace-nowrap">
                    {mov.tipo === 'INGRESO_VENTA' && (
                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[11px] gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        Venta Cobrada
                      </Badge>
                    )}
                    {mov.tipo === 'APORTE_CAPITAL' && (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-[11px] gap-1">
                        <Building2 className="h-3 w-3" />
                        Inyección Capital
                      </Badge>
                    )}
                    {mov.tipo === 'EGRESO_ACTIVO' && (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[11px] gap-1">
                        <CreditCard className="h-3 w-3" />
                        Activo Fijo
                      </Badge>
                    )}
                    {mov.tipo === 'EGRESO_INSUMO' && (
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[11px] gap-1">
                        <ArrowDownRight className="h-3 w-3" />
                        Insumo / Gasto
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-zinc-100">
                        {mov.concepto}
                      </span>
                      {mov.detalle && (
                        <span className="text-[11px] text-zinc-500">
                          {mov.detalle}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-3 text-xs text-zinc-300 hidden sm:table-cell whitespace-nowrap">
                    {mov.entidad}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right font-mono font-bold whitespace-nowrap">
                    <span className={mov.isPositive ? 'text-emerald-400' : 'text-red-400'}>
                      {mov.isPositive ? '+' : '-'}{formatCurrency(mov.monto)}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-800/80 bg-zinc-950/70 text-xs text-zinc-400">
            <div>
              Mostrando página <span className="text-white font-medium">{currentPage}</span> de <span className="text-white font-medium">{totalPages}</span> ({filteredMovements.length} movimientos)
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
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
