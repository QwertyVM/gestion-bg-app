'use server'

import { revalidatePath } from 'next/cache'
import prisma from '@/lib/prisma'
import { XMLParser } from 'fast-xml-parser'

const BGG_API_TOKEN = process.env.BGG_API_TOKEN || 'f7ad4bda-0a75-4d1c-9ee0-bb8417ea409f'
const BGG_USER_AGENT = 'BGG-Personal-Collection-Tracker/1.0'
const BGG_API_URL = 'https://boardgamegeek.com/xmlapi2/thing'

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
  imagenUrl?: string | null
}

export interface BggGameDetails {
  bggId: number
  gameName: string
  bggRating?: number | null
  bggWeight?: number | null
  bggRatingCount?: number | null
  minPlayers?: number | null
  maxPlayers?: number | null
  numJugadores?: string | null
  duracionMinutos?: number | null
  edadMinima?: number | null
  editorialMarca?: string | null
  mecanicas?: string | null
  imagenUrl?: string | null
  descripcionWeb?: string | null
}

async function fetchBggXml(idsParam: string): Promise<string> {
  const url = `${BGG_API_URL}?id=${idsParam}&stats=1`
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${BGG_API_TOKEN}`,
      'User-Agent': BGG_USER_AGENT,
      Accept: 'application/xml,text/xml,*/*',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    if (response.status === 202) {
      throw new Error('BoardGameGeek está procesando la solicitud (HTTP 202). Por favor, intenta de nuevo en unos momentos.')
    }
    if (response.status === 429) {
      throw new Error('Límite de peticiones de BoardGameGeek alcanzado (HTTP 429). Espera un momento antes de volver a intentar.')
    }
    throw new Error(`Error BGG API (${response.status}): ${response.statusText}`)
  }

  return await response.text()
}

function parseBggXml(xmlText: string) {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
  })
  const result = parser.parse(xmlText)
  const rawItems = result.items?.item
  if (!rawItems) return []
  return Array.isArray(rawItems) ? rawItems : [rawItems]
}

function parseBggItem(item: any): BggGameDetails | null {
  const id = parseInt(item['@_id'], 10)
  if (!id) return null

  // Nombre primario
  const names = Array.isArray(item.name) ? item.name : item.name ? [item.name] : []
  const primaryNameObj = names.find((n: any) => n?.['@_type'] === 'primary') || names[0]
  const gameName = primaryNameObj?.['@_value'] || ''

  // Ratings
  const rating = parseFloat(item.statistics?.ratings?.average?.['@_value']) || null
  const weight = parseFloat(item.statistics?.ratings?.averageweight?.['@_value']) || null
  const ratingCount = parseInt(item.statistics?.ratings?.usersrated?.['@_value'], 10) || null

  // Jugadores y duración
  const minPlayers = parseInt(item.minplayers?.['@_value'], 10) || null
  const maxPlayers = parseInt(item.maxplayers?.['@_value'], 10) || null
  const playtime = parseInt(item.playingtime?.['@_value'], 10) || null
  const minAge = parseInt(item.minage?.['@_value'], 10) || null

  let numJugadores: string | null = null
  if (minPlayers && maxPlayers) {
    numJugadores = minPlayers === maxPlayers ? `${minPlayers} jugadores` : `${minPlayers} - ${maxPlayers} jugadores`
  } else if (minPlayers) {
    numJugadores = `${minPlayers}+ jugadores`
  }

  // Links: editoriales y mecánicas
  const links = Array.isArray(item.link) ? item.link : item.link ? [item.link] : []
  const publishers: string[] = links
    .filter((l: any) => l?.['@_type'] === 'boardgamepublisher')
    .map((l: any) => l?.['@_value'])
    .filter(Boolean)
  const editorialMarca = publishers[0] || null

  const mechanics: string[] = links
    .filter((l: any) => l?.['@_type'] === 'boardgamemechanic')
    .map((l: any) => l?.['@_value'])
    .filter(Boolean)
  const mecanicas = mechanics.length > 0 ? mechanics.slice(0, 4).join(', ') : null

  // Imagen
  let imagenUrl: string | null = null
  if (typeof item.image === 'string' && item.image.startsWith('http')) {
    imagenUrl = item.image
  }

  // Sinopsis / Descripción
  let descripcionWeb: string | null = null
  if (typeof item.description === 'string') {
    descripcionWeb = item.description
      .replace(/&#10;/g, '\n')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .slice(0, 500)
  }

  return {
    bggId: id,
    gameName,
    bggRating: rating ? parseFloat(rating.toFixed(2)) : null,
    bggWeight: weight ? parseFloat(weight.toFixed(2)) : null,
    bggRatingCount: ratingCount,
    minPlayers,
    maxPlayers,
    numJugadores,
    duracionMinutos: playtime && playtime > 0 ? playtime : null,
    edadMinima: minAge && minAge > 0 ? minAge : null,
    editorialMarca,
    mecanicas,
    imagenUrl,
    descripcionWeb,
  }
}

/**
 * Consulta la API de BGG desde el servidor para un ID o URL individual y devuelve los datos estructurados.
 * Se ejecuta en Node.js, evitando errores de CORS en el navegador.
 */
export async function fetchBggProductDetails(rawIdOrUrl: string | number): Promise<{
  success: boolean
  data?: BggGameDetails
  error?: string
}> {
  try {
    const rawStr = String(rawIdOrUrl).trim()
    const urlMatch = rawStr.match(/boardgame(?:geek\.com\/boardgame)?\/(\d+)/i)
    const idVal = urlMatch ? urlMatch[1] : rawStr
    const numericId = parseInt(idVal, 10)

    if (!numericId || isNaN(numericId)) {
      return { success: false, error: 'ID de BoardGameGeek inválido' }
    }

    const xml = await fetchBggXml(String(numericId))
    const items = parseBggXml(xml)
    if (items.length === 0) {
      return { success: false, error: 'No se encontró información en BoardGameGeek para ese ID' }
    }

    const details = parseBggItem(items[0])
    if (!details) {
      return { success: false, error: 'No se pudieron procesar los datos de BGG' }
    }

    return { success: true, data: details }
  } catch (error: any) {
    console.error('Error al consultar BGG:', error)
    return { success: false, error: error.message || 'Error al conectar con BoardGameGeek' }
  }
}

/**
 * Sincroniza productos con BoardGameGeek desde el servidor evitando problemas de CORS en el navegador.
 */
export async function syncBggProducts(items?: { id: string; bggId: number }[]) {
  try {
    let targets: { id: string; bggId: number }[] = []

    if (items && items.length > 0) {
      targets = items.filter((it) => it.bggId && Number(it.bggId) > 0)
    } else {
      const dbProds = await prisma.producto.findMany({
        where: { bggId: { not: null, gt: 0 } },
        select: { id: true, bggId: true },
      })
      targets = dbProds.map((p) => ({ id: p.id, bggId: p.bggId! }))
    }

    if (targets.length === 0) {
      return { success: true, count: 0, updates: [], message: 'No hay juegos con código BGG configurado' }
    }

    const bggIdToProdIds = new Map<number, string[]>()
    for (const t of targets) {
      const list = bggIdToProdIds.get(t.bggId) || []
      list.push(t.id)
      bggIdToProdIds.set(t.bggId, list)
    }

    const uniqueBggIds = Array.from(bggIdToProdIds.keys())
    const BATCH_SIZE = 50
    const updates: BggStatUpdateItem[] = []

    for (let i = 0; i < uniqueBggIds.length; i += BATCH_SIZE) {
      const batchIds = uniqueBggIds.slice(i, i + BATCH_SIZE)
      const xml = await fetchBggXml(batchIds.join(','))
      const rawItems = parseBggXml(xml)

      for (const rawItem of rawItems) {
        const parsed = parseBggItem(rawItem)
        if (!parsed) continue

        const prodIds = bggIdToProdIds.get(parsed.bggId)
        if (!prodIds) continue

        for (const prodId of prodIds) {
          updates.push({
            id: prodId,
            bggRating: parsed.bggRating,
            bggWeight: parsed.bggWeight,
            bggMinPlayers: parsed.minPlayers,
            bggMaxPlayers: parsed.maxPlayers,
            bggPlaytime: parsed.duracionMinutos,
            bggRatingCount: parsed.bggRatingCount,
            numJugadores: parsed.numJugadores,
            edadMinima: parsed.edadMinima,
            duracionMinutos: parsed.duracionMinutos,
            editorialMarca: parsed.editorialMarca,
            mecanicas: parsed.mecanicas,
            idioma: 'Español',
            imagenUrl: parsed.imagenUrl || undefined,
          })
        }
      }
    }

    if (updates.length > 0) {
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
              imagenUrl: item.imagenUrl !== undefined ? item.imagenUrl : undefined,
              bggRatingUpdatedAt: now,
            },
          })
        )
      )

      revalidatePath('/catalogo')
      revalidatePath('/catalogo/productos')
    }

    return {
      success: true,
      count: updates.length,
      updates,
      message: `Se sincronizaron ${updates.length} productos con BoardGameGeek`,
    }
  } catch (error: any) {
    console.error('Error en sincronización masiva BGG:', error)
    return {
      success: false,
      count: 0,
      updates: [],
      error: error.message || 'Error al sincronizar con BoardGameGeek',
    }
  }
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
            imagenUrl: item.imagenUrl !== undefined ? item.imagenUrl : undefined,
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
