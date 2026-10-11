'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  X, 
  Package, 
  PackageCheck, 
  Archive, 
  RotateCcw, 
  Pencil, 
  CopyPlus, 
  Share2, 
  Check, 
  Layers, 
  Clock, 
  Boxes, 
  Calculator, 
  Trash2, 
  ExternalLink, 
  ChevronDown, 
  LayoutGrid, 
  Table2, 
  Sparkles, 
  FileDown, 
  Dices, 
  Star,
  RefreshCw
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { 
  toggleEstadoProducto, 
  duplicarProducto, 
  deleteProducto,
  deleteModeloConVariantes,
  duplicarModeloConVariantes
} from '@/actions/productos'
import { syncBggProducts } from '@/actions/bgg'

import { 
  ProductsTableView, 
  groupProducts, 
  ProductGroupRow, 
  OrdenCatalogType 
} from './ProductsTableView'
import { ProductCardGrid } from './ProductCardGrid'
import { ProductFormModal } from './ProductFormModal'
import { ProductDetailsModal } from './ProductDetailsModal'

export interface ProductoItem {
  id: string
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioAmigos: number
  precioMercado: number
  precioComunidad?: number
  pesoGramos?: number
  activo: boolean
  stock?: number
  controlarStock?: boolean
  enOferta?: boolean
  precioOferta?: number | null
  porcentajeDescuento?: number | null
  imagenUrl?: string | null
  descripcionWeb?: string | null
  destacadoWeb?: boolean
  createdAt?: string
  updatedAt?: string
  negocio?: string
  bggId?: number | null
  bggRating?: any
  bggWeight?: any
  bggMinPlayers?: number | null
  bggMaxPlayers?: number | null
  bggPlaytime?: number | null
  editorialMarca?: string | null
  mecanicas?: string | null
  edadMinima?: number | null
  duracionMinutos?: number | null
  idioma?: string | null
  numJugadores?: string | null
  bulletPoint1?: string | null
  bulletPoint2?: string | null
  bulletPoint3?: string | null
  bulletPoint4?: string | null
}

export interface CategoriaItem {
  id: string
  nombre: string
  descripcion?: string
  totalProductos?: number
  createdAt?: string
  updatedAt?: string
}

interface CatalogoClientProps {
  productos: ProductoItem[]
  categoriasIniciales?: CategoriaItem[]
}

type EstadoFilter = 'TODOS' | 'ACTIVOS' | 'DESCONTINUADOS'
type StockFilter = 'TODOS' | 'EN_STOCK' | 'BAJO_STOCK' | 'AGOTADOS' | 'A_PEDIDO'
type ViewMode = 'cards' | 'table'

