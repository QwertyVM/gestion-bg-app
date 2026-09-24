'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  X, 
  Copy, 
  Check, 
  RefreshCw, 
  Palette, 
  ShoppingCart, 
  AlertTriangle,
  Trash2,
  Package,
  Pencil,
  ChevronDown,
  Share2,
  Sparkles,
  Weight,
  Layers3,
  MoreVertical,
  Info,
  CheckCircle2,
  ArrowRight,
  SlidersHorizontal,
  Flame,
  Archive,
  RotateCcw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableHead, 
  TableRow, 
  TableCell 
} from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  ColorFilamentoItem, 
  moverEstadoColor, 
  actualizarGramosColor,
  agregarNuevoColor, 
  eliminarColor, 
  resetColoresTaller,
  editarColorFilamento,
  descatalogarColor,
  reactivarColor
} from '@/actions/inventario'

interface InventarioClientProps {
  disponibles: ColorFilamentoItem[]
  restock: ColorFilamentoItem[]
  descatalogados?: ColorFilamentoItem[]
}

// Swatches agrupados por tonalidades
const SWATCH_GROUPS = {
  neutros: [
    { name: 'Negro carbón', hex: '#18181B' },
    { name: 'Blanco hueso', hex: '#F5F5F0' },
    { name: 'Blanco marfil', hex: '#FFFBEB' },
    { name: 'Gris ceniza', hex: '#94A3B8' },
    { name: 'Arena', hex: '#D4B996' },
  ],
  calidos: [
    { name: 'Terracota', hex: '#A36F4C' },
    { name: 'Marrón latte', hex: '#854D0E' },
    { name: 'Marrón oscuro', hex: '#3E2723' },
    { name: 'Chocolate oscuro', hex: '#451A03' },
    { name: 'Rojo escarlata', hex: '#DC2626' },
    { name: 'Rojo oscuro', hex: '#7F1D1D' },
    { name: 'Naranja mandarina', hex: '#F97316' },
    { name: 'Rosa Sakura', hex: '#F472B6' },
  ],
  frios: [
    { name: 'Azul oscuro', hex: '#1E3A8A' },
    { name: 'Verde grass', hex: '#22C55E' },
    { name: 'Verde manzana', hex: '#65A30D' },
    { name: 'Verde oscuro', hex: '#14532D' },
    { name: 'Lila púrpura', hex: '#C084FC' },
    { name: 'Ciruela', hex: '#581C87' },
  ]
}

const ALL_SWATCHES = [
  ...SWATCH_GROUPS.neutros,
  ...SWATCH_GROUPS.calidos,
  ...SWATCH_GROUPS.frios,
]

const NEUTRAL_KEYWORDS = ['negro', 'blanco', 'gris', 'ceniza', 'hueso', 'marfil', 'arena', 'beige', 'plata', 'silver', 'carbón']

const normalizeSearchText = (text: string) =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

const esColorCritico = (c: ColorFilamentoItem) => {
  if (c.estado !== 'DISPONIBLE') return false
  const gramos = c.stockGramos ?? 1000
  return gramos < 300 || Boolean(c.alertaCritica)
}

type FilterTab = 'todos' | 'disponibles' | 'criticos' | 'restock' | 'descatalogados'

