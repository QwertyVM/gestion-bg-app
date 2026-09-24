'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

function safeRevalidate() {
  try {
    revalidatePath('/finanzas')
    revalidatePath('/finanzas/tags')
    revalidatePath('/finanzas/egresos')
    revalidatePath('/finanzas/flujo-caja')
    revalidatePath('/')
  } catch (e) {
    // Ignore outside request store
  }
}

export type CategoriaTag = 'INSUMO' | 'ACTIVO_FIJO' | 'SERVICIO' | 'MERCADERIA' | 'FINANCIERO'

export interface TagInsumoItem {
  id: string
  nombre: string
  descripcion: string | null
  color: string
  categoria: CategoriaTag
  totalEgresos: number
  gastoAcumulado: number
  createdAt: string
  updatedAt: string
}

export async function getTagsInsumos(negocio?: TipoNegocio): Promise<TagInsumoItem[]> {
  const targetNegocio = negocio || await getActiveNegocioServer()

  // 1. Obtener todos los tags registrados en TagInsumo del negocio activo
  const [tags, inversiones] = await Promise.all([
    prisma.tagInsumo.findMany({
      where: { negocio: targetNegocio },
      orderBy: { nombre: 'asc' }
    }),
    prisma.inversion.findMany({
      where: {
        negocio: targetNegocio,
        subcategoria: { not: null }
      },
      select: { subcategoria: true, costoTotal: true }
    })
  ])

  // 2. Mapear con estadísticas de uso en vivo
  return tags.map(tag => {
    const itemsConTag = inversiones.filter(
      i => i.subcategoria?.trim().toLowerCase() === tag.nombre.trim().toLowerCase()
    )
    const totalEgresos = itemsConTag.length
    const gastoAcumulado = itemsConTag.reduce((acc, i) => acc + Number(i.costoTotal || 0), 0)

    const cat: CategoriaTag = 
      tag.categoria === 'ACTIVO_FIJO' || tag.categoria === 'SERVICIO' || tag.categoria === 'INSUMO' || tag.categoria === 'MERCADERIA' || tag.categoria === 'FINANCIERO'
        ? tag.categoria as CategoriaTag
        : 'INSUMO'

    return {
      id: tag.id,
      nombre: tag.nombre,
      descripcion: tag.descripcion,
      color: tag.color || 'amber',
      categoria: cat,
      totalEgresos,
      gastoAcumulado: Number(gastoAcumulado.toFixed(2)),
      createdAt: tag.createdAt.toISOString(),
      updatedAt: tag.updatedAt.toISOString(),
    }
  })
}

export async function createTagInsumo(data: {
  negocio?: TipoNegocio
  nombre: string
  descripcion?: string | null
  color?: string
  categoria?: CategoriaTag
}) {
  const targetNegocio = data.negocio || await getActiveNegocioServer()
  const nombreTrim = data.nombre.trim()
  if (!nombreTrim) throw new Error("El nombre del tag es obligatorio")

  const exists = await prisma.tagInsumo.findFirst({
    where: {
      negocio: targetNegocio,
      nombre: { equals: nombreTrim, mode: 'insensitive' }
    }
  })

  if (exists) {
    throw new Error(`El tag "${nombreTrim}" ya existe`)
  }

  const created = await prisma.tagInsumo.create({
    data: {
      negocio: targetNegocio,
      nombre: nombreTrim,
      descripcion: data.descripcion?.trim() || null,
      color: data.color || 'amber',
      categoria: data.categoria || 'INSUMO',
    }
  })

  safeRevalidate()

  return {
    id: created.id,
    nombre: created.nombre,
    descripcion: created.descripcion,
    color: created.color || 'amber',
    categoria: (created.categoria || 'INSUMO') as CategoriaTag,
    totalEgresos: 0,
    gastoAcumulado: 0,
    createdAt: created.createdAt.toISOString(),
    updatedAt: created.updatedAt.toISOString(),
  }
}

export async function updateTagInsumo(id: string, data: {
  nombre: string
  descripcion?: string | null
  color?: string
  categoria?: CategoriaTag
}) {
  const nombreTrim = data.nombre.trim()
  if (!nombreTrim) throw new Error("El nombre del tag es obligatorio")

  const current = await prisma.tagInsumo.findUnique({ where: { id } })
  if (!current) throw new Error("Tag no encontrado")

  // Si cambia el nombre, verificar que no esté duplicado en el mismo negocio
  if (current.nombre.toLowerCase() !== nombreTrim.toLowerCase()) {
    const duplicate = await prisma.tagInsumo.findFirst({
      where: { 
        negocio: current.negocio,
        nombre: { equals: nombreTrim, mode: 'insensitive' },
        id: { not: id }
      }
    })
    if (duplicate) throw new Error(`El tag "${nombreTrim}" ya existe`)
  }

  const updated = await prisma.tagInsumo.update({
    where: { id },
    data: {
      nombre: nombreTrim,
      descripcion: data.descripcion !== undefined ? (data.descripcion?.trim() || null) : current.descripcion,
      color: data.color || current.color,
      categoria: data.categoria || current.categoria || 'INSUMO',
    }
  })

  // Actualizar también los registros de inversiones asociadas del mismo negocio
  await prisma.inversion.updateMany({
    where: {
      negocio: current.negocio,
      subcategoria: { equals: current.nombre, mode: 'insensitive' }
    },
    data: { subcategoria: nombreTrim }
  })

  safeRevalidate()

  return {
    id: updated.id,
    nombre: updated.nombre,
    descripcion: updated.descripcion,
    color: updated.color || 'amber',
    categoria: (updated.categoria || 'INSUMO') as CategoriaTag,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function deleteTagInsumo(id: string) {
  const current = await prisma.tagInsumo.findUnique({ where: { id } })
  if (!current) throw new Error("Tag no encontrado")

  // 1. Limpiar la referencia en las inversiones existentes del mismo negocio
  await prisma.inversion.updateMany({
    where: {
      negocio: current.negocio,
      subcategoria: { equals: current.nombre, mode: 'insensitive' }
    },
    data: { subcategoria: null }
  })

  // 2. Eliminar de forma definitiva de la tabla TagInsumo
  await prisma.tagInsumo.delete({ where: { id } })

  safeRevalidate()
}

