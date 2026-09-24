'use client'

import { useState, useMemo, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  Hammer, 
  Package, 
  Palette, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Play, 
  Layers, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Calendar, 
  User, 
  Sparkles, 
  RefreshCw, 
  ChevronDown, 
  Check, 
  Boxes,
  ExternalLink,
  Flame,
  Loader2,
  RotateCcw,
  Table as TableIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { 
  TallerDataResponse, 
  PiezaTaller, 
  GrupoModeloTaller, 
  GrupoColorTaller, 
  updateEstadoPieza 
} from '@/actions/taller'
import { formatDate } from '@/lib/utils'

type ModoVista = 'COLA' | 'MODELO' | 'COLOR'
type OrdenPrioridad = 'LIFO_RECIENTES' | 'FIFO_ANTIGUOS' | 'ENTREGA_URGENTE' | 'MAYOR_CANTIDAD' | 'NOMBRE_AZ'
type FiltroEstado = 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'TODOS'

// Helper para extraer la fecha calendario YYYY-MM-DD local y evitar desfases de zona horaria UTC
const extractCalendarDate = (raw: string | Date | null | undefined): { year: number; month: number; day: number } | null => {
  if (!raw) return null
  if (typeof raw === 'string') {
    const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (match) {
      return {
        year: parseInt(match[1], 10),
        month: parseInt(match[2], 10) - 1, // 0-indexed
        day: parseInt(match[3], 10)
      }
    }
  }
  const d = typeof raw === 'string' ? new Date(raw) : raw
  if (isNaN(d.getTime())) return null
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate()
  }
}

// Helper para calcular días transcurridos o días restantes
const getTiempoTranscurrido = (rawFecha: string) => {
  try {
    const dateParts = extractCalendarDate(rawFecha)
    if (!dateParts) return ''

    const hoy = new Date()
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()
    const fechaMidnight = new Date(dateParts.year, dateParts.month, dateParts.day).getTime()

    const diffDays = Math.round((hoyMidnight - fechaMidnight) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Hoy'
    if (diffDays === 1) return 'Ayer'
    if (diffDays === -1) return 'Mañana'
    if (diffDays > 1) return `Hace ${diffDays} días`
    if (diffDays < -1) return `En ${Math.abs(diffDays)} días`
    return ''
  } catch {
    return ''
  }
}

const getEntregaBadge = (diaPromesa: string | null) => {
  if (!diaPromesa) return <span className="text-[11px] text-[#A89F91]">Sin fecha</span>
  try {
    const dateParts = extractCalendarDate(diaPromesa)
    if (!dateParts) return <span className="text-[11px] text-[#75695D]">{diaPromesa}</span>

    const hoy = new Date()
    const hoyMidnight = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate()).getTime()
    const promesaMidnight = new Date(dateParts.year, dateParts.month, dateParts.day).getTime()

    const diffDias = Math.round((promesaMidnight - hoyMidnight) / (1000 * 60 * 60 * 24))

    if (diffDias < 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#DC2626]">
          <Flame className="w-3.5 h-3.5 text-[#DC2626]" /> Vencido ({Math.abs(diffDias)}d)
        </span>
      )
    }
    if (diffDias === 0) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#D97706]">
          <Clock className="w-3.5 h-3.5 text-[#D97706]" /> Entrega Hoy
        </span>
      )
    }
    if (diffDias === 1) {
      return (
        <span className="text-xs font-semibold text-[#D97706]">
          Mañana
        </span>
      )
    }
    if (diffDias <= 3) {
      return (
        <span className="text-xs font-medium text-[#854D0E]">
          En {diffDias} días
        </span>
      )
    }
    return (
      <span className="text-xs font-medium text-[#241C15]">
        {formatDate(diaPromesa)}
      </span>
    )
  } catch {
    return <span className="text-[11px] text-[#75695D]">{diaPromesa}</span>
  }
}

