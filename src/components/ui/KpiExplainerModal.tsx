'use client'

import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { KpiExplanationData } from '@/actions/kpi-explainer'

interface KpiExplainerModalProps {
  isOpen: boolean
  onClose: () => void
  kpiId: string | null
  from?: string | null
  to?: string | null
  negocio?: string
}

// Formateador limpio de fecha en formato amigable (ej: "14 oct. 2026")
function formatFechaAuditoria(rawDate: string | undefined | null): string {
  if (!rawDate) return '-'
  const dateOnly = String(rawDate).split('T')[0].trim()
  const parts = dateOnly.split('-')
  if (parts.length === 3) {
    const y = Number(parts[0])
    const m = Number(parts[1]) - 1
    const d = Number(parts[2])
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      const months = [
        'ene.', 'feb.', 'mar.', 'abr.', 'may.', 'jun.',
        'jul.', 'ago.', 'set.', 'oct.', 'nov.', 'dic.'
      ]
      return `${d} ${months[m] || ''} ${y}`
    }
  }
  return dateOnly
}

// Capitalizador amigable para nombres de clientes
function formatClienteNombre(name?: string | null): string {
  if (!name) return 'Cliente'
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

// Normalizador amigable de estados
function formatEstado(estado?: string | null): string {
  if (!estado) return ''
  const map: Record<string, string> = {
    PENDIENTE: 'Pendiente',
    EN_PRODUCCION: 'En producción',
    EN_TALLER: 'En taller',
    EMPAQUETANDO: 'Empaquetando',
    LISTO: 'Listo',
    LISTO_ENTREGA: 'Por entregar',
    ENTREGADO: 'Entregado',
    CANCELADO: 'Cancelado',
    REGISTRADO: 'Registrado'
  }
  return map[estado] || estado
}

export function KpiExplainerModal({
  isOpen,
  onClose,
  kpiId,
  from,
  to,
  negocio
}: KpiExplainerModalProps) {
  const [data, setData] = useState<KpiExplanationData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !kpiId) {
      setData(null)
      setError(null)
      return
    }

    let isMounted = true
    setLoading(true)
    setError(null)

    const params = new URLSearchParams()
    params.set('kpiId', kpiId)
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    if (negocio) params.set('negocio', negocio)

    fetch(`/api/kpis/explicacion?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error('No se pudo cargar la auditoría del KPI')
        return res.json()
      })
      .then((json) => {
        if (!isMounted) return
        if (json.success && json.data) {
          setData(json.data)
        } else {
          setError(json.error || 'Respuesta inválida del servidor')
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setError(err.message || 'Error de conexión con el backend')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, kpiId, from, to, negocio])

  // Métricas auxiliares para el desglose ejecutivo
  const costoMetric = data?.resumenMetricas?.find((m) => m.etiqueta.toLowerCase().includes('costo'))
  const utilidadMetric = data?.resumenMetricas?.find((m) => m.etiqueta.toLowerCase().includes('utilidad'))
  const margenMetric = data?.resumenMetricas?.find((m) => m.etiqueta.toLowerCase().includes('margen'))

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="p-0 gap-0 w-full max-w-2xl sm:max-w-2xl bg-card border border-border/80 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* ========================================================================= */}
        {/* 1. ENCABEZADO CON BADGE Y BOTÓN DE CIERRE                                 */}
        {/* ========================================================================= */}
        <div className="px-6 py-4 border-b border-border/60 bg-card/95 backdrop-blur-xs flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground bg-muted/60 border border-border/50 px-2 py-0.5 rounded-md inline-block mb-1 font-mono">
              AUDITORÍA DE MÉTRICA
            </span>
            <DialogTitle className="text-base font-semibold text-foreground tracking-tight">
              {data?.titulo || 'Auditoría de Métrica'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">
              {data?.subtitulo || 'Volumen comercial bruto contratado en el rango seleccionado'}
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 flex items-center justify-center transition-colors cursor-pointer shrink-0"
            aria-label="Cerrar modal"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* ========================================================================= */}
        {/* 2. CUERPO CON SCROLL VERTICAL SUAVE                                       */}
        {/* ========================================================================= */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-medium">Consultando registros y calculando fórmula en el backend...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center space-y-2">
              <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
              <p className="text-xs font-semibold text-destructive">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* ----------------------------------------------------------------- */}
              {/* BLOQUE 1: RESUMEN EJECUTIVO (GRID BALANCEADO DE 2 COLUMNAS)       */}
              {/* ----------------------------------------------------------------- */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 bg-muted/20 border border-border/50 rounded-xl p-4 shadow-none">
                {/* Hero Metric (Columna Izquierda: 5 cols) */}
                <div className="sm:col-span-5 border-b sm:border-b-0 sm:border-r border-border/60 pb-3 sm:pb-0 sm:pr-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">
                      VALOR AUDITADO
                    </span>
                    <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight my-1 font-mono tabular-nums">
                      {data.valorFormateado}
                    </div>
                  </div>
                  <div className="bg-muted/60 text-muted-foreground text-[11px] font-medium px-2.5 py-1 rounded-lg w-fit border border-border/50 mt-2 sm:mt-0 font-mono">
                    {data.rangoFechas.descripcion} • {data.totalTransacciones} {data.totalTransacciones === 1 ? 'ped' : 'peds'}
                  </div>
                </div>

                {/* Desglose de Rentabilidad (Columna Derecha: 7 cols) */}
                {data.kpiId === 'facturacion_periodo' ? (
                  <div className="sm:col-span-7 flex flex-col justify-between space-y-2">
                    <div className="text-xs flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Total Facturado ({data.totalTransacciones} pedidos):
                      </span>
                      <span className="font-semibold text-foreground font-mono tabular-nums">
                        {data.valorFormateado}
                      </span>
                    </div>

                    <div className="text-xs flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Costo de Fabricación (Insumos):
                      </span>
                      <span className="font-medium text-muted-foreground font-mono tabular-nums">
                        {costoMetric?.valor || 'S/ 0.00'}
                      </span>
                    </div>

                    <div className="text-xs flex justify-between items-center pt-1.5 border-t border-border/50">
                      <span className="text-foreground font-medium">
                        Utilidad Neta Directa:
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                        {utilidadMetric?.valor
                          ? utilidadMetric.valor.startsWith('+')
                            ? utilidadMetric.valor
                            : `+${utilidadMetric.valor}`
                          : '+S/ 0.00'}
                      </span>
                    </div>

                    <div className="text-xs flex justify-between items-center">
                      <span className="text-muted-foreground">
                        Margen Comercial sobre Costo:
                      </span>
                      <span className="font-medium text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md text-[11px] font-mono">
                        {margenMetric?.valor ? `${margenMetric.valor} markup` : '+0.0% markup'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="sm:col-span-7 flex flex-col justify-between space-y-2">
                    {data.resumenMetricas && data.resumenMetricas.length > 0 ? (
                      data.resumenMetricas.slice(0, 4).map((m, idx) => (
                        <div
                          key={idx}
                          className={cn(
                            'text-xs flex justify-between items-center',
                            idx >= 2 && 'pt-1.5 border-t border-border/50'
                          )}
                        >
                          <span className="text-muted-foreground">{m.etiqueta}:</span>
                          <span
                            className={cn(
                              'font-mono font-medium tabular-nums',
                              m.tipo === 'positivo'
                                ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                                : m.tipo === 'negativo'
                                ? 'text-rose-600 dark:text-rose-400 font-semibold'
                                : m.tipo === 'destacado'
                                ? 'text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md text-[11px]'
                                : 'text-foreground'
                            )}
                          >
                            {m.valor}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground italic flex items-center justify-center h-full">
                        Sin métricas complementarias
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* BLOQUE 2: METODOLOGÍA Y FÓRMULA OFICIAL                           */}
              {/* ----------------------------------------------------------------- */}
              <div className="bg-muted/20 border border-border/50 rounded-xl p-3.5 space-y-2">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <span>📐 Metodología de Cálculo</span>
                </div>
                <div className="bg-background border border-border/60 rounded-lg px-3 py-2 font-mono text-xs font-medium text-foreground break-words">
                  {data.formulaMatematica}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {data.explicacionConceptual}
                </p>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* BLOQUE 3: PASO A PASO DEL CÁLCULO (TIMELINE LIMPIO)               */}
              {/* ----------------------------------------------------------------- */}
              <div className="space-y-2.5">
                <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2.5">
                  🪜 Paso a Paso con Valores del Período
                </div>
                <div className="space-y-2.5">
                  {data.pasosCalculo.map((p) => (
                    <div
                      key={p.paso}
                      className="bg-card border border-border/50 rounded-xl p-3 flex items-start justify-between gap-3 shadow-none"
                    >
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="w-5 h-5 rounded-full bg-primary/10 text-primary font-medium text-xs flex items-center justify-center shrink-0 mt-0.5 font-mono">
                          {p.paso}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-foreground leading-snug">
                            {p.descripcion}
                          </p>
                          {p.operacion && (
                            <p className="text-[11px] text-muted-foreground font-mono mt-0.5 break-words">
                              Operación: {p.operacion}
                            </p>
                          )}
                        </div>
                      </div>
                      {p.resultadoParcial && (
                        <span className="text-xs font-semibold text-foreground shrink-0 bg-muted/60 px-2.5 py-1 rounded-lg font-mono tabular-nums border border-border/40">
                          {p.resultadoParcial}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ----------------------------------------------------------------- */}
              {/* BLOQUE 4: DESGLOSE DE PEDIDOS INCLUIDOS (TABLA SIN SCROLL HORIZ)  */}
              {/* ----------------------------------------------------------------- */}
              {data.transaccionesDetalle && data.transaccionesDetalle.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      📋 Desglose de Registros ({data.transaccionesDetalle.length})
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Ordenados cronológicamente
                    </span>
                  </div>

                  <div className="border border-border/60 rounded-xl overflow-hidden shadow-none max-h-48 overflow-y-auto">
                    {/* thead */}
                    <div className="bg-muted/30 text-[10px] font-medium text-muted-foreground uppercase tracking-wider py-2 px-3 border-b border-border/60 flex justify-between items-center sticky top-0 z-10 backdrop-blur-xs select-none">
                      <div className="w-[50%]">Fecha &amp; Cliente</div>
                      <div className="w-[30%] px-2">Modelo</div>
                      <div className="w-[20%] text-right">Total</div>
                    </div>

                    {/* tbody */}
                    <div className="divide-y divide-border/40">
                      {data.transaccionesDetalle.map((item) => (
                        <div
                          key={item.id}
                          className="py-2 px-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors"
                        >
                          {/* Fecha & Cliente (50%) */}
                          <div className="w-[50%] min-w-0 flex items-center gap-2">
                            <span className="font-mono text-[11px] text-muted-foreground shrink-0 tabular-nums">
                              {formatFechaAuditoria(item.fecha)}
                            </span>
                            <span className="font-medium text-foreground truncate">
                              {formatClienteNombre(item.cliente)}
                            </span>
                            {item.categoriaOEstado && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 bg-muted/60 text-muted-foreground border border-border/50 truncate hidden sm:inline-block">
                                {formatEstado(item.categoriaOEstado)}
                              </span>
                            )}
                          </div>

                          {/* Modelo / Concepto (30%) */}
                          <div className="w-[30%] text-muted-foreground truncate px-2 text-[11px]">
                            {item.concepto}
                          </div>

                          {/* Monto (20%) */}
                          <div className="w-[20%] font-semibold text-foreground text-right shrink-0 font-mono tabular-nums">
                            {item.montoFormateado ||
                              (item.monto != null ? `S/ ${item.monto.toFixed(2)}` : '-')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* ========================================================================= */}
        {/* 3. PIE DEL MODAL CON NOTA Y BOTÓN CERRAR                                   */}
        {/* ========================================================================= */}
        <div className="px-6 py-3.5 border-t border-border/60 bg-muted/20 flex items-center justify-between text-xs text-muted-foreground mt-auto">
          <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-2 truncate">
            <span className="shrink-0">ℹ️</span>
            <span className="truncate">
              {data?.notaAuditoria || 'Solo se incluyen pedidos con fecha de creación dentro del período activo.'}
            </span>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="rounded-lg text-xs font-medium h-8 px-4 cursor-pointer shrink-0"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
