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
import { ThermalTicket80mmModal } from './ThermalTicket80mmModal'

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
    colorBg: 'bg-amber-500/10',
    colorText: 'text-amber-800 dark:text-amber-300',
    colorBorder: 'border-amber-500/20',
    icon: Clock
  },
  PAGO_VALIDADO: {
    label: 'Pago Validado',
    colorBg: 'bg-emerald-500/10',
    colorText: 'text-emerald-800 dark:text-emerald-300',
    colorBorder: 'border-emerald-500/20',
    icon: CheckCircle2
  },
  EN_PRODUCCION: {
    label: 'Preparando',
    colorBg: 'bg-sky-500/10',
    colorText: 'text-sky-800 dark:text-sky-300',
    colorBorder: 'border-sky-500/20',
    icon: Package
  },
  LISTO_ENTREGA: {
    label: 'Por Entregar',
    colorBg: 'bg-purple-500/10',
    colorText: 'text-purple-800 dark:text-purple-300',
    colorBorder: 'border-purple-500/20',
    icon: Package
  },
  ENTREGADO: {
    label: 'Entregado',
    colorBg: 'bg-emerald-500/10',
    colorText: 'text-emerald-800 dark:text-emerald-300',
    colorBorder: 'border-emerald-500/20',
    icon: CheckCircle2
  },
  CANCELADO: {
    label: 'Cancelado',
    colorBg: 'bg-destructive/10',
    colorText: 'text-destructive',
    colorBorder: 'border-destructive/20',
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
  const [dateRange, setDateRange] = useState<DateRange>(() => getPresetDateRange('ESTE_MES'))
  const [selectedThermalPedido, setSelectedThermalPedido] = useState<PedidoView | null>(null)
  const [activeTab, setActiveTab] = useState<'TODOS' | 'SEGUIMIENTO' | 'PRODUCCION' | 'ENTREGA'>('TODOS')

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
        const nuevo = res.pedido as any
        setPedidos(prev => [nuevo, ...prev])
        setIsNewOrderModalOpen(false)
        resetForm()
        toast.success(`Pedido ${nuevo.codigo} registrado exitosamente`, {
          action: {
            label: 'Imprimir 80mm',
            onClick: () => setSelectedThermalPedido(nuevo)
          }
        })
      } else {
        toast.error(res.error || 'No se pudo crear el pedido')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado al crear el pedido')
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
  // GENERAR RESUMEN O SEGUIMIENTO PARA WHATSAPP
  // =========================================================================
  const copyWhatsAppTicket = (p: PedidoView) => {
    let ticketMsg = ''
    if (p.estado === 'PENDIENTE') {
      ticketMsg = `¡Hola ${p.cliente}! 👋 Te saludamos de *NOVA Board Games*.\n\n` +
        `Te escribimos para hacer seguimiento a tu cotización / pedido *${p.codigo}*:\n` +
        p.items.map(it => `• ${it.cantidad}x *${it.nombreProductoSnapshot}* (S/ ${it.subtotal.toFixed(2)})`).join('\n') +
        (p.costoEnvio > 0 ? `\n• Envío: S/ ${p.costoEnvio.toFixed(2)}` : '') +
        `\n\n💰 *Total:* S/ ${p.total.toFixed(2)}` +
        (p.saldoPendiente > 0 ? `\n⏳ *Saldo Pendiente:* S/ ${p.saldoPendiente.toFixed(2)}` : '') +
        `\n\n¿Deseas confirmarlo para programar su impresión en taller? 🎲`
    } else {
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

      ticketMsg = `*RESUMEN DE PEDIDO — ${p.codigo}*\n` +
        `👤 *Cliente:* ${p.cliente}${p.dni ? ` (DNI: ${p.dni})` : ''}\n` +
        `📅 *Fecha:* ${formatDate(p.fecha)}\n` +
        (p.diaEntregaPrometida ? `📦 *Entrega Pactada:* ${p.diaEntregaPrometida}\n` : '') +
        `\n*PRODUCTOS:* \n${itemsText}${envioText}\n\n` +
        `💳 *Medio de Pago:* ${p.metodoPago || (p.pagos?.[0]?.metodoPago) || 'YAPE'}\n` +
        `💰 *Total Pedido:* S/ ${p.total.toFixed(2)}\n` +
        `💳 *Abonado:* S/ ${p.montoPagado.toFixed(2)}${saldoText}\n\n` +
        `_¡Gracias por tu pedido en NOVA Board Games!_`
    }

    navigator.clipboard.writeText(ticketMsg)
    setCopiedNotification(true)
    setTimeout(() => setCopiedNotification(false), 2500)

    if (p.telefono && p.telefono.trim()) {
      const rawDigits = p.telefono.replace(/\D/g, '')
      const phoneWithCode = rawDigits.length === 9 ? `51${rawDigits}` : rawDigits
      window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(ticketMsg)}`, '_blank')
      toast.success(`Abriendo WhatsApp con ${p.cliente}`)
    } else {
      toast.success('¡Resumen de pedido copiado al portapapeles!')
    }
  }

  // =========================================================================
  // FILTRADO Y KPIS
  // =========================================================================
  const filteredPedidos = useMemo(() => {
    return pedidos.filter(p => {
      if (!isDateInRange(p.fecha, dateRange.from, dateRange.to)) return false

      // Tab operativa (Seguimiento, Producción, Entrega, Todos)
      if (activeTab === 'SEGUIMIENTO' && p.estado !== 'PENDIENTE') return false
      if (activeTab === 'PRODUCCION' && (p.estado !== 'EN_PRODUCCION' && p.estado !== 'PAGO_VALIDADO')) return false
      if (activeTab === 'ENTREGA' && (p.estado !== 'LISTO_ENTREGA' && p.estado !== 'ENTREGADO')) return false

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
  }, [pedidos, search, selectedEstadoFilter, selectedPagoFilter, dateRange, activeTab])

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
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* 1. CABECERA CON NAVEGADOR MENSUAL Y ACCIÓN PRINCIPAL                      */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <span>Gestión de Pedidos & Ventas</span>
            <span className="text-xs font-mono font-bold bg-secondary px-2.5 py-0.5 rounded-full border border-border text-muted-foreground">
              {kpis.totalPedidos} {kpis.totalPedidos === 1 ? 'pedido' : 'pedidos'}
            </span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Taller 3D, tickets térmicos 80mm y seguimiento de clientes.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Navegador Temporal Mensual */}
          <DateFilterControl
            value={dateRange}
            onChange={(range) => {
              setDateRange(range)
              setCurrentPage(1)
            }}
            variant="unified"
            label="Mes de Operación"
            align="right"
          />

          <Button
            onClick={() => {
              resetForm()
              setIsNewOrderModalOpen(true)
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 sm:h-10 px-4 rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>+ Nuevo Pedido</span>
          </Button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. RIBBON DE CONTROL OPERATIVO & FINANCIERO (SENIOR UX - SIN REDUNDANCIAS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 bg-card border border-border rounded-2xl p-3 shadow-2xs">
        {/* Métrica 1: Facturación del Mes */}
        <div className="flex flex-col justify-between p-2">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider">Facturado Mes</span>
            <Boxes className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold text-foreground tracking-tight tabular-nums">
              {formatCurrency(kpis.totalFacturado)}
            </span>
            <span className="text-[11px] text-muted-foreground block">
              {kpis.totalPedidos} pedidos ({kpis.totalPiezas} piezas)
            </span>
          </div>
        </div>

        {/* Métrica 2: En Seguimiento / Cotizaciones */}
        <div 
          onClick={() => setActiveTab('SEGUIMIENTO')}
          className={`flex flex-col justify-between p-2 rounded-xl transition-colors cursor-pointer border ${
            activeTab === 'SEGUIMIENTO' 
              ? 'bg-amber-500/10 border-amber-500/30' 
              : 'hover:bg-secondary/60 border-transparent'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
              En Seguimiento
            </span>
            <Clock className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400 tracking-tight tabular-nums">
              {kpis.pendientes}
            </span>
            <span className="text-[11px] text-muted-foreground block">
              cotizaciones / por validar
            </span>
          </div>
        </div>

        {/* Métrica 3: En Cola de Taller */}
        <div 
          onClick={() => setActiveTab('PRODUCCION')}
          className={`flex flex-col justify-between p-2 rounded-xl transition-colors cursor-pointer border ${
            activeTab === 'PRODUCCION' 
              ? 'bg-sky-500/10 border-sky-500/30' 
              : 'hover:bg-secondary/60 border-transparent'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sky-700 dark:text-sky-400">
              En Taller
            </span>
            <Package className="h-3.5 w-3.5 text-sky-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold text-sky-700 dark:text-sky-400 tracking-tight tabular-nums">
              {kpis.enProduccion + kpis.pagoValidados}
            </span>
            <span className="text-[11px] text-muted-foreground block">
              en preparación / cola
            </span>
          </div>
        </div>

        {/* Métrica 4: Listos para Despacho */}
        <div 
          onClick={() => setActiveTab('ENTREGA')}
          className={`flex flex-col justify-between p-2 rounded-xl transition-colors cursor-pointer border ${
            activeTab === 'ENTREGA' 
              ? 'bg-purple-500/10 border-purple-500/30' 
              : 'hover:bg-secondary/60 border-transparent'
          }`}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
              Por Entregar
            </span>
            <Truck className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="mt-1">
            <span className="text-lg font-bold text-purple-700 dark:text-purple-400 tracking-tight tabular-nums">
              {kpis.listos}
            </span>
            <span className="text-[11px] text-muted-foreground block">
              listos para envío/recojo
            </span>
          </div>
        </div>

        {/* Métrica 5: Cuentas por Cobrar */}
        <div className="flex flex-col justify-between p-2 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[10px] font-semibold uppercase tracking-wider">
              Por Cobrar
            </span>
            <DollarSign className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-1">
            <span className={`text-lg font-bold tracking-tight tabular-nums ${
              kpis.saldoPorCobrar > 0 ? 'text-destructive' : 'text-emerald-700 dark:text-emerald-400'
            }`}>
              {formatCurrency(kpis.saldoPorCobrar)}
            </span>
            <span className="text-[11px] text-muted-foreground block">
              Cobrado: {formatCurrency(kpis.totalCobrado)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PESTAÑAS OPERATIVAS & BARRA DE FILTROS                                 */}
      {/* ========================================================================= */}
      <div className="space-y-2.5">
        {/* Pestañas de estado operativo (Senior UX) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('TODOS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'TODOS'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <span>Todos los Pedidos</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
              {kpis.totalPedidos}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SEGUIMIENTO')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'SEGUIMIENTO'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-card border border-border text-amber-700 dark:text-amber-400 hover:bg-amber-500/10'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>En Seguimiento / Posibles</span>
            {kpis.pendientes > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-800 dark:text-amber-200 font-extrabold">
                {kpis.pendientes}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('PRODUCCION')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'PRODUCCION'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Package className="w-3 h-3" />
            <span>En Taller / Producción</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
              {kpis.enProduccion + kpis.pagoValidados}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ENTREGA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'ENTREGA'
                ? 'bg-purple-600 text-white shadow-xs'
                : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
            }`}
          >
            <Truck className="w-3 h-3" />
            <span>Listos & Entregados</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/10 dark:bg-white/10">
              {kpis.listos + kpis.entregados}
            </span>
          </button>
        </div>

        {/* Barra de Búsqueda y Filtros de Pago */}
        <div className="w-full bg-card border border-border rounded-2xl p-2.5 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Buscador Elástico */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, código (#BG-XXX), producto o WhatsApp..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="h-9 w-full rounded-xl border-input bg-background pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-2xs"
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

          {/* Filtros Secundarios */}
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={selectedPagoFilter}
              onChange={(e) => {
                setSelectedPagoFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="h-9 px-3 rounded-xl border border-input bg-background text-xs font-medium text-foreground hover:bg-secondary/40 cursor-pointer focus:outline-none"
            >
              <option value="TODOS">Todos los pagos</option>
              <option value="PAGADO">100% Pagado</option>
              <option value="PENDIENTE">Con Saldo Pendiente</option>
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. REDISEÑO DE TABLA DE PEDIDOS (CON ACCIONES 80MM Y WHATSAPP)            */}
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
        onPrintThermal={(p) => setSelectedThermalPedido(p)}
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
        <div className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-4xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-secondary/40 border-b border-border p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                  <Boxes className="h-5 w-5 text-primary" />
                  <span>Registrar Pedido</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Agrega productos, asigna cliente y calcula balance y saldo automáticamente.
                </p>
              </div>

              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer active:scale-95"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitNuevoPedido} className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Modal Form Scrollable Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
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
                  <div className="flex items-center justify-between pb-1 border-b border-border">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                      2. Productos del Pedido ({formItems.length})
                    </span>

                    <Button
                      type="button"
                      size="sm"
                      onClick={addItem}
                      className="h-8 sm:h-7 px-3 sm:px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs cursor-pointer flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Agregar Producto</span>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formItems.map((item, index) => {
                      const selectedProd = productos.find(p => p.id === item.productoId)
                      const itemSubtotal = (Number(item.precioUnitario) + Number(item.costoPackaging)) * Number(item.cantidad)

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 sm:p-4 rounded-2xl bg-secondary/30 border border-border space-y-3 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-foreground uppercase tracking-wide flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-primary" />
                              Producto #{index + 1}
                            </span>

                            {formItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-muted-foreground hover:text-destructive text-xs flex items-center gap-1 font-semibold cursor-pointer active:scale-95 transition-colors p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Quitar</span>
                              </button>
                            )}
                          </div>

                          {/* Fila 1: Selector de Producto */}
                          <div className="space-y-1">
                            <Label className="text-[11px] text-foreground font-bold">Producto *</Label>
                            <select
                              required
                              value={item.productoId}
                              onChange={(e) => updateItem(item.id, { productoId: e.target.value })}
                              className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground font-bold focus:outline-none focus:border-primary"
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
                              <Label className="text-[10px] text-muted-foreground font-bold">Tier de Precio</Label>
                              <select
                                value={item.tipoPrecio}
                                onChange={(e) => updateItem(item.id, { tipoPrecio: e.target.value as TipoPrecio })}
                                className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs font-semibold text-foreground focus:outline-none"
                              >
                                <option value="MERCADO">Mercado</option>
                                <option value="AMIGOS">Amigos</option>
                                <option value="PERSONALIZADO">Personalizado</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-bold">Cantidad</Label>
                              <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                value={item.cantidad}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, { cantidad: e.target.value })}
                                className="h-8 bg-background border-input text-xs font-bold font-mono rounded-lg"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-bold">Precio Unitario (S/)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.precioUnitario}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, { precioUnitario: e.target.value, tipoPrecio: 'PERSONALIZADO' })}
                                className="h-8 bg-background border-input text-xs font-bold font-mono rounded-lg"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-bold">Packaging (S/)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.costoPackaging}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, { costoPackaging: e.target.value })}
                                className="h-8 bg-background border-input text-xs font-mono rounded-lg"
                              />
                            </div>
                          </div>

                          {/* Fila 3: Personalización y Subtotal */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/60 text-xs">
                            <div className="flex-1">
                              <Input
                                placeholder="Notas o detalles del producto (opcional)..."
                                value={item.personalizacion}
                                onChange={(e) => updateItem(item.id, { personalizacion: e.target.value })}
                                className="h-8 bg-background border-input text-xs rounded-lg"
                              />
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto font-mono">
                              <span className="text-[11px] text-muted-foreground">Subtotal Ítem:</span>
                              <strong className="text-sm text-foreground font-black">{formatCurrency(itemSubtotal)}</strong>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* SECCIÓN 3: LIQUIDACIÓN FINANCIERA, ENVÍO Y ANTICIPO */}
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-4">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                    3. Totales del Pedido y Anticipo
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-foreground font-bold">Costo de Envío (S/)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formCostoEnvio}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setFormCostoEnvio(e.target.value)}
                        className="bg-background border-input text-sm font-mono font-bold rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-foreground font-bold">Abono Inicial / Anticipo (S/)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formMontoPagado}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setFormMontoPagado(e.target.value)}
                        className="bg-background border-emerald-500/30 text-sm font-mono font-bold text-emerald-700 dark:text-emerald-400 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-foreground font-bold">Método de Pago</Label>
                      <select
                        value={formMetodoPago}
                        onChange={(e) => setFormMetodoPago(e.target.value)}
                        className="w-full h-9 rounded-xl border border-input bg-background px-3 text-sm text-foreground font-bold focus:outline-none"
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
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-muted-foreground block">Atajos de Anticipo:</span>
                    <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center">
                      <button
                        type="button"
                        onClick={() => setFormMontoPagado((formTotalCalculado * 0.5).toFixed(2))}
                        className="px-2.5 py-2 sm:py-1 rounded-xl sm:rounded-lg text-xs font-bold bg-secondary hover:bg-secondary/80 border border-border text-foreground cursor-pointer text-center active:scale-95 transition-transform"
                      >
                        50% (S/ {(formTotalCalculado * 0.5).toFixed(2)})
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormMontoPagado(formTotalCalculado.toFixed(2))}
                        className="px-2.5 py-2 sm:py-1 rounded-xl sm:rounded-lg text-xs font-bold bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 cursor-pointer text-center active:scale-95 transition-transform"
                      >
                        100% Total
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormMontoPagado('0')}
                        className="px-2.5 py-2 sm:py-1 rounded-xl sm:rounded-lg text-xs font-bold bg-secondary hover:bg-secondary/80 border border-border text-muted-foreground cursor-pointer text-center active:scale-95 transition-transform"
                      >
                        S/ 0.00
                      </button>
                    </div>
                  </div>

                  {/* Resumen Totalizador */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 p-3 bg-card rounded-xl border border-border text-center font-mono">
                    <div className="p-1 sm:p-0 bg-secondary/30 sm:bg-transparent rounded-lg sm:rounded-none">
                      <span className="text-[10px] text-muted-foreground block uppercase">Subtotal</span>
                      <strong className="text-sm font-bold text-foreground">{formatCurrency(formSubtotalCalculado)}</strong>
                    </div>
                    <div className="p-1 sm:p-0 bg-emerald-500/10 sm:bg-transparent rounded-lg sm:rounded-none">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-bold">TOTAL PEDIDO</span>
                      <strong className="text-base font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(formTotalCalculado)}</strong>
                    </div>
                    <div className="p-1 sm:p-0 bg-amber-500/10 sm:bg-transparent rounded-lg sm:rounded-none">
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 block uppercase font-bold">Saldo x Cobrar</span>
                      <strong className="text-base font-black text-amber-700 dark:text-amber-400">S/ {formSaldoPendienteCalculado.toFixed(2)}</strong>
                    </div>
                  </div>

                  {/* Checkbox Descontar Stock */}
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-foreground font-medium">
                    <input
                      type="checkbox"
                      checked={formDescontarStock}
                      onChange={(e) => setFormDescontarStock(e.target.checked)}
                      className="rounded text-primary focus:ring-primary cursor-pointer h-4 w-4"
                    />
                    <span>Descontar automáticamente del stock disponible de los productos</span>
                  </label>
                </div>
              </div>

              {/* Modal Sticky Footer con Resumen en Vivo y Acciones Responsivas */}
              <div className="shrink-0 sticky bottom-0 bg-card/95 backdrop-blur-md border-t border-border p-3.5 sm:p-4 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
                {/* Resumen Financiero en Vivo */}
                <div className="flex items-center justify-between sm:justify-start gap-4 font-mono px-1 sm:px-0">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Total Pedido</span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(formTotalCalculado)}</span>
                  </div>
                  <div className="h-7 w-px bg-border/80" />
                  <div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold block">Saldo x Cobrar</span>
                    <span className="text-base font-black text-amber-700 dark:text-amber-400">S/ {formSaldoPendienteCalculado.toFixed(2)}</span>
                  </div>
                </div>

                {/* Botones de Acción Táctiles */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsNewOrderModalOpen(false)}
                    className="h-10 min-h-[44px] px-4 rounded-xl border-border text-muted-foreground hover:bg-secondary font-bold text-xs cursor-pointer flex-1 sm:flex-none active:scale-95 transition-transform"
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 min-h-[44px] px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 cursor-pointer flex-1 sm:flex-none active:scale-95 transition-transform"
                  >
                    {isSubmitting ? 'Guardando...' : 'Crear Pedido'}
                  </Button>
                </div>
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
        onPrintThermal={(p) => setSelectedThermalPedido(p)}
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
      {/* 8. MODAL: TICKET TÉRMICO 80MM PARA IMPRESIÓN POS                           */}
      {/* ========================================================================= */}
      <ThermalTicket80mmModal
        isOpen={!!selectedThermalPedido}
        pedido={selectedThermalPedido}
        onClose={() => setSelectedThermalPedido(null)}
      />

      {/* ========================================================================= */}
      {/* 7. MODAL: EDITAR / MANTENIMIENTO DE PEDIDO                                */}
      {/* ========================================================================= */}
      {isEditModalOpen && editingPedido && (
        <div className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-3xl shadow-2xl max-w-4xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-secondary/40 border-b border-border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-secondary text-foreground border border-border font-mono font-bold text-xs px-2.5 py-0.5 rounded-lg">
                    {editingPedido.codigo}
                  </Badge>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-1.5">
                    <Pencil className="h-4.5 w-4.5 text-primary" />
                    <span>Editar Pedido</span>
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Modifica cliente, fecha, notas, estado, y añade/quita/modifica los productos asignados.
                </p>
              </div>

              <button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setEditingPedido(null)
                }}
                className="p-1.5 rounded-xl hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors cursor-pointer self-end sm:self-auto"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitEditPedido} className="flex-1 flex flex-col overflow-hidden min-h-0">
              {/* Modal Form Scrollable Body */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 space-y-6">
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
                      <span className="text-xs font-bold text-muted-foreground">Estado:</span>
                      <select
                        value={editEstado}
                        onChange={(e) => setEditEstado(e.target.value as EstadoPedido)}
                        className="text-xs font-bold rounded-xl px-3 py-1 border border-input bg-background text-foreground cursor-pointer focus:outline-none"
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
                  <Label className="text-xs text-foreground font-bold">Notas del Pedido</Label>
                  <Input
                    placeholder="Notas internas, indicaciones de acabado, etc..."
                    value={formNotas}
                    onChange={(e) => setFormNotas(e.target.value)}
                    className="bg-background border-input text-sm rounded-xl"
                  />
                </div>

                {/* SECCIÓN 2: LISTA DE PRODUCTOS DINÁMICA */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-1 border-b border-border">
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-primary" />
                      2. Productos Asignados ({formItems.length})
                    </span>

                    <Button
                      type="button"
                      size="sm"
                      onClick={addItem}
                      className="h-8 sm:h-7 px-3 sm:px-2.5 rounded-lg bg-secondary hover:bg-secondary/80 border border-border text-foreground font-bold text-xs cursor-pointer flex items-center gap-1 active:scale-95 transition-transform"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>+ Agregar Producto</span>
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {formItems.map((item, index) => {
                      const itemSubtotal = (Number(item.precioUnitario) + Number(item.costoPackaging)) * Number(item.cantidad)

                      return (
                        <div
                          key={item.id}
                          className="p-3.5 sm:p-4 rounded-2xl bg-secondary/30 border border-border space-y-3 relative"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-foreground uppercase tracking-wide flex items-center gap-1.5">
                              <Package className="h-3.5 w-3.5 text-primary" />
                              Producto #{index + 1}
                            </span>

                            {formItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-muted-foreground hover:text-destructive text-xs flex items-center gap-1 font-semibold cursor-pointer active:scale-95 transition-colors p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Quitar</span>
                              </button>
                            )}
                          </div>

                          {/* Fila 1: Selector de Producto */}
                          <div className="space-y-1">
                            <Label className="text-[11px] text-foreground font-bold">Producto *</Label>
                            <select
                              required
                              value={item.productoId}
                              onChange={(e) => updateItem(item.id, { productoId: e.target.value })}
                              className="w-full h-9 rounded-xl border border-input bg-background px-3 text-xs text-foreground font-bold focus:outline-none"
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
                              <Label className="text-[10px] text-muted-foreground font-bold">Tier de Precio</Label>
                              <select
                                value={item.tipoPrecio}
                                onChange={(e) => updateItem(item.id, { tipoPrecio: e.target.value as TipoPrecio })}
                                className="w-full h-8 rounded-lg border border-input bg-background px-2 text-xs font-semibold text-foreground focus:outline-none"
                              >
                                <option value="MERCADO">Mercado</option>
                                <option value="AMIGOS">Amigos</option>
                                <option value="PERSONALIZADO">Personalizado</option>
                              </select>
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-bold">Cantidad</Label>
                              <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                value={item.cantidad}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, { cantidad: e.target.value })}
                                className="h-8 bg-background border-input text-xs font-bold font-mono rounded-lg"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-bold">Precio Unitario (S/)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.precioUnitario}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, { precioUnitario: e.target.value, tipoPrecio: 'PERSONALIZADO' })}
                                className="h-8 bg-background border-input text-xs font-bold font-mono rounded-lg"
                              />
                            </div>

                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground font-bold">Packaging (S/)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={item.costoPackaging}
                                onFocus={(e) => e.target.select()}
                                onChange={(e) => updateItem(item.id, { costoPackaging: e.target.value })}
                                className="h-8 bg-background border-input text-xs font-mono rounded-lg"
                              />
                            </div>
                          </div>

                          {/* Fila 3: Personalización y Subtotal */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-border/60 text-xs">
                            <div className="flex-1">
                              <Input
                                placeholder="Notas o detalles del producto (opcional)..."
                                value={item.personalizacion}
                                onChange={(e) => updateItem(item.id, { personalizacion: e.target.value })}
                                className="h-8 bg-background border-input text-xs rounded-lg"
                              />
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-auto font-mono">
                              <span className="text-[11px] text-muted-foreground">Subtotal Ítem:</span>
                              <strong className="text-sm text-foreground font-black">{formatCurrency(itemSubtotal)}</strong>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* SECCIÓN 3: LIQUIDACIÓN FINANCIERA Y ENVÍO */}
                <div className="p-4 rounded-2xl bg-secondary/30 border border-border space-y-4">
                  <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                    3. Totales del Pedido y Saldo
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-foreground font-bold">Costo de Envío / Flete (S/)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formCostoEnvio}
                        onFocus={(e) => e.target.select()}
                        onChange={(e) => setFormCostoEnvio(e.target.value)}
                        className="bg-background border-input text-sm font-mono font-bold rounded-xl"
                      />
                    </div>

                    <div className="p-3 bg-card rounded-xl border border-border flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground block uppercase font-bold">Abonos Ya Cobrados</span>
                        <span className="text-xs text-muted-foreground">({editingPedido.pagos.length} pagos registrados)</span>
                      </div>
                      <strong className="text-base font-black text-emerald-700 dark:text-emerald-400 font-mono">
                        +{formatCurrency(editingPedido.montoPagado)}
                      </strong>
                    </div>
                  </div>

                  {/* Resumen Totalizador */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 p-3 bg-card rounded-xl border border-border text-center font-mono">
                    <div className="p-1 sm:p-0 bg-secondary/30 sm:bg-transparent rounded-lg sm:rounded-none">
                      <span className="text-[10px] text-muted-foreground block uppercase">Subtotal Ítems</span>
                      <strong className="text-sm font-bold text-foreground">{formatCurrency(formSubtotalCalculado)}</strong>
                    </div>
                    <div className="p-1 sm:p-0 bg-emerald-500/10 sm:bg-transparent rounded-lg sm:rounded-none">
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block uppercase font-bold">NUEVO TOTAL</span>
                      <strong className="text-base font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(formTotalCalculado)}</strong>
                    </div>
                    <div className="p-1 sm:p-0 bg-amber-500/10 sm:bg-transparent rounded-lg sm:rounded-none">
                      <span className="text-[10px] text-amber-700 dark:text-amber-400 block uppercase font-bold">Saldo x Cobrar</span>
                      <strong className="text-base font-black text-amber-700 dark:text-amber-400">
                        S/ {Math.max(0, formTotalCalculado - editingPedido.montoPagado).toFixed(2)}
                      </strong>
                    </div>
                  </div>

                  <div className="p-2.5 bg-secondary/40 rounded-xl border border-border text-[11px] text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                    <span>
                      Los abonos previos (S/ {editingPedido.montoPagado.toFixed(2)}) se conservan intactos. Si el total del pedido cambia, el saldo pendiente se recalcula automáticamente.
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Sticky Footer con Resumen en Vivo y Acciones Responsivas */}
              <div className="shrink-0 sticky bottom-0 bg-card/95 backdrop-blur-md border-t border-border p-3.5 sm:p-4 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
                {/* Resumen Financiero en Vivo */}
                <div className="flex items-center justify-between sm:justify-start gap-4 font-mono px-1 sm:px-0">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold block">Nuevo Total</span>
                    <span className="text-base font-black text-emerald-700 dark:text-emerald-400">{formatCurrency(formTotalCalculado)}</span>
                  </div>
                  <div className="h-7 w-px bg-border/80" />
                  <div>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 uppercase font-bold block">Saldo x Cobrar</span>
                    <span className="text-base font-black text-amber-700 dark:text-amber-400">
                      S/ {Math.max(0, formTotalCalculado - editingPedido.montoPagado).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Botones de Acción Táctiles */}
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setEditingPedido(null)
                    }}
                    className="h-10 min-h-[44px] px-4 rounded-xl border-border text-muted-foreground hover:bg-secondary font-bold text-xs cursor-pointer flex-1 sm:flex-none active:scale-95 transition-transform"
                  >
                    Cancelar
                  </Button>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-10 min-h-[44px] px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 cursor-pointer flex items-center justify-center gap-1.5 flex-1 sm:flex-none active:scale-95 transition-transform"
                  >
                    <Pencil className="h-4 w-4" />
                    <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
