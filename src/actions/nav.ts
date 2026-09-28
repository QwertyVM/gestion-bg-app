'use server'

import prisma from '@/lib/prisma'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

export async function getNavLiveMetrics(negocio?: TipoNegocio) {
  try {
    const pedidosPendientes = await prisma.pedido.count({
      where: {
        negocio: 'BG',
        OR: [
          { estado: { in: ['PENDIENTE', 'EN_PRODUCCION'] } },
          { saldoPendiente: { gt: 0 } }
        ]
      }
    })

    return {
      pedidosPendientes,
      filamentosCriticos: 0,
      piezasTallerPendientes: 0
    }
  } catch (error) {
    console.error('Error fetching nav live metrics:', error)
    return {
      pedidosPendientes: 0,
      filamentosCriticos: 0,
      piezasTallerPendientes: 0
    }
  }
}

