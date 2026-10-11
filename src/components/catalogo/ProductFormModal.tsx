'use client'

import React, { useState, useEffect } from 'react'
import {
  X,
  Package,
  Sparkles,
  Loader2,
  ExternalLink,
  Tag,
  Dices,
  DollarSign,
  Boxes,
  Star,
  Users,
  Clock,
  Check,
  Layers,
  ArrowRight,
  ArrowLeft,
  Building2,
  Globe,
  Warehouse,
  Percent,
  Trash2
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
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { fetchBggProductDetails } from '@/actions/bgg'
import { createProducto, updateProducto } from '@/actions/productos'
import { extractBaseAndVariant } from './ProductsTableView'
import type { ProductoItem } from './CatalogoClient'

export interface ProductFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSaved: (savedProduct: ProductoItem) => void
  editingProduct?: ProductoItem | null
  initialValues?: Partial<ProductoItem> | null
  categoryNamesList: string[]
}

const COMMON_EDITIONS = [
  'Juego Base',
  'Edición Deluxe',
  'Expansión',
  '2da Edición',
  'Edición Aniversario',
  'Edición Especial',
  'Versión Compacta'
]

const COMMON_MECHANICS = [
  'Gestión de Mano',
  'Colocación de Losetas',
  'Drafting',
  'Cooperativo',
  'Deducción',
  'Construcción de Mazos',
  'Colocación de Trabajadores',
  'Control de Área',
  'Push Your Luck',
  'Subastas / Comercio'
]

const COMMON_LANGUAGES = ['Español', 'Inglés', 'Independiente del idioma', 'Multilenguaje']

