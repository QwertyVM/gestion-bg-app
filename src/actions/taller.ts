'use server'

import prisma from '@/lib/prisma'
import { EstadoPedido, EstadoVenta } from '@prisma/client'
import { revalidatePath } from 'next/cache'

function safeRevalidate() {
  try {
    revalidatePath('/taller')
    revalidatePath('/pedidos')
    revalidatePath('/ventas')
    revalidatePath('/')
  } catch (e) {
    // Ignore outside request context
  }
}

export interface PiezaTaller {
  id: string
  registroId: string
  tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL'
  codigoRef: string
  fechaSolicitud: string
  diaEntregaPrometida: string | null
  cliente: string
  telefono: string | null
  canalVenta: string | null
  productoId: string
  nombreModelo: string
  lineaCategoria: string
  cantidad: number
  colorFilamentoId: string | null
  coloresIds?: string[]
  colores?: {
    id: string
    nombreColor: string
    codigoHex: string
    tipoMaterial: string
  }[]
  nombreColor: string
  codigoHex: string
  tipoMaterial: string
  personalizacion: string | null
  pesoGramosUnitario: number
  pesoGramosTotal: number
  costoBaseUnitario: number
  estado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO' | 'CANCELADO'
  notas?: string | null
}

export interface GrupoModeloTaller {
  productoId: string
  nombreModelo: string
  lineaCategoria: string
  pesoGramosUnitario: number
  totalUnidades: number
  totalGramos: number
  pendientes: number
  enProduccion: number
  listos: number
  colores: {
    colorId: string | null
    nombreColor: string
    codigoHex: string
    tipoMaterial: string
    cantidad: number
    gramos: number
    piezasIds: string[]
  }[]
  pedidos: {
    piezaId: string
    codigoRef: string
    cliente: string
    fechaSolicitud: string
    diaEntregaPrometida: string | null
    cantidad: number
    nombreColor: string
    codigoHex: string
    personalizacion: string | null
    estado: string
  }[]
}

export interface GrupoColorTaller {
  colorId: string | null
  nombreColor: string
  codigoHex: string
  tipoMaterial: string
  stockGramosActual: number
  stockBobinasActual: number
  alertaCritica: boolean
  totalUnidades: number
  totalGramosRequeridos: number
  deficitGramos: number
  modelos: {
    productoId: string
    nombreModelo: string
    cantidad: number
    gramos: number
    cliente: string
    codigoRef: string
    estado: string
    personalizacion: string | null
  }[]
}

export interface TallerDataResponse {
  piezas: PiezaTaller[]
  gruposPorModelo: GrupoModeloTaller[]
  gruposPorColor: GrupoColorTaller[]
  metricas: {
    totalPiezasPendientes: number
    totalPiezasEnProduccion: number
    totalPiezasListas: number
    totalPiezasActivas: number
    totalModelosUnicos: number
    totalGramosRequeridos: number
    totalColoresRequeridos: number
    entregasUrgentes: number
  }
}

