'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ChevronDown,
  ChevronUp,
  Gauge
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
  const [isDescExpanded, setIsDescExpanded] = useState(false)

  // Lista normalizada de variantes (ediciones)
  const variants = useMemo(() => {
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
    setIsDescExpanded(false)
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
  const bggWeight = currentProduct.bggWeight ? Number(currentProduct.bggWeight) : null

  // Precios de la edición activa
  const costo = currentProduct.costoBase || 0
  const pvp = currentProduct.precioMercado || 0
  const amigos = currentProduct.precioAmigos || 0
  const gananciaPvp = Math.max(0, pvp - costo)
  const gananciaAmigos = Math.max(0, amigos - costo)

  // Ratio costo vs ganancia para la barra visual
  const costoRatio = pvp > 0 ? Math.min(100, Math.max(0, Math.round((costo / pvp) * 100))) : 0
  const margenRatio = Math.max(0, 100 - costoRatio)

  // Bullets de venta disponibles
  const bullets = [
    currentProduct.bulletPoint1,
    currentProduct.bulletPoint2,
    currentProduct.bulletPoint3,
    currentProduct.bulletPoint4
  ].filter(Boolean) as string[]

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

    if (currentProduct.enOferta && currentProduct.precioOferta) {
      msg += `🔥 *Precio Oferta:* ${formatCurrency(Number(currentProduct.precioOferta))} (${currentProduct.porcentajeDescuento || 0}% OFF)\n`
      msg += `💵 Precio regular: ${formatCurrency(pvp)}\n`
    } else {
      msg += `💵 *Precio PVP:* ${formatCurrency(pvp)}\n`
    }

    if (currentProduct.controlarStock) {
      msg += `📦 Disponibilidad: ${currentProduct.stock && currentProduct.stock > 0 ? `${currentProduct.stock} unidades en stock` : 'Agotado temporalmente'}\n`
    }

    navigator.clipboard.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success(`Cotización de "${baseName}" copiada al portapapeles`)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl w-[95vw] sm:w-full max-h-[92dvh] sm:max-h-[88dvh] p-0 flex flex-col overflow-hidden rounded-3xl border-border bg-card shadow-2xl"
      >
        <DialogTitle className="sr-only">{baseName}</DialogTitle>
        <DialogDescription className="sr-only">Ficha técnica y comercial del producto</DialogDescription>

        {/* ========================================================================= */}
        {/* HERO HEADER REFINADO CON AMBIENT BACKDROP                                  */}
        {/* ========================================================================= */}
        <div className="relative shrink-0 overflow-hidden bg-secondary/35 border-b border-border/80">
          {/* Ambient Glow de la portada */}
          {imageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center blur-2xl opacity-20 dark:opacity-30 scale-125 pointer-events-none"
              style={{ backgroundImage: `url(${imageUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-transparent to-card/90 pointer-events-none" />

          {/* Botón flotante para cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 z-20 h-8 w-8 rounded-full bg-card/85 backdrop-blur-md text-muted-foreground hover:text-foreground hover:bg-card flex items-center justify-center transition-all cursor-pointer border border-border/80 shadow-2xs"
            title="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Badges de cabecera */}
          <div className="relative z-10 px-5 pt-4 pb-2 pr-12 flex items-center gap-1.5 flex-wrap">
            <Badge
              variant="outline"
              className="text-[11px] font-bold bg-card/90 backdrop-blur-xs border-border/90 text-foreground px-2.5 py-0.5 rounded-full shadow-2xs"
            >
              {categoria}
            </Badge>

            {currentProduct.activo ? (
              <span className="bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Activo</span>
              </span>
            ) : (
              <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-border">
                Archivado
              </span>
            )}

            {currentProduct.destacadoWeb && (
              <Badge
                variant="outline"
                className="text-[10px] font-bold gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Destacado</span>
              </Badge>
            )}

            {isMultiEdition && (
              <Badge
                variant="secondary"
                className="text-[10px] font-bold gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border-primary/20"
              >
                <Layers className="w-3 h-3" />
                <span>{variants.length} Ediciones</span>
              </Badge>
            )}
          </div>

          {/* Información principal del producto */}
          <div className="relative z-10 px-5 pb-5 pt-1 sm:px-6 sm:pb-6 flex flex-col sm:flex-row gap-4 items-center sm:items-start text-center sm:text-left">
            {/* Portada / Artwork */}
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-secondary/80 border border-border overflow-hidden shrink-0 shadow-md flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={baseName}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-secondary via-accent/30 to-secondary flex flex-col items-center justify-center p-2 text-center">
                  <Dices className="w-7 h-7 text-primary/60 mb-1" />
                  <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground/80">
                    Sin portada
                  </span>
                </div>
              )}
            </div>

            {/* Metadatos y Título */}
            <div className="min-w-0 flex-1 space-y-1.5">
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
                  {baseName}
                </h2>
                {activeEditionName && activeEditionName !== 'Estándar' && (
                  <p className="text-xs font-semibold text-primary flex items-center justify-center sm:justify-start gap-1 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Edición: {activeEditionName}</span>
                  </p>
                )}
              </div>

              {/* Editorial / Idioma */}
              <div className="flex items-center justify-center sm:justify-start gap-3 text-xs text-muted-foreground flex-wrap">
                {currentProduct.editorialMarca && (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{currentProduct.editorialMarca}</span>
                  </span>
                )}
                {currentProduct.idioma && (
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Globe className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{currentProduct.idioma}</span>
                  </span>
                )}
              </div>

              {/* BGG Data Chips */}
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1 flex-wrap">
                {bggRating != null && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-400 font-bold text-xs shadow-2xs">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    <span>{bggRating.toFixed(1)}</span>
                    <span className="text-[10px] font-normal text-muted-foreground">/ 10 BGG</span>
                  </div>
                )}

                {bggId ? (
                  <a
                    href={`https://boardgamegeek.com/boardgame/${bggId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-card/80 hover:bg-card text-muted-foreground hover:text-foreground font-medium text-xs border border-border/80 transition-colors shadow-2xs"
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
        {/* CUERPO SCROLLEABLE                                                        */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6 space-y-6 min-w-0 overscroll-contain">
          {/* ========================================================================= */}
          {/* EDICIONES Y VERSIONES DISPONIBLES                                         */}
          {/* ========================================================================= */}
          {isMultiEdition ? (
            <div className="bg-secondary/35 rounded-2xl p-4 border border-border/80 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Ediciones y Versiones ({variants.length})
                  </h3>
                </div>

                {onAddEdition && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onAddEdition(currentProduct, baseName)}
                    className="h-7 text-xs font-bold gap-1 rounded-xl border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Nueva Edición</span>
                  </Button>
                )}
              </div>

              {/* Grid interactivo de variantes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
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
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-card border-primary ring-2 ring-primary/20 shadow-xs'
                          : 'bg-card/70 hover:bg-card border-border/70 hover:border-border'
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
                                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">● {stockLabel}</span>
                              ) : (
                                <span className="text-rose-600 dark:text-rose-400 font-semibold">● Agotado</span>
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

                      <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-border/50 w-full text-[11px]">
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
          ) : (
            /* Versión única: Barra limpia y discreta sin duplicar información */
            <div className="flex items-center justify-between p-3 rounded-xl bg-secondary/35 border border-border/70 text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>Edición:</span>
                <span className="font-bold text-foreground">{activeEditionName || 'Estándar'}</span>
              </div>
              {onAddEdition && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddEdition(currentProduct, baseName)}
                  className="h-6 text-xs text-primary hover:text-primary hover:bg-primary/10 gap-1 rounded-lg px-2 font-semibold cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>Añadir otra versión</span>
                </Button>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ESTRUCTURA FINANCIERA Y RENTABILIDAD                                       */}
          {/* ========================================================================= */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-primary" />
                <span>Precios y Rentabilidad {isMultiEdition ? `(${activeEditionName})` : ''}</span>
              </h3>
            </div>

            {/* Tarjeta Hero de Precio de Venta (PVP) */}
            <div className="bg-gradient-to-br from-primary/5 via-primary/8 to-card border border-primary/25 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground tracking-tight">
                    Precio Mercado (PVP)
                  </span>
                  <span className="text-[11px] text-muted-foreground">Tarifa principal al público</span>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs font-mono font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30 px-2 py-0.5 rounded-full"
                >
                  +{calcMargen(pvp, costo)} margen
                </Badge>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="font-mono text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                    {formatCurrency(pvp)}
                  </span>
                </div>
                <div className="text-xs font-medium text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ganancia bruta estimada:</span>
                  <span className="font-mono font-bold">+{formatCurrency(gananciaPvp)}</span>
                </div>
              </div>

              {/* Barra de desglose Costo vs Margen */}
              {pvp > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-primary/15">
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                    <div
                      className="bg-muted-foreground/35 h-full transition-all duration-300"
                      style={{ width: `${costoRatio}%` }}
                      title={`Costo: ${costoRatio}%`}
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: `${margenRatio}%` }}
                      title={`Margen: ${margenRatio}%`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                    <span>Inversión Costo: {formatCurrency(costo)} ({costoRatio}%)</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      Margen Bruto: +{formatCurrency(gananciaPvp)} ({margenRatio}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Grid de Tarifas Secundarias */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Costo Base de Adquisición */}
              <div className="bg-secondary/35 p-3.5 sm:p-4 rounded-2xl border border-border/80 space-y-1">
                <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">
                  Costo Base (Adquisición)
                </span>
                <span className="font-mono text-xl font-bold text-foreground block">
                  {formatCurrency(costo)}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Precio neto de compra o costo por unidad
                </span>
              </div>

              {/* Tarifa Especial / Amigos */}
              <div className="bg-secondary/35 p-3.5 sm:p-4 rounded-2xl border border-border/80 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider block">
                    Precio Amigos / Especial
                  </span>
                  {amigos > 0 && (
                    <Badge variant="outline" className="text-[10px] font-mono font-bold bg-card border-border/80 px-1.5 py-0">
                      {calcMargen(amigos, costo)}
                    </Badge>
                  )}
                </div>

                {amigos > 0 ? (
                  <>
                    <span className="font-mono text-xl font-bold text-foreground block">
                      {formatCurrency(amigos)}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-mono block">
                      Ganancia: +{formatCurrency(gananciaAmigos)}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-muted-foreground/80 italic block pt-0.5">
                      No asignado
                    </span>
                    <span className="text-[11px] text-muted-foreground block">
                      Tarifa preferencial sin configurar
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Banner de Oferta Especial si está activa */}
            {currentProduct.enOferta && currentProduct.precioOferta && (
              <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 sm:p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-600 shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                      En Oferta Promocional ({currentProduct.porcentajeDescuento || 0}% de descuento)
                    </span>
                    <span className="text-[11px] text-rose-700/80 dark:text-rose-400">
                      Precio de lista: {formatCurrency(pvp)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-bold block">
                    Precio Oferta
                  </span>
                  <span className="font-mono text-xl font-black text-rose-700 dark:text-rose-300">
                    {formatCurrency(Number(currentProduct.precioOferta))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* FICHA TÉCNICA LÚDICA Y SPECS                                              */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Dices className="w-3.5 h-3.5 text-primary" />
              <span>Especificaciones Lúdicas</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Jugadores */}
              <div className="bg-secondary/35 p-3 rounded-xl border border-border/80 space-y-1">
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
              <div className="bg-secondary/35 p-3 rounded-xl border border-border/80 space-y-1">
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
              <div className="bg-secondary/35 p-3 rounded-xl border border-border/80 space-y-1">
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

              {/* Complejidad / Rating BGG */}
              <div className="bg-secondary/35 p-3 rounded-xl border border-border/80 space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  {bggWeight ? 'Complejidad BGG' : 'Rating BGG'}
                </span>
                <div className="flex items-center gap-1.5">
                  {bggWeight ? (
                    <>
                      <Gauge className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        {bggWeight.toFixed(1)}
                        <span className="text-[10px] text-muted-foreground font-normal"> / 5</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4 fill-amber-500 text-amber-500 shrink-0" />
                      <span className="font-bold text-xs sm:text-sm text-foreground">
                        {bggRating ? bggRating.toFixed(1) : '—'}
                        <span className="text-[10px] text-muted-foreground font-normal"> / 10</span>
                      </span>
                    </>
                  )}
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
                      className="text-xs bg-secondary/50 text-foreground border-border/80 py-0.5 px-2.5 font-medium rounded-lg"
                    >
                      {mec.trim()}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Puntos Clave de Venta (Bullets) si existen */}
            {bullets.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-muted-foreground block">
                  Puntos Destacados:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {bullets.map((b, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-secondary/30 border border-border/70 flex items-start gap-2 text-xs text-foreground"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* ALMACÉN & SINOPSIS                                                        */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-2 border-t border-border/80">
            {/* Disponibilidad en Almacén */}
            <div className="flex items-center justify-between p-3.5 bg-secondary/35 rounded-2xl border border-border/80 text-xs">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold text-foreground">
                  Disponibilidad en Almacén {isMultiEdition ? `(${activeEditionName})` : ''}:
                </span>
              </div>
              {currentProduct.controlarStock ? (
                <span className="font-mono font-bold text-foreground">
                  {currentProduct.stock && currentProduct.stock > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {currentProduct.stock} {currentProduct.stock === 1 ? 'unidad' : 'unidades'} físicas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Agotado (0 unidades)
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground italic font-medium">
                  Comercialización bajo pedido
                </span>
              )}
            </div>

            {/* Sinopsis / Descripción con expandible elegante */}
            {currentProduct.descripcionWeb && (
              <div className="bg-secondary/25 p-4 rounded-2xl border border-border/80 text-xs text-muted-foreground space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>Sinopsis / Reseña</span>
                </span>
                <p className={`leading-relaxed whitespace-pre-wrap ${!isDescExpanded && currentProduct.descripcionWeb.length > 220 ? 'line-clamp-3' : ''}`}>
                  {currentProduct.descripcionWeb}
                </p>
                {currentProduct.descripcionWeb.length > 220 && (
                  <button
                    type="button"
                    onClick={() => setIsDescExpanded(!isDescExpanded)}
                    className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1 cursor-pointer pt-0.5"
                  >
                    <span>{isDescExpanded ? 'Ver menos' : 'Leer descripción completa'}</span>
                    {isDescExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DOCKED FOOTER ACTIONS (Fijo, elegante y responsive)                        */}
        {/* ========================================================================= */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-border/80 bg-card/95 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Botón WhatsApp */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCotizacion}
            className={`gap-2 text-xs font-semibold rounded-xl cursor-pointer transition-all border shadow-2xs ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'border-emerald-600/30 text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20'
            }`}
          >
            {copied ? (
              <Check className="w-4 h-4 text-white" />
            ) : (
              <Share2 className="w-4 h-4 text-emerald-600" />
            )}
            <span>{copied ? '¡Cotización copiada!' : 'Copiar Cotización WhatsApp'}</span>
          </Button>

          {/* Acciones principales */}
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl cursor-pointer px-4"
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
              className="gap-1.5 text-xs rounded-xl font-bold cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs px-4"
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
