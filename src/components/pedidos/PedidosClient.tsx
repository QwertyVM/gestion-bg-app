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
import { MultiColorPicker } from '@/components/ui/MultiColorPicker'

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
  filamentos: FilamentoOption[]
}

interface FormItemState {
  id: string
  productoId: string
  colorFilamentoId: string
  coloresIds: string[]
  personalizacion: string
  cantidad: number | string
  tipoPrecio: TipoPrecio
  precioUnitario: number | string
  costoPackaging: number | string
  porcentajeAdicional: number
  gramosConsumidos: number
}

function getDefaultFilamentoId(fils: FilamentoOption[]): string {
  if (!fils || fils.length === 0) return ''
  const negro = fils.find(f => f.nombreColor.toLowerCase().includes('negro'))
  if (negro) return negro.id
  return fils[0]?.id || ''
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

export function PedidosClient({ pedidosIniciales, productos, filamentos }: PedidosClientProps) {
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

  // =========================================================================
  // ESTADO DEL FORMULARIO MULTIPRODUCTO
  // =========================================================================
  const [formFecha, setFormFecha] = useState(() => new Date().toISOString().split('T')[0])
  const [formCliente, setFormCliente] = useState('')
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

  // Lista dinámica de ítems
  const [formItems, setFormItems] = useState<FormItemState[]>(() => {
    const defaultProd = productos[0]
    const defaultFilId = getDefaultFilamentoId(filamentos)
    return [
      {
        id: 'item-1',
        productoId: defaultProd ? defaultProd.id : '',
        colorFilamentoId: defaultFilId,
        coloresIds: defaultFilId ? [defaultFilId] : [],
        personalizacion: '',
        cantidad: 1,
        tipoPrecio: 'MERCADO',
        precioUnitario: defaultProd ? defaultProd.precioMercado : '',
        costoPackaging: '',
        porcentajeAdicional: 0,
        gramosConsumidos: defaultProd ? defaultProd.pesoGramos : 0
      }
    ]
  })

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // =========================================================================
  // HELPER PARA AGREGAR / EDITAR ÍTEMS EN EL FORMULARIO
  // =========================================================================
  const addItem = () => {
    const defaultProd = productos[0]
    const defaultFilId = getDefaultFilamentoId(filamentos)
    setFormItems(prev => [
      ...prev,
      {
        id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productoId: defaultProd ? defaultProd.id : '',
        colorFilamentoId: defaultFilId,
        coloresIds: defaultFilId ? [defaultFilId] : [],
        personalizacion: '',
        cantidad: 1,
        tipoPrecio: 'MERCADO',
        precioUnitario: defaultProd ? defaultProd.precioMercado : '',
        costoPackaging: '',
        porcentajeAdicional: 0,
        gramosConsumidos: defaultProd ? defaultProd.pesoGramos : 0
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

      // Si cambió el producto, recalcular precio y gramos base
      if (updates.productoId && updates.productoId !== item.productoId) {
        const p = productos.find(prod => prod.id === updates.productoId)
        if (p) {
          let pUnit = p.precioMercado
          if (merged.tipoPrecio === 'AMIGOS') pUnit = p.precioAmigos
          else if (merged.tipoPrecio === 'MERCADO') pUnit = p.precioMercado
          merged.precioUnitario = pUnit
          merged.gramosConsumidos = p.pesoGramos * (Number(merged.cantidad) || 1)
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

      // Si cambió la cantidad, actualizar gramos estimados
      if (updates.cantidad !== undefined) {
        const p = productos.find(prod => prod.id === merged.productoId)
        if (p && p.pesoGramos) {
          merged.gramosConsumidos = p.pesoGramos * (Number(merged.cantidad) || 0)
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
    const defaultFilId = getDefaultFilamentoId(filamentos)
    setFormFecha(new Date().toISOString().split('T')[0])
    setFormCliente('')
    setFormTelefono('')
    setFormCanal('WhatsApp')
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
        colorFilamentoId: defaultFilId,
        coloresIds: defaultFilId ? [defaultFilId] : [],
        personalizacion: '',
        cantidad: 1,
        tipoPrecio: 'MERCADO',
        precioUnitario: defaultProd ? defaultProd.precioMercado : '',
        costoPackaging: '',
        porcentajeAdicional: 0,
        gramosConsumidos: defaultProd ? defaultProd.pesoGramos : 0
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
    setFormTelefono(p.telefono || '')
    setFormCanal(p.canalVenta || 'WhatsApp')
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

  // =========================================================================
  // TRANSICIONAR ESTADO DEL PEDIDO
  // =========================================================================
  const handleCambiarEstado = async (pedidoId: string, nuevoEstado: EstadoPedido) => {
    try {
      const res = await updateEstadoPedido(pedidoId, nuevoEstado)
      if (res.success && res.pedido) {
        setPedidos(prev => prev.map(p => p.id === pedidoId ? (res.pedido as any) : p))
        if (selectedPedidoDetail && selectedPedidoDetail.id === pedidoId) {
          setSelectedPedidoDetail(res.pedido as any)
        }
      } else {
        alert(res.error || 'Error al cambiar estado')
      }
    } catch (err: any) {
      alert(err.message || 'Error al actualizar estado')
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

    const ticketMsg = `*RESUMEN DE PEDIDO 3D — ${p.codigo}*\n` +
      `👤 *Cliente:* ${p.cliente}\n` +
      `📅 *Fecha:* ${formatDate(p.fecha)}\n` +
      (p.diaEntregaPrometida ? `📦 *Entrega Pactada:* ${p.diaEntregaPrometida}\n` : '') +
      `\n*PRODUCTOS:* \n${itemsText}${envioText}\n\n` +
      `💳 *Medio de Pago:* ${p.metodoPago || (p.pagos?.[0]?.metodoPago) || 'YAPE'}\n` +
      `💰 *Total Pedido:* S/ ${p.total.toFixed(2)}\n` +
      `💳 *Abonado:* S/ ${p.montoPagado.toFixed(2)}${saldoText}\n\n` +
      `_¡Gracias por tu pedido en NOVA 3D!_`

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
      {/* 1. HEADER SIMPLE Y ELEGANTE                                               */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#241C15] tracking-tight">
              Gestión de Pedidos
            </h1>
            <span className="text-xs font-bold text-[#75695D] font-mono">
              ({kpis.totalPedidos})
            </span>
          </div>
          <p className="text-xs text-[#75695D] mt-0.5">
            Registro, control de pagos y envíos por cliente.
          </p>
        </div>

        <Button
          onClick={() => {
            resetForm()
            setIsNewOrderModalOpen(true)
          }}
          className="h-9 px-3.5 rounded-xl bg-[#1E5E3A] hover:bg-[#16482C] text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto active:scale-[0.98]"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Nuevo Pedido</span>
        </Button>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPIS EJECUTIVOS DE PEDIDOS (MINIMALISTAS)                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* KPI 1: Total Pedidos */}
        <div className="rounded-2xl border border-[#E2D9CC] bg-white p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#75695D] mb-1">
            <span className="text-xs font-semibold text-[#6B7280]">Total Pedidos</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#7C5835]">
              <Boxes className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-mono text-xl font-black text-[#1F2937] tabular-nums">{kpis.totalPedidos}</span>
            <span className="text-xs text-[#75695D]">({kpis.totalPiezas} piezas)</span>
          </div>
        </div>

        {/* KPI 2: En Producción */}
        <div className="rounded-2xl border border-[#E2D9CC] bg-white p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#75695D] mb-1">
            <span className="text-xs font-semibold text-[#6B7280]">Preparando</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#2B6CB0]">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-mono text-xl font-black text-[#2B6CB0] tabular-nums">{kpis.enProduccion}</span>
            <span className="text-xs text-[#75695D]">en taller</span>
          </div>
        </div>

        {/* KPI 3: Por Entregar / Listos */}
        <div className="rounded-2xl border border-[#E2D9CC] bg-white p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#75695D] mb-1">
            <span className="text-xs font-semibold text-[#6B7280]">Por Entregar</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#805AD5]">
              <Package className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-mono text-xl font-black text-[#805AD5] tabular-nums">{kpis.listos}</span>
            <span className="text-xs text-[#75695D]">listos</span>
          </div>
        </div>

        {/* KPI 4: Saldo por Cobrar */}
        <div className="rounded-2xl border border-[#E2D9CC] bg-white p-3.5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#75695D] mb-1">
            <span className="text-xs font-semibold text-[#6B7280]">Por Cobrar</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#92400E]">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-black text-[#92400E] truncate tabular-nums">
              {formatCurrency(kpis.saldoPorCobrar)}
            </span>
          </div>
        </div>

        {/* KPI 5: Cobrado en Caja */}
        <div className="rounded-2xl border border-[#E2D9CC] bg-white p-3.5 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#75695D] mb-1">
            <span className="text-xs font-semibold text-[#6B7280]">Cobrado</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#059669]">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-lg font-black text-[#059669] truncate tabular-nums">
              {formatCurrency(kpis.totalCobrado)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PANEL MAESTRO: FILTROS + TABLA / TARJETAS EN UN SOLO CONTENEDOR        */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl shadow-xs overflow-hidden">
        {/* Toolbar Integrada en 1 Fila (Opción 1: Buscador Principal + Selectores Dropdown) */}
        <div className="p-2.5 sm:p-3 bg-[#FFFFFF] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Buscador Amplio */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#75695D]" />
            <Input
              placeholder="Buscar por cliente, código (#PED-001), producto o teléfono..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setCurrentPage(1)
              }}
              className="pl-8.5 pr-7 h-8.5 bg-[#FAF8F5] border-[#E2D9CC] text-xs sm:text-sm text-[#241C15] placeholder:text-[#A89F91] rounded-xl focus:bg-white"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setCurrentPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-0.5 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Grupo de Filtros Compactos a la Derecha */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end shrink-0">
            {/* Filtro de Fecha */}
            <DateFilterControl
              value={dateRange}
              onChange={(range) => {
                setDateRange(range)
                setCurrentPage(1)
              }}
              label="Filtrar Pedidos"
              align="right"
            />

            {/* Filtro de Estado (Dropdown) */}
            <select
              value={selectedEstadoFilter}
              onChange={(e) => {
                setSelectedEstadoFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="h-8.5 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] px-2.5 text-xs font-semibold text-[#241C15] cursor-pointer focus:outline-none"
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

            {/* Filtro de Pago (Dropdown) */}
            <select
              value={selectedPagoFilter}
              onChange={(e) => {
                setSelectedPagoFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="h-8.5 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] px-2.5 text-xs font-semibold text-[#241C15] cursor-pointer focus:outline-none"
            >
              <option value="TODOS">Todos los pagos</option>
              <option value="PAGADO">100% Pagado</option>
              <option value="PENDIENTE">Con Saldo</option>
            </select>

            {/* Selector de Filas */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="h-8.5 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] px-2.5 text-xs font-semibold text-[#241C15] cursor-pointer focus:outline-none"
            >
              <option value={10}>10 pedidos</option>
              <option value={20}>20 pedidos</option>
              <option value={50}>50 pedidos</option>
              <option value={9999}>Todos ({filteredPedidos.length})</option>
            </select>
          </div>
        </div>

        {/* Contenido Principal: Tabla Interactiva de Pedidos (Zero-Scroll) */}
        {filteredPedidos.length === 0 ? (
          <div className="p-12 text-center border-t border-[#E2D9CC]">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-[#FAF8F5] flex items-center justify-center text-[#75695D] mb-3">
              <Boxes className="h-6 w-6" />
            </div>
            <h3 className="text-base font-extrabold text-[#241C15]">No se encontraron pedidos</h3>
            <p className="text-xs text-[#75695D] mt-1 max-w-sm mx-auto">
              No hay pedidos que coincidan con los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="border-t border-[#E2D9CC]">
            <div className="w-full">
              <Table className="w-full">
                <TableHeader className="bg-[#FAF8F5]/80 border-b border-[#E2D9CC]">
                  <TableRow className="border-[#E2D9CC] hover:bg-transparent">
                    <TableHead className="px-4 py-3 text-xs font-bold text-[#75695D]">
                      <button
                        onClick={() => handleSort('fecha')}
                        className="flex items-center gap-1.5 text-xs font-bold text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer"
                      >
                        <span>Pedido & Cliente</span>
                        {sortField === 'fecha' || sortField === 'codigo' || sortField === 'cliente' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-[#A36F4C]" /> : <ArrowDown className="h-3 w-3 text-[#A36F4C]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-[#75695D]/40" />
                        )}
                      </button>
                    </TableHead>

                    <TableHead className="px-3 py-3 text-xs font-bold text-[#75695D]">
                      <button
                        onClick={() => handleSort('cantidad')}
                        className="flex items-center gap-1 text-xs font-bold text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer"
                      >
                        <span>Productos</span>
                        {sortField === 'cantidad' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-[#A36F4C]" /> : <ArrowDown className="h-3 w-3 text-[#A36F4C]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-[#75695D]/40" />
                        )}
                      </button>
                    </TableHead>

                    <TableHead className="w-40 px-3 py-3 text-xs font-bold text-[#75695D]">
                      Entrega & Destino
                    </TableHead>

                    <TableHead className="w-36 px-3 py-3 text-center text-xs font-bold text-[#75695D]">
                      <button
                        onClick={() => handleSort('estado')}
                        className="flex items-center justify-center gap-1 text-xs font-bold text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer mx-auto"
                      >
                        <span>Estado</span>
                        {sortField === 'estado' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-[#A36F4C]" /> : <ArrowDown className="h-3 w-3 text-[#A36F4C]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-[#75695D]/40" />
                        )}
                      </button>
                    </TableHead>

                    <TableHead className="w-40 px-4 py-3 text-right">
                      <button
                        onClick={() => handleSort('total')}
                        className="flex items-center gap-1 text-xs font-bold text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer ml-auto"
                      >
                        <span>Total & Saldo</span>
                        {sortField === 'total' || sortField === 'saldoPendiente' ? (
                          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3 text-[#A36F4C]" /> : <ArrowDown className="h-3 w-3 text-[#A36F4C]" />
                        ) : (
                          <ArrowUpDown className="h-3 w-3 text-[#75695D]/40" />
                        )}
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedPedidos.map((p) => {
                    const isFullyPaid = p.saldoPendiente <= 0

                    return (
                      <TableRow
                        key={p.id}
                        onClick={() => setSelectedPedidoDetail(p)}
                        className="border-b border-[#E2D9CC]/50 hover:bg-[#FAF8F5]/80 transition-colors cursor-pointer group"
                      >
                        {/* 1. Pedido & Cliente */}
                        <TableCell className="px-4 py-3 align-middle">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-[#241C15] group-hover:text-[#A36F4C] transition-colors truncate">
                                {p.cliente}
                              </span>
                              <span className="font-mono font-bold text-xs text-[#A36F4C]">
                                {p.codigo}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-[#75695D]">
                              <span>{formatDate(p.fecha)}</span>
                              {p.canalVenta && (
                                <>
                                  <span className="text-[#D4BEA7]">•</span>
                                  <span>{p.canalVenta}</span>
                                </>
                              )}
                              {p.telefono && (
                                <>
                                  <span className="text-[#D4BEA7]">•</span>
                                  <span className="font-mono">{p.telefono}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* 2. Productos */}
                        <TableCell className="px-3 py-3 align-middle">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-[#241C15]">
                                {p.totalItemsCount} {p.totalItemsCount === 1 ? 'pieza' : 'piezas'}
                              </span>
                              {p.items.length > 1 && (
                                <span className="text-xs text-[#75695D]">
                                  ({p.items.length} modelos)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#75695D] truncate max-w-[240px]">
                              {p.items.map(it => `${it.nombreProductoSnapshot} (x${it.cantidad})`).join(', ')}
                            </div>
                          </div>
                        </TableCell>

                        {/* 3. Entrega & Destino */}
                        <TableCell className="w-40 px-3 py-3 align-middle">
                          <div className="space-y-0.5 text-xs">
                            {p.diaEntregaPrometida ? (
                              <div className="font-medium text-[#241C15] truncate">
                                {p.diaEntregaPrometida}
                              </div>
                            ) : (
                              <div className="text-[#A89F91]">Sin fecha</div>
                            )}
                            {p.destinoEnvio && (
                              <div className="text-[11px] text-[#75695D] truncate">
                                {p.destinoEnvio}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* 4. Estado con Selector Rápido */}
                        <TableCell className="w-36 px-3 py-3 align-middle text-center" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={p.estado}
                            onChange={(e) => handleCambiarEstado(p.id, e.target.value as EstadoPedido)}
                            className={`text-xs font-bold rounded-xl px-2.5 py-1 border cursor-pointer focus:outline-none transition-all ${
                              p.estado === 'PENDIENTE'
                                ? 'bg-[#FEF9C3]/70 text-[#854D0E] border-[#FDE047]'
                                : p.estado === 'PAGO_VALIDADO'
                                ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                                : p.estado === 'EN_PRODUCCION'
                                ? 'bg-[#DBEAFE]/70 text-[#1D4ED8] border-[#93C5FD]'
                                : p.estado === 'LISTO_ENTREGA'
                                ? 'bg-[#F3E8FF] text-[#7E22CE] border-[#D8B4FE]'
                                : p.estado === 'ENTREGADO'
                                ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                                : 'bg-[#F3F4F6] text-[#6B7280] border-[#E5E7EB]'
                            }`}
                          >
                            {Object.entries(ESTADOS_CONFIG).map(([stKey, conf]) => (
                              <option key={stKey} value={stKey}>
                                {conf.label}
                              </option>
                            ))}
                          </select>
                        </TableCell>

                        {/* 5. Total & Liquidación */}
                        <TableCell className="w-40 px-4 py-3 text-right align-middle">
                          <div className="space-y-0.5">
                            <div className="font-mono font-bold text-sm text-[#241C15]">
                              {formatCurrency(p.total)}
                            </div>
                            <div className="flex items-center justify-end gap-1.5 text-[11px]">
                              {isFullyPaid ? (
                                <span className="font-semibold text-[#1E5E3A]">
                                  100% Pagado
                                </span>
                              ) : p.montoPagado > 0 ? (
                                <>
                                  <span className="font-mono text-[#1E5E3A]">+{formatCurrency(p.montoPagado)}</span>
                                  <span className="text-[#D4BEA7]">•</span>
                                  <span className="font-mono text-[#854D0E]">Resta {formatCurrency(p.saldoPendiente)}</span>
                                </>
                              ) : (
                                <span className="text-[#DC2626] font-medium">
                                  Sin anticipo
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Paginación Unificada en el Footer del Master Card */}
        {itemsPerPage !== 9999 && totalPages > 1 && (
          <div className="p-3.5 sm:p-4 bg-[#FAF8F5] border-t border-[#E2D9CC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-[#75695D] font-medium">
              Mostrando{' '}
              <strong className="text-[#241C15]">{(currentPage - 1) * itemsPerPage + 1}</strong> a{' '}
              <strong className="text-[#241C15]">
                {Math.min(currentPage * itemsPerPage, sortedPedidos.length)}
              </strong>{' '}
              de <strong className="text-[#241C15]">{sortedPedidos.length}</strong> pedidos
            </span>

            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                className="h-8 px-2.5 rounded-xl border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] font-bold text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-[#241C15] text-white shadow-xs'
                      : 'bg-[#FFFFFF] text-[#75695D] hover:bg-[#EAE4DC] border border-[#E2D9CC]'
                  }`}
                >
                  {page}
                </button>
              ))}

              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                className="h-8 px-2.5 rounded-xl border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] font-bold text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

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
                  Agrega 1 o más modelos a este pedido, asigna filamentos y calcula el balance automáticamente.
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
              {/* SECCIÓN 1: DATOS DEL CLIENTE Y ENVÍO */}
              <div className="space-y-3">
                <span className="text-xs font-extrabold text-[#A36F4C] uppercase tracking-wider flex items-center gap-1.5 pb-1 border-b border-[#E2D9CC]">
                  <User className="h-3.5 w-3.5" />
                  1. Datos del Cliente y Despacho
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-[#A36F4C]" />
                      Fecha del Pedido *
                    </Label>
                    <Input
                      type="date"
                      required
                      value={formFecha}
                      onChange={(e) => setFormFecha(e.target.value)}
                      className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Cliente *</Label>
                    <Input
                      required
                      placeholder="Nombre del cliente..."
                      value={formCliente}
                      onChange={(e) => setFormCliente(e.target.value)}
                      className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Teléfono / WhatsApp</Label>
                    <Input
                      placeholder="Ej: 987654321"
                      value={formTelefono}
                      onChange={(e) => setFormTelefono(e.target.value)}
                      className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Canal de Venta</Label>
                    <select
                      value={formCanal}
                      onChange={(e) => setFormCanal(e.target.value)}
                      className="w-full h-9 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] px-3 text-sm text-[#241C15] font-medium"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Feria">Feria / Presencial</option>
                      <option value="Recomendación">Recomendación</option>
                      <option value="Directo">Directo / Taller</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Fecha / Hora Pactada de Entrega</Label>
                    <Input
                      placeholder="Ej: Sábado 18:00, Mañana en Shalom..."
                      value={formDiaEntrega}
                      onChange={(e) => setFormDiaEntrega(e.target.value)}
                      className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Destino / Dirección / Agencia</Label>
                    <Input
                      placeholder="Ej: Shalom Agencia Miraflores, Lima..."
                      value={formDestino}
                      onChange={(e) => setFormDestino(e.target.value)}
                      className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl"
                    />
                  </div>
                </div>
              </div>

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

                        {/* Fila 1: Selector de Producto y Color */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[11px] text-[#241C15] font-bold">Modelo 3D *</Label>
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

                          <div className="space-y-1">
                            <MultiColorPicker
                              selectedColorIds={item.coloresIds || []}
                              onChange={(cols) => updateItem(item.id, { 
                                coloresIds: cols, 
                                colorFilamentoId: cols[0] || '' 
                              })}
                              filamentos={filamentos}
                              label="Color(es) de Filamento"
                              placeholder="Sin asignar (Multicolor / Varios colores)"
                            />
                          </div>
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
                              placeholder="Personalización / Texto grabado / Notas del modelo..."
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
                  <span>Descontar automáticamente gramos estimados de las bobinas seleccionadas</span>
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
      {/* 6. MODAL: DETALLE Y TICKET DE PEDIDO (PRINT / WHATSAPP / ABONOS)          */}
      {/* ========================================================================= */}
      {selectedPedidoDetail && (
        <div className="fixed inset-0 isolate z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-[#FFFFFF] border border-[#D4BEA7] rounded-3xl shadow-2xl max-w-3xl w-full max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-[#FAF8F5] border-b border-[#E2D9CC] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-[#241C15] text-white font-mono font-black text-xs px-2.5 py-0.5 rounded-lg">
                    {selectedPedidoDetail.codigo}
                  </Badge>
                  <h3 className="text-lg font-black text-[#241C15]">
                    Pedido de {selectedPedidoDetail.cliente}
                  </h3>
                </div>
                <p className="text-xs text-[#75695D] mt-0.5">
                  Fecha: {formatDate(selectedPedidoDetail.fecha)} • Canal: {selectedPedidoDetail.canalVenta || 'WhatsApp'}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenEditModal(selectedPedidoDetail)}
                  className="h-8 px-3 rounded-xl border-[#D4BEA7] bg-[#FDF6E2] hover:bg-[#F9ECC4] text-[#8C6D1F] font-extrabold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Editar Pedido</span>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyWhatsAppTicket(selectedPedidoDetail)}
                  className="h-8 px-3 rounded-xl border-[#B4E3C0] bg-[#EBF7EE] text-[#1E5E3A] font-extrabold text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copiar p/ WhatsApp</span>
                  <span className="sm:hidden">WhatsApp</span>
                </Button>

                <button
                  onClick={() => setSelectedPedidoDetail(null)}
                  className="p-1.5 rounded-xl hover:bg-[#EAE4DC] text-[#75695D] hover:text-[#241C15] transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              {/* Notificación de copiado */}
              {copiedNotification && (
                <div className="p-3 bg-[#EBF7EE] border border-[#B4E3C0] text-[#1E5E3A] rounded-xl text-xs font-bold text-center animate-in fade-in">
                  ¡Resumen del ticket copiado al portapapeles listo para enviar por WhatsApp!
                </div>
              )}

              {/* Grid Info Cliente, Fecha, Pago & Despacho */}
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 p-3.5 bg-[#FAF8F5] rounded-2xl border border-[#E2D9CC] text-xs">
                <div>
                  <span className="text-[10px] text-[#75695D] block">Cliente:</span>
                  <strong className="text-[#241C15] font-extrabold">{selectedPedidoDetail.cliente}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#75695D] block">Fecha Pedido:</span>
                  <strong className="text-[#241C15] font-mono flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-[#A36F4C]" />
                    {formatDate(selectedPedidoDetail.fecha)}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#75695D] block">Teléfono:</span>
                  <strong className="text-[#241C15]">{selectedPedidoDetail.telefono || '—'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#75695D] block">Medio de Pago:</span>
                  <strong className="text-[#1E5E3A] flex items-center gap-1 font-black">
                    <CreditCard className="h-3 w-3 text-[#1E5E3A]" />
                    {selectedPedidoDetail.metodoPago || (selectedPedidoDetail.pagos?.[0]?.metodoPago) || 'YAPE'}
                  </strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#75695D] block">Entrega Pactada:</span>
                  <strong className="text-[#241C15]">{selectedPedidoDetail.diaEntregaPrometida || '—'}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-[#75695D] block">Destino / Envío:</span>
                  <strong className="text-[#241C15]">{selectedPedidoDetail.destinoEnvio || 'Taller'}</strong>
                </div>
              </div>

              {/* Notas del Pedido si existen */}
              {selectedPedidoDetail.notas && (
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E2D9CC] text-xs flex items-start gap-2">
                  <span className="font-bold text-[#633E20] shrink-0">Notas / Instrucciones:</span>
                  <span className="text-[#241C15]">{selectedPedidoDetail.notas}</span>
                </div>
              )}

              {/* Lista Detallada de Productos */}
              <div className="space-y-2.5">
                <span className="text-xs font-extrabold text-[#633E20] uppercase tracking-wider block">
                  Productos Asignados al Pedido ({selectedPedidoDetail.items.length})
                </span>

                <div className="border border-[#E2D9CC] rounded-2xl overflow-x-auto w-full">
                  <Table className="min-w-[500px]">
                    <TableHeader className="bg-[#FAF8F5]">
                      <TableRow className="border-[#E2D9CC]">
                        <TableHead className="text-xs font-extrabold text-[#241C15]">Modelo / Producto</TableHead>
                        <TableHead className="text-xs font-extrabold text-[#241C15] text-center">Cant.</TableHead>
                        <TableHead className="text-xs font-extrabold text-[#241C15] text-right">P. Unit</TableHead>
                        <TableHead className="text-xs font-extrabold text-[#241C15] text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="text-xs">
                      {selectedPedidoDetail.items.map((it) => (
                        <TableRow key={it.id} className="border-[#E2D9CC]">
                          <TableCell className="font-bold text-[#241C15]">
                            {it.nombreProductoSnapshot}
                            {it.personalizacion && (
                              <span className="text-[10px] text-[#75695D] block font-normal italic">
                                Nota: {it.personalizacion}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-bold">{it.cantidad}</TableCell>
                          <TableCell className="text-right font-mono">{formatCurrency(it.precioUnitario)}</TableCell>
                          <TableCell className="text-right font-mono font-extrabold text-[#241C15]">
                            {formatCurrency(it.subtotal)}
                          </TableCell>
                        </TableRow>
                      ))}

                      {selectedPedidoDetail.costoEnvio > 0 && (
                        <TableRow className="border-[#E2D9CC] bg-[#FAF8F5]/40 font-semibold">
                          <TableCell colSpan={4} className="text-right text-[#75695D]">
                            Costo de Envío / Flete:
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(selectedPedidoDetail.costoEnvio)}
                          </TableCell>
                        </TableRow>
                      )}

                      <TableRow className="bg-[#FAF8F5] border-t-2 border-[#E2D9CC] font-black text-sm">
                        <TableCell colSpan={4} className="text-right text-[#241C15]">
                          TOTAL PEDIDO:
                        </TableCell>
                        <TableCell className="text-right font-mono text-[#1E5E3A]">
                          {formatCurrency(selectedPedidoDetail.total)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Historial de Abonos y Pagos */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-extrabold text-[#1E5E3A] uppercase tracking-wider flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5" />
                    Historial de Abonos Recibidos ({selectedPedidoDetail.pagos.length})
                  </span>
                  <span className="text-xs font-mono font-bold text-[#75695D]">
                    Saldo Restante:{' '}
                    <strong className="text-[#8C6D1F]">S/ {selectedPedidoDetail.saldoPendiente.toFixed(2)}</strong>
                  </span>
                </div>

                {selectedPedidoDetail.pagos.length > 0 ? (
                  <div className="space-y-2">
                    {selectedPedidoDetail.pagos.map((pg, idx) => (
                      <div
                        key={pg.id}
                        className="p-3 rounded-xl bg-[#EBF7EE]/40 border border-[#B4E3C0] flex items-center justify-between text-xs gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-[#1E5E3A]">Abono #{idx + 1}</span>
                            <Badge variant="outline" className="text-[9px] bg-white border-[#B4E3C0] text-[#1E5E3A]">
                              {pg.metodoPago} • {pg.tipo}
                            </Badge>
                          </div>
                          <span className="text-[11px] text-[#75695D] block mt-0.5">
                            {formatDate(pg.fecha)} {pg.notas ? `• ${pg.notas}` : ''}
                          </span>
                        </div>
                        <span className="font-mono font-black text-sm text-[#1E5E3A] flex-shrink-0">
                          +{formatCurrency(pg.monto)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#75695D] italic">No se han registrado pagos para este pedido.</p>
                )}

                {/* Formulario para Agregar Nuevo Abono */}
                {selectedPedidoDetail.saldoPendiente > 0 && (
                  <form onSubmit={handleRegistrarAbono} className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-3">
                    <span className="text-xs font-bold text-[#241C15] block">
                      + Registrar Nuevo Abono a este Pedido
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-[#75695D] font-bold">Monto (S/) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          required
                          placeholder={selectedPedidoDetail.saldoPendiente.toFixed(2)}
                          value={abonoMonto}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setAbonoMonto(e.target.value)}
                          className="h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-[#75695D] font-bold">Método de Pago</Label>
                        <select
                          value={abonoMetodo}
                          onChange={(e) => setAbonoMetodo(e.target.value)}
                          className="w-full h-8 rounded-lg border border-[#E2D9CC] bg-[#FFFFFF] px-2 text-xs font-bold"
                        >
                          <option value="YAPE">Yape</option>
                          <option value="PLIN">Plin</option>
                          <option value="BCP">BCP</option>
                          <option value="BBVA">BBVA</option>
                          <option value="EFECTIVO">Efectivo</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-[#75695D] font-bold">Tipo de Abono</Label>
                        <select
                          value={abonoTipo}
                          onChange={(e) => setAbonoTipo(e.target.value)}
                          className="w-full h-8 rounded-lg border border-[#E2D9CC] bg-[#FFFFFF] px-2 text-xs font-bold"
                        >
                          <option value="SALDO_ENTREGA">Liquidación / Saldo Final</option>
                          <option value="ABONO">Abono Parcial</option>
                          <option value="ANTICIPO">Anticipo</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                      <Input
                        placeholder="Nota o número de operación (opcional)..."
                        value={abonoNotas}
                        onChange={(e) => setAbonoNotas(e.target.value)}
                        className="h-8 bg-[#FFFFFF] border-[#E2D9CC] text-xs flex-1 rounded-lg"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmittingAbono}
                        className="h-8 px-4 bg-[#1E5E3A] hover:bg-[#16462B] text-white font-extrabold text-xs rounded-lg cursor-pointer flex-shrink-0"
                      >
                        {isSubmittingAbono ? 'Guardando...' : 'Registrar Abono'}
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#FAF8F5] border-t border-[#E2D9CC] p-4 flex justify-end">
              <Button
                variant="outline"
                onClick={() => setSelectedPedidoDetail(null)}
                className="px-5 h-9 text-xs font-bold border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#EAE4DC] text-[#241C15] rounded-xl cursor-pointer w-full sm:w-auto"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

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
              {/* SECCIÓN 1: ESTADO Y DATOS DEL CLIENTE */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 border-b border-[#E2D9CC] gap-2">
                  <span className="text-xs font-extrabold text-[#A36F4C] uppercase tracking-wider flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" />
                    1. Estado y Datos del Cliente
                  </span>

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
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-[#A36F4C]" />
                      Fecha del Pedido *
                    </Label>
                    <Input
                      type="date"
                      required
                      value={formFecha}
                      onChange={(e) => setFormFecha(e.target.value)}
                      className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Cliente *</Label>
                    <Input
                      required
                      placeholder="Nombre del cliente..."
                      value={formCliente}
                      onChange={(e) => setFormCliente(e.target.value)}
                      className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Teléfono / WhatsApp</Label>
                    <Input
                      placeholder="Ej: 987654321"
                      value={formTelefono}
                      onChange={(e) => setFormTelefono(e.target.value)}
                      className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Canal de Venta</Label>
                    <select
                      value={formCanal}
                      onChange={(e) => setFormCanal(e.target.value)}
                      className="w-full h-9 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] px-3 text-sm text-[#241C15] font-medium"
                    >
                      <option value="WhatsApp">WhatsApp</option>
                      <option value="Instagram">Instagram</option>
                      <option value="TikTok">TikTok</option>
                      <option value="Feria">Feria / Presencial</option>
                      <option value="Recomendación">Recomendación</option>
                      <option value="Directo">Directo / Taller</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Fecha / Hora Pactada de Entrega</Label>
                    <Input
                      placeholder="Ej: Sábado 18:00, Mañana en Shalom..."
                      value={formDiaEntrega}
                      onChange={(e) => setFormDiaEntrega(e.target.value)}
                      className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-[#241C15] font-bold">Destino / Dirección / Agencia</Label>
                    <Input
                      placeholder="Ej: Shalom Agencia Miraflores, Lima..."
                      value={formDestino}
                      onChange={(e) => setFormDestino(e.target.value)}
                      className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-[#241C15] font-bold">Notas del Pedido</Label>
                  <Input
                    placeholder="Notas internas, indicaciones de acabado, etc..."
                    value={formNotas}
                    onChange={(e) => setFormNotas(e.target.value)}
                    className="bg-[#FAF8F5] border-[#E2D9CC] text-sm rounded-xl"
                  />
                </div>
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

                        {/* Fila 1: Selector de Producto y Color */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[11px] text-[#241C15] font-bold">Modelo 3D *</Label>
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

                          <div className="space-y-1">
                            <MultiColorPicker
                              selectedColorIds={item.coloresIds || []}
                              onChange={(cols) => updateItem(item.id, { 
                                coloresIds: cols, 
                                colorFilamentoId: cols[0] || '' 
                              })}
                              filamentos={filamentos}
                              label="Color(es) de Filamento"
                              placeholder="Sin asignar (Multicolor / Varios colores)"
                            />
                          </div>
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
                              placeholder="Personalización / Texto grabado / Notas del modelo..."
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
