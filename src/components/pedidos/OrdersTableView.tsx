'use client'

import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Boxes,
  Calendar,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Share2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Clock,
  CheckCircle2,
  Package,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PedidoView } from './PedidosClient'
import { EstadoPedido } from '@prisma/client'

export interface EstadoConfigOption {
  value: EstadoPedido
  label: string
  badgeClass: string
  dotClass: string
}

export const ESTADOS_DISPONIBLES: EstadoConfigOption[] = [
  {
    value: 'PENDIENTE',
    label: 'Pendiente',
    badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/20',
    dotClass: 'bg-amber-500'
  },
  {
    value: 'EN_PRODUCCION',
    label: 'Preparando',
    badgeClass: 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/20 hover:bg-sky-500/20',
    dotClass: 'bg-sky-500'
  },
  {
    value: 'LISTO_ENTREGA',
    label: 'Por Entregar',
    badgeClass: 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/20 hover:bg-yellow-500/20',
    dotClass: 'bg-yellow-500'
  },
  {
    value: 'ENTREGADO',
    label: 'Entregado',
    badgeClass: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20',
    dotClass: 'bg-emerald-600'
  },
  {
    value: 'PAGO_VALIDADO',
    label: 'Pago Validado',
    badgeClass: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20',
    dotClass: 'bg-emerald-600'
  },
  {
    value: 'CANCELADO',
    label: 'Cancelado',
    badgeClass: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20',
    dotClass: 'bg-destructive'
  }
]

export const estadoClasses: Record<EstadoPedido, string> = {
  PENDIENTE: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/20 hover:bg-amber-500/20',
  PAGO_VALIDADO: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20',
  EN_PRODUCCION: 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border-sky-500/20 hover:bg-sky-500/20',
  LISTO_ENTREGA: 'bg-yellow-500/10 text-yellow-800 dark:text-yellow-300 border-yellow-500/20 hover:bg-yellow-500/20',
  ENTREGADO: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/20',
  CANCELADO: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20'
}

export const dotClasses: Record<EstadoPedido, string> = {
  PENDIENTE: 'bg-amber-500',
  PAGO_VALIDADO: 'bg-emerald-600',
  EN_PRODUCCION: 'bg-sky-500',
  LISTO_ENTREGA: 'bg-yellow-500',
  ENTREGADO: 'bg-emerald-600',
  CANCELADO: 'bg-destructive'
}

export const estadoLabels: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  PAGO_VALIDADO: 'Pago Validado',
  EN_PRODUCCION: 'Preparando',
  LISTO_ENTREGA: 'Por Entregar',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado'
}

export const ESTADOS_CONFIG: Record<EstadoPedido, { label: string; badgeClass: string; icon: any }> = {
  PENDIENTE: {
    label: 'Pendiente',
    badgeClass: estadoClasses.PENDIENTE,
    icon: Clock
  },
  PAGO_VALIDADO: {
    label: 'Pago Validado',
    badgeClass: estadoClasses.PAGO_VALIDADO,
    icon: CheckCircle2
  },
  EN_PRODUCCION: {
    label: 'Preparando',
    badgeClass: estadoClasses.EN_PRODUCCION,
    icon: Package
  },
  LISTO_ENTREGA: {
    label: 'Por Entregar',
    badgeClass: estadoClasses.LISTO_ENTREGA,
    icon: Package
  },
  ENTREGADO: {
    label: 'Entregado',
    badgeClass: estadoClasses.ENTREGADO,
    icon: CheckCircle2
  },
  CANCELADO: {
    label: 'Cancelado',
    badgeClass: estadoClasses.CANCELADO,
    icon: X
  }
}

export type SortFieldType = 'fecha' | 'codigo' | 'cliente' | 'cantidad' | 'total' | 'saldoPendiente' | 'estado'

