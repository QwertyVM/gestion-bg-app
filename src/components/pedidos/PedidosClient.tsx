'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Search,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  DollarSign,
  Clock,
  CheckCircle2,
  Truck,
  ArrowRight,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  Receipt,
  FileText,
  Share2,
  Copy,
  Printer,
  ChevronRight,
  ChevronLeft,
  SlidersHorizontal,
  X,
  Palette,
  Layers,
  Sparkles,
  Percent,
  CreditCard,
  Send,
  Boxes,
  ExternalLink,
  Pencil,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react'
import { DateFilterControl } from '@/components/ui/DateFilterControl'
import { DateRange, getPresetDateRange, isDateInRange } from '@/lib/date-utils'
import { EstadoPedido, TipoPrecio } from '@prisma/client'
import { createPedido, updateEstadoPedido, updatePedido, addPagoPedido, deletePedido } from '@/actions/pedidos'
import { formatDate } from '@/lib/utils'
import { OrderCustomerSection, type ClienteOption } from './OrderCustomerSection'
import { createCliente } from '@/actions/clientes'
import { toast } from 'sonner'
import { OrderDetailsModal } from './OrderDetailsModal'
import { OrdersTableView } from './OrdersTableView'

export interface ItemPedidoView {
  id: string
  pedidoId: string
  productoId: string
  nombreProductoSnapshot: string
  costoBaseSnapshot: number
  colorFilamentoId: string | null
  coloresIds?: string[]
  colores?: FilamentoOption[]
  personalizacion: string | null
  cantidad: number
  tipoPrecio: TipoPrecio
  precioUnitario: number
  costoPackaging: number
  porcentajeAdicional: number
  gramosConsumidos: number
  subtotal: number
  producto?: {
    id: string
    lineaCategoria: string
    nombreModelo: string
    costoBase: number
    precioAmigos: number
    precioMercado: number
    precioComunidad?: number
    pesoGramos: number
    activo: boolean
    imagenUrl?: string | null
  } | null
  colorFilamento?: {
    id: string
    nombreColor: string
    numeroBobina?: number | null
    codigoHex?: string | null
    tipoMaterial: string
    marca?: string | null
    stockGramos?: number | null
    stockBobinas: number
  } | null
}

export interface PagoPedidoView {
  id: string
  pedidoId: string
  fecha: string
  monto: number
  metodoPago: string
  tipo: string
  notas: string | null
}

export interface PedidoView {
  id: string
  codigo: string
  fecha: string
  cliente: string
  dni?: string | null
  telefono: string | null
  canalVenta: string | null
  destinoEnvio: string | null
  diaEntregaPrometida: string | null
  notas: string | null
  metodoPago?: string | null
  estado: EstadoPedido
  costoEnvio: number
  subtotal: number
  total: number
  montoPagado: number
  saldoPendiente: number
  items: ItemPedidoView[]
  pagos: PagoPedidoView[]
  totalItemsCount: number
  createdAt: string
  updatedAt: string
}

export interface ProductoOption {
  id: string
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioAmigos: number
  precioMercado: number
  precioComunidad?: number
  pesoGramos: number
  activo: boolean
  imagenUrl?: string | null
}

export interface FilamentoOption {
  id: string
  nombreColor: string
  codigoHex?: string | null
  tipoMaterial: string
  marca?: string | null
  stockGramos?: number | null
  stockBobinas: number
  numeroBobina?: number | null
  estado?: string
}

interface PedidosClientProps {
  pedidosIniciales: PedidoView[]
  productos: ProductoOption[]
  filamentos?: FilamentoOption[]
  clientesIniciales?: ClienteOption[]
}

interface FormItemState {
  id: string
  productoId: string
  colorFilamentoId?: string
  coloresIds?: string[]
  personalizacion: string
  cantidad: number | string
  tipoPrecio: TipoPrecio
  precioUnitario: number | string
  costoPackaging: number | string
  porcentajeAdicional: number
  gramosConsumidos: number
}

const ESTADOS_CONFIG: Record<EstadoPedido, { label: string; colorBg: string; colorText: string; colorBorder: string; icon: any }> = {
  PENDIENTE: {
    label: 'Pendiente',
    colorBg: 'bg-[#FDF6E2]',
    colorText: 'text-[#8C6D1F]',
    colorBorder: 'border-[#E8D49B]',
    icon: Clock
  },
  PAGO_VALIDADO: {
    label: 'Pago Validado',
    colorBg: 'bg-[#ECFDF5]',
    colorText: 'text-[#065F46]',
    colorBorder: 'border-[#A7F3D0]',
    icon: CheckCircle2
  },
  EN_PRODUCCION: {
    label: 'Preparando',
    colorBg: 'bg-[#EBF3FB]',
    colorText: 'text-[#2B6CB0]',
    colorBorder: 'border-[#BEE3F8]',
    icon: Package
  },
  LISTO_ENTREGA: {
    label: 'Por Entregar',
    colorBg: 'bg-[#FAF0F8]',
    colorText: 'text-[#805AD5]',
    colorBorder: 'border-[#E9D8FD]',
    icon: Package
  },
  ENTREGADO: {
    label: 'Entregado',
    colorBg: 'bg-[#EBF7EE]',
    colorText: 'text-[#1E5E3A]',
    colorBorder: 'border-[#B4E3C0]',
    icon: CheckCircle2
  },
  CANCELADO: {
    label: 'Cancelado',
    colorBg: 'bg-red-50',
    colorText: 'text-[#A34335]',
    colorBorder: 'border-red-200',
    icon: X
  }
}

