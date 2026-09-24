'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Layers, 
  Sparkles,
  ShoppingBag,
  Box,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Wallet,
  Target,
  LifeBuoy,
  CreditCard,
  Cpu,
  ArrowRight,
  RotateCcw,
  Package,
  Palette,
  Check,
  Percent,
  Calculator,
  Flame,
  Zap,
  HelpCircle,
  Clock,
  Coins,
  Plus,
  Trash2,
  Pencil,
  SlidersHorizontal,
  X,
  PieChart as PieIcon,
  Receipt,
  Tag,
  Building2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  CheckCheck,
  CircleDashed,
  Sliders
} from 'lucide-react'
import { toast } from 'sonner'
import { DatosPresupuestoTranquilidad } from '@/actions/presupuesto'

interface PresupuestoClientProps {
  datos: DatosPresupuestoTranquilidad
}

export type CategoriaGastoPlan = 'INSUMOS' | 'BLINDADO' | 'OPERATIVO' | 'CAPEX' | 'MARKETING' | 'OTROS'

export interface ItemGastoPlan {
  id: string
  categoria: CategoriaGastoPlan
  concepto: string
  subconcepto?: string
  montoAgostoReal: number // Histórico cerrado real de Agosto (Solo lectura)
  montoSeptiembreReal: number // Gastado en Septiembre a la fecha
  monto: number // Presupuesto Proyectado del Mes (Editable)
  esBlindado: boolean
  pagado: boolean
}

const CATEGORIA_CONFIG: Record<CategoriaGastoPlan, { label: string; badgeColor: string; iconColor: string }> = {
  INSUMOS: {
    label: 'Insumos & Material',
    badgeColor: 'bg-[#EFE5D8] text-[#633E20] border-[#D4BEA7]',
    iconColor: '#A36F4C'
  },
  BLINDADO: {
    label: 'Deuda / Préstamo',
    badgeColor: 'bg-[#FDF2F0] text-[#944917] border-[#F2C0B8]',
    iconColor: '#944917'
  },
  OPERATIVO: {
    label: 'Fijo / Taller',
    badgeColor: 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]',
    iconColor: '#8C6D1F'
  },
  CAPEX: {
    label: 'Reserva Máquinas',
    badgeColor: 'bg-[#FAF8F5] text-[#633E20] border-[#D4BEA7]',
    iconColor: '#633E20'
  },
  MARKETING: {
    label: 'Pauta & Publicidad',
    badgeColor: 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]',
    iconColor: '#1E5E3A'
  },
  OTROS: {
    label: 'Otros Gastos',
    badgeColor: 'bg-[#F4EFEA] text-[#75695D] border-[#E2D9CC]',
    iconColor: '#75695D'
  }
}