export async function getTallerData(): Promise<TallerDataResponse> {
  try {
    const [pedidos, ventas, filamentos] = await Promise.all([
      prisma.pedido.findMany({
        where: {
          negocio: '3D',
          estado: { in: ['PENDIENTE', 'EN_PRODUCCION', 'LISTO_ENTREGA'] }
        },
        include: {
          items: {
            include: {
              producto: true,
              colorFilamento: true
            }
          }
        },
        orderBy: { fecha: 'asc' }
      }),
      prisma.venta.findMany({
        where: {
          negocio: '3D',
          estado: { in: ['PENDIENTE', 'EN_PRODUCCION'] }
        },
        include: {
          producto: true,
          colorFilamento: true
        },
        orderBy: { fecha: 'asc' }
      }),
      prisma.inventarioFilamento.findMany({
        where: { activo: true }
      })
    ])

    const filamentoMap = new Map<string, any>()
    filamentos.forEach((f) => {
      filamentoMap.set(f.id, f)
    })

    const piezas: PiezaTaller[] = []

    // 1. Procesar items de Pedidos
    pedidos.forEach((ped) => {
      const rawFecha = ped.fecha instanceof Date ? ped.fecha.toISOString() : String(ped.fecha)
      ped.items.forEach((item) => {
        // Taller 3D es exclusivamente para fabricación 3D, no juegos de mesa (BG)
        if (item.producto && item.producto.negocio !== '3D') return
        const pesoUnit = item.producto?.pesoGramos != null && Number(item.producto.pesoGramos) > 0
          ? Number(item.producto.pesoGramos)
          : (item.gramosConsumidos != null && Number(item.gramosConsumidos) > 0 
              ? Number(item.gramosConsumidos) / Number(item.cantidad || 1)
              : 25)

        const cant = Number(item.cantidad || 1)
        const pesoTotal = item.gramosConsumidos != null && Number(item.gramosConsumidos) > 0
          ? Number(item.gramosConsumidos)
          : pesoUnit * cant

        const rawColores: string[] = Array.isArray(item.coloresIds) && item.coloresIds.length > 0
          ? item.coloresIds
          : (item.colorFilamentoId ? [item.colorFilamentoId] : [])

        const resolvedColores = rawColores.map(id => {
          const f = filamentoMap.get(id)
          if (f) {
            return {
              id: f.id,
              nombreColor: f.nombreColor,
              codigoHex: f.codigoHex || '#1E1E1E',
              tipoMaterial: f.tipoMaterial || 'PLA'
            }
          }
          if (item.colorFilamento && item.colorFilamento.id === id) {
            return {
              id: item.colorFilamento.id,
              nombreColor: item.colorFilamento.nombreColor,
              codigoHex: item.colorFilamento.codigoHex || '#1E1E1E',
              tipoMaterial: item.colorFilamento.tipoMaterial || 'PLA'
            }
          }
          return null
        }).filter(Boolean) as { id: string; nombreColor: string; codigoHex: string; tipoMaterial: string }[]

        const primaryCol = resolvedColores[0] || item.colorFilamento || (item.colorFilamentoId ? filamentoMap.get(item.colorFilamentoId) : null)
        const displayNombreColor = resolvedColores.length > 1
          ? resolvedColores.map(c => c.nombreColor).join(' + ')
          : (primaryCol ? primaryCol.nombreColor : 'Sin especificar')

        piezas.push({
          id: item.id,
          registroId: ped.id,
          tipoRegistro: 'PEDIDO_ITEM',
          codigoRef: ped.codigo,
          fechaSolicitud: rawFecha,
          diaEntregaPrometida: ped.diaEntregaPrometida || null,
          cliente: ped.cliente,
          telefono: ped.telefono || null,
          canalVenta: ped.canalVenta || null,
          productoId: item.productoId,
          nombreModelo: item.nombreProductoSnapshot || item.producto?.nombreModelo || 'Pieza 3D',
          lineaCategoria: item.producto?.lineaCategoria || 'General',
          cantidad: cant,
          colorFilamentoId: primaryCol?.id || item.colorFilamentoId || null,
          coloresIds: rawColores,
          colores: resolvedColores,
          nombreColor: displayNombreColor,
          codigoHex: primaryCol?.codigoHex || '#94A3B8',
          tipoMaterial: primaryCol?.tipoMaterial || 'PLA',
          personalizacion: item.personalizacion || null,
          pesoGramosUnitario: Number(pesoUnit.toFixed(1)),
          pesoGramosTotal: Number(pesoTotal.toFixed(1)),
          costoBaseUnitario: item.costoBaseSnapshot != null ? Number(item.costoBaseSnapshot) : (item.producto ? Number(item.producto.costoBase) : 0),
          estado: (item.estado || ped.estado) as any,
          notas: ped.notas || null
        })
      })
    })

    // 2. Procesar Ventas individuales
    ventas.forEach((v) => {
      // Taller 3D es exclusivamente para fabricación 3D, no juegos de mesa (BG)
      if (v.producto && v.producto.negocio !== '3D') return
      const rawFecha = v.fecha instanceof Date ? v.fecha.toISOString() : String(v.fecha)
      const pesoUnit = v.producto?.pesoGramos != null && Number(v.producto.pesoGramos) > 0
        ? Number(v.producto.pesoGramos)
        : (v.gramosConsumidos != null && Number(v.gramosConsumidos) > 0 
            ? Number(v.gramosConsumidos) / Number(v.cantidad || 1)
            : 25)

      const cant = Number(v.cantidad || 1)
      const pesoTotal = v.gramosConsumidos != null && Number(v.gramosConsumidos) > 0
        ? Number(v.gramosConsumidos)
        : pesoUnit * cant

      const rawColores: string[] = Array.isArray(v.coloresIds) && v.coloresIds.length > 0
        ? v.coloresIds
        : (v.colorFilamentoId ? [v.colorFilamentoId] : [])

      const resolvedColores = rawColores.map(id => {
        const f = filamentoMap.get(id)
        if (f) {
          return {
            id: f.id,
            nombreColor: f.nombreColor,
            codigoHex: f.codigoHex || '#1E1E1E',
            tipoMaterial: f.tipoMaterial || 'PLA'
          }
        }
        if (v.colorFilamento && v.colorFilamento.id === id) {
          return {
            id: v.colorFilamento.id,
            nombreColor: v.colorFilamento.nombreColor,
            codigoHex: v.colorFilamento.codigoHex || '#1E1E1E',
            tipoMaterial: v.colorFilamento.tipoMaterial || 'PLA'
          }
        }
        return null
      }).filter(Boolean) as { id: string; nombreColor: string; codigoHex: string; tipoMaterial: string }[]

      const primaryCol = resolvedColores[0] || v.colorFilamento || (v.colorFilamentoId ? filamentoMap.get(v.colorFilamentoId) : null)
      const displayNombreColor = resolvedColores.length > 1
        ? resolvedColores.map(c => c.nombreColor).join(' + ')
        : (primaryCol ? primaryCol.nombreColor : 'Sin especificar')

      piezas.push({
        id: v.id,
        registroId: v.id,
        tipoRegistro: 'VENTA_INDIVIDUAL',
        codigoRef: 'VTA-INDIVIDUAL',
        fechaSolicitud: rawFecha,
        diaEntregaPrometida: v.diaEntregaPrometida || null,
        cliente: v.cliente,
        telefono: null,
        canalVenta: v.canalVenta || null,
        productoId: v.productoId,
        nombreModelo: v.nombreProductoSnapshot || v.producto?.nombreModelo || 'Pieza 3D',
        lineaCategoria: v.producto?.lineaCategoria || 'General',
        cantidad: cant,
        colorFilamentoId: primaryCol?.id || v.colorFilamentoId || null,
        coloresIds: rawColores,
        colores: resolvedColores,
        nombreColor: displayNombreColor,
        codigoHex: primaryCol?.codigoHex || '#94A3B8',
        tipoMaterial: primaryCol?.tipoMaterial || 'PLA',
        personalizacion: v.personalizacion || null,
        pesoGramosUnitario: Number(pesoUnit.toFixed(1)),
        pesoGramosTotal: Number(pesoTotal.toFixed(1)),
        costoBaseUnitario: v.costoBaseSnapshot != null ? Number(v.costoBaseSnapshot) : (v.producto ? Number(v.producto.costoBase) : 0),
        estado: v.estado as any,
        notas: null
      })
    })

    // 3. Agrupación por Modelo / Producto
    const modeloMap = new Map<string, GrupoModeloTaller>()

    piezas.forEach((p) => {
      const key = p.productoId || p.nombreModelo
      if (!modeloMap.has(key)) {
        modeloMap.set(key, {
          productoId: p.productoId,
          nombreModelo: p.nombreModelo,
          lineaCategoria: p.lineaCategoria,
          pesoGramosUnitario: p.pesoGramosUnitario,
          totalUnidades: 0,
          totalGramos: 0,
          pendientes: 0,
          enProduccion: 0,
          listos: 0,
          colores: [],
          pedidos: []
        })
      }

      const grp = modeloMap.get(key)!
      grp.totalUnidades += p.cantidad
      grp.totalGramos = Number((grp.totalGramos + p.pesoGramosTotal).toFixed(1))

      if (p.estado === 'PENDIENTE') grp.pendientes += p.cantidad
      else if (p.estado === 'EN_PRODUCCION') grp.enProduccion += p.cantidad
      else if (p.estado === 'LISTO_ENTREGA') grp.listos += p.cantidad

      // Desglose por color dentro del modelo
      const colorKey = p.colorFilamentoId || p.nombreColor
      let colEntry = grp.colores.find((c) => (c.colorId || c.nombreColor) === colorKey)
      if (!colEntry) {
        colEntry = {
          colorId: p.colorFilamentoId,
          nombreColor: p.nombreColor,
          codigoHex: p.codigoHex,
          tipoMaterial: p.tipoMaterial,
          cantidad: 0,
          gramos: 0,
          piezasIds: []
        }
        grp.colores.push(colEntry)
      }
      colEntry.cantidad += p.cantidad
      colEntry.gramos = Number((colEntry.gramos + p.pesoGramosTotal).toFixed(1))
      colEntry.piezasIds.push(p.id)

      // Detalle del pedido
      grp.pedidos.push({
        piezaId: p.id,
        codigoRef: p.codigoRef,
        cliente: p.cliente,
        fechaSolicitud: p.fechaSolicitud,
        diaEntregaPrometida: p.diaEntregaPrometida,
        cantidad: p.cantidad,
        nombreColor: p.nombreColor,
        codigoHex: p.codigoHex,
        personalizacion: p.personalizacion,
        estado: p.estado
      })
    })

    const gruposPorModelo = Array.from(modeloMap.values()).sort((a, b) => b.totalUnidades - a.totalUnidades)

    // 4. Agrupación por Color de Filamento
    const colorGroupMap = new Map<string, GrupoColorTaller>()

    piezas.forEach((p) => {
      const colorKey = p.colorFilamentoId || p.nombreColor
      if (!colorGroupMap.has(colorKey)) {
        const inv = p.colorFilamentoId ? filamentoMap.get(p.colorFilamentoId) : null
        const stockGramos = inv?.stockGramos ? Number(inv.stockGramos) : 0
        const stockBobinas = inv?.stockBobinas ? Number(inv.stockBobinas) : 0
        const alertaCritica = Boolean(inv?.alertaCritica || (stockGramos < 300 && stockGramos > 0))

        colorGroupMap.set(colorKey, {
          colorId: p.colorFilamentoId,
          nombreColor: p.nombreColor,
          codigoHex: p.codigoHex,
          tipoMaterial: p.tipoMaterial,
          stockGramosActual: stockGramos,
          stockBobinasActual: stockBobinas,
          alertaCritica,
          totalUnidades: 0,
          totalGramosRequeridos: 0,
          deficitGramos: 0,
          modelos: []
        })
      }

      const cGrp = colorGroupMap.get(colorKey)!
      cGrp.totalUnidades += p.cantidad
      cGrp.totalGramosRequeridos = Number((cGrp.totalGramosRequeridos + p.pesoGramosTotal).toFixed(1))
      cGrp.deficitGramos = Number(Math.max(0, cGrp.totalGramosRequeridos - cGrp.stockGramosActual).toFixed(1))

      cGrp.modelos.push({
        productoId: p.productoId,
        nombreModelo: p.nombreModelo,
        cantidad: p.cantidad,
        gramos: p.pesoGramosTotal,
        cliente: p.cliente,
        codigoRef: p.codigoRef,
        estado: p.estado,
        personalizacion: p.personalizacion
      })
    })

    const gruposPorColor = Array.from(colorGroupMap.values()).sort((a, b) => b.totalUnidades - a.totalUnidades)

    // 5. Métricas Generales
    const totalPiezasPendientes = piezas.filter((p) => p.estado === 'PENDIENTE').reduce((sum, p) => sum + p.cantidad, 0)
    const totalPiezasEnProduccion = piezas.filter((p) => p.estado === 'EN_PRODUCCION').reduce((sum, p) => sum + p.cantidad, 0)
    const totalPiezasListas = piezas.filter((p) => p.estado === 'LISTO_ENTREGA').reduce((sum, p) => sum + p.cantidad, 0)
    const totalGramosRequeridos = Number(piezas.reduce((sum, p) => sum + p.pesoGramosTotal, 0).toFixed(1))
    
    // Entregas urgentes: con fecha prometida en los próximos 2 días o vencidas
    const now = new Date()
    const dosDias = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000)
    const entregasUrgentes = piezas.filter((p) => {
      if (!p.diaEntregaPrometida) return false
      try {
        const d = new Date(p.diaEntregaPrometida)
        return !isNaN(d.getTime()) && d <= dosDias
      } catch {
        return false
      }
    }).length

    return {
      piezas,
      gruposPorModelo,
      gruposPorColor,
      metricas: {
        totalPiezasPendientes,
        totalPiezasEnProduccion,
        totalPiezasListas,
        totalPiezasActivas: totalPiezasPendientes + totalPiezasEnProduccion + totalPiezasListas,
        totalModelosUnicos: gruposPorModelo.length,
        totalGramosRequeridos,
        totalColoresRequeridos: gruposPorColor.length,
        entregasUrgentes
      }
    }
  } catch (error) {
    console.error('Error fetching taller data:', error)
    return {
      piezas: [],
      gruposPorModelo: [],
      gruposPorColor: [],
      metricas: {
        totalPiezasPendientes: 0,
        totalPiezasEnProduccion: 0,
        totalPiezasListas: 0,
        totalPiezasActivas: 0,
        totalModelosUnicos: 0,
        totalGramosRequeridos: 0,
        totalColoresRequeridos: 0,
        entregasUrgentes: 0
      }
    }
  }
}