export function OrderStatusDropdown({
  pedido,
  onCambiarEstado
}: {
  pedido: PedidoView
  onCambiarEstado: (pedidoId: string, nuevoEstado: EstadoPedido) => void
}) {
  return (
    <div onClick={(e) => e.stopPropagation()} className="inline-block">
      <DropdownMenu>
        <DropdownMenuTrigger
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "h-7 px-2.5 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold border shadow-2xs transition-all hover:scale-[1.02] active:scale-95 cursor-pointer outline-hidden group",
            estadoClasses[pedido.estado] || estadoClasses.PENDIENTE
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotClasses[pedido.estado] || dotClasses.PENDIENTE)} />
          <span>{estadoLabels[pedido.estado] || pedido.estado}</span>
          <ChevronDown className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity ml-0.5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-44 p-1 rounded-xl bg-popover border border-border shadow-lg z-50">
          {ESTADOS_DISPONIBLES.map((opcion) => (
            <DropdownMenuItem
              key={opcion.value}
              onClick={(e) => {
                e.stopPropagation()
                onCambiarEstado(pedido.id, opcion.value)
              }}
              className="flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium rounded-lg cursor-pointer hover:bg-secondary/60 transition-colors"
            >
              <span className={cn("w-2 h-2 rounded-full", opcion.dotClass)} />
              <span className="text-foreground">{opcion.label}</span>
              {pedido.estado === opcion.value && (
                <Check className="w-3 h-3 text-primary ml-auto" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

interface OrdersTableViewProps {
  pedidos: PedidoView[]
  sortField: SortFieldType
  sortOrder: 'asc' | 'desc'
  onSort: (field: SortFieldType) => void
  onSelectPedido: (pedido: PedidoView) => void
  onCambiarEstado: (pedidoId: string, nuevoEstado: EstadoPedido) => void
  onEditPedido: (pedido: PedidoView) => void
  onEliminarPedido: (id: string, codigo: string) => void
  onCopyWhatsApp: (pedido: PedidoView) => void
  formatCurrency: (val: number) => string
  formatDate: (val: string | Date | null | undefined) => string
  currentPage: number
  totalPages: number
  itemsPerPage: number
  totalItems: number
  onPageChange: (page: number) => void
  onItemsPerPageChange: (items: number) => void
}

export function OrdersTableView({
  pedidos,
  sortField,
  sortOrder,
  onSort,
  onSelectPedido,
  onCambiarEstado,
  onEditPedido,
  onEliminarPedido,
  onCopyWhatsApp,
  formatCurrency,
  formatDate,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange
}: OrdersTableViewProps) {
  const renderSortIndicator = (field: SortFieldType) => {
    if (sortField === field) {
      return sortOrder === 'asc' ? (
        <ArrowUp className="h-3 w-3 text-primary shrink-0" />
      ) : (
        <ArrowDown className="h-3 w-3 text-primary shrink-0" />
      )
    }
    return <ArrowUpDown className="h-3 w-3 text-muted-foreground/40 shrink-0" />
  }

  return (
    <div className="w-full bg-card border border-border rounded-xl shadow-2xs overflow-hidden">
      {pedidos.length === 0 ? (
        <div className="p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center text-muted-foreground mb-3">
            <Boxes className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-base font-extrabold text-foreground">No se encontraron pedidos</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            No hay pedidos que coincidan con los filtros seleccionados o el término de búsqueda.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-hidden">
          <Table className="w-full table-fixed">
            <colgroup>
              <col className="w-[13%]" />
              <col className="w-[18%]" />
              <col className="w-[24%]" />
              <col className="w-[15%]" />
              <col className="w-[14%]" />
              <col className="w-[16%]" />
            </colgroup>

            <TableHeader className="bg-secondary/40 border-b border-border">
              <TableRow className="border-border hover:bg-transparent">
                {/* 1. PEDIDO */}
                <TableHead className="w-[13%] pl-5 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => onSort('fecha')}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>PEDIDO</span>
                    {renderSortIndicator('fecha')}
                  </button>
                </TableHead>

                {/* 2. CLIENTE */}
                <TableHead className="w-[18%] px-3 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => onSort('cliente')}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>CLIENTE</span>
                    {renderSortIndicator('cliente')}
                  </button>
                </TableHead>

                {/* 3. PRODUCTOS */}
                <TableHead className="w-[24%] px-3 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => onSort('cantidad')}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>PRODUCTOS</span>
                    {renderSortIndicator('cantidad')}
                  </button>
                </TableHead>

                {/* 4. ENTREGA & DESTINO */}
                <TableHead className="w-[15%] px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  ENTREGA & DESTINO
                </TableHead>

                {/* 5. ESTADO */}
                <TableHead className="w-[14%] px-4 py-3 text-left">
                  <button
                    type="button"
                    onClick={() => onSort('estado')}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>ESTADO</span>
                    {renderSortIndicator('estado')}
                  </button>
                </TableHead>

                {/* 6. TOTAL & ACCIONES */}
                <TableHead className="w-[16%] pr-5 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onSort('total')}
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors cursor-pointer ml-auto"
                  >
                    <span>TOTAL & ACCIONES</span>
                    {renderSortIndicator('total')}
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {pedidos.map((p) => {
                const isFullyPaid = p.saldoPendiente <= 0
                const primaryItem = p.items[0]
                const productImg = primaryItem?.producto?.imagenUrl

                return (
                  <TableRow
                    key={p.id}
                    onClick={() => onSelectPedido(p)}
                    className="border-b border-border/60 hover:bg-secondary/40 transition-colors cursor-pointer group"
                  >
                    {/* Columna 1: PEDIDO (13% / text-left pl-5) */}
                    <TableCell className="w-[13%] pl-5 py-3.5 align-middle text-left">
                      <div className="flex flex-col items-start min-w-0">
                        {/* Fila 1: Chip mono con código */}
                        <span className="bg-accent text-accent-foreground font-mono font-extrabold text-xs px-2.5 py-1 rounded-lg border border-border/80 w-fit inline-block tracking-tight shadow-2xs">
                          {p.codigo}
                        </span>
                        {/* Fila 2: Fecha de registro */}
                        <span className="text-[11px] text-muted-foreground mt-1 truncate">
                          {formatDate(p.fecha)}
                        </span>
                        {/* Fila 3: Chip canal de venta */}
                        <span className="text-[10px] font-semibold bg-secondary border border-border/70 text-foreground px-2 py-0.5 rounded-md w-fit mt-1 truncate">
                          {p.canalVenta || 'Directo'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Columna 2: CLIENTE (18% / text-left px-3) */}
                    <TableCell className="w-[18%] px-3 py-3.5 align-middle text-left">
                      <div className="flex flex-col items-start min-w-0">
                        {/* Fila 1: Nombre completo uniforme sin tintes extra */}
                        <span className="text-sm font-bold text-foreground leading-snug break-words">
                          {p.cliente}
                        </span>
                        {/* Fila 2: Documento o contacto */}
                        <span className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                          {p.dni ? `DNI: ${p.dni}` : p.telefono ? `Tel: ${p.telefono}` : 'Sin documento'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Columna 3: PRODUCTOS (24% / text-left px-3) */}
                    <TableCell className="w-[24%] px-3 py-3.5 align-middle text-left">
                      <div className="flex items-center min-w-0">
                        {/* Miniatura */}
                        <div className="w-9 h-9 rounded-lg border border-border/70 bg-secondary/50 shrink-0 mr-2.5 flex items-center justify-center overflow-hidden">
                          {productImg ? (
                            <img
                              src={productImg}
                              alt={primaryItem?.nombreProductoSnapshot || 'Producto'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Boxes className="w-4 h-4 text-primary" />
                          )}
                        </div>

                        {/* Texto (Zero Truncation, hasta dos líneas completas) */}
                        <div className="flex flex-col min-w-0 flex-1">
                          <span
                            className="text-xs font-bold text-foreground leading-snug line-clamp-2 uppercase"
                            title={p.items.map(it => `${it.nombreProductoSnapshot} (x${it.cantidad})`).join(', ')}
                          >
                            {primaryItem?.nombreProductoSnapshot || 'Sin productos'}
                            {p.items.length > 1 && (
                              <span className="text-[10px] text-muted-foreground font-normal ml-1 lowercase">
                                (+{p.items.length - 1} más)
                              </span>
                            )}
                          </span>
                          <span className="text-[11px] text-muted-foreground mt-0.5">
                            {p.totalItemsCount} {p.totalItemsCount === 1 ? 'unidad' : 'unidades'}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    {/* Columna 4: ENTREGA & DESTINO (15% / text-left px-4) */}
                    <TableCell className="w-[15%] px-4 py-3.5 align-middle text-left">
                      <div className="flex flex-col items-start min-w-0 text-xs">
                        {/* Fila 1: Fecha pactada con ícono Calendar */}
                        {p.diaEntregaPrometida ? (
                          <div className="flex items-center gap-1 text-xs font-medium text-foreground truncate">
                            <Calendar className="h-3 w-3 text-primary shrink-0" />
                            <span className="truncate">{p.diaEntregaPrometida}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs italic text-muted-foreground/60">
                            <Calendar className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                            <span>Sin programar</span>
                          </div>
                        )}

                        {/* Fila 2: Destino de entrega */}
                        <span className="text-[11px] text-muted-foreground mt-0.5 truncate max-w-full">
                          {p.destinoEnvio || 'Tienda'}
                        </span>
                      </div>
                    </TableCell>

                    {/* Columna 5: ESTADO (14% / text-left px-4) */}
                    <TableCell
                      className="w-[14%] px-4 py-3.5 align-middle text-left"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <OrderStatusDropdown
                        pedido={p}
                        onCambiarEstado={onCambiarEstado}
                      />
                    </TableCell>

                    {/* Columna 6: TOTAL & ACCIONES (16% / text-right pr-5) */}
                    <TableCell className="w-[16%] pr-5 py-3.5 align-middle text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <div className="flex flex-col items-end min-w-0 justify-center">
                          {/* Monto principal */}
                          <span className="font-mono text-sm font-extrabold text-foreground truncate tabular-nums leading-tight">
                            {formatCurrency(p.total)}
                          </span>

                          {/* Estado contable debajo */}
                          <div className="text-[11px] font-semibold mt-1 truncate leading-tight">
                            {isFullyPaid ? (
                              <span className="text-emerald-800 dark:text-emerald-300">
                                ✓ 100% Pagado
                              </span>
                            ) : p.montoPagado > 0 ? (
                              <span className="text-amber-800 dark:text-amber-300">
                                Resta {formatCurrency(p.saldoPendiente)}
                              </span>
                            ) : (
                              <span className="text-destructive font-semibold">
                                Sin anticipo
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Botón de menú de acciones ••• */}
                        <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              onClick={(e) => e.stopPropagation()}
                              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors flex items-center justify-center cursor-pointer outline-none border border-transparent hover:border-border/60"
                              title="Más acciones"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acciones</span>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                              align="end"
                              className="w-52 bg-card border border-border rounded-xl shadow-lg p-1 z-50"
                            >
                              <DropdownMenuItem
                                onClick={() => onSelectPedido(p)}
                                className="flex items-center gap-2 text-xs font-semibold px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                              >
                                <Eye className="h-3.5 w-3.5 text-primary" />
                                <span>Ver Detalle / Ticket</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => onEditPedido(p)}
                                className="flex items-center gap-2 text-xs font-semibold px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                              >
                                <Pencil className="h-3.5 w-3.5 text-primary" />
                                <span>Editar Pedido</span>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => onCopyWhatsApp(p)}
                                className="flex items-center gap-2 text-xs font-semibold px-2.5 py-2 cursor-pointer rounded-lg hover:bg-secondary text-foreground"
                              >
                                <Share2 className="h-3.5 w-3.5 text-emerald-700 dark:text-emerald-400" />
                                <span>Copiar Resumen WhatsApp</span>
                              </DropdownMenuItem>

                              <DropdownMenuSeparator className="my-1 bg-border/60" />

                              <DropdownMenuItem
                                onClick={() => onEliminarPedido(p.id, p.codigo)}
                                className="flex items-center gap-2 text-xs font-semibold px-2.5 py-2 cursor-pointer rounded-lg hover:bg-destructive/10 text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                <span>Eliminar Pedido</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Paginación Unificada en el Footer del Contenedor de la Tabla */}
      {totalItems > 0 && (
        <div className="p-3.5 sm:p-4 bg-secondary/30 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-muted-foreground font-medium">
              Mostrando{' '}
              <strong className="text-foreground">
                {itemsPerPage === 9999 ? 1 : (currentPage - 1) * itemsPerPage + 1}
              </strong>{' '}
              a{' '}
              <strong className="text-foreground">
                {itemsPerPage === 9999 ? totalItems : Math.min(currentPage * itemsPerPage, totalItems)}
              </strong>{' '}
              de <strong className="text-foreground">{totalItems}</strong> pedidos
            </span>

            {/* Selector de filas por página */}
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-[11px]">Por pág:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="h-7 px-2 rounded-lg border border-input bg-background text-[11px] font-semibold text-foreground cursor-pointer focus:outline-none"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={9999}>Todos</option>
              </select>
            </div>
          </div>

          {itemsPerPage !== 9999 && totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                className="h-8 px-2.5 rounded-xl border-border bg-card text-foreground font-bold text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1 hover:bg-secondary"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Anterior</span>
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                    currentPage === page
                      ? 'bg-foreground text-background shadow-xs'
                      : 'bg-card text-muted-foreground hover:bg-secondary hover:text-foreground border border-border'
                  }`}
                >
                  {page}
                </button>
              ))}

              <Button
                size="sm"
                variant="outline"
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                className="h-8 px-2.5 rounded-xl border-border bg-card text-foreground font-bold text-xs disabled:opacity-40 cursor-pointer flex items-center gap-1 hover:bg-secondary"
              >
                <span>Siguiente</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
