'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { 
  ArrowRight, 
  Clock,
  AlertCircle,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Dices,
  PackageCheck
} from 'lucide-react'
import { cn, formatCurrency, formatClienteNombre } from '@/lib/utils'

interface OperationalPulseBarProps {
  pedidos: any[]
  productos?: any[]
  onOpenClienteDrawer?: (cliente: string) => void
  className?: string
}

export function OperationalPulseBar({
  pedidos = [],
  productos = [],
  onOpenClienteDrawer,
  className
}: OperationalPulseBarProps) {
  const [showDrawer, setShowDrawer] = useState<'urgencias' | 'postventa' | null>(null)

  // 1. Conteo de pedidos por estado en operaciones Board Games
  const { pedidosPendientes, pedidosEnPreparacion, pedidosListos, pedidosEntregados } = useMemo(() => {
    let pendientes = 0
    let enPrep = 0
    let listos = 0
    let entregados = 0

    pedidos.forEach(p => {
      if (p.estado === 'CANCELADO') return
      if (p.estado === 'ENTREGADO') {
        entregados++
        return
      }
      if (p.estado === 'LISTO_ENTREGA') {
        listos++
      } else if (p.estado === 'EN_PRODUCCION' || p.estado === 'PAGO_VALIDADO') {
        enPrep++
      } else {
        pendientes++
      }
    })

    return {
      pedidosPendientes: pendientes,
      pedidosEnPreparacion: enPrep,
      pedidosListos: listos,
      pedidosEntregados: entregados
    }
  }, [pedidos])

  // 2. Alertas de stock crítico en catálogo de juegos
  const { criticosCount } = useMemo(() => {
    if (!productos.length) return { criticosCount: 0 }
    let crit = 0
    productos.forEach((p: any) => {
      const stock = Number(p.stock || 0)
      if (p.activo && stock <= 2) {
        crit++
      }
    })
    return { criticosCount: crit }
  }, [productos])

  // 3. Pedidos con saldo pendiente listos para despacho
  const pedidosCobroPreDespacho = useMemo(() => {
    return pedidos.filter(p => {
      if (p.estado === 'ENTREGADO' || p.estado === 'CANCELADO') return false
      const saldo = Number(p.saldoPendiente || 0)
      return (p.estado === 'LISTO_ENTREGA' || p.estado === 'EN_PRODUCCION' || p.estado === 'PENDIENTE') && saldo > 0
    })
  }, [pedidos])

  const getWhatsAppCobroUrl = (p: any) => {
    const cleanPhone = (p.telefono || '').replace(/\D/g, '')
    const fullPhone = cleanPhone.startsWith('51') ? cleanPhone : `51${cleanPhone}`
    const saldo = Number(p.saldoPendiente || 0).toFixed(2)
    const text = encodeURIComponent(
      `¡Hola ${formatClienteNombre(p.cliente)}! Te escribimos de NOVA Board Games 🎲.\nTu pedido #${p.codigo} está en proceso/listo para entrega.\n\nEl saldo pendiente a cancelar es de S/ ${saldo}. Por favor compártenos tu constancia de pago para agendar el envío. ¡Muchas gracias!`
    )
    return `https://wa.me/${fullPhone}?text=${text}`
  }

  return (
    <div className={cn('bg-card/70 border border-border/40 rounded-xl overflow-hidden shadow-2xs backdrop-blur-xs transition-all', className)}>
      {/* Cinta Principal en 1 sola línea minimalista */}
      <div className="px-3.5 sm:px-4 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        {/* Lado Izquierdo: Pulso Operativo Board Games */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
          <span className="font-semibold text-foreground tracking-tight">Operaciones BG:</span>
          
          <div className="flex items-center gap-1.5 text-muted-foreground font-mono text-[11px] flex-wrap">
            <span className="text-foreground font-semibold">{pedidosPendientes} por validar</span>
            <span>·</span>
            <span>{pedidosEnPreparacion} en preparación</span>
            <span>·</span>
            <span>{pedidosListos} p/ despacho</span>
            <span>·</span>
            <span className={criticosCount > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-muted-foreground'}>
              {criticosCount > 0 ? `${criticosCount} títulos stock bajo` : 'Stock juegos OK'}
            </span>
          </div>
        </div>

        {/* Lado Derecho: Acciones Urgentes & Acceso Rápido */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          {pedidosCobroPreDespacho.length > 0 && (
            <button
              type="button"
              onClick={() => setShowDrawer(showDrawer === 'urgencias' ? null : 'urgencias')}
              className="inline-flex items-center gap-1 text-[11px] font-mono font-medium text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
            >
              <AlertCircle className="w-3 h-3" />
              <span>{pedidosCobroPreDespacho.length} cobro pendiente</span>
              {showDrawer === 'urgencias' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          <Link
            href="/pedidos"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors group"
          >
            <span>Ver pedidos</span>
            <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Drawer Desplegable: Cobros Pre-Despacho */}
      {showDrawer === 'urgencias' && pedidosCobroPreDespacho.length > 0 && (
        <div className="border-t border-border/30 bg-muted/20 px-3.5 sm:px-4 py-2.5 text-xs">
          <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border/20">
            <span className="font-semibold text-foreground text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              Pedidos con Saldo Pendiente ({pedidosCobroPreDespacho.length}):
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">
              Total por cobrar: {formatCurrency(pedidosCobroPreDespacho.reduce((s, p) => s + Number(p.saldoPendiente || 0), 0))}
            </span>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {pedidosCobroPreDespacho.map((p: any) => (
              <div 
                key={p.id || p.codigo}
                className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-card border border-border/30 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-mono text-[10px] font-bold text-foreground">
                    #{p.codigo}
                  </span>
                  <span className="text-[11px] text-muted-foreground truncate">
                    {formatClienteNombre(p.cliente)}
                  </span>
                  <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
                    Resta: {formatCurrency(Number(p.saldoPendiente || 0))}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {p.telefono && (
                    <a
                      href={getWhatsAppCobroUrl(p)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20 transition-colors"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>WhatsApp Cobro</span>
                    </a>
                  )}
                  {onOpenClienteDrawer && (
                    <button
                      type="button"
                      onClick={() => onOpenClienteDrawer(p.cliente)}
                      className="px-2 py-0.5 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    >
                      Ficha
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
