'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Clock, 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Package,
  DollarSign,
  Loader2,
  Landmark,
  CreditCard,
  Tag,
  Pencil,
  ExternalLink
} from 'lucide-react'
import { createIngreso, deleteIngreso, updateIngreso, swapIngresoOrder } from '@/actions/ingresos'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { SearchableCombobox } from '@/components/ui/SearchableCombobox'
import { DateRange, getDefaultDateRange, isDateInRange } from '@/lib/date-utils'
import { DateFilterControl } from '@/components/ui/DateFilterControl'
import { VentaItem, IngresoDirectoItem } from './FlujoCajaClient'

interface IngresosClientProps {
  ventas: VentaItem[]
  pedidos?: any[]
  ingresosDirectos: IngresoDirectoItem[]
}

const ITEMS_PER_PAGE = 10

export function IngresosClient({ ventas, pedidos, ingresosDirectos }: IngresosClientProps) {
  const router = useRouter()
  const [directos, setDirectos] = useState<IngresoDirectoItem[]>(ingresosDirectos)

  useEffect(() => {
    setDirectos(ingresosDirectos)
  }, [ingresosDirectos])

  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'VENTAS' | 'DIRECTOS'>('TODOS')
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange('ESTE_MES'))
  const [openModal, setOpenModal] = useState(false)
  const [openEditModal, setOpenEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState<IngresoDirectoItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)

  // Form states (Create & Edit for Direct Incomes)
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0])
  const [formCliente, setFormCliente] = useState('')
  const [formConcepto, setFormConcepto] = useState('')
  const [formCategoria, setFormCategoria] = useState('Servicio de Impresión 3D')
  const [formMonto, setFormMonto] = useState('')
  const [formMetodoPago, setFormMetodoPago] = useState('YAPE')
  const [formNotas, setFormNotas] = useState('')

  // Quick stats filtered by active date range
  const pedidosEnRango = useMemo(() => {
    if (!pedidos) return []
    return pedidos.filter(p => isDateInRange(p.fecha, dateRange.from, dateRange.to))
  }, [pedidos, dateRange])

  const ventasEnRango = useMemo(() => {
    return ventas.filter(v => isDateInRange(v.fecha, dateRange.from, dateRange.to))
  }, [ventas, dateRange])

  const directosEnRango = useMemo(() => {
    return directos.filter(i => isDateInRange(i.fecha, dateRange.from, dateRange.to))
  }, [directos, dateRange])

  const totalCobradoCatalogo = useMemo(() => {
    if (pedidosEnRango && pedidosEnRango.length > 0) {
      return pedidosEnRango.reduce((acc, p) => acc + (p.montoPagado || 0), 0)
    }
    return ventasEnRango.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
  }, [ventasEnRango, pedidosEnRango])

  const totalDirectos = useMemo(() => {
    return directosEnRango.reduce((acc, i) => acc + i.monto, 0)
  }, [directosEnRango])

  const totalSaldoPendiente = useMemo(() => {
    if (pedidosEnRango && pedidosEnRango.length > 0) {
      return pedidosEnRango.reduce((acc, p) => acc + (p.saldoPendiente || 0), 0)
    }
    return ventasEnRango.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0)
  }, [ventasEnRango, pedidosEnRango])

  const totalFacturadoVentas = useMemo(() => {
    if (pedidosEnRango && pedidosEnRango.length > 0) {
      return pedidosEnRango.reduce((acc, p) => acc + (p.total || 0), 0)
    }
    return ventasEnRango.reduce((acc, v) => acc + (v.total || 0), 0)
  }, [ventasEnRango, pedidosEnRango])

  const totalSaldosPorCobrar = totalSaldoPendiente
  const totalIngresosCobrados = totalCobradoCatalogo + totalDirectos

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Helper to summarize order items cleanly (group duplicate product names)
  const summarizeOrderItems = (items?: any[]) => {
    if (!items || items.length === 0) return 'Modelos 3D'
    const itemCounts = new Map<string, number>()
    items.forEach((it: any) => {
      const name = it.nombreProductoSnapshot || it.producto?.nombreModelo || 'Modelo 3D'
      itemCounts.set(name, (itemCounts.get(name) || 0) + (it.cantidad || 1))
    })
    return Array.from(itemCounts.entries())
      .map(([name, qty]) => `${name} (x${qty})`)
      .join(', ')
  }

  // Consolidated Incomes List
  const unifiedIngresos = useMemo(() => {
    const list: Array<{
      id: string
      rawId: string
      pagoId?: string
      fecha: string
      origen: 'VENTA_CATALOGO' | 'INGRESO_DIRECTO'
      cliente: string
      concepto: string
      categoria: string
      montoCobrado: number
      totalOriginal?: number
      saldoPendiente?: number
      metodoPago?: string
      tipoAbono?: string
      tipoLabel?: string
      notas?: string
      canDelete: boolean
      rawItem?: IngresoDirectoItem
    }> = []

    // From Pedidos (Multi-product orders)
    if (pedidos && pedidos.length > 0) {
      pedidos.forEach(p => {
        const itemsSummary = summarizeOrderItems(p.items)
        const categoria = p.items?.[0]?.producto?.lineaCategoria || 'General'

        if (Array.isArray(p.pagos) && p.pagos.length > 0) {
          p.pagos.forEach((pg: any, idx: number) => {
            const isSingleFull = ((p.pagos?.length || 0) === 1 && p.saldoPendiente <= 0) || pg.tipo === 'PAGO_TOTAL'
            const numAbono = idx + 1
            const tipoLabel = isSingleFull ? 'Pago Total' : `Abono #${numAbono}`
            const concepto = isSingleFull
              ? `Pago Total del pedido ${p.codigo}: ${itemsSummary}`
              : `Abono #${numAbono} del pedido ${p.codigo}: ${itemsSummary}`

            list.push({
              id: `pago-ped-${pg.id || `${p.id}-${idx}`}`,
              rawId: p.id,
              fecha: pg.fecha,
              origen: 'VENTA_CATALOGO',
              cliente: p.cliente,
              concepto,
              categoria,
              montoCobrado: pg.monto,
              totalOriginal: p.total,
              saldoPendiente: p.saldoPendiente,
              metodoPago: pg.metodoPago || 'YAPE',
              tipoAbono: pg.tipo,
              tipoLabel,
              notas: pg.notas || undefined,
              canDelete: false,
            })
          })
        } else if (p.montoPagado > 0) {
          list.push({
            id: `ped-${p.id}`,
            rawId: p.id,
            fecha: p.fecha,
            origen: 'VENTA_CATALOGO',
            cliente: p.cliente,
            concepto: `Abono #1 del pedido ${p.codigo}: ${itemsSummary}`,
            categoria,
            montoCobrado: p.montoPagado,
            totalOriginal: p.total,
            saldoPendiente: p.saldoPendiente,
            metodoPago: 'YAPE',
            tipoAbono: 'ANTICIPO',
            tipoLabel: 'Abono #1',
            canDelete: false,
          })
        }
      })
    } else {
      // Fallback from Sales & Abonos
      ventas.forEach((v, vIdx) => {
        const codigo = (v as any).codigo || `PED-${String(ventas.length - vIdx).padStart(3, '0')}`
        if (Array.isArray(v.pagos) && v.pagos.length > 0) {
          v.pagos.forEach((p, idx) => {
            const isSingleFull = ((v.pagos?.length || 0) === 1 && v.saldoPendiente <= 0) || p.tipo === 'PAGO_TOTAL'
            const numAbono = idx + 1
            const tipoLabel = isSingleFull ? 'Pago Total' : `Abono #${numAbono}`
            const concepto = isSingleFull
              ? `Pago Total del pedido ${codigo}: ${v.producto.nombreModelo} (x${v.cantidad})`
              : `Abono #${numAbono} del pedido ${codigo}: ${v.producto.nombreModelo} (x${v.cantidad})`

            list.push({
              id: `pago-${p.id || `${v.id}-${idx}`}`,
              rawId: v.id,
              fecha: p.fecha,
              origen: 'VENTA_CATALOGO',
              cliente: v.cliente,
              concepto,
              categoria: v.producto.lineaCategoria,
              montoCobrado: p.monto,
              totalOriginal: v.total,
              saldoPendiente: v.saldoPendiente,
              metodoPago: p.metodoPago || 'YAPE',
              tipoAbono: p.tipo,
              tipoLabel,
              notas: p.notas || undefined,
              canDelete: false,
            })
          })
        } else if (v.montoPagado > 0) {
          list.push({
            id: `v-${v.id}`,
            rawId: v.id,
            fecha: v.fecha,
            origen: 'VENTA_CATALOGO',
            cliente: v.cliente,
            concepto: `Abono #1 del pedido ${codigo}: ${v.producto.nombreModelo} (x${v.cantidad})`,
            categoria: v.producto.lineaCategoria,
            montoCobrado: v.montoPagado,
            totalOriginal: v.total,
            saldoPendiente: v.saldoPendiente,
            metodoPago: 'YAPE',
            tipoAbono: 'ANTICIPO',
            tipoLabel: 'Abono #1',
            canDelete: false,
          })
        }
      })
    }

    // From Direct Incomes
    directos.forEach(i => {
      list.push({
        id: `dir-${i.id}`,
        rawId: i.id,
        fecha: i.fecha,
        origen: 'INGRESO_DIRECTO',
        cliente: i.cliente,
        concepto: i.concepto,
        categoria: i.categoria,
        montoCobrado: i.monto,
        metodoPago: i.metodoPago,
        notas: i.notas,
        canDelete: true,
        rawItem: i,
      })
    })

    return list.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [ventas, pedidos, directos])

  // Filtered List
  const filteredIngresos = useMemo(() => {
    return unifiedIngresos.filter(item => {
      const matchDate = isDateInRange(item.fecha, dateRange.from, dateRange.to)
      if (!matchDate) return false

      const matchSearch = 
        item.cliente.toLowerCase().includes(search.toLowerCase()) ||
        item.concepto.toLowerCase().includes(search.toLowerCase()) ||
        item.categoria.toLowerCase().includes(search.toLowerCase())

      let matchTipo = true
      if (tipoFilter === 'VENTAS') matchTipo = item.origen === 'VENTA_CATALOGO'
      if (tipoFilter === 'DIRECTOS') matchTipo = item.origen === 'INGRESO_DIRECTO'

      return matchSearch && matchTipo
    })
  }, [unifiedIngresos, dateRange, search, tipoFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredIngresos.length / ITEMS_PER_PAGE))
  const paginatedIngresos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredIngresos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredIngresos, currentPage])

  // Open Create Modal
  const handleOpenCreate = () => {
    setFormFecha(new Date().toISOString().split('T')[0])
    setFormCliente('')
    setFormConcepto('')
    setFormCategoria('Servicio de Impresión 3D')
    setFormMonto('')
    setFormMetodoPago('YAPE')
    setFormNotas('')
    setOpenModal(true)
  }

  // Open Edit Modal for direct income
  const handleOpenEdit = (item: IngresoDirectoItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingItem(item)
    setFormFecha(item.fecha ? item.fecha.split('T')[0] : new Date().toISOString().split('T')[0])
    setFormCliente(item.cliente || '')
    setFormConcepto(item.concepto || '')
    setFormCategoria(item.categoria || 'Servicio de Impresión 3D')
    setFormMonto(item.monto ? item.monto.toString() : '')
    setFormMetodoPago(item.metodoPago || 'YAPE')
    setFormNotas(item.notas || '')
    setOpenEditModal(true)
  }

  // Submit Create
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCliente.trim() || !formConcepto.trim() || !formMonto) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      const created = await createIngreso({
        fecha: formFecha || undefined,
        cliente: formCliente.trim(),
        concepto: formConcepto.trim(),
        categoria: formCategoria,
        monto: parseFloat(formMonto) || 0,
        metodoPago: formMetodoPago,
        notas: formNotas.trim() || undefined,
      })
      setDirectos(prev => [created as any, ...prev])
      toast.success('Ingreso registrado exitosamente')
      setOpenModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar ingreso')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit Edit
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return
    if (!formCliente.trim() || !formConcepto.trim() || !formMonto) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      const updated = await updateIngreso(editingItem.id, {
        fecha: formFecha || undefined,
        cliente: formCliente.trim(),
        concepto: formConcepto.trim(),
        categoria: formCategoria,
        monto: parseFloat(formMonto) || 0,
        metodoPago: formMetodoPago,
        notas: formNotas.trim() || undefined,
      })

      setDirectos(prev => prev.map(item => item.id === editingItem.id ? (updated as any) : item))
      toast.success('Ingreso actualizado exitosamente')
      setOpenEditModal(false)
      setEditingItem(null)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al actualizar ingreso')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Direct Income
  const handleDeleteDirect = async (id: string, concepto: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (confirm(`¿Seguro que deseas eliminar el ingreso "${concepto}"?`)) {
      try {
        await deleteIngreso(id)
        setDirectos(prev => prev.filter(item => item.id !== id))
        toast.success('Ingreso eliminado')
        if (openEditModal) setOpenEditModal(false)
        router.refresh()
      } catch (err) {
        toast.error('Error al eliminar ingreso')
      }
    }
  }

  // Reorder within the same day
  const handleMoveIngreso = async (idCurrent: string, idTarget: string, direction: 'up' | 'down') => {
    const currentItem = directos.find(i => i.id === idCurrent)
    const targetItem = directos.find(i => i.id === idTarget)
    if (!currentItem || !targetItem) return

    // Optimistic UI update
    setDirectos(prev => prev.map(item => {
      if (item.id === idCurrent) return { ...item, fecha: targetItem.fecha }
      if (item.id === idTarget) return { ...item, fecha: currentItem.fecha }
      return item
    }))

    try {
      await swapIngresoOrder(idCurrent, idTarget)
      toast.success(direction === 'up' ? 'Posición subida' : 'Posición bajada')
    } catch (err: any) {
      toast.error(err?.message || 'Error al reordenar')
      router.refresh()
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EBF7EE] border border-[#B4E3C0] text-[#1E5E3A] shadow-sm">
              <ArrowUpRight className="h-6 w-6 stroke-[2.5]" />
            </div>
            <span>Registro de Ingresos</span>
          </h1>
          <p className="text-sm text-[#75695D] mt-1">
            Control de cobros por ventas de productos 3D y servicios de impresión o diseño.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <DateFilterControl
            value={dateRange}
            onChange={(newRange) => {
              setDateRange(newRange)
              setCurrentPage(1)
            }}
          />

          <Button 
            onClick={handleOpenCreate}
            className="bg-[#1E5E3A] hover:bg-[#16472C] text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer h-9 px-3.5 text-xs active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            Registrar Ingreso Directo
          </Button>
        </div>
      </div>

      {/* KPI Overview Minimalista */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Ingresos Cobrados */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Total Ingresos Cobrados</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#1E5E3A] font-mono tabular-nums">
              {formatCurrency(totalIngresosCobrados)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              Dinero real ingresado a caja
            </span>
          </div>
        </div>

        {/* Facturación en Ventas */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Facturación en Ventas</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
              {formatCurrency(totalFacturadoVentas)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              Monto total de ventas generadas
            </span>
          </div>
        </div>

        {/* Cuentas por Cobrar */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Cuentas por Cobrar</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#8C6D1F]">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#8C6D1F] font-mono tabular-nums">
              {formatCurrency(totalSaldosPorCobrar)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              Saldos pendientes de entrega
            </span>
          </div>
        </div>
      </div>

      {/* Main Container: Master Card (Toolbar + Zero-Scroll Table) */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] overflow-hidden shadow-2xs rounded-2xl">
        {/* Unified Integrated Toolbar */}
        <div className="p-3 sm:p-3.5 border-b border-[#E2D9CC]/70 flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#FFFFFF]">
          {/* Search */}
          <div className="relative w-full sm:w-80 flex-shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
            <Input 
              placeholder="Buscar por cliente, modelo o servicio..."
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

          {/* Type Filters */}
          <div className="flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC] w-full sm:w-auto justify-center sm:justify-start">
            <button
              onClick={() => { setTipoFilter('TODOS'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                tipoFilter === 'TODOS'
                  ? 'bg-[#241C15] text-white shadow-2xs'
                  : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
              }`}
            >
              Todos ({unifiedIngresos.length})
            </button>
            <button
              onClick={() => { setTipoFilter('VENTAS'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                tipoFilter === 'VENTAS'
                  ? 'bg-[#1E5E3A] text-white shadow-2xs'
                  : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
              }`}
            >
              <Package className="h-3 w-3 stroke-[2.5]" />
              Ventas Catálogo
            </button>
            <button
              onClick={() => { setTipoFilter('DIRECTOS'); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap ${
                tipoFilter === 'DIRECTOS'
                  ? 'bg-[#8C6D1F] text-white shadow-2xs'
                  : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
              }`}
            >
              <DollarSign className="h-3 w-3 stroke-[2.5]" />
              Servicios Directos
            </button>
          </div>
        </div>

        {/* Mobile View: Cards */}
        <div className="block md:hidden divide-y divide-[#E2D9CC]/70">
          {paginatedIngresos.length === 0 ? (
            <div className="p-8 text-center text-[#75695D] text-xs">
              No se encontraron ingresos registrados en este periodo.
            </div>
          ) : (
            paginatedIngresos.map((ing) => {
              const isDirect = ing.origen === 'INGRESO_DIRECTO' && ing.rawItem
              const globalDirectIndex = isDirect ? directos.findIndex(d => d.id === ing.rawId) : -1
              const prevNeighbor = globalDirectIndex > 0 ? directos[globalDirectIndex - 1] : null
              const nextNeighbor = globalDirectIndex >= 0 && globalDirectIndex < directos.length - 1 ? directos[globalDirectIndex + 1] : null

              const ingDay = ing.fecha ? ing.fecha.split('T')[0] : ''
              const canMoveUp = isDirect && !!prevNeighbor && prevNeighbor.fecha.split('T')[0] === ingDay
              const canMoveDown = isDirect && !!nextNeighbor && nextNeighbor.fecha.split('T')[0] === ingDay

              return (
                <div 
                  key={ing.id} 
                  onClick={() => {
                    if (isDirect && ing.rawItem) handleOpenEdit(ing.rawItem)
                  }}
                  className={`p-3.5 space-y-2 bg-[#FFFFFF] hover:bg-[#FDFBF7] transition-colors ${isDirect ? 'cursor-pointer' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-xs text-[#241C15] block truncate">{ing.concepto}</span>
                      <span className="text-[11px] text-[#75695D] font-mono block mt-0.5">
                        {formatDate(ing.fecha)} • {ing.cliente}
                      </span>
                    </div>

                    <span className="text-sm font-mono font-bold text-[#1E5E3A] flex-shrink-0 tabular-nums">
                      +{formatCurrency(ing.montoCobrado)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {ing.origen === 'VENTA_CATALOGO' ? (
                        (ing as any).tipoLabel === 'Pago Total' ? (
                          <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold">
                            Pago Total (100%)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-[10px] font-bold">
                            {(ing as any).tipoLabel || 'Abono'}
                          </Badge>
                        )
                      ) : (
                        <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-bold">
                          Servicio Directo
                        </Badge>
                      )}

                      <Badge variant="outline" className="bg-[#FAF8F5] border-[#E2D9CC] text-[#75695D] text-[10px] font-medium">
                        {ing.metodoPago || 'YAPE'}
                      </Badge>
                    </div>

                    {ing.saldoPendiente && ing.saldoPendiente > 0 ? (
                      <span className="text-[10px] text-[#8C6D1F] font-bold">
                        Saldo: {formatCurrency(ing.saldoPendiente)}
                      </span>
                    ) : null}
                  </div>

                  {/* Acciones Móviles */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#E2D9CC]/40 text-xs" onClick={(e) => e.stopPropagation()}>
                    {isDirect && ing.rawItem ? (
                      <>
                        <div className="flex items-center gap-1 bg-[#F4EFEA] border border-[#E2D9CC] rounded-lg p-0.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={!canMoveUp}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (prevNeighbor) handleMoveIngreso(ing.rawId, prevNeighbor.id, 'up')
                            }}
                            className="h-6 w-6 text-[#75695D] hover:text-[#241C15] disabled:opacity-20 cursor-pointer"
                            title="Subir posición"
                          >
                            <ChevronUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            disabled={!canMoveDown}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (nextNeighbor) handleMoveIngreso(ing.rawId, nextNeighbor.id, 'down')
                            }}
                            className="h-6 w-6 text-[#75695D] hover:text-[#241C15] disabled:opacity-20 cursor-pointer"
                            title="Bajar posición"
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleOpenEdit(ing.rawItem!, e)}
                            className="h-7 px-2 text-[11px] text-[#75695D] hover:text-[#1E5E3A] hover:bg-emerald-50 rounded-lg cursor-pointer"
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => handleDeleteDirect(ing.rawId, ing.concepto, e)}
                            className="h-7 px-2 text-[11px] text-[#75695D] hover:text-[#A34335] hover:bg-red-50 rounded-lg cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Eliminar
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Link href="/pedidos" className="ml-auto">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] rounded-lg cursor-pointer font-medium gap-1"
                        >
                          <span>Ver Pedido</span>
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Desktop View: Clean Zero-Scroll Table (5 Columns / table-fixed) */}
        <div className="hidden md:block">
          <Table className="w-full table-fixed">
            <TableHeader className="bg-[#FAF8F5]/80 border-b border-[#E2D9CC]">
              <TableRow className="border-[#E2D9CC] hover:bg-transparent">
                <TableHead className="w-[130px] px-4 py-3 text-xs font-bold text-[#75695D] text-left">
                  Fecha & Tipo
                </TableHead>
                <TableHead className="px-3 py-3 text-xs font-bold text-[#75695D] text-left">
                  Concepto & Detalle
                </TableHead>
                <TableHead className="w-[140px] px-3 py-3 text-xs font-bold text-[#75695D] text-left">
                  Cliente / Entidad
                </TableHead>
                <TableHead className="w-[115px] px-4 py-3 text-xs font-bold text-[#75695D] text-right">
                  Monto Cobrado
                </TableHead>
                <TableHead className="w-[115px] px-3 py-3 text-xs font-bold text-[#75695D] text-right">
                  Acción
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedIngresos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-[#75695D] text-xs">
                    No se encontraron ingresos registrados con los filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedIngresos.map((ing) => {
                  const isDirect = ing.origen === 'INGRESO_DIRECTO' && ing.rawItem
                  const globalDirectIndex = isDirect ? directos.findIndex(d => d.id === ing.rawId) : -1
                  const prevNeighbor = globalDirectIndex > 0 ? directos[globalDirectIndex - 1] : null
                  const nextNeighbor = globalDirectIndex >= 0 && globalDirectIndex < directos.length - 1 ? directos[globalDirectIndex + 1] : null

                  const ingDay = ing.fecha ? ing.fecha.split('T')[0] : ''
                  const canMoveUp = isDirect && !!prevNeighbor && prevNeighbor.fecha.split('T')[0] === ingDay
                  const canMoveDown = isDirect && !!nextNeighbor && nextNeighbor.fecha.split('T')[0] === ingDay

                  return (
                    <TableRow 
                      key={ing.id} 
                      onClick={() => {
                        if (isDirect && ing.rawItem) handleOpenEdit(ing.rawItem)
                      }}
                      className={`border-b border-[#E2D9CC]/60 hover:bg-[#FAF8F5]/60 transition-colors ${isDirect ? 'cursor-pointer group' : ''}`}
                    >
                      {/* 1. Fecha & Tipo */}
                      <TableCell className="px-4 py-3 align-top">
                        <div className="space-y-1">
                          <span className="text-xs text-[#75695D] font-mono block">
                            {formatDate(ing.fecha)}
                          </span>
                          <div>
                            {ing.origen === 'VENTA_CATALOGO' ? (
                              (ing as any).tipoLabel === 'Pago Total' ? (
                                <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold px-1.5 py-0">
                                  Pago Total (100%)
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7] text-[10px] font-bold px-1.5 py-0">
                                  {(ing as any).tipoLabel || 'Abono'}
                                </Badge>
                              )
                            ) : (
                              <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-bold px-1.5 py-0">
                                Servicio Directo
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Concepto & Detalle */}
                      <TableCell className="px-3 py-3 align-top min-w-0">
                        <div className="min-w-0">
                          <span 
                            title={ing.concepto}
                            className={`text-xs font-semibold text-[#241C15] block truncate ${isDirect ? 'group-hover:text-[#1E5E3A] transition-colors' : ''}`}
                          >
                            {ing.concepto}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#75695D] truncate">
                            <span className="font-mono font-medium text-[#75695D] flex-shrink-0">
                              {ing.metodoPago || 'YAPE'}
                            </span>
                            {ing.saldoPendiente && ing.saldoPendiente > 0 ? (
                              <span className="text-[#8C6D1F] font-bold flex-shrink-0">
                                • Resta: {formatCurrency(ing.saldoPendiente)}
                              </span>
                            ) : null}
                            {ing.notas ? (
                              <span className="italic truncate" title={ing.notas}>
                                • {ing.notas}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>

                      {/* 3. Cliente / Entidad */}
                      <TableCell className="px-3 py-3 align-top min-w-0">
                        <span 
                          title={ing.cliente}
                          className={`text-xs font-medium text-[#241C15] block truncate ${isDirect ? 'group-hover:text-[#1E5E3A] transition-colors' : ''}`}
                        >
                          {ing.cliente}
                        </span>
                        <span className="text-[10px] text-[#75695D] block truncate">
                          {ing.categoria}
                        </span>
                      </TableCell>

                      {/* 4. Monto Cobrado */}
                      <TableCell className="px-4 py-3 align-top text-right whitespace-nowrap">
                        <span className="font-mono font-bold tabular-nums text-xs sm:text-sm text-[#1E5E3A] block">
                          +{formatCurrency(ing.montoCobrado)}
                        </span>
                        {ing.saldoPendiente && ing.saldoPendiente > 0 ? (
                          <span className="text-[10px] text-[#8C6D1F] font-semibold block">
                            Saldo: {formatCurrency(ing.saldoPendiente)}
                          </span>
                        ) : null}
                      </TableCell>

                      {/* 5. Acciones */}
                      <TableCell className="px-3 py-3 align-top text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {isDirect && ing.rawItem ? (
                          <div className="flex items-center justify-end gap-1">
                            {/* Reorder Micro Buttons con espacio reservado invisible para alineación perfecta */}
                            <div className={`flex items-center bg-[#F4EFEA] border border-[#E2D9CC] rounded-lg p-0.5 ${canMoveUp || canMoveDown ? '' : 'invisible'}`}>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={!canMoveUp}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (prevNeighbor) handleMoveIngreso(ing.rawId, prevNeighbor.id, 'up')
                                }}
                                className="h-5 w-5 text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-20 cursor-pointer rounded p-0"
                                title="Subir posición"
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                disabled={!canMoveDown}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (nextNeighbor) handleMoveIngreso(ing.rawId, nextNeighbor.id, 'down')
                                }}
                                className="h-5 w-5 text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-20 cursor-pointer rounded p-0"
                                title="Bajar posición"
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => handleOpenEdit(ing.rawItem!, e)}
                              className="h-7 w-7 text-[#75695D] hover:text-[#1E5E3A] hover:bg-emerald-50 rounded-lg cursor-pointer"
                              title="Editar ingreso directo"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={(e) => handleDeleteDirect(ing.rawId, ing.concepto, e)}
                              className="h-7 w-7 text-[#75695D] hover:text-[#A34335] hover:bg-red-50 rounded-lg cursor-pointer"
                              title="Eliminar ingreso directo"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end">
                            <Link href="/pedidos">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-[11px] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] rounded-lg cursor-pointer font-medium gap-1"
                              >
                                <span>Ver</span>
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-[#E2D9CC] bg-[#FAF8F5]/80 text-xs text-[#75695D]">
            <div>
              Mostrando <span className="text-[#241C15] font-bold">{paginatedIngresos.length}</span> de <span className="text-[#241C15] font-bold">{filteredIngresos.length}</span> ingresos (Página {currentPage} de {totalPages})
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
                        ? "bg-[#1E5E3A] text-white hover:bg-[#16472C] font-bold" 
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

      {/* Modal: Registrar Ingreso Directo */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-[#FAF8F5] border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-lg max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-3xl z-50">
          <form onSubmit={handleSubmitCreate} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 border-b border-[#E2D9CC] bg-[#FFFFFF] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#EBF7EE] text-[#1E5E3A] border border-[#B4E3C0]">
                  <DollarSign className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-extrabold text-[#241C15]">
                    Registrar Ingreso Directo
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                    Servicios de impresión externa, modelado 3D, préstamos o aportes.
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Fecha del Ingreso *</Label>
                  <Input 
                    type="date"
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    required
                    className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-sm rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Cliente / Entidad *</Label>
                  <Input 
                    value={formCliente}
                    onChange={(e) => setFormCliente(e.target.value)}
                    placeholder="Ej: Banco BCP / Juan Pérez"
                    required
                    className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Concepto / Servicio Realizado *</Label>
                <Input 
                  value={formConcepto}
                  onChange={(e) => setFormConcepto(e.target.value)}
                  placeholder="Ej: Desembolso Préstamo, Impresión pieza PETG, Modelado CAD..."
                  required
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Categoría *</Label>
                  <SearchableCombobox
                    items={[
                      { id: 'Servicio de Impresión 3D', label: 'Servicio de Impresión 3D', sublabel: 'Fabricación a pedido', icon: Package },
                      { id: 'Diseño & Modelado CAD', label: 'Diseño & Modelado CAD', sublabel: 'Modelado 3D y prototipado', icon: Tag },
                      { id: 'Préstamo Bancario / Financiamiento', label: 'Préstamo Bancario / Financiamiento', sublabel: 'Inyección de liquidez', icon: Landmark },
                      { id: 'Venta Directa', label: 'Venta Directa / Feria', sublabel: 'Venta de stock presencial', icon: DollarSign },
                      { id: 'Servicio Técnico', label: 'Servicio Técnico / Calibración', sublabel: 'Mantenimiento de impresoras', icon: Package },
                      { id: 'Aporte de Capital', label: 'Aporte de Capital', sublabel: 'Fondos propios', icon: Landmark },
                      { id: 'Otros Ingresos', label: 'Otros Ingresos', sublabel: 'Ingresos varios no clasificados' },
                    ]}
                    value={formCategoria}
                    onChange={(val) => setFormCategoria(val)}
                    allowCustomInput={true}
                    customCreateLabel="Usar categoría:"
                    placeholder="Seleccionar categoría..."
                    icon={Tag}
                    inputClassName="bg-[#F4EFEA]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Método de Pago *</Label>
                  <SearchableCombobox
                    items={[
                      { id: 'YAPE', label: 'Yape', sublabel: 'Billetera digital BCP', badge: 'Digital' },
                      { id: 'PLIN', label: 'Plin', sublabel: 'Billetera digital BBVA/Interbank', badge: 'Digital' },
                      { id: 'TRANSFERENCIA_BCP', label: 'Transferencia BCP', sublabel: 'Cuenta bancaria BCP', badge: 'Banco' },
                      { id: 'TRANSFERENCIA_BBVA', label: 'Transferencia BBVA', sublabel: 'Cuenta bancaria BBVA', badge: 'Banco' },
                      { id: 'TRANSFERENCIA_INTERBANK', label: 'Transferencia Interbank', sublabel: 'Cuenta bancaria Interbank', badge: 'Banco' },
                      { id: 'EFECTIVO', label: 'Efectivo', sublabel: 'Dinero en mano física', badge: 'Caja física' },
                    ]}
                    value={formMetodoPago}
                    onChange={(val) => setFormMetodoPago(val)}
                    placeholder="Seleccionar método..."
                    icon={CreditCard}
                    clearable={false}
                    inputClassName="bg-[#F4EFEA]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Monto Cobrado (S/) *</Label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formMonto}
                    onChange={(e) => setFormMonto(e.target.value)}
                    placeholder="0.00"
                    required
                    className="pl-10 bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono text-base font-bold rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Notas / Observaciones (Opcional)</Label>
                <Input 
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  placeholder="Ej: Pago adelantado del 100%, 24 cuotas..."
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-[#E2D9CC] bg-[#FFFFFF] flex items-center justify-end gap-3 flex-shrink-0">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenModal(false)}
                className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2.5 rounded-xl cursor-pointer font-medium active:scale-[0.98]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#1E5E3A] hover:bg-[#16472C] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar Ingreso'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Ingreso Directo */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="bg-[#FAF8F5] border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-lg max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-3xl z-50">
          <form onSubmit={handleSubmitEdit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 border-b border-[#E2D9CC] bg-[#FFFFFF] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#EBF7EE] text-[#1E5E3A] border border-[#B4E3C0]">
                  <Pencil className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-extrabold text-[#241C15]">
                    Editar Ingreso Directo
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                    Modifica la fecha, monto, concepto o categoría del ingreso registrado.
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenEditModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Fecha del Ingreso *</Label>
                  <Input 
                    type="date"
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    required
                    className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-sm rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Cliente / Entidad *</Label>
                  <Input 
                    value={formCliente}
                    onChange={(e) => setFormCliente(e.target.value)}
                    placeholder="Ej: Banco BCP / Juan Pérez"
                    required
                    className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Concepto / Servicio Realizado *</Label>
                <Input 
                  value={formConcepto}
                  onChange={(e) => setFormConcepto(e.target.value)}
                  placeholder="Ej: Desembolso Préstamo, Impresión pieza PETG, Modelado CAD..."
                  required
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Categoría *</Label>
                  <SearchableCombobox
                    items={[
                      { id: 'Servicio de Impresión 3D', label: 'Servicio de Impresión 3D', sublabel: 'Fabricación a pedido', icon: Package },
                      { id: 'Diseño & Modelado CAD', label: 'Diseño & Modelado CAD', sublabel: 'Modelado 3D y prototipado', icon: Tag },
                      { id: 'Préstamo Bancario / Financiamiento', label: 'Préstamo Bancario / Financiamiento', sublabel: 'Inyección de liquidez', icon: Landmark },
                      { id: 'Venta Directa', label: 'Venta Directa / Feria', sublabel: 'Venta de stock presencial', icon: DollarSign },
                      { id: 'Servicio Técnico', label: 'Servicio Técnico / Calibración', sublabel: 'Mantenimiento de impresoras', icon: Package },
                      { id: 'Aporte de Capital', label: 'Aporte de Capital', sublabel: 'Fondos propios', icon: Landmark },
                      { id: 'Otros Ingresos', label: 'Otros Ingresos', sublabel: 'Ingresos varios no clasificados' },
                    ]}
                    value={formCategoria}
                    onChange={(val) => setFormCategoria(val)}
                    allowCustomInput={true}
                    customCreateLabel="Usar categoría:"
                    placeholder="Seleccionar categoría..."
                    icon={Tag}
                    inputClassName="bg-[#F4EFEA]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Método de Pago *</Label>
                  <SearchableCombobox
                    items={[
                      { id: 'YAPE', label: 'Yape', sublabel: 'Billetera digital BCP', badge: 'Digital' },
                      { id: 'PLIN', label: 'Plin', sublabel: 'Billetera digital BBVA/Interbank', badge: 'Digital' },
                      { id: 'TRANSFERENCIA_BCP', label: 'Transferencia BCP', sublabel: 'Cuenta bancaria BCP', badge: 'Banco' },
                      { id: 'TRANSFERENCIA_BBVA', label: 'Transferencia BBVA', sublabel: 'Cuenta bancaria BBVA', badge: 'Banco' },
                      { id: 'TRANSFERENCIA_INTERBANK', label: 'Transferencia Interbank', sublabel: 'Cuenta bancaria Interbank', badge: 'Banco' },
                      { id: 'EFECTIVO', label: 'Efectivo', sublabel: 'Dinero en mano física', badge: 'Caja física' },
                    ]}
                    value={formMetodoPago}
                    onChange={(val) => setFormMetodoPago(val)}
                    placeholder="Seleccionar método..."
                    icon={CreditCard}
                    clearable={false}
                    inputClassName="bg-[#F4EFEA]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Monto Cobrado (S/) *</Label>
                <div className="relative flex items-center w-full">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#75695D] pointer-events-none">S/</span>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formMonto}
                    onChange={(e) => setFormMonto(e.target.value)}
                    placeholder="0.00"
                    required
                    className="pl-10 bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono text-base font-bold rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Notas / Observaciones (Opcional)</Label>
                <Input 
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  placeholder="Ej: Pago adelantado del 100%, 24 cuotas..."
                  className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] placeholder:text-[#75695D] text-sm rounded-xl focus:border-[#1E5E3A] focus:bg-[#FFFFFF]"
                />
              </div>
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-[#E2D9CC] bg-[#FFFFFF] flex items-center justify-between flex-shrink-0">
              {editingItem && (
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => handleDeleteDirect(editingItem.id, editingItem.concepto)}
                  className="text-[#A34335] hover:bg-red-50 text-xs px-3 py-2 rounded-xl cursor-pointer font-semibold gap-1.5 active:scale-[0.98]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Eliminar Ingreso
                </Button>
              )}
              <div className="flex justify-end gap-3 ml-auto">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setOpenEditModal(false)}
                  className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2.5 rounded-xl cursor-pointer font-medium active:scale-[0.98]"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#1E5E3A] hover:bg-[#16472C] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs cursor-pointer disabled:opacity-50 transition-all active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    'Guardar Cambios'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
