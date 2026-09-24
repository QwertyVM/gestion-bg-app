'use server'

import prisma from '@/lib/prisma'
import { EstadoPedido, TipoPrecio } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { ajustarStockBobina } from '@/actions/inventario'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

function safeRevalidate() {
  try {
    revalidatePath('/pedidos')
    revalidatePath('/ventas')
    revalidatePath('/finanzas')
    revalidatePath('/finanzas/flujo-caja')
    revalidatePath('/finanzas/cierres')
    revalidatePath('/finanzas/caja-chica')
    revalidatePath('/finanzas/proyecciones')
    revalidatePath('/finanzas/balance')
    revalidatePath('/historico-mensual')
    revalidatePath('/flujo-mensual')
    revalidatePath('/inventario')
    revalidatePath('/catalogo/inventario')
    revalidatePath('/')
  } catch (e) {
    // Ignore outside request store
  }
}

export interface ItemPedidoInput {
  productoId: string
  colorFilamentoId?: string | null
  coloresIds?: string[]
  personalizacion?: string | null
  cantidad: number
  tipoPrecio: TipoPrecio
  precioUnitario: number
  costoPackaging?: number
  porcentajeAdicional?: number
  gramosConsumidos?: number
}

export interface CreatePedidoInput {
  negocio?: TipoNegocio
  cliente: string
  dni?: string | null
  telefono?: string | null
  canalVenta?: string | null
  destinoEnvio?: string | null
  diaEntregaPrometida?: string | null
  notas?: string | null
  costoEnvio?: number
  items: ItemPedidoInput[]
  montoPagado?: number
  metodoPago?: string
  notasPago?: string
  fecha?: string | Date
  descontarStock?: boolean
}

