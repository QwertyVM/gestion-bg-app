'use server'

import prisma from '@/lib/prisma'
import { getActiveNegocioServer } from '@/lib/business-server'
import { TipoNegocio } from '@/lib/business'
import { revalidatePath } from 'next/cache'

function safeRevalidate() {
  try {
    revalidatePath('/clientes')
    revalidatePath('/pedidos')
    revalidatePath('/ventas')
    revalidatePath('/')
  } catch (e) {
    // ignore outside request context
  }
}

export interface ClienteItem {
  id: string
  negocio: string
  nombre: string
  dni?: string | null
  telefono?: string | null
  email?: string | null
  canalOrigen?: string | null
  handleSocial?: string | null
  direccion?: string | null
  distrito?: string | null
  notas?: string | null
  activo: boolean
  // Métricas dinámicas calculadas
  totalComprado: number
  totalPagado: number
  saldoPendiente: number
  puntos: number
  pedidosCount: number
  piezasCount: number
  ultimoPedidoFecha?: string | null
  canalPreferido?: string | null
  createdAt: string
  updatedAt: string
}

export interface ClienteDetalleView extends ClienteItem {
  pedidos: Array<{
    id: string
    codigo: string
    fecha: string
    estado: string
    total: number
    montoPagado: number
    saldoPendiente: number
    canalVenta?: string | null
    items: Array<{
      nombre: string
      cantidad: number
      precioUnitario: number
      subtotal: number
    }>
  }>
  ventas: Array<{
    id: string
    fecha: string
    estado: string
    total: number
    montoPagado: number
    saldoPendiente: number
    productoNombre: string
    cantidad: number
  }>
}

/**
 * Obtener todos los clientes del negocio activo con sus métricas consolidadas
 * (incluyendo clientes descubiertos de pedidos y ventas históricas).
 */
