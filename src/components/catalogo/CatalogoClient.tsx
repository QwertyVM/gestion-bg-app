'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  X, 
  Package, 
  PackageCheck, 
  Archive, 
  RotateCcw, 
  Pencil, 
  CopyPlus, 
  Share2, 
  Check, 
  Layers, 
  Palette, 
  Clock, 
  Weight, 
  DollarSign, 
  Boxes, 
  Calculator, 
  MoreHorizontal,
  Trash2,
  ExternalLink,
  ChevronDown,
  Globe,
  Dices,
  FileDown
} from 'lucide-react'
import { useBusiness } from '@/context/BusinessContext'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { 
  createProducto, 
  updateProducto, 
  toggleEstadoProducto, 
  duplicarProducto, 
  deleteProducto 
} from '@/actions/productos'
import { updateBggStats, bulkUpdateBggStats, BggStatUpdateItem } from '@/actions/bgg'
import { XMLParser } from 'fast-xml-parser'

export interface ProductoItem {
  id: string
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioAmigos: number
  precioMercado: number
  precioComunidad?: number
  pesoGramos?: number
  activo: boolean
  stock?: number
  controlarStock?: boolean
  enOferta?: boolean
  precioOferta?: number | null
  porcentajeDescuento?: number | null
  imagenUrl?: string | null
  descripcionWeb?: string | null
  destacadoWeb?: boolean
  createdAt?: string
  updatedAt?: string
  negocio?: string
  bggId?: number | null
  bggRating?: any
  bggWeight?: any
  bggMinPlayers?: number | null
  bggMaxPlayers?: number | null
  bggPlaytime?: number | null
  editorialMarca?: string | null
  mecanicas?: string | null
  edadMinima?: number | null
  duracionMinutos?: number | null
  idioma?: string | null
  numJugadores?: string | null
  bulletPoint1?: string | null
  bulletPoint2?: string | null
  bulletPoint3?: string | null
  bulletPoint4?: string | null
}

export interface CategoriaItem {
  id: string
  nombre: string
  descripcion?: string
  totalProductos?: number
  createdAt?: string
  updatedAt?: string
}

interface CatalogoClientProps {
  productos: ProductoItem[]
  categoriasIniciales?: CategoriaItem[]
}

type EstadoFilter = 'TODOS' | 'ACTIVOS' | 'DESCONTINUADOS'

