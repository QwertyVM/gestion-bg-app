'use server'

import prisma from '@/lib/prisma'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'
import { getInversiones } from '@/actions/inversiones'
import { getPedidos } from '@/actions/pedidos'
import { getIngresos } from '@/actions/ingresos'

export interface MesRentabilidadData {
  mesKey: string // "YYYY-MM"
  nombreMes: string // "Septiembre 2026"
  mesNumero: number
  anio: number
  saldoInicial: number
  ventasCobradas: number
  inyeccionCapital: number // Préstamos bancarios y aportes de capital que entraron a caja
  comprasDirectas: number // Lotes de juegos de mesa / compras a distribuidoras
  gastosPersonal: number // Sueldos de colaboradores
  gastosOperativos: number // Publicidad en Instagram/TikTok, envíos, comisiones
  gastosBlindadosPagados: number // Cuota BCP, almacén, internet, ITF
  compromisosPendientes: number // Fijos pendientes de fin de mes
  totalBlindadosMes: number // gastosBlindadosPagados + compromisosPendientes
  obligacionesFijas: number // total de fijos operativos pagados
  totalObligacionesMes: number // gastosOperativos + totalBlindadosMes
  activosFijosCapex: number
  otrosEgresos: number
  utilidadMes: number
  margenOperativoPct: number
  utilidadProyectadaCierre: number
  margenProyectadoPct: number
  saldoAcumulado: number
  reservaObligaciones: number
  capacidadSueldoSeguro: number // Capacidad total combinada de la empresa
  numSocios: number // 2 socios
  capacidadSueldoPorSocio: number // Capacidad máxima segura individual por socio
  estadoDiagnostico: 'EXCELENTE' | 'RENTABLE' | 'EQUILIBRIO' | 'DEFICIT'
}

export interface RentabilidadSueldosResumen {
  negocio: TipoNegocio
  mesSeleccionado: MesRentabilidadData
  meses: MesRentabilidadData[]
  totalHistoricoVentas: number
  totalHistoricoInyeccion: number
  totalHistoricoCompras: number
  totalHistoricoPersonal: number
  totalHistoricoOperativos: number
  totalHistoricoBlindados: number
  totalHistoricoObligaciones: number
  totalHistoricoUtilidad: number
  promedioUtilidadMensual: number
  promedioObligacionesMensual: number
  reservaRecomendadaSugerida: number
  saldoCajaActual: number
  numSocios: number
  capacidadSueldoActual: number
  capacidadSueldoPorSocioActual: number
}

const MESES_NOMBRES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