export async function getClientes(negocio?: TipoNegocio): Promise<ClienteItem[]> {
  const targetNegocio = negocio || await getActiveNegocioServer()

  // 1. Clientes registrados en tabla Cliente
  const dbClientes = await prisma.cliente.findMany({
    where: { negocio: targetNegocio },
    orderBy: { nombre: 'asc' }
  })

  // 2. Pedidos del negocio para métricas consolidadas (fuente única de pedidos y ventas)
  const dbPedidos = await prisma.pedido.findMany({
    where: { negocio: targetNegocio },
    include: {
      items: true
    },
    orderBy: { fecha: 'desc' }
  })

  // Mapa de métricas por nombre normalizado (lowercase)
  const metricsMap: Record<string, {
    totalComprado: number
    totalPagado: number
    saldoPendiente: number
    puntos: number
    pedidosCount: number
    piezasCount: number
    ultimoPedidoFecha?: string | null
    canales: Record<string, number>
    dniSugerido?: string | null
    telefonoSugerido?: string | null
    canalSugerido?: string | null
    destinoSugerido?: string | null
  }> = {}

  // Procesar pedidos
  dbPedidos.forEach((p: any) => {
    const rawName = (p.cliente || '').trim()
    if (!rawName) return
    const key = rawName.toLowerCase()

    if (!metricsMap[key]) {
      metricsMap[key] = {
        totalComprado: 0,
        totalPagado: 0,
        saldoPendiente: 0,
        puntos: 0,
        pedidosCount: 0,
        piezasCount: 0,
        ultimoPedidoFecha: null,
        canales: {},
        dniSugerido: p.dni || null,
        telefonoSugerido: p.telefono || null,
        canalSugerido: p.canalVenta || null,
        destinoSugerido: p.destinoEnvio || null
      }
    }

    const m = metricsMap[key]
    m.totalComprado += Number(p.total || 0)
    m.totalPagado += Number(p.montoPagado || 0)
    m.saldoPendiente += Number(p.saldoPendiente || 0)
    m.pedidosCount += 1
    
    if (p.estado === 'ENTREGADO') {
      m.puntos += Number(p.total || 0)
    }

    const cantItems = Array.isArray(p.items) && p.items.length > 0
      ? p.items.reduce((sum: number, it: any) => sum + (Number(it.cantidad) || 1), 0)
      : 1
    m.piezasCount += cantItems

    if (p.canalVenta) {
      m.canales[p.canalVenta] = (m.canales[p.canalVenta] || 0) + 1
    }

    const fechaStr = p.fecha instanceof Date ? p.fecha.toISOString() : String(p.fecha)
    if (!m.ultimoPedidoFecha || new Date(fechaStr).getTime() > new Date(m.ultimoPedidoFecha).getTime()) {
      m.ultimoPedidoFecha = fechaStr
    }
  })

  // Conjunto de clientes ya representados en la BD
  const registeredNames = new Set<string>()

  const result: ClienteItem[] = dbClientes.map((c: any) => {
    registeredNames.add(c.nombre.trim().toLowerCase())
    const m = metricsMap[c.nombre.trim().toLowerCase()] || {
      totalComprado: 0,
      totalPagado: 0,
      saldoPendiente: 0,
      puntos: 0,
      pedidosCount: 0,
      piezasCount: 0,
      ultimoPedidoFecha: null,
      canales: {}
    }

    let canalPreferido = c.canalOrigen || null
    if (!canalPreferido && Object.keys(m.canales).length > 0) {
      let max = 0
      Object.entries(m.canales).forEach(([canal, count]) => {
        if (count > max) {
          max = count
          canalPreferido = canal
        }
      })
    }

    return {
      id: c.id,
      negocio: c.negocio,
      nombre: c.nombre,
      dni: c.dni || m.dniSugerido || null,
      telefono: c.telefono || m.telefonoSugerido || null,
      email: c.email || null,
      canalOrigen: c.canalOrigen || canalPreferido || null,
      handleSocial: c.handleSocial || null,
      direccion: c.direccion || m.destinoSugerido || null,
      distrito: c.distrito || null,
      notas: c.notas || null,
      activo: c.activo,
      totalComprado: Number(m.totalComprado.toFixed(2)),
      totalPagado: Number(m.totalPagado.toFixed(2)),
      saldoPendiente: Number(m.saldoPendiente.toFixed(2)),
      puntos: Math.floor(m.puntos),
      pedidosCount: m.pedidosCount,
      piezasCount: m.piezasCount,
      ultimoPedidoFecha: m.ultimoPedidoFecha,
      canalPreferido,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }
  })

  // Auto-descubrir clientes de pedidos históricos que aún no están en la tabla Cliente
  Object.entries(metricsMap).forEach(([key, m]) => {
    if (!registeredNames.has(key)) {
      // Encontrar el nombre capitalizado original en los pedidos
      const originalPed = dbPedidos.find((p: any) => p.cliente.trim().toLowerCase() === key)
      const nombreReal = originalPed?.cliente.trim() || key

      let canalPreferido = m.canalSugerido || null
      if (Object.keys(m.canales).length > 0) {
        let max = 0
        Object.entries(m.canales).forEach(([canal, count]) => {
          if (count > max) {
            max = count
            canalPreferido = canal
          }
        })
      }

      result.push({
        id: `auto-${key}`,
        negocio: targetNegocio,
        nombre: nombreReal,
        dni: m.dniSugerido || null,
        telefono: m.telefonoSugerido || null,
        email: null,
        canalOrigen: canalPreferido,
        handleSocial: null,
        direccion: m.destinoSugerido || null,
        distrito: null,
        notas: null,
        activo: true,
        totalComprado: Number(m.totalComprado.toFixed(2)),
        totalPagado: Number(m.totalPagado.toFixed(2)),
        saldoPendiente: Number(m.saldoPendiente.toFixed(2)),
        puntos: Math.floor(m.puntos),
        pedidosCount: m.pedidosCount,
        piezasCount: m.piezasCount,
        ultimoPedidoFecha: m.ultimoPedidoFecha,
        canalPreferido,
        createdAt: m.ultimoPedidoFecha || new Date().toISOString(),
        updatedAt: m.ultimoPedidoFecha || new Date().toISOString(),
      })
    }
  })

  // Ordenar por volumen de compra descendente (LTV)
  return result.sort((a, b) => b.totalComprado - a.totalComprado || a.nombre.localeCompare(b.nombre))
}