export function ProductFormModal({
  isOpen,
  onClose,
  onSaved,
  editingProduct,
  initialValues,
  categoryNamesList
}: ProductFormModalProps) {
  const [activeTab, setActiveTab] = useState<'general' | 'precios' | 'bgg'>('general')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetchingBgg, setIsFetchingBgg] = useState(false)

  // Separación de nombre base y variante de edición
  const [gameBaseName, setGameBaseName] = useState('')
  const [editionName, setEditionName] = useState('')

  const [formData, setFormData] = useState({
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

  // Sincronizar datos al abrir o cambiar de producto / valores iniciales
  useEffect(() => {
    if (!isOpen) return

    if (editingProduct) {
      const { baseName, variantName } = extractBaseAndVariant(editingProduct.nombreModelo)
      setGameBaseName(baseName)
      setEditionName(variantName === 'Estándar' ? '' : variantName)

      setFormData({
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
    } else if (initialValues) {
      const { baseName } = extractBaseAndVariant(initialValues.nombreModelo || '')
      setGameBaseName(baseName || initialValues.nombreModelo || '')
      setEditionName('')

      setFormData({
        lineaCategoria: initialValues.lineaCategoria || categoryNamesList[0] || 'General',
        costoBase: initialValues.costoBase != null ? String(initialValues.costoBase) : '0',
        precioMercado: initialValues.precioMercado != null ? String(initialValues.precioMercado) : '0',
        precioAmigos: initialValues.precioAmigos != null ? String(initialValues.precioAmigos) : '0',
        precioComunidad: initialValues.precioComunidad != null ? String(initialValues.precioComunidad) : '0',
        activo: initialValues.activo ?? true,
        stock: initialValues.stock != null ? String(initialValues.stock) : '0',
        controlarStock: initialValues.controlarStock ?? false,
        enOferta: initialValues.enOferta ?? false,
        precioOferta: initialValues.precioOferta != null ? String(initialValues.precioOferta) : '',
        porcentajeDescuento: initialValues.porcentajeDescuento != null ? String(initialValues.porcentajeDescuento) : '',
        imagenUrl: initialValues.imagenUrl || '',
        descripcionWeb: initialValues.descripcionWeb || '',
        destacadoWeb: initialValues.destacadoWeb ?? false,
        numJugadores: initialValues.numJugadores || '',
        edadMinima: initialValues.edadMinima != null ? String(initialValues.edadMinima) : '',
        duracionMinutos: initialValues.duracionMinutos != null ? String(initialValues.duracionMinutos) : '',
        idioma: initialValues.idioma || 'Español',
        editorialMarca: initialValues.editorialMarca || '',
        mecanicas: initialValues.mecanicas || '',
        bggId: initialValues.bggId != null ? String(initialValues.bggId) : '',
        bggRating: initialValues.bggRating ? Number(initialValues.bggRating) : null
      })
    } else {
      setGameBaseName('')
      setEditionName('')
      setFormData({
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
  }, [editingProduct, initialValues, categoryNamesList, isOpen])

  // Nombre resultante en el catálogo
  const computedFullProductName = React.useMemo(() => {
    const base = gameBaseName.trim()
    const edition = editionName.trim()
    if (!base) return ''
    if (!edition || edition.toLowerCase() === 'estándar') return base
    return `${base} - ${edition}`
  }, [gameBaseName, editionName])

  // Helpers de margen
  const calcMargen = (precioStr: string, costoStr: string) => {
    const p = parseFloat(precioStr) || 0
    const c = parseFloat(costoStr) || 0
    if (c <= 0) return p > 0 ? '+100%' : '+0%'
    const m = ((p - c) / c) * 100
    return m >= 0 ? `+${m.toFixed(0)}%` : `${m.toFixed(0)}%`
  }

  const calcGanancia = (precioStr: string, costoStr: string) => {
    const p = parseFloat(precioStr) || 0
    const c = parseFloat(costoStr) || 0
    return Math.max(0, p - c)
  }

  // Descuento reactivo
  const handleDescuentoChange = (val: string) => {
    const pMercado = parseFloat(formData.precioMercado) || 0
    const costoBase = parseFloat(formData.costoBase) || 0
    const descuento = Math.min(100, Math.max(0, parseInt(val) || 0))

    if (pMercado <= 0 || descuento <= 0) {
      setFormData((prev) => ({
        ...prev,
        porcentajeDescuento: val,
        precioOferta: '',
      }))
      return
    }

    let nuevoPrecio = pMercado * (1 - descuento / 100)
    if (nuevoPrecio < costoBase && costoBase > 0) {
      nuevoPrecio = costoBase
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

  // Consultar BoardGameGeek automáticamente (soporta número o URL completa)
  const handleFetchBgg = async () => {
    let rawInput = formData.bggId.trim()
    if (!rawInput) {
      toast.warning('Ingresa un ID numérico o enlace URL de BoardGameGeek')
      return
    }

    // Extraer ID si el usuario ingresó una URL completa
    const urlMatch = rawInput.match(/boardgame(?:geek\.com\/boardgame)?\/(\d+)/i)
    const idVal = urlMatch ? urlMatch[1] : rawInput

    if (!idVal || isNaN(Number(idVal))) {
      toast.warning('Ingresa un ID numérico o enlace válido de BoardGameGeek (ej. 13 o https://boardgamegeek.com/boardgame/13/catan)')
      return
    }

    setIsFetchingBgg(true)
    toast.info(`Consultando juego #${idVal} en BGG...`)

    try {
      const res = await fetchBggProductDetails(idVal)
      if (!res.success || !res.data) {
        toast.warning(res.error || 'No se encontró información en BoardGameGeek para ese ID')
        return
      }

      const item = res.data

      if (!gameBaseName.trim() && item.gameName) {
        setGameBaseName(item.gameName)
      }

      setFormData((prev) => ({
        ...prev,
        bggId: String(item.bggId),
        imagenUrl: item.imagenUrl || prev.imagenUrl,
        numJugadores: item.numJugadores || prev.numJugadores,
        duracionMinutos: item.duracionMinutos ? String(item.duracionMinutos) : prev.duracionMinutos,
        edadMinima: item.edadMinima ? String(item.edadMinima) : prev.edadMinima,
        editorialMarca: item.editorialMarca || prev.editorialMarca,
        mecanicas: item.mecanicas || prev.mecanicas,
        descripcionWeb: item.descripcionWeb || prev.descripcionWeb,
        bggRating: item.bggRating !== null && item.bggRating !== undefined ? item.bggRating : prev.bggRating,
      }))

      toast.success(`¡Ficha de "${item.gameName || idVal}" sincronizada desde BGG!`)
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

    if (!gameBaseName.trim()) {
      toast.error('El nombre del juego es obligatorio')
      setActiveTab('general')
      return
    }

    const finalNombreModelo = computedFullProductName
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
      nombreModelo: finalNombreModelo,
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
        toast.success(`Ficha "${payload.nombreModelo}" actualizada correctamente`)
        onSaved(updated)
      } else {
        const created = await createProducto(payload)
        toast.success(`Ficha "${payload.nombreModelo}" registrada con éxito`)
        onSaved(created)
      }
      onClose()
    } catch (err: any) {
      toast.error('Error al guardar: ' + (err.message || 'Error desconocido'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle de mecánica rápida
  const handleToggleMechanic = (mec: string) => {
    const current = formData.mecanicas
      ? formData.mecanicas.split(',').map((m) => m.trim()).filter(Boolean)
      : []

    if (current.includes(mec)) {
      const filtered = current.filter((m) => m !== mec)
      setFormData({ ...formData, mecanicas: filtered.join(', ') })
    } else {
      current.push(mec)
      setFormData({ ...formData, mecanicas: current.join(', ') })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl w-[95vw] sm:w-full max-h-[92vh] overflow-y-auto overflow-x-hidden p-0 rounded-2xl border-border bg-card shadow-2xl"
      >
        <DialogTitle className="sr-only">
          {editingProduct ? 'Editar Ficha del Juego' : initialValues ? 'Nueva Edición del Juego' : 'Nuevo Juego en Catálogo'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Formulario de configuración de juego de mesa y edición
        </DialogDescription>

        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full min-w-0 overflow-x-hidden">
          {/* ========================================================================= */}
          {/* HEADER DEL FORMULARIO                                                     */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-black text-foreground truncate">
                  {editingProduct
                    ? 'Editar Ficha y Edición'
                    : initialValues
                    ? 'Nueva Edición / Versión'
                    : 'Nuevo Juego de Mesa'}
                </h2>
                <p className="text-xs text-muted-foreground truncate">
                  {computedFullProductName ? (
                    <span className="font-semibold text-foreground/80">{computedFullProductName}</span>
                  ) : (
                    'Completa los datos del juego y su edición'
                  )}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2"
              title="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* BARRA DE PESTAÑAS (SEGMENTED TABS)                                        */}
          {/* ========================================================================= */}
          <div className="px-4 sm:px-5 pt-2 border-b border-border bg-secondary/20 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'general'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>1. General & Edición</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('precios')}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'precios'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>2. Precios & Stock</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('bgg')}
              className={`px-3 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'bgg'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3. BoardGameGeek & Specs</span>
            </button>
          </div>

          {/* ========================================================================= */}
          {/* CONTENIDO DEL FORMULARIO                                                  */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 space-y-5 flex-1 min-w-0 overflow-x-hidden">
            {/* ========================================================================= */}
            {/* TAB 1: DATOS GENERALES & EDICIÓN                                         */}
            {/* ========================================================================= */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150 min-w-0">
                {/* BGG Quick Autocomplete Bar */}
                <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/20 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="quickBggInput" className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>¿Tienes el ID o enlace de BoardGameGeek?</span>
                    </Label>
                    {formData.bggRating != null && (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 font-mono">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Rating: {formData.bggRating}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Input
                      id="quickBggInput"
                      value={formData.bggId}
                      onChange={(e) => setFormData({ ...formData, bggId: e.target.value })}
                      placeholder="ID (ej. 13) o enlace https://boardgamegeek.com/boardgame/..."
                      className="h-9 text-xs font-mono rounded-lg bg-card"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleFetchBgg}
                      disabled={isFetchingBgg || !formData.bggId.trim()}
                      className="gap-1.5 text-xs font-bold rounded-lg shrink-0 h-9 cursor-pointer"
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
                    Importa automáticamente título, portada, editorial, jugadores, duración y mecánicas.
                  </p>
                </div>

                {/* Campos de Nombre Base y Edición / Variante */}
                <div className="bg-secondary/30 p-3.5 sm:p-4 rounded-xl border border-border space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Nombre Base del Juego */}
                    <div className="space-y-1.5">
                      <Label htmlFor="gameBaseName" className="text-xs font-bold">
                        Nombre Base del Juego <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="gameBaseName"
                        value={gameBaseName}
                        onChange={(e) => setGameBaseName(e.target.value)}
                        placeholder="Ej. Catan, Wingspan, El Gato de Schrödinger"
                        className="h-10 text-sm font-bold rounded-lg bg-card"
                        required
                      />
                    </div>

                    {/* Edición / Versión */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="editionName" className="text-xs font-bold">
                          Edición / Variante
                        </Label>
                        {editionName && (
                          <button
                            type="button"
                            onClick={() => setEditionName('')}
                            className="text-[10px] text-destructive hover:underline cursor-pointer"
                          >
                            Quitar edición
                          </button>
                        )}
                      </div>
                      <Input
                        id="editionName"
                        value={editionName}
                        onChange={(e) => setEditionName(e.target.value)}
                        placeholder="Ej. Juego Base, Edición Deluxe, Expansión..."
                        className="h-10 text-xs font-medium rounded-lg bg-card"
                      />
                    </div>
                  </div>

                  {/* Chips de Ediciones Comunes */}
                  <div className="space-y-1.5 pt-1 border-t border-border/50">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Sugerencias de Edición:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {COMMON_EDITIONS.map((ed) => (
                        <button
                          key={ed}
                          type="button"
                          onClick={() => setEditionName(ed)}
                          className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                            editionName === ed
                              ? 'bg-primary text-primary-foreground border-primary font-bold'
                              : 'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                          }`}
                        >
                          {ed}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview del Nombre Completo resultante */}
                  {computedFullProductName && (
                    <div className="p-2.5 rounded-lg bg-card border border-border/80 flex items-center justify-between gap-2 text-xs">
                      <span className="text-muted-foreground text-[11px]">Nombre final en catálogo:</span>
                      <span className="font-bold text-foreground font-mono truncate">
                        {computedFullProductName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Categoría y Editorial */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                  {/* Categoría */}
                  <div className="space-y-1.5">
                    <Label htmlFor="lineaCategoria" className="text-xs font-bold">
                      Categoría / Línea
                    </Label>
                    <Input
                      id="lineaCategoria"
                      value={formData.lineaCategoria}
                      onChange={(e) => setFormData({ ...formData, lineaCategoria: e.target.value })}
                      placeholder="Ej. Estrategia, Familiar, Party Game..."
                      className="h-9 text-xs rounded-lg"
                    />
                    {categoryNamesList.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {categoryNamesList.slice(0, 5).map((cat) => (
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
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Fotografía / Portada */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="imagenUrl" className="text-xs font-bold">
                      URL de Fotografía / Portada
                    </Label>
                    {formData.imagenUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imagenUrl: '' })}
                        className="text-[10px] text-destructive hover:underline cursor-pointer"
                      >
                        Limpiar URL
                      </button>
                    )}
                  </div>
                  <Input
                    id="imagenUrl"
                    value={formData.imagenUrl}
                    onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                    placeholder="https://... (JPG, PNG o URL de BGG)"
                    className="h-9 text-xs font-mono rounded-lg"
                  />

                  {formData.imagenUrl && (
                    <div className="mt-2 flex items-center gap-3 p-2 bg-secondary/30 rounded-xl border border-border">
                      <div className="relative w-16 h-16 rounded-lg border border-border overflow-hidden bg-secondary shrink-0">
                        <img
                          src={formData.imagenUrl}
                          alt="Vista previa"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none'
                          }}
                        />
                      </div>
                      <div className="min-w-0 text-xs">
                        <span className="font-bold text-foreground block">Vista previa de portada</span>
                        <span className="text-[11px] text-muted-foreground truncate block">
                          {formData.imagenUrl}
                        </span>
                      </div>
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

            {/* ========================================================================= */}
            {/* TAB 2: PRECIOS & INVENTARIO                                              */}
            {/* ========================================================================= */}
            {activeTab === 'precios' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150 min-w-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Costo Base */}
                  <div className="space-y-1.5 bg-secondary/30 p-3 rounded-xl border border-border">
                    <Label htmlFor="costoBase" className="text-xs font-bold block">
                      Costo Base (S/)
                    </Label>
                    <Input
                      id="costoBase"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costoBase}
                      onChange={(e) => setFormData({ ...formData, costoBase: e.target.value })}
                      className="h-10 text-sm font-mono font-bold rounded-lg bg-card"
                    />
                    <span className="text-[10px] text-muted-foreground block">Costo de compra o importación</span>
                  </div>

                  {/* Precio Mercado (PVP) */}
                  <div className="space-y-1.5 bg-primary/5 p-3 rounded-xl border border-primary/25">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="precioMercado" className="text-xs font-bold text-primary block">
                        Precio Venta PVP (S/)
                      </Label>
                      <Badge variant="outline" className="text-[10px] font-bold font-mono text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30 px-1 py-0">
                        {calcMargen(formData.precioMercado, formData.costoBase)}
                      </Badge>
                    </div>
                    <Input
                      id="precioMercado"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precioMercado}
                      onChange={(e) => setFormData({ ...formData, precioMercado: e.target.value })}
                      className="h-10 text-sm font-mono font-black rounded-lg bg-card border-primary/40"
                    />
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-mono font-semibold block">
                      Ganancia: +S/ {calcGanancia(formData.precioMercado, formData.costoBase).toFixed(2)}
                    </span>
                  </div>

                  {/* Precio Amigos */}
                  <div className="space-y-1.5 bg-secondary/30 p-3 rounded-xl border border-border">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="precioAmigos" className="text-xs font-bold block">
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
                      min="0"
                      value={formData.precioAmigos}
                      onChange={(e) => setFormData({ ...formData, precioAmigos: e.target.value })}
                      className="h-10 text-sm font-mono font-bold rounded-lg bg-card"
                    />
                    <span className="text-[10px] text-muted-foreground font-mono block">
                      Ganancia: +S/ {calcGanancia(formData.precioAmigos, formData.costoBase).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Control de Stock */}
                <div className="p-4 bg-secondary/30 rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold block flex items-center gap-1.5">
                        <Warehouse className="w-3.5 h-3.5 text-primary" />
                        <span>Controlar Stock Físico</span>
                      </Label>
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
                    <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor="stock" className="text-xs font-bold block">
                          Unidades Disponibles en Almacén
                        </Label>
                        <span className="text-[10px] text-muted-foreground">
                          {parseInt(formData.stock) > 2 ? 'En stock' : parseInt(formData.stock) > 0 ? 'Bajo stock' : 'Agotado'}
                        </span>
                      </div>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="h-9 w-28 text-sm font-mono font-bold rounded-lg text-right bg-card"
                      />
                    </div>
                  )}
                </div>

                {/* Oferta Especial */}
                <div className="p-4 bg-secondary/30 rounded-xl border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold block flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-rose-600" />
                        <span>Activar Oferta Especial</span>
                      </Label>
                      <span className="text-[11px] text-muted-foreground">
                        Precio promocional con descuento visible en el catálogo
                      </span>
                    </div>
                    <Switch
                      checked={formData.enOferta}
                      onCheckedChange={(checked) => setFormData({ ...formData, enOferta: checked })}
                    />
                  </div>

                  {formData.enOferta && (
                    <div className="pt-2 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="porcentajeDescuento" className="text-xs font-bold">
                          % Descuento Promocional
                        </Label>
                        <Input
                          id="porcentajeDescuento"
                          type="number"
                          min="1"
                          max="90"
                          value={formData.porcentajeDescuento}
                          onChange={(e) => handleDescuentoChange(e.target.value)}
                          placeholder="Ej. 15"
                          className="h-9 text-xs font-mono rounded-lg bg-card"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label htmlFor="precioOferta" className="text-xs font-bold text-rose-600">
                          Precio Oferta (S/)
                        </Label>
                        <Input
                          id="precioOferta"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.precioOferta}
                          onChange={(e) => handlePrecioOfertaChange(e.target.value)}
                          placeholder="Ej. 119.00"
                          className="h-9 text-xs font-mono font-bold rounded-lg bg-card border-rose-500/40"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: SPECS & BOARDGAMEGEEK                                             */}
            {/* ========================================================================= */}
            {activeTab === 'bgg' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150 min-w-0">
                {/* ID & Rating BGG */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="bggIdTab3" className="text-xs font-bold">
                      BoardGameGeek ID
                    </Label>
                    <Input
                      id="bggIdTab3"
                      value={formData.bggId}
                      onChange={(e) => setFormData({ ...formData, bggId: e.target.value })}
                      placeholder="Ej. 13 (Catan), 266192 (Wingspan)..."
                      className="h-9 text-xs font-mono rounded-lg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bggRatingTab3" className="text-xs font-bold">
                      Rating BGG (1 - 10)
                    </Label>
                    <Input
                      id="bggRatingTab3"
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      value={formData.bggRating != null ? String(formData.bggRating) : ''}
                      onChange={(e) => setFormData({ ...formData, bggRating: e.target.value ? parseFloat(e.target.value) : null })}
                      placeholder="Ej. 7.5"
                      className="h-9 text-xs font-mono rounded-lg"
                    />
                  </div>
                </div>

                {/* Specs Lúdicas: Jugadores, Duración, Edad */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="numJugadores" className="text-xs font-bold">
                      N° Jugadores
                    </Label>
                    <Input
                      id="numJugadores"
                      value={formData.numJugadores}
                      onChange={(e) => setFormData({ ...formData, numJugadores: e.target.value })}
                      placeholder="Ej. 2 - 4 jugadores"
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

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
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>

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
                      className="h-9 text-xs rounded-lg"
                    />
                  </div>
                </div>

                {/* Idioma */}
                <div className="space-y-1.5">
                  <Label htmlFor="idioma" className="text-xs font-bold">
                    Idioma de la Edición
                  </Label>
                  <Input
                    id="idioma"
                    value={formData.idioma}
                    onChange={(e) => setFormData({ ...formData, idioma: e.target.value })}
                    placeholder="Ej. Español, Inglés, Independiente"
                    className="h-9 text-xs rounded-lg"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setFormData({ ...formData, idioma: lang })}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          formData.idioma === lang
                            ? 'bg-primary text-primary-foreground border-primary font-bold'
                            : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border-border'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mecánicas */}
                <div className="space-y-1.5">
                  <Label htmlFor="mecanicas" className="text-xs font-bold">
                    Mecánicas del Juego
                  </Label>
                  <Input
                    id="mecanicas"
                    value={formData.mecanicas}
                    onChange={(e) => setFormData({ ...formData, mecanicas: e.target.value })}
                    placeholder="Ej. Gestión de Mano, Colocación de Losetas"
                    className="h-9 text-xs rounded-lg"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {COMMON_MECHANICS.map((mec) => (
                      <button
                        key={mec}
                        type="button"
                        onClick={() => handleToggleMechanic(mec)}
                        className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                          formData.mecanicas.includes(mec)
                            ? 'bg-primary/20 text-primary border-primary/40 font-bold'
                            : 'bg-secondary hover:bg-secondary/80 text-muted-foreground border-border'
                        }`}
                      >
                        + {mec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Descripción / Sinopsis */}
                <div className="space-y-1.5">
                  <Label htmlFor="descripcionWeb" className="text-xs font-bold">
                    Sinopsis / Descripción Web
                  </Label>
                  <textarea
                    id="descripcionWeb"
                    value={formData.descripcionWeb}
                    onChange={(e) => setFormData({ ...formData, descripcionWeb: e.target.value })}
                    rows={3}
                    placeholder="Breve reseña del juego de mesa y componentes..."
                    className="w-full text-xs p-3 rounded-lg border border-border bg-card focus:outline-primary"
                  />
                </div>

                {/* Switch Destacado en Web */}
                <div className="flex items-center justify-between p-3.5 bg-secondary/30 rounded-xl border border-border">
                  <div>
                    <Label className="text-xs font-bold block">Destacar en Tienda Web</Label>
                    <span className="text-[11px] text-muted-foreground">
                      Mostrar en sección de productos destacados
                    </span>
                  </div>
                  <Switch
                    checked={formData.destacadoWeb}
                    onCheckedChange={(checked) => setFormData({ ...formData, destacadoWeb: checked })}
                  />
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* FOOTER DEL FORMULARIO CON PASOS Y BOTONES                                */}
          {/* ========================================================================= */}
          <div className="p-4 sm:p-5 border-t border-border flex items-center justify-between bg-card sticky bottom-0 z-20 gap-2 flex-wrap">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs rounded-xl cursor-pointer"
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
                  className="gap-1.5 text-xs rounded-xl cursor-pointer"
                >
                  <span>Precios & Stock</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}

              {activeTab === 'precios' && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('general')}
                    className="gap-1.5 text-xs rounded-xl cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>General</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveTab('bgg')}
                    className="gap-1.5 text-xs rounded-xl cursor-pointer"
                  >
                    <span>Specs BGG</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}

              {activeTab === 'bgg' && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('precios')}
                  className="gap-1.5 text-xs rounded-xl cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Precios</span>
                </Button>
              )}

              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="gap-1.5 text-xs font-bold rounded-xl cursor-pointer"
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
