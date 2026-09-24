'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getInversiones } from './inversiones'
import { getVentas } from './ventas'
import { getIngresos } from './ingresos'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

export interface CierreMesItem {
  id: string
  negocio?: string
  mes: number
  anio: number
  nombrePeriodo: string
  fechaCierre: string
  totalIngresosVentas: number
  totalIngresosDirectos: number
  totalIngresos: number
  totalEgresosInsumos: number
  totalEgresosMaquinaria: number
  totalEgresosServicios: number
  totalEgresos: number
  flujoNetoMes: number
  saldoSistema: number
  saldoRealBCP: number
  saldoRealYape: number
  saldoRealTotal: number
  descuadreCaja: number
  montoCuotaPrestamo: number
  montoReservaMaquina: number
  montoColchonEmergencia: number
  totalFondosBlindados: number
  liquidezLibreFinal: number
  cuentasPorCobrarTraspaso: number
  totalPedidosMes: number
  notas?: string | null
  createdAt: string
}

export interface DatosPreCierre {
  mes: number
  anio: number
  nombrePeriodo: string
  totalIngresosVentas: number
  totalIngresosDirectos: number
  totalIngresos: number
  totalEgresosInsumos: number
  totalEgresosMaquinaria: number
  totalEgresosServicios: number
  totalEgresos: number
  flujoNetoMes: number
  saldoSistemaCaja: number
  cuentasPorCobrar: number
  totalPedidos: number
  cuotaPrestamoSugerida: number
  reservaSugerida: number
  colchonSugerido: number
}

const NOMBRES_MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export async function getCierres(negocio?: TipoNegocio): Promise<CierreMesItem[]> {
  try {
    const targetNegocio = negocio || await getActiveNegocioServer()

    const cierres = await prisma.cierreMes.findMany({
      where: { negocio: targetNegocio },
      orderBy: [
        { anio: 'desc' },
        { mes: 'desc' }
      ]
    })

    return cierres.map(c => ({
      id: c.id,
      negocio: c.negocio,
      mes: c.mes,
      anio: c.anio,
      nombrePeriodo: c.nombrePeriodo,
      fechaCierre: c.fechaCierre.toISOString(),
      totalIngresosVentas: Number(c.totalIngresosVentas),
      totalIngresosDirectos: Number(c.totalIngresosDirectos),
      totalIngresos: Number(c.totalIngresos),
      totalEgresosInsumos: Number(c.totalEgresosInsumos),
      totalEgresosMaquinaria: Number(c.totalEgresosMaquinaria),
      totalEgresosServicios: Number(c.totalEgresosServicios),
      totalEgresos: Number(c.totalEgresos),
      flujoNetoMes: Number(c.flujoNetoMes),
      saldoSistema: Number(c.saldoSistema),
      saldoRealBCP: Number(c.saldoRealBCP),
      saldoRealYape: Number(c.saldoRealYape),
      saldoRealTotal: Number(c.saldoRealTotal),
      descuadreCaja: Number(c.descuadreCaja),
      montoCuotaPrestamo: Number(c.montoCuotaPrestamo),
      montoReservaMaquina: Number(c.montoReservaMaquina),
      montoColchonEmergencia: Number(c.montoColchonEmergencia),
      totalFondosBlindados: Number(c.totalFondosBlindados),
      liquidezLibreFinal: Number(c.liquidezLibreFinal),
      cuentasPorCobrarTraspaso: Number(c.cuentasPorCobrarTraspaso),
      totalPedidosMes: c.totalPedidosMes,
      notas: c.notas,
      createdAt: c.createdAt.toISOString()
    }))
  } catch (error) {
    console.error('Error al obtener cierres:', error)
    return []
  }
}

