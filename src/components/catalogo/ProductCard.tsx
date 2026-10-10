'use client'

import React, { useMemo } from 'react'
import {
  Package,
  Eye,
  MoreHorizontal,
  ExternalLink,
  Pencil,
  Copy,
  Trash2,
  Share2,
  Archive,
  RotateCcw,
  Star,
  Users,
  Clock,
  Check,
  Tag
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import type { ProductGroupRow } from './ProductsTableView'
import type { ProductoItem } from './CatalogoClient'

export interface ProductCardProps {
  row: ProductGroupRow
  onViewDetail: (group?: ProductGroupRow, single?: ProductoItem) => void
  onEdit: (product: ProductoItem) => void
  onEditGroup?: (group: ProductGroupRow) => void
  onDuplicar: (product: ProductoItem) => void
  onDuplicarGroup?: (group: ProductGroupRow) => void
  onDeleteProduct?: (product: ProductoItem) => void
  onDeleteGroup?: (group: ProductGroupRow) => void
  onToggleEstado?: (product: ProductoItem) => void
  onCopiarCotizacion?: (product: ProductoItem) => void
  formatCurrency: (val: number) => string
  calcMargen: (precio: number, costo: number) => string
  copiedId?: string | null
}

export function ProductCard({
  row,
  onViewDetail,
  onEdit,
  onEditGroup,
  onDuplicar,
  onDuplicarGroup,
  onDeleteProduct,
  onDeleteGroup,
  onToggleEstado,
  onCopiarCotizacion,
  formatCurrency,
  calcMargen,
  copiedId
}: ProductCardProps) {
  const isGroup = row.isGroup
  const isMultiVariant = isGroup && row.totalVariants > 1
  const primaryProduct = isGroup
    ? row.variants[0]?.producto
    : (row.singleProduct || row.variants[0]?.producto)

  // Imagen del juego
  const imageUrl = isGroup
    ? (row.variants.find((v) => v.producto.imagenUrl)?.producto.imagenUrl || null)
    : (primaryProduct?.imagenUrl || null)

  const isActive = row.hasActive

  // BGG data
  const bggId = row.bggId || primaryProduct?.bggId
  const bggRating = row.bggRating != null ? row.bggRating : (primaryProduct?.bggRating ? Number(primaryProduct.bggRating) : null)

  // Formato de precios
  const mercadoPriceFormatted = isMultiVariant && row.minPrecioMercado !== row.maxPrecioMercado
    ? `${formatCurrency(row.minPrecioMercado)} – ${formatCurrency(row.maxPrecioMercado)}`
    : formatCurrency(row.minPrecioMercado)

  const amigosPriceFormatted = isMultiVariant && row.minPrecioAmigos !== row.maxPrecioAmigos
    ? `${formatCurrency(row.minPrecioAmigos)} – ${formatCurrency(row.maxPrecioAmigos)}`
    : formatCurrency(row.minPrecioAmigos)

  // Margen comercial
  const mercadoMargen = useMemo(() => {
    if (!isGroup || row.variants.length <= 1) {
      const costo = primaryProduct?.costoBase || 0
      const precio = primaryProduct?.precioMercado || 0
      return calcMargen(precio, costo)
    }
    const margenes = row.variants.map((v) => {
      const c = v.producto.costoBase || 0
      const p = v.producto.precioMercado || 0
      return c > 0 ? ((p - c) / c) * 100 : (p > 0 ? 100 : 0)
    })
    const minM = Math.min(...margenes)
    const maxM = Math.max(...margenes)
    if (Math.round(minM) === Math.round(maxM)) {
      return minM >= 0 ? `+${Math.round(minM)}%` : `${Math.round(minM)}%`
    }
    const minStr = minM >= 0 ? `+${Math.round(minM)}%` : `${Math.round(minM)}%`
    const maxStr = maxM >= 0 ? `+${Math.round(maxM)}%` : `${Math.round(maxM)}%`
    return `${minStr} ~ ${maxStr}`
  }, [isGroup, row.variants, primaryProduct, calcMargen])

  const handleCardClick = () => {
    if (row.isGroup) {
      onViewDetail(row, undefined)
    } else {
      onViewDetail(undefined, primaryProduct)
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="group bg-card border border-border rounded-2xl overflow-hidden shadow-2xs hover:shadow-md hover:border-primary/50 transition-all duration-200 flex flex-col justify-between cursor-pointer"
    >
      {/* ========================================================================= */}
      {/* 1. PORTADA DEL JUEGO (aspect-[4/3])                                       */}
      {/* ========================================================================= */}
      <div className="relative w-full aspect-[4/3] bg-secondary/50 border-b border-border/60 flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={row.baseName}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-4">
            <Package className="w-12 h-12 text-primary/40 stroke-[1.5]" />
            <span className="text-[11px] font-medium text-muted-foreground mt-1">
              Sin fotografía
            </span>
          </div>
        )}

        {/* Overlays Flotantes */}
        {/* Top-Left: Badge de Estado */}
        <div className="absolute top-2.5 left-2.5 z-10">
          {isActive ? (
            <span className="bg-card/90 backdrop-blur-xs text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-border/80 shadow-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0" />
              <span>Activo</span>
            </span>
          ) : (
            <span className="bg-card/90 backdrop-blur-xs text-muted-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-border/80 shadow-2xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60 shrink-0" />
              <span>Archivado</span>
            </span>
          )}
        </div>

        {/* Top-Right: Dropdown de Acciones */}
        <div
          className="absolute top-2.5 right-2.5 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="h-8 w-8 rounded-full bg-card/90 backdrop-blur-xs border border-border/80 text-foreground flex items-center justify-center shadow-2xs hover:bg-card hover:scale-105 transition-all cursor-pointer outline-none"
              title="Opciones"
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-56 bg-card border border-border rounded-xl shadow-lg p-1"
            >
              <DropdownMenuItem
                onClick={() => onViewDetail(row.isGroup ? row : undefined, row.isGroup ? undefined : primaryProduct)}
                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
              >
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span>Ver Ficha Técnica</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => isGroup && onEditGroup ? onEditGroup(row) : primaryProduct && onEdit(primaryProduct)}
                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
              >
                <Pencil className="h-3.5 w-3.5 text-primary" />
                <span>Editar Juego</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => isGroup && onDuplicarGroup ? onDuplicarGroup(row) : primaryProduct && onDuplicar(primaryProduct)}
                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
              >
                <Copy className="h-3.5 w-3.5 text-primary" />
                <span>Duplicar Ficha</span>
              </DropdownMenuItem>

              {onCopiarCotizacion && primaryProduct && (
                <DropdownMenuItem
                  onClick={() => onCopiarCotizacion(primaryProduct)}
                  className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                >
                  {copiedId === primaryProduct.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5 text-primary" />
                  )}
                  <span>Copiar Cotización WhatsApp</span>
                </DropdownMenuItem>
              )}

              {onToggleEstado && primaryProduct && (
                <DropdownMenuItem
                  onClick={() => onToggleEstado(primaryProduct)}
                  className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                >
                  {primaryProduct.activo ? (
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
              )}

              <DropdownMenuSeparator className="my-1 bg-border/60" />

              <DropdownMenuItem
                onClick={() => isGroup && onDeleteGroup ? onDeleteGroup(row) : onDeleteProduct && primaryProduct && onDeleteProduct(primaryProduct)}
                className="flex items-center gap-2 text-xs font-medium px-2.5 py-2 cursor-pointer rounded-lg hover:bg-destructive/10 text-destructive"
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                <span>Eliminar / Descontinuar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Bottom Overlays: Stock status */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          {primaryProduct?.controlarStock ? (
            (primaryProduct.stock ?? 0) <= 0 ? (
              <span className="bg-card/90 backdrop-blur-xs text-rose-700 dark:text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-500/20 shadow-2xs flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                <span>Agotado</span>
              </span>
            ) : (primaryProduct.stock ?? 0) <= 2 ? (
              <span className="bg-card/90 backdrop-blur-xs text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-500/20 shadow-2xs flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span>{primaryProduct.stock} un. (Bajo)</span>
              </span>
            ) : (
              <span className="bg-card/90 backdrop-blur-xs text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20 shadow-2xs flex items-center gap-1 font-mono">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>{primaryProduct.stock} un.</span>
              </span>
            )
          ) : (
            <span className="bg-card/90 backdrop-blur-xs text-muted-foreground text-[10px] font-medium px-2 py-0.5 rounded-md border border-border shadow-2xs">
              A Pedido
            </span>
          )}
        </div>

        {/* Bottom Right: Oferta badge */}
        {primaryProduct?.enOferta && (
          <div className="absolute bottom-2.5 right-2.5 z-10">
            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-2xs flex items-center gap-1">
              <Tag className="w-2.5 h-2.5" />
              <span>OFERTA</span>
            </span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTENIDO PRINCIPAL: Metadata & Specs del Juego                       */}
      {/* ========================================================================= */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Fila de Categoría & BGG Badge */}
          <div className="flex items-center justify-between gap-1.5 mb-1.5">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2 py-0.5 rounded-md border border-primary/15 truncate max-w-[150px]">
              {row.lineaCategoria || 'General'}
            </span>

            {bggId ? (
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={`https://boardgamegeek.com/boardgame/${bggId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-primary hover:underline bg-primary/5 px-1.5 py-0.5 rounded border border-primary/20"
                  title="Ver en BGG"
                >
                  <span>BGG #{bggId}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
                {bggRating != null && bggRating > 0 && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-black text-amber-700 dark:text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                    <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                    <span>{bggRating.toFixed(1)}</span>
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* Título del Juego */}
          <h3
            className="font-black text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-snug"
            title={row.baseName}
          >
            {row.baseName}
          </h3>

          {/* Subtítulo: Editorial o Versiones */}
          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground flex-wrap">
            {primaryProduct?.editorialMarca && (
              <span className="truncate max-w-[180px] font-medium">
                {primaryProduct.editorialMarca}
              </span>
            )}
            {isMultiVariant && (
              <span className="text-primary font-bold">
                • {row.totalVariants} versiones
              </span>
            )}
          </div>

          {/* Specs del Juego (Jugadores, Tiempo) */}
          {(primaryProduct?.numJugadores || primaryProduct?.duracionMinutos) && (
            <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground border-t border-border/40 pt-2 flex-wrap">
              {primaryProduct?.numJugadores && (
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-primary" />
                  <span>{primaryProduct.numJugadores}</span>
                </span>
              )}
              {primaryProduct?.duracionMinutos && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" />
                  <span>{primaryProduct.duracionMinutos} min</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. BLOQUE FINANCIERO: Costo, Precio de Venta y Margen                     */}
        {/* ========================================================================= */}
        <div className="pt-2.5 border-t border-border/60 space-y-2">
          {/* Precio de Venta Principal (Mercado) */}
          <div className="flex items-baseline justify-between">
            <span className="text-[11px] font-medium text-muted-foreground">
              Precio Venta:
            </span>
            <div className="text-right">
              <span className="font-mono text-base font-black text-foreground">
                {mercadoPriceFormatted}
              </span>
            </div>
          </div>

          {/* Costo Base y Margen Comercial */}
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted-foreground font-mono">
              Base: {formatCurrency(row.minCosto)}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 font-mono">
              Margen: {mercadoMargen}
            </span>
          </div>

          {/* Precio Amigos (Secundario) */}
          {row.minPrecioAmigos > 0 && (
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/40 font-mono">
              <span>Amigos / Especial:</span>
              <span className="font-semibold">{amigosPriceFormatted}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
