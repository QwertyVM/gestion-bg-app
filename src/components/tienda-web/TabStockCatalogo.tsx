'use client'

import React, { useState, useMemo } from 'react'
import {
  ProductoStoreConfigItem,
  updateProductoStoreConfig,
  bulkUpdateStockOfertas,
} from '@/actions/tienda'
import { TipoNegocio } from '@/lib/business'
import {
  Package,
  Search,
  Filter,
  Tag,
  Percent,
  Sparkles,
  Edit3,
  Check,
  AlertTriangle,
  Flame,
  ArrowUpDown,
  ExternalLink,
  Layers,
  X,
  Save,
  CheckCircle2,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'

interface TabStockCatalogoProps {
  negocio: TipoNegocio
  productos: ProductoStoreConfigItem[]
  onRefresh: () => void
}

const BADGE_PRESETS = [
  '20% OFF',
  '30% OFF',
  'MÁS VENDIDO',
  'OFERTA RELÁMPAGO',
  'NOVEDAD 2026',
  'EDICIÓN LIMITADA',
  'TOP CALIDAD',
  'LIQUIDACIÓN',
]

export function TabStockCatalogo({ negocio, productos, onRefresh }: TabStockCatalogoProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('TODAS')
  const [statusFilter, setStatusFilter] = useState<'TODOS' | 'EN_OFERTA' | 'CON_STOCK' | 'SIN_STOCK' | 'DESTACADOS'>('TODOS')

  // Quick edit modal
  const [editingProduct, setEditingProduct] = useState<ProductoStoreConfigItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit form state
  const [stock, setStock] = useState(0)
  const [controlarStock, setControlarStock] = useState(false)
  const [enOferta, setEnOferta] = useState(false)
  const [porcentajeDescuento, setPorcentajeDescuento] = useState(0)
  const [precioOferta, setPrecioOferta] = useState<number | ''>('')
  const [badgePromocion, setBadgePromocion] = useState('')
  const [destacadoWeb, setDestacadoWeb] = useState(false)
  const [imagenUrl, setImagenUrl] = useState('')
  const [descripcionWeb, setDescripcionWeb] = useState('')
  const [activo, setActivo] = useState(true)

  // Categories list
  const categories = useMemo(() => {
    const list = Array.from(new Set(productos.map((p) => p.lineaCategoria?.trim()).filter(Boolean)))
    list.sort()
    return list
  }, [productos])

  // Filtered products
  const filteredProducts = useMemo(() => {
    return productos.filter((p) => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase()
        const matchesName = p.nombreModelo.toLowerCase().includes(query)
        const matchesCat = p.lineaCategoria.toLowerCase().includes(query)
        const matchesBadge = p.badgePromocion.toLowerCase().includes(query)
        if (!matchesName && !matchesCat && !matchesBadge) return false
      }

      // Category
      if (categoryFilter !== 'TODAS' && p.lineaCategoria !== categoryFilter) {
        return false
      }

      // Status
      if (statusFilter === 'EN_OFERTA' && !p.enOferta) return false
      if (statusFilter === 'CON_STOCK' && p.controlarStock && p.stock <= 0) return false
      if (statusFilter === 'SIN_STOCK' && (!p.controlarStock || p.stock > 0)) return false
      if (statusFilter === 'DESTACADOS' && !p.destacadoWeb) return false

      return true
    })
  }, [productos, searchTerm, categoryFilter, statusFilter])

  // Metrics
  const totalEnOferta = productos.filter((p) => p.enOferta).length
  const totalSinStock = productos.filter((p) => p.controlarStock && p.stock <= 0).length
  const totalDestacados = productos.filter((p) => p.destacadoWeb).length

  const handleOpenEdit = (p: ProductoStoreConfigItem) => {
    setEditingProduct(p)
    setStock(p.stock)
    setControlarStock(p.controlarStock)
    setEnOferta(p.enOferta)
    setPorcentajeDescuento(p.porcentajeDescuento)
    setPrecioOferta(p.precioOferta !== null ? p.precioOferta : '')
    setBadgePromocion(p.badgePromocion || '')
    setDestacadoWeb(p.destacadoWeb)
    setImagenUrl(p.imagenUrl || '')
    setDescripcionWeb(p.descripcionWeb || '')
    setActivo(p.activo)
  }

  // Handle auto-calculating offer price when discount % changes
  const handleDiscountPercentChange = (pct: number) => {
    setPorcentajeDescuento(pct)
    if (editingProduct && pct > 0) {
      const calcPrice = Number((editingProduct.precioMercado * (1 - pct / 100)).toFixed(2))
      setPrecioOferta(calcPrice)
      if (!badgePromocion) {
        setBadgePromocion(`${pct}% OFF`)
      }
    }
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingProduct) return

    setIsSubmitting(true)
    try {
      await updateProductoStoreConfig(editingProduct.id, {
        stock,
        controlarStock,
        enOferta,
        porcentajeDescuento,
        precioOferta: precioOferta === '' ? null : Number(precioOferta),
        badgePromocion,
        destacadoWeb,
        imagenUrl,
        descripcionWeb,
        activo,
      })

      toast.success(`Producto "${editingProduct.nombreModelo}" actualizado exitosamente`)
      setEditingProduct(null)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar configuración del producto')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleQuickToggleOferta = async (p: ProductoStoreConfigItem) => {
    try {
      const nextEnOferta = !p.enOferta
      const defaultDiscount = nextEnOferta ? (p.porcentajeDescuento > 0 ? p.porcentajeDescuento : 15) : 0
      const defaultPrice = nextEnOferta
        ? Number((p.precioMercado * (1 - defaultDiscount / 100)).toFixed(2))
        : null

      await updateProductoStoreConfig(p.id, {
        enOferta: nextEnOferta,
        porcentajeDescuento: defaultDiscount,
        precioOferta: defaultPrice,
        badgePromocion: nextEnOferta ? `${defaultDiscount}% OFF` : '',
      })

      toast.success(
        nextEnOferta
          ? `Oferta activada (${defaultDiscount}% OFF) para "${p.nombreModelo}"`
          : `Oferta desactivada para "${p.nombreModelo}"`
      )
      onRefresh()
    } catch (error: any) {
      toast.error('Error al actualizar oferta')
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. TOP METRICS SUMMARY */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-2xl border border-[#E2D9CC] shadow-xs">
          <p className="text-[11px] text-[#75695D] font-medium uppercase tracking-wider">
            Total Productos Web
          </p>
          <p className="text-xl sm:text-2xl font-black text-[#241C15] mt-1">{productos.length}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2D9CC] shadow-xs">
          <p className="text-[11px] text-[#75695D] font-medium uppercase tracking-wider">
            En Oferta Especial
          </p>
          <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{totalEnOferta}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2D9CC] shadow-xs">
          <p className="text-[11px] text-[#75695D] font-medium uppercase tracking-wider">
            Destacados Web
          </p>
          <p className="text-xl sm:text-2xl font-black text-blue-600 mt-1">{totalDestacados}</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E2D9CC] shadow-xs">
          <p className="text-[11px] text-[#75695D] font-medium uppercase tracking-wider">
            Agotados / Sin Stock
          </p>
          <p className="text-xl sm:text-2xl font-black text-red-600 mt-1">{totalSinStock}</p>
        </div>
      </div>

      {/* 2. FILTERS & SEARCH */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2D9CC] shadow-xs space-y-3.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#75695D] absolute left-3.5 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por modelo, categoría o badge..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Category selector */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] text-[#241C15] font-medium focus:outline-none cursor-pointer"
            >
              <option value="TODAS">Todas las Categorías ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Status pills */}
            <div className="flex items-center bg-[#F8F6F2] p-1 rounded-xl border border-[#E2D9CC] text-xs">
              {(['TODOS', 'EN_OFERTA', 'CON_STOCK', 'SIN_STOCK', 'DESTACADOS'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer text-[11px] ${
                    statusFilter === st
                      ? 'bg-white text-[#241C15] shadow-xs'
                      : 'text-[#75695D] hover:text-[#241C15]'
                  }`}
                >
                  {st === 'TODOS'
                    ? 'Todos'
                    : st === 'EN_OFERTA'
                    ? 'En Oferta'
                    : st === 'CON_STOCK'
                    ? 'Con Stock'
                    : st === 'SIN_STOCK'
                    ? 'Sin Stock'
                    : 'Destacados'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. PRODUCT LIST (STRICTLY NO HORIZONTAL SCROLL) */}
      <div className="bg-white rounded-2xl border border-[#E2D9CC] shadow-xs overflow-hidden">
        {filteredProducts.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#241C15]">No se encontraron productos</h4>
            <p className="text-xs text-[#75695D]">
              Intenta cambiar los filtros o el término de búsqueda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#E2D9CC]">
            {filteredProducts.map((p) => {
              const hasDiscount = p.enOferta && p.precioOferta != null && p.precioOferta > 0
              const isOutOfStock = p.controlarStock && p.stock <= 0

              return (
                <div
                  key={p.id}
                  className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                    p.activo ? 'hover:bg-[#FAF7F4]' : 'bg-gray-50/70 opacity-70'
                  }`}
                >
                  {/* Left Column: Product Info */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Image / Icon */}
                    <div className="w-12 h-12 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] flex items-center justify-center shrink-0 overflow-hidden">
                      {p.imagenUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imagenUrl}
                          alt={p.nombreModelo}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-6 h-6 text-[#A36F4C]" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      {/* Category & Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#75695D] bg-[#F8F6F2] px-2 py-0.5 rounded border border-[#E2D9CC]">
                          {p.lineaCategoria || 'General'}
                        </span>

                        {p.enOferta && (
                          <span className="text-[10px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded flex items-center gap-1 shadow-2xs">
                            <Flame className="w-3 h-3 fill-amber-600 text-amber-600" />
                            <span>{p.badgePromocion || `${p.porcentajeDescuento}% OFF`}</span>
                          </span>
                        )}

                        {p.destacadoWeb && (
                          <span className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded">
                            DESTACADO WEB
                          </span>
                        )}

                        {!p.activo && (
                          <span className="text-[10px] font-bold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                            PAUSADO
                          </span>
                        )}
                      </div>

                      {/* Product Name */}
                      <h4 className="text-sm font-bold text-[#241C15] leading-snug break-words">
                        {p.nombreModelo}
                      </h4>

                      {/* Web Description Snippet if exists */}
                      {p.descripcionWeb && (
                        <p className="text-xs text-[#75695D] line-clamp-1 italic">
                          &ldquo;{p.descripcionWeb}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Pricing & Stock */}
                  <div className="flex items-center gap-4 sm:gap-6 flex-wrap md:flex-nowrap shrink-0">
                    {/* Prices */}
                    <div className="text-left md:text-right min-w-[110px]">
                      <span className="text-[10px] text-[#75695D] font-medium block">
                        Precio en Tienda
                      </span>
                      {hasDiscount ? (
                        <div className="space-y-0.5">
                          <div className="flex items-baseline gap-1.5 md:justify-end">
                            <span className="text-xs text-gray-400 line-through">
                              S/ {p.precioMercado.toFixed(2)}
                            </span>
                            <span className="text-sm font-black text-amber-600">
                              S/ {p.precioOferta!.toFixed(2)}
                            </span>
                          </div>
                          <span className="text-[10px] text-amber-700 font-bold block">
                            Ahorro de {p.porcentajeDescuento}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-sm font-black text-[#241C15]">
                          S/ {p.precioMercado.toFixed(2)}
                        </span>
                      )}
                    </div>

                    {/* Stock Status Badge */}
                    <div className="min-w-[110px]">
                      <span className="text-[10px] text-[#75695D] font-medium block">
                        Inventario Físico
                      </span>
                      {p.controlarStock ? (
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                              p.stock > 5
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : p.stock > 0
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                          >
                            {p.stock > 0 ? `${p.stock} unid. en stock` : 'Agotado'}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] font-medium text-[#75695D] bg-[#F8F6F2] px-2 py-0.5 rounded-md border border-[#E2D9CC] inline-block mt-0.5">
                          Stock Ilimitado / A Pedido
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-2 md:pt-0 border-t md:border-t-0 border-[#E2D9CC] w-full md:w-auto justify-end">
                    <button
                      type="button"
                      onClick={() => handleQuickToggleOferta(p)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
                        p.enOferta
                          ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                          : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC] hover:bg-[#EFE5D8] hover:text-[#241C15]'
                      }`}
                      title={p.enOferta ? 'Desactivar oferta' : 'Activar oferta rápida'}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{p.enOferta ? 'En Promo' : 'Poner en Oferta'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEdit(p)}
                      className="p-2 rounded-xl bg-[#241C15] hover:bg-[#3D3025] text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Gestionar</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2D9CC] w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-[#E2D9CC] flex items-center justify-between bg-[#F8F6F2]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#241C15]">
                    Gestión Web: {editingProduct.nombreModelo}
                  </h3>
                  <p className="text-[11px] text-[#75695D]">
                    Categoría: {editingProduct.lineaCategoria} • Precio Base:{' '}
                    <strong>S/ {editingProduct.precioMercado.toFixed(2)}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 rounded-lg text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 space-y-4 text-xs">
              {/* 1. STOCK CONTROL */}
              <div className="bg-[#F8F6F2] p-4 rounded-xl border border-[#E2D9CC] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#241C15] flex items-center gap-1.5">
                    <span>Control Estricto de Stock Web</span>
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={controlarStock}
                      onChange={(e) => setControlarStock(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                    />
                    <span className="ml-2 text-xs font-semibold text-[#241C15]">
                      {controlarStock ? 'Activado (Limitar venta)' : 'Desactivado (Venta libre/A pedido)'}
                    </span>
                  </label>
                </div>

                {controlarStock && (
                  <div className="pt-2 border-t border-[#E2D9CC]">
                    <label className="block font-bold text-[#241C15] mb-1">
                      Unidades Físicas Disponibles para la Tienda
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        value={stock}
                        onChange={(e) => setStock(parseInt(e.target.value, 10) || 0)}
                        className="w-32 text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15] font-bold"
                      />
                      <span className="text-[11px] text-[#75695D]">
                        {stock === 0 ? '⚠️ El producto aparecerá como AGOTADO en la web' : 'unidades'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 2. PROMOTIONS & OFFERS */}
              <div className="bg-[#F8F6F2] p-4 rounded-xl border border-[#E2D9CC] space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-[#241C15] flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span>Oferta Promocional / Descuento Activo</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enOferta}
                      onChange={(e) => setEnOferta(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded cursor-pointer"
                    />
                    <span className="text-xs font-semibold text-[#241C15]">
                      {enOferta ? 'Oferta Activada' : 'Sin Oferta'}
                    </span>
                  </label>
                </div>

                {enOferta && (
                  <div className="space-y-3 pt-2 border-t border-[#E2D9CC]">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="block font-bold text-[#241C15]">Porcentaje de Descuento (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="95"
                          value={porcentajeDescuento}
                          onChange={(e) =>
                            handleDiscountPercentChange(parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15] font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-[#241C15]">Precio Rebajado Final (S/)</label>
                        <input
                          type="number"
                          step="0.10"
                          min="1"
                          value={precioOferta}
                          onChange={(e) =>
                            setPrecioOferta(e.target.value === '' ? '' : parseFloat(e.target.value))
                          }
                          className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15] font-black text-amber-700"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block font-bold text-[#241C15]">
                        Etiqueta / Badge Promocional en la Tarjeta
                      </label>
                      <input
                        type="text"
                        value={badgePromocion}
                        onChange={(e) => setBadgePromocion(e.target.value)}
                        placeholder="Ej: 20% OFF, MÁS VENDIDO, OFERTA FLASH"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap pt-1">
                        <span className="text-[10px] text-[#75695D]">Sugerencias:</span>
                        {BADGE_PRESETS.map((bp) => (
                          <button
                            key={bp}
                            type="button"
                            onClick={() => setBadgePromocion(bp)}
                            className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#E2D9CC] hover:bg-[#EFE5D8] cursor-pointer font-medium"
                          >
                            {bp}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. VISIBILITY & CUSTOM WEB DETAILS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2]">
                  <div className="space-y-0.5">
                    <label className="font-bold text-[#241C15] block">
                      Destacar en Página Principal de la Tienda
                    </label>
                    <span className="text-[11px] text-[#75695D]">
                      Aparecerá en los primeros bloques destacados del home
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={destacadoWeb}
                    onChange={(e) => setDestacadoWeb(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#241C15]">
                    URL de Imagen Personalizada (Opcional)
                  </label>
                  <input
                    type="url"
                    value={imagenUrl}
                    onChange={(e) => setImagenUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#241C15]">
                    Descripción Corta para la Tienda Web
                  </label>
                  <textarea
                    rows={2}
                    value={descripcionWeb}
                    onChange={(e) => setDescripcionWeb(e.target.value)}
                    placeholder="Detalles sobre materiales, compatibilidad, insert o componentes..."
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15] resize-none"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2]">
                  <div className="space-y-0.5">
                    <label className="font-bold text-[#241C15] block">Estado en Tienda Web</label>
                    <span className="text-[11px] text-[#75695D]">
                      Si está inactivo, no se mostrará a los clientes
                    </span>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={activo}
                      onChange={(e) => setActivo(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                    />
                    <span className="font-bold text-[#241C15]">
                      {activo ? 'Visible en Web' : 'Oculto'}
                    </span>
                  </label>
                </div>
              </div>

              {/* MODAL ACTIONS */}
              <div className="pt-3 border-t border-[#E2D9CC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl border border-[#E2D9CC] text-[#75695D] hover:bg-[#F8F6F2] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#241C15] hover:bg-[#3D3025] text-white font-bold cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
