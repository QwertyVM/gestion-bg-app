'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

function safeRevalidate() {
  try {
    revalidatePath('/finanzas')
    revalidatePath('/finanzas/ingresos')
    revalidatePath('/finanzas/flujo-caja')
    revalidatePath('/finanzas/proyecciones')
    revalidatePath('/')
  } catch (e) {
    // Ignore outside request context
  }
}

export async function getIngresos(negocio?: TipoNegocio) {
  const targetNegocio = negocio || await getActiveNegocioServer()

  const ingresos = await prisma.ingreso.findMany({
    where: { negocio: targetNegocio },
    orderBy: { fecha: 'desc' }
  })

  return ingresos.map(i => ({
    id: i.id,
    fecha: i.fecha.toISOString(),
    cliente: i.cliente,
    concepto: i.concepto,
    categoria: i.categoria,
    monto: Number(i.monto),
    metodoPago: i.metodoPago || 'YAPE',
    notas: i.notas || '',
    createdAt: i.createdAt.toISOString(),
    updatedAt: i.updatedAt.toISOString(),
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

export async function createIngreso(data: {
  negocio?: TipoNegocio
  cliente: string
  concepto: string
  categoria?: string
  monto: number
  metodoPago?: string
  notas?: string
  fecha?: string
}) {
  const targetNegocio = data.negocio || await getActiveNegocioServer()

  const ingreso = await prisma.ingreso.create({
    data: {
      negocio: targetNegocio,
      cliente: data.cliente,
      concepto: data.concepto,
      categoria: data.categoria || 'SERVICIO',
      monto: data.monto,
      metodoPago: data.metodoPago || 'YAPE',
      notas: data.notas || null,
      fecha: parseDateInput(data.fecha) || new Date(),
    }
  })

  safeRevalidate()

  return {
    id: ingreso.id,
    fecha: ingreso.fecha.toISOString(),
    cliente: ingreso.cliente,
    concepto: ingreso.concepto,
    categoria: ingreso.categoria,
    monto: Number(ingreso.monto),
    metodoPago: ingreso.metodoPago || 'YAPE',
    notas: ingreso.notas || '',
    createdAt: ingreso.createdAt.toISOString(),
    updatedAt: ingreso.updatedAt.toISOString(),
  }
}

export async function updateIngreso(id: string, data: {
  cliente?: string
  concepto?: string
  categoria?: string
  monto?: number
  metodoPago?: string
  notas?: string
  fecha?: string | Date
}) {
  const current = await prisma.ingreso.findUnique({ where: { id } })
  if (!current) throw new Error("Ingreso no encontrado")

  let newFecha = current.fecha
  if (data.fecha) {
    const currentFechaStr = current.fecha.toISOString().split('T')[0]
    const inputFechaStr = typeof data.fecha === 'string' ? data.fecha.split('T')[0] : data.fecha.toISOString().split('T')[0]
    if (inputFechaStr !== currentFechaStr) {
      const [year, month, day] = inputFechaStr.split('-').map(Number)
      if (year && month && day) {
        const target = new Date(current.fecha)
        target.setFullYear(year, month - 1, day)
        newFecha = target
      }
    }
  }

  const updated = await prisma.ingreso.update({
    where: { id },
    data: {
      cliente: data.cliente !== undefined ? data.cliente : current.cliente,
      concepto: data.concepto !== undefined ? data.concepto : current.concepto,
      categoria: data.categoria !== undefined ? data.categoria : current.categoria,
      monto: data.monto !== undefined ? data.monto : current.monto,
      metodoPago: data.metodoPago !== undefined ? data.metodoPago : current.metodoPago,
      notas: data.notas !== undefined ? data.notas : current.notas,
      fecha: newFecha,
    }
  })

  safeRevalidate()

  return {
    id: updated.id,
    fecha: updated.fecha.toISOString(),
    cliente: updated.cliente,
    concepto: updated.concepto,
    categoria: updated.categoria,
    monto: Number(updated.monto),
    metodoPago: updated.metodoPago || 'YAPE',
    notas: updated.notas || '',
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function deleteIngreso(id: string) {
  await prisma.ingreso.delete({ where: { id } })
  safeRevalidate()
}

export async function swapIngresoOrder(id1: string, id2: string) {
  const [ing1, ing2] = await Promise.all([
    prisma.ingreso.findUnique({ where: { id: id1 } }),
    prisma.ingreso.findUnique({ where: { id: id2 } })
  ])

  if (!ing1 || !ing2) throw new Error("Registros de ingreso no encontrados")

  // Ensure both belong to the exact same calendar day
  const dateStr1 = ing1.fecha.toISOString().split('T')[0]
  const dateStr2 = ing2.fecha.toISOString().split('T')[0]

  if (dateStr1 !== dateStr2) {
    throw new Error("No se puede mover un registro fuera de su fecha de ingreso")
  }

  let time1 = new Date(ing1.fecha)
  let time2 = new Date(ing2.fecha)

  if (time1.getTime() === time2.getTime()) {
    time1 = new Date(time1.getTime() + 1000)
  }

  await prisma.$transaction([
    prisma.ingreso.update({
      where: { id: id1 },
      data: { fecha: time2 }
    }),
    prisma.ingreso.update({
      where: { id: id2 },
      data: { fecha: time1 }
    })
  ])

  safeRevalidate()
  return { success: true }
}
