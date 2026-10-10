'use client'

import React, { useMemo } from 'react'
import { 
  Package, 
  ChevronDown, 
  MoreHorizontal, 
  Plus, 
  Share2, 
  Pencil, 
  Copy, 
  CopyPlus, 
  Archive, 
  RotateCcw, 
  Check, 
  ArrowUpDown, 
  Eye, 
  Trash2, 
  ExternalLink,
  Star,
  Users,
  Clock,
  Sparkles
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider
} from '@/components/ui/tooltip'
import type { ProductoItem } from './CatalogoClient'

export type OrdenCatalogType = 
  | 'RECIENTES' 
  | 'NOMBRE_ASC' 
  | 'NOMBRE_DESC' 
  | 'MARGEN_DESC' 
  | 'COSTO_ASC' 
  | 'COSTO_DESC'
  | 'BGG_RATING_DESC'

export interface CategoryCountItem {
  name: string
  count: number
}

// Reglas de sufijos conocidos para juegos de mesa (expansiones, ediciones)
const KNOWN_SUFFIX_RULES = [
  { regex: /^(.*?)(?:[\s\-_]+)(juego\s*base)$/i, label: 'Juego Base' },
  { regex: /^(.*?)(?:[\s\-_]+)(expansion|expansión)$/i, label: 'Expansión' },
  { regex: /^(.*?)(?:[\s\-_]+)(edicion\s*deluxe|edición\s*deluxe)$/i, label: 'Deluxe' },
  { regex: /^(.*?)(?:[\s\-_]+)(segunda\s*edicion|2da\s*edicion|2nd\s*edition)$/i, label: '2da Edición' },
  { regex: /^(.*?)(?:[\s\-_]+)(v\s*1)$/i, label: 'V1' },
  { regex: /^(.*?)(?:[\s\-_]+)(v\s*2)$/i, label: 'V2' },
]

export function extractBaseAndVariant(nombre: string): { baseName: string; variantName: string } {
  const raw = (nombre || '').trim()

  // Separador por guión (" - ")
  if (raw.includes(' - ')) {
    const idx = raw.indexOf(' - ')
    const base = raw.substring(0, idx).trim()
    const variant = raw.substring(idx + 3).trim()
    if (base && variant) {
      return { baseName: base, variantName: variant }
    }
  }

  // Sufijos de edición o versión
  for (const rule of KNOWN_SUFFIX_RULES) {
    const match = raw.match(rule.regex)
    if (match && match[1] && match[1].trim()) {
      const base = match[1].trim()
      const variant = rule.label || match[2]
      return { baseName: base, variantName: variant }
    }
  }

  return { baseName: raw, variantName: 'Estándar' }
}

export interface VariantItemData {
  producto: ProductoItem
  variantName: string
}

export interface ProductGroupRow {
  id: string
  isGroup: boolean
  baseName: string
  lineaCategoria: string
  totalVariants: number
  variants: VariantItemData[]
  minCosto: number
  maxCosto: number
  minPrecioMercado: number
  maxPrecioMercado: number
  minPrecioAmigos: number
  maxPrecioAmigos: number
  hasActive: boolean
  allActive: boolean
  latestCreatedAt?: string
  singleProduct?: ProductoItem
  bggId?: number | null
  bggRating?: number | null
}

