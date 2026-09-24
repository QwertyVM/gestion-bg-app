'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'

export interface BggStatUpdateItem {
  id: string
  bggRating?: number | null
  bggWeight?: number | null
  bggMinPlayers?: number | null
  bggMaxPlayers?: number | null
  bggPlaytime?: number | null
  bggRatingCount?: number | null
  numJugadores?: string | null
  edadMinima?: number | null
  duracionMinutos?: number | null
  editorialMarca?: string | null
  mecanicas?: string | null
  idioma?: string | null
}

export async function updateBggStats(
  id: string,
  data: {
    bggRating?: number | null
    bggWeight?: number | null
    bggMinPlayers?: number | null
    bggMaxPlayers?: number | null
    bggPlaytime?: number | null
  }
) {
  try {
    const updated = await prisma.producto.update({
      where: { id },
      data: {
        bggRating: data.bggRating !== undefined ? data.bggRating : undefined,
        bggWeight: data.bggWeight !== undefined ? data.bggWeight : undefined,
        bggMinPlayers: data.bggMinPlayers !== undefined ? data.bggMinPlayers : undefined,
        bggMaxPlayers: data.bggMaxPlayers !== undefined ? data.bggMaxPlayers : undefined,
        bggPlaytime: data.bggPlaytime !== undefined ? data.bggPlaytime : undefined,
        bggRatingUpdatedAt: new Date(),
      },
    })

    revalidatePath('/catalogo')
    return { success: true, message: 'Estadísticas de BGG actualizadas' }
  } catch (error: any) {
    console.error('Error updating BGG stats:', error)
    throw new Error('No se pudo actualizar las estadísticas de BGG')
  }
}

/**
 * Actualiza masivamente las estadísticas BGG y la Ficha Técnica de múltiples productos en una sola transacción.
 */
export async function bulkUpdateBggStats(updates: BggStatUpdateItem[]) {
  if (updates.length === 0) return { success: true, count: 0 }

  try {
    const now = new Date()
    await prisma.$transaction(
      updates.map((item) =>
        prisma.producto.update({
          where: { id: item.id },
          data: {
            bggRating: item.bggRating !== undefined ? item.bggRating : undefined,
            bggWeight: item.bggWeight !== undefined ? item.bggWeight : undefined,
            bggMinPlayers: item.bggMinPlayers !== undefined ? item.bggMinPlayers : undefined,
            bggMaxPlayers: item.bggMaxPlayers !== undefined ? item.bggMaxPlayers : undefined,
            bggPlaytime: item.bggPlaytime !== undefined ? item.bggPlaytime : undefined,
            bggRatingCount: item.bggRatingCount !== undefined ? item.bggRatingCount : undefined,
            numJugadores: item.numJugadores !== undefined ? item.numJugadores : undefined,
            edadMinima: item.edadMinima !== undefined ? item.edadMinima : undefined,
            duracionMinutos: item.duracionMinutos !== undefined ? item.duracionMinutos : undefined,
            editorialMarca: item.editorialMarca !== undefined ? item.editorialMarca : undefined,
            mecanicas: item.mecanicas !== undefined ? item.mecanicas : undefined,
            idioma: item.idioma !== undefined ? item.idioma : undefined,
            bggRatingUpdatedAt: now,
          },
        })
      )
    )

    revalidatePath('/catalogo')
    return { success: true, count: updates.length }
  } catch (error: any) {
    console.error('Error in bulkUpdateBggStats:', error)
    throw new Error('No se pudo actualizar masivamente las estadísticas de BGG y la ficha técnica')
  }
}