export async function getRentabilidadSueldos(
  negocioOverride?: TipoNegocio,
  mesKeySeleccionado?: string
): Promise<RentabilidadSueldosResumen> {
  const negocio = negocioOverride || await getActiveNegocioServer()

  // 1. Obtener datos reales de la base de datos
  const [inversiones, pedidos, ingresosDirectos] = await Promise.all([
    getInversiones(negocio),
    getPedidos(negocio),
    getIngresos(negocio)
  ])

  // 2. Mapa mensual cronológico
  const monthMap: Record<string, {
    ventasCobradas: number
    inyeccionCapital: number
    comprasDirectas: number
    gastosPersonal: number
    gastosOperativos: number
    gastosBlindadosPagados: number
    activosFijosCapex: number
    otrosEgresos: number
  }> = {}

  const ensureMonth = (key: string) => {
    if (!monthMap[key]) {
      monthMap[key] = {
        ventasCobradas: 0,
        inyeccionCapital: 0,
        comprasDirectas: 0,
        gastosPersonal: 0,
        gastosOperativos: 0,
        gastosBlindadosPagados: 0,
        activosFijosCapex: 0,
        otrosEgresos: 0,
      }
    }
  }

  // A. Procesar Pedidos y Pagos de Juegos de Mesa
  pedidos.forEach(p => {
    if (Array.isArray(p.pagos) && p.pagos.length > 0) {
      p.pagos.forEach(pago => {
        if (!pago.fecha || Number(pago.monto) <= 0) return
        const key = pago.fecha.slice(0, 7) // "YYYY-MM"
        ensureMonth(key)
        monthMap[key].ventasCobradas += Number(pago.monto)
      })
    } else if (Number(p.montoPagado) > 0 && p.fecha) {
      const key = String(p.fecha).slice(0, 7)
      ensureMonth(key)
      monthMap[key].ventasCobradas += Number(p.montoPagado)
    }
  })

  // B. Procesar Ingresos Directos (Ventas directas vs préstamos e inyección de capital)
  ingresosDirectos.forEach(i => {
    if (!i.fecha || Number(i.monto) <= 0) return
    const key = String(i.fecha).slice(0, 7)
    ensureMonth(key)
    const catLower = (i.categoria || '').toLowerCase()
    const conLower = (i.concepto || '').toLowerCase()

    const isPrestamoOFinanciamiento =
      catLower.includes('préstamo') ||
      catLower.includes('prestamo') ||
      catLower.includes('financiamiento') ||
      catLower.includes('aporte') ||
      catLower.includes('capital') ||
      conLower.includes('préstamo') ||
      conLower.includes('prestamo') ||
      conLower.includes('desembolso') ||
      conLower.includes('aporte') ||
      conLower.includes('capital')

    if (isPrestamoOFinanciamiento) {
      monthMap[key].inyeccionCapital += Number(i.monto)
    } else {
      monthMap[key].ventasCobradas += Number(i.monto)
    }
  })

  // C. Procesar Egresos / Inversiones para Board Games
  inversiones.forEach(e => {
    if (!e.createdAt || Number(e.costoTotal) <= 0) return
    const key = String(e.createdAt).slice(0, 7)
    ensureMonth(key)
    const cat = String(e.categoria)
    const subLower = (e.subcategoria || '').toLowerCase()
    const conLower = (e.itemConcepto || '').toLowerCase()

    const isBlindado =
      cat === 'FINANCIERO' ||
      subLower.includes('bcp') ||
      subLower.includes('banco') ||
      subLower.includes('cuota') ||
      conLower.includes('préstamo') ||
      conLower.includes('prestamo') ||
      conLower.includes('cuota') ||
      conLower.includes('alquiler') ||
      conLower.includes('luz') ||
      conLower.includes('internet')

    const isPersonal =
      cat === 'PERSONAL' ||
      subLower.includes('sueldo') ||
      subLower.includes('planilla') ||
      conLower.includes('sueldo') ||
      conLower.includes('personal')

    if (cat === 'MERCADERIA' || cat === 'INSUMO' || conLower.includes('lote') || conLower.includes('f006')) {
      monthMap[key].comprasDirectas += Number(e.costoTotal)
    } else if (isPersonal) {
      monthMap[key].gastosPersonal += Number(e.costoTotal)
    } else if (isBlindado) {
      monthMap[key].gastosBlindadosPagados += Number(e.costoTotal)
    } else if (
      cat === 'SERVICIO' ||
      subLower.includes('publicidad') ||
      subLower.includes('marketing') ||
      conLower.includes('publicidad') ||
      conLower.includes('instagram') ||
      subLower.includes('envío') ||
      subLower.includes('envio') ||
      conLower.includes('bolsa')
    ) {
      monthMap[key].gastosOperativos += Number(e.costoTotal)
    } else if (cat === 'ACTIVO_FIJO') {
      monthMap[key].activosFijosCapex += Number(e.costoTotal)
    } else {
      monthMap[key].otrosEgresos += Number(e.costoTotal)
    }
  })

  // 3. Mes actual garantizado
  const currentNow = new Date()
  const currentKey = `${currentNow.getFullYear()}-${String(currentNow.getMonth() + 1).padStart(2, '0')}`
  ensureMonth(currentKey)

  // 4. Ordenar meses cronológicamente
  const sortedKeys = Object.keys(monthMap).sort()

  let runningBalance = 0
  const mesesCalculados: MesRentabilidadData[] = []

  // Promedio móvil de obligaciones para reserva prudencial
  const totalObligacionesArr = Object.values(monthMap).map(m => m.gastosPersonal + m.gastosOperativos + m.gastosBlindadosPagados)
  const sumaObligaciones = totalObligacionesArr.reduce((a, b) => a + b, 0)
  const promedioObligaciones = totalObligacionesArr.length > 0 ? (sumaObligaciones / totalObligacionesArr.length) : 250

  sortedKeys.forEach(k => {
    const data = monthMap[k]
    const [yearStr, monthStr] = k.split('-')
    const anio = parseInt(yearStr, 10)
    const mesNumero = parseInt(monthStr, 10)
    const nombreMes = `${MESES_NOMBRES[mesNumero - 1]} ${anio}`

    const saldoInicial = Number(runningBalance.toFixed(2))
    const ventasCobradas = Number(data.ventasCobradas.toFixed(2))
    const inyeccionCapital = Number(data.inyeccionCapital.toFixed(2))
    const comprasDirectas = Number(data.comprasDirectas.toFixed(2))
    const gastosPersonal = Number(data.gastosPersonal.toFixed(2))
    const gastosOperativos = Number(data.gastosOperativos.toFixed(2))
    const gastosBlindadosPagados = Number(data.gastosBlindadosPagados.toFixed(2))
    const obligacionesFijas = Number((gastosPersonal + gastosOperativos + gastosBlindadosPagados).toFixed(2))
    const activosFijosCapex = Number(data.activosFijosCapex.toFixed(2))
    const otrosEgresos = Number(data.otrosEgresos.toFixed(2))

    // Utilidad Operativa del Mes (P&L de venta de juegos menos compra de inventario y fijos)
    const utilidadMes = Number((ventasCobradas - comprasDirectas - obligacionesFijas).toFixed(2))

    const margenOperativoPct = ventasCobradas > 0
      ? Number(((utilidadMes / ventasCobradas) * 100).toFixed(1))
      : 0

    // Compromisos pendientes del mes (reserva básica o cuotas bancarias pendientes)
    const compromisosPendientes = k === currentKey ? 0 : 0
    const totalBlindadosMes = Number((gastosBlindadosPagados + compromisosPendientes).toFixed(2))
    const totalObligacionesMes = Number((gastosOperativos + totalBlindadosMes).toFixed(2))

    const utilidadProyectadaCierre = Number((utilidadMes - compromisosPendientes).toFixed(2))
    const margenProyectadoPct = ventasCobradas > 0
      ? Number(((utilidadProyectadaCierre / ventasCobradas) * 100).toFixed(1))
      : 0

    // Flujo neto real en tesorería
    const flujoNetoTotalMes = Number(
      (ventasCobradas + inyeccionCapital - comprasDirectas - obligacionesFijas - activosFijosCapex - otrosEgresos).toFixed(2)
    )
    runningBalance += flujoNetoTotalMes
    const saldoAcumulado = Number(runningBalance.toFixed(2))

    // Reserva obligatoria (Fondo mínimo de contingencia para compras y fijos)
    const reservaObligaciones = Number(Math.max(totalBlindadosMes, promedioObligaciones, 150).toFixed(2))

    // Capacidad real para asignarse sueldo seguro (Blindando la reserva técnica)
    const numSocios = 2
    const capacidadSueldoSeguro = Number(Math.max(0, saldoAcumulado - reservaObligaciones).toFixed(2))
    const capacidadSueldoPorSocio = Number((capacidadSueldoSeguro / numSocios).toFixed(2))

    let estadoDiagnostico: 'EXCELENTE' | 'RENTABLE' | 'EQUILIBRIO' | 'DEFICIT' = 'EQUILIBRIO'
    if (margenOperativoPct >= 30 && utilidadMes > 0) {
      estadoDiagnostico = 'EXCELENTE'
    } else if (margenOperativoPct > 10 && utilidadMes > 0) {
      estadoDiagnostico = 'RENTABLE'
    } else if (saldoAcumulado >= reservaObligaciones) {
      estadoDiagnostico = 'EQUILIBRIO'
    } else {
      estadoDiagnostico = 'DEFICIT'
    }

    mesesCalculados.push({
      mesKey: k,
      nombreMes,
      mesNumero,
      anio,
      saldoInicial,
      ventasCobradas,
      inyeccionCapital,
      comprasDirectas,
      gastosPersonal,
      gastosOperativos,
      gastosBlindadosPagados,
      compromisosPendientes,
      totalBlindadosMes,
      obligacionesFijas,
      totalObligacionesMes,
      activosFijosCapex,
      otrosEgresos,
      utilidadMes,
      margenOperativoPct,
      utilidadProyectadaCierre,
      margenProyectadoPct,
      saldoAcumulado,
      reservaObligaciones,
      capacidadSueldoSeguro,
      numSocios,
      capacidadSueldoPorSocio,
      estadoDiagnostico,
    })
  })

  const targetKey = mesKeySeleccionado || currentKey
  const mesSeleccionado = mesesCalculados.find(m => m.mesKey === targetKey) || mesesCalculados[mesesCalculados.length - 1]

  // Totales históricos acumulados
  const totalHistoricoVentas = Number(mesesCalculados.reduce((s, m) => s + m.ventasCobradas, 0).toFixed(2))
  const totalHistoricoInyeccion = Number(mesesCalculados.reduce((s, m) => s + m.inyeccionCapital, 0).toFixed(2))
  const totalHistoricoCompras = Number(mesesCalculados.reduce((s, m) => s + m.comprasDirectas, 0).toFixed(2))
  const totalHistoricoPersonal = Number(mesesCalculados.reduce((s, m) => s + m.gastosPersonal, 0).toFixed(2))
  const totalHistoricoOperativos = Number(mesesCalculados.reduce((s, m) => s + m.gastosOperativos, 0).toFixed(2))
  const totalHistoricoBlindados = Number(mesesCalculados.reduce((s, m) => s + m.totalBlindadosMes, 0).toFixed(2))
  const totalHistoricoObligaciones = Number(mesesCalculados.reduce((s, m) => s + m.totalObligacionesMes, 0).toFixed(2))
  const totalHistoricoUtilidad = Number(mesesCalculados.reduce((s, m) => s + m.utilidadMes, 0).toFixed(2))

  const countMeses = mesesCalculados.length || 1
  const promedioUtilidadMensual = Number((totalHistoricoUtilidad / countMeses).toFixed(2))
  const promedioObligacionesMensual = Number((totalHistoricoObligaciones / countMeses).toFixed(2))
  const reservaRecomendadaSugerida = Number(Math.max(...mesesCalculados.map(m => m.reservaObligaciones), 200).toFixed(2))

  const ultimoMes = mesesCalculados[mesesCalculados.length - 1]
  const saldoCajaActual = ultimoMes ? ultimoMes.saldoAcumulado : 0
  const capacidadSueldoActual = ultimoMes ? ultimoMes.capacidadSueldoSeguro : 0
  const capacidadSueldoPorSocioActual = ultimoMes ? ultimoMes.capacidadSueldoPorSocio : 0

  return {
    negocio,
    mesSeleccionado,
    meses: mesesCalculados.reverse(), // Más recientes primero para la UI
    totalHistoricoVentas,
    totalHistoricoInyeccion,
    totalHistoricoCompras,
    totalHistoricoPersonal,
    totalHistoricoOperativos,
    totalHistoricoBlindados,
    totalHistoricoObligaciones,
    totalHistoricoUtilidad,
    promedioUtilidadMensual,
    promedioObligacionesMensual,
    reservaRecomendadaSugerida,
    saldoCajaActual,
    numSocios: 2,
    capacidadSueldoActual,
    capacidadSueldoPorSocioActual,
  }
}
