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
  Plus,
  TrendingUp,
  Warehouse,
  BookOpen,
  CheckCircle2,
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

  // Reset al cambiar producto o al abrir
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

  // Portada / Artwork
  const coverUrl = currentProduct.imagenUrl || (group?.variants.find((v) => v.producto.imagenUrl)?.producto.imagenUrl ?? null)

  // BGG Data
  const bggId = currentProduct.bggId || group?.bggId
  const bggRating = currentProduct.bggRating ? Number(currentProduct.bggRating) : (group?.bggRating ?? null)
  const bggWeight = currentProduct.bggWeight ? Number(currentProduct.bggWeight) : null

  // Precios y métricas financieras exactas
  const costo = currentProduct.costoBase || 0
  const pvp = currentProduct.precioMercado || 0
  const amigos = currentProduct.precioAmigos || 0
  const gananciaPvp = Math.max(0, pvp - costo)
  const gananciaAmigos = Math.max(0, amigos - costo)

  // Margen de ganancia sobre costo (Markup)
  const markupPct = costo > 0 ? Math.round(((pvp - costo) / costo) * 100) : (pvp > 0 ? 100 : 0)
  const markupAmigosPct = costo > 0 ? Math.round(((amigos - costo) / costo) * 100) : (amigos > 0 ? 100 : 0)

  // Desglose Costo vs Margen sobre venta (PVP) para la barra NOVA
  const costoRatio = pvp > 0 ? Math.min(100, Math.max(0, Math.round((costo / pvp) * 100))) : 0
  const margenRatio = Math.max(0, 100 - costoRatio)

  // Bullets de venta disponibles
  const bullets = [
    currentProduct.bulletPoint1,
    currentProduct.bulletPoint2,
    currentProduct.bulletPoint3,
    currentProduct.bulletPoint4
  ].filter(Boolean) as string[]

  // Copiar cotización WhatsApp
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

    if (bggId) {
      msg += `🔗 Más info: https://boardgamegeek.com/boardgame/${bggId}\n`
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
        className="w-full max-w-xl sm:max-w-xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] p-0 gap-0 ring-0"
      >
        <DialogTitle className="sr-only">{baseName}</DialogTitle>
        <DialogDescription className="sr-only">Detalle y cotización del juego de mesa</DialogDescription>

        {/* ========================================================================= */}
        {/* ENCABEZADO Y PORTADA EDITORIAL                                            */}
        {/* ========================================================================= */}
        <div className="px-6 pt-5 pb-4 border-b border-border/60 relative bg-card/60 shrink-0">
          {/* Botón superior de cierre X */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-20 h-7 w-7 rounded-full bg-secondary/80 hover:bg-secondary text-muted-foreground hover:text-foreground flex items-center justify-center transition-all cursor-pointer border border-border/70 shadow-2xs"
            title="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="flex gap-4 items-start pr-6">
            {/* Visor de Portada (Formato Caja/Libro) */}
            <div className="w-20 h-28 rounded-xl bg-secondary/60 border border-border/80 shrink-0 shadow-2xs overflow-hidden flex items-center justify-center relative group">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={baseName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-1 text-center">
                  <Dices className="w-8 h-8 text-primary/40" />
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase text-center mt-1">
                    Sin Portada
                  </span>
                </div>
              )}
            </div>

            {/* Información del Juego */}
            <div className="min-w-0 flex-1">
              {/* Fila de Badges superiores */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {currentProduct.activo ? (
                  <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Activo</span>
                  </span>
                ) : (
                  <span className="bg-muted text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full border border-border">
                    Archivado
                  </span>
                )}

                <span className="bg-secondary text-foreground border border-border/80 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {currentProduct.idioma || 'Español'}
                </span>

                {categoria && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold bg-card border-border/80 text-muted-foreground px-2 py-0.5 rounded-full"
                  >
                    {categoria}
                  </Badge>
                )}
              </div>

              {/* Título en casing natural, sin uppercase tosco */}
              <h2 className="text-lg font-bold text-foreground leading-snug mt-1 line-clamp-2">
                {baseName}
              </h2>

              {/* Enlace a BGG */}
              {bggId ? (
                <a
                  href={`https://boardgamegeek.com/boardgame/${bggId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-border/80 text-foreground text-xs font-semibold h-7 px-2.5 rounded-lg flex items-center gap-1.5 hover:bg-secondary w-fit mt-2 transition-colors cursor-pointer"
                >
                  <span>Ver en BGG (#{bggId})</span>
                  <ExternalLink className="w-3 h-3 text-primary" />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CUERPO CENTRAL CON SCROLL VERTICAL SUAVE                                  */}
        {/* ========================================================================= */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 min-w-0 overscroll-contain">
          {/* Selector de Edición / Versión */}
          <div className="space-y-2">
            <div className="bg-secondary/50 border border-border/70 rounded-xl p-2.5 flex items-center justify-between">
              <div className="flex items-center text-xs">
                <Layers className="w-4 h-4 text-primary mr-2 inline shrink-0" />
                <span className="text-muted-foreground">Edición activa:</span>
                <span className="font-bold text-xs text-foreground ml-1">
                  {activeEditionName || 'Estándar'}
                </span>
              </div>
              {onAddEdition && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddEdition(currentProduct, baseName)}
                  className="text-primary hover:bg-primary/10 text-xs font-semibold h-7 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir otra versión</span>
                </Button>
              )}
            </div>

            {/* Selector de versiones interactivas si tiene múltiples ediciones */}
            {isMultiEdition && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {variants.map((v, idx) => {
                  const isSelected = idx === selectedVariantIndex
                  return (
                    <button
                      key={v.producto.id}
                      type="button"
                      onClick={() => setSelectedVariantIndex(idx)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                          : 'bg-secondary/60 hover:bg-secondary text-muted-foreground hover:text-foreground border-border/70'
                      }`}
                    >
                      <span>{v.variantName}</span>
                      <span className="font-mono text-[10px] opacity-80">
                        ({formatCurrency(v.producto.precioMercado)})
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* SECCIÓN PRECIOS Y RENTABILIDAD                                             */}
          {/* ========================================================================= */}
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center">
              <TrendingUp className="w-4 h-4 text-primary mr-2 inline" />
              <span>Precios y Rentabilidad</span>
            </div>

            {/* Tarjeta Principal (PVP Mercado / Venta) */}
            <div className="bg-card border border-border rounded-xl p-4.5 shadow-2xs space-y-3.5">
              {/* Cabecera de la Tarjeta */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-foreground">Precio Mercado (PVP)</div>
                  <div className="text-[11px] text-muted-foreground">Tarifa principal al público</div>
                </div>
                <Badge
                  variant="outline"
                  className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 rounded-md"
                >
                  +{markupPct}% markup
                </Badge>
              </div>

              {/* Monto y Ganancia */}
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-foreground tracking-tight font-mono">
                  {formatCurrency(pvp)}
                </span>
                <div className="text-right">
                  <span className="text-[11px] text-muted-foreground block">Ganancia estimada:</span>
                  <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 font-mono">
                    +{formatCurrency(gananciaPvp)}
                  </span>
                </div>
              </div>

              {/* Barra de Rentabilidad NOVA (Costo vs. Margen) */}
              {pvp > 0 && (
                <div className="space-y-1.5 pt-0.5">
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                    <div
                      className="bg-muted-foreground/30 h-full transition-all duration-300"
                      style={{ width: `${costoRatio}%` }}
                      title={`Inversión Costo: ${costoRatio}%`}
                    />
                    <div
                      className="bg-emerald-700 dark:bg-emerald-600 h-full transition-all duration-300"
                      style={{ width: `${margenRatio}%` }}
                      title={`Margen sobre Venta: ${margenRatio}%`}
                    />
                  </div>
                  <div className="text-[11px] flex justify-between pt-1">
                    <span className="text-muted-foreground font-medium">
                      Inversión Costo: {formatCurrency(costo)} ({costoRatio}%)
                    </span>
                    <span className="text-emerald-800 dark:text-emerald-300 font-bold">
                      Margen sobre Venta: +{formatCurrency(gananciaPvp)} ({margenRatio}%)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Cuadrícula de Tarifas Secundarias (Costo Base & Precio Amigos) */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {/* Caja 1: Costo Base (Adquisición) */}
              <div className="bg-secondary/40 border border-border/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  COSTO BASE
                </span>
                <span className="text-sm font-extrabold text-foreground mt-1 font-mono">
                  {formatCurrency(costo)}
                </span>
              </div>

              {/* Caja 2: Precio Amigos / Especial */}
              <div className="bg-secondary/40 border border-border/80 rounded-xl p-3 flex flex-col justify-between shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    PRECIO AMIGOS
                  </span>
                  {amigos > 0 && costo > 0 && (
                    <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 font-mono">
                      +{markupAmigosPct}% markup
                    </span>
                  )}
                </div>
                <span className="text-sm font-extrabold text-primary mt-1 font-mono">
                  {amigos > 0 ? formatCurrency(amigos) : 'No asignado'}
                </span>
              </div>
            </div>

            {/* Banner de Oferta Promocional si está activa */}
            {currentProduct.enOferta && currentProduct.precioOferta && (
              <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl flex items-center justify-between gap-3 shadow-2xs mt-3">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block">
                      En Oferta Promocional ({currentProduct.porcentajeDescuento || 0}% OFF)
                    </span>
                    <span className="text-[10px] text-rose-700/80 dark:text-rose-400">
                      Precio de lista: {formatCurrency(pvp)}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-mono text-base font-extrabold text-rose-700 dark:text-rose-300">
                    {formatCurrency(Number(currentProduct.precioOferta))}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* ESPECIFICACIONES LÚDICAS Y SPECS                                          */}
          {/* ========================================================================= */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center">
              <Dices className="w-4 h-4 text-primary mr-2 inline" />
              <span>Especificaciones Lúdicas</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Jugadores */}
              <div className="bg-secondary/40 p-2.5 rounded-xl border border-border/80">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Jugadores
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-bold text-xs text-foreground truncate">
                    {currentProduct.numJugadores || '—'}
                  </span>
                </div>
              </div>

              {/* Duración */}
              <div className="bg-secondary/40 p-2.5 rounded-xl border border-border/80">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Duración
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-bold text-xs text-foreground truncate">
                    {currentProduct.duracionMinutos ? `${currentProduct.duracionMinutos} min` : '—'}
                  </span>
                </div>
              </div>

              {/* Edad Mínima */}
              <div className="bg-secondary/40 p-2.5 rounded-xl border border-border/80">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  Edad Mínima
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Baby className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="font-bold text-xs text-foreground truncate">
                    {currentProduct.edadMinima ? `${currentProduct.edadMinima}+ años` : '—'}
                  </span>
                </div>
              </div>

              {/* Rating BGG / Complejidad */}
              <div className="bg-secondary/40 p-2.5 rounded-xl border border-border/80">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                  {bggWeight ? 'Complejidad' : 'Rating BGG'}
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {bggWeight ? (
                    <>
                      <Gauge className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="font-bold text-xs text-foreground">
                        {bggWeight.toFixed(1)} <span className="text-[9px] text-muted-foreground font-normal">/ 5</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                      <span className="font-bold text-xs text-foreground">
                        {bggRating ? bggRating.toFixed(1) : '—'} <span className="text-[9px] text-muted-foreground font-normal">/ 10</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Editorial y Mecánicas */}
            {(currentProduct.editorialMarca || currentProduct.mecanicas) && (
              <div className="space-y-1.5 pt-0.5 text-xs">
                {currentProduct.editorialMarca && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Editorial:</span>
                    <span className="font-semibold text-foreground">{currentProduct.editorialMarca}</span>
                  </div>
                )}
                {currentProduct.mecanicas && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {currentProduct.mecanicas.split(',').map((mec, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] bg-secondary/50 text-foreground border-border/80 py-0 px-2 font-medium rounded-md"
                      >
                        {mec.trim()}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Puntos Destacados (Bullets) si existen */}
            {bullets.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {bullets.map((b, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-xl bg-secondary/30 border border-border/70 flex items-start gap-1.5 text-xs text-foreground"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* ALMACÉN Y SINOPSIS                                                        */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-1 border-t border-border/70">
            {/* Disponibilidad en Almacén */}
            <div className="flex items-center justify-between p-3 bg-secondary/40 rounded-xl border border-border/80 text-xs">
              <div className="flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-primary shrink-0" />
                <span className="font-bold text-foreground">
                  Disponibilidad en Almacén {isMultiEdition ? `(${activeEditionName})` : ''}:
                </span>
              </div>
              {currentProduct.controlarStock ? (
                <span className="font-mono font-bold">
                  {currentProduct.stock && currentProduct.stock > 0 ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {currentProduct.stock} {currentProduct.stock === 1 ? 'unidad' : 'unidades'} físicas
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
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

            {/* Sinopsis / Reseña */}
            {currentProduct.descripcionWeb && (
              <div className="bg-secondary/30 p-3.5 rounded-xl border border-border/80 text-xs text-muted-foreground space-y-1.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  <span>Sinopsis / Reseña</span>
                </div>
                <p className={`leading-relaxed whitespace-pre-wrap ${!isDescExpanded && currentProduct.descripcionWeb.length > 200 ? 'line-clamp-3' : ''}`}>
                  {currentProduct.descripcionWeb}
                </p>
                {currentProduct.descripcionWeb.length > 200 && (
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
        {/* FOOTER DEL MODAL (GARANTÍA CERO TRUNCAMIENTOS)                             */}
        {/* ========================================================================= */}
        <div className="border-t border-border/70 bg-card/40 px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-auto shrink-0">
          {/* Botón "Copiar Cotización WhatsApp" */}
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyCotizacion}
            className={`border-emerald-600/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold h-10 px-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              copied ? 'bg-emerald-500/15 border-emerald-600/50' : ''
            }`}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            )}
            <span>{copied ? '¡Cotización copiada!' : 'Copiar Cotización WhatsApp'}</span>
          </Button>

          {/* Acciones de la derecha */}
          <div className="flex items-center gap-2 justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary h-10 px-4 cursor-pointer"
            >
              Cerrar
            </Button>

            <Button
              type="button"
              onClick={() => {
                onClose()
                onEdit(currentProduct)
              }}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-4.5 rounded-xl shadow-md shadow-primary/20 flex items-center justify-center gap-1.5 transition-all whitespace-nowrap cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Juego</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