function serializePedido(p: any, filamentosMap?: Map<string, any>) {
  const items = Array.isArray(p.items) ? p.items.map((it: any) => {
    const rawColoresIds: string[] = Array.isArray(it.coloresIds) && it.coloresIds.length > 0
      ? it.coloresIds
      : (it.colorFilamentoId ? [it.colorFilamentoId] : [])

    const resolvedColores = rawColoresIds.map(id => {
      if (filamentosMap && filamentosMap.has(id)) {
        const f = filamentosMap.get(id)
        return {
          id: f.id,
          nombreColor: f.nombreColor,
          numeroBobina: f.numeroBobina || 1,
          codigoHex: f.codigoHex || '#1E1E1E',
          tipoMaterial: f.tipoMaterial,
          marca: f.marca || 'Genérica',
          stockGramos: f.stockGramos ? Number(f.stockGramos) : 0,
          stockBobinas: Number(f.stockBobinas || 1)
        }
      }
      if (it.colorFilamento && it.colorFilamento.id === id) {
        return {
          id: it.colorFilamento.id,
          nombreColor: it.colorFilamento.nombreColor,
          numeroBobina: it.colorFilamento.numeroBobina || 1,
          codigoHex: it.colorFilamento.codigoHex || '#1E1E1E',
          tipoMaterial: it.colorFilamento.tipoMaterial,
          marca: it.colorFilamento.marca || 'Genérica',
          stockGramos: it.colorFilamento.stockGramos ? Number(it.colorFilamento.stockGramos) : 0,
          stockBobinas: Number(it.colorFilamento.stockBobinas || 1)
        }
      }
      return null
    }).filter(Boolean)

    const primaryColorFilamento = resolvedColores[0] || (it.colorFilamento ? {
      id: it.colorFilamento.id,
      nombreColor: it.colorFilamento.nombreColor,
      numeroBobina: it.colorFilamento.numeroBobina || 1,
      codigoHex: it.colorFilamento.codigoHex || '#1E1E1E',
      tipoMaterial: it.colorFilamento.tipoMaterial,
      marca: it.colorFilamento.marca || 'Genérica',
      stockGramos: it.colorFilamento.stockGramos ? Number(it.colorFilamento.stockGramos) : 0,
      stockBobinas: Number(it.colorFilamento.stockBobinas || 1)
    } : null)

    return {
      id: it.id,
      pedidoId: it.pedidoId,
      productoId: it.productoId,
      nombreProductoSnapshot: it.nombreProductoSnapshot || it.producto?.nombreModelo || '',
      costoBaseSnapshot: it.costoBaseSnapshot != null ? Number(it.costoBaseSnapshot) : (it.producto ? Number(it.producto.costoBase) : 0),
      colorFilamentoId: it.colorFilamentoId || rawColoresIds[0] || null,
      coloresIds: rawColoresIds,
      colores: resolvedColores.length > 0 ? resolvedColores : (primaryColorFilamento ? [primaryColorFilamento] : []),
      personalizacion: it.personalizacion || null,
      cantidad: Number(it.cantidad),
      tipoPrecio: it.tipoPrecio,
      precioUnitario: Number(it.precioUnitario),
      costoPackaging: it.costoPackaging != null ? Number(it.costoPackaging) : 0,
      porcentajeAdicional: it.porcentajeAdicional != null ? Number(it.porcentajeAdicional) : 0,
      gramosConsumidos: it.gramosConsumidos != null ? Number(it.gramosConsumidos) : 0,
      subtotal: Number(it.subtotal),
      estado: (it.estado || p.estado) as EstadoPedido,
      createdAt: it.createdAt instanceof Date ? it.createdAt.toISOString() : String(it.createdAt),
      updatedAt: it.updatedAt instanceof Date ? it.updatedAt.toISOString() : String(it.updatedAt),
      producto: it.producto ? {
        id: it.producto.id,
        lineaCategoria: it.producto.lineaCategoria,
        nombreModelo: it.producto.nombreModelo,
        costoBase: Number(it.producto.costoBase),
        precioAmigos: Number(it.producto.precioAmigos),
        precioMercado: Number(it.producto.precioMercado),
        precioComunidad: Number(it.producto.precioComunidad),
        pesoGramos: it.producto.pesoGramos != null ? Number(it.producto.pesoGramos) : 0,
        activo: it.producto.activo
      } : null,
      colorFilamento: primaryColorFilamento
    }
  }) : []

  const pagos = Array.isArray(p.pagos) ? p.pagos.map((pg: any) => ({
    id: pg.id,
    pedidoId: pg.pedidoId,
    fecha: pg.fecha instanceof Date ? pg.fecha.toISOString() : String(pg.fecha),
    monto: Number(pg.monto),
    metodoPago: pg.metodoPago || 'YAPE',
    tipo: pg.tipo || 'ANTICIPO',
    notas: pg.notas || null,
    createdAt: pg.createdAt instanceof Date ? pg.createdAt.toISOString() : String(pg.createdAt),
    updatedAt: pg.updatedAt instanceof Date ? pg.updatedAt.toISOString() : String(pg.updatedAt)
  })) : []

  return {
    id: p.id,
    codigo: p.codigo,
    fecha: p.fecha instanceof Date ? p.fecha.toISOString() : String(p.fecha),
    cliente: p.cliente,
    dni: p.dni || null,
    telefono: p.telefono || null,
    canalVenta: p.canalVenta || null,
    destinoEnvio: p.destinoEnvio || null,
    diaEntregaPrometida: p.diaEntregaPrometida || null,
    notas: p.notas || null,
    metodoPago: (() => {
      if (p.metodoPago) return p.metodoPago
      if (p.notas) {
        const match = p.notas.match(/M[eé]todo de pago:\s*([A-Za-z0-9_\-]+)/i)
        if (match) return match[1]
      }
      if (pagos.length > 0 && pagos[0].metodoPago) return pagos[0].metodoPago
      return 'YAPE'
    })(),
    estado: p.estado as EstadoPedido,
    costoEnvio: Number(p.costoEnvio || 0),
    subtotal: Number(p.subtotal || 0),
    total: Number(p.total || 0),
    montoPagado: Number(p.montoPagado || 0),
    saldoPendiente: Number(p.saldoPendiente || 0),
    items,
    pagos,
    totalItemsCount: items.reduce((sum: number, it: any) => sum + it.cantidad, 0),
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt)
  }
}

export async function getPedidos(negocio?: TipoNegocio) {
  try {
    const targetNegocio = negocio || await getActiveNegocioServer()

    const [pedidos, allFilamentos] = await Promise.all([
      prisma.pedido.findMany({
        where: { negocio: targetNegocio },
        include: {
          items: {
            include: {
              producto: true,
              colorFilamento: true
            }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          }
        },
        orderBy: { fecha: 'desc' }
      }),
      prisma.inventarioFilamento.findMany()
    ])

    const filMap = new Map(allFilamentos.map(f => [f.id, f]))
    return pedidos.map(p => serializePedido(p, filMap))
  } catch (error) {
    console.error('Error fetching pedidos:', error)
    return []
  }
}