export function groupProducts(
  productos: ProductoItem[],
  allCatalogProductos: ProductoItem[] = productos
): ProductGroupRow[] {
  const catalogFamilyCounts = new Map<string, number>()
  allCatalogProductos.forEach((p) => {
    const { baseName } = extractBaseAndVariant(p.nombreModelo)
    const key = `${baseName.toLowerCase().trim()}:::${(p.lineaCategoria || '').toLowerCase().trim()}`
    catalogFamilyCounts.set(key, (catalogFamilyCounts.get(key) || 0) + 1)
  })

  const groupsMap = new Map<string, {
    baseName: string
    lineaCategoria: string
    items: VariantItemData[]
  }>()

  productos.forEach((p) => {
    const { baseName, variantName } = extractBaseAndVariant(p.nombreModelo)
    const groupKey = `${baseName.toLowerCase().trim()}:::${(p.lineaCategoria || '').toLowerCase().trim()}`

    if (!groupsMap.has(groupKey)) {
      groupsMap.set(groupKey, {
        baseName,
        lineaCategoria: p.lineaCategoria || 'General',
        items: [],
      })
    }

    groupsMap.get(groupKey)!.items.push({
      producto: p,
      variantName,
    })
  })

  const rows: ProductGroupRow[] = []

  groupsMap.forEach((group, groupKey) => {
    const totalInCatalog = catalogFamilyCounts.get(groupKey) || group.items.length

    if (totalInCatalog <= 1 || (group.items.length === 1 && totalInCatalog <= 1)) {
      const single = group.items[0].producto
      rows.push({
        id: single.id,
        isGroup: false,
        baseName: single.nombreModelo,
        lineaCategoria: single.lineaCategoria || 'General',
        totalVariants: 1,
        variants: group.items,
        minCosto: single.costoBase || 0,
        maxCosto: single.costoBase || 0,
        minPrecioMercado: single.precioMercado || 0,
        maxPrecioMercado: single.precioMercado || 0,
        minPrecioAmigos: single.precioAmigos || 0,
        maxPrecioAmigos: single.precioAmigos || 0,
        hasActive: single.activo,
        allActive: single.activo,
        latestCreatedAt: single.createdAt,
        singleProduct: single,
        bggId: single.bggId,
        bggRating: single.bggRating ? Number(single.bggRating) : null,
      })
    } else {
      group.items.sort((a, b) => (a.producto.costoBase || 0) - (b.producto.costoBase || 0))

      const costos = group.items.map(i => i.producto.costoBase || 0)
      const preciosMercado = group.items.map(i => i.producto.precioMercado || 0)
      const preciosAmigos = group.items.map(i => i.producto.precioAmigos || 0)
      const dates = group.items
        .map(i => i.producto.createdAt)
        .filter(Boolean) as string[]
      const latestDate = dates.length > 0
        ? dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
        : undefined

      const primaryBgg = group.items.find(i => i.producto.bggId)?.producto

      rows.push({
        id: `group_${groupKey}`,
        isGroup: true,
        baseName: group.baseName,
        lineaCategoria: group.lineaCategoria,
        totalVariants: group.items.length,
        variants: group.items,
        minCosto: Math.min(...costos),
        maxCosto: Math.max(...costos),
        minPrecioMercado: Math.min(...preciosMercado),
        maxPrecioMercado: Math.max(...preciosMercado),
        minPrecioAmigos: Math.min(...preciosAmigos),
        maxPrecioAmigos: Math.max(...preciosAmigos),
        hasActive: group.items.some(i => i.producto.activo),
        allActive: group.items.every(i => i.producto.activo),
        latestCreatedAt: latestDate,
        bggId: primaryBgg?.bggId,
        bggRating: primaryBgg?.bggRating ? Number(primaryBgg.bggRating) : null,
      })
    }
  })

  return rows
}

interface ProductsTableViewProps {
  rows?: ProductGroupRow[]
  productos?: ProductoItem[]
  allCatalogProductos?: ProductoItem[]
  expandedParents: Set<string>
  onToggleExpand: (id: string) => void
  onViewDetail?: (group?: ProductGroupRow, single?: ProductoItem) => void
  onEdit: (p: ProductoItem) => void
  onEditGroup?: (group: ProductGroupRow) => void
  onCopiarCotizacion: (p: ProductoItem) => void
  onToggleEstado: (p: ProductoItem) => void
  onDuplicar: (p: ProductoItem) => void
  onDuplicarGroup?: (group: ProductGroupRow) => void
  onDeleteProduct?: (p: ProductoItem) => void
  onDeleteGroup?: (group: ProductGroupRow) => void
  copiedId: string | null
  formatCurrency: (val: number) => string
  calcMargen: (precio: number, costo: number) => string
  ordenFilter?: OrdenCatalogType
  onOrdenFilterChange?: (orden: OrdenCatalogType) => void
}

