'use server'

import prisma from '@/lib/prisma'
import { getVentas, registrarAbono } from '@/actions/ventas'
import { addPagoPedido } from '@/actions/pedidos'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

export async function getDashboardData(negocio?: TipoNegocio) {
  const targetNegocio = negocio || await getActiveNegocioServer()

  const [inversiones, ventas, ingresosDirectos, filamentos] = await Promise.all([
    prisma.inversion.findMany({
      where: { negocio: targetNegocio },
      orderBy: { createdAt: 'desc' }
    }),
    getVentas(targetNegocio),
    prisma.ingreso.findMany({
      where: { negocio: targetNegocio },
      orderBy: { fecha: 'desc' }
    }),
    targetNegocio === '3D' ? prisma.inventarioFilamento.findMany({
      where: { activo: true }
    }) : Promise.resolve([])
  ])

  // 1. Egresos / Inversión Total en el Taller (Maquinaria + Insumos + Servicios)
  const egresosTotales = inversiones.reduce((sum, item) => sum + Number(item.costoTotal), 0)

  // 2. Ingresos por Ventas de Catálogo
  const ingresosVentas = ventas.reduce((sum, item) => sum + Number(item.total), 0)

  // 3. Costo Total de Fabricación de los productos vendidos (usando snapshot histórico)
  const costoFabricacionTotal = ventas.reduce((sum, v) => {
    const costoBaseUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0 
      ? Number(v.costoBaseSnapshot) 
      : (Number(v.producto?.costoBase) || 0)
    return sum + (costoBaseUnit * v.cantidad)
  }, 0)

  // 4. GANANCIA NETA EN VENTAS (Ingresos por Venta - Costo de Fabricación)
  const gananciaNeta = ingresosVentas - costoFabricacionTotal

  // 5. Margen de Ganancia sobre Costo (%)
  const margenPorcentaje = costoFabricacionTotal > 0 
    ? (gananciaNeta / costoFabricacionTotal) * 100 
    : 0

  // 6. Total Cobrado en Efectivo de Ventas (calculado desde pagos o montoPagado)
  const totalCobradoVentas = ventas.reduce((sum: number, v: any) => {
    if (v.pagos && v.pagos.length > 0) {
      const sumP = v.pagos.reduce((pSum: number, p: any) => pSum + Number(p.monto), 0)
      return sum + Math.max(sumP, Number(v.montoPagado || 0))
    }
    return sum + Number(v.montoPagado || 0)
  }, 0)

  // 7. Saldo Total por Cobrar a Clientes
  const saldoPorCobrar = ventas.reduce((sum, item) => sum + Number(item.saldoPendiente), 0)

  // 8. Ticket Promedio
  const ticketPromedio = ventas.length > 0 ? ingresosVentas / ventas.length : 0

  // 9. Total Ingresos Directos / Financiamiento
  const totalIngresosDirectos = ingresosDirectos.reduce((sum, i) => sum + Number(i.monto), 0)

  // 10. Evolución de ventas, recaudación y costo en todo el historial
  const timelineMap: Record<string, { ingresos: number; costo: number; ganancia: number }> = {}

  // A. Procesar costos y ventas base en la fecha de registro
  ventas.forEach((venta: any) => {
    const rawFecha = venta.fecha instanceof Date ? venta.fecha.toISOString() : String(venta.fecha)
    const vDate = rawFecha.split('T')[0]
    if (!timelineMap[vDate]) {
      timelineMap[vDate] = { ingresos: 0, costo: 0, ganancia: 0 }
    }

    const costoBaseUnit = venta.costoBaseSnapshot != null && Number(venta.costoBaseSnapshot) > 0 
      ? Number(venta.costoBaseSnapshot) 
      : (Number(venta.producto?.costoBase) || 0)
    const ventaCosto = costoBaseUnit * Number(venta.cantidad || 1)
    timelineMap[vDate].costo += ventaCosto

    // Si la venta no cuenta con desglose de pagos (ventas anteriores a la tabla PagoVenta)
    if (!venta.pagos || venta.pagos.length === 0) {
      timelineMap[vDate].ingresos += Number(venta.montoPagado != null ? venta.montoPagado : venta.total)
    }
  })

  // B. Procesar recaudaciones/abonos en sus fechas efectivas de pago (incluyendo Septiembre)
  ventas.forEach((venta: any) => {
    if (venta.pagos && venta.pagos.length > 0) {
      venta.pagos.forEach((pago: any) => {
        const rawPagoFecha = pago.fecha instanceof Date ? pago.fecha.toISOString() : String(pago.fecha)
        const pDate = rawPagoFecha.split('T')[0]
        if (!timelineMap[pDate]) {
          timelineMap[pDate] = { ingresos: 0, costo: 0, ganancia: 0 }
        }
        timelineMap[pDate].ingresos += Number(pago.monto)
      })
    }
  })

  // C. Generar array ordenado cronológicamente con todo el historial
  const graficoEvolucion = Object.entries(timelineMap)
    .map(([fecha, vals]) => ({ 
      fecha, 
      ingresos: Number(vals.ingresos.toFixed(2)),
      costo: Number(vals.costo.toFixed(2)),
      ganancia: Number((vals.ingresos - vals.costo).toFixed(2))
    }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  // Distribución de Egresos por Categoría
  const isBG = targetNegocio === 'BG'
  const distribucionInversion = inversiones.reduce((acc, inv) => {
    let catName = isBG ? 'Compra de Juegos' : 'Insumos & Materiales'
    if (inv.categoria === 'MERCADERIA') catName = 'Compra de Juegos'
    else if (inv.categoria === 'FINANCIERO') catName = 'Gastos Bancarios & ITF'
    else if (inv.categoria === 'ACTIVO_FIJO') catName = isBG ? 'Equipamiento' : 'Maquinaria & Equipos'
    else if (inv.categoria === 'SERVICIO') catName = 'Servicios & Operativos'
    else if (inv.categoria === 'APORTE_CAPITAL') catName = 'Aporte Capital'
    
    if (!acc[catName]) acc[catName] = 0
    acc[catName] += Number(inv.costoTotal)
    return acc
  }, {} as Record<string, number>)

  const graficoInversion = Object.entries(distribucionInversion).map(([name, value]) => ({ name, value }))

  // Cuentas por cobrar
  const cuentasPorCobrar = ventas
    .filter((v: any) => Number(v.saldoPendiente) > 0)
    .sort((a: any, b: any) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    .map((v: any) => ({
      id: v.id,
      fecha: v.fecha instanceof Date ? v.fecha.toISOString() : String(v.fecha),
      cliente: v.cliente,
      productoId: v.productoId,
      nombreProductoSnapshot: v.nombreProductoSnapshot || v.producto?.nombreModelo || '',
      costoBaseSnapshot: v.costoBaseSnapshot != null ? Number(v.costoBaseSnapshot) : (v.producto ? Number(v.producto.costoBase) : 0),
      colorFilamentoId: v.colorFilamentoId || null,
      personalizacion: v.personalizacion || null,
      gramosConsumidos: v.gramosConsumidos != null ? Number(v.gramosConsumidos) : 0,
      cantidad: Number(v.cantidad),
      tipoPrecio: v.tipoPrecio,
      precioUnitario: Number(v.precioUnitario),
      total: Number(v.total),
      montoPagado: Number(v.montoPagado),
      saldoPendiente: Number(v.saldoPendiente),
      costoPackaging: v.costoPackaging != null ? Number(v.costoPackaging) : 0,
      porcentajeAdicional: v.porcentajeAdicional != null ? Number(v.porcentajeAdicional) : 0,
      estado: v.estado,
      diaEntregaPrometida: v.diaEntregaPrometida || null,
      destinoEnvio: v.destinoEnvio || null,
      canalVenta: v.canalVenta || null,
      createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
      updatedAt: v.updatedAt instanceof Date ? v.updatedAt.toISOString() : String(v.updatedAt),
      producto: v.producto ? {
        id: v.producto.id,
        lineaCategoria: v.producto.lineaCategoria,
        nombreModelo: v.producto.nombreModelo,
        costoBase: Number(v.producto.costoBase),
        precioAmigos: Number(v.producto.precioAmigos),
        precioMercado: Number(v.producto.precioMercado),
        precioComunidad: Number(v.producto.precioComunidad),
        activo: v.producto.activo,
        createdAt: v.producto.createdAt instanceof Date ? v.producto.createdAt.toISOString() : String(v.producto.createdAt),
        updatedAt: v.producto.updatedAt instanceof Date ? v.producto.updatedAt.toISOString() : String(v.producto.updatedAt),
      } : {
        id: v.productoId,
        lineaCategoria: 'General',
        nombreModelo: v.nombreProductoSnapshot || 'Producto',
        costoBase: 0,
        precioAmigos: 0,
        precioMercado: 0,
        precioComunidad: 0,
        activo: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }))

  // 11. Top 5 Colores Más Utilizados en Taller
  const colorUsageMap: Record<string, {
    id: string
    nombreColor: string
    codigoHex: string
    pedidosCount: number
    unidadesCount: number
    gramosTotal: number
    stockGramosActual: number
    alertaCritica: boolean
  }> = {}

  let totalGramosGeneral = 0

  ventas.forEach((v) => {
    if (v.colorFilamentoId || v.colorFilamento) {
      const colorId = v.colorFilamentoId || v.colorFilamento?.id || 'otro'
      const colorNombre = v.colorFilamento?.nombreColor || 'Color Taller'
      const colorHex = v.colorFilamento?.codigoHex || '#18181B'

      const costoBaseUnit = v.costoBaseSnapshot != null && Number(v.costoBaseSnapshot) > 0
        ? Number(v.costoBaseSnapshot)
        : (Number(v.producto?.costoBase) || 0)

      const gramosConsumidos = v.gramosConsumidos != null && Number(v.gramosConsumidos) > 0
        ? Number(v.gramosConsumidos)
        : Number(((costoBaseUnit / 0.065) * Number(v.cantidad || 1)).toFixed(1))

      const filamentoEnTaller = filamentos.find(f => f.id === colorId || f.nombreColor.toLowerCase() === colorNombre.toLowerCase())
      const stockGramosActual = filamentoEnTaller ? Number(filamentoEnTaller.stockGramos || 0) : Number(v.colorFilamento?.stockGramos || 1000)
      const alertaCritica = stockGramosActual < 300 || Boolean(filamentoEnTaller?.alertaCritica)

      if (!colorUsageMap[colorNombre]) {
        colorUsageMap[colorNombre] = {
          id: colorId,
          nombreColor: colorNombre,
          codigoHex: colorHex,
          pedidosCount: 0,
          unidadesCount: 0,
          gramosTotal: 0,
          stockGramosActual,
          alertaCritica
        }
      }

      colorUsageMap[colorNombre].pedidosCount += 1
      colorUsageMap[colorNombre].unidadesCount += Number(v.cantidad || 1)
      colorUsageMap[colorNombre].gramosTotal += gramosConsumidos
      totalGramosGeneral += gramosConsumidos
    }
  })

  const topColores = Object.values(colorUsageMap)
    .sort((a, b) => b.pedidosCount - a.pedidosCount || b.unidadesCount - a.unidadesCount || b.gramosTotal - a.gramosTotal)
    .slice(0, 5)
    .map((c) => ({
      id: c.id,
      nombreColor: c.nombreColor,
      codigoHex: c.codigoHex,
      pedidosCount: c.pedidosCount,
      unidadesCount: c.unidadesCount,
      gramosTotal: Number(c.gramosTotal.toFixed(1)),
      stockGramosActual: c.stockGramosActual,
      alertaCritica: c.alertaCritica,
      porcentajeUso: totalGramosGeneral > 0 ? Math.min(100, Math.round((c.gramosTotal / totalGramosGeneral) * 100)) : 0
    }))

  // 12. Top 5 Clientes que más han comprado en valor (Monetario Total)
  const clientesMap: Record<string, {
    cliente: string
    totalComprado: number
    totalPagado: number
    saldoPendiente: number
    pedidosCount: number
    piezasCount: number
    canales: Record<string, number>
    ultimoPedidoFecha: string
  }> = {}

  // 13. Top 5 Artículos Más Vendidos (Por Unidades Despachadas y Facturación)
  const articulosMap: Record<string, {
    id: string
    nombreModelo: string
    lineaCategoria: string
    unidadesVendidas: number
    totalFacturado: number
    pedidosCount: number
  }> = {}

  let totalUnidadesVendidas = 0

  // Procesar pedidos de la base de datos
  const rawPedidos = await prisma.pedido.findMany({
    where: { negocio: targetNegocio },
    include: {
      items: {
        include: {
          producto: true,
          colorFilamento: true
        }
      },
      pagos: true
    },
    orderBy: { fecha: 'desc' }
  })

  rawPedidos.forEach((p) => {
    const rawCliente = (p.cliente || 'Cliente sin nombre').trim()
    const cKey = rawCliente.toLowerCase()

    if (!clientesMap[cKey]) {
      clientesMap[cKey] = {
        cliente: rawCliente,
        totalComprado: 0,
        totalPagado: 0,
        saldoPendiente: 0,
        pedidosCount: 0,
        piezasCount: 0,
        canales: {},
        ultimoPedidoFecha: p.fecha instanceof Date ? p.fecha.toISOString() : String(p.fecha)
      }
    }

    const c = clientesMap[cKey]
    c.totalComprado += Number(p.total || 0)
    c.totalPagado += Number(p.montoPagado || 0)
    c.saldoPendiente += Number(p.saldoPendiente || 0)
    c.pedidosCount += 1

    const piezasPedido = Array.isArray(p.items) && p.items.length > 0
      ? p.items.reduce((acc, it) => acc + Number(it.cantidad || 1), 0)
      : 1
    c.piezasCount += piezasPedido

    if (p.canalVenta) {
      c.canales[p.canalVenta] = (c.canales[p.canalVenta] || 0) + 1
    }

    const pFecha = p.fecha instanceof Date ? p.fecha.toISOString() : String(p.fecha)
    if (new Date(pFecha).getTime() > new Date(c.ultimoPedidoFecha).getTime()) {
      c.ultimoPedidoFecha = pFecha
    }

    // Artículos del pedido
    if (Array.isArray(p.items)) {
      p.items.forEach((it) => {
        const nombre = it.nombreProductoSnapshot || it.producto?.nombreModelo || 'Artículo 3D'
        const artKey = (it.productoId || nombre).trim().toLowerCase()
        const categoria = it.producto?.lineaCategoria || 'General'
        const cant = Number(it.cantidad || 1)
        const sub = Number(it.subtotal != null ? it.subtotal : (Number(it.precioUnitario || 0) * cant))

        if (!articulosMap[artKey]) {
          articulosMap[artKey] = {
            id: it.productoId || artKey,
            nombreModelo: nombre,
            lineaCategoria: categoria,
            unidadesVendidas: 0,
            totalFacturado: 0,
            pedidosCount: 0
          }
        }

        articulosMap[artKey].unidadesVendidas += cant
        articulosMap[artKey].totalFacturado += sub
        articulosMap[artKey].pedidosCount += 1
        totalUnidadesVendidas += cant
      })
    }
  })

  // Generar ranking Top 5 Clientes en Valor
  const topClientes = Object.values(clientesMap)
    .sort((a, b) => b.totalComprado - a.totalComprado || b.pedidosCount - a.pedidosCount)
    .slice(0, 5)
    .map((c) => {
      let canalPreferido: string | null = null
      let maxCount = 0
      Object.entries(c.canales).forEach(([canal, count]) => {
        if (count > maxCount) {
          maxCount = count
          canalPreferido = canal
        }
      })

      return {
        cliente: c.cliente,
        totalComprado: Number(c.totalComprado.toFixed(2)),
        totalPagado: Number(c.totalPagado.toFixed(2)),
        saldoPendiente: Number(c.saldoPendiente.toFixed(2)),
        pedidosCount: c.pedidosCount,
        piezasCount: c.piezasCount,
        porcentajeDelTotal: ingresosVentas > 0 ? Number(((c.totalComprado / ingresosVentas) * 100).toFixed(1)) : 0,
        canalPreferido,
        ultimoPedidoFecha: c.ultimoPedidoFecha
      }
    })

  // Generar ranking Top 5 Artículos Más Vendidos
  const topArticulos = Object.values(articulosMap)
    .sort((a, b) => b.unidadesVendidas - a.unidadesVendidas || b.totalFacturado - a.totalFacturado)
    .slice(0, 5)
    .map((art) => ({
      id: art.id,
      nombreModelo: art.nombreModelo,
      lineaCategoria: art.lineaCategoria,
      unidadesVendidas: art.unidadesVendidas,
      totalFacturado: Number(art.totalFacturado.toFixed(2)),
      pedidosCount: art.pedidosCount,
      precioPromedio: art.unidadesVendidas > 0 ? Number((art.totalFacturado / art.unidadesVendidas).toFixed(2)) : 0,
      porcentajeUnidades: totalUnidadesVendidas > 0 ? Number(((art.unidadesVendidas / totalUnidadesVendidas) * 100).toFixed(1)) : 0,
      porcentajeFacturacion: ingresosVentas > 0 ? Number(((art.totalFacturado / ingresosVentas) * 100).toFixed(1)) : 0
    }))

  // 14. Indicador de Capacidad de Gasto del Mes Actual (Lo que tengo vs Lo Blindado vs Lo Proyectado)
  const saldoActualCaja = Math.max(0, (totalCobradoVentas + totalIngresosDirectos) - egresosTotales)
  const cuotaPrestamoMensual = 368.88
  const reservaCapexMensual = 878.00
  const gastosFijosTaller = 111.00
  const totalBlindadoMes = cuotaPrestamoMensual + reservaCapexMensual + gastosFijosTaller
  const gastoDisponibleHoy = Math.max(0, saldoActualCaja - totalBlindadoMes)
  const margenUnitarioPromedio = ticketPromedio > 0 ? (gananciaNeta / Math.max(1, ventas.length)) : 97.00
  const pedidosProyectadosMes = Math.max(8, Math.min(30, Math.round(ventas.length / Math.max(1, 2)) || 18))
  const gananciaProyectadaMes = pedidosProyectadosMes * margenUnitarioPromedio
  const gastoDisponibleProyectado = Math.max(0, (saldoActualCaja + gananciaProyectadaMes) - totalBlindadoMes)

  const serializedInversiones = inversiones.map((inv: any) => ({
    id: inv.id,
    fecha: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : String(inv.createdAt),
    categoria: inv.categoria,
    costoTotal: Number(inv.costoTotal),
    itemConcepto: inv.itemConcepto,
    persona: inv.persona
  }))

  const serializedIngresosDirectos = ingresosDirectos.map((ing: any) => ({
    id: ing.id,
    fecha: ing.fecha instanceof Date ? ing.fecha.toISOString() : String(ing.fecha),
    monto: Number(ing.monto),
    categoria: ing.categoria,
    concepto: ing.concepto,
    cliente: ing.cliente
  }))

  const serializedFilamentos = filamentos.map((f: any) => ({
    id: f.id,
    nombreColor: f.nombreColor,
    codigoHex: f.codigoHex || '#18181B',
    stockGramos: Number(f.stockGramos || 0),
    alertaCritica: Boolean(f.alertaCritica || (f.stockGramos && Number(f.stockGramos) < 300))
  }))

  return {
    kpis: {
      ingresosVentas,
      costoFabricacionTotal,
      gananciaNeta,
      margenPorcentaje,
      totalCobradoVentas,
      saldoPorCobrar,
      egresosTotales,
      ticketPromedio,
      totalIngresosDirectos
    },
    capacidadGasto: {
      saldoActualCaja,
      totalBlindadoMes,
      cuotaPrestamoMensual,
      reservaCapexMensual,
      gastosFijosTaller,
      gastoDisponibleHoy,
      gastoDisponibleProyectado,
      pedidosProyectadosMes,
      gananciaProyectadaMes
    },
    graficoEvolucion,
    graficoInversion,
    cuentasPorCobrar,
    topColores,
    topClientes,
    topArticulos,
    rawVentas: ventas,
    rawInversiones: serializedInversiones,
    rawIngresosDirectos: serializedIngresosDirectos,
    rawFilamentos: serializedFilamentos
  }
}

export async function registrarAbonoDashboard(
  id: string,
  data: {
    monto: number
    metodoPago?: string
    tipo?: string
    notas?: string
    fecha?: string | Date
  }
) {
  try {
    // Check if it's a Pedido
    const ped = await prisma.pedido.findUnique({ where: { id } })
    if (ped) {
      return await addPagoPedido(id, data)
    }
    // Otherwise it's a Venta
    const v = await prisma.venta.findUnique({ where: { id } })
    if (v) {
      const res = await registrarAbono(id, data)
      return { success: true, venta: res, error: undefined }
    }
    return { success: false, error: 'Registro de cuenta por cobrar no encontrado' }
  } catch (error: any) {
    console.error('Error al registrar abono desde dashboard:', error)
    return { success: false, error: error.message || 'Error al registrar abono' }
  }
}