export async function getPedidoById(id: string) {
  try {
    const [pedido, allFilamentos] = await Promise.all([
      prisma.pedido.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              producto: true,
              colorFilamento: true
            }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          }
        }
      }),
      prisma.inventarioFilamento.findMany()
    ])

    if (!pedido) return null
    const filMap = new Map(allFilamentos.map(f => [f.id, f]))
    return serializePedido(pedido, filMap)
  } catch (error) {
    console.error(`Error fetching pedido ${id}:`, error)
    return null
  }
}

async function generateNextCodigoPedido(negocio: TipoNegocio = '3D'): Promise<string> {
  const prefix = negocio === 'BG' ? 'BG' : 'PED'
  const count = await prisma.pedido.count({
    where: { negocio }
  })
  const nextNum = count + 1
  return `${prefix}-${String(nextNum).padStart(3, '0')}`
}

function parseDateInput(fecha?: string | Date) {
  if (!fecha) return new Date()
  if (fecha instanceof Date) return fecha
  if (typeof fecha === 'string') {
    if (fecha.includes('T')) return new Date(fecha)
    const [year, month, day] = fecha.split('-').map(Number)
    if (year && month && day) {
      const target = new Date()
      target.setFullYear(year, month - 1, day)
      return target
    }
    return new Date(fecha)
  }
  return new Date(fecha)
}

export async function createPedido(data: CreatePedidoInput) {
  try {
    const targetNegocio = data.negocio || await getActiveNegocioServer()

    if (!data.cliente || !data.cliente.trim()) {
      return { success: false, error: 'El nombre del cliente es obligatorio' }
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return { success: false, error: 'Debes agregar al menos 1 producto al pedido' }
    }

    // 1. Fetch product snapshots to ensure accurate pricing and costs
    const productIds = data.items.map(i => i.productoId)
    const productosDb = await prisma.producto.findMany({
      where: { id: { in: productIds } }
    })
    const prodMap = new Map(productosDb.map(p => [p.id, p]))

    // 2. Compute item subtotals
    let subtotalCalculado = 0
    const processedItems = data.items.map(item => {
      const prod = prodMap.get(item.productoId)
      const qty = Math.max(1, Number(item.cantidad) || 1)
      const unitPrice = Number(item.precioUnitario) || 0
      const packCost = Number(item.costoPackaging) || 0
      const itemSubtotal = Number(((unitPrice + packCost) * qty).toFixed(2))
      subtotalCalculado += itemSubtotal

      const rawColores = Array.isArray(item.coloresIds) && item.coloresIds.length > 0
        ? item.coloresIds
        : (item.colorFilamentoId ? [item.colorFilamentoId] : [])

      return {
        productoId: item.productoId,
        nombreProductoSnapshot: prod?.nombreModelo || (targetNegocio === 'BG' ? 'Juego de Mesa' : 'Modelo 3D'),
        costoBaseSnapshot: prod ? Number(prod.costoBase) : 0,
        colorFilamentoId: rawColores[0] || item.colorFilamentoId || null,
        coloresIds: rawColores,
        personalizacion: item.personalizacion?.trim() || null,
        cantidad: qty,
        tipoPrecio: item.tipoPrecio || 'MERCADO',
        precioUnitario: unitPrice,
        costoPackaging: packCost,
        porcentajeAdicional: Number(item.porcentajeAdicional) || 0,
        gramosConsumidos: Number(item.gramosConsumidos) || (prod?.pesoGramos ? Number(prod.pesoGramos) * qty : 0),
        subtotal: itemSubtotal
      }
    })

    const costoEnvioNum = Number(data.costoEnvio) || 0
    const totalCalculado = Number((subtotalCalculado + costoEnvioNum).toFixed(2))
    const montoPagadoNum = Math.min(totalCalculado, Math.max(0, Number(data.montoPagado) || 0))
    const saldoPendienteNum = Number(Math.max(0, totalCalculado - montoPagadoNum).toFixed(2))

    const codigoGenerado = await generateNextCodigoPedido(targetNegocio)
    const fechaPedido = parseDateInput(data.fecha)

    // 3. Database Transaction
    const nuevoPedido = await prisma.$transaction(async (tx) => {
      const p = await tx.pedido.create({
        data: {
          negocio: targetNegocio,
          codigo: codigoGenerado,
          fecha: fechaPedido,
          cliente: data.cliente.trim(),
          dni: data.dni?.trim() || null,
          telefono: data.telefono?.trim() || null,
          canalVenta: data.canalVenta || 'WhatsApp',
          destinoEnvio: data.destinoEnvio?.trim() || null,
          diaEntregaPrometida: data.diaEntregaPrometida?.trim() || null,
          notas: data.notas?.trim() || null,
          metodoPago: data.metodoPago || 'YAPE',
          estado: 'PENDIENTE',
          costoEnvio: costoEnvioNum,
          subtotal: subtotalCalculado,
          total: totalCalculado,
          montoPagado: montoPagadoNum,
          saldoPendiente: saldoPendienteNum,
          items: {
            create: processedItems
          }
        }
      })

      // If initial payment was made, register initial PagoPedido
      if (montoPagadoNum > 0) {
        const tipoPago = montoPagadoNum >= totalCalculado ? 'PAGO_TOTAL' : 'ANTICIPO'
        await tx.pagoPedido.create({
          data: {
            pedidoId: p.id,
            fecha: fechaPedido,
            monto: montoPagadoNum,
            metodoPago: data.metodoPago || 'YAPE',
            tipo: tipoPago,
            notas: data.notasPago?.trim() || `Pago inicial registrado con el pedido`
          }
        })
      }

      const fullPedido = await tx.pedido.findUnique({
        where: { id: p.id },
        include: {
          items: {
            include: { producto: true, colorFilamento: true }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          }
        }
      })

      return fullPedido || p
    })

    // 4. Stock deduction if requested (split evenly across all selected colors)
    if (data.descontarStock) {
      for (const item of processedItems) {
        if (item.coloresIds && item.coloresIds.length > 0 && item.gramosConsumidos > 0) {
          const splitGramos = Number((item.gramosConsumidos / item.coloresIds.length).toFixed(1))
          for (const cId of item.coloresIds) {
            try {
              await ajustarStockBobina(cId, splitGramos)
            } catch (stkErr) {
              console.warn(`No se pudo descontar stock de la bobina ${cId}:`, stkErr)
            }
          }
        } else if (item.colorFilamentoId && item.gramosConsumidos > 0) {
          try {
            await ajustarStockBobina(item.colorFilamentoId, item.gramosConsumidos)
          } catch (stkErr) {
            console.warn(`No se pudo descontar stock de la bobina ${item.colorFilamentoId}:`, stkErr)
          }
        }
      }
    }

    const allFilamentos = await prisma.inventarioFilamento.findMany()
    const filMap = new Map(allFilamentos.map(f => [f.id, f]))

    safeRevalidate()
    return { success: true, pedido: serializePedido(nuevoPedido, filMap) }
  } catch (error: any) {
    console.error('Error creating pedido:', error)
    return { success: false, error: error.message || 'Error al registrar pedido' }
  }
}

