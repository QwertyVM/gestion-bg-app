'use client'

import React, { useState } from 'react'
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
  Tag
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
import type { ProductGroupRow } from './ProductsTableView'
import type { ProductoItem } from './CatalogoClient'

export interface ProductDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  group?: ProductGroupRow | null
  singleProduct?: ProductoItem | null
  onEdit: () => void
  formatCurrency: (val: number) => string
  calcMargen: (precio: number, costo: number) => string
}

export function ProductDetailsModal({
  isOpen,
  onClose,
  group,
  singleProduct,
  onEdit,
  formatCurrency,
  calcMargen
}: ProductDetailsModalProps) {
  const [copied, setCopied] = useState(false)

  if (!group && !singleProduct) return null

  const isGroup = Boolean(group && group.isGroup)
  const primaryProduct = isGroup
    ? group!.variants[0]?.producto
    : singleProduct!

  const baseName = group ? group.baseName : primaryProduct.nombreModelo
  const categoria = group ? group.lineaCategoria : (primaryProduct.lineaCategoria || 'General')
  const isActive = group ? group.hasActive : primaryProduct.activo

  // Portada
  const imageUrl = isGroup
    ? (group!.variants.find((v) => v.producto.imagenUrl)?.producto.imagenUrl || null)
    : (primaryProduct.imagenUrl || null)

  // BGG Data
  const bggId = group?.bggId || primaryProduct.bggId
  const bggRating = group?.bggRating ?? (primaryProduct.bggRating ? Number(primaryProduct.bggRating) : null)
  const bggWeight = primaryProduct.bggWeight ? Number(primaryProduct.bggWeight) : null

  // Precios
  const minCosto = group ? group.minCosto : primaryProduct.costoBase
  const maxCosto = group ? group.maxCosto : primaryProduct.costoBase
  const minMercado = group ? group.minPrecioMercado : primaryProduct.precioMercado
  const maxMercado = group ? group.maxPrecioMercado : primaryProduct.precioMercado
  const minAmigos = group ? group.minPrecioAmigos : primaryProduct.precioAmigos
  const maxAmigos = group ? group.maxPrecioAmigos : primaryProduct.precioAmigos

  // Copiar cotización a WhatsApp
  const handleCopyCotizacion = () => {
    let msg = `🎲 *${baseName}*\n`
    msg += `📂 Categoría: ${categoria}\n`
    if (primaryProduct.numJugadores) msg += `👥 Jugadores: ${primaryProduct.numJugadores}\n`
    if (primaryProduct.duracionMinutos) msg += `⏱️ Duración: ${primaryProduct.duracionMinutos} min\n`
    if (primaryProduct.idioma) msg += `🌐 Idioma: ${primaryProduct.idioma}\n`
    msg += `💵 *Precio:* ${formatCurrency(primaryProduct.precioMercado)}\n`

    if (primaryProduct.enOferta && primaryProduct.precioOferta) {
      msg += `🔥 *Precio Oferta:* ${formatCurrency(Number(primaryProduct.precioOferta))}\n`
    }

    navigator.clipboard.writeText(msg)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Cotización copiada al portapapeles')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl border-border bg-card shadow-xl">
        <DialogTitle className="sr-only">{baseName}</DialogTitle>
        <DialogDescription className="sr-only">Ficha técnica y detalles del juego</DialogDescription>

        {/* ========================================================================= */}
        {/* CABECERA VISUAL CON FOTOGRAFÍA                                            */}
        {/* ========================================================================= */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-secondary/70 border-b border-border flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={baseName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-muted-foreground">
              <Package className="w-12 h-12 text-primary/40 mb-2" />
              <span className="text-xs">Sin imagen de portada</span>
            </div>
          )}

          {/* Badges superiores */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="bg-card/90 backdrop-blur-xs text-[11px] font-bold px-2.5 py-1 rounded-full border border-border shadow-xs">
              {categoria}
            </span>
            {isActive ? (
              <span className="bg-emerald-500/90 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                Activo
              </span>
            ) : (
              <span className="bg-muted text-muted-foreground text-[11px] font-bold px-2.5 py-1 rounded-full shadow-xs">
                Archivado
              </span>
            )}
          </div>

          {/* Botón cerrar */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-card/90 backdrop-blur-xs text-foreground flex items-center justify-center shadow-xs hover:bg-card cursor-pointer border border-border"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ========================================================================= */}
        {/* CONTENIDO DEL MODAL                                                       */}
        {/* ========================================================================= */}
        <div className="p-6 space-y-6">
          {/* Título & BGG Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                {baseName}
              </h2>
              {primaryProduct.editorialMarca && (
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{primaryProduct.editorialMarca}</span>
                  {primaryProduct.idioma && (
                    <>
                      <span>•</span>
                      <span>{primaryProduct.idioma}</span>
                    </>
                  )}
                </p>
              )}
            </div>

            {bggId ? (
              <a
                href={`https://boardgamegeek.com/boardgame/${bggId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs border border-primary/20 transition-colors w-fit shrink-0"
              >
                <span>Ver en BoardGameGeek (#{bggId})</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : null}
          </div>

          {/* ========================================================================= */}
          {/* SPECS BOARDGAMEGEEK & DATOS LÚDICOS                                      */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-secondary/40 p-4 rounded-xl border border-border/80">
            {/* Rating BGG */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Rating BGG
              </span>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="font-bold text-sm text-foreground">
                  {bggRating ? bggRating.toFixed(1) : '—'}{' '}
                  <span className="text-xs text-muted-foreground font-normal">/ 10</span>
                </span>
              </div>
            </div>

            {/* Jugadores */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Jugadores
              </span>
              <div className="flex items-center gap-1">
                <Users className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-foreground">
                  {primaryProduct.numJugadores || '—'}
                </span>
              </div>
            </div>

            {/* Duración */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Duración
              </span>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-foreground">
                  {primaryProduct.duracionMinutos ? `${primaryProduct.duracionMinutos} min` : '—'}
                </span>
              </div>
            </div>

            {/* Edad Mínima */}
            <div className="space-y-0.5">
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                Edad
              </span>
              <div className="flex items-center gap-1">
                <Baby className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm text-foreground">
                  {primaryProduct.edadMinima ? `${primaryProduct.edadMinima}+ años` : '—'}
                </span>
              </div>
            </div>
          </div>

          {/* Mecánicas */}
          {primaryProduct.mecanicas && (
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Dices className="w-3.5 h-3.5 text-primary" />
                <span>Mecánicas de Juego:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {primaryProduct.mecanicas.split(',').map((mec, i) => (
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

          {/* ========================================================================= */}
          {/* INFORMACIÓN FINANCIERA & NIVELES DE PRECIOS                              */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-3 border-t border-border">
            <h3 className="text-xs font-black text-muted-foreground uppercase tracking-wider">
              Estructura de Precios y Rentabilidad
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Costo Base */}
              <div className="bg-secondary/30 p-3.5 rounded-xl border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium block">
                  Costo Base (Adquisición)
                </span>
                <span className="font-mono text-base font-bold text-foreground">
                  {minCosto === maxCosto ? formatCurrency(minCosto) : `${formatCurrency(minCosto)} – ${formatCurrency(maxCosto)}`}
                </span>
              </div>

              {/* Precio Mercado */}
              <div className="bg-primary/5 p-3.5 rounded-xl border border-primary/20 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-primary font-bold block">
                    Precio Mercado (PVP)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                    {calcMargen(primaryProduct.precioMercado, primaryProduct.costoBase)}
                  </span>
                </div>
                <span className="font-mono text-lg font-black text-foreground">
                  {minMercado === maxMercado ? formatCurrency(minMercado) : `${formatCurrency(minMercado)} – ${formatCurrency(maxMercado)}`}
                </span>
              </div>

              {/* Precio Amigos */}
              <div className="bg-secondary/30 p-3.5 rounded-xl border border-border space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-medium block">
                    Precio Amigos / Especial
                  </span>
                  {primaryProduct.precioAmigos > 0 && (
                    <span className="text-[10px] font-bold text-muted-foreground font-mono">
                      {calcMargen(primaryProduct.precioAmigos, primaryProduct.costoBase)}
                    </span>
                  )}
                </div>
                <span className="font-mono text-base font-bold text-foreground">
                  {minAmigos === maxAmigos ? formatCurrency(minAmigos) : `${formatCurrency(minAmigos)} – ${formatCurrency(maxAmigos)}`}
                </span>
              </div>
            </div>

            {/* Precio Oferta si está activo */}
            {primaryProduct.enOferta && primaryProduct.precioOferta && (
              <div className="bg-rose-500/10 border border-rose-500/25 p-3 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-rose-600" />
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300">
                    En Oferta Especial ({primaryProduct.porcentajeDescuento || 0}% de descuento)
                  </span>
                </div>
                <span className="font-mono text-base font-black text-rose-700 dark:text-rose-300">
                  {formatCurrency(Number(primaryProduct.precioOferta))}
                </span>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* ESTADO DE STOCK & DESCRIPCIÓN                                            */}
          {/* ========================================================================= */}
          <div className="space-y-3 pt-3 border-t border-border">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Inventario disponible:</span>
              {primaryProduct.controlarStock ? (
                <span className="font-mono font-bold text-foreground">
                  {primaryProduct.stock ?? 0} unidades físicas
                </span>
              ) : (
                <span className="text-muted-foreground">A pedido (sin control de stock estricto)</span>
              )}
            </div>

            {primaryProduct.descripcionWeb && (
              <div className="bg-secondary/30 p-3.5 rounded-xl border border-border text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {primaryProduct.descripcionWeb}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* ACCIONES DEL PIE                                                          */}
          {/* ========================================================================= */}
          <div className="flex items-center justify-between pt-4 border-t border-border gap-3 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyCotizacion}
              className="gap-1.5 text-xs rounded-xl"
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
                className="text-xs rounded-xl"
              >
                Cerrar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  onClose()
                  onEdit()
                }}
                className="gap-1.5 text-xs rounded-xl font-bold"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Editar Juego</span>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
