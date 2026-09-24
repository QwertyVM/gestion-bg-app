'use server'

import prisma from '@/lib/prisma'
import { EstadoVenta, TipoPrecio } from '@prisma/client'
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

function serializeVenta(v: any) {
  // If sale has montoPagado > 0 but empty pagos array (e.g. legacy data), synthesize a default initial payment
  const rawPagos = Array.isArray(v.pagos) && v.pagos.length > 0
    ? v.pagos
    : (Number(v.montoPagado) > 0 ? [{
        id: `legacy-${v.id}`,
        ventaId: v.id,
        fecha: v.fecha,
        monto: v.montoPagado,
        metodoPago: 'YAPE',
        tipo: Number(v.montoPagado) >= Number(v.total) ? 'PAGO_TOTAL' : 'ANTICIPO',
        notas: 'Pago inicial registrado en pedido',
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      }] : [])

  const pagos = rawPagos.map((p: any) => ({
    id: p.id,
    ventaId: p.ventaId,
    fecha: p.fecha instanceof Date ? p.fecha.toISOString() : String(p.fecha),
    monto: Number(p.monto),
    metodoPago: p.metodoPago || 'YAPE',
    tipo: p.tipo || 'ANTICIPO',
    notas: p.notas || null,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt || p.fecha),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt || p.fecha),
  }))

  const rawColoresIds: string[] = Array.isArray(v.coloresIds) && v.coloresIds.length > 0
    ? v.coloresIds
    : (v.colorFilamentoId ? [v.colorFilamentoId] : [])

  return {
    id: v.id,
    fecha: v.fecha instanceof Date ? v.fecha.toISOString() : String(v.fecha),
    cliente: v.cliente,
    productoId: v.productoId,
    costoBaseSnapshot: v.costoBaseSnapshot != null ? Number(v.costoBaseSnapshot) : (v.producto ? Number(v.producto.costoBase) : 0),
    nombreProductoSnapshot: v.nombreProductoSnapshot || v.producto?.nombreModelo || '',
    colorFilamentoId: v.colorFilamentoId || rawColoresIds[0] || null,
    coloresIds: rawColoresIds,
    personalizacion: v.personalizacion || null,
    gramosConsumidos: v.gramosConsumidos != null ? Number(v.gramosConsumidos) : 0,
    cantidad: Number(v.cantidad),
    tipoPrecio: v.tipoPrecio,
    precioUnitario: Number(v.precioUnitario),
    total: Number(v.total),
    montoPagado: Number(v.montoPagado),
    saldoPendiente: Number(v.saldoPendiente),
    costoPackaging: v.costoPackaging != null ? Number(v.costoPackaging) : 0,
    porcentajeAdicional: v.porcentajeAdicional != null ? Number(v.porcentajeAdicional) : 0,
    estado: v.estado,
    diaEntregaPrometida: v.diaEntregaPrometida || null,
    destinoEnvio: v.destinoEnvio || null,
    canalVenta: v.canalVenta || null,
    pagos,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
    updatedAt: v.updatedAt instanceof Date ? v.updatedAt.toISOString() : String(v.updatedAt),
    colorFilamento: v.colorFilamento ? {
      id: v.colorFilamento.id,
      nombreColor: v.colorFilamento.nombreColor,
      numeroBobina: v.colorFilamento.numeroBobina || 1,
      codigoHex: v.colorFilamento.codigoHex || '#1E1E1E',
      tipoMaterial: v.colorFilamento.tipoMaterial,
      marca: v.colorFilamento.marca || 'Genérica',
      stockGramos: v.colorFilamento.stockGramos ? Number(v.colorFilamento.stockGramos) : 0,
      stockBobinas: Number(v.colorFilamento.stockBobinas),
      alertaCritica: Boolean(v.colorFilamento.alertaCritica || (v.colorFilamento.stockGramos && Number(v.colorFilamento.stockGramos) < 300))
    } : null,
    producto: v.producto ? {
      id: v.producto.id,
      lineaCategoria: v.producto.lineaCategoria,
      nombreModelo: v.producto.nombreModelo,
      costoBase: Number(v.producto.costoBase),
      precioAmigos: Number(v.producto.precioAmigos),
      precioMercado: Number(v.producto.precioMercado),
      precioComunidad: Number(v.producto.precioComunidad),
      pesoGramos: v.producto.pesoGramos != null ? Number(v.producto.pesoGramos) : 0,
      activo: v.producto.activo,
      createdAt: v.producto.createdAt instanceof Date ? v.producto.createdAt.toISOString() : String(v.producto.createdAt),
      updatedAt: v.producto.updatedAt instanceof Date ? v.producto.updatedAt.toISOString() : String(v.producto.updatedAt),
    } : {
      id: v.productoId,
      lineaCategoria: 'General',
      nombreModelo: v.nombreProductoSnapshot || 'Producto',
      costoBase: 0,
      precioAmigos: 0,
      precioMercado: 0,
      precioComunidad: 0,
      pesoGramos: 0,
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

function serializePedidoToVenta(p: any, filMap?: Map<string, any>) {
  const items = Array.isArray(p.items) ? p.items : []
  const totalCantidad = items.reduce((sum: number, it: any) => sum + Number(it.cantidad || 0), 0) || 1
  
  // Costo base total de fabricación de los items del pedido
  const costoBaseTotal = items.reduce((sum: number, it: any) => {
    const costoUnit = it.costoBaseSnapshot != null && Number(it.costoBaseSnapshot) > 0
      ? Number(it.costoBaseSnapshot)
      : (Number(it.producto?.costoBase) || 0)
    return sum + (costoUnit * Number(it.cantidad || 1))
  }, 0)

  const costoBaseSnapshotUnit = totalCantidad > 0 ? (costoBaseTotal / totalCantidad) : 0
  const gramosConsumidosTotal = items.reduce((sum: number, it: any) => sum + Number(it.gramosConsumidos || 0), 0)

  // Nombre representativo del producto
  let nombreProducto = `Pedido ${p.codigo}`
  let lineaCategoria = 'General'
  let colorFilamento = null
  let colorFilamentoId = null
  let coloresIds: string[] = []
  let productoObj = null

  if (items.length === 1) {
    const single = items[0]
    nombreProducto = single.nombreProductoSnapshot || single.producto?.nombreModelo || `Pedido ${p.codigo}`
    lineaCategoria = single.producto?.lineaCategoria || 'General'
    coloresIds = Array.isArray(single.coloresIds) && single.coloresIds.length > 0
      ? single.coloresIds
      : (single.colorFilamentoId ? [single.colorFilamentoId] : [])
    colorFilamento = single.colorFilamento ? {
      id: single.colorFilamento.id,
      nombreColor: single.colorFilamento.nombreColor,
      numeroBobina: single.colorFilamento.numeroBobina || 1,
      codigoHex: single.colorFilamento.codigoHex || '#1E1E1E',
      tipoMaterial: single.colorFilamento.tipoMaterial,
      marca: single.colorFilamento.marca || 'Genérica',
      stockGramos: single.colorFilamento.stockGramos ? Number(single.colorFilamento.stockGramos) : 0,
      stockBobinas: Number(single.colorFilamento.stockBobinas || 1),
      alertaCritica: Boolean(single.colorFilamento.alertaCritica || (single.colorFilamento.stockGramos && Number(single.colorFilamento.stockGramos) < 300))
    } : null
    colorFilamentoId = single.colorFilamentoId || coloresIds[0] || null
    productoObj = single.producto ? {
      id: single.producto.id,
      lineaCategoria: single.producto.lineaCategoria,
      nombreModelo: single.producto.nombreModelo,
      costoBase: Number(single.producto.costoBase),
      precioAmigos: Number(single.producto.precioAmigos),
      precioMercado: Number(single.producto.precioMercado),
      precioComunidad: Number(single.producto.precioComunidad),
      pesoGramos: single.producto.pesoGramos != null ? Number(single.producto.pesoGramos) : 0,
      activo: single.producto.activo,
      createdAt: single.producto.createdAt instanceof Date ? single.producto.createdAt.toISOString() : String(single.producto.createdAt),
      updatedAt: single.producto.updatedAt instanceof Date ? single.producto.updatedAt.toISOString() : String(single.producto.updatedAt),
    } : null
  } else if (items.length > 1) {
    nombreProducto = items.map((it: any) => `${it.cantidad}x ${it.nombreProductoSnapshot || it.producto?.nombreModelo || 'Modelo'}`).join(', ')
    lineaCategoria = 'Multiproducto'
    productoObj = {
      id: p.id,
      lineaCategoria: 'Multiproducto',
      nombreModelo: `${p.codigo}: ${items.length} modelos (${totalCantidad} pzs)`,
      costoBase: costoBaseSnapshotUnit,
      precioAmigos: 0,
      precioMercado: 0,
      precioComunidad: 0,
      pesoGramos: 0,
      activo: true,
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
      updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
    }
  }

  // Pagos
  const rawPagos = Array.isArray(p.pagos) && p.pagos.length > 0
    ? p.pagos
    : (Number(p.montoPagado) > 0 ? [{
        id: `pago-init-${p.id}`,
        pedidoId: p.id,
        fecha: p.fecha,
        monto: p.montoPagado,
        metodoPago: 'YAPE',
        tipo: Number(p.montoPagado) >= Number(p.total) ? 'PAGO_TOTAL' : 'ANTICIPO',
        notas: `Abono inicial ${p.codigo}`,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }] : [])

  const pagos = rawPagos.map((pg: any) => ({
    id: pg.id,
    ventaId: p.id,
    fecha: pg.fecha instanceof Date ? pg.fecha.toISOString() : String(pg.fecha),
    monto: Number(pg.monto),
    metodoPago: pg.metodoPago || 'YAPE',
    tipo: pg.tipo || 'ANTICIPO',
    notas: pg.notas || null,
    createdAt: pg.createdAt instanceof Date ? pg.createdAt.toISOString() : String(pg.createdAt || pg.fecha),
    updatedAt: pg.updatedAt instanceof Date ? pg.updatedAt.toISOString() : String(pg.updatedAt || pg.fecha),
  }))

  return {
    id: p.id,
    fecha: p.fecha instanceof Date ? p.fecha.toISOString() : String(p.fecha),
    cliente: p.cliente,
    productoId: items[0]?.productoId || p.id,
    costoBaseSnapshot: costoBaseSnapshotUnit,
    nombreProductoSnapshot: nombreProducto,
    colorFilamentoId,
    personalizacion: p.notas || null,
    gramosConsumidos: gramosConsumidosTotal,
    cantidad: totalCantidad,
    tipoPrecio: items[0]?.tipoPrecio || 'MERCADO',
    precioUnitario: totalCantidad > 0 ? Number((Number(p.total) / totalCantidad).toFixed(2)) : Number(p.total),
    total: Number(p.total),
    montoPagado: Number(p.montoPagado),
    saldoPendiente: Number(p.saldoPendiente),
    costoPackaging: Number(p.costoEnvio || 0),
    porcentajeAdicional: 0,
    estado: p.estado as any,
    diaEntregaPrometida: p.diaEntregaPrometida || null,
    destinoEnvio: p.destinoEnvio || null,
    canalVenta: p.canalVenta || null,
    pagos,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
    colorFilamento,
    producto: productoObj || {
      id: p.id,
      lineaCategoria,
      nombreModelo: nombreProducto,
      costoBase: costoBaseSnapshotUnit,
      precioAmigos: 0,
      precioMercado: 0,
      precioComunidad: 0,
      pesoGramos: 0,
      activo: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }
}

export async function getVentas(negocio?: TipoNegocio) {
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
  return pedidos.map(p => serializePedidoToVenta(p, filMap)).sort((a, b) => {
    return new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  })
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

export async function createVenta(data: {
  negocio?: TipoNegocio
  cliente: string
  productoId: string
  cantidad: number
  tipoPrecio: TipoPrecio
  precioUnitario: number
  montoPagado: number
  costoPackaging?: number
  porcentajeAdicional?: number
  colorFilamentoId?: string | null
  coloresIds?: string[]
  personalizacion?: string | null
  gramosConsumidos?: number | null
  estado: EstadoVenta
  diaEntregaPrometida?: string
  destinoEnvio?: string
  canalVenta?: string
  fecha?: string | Date
  fechaPagoInicial?: string | Date
  metodoPagoInicial?: string
  tipoPagoInicial?: string
  notasPagoInicial?: string
}) {
  const targetNegocio = data.negocio || await getActiveNegocioServer()

  const total = data.cantidad * data.precioUnitario
  const montoPagado = Math.min(total, Math.max(0, data.montoPagado || 0))
  const saldoPendiente = Math.max(0, total - montoPagado)

  const producto = await prisma.producto.findUnique({
    where: { id: data.productoId }
  })

  const prodGramosUnit = producto?.pesoGramos != null && Number(producto.pesoGramos) > 0
    ? Number(producto.pesoGramos)
    : 0

  const gramosConsumidos = (data.gramosConsumidos !== undefined && data.gramosConsumidos !== null && data.gramosConsumidos > 0)
    ? data.gramosConsumidos
    : (prodGramosUnit * data.cantidad)

  const fechaVenta = parseDateInput(data.fecha) || new Date()
  const fechaPago = parseDateInput(data.fechaPagoInicial || data.fecha) || fechaVenta

  const rawColores = Array.isArray(data.coloresIds) && data.coloresIds.length > 0
    ? data.coloresIds
    : (data.colorFilamentoId ? [data.colorFilamentoId] : [])

  const venta = await prisma.venta.create({
    data: {
      negocio: targetNegocio,
      cliente: data.cliente,
      productoId: data.productoId,
      nombreProductoSnapshot: producto?.nombreModelo || '',
      costoBaseSnapshot: producto?.costoBase || 0,
      colorFilamentoId: rawColores[0] || data.colorFilamentoId || null,
      coloresIds: rawColores,
      personalizacion: data.personalizacion || null,
      gramosConsumidos: gramosConsumidos || 0,
      cantidad: data.cantidad,
      tipoPrecio: data.tipoPrecio,
      precioUnitario: data.precioUnitario,
      total,
      montoPagado,
      saldoPendiente,
      costoPackaging: data.costoPackaging || 0,
      porcentajeAdicional: data.porcentajeAdicional || 0,
      estado: data.estado,
      diaEntregaPrometida: data.diaEntregaPrometida,
      destinoEnvio: data.destinoEnvio,
      canalVenta: data.canalVenta,
      fecha: fechaVenta,
      ...(montoPagado > 0 ? {
        pagos: {
          create: {
            fecha: fechaPago,
            monto: montoPagado,
            metodoPago: data.metodoPagoInicial || 'YAPE',
            tipo: data.tipoPagoInicial || (montoPagado >= total ? 'PAGO_TOTAL' : 'ANTICIPO'),
            notas: data.notasPagoInicial || null
          }
        }
      } : {})
    },
    include: {
      producto: true,
      colorFilamento: true,
      pagos: {
        orderBy: { fecha: 'asc' }
      }
    }
  })

  // Sincronizar creación como Pedido
  try {
    const prefix = targetNegocio === 'BG' ? 'BG' : 'PED'
    const nextNum = (await prisma.pedido.count({ where: { negocio: targetNegocio } })) + 1
    const codigo = `${prefix}-${String(nextNum).padStart(3, '0')}`
    await prisma.pedido.create({
      data: {
        negocio: targetNegocio,
        codigo,
        fecha: fechaVenta,
        cliente: data.cliente,
        canalVenta: data.canalVenta || 'WhatsApp',
        destinoEnvio: data.destinoEnvio,
        diaEntregaPrometida: data.diaEntregaPrometida,
        notas: data.personalizacion ? `Personalización: ${data.personalizacion}` : null,
        estado: (data.estado === 'CANCELADO' ? 'CANCELADO' : data.estado === 'EN_PRODUCCION' ? 'EN_PRODUCCION' : data.estado === 'PENDIENTE' ? 'PENDIENTE' : 'ENTREGADO') as any,
        costoEnvio: 0,
        subtotal: total,
        total,
        montoPagado,
        saldoPendiente,
        items: {
          create: [{
            productoId: data.productoId,
            nombreProductoSnapshot: producto?.nombreModelo || (targetNegocio === 'BG' ? 'Juego de Mesa' : 'Modelo 3D'),
            costoBaseSnapshot: producto?.costoBase || 0,
            colorFilamentoId: rawColores[0] || data.colorFilamentoId,
            coloresIds: rawColores,
            personalizacion: data.personalizacion,
            cantidad: data.cantidad,
            tipoPrecio: data.tipoPrecio,
            precioUnitario: data.precioUnitario,
            costoPackaging: data.costoPackaging || 0,
            porcentajeAdicional: data.porcentajeAdicional || 0,
            gramosConsumidos: gramosConsumidos || 0,
            subtotal: total
          }]
        },
        ...(montoPagado > 0 ? {
          pagos: {
            create: [{
              fecha: fechaPago,
              monto: montoPagado,
              metodoPago: data.metodoPagoInicial || 'YAPE',
              tipo: data.tipoPagoInicial || (montoPagado >= total ? 'PAGO_TOTAL' : 'ANTICIPO'),
              notas: data.notasPagoInicial || null
            }]
          }
        } : {})
      }
    })
  } catch (syncErr) {
    console.warn('No se pudo sincronizar automáticamente como Pedido:', syncErr)
  }

  if (rawColores.length > 0 && gramosConsumidos > 0 && data.estado !== 'CANCELADO') {
    const splitGramos = Number((gramosConsumidos / rawColores.length).toFixed(1))
    for (const cId of rawColores) {
      await ajustarStockBobina(cId, splitGramos)
    }
  }

  safeRevalidate()
  return serializeVenta(venta)
}

export async function updateVenta(id: string, data: {
  cliente?: string
  productoId?: string
  cantidad?: number
  tipoPrecio?: TipoPrecio
  precioUnitario?: number
  montoPagado?: number
  costoPackaging?: number
  porcentajeAdicional?: number
  colorFilamentoId?: string | null
  coloresIds?: string[]
  personalizacion?: string | null
  gramosConsumidos?: number | null
  estado?: EstadoVenta
  diaEntregaPrometida?: string | null
  destinoEnvio?: string | null
  canalVenta?: string | null
  fecha?: string | Date
}) {
  const current = await prisma.venta.findUnique({
    where: { id },
    include: { producto: true, pagos: true }
  })
  if (!current) throw new Error("Venta no encontrada")

  const cantidad = data.cantidad !== undefined ? data.cantidad : current.cantidad
  const precioUnitario = data.precioUnitario !== undefined ? data.precioUnitario : Number(current.precioUnitario)
  const total = cantidad * precioUnitario

  const montoPagado = data.montoPagado !== undefined ? data.montoPagado : Number(current.montoPagado)
  const saldoPendiente = Math.max(0, total - montoPagado)

  let newProductoId = current.productoId
  let costoSnapshot = current.costoBaseSnapshot
  let nombreSnapshot = current.nombreProductoSnapshot

  if (data.productoId && data.productoId !== current.productoId) {
    const prod = await prisma.producto.findUnique({ where: { id: data.productoId } })
    if (prod) {
      newProductoId = prod.id
      costoSnapshot = prod.costoBase
      nombreSnapshot = prod.nombreModelo
    }
  }

  let newFecha = current.fecha
  if (data.fecha !== undefined) {
    newFecha = parseDateInput(data.fecha) || current.fecha
  }

  const rawColores = data.coloresIds !== undefined 
    ? data.coloresIds 
    : (Array.isArray(current.coloresIds) && current.coloresIds.length > 0 ? current.coloresIds : (data.colorFilamentoId !== undefined ? (data.colorFilamentoId ? [data.colorFilamentoId] : []) : (current.colorFilamentoId ? [current.colorFilamentoId] : [])))

  const prevGramos = current.gramosConsumidos != null ? Number(current.gramosConsumidos) : 0
  const prevColorId = current.colorFilamentoId
  const prevEstado = current.estado

  const newGramos = data.gramosConsumidos !== undefined ? (data.gramosConsumidos ?? 0) : prevGramos
  const newColorId = rawColores[0] || (data.colorFilamentoId !== undefined ? data.colorFilamentoId : prevColorId)
  const newEstado = data.estado !== undefined ? data.estado : prevEstado

  // Ajustes de inventario de filamento
  if (prevEstado !== 'CANCELADO' && newEstado === 'CANCELADO') {
    if (prevColorId && prevGramos > 0) {
      await ajustarStockBobina(prevColorId, -prevGramos)
    }
  } else if (prevEstado === 'CANCELADO' && newEstado !== 'CANCELADO') {
    if (newColorId && newGramos > 0) {
      await ajustarStockBobina(newColorId, newGramos)
    }
  } else if (newEstado !== 'CANCELADO') {
    if (prevColorId === newColorId) {
      const delta = newGramos - prevGramos
      if (newColorId && delta !== 0) {
        await ajustarStockBobina(newColorId, delta)
      }
    } else {
      if (prevColorId && prevGramos > 0) {
        await ajustarStockBobina(prevColorId, -prevGramos)
      }
      if (newColorId && newGramos > 0) {
        await ajustarStockBobina(newColorId, newGramos)
      }
    }
  }

  const updated = await prisma.venta.update({
    where: { id },
    data: {
      cliente: data.cliente !== undefined ? data.cliente : current.cliente,
      productoId: newProductoId,
      costoBaseSnapshot: costoSnapshot,
      nombreProductoSnapshot: nombreSnapshot,
      colorFilamentoId: newColorId,
      coloresIds: rawColores,
      personalizacion: data.personalizacion !== undefined ? data.personalizacion : current.personalizacion,
      gramosConsumidos: data.gramosConsumidos !== undefined ? data.gramosConsumidos : current.gramosConsumidos,
      cantidad,
      tipoPrecio: data.tipoPrecio !== undefined ? data.tipoPrecio : current.tipoPrecio,
      precioUnitario,
      total,
      montoPagado,
      saldoPendiente,
      costoPackaging: data.costoPackaging !== undefined ? data.costoPackaging : current.costoPackaging,
      porcentajeAdicional: data.porcentajeAdicional !== undefined ? data.porcentajeAdicional : current.porcentajeAdicional,
      estado: data.estado !== undefined ? data.estado : current.estado,
      diaEntregaPrometida: data.diaEntregaPrometida !== undefined ? data.diaEntregaPrometida : current.diaEntregaPrometida,
      destinoEnvio: data.destinoEnvio !== undefined ? data.destinoEnvio : current.destinoEnvio,
      canalVenta: data.canalVenta !== undefined ? data.canalVenta : current.canalVenta,
      fecha: newFecha,
    },
    include: {
      producto: true,
      colorFilamento: true,
      pagos: {
        orderBy: { fecha: 'asc' }
      }
    }
  })

  safeRevalidate()
  return serializeVenta(updated)
}

export async function updateEstadoVenta(id: string, estado: EstadoVenta) {
  const current = await prisma.venta.findUnique({ where: { id } })
  if (current && current.colorFilamentoId) {
    const gramos = current.gramosConsumidos != null ? Number(current.gramosConsumidos) : 0
    if (gramos > 0) {
      if (current.estado !== 'CANCELADO' && estado === 'CANCELADO') {
        await ajustarStockBobina(current.colorFilamentoId, -gramos)
      } else if (current.estado === 'CANCELADO' && estado !== 'CANCELADO') {
        await ajustarStockBobina(current.colorFilamentoId, gramos)
      }
    }
  }

  const venta = await prisma.venta.update({
    where: { id },
    data: { estado },
    include: {
      producto: true,
      colorFilamento: true,
      pagos: {
        orderBy: { fecha: 'asc' }
      }
    }
  })

  safeRevalidate()
  return serializeVenta(venta)
}

export async function registrarAbono(
  id: string, 
  montoAbono: number | {
    monto: number
    fecha?: string | Date
    metodoPago?: string
    tipo?: string
    notas?: string
  }
) {
  const data = typeof montoAbono === 'number' 
    ? { monto: montoAbono } 
    : montoAbono

  const monto = Number(data.monto)
  if (isNaN(monto) || monto <= 0) throw new Error("Monto de abono inválido")

  const currentVenta = await prisma.venta.findUnique({
    where: { id },
    include: { pagos: { orderBy: { fecha: 'asc' } } }
  })
  if (!currentVenta) throw new Error("Venta no encontrada")

  const fechaPago = parseDateInput(data.fecha) || new Date()
  const tipoPago = data.tipo || 'ABONO'

  // If sale had legacy payment and no rows in DB, create the baseline first
  if ((!currentVenta.pagos || currentVenta.pagos.length === 0) && Number(currentVenta.montoPagado) > 0) {
    const isTotal = Number(currentVenta.montoPagado) >= Number(currentVenta.total)
    await prisma.pagoVenta.create({
      data: {
        ventaId: id,
        fecha: currentVenta.fecha,
        monto: Number(currentVenta.montoPagado),
        metodoPago: 'YAPE',
        tipo: isTotal ? 'PAGO_TOTAL' : 'ANTICIPO',
        notas: 'Pago inicial registrado en pedido'
      }
    })
  }

  await prisma.pagoVenta.create({
    data: {
      ventaId: id,
      fecha: fechaPago,
      monto,
      metodoPago: data.metodoPago || 'YAPE',
      tipo: tipoPago,
      notas: data.notas || null
    }
  })

  const allPagos = await prisma.pagoVenta.findMany({
    where: { ventaId: id },
    orderBy: { fecha: 'asc' }
  })

  const totalPagado = allPagos.reduce((sum, p) => sum + Number(p.monto), 0)
  const totalVenta = Number(currentVenta.total)
  const saldoPendiente = Math.max(0, totalVenta - totalPagado)

  const updatedVenta = await prisma.venta.update({
    where: { id },
    data: {
      montoPagado: totalPagado,
      saldoPendiente,
    },
    include: {
      producto: true,
      colorFilamento: true,
      pagos: {
        orderBy: { fecha: 'asc' }
      }
    }
  })

  safeRevalidate()
  return serializeVenta(updatedVenta)
}

export async function liquidarSaldoTotal(
  id: string,
  options?: {
    fecha?: string | Date
    metodoPago?: string
    notas?: string
  }
) {
  const currentVenta = await prisma.venta.findUnique({
    where: { id },
    include: { pagos: { orderBy: { fecha: 'asc' } } }
  })
  if (!currentVenta) throw new Error("Venta no encontrada")

  const saldoPendiente = Number(currentVenta.saldoPendiente)
  if (saldoPendiente > 0) {
    const fechaPago = parseDateInput(options?.fecha) || new Date()

    if ((!currentVenta.pagos || currentVenta.pagos.length === 0) && Number(currentVenta.montoPagado) > 0) {
      await prisma.pagoVenta.create({
        data: {
          ventaId: id,
          fecha: currentVenta.fecha,
          monto: Number(currentVenta.montoPagado),
          metodoPago: 'YAPE',
          tipo: 'ANTICIPO',
          notas: 'Pago inicial registrado en pedido'
        }
      })
    }

    await prisma.pagoVenta.create({
      data: {
        ventaId: id,
        fecha: fechaPago,
        monto: saldoPendiente,
        metodoPago: options?.metodoPago || 'YAPE',
        tipo: 'SALDO_ENTREGA',
        notas: options?.notas || 'Liquidación de saldo'
      }
    })
  }

  const allPagos = await prisma.pagoVenta.findMany({
    where: { ventaId: id },
    orderBy: { fecha: 'asc' }
  })

  const totalPagado = allPagos.length > 0 
    ? allPagos.reduce((sum, p) => sum + Number(p.monto), 0) 
    : Number(currentVenta.total)

  const updatedVenta = await prisma.venta.update({
    where: { id },
    data: {
      montoPagado: totalPagado,
      saldoPendiente: Math.max(0, Number(currentVenta.total) - totalPagado),
    },
    include: {
      producto: true,
      colorFilamento: true,
      pagos: {
        orderBy: { fecha: 'asc' }
      }
    }
  })

  safeRevalidate()
  return serializeVenta(updatedVenta)
}

export async function deletePagoVenta(pagoId: string, ventaIdFallback?: string) {
  let ventaId = ventaIdFallback

  if (pagoId.startsWith('legacy-')) {
    ventaId = pagoId.replace('legacy-', '')
    const venta = await prisma.venta.findUnique({ where: { id: ventaId } })
    if (venta) {
      await prisma.pagoVenta.deleteMany({ where: { ventaId } })
      const updated = await prisma.venta.update({
        where: { id: ventaId },
        data: {
          montoPagado: 0,
          saldoPendiente: Number(venta.total)
        },
        include: {
          producto: true,
          colorFilamento: true,
          pagos: { orderBy: { fecha: 'asc' } }
        }
      })
      safeRevalidate()
      return serializeVenta(updated)
    }
  }

  const pago = await prisma.pagoVenta.findUnique({ where: { id: pagoId } })
  if (pago) {
    ventaId = pago.ventaId
    await prisma.pagoVenta.delete({ where: { id: pagoId } })
  }

  if (ventaId) {
    const remainingPagos = await prisma.pagoVenta.findMany({ where: { ventaId } })
    const totalPagado = remainingPagos.reduce((sum, p) => sum + Number(p.monto), 0)
    const venta = await prisma.venta.findUnique({ where: { id: ventaId } })
    if (venta) {
      const saldoPendiente = Math.max(0, Number(venta.total) - totalPagado)
      const updated = await prisma.venta.update({
        where: { id: ventaId },
        data: {
          montoPagado: totalPagado,
          saldoPendiente
        },
        include: {
          producto: true,
          colorFilamento: true,
          pagos: { orderBy: { fecha: 'asc' } }
        }
      })
      safeRevalidate()
      return serializeVenta(updated)
    }
  }

  safeRevalidate()
  return { success: true }
}

export async function updatePagoVenta(pagoId: string, data: {
  fecha?: string | Date
  monto?: number
  metodoPago?: string
  tipo?: string
  notas?: string
  ventaId?: string
}) {
  let ventaId = data.ventaId
  const newMonto = data.monto !== undefined ? Number(data.monto) : 0
  const fechaPago = parseDateInput(data.fecha) || new Date()
  const metodoPago = data.metodoPago || 'YAPE'
  const tipo = data.tipo || 'ABONO'
  const notas = data.notas || null

  if (pagoId.startsWith('legacy-')) {
    ventaId = pagoId.replace('legacy-', '')
    await prisma.pagoVenta.deleteMany({ where: { ventaId } })
    if (newMonto > 0) {
      await prisma.pagoVenta.create({
        data: {
          ventaId,
          fecha: fechaPago,
          monto: newMonto,
          metodoPago,
          tipo,
          notas
        }
      })
    }
  } else {
    const existing = await prisma.pagoVenta.findUnique({ where: { id: pagoId } })
    if (existing) {
      ventaId = existing.ventaId
      await prisma.pagoVenta.update({
        where: { id: pagoId },
        data: {
          fecha: fechaPago,
          monto: newMonto,
          metodoPago,
          tipo,
          notas
        }
      })
    } else if (ventaId && newMonto > 0) {
      await prisma.pagoVenta.create({
        data: {
          ventaId,
          fecha: fechaPago,
          monto: newMonto,
          metodoPago,
          tipo,
          notas
        }
      })
    }
  }

  if (ventaId) {
    const remainingPagos = await prisma.pagoVenta.findMany({
      where: { ventaId },
      orderBy: { fecha: 'asc' }
    })
    const totalPagado = remainingPagos.reduce((sum, p) => sum + Number(p.monto), 0)
    const venta = await prisma.venta.findUnique({ where: { id: ventaId } })
    if (venta) {
      const saldoPendiente = Math.max(0, Number(venta.total) - totalPagado)
      const updated = await prisma.venta.update({
        where: { id: ventaId },
        data: {
          montoPagado: totalPagado,
          saldoPendiente
        },
        include: {
          producto: true,
          colorFilamento: true,
          pagos: { orderBy: { fecha: 'asc' } }
        }
      })
      safeRevalidate()
      return serializeVenta(updated)
    }
  }

  safeRevalidate()
  return { success: true }
}

export async function deleteVenta(id: string) {
  const current = await prisma.venta.findUnique({ where: { id } })
  if (current && current.colorFilamentoId && current.estado !== 'CANCELADO') {
    const gramos = current.gramosConsumidos != null ? Number(current.gramosConsumidos) : 0
    if (gramos > 0) {
      await ajustarStockBobina(current.colorFilamentoId, -gramos)
    }
  }

  await prisma.venta.delete({
    where: { id }
  })
  safeRevalidate()
  return { success: true }
}

export async function getPromedioPackaging(): Promise<number> {
  const egresosPackaging = await prisma.inversion.findMany({
    where: {
      OR: [
        { categoria: 'INSUMO' },
        { subcategoria: { contains: 'packaging', mode: 'insensitive' } },
        { itemConcepto: { contains: 'bolsa', mode: 'insensitive' } },
        { itemConcepto: { contains: 'caja', mode: 'insensitive' } },
        { itemConcepto: { contains: 'packaging', mode: 'insensitive' } },
        { itemConcepto: { contains: 'embalaje', mode: 'insensitive' } },
      ]
    },
    select: { costoTotal: true }
  })

  if (egresosPackaging.length === 0) return 1.50
  const suma = egresosPackaging.reduce((acc, e) => acc + Number(e.costoTotal), 0)
  return Number((suma / egresosPackaging.length).toFixed(2))
}