export async function updateEstadoPedido(id: string, nuevoEstado: EstadoPedido) {
  try {
    const pedido = await prisma.$transaction(async (tx) => {
      const pedidoActual = await tx.pedido.findUnique({
        where: { id },
        include: { items: true, pagos: true }
      })

      if (!pedidoActual) {
        throw new Error('Pedido no encontrado')
      }

      // Si cambia a PAGO_VALIDADO y antes no lo estaba
      if (nuevoEstado === 'PAGO_VALIDADO' && pedidoActual.estado !== 'PAGO_VALIDADO') {
        // Disminuir stock de los productos asociados
        for (const it of pedidoActual.items) {
          if (it.productoId) {
            await tx.producto.update({
              where: { id: it.productoId },
              data: {
                stock: {
                  decrement: it.cantidad
                }
              }
            })
          }
        }

        // Si aún tiene saldo pendiente, marcar como pagado registrando el abono
        const saldo = Number(pedidoActual.saldoPendiente)
        if (saldo > 0) {
          await tx.pagoPedido.create({
            data: {
              pedidoId: id,
              monto: saldo,
              metodoPago: pedidoActual.metodoPago || 'TRANSFERENCIA',
              tipo: 'LIQUIDACION',
              notas: 'Pago validado manualmente desde pedidos'
            }
          })

          await tx.pedido.update({
            where: { id },
            data: {
              montoPagado: Number(pedidoActual.total),
              saldoPendiente: 0
            }
          })
        }
      }

      // Si se cancela un pedido que ya tenía PAGO_VALIDADO, restaurar stock
      if (pedidoActual.estado === 'PAGO_VALIDADO' && nuevoEstado === 'CANCELADO') {
        for (const it of pedidoActual.items) {
          if (it.productoId) {
            await tx.producto.update({
              where: { id: it.productoId },
              data: {
                stock: {
                  increment: it.cantidad
                }
              }
            })
          }
        }
      }

      await tx.itemPedido.updateMany({
        where: { pedidoId: id },
        data: { estado: nuevoEstado }
      })

      const p = await tx.pedido.update({
        where: { id },
        data: { estado: nuevoEstado },
        include: {
          items: {
            include: { producto: true, colorFilamento: true }
          },
          pagos: true
        }
      })
      return p
    })

    safeRevalidate()
    return { success: true, pedido: serializePedido(pedido) }
  } catch (error: any) {
    console.error('Error updating estado pedido:', error)
    return { success: false, error: error.message || 'Error al actualizar estado del pedido' }
  }
}

