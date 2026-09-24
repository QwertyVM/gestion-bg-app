'use server'

import prisma from '@/lib/prisma'
import { getVentas } from '@/actions/ventas'

export interface ColorRestockItem {
  id: string
  nombreColor: string
  codigoHex: string
  nota?: string | null
}

export interface DatosPresupuestoTranquilidad {
  // 1. Diagnóstico de Partida (Lo que tengo hoy)
  saldoActualCaja: number
  totalIngresosCobrados: number
  totalEgresosAcumulados: number
  cuentasPorCobrar: number
  
  // 2. Inventario y Materiales
  totalGramosStock: number
  totalBobinasTaller: number
  coloresActivos: number
  coloresRestock: number
  costoEstimadoRestock: number
  listaColoresRestock: ColorRestockItem[]
  
  // 3. Métricas de Producción & Ventas Históricas
  ticketPromedio: number
  costoPromedioFabricacion: number
  margenPromedioUnitario: number
  promedioPedidosMensuales: number
  
  // 4. Costos Fijos y Compromisos Base
  gastosFijosTallerEstimado: number
  cuotaPrestamoSugerida: number
  reservaCapexSugerida: number
  packagingPromedioPorPedido: number
}

export async function getDatosPresupuestoTranquilidad(): Promise<DatosPresupuestoTranquilidad> {
  const [inversiones, ventas, ingresosDirectos, filamentos] = await Promise.all([
    prisma.inversion.findMany(),
    getVentas(),
    prisma.ingreso.findMany({
      orderBy: { fecha: 'desc' }
    }),
    prisma.inventarioFilamento.findMany({
      where: { activo: true }
    })
  ])

  // 1. Saldo actual en caja (Ingresos cobrados - Egresos pagados)
  const totalCobradoVentas = ventas.reduce((sum, v) => sum + Number(v.montoPagado || 0), 0)
  const totalIngresosDirectos = ingresosDirectos.reduce((sum, i) => sum + Number(i.monto || 0), 0)
  const totalIngresosCobrados = totalCobradoVentas + totalIngresosDirectos

  const totalEgresosAcumulados = inversiones.reduce((sum, e) => sum + Number(e.costoTotal || 0), 0)
  const saldoActualCaja = Math.max(0, totalIngresosCobrados - totalEgresosAcumulados)

  const cuentasPorCobrar = ventas.reduce((sum, v) => sum + Number(v.saldoPendiente || 0), 0)

  // 2. Inventario de Filamentos
  const filamentosDisponibles = filamentos.filter(f => f.estado === 'DISPONIBLE')
  const filamentosRestock = filamentos.filter(f => f.estado !== 'DISPONIBLE' || (Number(f.stockGramos || 0) < 300))

  const totalGramosStock = filamentosDisponibles.reduce((sum, f) => sum + Number(f.stockGramos || 0), 0)
  const totalBobinasTaller = filamentosDisponibles.reduce((sum, f) => sum + Number(f.stockBobinas || 1), 0)

  const PRECIO_PROMEDIO_BOBINA = 48.00 // S/ 48 por kg de PLA de calidad
  const costoEstimadoRestock = filamentosRestock.length * PRECIO_PROMEDIO_BOBINA

  const listaColoresRestock: ColorRestockItem[] = filamentosRestock.map(f => ({
    id: f.id,
    nombreColor: f.nombreColor,
    codigoHex: f.codigoHex || '#18181B',
    nota: f.notaProduccion || f.notas
  }))

  // 3. Métricas de Producción y Ventas
  const totalFacturadoVentas = ventas.reduce((sum, v) => sum + Number(v.total || 0), 0)
  const ticketPromedio = ventas.length > 0 ? Number((totalFacturadoVentas / ventas.length).toFixed(2)) : 135.00

  const totalCostosFabricacion = ventas.reduce((sum, v) => {
    const costoUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0
      ? Number(v.costoBaseSnapshot)
      : (Number(v.producto?.costoBase) || 0)
    return sum + (costoUnit * (v.cantidad || 1))
  }, 0)

  const costoPromedioFabricacion = ventas.length > 0 
    ? Number((totalCostosFabricacion / ventas.length).toFixed(2)) 
    : 38.00

  const margenPromedioUnitario = Math.max(0, ticketPromedio - costoPromedioFabricacion)

  // Pedidos del último mes o promedio estimado
  const promedioPedidosMensuales = Math.max(8, Math.min(40, ventas.length > 0 ? Math.round(ventas.length / Math.max(1, 2)) : 18))

  // 4. Costos Fijos de Servicios y Taller
  const gastosFijosServicios = inversiones
    .filter(e => e.categoria === 'SERVICIO')
    .reduce((sum, e) => sum + Number(e.costoTotal || 0), 0)

  const gastosFijosTallerEstimado = gastosFijosServicios > 0 ? Math.round(gastosFijosServicios / Math.max(1, 3)) : 250.00
  const cuotaPrestamoSugerida = 368.88 // Cuota estimada de crédito capital
  const reservaCapexSugerida = 878.00  // Cuota mensual de llegada de nueva impresora
  const packagingPromedioPorPedido = 8.50 // Costo estimado de packaging por envío

  return {
    saldoActualCaja,
    totalIngresosCobrados,
    totalEgresosAcumulados,
    cuentasPorCobrar,
    totalGramosStock,
    totalBobinasTaller,
    coloresActivos: filamentosDisponibles.length,
    coloresRestock: filamentosRestock.length,
    costoEstimadoRestock,
    listaColoresRestock,
    ticketPromedio,
    costoPromedioFabricacion,
    margenPromedioUnitario,
    promedioPedidosMensuales,
    gastosFijosTallerEstimado,
    cuotaPrestamoSugerida,
    reservaCapexSugerida,
    packagingPromedioPorPedido
  }
}
