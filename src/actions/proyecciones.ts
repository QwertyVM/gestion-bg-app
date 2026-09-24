'use server'

import prisma from '@/lib/prisma'
import { getInversiones } from './inversiones'
import { getVentas } from './ventas'
import { getIngresos } from './ingresos'

export interface DatosCajaChica {
  saldoActualCajaChica: number
  totalIngresosHistoricos: number
  totalEgresosHistoricos: number
  cuentasPorCobrar: number
  ticketPromedioVenta: number
  costoPromedioFabricacionPorPedido: number
  totalPedidosHistoricos: number
  cuotaPrestamoMensual: number
  gastosFijosEstimadosMensual: number
  ingresosDirectos: any[]
  ventas: any[]
  egresos: any[]
}

export async function getDatosCajaChica(): Promise<DatosCajaChica> {
  const [egresos, ventas, ingresosDirectos] = await Promise.all([
    getInversiones(),
    getVentas(),
    getIngresos(),
  ])

  const totalVentasCobrado = ventas.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
  const totalIngresosDirectos = ingresosDirectos.reduce((acc, i) => acc + (i.monto || 0), 0)
  const totalIngresosHistoricos = totalVentasCobrado + totalIngresosDirectos
  const totalEgresosHistoricos = egresos.reduce((acc, e) => acc + (e.costoTotal || 0), 0)

  const saldoActualCajaChica = totalIngresosHistoricos - totalEgresosHistoricos
  const cuentasPorCobrar = ventas.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0)

  const totalPedidosHistoricos = ventas.length
  const totalFacturadoVentas = ventas.reduce((acc, v) => acc + (v.total || 0), 0)
  const ticketPromedioVenta = totalPedidosHistoricos > 0 ? Number((totalFacturadoVentas / totalPedidosHistoricos).toFixed(2)) : 135.00

  const totalCostoFabricacion = ventas.reduce((acc, v) => {
    const costoUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0
      ? Number(v.costoBaseSnapshot)
      : (Number(v.producto?.costoBase) || 0)
    return acc + (Number(v.cantidad || 1) * costoUnit)
  }, 0)
  const costoPromedioFabricacionPorPedido = totalPedidosHistoricos > 0 
    ? Number((totalCostoFabricacion / totalPedidosHistoricos).toFixed(2)) 
    : 38.00

  // Cuota bancaria identificada de las 24 cuotas (S/ 368.88)
  const cuotaPrestamoMensual = 368.88

  // Gastos fijos estimados de taller (Luz, internet, mantenimiento base)
  const gastosFijosEstimadosMensual = 250.00

  return {
    saldoActualCajaChica: Number(saldoActualCajaChica.toFixed(2)),
    totalIngresosHistoricos: Number(totalIngresosHistoricos.toFixed(2)),
    totalEgresosHistoricos: Number(totalEgresosHistoricos.toFixed(2)),
    cuentasPorCobrar: Number(cuentasPorCobrar.toFixed(2)),
    ticketPromedioVenta,
    costoPromedioFabricacionPorPedido,
    totalPedidosHistoricos,
    cuotaPrestamoMensual,
    gastosFijosEstimadosMensual,
    ingresosDirectos,
    ventas,
    egresos,
  }
}
