'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getComentariosByProducto(productoId: string) {
  const comentarios = await prisma.comentarioProducto.findMany({
    where: { productoId },
    orderBy: { createdAt: 'desc' }
  })
  return comentarios.map(c => ({
    ...c,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString()
  }))
}

export async function createComentario(data: {
  productoId: string
  autor: string
  texto: string
  calificacion: number
  activo?: boolean
}) {
  const comentario = await prisma.comentarioProducto.create({
    data: {
      productoId: data.productoId,
      autor: data.autor.trim(),
      texto: data.texto.trim(),
      calificacion: Math.min(5, Math.max(1, data.calificacion)),
      activo: data.activo ?? true
    }
  })
  revalidatePath('/catalogo')
  return {
    ...comentario,
    createdAt: comentario.createdAt.toISOString(),
    updatedAt: comentario.updatedAt.toISOString()
  }
}

export async function updateComentario(id: string, data: {
  autor?: string
  texto?: string
  calificacion?: number
  activo?: boolean
}) {
  const comentario = await prisma.comentarioProducto.update({
    where: { id },
    data: {
      ...(data.autor !== undefined ? { autor: data.autor.trim() } : {}),
      ...(data.texto !== undefined ? { texto: data.texto.trim() } : {}),
      ...(data.calificacion !== undefined ? { calificacion: Math.min(5, Math.max(1, data.calificacion)) } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {})
    }
  })
  revalidatePath('/catalogo')
  return {
    ...comentario,
    createdAt: comentario.createdAt.toISOString(),
    updatedAt: comentario.updatedAt.toISOString()
  }
}

export async function toggleComentarioActivo(id: string) {
  const current = await prisma.comentarioProducto.findUnique({ where: { id } })
  if (!current) throw new Error('Comentario no encontrado')
  const updated = await prisma.comentarioProducto.update({
    where: { id },
    data: { activo: !current.activo }
  })
  revalidatePath('/catalogo')
  return {
    ...updated,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString()
  }
}

export async function deleteComentario(id: string) {
  await prisma.comentarioProducto.delete({ where: { id } })
  revalidatePath('/catalogo')
  return { deleted: true }
}