export function InventarioClient({ 
  disponibles: initialDisponibles, 
  restock: initialRestock,
  descatalogados: initialDescatalogados = []
}: InventarioClientProps) {
  const [disponibles, setDisponibles] = useState<ColorFilamentoItem[]>(initialDisponibles)
  const [restock, setRestock] = useState<ColorFilamentoItem[]>(initialRestock)
  const [descatalogados, setDescatalogados] = useState<ColorFilamentoItem[]>(initialDescatalogados)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('todos')
  const [isPending, startTransition] = useTransition()

  // Copy Feedback State
  const [isCopied, setIsCopied] = useState(false)
  const [showCopyDropdown, setShowCopyDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Quick Add State
  const [openAddModal, setOpenAddModal] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoHex, setNuevoHex] = useState('#18181B')
  const [nuevoEstado, setNuevoEstado] = useState<'DISPONIBLE' | 'RESTOCK'>('DISPONIBLE')
  const [nuevoGramos, setNuevoGramos] = useState('1000')
  const [nuevaNota, setNuevaNota] = useState('')

  // Edit Spool State
  const [openEditModal, setOpenEditModal] = useState(false)
  const [editColorId, setEditColorId] = useState('')
  const [editNombre, setEditNombre] = useState('')
  const [editHex, setEditHex] = useState('#18181B')
  const [editNota, setEditNota] = useState('')

  // Details Modal State for invested products
  const [selectedColorForDetails, setSelectedColorForDetails] = useState<ColorFilamentoItem | null>(null)
  const [openColorDetailsModal, setOpenColorDetailsModal] = useState(false)

  // Close copy dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCopyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpenEditColor = (item: ColorFilamentoItem) => {
    setEditColorId(item.id)
    setEditNombre(item.nombreColor)
    setEditHex(item.codigoHex || '#18181B')
    setEditNota(item.nota || '')
    setOpenEditModal(true)
  }

  const handleEditColorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editNombre.trim() || !editColorId) return

    try {
      await editarColorFilamento(editColorId, {
        nombreColor: editNombre.trim(),
        codigoHex: editHex,
        nota: editNota.trim() || null
      })

      const updater = (prev: ColorFilamentoItem[]) =>
        prev.map(c => c.id === editColorId ? { ...c, nombreColor: editNombre.trim(), codigoHex: editHex, nota: editNota.trim() || null } : c)

      setDisponibles(updater)
      setRestock(updater)
      setDescatalogados(updater)
      setOpenEditModal(false)
      toast.success(`Color "${editNombre.trim()}" actualizado`)
    } catch (err: any) {
      toast.error('Error al editar: ' + (err?.message || 'Error desconocido'))
    }
  }

  const handleOpenColorDetails = (item: ColorFilamentoItem) => {
    setSelectedColorForDetails(item)
    setOpenColorDetailsModal(true)
  }

  // Stock KPI Calculations
  const totalGramosActivos = useMemo(() => {
    return disponibles.reduce((acc, c) => acc + (c.stockGramos || 0), 0)
  }, [disponibles])

  const totalCriticos = useMemo(() => {
    return disponibles.filter(esColorCritico)
  }, [disponibles])

  // Move from Disponible -> Restock
  const handleMoverARestock = async (item: ColorFilamentoItem) => {
    setDisponibles(prev => prev.filter(c => c.id !== item.id))
    setRestock(prev => [{ ...item, estado: 'RESTOCK', stockGramos: 0, alertaCritica: true, nota: 'Por terminar / En reposición' }, ...prev])

    try {
      await moverEstadoColor(item.id, 'RESTOCK', 'Por terminar / En reposición')
      toast.info(`"${item.nombreColor}" movido a Restock`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      setRestock(prev => prev.filter(c => c.id !== item.id))
      setDisponibles(prev => [item, ...prev])
    }
  }

  // Move from Restock -> Disponible
  const handleMoverADisponible = async (item: ColorFilamentoItem) => {
    const rollos = item.rollos || 1
    const capacidadGramos = rollos * 1000
    setRestock(prev => prev.filter(c => c.id !== item.id))
    setDisponibles(prev => [{ ...item, estado: 'DISPONIBLE', stockGramos: capacidadGramos, alertaCritica: false, nota: null }, ...prev])

    try {
      await moverEstadoColor(item.id, 'DISPONIBLE')
      toast.success(`"${item.nombreColor}" marcado como Disponible (${capacidadGramos.toLocaleString()}g)`)
    } catch (e: any) {
      toast.error('Error al mover color: ' + e.message)
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
      setRestock(prev => [item, ...prev])
    }
  }

  // Descatalogar color (ya no habrá este color)
  const handleDescatalogarColor = async (item: ColorFilamentoItem) => {
    if (!confirm(`¿Descatalogar "${item.nombreColor}"?\n\nEl color ya no aparecerá en el catálogo activo para clientes ni en compras de reposición.`)) return

    if (item.estado === 'DISPONIBLE') {
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
    } else {
      setRestock(prev => prev.filter(c => c.id !== item.id))
    }
    setDescatalogados(prev => [{ ...item, estado: 'DESCATALOGADO', activo: false, nota: 'Descatalogado' }, ...prev])

    try {
      await descatalogarColor(item.id)
      toast.info(`"${item.nombreColor}" ha sido descatalogado`)
    } catch (e: any) {
      toast.error('Error al descatalogar: ' + e.message)
      setDescatalogados(prev => prev.filter(c => c.id !== item.id))
      if (item.estado === 'DISPONIBLE') {
        setDisponibles(prev => [item, ...prev])
      } else {
        setRestock(prev => [item, ...prev])
      }
    }
  }

  // Reactivar color descatalogado
  const handleReactivarColor = async (item: ColorFilamentoItem) => {
    const isDisp = (item.stockGramos || 0) > 0

    setDescatalogados(prev => prev.filter(c => c.id !== item.id))
    if (isDisp) {
      setDisponibles(prev => [{ ...item, estado: 'DISPONIBLE', activo: true, nota: null }, ...prev])
    } else {
      setRestock(prev => [{ ...item, estado: 'RESTOCK', activo: true, nota: 'Por terminar / En reposición' }, ...prev])
    }

    try {
      await reactivarColor(item.id)
      toast.success(`"${item.nombreColor}" reincorporado al inventario`)
    } catch (e: any) {
      toast.error('Error al reactivar: ' + e.message)
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
      setRestock(prev => prev.filter(c => c.id !== item.id))
      setDescatalogados(prev => [item, ...prev])
    }
  }

  // =========================================================================
  // FUNCIONALIDAD COMERCIAL: COPIAR COLORES PARA CLIENTES
  // =========================================================================
  const handleCopiarColoresClientes = (tipo: 'todos_disponibles' | 'solo_neutros' = 'todos_disponibles') => {
    setShowCopyDropdown(false)

    const coloresDisponibles = disponibles.filter(c => (c.stockGramos ?? 1000) > 0)

    if (coloresDisponibles.length === 0) {
      toast.info('No hay colores disponibles con stock activo en este momento')
      return
    }

    let seleccionados = coloresDisponibles

    if (tipo === 'solo_neutros') {
      seleccionados = coloresDisponibles.filter(c => {
        const nombreLower = c.nombreColor.toLowerCase()
        return NEUTRAL_KEYWORDS.some(k => nombreLower.includes(k))
      })

      if (seleccionados.length === 0) {
        toast.info('No se encontraron tonos neutros con stock disponible')
        return
      }
    }

    const itemsText = seleccionados
      .sort((a, b) => a.nombreColor.localeCompare(b.nombreColor, 'es', { sensitivity: 'base' }))
      .map(c => `• ${c.nombreColor}`)
      .join('\n')

    const header = tipo === 'solo_neutros'
      ? '🎨 *Catálogo de Tonos Neutros Disponibles - NOVA 3D*'
      : '🎨 *Catálogo de Colores Disponibles - NOVA 3D*'

    const message = `${header}\n${itemsText}\n\n_Consulta por combinaciones multicolor o disponibilidad para piezas de gran volumen._`

    navigator.clipboard.writeText(message)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success(tipo === 'solo_neutros' ? 'Tonos neutros copiados al portapapeles' : 'Catálogo de colores disponible copiado')
  }

  // Quick Grams Update (-50g / +50g)
  const handleAjustarGramos = async (item: ColorFilamentoItem, delta: number) => {
    const nuevosGramos = Math.max(0, (item.stockGramos || 0) + delta)
    const capacidad = Math.max(1000, Math.ceil(nuevosGramos / 1000) * 1000)
    const rollos = Math.max(1, Math.ceil(nuevosGramos / 1000))
    
    setDisponibles(prev => prev.map(c => c.id === item.id ? { 
      ...c, 
      stockGramos: nuevosGramos,
      pesoInicialGramos: capacidad,
      rollos,
      alertaCritica: nuevosGramos < 300,
      nota: nuevosGramos < 300 ? `⚠️ Solo ${nuevosGramos}g restantes` : null
    } : c))

    try {
      await actualizarGramosColor(item.id, nuevosGramos)
    } catch (e: any) {
      toast.error('Error al actualizar gramos: ' + e.message)
    }
  }

  // Quick Grams Direct Input
  const handleSetGramosPrompt = async (item: ColorFilamentoItem) => {
    const input = prompt(`Ingresa los gramos de filamento para "${item.nombreColor}" (ej. 500, 1000, 2500):`, (item.stockGramos ?? 1000).toString())
    if (input === null) return
    const num = parseInt(input, 10)
    if (isNaN(num) || num < 0) {
      toast.error('Ingresa una cantidad válida de gramos (número positivo)')
      return
    }

    const capacidad = Math.max(1000, Math.ceil(num / 1000) * 1000)
    const rollos = Math.max(1, Math.ceil(num / 1000))

    setDisponibles(prev => prev.map(c => c.id === item.id ? { 
      ...c, 
      stockGramos: num,
      pesoInicialGramos: capacidad,
      rollos,
      alertaCritica: num < 300,
      nota: num < 300 ? `⚠️ Solo ${num}g restantes` : null
    } : c))

    try {
      await actualizarGramosColor(item.id, num)
      toast.success(`Gramos de "${item.nombreColor}" actualizados a ${num.toLocaleString()}g`)
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  // Delete color
  const handleEliminarColor = async (item: ColorFilamentoItem) => {
    if (!confirm(`¿Estás seguro de eliminar permanentemente "${item.nombreColor}"?`)) return

    if (item.estado === 'DISPONIBLE') {
      setDisponibles(prev => prev.filter(c => c.id !== item.id))
    } else if (item.estado === 'RESTOCK') {
      setRestock(prev => prev.filter(c => c.id !== item.id))
    } else {
      setDescatalogados(prev => prev.filter(c => c.id !== item.id))
    }

    try {
      const res = await eliminarColor(item.id)
      if (res.softDeleted) {
        toast.success(`"${item.nombreColor}" archivado`)
      } else {
        toast.success(`"${item.nombreColor}" eliminado`)
      }
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
      if (item.estado === 'DISPONIBLE') {
        setDisponibles(prev => [item, ...prev])
      } else if (item.estado === 'RESTOCK') {
        setRestock(prev => [item, ...prev])
      } else {
        setDescatalogados(prev => [item, ...prev])
      }
    }
  }

  // Reset workshop list
  const handleReset = async () => {
    if (!confirm('¿Restablecer el inventario a la lista oficial del taller NOVA 3D?')) return
    try {
      const data = await resetColoresTaller()
      setDisponibles(data.disponibles)
      setRestock(data.restock)
      setDescatalogados(data.descatalogados || [])
      toast.success('Lista de colores restablecida con éxito')
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  // Quick Add submit
  const handleAddColorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoNombre.trim()) return

    const gNum = nuevoEstado === 'DISPONIBLE' 
      ? Math.max(0, parseInt(nuevoGramos || '1000', 10)) 
      : 0
    const rollosNum = Math.max(1, Math.ceil(gNum / 1000))

    try {
      const created = await agregarNuevoColor({
        nombreColor: nuevoNombre.trim(),
        codigoHex: nuevoHex,
        estado: nuevoEstado,
        rollos: rollosNum,
        stockGramos: gNum,
        nota: nuevaNota.trim() || undefined
      })

      if (nuevoEstado === 'DISPONIBLE') {
        setDisponibles(prev => [created, ...prev])
      } else {
        setRestock(prev => [created, ...prev])
      }

      toast.success(`"${created.nombreColor}" registrado en el taller`)
      setNuevoNombre('')
      setNuevaNota('')
      setNuevoGramos('1000')
      setOpenAddModal(false)
    } catch (e: any) {
      toast.error('Error al registrar: ' + e.message)
    }
  }

  // Combined and Filtered Color List for the Grid Matrix
  const filteredGridItems = useMemo(() => {
    let combined: ColorFilamentoItem[] = []

    if (activeTab === 'todos') {
      combined = [...disponibles, ...restock]
    } else if (activeTab === 'disponibles') {
      combined = [...disponibles]
    } else if (activeTab === 'criticos') {
      combined = disponibles.filter(esColorCritico)
    } else if (activeTab === 'restock') {
      combined = [...restock]
    } else if (activeTab === 'descatalogados') {
      combined = [...descatalogados]
    }

    if (search.trim()) {
      const q = normalizeSearchText(search.trim())
      combined = combined.filter(c => {
        const nombre = normalizeSearchText(c.nombreColor || '')
        const nota = normalizeSearchText(c.nota || '')
        const hex = (c.codigoHex || '').toLowerCase()
        const gramos = (c.stockGramos ?? '').toString()
        const estado = (c.estado || '').toLowerCase()

        return (
          nombre.includes(q) ||
          nota.includes(q) ||
          hex.includes(q) ||
          gramos.includes(q) ||
          estado.includes(q)
        )
      })
    }

    // Ordenar: Disponibles de MAYOR a MENOR stock (gramos), luego Restock/Descatalogados alfabético
    return combined.sort((a, b) => {
      const aIsDisp = a.estado === 'DISPONIBLE'
      const bIsDisp = b.estado === 'DISPONIBLE'

      if (aIsDisp && bIsDisp) {
        const diff = (b.stockGramos ?? 0) - (a.stockGramos ?? 0)
        if (diff !== 0) return diff
        return a.nombreColor.localeCompare(b.nombreColor, 'es', { sensitivity: 'base' })
      }

      if (aIsDisp && !bIsDisp) return -1
      if (!aIsDisp && bIsDisp) return 1

      return a.nombreColor.localeCompare(b.nombreColor, 'es', { sensitivity: 'base' })
    })
  }, [disponibles, restock, descatalogados, activeTab, search])

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-200 px-1 sm:px-2 pb-16">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA Y RESUMEN EJECUTIVO (KPIS INTERACTIVOS EN LIGHT MODE)         */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Fila Título + Sync Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#75695D] font-medium mb-1">
              <Link href="/catalogo" className="hover:text-[#A36F4C] transition-colors flex items-center gap-1">
                <Package className="h-3.5 w-3.5 text-[#A36F4C]" />
                <span>Catálogo</span>
              </Link>
              <span className="text-[#D4BEA7]">/</span>
              <span className="text-[#241C15] font-bold">Inventario de Filamentos</span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#241C15] tracking-tight flex items-center gap-2">
                <Palette className="h-6 w-6 sm:h-7 sm:w-7 text-[#A36F4C] flex-shrink-0" />
                <span>Inventario de Filamentos</span>
              </h1>
              <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#EBF7EE] border border-[#B4E3C0] text-[#1E5E3A] text-[11px] font-bold">
                <span className="h-2 w-2 rounded-full bg-[#1E5E3A] animate-pulse" />
                <span>Sincronizado en vivo</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              title="Restablecer lista de taller oficial"
              className="h-9 px-3 text-xs font-bold text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] rounded-xl cursor-pointer transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Restablecer
            </Button>
          </div>
        </div>

        {/* Fila de 4 KPIs Interactivos (Click para filtrar) Minimalistas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1: Kilos en Taller -> Activa 'todos' */}
          <button
            type="button"
            onClick={() => setActiveTab('todos')}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all text-left cursor-pointer ${
              activeTab === 'todos'
                ? 'bg-white border-[#A36F4C] ring-1 ring-[#A36F4C]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Total en Taller</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
                <Weight className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#1E5E3A] font-mono tabular-nums">
                {(totalGramosActivos / 1000).toFixed(2)} <span className="text-xs font-normal font-sans text-[#75695D]">kg</span>
              </div>
              <span className="text-xs text-[#75695D] mt-0.5 block truncate">
                {totalGramosActivos.toLocaleString()} g activos
              </span>
            </div>
          </button>

          {/* KPI 2: Colores Disponibles -> Activa 'disponibles' */}
          <button
            type="button"
            onClick={() => setActiveTab('disponibles')}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all text-left cursor-pointer ${
              activeTab === 'disponibles'
                ? 'bg-white border-[#1E5E3A] ring-1 ring-[#1E5E3A]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Colores Disponibles</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
                <Palette className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
                {disponibles.length} <span className="text-xs font-normal font-sans text-[#75695D]">colores</span>
              </div>
              <span className="text-xs text-[#1E5E3A] font-medium mt-0.5 block truncate">
                Stock activo para producción
              </span>
            </div>
          </button>

          {/* KPI 3: Stock Crítico (<300g) -> Activa 'criticos' */}
          <button
            type="button"
            onClick={() => setActiveTab('criticos')}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all text-left cursor-pointer ${
              activeTab === 'criticos'
                ? 'bg-white border-[#854D0E] ring-1 ring-[#854D0E]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Stock Crítico (&lt;300g)</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#854D0E]">
                <AlertTriangle className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#854D0E] font-mono tabular-nums">
                {totalCriticos.length} <span className="text-xs font-normal font-sans text-[#75695D]">{totalCriticos.length === 1 ? 'color' : 'colores'}</span>
              </div>
              <span className="text-xs text-[#854D0E] font-medium mt-0.5 block truncate">
                {totalCriticos.length > 0 ? 'Reponer pronto' : 'Nivel óptimo'}
              </span>
            </div>
          </button>

          {/* KPI 4: Para Restock -> Activa 'restock' */}
          <button
            type="button"
            onClick={() => setActiveTab('restock')}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs transition-all text-left cursor-pointer ${
              activeTab === 'restock'
                ? 'bg-white border-[#A36F4C] ring-1 ring-[#A36F4C]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Para Restock</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#7C5835]">
                <ShoppingCart className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
                {restock.length} <span className="text-xs font-normal font-sans text-[#75695D]">colores</span>
              </div>
              <span className="text-xs text-[#75695D] font-medium mt-0.5 block truncate">
                Marcados para compra
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. BARRA DE HERRAMIENTAS Y FILTROS DISTRIBUIDA                            */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl p-4 sm:p-5 shadow-xs space-y-3.5">
        
        {/* Fila 1: Buscador + Grupo de Acciones Principales */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          
          {/* Buscador de Filamentos */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
            <Input 
              placeholder="Buscar color, acabado, código HEX o nota..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs sm:text-sm rounded-2xl h-10 focus:border-[#A36F4C] focus:bg-[#FFFFFF] transition-all w-full"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-1 rounded-md cursor-pointer"
                title="Borrar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Grupo de Acciones (Copiar Catálogo + Nuevo Color) */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">

            {/* Botón Copiar Catálogo para Clientes */}
            <div className="relative flex-1 sm:flex-initial" ref={dropdownRef}>
              <div className="flex rounded-2xl shadow-xs border border-[#E2D9CC] overflow-hidden bg-[#FFFFFF] hover:bg-[#FAF8F5] transition-colors">
                <button
                  type="button"
                  onClick={() => handleCopiarColoresClientes('todos_disponibles')}
                  className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#241C15] cursor-pointer active:scale-[0.98] transition-all flex-1"
                  title="Copiar lista de colores disponibles para WhatsApp o Instagram"
                >
                  {isCopied ? (
                    <>
                      <Check className="h-4 w-4 text-[#1E5E3A] stroke-[2.5] animate-in zoom-in-50 duration-150" />
                      <span className="text-[#1E5E3A] font-extrabold truncate">¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 text-[#A36F4C] flex-shrink-0" />
                      <span className="truncate">Copiar Catálogo</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCopyDropdown(prev => !prev)}
                  className="px-2 py-2 border-l border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC]/50 cursor-pointer flex items-center justify-center transition-colors"
                  title="Opciones de catálogo"
                >
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${showCopyDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Dropdown de opciones */}
              {showCopyDropdown && (
                <div className="absolute right-0 mt-1.5 w-64 bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#75695D] uppercase tracking-wider border-b border-[#E2D9CC]/60">
                    Opciones de Copiado
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopiarColoresClientes('todos_disponibles')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-[#F4EFEA] text-xs font-bold text-[#241C15] transition-colors cursor-pointer"
                  >
                    <Palette className="h-4 w-4 text-[#A36F4C] flex-shrink-0" />
                    <div>
                      <div>Todos los disponibles ({disponibles.length})</div>
                      <div className="text-[10px] font-normal text-[#75695D]">Catálogo completo activo</div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopiarColoresClientes('solo_neutros')}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-[#F4EFEA] text-xs font-bold text-[#241C15] transition-colors cursor-pointer"
                  >
                    <span className="h-3 w-3 rounded-full bg-gradient-to-tr from-[#18181B] via-[#94A3B8] to-[#F5F5F0] border border-[#D4BEA7]" />
                    <div>
                      <div>Solo tonos neutros</div>
                      <div className="text-[10px] font-normal text-[#75695D]">Blanco, Negro, Gris, Arena...</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Botón Primario: Nuevo Color */}
            <Button
              type="button"
              onClick={() => setOpenAddModal(true)}
              className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs h-10 px-4 rounded-2xl shadow-xs cursor-pointer transition-all active:scale-[0.98] flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Nuevo Color</span>
            </Button>
          </div>
        </div>

        {/* Fila 2: Pestañas de Filtro por Estado (Pills con Conteo) + Resumen */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-[#E2D9CC]/70">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => setActiveTab('todos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                activeTab === 'todos'
                  ? 'bg-[#241C15] text-white border-[#241C15] shadow-xs'
                  : 'bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC] hover:text-[#241C15] hover:bg-[#FFFFFF]'
              }`}
            >
              <span>Todos</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                activeTab === 'todos' ? 'bg-white/20 text-white' : 'bg-[#EAE4DC] text-[#75695D]'
              }`}>
                {disponibles.length + restock.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('disponibles')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                activeTab === 'disponibles'
                  ? 'bg-[#1E5E3A] text-white border-[#1E5E3A] shadow-xs'
                  : 'bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC] hover:text-[#1E5E3A] hover:bg-[#EBF7EE]/50'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${activeTab === 'disponibles' ? 'bg-white' : 'bg-[#1E5E3A]'}`} />
              <span>Disponibles</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                activeTab === 'disponibles' ? 'bg-white/20 text-white' : 'bg-[#EBF7EE] text-[#1E5E3A]'
              }`}>
                {disponibles.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('criticos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                activeTab === 'criticos'
                  ? 'bg-[#854D0E] text-white border-[#854D0E] shadow-xs'
                  : 'bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC] hover:text-[#854D0E] hover:bg-[#FEF9C3]/50'
              }`}
            >
              <AlertTriangle className="h-3 w-3" />
              <span>Críticos &lt;300g</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold ${
                activeTab === 'criticos' ? 'bg-white/20 text-white' : 'bg-[#FEF08A] text-[#854D0E]'
              }`}>
                {totalCriticos.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('restock')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                activeTab === 'restock'
                  ? 'bg-[#A36F4C] text-white border-[#A36F4C] shadow-xs'
                  : 'bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC] hover:text-[#A36F4C] hover:bg-[#F5EBE1]/50'
              }`}
            >
              <ShoppingCart className="h-3 w-3" />
              <span>Para Restock</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                activeTab === 'restock' ? 'bg-white/20 text-white' : 'bg-[#F5EBE1] text-[#A36F4C]'
              }`}>
                {restock.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('descatalogados')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border ${
                activeTab === 'descatalogados'
                  ? 'bg-[#52463C] text-white border-[#52463C] shadow-xs'
                  : 'bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC] hover:text-[#241C15] hover:bg-[#FAF8F5]'
              }`}
            >
              <Archive className="h-3 w-3" />
              <span>Descatalogados</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md ${
                activeTab === 'descatalogados' ? 'bg-white/20 text-white' : 'bg-[#EAE4DC] text-[#75695D]'
              }`}>
                {descatalogados.length}
              </span>
            </button>
          </div>

          {/* Contador de resultados & Botón Reset */}
          <div className="flex items-center justify-between sm:justify-end gap-2 text-xs flex-shrink-0">
            <div className="flex items-center gap-1.5 text-[#75695D]">
              <span className="font-medium">Total:</span>
              <span className="font-bold text-[#241C15] font-mono bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#E2D9CC]">
                {filteredGridItems.length}
              </span>
            </div>

            {(search || activeTab !== 'todos') && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setActiveTab('todos')
                }}
                className="text-xs text-[#A36F4C] hover:text-[#8E5E3E] font-bold underline flex items-center gap-1 cursor-pointer ml-1"
                title="Restablecer filtros"
              >
                <X className="h-3.5 w-3.5" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. VISUALIZACIÓN DE INVENTARIO (TABLA O TARJETAS)                         */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredGridItems.length === 0 ? (
          <div className="p-10 text-center rounded-3xl border border-dashed border-[#E2D9CC] bg-[#FFFFFF] shadow-xs space-y-3">
            <div className="h-10 w-10 rounded-full bg-[#FAF8F5] border border-[#E2D9CC] flex items-center justify-center mx-auto text-[#75695D]">
              <Search className="h-5 w-5 opacity-70" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#241C15]">
                {search 
                  ? `No se encontraron filamentos que coincidan con "${search}"` 
                  : 'No hay colores registrados en esta categoría.'}
              </p>
              <p className="text-xs text-[#75695D] mt-0.5">
                {activeTab !== 'todos' ? `Filtro activo: ${activeTab.toUpperCase()}` : 'Prueba ingresando otro término de búsqueda'}
              </p>
            </div>
            {(search || activeTab !== 'todos') && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch('')
                  setActiveTab('todos')
                }}
                className="text-xs font-bold rounded-xl border-[#E2D9CC] text-[#241C15] hover:bg-[#FAF8F5] cursor-pointer"
              >
                <RefreshCw className="h-3 w-3 mr-1.5 text-[#A36F4C]" />
                Mostrar todos los filamentos
              </Button>
            )}
          </div>
        ) : (
          /* ========================================================================= */
          /* TABLA DE INVENTARIO                                                      */
          /* ========================================================================= */
          <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl overflow-hidden shadow-xs">
            {/* Mobile / Tablet View (< lg): Filament Cards */}
            <div className="block lg:hidden divide-y divide-[#E2D9CC]/70">
              {filteredGridItems.map((item, idx) => {
                const isDescatalogado = item.estado === 'DESCATALOGADO'
                const isDisp = item.estado === 'DISPONIBLE'
                const rollos = item.rollos || 1
                const pesoInicial = item.pesoInicialGramos || (rollos * 1000)
                const gramos = isDisp ? (item.stockGramos ?? pesoInicial) : (item.stockGramos || 0)
                const pct = isDisp ? Math.min(100, Math.round((gramos / pesoInicial) * 100)) : 0
                const esCritico = isDisp && (gramos < 300 || Boolean(item.alertaCritica))

                return (
                  <div 
                    key={item.id}
                    className={`p-4 space-y-3 transition-colors ${
                      isDescatalogado 
                        ? 'bg-[#F8F6F2]/60 opacity-80' 
                        : esCritico
                        ? 'bg-[#FEF9C3]/20'
                        : 'hover:bg-[#FAF8F5]/60'
                    }`}
                  >
                    {/* Top: Swatch, Name, Notes & Status */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleOpenEditColor(item)}
                          className="relative h-8 w-8 rounded-full border border-black/15 shadow-2xs shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform flex items-center justify-center"
                          style={{ backgroundColor: item.codigoHex }}
                          title={`Editar "${item.nombreColor}"`}
                        >
                          <span className="h-2 w-2 rounded-full bg-white/40 border border-black/10" />
                        </button>

                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEditColor(item)}
                            className="font-black text-sm text-[#241C15] truncate hover:text-[#A36F4C] hover:underline cursor-pointer block text-left"
                          >
                            {item.nombreColor}
                          </button>
                          {item.nota && (
                            <span className="text-[10px] text-[#854D0E] bg-[#FEF9C3] px-1.5 py-0.2 rounded border border-[#FDE047]/60 inline-block truncate max-w-[220px] mt-0.5">
                              {item.nota}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isDescatalogado ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#75695D] border border-[#E2D9CC] uppercase tracking-wider inline-flex items-center gap-1">
                            <Archive className="h-2.5 w-2.5 text-[#75695D]" />
                            Descatalogado
                          </span>
                        ) : esCritico ? (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] uppercase tracking-wider inline-flex items-center gap-1">
                            <AlertTriangle className="h-2.5 w-2.5" />
                            Crítico
                          </span>
                        ) : isDisp ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EBF7EE] text-[#1E5E3A] border border-[#B4E3C0] uppercase tracking-wider inline-flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1E5E3A]" />
                            Disponible
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] uppercase tracking-wider inline-flex items-center gap-1">
                            <ShoppingCart className="h-2.5 w-2.5" />
                            Restock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Stock Grams & Progress */}
                    {isDisp && (
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC]/70 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#241C15] font-mono">
                            {gramos}g <span className="text-[11px] font-normal text-[#75695D]">({pct}% de {pesoInicial}g)</span>
                          </span>
                          <span className="text-[10px] text-[#75695D]">
                            {rollos > 1 ? `${rollos} bobinas` : '1 bobina'}
                          </span>
                        </div>

                        <div className="h-2 w-full rounded-full bg-[#E2D9CC]/60 overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${
                              esCritico ? 'bg-[#DC2626]' : pct < 50 ? 'bg-[#D97706]' : 'bg-[#1E5E3A]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        {/* Quick adjust buttons */}
                        <div className="flex items-center justify-between pt-1 border-t border-[#E2D9CC]/50 text-xs">
                          <span className="text-[10px] text-[#75695D] font-medium">Ajuste rápido:</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleAjustarGramos(item, -50)}
                              className="px-2.5 py-1 text-[11px] font-mono font-bold bg-white border border-[#E2D9CC] rounded-lg text-[#DC2626] hover:bg-red-50 cursor-pointer active:scale-95"
                            >
                              -50g
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAjustarGramos(item, 50)}
                              className="px-2.5 py-1 text-[11px] font-mono font-bold bg-white border border-[#E2D9CC] rounded-lg text-[#1E5E3A] hover:bg-emerald-50 cursor-pointer active:scale-95"
                            >
                              +50g
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Production info + Actions */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[#241C15]">
                          {item.totalProductosImpresos || 0} piezas
                        </span>
                        <span className="text-[10px] text-[#75695D]">
                          ({(item.totalGramosConsumidos || 0).toLocaleString()}g)
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenColorDetails(item)}
                          title="Ver modelos fabricados con este color"
                          className="h-6 w-6 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#A36F4C] hover:bg-[#F4EFEA] transition-colors cursor-pointer border border-[#E2D9CC] bg-white"
                        >
                          <Info className="h-3 w-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isDescatalogado ? (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleReactivarColor(item)}
                            className="h-7 text-[10px] font-bold bg-[#1E5E3A] hover:bg-[#164B2E] text-white rounded-lg px-2.5 cursor-pointer shadow-2xs"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Reactivar
                          </Button>
                        ) : isDisp ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleMoverARestock(item)}
                            className={`h-7 text-[10px] font-bold rounded-lg px-2.5 cursor-pointer transition-colors ${
                              esCritico 
                                ? 'bg-[#854D0E] text-white border-[#854D0E] hover:bg-[#713F12]' 
                                : 'bg-white text-[#A36F4C] border-[#E2D9CC] hover:bg-[#F5EBE1]'
                            }`}
                          >
                            A Restock
                          </Button>
                        ) : (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleMoverADisponible(item)}
                            className="h-7 text-[10px] font-bold bg-[#1E5E3A] hover:bg-[#164B2E] text-white rounded-lg px-2.5 cursor-pointer shadow-2xs"
                          >
                            Marcar Disp.
                          </Button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditColor(item)}
                          title={`Editar "${item.nombreColor}"`}
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#A36F4C] hover:bg-[#F4EFEA] transition-colors cursor-pointer border border-[#E2D9CC] bg-white"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>

                        {!isDescatalogado && (
                          <button
                            type="button"
                            onClick={() => handleDescatalogarColor(item)}
                            title="Descatalogar color"
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#854D0E] hover:bg-[#FEF9C3]/70 transition-colors cursor-pointer border border-[#E2D9CC] bg-white"
                          >
                            <Archive className="h-3 w-3" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleEliminarColor(item)}
                          title="Eliminar color"
                          className="h-7 w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer border border-[#E2D9CC] bg-white"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Desktop View (>= lg): Full Table table-fixed */}
            <div className="hidden lg:block w-full">
              <Table className="w-full table-fixed">
                <TableHeader className="bg-[#FAF8F5] border-b border-[#E2D9CC]">
                  <TableRow className="hover:bg-transparent border-b border-[#E2D9CC] text-xs font-bold text-[#75695D]">
                    <TableHead className="w-10 px-2 py-3 text-center text-[#75695D]">#</TableHead>
                    <TableHead className="px-3 py-3 text-left text-[#75695D]">Color / Filamento</TableHead>
                    <TableHead className="w-28 px-2 py-3 text-center text-[#75695D]">Estado</TableHead>
                    <TableHead className="w-48 px-3 py-3 text-left text-[#75695D]">Stock en Taller</TableHead>
                    <TableHead className="w-28 px-2 py-3 text-center text-[#75695D]">Ajuste Rápido</TableHead>
                    <TableHead className="w-36 px-2 py-3 text-left text-[#75695D]">Producción</TableHead>
                    <TableHead className="w-36 px-3 py-3 text-right pr-4 text-[#75695D]">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGridItems.map((item, idx) => {
                    const isDescatalogado = item.estado === 'DESCATALOGADO'
                    const isDisp = item.estado === 'DISPONIBLE'
                    const rollos = item.rollos || 1
                    const pesoInicial = item.pesoInicialGramos || (rollos * 1000)
                    const gramos = isDisp ? (item.stockGramos ?? pesoInicial) : (item.stockGramos || 0)
                    const pct = isDisp ? Math.min(100, Math.round((gramos / pesoInicial) * 100)) : 0
                    const esCritico = isDisp && (gramos < 300 || Boolean(item.alertaCritica))

                    return (
                      <TableRow 
                        key={item.id}
                        className={`border-b border-[#E2D9CC]/70 transition-colors text-xs ${
                          isDescatalogado 
                            ? 'bg-[#F8F6F2]/60 hover:bg-[#F8F6F2] opacity-80' 
                            : esCritico
                            ? 'bg-[#FEF9C3]/20 hover:bg-[#FEF9C3]/40'
                            : 'hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {/* 1. Rank # */}
                        <TableCell className="px-2 py-3 text-center font-mono font-bold text-[#75695D]">
                          {idx + 1}
                        </TableCell>

                        {/* 2. Swatch & Color Name */}
                        <TableCell className="px-3 py-3 min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button
                              type="button"
                              onClick={() => handleOpenEditColor(item)}
                              className="relative h-6.5 w-6.5 rounded-full border border-black/15 shadow-2xs flex-shrink-0 cursor-pointer hover:scale-110 active:scale-95 transition-transform flex items-center justify-center group"
                              style={{ backgroundColor: item.codigoHex }}
                              title={`Editar "${item.nombreColor}"`}
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-white/40 border border-black/10" />
                            </button>
                            <div className="min-w-0 flex-1">
                              <button
                                type="button"
                                onClick={() => handleOpenEditColor(item)}
                                className="font-bold text-xs text-[#241C15] truncate hover:text-[#A36F4C] hover:underline cursor-pointer block text-left"
                              >
                                {item.nombreColor}
                              </button>
                              {item.nota && (
                                <span className="text-[10px] text-[#854D0E] bg-[#FEF9C3] px-1.5 py-0.2 rounded border border-[#FDE047]/60 inline-block truncate max-w-full mt-0.5">
                                  {item.nota}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* 3. Estado */}
                        <TableCell className="px-2 py-3 text-center">
                          {isDescatalogado ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#75695D] border border-[#E2D9CC] uppercase tracking-wider inline-flex items-center gap-1">
                              <Archive className="h-2.5 w-2.5 text-[#75695D]" />
                              Descatalogado
                            </span>
                          ) : esCritico ? (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] uppercase tracking-wider inline-flex items-center gap-1">
                              <AlertTriangle className="h-2.5 w-2.5" />
                              Crítico
                            </span>
                          ) : isDisp ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#EBF7EE] text-[#1E5E3A] border border-[#B4E3C0] uppercase tracking-wider inline-flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#1E5E3A]" />
                              Disponible
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] uppercase tracking-wider inline-flex items-center gap-1">
                              <ShoppingCart className="h-2.5 w-2.5" />
                              Restock
                            </span>
                          )}
                        </TableCell>

                        {/* 4. Stock en Taller */}
                        <TableCell className="px-3 py-3 min-w-0">
                          {isDescatalogado ? (
                            <span className="text-xs text-[#75695D] italic">0 g (Descatalogado)</span>
                          ) : isDisp ? (
                            <div className="space-y-1">
                              <div className="flex items-baseline justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSetGramosPrompt(item)}
                                  className="font-mono font-black text-xs text-[#241C15] hover:text-[#A36F4C] hover:underline cursor-pointer tracking-tight"
                                  title="Toca para ingresar gramos exactos"
                                >
                                  {gramos.toLocaleString()} g
                                </button>
                                <span className="text-[#75695D] text-[10px] font-mono">
                                  {gramos >= 1000 ? `(${(gramos / 1000).toFixed(2)} kg)` : `${pct}%`}
                                </span>
                              </div>
                              <div className="w-full bg-[#EAE4DC] h-1.5 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    esCritico ? 'bg-[#854D0E]' : pct < 30 ? 'bg-[#A36F4C]' : 'bg-[#1E5E3A]'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(5, (gramos / (item.pesoInicialGramos || 1000)) * 100))}%` }}
                                />
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-[#854D0E] font-bold">0 g (En reposición)</span>
                          )}
                        </TableCell>

                        {/* 5. Ajuste Rápido */}
                        <TableCell className="px-2 py-3 text-center">
                          {isDisp && !isDescatalogado ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleAjustarGramos(item, -50)}
                                className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] active:scale-95 transition-transform cursor-pointer"
                                title="Descontar 50g"
                              >
                                -50g
                              </button>
                              <button
                                type="button"
                                onClick={() => handleAjustarGramos(item, 50)}
                                className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#F4EFEA] active:scale-95 transition-transform cursor-pointer"
                                title="Añadir 50g"
                              >
                                +50g
                              </button>
                            </div>
                          ) : (
                            <span className="text-[#75695D]">-</span>
                          )}
                        </TableCell>

                        {/* 6. Producción */}
                        <TableCell className="px-2 py-3 min-w-0">
                          <div className="flex items-center justify-between gap-1.5">
                            <div className="min-w-0">
                              <span className="font-bold text-xs text-[#241C15] block truncate">
                                {item.totalProductosImpresos || 0} pzas
                              </span>
                              <span className="text-[10px] text-[#75695D] block truncate">
                                {(item.totalGramosConsumidos || 0).toLocaleString()}g
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleOpenColorDetails(item)}
                              title="Ver modelos fabricados con este color"
                              className="h-6 w-6 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#A36F4C] hover:bg-[#F4EFEA] transition-colors cursor-pointer border border-[#E2D9CC] bg-white flex-shrink-0"
                            >
                              <Info className="h-3 w-3" />
                            </button>
                          </div>
                        </TableCell>

                        {/* 7. Acciones */}
                        <TableCell className="px-3 py-3 text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {isDescatalogado ? (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleReactivarColor(item)}
                                className="h-7 text-[10px] font-bold bg-[#1E5E3A] hover:bg-[#164B2E] text-white rounded-lg px-2 cursor-pointer shadow-2xs"
                              >
                                <RotateCcw className="h-3 w-3 mr-1" />
                                Reactivar
                              </Button>
                            ) : isDisp ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => handleMoverARestock(item)}
                                className={`h-7 text-[10px] font-bold rounded-lg px-2 cursor-pointer transition-colors ${
                                  esCritico 
                                    ? 'bg-[#854D0E] text-white border-[#854D0E] hover:bg-[#713F12]' 
                                    : 'bg-white text-[#A36F4C] border-[#E2D9CC] hover:bg-[#F5EBE1]'
                                }`}
                              >
                                A Restock
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => handleMoverADisponible(item)}
                                className="h-7 text-[10px] font-bold bg-[#1E5E3A] hover:bg-[#164B2E] text-white rounded-lg px-2 cursor-pointer shadow-2xs"
                              >
                                Marcar Disp.
                              </Button>
                            )}

                            {/* Icono Editar */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditColor(item)}
                              title={`Editar "${item.nombreColor}"`}
                              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#A36F4C] hover:bg-[#F4EFEA] transition-colors cursor-pointer border border-[#E2D9CC] bg-white"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>

                            {/* Icono Descatalogar (si no está descatalogado) */}
                            {!isDescatalogado && (
                              <button
                                type="button"
                                onClick={() => handleDescatalogarColor(item)}
                                title={`Descatalogar "${item.nombreColor}" (ya no se comprará este color)`}
                                className="h-7 w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#854D0E] hover:bg-[#FEF9C3]/70 transition-colors cursor-pointer border border-[#E2D9CC] bg-white"
                              >
                                <Archive className="h-3 w-3" />
                              </button>
                            )}

                            {/* Icono Eliminar */}
                            <button
                              type="button"
                              onClick={() => handleEliminarColor(item)}
                              title={`Eliminar "${item.nombreColor}"`}
                              className="h-7 w-7 flex items-center justify-center rounded-lg text-[#75695D] hover:text-[#DC2626] hover:bg-red-50 transition-colors cursor-pointer border border-[#E2D9CC] bg-white"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
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
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL REFACTORIZADO: NUEVO COLOR (1 SOLA COLUMNA LIMPIA)               */}
      {/* ========================================================================= */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[460px] max-h-[92dvh] overflow-y-auto p-0 rounded-3xl shadow-2xl z-50">
          <form onSubmit={handleAddColorSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3">
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-[#241C15]">
                  Registrar Nuevo Color
                </DialogTitle>
                <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                  Agrega un filamento al inventario del taller
                </DialogDescription>
              </div>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-xl hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Nombre */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Nombre del Filamento / Color *
                </Label>
                <Input 
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Negro Carbón, Terracota Seda, Turquesa..."
                  required
                  autoFocus
                  className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-bold text-[#241C15] h-10"
                />
              </div>

              {/* 2. Selector Visual de Muestras (HEX Swatches agrupados) */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#F8F6F2] border border-[#E2D9CC]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241C15]">Muestra Visual (HEX)</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={nuevoHex}
                      onChange={(e) => setNuevoHex(e.target.value)}
                      className="h-6 w-8 rounded-lg border border-[#E2D9CC] cursor-pointer"
                    />
                    <Input 
                      value={nuevoHex}
                      onChange={(e) => setNuevoHex(e.target.value)}
                      className="w-20 h-6 text-xs font-mono font-bold bg-white border-[#E2D9CC] p-1 rounded-md text-center"
                    />
                  </div>
                </div>

                {/* Tonos Neutros */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#75695D] uppercase tracking-wider">Tonos Neutros:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SWATCH_GROUPS.neutros.map(sw => (
                      <button
                        key={sw.name}
                        type="button"
                        onClick={() => {
                          setNuevoHex(sw.hex)
                          if (!nuevoNombre) setNuevoNombre(sw.name)
                        }}
                        className={`h-7 w-7 rounded-full border shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer flex items-center justify-center ${
                          nuevoHex === sw.hex ? 'ring-2 ring-[#A36F4C] ring-offset-1 border-black' : 'border-black/15'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                        title={sw.name}
                      >
                        {nuevoHex === sw.hex && <Check className="h-3 w-3 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tonos Cálidos */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#75695D] uppercase tracking-wider">Tonos Cálidos:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SWATCH_GROUPS.calidos.map(sw => (
                      <button
                        key={sw.name}
                        type="button"
                        onClick={() => {
                          setNuevoHex(sw.hex)
                          if (!nuevoNombre) setNuevoNombre(sw.name)
                        }}
                        className={`h-7 w-7 rounded-full border shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer flex items-center justify-center ${
                          nuevoHex === sw.hex ? 'ring-2 ring-[#A36F4C] ring-offset-1 border-black' : 'border-black/15'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                        title={sw.name}
                      >
                        {nuevoHex === sw.hex && <Check className="h-3 w-3 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tonos Fríos */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-[#75695D] uppercase tracking-wider">Tonos Fríos:</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {SWATCH_GROUPS.frios.map(sw => (
                      <button
                        key={sw.name}
                        type="button"
                        onClick={() => {
                          setNuevoHex(sw.hex)
                          if (!nuevoNombre) setNuevoNombre(sw.name)
                        }}
                        className={`h-7 w-7 rounded-full border shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer flex items-center justify-center ${
                          nuevoHex === sw.hex ? 'ring-2 ring-[#A36F4C] ring-offset-1 border-black' : 'border-black/15'
                        }`}
                        style={{ backgroundColor: sw.hex }}
                        title={sw.name}
                      >
                        {nuevoHex === sw.hex && <Check className="h-3 w-3 text-white drop-shadow" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Estado Inicial */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Estado Inicial
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('DISPONIBLE')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      nuevoEstado === 'DISPONIBLE'
                        ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] shadow-2xs'
                        : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC]'
                    }`}
                  >
                    🟢 Disponible
                  </button>
                  <button
                    type="button"
                    onClick={() => setNuevoEstado('RESTOCK')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      nuevoEstado === 'RESTOCK'
                        ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] shadow-2xs'
                        : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC]'
                    }`}
                  >
                    🟡 Para Restock
                  </button>
                </div>
              </div>

              {/* 4. Gramos Iniciales con Presets (250g, 500g, 1000g, 2000g) */}
              {nuevoEstado === 'DISPONIBLE' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                      Stock Inicial en Gramos
                    </Label>
                    <span className="text-xs font-mono font-bold text-[#1E5E3A]">
                      {nuevoGramos} g {parseInt(nuevoGramos || '0', 10) >= 1000 ? `(~${(parseInt(nuevoGramos || '0', 10) / 1000).toFixed(1)} bobinas)` : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {[250, 500, 1000, 2000].map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setNuevoGramos(g.toString())}
                        className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          nuevoGramos === g.toString()
                            ? 'bg-[#241C15] text-white border-[#241C15]'
                            : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC] hover:bg-white'
                        }`}
                      >
                        {g >= 1000 ? `${g}g (${g/1000}b)` : `${g}g`}
                      </button>
                    ))}
                  </div>

                  <Input 
                    type="number"
                    min="0"
                    value={nuevoGramos}
                    onChange={(e) => setNuevoGramos(e.target.value)}
                    placeholder="1000"
                    required
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-mono font-bold h-10"
                  />
                </div>
              )}

              {/* Nota */}
              {nuevoEstado === 'RESTOCK' && (
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                    Nota de Reposición (Opcional)
                  </Label>
                  <Input 
                    value={nuevaNota}
                    onChange={(e) => setNuevaNota(e.target.value)}
                    placeholder="Ej: Solicitado para proyecto especial..."
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2D9CC]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenAddModal(false)}
                className="text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
              >
                Registrar Color
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 5. MODAL: EDITAR COLOR                                                    */}
      {/* ========================================================================= */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[440px] max-h-[92dvh] overflow-y-auto p-0 rounded-3xl shadow-2xl z-50">
          <form onSubmit={handleEditColorSubmit} className="p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3">
              <div className="flex items-center gap-3">
                <div 
                  className="h-8 w-8 rounded-full border border-black/15 shadow-2xs flex-shrink-0"
                  style={{ backgroundColor: editHex }}
                />
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-[#241C15]">
                    Editar Bobina / Color
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D]">
                    Modifica el nombre y acabado visual
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenEditModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-xl hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Nombre */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Nombre del Filamento *
                </Label>
                <Input 
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  placeholder="Ej: Negro Carbón..."
                  required
                  autoFocus
                  className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-bold text-[#241C15] h-10"
                />
              </div>

              {/* Selector Visual de Color */}
              <div className="space-y-2.5 p-3.5 rounded-2xl bg-[#F8F6F2] border border-[#E2D9CC]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241C15]">Muestra Visual (HEX)</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="color"
                      value={editHex}
                      onChange={(e) => setEditHex(e.target.value)}
                      className="h-6 w-8 rounded-lg border border-[#E2D9CC] cursor-pointer"
                    />
                    <Input 
                      value={editHex}
                      onChange={(e) => setEditHex(e.target.value)}
                      className="w-20 h-6 text-xs font-mono font-bold bg-white border-[#E2D9CC] p-1 rounded-md text-center"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-1.5 pt-1">
                  {ALL_SWATCHES.slice(0, 18).map(sw => (
                    <button
                      key={sw.name}
                      type="button"
                      onClick={() => setEditHex(sw.hex)}
                      className={`h-7 w-7 rounded-full border shadow-2xs hover:scale-110 active:scale-95 transition-transform cursor-pointer mx-auto flex items-center justify-center ${
                        editHex === sw.hex ? 'ring-2 ring-[#A36F4C] ring-offset-1 border-black' : 'border-black/15'
                      }`}
                      style={{ backgroundColor: sw.hex }}
                      title={sw.name}
                    >
                      {editHex === sw.hex && <Check className="h-3 w-3 text-white drop-shadow" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Nota opcional */}
              <div className="space-y-1">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Nota de Producción (Opcional)
                </Label>
                <Input 
                  value={editNota}
                  onChange={(e) => setEditNota(e.target.value)}
                  placeholder="Ej: Lote #2, Bobina especial..."
                  className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9 text-[#241C15]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2D9CC]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenEditModal(false)}
                className="text-xs rounded-xl cursor-pointer"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================================= */}
      {/* 6. MODAL: DETALLE DE MODELOS Y PRODUCTOS FABRICADOS                       */}
      {/* ========================================================================= */}
      <Dialog open={openColorDetailsModal} onOpenChange={setOpenColorDetailsModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[580px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-3xl z-50">
          {selectedColorForDetails && (
            <div className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
              {/* Header */}
              <div className="px-5 sm:px-6 py-4 border-b border-[#E2D9CC] bg-[#FAF8F5] flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div 
                    className="h-9 w-9 rounded-full border border-black/15 shadow-xs flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: selectedColorForDetails.codigoHex }}
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge 
                        variant="outline" 
                        className={selectedColorForDetails.estado === 'DISPONIBLE'
                          ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold'
                          : 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] text-[10px] font-bold'
                        }
                      >
                        {selectedColorForDetails.estado === 'DISPONIBLE' ? '🟢 En Taller' : '🟡 En Restock'}
                      </Badge>
                      <span className="text-xs text-[#75695D] font-mono font-bold">
                        {selectedColorForDetails.rollos || 1} {selectedColorForDetails.rollos === 1 ? 'bobina' : 'bobinas'}
                      </span>
                    </div>
                    <DialogTitle className="text-base sm:text-lg font-black text-[#241C15] tracking-tight truncate max-w-[220px] sm:max-w-[340px]">
                      {selectedColorForDetails.nombreColor}
                    </DialogTitle>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenColorDetailsModal(false)}
                  className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-xl hover:bg-[#F4EFEA] transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
                {/* KPIs de Producción */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] text-center">
                    <span className="text-[10px] uppercase font-bold text-[#75695D] block truncate">
                      Total Piezas
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#241C15] font-mono block mt-0.5">
                      {selectedColorForDetails.totalProductosImpresos || 0}
                    </span>
                    <span className="text-[10px] text-[#75695D] truncate block">fabricadas</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] text-center">
                    <span className="text-[10px] uppercase font-bold text-[#75695D] block truncate">
                      Filamento Usado
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#A36F4C] font-mono block mt-0.5">
                      {(selectedColorForDetails.totalGramosConsumidos || 0).toLocaleString()} g
                    </span>
                    <span className="text-[10px] text-[#75695D] truncate block">consumidos</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] text-center">
                    <span className="text-[10px] uppercase font-bold text-[#75695D] block truncate">
                      Stock Restante
                    </span>
                    <span className="text-lg sm:text-xl font-black text-[#1E5E3A] font-mono block mt-0.5">
                      {(selectedColorForDetails.stockGramos || 0).toLocaleString()} g
                    </span>
                    <span className="text-[10px] text-[#75695D] truncate block">en taller</span>
                  </div>
                </div>

                {/* Lista de Modelos Fabricados */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#241C15] uppercase tracking-wider flex items-center gap-1.5">
                      <Package className="h-4 w-4 text-[#A36F4C]" />
                      Modelos Fabricados ({selectedColorForDetails.productosInvertidos?.length || 0})
                    </span>
                  </div>

                  {(!selectedColorForDetails.productosInvertidos || selectedColorForDetails.productosInvertidos.length === 0) ? (
                    <div className="p-6 rounded-2xl border border-dashed border-[#E2D9CC] bg-[#FAF8F5] text-center space-y-1.5">
                      <Package className="h-7 w-7 text-[#D4BEA7] mx-auto opacity-70" />
                      <p className="text-xs font-bold text-[#75695D]">
                        No hay productos registrados con este color todavía.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedColorForDetails.productosInvertidos.map((prod) => (
                        <div 
                          key={prod.productoId}
                          className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] hover:bg-[#FFFFFF] transition-all space-y-2 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs sm:text-sm font-bold text-[#241C15]">
                                  {prod.nombreModelo}
                                </span>
                                {prod.lineaCategoria && (
                                  <Badge variant="outline" className="text-[9px] px-2 py-0 bg-[#F5EBE1] text-[#A36F4C] border-[#E2D9CC]">
                                    {prod.lineaCategoria}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-[#75695D] block mt-0.5">
                                Peso: {prod.pesoGramosUnitario > 0 ? `${prod.pesoGramosUnitario}g c/u` : 'N/E'}
                              </span>
                            </div>

                            <div className="text-right flex-shrink-0">
                              <span className="text-xs font-black text-[#241C15] font-mono block">
                                {prod.totalUnidades} {prod.totalUnidades === 1 ? 'ud' : 'uds'}
                              </span>
                              <span className="text-xs font-bold text-[#A36F4C] font-mono">
                                {prod.totalGramos.toLocaleString()}g
                              </span>
                            </div>
                          </div>

                          {/* Mini Historial de Pedidos */}
                          {prod.ultimosPedidos && prod.ultimosPedidos.length > 0 && (
                            <div className="pt-2 border-t border-[#E2D9CC]/70 space-y-1">
                              <div className="space-y-1">
                                {prod.ultimosPedidos.slice(0, 3).map((ped, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-xs bg-white px-2 py-1 rounded-xl border border-[#E2D9CC]/60">
                                    <span className="text-[#241C15] font-medium truncate max-w-[140px] sm:max-w-[200px]">
                                      👤 {ped.cliente}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[10px] text-[#75695D] font-mono">
                                      <span>{ped.cantidad} un. ({ped.gramos}g)</span>
                                      <span>•</span>
                                      <span>{new Date(ped.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 sm:px-6 py-3 border-t border-[#E2D9CC] bg-[#FAF8F5] flex items-center justify-end flex-shrink-0">
                <Button
                  type="button"
                  onClick={() => setOpenColorDetailsModal(false)}
                  className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-4 rounded-xl cursor-pointer"
                >
                  Cerrar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