export function PresupuestoClient({ datos }: PresupuestoClientProps) {
  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // =========================================================================
  // 1. ESTADO DEL PLAN DE GASTOS DEL MES (CON HISTÓRICO REAL DE AGOSTO)
  // =========================================================================
  const getItemsIniciales = (): ItemGastoPlan[] => [
    {
      id: 'gasto-filamentos',
      categoria: 'INSUMOS',
      concepto: 'Reposición de Filamentos',
      subconcepto: '6 bobinas x S/ 48.00 (PLA Matte Bambu Lab)',
      montoAgostoReal: 1542.77, // Real cerrado en Agosto
      montoSeptiembreReal: 142.00, // Real gastado en Septiembre a la fecha
      monto: 288.00,
      esBlindado: false,
      pagado: false,
    },
    {
      id: 'gasto-packaging',
      categoria: 'INSUMOS',
      concepto: 'Packaging & Cajas de Envío',
      subconcepto: '8 pedidos estimados x S/ 8.50 (Cajas, stickers, film)',
      montoAgostoReal: 168.75, // Real cerrado en Agosto
      montoSeptiembreReal: 0.00,
      monto: 68.00,
      esBlindado: false,
      pagado: false,
    },
    {
      id: 'gasto-cuota-prestamo',
      categoria: 'BLINDADO',
      concepto: 'Cuota Mensual de Préstamo',
      subconcepto: 'Amortización de capital financiero (BCP S/ 8,000)',
      montoAgostoReal: 0.00, // Desembolsado a fin de Agosto
      montoSeptiembreReal: 0.00,
      monto: 368.88,
      esBlindado: true,
      pagado: false,
    },
    {
      id: 'gasto-reserva-capex',
      categoria: 'CAPEX',
      concepto: 'Reserva para Nueva Impresora',
      subconcepto: 'Ahorro mensual para Bambu A2L (S/ 744 de S/ 2,500 pagados)',
      montoAgostoReal: 4403.00, // 1ra A1 + Secador + 2da A1 + Separa A2L
      montoSeptiembreReal: 0.00,
      monto: 878.00,
      esBlindado: true,
      pagado: false,
    },
    {
      id: 'gasto-fijos-taller',
      categoria: 'OPERATIVO',
      concepto: 'Luz e Internet del Taller',
      subconcepto: 'Electricidad de 2x impresoras 3D y servicios fijos',
      montoAgostoReal: 0.00,
      montoSeptiembreReal: 0.00,
      monto: 111.00,
      esBlindado: true,
      pagado: false,
    },
    {
      id: 'gasto-publicidad',
      categoria: 'MARKETING',
      concepto: 'Pauta & Publicidad en Redes',
      subconcepto: 'Presupuesto mensual para anuncios (Meta Ads / TikTok)',
      montoAgostoReal: 308.92, // Real cerrado en Agosto
      montoSeptiembreReal: 0.00,
      monto: 100.00,
      esBlindado: false,
      pagado: false,
    },
    {
      id: 'gasto-imprevistos',
      categoria: 'OPERATIVO',
      concepto: 'Fondo de Imprevistos & Repuestos',
      subconcepto: 'Boquillas, mantenimiento menor, herramientas',
      montoAgostoReal: 86.55, // Real cerrado en Agosto
      montoSeptiembreReal: 0.00,
      monto: 150.00,
      esBlindado: false,
      pagado: false,
    },
  ]

  const [itemsPlan, setItemsPlan] = useState<ItemGastoPlan[]>(getItemsIniciales)
  const [filtroTab, setFiltroTab] = useState<'TODOS' | 'BLINDADOS' | 'FLEXIBLES' | 'PENDIENTES' | 'PAGADOS'>('TODOS')

  // Estado para Modal de Crear / Editar Gasto
  const [modalOpen, setModalOpen] = useState<boolean>(false)
  const [editingItem, setEditingItem] = useState<ItemGastoPlan | null>(null)
  
  // Formulario de Gasto
  const [formConcepto, setFormConcepto] = useState<string>('')
  const [formSubconcepto, setFormSubconcepto] = useState<string>('')
  const [formCategoria, setFormCategoria] = useState<CategoriaGastoPlan>('OPERATIVO')
  const [formMonto, setFormMonto] = useState<string>('50')
  const [formEsBlindado, setFormEsBlindado] = useState<boolean>(false)

  // =========================================================================
  // 2. OPERACIONES CRUD DEL PLAN DE GASTOS
  // =========================================================================
  const handleOpenCrear = () => {
    setEditingItem(null)
    setFormConcepto('')
    setFormSubconcepto('')
    setFormCategoria('OPERATIVO')
    setFormMonto('50')
    setFormEsBlindado(false)
    setModalOpen(true)
  }

  const handleOpenEditar = (item: ItemGastoPlan) => {
    setEditingItem(item)
    setFormConcepto(item.concepto)
    setFormSubconcepto(item.subconcepto || '')
    setFormCategoria(item.categoria)
    setFormMonto(String(item.monto))
    setFormEsBlindado(item.esBlindado)
    setModalOpen(true)
  }

  const handleGuardarItem = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formConcepto.trim()) {
      toast.error('Ingresa un nombre o concepto para el gasto')
      return
    }

    const valMonto = parseFloat(formMonto) || 0

    if (editingItem) {
      // Update
      setItemsPlan(prev => prev.map(item => {
        if (item.id === editingItem.id) {
          return {
            ...item,
            concepto: formConcepto.trim(),
            subconcepto: formSubconcepto.trim() || undefined,
            categoria: formCategoria,
            monto: Math.max(0, valMonto),
            esBlindado: formEsBlindado
          }
        }
        return item
      }))
      toast.success('Gasto actualizado en el plan')
    } else {
      // Create
      const nuevoItem: ItemGastoPlan = {
        id: `gasto-custom-${Date.now()}`,
        concepto: formConcepto.trim(),
        subconcepto: formSubconcepto.trim() || undefined,
        categoria: formCategoria,
        montoAgostoReal: 0.00,
        montoSeptiembreReal: 0.00,
        monto: Math.max(0, valMonto),
        esBlindado: formEsBlindado,
        pagado: false
      }
      setItemsPlan(prev => [...prev, nuevoItem])
      toast.success('Nuevo gasto agregado al plan')
    }

    setModalOpen(false)
  }

  const handleEliminarItem = (id: string, nombre: string) => {
    setItemsPlan(prev => prev.filter(item => item.id !== id))
    toast.info(`Gasto "${nombre}" eliminado del plan`)
  }

  const handleTogglePagado = (id: string) => {
    setItemsPlan(prev => prev.map(item => {
      if (item.id === id) {
        const nuevoEstado = !item.pagado
        if (nuevoEstado) {
          toast.success(`Gasto "${item.concepto}" marcado como pagado`)
        }
        return { ...item, pagado: nuevoEstado }
      }
      return item
    }))
  }

  const handleToggleBlindado = (id: string) => {
    setItemsPlan(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, esBlindado: !item.esBlindado }
      }
      return item
    }))
  }

  // Modificación in-line fluida del presupuesto
  const handleUpdateMontoInline = (id: string, rawVal: string) => {
    const num = parseFloat(rawVal)
    setItemsPlan(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, monto: isNaN(num) ? 0 : Math.max(0, num) }
      }
      return item
    }))
  }

  const handleResetearPlan = () => {
    setItemsPlan(getItemsIniciales())
    toast.success('Plan de gastos restaurado a valores del taller')
  }

  // =========================================================================
  // 3. CÁLCULOS FINANCIEROS CLAVE (CAPACIDAD DE GASTO REAL)
  // =========================================================================
  const totalPlanificado = useMemo(() => {
    return itemsPlan.reduce((sum, item) => sum + item.monto, 0)
  }, [itemsPlan])

  const totalBlindados = useMemo(() => {
    return itemsPlan.filter(i => i.esBlindado).reduce((sum, item) => sum + item.monto, 0)
  }, [itemsPlan])

  const totalFlexibles = useMemo(() => {
    return itemsPlan.filter(i => !i.esBlindado).reduce((sum, item) => sum + item.monto, 0)
  }, [itemsPlan])

  const totalGastadoAgosto = useMemo(() => {
    return itemsPlan.reduce((sum, item) => sum + item.montoAgostoReal, 0)
  }, [itemsPlan])

  const totalGastadoSeptiembre = useMemo(() => {
    return itemsPlan.reduce((sum, item) => sum + item.montoSeptiembreReal, 0)
  }, [itemsPlan])

  const saldoPresupuestalRestante = Math.max(0, totalPlanificado - totalGastadoSeptiembre)
  const porcentajeEjecucionGeneral = totalPlanificado > 0 
    ? Math.min(100, (totalGastadoSeptiembre / totalPlanificado) * 100) 
    : 0

  // Gasto Libre Disponible Hoy = Saldo en Caja - Fondos Blindados (Intocables)
  const gastoLibreDisponibleHoy = Math.max(0, datos.saldoActualCaja - totalBlindados)

  // Ratio de Blindaje = Porcentaje del presupuesto que es deuda/reserva
  const ratioBlindaje = totalPlanificado > 0 ? ((totalBlindados / totalPlanificado) * 100).toFixed(1) : '0.0'

  // Filtrado de items
  const itemsFiltrados = useMemo(() => {
    if (filtroTab === 'BLINDADOS') return itemsPlan.filter(i => i.esBlindado)
    if (filtroTab === 'FLEXIBLES') return itemsPlan.filter(i => !i.esBlindado)
    if (filtroTab === 'PENDIENTES') return itemsPlan.filter(i => !i.pagado)
    if (filtroTab === 'PAGADOS') return itemsPlan.filter(i => i.pagado)
    return itemsPlan
  }, [itemsPlan, filtroTab])

  return (
    <div className="max-w-6xl mx-auto space-y-5 sm:space-y-6 animate-in fade-in duration-300 px-1 sm:px-0 bg-[#F8F6F2] min-h-screen py-2">
      
      {/* ========================================================================= */}
      {/* 1. HERO BANNER: CAPACIDAD REAL DE GASTO & CONTROL DE CAJA                 */}
      {/* ========================================================================= */}
      <div className="space-y-4 sm:space-y-5">
        
        {/* Cabecera Principal */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EFE5D8] text-[#633E20] border border-[#D4BEA7]">
                Planificación Operativa NOVA
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]">
                Presupuesto Septiembre 2026
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#241C15] tracking-tight flex items-center gap-2.5">
              <Calculator className="h-7 w-7 text-[#A36F4C] flex-shrink-0" />
              <span>Plan de Gastos del Mes</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#75695D] mt-1 max-w-2xl">
              Compara lo gastado en Agosto por cada categoría, controla la ejecución de Septiembre y planifica tus fondos blindados.
            </p>
          </div>

          {/* Botón de Acción Principal */}
          <div className="flex items-center gap-2">
            <Button
              onClick={handleOpenCrear}
              className="bg-[#A36F4C] text-white rounded-2xl px-5 py-2.5 hover:bg-[#8E5E3E] text-xs font-bold shadow-xs cursor-pointer h-auto transition-all"
            >
              <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
              Nuevo Gasto al Plan
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* LAS 3 TARJETAS MAESTRAS DE CAPACIDAD DE GASTO                             */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC]">
          
          {/* 1. Lo que tengo en Caja */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2D9CC] space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-[#75695D]">
              <span className="font-bold text-[10px] uppercase tracking-wider">1. Saldo Real en Caja</span>
              <Wallet className="h-4 w-4 text-[#1E5E3A]" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#241C15]">
              {formatCurrency(datos.saldoActualCaja)}
            </div>
            <span className="text-[11px] text-[#75695D] block">
              +{formatCurrency(datos.cuentasPorCobrar)} por cobrar de clientes
            </span>
          </div>

          {/* 2. Lo Blindado (Intocable) */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2D9CC] space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-[#75695D]">
              <span className="font-bold text-[10px] uppercase tracking-wider">2. Fondos Blindados</span>
              <Lock className="h-4 w-4 text-[#A36F4C]" />
            </div>
            <div className="text-xl sm:text-2xl font-black font-mono text-[#A36F4C]">
              {formatCurrency(totalBlindados)}
            </div>
            <span className="text-[11px] text-[#75695D] block">
              Cuota BCP ({formatCurrency(368.88)}) + Reserva A2L ({formatCurrency(878)}) + Luz
            </span>
          </div>

          {/* 3. Gasto Libre Disponible Hoy */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#FFFFFF] border border-[#E2D9CC] space-y-1.5 shadow-2xs">
            <div className="flex items-center justify-between text-[#75695D]">
              <span className="font-bold text-[10px] uppercase tracking-wider">3. Gasto Libre Hoy</span>
              <Coins className="h-4 w-4 text-[#1E5E3A]" />
            </div>
            <div className={`text-xl sm:text-2xl font-black font-mono ${
              gastoLibreDisponibleHoy > 0 ? 'text-[#1E5E3A]' : 'text-[#8C6D1F]'
            }`}>
              {formatCurrency(gastoLibreDisponibleHoy)}
            </div>
            <span className="text-[11px] text-[#1E5E3A] font-semibold block">
              🟢 Dinero disponible para compras sin tocar cuotas
            </span>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* BARRA DE ESTADO Y PROGRESO DEL PRESUPUESTO DEL MES                        */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#D4BEA7] space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[#633E20]" />
              <span className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                Ejecución Presupuestaria de Septiembre
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="text-[#75695D]">
                Gastado a la Fecha: <strong className="text-[#1E5E3A]">{formatCurrency(totalGastadoSeptiembre)}</strong>
              </span>
              <span className="text-[#D4BEA7]">|</span>
              <span className="text-[#75695D]">
                Presupuesto Mes: <strong className="text-[#241C15]">{formatCurrency(totalPlanificado)}</strong>
              </span>
              <span className="text-[#D4BEA7]">|</span>
              <span className="text-[#75695D]">
                Saldo Restante: <strong className="text-[#A36F4C]">{formatCurrency(saldoPresupuestalRestante)}</strong>
              </span>
            </div>
          </div>

          {/* Barra visual de progreso */}
          <div className="w-full bg-[#E2D9CC]/60 h-2.5 rounded-full overflow-hidden flex">
            <div 
              className="bg-gradient-to-r from-[#1E5E3A] to-[#A36F4C] h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.max(5, porcentajeEjecucionGeneral)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABLA PRINCIPAL: PLAN DE GASTOS (AGOSTO REAL NO EDITABLE + PRESUPUESTO)*/}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl p-5 sm:p-7 shadow-xs space-y-5">
        
        {/* Barra de Filtros y Control */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E2D9CC]">
          
          {/* Segmented Control Inteligente */}
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-2xl border border-[#E2D9CC] overflow-x-auto">
            <button
              type="button"
              onClick={() => setFiltroTab('TODOS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroTab === 'TODOS'
                  ? 'bg-[#241C15] text-white shadow-2xs'
                  : 'text-[#75695D] hover:bg-white hover:text-[#241C15]'
              }`}
            >
              Todos ({itemsPlan.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTab('BLINDADOS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filtroTab === 'BLINDADOS'
                  ? 'bg-[#A36F4C] text-white shadow-2xs'
                  : 'text-[#75695D] hover:bg-white hover:text-[#241C15]'
              }`}
            >
              <Lock className="h-3 w-3" />
              Blindados ({itemsPlan.filter(i => i.esBlindado).length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTab('FLEXIBLES')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                filtroTab === 'FLEXIBLES'
                  ? 'bg-[#1E5E3A] text-white shadow-2xs'
                  : 'text-[#75695D] hover:bg-white hover:text-[#241C15]'
              }`}
            >
              <Unlock className="h-3 w-3" />
              Flexibles ({itemsPlan.filter(i => !i.esBlindado).length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTab('PENDIENTES')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroTab === 'PENDIENTES'
                  ? 'bg-[#8C6D1F] text-white shadow-2xs'
                  : 'text-[#75695D] hover:bg-white hover:text-[#241C15]'
              }`}
            >
              Pendientes ({itemsPlan.filter(i => !i.pagado).length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroTab('PAGADOS')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroTab === 'PAGADOS'
                  ? 'bg-[#1E5E3A] text-white shadow-2xs'
                  : 'text-[#75695D] hover:bg-white hover:text-[#241C15]'
              }`}
            >
              Pagados ({itemsPlan.filter(i => i.pagado).length})
            </button>
          </div>

          {/* Botón Restablecer Plan Base */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetearPlan}
            className="text-xs font-medium text-[#75695D] hover:text-[#241C15] hover:bg-[#FAF8F5] rounded-xl cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Restablecer Plan Base
          </Button>
        </div>

        {/* VISTA MÓVIL Y TABLET (< md): Tarjetas de Partidas Táctiles */}
        <div className="block md:hidden space-y-3">
          {itemsFiltrados.length === 0 ? (
            <div className="p-8 text-center bg-[#FFFFFF] rounded-2xl border border-dashed border-[#E2D9CC] text-xs text-[#75695D]">
              No hay gastos que coincidan con el filtro seleccionado.
            </div>
          ) : (
            itemsFiltrados.map((item) => {
              const config = CATEGORIA_CONFIG[item.categoria] || CATEGORIA_CONFIG.OTROS
              const porcentajePartida = item.monto > 0 
                ? Math.min(100, Math.round((item.montoSeptiembreReal / item.monto) * 100))
                : 0

              return (
                <div 
                  key={item.id}
                  className={`bg-[#FFFFFF] border rounded-2xl p-4 shadow-2xs space-y-3 transition-colors ${
                    item.pagado ? 'bg-[#FAF8F5]/90 border-[#E2D9CC] opacity-80' : 'border-[#E2D9CC]'
                  }`}
                >
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleTogglePagado(item.id)}
                        className={`h-5 w-5 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-all ${
                          item.pagado
                            ? 'bg-[#1E5E3A] border-[#1E5E3A] text-white shadow-2xs'
                            : 'bg-[#FFFFFF] border-[#D4BEA7] text-transparent hover:border-[#1E5E3A]'
                        }`}
                        title={item.pagado ? 'Gasto marcado como pagado' : 'Marcar como pagado'}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${config.badgeColor}`}>
                            {config.label}
                          </span>
                          <span className={`font-bold text-xs ${item.pagado ? 'line-through text-[#75695D]' : 'text-[#241C15]'}`}>
                            {item.concepto}
                          </span>
                          {item.pagado && (
                            <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#EBF7EE] text-[#1E5E3A] border border-[#B4E3C0]">
                              Pagado
                            </span>
                          )}
                        </div>
                        {item.subconcepto && (
                          <span className="text-[11px] text-[#75695D] block truncate mt-0.5">
                            {item.subconcepto}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleBlindado(item.id)}
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shrink-0 ${
                        item.esBlindado
                          ? 'bg-[#F4EFEA] text-[#A36F4C] border border-[#D4BEA7]'
                          : 'bg-[#E8F5E9] text-[#1E5E3A] border border-[#B4E3C0]'
                      }`}
                    >
                      {item.esBlindado ? <Lock className="h-2.5 w-2.5" /> : <Unlock className="h-2.5 w-2.5" />}
                      <span>{item.esBlindado ? 'Blindado' : 'Flexible'}</span>
                    </button>
                  </div>

                  {/* Grid de Montos */}
                  <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-xs bg-[#FAF8F5] p-2.5 rounded-xl border border-[#E2D9CC]/70">
                    <div>
                      <span className="text-[9px] text-[#75695D] block font-sans">Agosto (Real)</span>
                      <span className="font-bold text-[#241C15] text-[11px]">
                        {item.montoAgostoReal > 0 ? formatCurrency(item.montoAgostoReal) : '—'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] text-[#1E5E3A] block font-sans">Hoy (Sept)</span>
                      <span className="font-bold text-[#1E5E3A] text-[11px]">
                        {formatCurrency(item.montoSeptiembreReal)}
                      </span>
                      {item.monto > 0 && item.montoSeptiembreReal > 0 && (
                        <span className="text-[9px] font-sans text-[#75695D] block">
                          {porcentajePartida}%
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[9px] text-[#A36F4C] block font-sans font-bold">Presupuesto</span>
                      <span className="font-black text-[#A36F4C] text-[11px]">
                        {formatCurrency(item.monto)}
                      </span>
                    </div>
                  </div>

                  {/* Acciones de la tarjeta */}
                  <div className="pt-2 border-t border-[#E2D9CC]/70 flex items-center justify-between gap-2">
                    <div className="relative inline-flex items-center flex-1 max-w-[160px]">
                      <span className="absolute left-2.5 text-[11px] font-mono font-bold text-[#A36F4C]">S/</span>
                      <input
                        type="number"
                        step="any"
                        value={item.monto === 0 ? '' : item.monto}
                        placeholder="0.00"
                        onChange={(e) => handleUpdateMontoInline(item.id, e.target.value)}
                        className="w-full bg-[#FAF8F5] border border-[#D4BEA7] rounded-xl pl-6 pr-2 py-1 text-xs font-mono font-bold text-right text-[#633E20] focus:bg-[#FFFFFF] focus:border-[#A36F4C]"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenEditar(item)}
                        className="h-7 px-2.5 rounded-xl border-[#E2D9CC] text-xs text-[#75695D] hover:text-[#241C15]"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEliminarItem(item.id, item.concepto)}
                        className="h-7 w-7 p-0 rounded-xl text-[#75695D] hover:text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* TABLA PRINCIPAL DE PARTIDAS (VISTA DESKTOP >= md) */}
        <div className="hidden md:block rounded-2xl border border-[#E2D9CC] overflow-hidden shadow-xs bg-[#FFFFFF]">
          <table className="w-full text-xs text-left border-collapse table-fixed">
            <colgroup>
              <col className="w-[32%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-[#FAF8F5] border-b border-[#E2D9CC] text-[#75695D]">
              <tr>
                <th className="py-3 px-4 font-bold text-[#241C15]">Concepto / Categoría</th>
                <th className="py-3 px-2 font-bold text-center text-[#241C15]">Tipo</th>
                <th className="py-3 px-3 font-bold text-right text-[#241C15]">
                  Gastado Agosto <span className="text-[10px] font-normal text-[#75695D] block">(Real)</span>
                </th>
                <th className="py-3 px-3 font-bold text-right text-[#1E5E3A]">
                  Gastado Sept. <span className="text-[10px] font-normal text-[#1E5E3A] block">(Hoy)</span>
                </th>
                <th className="py-3 px-3 font-bold text-right text-[#A36F4C]">
                  Presupuesto <span className="text-[10px] font-normal text-[#A36F4C] block">(Editable)</span>
                </th>
                <th className="py-3 px-3 font-bold text-center text-[#241C15]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D9CC]">
              {itemsFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-xs text-[#75695D]">
                    No hay gastos que coincidan con el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                itemsFiltrados.map((item) => {
                  const config = CATEGORIA_CONFIG[item.categoria] || CATEGORIA_CONFIG.OTROS
                  const porcentajePartida = item.monto > 0 
                    ? Math.min(100, Math.round((item.montoSeptiembreReal / item.monto) * 100))
                    : 0

                  return (
                    <tr 
                      key={item.id} 
                      className={`transition-colors ${
                        item.pagado ? 'bg-[#FAF8F5]/80 opacity-75' : 'hover:bg-[#FAF8F5]/60'
                      }`}
                    >
                      {/* Concepto & Detalle */}
                      <td className="py-3 px-4 min-w-0">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => handleTogglePagado(item.id)}
                            className={`h-4.5 w-4.5 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 cursor-pointer transition-all ${
                              item.pagado
                                ? 'bg-[#1E5E3A] border-[#1E5E3A] text-white shadow-2xs'
                                : 'bg-[#FFFFFF] border-[#D4BEA7] text-transparent hover:border-[#1E5E3A]'
                            }`}
                            title={item.pagado ? 'Gasto marcado como pagado' : 'Marcar como pagado'}
                          >
                            <Check className="h-3 w-3 stroke-[3]" />
                          </button>

                          <div className="space-y-0.5 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${config.badgeColor}`}>
                                {config.label}
                              </span>
                              <span className={`font-bold text-xs truncate ${item.pagado ? 'line-through text-[#75695D]' : 'text-[#241C15]'}`}>
                                {item.concepto}
                              </span>
                              {item.pagado && (
                                <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-[#EBF7EE] text-[#1E5E3A] border border-[#B4E3C0]">
                                  Pagado
                                </span>
                              )}
                            </div>
                            {item.subconcepto && (
                              <span className="text-[11px] text-[#75695D] block truncate" title={item.subconcepto}>
                                {item.subconcepto}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Tipo: Blindado vs Flexible */}
                      <td className="py-3 px-2 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleBlindado(item.id)}
                          className={`px-2 py-1 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all cursor-pointer ${
                            item.esBlindado
                              ? 'bg-[#F4EFEA] text-[#A36F4C] border border-[#D4BEA7] shadow-2xs'
                              : 'bg-[#E8F5E9] text-[#1E5E3A] border border-[#B4E3C0]'
                          }`}
                          title={item.esBlindado ? 'Gasto Blindado (Intocable)' : 'Gasto Flexible'}
                        >
                          {item.esBlindado ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          <span>{item.esBlindado ? 'Blindado' : 'Flexible'}</span>
                        </button>
                      </td>

                      {/* Columna: Gastado en Agosto (Real Cerrado - NO EDITABLE) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-mono">
                        {item.montoAgostoReal > 0 ? (
                          <span className="font-bold text-xs text-[#241C15] tabular-nums">
                            {formatCurrency(item.montoAgostoReal)}
                          </span>
                        ) : (
                          <span className="text-[#75695D] font-normal text-xs">-</span>
                        )}
                      </td>

                      {/* Columna: Gastado en Septiembre (Hoy - NO EDITABLE / Real Ejecutado) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end font-mono">
                          <span className="font-bold text-xs text-[#1E5E3A] tabular-nums">
                            {formatCurrency(item.montoSeptiembreReal)}
                          </span>
                          {item.monto > 0 && item.montoSeptiembreReal > 0 && (
                            <span className="text-[10px] font-sans text-[#75695D]">
                              ({porcentajePartida}%)
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Columna: Presupuesto Septiembre (Editable Inline) */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="relative inline-flex items-center justify-end">
                          <span className="absolute left-2 text-xs font-mono font-bold text-[#A36F4C]">S/</span>
                          <input
                            type="number"
                            step="any"
                            value={item.monto === 0 ? '' : item.monto}
                            placeholder="0.00"
                            onChange={(e) => handleUpdateMontoInline(item.id, e.target.value)}
                            className="w-24 bg-[#FAF8F5] border border-[#D4BEA7] rounded-xl pl-6 pr-2 py-1 text-xs font-mono font-black text-right text-[#633E20] focus:bg-[#FFFFFF] focus:border-[#A36F4C] focus:ring-1 focus:ring-[#A36F4C] transition-all"
                          />
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditar(item)}
                            className="p-1.5 text-[#75695D] hover:text-[#241C15] hover:bg-[#FAF8F5] rounded-lg cursor-pointer transition-colors"
                            title="Editar gasto"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleEliminarItem(item.id, item.concepto)}
                            className="p-1.5 text-[#75695D] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Eliminar gasto"
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
            {/* Fila de Totales de la Tabla */}
            <tfoot className="bg-[#FAF8F5] border-t-2 border-[#E2D9CC] font-bold text-xs">
              <tr>
                <td className="py-3 px-4 text-[#241C15] font-black uppercase">
                  Total Consolidado
                </td>
                <td className="py-3 px-2 text-center text-[10px] text-[#75695D]">
                  {itemsPlan.length} partidas
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-[#241C15] tabular-nums">
                  {formatCurrency(totalGastadoAgosto)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-[#1E5E3A] tabular-nums">
                  {formatCurrency(totalGastadoSeptiembre)}
                </td>
                <td className="py-3 px-3 text-right font-mono font-black text-[#A36F4C] tabular-nums">
                  {formatCurrency(totalPlanificado)}
                </td>
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* ========================================================================= */}
        {/* RESUMEN DE TOTALES AL PIE DE LA TABLA                                     */}
        {/* ========================================================================= */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-bold text-[#241C15]">
              Total Partidas: <strong className="font-mono">{itemsPlan.length}</strong>
            </span>
            <span className="text-[#D4BEA7]">|</span>
            <span className="text-[#75695D]">
              🔒 Total Blindado: <strong className="font-mono text-[#A36F4C]">{formatCurrency(totalBlindados)}</strong>
            </span>
            <span className="text-[#D4BEA7]">|</span>
            <span className="text-[#75695D]">
              🔓 Total Flexible: <strong className="font-mono text-[#1E5E3A]">{formatCurrency(totalFlexibles)}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="font-bold text-[#75695D] uppercase text-[10px]">Presupuesto Planificado:</span>
            <span className="text-base font-black font-mono text-[#241C15]">
              {formatCurrency(totalPlanificado)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SALUD DEL PRESUPUESTO & DIAGNÓSTICO FINANCIERO AL PIE                  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        
        {/* Tarjeta 1: Blindaje Financiero */}
        <div className="p-4.5 rounded-3xl bg-[#FFFFFF] border border-[#E2D9CC] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[#75695D]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ratio de Blindaje</span>
            <ShieldCheck className="h-4 w-4 text-[#A36F4C]" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#241C15]">
            {ratioBlindaje}%
          </div>
          <p className="text-xs text-[#75695D]">
            {formatCurrency(totalBlindados)} asegurados para cuota BCP y reserva de máquina A2L.
          </p>
        </div>

        {/* Tarjeta 2: Capacidad de Producción */}
        <div className="p-4.5 rounded-3xl bg-[#FFFFFF] border border-[#E2D9CC] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[#75695D]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Presupuesto Insumos</span>
            <Package className="h-4 w-4 text-[#1E5E3A]" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#1E5E3A]">
            {formatCurrency(totalFlexibles)}
          </div>
          <p className="text-xs text-[#75695D]">
            Cubre 6 bobinas de filamento PLA Matte y packaging para ~8 pedidos.
          </p>
        </div>

        {/* Tarjeta 3: Runway de Cobertura */}
        <div className="p-4.5 rounded-3xl bg-[#FFFFFF] border border-[#E2D9CC] space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between text-[#75695D]">
            <span className="text-[11px] font-bold uppercase tracking-wider">Runway de Taller</span>
            <Clock className="h-4 w-4 text-[#633E20]" />
          </div>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#633E20]">
            {(datos.saldoActualCaja / Math.max(1, totalBlindados)).toFixed(1)} meses
          </div>
          <p className="text-xs text-[#75695D]">
            Meses de compromisos fijos y blindados cubiertos con tu caja actual.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL PARA AGREGAR / EDITAR GASTO DEL PLAN                                */}
      {/* ========================================================================= */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[460px] bg-[#FFFFFF] border-[#E2D9CC] rounded-3xl p-6 shadow-xl">
          <DialogTitle className="text-base font-black text-[#241C15] flex items-center gap-2">
            <Calculator className="h-5 w-5 text-[#A36F4C]" />
            <span>{editingItem ? 'Editar Partida de Gasto' : 'Agregar Nuevo Gasto al Plan'}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-[#75695D]">
            Ajusta el concepto, presupuesto proyectado y nivel de blindaje para el mes.
          </DialogDescription>

          <form onSubmit={handleGuardarItem} className="space-y-4 mt-3">
            {/* Concepto */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#241C15]">Concepto del Gasto</Label>
              <Input
                value={formConcepto}
                onChange={(e) => setFormConcepto(e.target.value)}
                placeholder="Ej: Reposición de Filamentos, Mantenimiento..."
                className="bg-[#FAF8F5] border-[#E2D9CC] text-xs rounded-xl h-10 text-[#241C15]"
                required
              />
            </div>

            {/* Subconcepto / Detalle */}
            <div className="space-y-1">
              <Label className="text-xs font-bold text-[#241C15]">Detalle o Fórmula de Cálculo</Label>
              <Input
                value={formSubconcepto}
                onChange={(e) => setFormSubconcepto(e.target.value)}
                placeholder="Ej: 6 bobinas x S/ 48.00"
                className="bg-[#FAF8F5] border-[#E2D9CC] text-xs rounded-xl h-10 text-[#241C15]"
              />
            </div>

            {/* Categoría y Blindaje */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15]">Categoría</Label>
                <select
                  value={formCategoria}
                  onChange={(e) => setFormCategoria(e.target.value as CategoriaGastoPlan)}
                  className="w-full bg-[#FAF8F5] border border-[#E2D9CC] rounded-xl h-10 px-3 text-xs text-[#241C15] font-medium cursor-pointer"
                >
                  <option value="INSUMOS">Insumos & Material</option>
                  <option value="BLINDADO">Deuda / Préstamo</option>
                  <option value="OPERATIVO">Fijo / Taller</option>
                  <option value="CAPEX">Reserva Máquinas (CAPEX)</option>
                  <option value="MARKETING">Pauta & Publicidad</option>
                  <option value="OTROS">Otros Gastos</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15]">Nivel de Blindaje</Label>
                <button
                  type="button"
                  onClick={() => setFormEsBlindado(!formEsBlindado)}
                  className={`w-full h-10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer border ${
                    formEsBlindado
                      ? 'bg-[#F4EFEA] text-[#A36F4C] border-[#D4BEA7] shadow-xs'
                      : 'bg-[#E8F5E9] text-[#1E5E3A] border-[#B4E3C0]'
                  }`}
                >
                  {formEsBlindado ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  <span>{formEsBlindado ? 'Blindado (Intocable)' : 'Flexible'}</span>
                </button>
              </div>
            </div>

            {/* Monto Presupuestado */}
            <div className="space-y-1 pt-1">
              <Label className="text-xs font-bold text-[#A36F4C]">Presupuesto Proyectado Septiembre (S/)</Label>
              <Input
                type="number"
                step="any"
                value={formMonto}
                onChange={(e) => setFormMonto(e.target.value)}
                className="bg-[#FAF8F5] border-[#D4BEA7] text-xs font-mono font-bold rounded-xl h-10 text-[#633E20]"
                required
              />
            </div>

            {/* Botones de acción */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2D9CC]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                className="h-9 px-4 rounded-xl border-[#E2D9CC] text-xs cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="h-9 px-5 bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs"
              >
                {editingItem ? 'Guardar Cambios' : 'Agregar al Plan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