export async function getDatosPreCierre(mesInput?: number, anioInput?: number, negocio?: TipoNegocio): Promise<DatosPreCierre> {
  const targetNegocio = negocio || await getActiveNegocioServer()
  const now = new Date()
  const mes = mesInput || (now.getMonth() + 1) // 1-12
  const anio = anioInput || now.getFullYear()
  const nombrePeriodo = `${NOMBRES_MESES[mes - 1]} ${anio}`

  const [egresos, ventas, ingresosDirectos] = await Promise.all([
    getInversiones(targetNegocio),
    getVentas(targetNegocio),
    getIngresos(targetNegocio),
  ])

  // Filtrar o considerar movimientos del período o acumulados para conciliación
  const totalVentasCobrado = ventas.reduce((acc, v) => acc + (v.montoPagado || 0), 0)
  const totalIngresosDirectos = ingresosDirectos.reduce((acc, i) => acc + (i.monto || 0), 0)
  const totalIngresos = totalVentasCobrado + totalIngresosDirectos

  const totalEgresosInsumos = egresos
    .filter(e => e.categoria === 'INSUMO' || e.categoria === 'MERCADERIA')
    .reduce((acc, e) => acc + (e.costoTotal || 0), 0)

  const totalEgresosMaquinaria = egresos
    .filter(e => e.categoria === 'ACTIVO_FIJO')
    .reduce((acc, e) => acc + (e.costoTotal || 0), 0)

  const totalEgresosServicios = egresos
    .filter(e => e.categoria === 'SERVICIO')
    .reduce((acc, e) => acc + (e.costoTotal || 0), 0)

  const totalEgresos = egresos.reduce((acc, e) => acc + (e.costoTotal || 0), 0)
  const flujoNetoMes = totalIngresos - totalEgresos
  const saldoSistemaCaja = flujoNetoMes

  const cuentasPorCobrar = ventas.reduce((acc, v) => acc + (v.saldoPendiente || 0), 0)
  const totalPedidos = ventas.length

  return {
    mes,
    anio,
    nombrePeriodo,
    totalIngresosVentas: Number(totalVentasCobrado.toFixed(2)),
    totalIngresosDirectos: Number(totalIngresosDirectos.toFixed(2)),
    totalIngresos: Number(totalIngresos.toFixed(2)),
    totalEgresosInsumos: Number(totalEgresosInsumos.toFixed(2)),
    totalEgresosMaquinaria: Number(totalEgresosMaquinaria.toFixed(2)),
    totalEgresosServicios: Number(totalEgresosServicios.toFixed(2)),
    totalEgresos: Number(totalEgresos.toFixed(2)),
    flujoNetoMes: Number(flujoNetoMes.toFixed(2)),
    saldoSistemaCaja: Number(saldoSistemaCaja.toFixed(2)),
    cuentasPorCobrar: Number(cuentasPorCobrar.toFixed(2)),
    totalPedidos,
    cuotaPrestamoSugerida: 368.88,
    reservaSugerida: 800.00,
    colchonSugerido: 350.00
  }
}

export async function createCierreMes(data: {
  negocio?: TipoNegocio
  mes: number
  anio: number
  nombrePeriodo: string
  totalIngresosVentas: number
  totalIngresosDirectos: number
  totalIngresos: number
  totalEgresosInsumos: number
  totalEgresosMaquinaria: number
  totalEgresosServicios: number
  totalEgresos: number
  flujoNetoMes: number
  saldoSistema: number
  saldoRealBCP: number
  saldoRealYape: number
  saldoRealTotal: number
  descuadreCaja: number
  montoCuotaPrestamo: number
  montoReservaMaquina: number
  montoColchonEmergencia: number
  totalFondosBlindados: number
  liquidezLibreFinal: number
  cuentasPorCobrarTraspaso: number
  totalPedidosMes: number
  notas?: string | null
}) {
  try {
    const targetNegocio = data.negocio || await getActiveNegocioServer()

    const created = await prisma.cierreMes.create({
      data: {
        negocio: targetNegocio,
        mes: data.mes,
        anio: data.anio,
        nombrePeriodo: data.nombrePeriodo,
        totalIngresosVentas: data.totalIngresosVentas,
        totalIngresosDirectos: data.totalIngresosDirectos,
        totalIngresos: data.totalIngresos,
        totalEgresosInsumos: data.totalEgresosInsumos,
        totalEgresosMaquinaria: data.totalEgresosMaquinaria,
        totalEgresosServicios: data.totalEgresosServicios,
        totalEgresos: data.totalEgresos,
        flujoNetoMes: data.flujoNetoMes,
        saldoSistema: data.saldoSistema,
        saldoRealBCP: data.saldoRealBCP,
        saldoRealYape: data.saldoRealYape,
        saldoRealTotal: data.saldoRealTotal,
        descuadreCaja: data.descuadreCaja,
        montoCuotaPrestamo: data.montoCuotaPrestamo,
        montoReservaMaquina: data.montoReservaMaquina,
        montoColchonEmergencia: data.montoColchonEmergencia,
        totalFondosBlindados: data.totalFondosBlindados,
        liquidezLibreFinal: data.liquidezLibreFinal,
        cuentasPorCobrarTraspaso: data.cuentasPorCobrarTraspaso,
        totalPedidosMes: data.totalPedidosMes,
        notas: data.notas || null
      }
    })

    revalidatePath('/finanzas/cierres')
    revalidatePath('/finanzas/proyecciones')
    revalidatePath('/finanzas/flujo-caja')
    revalidatePath('/')

    return {
      success: true,
      message: `Cierre oficial de "${data.nombrePeriodo}" registrado exitosamente.`,
      cierreId: created.id
    }
  } catch (error: any) {
    console.error('Error al registrar cierre de mes:', error)
    throw new Error(error?.message || 'Error al guardar el cierre de mes en la base de datos.')
  }
}

export async function deleteCierreMes(id: string) {
  try {
    await prisma.cierreMes.delete({
      where: { id }
    })

    revalidatePath('/finanzas/cierres')
    revalidatePath('/finanzas/proyecciones')
    revalidatePath('/')

    return { success: true, message: 'Registro de cierre eliminado exitosamente.' }
  } catch (error: any) {
    console.error('Error al eliminar cierre:', error)
    throw new Error('Error al eliminar el registro de cierre.')
  }
}