/**
 * Obtener detalle e historial de pedidos de un cliente específico (fuente única de pedidos)
 */
export async function getClienteDetalle(idOrName: string, negocio?: TipoNegocio): Promise<ClienteDetalleView | null> {
  const targetNegocio = negocio || await getActiveNegocioServer()

  // Buscar por ID o por nombre
  let cliente = await prisma.cliente.findFirst({
    where: {
      OR: [
        { id: idOrName },
        { nombre: { equals: idOrName, mode: 'insensitive' } }
      ],
      negocio: targetNegocio
    }
  })

  const clientName = cliente ? cliente.nombre : idOrName.replace(/^auto-/, '')

  // Obtener pedidos del cliente (fuente única de pedidos y ventas)
  const pedidos = await prisma.pedido.findMany({
    where: {
      cliente: { equals: clientName, mode: 'insensitive' },
      negocio: targetNegocio
    },
    include: {
      items: {
        include: { producto: true }
      }
    },
    orderBy: { fecha: 'desc' }
  })

  const totalComprado = pedidos.reduce((acc: number, p: any) => acc + Number(p.total), 0)
  const totalPagado = pedidos.reduce((acc: number, p: any) => acc + Number(p.montoPagado), 0)
  const saldoPendiente = pedidos.reduce((acc: number, p: any) => acc + Number(p.saldoPendiente), 0)
  const pedidosCount = pedidos.length
  const piezasCount = pedidos.reduce((acc: number, p: any) => acc + p.items.reduce((s: number, it: any) => s + Number(it.cantidad), 0), 0)
  const puntos = pedidos.filter((p: any) => p.estado === 'ENTREGADO').reduce((acc: number, p: any) => acc + Number(p.total), 0)
  const ultimoPedidoFecha = pedidos[0]?.fecha.toISOString() || null

  return {
    id: cliente?.id || `auto-${clientName.toLowerCase()}`,
    negocio: targetNegocio,
    nombre: clientName,
    dni: cliente?.dni || pedidos.find((p: any) => p.dni)?.dni || null,
    telefono: cliente?.telefono || pedidos.find((p: any) => p.telefono)?.telefono || null,
    email: cliente?.email || null,
    canalOrigen: cliente?.canalOrigen || pedidos[0]?.canalVenta || null,
    handleSocial: cliente?.handleSocial || null,
    direccion: cliente?.direccion || pedidos.find((p: any) => p.destinoEnvio)?.destinoEnvio || null,
    distrito: cliente?.distrito || null,
    notas: cliente?.notas || null,
    activo: cliente?.activo ?? true,
    totalComprado: Number(totalComprado.toFixed(2)),
    totalPagado: Number(totalPagado.toFixed(2)),
    saldoPendiente: Number(saldoPendiente.toFixed(2)),
    puntos: Math.floor(puntos),
    pedidosCount,
    piezasCount,
    ultimoPedidoFecha,
    canalPreferido: cliente?.canalOrigen || pedidos[0]?.canalVenta || null,
    createdAt: cliente?.createdAt.toISOString() || new Date().toISOString(),
    updatedAt: cliente?.updatedAt.toISOString() || new Date().toISOString(),
    pedidos: pedidos.map((p: any) => ({
      id: p.id,
      codigo: p.codigo,
      fecha: p.fecha.toISOString(),
      estado: p.estado,
      total: Number(p.total),
      montoPagado: Number(p.montoPagado),
      saldoPendiente: Number(p.saldoPendiente),
      canalVenta: p.canalVenta,
      items: p.items.map((it: any) => ({
        nombre: it.nombreProductoSnapshot || it.producto?.nombreModelo || 'Producto',
        cantidad: Number(it.cantidad),
        precioUnitario: Number(it.precioUnitario),
        subtotal: Number(it.subtotal)
      }))
    })),
    ventas: []
  }
}

/**
 * Crear un nuevo cliente en el directorio
 */
