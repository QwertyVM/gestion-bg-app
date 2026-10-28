'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { 
  Smartphone, 
  Globe, 
  Store, 
  ShoppingBag, 
  MessageCircle, 
  TrendingUp,
  Share2
} from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

function InstagramIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function getChannelIcon(canalName: string) {
  const lower = canalName.toLowerCase()
  if (lower.includes('instagram')) return InstagramIcon
  if (lower.includes('whatsapp')) return MessageCircle
  if (lower.includes('web') || lower.includes('tienda')) return Globe
  if (lower.includes('directo') || lower.includes('comunidad') || lower.includes('amigos')) return Store
  if (lower.includes('recomenda') || lower.includes('boca')) return Share2
  return ShoppingBag
}

const CHANNEL_PALETTE: Record<string, { fill: string; barClass: string; badgeClass: string }> = {
  Instagram: { 
    fill: '#E1306C', 
    barClass: 'bg-rose-500', 
    badgeClass: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20' 
  },
  WhatsApp: { 
    fill: '#10B981', 
    barClass: 'bg-emerald-600', 
    badgeClass: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20' 
  },
  'Directo / Comunidad': { 
    fill: '#6366F1', 
    barClass: 'bg-indigo-600', 
    badgeClass: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20' 
  },
  Recomendación: { 
    fill: '#8B5CF6', 
    barClass: 'bg-violet-600', 
    badgeClass: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20' 
  },
  'Tienda Web': { 
    fill: '#0284C7', 
    barClass: 'bg-sky-600', 
    badgeClass: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20' 
  },
  Feria: { 
    fill: '#F59E0B', 
    barClass: 'bg-amber-600', 
    badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/20' 
  },
  Otros: { 
    fill: '#71717A', 
    barClass: 'bg-zinc-500', 
    badgeClass: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 border-zinc-500/20' 
  }
}

function ChannelTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    const data = payload[0]?.payload || {}
    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border/80 rounded-xl shadow-xl p-3 min-w-[200px] text-xs font-sans">
        <div className="flex items-center justify-between border-b border-border/50 pb-1.5 mb-1.5">
          <span className="font-bold text-foreground">{data.canal}</span>
          <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md bg-indigo-500/10">
            {data.porcentaje.toFixed(0)}%
          </span>
        </div>
        <div className="space-y-1 text-muted-foreground text-[11px]">
          <div className="flex justify-between items-center">
            <span>Facturación:</span>
            <span className="font-mono font-bold text-foreground">{formatCurrency(data.total)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Volumen:</span>
            <span className="font-mono font-medium text-foreground/80">{data.count} pedidos</span>
          </div>
          {data.count > 0 && (
            <div className="flex justify-between items-center pt-1 border-t border-border/40">
              <span>Ticket Promedio:</span>
              <span className="font-mono font-medium text-foreground">
                {formatCurrency(data.total / data.count)}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }
  return null
}

export interface AcquisitionChannelsCardProps {
  ventas: any[]
  ticketPromedio: number
  totalPedidos: number
  className?: string
}

export function AcquisitionChannelsCard({
  ventas = [],
  ticketPromedio,
  totalPedidos,
  className = ''
}: AcquisitionChannelsCardProps) {
  // Procesar canales agrupando por canalVenta
  const canalesData = useMemo(() => {
    const canalesMap: Record<string, { canal: string; total: number; count: number }> = {}
    let totalFacturado = 0

    ventas.forEach((v: any) => {
      const rawCanal = (v.canalVenta || 'Directo / Comunidad').trim()
      let canalKey = rawCanal
      const lower = rawCanal.toLowerCase()
      if (lower.includes('instagram')) canalKey = 'Instagram'
      else if (lower.includes('whatsapp')) canalKey = 'WhatsApp'
      else if (lower.includes('feria')) canalKey = 'Feria'
      else if (lower.includes('tienda') || lower.includes('web')) canalKey = 'Tienda Web'
      else if (lower.includes('recomenda') || lower.includes('boca')) canalKey = 'Recomendación'
      else if (lower.includes('directo') || lower.includes('comunidad') || lower.includes('amigos')) canalKey = 'Directo / Comunidad'

      const monto = Number(v.total || 0)
      if (!canalesMap[canalKey]) {
        canalesMap[canalKey] = { canal: canalKey, total: 0, count: 0 }
      }
      canalesMap[canalKey].total += monto
      canalesMap[canalKey].count += 1
      totalFacturado += monto
    })

    const list = Object.values(canalesMap)
      .map((item) => {
        const palette = CHANNEL_PALETTE[item.canal] || CHANNEL_PALETTE.Otros
        return {
          ...item,
          porcentaje: totalFacturado > 0 ? (item.total / totalFacturado) * 100 : 0,
          fill: palette.fill,
          barClass: palette.barClass,
          badgeClass: palette.badgeClass
        }
      })
      .sort((a, b) => b.total - a.total)

    return {
      list,
      totalFacturado
    }
  }, [ventas])

  const canalLider = canalesData.list[0]

  return (
    <Card className={cn('bg-card border border-border/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between h-full min-h-[420px]', className)}>
      {/* 1. Header */}
      <CardHeader className="p-0 pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-500 shrink-0" />
              <CardTitle className="text-sm font-bold text-foreground tracking-tight">
                Canales de Captación Board Games
              </CardTitle>
            </div>
            <CardDescription className="text-xs text-muted-foreground mt-0.5">
              Concentración de pedidos y rendimiento por canal comercial
            </CardDescription>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 font-mono text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-secondary border border-border/70 text-foreground font-semibold">
              {totalPedidos} {totalPedidos === 1 ? 'pedido' : 'pedidos'}
            </span>
          </div>
        </div>
      </CardHeader>

      {/* 2. Contenido Principal */}
      <CardContent className="p-0 pt-4 flex-1 flex flex-col justify-between space-y-4">
        {canalesData.list.length === 0 ? (
          <div className="py-12 text-center text-xs text-muted-foreground italic space-y-2">
            <ShoppingBag className="h-8 w-8 text-muted-foreground/30 mx-auto" />
            <p>Sin pedidos ni canales registrados en este período.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Lado Izquierdo: Gráfico Donut (5 cols) */}
            <div className="md:col-span-5 flex flex-col items-center justify-center relative">
              <div className="w-[180px] h-[180px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<ChannelTooltip />} />
                    <Pie
                      data={canalesData.list}
                      dataKey="total"
                      nameKey="canal"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      cornerRadius={4}
                      stroke="var(--color-card)"
                      strokeWidth={2}
                    >
                      {canalesData.list.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                {/* Texto Central de la Dona */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                  <span className="text-lg font-black font-mono text-foreground leading-none">
                    {canalLider ? `${canalLider.porcentaje.toFixed(0)}%` : '0%'}
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground tracking-tight mt-0.5 truncate max-w-[85px]">
                    {canalLider?.canal || 'Canal'}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-muted-foreground font-medium text-center mt-1">
                Canal principal: <strong className="text-foreground">{canalLider?.canal}</strong>
              </div>
            </div>

            {/* Lado Derecho: Desglose por Canal con Métricas Detalladas (7 cols) */}
            <div className="md:col-span-7 space-y-2.5">
              {canalesData.list.map((item) => {
                const Icon = getChannelIcon(item.canal)
                const avgTicket = item.count > 0 ? item.total / item.count : 0

                return (
                  <div
                    key={item.canal}
                    className="p-2.5 rounded-xl bg-secondary/30 hover:bg-secondary/60 border border-border/50 transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.fill }}
                        />
                        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="font-bold text-foreground truncate">{item.canal}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          ({item.count} {item.count === 1 ? 'ped' : 'peds'})
                        </span>
                        {avgTicket > 0 && (
                          <span className="text-[10px] text-muted-foreground/75 font-mono hidden xl:inline shrink-0">
                            (~ {formatCurrency(avgTicket)})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0 font-mono">
                        <span className="font-bold text-foreground">{formatCurrency(item.total)}</span>
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-md min-w-[36px] text-right border', item.badgeClass)}>
                          {item.porcentaje.toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    {/* Barra de progreso sutil */}
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-500', item.barClass)}
                        style={{ width: `${Math.max(3, Math.min(100, item.porcentaje))}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* 3. Footer */}
        <div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Ticket Promedio General: <strong className="text-foreground font-mono">{formatCurrency(ticketPromedio)}</strong></span>
          </div>
          <div className="font-mono text-[11px]">
            Total: <strong className="text-foreground">{formatCurrency(canalesData.totalFacturado)}</strong>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