export async function addPagoPedido(pedidoId: string, data: {
  monto: number
  metodoPago?: string
  tipo?: string
  notas?: string
  fecha?: string | Date
}) {
  try {
    const montoNum = Number(data.monto)
    if (!montoNum || montoNum <= 0) {
      return { success: false, error: 'El monto a abonar debe ser mayor a 0' }
    }

    const pedidoActual = await prisma.pedido.findUnique({
      where: { id: pedidoId },
      include: { pagos: true }
    })

    if (!pedidoActual) {
      return { success: false, error: 'Pedido no encontrado' }
    }

    const fechaPago = parseDateInput(data.fecha)

    const updated = await prisma.$transaction(async (tx) => {
      // 1. Create payment record
      await tx.pagoPedido.create({
        data: {
          pedidoId,
          fecha: fechaPago,
          monto: montoNum,
          metodoPago: data.metodoPago || 'YAPE',
          tipo: data.tipo || 'ABONO',
          notas: data.notas?.trim() || null
        }
      })

      // 2. Recalculate totals
      const allPagos = await tx.pagoPedido.findMany({
        where: { pedidoId }
      })
      const totalPagado = allPagos.reduce((sum, p) => sum + Number(p.monto), 0)
      const totalPedido = Number(pedidoActual.total)
      const nuevoSaldo = Math.max(0, Number((totalPedido - totalPagado).toFixed(2)))

      const pActualizado = await tx.pedido.update({
        where: { id: pedidoId },
        data: {
          montoPagado: totalPagado,
          saldoPendiente: nuevoSaldo
        },
        include: {
          items: {
            include: { producto: true, colorFilamento: true }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          }
        }
      })

      return pActualizado
    })

    safeRevalidate()
    return { success: true, pedido: serializePedido(updated) }
  } catch (error: any) {
    console.error('Error adding pago pedido:', error)
    return { success: false, error: error.message || 'Error al registrar abono' }
  }
}

export async function deletePedido(id: string) {
  try {
    await prisma.pedido.delete({
      where: { id }
    })

    safeRevalidate()
    return { success: true }
  } catch (error: any) {
    console.error('Error deleting pedido:', error)
    return { success: false, error: error.message || 'Error al eliminar pedido' }
  }
}

export interface UpdatePedidoInput {
  cliente: string
  dni?: string | null
  telefono?: string | null
  canalVenta?: string | null
  destinoEnvio?: string | null
  diaEntregaPrometida?: string | null
  notas?: string | null
  estado?: EstadoPedido
  costoEnvio?: number
  items: ItemPedidoInput[]
  fecha?: string | Date
}

