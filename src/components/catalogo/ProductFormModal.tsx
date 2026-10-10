'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Package,
  Sparkles,
  Link as LinkIcon,
  Loader2,
  ExternalLink,
  Tag,
  Dices,
  DollarSign,
  Boxes,
  Star,
  Users,
  Clock,
  Check
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { XMLParser } from 'fast-xml-parser'
import { createProducto, updateProducto } from '@/actions/productos'
import type { ProductoItem } from './CatalogoClient'

export interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (savedProduct: ProductoItem) => void
  editingProduct?: ProductoItem | null
  categoryNamesList: string[]
}

export function ProductFormModal({
  isOpen,
  onClose,
  onSaved,
  editingProduct,
  categoryNamesList
}: ProductFormModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'precios' | 'bgg'>('general')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingBgg, setIsFetchingBgg] = useState(false)

  const [formData, setFormData] = useState({
    nombreModelo: '',
    lineaCategoria: '',
    costoBase: '0',
    precioMercado: '0',
    precioAmigos: '0',
    precioComunidad: '0',
    activo: true,
    stock: '0',
    controlarStock: false,
    enOferta: false,
    precioOferta: '',
    porcentajeDescuento: '',
    imagenUrl: '',
    descripcionWeb: '',
    destacadoWeb: false,
    numJugadores: '',
    edadMinima: '',
    duracionMinutos: '',
    idioma: 'Español',
    editorialMarca: '',
    mecanicas: '',
    bggId: '',
    bggRating: null as number | null
  })

  // Sincronizar datos al abrir o cambiar editingProduct
  useEffect(() => {
    if (editingProduct) {
      setFormData({
        nombreModelo: editingProduct.nombreModelo || '',
        lineaCategoria: editingProduct.lineaCategoria || categoryNamesList[0] || 'General',
        costoBase: editingProduct.costoBase != null ? String(editingProduct.costoBase) : '0',
        precioMercado: editingProduct.precioMercado != null ? String(editingProduct.precioMercado) : '0',
        precioAmigos: editingProduct.precioAmigos != null ? String(editingProduct.precioAmigos) : '0',
        precioComunidad: editingProduct.precioComunidad != null ? String(editingProduct.precioComunidad) : '0',
        activo: editingProduct.activo ?? true,
        stock: editingProduct.stock != null ? String(editingProduct.stock) : '0',
        controlarStock: editingProduct.controlarStock ?? false,
        enOferta: editingProduct.enOferta ?? false,
        precioOferta: editingProduct.precioOferta != null ? String(editingProduct.precioOferta) : '',
        porcentajeDescuento: editingProduct.porcentajeDescuento != null ? String(editingProduct.porcentajeDescuento) : '',
        imagenUrl: editingProduct.imagenUrl || '',
        descripcionWeb: editingProduct.descripcionWeb || '',
        destacadoWeb: editingProduct.destacadoWeb ?? false,
        numJugadores: editingProduct.numJugadores || '',
        edadMinima: editingProduct.edadMinima != null ? String(editingProduct.edadMinima) : '',
        duracionMinutos: editingProduct.duracionMinutos != null ? String(editingProduct.duracionMinutos) : '',
        idioma: editingProduct.idioma || 'Español',
        editorialMarca: editingProduct.editorialMarca || '',
        mecanicas: editingProduct.mecanicas || '',
        bggId: editingProduct.bggId != null ? String(editingProduct.bggId) : '',
        bggRating: editingProduct.bggRating ? Number(editingProduct.bggRating) : null
      })
    } else {
      setFormData({
        nombreModelo: '',
        lineaCategoria: categoryNamesList[0] || 'General',
        costoBase: '0',
        precioMercado: '0',
        precioAmigos: '0',
        precioComunidad: '0',
        activo: true,
        stock: '0',
        controlarStock: false,
        enOferta: false,
        precioOferta: '',
        porcentajeDescuento: '',
        imagenUrl: '',
        descripcionWeb: '',
        destacadoWeb: false,
        numJugadores: '',
        edadMinima: '',
        duracionMinutos: '',
        idioma: 'Español',
        editorialMarca: '',
        mecanicas: '',
        bggId: '',
        bggRating: null
      })
    }
    setActiveTab('general')
  }, [editingProduct, categoryNamesList, isOpen])

  // Margen reactivo helper
  const calcMargen = (precioStr: string, costoStr: string) => {
    const p = parseFloat(precioStr) || 0
    const c = parseFloat(costoStr) || 0
    if (c <= 0) return p > 0 ? '+100%' : '+0%'
    const m = ((p - c) / c) * 100
    return m >= 0 ? `+${m.toFixed(0)}%` : `${m.toFixed(0)}%`
  }

  // Descuento reactivo
  const handleDescuentoChange = (val: string) => {
    const pMercado = parseFloat(formData.precioMercado) || 0
    const costoBase = parseFloat(formData.costoBase) || 0
    let descuento = parseFloat(val) || 0
    if (descuento < 0) descuento = 0
    if (descuento > 100) descuento = 100

    let nuevoPrecio = pMercado - (pMercado * descuento) / 100
    if (nuevoPrecio < costoBase && costoBase > 0) {
      nuevoPrecio = costoBase
      descuento = Math.round(((pMercado - nuevoPrecio) / pMercado) * 100)
    }

    setFormData((prev) => ({
      ...prev,
      porcentajeDescuento: descuento.toString(),
      precioOferta: nuevoPrecio.toFixed(2),
    }))
  }

  const handlePrecioOfertaChange = (val: string) => {
    const pMercado = parseFloat(formData.precioMercado) || 0
    const costoBase = parseFloat(formData.costoBase) || 0
    let nuevoPrecio = parseFloat(val) || 0
    if (nuevoPrecio < 0) nuevoPrecio = 0

    if (nuevoPrecio < costoBase && costoBase > 0) {
      nuevoPrecio = costoBase
    }

    let descuento = 0
    if (pMercado > 0 && nuevoPrecio < pMercado) {
      descuento = Math.round(((pMercado - nuevoPrecio) / pMercado) * 100)
    }

    setFormData((prev) => ({
      ...prev,
      precioOferta: nuevoPrecio.toString(),
      porcentajeDescuento: descuento.toString(),
    }))
  }

  // Consultar BoardGameGeek automáticamente para un ID
  const handleFetchBgg = async () => {
    const idVal = formData.bggId.trim()
    if (!idVal || isNaN(Number(idVal))) {
      toast.warning('Ingresa un ID numérico de BoardGameGeek válido')
      return
    }

    setIsFetchingBgg(true)
    toast.info(`Consultando juego #${idVal} en BGG...`)

    try {
      const token = 'f7ad4bda-0a75-4d1c-9ee0-bb8417ea409f'
      const url = `https://boardgamegeek.com/xmlapi2/thing?id=${idVal}&stats=1`
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'BGG-Personal-Collection-Tracker/1.0',
          Accept: 'application/xml,text/xml,*/*',
        },
      })

      if (!res.ok) throw new Error(`BGG respondió con error ${res.status}`)

      const xmlText = await res.text()
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
      })
      const result = parser.parse(xmlText)
      const rawItem = result.items?.item
      const item = Array.isArray(rawItem) ? rawItem[0] : rawItem

      if (!item) {
        toast.warning('No se encontró información en BGG para ese ID')
        return
      }

      // Nombre si no tiene
      let gameName = ''
      const names = Array.isArray(item.name) ? item.name : [item.name]
      const primaryName = names.find((n: any) => n?.['@_type'] === 'primary')?.['@_value']
      if (primaryName) gameName = primaryName

      // Rating
      const rating = parseFloat(item.statistics?.ratings?.average?.['@_value']) || null
      const minPlayers = parseInt(item.minplayers?.['@_value'], 10) || null
      const maxPlayers = parseInt(item.maxplayers?.['@_value'], 10) || null
      const playtime = parseInt(item.playingtime?.['@_value'], 10) || null
      const minAge = parseInt(item.minage?.['@_value'], 10) || null

      let numJugadores = ''
      if (minPlayers && maxPlayers) {
        numJugadores = minPlayers === maxPlayers ? `${minPlayers} jugadores` : `${minPlayers} - ${maxPlayers} jugadores`
      } else if (minPlayers) {
        numJugadores = `${minPlayers}+ jugadores`
      }

      const links = Array.isArray(item.link) ? item.link : item.link ? [item.link] : []
      const publishers = links
        .filter((l: any) => l?.['@_type'] === 'boardgamepublisher')
        .map((l: any) => l?.['@_value'])
        .filter(Boolean)
      const editorialMarca = publishers[0] || ''

      const mechanics = links
        .filter((l: any) => l?.['@_type'] === 'boardgamemechanic')
        .map((l: any) => l?.['@_value'])
        .filter(Boolean)
      const mecanicas = mechanics.slice(0, 4).join(', ')

      let imagenUrl = ''
      if (typeof item.image === 'string' && item.image.startsWith('http')) {
        imagenUrl = item.image
      }

      setFormData((prev) => ({
        ...prev,
        nombreModelo: prev.nombreModelo.trim() ? prev.nombreModelo : gameName,
        imagenUrl: imagenUrl || prev.imagenUrl,
        numJugadores: numJugadores || prev.numJugadores,
        duracionMinutos: playtime ? String(playtime) : prev.duracionMinutos,
        edadMinima: minAge ? String(minAge) : prev.edadMinima,
        editorialMarca: editorialMarca || prev.editorialMarca,
        mecanicas: mecanicas || prev.mecanicas,
        bggRating: rating ? parseFloat(rating.toFixed(2)) : prev.bggRating,
      }))

      toast.success('¡Datos de BGG importados correctamente!')
    } catch (err: any) {
      console.error('Error al consultar BGG:', err)
      toast.error('Error al conectar con BGG: ' + (err.message || 'Verifica la conexión'))
    } finally {
      setIsFetchingBgg(false)
    }
  }

  // Guardar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nombreModelo.trim()) {
      toast.error('El nombre del juego es obligatorio')
      setActiveTab('general')
      return
    }

    const costoBase = parseFloat(formData.costoBase) || 0
    const precioMercado = parseFloat(formData.precioMercado) || 0
    const precioAmigos = parseFloat(formData.precioAmigos) || 0
    const precioComunidad = parseFloat(formData.precioComunidad) || precioMercado
    const precioOferta = formData.precioOferta ? parseFloat(formData.precioOferta) : null

    if (formData.enOferta && precioOferta && precioOferta < costoBase) {
      toast.error('El precio de oferta no puede ser menor al costo base')
      setActiveTab('precios')
      return
    }

    const payload = {
      nombreModelo: formData.nombreModelo.trim(),
      lineaCategoria: formData.lineaCategoria.trim() || 'General',
      costoBase,
      precioMercado,
      precioAmigos,
      precioComunidad,
      activo: formData.activo,
      stock: parseInt(formData.stock) || 0,
      controlarStock: formData.controlarStock,
      enOferta: formData.enOferta,
      precioOferta: formData.enOferta ? precioOferta : null,
      porcentajeDescuento: formData.enOferta ? (parseInt(formData.porcentajeDescuento) || 0) : 0,
      imagenUrl: formData.imagenUrl.trim() || null,
      descripcionWeb: formData.descripcionWeb.trim() || null,
      destacadoWeb: formData.destacadoWeb,
      numJugadores: formData.numJugadores.trim() || null,
      edadMinima: formData.edadMinima ? parseInt(formData.edadMinima) : null,
      duracionMinutos: formData.duracionMinutos ? parseInt(formData.duracionMinutos) : null,
      idioma: formData.idioma.trim() || null,
      editorialMarca: formData.editorialMarca.trim() || null,
      mecanicas: formData.mecanicas.trim() || null,
      bggId: formData.bggId ? parseInt(formData.bggId) : null,
    }

    setIsSubmitting(true)
    try {
      if (editingProduct) {
        const updated = await updateProducto(editingProduct.id, payload)
        toast.success(`Juego "${payload.nombreModelo}" actualizado`)
        onSaved(updated)
      } else {
        const created = await createProducto(payload)
        toast.success(`Juego "${payload.nombreModelo}" registrado con éxito`)
        onSaved(created)
      }
      onClose()
    } catch (err: any) {
      toast.error('Error al guardar producto: ' + err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 rounded-2xl border-border bg-card shadow-2xl">
        <DialogTitle className="sr-only">
          {editingProduct ? 'Editar Juego' : 'Nuevo Juego en Catálogo'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Formulario de registro y edición de catálogo para juegos de mesa
        </DialogDescription>

        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Header */}
          <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Boxes className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-foreground">
                  {editingProduct ? 'Editar Ficha del Juego' : 'Nuevo Juego en Catálogo'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {editingProduct ? 'Modifica detalles, precios o ficha BGG' : 'Registra un nuevo juego de mesa'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Navegación por pestañas */}
          <div className="px-5 pt-3 border-b border-border bg-secondary/20 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'general'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              1. Datos Generales
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('precios')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'precios'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              2. Precios & Inventario
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bgg')}
              className={`px-3 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'bgg'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. BoardGameGeek & Specs</span>
            </button>
          </div>

          {/* Contenido de la pestaña */}
          <div className="p-5 space-y-4">
            {/* TAB 1: DATOS GENERALES */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                <div className="space-y-1.5">
                  <Label htmlFor="nombreModelo" className="text-xs font-bold">
                    Nombre del Juego <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nombreModelo"
                    value={formData.nombreModelo}
                    onChange={(e) => setFormData({ ...formData, nombreModelo: e.target.value })}
                    placeholder="Ej. Catan, Wingspan, Pandemic..."
                    className="h-10 text-sm font-semibold rounded-xl"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Categoría */}
                  <div className="space-y-1.5">
                    <Label htmlFor="lineaCategoria" className="text-xs font-bold">
                      Categoría / Línea
                    </Label>
                    <div className="space-y-1.5">
                      <Input
                        id="lineaCategoria"
                        value={formData.lineaCategoria}
                        onChange={(e) => setFormData({ ...formData, lineaCategoria: e.target.value })}
                        placeholder="Ej. Estrategia, Familiar, Party Game..."
                        className="h-10 text-xs rounded-xl"
                      />
                      {categoryNamesList.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {categoryNamesList.slice(0, 6).map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setFormData({ ...formData, lineaCategoria: cat })}
                              className="text-[10px] bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground px-2 py-0.5 rounded-md border border-border transition-colors cursor-pointer"
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Editorial / Marca */}
                  <div className="space-y-1.5">
                    <Label htmlFor="editorialMarca" className="text-xs font-bold">
                      Editorial / Marca
                    </Label>
                    <Input
                      id="editorialMarca"
                      value={formData.editorialMarca}
                      onChange={(e) => setFormData({ ...formData, editorialMarca: e.target.value })}
                      placeholder="Ej. Devir, Asmodee, Stonemaier Games..."
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* URL de Portada con Vista Previa */}
                <div className="space-y-1.5">
                  <Label htmlFor="imagenUrl" className="text-xs font-bold flex items-center justify-between">
                    <span>URL de Fotografía / Portada</span>
                    {formData.imagenUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imagenUrl: '' })}
                        className="text-[10px] text-destructive hover:underline cursor-pointer"
                      >
                        Limpiar URL
                      </button>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="imagenUrl"
                      value={formData.imagenUrl}
                      onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                      placeholder="https://... (JPG, PNG o URL de BGG)"
                      className="h-10 text-xs rounded-xl font-mono"
                    />
                  </div>
                  {formData.imagenUrl && (
                    <div className="mt-2 relative w-32 h-24 rounded-xl border border-border overflow-hidden bg-secondary">
                      <img
                        src={formData.imagenUrl}
                        alt="Vista previa"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Switch de Estado */}
                <div className="flex items-center justify-between p-3.5 bg-secondary/30 rounded-xl border border-border">
                  <div>
                    <Label className="text-xs font-bold block">Estado en Catálogo</Label>
                    <span className="text-[11px] text-muted-foreground">
                      {formData.activo ? 'Juego activo y visible para cotizaciones' : 'Juego archivado / descontinuado'}
                    </span>
                  </div>
                  <Switch
                    checked={formData.activo}
                    onCheckedChange={(checked) => setFormData({ ...formData, activo: checked })}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: PRECIOS & INVENTARIO */}
            {activeTab === 'precios' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Costo Base */}
                  <div className="space-y-1.5">
                    <Label htmlFor="costoBase" className="text-xs font-bold">
                      Costo Base (S/)
                    </Label>
                    <Input
                      id="costoBase"
                      type="number"
                      step="0.01"
                      value={formData.costoBase}
                      onChange={(e) => setFormData({ ...formData, costoBase: e.target.value })}
                      className="h-10 text-sm font-mono font-semibold rounded-xl"
                    />
                  </div>

                  {/* Precio Mercado */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="precioMercado" className="text-xs font-bold text-primary">
                        Precio Venta PVP (S/)
                      </Label>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 font-mono">
                        {calcMargen(formData.precioMercado, formData.costoBase)}
                      </span>
                    </div>
                    <Input
                      id="precioMercado"
                      type="number"
                      step="0.01"
                      value={formData.precioMercado}
                      onChange={(e) => setFormData({ ...formData, precioMercado: e.target.value })}
                      className="h-10 text-sm font-mono font-bold rounded-xl border-primary/30"
                    />
                  </div>

                  {/* Precio Amigos */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="precioAmigos" className="text-xs font-bold">
                        Precio Amigos (S/)
                      </Label>
                      <span className="text-[10px] font-bold text-muted-foreground font-mono">
                        {calcMargen(formData.precioAmigos, formData.costoBase)}
                      </span>
                    </div>
                    <Input
                      id="precioAmigos"
                      type="number"
                      step="0.01"
                      value={formData.precioAmigos}
                      onChange={(e) => setFormData({ ...formData, precioAmigos: e.target.value })}
                      className="h-10 text-sm font-mono rounded-xl"
                    />
                  </div>
                </div>

                {/* Control de Stock */}
                <div className="p-4 bg-secondary/30 rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold block">Controlar Stock Físico</Label>
                      <span className="text-[11px] text-muted-foreground">
                        {formData.controlarStock
                          ? 'Control estricto de unidades en almacén'
                          : 'Venta a pedido o sin límite de stock'}
                      </span>
                    </div>
                    <Switch
                      checked={formData.controlarStock}
                      onCheckedChange={(checked) => setFormData({ ...formData, controlarStock: checked })}
                    />
                  </div>

                  {formData.controlarStock && (
                    <div className="pt-2 border-t border-border/60">
                      <Label htmlFor="stock" className="text-xs font-bold">
                        Unidades Disponibles
                      </Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="h-10 w-32 text-sm font-mono font-bold rounded-xl mt-1"
                      />
                    </div>
                  )}
                </div>

                {/* Oferta Especial */}
                <div className="p-4 bg-secondary/30 rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold block">Activar Oferta Especial</Label>
                      <span className="text-[11px] text-muted-foreground">
                        Precio promocional con descuento visible
                      </span>
                    </div>
                    <Switch
                      checked={formData.enOferta}
                      onCheckedChange={(checked) => setFormData({ ...formData, enOferta: checked })}
                    />
                  </div>

                  {formData.enOferta && (
                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                      <div>
                        <Label htmlFor="porcentajeDescuento" className="text-xs font-bold">
                          % Descuento
                        </Label>
                        <Input
                          id="porcentajeDescuento"
                          type="number"
                          min="0"
                          max="100"
                          value={formData.porcentajeDescuento}
                          onChange={(e) => handleDescuentoChange(e.target.value)}
                          placeholder="Ej. 15"
                          className="h-10 text-sm font-mono rounded-xl mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="precioOferta" className="text-xs font-bold text-rose-600">
                          Precio Oferta (S/)
                        </Label>
                        <Input
                          id="precioOferta"
                          type="number"
                          step="0.01"
                          value={formData.precioOferta}
                          onChange={(e) => handlePrecioOfertaChange(e.target.value)}
                          placeholder="Ej. 129.90"
                          className="h-10 text-sm font-mono font-bold text-rose-600 rounded-xl mt-1 border-rose-300"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: BGG & SPECS */}
            {activeTab === 'bgg' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150">
                {/* Consultar BGG */}
                <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                  <Label htmlFor="bggId" className="text-xs font-bold text-primary flex items-center justify-between">
                    <span>Código BGG (BoardGameGeek ID)</span>
                    {formData.bggRating && (
                      <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Rating: {formData.bggRating}</span>
                      </span>
                    )}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="bggId"
                      value={formData.bggId}
                      onChange={(e) => setFormData({ ...formData, bggId: e.target.value })}
                      placeholder="Ej. 13 (Catan), 266192 (Wingspan)..."
                      className="h-10 text-sm font-mono rounded-xl bg-background"
                    />
                    <Button
                      type="button"
                      onClick={handleFetchBgg}
                      disabled={isFetchingBgg || !formData.bggId.trim()}
                      className="gap-1.5 text-xs font-bold rounded-xl shrink-0"
                    >
                      {isFetchingBgg ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Consultando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Autocompletar BGG</span>
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    El botón autocompleta el nombre, rating, portada, jugadores, duración, mecánicas y editorial desde BGG.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Jugadores */}
                  <div className="space-y-1.5">
                    <Label htmlFor="numJugadores" className="text-xs font-bold">
                      N° Jugadores
                    </Label>
                    <Input
                      id="numJugadores"
                      value={formData.numJugadores}
                      onChange={(e) => setFormData({ ...formData, numJugadores: e.target.value })}
                      placeholder="Ej. 2 - 4 jugadores"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  {/* Duración */}
                  <div className="space-y-1.5">
                    <Label htmlFor="duracionMinutos" className="text-xs font-bold">
                      Duración (Minutos)
                    </Label>
                    <Input
                      id="duracionMinutos"
                      type="number"
                      value={formData.duracionMinutos}
                      onChange={(e) => setFormData({ ...formData, duracionMinutos: e.target.value })}
                      placeholder="Ej. 60"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  {/* Edad */}
                  <div className="space-y-1.5">
                    <Label htmlFor="edadMinima" className="text-xs font-bold">
                      Edad Mínima
                    </Label>
                    <Input
                      id="edadMinima"
                      type="number"
                      value={formData.edadMinima}
                      onChange={(e) => setFormData({ ...formData, edadMinima: e.target.value })}
                      placeholder="Ej. 10"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Idioma */}
                  <div className="space-y-1.5">
                    <Label htmlFor="idioma" className="text-xs font-bold">
                      Idioma
                    </Label>
                    <Input
                      id="idioma"
                      value={formData.idioma}
                      onChange={(e) => setFormData({ ...formData, idioma: e.target.value })}
                      placeholder="Ej. Español, Inglés, Independiente"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>

                  {/* Mecánicas */}
                  <div className="space-y-1.5">
                    <Label htmlFor="mecanicas" className="text-xs font-bold">
                      Mecánicas
                    </Label>
                    <Input
                      id="mecanicas"
                      value={formData.mecanicas}
                      onChange={(e) => setFormData({ ...formData, mecanicas: e.target.value })}
                      placeholder="Ej. Gestión de Mano, Colocación de Losetas"
                      className="h-10 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Descripción Web */}
                <div className="space-y-1.5">
                  <Label htmlFor="descripcionWeb" className="text-xs font-bold">
                    Descripción / Sinopsis
                  </Label>
                  <textarea
                    id="descripcionWeb"
                    value={formData.descripcionWeb}
                    onChange={(e) => setFormData({ ...formData, descripcionWeb: e.target.value })}
                    rows={3}
                    placeholder="Breve reseña del juego de mesa..."
                    className="w-full text-xs p-3 rounded-xl border border-border bg-background focus:outline-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer con botones de navegación y guardar */}
          <div className="p-5 border-t border-border flex items-center justify-between bg-card sticky bottom-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>

            <div className="flex items-center gap-2">
              {activeTab === 'general' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('precios')}
                  className="text-xs rounded-xl"
                >
                  Siguiente: Precios ➔
                </Button>
              )}
              {activeTab === 'precios' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('bgg')}
                  className="text-xs rounded-xl"
                >
                  Siguiente: BGG ➔
                </Button>
              )}

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 text-xs font-bold rounded-xl"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{editingProduct ? 'Actualizar Ficha' : 'Guardar Juego'}</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