export function CatalogoClient({ 
  productos: initialProductos, 
  categoriasIniciales = [] 
}: CatalogoClientProps) {
  const router = useRouter()
  const { is3D, isBG } = useBusiness()
  const [productos, setProductos] = useState<ProductoItem[]>(initialProductos)
  const [categorias, setCategorias] = useState<CategoriaItem[]>(categoriasIniciales)

  // Sync state with props when business context changes and server refetches
  useEffect(() => {
    setProductos(initialProductos)
  }, [initialProductos])

  useEffect(() => {
    setCategorias(categoriasIniciales)
  }, [categoriasIniciales])
  
  // Toolbar and Filters
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODAS')
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>('TODOS')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isPending, startTransition] = useTransition()

  // Modal State
  const [openModal, setOpenModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    nombreModelo: '',
    lineaCategoria: '',
    pesoGramos: '',
    tiempoHoras: '',
    costoBase: '',
    precioAmigos: '',
    precioMercado: '',
    activo: true,
    stock: '0',
    controlarStock: false,
    enOferta: false,
    precioOferta: '',
    porcentajeDescuento: '',
    imagenUrl: '',
    descripcionWeb: '',
    destacadoWeb: false,
    bulletPoint1: '',
    bulletPoint2: '',
    bulletPoint3: '',
    bulletPoint4: '',
    numJugadores: '',
    edadMinima: '',
    duracionMinutos: '',
    idioma: '',
    editorialMarca: '',
    mecanicas: '',
    bggId: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSyncingBgg, setIsSyncingBgg] = useState(false)
  const [isExportOpen, setIsExportOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)

  const bggCount = useMemo(() => {
    return productos.filter(p => p.bggId != null && Number(p.bggId) > 0).length
  }, [productos])

  const handleExportBggCsv = (onlyWithBgg: boolean = true) => {
    const targetProducts = onlyWithBgg 
      ? productos.filter(p => p.bggId != null && Number(p.bggId) > 0)
      : productos

    if (targetProducts.length === 0) {
      toast.info('No hay productos con código BGG registrado para exportar')
      return
    }

    const headers = ['id', 'bggId', 'nombreModelo', 'negocio']
    const rows = targetProducts.map(p => [
      p.id,
      p.bggId ?? '',
      p.nombreModelo,
      p.negocio || (isBG ? 'BG' : '3D')
    ])

    const escapeCsv = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(escapeCsv).join(','))
    ].join('\r\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const dateStr = new Date().toISOString().split('T')[0]
    const fileSuffix = onlyWithBgg ? 'bgg' : 'catalogo'
    link.href = url
    link.download = `productos_${fileSuffix}_${(isBG ? 'bg' : '3d')}_${dateStr}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success(`Exportados ${targetProducts.length} productos (.csv)`)
  }

  const handleSyncBgg = async () => {
    // Filtrar los que tienen ID válido
    const gamesWithBgg = productos.filter((p) => p.bggId && Number(p.bggId) > 0)
    if (gamesWithBgg.length === 0) {
      toast.info('No hay juegos con BGG ID configurado')
      return
    }

    setIsSyncingBgg(true)
    toast.info(`Consultando ${gamesWithBgg.length} juegos en BGG en 1 sola llamada...`)

    const token = 'f7ad4bda-0a75-4d1c-9ee0-bb8417ea409f'
    const bggIdMap = new Map<number, (typeof gamesWithBgg)[0]>()
    gamesWithBgg.forEach((p) => {
      bggIdMap.set(Number(p.bggId), p)
    })

    const idsParam = Array.from(bggIdMap.keys()).join(',')
    const url = `https://boardgamegeek.com/xmlapi2/thing?id=${idsParam}&stats=1`

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'BGG-Personal-Collection-Tracker/1.0 (hobby project)',
          Accept: 'application/xml,text/xml,*/*',
        },
      })

      if (!response.ok) {
        throw new Error(`Error BGG API (${response.status}): ${response.statusText}`)
      }

      const xmlText = await response.text()
      const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: '@_',
      })
      const result = parser.parse(xmlText)
      const rawItems = result.items?.item
      const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : []

      const updates: BggStatUpdateItem[] = []

      for (const item of items) {
        const id = parseInt(item['@_id'], 10)
        if (!id) continue
        const prod = bggIdMap.get(id)
        if (!prod) continue

        const rating = parseFloat(item.statistics?.ratings?.average?.['@_value']) || undefined
        const weight = parseFloat(item.statistics?.ratings?.averageweight?.['@_value']) || undefined
        const ratingCount = parseInt(item.statistics?.ratings?.usersrated?.['@_value'], 10) || undefined
        const minPlayers = parseInt(item.minplayers?.['@_value'], 10) || undefined
        const maxPlayers = parseInt(item.maxplayers?.['@_value'], 10) || undefined
        const playtime = parseInt(item.playingtime?.['@_value'], 10) || undefined
        const minAgeVal = parseInt(item.minage?.['@_value'], 10) || undefined
        const edadMinima = minAgeVal && minAgeVal > 0 ? minAgeVal : undefined
        const duracionMinutos = playtime && playtime > 0 ? playtime : undefined

        let numJugadores: string | undefined = undefined
        if (minPlayers && maxPlayers) {
          numJugadores =
            minPlayers === maxPlayers
              ? `${minPlayers} jugadores`
              : `${minPlayers} - ${maxPlayers} jugadores`
        } else if (minPlayers) {
          numJugadores = `${minPlayers}+ jugadores`
        }

        const links = Array.isArray(item.link) ? item.link : item.link ? [item.link] : []
        const publishers: string[] = links
          .filter((l: any) => l?.['@_type'] === 'boardgamepublisher')
          .map((l: any) => l?.['@_value'])
          .filter(Boolean)
        const editorialMarca = publishers[0] || undefined

        const mechanics: string[] = links
          .filter((l: any) => l?.['@_type'] === 'boardgamemechanic')
          .map((l: any) => l?.['@_value'])
          .filter(Boolean)

        const mechanicMap: Record<string, string> = {
          'Hidden Roles': 'Roles Ocultos',
          'Player Elimination': 'Eliminación de Jugadores',
          'Voting': 'Votación',
          'Variable Player Powers': 'Poderes Variables',
          'Deduction': 'Deducción',
          'Bluffing': 'Faroleo / Engaño',
          'Hand Management': 'Gestión de Mano',
          'Set Collection': 'Colección de Sets',
          'Drafting': 'Drafting de Cartas',
          'Card Drafting': 'Drafting de Cartas',
          'Dice Rolling': 'Tirada de Dados',
          'Worker Placement': 'Colocación de Trabajadores',
          'Tile Placement': 'Colocación de Losetas',
          'Cooperative Game': 'Cooperativo',
          'Pattern Recognition': 'Reconocimiento de Patrones',
          'Speed Matching': 'Velocidad y Reflejos',
        }
        const translatedMechanics = mechanics.slice(0, 4).map((m) => mechanicMap[m] || m)
        const mecanicas = translatedMechanics.length > 0 ? translatedMechanics.join(', ') : undefined

        updates.push({
          id: prod.id,
          bggRating: rating ? parseFloat(rating.toFixed(2)) : null,
          bggWeight: weight ? parseFloat(weight.toFixed(2)) : null,
          bggMinPlayers: minPlayers || null,
          bggMaxPlayers: maxPlayers || null,
          bggPlaytime: playtime || null,
          bggRatingCount: ratingCount || null,
          numJugadores: numJugadores || null,
          edadMinima: edadMinima || null,
          duracionMinutos: duracionMinutos || null,
          editorialMarca: editorialMarca || null,
          mecanicas: mecanicas || null,
          idioma: 'Español',
        })
      }

      if (updates.length > 0) {
        await bulkUpdateBggStats(updates)
        const updateMap = new Map(updates.map((u) => [u.id, u]))
        setProductos((prev) =>
          prev.map((p) => {
            const upd = updateMap.get(p.id)
            if (!upd) return p
            return {
              ...p,
              bggRating: upd.bggRating,
              bggWeight: upd.bggWeight,
              bggMinPlayers: upd.bggMinPlayers,
              bggMaxPlayers: upd.bggMaxPlayers,
              bggPlaytime: upd.bggPlaytime,
            }
          })
        )
        toast.success(`¡Éxito! ${updates.length} juegos actualizados en 1 sola llamada a BGG.`)
        router.refresh()
      } else {
        toast.warning('No se encontraron estadísticas para los IDs consultados en BGG.')
      }
    } catch (error: any) {
      console.error('Error en sincronización masiva BGG:', error)
      toast.error('Error al consultar BGG: ' + (error.message || 'Verifica tu conexión'))
    } finally {
      setIsSyncingBgg(false)
    }
  }

  // Close context menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null)
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setIsExportOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Calculate profit margin percentage
  const calcMargen = (precio: number, costo: number) => {
    if (costo <= 0) return '+0%'
    const margen = ((precio - costo) / costo) * 100
    return margen >= 0 ? `+${margen.toFixed(0)}%` : `${margen.toFixed(0)}%`
  }

  // Estimate print time (approx 22g/hour as workshop baseline)
  const estimarTiempoImpresion = (gramos: number) => {
    if (!gramos || gramos <= 0) return '—'
    const horas = gramos / 22
    if (horas < 1) return `${Math.round(horas * 60)} min`
    return `${horas.toFixed(1)}h`
  }

  // Categories list for dropdown
  const categoryNamesList = useMemo(() => {
    const set = new Set<string>()
    categorias.forEach(c => set.add(c.nombre))
    productos.forEach(p => {
      if (p.lineaCategoria) set.add(p.lineaCategoria.trim())
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }))
  }, [categorias, productos])

  // KPIs
  const totalModelos = productos.length
  const activosCount = useMemo(() => productos.filter(p => p.activo).length, [productos])
  const descontinuadosCount = useMemo(() => productos.filter(p => !p.activo).length, [productos])
  const categoriasActivasCount = useMemo(() => {
    const activeCats = new Set(productos.filter(p => p.activo).map(p => p.lineaCategoria))
    return activeCats.size
  }, [productos])

  // Filtered Products List
  const filteredProductos = useMemo(() => {
    let list = productos

    if (estadoFilter === 'ACTIVOS') {
      list = list.filter(p => p.activo)
    } else if (estadoFilter === 'DESCONTINUADOS') {
      list = list.filter(p => !p.activo)
    }

    if (categoriaFilter !== 'TODAS') {
      list = list.filter(p => (p.lineaCategoria || '').toLowerCase() === categoriaFilter.toLowerCase())
    }

    if (search.trim()) {
      const q = search.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      list = list.filter(p => {
        const nombre = (p.nombreModelo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        const cat = (p.lineaCategoria || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
        const gramos = (p.pesoGramos || '').toString()

        return nombre.includes(q) || cat.includes(q) || gramos.includes(q)
      })
    }

    return list.sort((a, b) => {
      if (a.activo && !b.activo) return -1
      if (!a.activo && b.activo) return 1
      return a.nombreModelo.localeCompare(b.nombreModelo, 'es', { sensitivity: 'base' })
    })
  }, [productos, estadoFilter, categoriaFilter, search])

  // Copy Quotation to Clipboard for WhatsApp: "[Nombre] - Precio: S/ [Mercado]"
  const handleCopiarCotizacion = (p: ProductoItem) => {
    const message = `${p.nombreModelo} - Precio: ${formatCurrency(p.precioMercado)}`
    navigator.clipboard.writeText(message)
    setCopiedId(p.id)
    setTimeout(() => setCopiedId(null), 2000)
    toast.success(`Cotización de "${p.nombreModelo}" copiada`)
  }

  // Toggle Active/Discontinued
  const handleToggleEstado = async (p: ProductoItem) => {
    const nuevoEstado = !p.activo
    setProductos(prev => prev.map(item => item.id === p.id ? { ...item, activo: nuevoEstado } : item))
    setActiveMenuId(null)

    try {
      await toggleEstadoProducto(p.id)
      toast.success(`"${p.nombreModelo}" marcado como ${nuevoEstado ? 'Activo' : 'Descontinuado'}`)
    } catch (e: any) {
      toast.error('Error al cambiar estado: ' + e.message)
      setProductos(prev => prev.map(item => item.id === p.id ? { ...item, activo: !nuevoEstado } : item))
    }
  }

  // Duplicate product
  const handleDuplicar = async (p: ProductoItem) => {
    setActiveMenuId(null)
    try {
      const duplicado = await duplicarProducto(p.id)
      setProductos(prev => [duplicado, ...prev])
      toast.success(`Modelo "${duplicado.nombreModelo}" duplicado`)
    } catch (e: any) {
      toast.error('Error al duplicar modelo: ' + e.message)
    }
  }

  // Delete product
  const handleDelete = async (p: ProductoItem) => {
    setActiveMenuId(null)
    if (!confirm(`¿Estás seguro de eliminar o archivar "${p.nombreModelo}"?`)) return

    try {
      const res = await deleteProducto(p.id)
      if (res.discontinued) {
        setProductos(prev => prev.map(item => item.id === p.id ? { ...item, activo: false } : item))
        toast.info(res.message)
      } else {
        setProductos(prev => prev.filter(item => item.id !== p.id))
        toast.success(res.message)
      }
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
    }
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingId(null)
    setFormData({
      nombreModelo: '',
      lineaCategoria: categoryNamesList[0] || 'General',
      pesoGramos: is3D ? '150' : '0',
      tiempoHoras: is3D ? '4.5' : '0',
      costoBase: is3D ? '9.75' : '0',
      precioAmigos: is3D ? '18.00' : '0',
      precioMercado: is3D ? '30.00' : '0',
      activo: true,
      stock: '0',
      controlarStock: false,
      enOferta: false,
      precioOferta: '',
      porcentajeDescuento: '',
      imagenUrl: '',
      descripcionWeb: '',
      destacadoWeb: false,
      bulletPoint1: '',
      bulletPoint2: '',
      bulletPoint3: '',
      bulletPoint4: '',
      numJugadores: '',
      edadMinima: '',
      duracionMinutos: '',
      idioma: '',
      editorialMarca: '',
      mecanicas: '',
      bggId: ''
    })
    setOpenModal(true)
  }

  // Open Edit Modal
  const handleOpenEdit = (p: ProductoItem) => {
    setEditingId(p.id)
    const gramos = p.pesoGramos || 0
    setFormData({
      nombreModelo: p.nombreModelo,
      lineaCategoria: p.lineaCategoria || 'General',
      pesoGramos: gramos > 0 ? gramos.toString() : '',
      tiempoHoras: gramos > 0 ? (gramos / 22).toFixed(1) : '',
      costoBase: p.costoBase.toString(),
      precioAmigos: p.precioAmigos.toString(),
      precioMercado: p.precioMercado.toString(),
      activo: p.activo,
      stock: p.stock?.toString() || '0',
      controlarStock: p.controlarStock || false,
      enOferta: p.enOferta || false,
      precioOferta: p.precioOferta ? p.precioOferta.toString() : '',
      porcentajeDescuento: (p as any).porcentajeDescuento ? (p as any).porcentajeDescuento.toString() : '',
      imagenUrl: p.imagenUrl || '',
      descripcionWeb: p.descripcionWeb || '',
      destacadoWeb: p.destacadoWeb || false,
      bulletPoint1: (p as any).bulletPoint1 || '',
      bulletPoint2: (p as any).bulletPoint2 || '',
      bulletPoint3: (p as any).bulletPoint3 || '',
      bulletPoint4: (p as any).bulletPoint4 || '',
      numJugadores: (p as any).numJugadores || '',
      edadMinima: (p as any).edadMinima?.toString() || '',
      duracionMinutos: (p as any).duracionMinutos?.toString() || '',
      idioma: (p as any).idioma || '',
      editorialMarca: (p as any).editorialMarca || '',
      mecanicas: (p as any).mecanicas || '',
      bggId: (p as any).bggId?.toString() || ''
    })
    setOpenModal(true)
  }

  // Recalculate base cost automatically from grams
  const handleGramosChange = (val: string) => {
    const g = parseFloat(val) || 0
    const horas = g > 0 ? (g / 22).toFixed(1) : ''
    const costoEstimado = g > 0 ? (g * 0.065).toFixed(2) : ''
    
    setFormData(prev => ({
      ...prev,
      pesoGramos: val,
      tiempoHoras: horas,
      costoBase: costoEstimado || prev.costoBase
    }))
  }

  // Oferta Handlers
  const handleDescuentoChange = (val: string) => {
    const pMercado = parseFloat(formData.precioMercado) || 0
    const costoBase = parseFloat(formData.costoBase) || 0
    let descuento = parseFloat(val) || 0

    if (descuento < 0) descuento = 0
    if (descuento > 100) descuento = 100

    let nuevoPrecio = pMercado - (pMercado * descuento / 100)
    
    // Ensure new price is not less than base cost
    if (nuevoPrecio < costoBase && costoBase > 0) {
      nuevoPrecio = costoBase
      descuento = Math.round(((pMercado - nuevoPrecio) / pMercado) * 100)
    }

    setFormData(prev => ({
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
    
    // Ensure new price is not less than base cost
    if (nuevoPrecio < costoBase && costoBase > 0) {
      nuevoPrecio = costoBase
    }

    let descuento = 0
    if (pMercado > 0 && nuevoPrecio < pMercado) {
      descuento = Math.round(((pMercado - nuevoPrecio) / pMercado) * 100)
    }

    setFormData(prev => ({
      ...prev,
      precioOferta: nuevoPrecio.toString(),
      porcentajeDescuento: descuento.toString()
    }))
  }

  // Submit Modal
  const handleSubmitModal = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nombreModelo.trim()) {
      toast.error('El nombre del modelo es obligatorio')
      return
    }

    const costoBase = parseFloat(formData.costoBase) || 0
    const precioOferta = formData.precioOferta ? parseFloat(formData.precioOferta) : 0
    if (formData.enOferta && precioOferta > 0 && precioOferta < costoBase) {
      toast.error('El precio de oferta no puede ser menor al costo base')
      return
    }

    const payload = {
      nombreModelo: formData.nombreModelo.trim(),
      lineaCategoria: formData.lineaCategoria.trim() || 'General',
      pesoGramos: formData.pesoGramos ? parseFloat(formData.pesoGramos) : 0,
      costoBase: costoBase,
      precioAmigos: parseFloat(formData.precioAmigos) || 0,
      precioMercado: parseFloat(formData.precioMercado) || 0,
      activo: formData.activo,
      stock: parseInt(formData.stock) || 0,
      controlarStock: formData.controlarStock,
      enOferta: formData.enOferta,
      precioOferta: formData.enOferta ? (parseFloat(formData.precioOferta) || null) : null,
      porcentajeDescuento: formData.enOferta ? (parseInt(formData.porcentajeDescuento) || 0) : 0,
      imagenUrl: formData.imagenUrl.trim() || null,
      descripcionWeb: formData.descripcionWeb.trim() || null,
      destacadoWeb: formData.destacadoWeb,
      bulletPoint1: formData.bulletPoint1.trim() || null,
      bulletPoint2: formData.bulletPoint2.trim() || null,
      bulletPoint3: formData.bulletPoint3.trim() || null,
      bulletPoint4: formData.bulletPoint4.trim() || null,
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
      if (editingId) {
        const updated = await updateProducto(editingId, payload)
        setProductos(prev => prev.map(p => p.id === editingId ? updated : p))
        toast.success(`Modelo "${payload.nombreModelo}" actualizado`)
      } else {
        const created = await createProducto(payload)
        setProductos(prev => [created, ...prev])
        toast.success(`Modelo "${payload.nombreModelo}" registrado en catálogo`)
      }
      setOpenModal(false)
    } catch (e: any) {
      toast.error('Error al guardar: ' + e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-4 sm:space-y-6 animate-in fade-in duration-200">
      
      {/* ========================================================================= */}
      {/* 1. CABECERA Y BARRA DE ACCIONES                                           */}
      {/* ========================================================================= */}
      <div className="space-y-4">
        {/* Breadcrumb Contextual */}
        <div className="flex items-center gap-1.5 text-xs text-[#75695D] font-medium">
          <Link href="/catalogo" className="hover:text-[#A36F4C] transition-colors flex items-center gap-1">
            <Package className="h-3.5 w-3.5 text-[#A36F4C]" />
            <span>Catálogo</span>
          </Link>
          <span className="text-[#D4BEA7]">/</span>
          <span className="text-[#241C15] font-bold">Catálogo de Productos</span>
        </div>

        {/* Título & Botones de Acción */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#241C15] tracking-tight flex items-center gap-2.5">
              <Boxes className="h-6 w-6 sm:h-7 sm:w-7 text-[#A36F4C] flex-shrink-0" />
              <span>Catálogo de Productos</span>
            </h1>
            <p className="text-xs sm:text-sm text-[#75695D] mt-1">
              {is3D ? 'Modelos 3D disponibles con costos base, tiempos de impresión y precios escalonados.' : 'Juegos de mesa disponibles para venta online y presencial.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            {/* Dropdown / Botón Exportar BGG CSV */}
            <div className="relative flex-1 sm:flex-initial" ref={exportMenuRef}>
              <Button
                type="button"
                onClick={() => setIsExportOpen(prev => !prev)}
                className="w-full sm:w-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#241C15] border border-[#E2D9CC] shadow-2xs transition-all cursor-pointer justify-center h-10"
                title="Exportar archivo CSV con ID de negocio y código BGG"
              >
                <FileDown className="h-4 w-4 text-[#A36F4C]" />
                <span>Exportar BGG (.csv)</span>
                {bggCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#EADDD0] text-[#754E31] text-[10px] font-bold">
                    {bggCount}
                  </span>
                )}
                <ChevronDown className={`h-3.5 w-3.5 text-[#75695D] transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
              </Button>

              {isExportOpen && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white border border-[#E2D9CC] rounded-2xl shadow-xl p-1.5 z-50 animate-in fade-in duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      handleExportBggCsv(true)
                      setIsExportOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors flex items-center justify-between text-xs font-semibold text-[#241C15] cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span>Solo vinculados a BGG</span>
                      <span className="text-[10px] text-[#75695D] font-normal">Con código BGG activo</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#EADDD0] text-[#754E31] text-[10px] font-bold">
                      {bggCount}
                    </span>
                  </button>

                  <div className="h-px bg-[#E2D9CC]/60 my-1" />

                  <button
                    type="button"
                    onClick={() => {
                      handleExportBggCsv(false)
                      setIsExportOpen(false)
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors flex items-center justify-between text-xs font-semibold text-[#241C15] cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span>Catálogo completo ({isBG ? 'BG' : '3D'})</span>
                      <span className="text-[10px] text-[#75695D] font-normal">Todos los productos con columna BGG</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] text-[10px] font-bold">
                      {productos.length}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {/* Botón Sincronizar BGG */}
            <Button
              type="button"
              onClick={handleSyncBgg}
              disabled={isSyncingBgg}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#241C15] border border-[#E2D9CC] shadow-2xs transition-all cursor-pointer flex-1 sm:flex-initial justify-center h-10 disabled:opacity-50"
            >
              <RotateCcw className={`h-4 w-4 text-[#A36F4C] ${isSyncingBgg ? 'animate-spin' : ''}`} />
              <span>{isSyncingBgg ? 'Sincronizando...' : 'Actualizar BGG'}</span>
            </Button>

            {/* Botón Gestionar Categorías */}
            <Link
              href="/catalogo/categorias"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#FAF8F5] hover:bg-[#F4EFEA] text-[#241C15] border border-[#E2D9CC] shadow-2xs transition-all cursor-pointer flex-1 sm:flex-initial justify-center h-10"
            >
              <Layers className="h-4 w-4 text-[#A36F4C]" />
              <span>Categorías</span>
            </Link>

            {/* Botón Primario + Nuevo Producto */}
            <Button
              type="button"
              onClick={handleOpenCreate}
              className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs h-10 px-4 rounded-xl shadow-xs cursor-pointer transition-all active:scale-[0.98] flex-1 sm:flex-initial flex items-center gap-2 justify-center"
            >
              <Plus className="h-4 w-4 stroke-[2.5]" />
              <span>Nuevo Producto</span>
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. FILA SUPERIOR DE KPIS (GRID 4 COLUMNAS MINIMALISTA)                    */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1: Total Modelos */}
          <div 
            onClick={() => setEstadoFilter('TODOS')}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs cursor-pointer transition-all ${
              estadoFilter === 'TODOS'
                ? 'bg-white border-[#A36F4C] ring-1 ring-[#A36F4C]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Total Modelos</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
                <Boxes className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
                {totalModelos} <span className="text-xs font-normal font-sans text-[#75695D]">diseños</span>
              </div>
              <span className="text-xs text-[#75695D] mt-0.5 block truncate">
                En catálogo general
              </span>
            </div>
          </div>

          {/* KPI 2: Activos en Venta */}
          <div 
            onClick={() => setEstadoFilter('ACTIVOS')}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs cursor-pointer transition-all ${
              estadoFilter === 'ACTIVOS'
                ? 'bg-white border-[#1E5E3A] ring-1 ring-[#1E5E3A]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Activos en Venta</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
                <PackageCheck className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#1E5E3A] font-mono tabular-nums">
                {activosCount} <span className="text-xs font-normal font-sans text-[#75695D]">modelos</span>
              </div>
              <span className="text-xs text-[#1E5E3A] font-medium mt-0.5 block truncate">
                Disponibles para pedidos
              </span>
            </div>
          </div>

          {/* KPI 3: Descontinuados */}
          <div 
            onClick={() => setEstadoFilter('DESCONTINUADOS')}
            className={`p-3.5 rounded-2xl border flex flex-col justify-between shadow-xs cursor-pointer transition-all ${
              estadoFilter === 'DESCONTINUADOS'
                ? 'bg-white border-[#75695D] ring-1 ring-[#75695D]'
                : 'bg-white border-[#E2D9CC] hover:bg-[#FAF8F5]'
            }`}
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Descontinuados</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#75695D]">
                <Archive className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#75695D] font-mono tabular-nums">
                {descontinuadosCount} <span className="text-xs font-normal font-sans text-[#75695D]">archivados</span>
              </div>
              <span className="text-xs text-[#75695D] mt-0.5 block truncate">
                Fuera de venta
              </span>
            </div>
          </div>

          {/* KPI 4: Categorías Activas */}
          <Link
            href="/catalogo/categorias"
            className="p-3.5 rounded-2xl bg-white border border-[#E2D9CC] hover:bg-[#FAF8F5] flex flex-col justify-between shadow-xs transition-colors"
          >
            <div className="flex items-center justify-between text-[#6B7280]">
              <span className="text-xs font-semibold">Categorías</span>
              <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
                <Layers className="h-3.5 w-3.5" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-[#A36F4C] font-mono tabular-nums">
                {categoriasActivasCount} <span className="text-xs font-normal font-sans text-[#75695D]">familias</span>
              </div>
              <span className="text-xs text-[#A36F4C] font-medium mt-0.5 block truncate">
                Gestionar categorías →
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE HERRAMIENTAS Y FILTROS (SINGLE-ROW TOOLBAR)                   */}
      {/* ========================================================================= */}
      <div className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Lado Izquierdo: Buscador + Dropdown Categorías */}
          <div className="flex items-center gap-2.5 flex-1 min-w-0 flex-wrap sm:flex-nowrap">
            {/* Buscador */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#75695D]" />
              <Input 
                placeholder="Buscar modelo, tag o gramaje..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-8 bg-[#F8F6F2] border-[#E2D9CC] text-[#241C15] placeholder:text-[#75695D] text-xs sm:text-sm rounded-2xl h-10 focus:border-[#A36F4C] focus:bg-[#FFFFFF] transition-all"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#75695D] hover:text-[#241C15] p-1 rounded-md cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown de Categorías */}
            <select
              value={categoriaFilter}
              onChange={(e) => setCategoriaFilter(e.target.value)}
              className="h-10 px-3 bg-[#F8F6F2] border border-[#E2D9CC] text-xs font-bold text-[#241C15] rounded-2xl focus:border-[#A36F4C] focus:bg-white cursor-pointer min-w-[150px]"
            >
              <option value="TODAS">Todas las Categorías</option>
              {categoryNamesList.map(cat => (
                <option key={cat} value={cat}>
                  {cat} ({productos.filter(p => p.lineaCategoria.toLowerCase() === cat.toLowerCase()).length})
                </option>
              ))}
            </select>
          </div>

          {/* Lado Derecho: Segmented Control Estado */}
          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
            <div className="bg-[#EAE4DC] p-1 rounded-2xl border border-[#D4BEA7] flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setEstadoFilter('TODOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  estadoFilter === 'TODOS'
                    ? 'bg-[#FFFFFF] text-[#241C15] shadow-xs'
                    : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
                }`}
              >
                Todos ({productos.length})
              </button>

              <button
                type="button"
                onClick={() => setEstadoFilter('ACTIVOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  estadoFilter === 'ACTIVOS'
                    ? 'bg-[#FFFFFF] text-[#1E5E3A] shadow-xs'
                    : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
                }`}
              >
                <span className="h-2 w-2 rounded-full bg-[#1E5E3A]" />
                <span>Activos ({activosCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setEstadoFilter('DESCONTINUADOS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  estadoFilter === 'DESCONTINUADOS'
                    ? 'bg-[#FFFFFF] text-[#75695D] shadow-xs'
                    : 'text-[#75695D] hover:text-[#241C15] hover:bg-[#FFFFFF]/40'
                }`}
              >
                Archivados ({descontinuadosCount})
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Filtros Activos & Reset si hay búsqueda o filtros aplicados */}
        {(search || estadoFilter !== 'TODOS' || categoriaFilter !== 'TODAS') && (
          <div className="flex items-center justify-between pt-2 border-t border-[#E2D9CC]/60 text-xs text-[#75695D]">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">Mostrando:</span>
              <span className="font-bold text-[#241C15] bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#E2D9CC]">
                {filteredProductos.length} {filteredProductos.length === 1 ? 'modelo' : 'modelos'}
              </span>
              {search && (
                <span className="text-[#75695D]">
                  para &ldquo;<strong className="text-[#241C15]">{search}</strong>&rdquo;
                </span>
              )}
              {categoriaFilter !== 'TODAS' && (
                <span className="text-[#75695D]">
                  en <strong>{categoriaFilter}</strong>
                </span>
              )}
              {estadoFilter !== 'TODOS' && (
                <span className="text-[#75695D]">
                  estado <strong>{estadoFilter}</strong>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('')
                setEstadoFilter('TODOS')
                setCategoriaFilter('TODAS')
              }}
              className="text-xs text-[#A36F4C] hover:text-[#8E5E3E] font-bold underline flex items-center gap-1 cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
              <span>Limpiar filtros</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. TABLA OPERATIVA PRINCIPAL (EXCLUSIVA Y 100% RESPONSIVE)               */}
      {/* ========================================================================= */}
      
      {/* VISTA ESCRITORIO (>= lg): Tabla ejecutiva table-fixed sin scroll horizontal */}
      <div className="hidden lg:block w-full bg-[#FFFFFF] border border-[#E2D9CC] rounded-2xl shadow-xs overflow-hidden">
        <table className="w-full text-left border-collapse table-fixed text-xs">
          <colgroup>
            <col className="w-[45%]" />
            <col className="w-[15%]" />
            <col className="w-[20%]" />
            <col className="w-[20%]" />
          </colgroup>
          <thead>
            <tr className="bg-[#FAF8F5] border-b border-[#E2D9CC] text-[#75695D] text-[11px] font-semibold">
              <th className="py-3.5 px-4 font-bold text-left">Modelo & Familia</th>
              <th className="py-3.5 px-4 font-bold text-right">Costo Base</th>
              <th className="py-3.5 px-4 font-bold text-center">Precio de Venta (Mercado)</th>
              <th className="py-3.5 px-4 font-bold text-center">Estado</th>
            </tr>
          </thead>
            <tbody className="divide-y divide-[#E2D9CC]">
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-[#75695D] italic bg-[#FFFFFF]">
                    No se encontraron productos con ese criterio de búsqueda
                  </td>
                </tr>
              ) : (
                filteredProductos.map((p) => {
                  const gramos = p.pesoGramos || 0
                  const costo = p.costoBase || 0
                  const isMenuOpen = activeMenuId === p.id

                  return (
                    <tr 
                      key={p.id} 
                      onClick={() => handleOpenEdit(p)}
                      className={`h-16 transition-colors cursor-pointer ${
                        !p.activo ? 'bg-[#FAF8F5]/60 opacity-80' : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {/* Columna 1: Modelo & Familia */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center flex-shrink-0 shadow-2xs">
                            <Package className="h-4.5 w-4.5 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-sm text-[#241C15] block truncate" title={p.nombreModelo}>
                              {p.nombreModelo}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-2 py-0 bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC] mt-0.5">
                              {p.lineaCategoria || 'General'}
                            </Badge>
                          </div>
                        </div>
                      </td>

                      {/* Columna 3: Costo Base */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-[#241C15] text-xs min-w-[90px] tabular-nums">
                        {formatCurrency(costo)}
                      </td>

                      {/* Columna 4: Niveles de Precios (1 Columna) */}
                      <td className="py-3 px-4 min-w-[120px]">
                        <div className="flex justify-center text-center font-mono text-xs tabular-nums">
                          {/* Mercado */}
                          <div className="p-1.5 rounded-xl bg-[#FFFFFF] border border-[#A36F4C]/40 shadow-2xs ring-1 ring-[#A36F4C]/10 w-full max-w-[100px]">
                            <span className="text-[9px] text-[#A36F4C] block font-sans font-bold">Mercado</span>
                            <span className="font-black text-[#A36F4C] block">
                              {formatCurrency(p.precioMercado)}
                            </span>
                            <span className="text-[9px] text-[#1E5E3A] font-bold block">
                              {calcMargen(p.precioMercado, costo)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Columna 5: Estado */}
                      <td className="py-3 px-4 text-center min-w-[100px]">
                        {p.activo ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#ECFDF5] border border-[#B4E3C0] text-[#1E5E3A] text-[11px] font-bold">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#1E5E3A]" />
                            <span>Activo</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] text-[11px] font-medium">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#75695D]" />
                            <span>Archivado</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
      </div>

      {/* VISTA MÓVIL Y TABLET (< lg): Tarjetas táctiles limpias */}
      <div className="block lg:hidden space-y-3">
        {filteredProductos.length === 0 ? (
          <div className="p-8 text-center bg-[#FFFFFF] rounded-3xl border border-dashed border-[#E2D9CC] text-[#75695D] italic text-xs">
            No se encontraron productos
          </div>
        ) : (
          filteredProductos.map((p) => {
            const gramos = p.pesoGramos || 0
            const costo = p.costoBase || 0

            return (
              <div
                key={p.id}
                className={`bg-[#FFFFFF] border rounded-3xl p-4 shadow-2xs space-y-3 ${
                  !p.activo ? 'border-[#E2D9CC] opacity-85 bg-[#FAF8F5]' : 'border-[#E2D9CC]'
                }`}
              >
                {/* Fila 1: Header móvil con Avatar, Título y Estado */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="h-9 w-9 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Package className="h-4.5 w-4.5 stroke-[2.2]" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-[#241C15] block truncate" title={p.nombreModelo}>
                        {p.nombreModelo}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-2 py-0 bg-[#FAF8F5] text-[#75695D] border-[#E2D9CC] mt-0.5">
                        {p.lineaCategoria || 'General'}
                      </Badge>
                    </div>
                  </div>

                  {p.activo ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ECFDF5] border border-[#B4E3C0] text-[#1E5E3A] text-[10px] font-bold shrink-0">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1E5E3A]" />
                      <span>Activo</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D] text-[10px] shrink-0 font-medium">
                      Archivado
                    </span>
                  )}
                </div>

                {/* Fila 2: Especificaciones Técnicas y Costo Base */}
                <div className="flex items-center justify-between text-xs font-mono bg-[#FAF8F5] p-2.5 rounded-2xl border border-[#E2D9CC]/70">
                  <div className="flex items-center gap-3">
                    <span className="text-[#75695D]">
                      Peso: <strong className="text-[#241C15]">{gramos > 0 ? `${gramos}g` : '—'}</strong>
                    </span>
                    <span className="text-[#75695D]">
                      Tiempo: <strong className="text-[#241C15]">{estimarTiempoImpresion(gramos)}</strong>
                    </span>
                  </div>
                  <span className="font-bold text-[#241C15]">
                    Costo: {formatCurrency(costo)}
                  </span>
                </div>

                {/* Fila 3: Precio de Venta (1 Col) */}
                <div className="flex justify-center text-center font-mono text-xs tabular-nums">
                  <div className="p-1.5 bg-[#FFFFFF] rounded-xl border border-[#A36F4C]/40 ring-1 ring-[#A36F4C]/10 w-full max-w-[120px]">
                    <span className="text-[9px] text-[#A36F4C] block font-sans font-bold">Mercado</span>
                    <span className="font-black text-[#A36F4C] block">{formatCurrency(p.precioMercado)}</span>
                    <span className="text-[9px] text-[#1E5E3A] font-bold block">{calcMargen(p.precioMercado, costo)}</span>
                  </div>
                </div>

                {/* Fila 4: Acciones Móvil */}
                <div className="pt-2 border-t border-[#E2D9CC]/70 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopiarCotizacion(p)}
                    className="flex-1 h-8 px-3 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#241C15] font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {copiedId === p.id ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-[#1E5E3A]" />
                        <span className="text-[#1E5E3A]">¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Share2 className="h-3.5 w-3.5 text-[#A36F4C]" />
                        <span>Copiar Cotización</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(p)}
                    className="h-8 px-3 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#75695D] hover:text-[#A36F4C] font-bold text-xs flex items-center gap-1 shadow-2xs"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDuplicar(p)}
                    className="h-8 w-8 rounded-xl border border-[#E2D9CC] bg-[#FFFFFF] hover:bg-[#F4EFEA] text-[#75695D] flex items-center justify-center shadow-2xs"
                    title="Duplicar"
                  >
                    <CopyPlus className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleToggleEstado(p)}
                    className={`h-8 w-8 rounded-xl border flex items-center justify-center shadow-2xs ${
                      p.activo ? 'border-[#E2D9CC] text-[#75695D]' : 'border-[#B4E3C0] bg-[#EBF7EE] text-[#1E5E3A]'
                    }`}
                    title={p.activo ? 'Descontinuar' : 'Reactivar'}
                  >
                    {p.activo ? <Archive className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL: CREAR / EDITAR PRODUCTO 3D (2 COLUMNAS)                         */}
      {/* ========================================================================= */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[560px] max-h-[92dvh] overflow-y-auto p-0 rounded-3xl shadow-2xl z-50">
          <form onSubmit={handleSubmitModal} className="p-5 sm:p-6 space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-3.5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#F5EBE1] border border-[#D4BEA7] text-[#A36F4C] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  {editingId ? <Pencil className="h-5 w-5" /> : <Boxes className="h-5 w-5" />}
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-[#241C15]">
                    {editingId ? (is3D ? 'Editar Modelo 3D' : 'Editar Juego de Mesa') : (is3D ? 'Registrar Nuevo Producto 3D' : 'Registrar Juego de Mesa')}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D] mt-0.5">
                    {is3D ? 'Define costos base, parámetros técnicos y precios escalonados' : 'Define costos de compra, precios de venta y detalles para la web'}
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-xl hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Formulario en 2 Columnas */}
            <div className="space-y-4">
              
              {/* Fila 1: Nombre & Categoría */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                    {is3D ? 'Nombre del Modelo *' : 'Nombre del Juego *'}
                  </Label>
                  <Input 
                    value={formData.nombreModelo}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombreModelo: e.target.value }))}
                    placeholder={is3D ? "Ej: Maceta Hexagonal XL" : "Ej: Catan, Fantasma Blitz..."}
                    required
                    autoFocus
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-bold text-[#241C15] h-10"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                    Categoría / Familia *
                  </Label>
                  <Input 
                    value={formData.lineaCategoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, lineaCategoria: e.target.value }))}
                    placeholder={is3D ? "Ej: Macetas & Jardín" : "Ej: Juegos Familiares"}
                    required
                    list="categorias-list"
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-bold text-[#241C15] h-10"
                  />
                  <datalist id="categorias-list">
                    {categoryNamesList.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>

                {/* BGG ID justo abajo del nombre (Modo Juegos de Mesa) */}
                {!is3D && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider flex items-center gap-1.5">
                          <Dices className="h-3.5 w-3.5 text-indigo-600" />
                          BGG ID (BoardGameGeek)
                        </Label>
                        <a
                          href={formData.bggId ? `https://boardgamegeek.com/boardgame/${formData.bggId}` : (formData.nombreModelo ? `https://boardgamegeek.com/geeksearch.php?action=search&objecttype=boardgame&q=${encodeURIComponent(formData.nombreModelo)}` : 'https://boardgamegeek.com')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-indigo-600 hover:text-indigo-800 hover:underline font-bold flex items-center gap-1"
                        >
                          Buscar en BGG ↗
                        </a>
                      </div>
                      <Input
                        type="number"
                        value={formData.bggId}
                        onChange={(e) => setFormData(prev => ({ ...prev, bggId: e.target.value }))}
                        placeholder="Ej: 83195"
                        className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-sm font-mono font-bold text-[#241C15] h-10"
                      />
                      <p className="text-[10px] text-[#75695D]">
                        Al guardar, la web mostrará el rating real de BGG automáticamente.
                      </p>
                    </div>

                    <div className="flex items-center">
                      <div className="w-full p-2.5 bg-[#FAF8F5] border border-[#E2D9CC] rounded-xl text-xs flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="font-bold text-[#241C15] block truncate">
                            {formData.bggId ? `ID Vinculado: #${formData.bggId}` : 'Vincular con BGG'}
                          </span>
                          <span className="text-[10px] text-[#75695D] block truncate">
                            {formData.bggId ? 'Calificación sincronizada con BoardGameGeek' : 'Busca el juego en BGG y copia su ID numérico'}
                          </span>
                        </div>
                        {formData.bggId && (
                          <a
                            href={`https://boardgamegeek.com/boardgame/${formData.bggId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 px-2 py-1 bg-white border border-[#E2D9CC] rounded-lg text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 shadow-2xs"
                          >
                            Ver en BGG <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Fila 2: Parámetros Técnicos (Gramos, Tiempo, Costo Base) */}
              <div className="p-3.5 bg-[#FAF8F5] border border-[#E2D9CC] rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#241C15] uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="h-3.5 w-3.5 text-[#A36F4C]" />
                    {is3D ? 'Parámetros de Taller & Costo' : 'Costo de Compra'}
                  </span>
                  {is3D && (
                    <span className="text-[10px] text-[#75695D]">
                      Auto-cálculo de costo sugerido
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {is3D && (
                    <>
                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-[#75695D]">Peso (g)</Label>
                        <Input 
                          type="number"
                          step="1"
                          value={formData.pesoGramos}
                          onChange={(e) => handleGramosChange(e.target.value)}
                          placeholder="150"
                          className="bg-white border-[#E2D9CC] rounded-xl text-xs font-mono font-bold h-9"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[11px] font-bold text-[#75695D]">Tiempo (h)</Label>
                        <Input 
                          type="number"
                          step="0.1"
                          value={formData.tiempoHoras}
                          onChange={(e) => setFormData(prev => ({ ...prev, tiempoHoras: e.target.value }))}
                          placeholder="4.5"
                          className="bg-white border-[#E2D9CC] rounded-xl text-xs font-mono font-bold h-9"
                        />
                      </div>
                    </>
                  )}

                  <div className={`space-y-1 ${!is3D ? 'col-span-3' : ''}`}>
                    <Label className="text-[11px] font-bold text-[#1E5E3A]">Costo Base (S/)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.costoBase}
                      onChange={(e) => setFormData(prev => ({ ...prev, costoBase: e.target.value }))}
                      placeholder={is3D ? "9.75" : "0.00"}
                      required
                      className="bg-white border-[#B4E3C0] text-[#1E5E3A] rounded-xl text-xs font-mono font-black h-9"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 3: Precios de Venta & Márgenes en Tiempo Real */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Precios de Venta (S/)
                </Label>

                <div className="grid grid-cols-1 gap-3">
                  {/* Mercado */}
                  <div className="space-y-1 p-2.5 bg-[#FAF8F5] rounded-xl border border-[#A36F4C]/40 ring-1 ring-[#A36F4C]/10">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-[#A36F4C]">Mercado</span>
                      <span className="font-mono font-bold text-[#1E5E3A]">
                        {calcMargen(parseFloat(formData.precioMercado) || 0, parseFloat(formData.costoBase) || 0)}
                      </span>
                    </div>
                    <Input 
                      type="number"
                      step="0.5"
                      value={formData.precioMercado}
                      onChange={(e) => setFormData(prev => ({ ...prev, precioMercado: e.target.value }))}
                      placeholder="30.00"
                      className="bg-white border-[#A36F4C]/50 rounded-lg text-xs font-mono font-black h-9 text-[#A36F4C]"
                    />
                  </div>
                </div>
              </div>

              {/* Fila 4: Estado Inicial */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                  Estado del Producto
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, activo: true }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      formData.activo
                        ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] shadow-2xs'
                        : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC]'
                    }`}
                  >
                    🟢 Activo en Venta
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, activo: false }))}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      !formData.activo
                        ? 'bg-[#FAF8F5] text-[#75695D] border-[#D4BEA7] shadow-2xs'
                        : 'bg-[#F8F6F2] text-[#75695D] border-[#E2D9CC]'
                    }`}
                  >
                    📁 Descontinuado
                  </button>
                </div>
              </div>

              {/* Nueva Fila 5: Configuración de Tienda Web */}
              <div className="p-3.5 bg-white border border-[#E2D9CC] rounded-2xl space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]/50">
                  <span className="text-xs font-bold text-[#241C15] uppercase tracking-wider flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-[#1E5E3A]" />
                    Configuración Tienda Web
                  </span>
                </div>

                {/* Stock y Oferta */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Bloque Stock */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-[11px] font-bold text-[#75695D]">Stock Actual</Label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.controlarStock}
                          onChange={(e) => setFormData(prev => ({ ...prev, controlarStock: e.target.checked }))}
                          className="rounded border-[#E2D9CC] text-[#A36F4C] focus:ring-[#A36F4C]"
                        />
                        <span className="text-[10px] text-[#75695D]">Controlar</span>
                      </label>
                    </div>
                    <Input
                      type="number"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                      placeholder="0"
                      disabled={!formData.controlarStock}
                      className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9 disabled:opacity-50"
                    />
                  </div>

                  {/* Bloque Oferta */}
                  <div className="col-span-2 p-3.5 bg-white border border-[#E2D9CC] rounded-2xl space-y-3 shadow-sm">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E2D9CC]/50">
                      <Label className="text-xs font-bold text-[#241C15] uppercase tracking-wider flex items-center gap-1.5">
                        🏷️ Configurar Oferta
                      </Label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.enOferta}
                          onChange={(e) => setFormData(prev => ({ ...prev, enOferta: e.target.checked }))}
                          className="rounded border-[#E2D9CC] text-[#A36F4C] focus:ring-[#A36F4C]"
                        />
                        <span className="text-[10px] text-[#75695D] font-bold">Activar Oferta</span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-[#75695D]">Descuento (%)</Label>
                        <div className="relative">
                          <Input
                            type="number"
                            value={formData.porcentajeDescuento}
                            onChange={(e) => handleDescuentoChange(e.target.value)}
                            placeholder="Ej: 15"
                            disabled={!formData.enOferta}
                            className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9 pr-6 disabled:opacity-50"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#A36F4C] font-bold">%</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-[#75695D]">Nuevo Precio (S/)</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-[#A36F4C] font-bold">S/</span>
                          <Input
                            type="number"
                            step="0.5"
                            value={formData.precioOferta}
                            onChange={(e) => handlePrecioOfertaChange(e.target.value)}
                            placeholder="0.00"
                            disabled={!formData.enOferta}
                            className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9 pl-7 disabled:opacity-50 font-bold text-[#DC2626]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Multimedia y Destacado */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold text-[#75695D]">URL de Imagen Principal</Label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.destacadoWeb}
                        onChange={(e) => setFormData(prev => ({ ...prev, destacadoWeb: e.target.checked }))}
                        className="rounded border-[#E2D9CC] text-[#A36F4C] focus:ring-[#A36F4C]"
                      />
                      <span className="text-[10px] font-bold text-[#A36F4C]">Destacar en Inicio</span>
                    </label>
                  </div>
                  <Input
                    type="url"
                    value={formData.imagenUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, imagenUrl: e.target.value }))}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9"
                  />
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label className="text-[11px] font-bold text-[#75695D]">Descripción para la Web</Label>
                  <textarea
                    value={formData.descripcionWeb}
                    onChange={(e) => setFormData(prev => ({ ...prev, descripcionWeb: e.target.value }))}
                    placeholder="Describe el producto para los clientes..."
                    className="w-full bg-[#F8F6F2] border border-[#E2D9CC] rounded-xl text-xs p-2.5 min-h-[60px] focus:outline-none focus:ring-1 focus:ring-[#A36F4C] resize-none"
                  />
                </div>
              </div>

              {/* Ficha Técnica BG (solo visible en modo Juegos de Mesa) */}
              {isBG && (
                <div className="p-3.5 bg-white border border-[#E2D9CC] rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-1.5 pb-2 border-b border-[#E2D9CC]/50">
                    <span className="text-xs font-bold text-[#241C15] uppercase tracking-wider">
                      🎲 Ficha Técnica del Juego
                    </span>
                    <span className="text-[10px] text-[#75695D] ml-auto">Tabla de características en la web</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#75695D]">Número de Jugadores</Label>
                      <Input
                        value={formData.numJugadores}
                        onChange={(e) => setFormData(prev => ({ ...prev, numJugadores: e.target.value }))}
                        placeholder="Ej: 2-4"
                        className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#75695D]">Edad Mínima (años)</Label>
                      <Input
                        type="number"
                        value={formData.edadMinima}
                        onChange={(e) => setFormData(prev => ({ ...prev, edadMinima: e.target.value }))}
                        placeholder="Ej: 8"
                        className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#75695D]">Duración (minutos)</Label>
                      <Input
                        type="number"
                        value={formData.duracionMinutos}
                        onChange={(e) => setFormData(prev => ({ ...prev, duracionMinutos: e.target.value }))}
                        placeholder="Ej: 45"
                        className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#75695D]">Editorial / Marca</Label>
                      <Input
                        value={formData.editorialMarca}
                        onChange={(e) => setFormData(prev => ({ ...prev, editorialMarca: e.target.value }))}
                        placeholder="Ej: Devir"
                        className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#75695D]">Idioma</Label>
                      <Input
                        value={formData.idioma}
                        onChange={(e) => setFormData(prev => ({ ...prev, idioma: e.target.value }))}
                        placeholder="Ej: Español"
                        className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-bold text-[#75695D]">Mecánicas</Label>
                      <Input
                        value={formData.mecanicas}
                        onChange={(e) => setFormData(prev => ({ ...prev, mecanicas: e.target.value }))}
                        placeholder="Ej: Deducción, Velocidad"
                        className="bg-[#F8F6F2] border-[#E2D9CC] rounded-xl text-xs h-9"
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="flex justify-end gap-2 pt-4 mt-2 border-t border-[#E2D9CC]/50">
              {editingId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const p = productos.find(x => x.id === editingId)
                    if (p) handleDelete(p)
                  }}
                  className="bg-white border-[#DC2626] text-[#DC2626] hover:bg-red-50 text-xs rounded-xl cursor-pointer mr-auto"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Eliminar
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenModal(false)}
                className="text-xs rounded-xl cursor-pointer text-[#75695D]"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="sm"
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-5 rounded-xl cursor-pointer shadow-xs"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Producto'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