export function PedidosClient({ pedidosIniciales, productos, filamentos, clientesIniciales }: PedidosClientProps) {
  const [pedidos, setPedidos] = useState<PedidoView[]>(pedidosIniciales)
  const [search, setSearch] = useState('')
  const [selectedEstadoFilter, setSelectedEstadoFilter] = useState<string>('TODOS')
  const [selectedPagoFilter, setSelectedPagoFilter] = useState<string>('TODOS')
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false)
  const [selectedPedidoDetail, setSelectedPedidoDetail] = useState<PedidoView | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedNotification, setCopiedNotification] = useState(false)

  // Abono rápido dentro del modal
  const [abonoMonto, setAbonoMonto] = useState('')
  const [abonoMetodo, setAbonoMetodo] = useState('YAPE')
  const [abonoTipo, setAbonoTipo] = useState('SALDO_ENTREGA')
  const [abonoNotas, setAbonoNotas] = useState('')
  const [isSubmittingAbono, setIsSubmittingAbono] = useState(false)

  // Estado para Edición / Mantenimiento de Pedido
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editingPedido, setEditingPedido] = useState<PedidoView | null>(null)
  const [editEstado, setEditEstado] = useState<EstadoPedido>('PENDIENTE')

  // Estado para Vista de Tabla Interactiva y Paginación
  const [sortField, setSortField] = useState<'fecha' | 'codigo' | 'cliente' | 'cantidad' | 'total' | 'saldoPendiente' | 'estado'>('fecha')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDateRange('TODO'))

  // =========================================================================
  // ESTADO DEL FORMULARIO MULTIPRODUCTO
  // =========================================================================
  const [formFecha, setFormFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [formCliente, setFormCliente] = useState('')
  const [formDni, setFormDni] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formCanal, setFormCanal] = useState('WhatsApp')
  const [formDestino, setFormDestino] = useState('')
  const [formDiaEntrega, setFormDiaEntrega] = useState('')
  const [formNotas, setFormNotas] = useState('')
  const [formCostoEnvio, setFormCostoEnvio] = useState<string>('')
  const [formMontoPagado, setFormMontoPagado] = useState<string>('')
  const [formMetodoPago, setFormMetodoPago] = useState('YAPE')
  const [formNotasPago, setFormNotasPago] = useState('')
  const [formDescontarStock, setFormDescontarStock] = useState(true)

  // =========================================================================
  // GESTIÓN Y BÚSQUEDA DE CLIENTES (ESTILO GESTIÓN 3D)
  // =========================================================================
  const [clientesList, setClientesList] = useState<ClienteOption[]>(() => clientesIniciales || [])
  const [clientSelectMode, setClientSelectMode] = useState<'EXISTING' | 'NEW'>(() => (clientesIniciales && clientesIniciales.length > 0 ? 'EXISTING' : 'NEW'))
  const [selectedClientOption, setSelectedClientOption] = useState<ClienteOption | null>(null)
  const [clientSearchTerm, setClientSearchTerm] = useState('')
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false)
  const [isRegisteringClientInline, setIsRegisteringClientInline] = useState(false)

  // Filtrado de clientes para autocompletado flotante
  const filteredClientOptions = useMemo(() => {
    if (!clientSearchTerm.trim()) {
      return (clientesList || []).slice(0, 30)
    }
    const q = clientSearchTerm.trim().toLowerCase()
    const qNorm = q.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    return (clientesList || []).filter(c => {
      const n = (c.nombre || '').toLowerCase()
      const nNorm = n.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      const t = c.telefono || ''
      const d = c.dni || ''
      return n.includes(q) || nNorm.includes(qNorm) || t.includes(q) || d.includes(q)
    }).slice(0, 20)
  }, [clientesList, clientSearchTerm])

  // Detección preventiva de duplicados en modo nuevo
  const similarExistingClient = useMemo(() => {
    if (clientSelectMode !== 'NEW' || !formCliente.trim()) return null
    const cleanInput = formCliente.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    return (clientesList || []).find(c => {
      const cleanC = (c.nombre || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      return cleanC === cleanInput || (cleanInput.length >= 4 && cleanC.includes(cleanInput))
    }) || null
  }, [clientSelectMode, formCliente, clientesList])

  // Manejadores del buscador de cliente
  const handleSelectClient = (c: ClienteOption) => {
    setSelectedClientOption(c)
    setClientSelectMode('EXISTING')
    setFormCliente(c.nombre)
    if (c.dni) setFormDni(c.dni)
    if (c.telefono) setFormTelefono(c.telefono)
    if (c.canalOrigen || c.canalPreferido) setFormCanal(c.canalOrigen || c.canalPreferido || 'WhatsApp')
    if (c.direccion || c.distrito) setFormDestino(c.direccion || c.distrito || '')
    setIsClientDropdownOpen(false)
    setClientSearchTerm('')
  }

  const handleClearSelectedClient = () => {
    setSelectedClientOption(null)
    setIsClientDropdownOpen(true)
  }

  const handleSwitchToNewClient = (presetName = '') => {
    setSelectedClientOption(null)
    setClientSelectMode('NEW')
    setFormCliente(presetName || clientSearchTerm.trim() || formCliente || '')
    setIsClientDropdownOpen(false)
  }

  const handleRegisterClientInline = async () => {
    if (!formCliente.trim()) {
      toast.error('Ingresa al menos el nombre del cliente')
      return
    }
    setIsRegisteringClientInline(true)
    try {
      const created = await createCliente({
        nombre: formCliente.trim(),
        dni: formDni.trim() || undefined,
        telefono: formTelefono.trim() || undefined,
        canalOrigen: formCanal,
        direccion: formDestino.trim() || undefined
      })
      const newOption: ClienteOption = {
        id: created.id,
        nombre: created.nombre,
        dni: created.dni,
        telefono: created.telefono,
        canalOrigen: created.canalOrigen,
        canalPreferido: created.canalOrigen,
        direccion: created.direccion
      }
      setClientesList(prev => [newOption, ...prev])
      setSelectedClientOption(newOption)
      setClientSelectMode('EXISTING')
      toast.success(`Cliente "${created.nombre}" guardado en el directorio`)
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar cliente')
    } finally {
      setIsRegisteringClientInline(false)
    }
  }

  // Lista dinámica de ítems
  const [formItems, setFormItems] = useState<FormItemState[]>(() => {
    const defaultProd = productos[0]
    return [
      {
        id: 'item-1',
        productoId: defaultProd ? defaultProd.id : '',
        personalizacion: '',
        cantidad: 1,
        tipoPrecio: 'MERCADO',
        precioUnitario: defaultProd ? defaultProd.precioMercado : '',
        costoPackaging: '',
        porcentajeAdicional: 0,
        gramosConsumidos: 0
      }
    ]
  })

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // =========================================================================
  // HELPER PARA AGREGAR / EDITAR ÍTEMS EN EL FORMULARIO
  // =========================================================================
  const addItem = () => {
    const defaultProd = productos[0]
    setFormItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productoId: defaultProd ? defaultProd.id : '',
        personalizacion: '',
        cantidad: 1,
        tipoPrecio: 'MERCADO',
        precioUnitario: defaultProd ? defaultProd.precioMercado : '',
        costoPackaging: '',
        porcentajeAdicional: 0,
        gramosConsumidos: 0
      }
    ])
  }

  const removeItem = (id: string) => {
    if (formItems.length <= 1) return
    setFormItems(prev => prev.filter(i => i.id !== id))
  }

  const updateItem = (id: string, updates: Partial<FormItemState>) => {
    setFormItems(prev => prev.map(item => {
      if (item.id !== id) return item
      const merged = { ...item, ...updates }

      // Si cambió el producto, recalcular precio
      if (updates.productoId && updates.productoId !== item.productoId) {
        const p = productos.find(prod => prod.id === updates.productoId)
        if (p) {
          let pUnit = p.precioMercado
          if (merged.tipoPrecio === 'AMIGOS') pUnit = p.precioAmigos
          else if (merged.tipoPrecio === 'MERCADO') pUnit = p.precioMercado
          merged.precioUnitario = pUnit
        }
      }

      // Si cambió el tier de precio
      if (updates.tipoPrecio && updates.tipoPrecio !== item.tipoPrecio) {
        const p = productos.find(prod => prod.id === merged.productoId)
        if (p) {
          if (updates.tipoPrecio === 'AMIGOS') merged.precioUnitario = p.precioAmigos
          else if (updates.tipoPrecio === 'MERCADO') merged.precioUnitario = p.precioMercado
        }
      }

      return merged
    }))
  }

  // Cálculos dinámicos del formulario
  const formSubtotalCalculado = useMemo(() => {
    return formItems.reduce((sum, it) => {
      const u = Number(it.precioUnitario) || 0
      const pack = Number(it.costoPackaging) || 0
      const q = Math.max(1, Number(it.cantidad) || 1)
      return sum + ((u + pack) * q)
    }, 0)
  }, [formItems])

  const formTotalCalculado = useMemo(() => {
    const env = Number(formCostoEnvio) || 0
    return Number((formSubtotalCalculado + env).toFixed(2))
  }, [formSubtotalCalculado, formCostoEnvio])

  const formSaldoPendienteCalculado = useMemo(() => {
    const pag = Number(formMontoPagado) || 0
    return Math.max(0, Number((formTotalCalculado - pag).toFixed(2)))
  }, [formTotalCalculado, formMontoPagado])

  // =========================================================================
  // RESET FORMULARIO
  // =========================================================================
  const resetForm = () => {
    const defaultProd = productos[0]
    setFormFecha(new Date().toISOString().split('T')[0])
    setFormCliente('')
    setFormDni('')
    setFormTelefono('')
    setFormCanal('WhatsApp')
    setSelectedClientOption(null)
    setClientSelectMode((clientesList || []).length > 0 ? 'EXISTING' : 'NEW')
    setClientSearchTerm('')
    setIsClientDropdownOpen(false)
    setFormDestino('')
    setFormDiaEntrega('')
    setFormNotas('')
    setFormCostoEnvio('')
    setFormMontoPagado('')
    setFormMetodoPago('YAPE')
    setFormNotasPago('')
    setFormDescontarStock(true)
    setFormItems([
      {
        id: 'item-1',
        productoId: defaultProd ? defaultProd.id : '',
        personalizacion: '',
        cantidad: 1,
        tipoPrecio: 'MERCADO',
        precioUnitario: defaultProd ? defaultProd.precioMercado : '',
        costoPackaging: '',
        porcentajeAdicional: 0,
        gramosConsumidos: 0
      }
    ])
  }

  // =========================================================================
  // GUARDAR NUEVO PEDIDO MULTIPRODUCTO
  // =========================================================================
  const handleSubmitNuevoPedido = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formCliente.trim()) {
      alert('Por favor ingresa el nombre del cliente.')
      return
    }

    if (formItems.some(i => !i.productoId)) {
      alert('Todos los ítems deben tener un producto seleccionado.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await createPedido({
        fecha: formFecha,
        cliente: formCliente.trim(),
        dni: formDni.trim() || undefined,
        telefono: formTelefono.trim() || undefined,
        canalVenta: formCanal,
        destinoEnvio: formDestino.trim() || undefined,
        diaEntregaPrometida: formDiaEntrega.trim() || undefined,
        notas: formNotas.trim() || undefined,
        costoEnvio: Number(formCostoEnvio) || 0,
        montoPagado: Number(formMontoPagado) || 0,
        metodoPago: formMetodoPago,
        notasPago: formNotasPago.trim() || undefined,
        descontarStock: formDescontarStock,
        items: formItems.map(it => ({
          productoId: it.productoId,
          colorFilamentoId: it.colorFilamentoId || undefined,
          coloresIds: it.coloresIds || [],
          personalizacion: it.personalizacion.trim() || undefined,
          cantidad: Number(it.cantidad) || 1,
          tipoPrecio: it.tipoPrecio,
          precioUnitario: Number(it.precioUnitario) || 0,
          costoPackaging: Number(it.costoPackaging) || 0,
          porcentajeAdicional: Number(it.porcentajeAdicional) || 0,
          gramosConsumidos: 0
        }))
      })

      if (res.success && res.pedido) {
        setPedidos(prev => [res.pedido as any, ...prev])
        setIsNewOrderModalOpen(false)
        resetForm()
      } else {
        alert(res.error || 'No se pudo crear el pedido')
      }
    } catch (err: any) {
      alert(err.message || 'Error inesperado al crear el pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  // =========================================================================
  // MANTENIMIENTO / EDICIÓN DE PEDIDO
  // =========================================================================
  const handleOpenEditModal = (p: PedidoView) => {
    setEditingPedido(p)
    setFormFecha(p.fecha ? p.fecha.split('T')[0] : new Date().toISOString().split('T')[0])
    setFormCliente(p.cliente)
    setFormDni(p.dni || '')
    setFormTelefono(p.telefono || '')
    setFormCanal(p.canalVenta || 'WhatsApp')
    const matchedClient = (clientesList || []).find(c => c.nombre.trim().toLowerCase() === p.cliente.trim().toLowerCase())
    if (matchedClient) {
      setSelectedClientOption(matchedClient)
      setClientSelectMode('EXISTING')
    } else {
      setSelectedClientOption(null)
      setClientSelectMode('NEW')
    }
    setClientSearchTerm('')
    setIsClientDropdownOpen(false)
    setFormDestino(p.destinoEnvio || '')
    setFormDiaEntrega(p.diaEntregaPrometida || '')
    setFormNotas(p.notas || '')
    setFormCostoEnvio(p.costoEnvio ? p.costoEnvio.toString() : '')
    setEditEstado(p.estado)
    setFormItems(p.items.map((it, idx) => {
      const rawCols = it.coloresIds && it.coloresIds.length > 0
        ? it.coloresIds
        : (it.colorFilamentoId ? [it.colorFilamentoId] : [])
      return {
        id: it.id || `edit-item-${idx}`,
        productoId: it.productoId,
        colorFilamentoId: it.colorFilamentoId || rawCols[0] || '',
        coloresIds: rawCols,
        personalizacion: it.personalizacion || '',
        cantidad: it.cantidad,
        tipoPrecio: it.tipoPrecio,
        precioUnitario: it.precioUnitario !== undefined && it.precioUnitario !== null ? it.precioUnitario : '',
        costoPackaging: it.costoPackaging ? it.costoPackaging : '',
        porcentajeAdicional: it.porcentajeAdicional || 0,
        gramosConsumidos: it.gramosConsumidos || 0
      }
    }))
    setIsEditModalOpen(true)
  }

  const handleSubmitEditPedido = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPedido) return
    if (!formCliente.trim()) {
      alert('Por favor ingresa el nombre del cliente.')
      return
    }
    if (formItems.some(i => !i.productoId)) {
      alert('Todos los ítems deben tener un producto seleccionado.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await updatePedido(editingPedido.id, {
        fecha: formFecha,
        cliente: formCliente.trim(),
        dni: formDni.trim() || undefined,
        telefono: formTelefono.trim() || undefined,
        canalVenta: formCanal,
        destinoEnvio: formDestino.trim() || undefined,
        diaEntregaPrometida: formDiaEntrega.trim() || undefined,
        notas: formNotas.trim() || undefined,
        estado: editEstado,
        costoEnvio: Number(formCostoEnvio) || 0,
        items: formItems.map(it => ({
          productoId: it.productoId,
          colorFilamentoId: it.coloresIds?.[0] || it.colorFilamentoId || undefined,
          coloresIds: it.coloresIds || [],
          personalizacion: it.personalizacion.trim() || undefined,
          cantidad: Number(it.cantidad) || 1,
          tipoPrecio: it.tipoPrecio,
          precioUnitario: Number(it.precioUnitario) || 0,
          costoPackaging: Number(it.costoPackaging) || 0,
          porcentajeAdicional: Number(it.porcentajeAdicional) || 0,
          gramosConsumidos: Number(it.gramosConsumidos) || 0
        }))
      })

      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === editingPedido.id ? (res.pedido as any) : p))
        if (selectedPedidoDetail?.id === editingPedido.id) {
          setSelectedPedidoDetail(res.pedido as any)
        }
        setIsEditModalOpen(false)
        setEditingPedido(null)
      } else {
        alert(res.error || 'No se pudo actualizar el pedido')
      }
    } catch (err: any) {
      alert(err.message || 'Error al actualizar pedido')
    } finally {
      setIsSubmitting(false)
    }
  }

  // TRANSICIONAR ESTADO DEL PEDIDO (REACTIVO CON ACTUALIZACIÓN OPTIMISTA)
  // =========================================================================
  const handleCambiarEstado = async (pedidoId: string, nuevoEstado: EstadoPedido) => {
    const previousPedidos = pedidos
    // Actualización optimista inmediata en tabla y KPI superior
    setPedidos(prev => prev.map(p => p.id === pedidoId ? { ...p, estado: nuevoEstado } : p))
    try {
      const res = await updateEstadoPedido(pedidoId, nuevoEstado)
      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as any) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as any)
        }
        toast.success(`Estado actualizado a ${ESTADOS_CONFIG[nuevoEstado]?.label || nuevoEstado}`)
      } else {
        setPedidos(previousPedidos)
        toast.error(res.error || 'Error al cambiar estado')
      }
    } catch (err: any) {
      setPedidos(previousPedidos)
      toast.error(err.message || 'Error al actualizar estado')
    }
  }

  // =========================================================================
  // REGISTRAR ABONO / PAGO A UN PEDIDO
  // =========================================================================
  const handleRegistrarAbono = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPedidoDetail) return
    const monto = Number(abonoMonto)
    if (!monto || monto <= 0) {
      alert('Ingresa un monto válido mayor a 0.')
      return
    }

    setIsSubmittingAbono(true)
    try {
      const res = await addPagoPedido(selectedPedidoDetail.id, {
        monto,
        metodoPago: abonoMetodo,
        tipo: abonoTipo,
        notas: abonoNotas.trim() || undefined
      })

      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === selectedPedidoDetail.id ? (res.pedido as any) : p))
        setSelectedPedidoDetail(res.pedido as any)
        setAbonoMonto('')
        setAbonoNotas('')
      } else {
        alert(res.error || 'No se pudo registrar el abono')
      }
    } catch (err: any) {
      alert(err.message || 'Error al registrar abono')
    } finally {
      setIsSubmittingAbono(false)
    }
  }

  // =========================================================================
  // ELIMINAR PEDIDO
  // =========================================================================
  const handleEliminarPedido = async (id: string, codigo: string) => {
    if (!confirm(`¿Estás seguro de eliminar el pedido ${codigo}?`)) return
    try {
      const res = await deletePedido(id)
      if (res.success) {
        setPedidos(prev => prev.filter(p => p.id !== id))
        if (selectedPedidoDetail?.id === id) setSelectedPedidoDetail(null)
      } else {
        alert(res.error || 'No se pudo eliminar el pedido')
      }
    } catch (err: any) {
      alert(err.message || 'Error al eliminar pedido')
    }
  }

  // =========================================================================
  // GENERAR RESUMEN PARA WHATSAPP
  // =========================================================================
  const copyWhatsAppTicket = (p: PedidoView) => {
    const itemsText = p.items.map((it, idx) => {
      const itemColores = (it.colores && it.colores.length > 0)
        ? it.colores
        : (it.colorFilamento ? [it.colorFilamento] : [])
      const colorText = itemColores.length > 1
        ? ` (Colores: ${itemColores.map(c => c.nombreColor).join(' + ')})`
        : itemColores.length === 1
        ? ` (Color: ${itemColores[0].nombreColor})`
        : ''
      const customText = it.personalizacion ? ` [Nota: ${it.personalizacion}]` : ''
      return `  ${idx + 1}. *${it.nombreProductoSnapshot}* x${it.cantidad}${colorText}${customText} — S/ ${it.subtotal.toFixed(2)}`
    }).join('\n')

    const envioText = p.costoEnvio > 0 ? `\n🚚 *Envío / Destino:* S/ ${p.costoEnvio.toFixed(2)} (${p.destinoEnvio || 'Agencia'})` : ''
    const saldoText = p.saldoPendiente > 0 ? `\n⏳ *Saldo Pendiente:* S/ ${p.saldoPendiente.toFixed(2)}` : '\n✅ *Estado Pago:* 100% Cancelado'

    const ticketMsg = `*RESUMEN DE PEDIDO — ${p.codigo}*\n` +
      `👤 *Cliente:* ${p.cliente}${p.dni ? ` (DNI: ${p.dni})` : ''}\n` +
      `📅 *Fecha:* ${formatDate(p.fecha)}\n` +
      (p.diaEntregaPrometida ? `📦 *Entrega Pactada:* ${p.diaEntregaPrometida}\n` : '') +
      `\n*PRODUCTOS:* \n${itemsText}${envioText}\n\n` +
      `💳 *Medio de Pago:* ${p.metodoPago || (p.pagos?.[0]?.metodoPago) || 'YAPE'}\n` +
      `💰 *Total Pedido:* S/ ${p.total.toFixed(2)}\n` +
      `💳 *Abonado:* S/ ${p.montoPagado.toFixed(2)}${saldoText}\n\n` +
      `_¡Gracias por tu pedido en NOVA Board Games!_`

    navigator.clipboard.writeText(ticketMsg)
    setCopiedNotification(true)
    setTimeout(() => setCopiedNotification(false), 2500)
  }

  // =========================================================================
  // FILTRADO Y KPIS
  // =========================================================================
  const filteredPedidos = useMemo(() => {
    return pedidos.filter(p => {
      if (!isDateInRange(p.fecha, dateRange.from, dateRange.to)) return false

      const matchSearch = p.cliente.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo.toLowerCase().includes(search.toLowerCase()) ||
        (p.dni && p.dni.includes(search)) ||
        (p.telefono && p.telefono.includes(search)) ||
        (p.destinoEnvio && p.destinoEnvio.toLowerCase().includes(search.toLowerCase())) ||
        p.items.some(i => i.nombreProductoSnapshot.toLowerCase().includes(search.toLowerCase()))

      if (!matchSearch) return false

      if (selectedEstadoFilter !== 'TODOS' && p.estado !== selectedEstadoFilter) return false

      if (selectedPagoFilter === 'PAGADO' && p.saldoPendiente > 0) return false
      if (selectedPagoFilter === 'PENDIENTE' && p.saldoPendiente <= 0) return false
      if (selectedPagoFilter === 'ANTICIPO' && (p.montoPagado <= 0 || p.saldoPendiente <= 0)) return false

      return true
    })
  }, [pedidos, search, selectedEstadoFilter, selectedPagoFilter, dateRange])

  const handleSort = (field: 'fecha' | 'codigo' | 'cliente' | 'cantidad' | 'total' | 'saldoPendiente' | 'estado') => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
    setCurrentPage(1)
  }

  const sortedPedidos = useMemo(() => {
    return [...filteredPedidos].sort((a, b) => {
      let comparison = 0
      if (sortField === 'fecha') {
        comparison = new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
      } else if (sortField === 'codigo') {
        comparison = a.codigo.localeCompare(b.codigo)
      } else if (sortField === 'cliente') {
        comparison = a.cliente.localeCompare(b.cliente)
      } else if (sortField === 'cantidad') {
        comparison = a.totalItemsCount - b.totalItemsCount
      } else if (sortField === 'total') {
        comparison = a.total - b.total
      } else if (sortField === 'saldoPendiente') {
        comparison = a.saldoPendiente - b.saldoPendiente
      } else if (sortField === 'estado') {
        comparison = a.estado.localeCompare(b.estado)
      }
      return sortOrder === 'asc' ? comparison : -comparison
    })
  }, [filteredPedidos, sortField, sortOrder])

  const totalPages = Math.ceil(sortedPedidos.length / (itemsPerPage === 9999 ? 1 : itemsPerPage)) || 1
  const paginatedPedidos = useMemo(() => {
    if (itemsPerPage === 9999) return sortedPedidos
    const start = (currentPage - 1) * itemsPerPage
    return sortedPedidos.slice(start, start + itemsPerPage)
  }, [sortedPedidos, currentPage, itemsPerPage])

  const kpis = useMemo(() => {
    const pedidosEnRango = pedidos.filter(p => isDateInRange(p.fecha, dateRange.from, dateRange.to))
    const totalPedidos = pedidosEnRango.length
    const pagoValidados = pedidosEnRango.filter(p => p.estado === 'PAGO_VALIDADO').length
    const enProduccion = pedidosEnRango.filter(p => p.estado === 'EN_PRODUCCION').length
    const pendientes = pedidosEnRango.filter(p => p.estado === 'PENDIENTE').length
    const listos = pedidosEnRango.filter(p => p.estado === 'LISTO_ENTREGA').length
    const entregados = pedidosEnRango.filter(p => p.estado === 'ENTREGADO').length

    const totalFacturado = pedidosEnRango.filter(p => p.estado !== 'CANCELADO').reduce((s, p) => s + p.total, 0)
    const totalCobrado = pedidosEnRango.reduce((s, p) => s + p.montoPagado, 0)
    const saldoPorCobrar = pedidosEnRango.filter(p => p.estado !== 'CANCELADO').reduce((s, p) => s + p.saldoPendiente, 0)
    const totalPiezas = pedidosEnRango.reduce((s, p) => s + p.totalItemsCount, 0)

    return {
      totalPedidos,
      pagoValidados,
      enProduccion,
      pendientes,
      listos,
      entregados,
      totalFacturado,
      totalCobrado,
      saldoPorCobrar,
      totalPiezas
    }
  }, [pedidos, dateRange])

  return (
    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. CABECERA Y BOTÓN PRIMARIO DE PEDIDO                                    */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Gestión de Pedidos
            </h1>
            <span className="text-2xl font-bold text-foreground">
              ({kpis.totalPedidos})
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Registro, control de pagos y envíos por cliente.
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setIsNewOrderModalOpen(true)
          }}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-4.5 rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>+ Nuevo Pedido</span>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPIS SUPERIORES DE FLUJO DE CAJA Y PEDIDOS (5 TARJETAS EN 1 FILA)      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6">
        {/* KPI 1: Total Pedidos */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs flex flex-col justify-between h-[96px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Pedidos
            </span>
            <div className="w-7 h-7 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0">
              <Boxes className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-extrabold text-foreground tracking-tight tabular-nums">
              {kpis.totalPedidos}
            </span>
            <span className="text-[11px] text-muted-foreground">
              ({kpis.totalPiezas} unidades)
            </span>
          </div>
        </div>

        {/* KPI 2: Preparando */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs flex flex-col justify-between h-[96px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Preparando
            </span>
            <div className="w-7 h-7 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-extrabold text-foreground tracking-tight tabular-nums">
              {kpis.enProduccion}
            </span>
            <span className="text-[11px] text-muted-foreground">
              en preparación
            </span>
          </div>
        </div>

        {/* KPI 3: Por Entregar */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs flex flex-col justify-between h-[96px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Por Entregar
            </span>
            <div className="w-7 h-7 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-extrabold text-foreground tracking-tight tabular-nums">
              {kpis.listos}
            </span>
            <span className="text-[11px] text-muted-foreground">
              listos
            </span>
          </div>
        </div>

        {/* KPI 4: Saldo por Cobrar */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs flex flex-col justify-between h-[96px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Por Cobrar
            </span>
            <div className="w-7 h-7 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-foreground tracking-tight tabular-nums truncate">
              {formatCurrency(kpis.saldoPorCobrar)}
            </span>
          </div>
        </div>

        {/* KPI 5: Cobrado */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-2xs flex flex-col justify-between h-[96px] col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Cobrado
            </span>
            <div className="w-7 h-7 rounded-lg bg-secondary text-primary flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl font-extrabold text-emerald-800 dark:text-emerald-300 tracking-tight tabular-nums truncate">
              {formatCurrency(kpis.totalCobrado)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE HERRAMIENTAS Y FILTROS (SIN TRUNCAMIENTOS)                    */}
      {/* ========================================================================= */}
      <div className="w-full bg-card border border-border rounded-2xl p-3 shadow-2xs mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Izquierda: Buscador 100% elástico (sin vacío residual) */}
        <div className="relative flex-1 w-full max-w-none lg:max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, código (#BG-XXX) o producto..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setCurrentPage(1)
            }}
            className="h-10 w-full rounded-xl border border-input bg-background pl-10 pr-9 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setCurrentPage(1)
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Derecha: Controles agrupados */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Selector de Estado */}
          <select
            value={selectedEstadoFilter}
            onChange={(e) => {
              setSelectedEstadoFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold text-foreground flex items-center gap-1.5 hover:bg-secondary/40 cursor-pointer focus:outline-none"
          >
            <option value="TODOS">Todos los estados ({pedidos.length})</option>
            {Object.entries(ESTADOS_CONFIG).map(([stKey, conf]) => {
              const count = pedidos.filter(p => p.estado === stKey).length
              return (
                <option key={stKey} value={stKey}>
                  {conf.label} ({count})
                </option>
              )
            })}
          </select>

          {/* Selector de Pagos */}
          <select
            value={selectedPagoFilter}
            onChange={(e) => {
              setSelectedPagoFilter(e.target.value)
              setCurrentPage(1)
            }}
            className="h-10 px-3 rounded-xl border border-input bg-background text-xs font-semibold text-foreground flex items-center gap-1.5 hover:bg-secondary/40 cursor-pointer focus:outline-none"
          >
            <option value="TODOS">Todos los pagos</option>
            <option value="PAGADO">100% Pagado</option>
            <option value="PENDIENTE">Con Saldo</option>
          </select>

          {/* Navegador Temporal */}
          <DateFilterControl
            value={dateRange}
            onChange={(range) => {
              setDateRange(range)
              setCurrentPage(1)
            }}
            variant="unified"
            label="Filtrar Pedidos"
            align="right"
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. REDISEÑO DE TABLA DE PEDIDOS (SEPARACIÓN DE COLUMNAS)                  */}
      {/* ========================================================================= */}
      <OrdersTableView
        pedidos={paginatedPedidos}
        sortField={sortField}
        sortOrder={sortOrder}
        onSort={handleSort}
        onSelectPedido={(p) => setSelectedPedidoDetail(p)}
        onCambiarEstado={handleCambiarEstado}
        onEditPedido={handleOpenEditModal}
        onEliminarPedido={handleEliminarPedido}
        onCopyWhatsApp={copyWhatsAppTicket}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={sortedPedidos.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(items) => {
          setItemsPerPage(items)
          setCurrentPage(1)
        }}
      />

      {/* ========================================================================= */}
      {/* 5. MODAL: NUEVO PEDIDO MULTIPRODUCTO (1 O MÁS PRODUCTOS)                  */}
      {/* ========================================================================= */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border border-[#D4BEA7] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#FAF8F5] border-b border-[#E2D9CC] p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-black text-[#241C15] flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-[#A36F4C]" />
                  <span>Registrar Pedido Multiproducto</span>
                </h3>
                <p className="text-xs text-[#75695D] mt-0.5">
                  Agrega 1 o más productos a este pedido y calcula el balance automáticamente.
                </p>
              </div>

              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-[#EAE4DC] text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitNuevoPedido} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* SECCIÓN 1: DATOS DEL CLIENTE Y DESPACHO (BUSCADOR COMPLETO) */}
              <OrderCustomerSection
                clientSelectMode={clientSelectMode}
                setClientSelectMode={setClientSelectMode}
                clientesList={clientesList}
                selectedClientOption={selectedClientOption}
                onSelectClient={handleSelectClient}
                onClearSelectedClient={handleClearSelectedClient}
                onSwitchToNewClient={handleSwitchToNewClient}
                clientSearchTerm={clientSearchTerm}
                setClientSearchTerm={setClientSearchTerm}
                isClientDropdownOpen={isClientDropdownOpen}
                setIsClientDropdownOpen={setIsClientDropdownOpen}
                filteredClientOptions={filteredClientOptions}
                similarExistingClient={similarExistingClient}
                formFecha={formFecha}
                setFormFecha={setFormFecha}
                formCliente={formCliente}
                setFormCliente={setFormCliente}
                formDni={formDni}
                setFormDni={setFormDni}
                formTelefono={formTelefono}
                setFormTelefono={setFormTelefono}
                formCanal={formCanal}
                setFormCanal={setFormCanal}
                formDestino={formDestino}
                setFormDestino={setFormDestino}
                formDiaEntrega={formDiaEntrega}
                setFormDiaEntrega={setFormDiaEntrega}
                isRegisteringClientInline={isRegisteringClientInline}
                onRegisterClientInline={handleRegisterClientInline}
              />

              {/* SECCIÓN 2: LISTA DE PRODUCTOS DINÁMICA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#E2D9CC]">
                  <span className="text-xs font-extrabold text-[#A36F4C] uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    2. Productos del Pedido ({formItems.length})
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    onClick={addItem}
                    className="h-7 px-2.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EAE4DC] border border-[#D4BEA7] text-[#633E20] font-extrabold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Agregar Otro Producto</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {formItems.map((item, index) => {
                    const selectedProd = productos.find(p => p.id === item.productoId)
                    const itemSubtotal = (Number(item.precioUnitario) + Number(item.costoPackaging)) * Number(item.cantidad)

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-[#633E20] uppercase tracking-wide flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-[#A36F4C]" />
                            Producto #{index + 1}
                          </span>

                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-[#75695D] hover:text-[#A34335] text-xs flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Quitar</span>
                            </button>
                          )}
                        </div>

                        {/* Fila 1: Selector de Producto */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-[#241C15] font-bold">Producto *</Label>
                          <select
                            required
                            value={item.productoId}
                            onChange={(e) => updateItem(item.id, { productoId: e.target.value })}
                            className="w-full h-9 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] px-3 text-xs text-[#241C15] font-bold"
                          >
                            {productos.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.nombreModelo} ({p.lineaCategoria}) — Base: S/ {p.costoBase.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Fila 2: Nivel de Precio, Cantidad, Precio Unitario y Packaging */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-[#75695D] font-bold">Tier de Precio</Label>
                            <select
                              value={item.tipoPrecio}
                              onChange={(e) => updateItem(item.id, { tipoPrecio: e.target.value as TipoPrecio })}
                              className="w-full h-8 rounded-lg border border-[#E2D9CC] bg-[#FFFFFF] px-2 text-xs font-semibold"
                            >
                              <option value="MERCADO">Mercado</option>
                              <option value="AMIGOS">Amigos</option>
                              <option value="PERSONALIZADO">Personalizado</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] text-[#75695D] font-bold">Cantidad</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={item.cantidad}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => updateItem(item.id, { cantidad: e.target.value })}
                              className="h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs font-bold font-mono rounded-lg"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] text-[#75695D] font-bold">Precio Unitario (S/)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={item.precioUnitario}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => updateItem(item.id, { precioUnitario: e.target.value, tipoPrecio: 'PERSONALIZADO' })}
                              className="h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs font-bold font-mono rounded-lg"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] text-[#75695D] font-bold">Packaging (S/)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={item.costoPackaging}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => updateItem(item.id, { costoPackaging: e.target.value })}
                              className="h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs font-mono rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Fila 3: Personalización y Subtotal */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#E2D9CC]/60 text-xs">
                          <div className="flex-1">
                            <Input
                              placeholder="Notas o detalles del producto (opcional)..."
                              value={item.personalizacion}
                              onChange={(e) => updateItem(item.id, { personalizacion: e.target.value })}
                              className="h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs rounded-lg placeholder:text-[#75695D]"
                            />
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto font-mono">
                            <span className="text-[11px] text-[#75695D]">Subtotal Ítem:</span>
                            <strong className="text-sm text-[#241C15] font-black">{formatCurrency(itemSubtotal)}</strong>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SECCIÓN 3: LIQUIDACIÓN FINANCIERA, ENVÍO Y ANTICIPO */}
              <div className="p-4 rounded-2xl bg-[#F8F6F2] border border-[#D4BEA7] space-y-4">
                <span className="text-xs font-extrabold text-[#633E20] uppercase tracking-wider block">
                  3. Totales del Pedido y Anticipo
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Costo de Envío (S/)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formCostoEnvio}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setFormCostoEnvio(e.target.value)}
                      className="bg-[#FFFFFF] border-[#E2D9CC] text-sm font-mono font-bold rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Abono Inicial / Anticipo (S/)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formMontoPagado}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setFormMontoPagado(e.target.value)}
                      className="bg-[#FFFFFF] border-[#B4E3C0] text-sm font-mono font-black text-[#1E5E3A] rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Método de Pago</Label>
                    <select
                      value={formMetodoPago}
                      onChange={(e) => setFormMetodoPago(e.target.value)}
                      className="w-full h-9 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] px-3 text-sm text-[#241C15] font-bold"
                    >
                      <option value="YAPE">Yape</option>
                      <option value="PLIN">Plin</option>
                      <option value="BCP">Transferencia BCP</option>
                      <option value="BBVA">Transferencia BBVA</option>
                      <option value="EFECTIVO">Efectivo</option>
                    </select>
                  </div>
                </div>

                {/* Botones de Anticipo Rápido */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold text-[#75695D]">Atajos de Anticipo:</span>
                  <button
                    type="button"
                    onClick={() => setFormMontoPagado((formTotalCalculado * 0.5).toFixed(2))}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF8F5] hover:bg-[#EAE4DC] border border-[#E2D9CC] text-[#241C15] cursor-pointer"
                  >
                    50% Anticipo (S/ {(formTotalCalculado * 0.5).toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMontoPagado(formTotalCalculado.toFixed(2))}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#EBF7EE] hover:bg-[#D7EFE0] border border-[#B4E3C0] text-[#1E5E3A] cursor-pointer"
                  >
                    100% Total (S/ {formTotalCalculado.toFixed(2)})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormMontoPagado('0')}
                    className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[#FAF8F5] hover:bg-[#EAE4DC] border border-[#E2D9CC] text-[#75695D] cursor-pointer"
                  >
                    S/ 0.00 (Contra entrega)
                  </button>
                </div>

              {/* Resumen Totalizador */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 p-3 bg-[#FFFFFF] rounded-xl border border-[#E2D9CC] text-center font-mono">
                  <div className="p-1 sm:p-0 bg-[#FAF8F5] sm:bg-transparent rounded-lg sm:rounded-none">
                    <span className="text-[10px] text-[#75695D] block uppercase">Subtotal</span>
                    <strong className="text-sm font-bold text-[#241C15]">{formatCurrency(formSubtotalCalculado)}</strong>
                  </div>
                  <div className="p-1 sm:p-0 bg-[#EBF7EE]/60 sm:bg-transparent rounded-lg sm:rounded-none">
                    <span className="text-[10px] text-[#1E5E3A] block uppercase font-bold">TOTAL PEDIDO</span>
                    <strong className="text-base font-black text-[#1E5E3A]">{formatCurrency(formTotalCalculado)}</strong>
                  </div>
                  <div className="p-1 sm:p-0 bg-[#FDF6E2]/60 sm:bg-transparent rounded-lg sm:rounded-none">
                    <span className="text-[10px] text-[#8C6D1F] block uppercase font-bold">Saldo x Cobrar</span>
                    <strong className="text-base font-black text-[#8C6D1F]">S/ {formSaldoPendienteCalculado.toFixed(2)}</strong>
                  </div>
                </div>

                {/* Checkbox Descontar Stock */}
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#241C15] font-semibold">
                  <input
                    type="checkbox"
                    checked={formDescontarStock}
                    onChange={(e) => setFormDescontarStock(e.target.checked)}
                    className="rounded text-[#1E5E3A] focus:ring-[#1E5E3A] cursor-pointer"
                  />
                  <span>Descontar automáticamente del stock disponible de los productos</span>
                </label>
              </div>

              {/* Botones de Acción Modal */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="h-10 px-4 rounded-xl border-[#E2D9CC] text-[#75695D] hover:bg-[#F4EFEA] font-bold text-xs cursor-pointer w-full sm:w-auto"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6 rounded-xl bg-[#1E5E3A] hover:bg-[#16482C] text-white font-black text-sm shadow-sm cursor-pointer w-full sm:w-auto"
                >
                  {isSubmitting ? 'Guardando...' : 'Crear Pedido Multiproducto'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: DETALLE Y TICKET DE PEDIDO (OrderDetailsModal / OrderViewDialog) */}
      {/* ========================================================================= */}
      <OrderDetailsModal
        isOpen={!!selectedPedidoDetail}
        pedido={selectedPedidoDetail}
        onClose={() => setSelectedPedidoDetail(null)}
        onEdit={(p) => {
          setSelectedPedidoDetail(null)
          handleOpenEditModal(p)
        }}
        onPedidoUpdated={(updated) => {
          setPedidos(prev => prev.map(p => p.id === updated.id ? updated : p))
          setSelectedPedidoDetail(updated)
        }}
        productos={productos}
      />

      {/* ========================================================================= */}
      {/* 7. MODAL: EDITAR / MANTENIMIENTO DE PEDIDO                                */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingPedido && (
        <div className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border border-[#D4BEA7] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#FAF8F5] border-b border-[#E2D9CC] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-[#241C15] text-white font-mono font-black text-xs px-2.5 py-0.5 rounded-lg">
                    {editingPedido.codigo}
                  </Badge>
                  <h3 className="text-lg sm:text-xl font-black text-[#241C15] flex items-center gap-1.5">
                    <Pencil className="h-4.5 w-4.5 text-[#8C6D1F]" />
                    <span>Editar / Mantenimiento de Pedido</span>
                  </h3>
                </div>
                <p className="text-xs text-[#75695D] mt-0.5">
                  Modifica cliente, fecha, notas, estado, y añade/quita/modifica los productos asignados.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingPedido(null)
                }}
                className="p-1.5 rounded-xl hover:bg-[#EAE4DC] text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer self-end sm:self-auto"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitEditPedido} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
              {/* SECCIÓN 1: ESTADO Y DATOS DEL CLIENTE (BUSCADOR COMPLETO) */}
              <OrderCustomerSection
                clientSelectMode={clientSelectMode}
                setClientSelectMode={setClientSelectMode}
                clientesList={clientesList}
                selectedClientOption={selectedClientOption}
                onSelectClient={handleSelectClient}
                onClearSelectedClient={handleClearSelectedClient}
                onSwitchToNewClient={handleSwitchToNewClient}
                clientSearchTerm={clientSearchTerm}
                setClientSearchTerm={setClientSearchTerm}
                isClientDropdownOpen={isClientDropdownOpen}
                setIsClientDropdownOpen={setIsClientDropdownOpen}
                filteredClientOptions={filteredClientOptions}
                similarExistingClient={similarExistingClient}
                formFecha={formFecha}
                setFormFecha={setFormFecha}
                formCliente={formCliente}
                setFormCliente={setFormCliente}
                formDni={formDni}
                setFormDni={setFormDni}
                formTelefono={formTelefono}
                setFormTelefono={setFormTelefono}
                formCanal={formCanal}
                setFormCanal={setFormCanal}
                formDestino={formDestino}
                setFormDestino={setFormDestino}
                formDiaEntrega={formDiaEntrega}
                setFormDiaEntrega={setFormDiaEntrega}
                isRegisteringClientInline={isRegisteringClientInline}
                onRegisterClientInline={handleRegisterClientInline}
                headerExtra={
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#75695D]">Estado:</span>
                    <select
                      value={editEstado}
                      onChange={(e) => setEditEstado(e.target.value as EstadoPedido)}
                      className="text-xs font-extrabold rounded-xl px-3 py-1 border border-[#D4BEA7] bg-[#FDF6E2] text-[#8C6D1F] cursor-pointer"
                    >
                      {Object.entries(ESTADOS_CONFIG).map(([stKey, conf]) => (
                        <option key={stKey} value={stKey}>
                          {conf.label}
                        </option>
                      ))}
                    </select>
                  </div>
                }
              />

              <div className="space-y-1">
                <Label className="text-xs text-[#241C15] font-bold">Notas del Pedido</Label>
                <Input
                  placeholder="Notas internas, indicaciones de acabado, etc..."
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl"
                />
              </div>

              {/* SECCIÓN 2: LISTA DE PRODUCTOS DINÁMICA */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-1 border-b border-[#E2D9CC]">
                  <span className="text-xs font-extrabold text-[#A36F4C] uppercase tracking-wider flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" />
                    2. Productos Asignados ({formItems.length})
                  </span>

                  <Button
                    type="button"
                    size="sm"
                    onClick={addItem}
                    className="h-7 px-2.5 rounded-lg bg-[#FAF8F5] hover:bg-[#EAE4DC] border border-[#D4BEA7] text-[#633E20] font-extrabold text-xs cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Agregar Otro Producto</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {formItems.map((item, index) => {
                    const itemSubtotal = (Number(item.precioUnitario) + Number(item.costoPackaging)) * Number(item.cantidad)

                    return (
                      <div
                        key={item.id}
                        className="p-3.5 sm:p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-3 relative"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-[#633E20] uppercase tracking-wide flex items-center gap-1.5">
                            <Package className="h-3.5 w-3.5 text-[#A36F4C]" />
                            Producto #{index + 1}
                          </span>

                          {formItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="text-[#75695D] hover:text-[#A34335] text-xs flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Quitar</span>
                            </button>
                          )}
                        </div>

                        {/* Fila 1: Selector de Producto */}
                        <div className="space-y-1">
                          <Label className="text-[11px] text-[#241C15] font-bold">Producto *</Label>
                          <select
                            required
                            value={item.productoId}
                            onChange={(e) => updateItem(item.id, { productoId: e.target.value })}
                            className="w-full h-9 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] px-3 text-xs text-[#241C15] font-bold"
                          >
                            {productos.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.nombreModelo} ({p.lineaCategoria}) — Base: S/ {p.costoBase.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Fila 2: Nivel de Precio, Cantidad, Precio Unitario y Packaging */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-[#75695D] font-bold">Tier de Precio</Label>
                            <select
                              value={item.tipoPrecio}
                              onChange={(e) => updateItem(item.id, { tipoPrecio: e.target.value as TipoPrecio })}
                              className="w-full h-8 rounded-lg border border-[#E2D9CC] bg-[#FFFFFF] px-2 text-xs font-semibold"
                            >
                              <option value="MERCADO">Mercado</option>
                              <option value="AMIGOS">Amigos</option>
                              <option value="PERSONALIZADO">Personalizado</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] text-[#75695D] font-bold">Cantidad</Label>
                            <Input
                              type="number"
                              min="1"
                              placeholder="1"
                              value={item.cantidad}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => updateItem(item.id, { cantidad: e.target.value })}
                              className="h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs font-bold font-mono rounded-lg"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] text-[#75695D] font-bold">Precio Unitario (S/)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={item.precioUnitario}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => updateItem(item.id, { precioUnitario: e.target.value, tipoPrecio: 'PERSONALIZADO' })}
                              className="h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs font-bold font-mono rounded-lg"
                            />
                          </div>

                          <div className="space-y-1">
                            <Label className="text-[10px] text-[#75695D] font-bold">Packaging (S/)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={item.costoPackaging}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => updateItem(item.id, { costoPackaging: e.target.value })}
                              className="h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs font-mono rounded-lg"
                            />
                          </div>
                        </div>

                        {/* Fila 3: Personalización y Subtotal */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#E2D9CC]/60 text-xs">
                          <div className="flex-1">
                            <Input
                              placeholder="Notas o detalles del producto (opcional)..."
                              value={item.personalizacion}
                              onChange={(e) => updateItem(item.id, { personalizacion: e.target.value })}
                              className="h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs rounded-lg placeholder:text-[#75695D]"
                            />
                          </div>
                          <div className="flex items-center gap-2 self-end sm:self-auto font-mono">
                            <span className="text-[11px] text-[#75695D]">Subtotal Ítem:</span>
                            <strong className="text-sm text-[#241C15] font-black">{formatCurrency(itemSubtotal)}</strong>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SECCIÓN 3: LIQUIDACIÓN FINANCIERA Y ENVÍO */}
              <div className="p-4 rounded-2xl bg-[#F8F6F2] border border-[#D4BEA7] space-y-4">
                <span className="text-xs font-extrabold text-[#633E20] uppercase tracking-wider block">
                  3. Totales del Pedido y Saldo
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Costo de Envío / Flete (S/)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formCostoEnvio}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setFormCostoEnvio(e.target.value)}
                      className="bg-[#FFFFFF] border-[#E2D9CC] text-sm font-mono font-bold rounded-xl"
                    />
                  </div>

                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E2D9CC] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#75695D] block uppercase font-bold">Abonos Ya Cobrados</span>
                      <span className="text-xs text-[#75695D]">({editingPedido.pagos.length} pagos registrados)</span>
                    </div>
                    <strong className="text-base font-black text-[#1E5E3A] font-mono">
                      +{formatCurrency(editingPedido.montoPagado)}
                    </strong>
                  </div>
                </div>

                {/* Resumen Totalizador */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 p-3 bg-[#FFFFFF] rounded-xl border border-[#E2D9CC] text-center font-mono">
                  <div className="p-1 sm:p-0 bg-[#FAF8F5] sm:bg-transparent rounded-lg sm:rounded-none">
                    <span className="text-[10px] text-[#75695D] block uppercase">Subtotal Ítems</span>
                    <strong className="text-sm font-bold text-[#241C15]">{formatCurrency(formSubtotalCalculado)}</strong>
                  </div>
                  <div className="p-1 sm:p-0 bg-[#EBF7EE]/60 sm:bg-transparent rounded-lg sm:rounded-none">
                    <span className="text-[10px] text-[#1E5E3A] block uppercase font-bold">NUEVO TOTAL</span>
                    <strong className="text-base font-black text-[#1E5E3A]">{formatCurrency(formTotalCalculado)}</strong>
                  </div>
                  <div className="p-1 sm:p-0 bg-[#FDF6E2]/60 sm:bg-transparent rounded-lg sm:rounded-none">
                    <span className="text-[10px] text-[#8C6D1F] block uppercase font-bold">Saldo x Cobrar</span>
                    <strong className="text-base font-black text-[#8C6D1F]">
                      S/ {Math.max(0, formTotalCalculado - editingPedido.montoPagado).toFixed(2)}
                    </strong>
                  </div>
                </div>

                <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E2D9CC] text-[11px] text-[#75695D] flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#A36F4C] flex-shrink-0" />
                  <span>
                    Los abonos previos (S/ {editingPedido.montoPagado.toFixed(2)}) se conservan intactos. Si el total del pedido cambia, el saldo pendiente se recalcula automáticamente.
                  </span>
                </div>
              </div>

              {/* Botones de Acción Modal */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setEditingPedido(null)
                  }}
                  className="h-10 px-4 rounded-xl border-[#E2D9CC] text-[#75695D] hover:bg-[#F4EFEA] font-bold text-xs cursor-pointer w-full sm:w-auto"
                >
                  Cancelar
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-10 px-6 rounded-xl bg-[#8C6D1F] hover:bg-[#705618] text-white font-black text-sm shadow-sm cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
                >
                  <Pencil className="h-4 w-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios del Pedido'}</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