export function TallerClient({ data }: { data: TallerDataResponse }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modos de visualización y filtros
  const [modoVista, setModoVista] = useState<ModoVista>('COLA')
  const [orden, setOrden] = useState<OrdenPrioridad>('LIFO_RECIENTES')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('PENDIENTE')
  const [filtroColor, setFiltroColor] = useState<string>('TODOS')
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODOS')
  const [busqueda, setBusqueda] = useState('')

  // Estado expandido para tarjetas de modelos/colores
  const [modelosExpandidos, setModelosExpandidos] = useState<Record<string, boolean>>({})
  const [coloresExpandidos, setColoresExpandidos] = useState<Record<string, boolean>>({})

  const toggleModeloExpandido = (key: string) => {
    setModelosExpandidos(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleColorExpandido = (key: string) => {
    setColoresExpandidos(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Estado optimista local y loader individual para feedback instantáneo (<50ms)
  const [piezasOpt, setPiezasOpt] = useState<Record<string, 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'>>({})
  const [loadingPieceId, setLoadingPieceId] = useState<string | null>(null)

  // Reset de estado optimista al recibir nuevos datos del servidor
  useEffect(() => {
    setPiezasOpt({})
  }, [data])

  // Piezas con estado optimista integrado
  const todasPiezas = useMemo(() => {
    return data.piezas.map(p => {
      const opt = piezasOpt[p.id]
      return opt ? { ...p, estado: opt } : p
    })
  }, [data.piezas, piezasOpt])

  // Métricas dinámicas calculadas en tiempo real
  const metricasActivas = useMemo(() => {
    const pendientes = todasPiezas.filter(p => p.estado === 'PENDIENTE').reduce((sum, p) => sum + p.cantidad, 0)
    const enProduccion = todasPiezas.filter(p => p.estado === 'EN_PRODUCCION').reduce((sum, p) => sum + p.cantidad, 0)
    const listos = todasPiezas.filter(p => p.estado === 'LISTO_ENTREGA').reduce((sum, p) => sum + p.cantidad, 0)
    return {
      ...data.metricas,
      totalPiezasPendientes: pendientes,
      totalPiezasEnProduccion: enProduccion,
      totalPiezasListas: listos,
      totalPiezasActivas: pendientes + enProduccion + listos
    }
  }, [todasPiezas, data.metricas])

  // Lista única de categorías y colores para los filtros
  const listaCategorias = useMemo(() => {
    const cats = new Set<string>()
    todasPiezas.forEach(p => {
      if (p.lineaCategoria) cats.add(p.lineaCategoria)
    })
    return Array.from(cats).sort()
  }, [todasPiezas])

  const listaColores = useMemo(() => {
    const cols = new Map<string, { nombreColor: string; codigoHex: string }>()
    todasPiezas.forEach(p => {
      const key = p.nombreColor || 'Sin especificar'
      if (!cols.has(key)) {
        cols.set(key, { nombreColor: key, codigoHex: p.codigoHex || '#94A3B8' })
      }
    })
    return Array.from(cols.values()).sort((a, b) => a.nombreColor.localeCompare(b.nombreColor))
  }, [todasPiezas])

  // Filtrado y Ordenamiento Dinámico de Piezas
  const piezasProcesadas = useMemo(() => {
    let result = [...todasPiezas]

    // 1. Filtro de Búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim()
      result = result.filter(p => 
        p.nombreModelo.toLowerCase().includes(q) ||
        p.cliente.toLowerCase().includes(q) ||
        p.codigoRef.toLowerCase().includes(q) ||
        p.nombreColor.toLowerCase().includes(q) ||
        (p.personalizacion && p.personalizacion.toLowerCase().includes(q))
      )
    }

    // 2. Filtro por Estado
    if (filtroEstado !== 'TODOS') {
      result = result.filter(p => p.estado === filtroEstado)
    }

    // 3. Filtro por Color
    if (filtroColor !== 'TODOS') {
      result = result.filter(p => p.nombreColor === filtroColor)
    }

    // 4. Filtro por Categoría
    if (filtroCategoria !== 'TODOS') {
      result = result.filter(p => p.lineaCategoria === filtroCategoria)
    }

    // 5. Ordenamiento de Prioridad
    result.sort((a, b) => {
      if (orden === 'LIFO_RECIENTES') {
        // Más recientes primero
        return new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
      }
      if (orden === 'FIFO_ANTIGUOS') {
        // Más antiguos primero (Mayor prioridad / Cola FIFO)
        return new Date(a.fechaSolicitud).getTime() - new Date(b.fechaSolicitud).getTime()
      }
      if (orden === 'ENTREGA_URGENTE') {
        // Con fecha de entrega primero, más próxima
        if (!a.diaEntregaPrometida && !b.diaEntregaPrometida) {
          return new Date(b.fechaSolicitud).getTime() - new Date(a.fechaSolicitud).getTime()
        }
        if (!a.diaEntregaPrometida) return 1
        if (!b.diaEntregaPrometida) return -1
        return new Date(a.diaEntregaPrometida).getTime() - new Date(b.diaEntregaPrometida).getTime()
      }
      if (orden === 'MAYOR_CANTIDAD') {
        return b.cantidad - a.cantidad
      }
      if (orden === 'NOMBRE_AZ') {
        return a.nombreModelo.localeCompare(b.nombreModelo)
      }
      return 0
    })

    return result
  }, [data.piezas, busqueda, filtroEstado, filtroColor, filtroCategoria, orden])

  // Subgrupos de piezas por estado cuando se ve "TODOS"
  const piezasPendientes = useMemo(() => piezasProcesadas.filter(p => p.estado === 'PENDIENTE'), [piezasProcesadas])
  const piezasEnProduccion = useMemo(() => piezasProcesadas.filter(p => p.estado === 'EN_PRODUCCION'), [piezasProcesadas])
  const piezasListas = useMemo(() => piezasProcesadas.filter(p => p.estado === 'LISTO_ENTREGA'), [piezasProcesadas])

  // Recalcular Grupos por Modelo filtrados
  const gruposPorModeloFiltrados = useMemo(() => {
    const map = new Map<string, GrupoModeloTaller>()

    piezasProcesadas.forEach(p => {
      const key = p.productoId || p.nombreModelo
      if (!map.has(key)) {
        map.set(key, {
          productoId: p.productoId,
          nombreModelo: p.nombreModelo,
          lineaCategoria: p.lineaCategoria,
          pesoGramosUnitario: p.pesoGramosUnitario,
          totalUnidades: 0,
          totalGramos: 0,
          pendientes: 0,
          enProduccion: 0,
          listos: 0,
          colores: [],
          pedidos: []
        })
      }

      const grp = map.get(key)!
      grp.totalUnidades += p.cantidad
      grp.totalGramos = Number((grp.totalGramos + p.pesoGramosTotal).toFixed(1))

      if (p.estado === 'PENDIENTE') grp.pendientes += p.cantidad
      else if (p.estado === 'EN_PRODUCCION') grp.enProduccion += p.cantidad
      else if (p.estado === 'LISTO_ENTREGA') grp.listos += p.cantidad

      const colorKey = p.colorFilamentoId || p.nombreColor
      let colEntry = grp.colores.find(c => (c.colorId || c.nombreColor) === colorKey)
      if (!colEntry) {
        colEntry = {
          colorId: p.colorFilamentoId,
          nombreColor: p.nombreColor,
          codigoHex: p.codigoHex,
          tipoMaterial: p.tipoMaterial,
          cantidad: 0,
          gramos: 0,
          piezasIds: []
        }
        grp.colores.push(colEntry)
      }
      colEntry.cantidad += p.cantidad
      colEntry.gramos = Number((colEntry.gramos + p.pesoGramosTotal).toFixed(1))
      colEntry.piezasIds.push(p.id)

      grp.pedidos.push({
        piezaId: p.id,
        codigoRef: p.codigoRef,
        cliente: p.cliente,
        fechaSolicitud: p.fechaSolicitud,
        diaEntregaPrometida: p.diaEntregaPrometida,
        cantidad: p.cantidad,
        nombreColor: p.nombreColor,
        codigoHex: p.codigoHex,
        personalizacion: p.personalizacion,
        estado: p.estado
      })
    })

    return Array.from(map.values()).sort((a, b) => b.totalUnidades - a.totalUnidades)
  }, [piezasProcesadas])

  // Recalcular Grupos por Color filtrados
  const gruposPorColorFiltrados = useMemo(() => {
    const map = new Map<string, GrupoColorTaller>()

    piezasProcesadas.forEach(p => {
      const colorKey = p.colorFilamentoId || p.nombreColor
      if (!map.has(colorKey)) {
        const orig = data.gruposPorColor.find(g => (g.colorId || g.nombreColor) === colorKey)
        map.set(colorKey, {
          colorId: p.colorFilamentoId,
          nombreColor: p.nombreColor,
          codigoHex: p.codigoHex,
          tipoMaterial: p.tipoMaterial,
          stockGramosActual: orig?.stockGramosActual || 0,
          stockBobinasActual: orig?.stockBobinasActual || 0,
          alertaCritica: orig?.alertaCritica || false,
          totalUnidades: 0,
          totalGramosRequeridos: 0,
          deficitGramos: 0,
          modelos: []
        })
      }

      const cGrp = map.get(colorKey)!
      cGrp.totalUnidades += p.cantidad
      cGrp.totalGramosRequeridos = Number((cGrp.totalGramosRequeridos + p.pesoGramosTotal).toFixed(1))
      cGrp.deficitGramos = Number(Math.max(0, cGrp.totalGramosRequeridos - cGrp.stockGramosActual).toFixed(1))

      cGrp.modelos.push({
        productoId: p.productoId,
        nombreModelo: p.nombreModelo,
        cantidad: p.cantidad,
        gramos: p.pesoGramosTotal,
        cliente: p.cliente,
        codigoRef: p.codigoRef,
        estado: p.estado,
        personalizacion: p.personalizacion
      })
    })

    return Array.from(map.values()).sort((a, b) => b.totalUnidades - a.totalUnidades)
  }, [piezasProcesadas, data.gruposPorColor])

  // Acción instantánea con optimistic update para cambiar estado de la pieza individual
  const handleCambiarEstado = async (
    tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
    piezaId: string,
    nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'
  ) => {
    // 1. Respuesta instantánea optimista en el cliente
    setPiezasOpt(prev => ({ ...prev, [piezaId]: nuevoEstado }))
    setLoadingPieceId(piezaId)

    try {
      const res = await updateEstadoPieza(tipoRegistro, piezaId, nuevoEstado)
      if (res.success) {
        if (nuevoEstado === 'EN_PRODUCCION') {
          toast.success('Pieza pasada a En Impresión')
        } else if (nuevoEstado === 'LISTO_ENTREGA') {
          toast.success('Pieza marcada como Lista para Entrega')
        } else if (nuevoEstado === 'ENTREGADO') {
          toast.success('Pedido marcado como Entregado')
        } else {
          toast.success('Pieza reabierta a Pendiente')
        }
        startTransition(() => {
          router.refresh()
        })
      } else {
        // Rollback
        setPiezasOpt(prev => {
          const next = { ...prev }
          delete next[piezaId]
          return next
        })
        toast.error(res.error || 'Error al actualizar estado')
      }
    } catch (err: any) {
      setPiezasOpt(prev => {
        const next = { ...prev }
        delete next[piezaId]
        return next
      })
      toast.error(err.message || 'Error de conexión')
    } finally {
      setLoadingPieceId(null)
    }
  }

  const handleManualRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }

  // Renderizador de Tabla Estructurada de Piezas
  const renderTablaDePiezas = (
    piezasLista: PiezaTaller[], 
    titulo?: string, 
    subtitulo?: string,
    badgeInfo?: React.ReactNode,
    colorBorde: string = 'border-[#E2D9CC]'
  ) => {
    if (piezasLista.length === 0) return null

    const totalUds = piezasLista.reduce((acc, p) => acc + p.cantidad, 0)
    const totalGramos = piezasLista.reduce((acc, p) => acc + p.pesoGramosTotal, 0).toFixed(1)

    return (
      <Card className={`bg-[#FFFFFF] ${colorBorde} rounded-3xl shadow-xs overflow-hidden`}>
        {titulo && (
          <CardHeader className="p-4 sm:p-5 pb-3 border-b border-[#E2D9CC]/60 bg-[#FAF8F5]/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <CardTitle className="text-base font-black text-[#241C15]">
                  {titulo}
                </CardTitle>
                {badgeInfo}
              </div>
              <div className="flex items-center gap-2 text-xs text-[#75695D] font-mono">
                <span className="font-bold text-[#241C15]">{totalUds} unidades</span>
                <span>•</span>
                <span>{totalGramos}g estimados</span>
              </div>
            </div>
            {subtitulo && (
              <CardDescription className="text-xs text-[#75695D] mt-0.5">
                {subtitulo}
              </CardDescription>
            )}
          </CardHeader>
        )}

        <CardContent className="p-0">
          {/* Mobile View (< md): Touch-optimized Cards */}
          <div className="block md:hidden divide-y divide-[#E2D9CC]/60">
            {piezasLista.map((pieza, idx) => {
              const tiempoTxt = getTiempoTranscurrido(pieza.fechaSolicitud)
              const esHoy = tiempoTxt === 'Hoy'
              const esUrgente = pieza.diaEntregaPrometida && (() => {
                try {
                  const d = new Date(pieza.diaEntregaPrometida)
                  const hoy = new Date()
                  return !isNaN(d.getTime()) && (d.getTime() - hoy.getTime()) < 2 * 24 * 60 * 60 * 1000
                } catch { return false }
              })()

              return (
                <div 
                  key={pieza.id}
                  className={`p-3.5 sm:p-4 space-y-3 transition-colors ${
                    pieza.estado === 'EN_PRODUCCION'
                      ? 'bg-[#DBEAFE]/15'
                      : pieza.estado === 'LISTO_ENTREGA'
                      ? 'bg-[#EBF7EE]/15'
                      : esUrgente
                      ? 'bg-[#FEF2F2]/30'
                      : 'hover:bg-[#FAF8F5]/60'
                  }`}
                >
                  {/* Top: Posición, Modelo, Cantidad y Estado */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-mono font-bold shrink-0 ${
                        idx < 3 && orden === 'FIFO_ANTIGUOS'
                          ? 'bg-[#A36F4C] text-white'
                          : 'bg-[#FAF8F5] border border-[#E2D9CC] text-[#75695D]'
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <span className="font-black text-sm text-[#241C15] block truncate">
                          {pieza.nombreModelo}
                        </span>
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          <Badge variant="outline" className="text-[10px] font-bold border-[#E2D9CC] text-[#75695D] bg-[#FAF8F5] py-0">
                            {pieza.lineaCategoria}
                          </Badge>
                          {pieza.personalizacion && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-[#854D0E] bg-[#FEF9C3]/70 px-1.5 py-0.2 rounded border border-[#FDE047] font-semibold truncate">
                              <Sparkles className="w-2.5 h-2.5 text-[#D97706] shrink-0" />
                              {pieza.personalizacion}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#FAF8F5] border border-[#E2D9CC] font-mono font-black text-sm text-[#241C15]">
                        x{pieza.cantidad}
                      </span>
                    </div>
                  </div>

                  {/* Middle: Color, Material, Peso, Cliente, Pedido */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]/70 space-y-1">
                      <span className="text-[10px] text-[#75695D] block uppercase font-bold">Material & Color</span>
                      <div className="flex items-center gap-1.5">
                        <span 
                          className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs" 
                          style={{ backgroundColor: pieza.codigoHex }} 
                        />
                        <span className="font-bold text-[#241C15] truncate">{pieza.nombreColor}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#75695D] block">
                        {pieza.pesoGramosTotal}g total ({pieza.tipoMaterial || 'PLA'})
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]/70 space-y-1">
                      <span className="text-[10px] text-[#75695D] block uppercase font-bold">Cliente & Entrega</span>
                      <span className="font-bold text-[#241C15] block truncate">{pieza.cliente}</span>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[10px] font-bold text-[#A36F4C]">{pieza.codigoRef}</span>
                        {getEntregaBadge(pieza.diaEntregaPrometida)}
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Estado Badge + Botón de Acción Táctil */}
                  <div className="flex items-center justify-between pt-1 border-t border-[#E2D9CC]/50">
                    <div>
                      {pieza.estado === 'PENDIENTE' && (
                        <Badge className="bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] font-semibold text-xs px-2 py-0.5">
                          Pendiente
                        </Badge>
                      )}
                      {pieza.estado === 'EN_PRODUCCION' && (
                        <Badge className="bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD] font-semibold text-xs px-2 py-0.5 animate-pulse">
                          En Impresión
                        </Badge>
                      )}
                      {pieza.estado === 'LISTO_ENTREGA' && (
                        <Badge className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] font-semibold text-xs px-2 py-0.5">
                          Listo
                        </Badge>
                      )}
                    </div>

                    <div>
                      {pieza.estado === 'PENDIENTE' && (
                        <Button
                          size="sm"
                          disabled={loadingPieceId === pieza.id}
                          onClick={() => handleCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_PRODUCCION')}
                          className="h-8 px-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          {loadingPieceId === pieza.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                          <span>{loadingPieceId === pieza.id ? 'Guardando...' : 'Iniciar Impresión'}</span>
                        </Button>
                      )}

                      {pieza.estado === 'EN_PRODUCCION' && (
                        <Button
                          size="sm"
                          disabled={loadingPieceId === pieza.id}
                          onClick={() => handleCambiarEstado(pieza.tipoRegistro, pieza.id, 'LISTO_ENTREGA')}
                          className="h-8 px-3.5 rounded-xl bg-[#1E5E3A] hover:bg-[#16472C] text-white text-xs font-bold gap-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                        >
                          {loadingPieceId === pieza.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )}
                          <span>{loadingPieceId === pieza.id ? 'Guardando...' : 'Marcar Listo'}</span>
                        </Button>
                      )}

                      {pieza.estado === 'LISTO_ENTREGA' && (
                        <Button
                          size="sm"
                          disabled={loadingPieceId === pieza.id}
                          onClick={() => handleCambiarEstado(pieza.tipoRegistro, pieza.id, 'PENDIENTE')}
                          variant="outline"
                          className="h-8 px-3 rounded-xl border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] text-xs font-semibold cursor-pointer active:scale-[0.98] gap-1.5"
                        >
                          {loadingPieceId === pieza.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A36F4C]" />
                          ) : (
                            <RotateCcw className="w-3.5 h-3.5 text-[#75695D]" />
                          )}
                          <span>{loadingPieceId === pieza.id ? 'Guardando...' : 'Reabrir'}</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block w-full">
            <Table className="w-full table-fixed">
              <TableHeader className="bg-[#FAF8F5]/80 border-b border-[#E2D9CC]">
                <TableRow className="hover:bg-transparent border-b border-[#E2D9CC]">
                  <TableHead className="px-4 py-3 text-xs font-bold text-[#75695D] text-left">Pieza & Especificación</TableHead>
                  <TableHead className="w-40 px-3 py-3 text-xs font-bold text-[#75695D] text-left">Cliente & Ref</TableHead>
                  <TableHead className="w-36 px-3 py-3 text-xs font-bold text-[#75695D] text-left">Entrega</TableHead>
                  <TableHead className="w-28 px-2 py-3 text-center text-xs font-bold text-[#75695D]">Estado</TableHead>
                  <TableHead className="w-32 px-3 py-3 text-right text-xs font-bold text-[#75695D] pr-4">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {piezasLista.map((pieza) => {
                  const tiempoTxt = getTiempoTranscurrido(pieza.fechaSolicitud)
                  const esUrgente = pieza.diaEntregaPrometida && (() => {
                    try {
                      const d = new Date(pieza.diaEntregaPrometida)
                      const hoy = new Date()
                      return !isNaN(d.getTime()) && (d.getTime() - hoy.getTime()) < 2 * 24 * 60 * 60 * 1000
                    } catch { return false }
                  })()

                  return (
                    <TableRow 
                      key={pieza.id}
                      className={`hover:bg-[#FAF8F5]/80 transition-colors border-b border-[#E2D9CC]/50 ${
                        pieza.estado === 'EN_PRODUCCION' 
                          ? 'bg-[#DBEAFE]/10' 
                          : pieza.estado === 'LISTO_ENTREGA'
                          ? 'bg-[#EBF7EE]/10'
                          : esUrgente
                          ? 'bg-[#FEF2F2]/30'
                          : ''
                      }`}
                    >
                      {/* 1. Pieza & Especificación (Consolidado Ultra-Limpio) */}
                      <TableCell className="px-4 py-3">
                        <div className="space-y-1">
                          {/* Línea 1: Nombre del Modelo + Cantidad */}
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#241C15] truncate" title={pieza.nombreModelo}>
                              {pieza.nombreModelo}
                            </span>
                            <span className="font-mono font-bold text-xs text-[#A36F4C]">
                              ×{pieza.cantidad}
                            </span>
                          </div>

                          {/* Línea 2: Dot Color + Color (Material) · Gramos · Personalización */}
                          <div className="flex items-center gap-1.5 text-xs text-[#75695D] flex-wrap">
                            <span 
                              className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0 inline-block" 
                              style={{ backgroundColor: pieza.codigoHex }} 
                            />
                            <span className="font-medium text-[#241C15]">{pieza.nombreColor}</span>
                            <span className="text-[#A89F91]">({pieza.tipoMaterial || 'PLA'})</span>
                            <span className="text-[#D4BEA7]">•</span>
                            <span className="font-mono text-[#241C15]">{pieza.pesoGramosTotal}g</span>
                            {pieza.personalizacion && (
                              <>
                                <span className="text-[#D4BEA7]">•</span>
                                <span className="text-[#854D0E] font-medium italic truncate max-w-[200px]" title={pieza.personalizacion}>
                                  "{pieza.personalizacion}"
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* 2. Cliente & Ref */}
                      <TableCell className="w-44 px-3 py-3">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-xs text-[#241C15] truncate" title={pieza.cliente}>
                            {pieza.cliente}
                          </div>
                          <div className="font-mono text-[11px] text-[#75695D]">
                            {pieza.codigoRef}
                          </div>
                        </div>
                      </TableCell>

                      {/* 3. Entrega */}
                      <TableCell className="w-40 px-3 py-3">
                        <div className="space-y-0.5 text-xs">
                          <div>
                            {getEntregaBadge(pieza.diaEntregaPrometida)}
                          </div>
                          {tiempoTxt && (
                            <div className="text-[11px] text-[#A89F91]">
                              {tiempoTxt}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* 4. Estado */}
                      <TableCell className="w-28 px-2 py-3 text-center">
                        {pieza.estado === 'PENDIENTE' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#854D0E]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                            Pendiente
                          </span>
                        )}
                        {pieza.estado === 'EN_PRODUCCION' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1D4ED8]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB] animate-pulse" />
                            En Impresión
                          </span>
                        )}
                        {pieza.estado === 'LISTO_ENTREGA' && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E5E3A]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]" />
                            Listo
                          </span>
                        )}
                      </TableCell>

                      {/* 5. Acción Rápida */}
                      <TableCell className="w-28 px-3 py-3 text-right pr-4">
                        {pieza.estado === 'PENDIENTE' && (
                          <Button
                            size="sm"
                            disabled={loadingPieceId === pieza.id}
                            onClick={() => handleCambiarEstado(pieza.tipoRegistro, pieza.id, 'EN_PRODUCCION')}
                            className="h-7 px-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-bold gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                          >
                            {loadingPieceId === pieza.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Play className="w-3 h-3 fill-current" />
                            )}
                            <span>{loadingPieceId === pieza.id ? 'Guardando...' : 'Imprimir'}</span>
                          </Button>
                        )}

                        {pieza.estado === 'EN_PRODUCCION' && (
                          <Button
                            size="sm"
                            disabled={loadingPieceId === pieza.id}
                            onClick={() => handleCambiarEstado(pieza.tipoRegistro, pieza.id, 'LISTO_ENTREGA')}
                            className="h-7 px-2.5 rounded-xl bg-[#1E5E3A] hover:bg-[#16472C] text-white text-xs font-bold gap-1 cursor-pointer shadow-2xs whitespace-nowrap"
                          >
                            {loadingPieceId === pieza.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span>{loadingPieceId === pieza.id ? 'Guardando...' : 'Listo'}</span>
                          </Button>
                        )}

                        {pieza.estado === 'LISTO_ENTREGA' && (
                          <Button
                            size="sm"
                            disabled={loadingPieceId === pieza.id}
                            onClick={() => handleCambiarEstado(pieza.tipoRegistro, pieza.id, 'PENDIENTE')}
                            variant="outline"
                            className="h-7 px-2 rounded-xl border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] text-[11px] font-semibold cursor-pointer whitespace-nowrap gap-1"
                            title="Volver a poner pendiente"
                          >
                            {loadingPieceId === pieza.id ? (
                              <Loader2 className="w-3 h-3 animate-spin text-[#A36F4C]" />
                            ) : (
                              <RotateCcw className="w-3 h-3 text-[#75695D]" />
                            )}
                            <span>{loadingPieceId === pieza.id ? 'Guardando...' : 'Reabrir'}</span>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO PRINCIPAL                                                   */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#241C15] tracking-tight">
            Taller de Producción 3D
          </h1>
          <p className="text-xs text-[#75695D] mt-0.5">
            Cola de fabricación por tablas, piezas por modelo y priorización por entrega.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing || isPending}
            className="rounded-xl border-[#E2D9CC] bg-white text-[#75695D] hover:text-[#241C15] hover:bg-[#FAF8F5] cursor-pointer h-9 px-3 text-xs font-bold gap-1.5 shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing || isPending ? 'animate-spin text-[#A36F4C]' : ''}`} />
            <span>Actualizar</span>
          </Button>

          <Link href="/pedidos">
            <Button
              size="sm"
              className="rounded-xl bg-white hover:bg-[#FAF8F5] text-[#241C15] border border-[#E2D9CC] font-bold h-9 px-3.5 text-xs shadow-xs gap-1.5 cursor-pointer"
            >
              <span>Ver Pedidos</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#A36F4C]" />
            </Button>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TARJETAS DE MÉTRICAS COMPACTAS (KPIS MINIMALISTAS)                     */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Piezas por Fabricar */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 text-[#6B7280]">
            <span className="text-xs font-semibold">Total por Fabricar</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
              <Boxes className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
              {data.metricas.totalPiezasActivas} <span className="text-xs text-[#75695D] font-normal font-sans">uds</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 text-xs text-[#75695D]">
              <span className="text-[#854D0E] font-medium">{data.metricas.totalPiezasPendientes} pend.</span>
              <span>•</span>
              <span className="text-[#1D4ED8] font-medium">{data.metricas.totalPiezasEnProduccion} en cama</span>
            </div>
          </div>
        </div>

        {/* Modelos Únicos en Cola */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 text-[#6B7280]">
            <span className="text-xs font-semibold">Modelos Distintos</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#1E5E3A] font-mono tabular-nums">
              {data.metricas.totalModelosUnicos} <span className="text-xs text-[#75695D] font-normal font-sans">diseños</span>
            </div>
            <p className="text-xs text-[#75695D] mt-0.5 truncate">
              Agrupados por tandas
            </p>
          </div>
        </div>

        {/* Filamento Requerido Total */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 text-[#6B7280]">
            <span className="text-xs font-semibold">Material Requerido</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#854D0E]">
              <Palette className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
              {data.metricas.totalGramosRequeridos} <span className="text-xs text-[#75695D] font-normal font-sans">g</span>
            </div>
            <p className="text-xs text-[#75695D] mt-0.5 truncate">
              En {data.metricas.totalColoresRequeridos} colores de bobina
            </p>
          </div>
        </div>

        {/* Entregas Críticas */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1 text-[#6B7280]">
            <span className="text-xs font-semibold">Entregas Críticas</span>
            <div className={`p-1 rounded-md bg-[#FAF7F4] ${data.metricas.entregasUrgentes > 0 ? 'text-[#DC2626]' : 'text-[#75695D]'}`}>
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-black font-mono tabular-nums ${data.metricas.entregasUrgentes > 0 ? 'text-[#DC2626]' : 'text-[#241C15]'}`}>
              {data.metricas.entregasUrgentes} <span className="text-xs text-[#75695D] font-normal font-sans">urgentes</span>
            </div>
            <p className="text-xs text-[#75695D] mt-0.5 truncate">
              {data.metricas.entregasUrgentes > 0 ? 'Priorizar hoy' : 'Sin pedidos vencidos'}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. BARRA DE HERRAMIENTAS UNIFICADA EN 1 FILA                              */}
      {/* ========================================================================= */}
      <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-[#E2D9CC] shadow-xs flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-2.5">
        
        {/* Lado Izquierdo: Segmented Control de Estados (Limpio y sin emojis) */}
        <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#E2D9CC] overflow-x-auto max-w-full">
          {[
            { id: 'PENDIENTE', label: 'Pendientes', count: metricasActivas.totalPiezasPendientes },
            { id: 'EN_PRODUCCION', label: 'En Impresión', count: metricasActivas.totalPiezasEnProduccion },
            { id: 'LISTO_ENTREGA', label: 'Listos', count: metricasActivas.totalPiezasListas },
            { id: 'TODOS', label: 'Todos', count: metricasActivas.totalPiezasActivas }
          ].map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setFiltroEstado(st.id as FiltroEstado)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                filtroEstado === st.id
                  ? 'bg-white text-[#241C15] shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              <span>{st.label}</span>
              <span className="font-mono text-[10px] opacity-70">({st.count})</span>
            </button>
          ))}
        </div>

        {/* Lado Derecho: Buscador + Dropdown Orden + Dropdown Color + Dropdown Categoría + Toggle Vista */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 justify-between xl:justify-end flex-1">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[160px] max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#75695D]" />
            <Input
              type="text"
              placeholder="Buscar pieza..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-8.5 pr-2 h-8 text-xs rounded-xl border-[#E2D9CC] bg-[#FAF8F5] text-[#241C15] placeholder:text-[#A89F91] focus:bg-white"
            />
          </div>

          {/* Selector de Orden */}
          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value as OrdenPrioridad)}
            aria-label="Ordenar piezas"
            className="bg-[#FAF8F5] border border-[#E2D9CC] text-[#241C15] text-xs rounded-xl px-2.5 h-8 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="LIFO_RECIENTES">Más recientes</option>
            <option value="FIFO_ANTIGUOS">Más antiguos (FIFO)</option>
            <option value="ENTREGA_URGENTE">Entrega urgente</option>
          </select>

          {/* Filtro por Color */}
          <select
            value={filtroColor}
            onChange={(e) => setFiltroColor(e.target.value)}
            aria-label="Filtrar por color"
            className="bg-[#FAF8F5] border border-[#E2D9CC] text-[#241C15] text-xs rounded-xl px-2.5 h-8 font-semibold focus:outline-none cursor-pointer max-w-[130px] truncate"
          >
            <option value="TODOS">Todos los colores</option>
            {listaColores.map((c) => (
              <option key={c.nombreColor} value={c.nombreColor}>
                {c.nombreColor}
              </option>
            ))}
          </select>

          {/* Filtro por Categoría */}
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            aria-label="Filtrar por categoría"
            className="bg-[#FAF8F5] border border-[#E2D9CC] text-[#241C15] text-xs rounded-xl px-2.5 h-8 font-semibold focus:outline-none cursor-pointer max-w-[130px] truncate"
          >
            <option value="TODOS">Categorías</option>
            {listaCategorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Toggle de Modo de Vista (Íconos compactos) */}
          <div className="flex items-center bg-[#FAF8F5] p-0.5 rounded-xl border border-[#E2D9CC]">
            <button
              type="button"
              onClick={() => setModoVista('COLA')}
              title="Vista Cola de Producción"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                modoVista === 'COLA'
                  ? 'bg-white text-[#241C15] shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setModoVista('MODELO')}
              title="Agrupado por Modelo"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                modoVista === 'MODELO'
                  ? 'bg-white text-[#241C15] shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setModoVista('COLOR')}
              title="Agrupado por Color"
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                modoVista === 'COLOR'
                  ? 'bg-white text-[#241C15] shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              <Palette className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. VISTAS DE CONTENIDO EN TABLAS SEPARADAS                                 */}
      {/* ========================================================================= */}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA 1: TABLAS DE PRODUCCIÓN (COLA Y SEPARACIÓN POR ESTADO)              */}
      {/* ------------------------------------------------------------------------- */}
      {modoVista === 'COLA' && (
        <div className="space-y-6">
          {piezasProcesadas.length === 0 ? (
            <Card className="bg-white border-[#E2D9CC] rounded-2xl p-10 text-center shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-[#FAF7F4] text-[#1E5E3A] flex items-center justify-center mx-auto mb-3 border border-[#E2D9CC]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-black text-[#241C15] text-base">
                {filtroEstado === 'PENDIENTE' ? 'No hay piezas pendientes de fabricar' : 'Taller al día'}
              </h3>
              <p className="text-xs text-[#75695D] mt-1 max-w-md mx-auto">
                {filtroEstado === 'PENDIENTE'
                  ? 'Todas las piezas solicitadas ya están en impresión o listas para entrega.'
                  : 'No hay piezas con los filtros seleccionados actualmente.'}
              </p>
              {filtroEstado === 'PENDIENTE' && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  {data.metricas.totalPiezasEnProduccion > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFiltroEstado('EN_PRODUCCION')}
                      className="rounded-xl border-[#E2D9CC] bg-white text-[#1D4ED8] hover:bg-[#FAF8F5] text-xs font-bold gap-1.5 cursor-pointer"
                    >
                      <span>Ver piezas en impresión ({data.metricas.totalPiezasEnProduccion})</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFiltroEstado('TODOS')}
                    className="rounded-xl border-[#E2D9CC] bg-white text-[#241C15] hover:bg-[#FAF8F5] text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <span>Ver todas las piezas</span>
                  </Button>
                </div>
              )}
            </Card>
          ) : filtroEstado === 'TODOS' ? (
            // Si está en TODOS, separamos claramente en 3 tablas por estado
            <div className="space-y-6">
              {/* Tabla 1: Pendientes */}
              {renderTablaDePiezas(
                piezasPendientes,
                'Piezas Pendientes',
                'Piezas en cola esperando asignación de cama de impresión.',
                <Badge className="bg-[#FEF9C3] text-[#854D0E] border-[#FDE047] font-semibold text-xs">
                  {piezasPendientes.length} piezas
                </Badge>,
                'border-[#E8D49B]'
              )}

              {/* Tabla 2: En Impresión */}
              {renderTablaDePiezas(
                piezasEnProduccion,
                'Piezas en Impresión',
                'Piezas actualmente en proceso de impresión 3D en taller.',
                <Badge className="bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD] font-semibold text-xs">
                  {piezasEnProduccion.length} piezas
                </Badge>,
                'border-[#93C5FD]'
              )}

              {/* Tabla 3: Listos */}
              {renderTablaDePiezas(
                piezasListas,
                'Piezas Listas para Entrega',
                'Piezas impresas y verificadas listas para despacho o recojo.',
                <Badge className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] font-semibold text-xs">
                  {piezasListas.length} piezas
                </Badge>,
                'border-[#B4E3C0]'
              )}
            </div>
          ) : (
            // Vista filtrada individual (por ejemplo: Solo Pendientes)
            <div>
              {renderTablaDePiezas(
                piezasProcesadas,
                filtroEstado === 'PENDIENTE' 
                  ? 'Piezas Pendientes' 
                  : filtroEstado === 'EN_PRODUCCION'
                  ? 'Piezas en Impresión'
                  : 'Piezas Listas para Entrega',
                filtroEstado === 'PENDIENTE'
                  ? 'Listado ordenado de piezas que requieren fabricación en taller.'
                  : filtroEstado === 'EN_PRODUCCION'
                  ? 'Piezas en proceso activo de impresión 3D.'
                  : 'Piezas terminadas listas para entrega al cliente.',
                <Badge className={`font-semibold text-xs ${
                  filtroEstado === 'PENDIENTE'
                    ? 'bg-[#FEF9C3] text-[#854D0E] border-[#FDE047]'
                    : filtroEstado === 'EN_PRODUCCION'
                    ? 'bg-[#DBEAFE] text-[#1D4ED8] border-[#93C5FD]'
                    : 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]'
                }`}>
                  {piezasProcesadas.length} piezas
                </Badge>,
                filtroEstado === 'PENDIENTE'
                  ? 'border-[#E8D49B]'
                  : filtroEstado === 'EN_PRODUCCION'
                  ? 'border-[#93C5FD]'
                  : 'border-[#B4E3C0]'
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA 2: AGRUPACIÓN POR MODELO / PRODUCTO EN TABLAS                       */}
      {/* ------------------------------------------------------------------------- */}
      {modoVista === 'MODELO' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#75695D]">
              {gruposPorModeloFiltrados.length} modelos consolidados para producción
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gruposPorModeloFiltrados.map((modelo) => {
              const expandido = modelosExpandidos[modelo.productoId || modelo.nombreModelo] || false
              const pctListo = modelo.totalUnidades > 0 ? ((modelo.listos / modelo.totalUnidades) * 100).toFixed(0) : '0'

              return (
                <Card 
                  key={modelo.productoId || modelo.nombreModelo} 
                  className="bg-[#FFFFFF] border border-[#E2D9CC] rounded-3xl shadow-xs overflow-hidden flex flex-col justify-between"
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base font-black text-[#241C15]">
                            {modelo.nombreModelo}
                          </CardTitle>
                          <Badge variant="outline" className="text-[10px] font-bold border-[#E2D9CC] text-[#75695D]">
                            {modelo.lineaCategoria}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs text-[#75695D] mt-0.5">
                          Peso unitario aprox: {modelo.pesoGramosUnitario}g • Total: {modelo.totalGramos}g de filamento
                        </CardDescription>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-2xl font-black text-[#A36F4C] font-mono tabular-nums block">
                          {modelo.totalUnidades}
                        </span>
                        <span className="text-[10px] font-bold text-[#75695D] uppercase">unidades</span>
                      </div>
                    </div>

                    {/* Barra de Progreso de Fabricación */}
                    <div className="space-y-1 pt-2">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-[#75695D]">
                        <span>Progreso: {pctListo}% listo</span>
                        <div className="flex items-center gap-2 text-[10px] font-mono">
                          <span className="text-[#854D0E] font-bold">{modelo.pendientes} pend.</span>
                          <span className="text-[#2563EB] font-bold">{modelo.enProduccion} imprimiendo</span>
                          <span className="text-[#1E5E3A] font-bold">{modelo.listos} listos</span>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#FAF8F5] rounded-full overflow-hidden flex border border-[#E2D9CC]/50">
                        <div style={{ width: `${(modelo.listos / modelo.totalUnidades) * 100}%` }} className="bg-[#1E5E3A] transition-all" />
                        <div style={{ width: `${(modelo.enProduccion / modelo.totalUnidades) * 100}%` }} className="bg-[#3B82F6] transition-all" />
                        <div style={{ width: `${(modelo.pendientes / modelo.totalUnidades) * 100}%` }} className="bg-[#F59E0B] transition-all" />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3">
                    {/* Desglose de Colores Requeridos para este modelo */}
                    <div>
                      <span className="text-[11px] font-bold text-[#75695D] uppercase tracking-wider block mb-1.5">
                        Colores a Imprimir:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {modelo.colores.map((col, cIdx) => (
                          <span 
                            key={cIdx} 
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-[#FAF8F5] border border-[#E2D9CC] text-[#241C15]"
                          >
                            <span 
                              className="w-3 h-3 rounded-full border border-black/20 shrink-0 shadow-2xs" 
                              style={{ backgroundColor: col.codigoHex }} 
                            />
                            <span>{col.cantidad}x {col.nombreColor}</span>
                            <span className="text-[10px] text-[#75695D] font-mono">({col.gramos}g)</span>
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Desplegable de Pedidos Asociados */}
                    <div className="pt-2 border-t border-[#E2D9CC]/60">
                      <button
                        type="button"
                        onClick={() => toggleModeloExpandido(modelo.productoId || modelo.nombreModelo)}
                        className="w-full flex items-center justify-between text-xs font-bold text-[#75695D] hover:text-[#241C15] cursor-pointer py-1"
                      >
                        <span>Ver {modelo.pedidos.length} pedidos individuales ({modelo.totalUnidades} piezas)</span>
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expandido ? 'rotate-180' : ''}`} />
                      </button>

                      {expandido && (
                        <div className="space-y-1.5 mt-2 pt-2 border-t border-[#E2D9CC]/40 text-xs animate-in fade-in duration-150">
                          {modelo.pedidos.map((ped, pIdx) => (
                            <div key={pIdx} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]/50">
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-[#241C15]">{ped.cliente}</span>
                                  <span className="text-[10px] font-mono font-bold text-[#A36F4C]">({ped.codigoRef})</span>
                                  <span className="text-[10px] text-[#75695D]">• {ped.cantidad} ud(s)</span>
                                </div>
                                {ped.personalizacion && (
                                  <p className="inline-flex items-center gap-1 text-[11px] text-[#854D0E] font-medium">
                                    <Sparkles className="w-2.5 h-2.5 text-[#D97706] shrink-0" />
                                    {ped.personalizacion}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#75695D]">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: ped.codigoHex }} />
                                  {ped.nombreColor}
                                </span>
                                {getEntregaBadge(ped.diaEntregaPrometida)}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------------- */}
      {/* VISTA 3: AGRUPACIÓN POR COLOR DE FILAMENTO (OPTIMIZACIÓN DE BOBINAS)      */}
      {/* ------------------------------------------------------------------------- */}
      {modoVista === 'COLOR' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-[#75695D]">
              {gruposPorColorFiltrados.length} colores requeridos en producción
            </span>
            <span className="text-xs text-[#75695D]">
              Agrupa impresiones por bobina para optimizar cambios de filamento
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gruposPorColorFiltrados.map((grupo) => {
              const expandido = coloresExpandidos[grupo.colorId || grupo.nombreColor] || false
              const faltaStock = grupo.deficitGramos > 0

              return (
                <Card 
                  key={grupo.colorId || grupo.nombreColor} 
                  className={`bg-[#FFFFFF] border rounded-3xl shadow-xs overflow-hidden flex flex-col justify-between ${
                    faltaStock ? 'border-[#FCA5A5] ring-1 ring-[#FCA5A5]/40' : 'border-[#E2D9CC]'
                  }`}
                >
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-2xl border-2 border-black/20 shadow-xs flex items-center justify-center shrink-0"
                          style={{ backgroundColor: grupo.codigoHex }}
                        />
                        <div>
                          <CardTitle className="text-base font-black text-[#241C15]">
                            {grupo.nombreColor}
                          </CardTitle>
                          <CardDescription className="text-xs text-[#75695D]">
                            Material: {grupo.tipoMaterial} • Stock: {grupo.stockGramosActual}g ({grupo.stockBobinasActual} bobinas)
                          </CardDescription>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xl font-black text-[#241C15] font-mono tabular-nums block">
                          {grupo.totalUnidades} uds
                        </span>
                        <span className="text-[11px] font-bold text-[#A36F4C] font-mono">
                          {grupo.totalGramosRequeridos}g req.
                        </span>
                      </div>
                    </div>

                    {/* Alerta de Stock insuficiente si aplica */}
                    {faltaStock && (
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold mt-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
                        <span>Faltan {grupo.deficitGramos}g para completar todas las piezas.</span>
                      </div>
                    )}
                  </CardHeader>

                  <CardContent className="p-5 pt-0 space-y-3">
                    {/* Lista de Modelos que usan este color */}
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-[#75695D] uppercase tracking-wider block">
                        Piezas que usan este color:
                      </span>
                      
                      <div className="space-y-1">
                        {grupo.modelos.slice(0, expandido ? undefined : 3).map((mod, mIdx) => (
                          <div key={mIdx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]/40">
                            <span className="font-bold text-[#241C15] truncate pr-2">
                              {mod.cantidad}x {mod.nombreModelo}
                            </span>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-[11px] text-[#75695D] font-mono font-semibold">
                                {mod.gramos}g
                              </span>
                              <Badge variant="outline" className="text-[9px] font-mono px-1.5 py-0 border-[#E2D9CC]">
                                {mod.codigoRef}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>

                      {grupo.modelos.length > 3 && (
                        <button
                          type="button"
                          onClick={() => toggleColorExpandido(grupo.colorId || grupo.nombreColor)}
                          className="text-xs font-bold text-[#A36F4C] hover:underline cursor-pointer pt-1 block"
                        >
                          {expandido ? 'Mostrar menos' : `+ Ver ${grupo.modelos.length - 3} piezas más`}
                        </button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
