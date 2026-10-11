'use client'

import React, { useState, useMemo } from 'react'
import {
  Calendar,
  Share2,
  Pencil,
  X,
  Store,
  CreditCard,
  Package,
  Boxes,
  Phone,
  Clock,
  User
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
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { addPagoPedido } from '@/actions/pedidos'
import type { PedidoView, ProductoOption } from './PedidosClient'

export interface OrderDetailsModalProps {
  isOpen: boolean
  pedido: PedidoView | null
  onClose: () => void
  onEdit: (pedido: PedidoView) => void
  onPedidoUpdated?: (updatedPedido: PedidoView) => void
  productos?: ProductoOption[]
  productosMap?: Map<string, ProductoOption>
}

// Helpers de formateo
function getInitials(name?: string | null): string {
  if (!name) return 'CL'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase()
}

function formatCurrency(val: number): string {
  return `S/ ${Number(val || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatFechaLegible(dateStr?: string | Date | null): string {
  if (!dateStr) return '—'
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr
    if (isNaN(d.getTime())) return formatDate(dateStr)
    return d.toLocaleDateString('es-PE', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch {
    return formatDate(dateStr)
  }
}

function cleanPaymentMethod(val?: string | null): string {
  if (!val) return 'Yape'
  const v = val.toUpperCase().trim()
  if (v === 'YAPE') return 'Yape'
  if (v === 'PLIN') return 'Plin'
  if (v === 'BCP') return 'BCP'
  if (v === 'BBVA') return 'BBVA'
  if (v === 'EFECTIVO') return 'Efectivo'
  if (v === 'TRANSFERENCIA') return 'Transferencia'
  return val.charAt(0).toUpperCase() + val.slice(1).toLowerCase()
}

function cleanPaymentType(val?: string | null): string {
  if (!val) return 'Pago Total'
  const v = val.toUpperCase().trim()
  if (v === 'PAGO_TOTAL' || v === 'TOTAL') return 'Pago Total'
  if (v === 'SALDO_ENTREGA' || v === 'SALDO') return 'Saldo Entrega'
  if (v === 'ABONO' || v === 'ABONO_PARCIAL') return 'Abono Parcial'
  if (v === 'ANTICIPO') return 'Anticipo'
  return val.replace(/_/g, ' ')
}

function formatDestino(destino?: string | null): string {
  if (!destino || destino.trim() === '' || destino.toLowerCase() === 'tienda') {
    return 'Tienda (Recojo en local)'
  }
  return destino
}

function buildWhatsAppTicket(p: PedidoView): string {
  const itemsText = p.items.map((it, idx) => {
    const itemColores = (it.colores && it.colores.length > 0)
      ? it.colores
      : (it.colorFilamento ? [it.colorFilamento] : [])
    const colorText = itemColores.length > 1
      ? ` (Colores: ${itemColores.map(c => c.nombreColor).join(' + ')})`
      : itemColores.length === 1
      ? ` (Color: ${itemColores[0].nombreColor})`
      : ''
    const customText = it.personalizacion ? ` [Nota: ${it.personalizacion}]` : ''
    return `  ${idx + 1}. *${it.nombreProductoSnapshot}* x${it.cantidad}${colorText}${customText} — S/ ${it.subtotal.toFixed(2)}`
  }).join('\n')

  const envioText = p.costoEnvio > 0 ? `\n🚚 *Envío / Destino:* S/ ${p.costoEnvio.toFixed(2)} (${p.destinoEnvio || 'Agencia'})` : ''
  const saldoText = p.saldoPendiente > 0 ? `\n⏳ *Saldo Pendiente:* S/ ${p.saldoPendiente.toFixed(2)}` : '\n✅ *Estado Pago:* 100% Cancelado'

  return `*RESUMEN DE PEDIDO — ${p.codigo}*\n` +
    `👤 *Cliente:* ${p.cliente}${p.dni ? ` (DNI: ${p.dni})` : ''}\n` +
    `📅 *Fecha:* ${formatDate(p.fecha)}\n` +
    (p.diaEntregaPrometida ? `📦 *Entrega Pactada:* ${p.diaEntregaPrometida}\n` : '') +
    `\n*PRODUCTOS:* \n${itemsText}${envioText}\n\n` +
    `💳 *Medio de Pago:* ${p.metodoPago || (p.pagos?.[0]?.metodoPago) || 'YAPE'}\n` +
    `💰 *Total Pedido:* S/ ${p.total.toFixed(2)}\n` +
    `💳 *Abonado:* S/ ${p.montoPagado.toFixed(2)}${saldoText}\n\n` +
    `_¡Gracias por tu pedido en NOVA Board Games!_`
}

function ProductThumbnail({ src, alt }: { src?: string | null; alt: string }) {
  const [hasError, setHasError] = useState(false)

  if (!src || hasError) {
    return (
      <div className="w-10 h-10 rounded-lg border border-border/70 bg-secondary/50 shrink-0 mr-3 flex items-center justify-center text-muted-foreground shadow-2xs">
        <Boxes className="w-5 h-5 text-muted-foreground/70" />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className="w-10 h-10 rounded-lg object-cover border border-border/70 bg-secondary/50 shrink-0 mr-3 shadow-2xs"
    />
  )
}

export function OrderDetailsModal({
  isOpen,
  pedido,
  onClose,
  onEdit,
  onPedidoUpdated,
  productos = [],
  productosMap
}: OrderDetailsModalProps) {
  const [copiedNotification, setCopiedNotification] = useState(false)
  const [abonoMonto, setAbonoMonto] = useState('')
  const [abonoMetodo, setAbonoMetodo] = useState('YAPE')
  const [abonoTipo, setAbonoTipo] = useState('SALDO_ENTREGA')
  const [abonoNotas, setAbonoNotas] = useState('')
  const [isSubmittingAbono, setIsSubmittingAbono] = useState(false)

  // Mapa local de productos para resolver miniaturas
  const localProdMap = useMemo(() => {
    if (productosMap) return productosMap
    const map = new Map<string, ProductoOption>()
    for (const prod of productos) {
      map.set(prod.id, prod)
    }
    return map
  }, [productos, productosMap])

  if (!pedido) return null

  const handleShareWhatsApp = () => {
    try {
      const ticketMsg = buildWhatsAppTicket(pedido)
      navigator.clipboard.writeText(ticketMsg)
      setCopiedNotification(true)
      toast.success('¡Resumen de pedido copiado para WhatsApp!')
      setTimeout(() => setCopiedNotification(false), 2500)
    } catch {
      toast.error('No se pudo copiar el ticket al portapapeles')
    }
  }

  const handleSubmitAbono = async (e: React.FormEvent) => {
    e.preventDefault()
    const monto = Number(abonoMonto)
    if (!monto || monto <= 0) {
      toast.error('Ingresa un monto válido mayor a 0.')
      return
    }

    setIsSubmittingAbono(true)
    try {
      const res = await addPagoPedido(pedido.id, {
        monto,
        metodoPago: abonoMetodo,
        tipo: abonoTipo,
        notas: abonoNotas.trim() || undefined
      })

      if (res.success && res.pedido) {
        toast.success(`Abono de ${formatCurrency(monto)} registrado con éxito`)
        setAbonoMonto('')
        setAbonoNotas('')
        if (onPedidoUpdated) {
          onPedidoUpdated(res.pedido as any)
        }
      } else {
        toast.error(res.error || 'No se pudo registrar el abono')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar abono')
    } finally {
      setIsSubmittingAbono(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-2xl sm:max-w-2xl bg-background border border-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] p-0 gap-0 ring-0"
      >
        <DialogTitle className="sr-only">
          Detalle del Pedido {pedido.codigo}
        </DialogTitle>
        <DialogDescription className="sr-only">
          Ficha con información de cliente, logística, productos asignados y liquidación de abonos.
        </DialogDescription>

        {/* ========================================================================= */}
        {/* 1. ENCABEZADO FIJO DEL PEDIDO                                            */}
        {/* ========================================================================= */}
        <div className="px-6 pt-5 pb-4 border-b border-border/70 bg-card/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="min-w-0">
            {/* Fila de título */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="font-mono text-xs font-extrabold bg-accent text-accent-foreground px-2.5 py-1 rounded-lg border border-border/70 shrink-0 mr-2 shadow-2xs">
                {pedido.codigo}
              </span>
              <h2 className="text-lg font-bold text-foreground truncate">
                Pedido de {pedido.cliente}
              </h2>
            </div>
            {/* Fila de metadatos */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1 flex-wrap">
              <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0 inline" />
              <span>{formatFechaLegible(pedido.fecha)}</span>
              <span>•</span>
              <span className="text-xs text-muted-foreground">
                Canal: {pedido.canalVenta || 'Directo'}
              </span>
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleShareWhatsApp}
              className="border-emerald-600/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold h-9 px-3.5 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
              title="Copiar resumen para WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compartir por WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => onEdit(pedido)}
              className="border-border text-foreground hover:bg-secondary text-xs font-semibold h-9 px-3.5 rounded-xl flex items-center gap-1.5 shadow-2xs cursor-pointer transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Editar Pedido</span>
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary border border-border/60 ml-1 cursor-pointer transition-colors"
              title="Cerrar modal"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. CUERPO CON SCROLL VERTICAL FLUIDO                                     */}
        {/* ========================================================================= */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Notificación de copiado al portapapeles */}
          {copiedNotification && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-bold text-center animate-in fade-in shadow-2xs">
              ¡Resumen del ticket copiado al portapapeles listo para enviar por WhatsApp!
            </div>
          )}

          {/* Panel de Información: Cliente & Despacho (Grid de 2 Bloques) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Bloque A: Cliente & Contacto */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3 h-3 text-muted-foreground" />
                CLIENTE
              </span>
              <div className="flex items-center pt-1">
                <div className="w-10 h-10 rounded-full bg-accent text-accent-foreground font-bold text-xs flex items-center justify-center border border-border/70 shrink-0 mr-3 shadow-2xs">
                  {getInitials(pedido.cliente)}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-bold text-foreground truncate">
                    {pedido.cliente}
                  </h3>
                  {pedido.dni ? (
                    <p className="text-xs text-muted-foreground">
                      DNI: {pedido.dni}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground/60 italic">
                      Sin DNI registrado
                    </p>
                  )}
                </div>
              </div>
              <div className="pt-1.5 border-t border-border/50">
                {pedido.telefono ? (
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                    <a
                      href={`https://wa.me/${pedido.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-foreground hover:text-primary transition-colors underline-offset-2 hover:underline"
                    >
                      {pedido.telefono}
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground/70 italic">
                    Sin teléfono registrado
                  </p>
                )}
              </div>
            </div>

            {/* Bloque B: Logística & Facturación */}
            <div className="bg-card border border-border rounded-xl p-4 shadow-2xs space-y-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Store className="w-3 h-3 text-muted-foreground" />
                ENTREGA Y PAGO
              </span>
              <div className="space-y-1.5 pt-1">
                {/* Fila 1: Destino / Entrega */}
                <div className="flex items-center text-xs font-semibold text-foreground">
                  <Store className="w-4 h-4 text-primary mr-1.5 shrink-0 inline" />
                  <span className="truncate">
                    Destino: {formatDestino(pedido.destinoEnvio)}
                  </span>
                </div>

                {/* Fila 2: Método de pago con chip */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span>Método de pago:</span>
                  <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold px-2 py-0.5 rounded-md border border-emerald-500/20 inline-flex items-center gap-1">
                    <CreditCard className="w-3 h-3 text-emerald-800 dark:text-emerald-300 inline" />
                    {cleanPaymentMethod(pedido.metodoPago || (pedido.pagos?.[0]?.metodoPago) || 'YAPE')}
                  </span>
                </div>

                {/* Fila 3: Fecha pactada */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">
                    {pedido.diaEntregaPrometida
                      ? `Entrega programada: ${pedido.diaEntregaPrometida}`
                      : 'Entrega inmediata en tienda'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notas / Instrucciones Especiales si existen */}
          {pedido.notas && (
            <div className="p-3 bg-secondary/40 rounded-xl border border-border text-xs flex items-start gap-2 shadow-2xs">
              <span className="font-bold text-accent-foreground shrink-0">
                Notas / Instrucciones:
              </span>
              <span className="text-foreground">{pedido.notas}</span>
            </div>
          )}

          {/* Tabla de Productos Asignados */}
          <div>
            <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-primary" />
              PRODUCTOS ASIGNADOS AL PEDIDO ({pedido.items.length})
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full table-fixed border-collapse">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border/70 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <th className="py-2.5 px-4 text-left w-[55%]">PRODUCTO</th>
                    <th className="py-2.5 px-2 text-center w-[15%]">CANT.</th>
                    <th className="py-2.5 px-2 text-right w-[15%]">P. UNIT</th>
                    <th className="py-2.5 px-4 text-right w-[15%]">SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {pedido.items.map((it) => {
                    const prodImg = it.producto?.imagenUrl || localProdMap.get(it.productoId)?.imagenUrl
                    return (
                      <tr
                        key={it.id}
                        className="h-14 border-b border-border/50 hover:bg-secondary/20 transition-colors"
                      >
                        <td className="py-2 px-4 w-[55%] align-middle">
                          <div className="flex items-center min-w-0">
                            <ProductThumbnail
                              src={prodImg}
                              alt={it.nombreProductoSnapshot}
                            />
                            <div className="min-w-0 flex-1">
                              <span
                                className="text-xs font-bold text-foreground block truncate"
                                title={it.nombreProductoSnapshot}
                              >
                                {it.nombreProductoSnapshot}
                              </span>
                              {it.personalizacion && (
                                <span className="text-[10px] text-muted-foreground block font-normal italic truncate">
                                  Nota: {it.personalizacion}
                                </span>
                              )}
                              {it.colores && it.colores.length > 0 && (
                                <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                                  {it.colores.map((c) => (
                                    <span
                                      key={c.id}
                                      className="text-[9px] px-1.5 py-0.2 rounded bg-secondary text-muted-foreground border border-border/60"
                                    >
                                      {c.nombreColor}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-2 px-2 text-center text-xs font-bold text-foreground w-[15%] align-middle">
                          {it.cantidad}
                        </td>
                        <td className="py-2 px-2 text-right text-xs font-medium text-muted-foreground font-mono w-[15%] align-middle">
                          {formatCurrency(it.precioUnitario)}
                        </td>
                        <td className="py-2 px-4 text-right text-xs font-extrabold text-foreground font-mono w-[15%] align-middle">
                          {formatCurrency(it.subtotal)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>

              {/* Fila de Costo de Envío / Flete si aplica */}
              {pedido.costoEnvio > 0 && (
                <div className="bg-secondary/20 border-t border-border/50 px-4 py-2.5 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-semibold">
                    Costo de Envío / Flete:
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {formatCurrency(pedido.costoEnvio)}
                  </span>
                </div>
              )}

              {/* Fila de Total */}
              <div className="bg-secondary/30 px-4 py-3 flex items-center justify-between border-t border-border/70">
                <span className="text-xs font-bold text-muted-foreground uppercase">
                  TOTAL DEL PEDIDO:
                </span>
                <span className="text-base font-extrabold text-foreground font-mono">
                  {formatCurrency(pedido.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Historial de Abonos y Liquidación */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-primary shrink-0 inline" />
                HISTORIAL DE ABONOS ({pedido.pagos ? pedido.pagos.length : 0})
              </span>
              {pedido.saldoPendiente <= 0 ? (
                <span className="bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                  ✓ Totalmente Pagado (Saldo S/ 0.00)
                </span>
              ) : (
                <span className="bg-destructive/10 text-destructive border border-destructive/20 text-xs font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs font-mono">
                  Resta {formatCurrency(pedido.saldoPendiente)}
                </span>
              )}
            </div>

            {/* Listado de Abonos */}
            {pedido.pagos && pedido.pagos.length > 0 ? (
              <div className="space-y-2">
                {pedido.pagos.map((pg, idx) => (
                  <div
                    key={pg.id}
                    className="bg-card border border-border rounded-xl p-3.5 flex items-center justify-between shadow-2xs mt-2 hover:border-emerald-500/30 transition-colors"
                  >
                    <div>
                      <div className="flex items-center flex-wrap gap-1">
                        <span className="text-xs font-bold text-foreground">
                          Abono #{idx + 1}
                        </span>
                        <span className="text-[10px] font-semibold bg-secondary border border-border/70 px-2 py-0.5 rounded-md ml-2 text-foreground">
                          {cleanPaymentMethod(pg.metodoPago)} • {cleanPaymentType(pg.tipo)}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {formatFechaLegible(pg.fecha)}
                        {pg.notas ? ` • ${pg.notas}` : ''}
                      </p>
                    </div>
                    <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-300 font-mono flex-shrink-0">
                      +{formatCurrency(pg.monto)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-secondary/30 rounded-xl border border-border text-xs text-muted-foreground italic">
                No se han registrado pagos para este pedido.
              </div>
            )}

            {/* Formulario para Agregar Nuevo Abono */}
            {pedido.saldoPendiente > 0 && (
              <form
                onSubmit={handleSubmitAbono}
                className="p-3.5 rounded-xl bg-secondary/30 border border-border space-y-3 mt-3 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground block">
                    + Registrar Nuevo Abono al Pedido
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                    Saldo restante:{' '}
                    <strong className="text-foreground">
                      {formatCurrency(pedido.saldoPendiente)}
                    </strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-bold">
                      Monto (S/) *
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      placeholder={pedido.saldoPendiente.toFixed(2)}
                      value={abonoMonto}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => setAbonoMonto(e.target.value)}
                      className="h-8 bg-card border-border text-xs font-mono font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-bold">
                      Método de Pago
                    </Label>
                    <select
                      value={abonoMetodo}
                      onChange={(e) => setAbonoMetodo(e.target.value)}
                      className="w-full h-8 rounded-lg border border-border bg-card px-2 text-xs font-bold text-foreground outline-none focus:border-primary"
                    >
                      <option value="YAPE">Yape</option>
                      <option value="PLIN">Plin</option>
                      <option value="BCP">BCP</option>
                      <option value="BBVA">BBVA</option>
                      <option value="EFECTIVO">Efectivo</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground font-bold">
                      Tipo de Abono
                    </Label>
                    <select
                      value={abonoTipo}
                      onChange={(e) => setAbonoTipo(e.target.value)}
                      className="w-full h-8 rounded-lg border border-border bg-card px-2 text-xs font-bold text-foreground outline-none focus:border-primary"
                    >
                      <option value="SALDO_ENTREGA">Liquidación / Saldo Final</option>
                      <option value="ABONO">Abono Parcial</option>
                      <option value="ANTICIPO">Anticipo</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <Input
                    placeholder="Nota o número de operación (opcional)..."
                    value={abonoNotas}
                    onChange={(e) => setAbonoNotas(e.target.value)}
                    className="h-8 bg-card border-border text-xs flex-1 rounded-lg"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isSubmittingAbono}
                    className="h-8 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs rounded-xl cursor-pointer flex-shrink-0 shadow-2xs transition-colors"
                  >
                    {isSubmittingAbono ? 'Guardando...' : 'Registrar Abono'}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. FOOTER DEL MODAL                                                      */}
        {/* ========================================================================= */}
        <div className="border-t border-border/70 bg-card/40 px-6 py-4 flex items-center justify-end gap-3 mt-auto shrink-0">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary h-10 px-5 transition-colors cursor-pointer"
          >
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Alias de conveniencia por si se importa con OrderViewDialog
export const OrderViewDialog = OrderDetailsModal
