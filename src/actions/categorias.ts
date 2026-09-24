'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

export interface CategoriaProductoSummary {
  id: string
  nombreModelo: string
  costoBase: number
  precioMercado: number
  pesoGramos?: number | null
  activo: boolean
}

export interface CategoriaItem {
  id: string
  nombre: string
  descripcion: string
  totalProductos: number
  productos: CategoriaProductoSummary[]
  createdAt: string
  updatedAt: string
}

export async function getCategorias(negocio?: TipoNegocio): Promise<CategoriaItem[]> {
  const targetNegocio = negocio || await getActiveNegocioServer()

  // Get all active and inactive products to ensure all categories are synchronized
  const productos = await prisma.producto.findMany({
    where: { negocio: targetNegocio },
    select: { 
      id: true,
      lineaCategoria: true,
      nombreModelo: true,
      costoBase: true,
      precioMercado: true,
      pesoGramos: true,
      activo: true
    },
    orderBy: { nombreModelo: 'asc' }
  })

  // Ensure any product categories exist in Categoria table in database
  const distinctProductCats = Array.from(new Set(productos.map(p => p.lineaCategoria?.trim()).filter(Boolean)))
  for (const catName of distinctProductCats) {
    await prisma.categoria.upsert({
      where: {
        nombre_negocio: {
          nombre: catName,
          negocio: targetNegocio
        }
      },
      update: {},
      create: {
        nombre: catName,
        negocio: targetNegocio
      },
    })
  }

  const categorias = await prisma.categoria.findMany({
    where: { negocio: targetNegocio },
    orderBy: { nombre: 'asc' },
  })

  // Map products to categories
  const productosPorCategoria: Record<string, CategoriaProductoSummary[]> = {}
  productos.forEach(p => {
    const cat = p.lineaCategoria || 'General'
    if (!productosPorCategoria[cat]) {
      productosPorCategoria[cat] = []
    }
    productosPorCategoria[cat].push({
      id: p.id,
      nombreModelo: p.nombreModelo,
      costoBase: Number(p.costoBase),
      precioMercado: Number(p.precioMercado),
      pesoGramos: p.pesoGramos != null ? Number(p.pesoGramos) : null,
      activo: p.activo
    })
  })

  return categorias.map(c => {
    const prods = productosPorCategoria[c.nombre] || []
    return {
      id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion || '',
      totalProductos: prods.length,
      productos: prods,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }
  })
}

export async function createCategoria(data: { nombre: string; descripcion?: string; negocio?: TipoNegocio }): Promise<CategoriaItem> {
  const targetNegocio = data.negocio || await getActiveNegocioServer()
  const cleanNombre = data.nombre.trim()
  if (!cleanNombre) {
    throw new Error('El nombre de la categoría es obligatorio')
  }

  const existing = await prisma.categoria.findFirst({
    where: {
      negocio: targetNegocio,
      nombre: {
        equals: cleanNombre,
        mode: 'insensitive',
      },
    },
  })

  if (existing) {
    throw new Error('Ya existe una categoría con este nombre')
  }

  const categoria = await prisma.categoria.create({
    data: {
      negocio: targetNegocio,
      nombre: cleanNombre,
      descripcion: data.descripcion?.trim() || null,
    },
  })

  revalidatePath('/catalogo')
  revalidatePath('/catalogo/categorias')

  return {
    id: categoria.id,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion || '',
    totalProductos: 0,
    productos: [],
    createdAt: categoria.createdAt.toISOString(),
    updatedAt: categoria.updatedAt.toISOString(),
  }
}

export async function updateCategoria(id: string, data: { nombre: string; descripcion?: string }): Promise<CategoriaItem> {
  const cleanNombre = data.nombre.trim()
  if (!cleanNombre) {
    throw new Error('El nombre de la categoría es obligatorio')
  }

  const current = await prisma.categoria.findUnique({
    where: { id },
  })

  if (!current) {
    throw new Error('Categoría no encontrada')
  }

  // Check if name is being changed and if new name already exists
  if (current.nombre !== cleanNombre) {
    const existing = await prisma.categoria.findFirst({
      where: {
        negocio: current.negocio,
        nombre: {
          equals: cleanNombre,
          mode: 'insensitive',
        },
        id: { not: id },
      },
    })

    if (existing) {
      throw new Error('Ya existe otra categoría con este nombre')
    }

    // Cascade update to all products that had the old category name in the same business
    await prisma.producto.updateMany({
      where: {
        negocio: current.negocio,
        lineaCategoria: current.nombre
      },
      data: { lineaCategoria: cleanNombre },
    })
  }

  const updated = await prisma.categoria.update({
    where: { id },
    data: {
      nombre: cleanNombre,
      descripcion: data.descripcion?.trim() || null,
    },
  })

  // Get products for updated category
  const prods = await prisma.producto.findMany({
    where: {
      negocio: current.negocio,
      lineaCategoria: cleanNombre
    },
    select: {
      id: true,
      nombreModelo: true,
      costoBase: true,
      precioMercado: true,
      pesoGramos: true,
      activo: true
    },
    orderBy: { nombreModelo: 'asc' }
  })

  revalidatePath('/catalogo')
  revalidatePath('/catalogo/categorias')
  revalidatePath('/ventas')

  return {
    id: updated.id,
    nombre: updated.nombre,
    descripcion: updated.descripcion || '',
    totalProductos: prods.length,
    productos: prods.map(p => ({
      id: p.id,
      nombreModelo: p.nombreModelo,
      costoBase: Number(p.costoBase),
      precioMercado: Number(p.precioMercado),
      pesoGramos: p.pesoGramos != null ? Number(p.pesoGramos) : null,
      activo: p.activo
    })),
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  }
}

export async function deleteCategoria(id: string) {
  const current = await prisma.categoria.findUnique({
    where: { id },
  })

  if (!current) {
    throw new Error('Categoría no encontrada')
  }

  // Check if products exist with this category
  const count = await prisma.producto.count({
    where: {
      negocio: current.negocio,
      lineaCategoria: current.nombre
    },
  })

  if (count > 0) {
    throw new Error(`No se puede eliminar la categoría "${current.nombre}" porque tiene ${count} producto(s) asignado(s). Reasigna o elimina los productos primero.`)
  }

  await prisma.categoria.delete({
    where: { id },
  })

  revalidatePath('/catalogo')
  revalidatePath('/catalogo/categorias')
  return { success: true, message: `Categoría "${current.nombre}" eliminada exitosamente.` }
}

