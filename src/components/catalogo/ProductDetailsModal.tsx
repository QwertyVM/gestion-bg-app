'use client'

import React, { useState, useEffect } from 'react'
import {
  Package,
  Pencil,
  X,
  Share2,
  Check,
  ExternalLink,
  Star,
  Users,
  Clock,
  Baby,
  Building2,
  Globe,
  Dices,
  Layers,
  Tag,
  Plus,
  Sparkles,
  TrendingUp,
  Warehouse,
  BookOpen
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { extractBaseAndVariant, type ProductGroupRow } from './ProductsTableView'
import type { ProductoItem } from './CatalogoClient'

export interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  group?: ProductGroupRow | null
  singleProduct?: ProductoItem | null
  onEdit: (product?: ProductoItem) => void
  onAddEdition?: (baseProduct: ProductoItem, baseName: string) => void
  formatCurrency: (val: number) => string
  calcMargen: (precio: number, costo: number) => string
}

export function ProductDetailsModal({
  isOpen,
  onClose,
  group,
  singleProduct,
  onEdit,
  onAddEdition,
  formatCurrency,
  calcMargen
}: ProductDetailsModalProps) {
  const [copied, setCopied] = useState(false)
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0)

  // Lista normalizada de variantes (ediciones)
  const variants = React.useMemo(() => {
    if (group && group.variants && group.variants.length > 0) {
      return group.variants
    }
    if (singleProduct) {
      const { variantName } = extractBaseAndVariant(singleProduct.nombreModelo)
      return [{ producto: singleProduct, variantName }]
    }
    return []
  }, [group, singleProduct])

  // Reset del índice al cambiar de juego o al abrir
  useEffect(() => {
    setSelectedVariantIndex(0)
    setCopied(false)
  }, [group?.id, singleProduct?.id, isOpen])

  if (!group && !singleProduct) return null

  const activeVariant = variants[selectedVariantIndex] || variants[0]
  const currentProduct: ProductoItem = activeVariant?.producto || (group ? group.variants[0]?.producto : singleProduct!)

  if (!currentProduct) return null

  const baseName = group ? group.baseName : extractBaseAndVariant(currentProduct.nombreModelo).baseName
  const activeEditionName = activeVariant?.variantName || extractBaseAndVariant(currentProduct.nombreModelo).variantName
  const categoria = currentProduct.lineaCategoria || group?.lineaCategoria || 'General'
  const isMultiEdition = variants.length > 1

  // Imagen actual (de la edición seleccionada o de la primera que tenga imagen)
  const imageUrl = currentProduct.imagenUrl || (group?.variants.find((v) => v.producto.imagenUrl)?.producto.imagenUrl ?? null)

  // BGG Data
  const bggId = currentProduct.bggId || group?.bggId
  const bggRating = currentProduct.bggRating ? Number(currentProduct.bggRating) : (group?.bggRating ?? null)

  // Precios de la edición activa
  const costo = currentProduct.costoBase
  const pvp = currentProduct.precioMercado
  const amigos = currentProduct.precioAmigos
  const gananciaPvp = Math.max(0, pvp - costo)
  const gananciaAmigos = Math.max(0, amigos - costo)

  // Copiar cotización a WhatsApp
  const handleCopyCotizacion = () => {
    let msg = `🎲 *${baseName}*`
    if (activeEditionName && activeEditionName !== 'Estándar') {
      msg += ` (${activeEditionName})`
    }
    msg += `\n`
    msg += `📂 Categoría: ${categoria}\n`
    if (currentProduct.editorialMarca) msg += `🏢 Editorial: ${currentProduct.editorialMarca}\n`
    if (currentProduct.numJugadores) msg += `👥 Jugadores: ${currentProduct.numJugadores}\n`
    if (currentProduct.duracionMinutos) msg += `⏱️ Duración: ${currentProduct.duracionMinutos} min\n`
    if (currentProduct.edadMinima) msg += `🎂 Edad: ${currentProduct.edadMinima}+ años\n`
    if (currentProduct.idioma) msg += `🌐 Idioma: ${currentProduct.idioma}\n`
    msg += `💵 *Precio PVP:* ${formatCurrency(pvp)}\n`

    if (currentProduct.enOferta && currentProduct.precioOferta) {
      msg += `🔥 *Precio Oferta:* ${formatCurrency(Number(currentProduct.precioOferta))} (${currentProduct.porcentajeDescuento || 0}% OFF)\n`
    }

    if (currentProduct.controlarStock) {
      msg += `📦 Disponibilidad: ${currentProduct.stock && currentProduct.stock > 0 ? `${currentProduct.stock} unidades en stock` : 'Agotado temporalmente'}\n`
    }

    navigator.clipboard.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(`Cotización de "${baseName}${activeEditionName && activeEditionName !== 'Estándar' ? ` - ${activeEditionName}` : ''}" copiada al portapapeles`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto overflow-x-hidden p-0 rounded-2xl border-border bg-card shadow-2xl"
      >
        <DialogTitle className="sr-only">{baseName}</DialogTitle>
        <DialogDescription className="sr-only">Ficha técnica y detalle del juego de mesa y sus ediciones</DialogDescription>

        {/* ========================================================================= */}
        {/* HERO HEADER CON AMBIENT BACKDROP Y FOTOGRAFÍA                             */}
        {/* ========================================================================= */}
        <div className="relative w-full overflow-hidden bg-secondary/50 border-b border-border">
          {/* Ambient Blurred Artwork Glow */}
          {imageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-15 dark:opacity-25 scale-125 pointer-events-none"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          )}

          {/* Top Bar: Badges y Botón Cerrar */}
          <div className="relative z-10 flex items-center justify-between p-4 pb-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              <Badge variant="outline" className="text-[11px] font-bold bg-card/90 backdrop-blur-xs border-border text-foreground px-2.5 py-0.5">
                {categoria}
              </Badge>

              {currentProduct.activo ? (
                <span className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Activo</span>
                </span>
              ) : (
                <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">
                  Archivado
                </span>
              )}

              {isMultiEdition && (
                <Badge variant="secondary" className="text-[10px] font-bold gap-1 px-2 py-0.5 bg-primary/10 text-primary border-primary/20">
                  <Layers className="w-3 h-3" />
                  <span>{variants.length} Ediciones</span>
                </Badge>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full bg-card/90 backdrop-blur-xs text-muted-foreground hover:text-foreground hover:bg-card flex items-center justify-center transition-colors cursor-pointer border border-border/80 shadow-2xs shrink-0"
              title="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Hero Content: Portada + Info Principal */}
          <div className="relative z-10 p-4 pt-1 sm:p-6 sm:pt-2 flex flex-col sm:flex-row gap-4 items-start">
            {/* Foto de Portada */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-xl bg-secondary border border-border overflow-hidden shrink-0 shadow-sm flex items-center justify-center mx-auto sm:mx-0">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={baseName}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center">
                  <Package className="w-8 h-8 text-primary/40 mb-1" />
                  <span className="text-[10px]">Sin imagen</span>
                </div>
              )}
            </div>

            {/* Metadatos y Títulos */}
            <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight">
                  {baseName}
                </h2>
                {activeEditionName && activeEditionName !== 'Estándar' && (
                  <p className="text-sm font-semibold text-primary flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Edición: {activeEditionName}</span>
                  </p>
                )}
              </div>

              {/* Editorial / Marca e Idioma */}
              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground flex-wrap">
                {currentProduct.editorialMarca && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span>{currentProduct.editorialMarca}</span>
                  </span>
                )}
                {currentProduct.idioma && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5 text-primary" />
                    <span>{currentProduct.idioma}</span>
                  </span>
                )}
              </div>

              {/* BGG Link & Rating */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                {bggRating != null && (
                  <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                    <span>{bggRating.toFixed(1)}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">/ 10 BGG</span>
                  </div>
                )}

                {bggId ? (
                  <a
                    href={`https://boardgamegeek.com/boardgame/${bggId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground font-medium text-xs border border-border transition-colors"
                  >
                    <span>Ver en BGG (#{bggId})</span>
                    <ExternalLink className="w-3 h-3 text-primary" />
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CONTENIDO DEL MODAL                                                       */}
        {/* ========================================================================= */}
        <div className="p-5 sm:p-6 space-y-6 min-w-0">
          {/* ========================================================================= */}
          {/* SELECTOR DE EDICIONES Y VERSIONES DEL JUEGO                              */}
          {/* ========================================================================= */}
          <div className="bg-secondary/30 rounded-xl p-3.5 sm:p-4 border border-border space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Ediciones y Versiones Disponibles ({variants.length})
                </h3>
              </div>

              {onAddEdition && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddEdition(currentProduct, baseName)}
                  className="h-7 text-xs font-bold gap-1 rounded-lg border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Nueva Edición</span>
                </Button>
              )}
            </div>

            {/* Listado de tarjetas de edición */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
              {variants.map((v, idx) => {
                const isSelected = idx === selectedVariantIndex
                const p = v.producto
                const stockLabel = p.controlarStock
                  ? (p.stock && p.stock > 0 ? `${p.stock} un.` : 'Agotado')
                  : 'A pedido'

                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedVariantIndex(idx)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-card border-primary ring-2 ring-primary/20 shadow-xs'
                        : 'bg-card/60 hover:bg-card border-border/80 hover:border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5 w-full">
                      <div className="min-w-0 flex-1">
                        <span className={`text-xs font-bold block truncate ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {v.variantName}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {p.controlarStock ? (
                            p.stock && p.stock > 0 ? (
                              <span className="text-emerald-700 dark:text-emerald-400 font-medium">● {stockLabel}</span>
                            ) : (
                              <span className="text-rose-600 dark:text-rose-400 font-medium">● Agotado</span>
                            )
                          ) : (
                            <span>○ {stockLabel}</span>
                          )}
                        </span>
                      </div>
                      {isSelected && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1 pt-1 border-t border-border/50 w-full text-[11px]">
                      <span className="font-mono font-bold text-foreground">
                        {formatCurrency(p.precioMercado)}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                        {calcMargen(p.precioMercado, p.costoBase)}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* ESTRUCTURA FINANCIERA & PRECIOS DE LA EDICIÓN SELECCIONADA                */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span>Precios y Rentabilidad ({activeEditionName})</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Costo Base */}
              <div className="bg-secondary/30 p-3.5 rounded-xl border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium block">
                  Costo Base (Adquisición)
                </span>
                <span className="font-mono text-base font-bold text-foreground block">
                  {formatCurrency(costo)}
                </span>
                <span className="text-[10px] text-muted-foreground">Precio de compra o costo</span>
              </div>

              {/* Precio Mercado (PVP) */}
              <div className="bg-primary/5 p-3.5 rounded-xl border border-primary/25 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-primary font-bold block">
                    Precio Mercado (PVP)
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 px-1.5 py-0">
                    {calcMargen(pvp, costo)}
                  </Badge>
                </div>
                <span className="font-mono text-lg font-black text-foreground block">
                  {formatCurrency(pvp)}
                </span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-medium">
                  Ganancia: +{formatCurrency(gananciaPvp)}
                </span>
              </div>

              {/* Precio Amigos */}
              <div className="bg-secondary/30 p-3.5 rounded-xl border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    Precio Amigos / Especial
                  </span>
                  {amigos > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground font-mono">
                      {calcMargen(amigos, costo)}
                    </span>
                  )}
                </div>
                <span className="font-mono text-base font-bold text-foreground block">
                  {formatCurrency(amigos)}
                </span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  Ganancia: +{formatCurrency(gananciaAmigos)}
                </span>
              </div>
            </div>

            {/* Oferta Especial si aplica */}
            {currentProduct.enOferta && currentProduct.precioOferta && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                      En Oferta Promocional ({currentProduct.porcentajeDescuento || 0}% de descuento)
                    </span>
                    <span className="text-[11px] text-rose-700/80 dark:text-rose-400">
                      Precio normal: {formatCurrency(pvp)}
                    </span>
                  </div>
                </div>
                <span className="font-mono text-lg font-black text-rose-700 dark:text-rose-300 shrink-0">
                  {formatCurrency(Number(currentProduct.precioOferta))}
                </span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* FICHA TÉCNICA LÚDICA & SPECS BGG                                          */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Dices className="w-3.5 h-3.5 text-primary" />
              <span>Especificaciones Lúdicas</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/30 p-4 rounded-xl border border-border">
              {/* Jugadores */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Jugadores
                </span>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    {currentProduct.numJugadores || '—'}
                  </span>
                </div>
              </div>

              {/* Duración */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Duración
                </span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    {currentProduct.duracionMinutos ? `${currentProduct.duracionMinutos} min` : '—'}
                  </span>
                </div>
              </div>

              {/* Edad Mínima */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Edad Mínima
                </span>
                <div className="flex items-center gap-1.5">
                  <Baby className="w-4 h-4 text-primary shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    {currentProduct.edadMinima ? `${currentProduct.edadMinima}+ años` : '—'}
                  </span>
                </div>
              </div>

              {/* Rating BGG */}
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Rating BGG
                </span>
                <div className="flex items-center gap-1.5">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                  <span className="font-bold text-xs sm:text-sm text-foreground">
                    {bggRating ? bggRating.toFixed(1) : '—'}
                    <span className="text-[10px] text-muted-foreground font-normal"> / 10</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Mecánicas */}
            {currentProduct.mecanicas && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  Mecánicas Principales:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {currentProduct.mecanicas.split(',').map((mec, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="text-xs bg-secondary/60 text-foreground border-border py-0.5 px-2.5 font-normal"
                    >
                      {mec.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* ESTADO DE STOCK & DESCRIPCIÓN                                             */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-1 border-t border-border">
            <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl border border-border text-xs">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold text-foreground">Disponibilidad en Almacén ({activeEditionName}):</span>
              </div>
              {currentProduct.controlarStock ? (
                <span className="font-mono font-bold text-foreground">
                  {currentProduct.stock && currentProduct.stock > 0 ? (
                    <span className="text-emerald-700 dark:text-emerald-400">
                      {currentProduct.stock} unidades físicas
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400">
                      Agotado (0 unidades)
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground italic">Comercialización a pedido</span>
              )}
            </div>

            {/* Sinopsis / Descripción */}
            {currentProduct.descripcionWeb && (
              <div className="bg-secondary/20 p-4 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap space-y-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-primary" />
                  <span>Sinopsis / Reseña</span>
                </span>
                <p>{currentProduct.descripcionWeb}</p>
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FOOTER ACTIONS                                                            */}
        {/* ========================================================================= */}
        <div className="p-4 sm:p-5 border-t border-border flex items-center justify-between bg-card sticky bottom-0 gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCotizacion}
            className="gap-1.5 text-xs rounded-xl cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-primary" />
            )}
            <span>{copied ? '¡Copiado!' : 'Copiar Cotización WhatsApp'}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl cursor-pointer"
            >
              Cerrar
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                onClose()
                onEdit(currentProduct)
              }}
              className="gap-1.5 text-xs rounded-xl font-bold cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar {activeEditionName && activeEditionName !== 'Estándar' ? `(${activeEditionName})` : 'Ficha'}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