export function ProductsTableView({
  rows,
  productos = [],
  allCatalogProductos = productos,
  expandedParents,
  onToggleExpand,
  onViewDetail,
  onEdit,
  onEditGroup,
  onCopiarCotizacion,
  onToggleEstado,
  onDuplicar,
  onDuplicarGroup,
  onDeleteProduct,
  onDeleteGroup,
  copiedId,
  formatCurrency,
  calcMargen,
  ordenFilter = 'RECIENTES',
  onOrdenFilterChange,
}: ProductsTableViewProps) {

  const displayRows = useMemo(() => {
    if (rows && rows.length > 0) return rows
    if (productos.length > 0) return groupProducts(productos, allCatalogProductos)
    return []
  }, [rows, productos, allCatalogProductos])

  const handleSortHeader = (type: 'NOMBRE' | 'COSTO' | 'PRECIO' | 'RATING') => {
    if (!onOrdenFilterChange) return
    switch (type) {
      case 'NOMBRE':
        onOrdenFilterChange(ordenFilter === 'NOMBRE_ASC' ? 'NOMBRE_DESC' : 'NOMBRE_ASC')
        break
      case 'COSTO':
        onOrdenFilterChange(ordenFilter === 'COSTO_ASC' ? 'COSTO_DESC' : 'COSTO_ASC')
        break
      case 'PRECIO':
        onOrdenFilterChange('MARGEN_DESC')
        break
      case 'RATING':
        onOrdenFilterChange('BGG_RATING_DESC')
        break
    }
  }

  return (
    <div className="w-full space-y-4">
      {displayRows.length === 0 ? (
        <div className="w-full bg-card border border-border rounded-2xl p-12 text-center text-muted-foreground italic text-xs shadow-xs">
          No se encontraron juegos con ese criterio de búsqueda
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* VISTA ESCRITORIO (>= lg): Tabla ejecutiva table-fixed sin scroll horizontal */}
          {/* Regla estricta: 100% de ancho total, cero overflow-x                     */}
          {/* 30% + 12% + 13% + 13% + 16% + 10% + 6% = 100%                            */}
          {/* ========================================================================= */}
          <div className="hidden lg:block w-full bg-card border border-border rounded-2xl shadow-xs overflow-hidden">
            <table className="w-full text-left border-collapse table-fixed text-xs">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[12%]" />
                <col className="w-[13%]" />
                <col className="w-[13%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
                <col className="w-[6%]" />
              </colgroup>
              <thead>
                <tr className="bg-secondary/40 border-b border-border text-muted-foreground text-[11px] font-semibold select-none">
                  {/* Columna 1: Modelo / Juego & Familia */}
                  <th
                    className="py-3.5 px-4 font-bold text-left cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSortHeader('NOMBRE')}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Juego & Categoría</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>

                  {/* Columna 2: Info BGG */}
                  <th
                    className="py-3.5 px-3 font-bold text-center cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSortHeader('RATING')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>BGG Info</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>

                  {/* Columna 3: Stock */}
                  <th className="py-3.5 px-3 font-bold text-center">
                    <span>Stock</span>
                  </th>

                  {/* Columna 4: Costo Base */}
                  <th
                    className="py-3.5 px-3 font-bold text-right cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSortHeader('COSTO')}
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span>Costo Base</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>

                  {/* Columna 5: Precio Mercado & Margen */}
                  <th
                    className="py-3.5 px-3 font-bold text-center cursor-pointer hover:text-foreground transition-colors"
                    onClick={() => handleSortHeader('PRECIO')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Precio Mercado</span>
                      <ArrowUpDown className="h-3 w-3 opacity-60" />
                    </div>
                  </th>

                  {/* Columna 6: Estado */}
                  <th className="py-3.5 px-3 font-bold text-center">
                    <span>Estado</span>
                  </th>

                  {/* Columna 7: Acciones */}
                  <th className="py-3.5 pr-4 text-right font-bold">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {displayRows.map((row) => {
                  const isExpanded = expandedParents.has(row.id)
                  const primaryProduct = row.isGroup
                    ? row.variants[0]?.producto
                    : (row.singleProduct || row.variants[0]?.producto)

                  const imageUrl = row.isGroup
                    ? (row.variants.find((v) => v.producto.imagenUrl)?.producto.imagenUrl || null)
                    : (primaryProduct?.imagenUrl || null)

                  const handleRowClick = () => {
                    if (row.isGroup) {
                      onViewDetail ? onViewDetail(row, undefined) : onToggleExpand(row.id)
                    } else {
                      onViewDetail ? onViewDetail(undefined, primaryProduct) : onEdit(primaryProduct!)
                    }
                  }

                  return (
                    <React.Fragment key={row.id}>
                      {/* FILA PRINCIPAL */}
                      <tr
                        onClick={handleRowClick}
                        className={`h-16 transition-colors cursor-pointer ${
                          !row.hasActive
                            ? 'bg-secondary/20 opacity-75'
                            : 'hover:bg-secondary/30'
                        }`}
                      >
                        {/* Columna 1: Juego & Categoría */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Thumbnail con imagen o ícono */}
                            <div className="h-10 w-10 rounded-xl bg-secondary/80 border border-border/80 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={row.baseName}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-primary stroke-[2]" />
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="font-bold text-sm text-foreground truncate block"
                                  title={row.baseName}
                                >
                                  {row.baseName}
                                </span>
                                {row.isGroup && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      onToggleExpand(row.id)
                                    }}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                                  >
                                    <span>{row.totalVariants} vers.</span>
                                    <ChevronDown
                                      className={`h-3 w-3 transition-transform duration-200 ${
                                        isExpanded ? 'rotate-180' : ''
                                      }`}
                                    />
                                  </button>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] px-2 py-0 bg-secondary/60 text-muted-foreground border-border/70"
                                >
                                  {row.lineaCategoria || 'General'}
                                </Badge>
                                {primaryProduct?.editorialMarca && (
                                  <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                    {primaryProduct.editorialMarca}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Columna 2: Info BGG */}
                        <td className="py-3 px-3 text-center">
                          {row.bggId ? (
                            <div className="inline-flex flex-col items-center gap-1">
                              <a
                                href={`https://boardgamegeek.com/boardgame/${row.bggId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-mono font-bold text-primary hover:underline bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 text-[11px]"
                                onClick={(e) => e.stopPropagation()}
                                title="Ver en BoardGameGeek"
                              >
                                <span>#{row.bggId}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                              {row.bggRating != null && row.bggRating > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                  <Star className="h-2.5 w-2.5 fill-amber-500 text-amber-500" />
                                  <span>{row.bggRating.toFixed(1)}</span>
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50 text-[11px]">—</span>
                          )}
                        </td>

                        {/* Columna 3: Stock */}
                        <td className="py-3 px-3 text-center">
                          {primaryProduct?.controlarStock ? (
                            (primaryProduct.stock ?? 0) <= 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-300 text-[11px] font-bold">
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                <span>Agotado</span>
                              </span>
                            ) : (primaryProduct.stock ?? 0) <= 2 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                                <span>{primaryProduct.stock} un. (Bajo)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold font-mono">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                                <span>{primaryProduct.stock} un.</span>
                              </span>
                            )
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary text-muted-foreground text-[10px] font-medium border border-border">
                              A Pedido
                            </span>
                          )}
                        </td>

                        {/* Columna 4: Costo Base */}
                        <td className="py-3 px-3 text-right">
                          <span className="font-mono text-xs font-semibold text-muted-foreground tabular-nums">
                            {row.isGroup && row.minCosto !== row.maxCosto
                              ? `${formatCurrency(row.minCosto)} – ${formatCurrency(row.maxCosto)}`
                              : formatCurrency(row.minCosto)}
                          </span>
                        </td>

                        {/* Columna 5: Precio Mercado & Margen */}
                        <td className="py-3 px-3">
                          <div className="flex flex-col items-center justify-center">
                            <span className="font-mono text-xs font-bold text-foreground tabular-nums">
                              {row.isGroup && row.minPrecioMercado !== row.maxPrecioMercado
                                ? `${formatCurrency(row.minPrecioMercado)} – ${formatCurrency(row.maxPrecioMercado)}`
                                : formatCurrency(row.minPrecioMercado)}
                            </span>
                            {!row.isGroup && primaryProduct && (
                              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                                Margen: {calcMargen(primaryProduct.precioMercado, primaryProduct.costoBase)}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Columna 6: Estado */}
                        <td className="py-3 px-3 text-center">
                          {row.hasActive ? (
                            <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                              <span>Activo</span>
                            </span>
                          ) : (
                            <span className="h-6 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold bg-secondary text-muted-foreground border border-border whitespace-nowrap shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
                              <span>Archivado</span>
                            </span>
                          )}
                        </td>

                        {/* Columna 7: Acciones */}
                        <td className="py-3 pr-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors ml-auto flex items-center justify-center border border-transparent hover:border-border/60 cursor-pointer outline-none"
                              title="Más opciones"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                              <span className="sr-only">Acciones</span>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 bg-card border border-border rounded-xl shadow-lg p-1">
                              <DropdownMenuItem
                                onClick={() => onViewDetail && (row.isGroup ? onViewDetail(row, undefined) : onViewDetail(undefined, primaryProduct))}
                                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                              >
                                <Eye className="h-3.5 w-3.5 text-primary" />
                                <span>Ver Ficha del Juego</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => row.isGroup && onEditGroup ? onEditGroup(row) : onEdit(primaryProduct!)}
                                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5 text-primary" />
                                <span>Editar Información</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => row.isGroup && onDuplicarGroup ? onDuplicarGroup(row) : onDuplicar(primaryProduct!)}
                                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                              >
                                <Copy className="h-3.5 w-3.5 text-primary" />
                                <span>Duplicar Ficha</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => primaryProduct && onCopiarCotizacion(primaryProduct)}
                                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                              >
                                {copiedId === primaryProduct?.id ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Share2 className="h-3.5 w-3.5 text-primary" />
                                )}
                                <span>Copiar Cotización WhatsApp</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => primaryProduct && onToggleEstado(primaryProduct)}
                                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                              >
                                {primaryProduct?.activo ? (
                                  <>
                                    <Archive className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span>Archivar Juego</span>
                                  </>
                                ) : (
                                  <>
                                    <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                                    <span>Reactivar Juego</span>
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator className="my-1 bg-border/60" />
                              <DropdownMenuItem
                                onClick={() => row.isGroup && onDeleteGroup ? onDeleteGroup(row) : onDeleteProduct && primaryProduct && onDeleteProduct(primaryProduct)}
                                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-destructive/10 text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                <span>Eliminar / Descontinuar</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>

                      {/* SUBFILAS DE VARIANTES (SI ES UN GRUPO EXPANDIDO) */}
                      {isExpanded && row.isGroup && (
                        <TooltipProvider>
                          {row.variants.map((v) => {
                            const p = v.producto
                            return (
                              <tr
                                key={p.id}
                                className="h-12 bg-secondary/15 hover:bg-secondary/30 border-b border-border/40 transition-colors"
                              >
                                <td className="py-2.5 px-4">
                                  <div className="pl-12 flex items-center min-w-0">
                                    <span className="text-primary font-mono text-sm shrink-0 select-none mr-2">└─</span>
                                    <span className="text-xs font-bold text-foreground truncate" title={v.variantName}>
                                      {v.variantName}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {p.bggId ? (
                                    <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                      #{p.bggId}
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground/40 text-[10px]">—</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {p.controlarStock ? (
                                    <span className="text-[10px] font-mono font-semibold">
                                      {p.stock ?? 0} un.
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground">A pedido</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                  <span className="font-mono text-[11px] text-muted-foreground">
                                    {formatCurrency(p.costoBase)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <span className="font-mono text-[11px] font-bold text-foreground">
                                    {formatCurrency(p.precioMercado)}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  {p.activo ? (
                                    <span className="text-[10px] text-emerald-700 font-bold">Activo</span>
                                  ) : (
                                    <span className="text-[10px] text-muted-foreground">Archivado</span>
                                  )}
                                </td>
                                <td className="py-2.5 pr-4 text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 w-7 p-0"
                                    onClick={() => onEdit(p)}
                                    title="Editar variante"
                                  >
                                    <Pencil className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </TooltipProvider>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* ========================================================================= */}
          {/* VISTA MÓVIL (< lg): Tarjetas Responsivas para evitar scroll horizontal    */}
          {/* ========================================================================= */}
          <div className="lg:hidden space-y-3">
            {displayRows.map((row) => {
              const primaryProduct = row.isGroup
                ? row.variants[0]?.producto
                : (row.singleProduct || row.variants[0]?.producto)
              const imageUrl = row.isGroup
                ? (row.variants.find((v) => v.producto.imagenUrl)?.producto.imagenUrl || null)
                : (primaryProduct?.imagenUrl || null)

              return (
                <div
                  key={row.id}
                  className="bg-card border border-border rounded-xl p-3.5 shadow-2xs space-y-2.5"
                  onClick={() => onViewDetail && (row.isGroup ? onViewDetail(row, undefined) : onViewDetail(undefined, primaryProduct))}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 overflow-hidden">
                        {imageUrl ? (
                          <img src={imageUrl} alt={row.baseName} className="h-full w-full object-cover" />
                        ) : (
                          <Package className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-foreground block truncate">
                          {row.baseName}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.2 rounded">
                            {row.lineaCategoria}
                          </span>
                          {row.bggId && (
                            <span className="text-[10px] font-mono text-primary">
                              #{row.bggId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {row.hasActive ? (
                      <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shrink-0">
                        Activo
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full shrink-0">
                        Archivado
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-border/60">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Precio Mercado</span>
                      <span className="font-mono font-bold text-foreground">
                        {formatCurrency(row.minPrecioMercado)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-muted-foreground block">Stock</span>
                      {primaryProduct?.controlarStock ? (
                        <span className="font-mono font-bold">
                          {primaryProduct.stock ?? 0} un.
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">A pedido</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
