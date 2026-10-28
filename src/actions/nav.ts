'use server'

import prisma from '@/lib/prisma'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

export async function getNavLiveMetrics(negocio?: TipoNegocio) {
  try {
    const targetNegocio = negocio || await getActiveNegocioServer() || 'BG'

    const [pedidosPendientes, juegosBajoStock] = await Promise.all([
      prisma.pedido.count({
        where: {
          negocio: targetNegocio,
          OR: [
            { estado: { in: ['PENDIENTE', 'EN_PRODUCCION'] } },
            { saldoPendiente: { gt: 0 } }
          ]
        }
      }),
      prisma.producto.count({
        where: {
          negocio: targetNegocio,
          activo: true,
          stock: { lte: 2 }
        }
      })
    ])

    return {
      pedidosPendientes,
      juegosBajoStock,
      filamentosCriticos: 0,
      piezasTallerPendientes: 0
    }
  } catch (error) {
    console.error('Error fetching nav live metrics:', error)
    return {
      pedidosPendientes: 0,
      juegosBajoStock: 0,
      filamentosCriticos: 0,
      piezasTallerPendientes: 0
    }
  }
}
