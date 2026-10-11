'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  X,
  Sparkles,
  Loader2,
  Star,
  Check,
  Layers,
  ArrowRight,
  ArrowLeft,
  Warehouse,
  Tag,
  Boxes,
  DollarSign,
  Plus
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
import { cn } from '@/lib/utils'

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
  'Deluxe',
  'Expansión',
  '2da Edición',
  'Edición Aniversario',
  'Edición Especial'
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
  'Subastas / Comercio',
  'Roll & Write',
  'Legacy / Campaña'
]

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

  // Búsqueda rápida de mecánica para contenedor multi-chip
  const [mechanicSearch, setMechanicSearch] = useState('')

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
    setMechanicSearch('')
  }, [editingProduct, initialValues, categoryNamesList, isOpen])

  // Nombre resultante en el catálogo
  const computedFullProductName = useMemo(() => {
    const base = gameBaseName.trim()
    const edition = editionName.trim()
    if (!base) return ''
    if (!edition || edition.toLowerCase() === 'estándar') return base
    return `${base} (${edition})`
  }, [gameBaseName, editionName])

  // Helpers de margen y ganancia
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
        precioOferta: ''
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
      precioOferta: nuevoPrecio.toFixed(2)
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
      porcentajeDescuento: descuento.toString()
    }))
  }

  // Parseo y manejo de mecánicas compactas
  const selectedMechanics = useMemo(() => {
    return formData.mecanicas
      ? formData.mecanicas.split(',').map((m) => m.trim()).filter(Boolean)
      : []
  }, [formData.mecanicas])

  const handleAddMechanic = (mechanicToAdd?: string) => {
    const target = (mechanicToAdd || mechanicSearch).trim()
    if (!target) return
    if (selectedMechanics.some((m) => m.toLowerCase() === target.toLowerCase())) {
      setMechanicSearch('')
      return
    }
    const updated = [...selectedMechanics, target]
    setFormData((prev) => ({ ...prev, mecanicas: updated.join(', ') }))
    setMechanicSearch('')
  }

  const handleRemoveMechanic = (mechanicToRemove: string) => {
    const updated = selectedMechanics.filter((m) => m !== mechanicToRemove)
    setFormData((prev) => ({ ...prev, mecanicas: updated.join(', ') }))
  }

  // Consultar BoardGameGeek automáticamente
  const handleFetchBgg = async () => {
    const rawInput = formData.bggId.trim()
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
        bggRating: item.bggRating !== null && item.bggRating !== undefined ? item.bggRating : prev.bggRating
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
      bggId: formData.bggId ? parseInt(formData.bggId) : null
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl sm:max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] p-0 gap-0 ring-0"
      >
        <DialogTitle className="sr-only">
          {editingProduct ? 'Editar Ficha del Juego' : initialValues ? 'Nueva Edición del Juego' : 'Nuevo Juego en Catálogo'}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Formulario de configuración de juego de mesa y edición
        </DialogDescription>

        <form onSubmit={handleSubmit} className="flex flex-col h-full w-full min-w-0 overflow-hidden">
          {/* ========================================================================= */}
          {/* 1. ENCABEZADO CON PALETA NOVA                                            */}
          {/* ========================================================================= */}
          <div className="px-6 py-5 border-b border-border/70 bg-card/40 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0 shadow-2xs">
                <Boxes className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {editingProduct
                    ? 'Editar Ficha del Juego'
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
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground bg-secondary/60 hover:bg-secondary flex items-center justify-center transition-colors cursor-pointer shrink-0 ml-2 border border-border/70 shadow-2xs"
              title="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* CUERPO CON SCROLL VERTICAL SUAVE                                          */}
          {/* ========================================================================= */}
          <div className="p-6 space-y-5 overflow-y-auto flex-1 min-w-0">
            {/* Barra de Pestañas Unificada (3 Tabs Completos en 1 Fila) */}
            <div className="grid grid-cols-3 gap-1 bg-secondary/80 border border-border/80 p-1 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setActiveTab('general')}
                className={cn(
                  'h-9 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center',
                  activeTab === 'general'
                    ? 'bg-card text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                )}
              >
                <Layers className="w-3.5 h-3.5 shrink-0 hidden sm:inline-block text-primary" />
                <span className="truncate">1. General & Edición</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('precios')}
                className={cn(
                  'h-9 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center',
                  activeTab === 'precios'
                    ? 'bg-card text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                )}
              >
                <DollarSign className="w-3.5 h-3.5 shrink-0 hidden sm:inline-block text-primary" />
                <span className="truncate">2. Precios & Stock</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('bgg')}
                className={cn(
                  'h-9 px-2 sm:px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center',
                  activeTab === 'bgg'
                    ? 'bg-card text-foreground shadow-xs border border-border/60'
                    : 'text-muted-foreground hover:text-foreground hover:bg-card/40'
                )}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0 hidden sm:inline-block text-primary" />
                <span className="truncate">3. Ficha Técnica BGG</span>
              </button>
            </div>

            {/* ========================================================================= */}
            {/* PESTAÑA 1: GENERAL & EDICIÓN                                             */}
            {/* ========================================================================= */}
            {activeTab === 'general' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150 min-w-0">
                {/* Caja de Autocompletado BGG */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="quickBggInput" className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>¿Tienes el ID o enlace de BoardGameGeek?</span>
                    </Label>
                    {formData.bggRating != null && (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1 font-mono">
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
                      className="h-10 flex-1 rounded-xl border-input bg-background text-sm font-mono"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleFetchBgg}
                      disabled={isFetchingBgg || !formData.bggId.trim()}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-4 rounded-xl shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
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

                {/* Campos Principales (Cero Truncamientos) */}
                <div className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    {/* Nombre Base del Juego * (sm:col-span-7) */}
                    <div className="sm:col-span-7 space-y-1.5">
                      <Label htmlFor="gameBaseName" className="text-xs font-bold text-foreground">
                        Nombre Base del Juego <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="gameBaseName"
                        value={gameBaseName}
                        onChange={(e) => setGameBaseName(e.target.value)}
                        placeholder="Ej. Catan, Wingspan, Los Gatos de Schrödinger"
                        className="h-10 rounded-xl border-input bg-card text-sm font-semibold text-foreground w-full"
                        required
                      />
                    </div>

                    {/* Edición / Variante (sm:col-span-5) */}
                    <div className="sm:col-span-5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="editionName" className="text-xs font-bold text-foreground">
                          Edición / Variante
                        </Label>
                        {editionName && (
                          <button
                            type="button"
                            onClick={() => setEditionName('')}
                            className="text-[11px] text-destructive hover:underline cursor-pointer"
                          >
                            Limpiar
                          </button>
                        )}
                      </div>
                      <Input
                        id="editionName"
                        list="common-editions-list"
                        value={editionName}
                        onChange={(e) => setEditionName(e.target.value)}
                        placeholder="Ej. Juego Base, Deluxe, Expansión..."
                        className="h-10 rounded-xl border-input bg-card text-sm w-full"
                      />
                      <datalist id="common-editions-list">
                        {COMMON_EDITIONS.map((ed) => (
                          <option key={ed} value={ed} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Sugerencias de Edición limpias */}
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-[11px] font-semibold text-muted-foreground">Sugerencias:</span>
                    {['Juego Base', 'Deluxe', 'Expansión', '2da Edición'].map((ed) => (
                      <button
                        key={ed}
                        type="button"
                        onClick={() => setEditionName(ed)}
                        className={cn(
                          'text-[11px] px-2.5 py-0.5 rounded-lg border transition-colors cursor-pointer',
                          editionName === ed
                            ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                            : 'bg-card hover:bg-secondary text-muted-foreground hover:text-foreground border-border'
                        )}
                      >
                        {ed}
                      </button>
                    ))}
                  </div>

                  {/* Preview de Nombre en Catálogo */}
                  {computedFullProductName && (
                    <div className="bg-secondary/40 border border-border/60 rounded-xl px-3.5 py-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Nombre final en catálogo:</span>
                      <span className="font-bold text-foreground truncate ml-2">
                        {computedFullProductName}
                      </span>
                    </div>
                  )}

                  {/* Fila de Metadatos: Categoría / Línea (50%) + Editorial / Marca (50%) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="lineaCategoria" className="text-xs font-bold text-foreground">
                        Categoría / Línea
                      </Label>
                      <Input
                        id="lineaCategoria"
                        list="categories-list"
                        value={formData.lineaCategoria}
                        onChange={(e) => setFormData({ ...formData, lineaCategoria: e.target.value })}
                        placeholder="Ej. Estrategia, Familiar, Party Game..."
                        className="h-10 rounded-xl border-input bg-card text-sm w-full"
                      />
                      {categoryNamesList.length > 0 && (
                        <datalist id="categories-list">
                          {categoryNamesList.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="editorialMarca" className="text-xs font-bold text-foreground">
                        Editorial / Marca
                      </Label>
                      <Input
                        id="editorialMarca"
                        value={formData.editorialMarca}
                        onChange={(e) => setFormData({ ...formData, editorialMarca: e.target.value })}
                        placeholder="Ej. Devir, Asmodee, Stonemaier Games..."
                        className="h-10 rounded-xl border-input bg-card text-sm w-full"
                      />
                    </div>
                  </div>

                  {/* URL de Fotografía / Portada */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="imagenUrl" className="text-xs font-bold text-foreground">
                        URL de Fotografía / Portada
                      </Label>
                      {formData.imagenUrl && (
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, imagenUrl: '' })}
                          className="text-[11px] text-destructive hover:underline cursor-pointer"
                        >
                          Limpiar URL
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        id="imagenUrl"
                        value={formData.imagenUrl}
                        onChange={(e) => setFormData({ ...formData, imagenUrl: e.target.value })}
                        placeholder="https://... (JPG, PNG o enlace de BGG)"
                        className="h-10 rounded-xl border-input bg-card text-xs font-mono flex-1"
                      />
                      {formData.imagenUrl && (
                        <div className="w-10 h-10 rounded-xl border border-border overflow-hidden bg-secondary shrink-0 shadow-2xs relative group">
                          <img
                            src={formData.imagenUrl}
                            alt="Vista previa"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              ;(e.target as HTMLElement).style.display = 'none'
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Estado en Catálogo */}
                  <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-foreground block">Estado en Catálogo</Label>
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
              </div>
            )}

            {/* ========================================================================= */}
            {/* PESTAÑA 2: PRECIOS & STOCK                                               */}
            {/* ========================================================================= */}
            {activeTab === 'precios' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150 min-w-0">
                {/* Cuadrícula de Tarifas Financieras (2 Columnas Simétricas) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Costo Base */}
                  <div className="bg-card border border-border rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                    <Label htmlFor="costoBase" className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                      COSTO COMPRA
                    </Label>
                    <Input
                      id="costoBase"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.costoBase}
                      onChange={(e) => setFormData({ ...formData, costoBase: e.target.value })}
                      className="h-10 text-base font-extrabold text-foreground rounded-xl border-input bg-background text-right pr-3 w-full"
                    />
                    <span className="text-[10px] text-muted-foreground block">
                      Costo base o importación
                    </span>
                  </div>

                  {/* Precio Venta PVP */}
                  <div className="bg-card border border-border rounded-xl p-3.5 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="precioMercado" className="text-[10px] font-semibold text-muted-foreground uppercase">
                        PRECIO VENTA PVP
                      </Label>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-500/10 px-2 py-0.5 rounded-md font-mono">
                        {calcMargen(formData.precioMercado, formData.costoBase)} markup
                      </span>
                    </div>
                    <Input
                      id="precioMercado"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.precioMercado}
                      onChange={(e) => setFormData({ ...formData, precioMercado: e.target.value })}
                      className="h-10 text-base font-extrabold text-foreground rounded-xl border-input bg-background text-right pr-3 w-full"
                    />
                    <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block font-mono">
                      Ganancia: +S/ {calcGanancia(formData.precioMercado, formData.costoBase).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Tarjetas de Inventario y Promociones */}
                {/* Control de Stock Físico */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-foreground block flex items-center gap-1.5">
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
                    <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                      <div>
                        <Label htmlFor="stock" className="text-xs font-bold text-foreground block">
                          Unidades Disponibles en Almacén
                        </Label>
                        <span className="text-[11px] text-muted-foreground">
                          {parseInt(formData.stock) > 2 ? 'En inventario' : parseInt(formData.stock) > 0 ? 'Pocas unidades' : 'Agotado'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-lg border',
                            parseInt(formData.stock) > 2
                              ? 'bg-emerald-500/10 text-emerald-800 border-emerald-500/20'
                              : parseInt(formData.stock) > 0
                              ? 'bg-amber-500/10 text-amber-800 border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-800 border-rose-500/20'
                          )}
                        >
                          {parseInt(formData.stock) > 2 ? 'En stock' : parseInt(formData.stock) > 0 ? 'Bajo stock' : 'Sin stock'}
                        </Badge>
                        <Input
                          id="stock"
                          type="number"
                          min="0"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                          className="h-10 w-28 text-base font-extrabold text-foreground rounded-xl border-input bg-background text-right pr-3"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Activar Oferta Especial */}
                <div className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-bold text-foreground block flex items-center gap-1.5">
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
                    <div className="pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="porcentajeDescuento" className="text-xs font-bold text-foreground">
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
                          className="h-10 rounded-xl border-input bg-background text-sm font-mono font-bold"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="precioOferta" className="text-xs font-bold text-rose-700 dark:text-rose-400">
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
                          className="h-10 rounded-xl border-rose-500/40 bg-background text-sm font-mono font-extrabold text-rose-700 dark:text-rose-400"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* PESTAÑA 3: FICHA TÉCNICA BGG                                             */}
            {/* ========================================================================= */}
            {activeTab === 'bgg' && (
              <div className="space-y-4 animate-in fade-in-50 duration-150 min-w-0">
                {/* Grid de Especificaciones Técnicas (Zero Truncamiento) */}
                {/* Fila 1: Nº Jugadores + Duración (min) + Edad Mínima + Rating BGG */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="numJugadores" className="text-xs font-bold text-foreground block">
                      Nº Jugadores
                    </Label>
                    <Input
                      id="numJugadores"
                      value={formData.numJugadores}
                      onChange={(e) => setFormData({ ...formData, numJugadores: e.target.value })}
                      placeholder="2 - 4 jugadores"
                      className="h-10 rounded-xl border-input bg-card text-sm w-full"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="duracionMinutos" className="text-xs font-bold text-foreground block">
                      Duración (min)
                    </Label>
                    <Input
                      id="duracionMinutos"
                      type="number"
                      value={formData.duracionMinutos}
                      onChange={(e) => setFormData({ ...formData, duracionMinutos: e.target.value })}
                      placeholder="60"
                      className="h-10 rounded-xl border-input bg-card text-sm w-full font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="edadMinima" className="text-xs font-bold text-foreground block">
                      Edad Mínima
                    </Label>
                    <Input
                      id="edadMinima"
                      type="number"
                      value={formData.edadMinima}
                      onChange={(e) => setFormData({ ...formData, edadMinima: e.target.value })}
                      placeholder="10+"
                      className="h-10 rounded-xl border-input bg-card text-sm w-full font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bggRatingTab3" className="text-xs font-bold text-foreground block">
                      Rating BGG
                    </Label>
                    <Input
                      id="bggRatingTab3"
                      type="number"
                      step="0.1"
                      min="1"
                      max="10"
                      value={formData.bggRating != null ? String(formData.bggRating) : ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          bggRating: e.target.value ? parseFloat(e.target.value) : null
                        })
                      }
                      placeholder="7.5 / 10"
                      className="h-10 rounded-xl border-input bg-card text-sm w-full font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Fila 2: Idioma de la Edición (Input con chips rápidos: Español, Inglés, Multilenguaje) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="idioma" className="text-xs font-bold text-foreground">
                      Idioma de la Edición
                    </Label>
                    <div className="flex items-center gap-1.5">
                      {['Español', 'Inglés', 'Multilenguaje'].map((lang) => (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setFormData({ ...formData, idioma: lang })}
                          className={cn(
                            'text-[11px] px-2.5 py-0.5 rounded-lg border transition-colors cursor-pointer',
                            formData.idioma === lang
                              ? 'bg-primary text-primary-foreground border-primary font-bold shadow-2xs'
                              : 'bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border-border'
                          )}
                        >
                          {lang}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    id="idioma"
                    value={formData.idioma}
                    onChange={(e) => setFormData({ ...formData, idioma: e.target.value })}
                    placeholder="Ej. Español, Inglés, Multilenguaje"
                    className="h-10 rounded-xl border-input bg-card text-sm w-full"
                  />
                </div>

                {/* Mecánicas del Juego (Selector Compacto) */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-foreground block">
                    Mecánicas del Juego
                  </Label>

                  {/* Input de búsqueda / adición de mecánicas con datalist */}
                  <div className="flex gap-2">
                    <Input
                      list="mechanics-datalist"
                      value={mechanicSearch}
                      onChange={(e) => setMechanicSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddMechanic()
                        }
                      }}
                      placeholder="Buscar o escribir mecánica (ej. Gestión de Mano, Drafting)..."
                      className="h-10 flex-1 rounded-xl border-input bg-card text-sm"
                    />
                    <datalist id="mechanics-datalist">
                      {COMMON_MECHANICS.map((mec) => (
                        <option key={mec} value={mec} />
                      ))}
                    </datalist>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleAddMechanic()}
                      disabled={!mechanicSearch.trim()}
                      className="h-10 px-4 rounded-xl text-xs font-semibold border-border bg-card hover:bg-secondary text-foreground cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      <span>Agregar</span>
                    </Button>
                  </div>

                  {/* Chips seleccionados con botón de remover x */}
                  <div className="flex flex-wrap gap-1.5 min-h-[42px] p-2.5 bg-card border border-border rounded-xl">
                    {selectedMechanics.length > 0 ? (
                      selectedMechanics.map((mec) => (
                        <span
                          key={mec}
                          className="bg-secondary border border-border/80 text-foreground text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs"
                        >
                          <span>{mec}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMechanic(mec)}
                            className="text-muted-foreground hover:text-destructive cursor-pointer transition-colors p-0.5 rounded-sm"
                            title={`Remover ${mec}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground self-center pl-1 italic">
                        Sin mecánicas seleccionadas. Agrega desde la lista o escribe una arriba.
                      </span>
                    )}
                  </div>
                </div>

                {/* Sinopsis y Destacado */}
                <div className="space-y-1.5">
                  <Label htmlFor="descripcionWeb" className="text-xs font-bold text-foreground">
                    Sinopsis / Descripción
                  </Label>
                  <textarea
                    id="descripcionWeb"
                    value={formData.descripcionWeb}
                    onChange={(e) => setFormData({ ...formData, descripcionWeb: e.target.value })}
                    rows={3}
                    placeholder="Breve reseña del juego de mesa, temática y componentes principales..."
                    className="w-full text-sm p-3.5 rounded-xl border border-input bg-card focus:outline-primary min-h-[80px] resize-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>

                {/* Switch Destacado en Tienda Web */}
                <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <Label className="text-xs font-bold text-foreground block">Destacar en Tienda Web</Label>
                    <span className="text-[11px] text-muted-foreground">
                      Mostrar juego en el escaparate de productos destacados
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
          {/* 3. FOOTER ESTANDARIZADO (EN TODOS LOS TABS)                              */}
          {/* ========================================================================= */}
          <div className="px-6 py-4 border-t border-border/70 bg-card/40 flex items-center justify-between mt-auto shrink-0 w-full">
            {/* Izquierda: Cancelar */}
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground h-10 px-4 cursor-pointer"
            >
              Cancelar
            </Button>

            {/* Centro: Botones de navegación */}
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeTab === 'general'}
                onClick={() => setActiveTab(activeTab === 'bgg' ? 'precios' : 'general')}
                className="h-10 px-3 rounded-xl text-xs font-semibold border-border bg-card hover:bg-secondary text-foreground cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={activeTab === 'bgg'}
                onClick={() => setActiveTab(activeTab === 'general' ? 'precios' : 'bgg')}
                className="h-10 px-3 rounded-xl text-xs font-semibold border-border bg-card hover:bg-secondary text-foreground cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed gap-1.5"
              >
                <span>Siguiente</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Derecha: Botón primario */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-10 px-5 rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{editingProduct ? 'Actualizar Ficha' : 'Guardar Ficha'}</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export const GameEditModal = ProductFormModal
export const EditGameDialog = ProductFormModal