export function CatalogoClient({ 
  productos: initialProductos, 
  categoriasIniciales = [] 
}: CatalogoClientProps) {
  const router = useRouter()
  const [productos, setProductos] = useState<ProductoItem[]>(initialProductos)
  const [categorias, setCategorias] = useState<CategoriaItem[]>(categoriasIniciales)

  useEffect(() => {
    setProductos(initialProductos)
  }, [initialProductos])

  useEffect(() => {
    setCategorias(categoriasIniciales)
  }, [categoriasIniciales])

  // Preferencia de vista (Tarjetas vs Tabla) persistida en localStorage
  const [viewMode, setViewMode] = useState<ViewMode>('cards')
  useEffect(() => {
    const saved = localStorage.getItem('bg_catalogo_view_mode') as ViewMode | null
    if (saved === 'cards' || saved === 'table') {
      setViewMode(saved)
    }
  }, [])

  const handleToggleViewMode = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('bg_catalogo_view_mode', mode)
  }

  // Filtros de barra de herramientas
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODAS')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('TODOS')
  const [stockFilter, setStockFilter] = useState<StockFilter>('TODOS')
  const [ordenFilter, setOrdenFilter] = useState<OrdenCatalogType>('RECIENTES')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set())
  const [isSyncingBgg, setIsSyncingBgg] = useState(false)

  // Modales
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductoItem | null>(null)
  const [initialFormValues, setInitialFormValues] = useState<Partial<ProductoItem> | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<ProductGroupRow | null>(null)
  const [selectedSingleProduct, setSelectedSingleProduct] = useState<ProductoItem | null>(null)

  // Handlers para abrir modales
  const handleOpenCreate = () => {
    setEditingProduct(null)
    setInitialFormValues(null)
    setIsFormOpen(true)
  }

  const handleOpenEdit = (p: ProductoItem) => {
    setEditingProduct(p)
    setInitialFormValues(null)
    setIsFormOpen(true)
  }

  const handleOpenEditGroup = (group: ProductGroupRow) => {
    if (group.variants.length > 0) {
      setEditingProduct(group.variants[0].producto)
      setInitialFormValues(null)
      setIsFormOpen(true)
    }
  }

  const handleOpenAddEdition = (baseProduct: ProductoItem, baseName: string) => {
    setEditingProduct(null)
    setInitialFormValues({
      nombreModelo: baseName,
      lineaCategoria: baseProduct.lineaCategoria,
      editorialMarca: baseProduct.editorialMarca,
      idioma: baseProduct.idioma,
      numJugadores: baseProduct.numJugadores,
      duracionMinutos: baseProduct.duracionMinutos,
      edadMinima: baseProduct.edadMinima,
      mecanicas: baseProduct.mecanicas,
      bggId: baseProduct.bggId,
      bggRating: baseProduct.bggRating,
      costoBase: baseProduct.costoBase,
      precioMercado: baseProduct.precioMercado,
      precioAmigos: baseProduct.precioAmigos,
      imagenUrl: baseProduct.imagenUrl,
      descripcionWeb: baseProduct.descripcionWeb,
    })
    setIsDetailsOpen(false)
    setIsFormOpen(true)
  }

  const handleOpenDetail = (group?: ProductGroupRow, single?: ProductoItem) => {
    setSelectedGroup(group || null)
    setSelectedSingleProduct(single || null)
    setIsDetailsOpen(true)
  }

  const handleToggleExpand = (id: string) => {
    setExpandedParents((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Lista de categorías únicas
  const categoryNamesList = useMemo(() => {
    const set = new Set<string>()
    categorias.forEach((c) => set.add(c.nombre))
    productos.forEach((p) => {
      if (p.lineaCategoria) set.add(p.lineaCategoria.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  }, [categorias, productos])

  // KPIs
  const totalModelos = productos.length
  const activosCount = useMemo(() => productos.filter((p) => p.activo).length, [productos])
  const descontinuadosCount = useMemo(() => productos.filter((p) => !p.activo).length, [productos])
  const conStockCount = useMemo(() => productos.filter((p) => p.activo && (p.stock || 0) > 0).length, [productos])
  const bajoStockCount = useMemo(
    () => productos.filter((p) => p.activo && p.controlarStock && (p.stock || 0) > 0 && (p.stock || 0) <= 2).length,
    [productos]
  )
  const agotadosCount = useMemo(
    () => productos.filter((p) => p.activo && p.controlarStock && (p.stock || 0) <= 0).length,
    [productos]
  )
  const bggCount = useMemo(() => productos.filter((p) => p.bggId != null && Number(p.bggId) > 0).length, [productos])

  // Filtrado reactivo de productos
  const filteredProductos = useMemo(() => {
    let list = productos

    if (estadoFilter === 'ACTIVOS') {
      list = list.filter((p) => p.activo)
    } else if (estadoFilter === 'DESCONTINUADOS') {
      list = list.filter((p) => !p.activo)
    }

    if (stockFilter === 'EN_STOCK') {
      list = list.filter((p) => (p.stock || 0) > 0)
    } else if (stockFilter === 'BAJO_STOCK') {
      list = list.filter((p) => p.controlarStock && (p.stock || 0) > 0 && (p.stock || 0) <= 2)
    } else if (stockFilter === 'AGOTADOS') {
      list = list.filter((p) => p.controlarStock && (p.stock || 0) <= 0)
    } else if (stockFilter === 'A_PEDIDO') {
      list = list.filter((p) => !p.controlarStock)
    }

    if (categoriaFilter !== 'TODAS') {
      list = list.filter((p) => (p.lineaCategoria || '').toLowerCase() === categoriaFilter.toLowerCase())
    }

    if (search.trim()) {
      const q = search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      list = list.filter((p) => {
        const nombre = (p.nombreModelo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        const cat = (p.lineaCategoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        const bgg = p.bggId ? p.bggId.toString() : ''
        return nombre.includes(q) || cat.includes(q) || bgg.includes(q)
      })
    }

    // Ordenamiento
    return [...list].sort((a, b) => {
      if (ordenFilter === 'NOMBRE_ASC') {
        return a.nombreModelo.localeCompare(b.nombreModelo, 'es', { sensitivity: 'base' })
      }
      if (ordenFilter === 'NOMBRE_DESC') {
        return b.nombreModelo.localeCompare(a.nombreModelo, 'es', { sensitivity: 'base' })
      }
      if (ordenFilter === 'COSTO_ASC') {
        return a.costoBase - b.costoBase
      }
      if (ordenFilter === 'COSTO_DESC') {
        return b.costoBase - a.costoBase
      }
      if (ordenFilter === 'MARGEN_DESC') {
        const margA = a.costoBase > 0 ? (a.precioMercado - a.costoBase) / a.costoBase : 0
        const margB = b.costoBase > 0 ? (b.precioMercado - b.costoBase) / b.costoBase : 0
        return margB - margA
      }
      if (ordenFilter === 'BGG_RATING_DESC') {
        const ratA = a.bggRating ? Number(a.bggRating) : 0
        const ratB = b.bggRating ? Number(b.bggRating) : 0
        return ratB - ratA
      }
      // RECIENTES por defecto: Activos primero, luego orden por fecha o nombre
      if (a.activo && !b.activo) return -1
      if (!a.activo && b.activo) return 1
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    })
  }, [productos, estadoFilter, stockFilter, categoriaFilter, search, ordenFilter])

  // Agrupamiento estructurado para la tabla y tarjetas
  const groupedRows = useMemo(() => {
    return groupProducts(filteredProductos, productos)
  }, [filteredProductos, productos])

  // Formatters
  const formatCurrency = (val: number) =>
    `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const calcMargen = (precio: number, costo: number) => {
    if (costo <= 0) return precio > 0 ? '+100%' : '+0%'
    const margen = ((precio - costo) / costo) * 100
    return margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`
  }

  // Copiar cotización
  const handleCopiarCotizacion = (p: ProductoItem) => {
    const message = `🎲 *${p.nombreModelo}* - Precio: ${formatCurrency(p.precioMercado)}`
    navigator.clipboard.writeText(message)
    setCopiedId(p.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success(`Cotización de "${p.nombreModelo}" copiada`)
  }

  // Toggle Activo/Archivado
  const handleToggleEstado = async (p: ProductoItem) => {
    const nuevoEstado = !p.activo
    setProductos((prev) =>
      prev.map((item) => (item.id === p.id ? { ...item, activo: nuevoEstado } : item))
    )

    try {
      await toggleEstadoProducto(p.id)
      toast.success(`"${p.nombreModelo}" marcado como ${nuevoEstado ? 'Activo' : 'Archivado'}`)
    } catch (e: any) {
      toast.error('Error al cambiar estado: ' + e.message)
      setProductos((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, activo: !nuevoEstado } : item))
      )
    }
  }

  // Duplicar producto
  const handleDuplicar = async (p: ProductoItem) => {
    try {
      const duplicado = await duplicarProducto(p.id)
      setProductos((prev) => [duplicado, ...prev])
      toast.success(`Juego "${duplicado.nombreModelo}" duplicado`)
    } catch (e: any) {
      toast.error('Error al duplicar juego: ' + e.message)
    }
  }

  const handleDuplicarGroup = async (group: ProductGroupRow) => {
    try {
      const ids = group.variants.map((v) => v.producto.id)
      const dups = await duplicarModeloConVariantes(ids)
      setProductos((prev) => [...dups, ...prev])
      toast.success(`Grupo "${group.baseName}" duplicado (${dups.length} versiones)`)
    } catch (e: any) {
      toast.error('Error al duplicar grupo: ' + e.message)
    }
  }

  // Eliminar producto
  const handleDeleteProduct = async (p: ProductoItem) => {
    if (!confirm(`¿Estás seguro de eliminar o archivar "${p.nombreModelo}"?`)) return

    try {
      const res = await deleteProducto(p.id)
      if (res.discontinued) {
        setProductos((prev) =>
          prev.map((item) => (item.id === p.id ? { ...item, activo: false } : item))
        )
        toast.info(res.message)
      } else {
        setProductos((prev) => prev.filter((item) => item.id !== p.id))
        toast.success(res.message)
      }
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
    }
  }

  const handleDeleteGroup = async (group: ProductGroupRow) => {
    if (!confirm(`¿Estás seguro de eliminar el juego "${group.baseName}" y todas sus versiones?`)) return

    try {
      const ids = group.variants.map((v) => v.producto.id)
      const res = await deleteModeloConVariantes(ids)
      if (res.discontinuedIds.length > 0) {
        const discSet = new Set(res.discontinuedIds)
        setProductos((prev) =>
          prev.map((p) => (discSet.has(p.id) ? { ...p, activo: false } : p))
        )
      }
      if (res.deletedIds.length > 0) {
        const delSet = new Set(res.deletedIds)
        setProductos((prev) => prev.filter((p) => !delSet.has(p.id)))
      }
      toast.success(res.message)
    } catch (e: any) {
      toast.error('Error al eliminar grupo: ' + e.message)
    }
  }

  // Guardar en modal de formulario
  const handleProductSaved = (saved: ProductoItem) => {
    setProductos((prev) => {
      const exists = prev.some((p) => p.id === saved.id)
      if (exists) {
        return prev.map((p) => (p.id === saved.id ? saved : p))
      }
      return [saved, ...prev]
    })
  }

  // Sincronización masiva de BoardGameGeek
  const handleSyncBgg = async () => {
    const gamesWithBgg = productos.filter((p) => p.bggId && Number(p.bggId) > 0)
    if (gamesWithBgg.length === 0) {
      toast.info('No hay juegos con código BGG configurado')
      return
    }

    setIsSyncingBgg(true)
    toast.info(`Consultando ${gamesWithBgg.length} juegos en BGG...`)

    try {
      const targets = gamesWithBgg.map((p) => ({ id: p.id, bggId: Number(p.bggId) }))
      const result = await syncBggProducts(targets)

      if (!result.success) {
        throw new Error(result.error || 'Error al sincronizar con BGG')
      }

      const updates = result.updates || []

      if (updates.length > 0) {
        const updateMap = new Map(updates.map((u) => [u.id, u]))
        setProductos((prev) =>
          prev.map((p) => {
            const upd = updateMap.get(p.id)
            if (!upd) return p
            return {
              ...p,
              bggRating: upd.bggRating,
              bggWeight: upd.bggWeight,
              bggMinPlayers: upd.bggMinPlayers,
              bggMaxPlayers: upd.bggMaxPlayers,
              bggPlaytime: upd.bggPlaytime,
              imagenUrl: upd.imagenUrl || p.imagenUrl,
              numJugadores: upd.numJugadores || p.numJugadores,
              editorialMarca: upd.editorialMarca || p.editorialMarca,
              mecanicas: upd.mecanicas || p.mecanicas,
            }
          })
        )
        toast.success(`¡Éxito! ${updates.length} juegos actualizados desde BGG.`)
        router.refresh()
      } else {
        toast.warning('No se encontraron estadísticas para los IDs consultados en BGG.')
      }
    } catch (error: any) {
      console.error('Error en sincronización masiva BGG:', error)
      toast.error('Error al consultar BGG: ' + (error.message || 'Verifica tu conexión'))
    } finally {
      setIsSyncingBgg(false)
    }
  }

  // Exportar CSV
  const handleExportCsv = (onlyWithBgg: boolean = true) => {
    const target = onlyWithBgg ? productos.filter((p) => p.bggId && Number(p.bggId) > 0) : productos
    if (target.length === 0) {
      toast.info('No hay productos para exportar con ese criterio')
      return
    }

    const headers = ['id', 'bggId', 'nombreModelo', 'categoria', 'precioMercado', 'costoBase', 'stock']
    const rows = target.map((p) => [
      p.id,
      p.bggId ?? '',
      p.nombreModelo,
      p.lineaCategoria,
      p.precioMercado,
      p.costoBase,
      p.stock ?? 0,
    ])

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csvContent = [headers.join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\r\n')
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dateStr = new Date().toISOString().split('T')[0]
    link.href = url
    link.download = `catalogo_juegos_${onlyWithBgg ? 'bgg_' : ''}${dateStr}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success(`Exportados ${target.length} juegos (.csv)`)
  }

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. CABECERA & ACCIONES PRINCIPALES                                        */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
          <Link href="/catalogo" className="hover:text-primary transition-colors flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-primary" />
            <span>Catálogo</span>
          </Link>
          <span className="text-border">/</span>
          <span className="text-foreground font-bold">Catálogo de Juegos</span>
        </div>

        {/* Título & Acciones */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight flex items-center gap-2.5">
              <Boxes className="h-6 w-6 sm:h-7 sm:w-7 text-primary shrink-0" />
              <span>Catálogo de Juegos de Mesa</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              Administración de inventario, precios y especificaciones de BoardGameGeek
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Botón Sincronizar BGG */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSyncBgg}
              disabled={isSyncingBgg || bggCount === 0}
              className="gap-1.5 text-xs font-bold rounded-xl bg-card hover:bg-secondary border-border cursor-pointer shadow-xs"
              title="Actualiza ratings y especificaciones de todos los juegos con ID de BGG"
            >
              {isSyncingBgg ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span>Sincronizando BGG...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Sincronizar BGG ({bggCount})</span>
                </>
              )}
            </Button>

            {/* Dropdown Exportar CSV */}
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center gap-1.5 text-xs font-bold rounded-xl bg-card hover:bg-secondary border border-border px-3 py-1.5 cursor-pointer shadow-xs text-foreground transition-colors outline-none">
                <FileDown className="h-3.5 w-3.5 text-primary" />
                <span>Exportar</span>
                <ChevronDown className="h-3 w-3 opacity-60" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-card border border-border rounded-xl shadow-lg p-1">
                <DropdownMenuItem
                  onClick={() => handleExportCsv(true)}
                  className="text-xs font-medium px-2.5 py-2 rounded-lg cursor-pointer hover:bg-secondary"
                >
                  <span>Solo con código BGG ({bggCount})</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleExportCsv(false)}
                  className="text-xs font-medium px-2.5 py-2 rounded-lg cursor-pointer hover:bg-secondary"
                >
                  <span>Catálogo completo ({totalModelos})</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botón Nuevo Juego */}
            <Button
              type="button"
              size="sm"
              onClick={handleOpenCreate}
              className="gap-1.5 text-xs font-bold rounded-xl shadow-sm cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Juego</span>
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. KPI CARDS                                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Juegos */}
        <div className="bg-card border border-border p-3 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
            Total Juegos
          </span>
          <span className="text-xl font-black text-foreground block font-mono">
            {totalModelos}
          </span>
          <span className="text-[10px] text-muted-foreground block">En catálogo</span>
        </div>

        {/* Activos */}
        <div className="bg-card border border-border p-3 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider block">
            Activos
          </span>
          <span className="text-xl font-black text-emerald-800 dark:text-emerald-300 block font-mono">
            {activosCount}
          </span>
          <span className="text-[10px] text-muted-foreground block">Listados para venta</span>
        </div>

        {/* Con Stock */}
        <div className="bg-card border border-border p-3 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
            Con Stock
          </span>
          <span className="text-xl font-black text-primary block font-mono">
            {conStockCount}
          </span>
          <span className="text-[10px] text-muted-foreground block">Disponibles</span>
        </div>

        {/* Bajo Stock */}
        <div className="bg-card border border-border p-3 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider block">
            Bajo Stock
          </span>
          <span className="text-xl font-black text-amber-800 dark:text-amber-300 block font-mono">
            {bajoStockCount}
          </span>
          <span className="text-[10px] text-muted-foreground block">≤ 2 unidades</span>
        </div>

        {/* Agotados */}
        <div className="bg-card border border-border p-3 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wider block">
            Agotados
          </span>
          <span className="text-xl font-black text-rose-700 dark:text-rose-300 block font-mono">
            {agotadosCount}
          </span>
          <span className="text-[10px] text-muted-foreground block">0 unidades</span>
        </div>

        {/* Con BGG ID */}
        <div className="bg-card border border-border p-3 rounded-2xl shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
            Con BGG
          </span>
          <span className="text-xl font-black text-foreground block font-mono">
            {bggCount}
          </span>
          <span className="text-[10px] text-muted-foreground block">Con ficha enlazada</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. TOOLBAR & BARRA DE FILTROS                                             */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border p-4 rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Lado Izquierdo: Buscador + Filtros */}
          <div className="flex flex-1 items-center gap-2.5 flex-wrap">
            {/* Buscador */}
            <div className="relative min-w-[200px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por juego, categoría o #BGG..."
                className="pl-9 pr-8 h-10 text-xs rounded-xl bg-secondary/30 border-border"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Categoría */}
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="h-10 px-3 bg-secondary/30 border border-border text-xs font-bold text-foreground rounded-xl focus:border-primary cursor-pointer min-w-[130px]"
            >
              <option value="TODAS">Todas las Categorías</option>
              {categoryNamesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Stock */}
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as StockFilter)}
              className="h-10 px-3 bg-secondary/30 border border-border text-xs font-bold text-foreground rounded-xl focus:border-primary cursor-pointer min-w-[130px]"
            >
              <option value="TODOS">Todos los Stocks</option>
              <option value="EN_STOCK">Con Stock ({conStockCount})</option>
              <option value="BAJO_STOCK">Bajo Stock (≤2) ({bajoStockCount})</option>
              <option value="AGOTADOS">Agotados (0) ({agotadosCount})</option>
              <option value="A_PEDIDO">A Pedido</option>
            </select>
          </div>

          {/* Lado Derecho: Toggle de Estado & Selector de Vista (Tarjetas vs Tabla) */}
          <div className="flex items-center gap-3 justify-between lg:justify-end flex-wrap">
            {/* Segmented Control Estado */}
            <div className="bg-secondary/40 p-1 rounded-xl border border-border flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setEstadoFilter('TODOS')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  estadoFilter === 'TODOS'
                    ? 'bg-card text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Todos ({totalModelos})
              </button>
              <button
                type="button"
                onClick={() => setEstadoFilter('ACTIVOS')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  estadoFilter === 'ACTIVOS'
                    ? 'bg-card text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                <span>Activos ({activosCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setEstadoFilter('DESCONTINUADOS')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  estadoFilter === 'DESCONTINUADOS'
                    ? 'bg-card text-muted-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Archivados ({descontinuadosCount})
              </button>
            </div>

            {/* Alternador de Vista (Tarjetas vs Tabla) */}
            <div className="bg-secondary/40 p-1 rounded-xl border border-border flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => handleToggleViewMode('cards')}
                className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'cards'
                    ? 'bg-card text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista en Tarjetas"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tarjetas</span>
              </button>

              <button
                type="button"
                onClick={() => handleToggleViewMode('table')}
                className={`h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-card text-primary shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Vista en Tabla"
              >
                <Table2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tabla</span>
              </button>
            </div>
          </div>
        </div>

        {/* Resumen de Filtros Activos & Reset */}
        {(search || estadoFilter !== 'TODOS' || categoriaFilter !== 'TODAS' || stockFilter !== 'TODOS') && (
          <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs text-muted-foreground">
            <div className="flex items-center gap-2 flex-wrap">
              <span>Mostrando:</span>
              <span className="font-bold text-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
                {filteredProductos.length} {filteredProductos.length === 1 ? 'juego' : 'juegos'}
              </span>
              {search && <span>para &ldquo;<strong className="text-foreground">{search}</strong>&rdquo;</span>}
              {categoriaFilter !== 'TODAS' && <span>en <strong className="text-foreground">{categoriaFilter}</strong></span>}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setEstadoFilter('TODOS')
                setCategoriaFilter('TODAS')
                setStockFilter('TODOS')
              }}
              className="text-xs text-primary hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. RENDER DE VISTA HÍBRIDA (CARDS vs TABLA)                               */}
      {/* ========================================================================= */}
      {viewMode === 'cards' ? (
        <ProductCardGrid
          rows={groupedRows}
          onViewDetail={handleOpenDetail}
          onEdit={handleOpenEdit}
          onEditGroup={handleOpenEditGroup}
          onDuplicar={handleDuplicar}
          onDuplicarGroup={handleDuplicarGroup}
          onDeleteProduct={handleDeleteProduct}
          onDeleteGroup={handleDeleteGroup}
          onToggleEstado={handleToggleEstado}
          onCopiarCotizacion={handleCopiarCotizacion}
          formatCurrency={formatCurrency}
          calcMargen={calcMargen}
          copiedId={copiedId}
        />
      ) : (
        <ProductsTableView
          rows={groupedRows}
          productos={filteredProductos}
          allCatalogProductos={productos}
          expandedParents={expandedParents}
          onToggleExpand={handleToggleExpand}
          onViewDetail={handleOpenDetail}
          onEdit={handleOpenEdit}
          onEditGroup={handleOpenEditGroup}
          onCopiarCotizacion={handleCopiarCotizacion}
          onToggleEstado={handleToggleEstado}
          onDuplicar={handleDuplicar}
          onDuplicarGroup={handleDuplicarGroup}
          onDeleteProduct={handleDeleteProduct}
          onDeleteGroup={handleDeleteGroup}
          copiedId={copiedId}
          formatCurrency={formatCurrency}
          calcMargen={calcMargen}
          ordenFilter={ordenFilter}
          onOrdenFilterChange={setOrdenFilter}
        />
      )}

      {/* ========================================================================= */}
      {/* 5. MODALES                                                                */}
      {/* ========================================================================= */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false)
          setInitialFormValues(null)
        }}
        onSaved={handleProductSaved}
        editingProduct={editingProduct}
        initialValues={initialFormValues}
        categoryNamesList={categoryNamesList}
      />

      <ProductDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        group={selectedGroup}
        singleProduct={selectedSingleProduct}
        onEdit={(prodToEdit?: ProductoItem) => {
          setIsDetailsOpen(false)
          if (prodToEdit) {
            handleOpenEdit(prodToEdit)
          } else if (selectedGroup && selectedGroup.variants.length > 0) {
            handleOpenEdit(selectedGroup.variants[0].producto)
          } else if (selectedSingleProduct) {
            handleOpenEdit(selectedSingleProduct)
          }
        }}
        onAddEdition={handleOpenAddEdition}
        formatCurrency={formatCurrency}
        calcMargen={calcMargen}
      />
    </div>
  )
}