export async function updatePedido(id: string, data: UpdatePedidoInput) {
  try {
    if (!data.cliente || !data.cliente.trim()) {
      return { success: false, error: 'El nombre del cliente es obligatorio' }
    }

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return { success: false, error: 'Debes tener al menos 1 producto en el pedido' }
    }

    const current = await prisma.pedido.findUnique({
      where: { id },
      include: { pagos: true }
    })

    if (!current) {
      return { success: false, error: 'Pedido no encontrado' }
    }

    // 1. Fetch product snapshots
    const productIds = data.items.map(i => i.productoId)
    const productosDb = await prisma.producto.findMany({
      where: { id: { in: productIds } }
    })
    const prodMap = new Map(productosDb.map(p => [p.id, p]))

    // 2. Compute item subtotals
    let subtotalCalculado = 0
    const processedItems = data.items.map(item => {
      const prod = prodMap.get(item.productoId)
      const qty = Math.max(1, Number(item.cantidad) || 1)
      const unitPrice = Number(item.precioUnitario) || 0
      const packCost = Number(item.costoPackaging) || 0
      const itemSubtotal = Number(((unitPrice + packCost) * qty).toFixed(2))
      subtotalCalculado += itemSubtotal

      const rawColores = Array.isArray(item.coloresIds) && item.coloresIds.length > 0
        ? item.coloresIds
        : (item.colorFilamentoId ? [item.colorFilamentoId] : [])

      return {
        pedidoId: id,
        productoId: item.productoId,
        nombreProductoSnapshot: prod?.nombreModelo || 'Modelo 3D',
        costoBaseSnapshot: prod ? Number(prod.costoBase) : 0,
        colorFilamentoId: rawColores[0] || item.colorFilamentoId || null,
        coloresIds: rawColores,
        personalizacion: item.personalizacion?.trim() || null,
        cantidad: qty,
        tipoPrecio: item.tipoPrecio || 'MERCADO',
        precioUnitario: unitPrice,
        costoPackaging: packCost,
        porcentajeAdicional: Number(item.porcentajeAdicional) || 0,
        gramosConsumidos: Number(item.gramosConsumidos) || (prod?.pesoGramos ? Number(prod.pesoGramos) * qty : 0),
        subtotal: itemSubtotal,
        estado: data.estado || current.estado || 'PENDIENTE'
      }
    })

    const costoEnvioNum = Number(data.costoEnvio) || 0
    const totalCalculado = Number((subtotalCalculado + costoEnvioNum).toFixed(2))
    
    // Sum current payments
    const totalPagado = current.pagos.reduce((sum, p) => sum + Number(p.monto), 0)
    const saldoPendienteNum = Number(Math.max(0, totalCalculado - totalPagado).toFixed(2))
    const fechaPedido = parseDateInput(data.fecha || current.fecha)

    const updated = await prisma.$transaction(async (tx) => {
      // Si cambia a PAGO_VALIDADO y antes no lo estaba
      if (data.estado === 'PAGO_VALIDADO' && current.estado !== 'PAGO_VALIDADO') {
        for (const it of processedItems) {
          if (it.productoId) {
            await tx.producto.update({
              where: { id: it.productoId },
              data: { stock: { decrement: it.cantidad } }
            })
          }
        }
      }

      // Si se cancela un pedido que tenía PAGO_VALIDADO
      if (current.estado === 'PAGO_VALIDADO' && data.estado === 'CANCELADO') {
        for (const it of processedItems) {
          if (it.productoId) {
            await tx.producto.update({
              where: { id: it.productoId },
              data: { stock: { increment: it.cantidad } }
            })
          }
        }
      }

      // Delete old items
      await tx.itemPedido.deleteMany({ where: { pedidoId: id } })

      // Create new items
      await tx.itemPedido.createMany({ data: processedItems })

      // Update header
      const p = await tx.pedido.update({
        where: { id },
        data: {
          cliente: data.cliente.trim(),
          dni: data.dni !== undefined ? (data.dni?.trim() || null) : current.dni,
          telefono: data.telefono !== undefined ? (data.telefono?.trim() || null) : current.telefono,
          canalVenta: data.canalVenta || 'WhatsApp',
          destinoEnvio: data.destinoEnvio?.trim() || null,
          diaEntregaPrometida: data.diaEntregaPrometida?.trim() || null,
          notas: data.notas?.trim() || null,
          ...(data.estado ? { estado: data.estado } : {}),
          costoEnvio: costoEnvioNum,
          subtotal: subtotalCalculado,
          total: totalCalculado,
          montoPagado: totalPagado,
          saldoPendiente: saldoPendienteNum,
          fecha: fechaPedido
        },
        include: {
          items: {
            include: { producto: true, colorFilamento: true }
          },
          pagos: {
            orderBy: { fecha: 'asc' }
          }
        }
      })

      return p
    })

    const allFilamentos = await prisma.inventarioFilamento.findMany()
    const filMap = new Map(allFilamentos.map(f => [f.id, f]))

    safeRevalidate()
    return { success: true, pedido: serializePedido(updated, filMap) }
  } catch (error: any) {
    console.error('Error updating pedido:', error)
    return { success: false, error: error.message || 'Error al actualizar pedido' }
  }
}
