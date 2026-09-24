'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MessageCircle, 
  ShoppingBag, 
  MapPin, 
  AtSign, 
  Mail,
  Eye, 
  Pencil, 
  Trash2, 
  X, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  Package, 
  ExternalLink,
  ChevronRight,
  Filter,
  UserCheck,
  User,
  CreditCard,
  Globe,
  Building2,
  FileText
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useBusiness } from '@/context/BusinessContext'
import { DateRange, getDefaultDateRange, isDateInRange } from '@/lib/date-utils'
import { DateFilterControl } from '@/components/ui/DateFilterControl'
import { 
  ClienteItem, 
  ClienteDetalleView, 
  createCliente, 
  updateCliente, 
  deleteCliente, 
  getClienteDetalle 
} from '@/actions/clientes'

interface ClientesClientProps {
  initialClientes: ClienteItem[]
}

type FiltroPago = 'TODOS' | 'AL_DIA' | 'CON_DEUDA'

export function ClientesClient({ initialClientes }: ClientesClientProps) {
  const router = useRouter()
  const { negocio, config } = useBusiness()
  const [clientes, setClientes] = useState<ClienteItem[]>(initialClientes)
  const [isPending, startTransition] = useTransition()

  // Filtros y búsqueda
  const [search, setSearch] = useState('')
  const [filtroPago, setFiltroPago] = useState<FiltroPago>('TODOS')
  const [canalFilter, setCanalFilter] = useState<string>('TODOS')
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange('ESTE_MES'))

  // Modales
  const [modalFormOpen, setModalFormOpen] = useState(false)
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedDetalle, setSelectedDetalle] = useState<ClienteDetalleView | null>(null)
  const [isLoadingDetalle, setIsLoadingDetalle] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    dni: '',
    telefono: '',
    email: '',
    canalOrigen: 'Instagram',
    handleSocial: '',
    distrito: '',
    direccion: '',
    notas: ''
  })

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Format phone to clean WhatsApp number (Peru 51 default if 9 digits)
  const getWhatsAppUrl = (tel?: string | null, clientName?: string) => {
    if (!tel) return '#'
    let clean = tel.replace(/\D/g, '')
    if (clean.length === 9) clean = `51${clean}`
    const text = encodeURIComponent(`¡Hola ${clientName || ''}! Te escribimos de NOVA Studio...`)
    return `https://wa.me/${clean}?text=${text}`
  }

  // Clientes filtrados por período activo
  const clientesEnRango = useMemo(() => {
    if (dateRange.preset === 'TODO') return clientes
    return clientes.filter(c => {
      const matchUltimo = c.ultimoPedidoFecha ? isDateInRange(c.ultimoPedidoFecha, dateRange.from, dateRange.to) : false
      const matchRegistro = c.createdAt ? isDateInRange(c.createdAt, dateRange.from, dateRange.to) : false
      return matchUltimo || matchRegistro
    })
  }, [clientes, dateRange])

  // KPIs calculados sobre el período activo
  const totalClientes = clientesEnRango.length
  const clientesRecurrentes = useMemo(() => clientesEnRango.filter(c => c.pedidosCount > 1).length, [clientesEnRango])
  const tasaRecurrencia = totalClientes > 0 ? Math.round((clientesRecurrentes / totalClientes) * 100) : 0
  
  const totalDeudaAcumulada = useMemo(() => clientesEnRango.reduce((acc, c) => acc + c.saldoPendiente, 0), [clientesEnRango])
  const clientesConDeudaCount = useMemo(() => clientesEnRango.filter(c => c.saldoPendiente > 0).length, [clientesEnRango])

  const totalFacturadoTotal = useMemo(() => clientesEnRango.reduce((acc, c) => acc + c.totalComprado, 0), [clientesEnRango])
  const ticketPromedio = totalClientes > 0 ? totalFacturadoTotal / totalClientes : 0

  // Canales disponibles para filtro
  const canalesList = useMemo(() => {
    const set = new Set<string>()
    clientesEnRango.forEach(c => {
      if (c.canalOrigen) set.add(c.canalOrigen)
      if (c.canalPreferido) set.add(c.canalPreferido)
    })
    return Array.from(set).sort()
  }, [clientesEnRango])

  // Filtrado de clientes
  const filteredClientes = useMemo(() => {
    return clientesEnRango.filter(c => {
      // Filtro de búsqueda
      const q = search.trim().toLowerCase()
      const matchSearch = !q || 
        c.nombre.toLowerCase().includes(q) ||
        (c.dni && c.dni.toLowerCase().includes(q)) ||
        (c.telefono && c.telefono.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.handleSocial && c.handleSocial.toLowerCase().includes(q)) ||
        (c.distrito && c.distrito.toLowerCase().includes(q)) ||
        (c.direccion && c.direccion.toLowerCase().includes(q))

      // Filtro de estado de pago
      let matchPago = true
      if (filtroPago === 'AL_DIA') matchPago = c.saldoPendiente <= 0
      if (filtroPago === 'CON_DEUDA') matchPago = c.saldoPendiente > 0

      // Filtro de canal
      let matchCanal = true
      if (canalFilter !== 'TODOS') {
        matchCanal = (c.canalOrigen?.toLowerCase() === canalFilter.toLowerCase()) || 
                     (c.canalPreferido?.toLowerCase() === canalFilter.toLowerCase())
      }

      return matchSearch && matchPago && matchCanal
    })
  }, [clientesEnRango, search, filtroPago, canalFilter])

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({
      nombre: '',
      dni: '',
      telefono: '',
      email: '',
      canalOrigen: 'Instagram',
      handleSocial: '',
      distrito: '',
      direccion: '',
      notas: ''
    })
    setModalFormOpen(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (c: ClienteItem) => {
    setEditingId(c.id)
    setFormData({
      nombre: c.nombre,
      dni: c.dni || '',
      telefono: c.telefono || '',
      email: c.email || '',
      canalOrigen: c.canalOrigen || c.canalPreferido || 'Instagram',
      handleSocial: c.handleSocial || '',
      distrito: c.distrito || '',
      direccion: c.direccion || '',
      notas: c.notas || ''
    })
    setModalFormOpen(true)
  }

  // View Client Profile / History Modal
  const handleVerDetalle = async (c: ClienteItem) => {
    setIsLoadingDetalle(true)
    setModalDetalleOpen(true)
    setSelectedDetalle(null)

    try {
      const detalle = await getClienteDetalle(c.id || c.nombre)
      setSelectedDetalle(detalle)
    } catch (err: any) {
      toast.error('Error al cargar historial: ' + err.message)
    } finally {
      setIsLoadingDetalle(false)
    }
  }

  // Submit Create / Edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombre.trim()) {
      toast.error('El nombre del cliente es obligatorio')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        const updated = await updateCliente(editingId, {
          nombre: formData.nombre.trim(),
          dni: formData.dni.trim() || undefined,
          telefono: formData.telefono.trim() || undefined,
          email: formData.email.trim() || undefined,
          canalOrigen: formData.canalOrigen.trim() || undefined,
          handleSocial: formData.handleSocial.trim() || undefined,
          distrito: formData.distrito.trim() || undefined,
          direccion: formData.direccion.trim() || undefined,
          notas: formData.notas.trim() || undefined
        })
        setClientes(prev => prev.map(c => c.id === editingId ? { ...c, ...updated } : c))
        toast.success(`Cliente "${updated.nombre}" actualizado`)
      } else {
        const nuevo = await createCliente({
          nombre: formData.nombre.trim(),
          dni: formData.dni.trim() || undefined,
          telefono: formData.telefono.trim() || undefined,
          email: formData.email.trim() || undefined,
          canalOrigen: formData.canalOrigen.trim() || undefined,
          handleSocial: formData.handleSocial.trim() || undefined,
          distrito: formData.distrito.trim() || undefined,
          direccion: formData.direccion.trim() || undefined,
          notas: formData.notas.trim() || undefined
        })
        setClientes(prev => [{
          ...nuevo,
          totalComprado: 0,
          totalPagado: 0,
          saldoPendiente: 0,
          puntos: 0,
          pedidosCount: 0,
          piezasCount: 0,
          ultimoPedidoFecha: null,
          canalPreferido: nuevo.canalOrigen
        }, ...prev])
        toast.success(`Cliente "${nuevo.nombre}" registrado exitosamente`)
      }

      setModalFormOpen(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al guardar cliente')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete / Archive Client
  const handleDelete = async (c: ClienteItem) => {
    if (!confirm(`¿Estás seguro de eliminar o archivar a "${c.nombre}"?`)) return

    try {
      await deleteCliente(c.id)
      setClientes(prev => prev.filter(item => item.id !== c.id))
      toast.success(`Cliente "${c.nombre}" eliminado`)
      router.refresh()
    } catch (err: any) {
      toast.error('Error al eliminar cliente: ' + err.message)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ========================================================================= */}
      {/* 1. HEADER                                                                 */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#FFFFFF] p-4 sm:p-5 rounded-2xl border border-[#E2D9CC] shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center shadow-2xs shrink-0">
            <Users className="h-6 w-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-[#241C15] tracking-tight">
                Directorio de Clientes
              </h1>
              <Badge variant="outline" className="text-[10px] font-bold px-2 py-0 bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC]">
                {config.name}
              </Badge>
            </div>
            <p className="text-xs text-[#75695D] mt-0.5">
              Control de clientes, historial de pedidos, saldos por cobrar y WhatsApp directo
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateFilterControl
            value={dateRange}
            onChange={setDateRange}
          />

          <Link
            href="/pedidos"
            className="h-9 px-3 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F8F6F2] text-[#241C15] font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
          >
            <ShoppingBag className="h-4 w-4 text-[#75695D]" />
            <span>Ver Pedidos</span>
          </Link>

          <Button
            onClick={handleOpenCreate}
            className="h-9 px-3.5 rounded-xl bg-[#A36F4C] hover:bg-[#8C5D3D] text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Cliente</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPI SUMMARY CARDS                                                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Clientes */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2D9CC] shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#75695D] uppercase tracking-wider">Cartera Total</span>
            <span className="h-7 w-7 rounded-xl bg-[#F5EBE1] text-[#A36F4C] flex items-center justify-center text-xs">
              <Users className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#241C15] tracking-tight">
            {totalClientes}
          </div>
          <div className="text-[11px] text-[#75695D] flex items-center gap-1 font-medium">
            <span className="text-[#1E5E3A] font-bold">100%</span> registros activos
          </div>
        </div>

        {/* Card 2: Clientes Recurrentes */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2D9CC] shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#75695D] uppercase tracking-wider">Recurrentes</span>
            <span className="h-7 w-7 rounded-xl bg-[#ECFDF5] text-[#1E5E3A] flex items-center justify-center text-xs">
              <UserCheck className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1E5E3A] tracking-tight">
            {clientesRecurrentes}
          </div>
          <div className="text-[11px] text-[#75695D] flex items-center gap-1 font-medium">
            <span className="font-bold text-[#1E5E3A]">{tasaRecurrencia}%</span> fidelización (2+ pedidos)
          </div>
        </div>

        {/* Card 3: Cuentas por Cobrar */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2D9CC] shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#75695D] uppercase tracking-wider">Por Cobrar</span>
            <span className={`h-7 w-7 rounded-xl flex items-center justify-center text-xs ${
              totalDeudaAcumulada > 0 ? 'bg-[#FEF2F2] text-[#DC2626]' : 'bg-[#ECFDF5] text-[#1E5E3A]'
            }`}>
              <AlertCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className={`text-xl sm:text-2xl font-black tracking-tight ${
            totalDeudaAcumulada > 0 ? 'text-[#DC2626]' : 'text-[#1E5E3A]'
          }`}>
            {formatCurrency(totalDeudaAcumulada)}
          </div>
          <div className="text-[11px] text-[#75695D] flex items-center gap-1 font-medium">
            {clientesConDeudaCount > 0 ? (
              <span className="text-[#DC2626] font-bold">{clientesConDeudaCount} cliente(s) con saldo</span>
            ) : (
              <span className="text-[#1E5E3A] font-bold">Todos al día ✅</span>
            )}
          </div>
        </div>

        {/* Card 4: Ticket Promedio */}
        <div className="p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2D9CC] shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#75695D] uppercase tracking-wider">Ticket Promedio</span>
            <span className="h-7 w-7 rounded-xl bg-[#F5EBE1] text-[#A36F4C] flex items-center justify-center text-xs">
              <TrendingUp className="h-3.5 w-3.5" />
            </span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#241C15] tracking-tight">
            {formatCurrency(ticketPromedio)}
          </div>
          <div className="text-[11px] text-[#75695D] flex items-center gap-1 font-medium">
            LTV medio por cliente
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FILTROS & BARRA DE BÚSQUEDA                                            */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] p-3.5 rounded-2xl border border-[#E2D9CC] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Buscador */}
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
          <Input 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, WhatsApp, @Instagram o distrito..."
            className="pl-9 bg-[#F8F6F2] border-[#E2D9CC] text-xs font-medium text-[#241C15] h-9 rounded-xl focus:bg-white"
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-0.5"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filtros rápidos */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {/* Filtro Estado de Pago */}
          <div className="flex items-center rounded-xl bg-[#F8F6F2] p-0.5 border border-[#E2D9CC] text-xs font-bold">
            <button
              type="button"
              onClick={() => setFiltroPago('TODOS')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filtroPago === 'TODOS' ? 'bg-[#FFFFFF] text-[#241C15] shadow-2xs' : 'text-[#75695D]'
              }`}
            >
              Todos ({clientes.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroPago('AL_DIA')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filtroPago === 'AL_DIA' ? 'bg-[#FFFFFF] text-[#1E5E3A] shadow-2xs' : 'text-[#75695D]'
              }`}
            >
              Al Día
            </button>
            <button
              type="button"
              onClick={() => setFiltroPago('CON_DEUDA')}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                filtroPago === 'CON_DEUDA' ? 'bg-[#FFFFFF] text-[#DC2626] shadow-2xs' : 'text-[#75695D]'
              }`}
            >
              Con Deuda ({clientesConDeudaCount})
            </button>
          </div>

          {/* Filtro por Canal de Origen */}
          {canalesList.length > 0 && (
            <select
              value={canalFilter}
              onChange={(e) => setCanalFilter(e.target.value)}
              className="h-8 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] px-2.5 text-xs font-bold text-[#75695D] cursor-pointer"
            >
              <option value="TODOS">Todos los Canales</option>
              {canalesList.map(canal => (
                <option key={canal} value={canal}>{canal}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TABLA PRINCIPAL (REGLA: CERO SCROLL HORIZONTAL)                        */}
      {/* ========================================================================= */}
      <div className="hidden lg:block w-full bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed text-xs">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[18%]" />
            <col className="w-[16%]" />
            <col className="w-[14%]" />
            <col className="w-[12%]" />
            <col className="w-[10%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#E2D9CC] text-[#75695D] text-[11px] font-semibold">
              <th className="py-3.5 px-4 font-bold text-left">Cliente & Canal</th>
              <th className="py-3.5 px-4 font-bold text-left">Contacto / WhatsApp</th>
              <th className="py-3.5 px-4 font-bold text-left">Ubicación</th>
              <th className="py-3.5 px-4 font-bold text-right">LTV / Puntos</th>
              <th className="py-3.5 px-4 font-bold text-center">Estado Pago</th>
              <th className="py-3.5 px-4 font-bold text-right pr-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2D9CC]">
            {filteredClientes.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#75695D] italic bg-[#FFFFFF]">
                  No se encontraron clientes con los filtros aplicados
                </td>
              </tr>
            ) : (
              filteredClientes.map((c) => {
                const initials = c.nombre.substring(0, 2).toUpperCase()
                const tieneDeuda = c.saldoPendiente > 0

                return (
                  <tr key={c.id} className="h-16 transition-colors hover:bg-[#FAF8F5]">
                    {/* Col 1: Cliente & Canal */}
                    <td className="py-3 px-4 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleVerDetalle(c)}
                            className="font-bold text-sm text-[#241C15] hover:text-[#A36F4C] block truncate text-left cursor-pointer transition-colors"
                            title={c.nombre}
                          >
                            {c.nombre}
                          </button>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {c.dni && (
                              <span className="text-[10px] font-mono font-bold px-1 py-0 rounded bg-[#F8F6F2] border border-[#E2D9CC] text-[#75695D]">
                                DNI: {c.dni}
                              </span>
                            )}
                            {c.handleSocial ? (
                              <span className="text-[10px] text-[#A36F4C] font-semibold flex items-center gap-0.5 truncate">
                                <AtSign className="h-3 w-3 inline shrink-0" />
                                {c.handleSocial.replace(/^@/, '')}
                              </span>
                            ) : (
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC]">
                                {c.canalOrigen || c.canalPreferido || 'Directo'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Col 2: Contacto & WhatsApp Rápido & Correo */}
                    <td className="py-3 px-4 min-w-0">
                      <div className="space-y-1">
                        {c.telefono ? (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={getWhatsAppUrl(c.telefono, c.nombre)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#EBF7EE] border border-[#B4E3C0] text-[#1E5E3A] hover:bg-[#DCF4E3] text-[11px] font-bold transition-colors cursor-pointer shadow-2xs"
                              title="Abrir chat de WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5 shrink-0 fill-[#1E5E3A]" />
                              <span className="font-mono">{c.telefono}</span>
                            </a>
                          </div>
                        ) : (
                          <span className="text-[#75695D] text-[11px] italic block">Sin teléfono</span>
                        )}

                        {c.email && (
                          <div className="flex items-center gap-1 text-[11px] text-[#75695D] truncate" title={c.email}>
                            <Mail className="h-3 w-3 shrink-0 text-[#A36F4C]" />
                            <span className="truncate">{c.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Col 3: Ubicación */}
                    <td className="py-3 px-4 min-w-0 text-xs text-[#241C15]">
                      <div className="truncate" title={c.direccion || c.distrito || 'No especificada'}>
                        <span className="font-bold block truncate">
                          {c.distrito || 'Lima'}
                        </span>
                        <span className="text-[10px] text-[#75695D] block truncate">
                          {c.direccion || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Col 4: LTV & Pedidos & Puntos */}
                    <td className="py-3 px-4 text-right font-mono text-xs min-w-0 tabular-nums">
                      <span className="font-black text-[#241C15] block">
                        {formatCurrency(c.totalComprado)}
                      </span>
                      <span className="text-[10px] text-[#75695D] block font-sans">
                        {c.puntos} pts • {c.pedidosCount} ped.
                      </span>
                    </td>

                    {/* Col 5: Estado Pago */}
                    <td className="py-3 px-4 text-center min-w-0">
                      {tieneDeuda ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[10px] font-bold">
                          Debe {formatCurrency(c.saldoPendiente)}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#B4E3C0] text-[#1E5E3A] text-[10px] font-bold">
                          Al día
                        </span>
                      )}
                    </td>

                    {/* Col 6: Acciones Rápidas */}
                    <td className="py-3 px-4 text-right pr-4 min-w-0">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleVerDetalle(c)}
                          className="p-1.5 rounded-xl border border-[#E2D9CC] bg-white hover:bg-[#F4EFEA] text-[#75695D] hover:text-[#A36F4C] transition-colors cursor-pointer shadow-2xs"
                          title="Ver Ficha y Historial"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 rounded-xl border border-[#E2D9CC] bg-white hover:bg-[#F4EFEA] text-[#75695D] hover:text-[#A36F4C] transition-colors cursor-pointer shadow-2xs"
                          title="Editar Datos"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="p-1.5 rounded-xl border border-[#E2D9CC] bg-white hover:bg-[#FEE2E2] text-[#75695D] hover:text-[#DC2626] transition-colors cursor-pointer shadow-2xs"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ========================================================================= */}
      {/* 5. VISTA MÓVIL (CARDS)                                                    */}
      {/* ========================================================================= */}
      <div className="lg:hidden space-y-3">
        {filteredClientes.length === 0 ? (
          <div className="bg-[#FFFFFF] p-8 text-center text-xs text-[#75695D] italic rounded-2xl border border-[#E2D9CC]">
            No se encontraron clientes con los filtros aplicados
          </div>
        ) : (
          filteredClientes.map((c) => {
            const initials = c.nombre.substring(0, 2).toUpperCase()
            const tieneDeuda = c.saldoPendiente > 0

            return (
              <div key={c.id} className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E2D9CC] shadow-2xs space-y-3">
                {/* Fila 1: Avatar, Nombre y Estado Pago */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-10 w-10 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-[#241C15] truncate">{c.nombre}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-[#75695D]">
                        <span>{c.canalOrigen || c.canalPreferido || 'Directo'}</span>
                        {c.distrito && <span>• {c.distrito}</span>}
                      </div>
                    </div>
                  </div>

                  <div>
                    {tieneDeuda ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] text-[10px] font-bold">
                        Debe {formatCurrency(c.saldoPendiente)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#B4E3C0] text-[#1E5E3A] text-[10px] font-bold">
                        Al día
                      </span>
                    )}
                  </div>
                </div>

                {/* Fila 2: Estadísticas Rápidas */}
                <div className="grid grid-cols-2 gap-2 p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E2D9CC] text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-[#75695D] block font-sans">Total Comprado (LTV)</span>
                    <span className="font-black text-[#241C15]">{formatCurrency(c.totalComprado)}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#75695D] block font-sans">NovaPoints / Pedidos</span>
                    <span className="font-bold text-[#241C15]">{c.puntos} pts ({c.pedidosCount})</span>
                  </div>
                </div>

                {/* Fila 3: Acciones Móvil */}
                <div className="flex items-center gap-2 pt-1 border-t border-[#E2D9CC]">
                  {c.telefono ? (
                    <a
                      href={getWhatsAppUrl(c.telefono, c.nombre)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-8 px-3 rounded-xl bg-[#EBF7EE] border border-[#B4E3C0] text-[#1E5E3A] font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <MessageCircle className="h-3.5 w-3.5 fill-[#1E5E3A]" />
                      <span>WhatsApp</span>
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleVerDetalle(c)}
                    className="flex-1 h-8 px-3 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F8F6F2] text-[#241C15] font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Eye className="h-3.5 w-3.5 text-[#A36F4C]" />
                    <span>Ver Ficha</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(c)}
                    className="h-8 w-8 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F8F6F2] text-[#75695D] flex items-center justify-center shadow-2xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. MODAL: CREAR / EDITAR CLIENTE                                          */}
      {/* ========================================================================= */}
      <Dialog open={modalFormOpen} onOpenChange={setModalFormOpen}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[580px] max-h-[90dvh] overflow-y-auto p-0 rounded-3xl shadow-2xl z-50">
          <form onSubmit={handleSubmitForm} className="p-5 sm:p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center shrink-0 shadow-2xs">
                  {editingId ? <Pencil className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-[#241C15]">
                    {editingId ? 'Editar Cliente' : 'Registrar Nuevo Cliente'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                    Información de contacto, ubicación y preferencias
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalFormOpen(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-xl hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3.5">
              {/* Nombre Completo */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-[#241C15] uppercase tracking-wider">
                  Nombre Completo *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A36F4C]/70 pointer-events-none" />
                  <Input 
                    value={formData.nombre}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Ej: Juan Pérez / Empresa ABC"
                    required
                    autoFocus
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-bold text-[#241C15] h-10 pl-9.5 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Fila 1: DNI y Teléfono (2 columnas) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-[#241C15] uppercase tracking-wider">
                    DNI / RUC / CE
                  </Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A36F4C]/70 pointer-events-none" />
                    <Input 
                      value={formData.dni}
                      onChange={(e) => setFormData(prev => ({ ...prev, dni: e.target.value }))}
                      placeholder="Ej: 72345678"
                      maxLength={12}
                      className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs font-mono font-bold text-[#241C15] h-10 pl-9.5 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-[#241C15] uppercase tracking-wider">
                    Teléfono / WhatsApp
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A36F4C]/70 pointer-events-none" />
                    <Input 
                      value={formData.telefono}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="Ej: 987654321"
                      className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs font-mono font-bold text-[#241C15] h-10 pl-9.5 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 2: Correo Electrónico (Ancho Completo para evitar truncamiento) */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-[#241C15] uppercase tracking-wider">
                  Correo Electrónico
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A36F4C]/70 pointer-events-none" />
                  <Input 
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="cliente@ejemplo.com"
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs font-medium text-[#241C15] h-10 pl-9.5 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              {/* Fila 3: Canal de Origen y Red Social */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-[#241C15] uppercase tracking-wider">
                    Canal de Origen
                  </Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A36F4C]/70 pointer-events-none" />
                    <select
                      value={formData.canalOrigen}
                      onChange={(e) => setFormData(prev => ({ ...prev, canalOrigen: e.target.value }))}
                      className="w-full h-10 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] pl-9.5 pr-3 text-xs font-bold text-[#241C15] focus:bg-white transition-colors outline-none cursor-pointer"
                    >
                      <option value="Instagram">Instagram</option>
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Feria">Feria / Evento</option>
                      <option value="Recomendación">Recomendación</option>
                      <option value="Directo">Directo / Amigo</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-[#241C15] uppercase tracking-wider">
                    {formData.canalOrigen === 'Instagram'
                      ? 'Usuario Instagram'
                      : formData.canalOrigen === 'TikTok'
                      ? 'Usuario TikTok'
                      : 'Usuario / Red Social'}
                  </Label>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A36F4C]/70 pointer-events-none" />
                    <Input 
                      value={formData.handleSocial}
                      onChange={(e) => setFormData(prev => ({ ...prev, handleSocial: e.target.value }))}
                      placeholder={formData.canalOrigen === 'Instagram' || formData.canalOrigen === 'TikTok' ? '@usuario' : 'Perfil o contacto'}
                      className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs font-medium text-[#241C15] h-10 pl-9.5 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 4: Distrito y Dirección de Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-[#241C15] uppercase tracking-wider">
                    Distrito / Ciudad
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A36F4C]/70 pointer-events-none" />
                    <Input 
                      value={formData.distrito}
                      onChange={(e) => setFormData(prev => ({ ...prev, distrito: e.target.value }))}
                      placeholder="Ej: Miraflores, Lima"
                      className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs font-medium text-[#241C15] h-10 pl-9.5 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold text-[#241C15] uppercase tracking-wider">
                    Dirección de Entrega
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A36F4C]/70 pointer-events-none" />
                    <Input 
                      value={formData.direccion}
                      onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                      placeholder="Ej: Av. Larco 123 Dpto 402"
                      className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs font-medium text-[#241C15] h-10 pl-9.5 focus:bg-white transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 5: Notas / Preferencias */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold text-[#75695D] uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-[#A36F4C]" />
                  Notas / Preferencias del Cliente
                </Label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                  placeholder="Ej: Le gustan los colores pastel, pide entrega por Olva Courier, etc."
                  rows={2}
                  className="w-full bg-[#F8F6F2] border border-[#E2D9CC] rounded-xl p-3 text-xs text-[#241C15] font-medium resize-none focus:bg-white focus:outline-none transition-colors"
                />
              </div>
            </div>

            {/* Footer Actions */}
            <div className="pt-3 border-t border-[#E2D9CC] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalFormOpen(false)}
                className="px-4 py-2 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F8F6F2] text-xs font-bold text-[#75695D] cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-[#A36F4C] hover:bg-[#8C5D3D] text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
              >
                {isSubmitting ? 'Guardando...' : editingId ? 'Guardar Cambios' : 'Registrar Cliente'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 7. MODAL: FICHA DE DETALLE & HISTORIAL DEL CLIENTE                        */}
      {/* ========================================================================= */}
      <Dialog open={modalDetalleOpen} onOpenChange={setModalDetalleOpen}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[620px] max-h-[90dvh] overflow-y-auto p-0 rounded-3xl shadow-2xl z-50">
          <div className="p-5 sm:p-6 space-y-5">
            
            {/* Header Ficha */}
            <div className="flex items-start justify-between border-b border-[#E2D9CC] pb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center font-black text-sm shrink-0 shadow-2xs">
                  {selectedDetalle?.nombre.substring(0, 2).toUpperCase() || 'CL'}
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-[#241C15]">
                    {selectedDetalle?.nombre || 'Cargando cliente...'}
                  </DialogTitle>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-[#75695D]">
                    {selectedDetalle?.dni && (
                      <span className="font-mono font-bold px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#E2D9CC] text-[#241C15]">
                        DNI: {selectedDetalle.dni}
                      </span>
                    )}
                    {selectedDetalle?.telefono && (
                      <span className="font-mono font-bold text-[#241C15]">{selectedDetalle.telefono}</span>
                    )}
                    {selectedDetalle?.email && (
                      <span className="text-[#75695D] flex items-center gap-1">
                        <Mail className="h-3 w-3 inline text-[#A36F4C]" />
                        {selectedDetalle.email}
                      </span>
                    )}
                    {selectedDetalle?.distrito && (
                      <span>• {selectedDetalle.distrito}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalDetalleOpen(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-xl hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isLoadingDetalle ? (
              <div className="py-12 text-center text-xs text-[#75695D] italic">
                Cargando historial de pedidos y métricas...
              </div>
            ) : selectedDetalle ? (
              <div className="space-y-4">
                
                {/* Resumen Comercial KPIs */}
                <div className="grid grid-cols-3 gap-2.5 p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E2D9CC] text-center font-mono">
                  <div>
                    <span className="text-[10px] text-[#75695D] block font-sans">Total Comprado (LTV)</span>
                    <span className="text-sm font-black text-[#241C15]">{formatCurrency(selectedDetalle.totalComprado)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#75695D] block font-sans">Total Pagado</span>
                    <span className="text-sm font-bold text-[#1E5E3A]">{formatCurrency(selectedDetalle.totalPagado)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#75695D] block font-sans">Saldo Pendiente</span>
                    <span className={`text-sm font-black ${selectedDetalle.saldoPendiente > 0 ? 'text-[#DC2626]' : 'text-[#1E5E3A]'}`}>
                      {formatCurrency(selectedDetalle.saldoPendiente)}
                    </span>
                  </div>
                </div>

                {/* Acciones de Contacto Rápido */}
                <div className="flex items-center gap-2">
                  {selectedDetalle.telefono && (
                    <a
                      href={getWhatsAppUrl(selectedDetalle.telefono, selectedDetalle.nombre)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 h-9 px-3 rounded-xl bg-[#EBF7EE] border border-[#B4E3C0] text-[#1E5E3A] font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs hover:bg-[#DCF4E3] transition-colors"
                    >
                      <MessageCircle className="h-4 w-4 fill-[#1E5E3A]" />
                      <span>Escribir por WhatsApp</span>
                    </a>
                  )}

                  <Link
                    href={`/pedidos`}
                    className="flex-1 h-9 px-3 rounded-xl bg-[#A36F4C] hover:bg-[#8C5D3D] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Crear Nuevo Pedido</span>
                  </Link>
                </div>

                {/* Notas del cliente si existen */}
                {selectedDetalle.notas && (
                  <div className="p-3 bg-[#FFFDF9] border border-[#E8D49B] rounded-xl text-xs space-y-1">
                    <span className="font-bold text-[#8C6D1F] block uppercase text-[10px]">Notas / Preferencias:</span>
                    <p className="text-[#241C15]">{selectedDetalle.notas}</p>
                  </div>
                )}

                {/* Historial de Pedidos */}
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-[#241C15] uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-[#A36F4C]" />
                      Historial de Pedidos ({selectedDetalle.pedidos.length})
                    </h4>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedDetalle.pedidos.length === 0 ? (
                      <div className="p-4 bg-[#FAF8F5] text-center text-xs text-[#75695D] italic rounded-xl border border-[#E2D9CC]">
                        Este cliente aún no tiene pedidos registrados
                      </div>
                    ) : (
                      selectedDetalle.pedidos.map(p => (
                        <div key={p.id} className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E2D9CC] text-xs space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-[#241C15]">{p.codigo}</span>
                              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-white text-[#75695D] border-[#E2D9CC]">
                                {p.estado}
                              </Badge>
                            </div>
                            <span className="font-mono font-black text-[#241C15]">
                              {formatCurrency(p.total)}
                            </span>
                          </div>

                          <div className="text-[11px] text-[#75695D] space-y-0.5">
                            {p.items.map((it, idx) => (
                              <div key={idx} className="flex justify-between">
                                <span>{it.cantidad}x {it.nombre}</span>
                                <span className="font-mono">{formatCurrency(it.subtotal)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-[#E2D9CC]/70 text-[10px] text-[#75695D]">
                            <span>{new Date(p.fecha).toLocaleDateString('es-PE')}</span>
                            {p.saldoPendiente > 0 ? (
                              <span className="text-[#DC2626] font-bold">Saldo: {formatCurrency(p.saldoPendiente)}</span>
                            ) : (
                              <span className="text-[#1E5E3A] font-bold">Pagado 100%</span>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : null}

          </div>
        </DialogContent>
      </Dialog>

    </div>
  )
}
