'use client'

import React, { useRef } from 'react'
import { Printer, Copy, X, Check, Share2, Store, CreditCard, Calendar, Phone } from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { PedidoView } from './PedidosClient'
import { formatDate, formatCurrency } from '@/lib/utils'

interface ThermalTicket80mmModalProps {
  isOpen: boolean
  pedido: PedidoView | null
  onClose: () => void
}

export function ThermalTicket80mmModal({
  isOpen,
  pedido,
  onClose
}: ThermalTicket80mmModalProps) {
  const [copied, setCopied] = React.useState(false)

  if (!pedido) return null

  const handlePrint = () => {
    // Dispara el diálogo de impresión nativo del navegador
    window.print()
  }

  const handleCopyText = () => {
    const lines = [
      '========================================',
      '           NOVA BOARD GAMES             ',
      '      Accesorios & Fabricación 3D       ',
      '========================================',
      `TICKET DE PEDIDO: ${pedido.codigo}`,
      `FECHA: ${formatDate(pedido.fecha)}`,
      '----------------------------------------',
      `CLIENTE: ${pedido.cliente}`,
      pedido.dni ? `DNI/RUC: ${pedido.dni}` : null,
      pedido.telefono ? `TELÉFONO: ${pedido.telefono}` : null,
      `ENTREGA: ${pedido.destinoEnvio || 'Recojo en Tienda'}`,
      pedido.diaEntregaPrometida ? `PROMETIDO: ${pedido.diaEntregaPrometida}` : null,
      '----------------------------------------',
      'CANT  PRODUCTO                   IMPORTE',
      '----------------------------------------',
      ...pedido.items.map(it => {
        const itemColores = (it.colores && it.colores.length > 0)
          ? it.colores.map(c => c.nombreColor).join('+')
          : (it.colorFilamento ? it.colorFilamento.nombreColor : '')
        const colorStr = itemColores ? ` (${itemColores})` : ''
        return `${it.cantidad}x    ${it.nombreProductoSnapshot.substring(0, 24)}${colorStr}  S/ ${it.subtotal.toFixed(2)}`
      }),
      pedido.costoEnvio > 0 ? `1x    Envío / Flete             S/ ${pedido.costoEnvio.toFixed(2)}` : null,
      '----------------------------------------',
      `TOTAL DEL PEDIDO:        S/ ${pedido.total.toFixed(2)}`,
      `ABONADO (${pedido.metodoPago || 'YAPE'}):         S/ ${pedido.montoPagado.toFixed(2)}`,
      pedido.saldoPendiente > 0 
        ? `>>> SALDO PENDIENTE:     S/ ${pedido.saldoPendiente.toFixed(2)} <<<`
        : 'ESTADO DE PAGO:          100% CANCELADO',
      '========================================',
      '       ¡GRACIAS POR TU CONFIANZA!       ',
      '   Conserva este comprobante de pedido  ',
      '========================================'
    ].filter(Boolean).join('\n')

    navigator.clipboard.writeText(lines)
    setCopied(true)
    toast.success('¡Ticket térmico copiado en texto!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      {/* Estilos CSS específicos para impresión en rollo térmico de 80mm */}
      <style jsx global>{`
        @media print {
          /* Ocultar toda la interfaz de la web al imprimir */
          body * {
            visibility: hidden !important;
          }
          /* Mostrar únicamente el contenedor del ticket térmico */
          #thermal-80mm-ticket, #thermal-80mm-ticket * {
            visibility: visible !important;
          }
          #thermal-80mm-ticket {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 76mm !important;
            max-width: 76mm !important;
            margin: 0 !important;
            padding: 2mm 3mm !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            font-size: 11px !important;
            line-height: 1.25 !important;
            box-shadow: none !important;
            border: none !important;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>

      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
        <DialogContent 
          showCloseButton={false}
          className="max-w-md w-full bg-card border border-border rounded-2xl p-0 overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        >
          {/* Header de la ventana */}
          <div className="bg-secondary/60 border-b border-border px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-primary" />
              <div>
                <DialogTitle className="text-sm font-bold text-foreground">
                  Boleta / Ticket Térmico 80mm
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground">
                  Formato estándar para impresoras POS de 80mm
                </DialogDescription>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Vista previa del rollo de 80mm (Aesthetic Receipt) */}
          <div className="flex-1 overflow-y-auto p-4 bg-muted/40 flex justify-center">
            <div 
              id="thermal-80mm-ticket"
              className="w-full max-w-[320px] bg-white text-zinc-950 font-mono text-xs p-4 rounded-xl shadow-md border border-zinc-200 space-y-3 selection:bg-amber-100"
              style={{ fontFamily: 'Courier New, Courier, monospace' }}
            >
              {/* Encabezado */}
              <div className="text-center space-y-1 pb-2 border-b border-dashed border-zinc-400">
                <h3 className="font-black text-sm tracking-widest uppercase">
                  NOVA BOARD GAMES
                </h3>
                <p className="text-[10px] text-zinc-600 font-semibold uppercase">
                  Accesorios & Fabricación 3D
                </p>
                <p className="text-[10px] text-zinc-500">
                  RUC / ID: Sistema de Gestión
                </p>
              </div>

              {/* Datos del Pedido */}
              <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-zinc-400">
                <div className="flex justify-between font-bold">
                  <span>PEDIDO:</span>
                  <span className="text-xs">{pedido.codigo}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>FECHA:</span>
                  <span>{formatDate(pedido.fecha)}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>CANAL:</span>
                  <span>{pedido.canalVenta || 'WhatsApp / Directo'}</span>
                </div>
              </div>

              {/* Datos del Cliente */}
              <div className="text-[11px] space-y-0.5 pb-2 border-b border-dashed border-zinc-400">
                <div>
                  <span className="font-bold">CLIENTE: </span>
                  <span className="uppercase">{pedido.cliente}</span>
                </div>
                {pedido.dni && (
                  <div>
                    <span className="text-zinc-600">DNI/RUC: </span>
                    <span>{pedido.dni}</span>
                  </div>
                )}
                {pedido.telefono && (
                  <div>
                    <span className="text-zinc-600">TELÉFONO: </span>
                    <span>{pedido.telefono}</span>
                  </div>
                )}
                <div>
                  <span className="text-zinc-600">ENTREGA: </span>
                  <span>{pedido.destinoEnvio || 'Recojo en Tienda'}</span>
                </div>
                {pedido.diaEntregaPrometida && (
                  <div className="font-bold text-zinc-800">
                    <span>FECHA ENTREGA: </span>
                    <span>{pedido.diaEntregaPrometida}</span>
                  </div>
                )}
              </div>

              {/* Tabla de Productos */}
              <div className="space-y-1.5 pb-2 border-b border-dashed border-zinc-400">
                <div className="flex justify-between font-bold text-[10px] uppercase border-b border-zinc-300 pb-0.5">
                  <span className="w-10">CANT</span>
                  <span className="flex-1">PRODUCTO</span>
                  <span className="text-right">TOTAL</span>
                </div>

                {pedido.items.map((it, idx) => {
                  const itemColores = (it.colores && it.colores.length > 0)
                    ? it.colores.map(c => c.nombreColor).join(' + ')
                    : (it.colorFilamento ? it.colorFilamento.nombreColor : null)

                  return (
                    <div key={idx} className="text-[11px] leading-tight space-y-0.5">
                      <div className="flex justify-between items-start">
                        <span className="w-8 font-bold">{it.cantidad}x</span>
                        <span className="flex-1 font-semibold pr-2">
                          {it.nombreProductoSnapshot}
                        </span>
                        <span className="font-bold text-right tabular-nums">
                          S/ {it.subtotal.toFixed(2)}
                        </span>
                      </div>
                      {(itemColores || it.personalizacion) && (
                        <div className="pl-8 text-[9px] text-zinc-500 italic">
                          {itemColores && <span>Color: {itemColores} </span>}
                          {it.personalizacion && <span>[{it.personalizacion}]</span>}
                        </div>
                      )}
                    </div>
                  )
                })}

                {pedido.costoEnvio > 0 && (
                  <div className="flex justify-between text-[11px] pt-1">
                    <span className="w-8 font-bold">1x</span>
                    <span className="flex-1 font-semibold">Envío / Flete</span>
                    <span className="font-bold text-right tabular-nums">
                      S/ {pedido.costoEnvio.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {/* Resumen Financiero */}
              <div className="text-[11px] space-y-1 pb-2 border-b border-dashed border-zinc-400">
                <div className="flex justify-between font-bold text-xs pt-0.5">
                  <span>TOTAL A PAGAR:</span>
                  <span className="text-sm">S/ {pedido.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-700">
                  <span>ABONADO ({pedido.metodoPago || 'YAPE'}):</span>
                  <span>S/ {pedido.montoPagado.toFixed(2)}</span>
                </div>

                {pedido.saldoPendiente > 0 ? (
                  <div className="p-1.5 bg-zinc-100 rounded border border-zinc-300 font-bold text-center text-xs mt-1">
                    SALDO PENDIENTE: S/ {pedido.saldoPendiente.toFixed(2)}
                  </div>
                ) : (
                  <div className="p-1 bg-emerald-50 text-emerald-800 rounded font-bold text-center text-[10px] mt-1 border border-emerald-200">
                    ✓ PEDIDO 100% CANCELADO
                  </div>
                )}
              </div>

              {/* Notas especiales */}
              {pedido.notas && (
                <div className="text-[10px] bg-zinc-50 p-1.5 rounded border border-zinc-200">
                  <span className="font-bold">Nota: </span>
                  <span>{pedido.notas}</span>
                </div>
              )}

              {/* Pie de Ticket */}
              <div className="text-center pt-2 space-y-1">
                <div className="font-mono text-[9px] tracking-widest text-zinc-400">
                  ||||| ||||||| |||| |||||||||||
                </div>
                <p className="text-[10px] font-bold uppercase text-zinc-700">
                  ¡Gracias por tu compra!
                </p>
                <p className="text-[9px] text-zinc-500">
                  Fabricado con precisión para gamers
                </p>
              </div>
            </div>
          </div>

          {/* Footer de Acciones del Modal */}
          <div className="bg-secondary/60 border-t border-border p-3.5 sm:px-4 sm:py-3 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyText}
                className="text-xs font-semibold gap-1.5 cursor-pointer rounded-xl h-10 sm:h-9 flex-1 sm:flex-none justify-center active:scale-95 transition-transform"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Texto'}</span>
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-xs font-semibold rounded-xl cursor-pointer h-10 sm:h-9 px-3 hover:bg-secondary active:scale-95 transition-transform"
              >
                Cerrar
              </Button>
            </div>

            <Button
              type="button"
              size="sm"
              onClick={handlePrint}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs sm:text-xs gap-1.5 rounded-xl cursor-pointer shadow-md shadow-primary/20 h-11 sm:h-9 active:scale-95 transition-transform flex items-center justify-center"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Boleta (80mm)</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
