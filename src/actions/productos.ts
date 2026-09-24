'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { ajustarStockBobina } from '@/actions/inventario'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

function safeRevalidate() {
  try {
    revalidatePath('/catalogo')
    revalidatePath('/catalogo/productos')
    revalidatePath('/catalogo/inventario')
    revalidatePath('/inventario')
    revalidatePath('/ventas')
    revalidatePath('/pedidos')
    revalidatePath('/')
  } catch (e) {}
}

export async function getProductos(negocio?: TipoNegocio) {
  const targetNegocio = negocio || await getActiveNegocioServer()

  const productos = await prisma.producto.findMany({
    where: { negocio: targetNegocio },
    orderBy: [
      { activo: 'desc' },
      { lineaCategoria: 'asc' },
      { nombreModelo: 'asc' }
    ]
  })

  return productos.map(p => ({
    ...p,
    activo: p.activo ?? true,
    costoBase: Number(p.costoBase),
    precioAmigos: Number(p.precioAmigos),
    precioMercado: Number(p.precioMercado),
    precioComunidad: Number(p.precioComunidad),
    pesoGramos: p.pesoGramos != null ? Number(p.pesoGramos) : 0,
    precioOferta: p.precioOferta != null ? Number(p.precioOferta) : null,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))
}

export async function createProducto(data: {
  negocio?: TipoNegocio
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioAmigos: number
  precioMercado: number
  precioComunidad?: number
  pesoGramos?: number
  activo?: boolean
  stock?: number
  controlarStock?: boolean
  enOferta?: boolean
  precioOferta?: number | null
  imagenUrl?: string | null
  descripcionWeb?: string | null
  destacadoWeb?: boolean
  bulletPoint1?: string | null
  bulletPoint2?: string | null
  bulletPoint3?: string | null
  bulletPoint4?: string | null
  numJugadores?: string | null
  edadMinima?: number | null
  duracionMinutos?: number | null
  idioma?: string | null
  editorialMarca?: string | null
  mecanicas?: string | null
  bggId?: number | null
}) {
  const targetNegocio = data.negocio || await getActiveNegocioServer()

  const producto = await prisma.producto.create({
    data: {
      negocio: targetNegocio,
      lineaCategoria: data.lineaCategoria.trim(),
      nombreModelo: data.nombreModelo.trim(),
      costoBase: data.costoBase,
      precioAmigos: data.precioAmigos,
      precioMercado: data.precioMercado,
      precioComunidad: data.precioComunidad ?? data.precioMercado,
      pesoGramos: data.pesoGramos != null ? data.pesoGramos : 0,
      activo: data.activo ?? true,
      stock: data.stock ?? 0,
      controlarStock: data.controlarStock ?? false,
      enOferta: data.enOferta ?? false,
      precioOferta: data.precioOferta ?? null,
      imagenUrl: data.imagenUrl ?? null,
      descripcionWeb: data.descripcionWeb ?? null,
      destacadoWeb: data.destacadoWeb ?? false,
      bulletPoint1: data.bulletPoint1 ?? null,
      bulletPoint2: data.bulletPoint2 ?? null,
      bulletPoint3: data.bulletPoint3 ?? null,
      bulletPoint4: data.bulletPoint4 ?? null,
      numJugadores: data.numJugadores ?? null,
      edadMinima: data.edadMinima ?? null,
      duracionMinutos: data.duracionMinutos ?? null,
      idioma: data.idioma ?? null,
      editorialMarca: data.editorialMarca ?? null,
      mecanicas: data.mecanicas ?? null,
      bggId: data.bggId ?? null
    }
  })

  safeRevalidate()
  return {
    ...producto,
    costoBase: Number(producto.costoBase),
    precioAmigos: Number(producto.precioAmigos),
    precioMercado: Number(producto.precioMercado),
    precioComunidad: Number(producto.precioComunidad),
    pesoGramos: producto.pesoGramos != null ? Number(producto.pesoGramos) : 0,
    precioOferta: producto.precioOferta != null ? Number(producto.precioOferta) : null,
    createdAt: producto.createdAt.toISOString(),
    updatedAt: producto.updatedAt.toISOString(),
  }
}

export async function updateProducto(id: string, data: {
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioAmigos: number
  precioMercado: number
  precioComunidad?: number
  pesoGramos?: number
  activo?: boolean
  stock?: number
  controlarStock?: boolean
  enOferta?: boolean
  precioOferta?: number | null
  imagenUrl?: string | null
  descripcionWeb?: string | null
  destacadoWeb?: boolean
  bulletPoint1?: string | null
  bulletPoint2?: string | null
  bulletPoint3?: string | null
  bulletPoint4?: string | null
  numJugadores?: string | null
  edadMinima?: number | null
  duracionMinutos?: number | null
  idioma?: string | null
  editorialMarca?: string | null
  mecanicas?: string | null
  bggId?: number | null
}) {
  const current = await prisma.producto.findUnique({ where: { id } })
  const prevPesoGramos = current?.pesoGramos != null ? Number(current.pesoGramos) : 0
  const nuevoPesoGramos = data.pesoGramos !== undefined && data.pesoGramos !== null ? Number(data.pesoGramos) : prevPesoGramos

  const producto = await prisma.producto.update({
    where: { id },
    data: {
      lineaCategoria: data.lineaCategoria.trim(),
      nombreModelo: data.nombreModelo.trim(),
      costoBase: data.costoBase,
      precioAmigos: data.precioAmigos,
      precioMercado: data.precioMercado,
      precioComunidad: data.precioComunidad !== undefined ? data.precioComunidad : (current?.precioComunidad ?? data.precioMercado),
      ...(data.pesoGramos !== undefined ? { pesoGramos: data.pesoGramos } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
      ...(data.stock !== undefined ? { stock: data.stock } : {}),
      ...(data.controlarStock !== undefined ? { controlarStock: data.controlarStock } : {}),
      ...(data.enOferta !== undefined ? { enOferta: data.enOferta } : {}),
      ...(data.precioOferta !== undefined ? { precioOferta: data.precioOferta } : {}),
      ...(data.imagenUrl !== undefined ? { imagenUrl: data.imagenUrl } : {}),
      ...(data.descripcionWeb !== undefined ? { descripcionWeb: data.descripcionWeb } : {}),
      ...(data.destacadoWeb !== undefined ? { destacadoWeb: data.destacadoWeb } : {}),
      ...(data.bulletPoint1 !== undefined ? { bulletPoint1: data.bulletPoint1 } : {}),
      ...(data.bulletPoint2 !== undefined ? { bulletPoint2: data.bulletPoint2 } : {}),
      ...(data.bulletPoint3 !== undefined ? { bulletPoint3: data.bulletPoint3 } : {}),
      ...(data.bulletPoint4 !== undefined ? { bulletPoint4: data.bulletPoint4 } : {}),
      ...(data.numJugadores !== undefined ? { numJugadores: data.numJugadores } : {}),
      ...(data.edadMinima !== undefined ? { edadMinima: data.edadMinima } : {}),
      ...(data.duracionMinutos !== undefined ? { duracionMinutos: data.duracionMinutos } : {}),
      ...(data.idioma !== undefined ? { idioma: data.idioma } : {}),
      ...(data.editorialMarca !== undefined ? { editorialMarca: data.editorialMarca } : {}),
      ...(data.mecanicas !== undefined ? { mecanicas: data.mecanicas } : {}),
      ...(data.bggId !== undefined ? { bggId: data.bggId } : {})
    }
  })

  // Si se actualizó el peso en gramos, sincronizar todas las ventas activas de este producto y ajustar sus bobinas
  if (data.pesoGramos !== undefined && nuevoPesoGramos !== prevPesoGramos) {
    const ventasAsociadas = await prisma.venta.findMany({
      where: {
        productoId: id,
        estado: { not: 'CANCELADO' }
      }
    })

    for (const v of ventasAsociadas) {
      const cant = Number(v.cantidad || 1)
      const prevVentaGramos = v.gramosConsumidos != null && Number(v.gramosConsumidos) > 0
        ? Number(v.gramosConsumidos)
        : (prevPesoGramos * cant)
      const newVentaGramos = nuevoPesoGramos * cant
      const delta = newVentaGramos - prevVentaGramos

      await prisma.venta.update({
        where: { id: v.id },
        data: { gramosConsumidos: newVentaGramos }
      })

      if (v.colorFilamentoId && delta !== 0) {
        await ajustarStockBobina(v.colorFilamentoId, delta)
      }
    }
  }

  safeRevalidate()
  return {
    ...producto,
    costoBase: Number(producto.costoBase),
    precioAmigos: Number(producto.precioAmigos),
    precioMercado: Number(producto.precioMercado),
    precioComunidad: Number(producto.precioComunidad),
    pesoGramos: producto.pesoGramos != null ? Number(producto.pesoGramos) : 0,
    precioOferta: producto.precioOferta != null ? Number(producto.precioOferta) : null,
    createdAt: producto.createdAt.toISOString(),
    updatedAt: producto.updatedAt.toISOString(),
  }
}

export async function toggleEstadoProducto(id: string) {
  const current = await prisma.producto.findUnique({ where: { id } })
  if (!current) throw new Error('Producto no encontrado')

  const updated = await prisma.producto.update({
    where: { id },
    data: { activo: !current.activo }
  })

  safeRevalidate()
  return {
    ...updated,
    costoBase: Number(updated.costoBase),
    precioAmigos: Number(updated.precioAmigos),
    precioMercado: Number(updated.precioMercado),
    precioComunidad: Number(updated.precioComunidad),
    pesoGramos: updated.pesoGramos != null ? Number(updated.pesoGramos) : 0,
    precioOferta: updated.precioOferta != null ? Number(updated.precioOferta) : null,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function duplicarProducto(id: string) {
  const current = await prisma.producto.findUnique({ where: { id } })
  if (!current) throw new Error('Producto no encontrado')

  let nuevoNombre = `${current.nombreModelo} (Copia)`
  let count = 1
  while (await prisma.producto.findFirst({ where: { nombreModelo: nuevoNombre, negocio: current.negocio } })) {
    count++
    nuevoNombre = `${current.nombreModelo} (Copia ${count})`
  }

  const duplicado = await prisma.producto.create({
    data: {
      negocio: current.negocio,
      lineaCategoria: current.lineaCategoria,
      nombreModelo: nuevoNombre,
      costoBase: current.costoBase,
      precioAmigos: current.precioAmigos,
      precioMercado: current.precioMercado,
      precioComunidad: current.precioComunidad,
      pesoGramos: current.pesoGramos,
      activo: true,
      stock: 0,
      controlarStock: current.controlarStock,
      enOferta: current.enOferta,
      precioOferta: current.precioOferta,
      imagenUrl: current.imagenUrl,
      descripcionWeb: current.descripcionWeb,
      destacadoWeb: current.destacadoWeb
    }
  })

  safeRevalidate()
  return {
    ...duplicado,
    costoBase: Number(duplicado.costoBase),
    precioAmigos: Number(duplicado.precioAmigos),
    precioMercado: Number(duplicado.precioMercado),
    precioComunidad: Number(duplicado.precioComunidad),
    pesoGramos: duplicado.pesoGramos != null ? Number(duplicado.pesoGramos) : 0,
    precioOferta: duplicado.precioOferta != null ? Number(duplicado.precioOferta) : null,
    createdAt: duplicado.createdAt.toISOString(),
    updatedAt: duplicado.updatedAt.toISOString(),
  }
}

export async function deleteProducto(id: string) {
  const ventasCount = await prisma.venta.count({ where: { productoId: id } })
  if (ventasCount > 0) {
    await prisma.producto.update({
      where: { id },
      data: { activo: false }
    })
    safeRevalidate()
    return { discontinued: true, message: 'El producto tiene ventas históricas asociadas, por lo que fue marcado como Descontinuado.' }
  }

  await prisma.producto.delete({ where: { id } })
  safeRevalidate()
  return { deleted: true, message: 'Producto eliminado correctamente.' }
}