export async function createCliente(data: {
  negocio?: TipoNegocio
  nombre: string
  dni?: string
  telefono?: string
  email?: string
  canalOrigen?: string
  handleSocial?: string
  direccion?: string
  distrito?: string
  notas?: string
}) {
  const targetNegocio = data.negocio || await getActiveNegocioServer()
  const cleanNombre = data.nombre.trim()

  if (!cleanNombre) {
    throw new Error('El nombre del cliente es obligatorio')
  }

  // Verificar si ya existe en este negocio
  const existing = await prisma.cliente.findUnique({
    where: {
      nombre_negocio: {
        nombre: cleanNombre,
        negocio: targetNegocio
      }
    }
  })

  if (existing) {
    throw new Error(`Ya existe un cliente con el nombre "${cleanNombre}" en este negocio`)
  }

  const cliente = await prisma.cliente.create({
    data: {
      negocio: targetNegocio,
      nombre: cleanNombre,
      dni: data.dni?.trim() || null,
      telefono: data.telefono?.trim() || null,
      email: data.email?.trim() || null,
      canalOrigen: data.canalOrigen?.trim() || null,
      handleSocial: data.handleSocial?.trim() || null,
      direccion: data.direccion?.trim() || null,
      distrito: data.distrito?.trim() || null,
      notas: data.notas?.trim() || null,
      activo: true
    }
  })

  safeRevalidate()
  return {
    ...cliente,
    createdAt: cliente.createdAt.toISOString(),
    updatedAt: cliente.updatedAt.toISOString(),
  }
}

/**
 * Actualizar datos de un cliente
 */
export async function updateCliente(idOrName: string, data: {
  nombre?: string
  dni?: string
  telefono?: string
  email?: string
  canalOrigen?: string
  handleSocial?: string
  direccion?: string
  distrito?: string
  notas?: string
  activo?: boolean
}) {
  const targetNegocio = await getActiveNegocioServer()

  // Si el id comienza con "auto-", significa que era un cliente no registrado formalmente, lo creamos
  if (idOrName.startsWith('auto-')) {
    const rawNombre = (data.nombre || idOrName.replace(/^auto-/, '')).trim()
    const nuevo = await prisma.cliente.create({
      data: {
        negocio: targetNegocio,
        nombre: rawNombre,
        dni: data.dni?.trim() || null,
        telefono: data.telefono?.trim() || null,
        email: data.email?.trim() || null,
        canalOrigen: data.canalOrigen?.trim() || null,
        handleSocial: data.handleSocial?.trim() || null,
        direccion: data.direccion?.trim() || null,
        distrito: data.distrito?.trim() || null,
        notas: data.notas?.trim() || null,
        activo: data.activo ?? true
      }
    })
    safeRevalidate()
    return {
      ...nuevo,
      createdAt: nuevo.createdAt.toISOString(),
      updatedAt: nuevo.updatedAt.toISOString(),
    }
  }

  const updated = await prisma.cliente.update({
    where: { id: idOrName },
    data: {
      ...(data.nombre !== undefined ? { nombre: data.nombre.trim() } : {}),
      ...(data.dni !== undefined ? { dni: data.dni.trim() || null } : {}),
      ...(data.telefono !== undefined ? { telefono: data.telefono.trim() || null } : {}),
      ...(data.email !== undefined ? { email: data.email.trim() || null } : {}),
      ...(data.canalOrigen !== undefined ? { canalOrigen: data.canalOrigen.trim() || null } : {}),
      ...(data.handleSocial !== undefined ? { handleSocial: data.handleSocial.trim() || null } : {}),
      ...(data.direccion !== undefined ? { direccion: data.direccion.trim() || null } : {}),
      ...(data.distrito !== undefined ? { distrito: data.distrito.trim() || null } : {}),
      ...(data.notas !== undefined ? { notas: data.notas.trim() || null } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {})
    }
  })

  safeRevalidate()
  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

/**
 * Eliminar cliente
 */
export async function deleteCliente(id: string) {
  if (id.startsWith('auto-')) {
    return { success: true, message: 'Cliente archivado' }
  }

  await prisma.cliente.delete({
    where: { id }
  })

  safeRevalidate()
  return { success: true, message: 'Cliente eliminado correctamente' }
}