export async function updateEstadoPieza(
  tipoRegistro: 'PEDIDO_ITEM' | 'VENTA_INDIVIDUAL',
  registroId: string,
  nuevoEstado: 'PENDIENTE' | 'EN_PRODUCCION' | 'LISTO_ENTREGA' | 'ENTREGADO'
) {
  try {
    if (tipoRegistro === 'PEDIDO_ITEM') {
      // 1. Actualizar el estado de la pieza individual (ItemPedido)
      const itemActualizado = await prisma.itemPedido.update({
        where: { id: registroId },
        data: { estado: nuevoEstado as EstadoPedido },
        include: {
          pedido: {
            include: {
              items: true
            }
          }
        }
      })

      // 2. Recalcular el estado consolidado del Pedido padre
      if (itemActualizado.pedido) {
        const todosItems = itemActualizado.pedido.items
        const todosListos = todosItems.every(it => it.estado === 'LISTO_ENTREGA' || it.estado === 'ENTREGADO')
        const algunEnProduccionOListo = todosItems.some(it => it.estado === 'EN_PRODUCCION' || it.estado === 'LISTO_ENTREGA')
        const todosPendientes = todosItems.every(it => it.estado === 'PENDIENTE')

        let nuevoEstadoPedido: EstadoPedido = 'PENDIENTE'
        if (todosListos) {
          nuevoEstadoPedido = 'LISTO_ENTREGA'
        } else if (algunEnProduccionOListo) {
          nuevoEstadoPedido = 'EN_PRODUCCION'
        } else if (todosPendientes) {
          nuevoEstadoPedido = 'PENDIENTE'
        }

        await prisma.pedido.update({
          where: { id: itemActualizado.pedidoId },
          data: { estado: nuevoEstadoPedido }
        })
      }
    } else {
      // Venta individual
      await prisma.venta.update({
        where: { id: registroId },
        data: { estado: (nuevoEstado === 'LISTO_ENTREGA' ? 'ENTREGADO' : nuevoEstado) as EstadoVenta }
      })
    }

    safeRevalidate()
    return { success: true }
  } catch (error: any) {
    console.error('Error updating taller item status:', error)
    return { success: false, error: error.message || 'Error al actualizar estado' }
  }
}
