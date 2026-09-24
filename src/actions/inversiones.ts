'use server'

import prisma from '@/lib/prisma'
import { CategoriaInversion } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

function safeRevalidate() {
  try {
    revalidatePath('/finanzas')
    revalidatePath('/finanzas/egresos')
    revalidatePath('/finanzas/flujo-caja')
    revalidatePath('/finanzas/proyecciones')
    revalidatePath('/inversiones')
    revalidatePath('/')
  } catch (e) {
    // Ignore if called outside Next.js request store
  }
}

export async function getInversiones(negocio?: TipoNegocio) {
  const targetNegocio = negocio || await getActiveNegocioServer()

  const inversiones = await prisma.inversion.findMany({
    where: { negocio: targetNegocio },
    orderBy: { createdAt: 'desc' }
  })

  return inversiones.map(inv => ({
    ...inv,
    subcategoria: inv.subcategoria || null,
    costoUnitario: Number(inv.costoUnitario),
    costoEnvio: inv.costoEnvio ? Number(inv.costoEnvio) : null,
    costoTotal: Number(inv.costoTotal),
    costoPorGramo: inv.costoPorGramo ? Number(inv.costoPorGramo) : null,
    montoCuota: inv.montoCuota ? Number(inv.montoCuota) : null,
    createdAt: inv.createdAt.toISOString(),
    updatedAt: inv.updatedAt.toISOString(),
  }))
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

export async function createInversion(data: {
  negocio?: TipoNegocio
  persona?: string
  categoria: CategoriaInversion
  subcategoria?: string | null
  itemConcepto: string
  especificacionColor?: string | null
  presentacion?: string | null
  cantidad: number
  costoUnitario: number
  costoEnvio?: number
  numeroCuotas?: number | null
  fecha?: string | Date
}) {
  const targetNegocio = data.negocio || await getActiveNegocioServer()

  const costoTotal = (data.cantidad * data.costoUnitario) + (data.costoEnvio || 0)
  
  let montoCuota = null
  if (data.numeroCuotas && data.numeroCuotas > 0) {
    montoCuota = costoTotal / data.numeroCuotas
  }

  // Extraer gramos si dice "1kg" o "1000g"
  let costoPorGramo = null
  if (data.presentacion && data.categoria === 'INSUMO') {
    const match = data.presentacion.match(/(\d+)\s*(kg|g)/i)
    if (match) {
      const amount = parseFloat(match[1])
      const unit = match[2].toLowerCase()
      const totalGrams = (unit === 'kg' ? amount * 1000 : amount) * data.cantidad
      if (totalGrams > 0) {
        costoPorGramo = costoTotal / totalGrams
      }
    }
  }

  const inversion = await prisma.inversion.create({
    data: {
      negocio: targetNegocio,
      persona: data.persona || 'Víctor',
      categoria: data.categoria,
      subcategoria: data.subcategoria || undefined,
      itemConcepto: data.itemConcepto,
      especificacionColor: data.especificacionColor || undefined,
      presentacion: data.presentacion || undefined,
      cantidad: data.cantidad,
      costoUnitario: data.costoUnitario,
      costoEnvio: data.costoEnvio || 0,
      costoTotal,
      costoPorGramo,
      numeroCuotas: data.numeroCuotas,
      montoCuota,
      createdAt: parseDateInput(data.fecha)
    }
  })

  safeRevalidate()

  return {
    ...inversion,
    subcategoria: inversion.subcategoria || null,
    costoUnitario: Number(inversion.costoUnitario),
    costoEnvio: inversion.costoEnvio ? Number(inversion.costoEnvio) : null,
    costoTotal: Number(inversion.costoTotal),
    costoPorGramo: inversion.costoPorGramo ? Number(inversion.costoPorGramo) : null,
    montoCuota: inversion.montoCuota ? Number(inversion.montoCuota) : null,
    createdAt: inversion.createdAt.toISOString(),
    updatedAt: inversion.updatedAt.toISOString(),
  }
}

export async function updateInversion(id: string, data: {
  persona?: string | null
  categoria?: CategoriaInversion
  subcategoria?: string | null
  itemConcepto?: string
  especificacionColor?: string | null
  presentacion?: string | null
  cantidad?: number
  costoUnitario?: number
  costoEnvio?: number
  numeroCuotas?: number | null
  fecha?: string | Date
}) {
  const current = await prisma.inversion.findUnique({ where: { id } })
  if (!current) throw new Error("Registro de egreso no encontrado")

  const cantidad = data.cantidad !== undefined ? data.cantidad : current.cantidad
  const costoUnitario = data.costoUnitario !== undefined ? data.costoUnitario : Number(current.costoUnitario)
  const costoEnvio = data.costoEnvio !== undefined ? data.costoEnvio : (current.costoEnvio ? Number(current.costoEnvio) : 0)
  const categoria = data.categoria || current.categoria
  const subcategoria = data.subcategoria !== undefined ? data.subcategoria : current.subcategoria
  const presentacion = data.presentacion !== undefined ? data.presentacion : current.presentacion
  const numeroCuotas = data.numeroCuotas !== undefined ? data.numeroCuotas : current.numeroCuotas

  const costoTotal = (cantidad * costoUnitario) + costoEnvio

  let montoCuota = null
  if (numeroCuotas && numeroCuotas > 0) {
    montoCuota = costoTotal / numeroCuotas
  }

  let costoPorGramo = null
  if (presentacion && categoria === 'INSUMO') {
    const match = presentacion.match(/(\d+)\s*(kg|g)/i)
    if (match) {
      const amount = parseFloat(match[1])
      const unit = match[2].toLowerCase()
      const totalGrams = (unit === 'kg' ? amount * 1000 : amount) * cantidad
      if (totalGrams > 0) {
        costoPorGramo = costoTotal / totalGrams
      }
    }
  }

  let newCreatedAt = current.createdAt
  if (data.fecha) {
    const currentFechaStr = current.createdAt.toISOString().split('T')[0]
    const inputFechaStr = typeof data.fecha === 'string' ? data.fecha.split('T')[0] : data.fecha.toISOString().split('T')[0]
    if (inputFechaStr !== currentFechaStr) {
      const [year, month, day] = inputFechaStr.split('-').map(Number)
      if (year && month && day) {
        const target = new Date(current.createdAt)
        target.setFullYear(year, month - 1, day)
        newCreatedAt = target
      }
    }
  }

  const updated = await prisma.inversion.update({
    where: { id },
    data: {
      persona: data.persona !== undefined ? (data.persona || 'Víctor') : current.persona,
      categoria,
      subcategoria: data.subcategoria !== undefined ? data.subcategoria : current.subcategoria,
      itemConcepto: data.itemConcepto !== undefined ? data.itemConcepto : current.itemConcepto,
      especificacionColor: data.especificacionColor !== undefined ? data.especificacionColor : current.especificacionColor,
      presentacion: data.presentacion !== undefined ? data.presentacion : current.presentacion,
      cantidad,
      costoUnitario,
      costoEnvio,
      costoTotal,
      costoPorGramo,
      numeroCuotas: data.numeroCuotas !== undefined ? data.numeroCuotas : current.numeroCuotas,
      montoCuota,
      createdAt: newCreatedAt
    }
  })

  safeRevalidate()

  return {
    ...updated,
    subcategoria: updated.subcategoria || null,
    costoUnitario: Number(updated.costoUnitario),
    costoEnvio: updated.costoEnvio ? Number(updated.costoEnvio) : null,
    costoTotal: Number(updated.costoTotal),
    costoPorGramo: updated.costoPorGramo ? Number(updated.costoPorGramo) : null,
    montoCuota: updated.montoCuota ? Number(updated.montoCuota) : null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function deleteInversion(id: string) {
  await prisma.inversion.delete({ where: { id } })
  safeRevalidate()
}

export async function swapInversionOrder(id1: string, id2: string) {
  const [inv1, inv2] = await Promise.all([
    prisma.inversion.findUnique({ where: { id: id1 } }),
    prisma.inversion.findUnique({ where: { id: id2 } })
  ])

  if (!inv1 || !inv2) throw new Error("Registros no encontrados")

  // Ensure both belong to the exact same calendar day
  const dateStr1 = inv1.createdAt.toISOString().split('T')[0]
  const dateStr2 = inv2.createdAt.toISOString().split('T')[0]

  if (dateStr1 !== dateStr2) {
    throw new Error("No se puede mover un registro fuera de su fecha de egreso")
  }

  let time1 = new Date(inv1.createdAt)
  let time2 = new Date(inv2.createdAt)

  // If their timestamps are identical, separate them by 1 second
  if (time1.getTime() === time2.getTime()) {
    time1 = new Date(time1.getTime() + 1000)
  }

  await prisma.$transaction([
    prisma.inversion.update({
      where: { id: id1 },
      data: { createdAt: time2 }
    }),
    prisma.inversion.update({
      where: { id: id2 },
      data: { createdAt: time1 }
    })
  ])

  safeRevalidate()
  return { success: true }
}

export async function getProductosCatalog(negocio?: TipoNegocio) {
  const targetNegocio = negocio || await getActiveNegocioServer()
  const productos = await prisma.producto.findMany({
    where: { negocio: targetNegocio, activo: true },
    select: {
      id: true,
      nombreModelo: true,
      lineaCategoria: true,
      costoBase: true,
      stock: true,
    },
    orderBy: { nombreModelo: 'asc' }
  })
  return productos.map(p => ({
    id: p.id,
    nombreModelo: p.nombreModelo,
    lineaCategoria: p.lineaCategoria,
    costoBase: Number(p.costoBase),
    stock: p.stock
  }))
}
