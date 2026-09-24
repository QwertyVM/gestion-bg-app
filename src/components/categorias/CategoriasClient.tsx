'use client'

import { useState, useMemo, useTransition } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  X, 
  Folder, 
  Layers, 
  Package, 
  PackageCheck, 
  AlertTriangle, 
  Pencil, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  Tag, 
  Check, 
  Boxes, 
  ArrowRight,
  FolderPlus
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  CategoriaItem, 
  createCategoria, 
  updateCategoria, 
  deleteCategoria 
} from '@/actions/categorias'

interface CategoriasClientProps {
  categoriasIniciales: CategoriaItem[]
}

type FilterTab = 'todas' | 'con_modelos' | 'vacias'

export function CategoriasClient({ categoriasIniciales }: CategoriasClientProps) {
  const [categorias, setCategorias] = useState<CategoriaItem[]>(categoriasIniciales)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<FilterTab>('todas')
  const [expandedCatIds, setExpandedCatIds] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  // Modal State (Crear / Editar)
  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Top KPIs calculations
  const totalRegistradas = categorias.length
  const conModelosCount = useMemo(() => categorias.filter(c => c.totalProductos > 0).length, [categorias])
  const vaciasCount = useMemo(() => categorias.filter(c => c.totalProductos === 0).length, [categorias])
  const totalModelosSum = useMemo(() => categorias.reduce((sum, c) => sum + c.totalProductos, 0), [categorias])

  // Filtered categories
  const filteredCategorias = useMemo(() => {
    let list = categorias

    if (activeTab === 'con_modelos') {
      list = list.filter(c => c.totalProductos > 0)
    } else if (activeTab === 'vacias') {
      list = list.filter(c => c.totalProductos === 0)
    }

    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(c => 
        c.nombre.toLowerCase().includes(q) ||
        c.descripcion.toLowerCase().includes(q) ||
        c.productos.some(p => p.nombreModelo.toLowerCase().includes(q))
      )
    }

    return list.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }))
  }, [categorias, activeTab, search])

  // Toggle Accordion inline
  const toggleExpand = (id: string) => {
    setExpandedCatIds(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({ nombre: '', descripcion: '' })
    setOpenModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (cat: CategoriaItem) => {
    setEditingId(cat.id)
    setFormData({
      nombre: cat.nombre,
      descripcion: cat.descripcion || ''
    })
    setOpenModal(true)
  }

  // Submit Modal
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const cleanNombre = formData.nombre.trim()
    if (!cleanNombre) {
      toast.error('El nombre de la categoría es obligatorio')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingId) {
        // Actualizar
        const updated = await updateCategoria(editingId, {
          nombre: cleanNombre,
          descripcion: formData.descripcion.trim() || undefined
        })

        setCategorias(prev => prev.map(c => c.id === editingId ? updated : c))
        toast.success(`Categoría "${cleanNombre}" actualizada correctamente`)
      } else {
        // Crear
        const created = await createCategoria({
          nombre: cleanNombre,
          descripcion: formData.descripcion.trim() || undefined
        })

        setCategorias(prev => [...prev, created])
        toast.success(`Categoría "${cleanNombre}" creada exitosamente`)
      }

      setOpenModal(false)
      setFormData({ nombre: '', descripcion: '' })
      setEditingId(null)
    } catch (err: any) {
      toast.error(err.message || 'Ocurrió un error al guardar la categoría')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Category
  const handleDelete = async (cat: CategoriaItem) => {
    if (cat.totalProductos > 0) {
      toast.error(`No puedes eliminar "${cat.nombre}" porque tiene ${cat.totalProductos} modelo(s) vinculado(s).`)
      return
    }

    if (!confirm(`¿Estás seguro de eliminar la categoría vacía "${cat.nombre}"?`)) {
      return
    }

    // Optimistic removal
    setCategorias(prev => prev.filter(c => c.id !== cat.id))

    try {
      await deleteCategoria(cat.id)
      toast.success(`Categoría "${cat.nombre}" eliminada`)
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar')
      setCategorias(prev => [...prev, cat])
    }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 animate-in fade-in duration-200 px-1 sm:px-2 pb-16">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA Y BARRA DE ACCIONES                                           */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Breadcrumb Contextual */}
        <div className="flex items-center gap-1.5 text-xs text-[#75695D] font-medium">
          <Link href="/catalogo" className="hover:text-[#A36F4C] transition-colors flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>Catálogo</span>
          </Link>
          <span className="text-[#D4BEA7]">/</span>
          <span className="text-[#241C15] font-bold">Categorías de Productos</span>
        </div>

        {/* Título & Botones de Acción */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#241C15] tracking-tight flex items-center gap-2.5">
              <Layers className="h-6 w-6 sm:h-7 sm:w-7 text-[#A36F4C] flex-shrink-0" />
              <span>Gestión de Categorías</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#75695D] mt-1">
              Organización y familias de modelos 3D del taller.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Botón Ver Productos */}
            <Link
              href="/catalogo"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#241C15] border border-[#E2D9CC] shadow-2xs transition-all cursor-pointer flex-1 sm:flex-initial justify-center"
            >
              <Package className="h-4 w-4 text-[#A36F4C]" />
              <span>Ver Productos ({totalModelosSum})</span>
            </Link>

            {/* Botón Nueva Categoría */}
            <Button
              type="button"
              onClick={handleOpenCreate}
              className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98] flex-1 sm:flex-initial flex items-center gap-2 justify-center"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Nueva Categoría</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. FILA SUPERIOR DE KPIS (GRID 3 COLUMNAS MINIMALISTA)                    */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Tarjeta 1: Categorías Registradas */}
          <div className="p-4 rounded-2xl bg-white border border-[#E2D9CC] flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">
                Categorías Registradas
              </span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
                <Folder className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
                {totalRegistradas} <span className="text-xs font-normal font-sans text-[#75695D]">familias</span>
              </div>
              <span className="text-xs text-[#75695D] mt-0.5 block">
                {totalModelosSum} modelos 3D distribuidos
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Con Productos Asignados */}
          <div 
            onClick={() => setActiveTab('con_modelos')}
            className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs cursor-pointer transition-all ${
              activeTab === 'con_modelos'
                ? 'bg-white border-[#1E5E3A] ring-1 ring-[#1E5E3A]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">
                Con Productos Asignados
              </span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
                <PackageCheck className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#1E5E3A] font-mono tabular-nums">
                {conModelosCount} <span className="text-xs font-normal font-sans text-[#75695D]">categorías</span>
              </div>
              <span className="text-xs text-[#1E5E3A] font-medium mt-0.5 block">
                Catálogo activo y con modelos
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Categorías Vacías */}
          <div 
            onClick={() => setActiveTab('vacias')}
            className={`p-4 rounded-2xl border flex flex-col justify-between shadow-xs cursor-pointer transition-all ${
              activeTab === 'vacias'
                ? 'bg-white border-[#854D0E] ring-1 ring-[#854D0E]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">
                Categorías Vacías
              </span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#854D0E]">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
                {vaciasCount} <span className="text-xs font-normal font-sans text-[#75695D]">sin modelos</span>
              </div>
              <span className="text-xs text-[#75695D] mt-0.5 block">
                {vaciasCount > 0 ? 'Sin productos asignados' : 'Todas tienen productos'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE BÚSQUEDA Y FILTROS RÁPIDOS (SINGLE-ROW TOOLBAR)               */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          
          {/* Lado Izquierdo: Buscador */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
            <Input 
              placeholder="Buscar categoría o palabra clave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-8 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs sm:text-sm rounded-2xl h-10 focus:border-[#A36F4C] focus:bg-[#FFFFFF] transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-1 rounded-md cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Lado Derecho: Segmented Control */}
          <div className="bg-[#EAE4DC] p-1 rounded-2xl border border-[#D4BEA7] flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('todas')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'todas'
                  ? 'bg-[#FFFFFF] text-[#241C15] shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
              }`}
            >
              <span>Todas</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#FAF8F5] rounded-md text-[#75695D]">
                {categorias.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('con_modelos')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'con_modelos'
                  ? 'bg-[#FFFFFF] text-[#1E5E3A] shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
              }`}
            >
              <span className="h-2 w-2 rounded-full bg-[#1E5E3A]" />
              <span>Con Modelos</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#EBF7EE] text-[#1E5E3A] rounded-md font-bold">
                {conModelosCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vacias')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'vacias'
                  ? 'bg-[#FEF9C3] text-[#854D0E] border border-[#FDE047] shadow-xs'
                  : 'text-[#75695D] hover:text-[#854D0E] hover:bg-[#FFFFFF]/40'
              }`}
            >
              <AlertTriangle className="h-3 w-3 text-[#854D0E]" />
              <span>Vacías</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#FEF08A] text-[#854D0E] rounded-md font-bold">
                {vaciasCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. LISTADO INTELIGENTE DE CATEGORÍAS (EXPANDABLE CARD LAYOUT)             */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        {filteredCategorias.length === 0 ? (
          <div className="p-12 text-center bg-[#FFFFFF] rounded-3xl border border-dashed border-[#E2D9CC] shadow-xs space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F5EBE1] text-[#A36F4C] flex items-center justify-center mx-auto">
              <Folder className="h-6 w-6" />
            </div>
            <p className="text-sm font-black text-[#241C15]">
              {search ? 'No se encontraron categorías con ese término' : 'No hay categorías en esta vista'}
            </p>
            <p className="text-xs text-[#75695D] max-w-sm mx-auto">
              Crea una nueva categoría para organizar tus modelos 3D o limpia los filtros de búsqueda.
            </p>
            <Button
              type="button"
              onClick={handleOpenCreate}
              className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs h-9 px-4 rounded-xl cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Nueva Categoría
            </Button>
          </div>
        ) : (
          filteredCategorias.map((cat) => {
            const isExpanded = Boolean(expandedCatIds[cat.id])
            const hasProducts = cat.totalProductos > 0

            return (
              <div
                key={cat.id}
                className={`bg-[#FFFFFF] border rounded-3xl transition-all duration-200 shadow-2xs overflow-hidden ${
                  isExpanded ? 'border-[#A36F4C]/60 ring-1 ring-[#A36F4C]/20 shadow-md' : 'border-[#E2D9CC] hover:border-[#D4BEA7]'
                }`}
              >
                {/* Fila Principal de la Categoría */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
                  
                  {/* Lado Izquierdo: Icono + Nombre + Descripción */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                    {/* Icono temático de carpeta */}
                    <div className="h-11 w-11 rounded-2xl bg-[#F4EFEA] border border-[#E2D9CC] text-[#A36F4C] flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Folder className="h-5 w-5 stroke-[2.2]" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-base sm:text-lg text-[#241C15] tracking-tight truncate">
                          {cat.nombre}
                        </span>

                        {/* Estado si está vacía */}
                        {!hasProducts && (
                          <span className="text-[10px] font-bold text-[#854D0E] bg-[#FEF9C3] border border-[#FDE047] px-2 py-0.5 rounded-lg flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3 text-[#854D0E]" />
                            <span>Sin modelos vinculados</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-[#75695D] line-clamp-2">
                        {cat.descripcion || 'Sin descripción detallada para esta familia de productos.'}
                      </p>
                    </div>
                  </div>

                  {/* Lado Derecho: Contador Interactivo + Acciones */}
                  <div className="flex items-center gap-2 sm:gap-3 self-end md:self-auto flex-wrap sm:flex-nowrap">
                    
                    {/* Chip interactivo de modelos con chevron expandible */}
                    {hasProducts ? (
                      <button
                        type="button"
                        onClick={() => toggleExpand(cat.id)}
                        className={`h-9 px-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                          isExpanded
                            ? 'bg-[#A36F4C] text-white border-[#A36F4C]'
                            : 'bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#241C15] border-[#E2D9CC]'
                        }`}
                        title="Clic para ver modelos pertenecientes a esta categoría"
                      >
                        <Package className="h-3.5 w-3.5 text-[#A36F4C]" />
                        <span className="font-mono">{cat.totalProductos}</span>
                        <span>{cat.totalProductos === 1 ? 'modelo' : 'modelos'}</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    ) : (
                      <span className="h-9 px-3 rounded-xl border border-[#E2D9CC] bg-[#FAF8F5] text-[#75695D] text-xs font-bold flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5 text-[#75695D]" />
                        <span>0 modelos</span>
                      </span>
                    )}

                    {/* Botón Editar */}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(cat)}
                      className="h-9 px-3 rounded-xl border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#241C15] font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title={`Editar categoría "${cat.nombre}"`}
                    >
                      <Pencil className="h-3.5 w-3.5 text-[#75695D]" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      disabled={hasProducts}
                      onClick={() => handleDelete(cat)}
                      className={`h-9 w-9 flex items-center justify-center rounded-xl border transition-colors ${
                        hasProducts
                          ? 'border-[#E2D9CC]/50 bg-[#FAF8F5] text-[#75695D]/40 cursor-not-allowed'
                          : 'border-[#E2D9CC] bg-white text-[#75695D] hover:text-[#DC2626] hover:bg-red-50 hover:border-red-200 cursor-pointer shadow-2xs'
                      }`}
                      title={
                        hasProducts
                          ? `No puedes eliminar esta categoría porque tiene ${cat.totalProductos} modelo(s) asignado(s)`
                          : `Eliminar categoría vacía "${cat.nombre}"`
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Área Expandida (Acordeón de Productos Vinculados) */}
                {isExpanded && hasProducts && (
                  <div className="bg-[#FAF8F5] border-t border-[#E2D9CC] p-4 sm:p-5 animate-in slide-in-from-top-2 duration-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#75695D] uppercase tracking-wider flex items-center gap-1.5">
                        <Boxes className="h-4 w-4 text-[#A36F4C]" />
                        Modelos 3D en esta categoría ({cat.productos.length})
                      </span>
                      <Link
                        href={`/catalogo?categoria=${encodeURIComponent(cat.nombre)}`}
                        className="text-xs font-bold text-[#A36F4C] hover:underline flex items-center gap-1"
                      >
                        <span>Abrir en catálogo</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                      {cat.productos.map((prod) => (
                        <div
                          key={prod.id}
                          className="p-3 rounded-2xl bg-[#FFFFFF] border border-[#E2D9CC] hover:border-[#A36F4C]/40 transition-all shadow-2xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="font-bold text-xs text-[#241C15] truncate flex-1" title={prod.nombreModelo}>
                              {prod.nombreModelo}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-[#1E5E3A] shrink-0">
                              S/ {prod.precioMercado.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-[#75695D] pt-1 border-t border-[#E2D9CC]/60 font-mono">
                            <span>Costo: S/ {prod.costoBase.toFixed(2)}</span>
                            <span>{prod.pesoGramos && prod.pesoGramos > 0 ? `${prod.pesoGramos}g` : 'Peso N/E'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: CREAR / EDITAR CATEGORÍA                                        */}
      {/* ========================================================================= */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[460px] max-h-[90dvh] overflow-y-auto p-0 rounded-3xl shadow-2xl z-50">
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            
            {/* Header del Modal */}
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  {editingId ? <Pencil className="h-5 w-5" /> : <FolderPlus className="h-5 w-5" />}
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-[#241C15]">
                    {editingId ? 'Editar Categoría' : 'Nueva Categoría de Productos'}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                    {editingId ? 'Modifica el nombre y descripción de la familia' : 'Define una nueva familia para organizar modelos 3D'}
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-xl hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Campos del Formulario */}
            <div className="space-y-4">
              {/* Nombre de la categoría */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Nombre de la Categoría *
                </Label>
                <Input 
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Macetas & Jardín, Figuras Articuladas, Llaveros..."
                  required
                  autoFocus
                  className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-bold text-[#241C15] h-10 focus:border-[#A36F4C] focus:bg-white"
                />
              </div>

              {/* Descripción */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Descripción (Opcional)
                </Label>
                <textarea
                  rows={3}
                  value={formData.descripcion}
                  onChange={(e) => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Breve resumen de los tipos de modelos o características de esta categoría..."
                  className="w-full bg-[#F8F6F2] border border-[#E2D9CC] rounded-2xl text-xs sm:text-sm p-3 text-[#241C15] placeholder:text-[#75695D] focus:border-[#A36F4C] focus:bg-white focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Footer con Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-3.5 border-t border-[#E2D9CC]">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setOpenModal(false)}
                className="text-xs rounded-xl cursor-pointer text-[#75695D] hover:text-[#241C15]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-5 rounded-xl cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Categoría'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
