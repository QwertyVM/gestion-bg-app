'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  Layers, 
  Sparkles,
  ShoppingBag,
  Megaphone,
  Box,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Sliders,
  Wallet,
  Landmark,
  Target,
  LifeBuoy,
  CreditCard,
  Settings2,
  ArrowRight
} from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from 'recharts'
import { DatosCajaChica } from '@/actions/proyecciones'

interface ProyeccionesClientProps {
  datos: DatosCajaChica
}

type HorizonteTiempo = 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL'

export function ProyeccionesClient({ datos }: ProyeccionesClientProps) {
  // 1. Selector Temporal de Horizonte (Mensual, Trimestral, Semestral)
  const [horizonte, setHorizonte] = useState<HorizonteTiempo>('TRIMESTRAL')

  const mesesHorizonte = useMemo(() => {
    switch (horizonte) {
      case 'MENSUAL': return 1
      case 'TRIMESTRAL': return 3
      case 'SEMESTRAL': return 6
      default: return 3
    }
  }, [horizonte])

  // 2. PASO 1: DEFINICIÓN DE METAS DE RESERVA Y COLCHÓN DE EMERGENCIA
  const [metaReservaConcepto, setMetaReservaConcepto] = useState<string>('Preventa Nueva Máquina (A2L / Bambu Lab)')
  const [metaReservaTotal, setMetaReservaTotal] = useState<number>(2400.00)
  const [fondoReservaApartado, setFondoReservaApartado] = useState<number>(800.00)

  const [fondoColchonEmergencia, setFondoColchonEmergencia] = useState<number>(350.00)
  const [apartarCuotaPrestamo, setApartarCuotaPrestamo] = useState<boolean>(true)
  const [cuotaPrestamoMonto, setCuotaPrestamoMonto] = useState<number>(datos.cuotaPrestamoMensual || 368.88)
  const [gastosFijosOperativos, setGastosFijosOperativos] = useState<number>(datos.gastosFijosEstimadosMensual || 250.00)

  // 3. Variables de proyección mensual (igual al dashboard)
  const [pedidosMensuales, setPedidosMensuales] = useState<number>(18)
  const [ticketPromedio, setTicketPromedio] = useState<number>(datos.ticketPromedioVenta || 135.00)
  const [costoMaterialPorPedido, setCostoMaterialPorPedido] = useState<number>(datos.costoPromedioFabricacionPorPedido || 38.00)
  const [crecimientoMensualPct, setCrecimientoMensualPct] = useState<number>(5)

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // 4. Cálculos de Segregación de Fondos y Liquidez
  const saldoTotalCaja = datos.saldoActualCajaChica
  const cuentasPorCobrar = datos.cuentasPorCobrar

  // Desglose estimado de cuentas
  const saldoBCP = Number((saldoTotalCaja * 0.65).toFixed(2))
  const saldoYape = Number((saldoTotalCaja * 0.35).toFixed(2))

  // Fondos Comprometidos / Blindados
  const montoCuotaApartada = apartarCuotaPrestamo ? cuotaPrestamoMonto : 0
  const totalFondosApartados = montoCuotaApartada + fondoReservaApartado + fondoColchonEmergencia
  const liquidezLibre = Math.max(0, saldoTotalCaja - totalFondosApartados)

  // Avance hacia la meta de reserva definida
  const avanceMetaReservaPct = metaReservaTotal > 0 
    ? Math.min(100, (fondoReservaApartado / metaReservaTotal) * 100) 
    : 0

  // Runway Operativo
  const gastosFijosTotalesMensuales = cuotaPrestamoMonto + gastosFijosOperativos
  const runwayMeses = gastosFijosTotalesMensuales > 0 
    ? Math.max(0, Number((saldoTotalCaja / gastosFijosTotalesMensuales).toFixed(1))) 
    : 99

  // Porcentajes para Stacked Bar (Distribución de Caja)
  const pctPrestamo = saldoTotalCaja > 0 ? (montoCuotaApartada / saldoTotalCaja) * 100 : 0
  const pctReserva = saldoTotalCaja > 0 ? (fondoReservaApartado / saldoTotalCaja) * 100 : 0
  const pctEmergencia = saldoTotalCaja > 0 ? (fondoColchonEmergencia / saldoTotalCaja) * 100 : 0
  const pctLibre = saldoTotalCaja > 0 ? (liquidezLibre / saldoTotalCaja) * 100 : 0

  // Capacidad de Compra Inmediata
  const bobinasFilamento = Math.floor(liquidezLibre / 48)
  const diasPautaMeta = Math.floor(liquidezLibre / 15)
  const packsPackaging = Math.floor(liquidezLibre / 25)

  // Estado del Semáforo
  const semaforoEstado = useMemo(() => {
    if (liquidezLibre >= 500) {
      return {
        tipo: 'verde',
        titulo: 'Disponibilidad Holgada (Excelente Salud)',
        desc: 'Cuentas con liquidez libre suficiente para adquirir insumos, reponer stock o invertir en pauta publicitaria sin comprometer cuotas ni reservas.',
        badge: 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]',
        bg: 'bg-[#F4FAF5] border-[#B4E3C0]',
        icon: CheckCircle2,
        iconColor: 'text-[#1E5E3A]'
      }
    } else if (liquidezLibre >= 150) {
      return {
        tipo: 'amarillo',
        titulo: 'Liquidez Moderada (Precaución)',
        desc: 'Se recomienda priorizar compras de estricta necesidad para pedidos en firme y evitar retiros de capital o gastos discrecionales.',
        badge: 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]',
        bg: 'bg-[#FEFAF0] border-[#E8D49B]',
        icon: AlertTriangle,
        iconColor: 'text-[#8C6D1F]'
      }
    } else {
      return {
        tipo: 'rojo',
        titulo: 'Alerta: Liquidez Ajustada',
        desc: 'El saldo disponible está casi totalmente comprometido en deudas y reservas fijas. Espera el ingreso de nuevos cobros de ventas antes de realizar compras.',
        badge: 'bg-[#FDF0EE] text-[#A34335] border-[#F2C0B8]',
        bg: 'bg-[#FFF6F5] border-[#F2C0B8]',
        icon: AlertTriangle,
        iconColor: 'text-[#A34335]'
      }
    }
  }, [liquidezLibre])

  // Restablecer valores
  const handleReset = () => {
    setHorizonte('TRIMESTRAL')
    setMetaReservaConcepto('Preventa Nueva Máquina (A2L / Bambu Lab)')
    setMetaReservaTotal(2400.00)
    setFondoReservaApartado(800.00)
    setFondoColchonEmergencia(350.00)
    setApartarCuotaPrestamo(true)
    setCuotaPrestamoMonto(datos.cuotaPrestamoMensual || 368.88)
    setGastosFijosOperativos(datos.gastosFijosEstimadosMensual || 250.00)
    setPedidosMensuales(18)
    setTicketPromedio(datos.ticketPromedioVenta || 135.00)
    setCostoMaterialPorPedido(datos.costoPromedioFabricacionPorPedido || 38.00)
    setCrecimientoMensualPct(5)
  }

  // 5. Proyección Mensual (Mes a Mes: 1, 3 o 6 Meses)
  const proyeccionMeses = useMemo(() => {
    const mesesData = []
    let saldoAcumulado = saldoTotalCaja

    for (let i = 1; i <= mesesHorizonte; i++) {
      const factorCrecimiento = Math.pow(1 + crecimientoMensualPct / 100, i - 1)
      const pedidosMes = Math.round(pedidosMensuales * factorCrecimiento)

      const ventasEstimadasMes = pedidosMes * ticketPromedio
      const cobroCuentasPendientes = i === 1 ? cuentasPorCobrar : 0
      const totalIngresosMes = ventasEstimadasMes + cobroCuentasPendientes

      const costoMaterialesMes = pedidosMes * costoMaterialPorPedido
      const cuotaBancoMes = montoCuotaApartada
      const gastosOperativosMes = gastosFijosOperativos

      const totalEgresosMes = costoMaterialesMes + cuotaBancoMes + gastosOperativosMes
      const flujoNetoMes = totalIngresosMes - totalEgresosMes

      const saldoInicial = saldoAcumulado
      saldoAcumulado = saldoAcumulado + flujoNetoMes

      mesesData.push({
        mesNumero: i,
        nombreMes: i === 1 ? 'Mes Actual' : `Mes +${i}`,
        pedidosEstimados: pedidosMes,
        ventasEstimadas: ventasEstimadasMes,
        ingresosExtras: cobroCuentasPendientes,
        totalIngresos: totalIngresosMes,
        costoMateriales: costoMaterialesMes,
        cuotaBanco: cuotaBancoMes,
        gastosOperativos: gastosOperativosMes,
        totalEgresos: totalEgresosMes,
        flujoNeto: flujoNetoMes,
        saldoInicial: saldoInicial,
        saldoFinalCaja: saldoAcumulado,
        fondoBlindado: totalFondosApartados,
        liquidezLibreProyectada: Math.max(0, saldoAcumulado - totalFondosApartados)
      })
    }

    return mesesData
  }, [
    mesesHorizonte, 
    saldoTotalCaja, 
    cuentasPorCobrar, 
    pedidosMensuales, 
    ticketPromedio, 
    costoMaterialPorPedido, 
    montoCuotaApartada, 
    gastosFijosOperativos, 
    crecimientoMensualPct, 
    totalFondosApartados
  ])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* ========================================================================= */}
      {/* 1. CABECERA & FILTRO DE HORIZONTE: MENSUAL / TRIMESTRAL / SEMESTRAL      */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm">
              <Landmark className="h-6 w-6 stroke-[2.5]" />
            </div>
            Tesorería & Disponibilidad de Caja
          </h1>
          <p className="text-sm text-[#75695D] mt-1">
            Control de fondos asignados, blindaje de cuotas y capital de trabajo disponible.
          </p>
        </div>

        {/* Switch de horizonte temporal (Mensual / Trimestral / Semestral) */}
        <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-[#F4EFEA] p-1 rounded-xl border border-[#E2D9CC] shadow-sm w-full sm:w-auto">
          <button
            onClick={() => setHorizonte('MENSUAL')}
            className={`px-2 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              horizonte === 'MENSUAL'
                ? 'bg-[#A36F4C] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            1 Mes
          </button>
          <button
            onClick={() => setHorizonte('TRIMESTRAL')}
            className={`px-2 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              horizonte === 'TRIMESTRAL'
                ? 'bg-[#A36F4C] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            3 Meses
          </button>
          <button
            onClick={() => setHorizonte('SEMESTRAL')}
            className={`px-2 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer text-center ${
              horizonte === 'SEMESTRAL'
                ? 'bg-[#A36F4C] text-white shadow-sm'
                : 'text-[#75695D] hover:bg-[#FFFFFF] hover:text-[#241C15]'
            }`}
          >
            6 Meses
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FILA PRINCIPAL DE KPIS (SEGREGACIÓN DE FONDOS MINIMALISTA)             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* TARJETA 1: Saldo Total en Caja */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Saldo Total en Caja</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
              {formatCurrency(saldoTotalCaja)}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[#75695D]">
              <span>BCP: {formatCurrency(saldoBCP)}</span>
              <span>•</span>
              <span>Yape: {formatCurrency(saldoYape)}</span>
            </div>
          </div>
        </div>

        {/* TARJETA 2: Fondos Comprometidos / Blindados */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Fondos Blindados</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#944917]">
              <Lock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#944917] font-mono tabular-nums">
              {formatCurrency(totalFondosApartados)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              Cuota ({formatCurrency(montoCuotaApartada)}) + Reserva
            </span>
          </div>
        </div>

        {/* TARJETA 3: Liquidez Libre Disponible */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Gasto Libre Disponible</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
              <Unlock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#1E5E3A] font-mono tabular-nums">
              {formatCurrency(liquidezLibre)}
            </div>
            <span className="text-xs text-[#1E5E3A] font-medium mt-0.5 block truncate">
              {saldoTotalCaja > 0 ? `${((liquidezLibre / saldoTotalCaja) * 100).toFixed(0)}% libre para disposición` : '0%'}
            </span>
          </div>
        </div>

        {/* TARJETA 4: Runway Operativo */}
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Runway Operativo</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
              <Clock className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
              {runwayMeses} <span className="text-xs font-normal font-sans text-[#75695D]">meses</span>
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              Gastos fijos: {formatCurrency(gastosFijosTotalesMensuales)}/mes
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. PASO 1: DEFINICIÓN DE METAS DE RESERVA Y COLCHÓN DE EMERGENCIA        */}
      {/* ========================================================================= */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl">
        <CardHeader className="pb-3 border-b border-[#E2D9CC] bg-[#FDFBF7]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-bold text-[#241C15] flex items-center gap-2">
                <Settings2 className="h-5 w-5 text-[#A36F4C]" />
                1. Definición de Políticas de Reserva & Colchón de Emergencia
              </CardTitle>
              <CardDescription className="text-xs text-[#75695D] mt-0.5">
                Define tus metas financieras antes de aplicar el blindaje de capital. Estos valores rigen la asignación de liquidez.
              </CardDescription>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#F4EFEA] text-xs rounded-xl self-start sm:self-auto cursor-pointer"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1 text-[#75695D]" />
              Restablecer Valores
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* DEFINICIÓN 1: Meta de Reserva para Máquina / Equipamiento */}
            <div className="p-4 rounded-2xl bg-[#F8F6F2] border border-[#E2D9CC] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#241C15] flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-[#A36F4C]" />
                  Meta de Reserva: Máquina / Stock
                </span>
                <Badge variant="outline" className="bg-[#EFE5D8] border-[#D4BEA7] text-[#633E20] text-[10px] font-bold">
                  {avanceMetaReservaPct.toFixed(0)}% de la meta
                </Badge>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] text-[#75695D] font-medium">Concepto u Objetivo:</Label>
                <Input
                  value={metaReservaConcepto}
                  onChange={(e) => setMetaReservaConcepto(e.target.value)}
                  placeholder="Ej: Preventa Bambu Lab A2L..."
                  className="bg-[#FFFFFF] border-[#DCD3C6] text-xs text-[#241C15] h-8 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#75695D] font-medium">Meta Total S/:</Label>
                  <Input
                    type="number"
                    step="100"
                    value={metaReservaTotal}
                    onChange={(e) => setMetaReservaTotal(parseFloat(e.target.value) || 0)}
                    className="bg-[#FFFFFF] border-[#DCD3C6] text-xs font-mono font-bold text-[#241C15] h-8 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-[#A36F4C] font-bold">Apartar este mes:</Label>
                  <Input
                    type="number"
                    step="50"
                    value={fondoReservaApartado}
                    onChange={(e) => setFondoReservaApartado(parseFloat(e.target.value) || 0)}
                    className="bg-[#FFFFFF] border-[#A36F4C] text-xs font-mono font-bold text-[#A36F4C] h-8 rounded-xl"
                  />
                </div>
              </div>

              {/* Barra de avance hacia la meta total */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[10px] text-[#75695D]">
                  <span>Progreso hacia Meta Total:</span>
                  <span className="font-mono font-bold text-[#241C15]">{formatCurrency(fondoReservaApartado)} / {formatCurrency(metaReservaTotal)}</span>
                </div>
                <div className="h-2 w-full bg-[#E2D9CC] rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${avanceMetaReservaPct}%` }}
                    className="h-full bg-[#A36F4C] rounded-full transition-all duration-300"
                  />
                </div>
              </div>
            </div>

            {/* DEFINICIÓN 2: Colchón de Emergencia */}
            <div className="p-4 rounded-2xl bg-[#F8F6F2] border border-[#E2D9CC] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#241C15] flex items-center gap-1.5">
                  <LifeBuoy className="h-4 w-4 text-[#8C6D1F]" />
                  Fondo Colchón de Emergencia
                </span>
                <Badge variant="outline" className="bg-[#FDF6E2] border-[#E8D49B] text-[#8C6D1F] text-[10px] font-bold">
                  Respaldo
                </Badge>
              </div>

              <p className="text-[11px] text-[#75695D] leading-relaxed">
                Dinero destinado a cubrir roturas de boquillas, garantías de clientes o fletes imprevistos sin tocar capital de trabajo.
              </p>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] text-[#75695D] font-medium">Monto a Mantener en Colchón:</Label>
                  <span className="text-xs font-bold font-mono text-[#8C6D1F]">
                    {formatCurrency(fondoColchonEmergencia)}
                  </span>
                </div>
                <Input
                  type="number"
                  step="25"
                  value={fondoColchonEmergencia}
                  onChange={(e) => setFondoColchonEmergencia(parseFloat(e.target.value) || 0)}
                  className="bg-[#FFFFFF] border-[#DCD3C6] text-xs font-mono font-bold text-[#241C15] h-8 rounded-xl"
                />
              </div>

              {/* Botones de configuración rápida */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setFondoColchonEmergencia(250.00)}
                  className="px-2 py-1 bg-[#FFFFFF] border border-[#E2D9CC] rounded-lg text-[10px] text-[#75695D] hover:text-[#241C15] cursor-pointer"
                >
                  S/ 250 (1x Fijo)
                </button>
                <button
                  type="button"
                  onClick={() => setFondoColchonEmergencia(350.00)}
                  className="px-2 py-1 bg-[#FFFFFF] border border-[#E2D9CC] rounded-lg text-[10px] text-[#75695D] hover:text-[#241C15] cursor-pointer"
                >
                  S/ 350 (Recomendado)
                </button>
                <button
                  type="button"
                  onClick={() => setFondoColchonEmergencia(500.00)}
                  className="px-2 py-1 bg-[#FFFFFF] border border-[#E2D9CC] rounded-lg text-[10px] text-[#75695D] hover:text-[#241C15] cursor-pointer"
                >
                  S/ 500 (2x Fijo)
                </button>
              </div>
            </div>

            {/* DEFINICIÓN 3: Cuota Bancaria y Gastos Fijos */}
            <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
              apartarCuotaPrestamo 
                ? 'bg-[#FDFBF7] border-[#944917]/50 ring-1 ring-[#944917]/20' 
                : 'bg-[#F8F6F2] border-[#E2D9CC]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#241C15] flex items-center gap-1.5">
                  <CreditCard className="h-4 w-4 text-[#944917]" />
                  Obligación Cuota Préstamo
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#75695D]">Blindar:</span>
                  <input
                    type="checkbox"
                    checked={apartarCuotaPrestamo}
                    onChange={(e) => setApartarCuotaPrestamo(e.target.checked)}
                    className="h-4 w-4 rounded border-[#DCD3C6] text-[#944917] focus:ring-[#944917] cursor-pointer accent-[#944917]"
                  />
                </div>
              </div>

              <p className="text-[11px] text-[#75695D] leading-relaxed">
                Préstamo bancario del taller (24 cuotas programadas). Se aparta automáticamente cada período.
              </p>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[11px] text-[#75695D] font-medium">Cuota Mensual:</Label>
                  <span className="text-xs font-bold font-mono text-[#944917]">
                    {apartarCuotaPrestamo ? formatCurrency(cuotaPrestamoMonto) : 'S/ 0.00 (No apartada)'}
                  </span>
                </div>
                <Input
                  type="number"
                  step="10"
                  disabled={!apartarCuotaPrestamo}
                  value={cuotaPrestamoMonto}
                  onChange={(e) => setCuotaPrestamoMonto(parseFloat(e.target.value) || 0)}
                  className="bg-[#FFFFFF] border-[#DCD3C6] text-xs font-mono font-bold text-[#241C15] h-8 rounded-xl disabled:opacity-50"
                />
              </div>

              <div className="pt-1 text-[11px] text-[#75695D] flex items-center justify-between border-t border-[#E2D9CC]/70">
                <span>Gastos fijos taller (Luz/Int):</span>
                <span className="font-mono font-bold text-[#241C15]">{formatCurrency(gastosFijosOperativos)}/mes</span>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 4. PASO 2: ASIGNACIÓN & BLINDAJE EN TIEMPO REAL (STACKED BAR)            */}
      {/* ========================================================================= */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl">
        <CardHeader className="pb-3 border-b border-[#E2D9CC] bg-[#FDFBF7]">
          <CardTitle className="text-base font-bold text-[#241C15] flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-[#1E5E3A]" />
            2. Asignación y Blindaje de Fondos en Tiempo Real
          </CardTitle>
          <CardDescription className="text-xs text-[#75695D] mt-0.5">
            Distribución exacta de la caja actual según las metas y colchón configurados arriba.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-5 space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-[#241C15]">Distribución del 100% de la Caja:</span>
            <span className="font-mono text-[#75695D]">
              Total disponible en banco: <strong className="text-[#241C15] font-mono">{formatCurrency(saldoTotalCaja)}</strong>
            </span>
          </div>

          {/* Stacked Bar */}
          <div className="h-6 w-full rounded-xl bg-[#F4EFEA] border border-[#E2D9CC] overflow-hidden flex shadow-inner">
            {pctPrestamo > 0 && (
              <div 
                style={{ width: `${Math.min(100, pctPrestamo)}%` }} 
                className="bg-[#944917] h-full transition-all duration-300 relative group"
                title={`Cuota Préstamo: ${formatCurrency(montoCuotaApartada)} (${pctPrestamo.toFixed(1)}%)`}
              />
            )}
            {pctReserva > 0 && (
              <div 
                style={{ width: `${Math.min(100, pctReserva)}%` }} 
                className="bg-[#A36F4C] h-full transition-all duration-300 relative group"
                title={`Reserva Máquina: ${formatCurrency(fondoReservaApartado)} (${pctReserva.toFixed(1)}%)`}
              />
            )}
            {pctEmergencia > 0 && (
              <div 
                style={{ width: `${Math.min(100, pctEmergencia)}%` }} 
                className="bg-[#8C6D1F] h-full transition-all duration-300 relative group"
                title={`Colchón Emergencia: ${formatCurrency(fondoColchonEmergencia)} (${pctEmergencia.toFixed(1)}%)`}
              />
            )}
            {pctLibre > 0 && (
              <div 
                style={{ width: `${Math.min(100, pctLibre)}%` }} 
                className="bg-[#1E5E3A] h-full transition-all duration-300 relative group"
                title={`Liquidez Libre: ${formatCurrency(liquidezLibre)} (${pctLibre.toFixed(1)}%)`}
              />
            )}
          </div>

          {/* Leyenda de la Barra */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <span className="w-3 h-3 rounded-md bg-[#944917] flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-[#75695D] block truncate">Cuota Préstamo</span>
                <span className="font-bold text-[#241C15] font-mono">{formatCurrency(montoCuotaApartada)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <span className="w-3 h-3 rounded-md bg-[#A36F4C] flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-[#75695D] block truncate">Reserva Máquina</span>
                <span className="font-bold text-[#241C15] font-mono">{formatCurrency(fondoReservaApartado)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
              <span className="w-3 h-3 rounded-md bg-[#8C6D1F] flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-[#75695D] block truncate">Colchón Emergencia</span>
                <span className="font-bold text-[#241C15] font-mono">{formatCurrency(fondoColchonEmergencia)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-[#F4FAF5] border-2 border-[#1E5E3A]/40 shadow-sm">
              <span className="w-3 h-3 rounded-md bg-[#1E5E3A] flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-[#1E5E3A] font-bold block truncate">Liquidez Libre</span>
                <span className="font-extrabold text-[#1E5E3A] font-mono">{formatCurrency(liquidezLibre)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 5. SIMULADOR DE CAPACIDAD DE GASTO INMEDIATO                             */}
      {/* ========================================================================= */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl">
        <CardHeader className="pb-3 border-b border-[#E2D9CC]">
          <CardTitle className="text-base font-bold text-[#241C15] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#A36F4C]" />
            ¿Cuánto puedo gastar hoy sin comprometer el taller?
          </CardTitle>
          <CardDescription className="text-xs text-[#75695D]">
            Cálculo en vivo de capacidad de compra y semáforo de riesgo basado exclusivamente en tu Liquidez Libre.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          {/* Semáforo Financiero */}
          <div className={`p-4 rounded-2xl border ${semaforoEstado.bg} space-y-1.5`}>
            <div className="flex items-center gap-2">
              <semaforoEstado.icon className={`h-5 w-5 ${semaforoEstado.iconColor}`} />
              <span className="font-extrabold text-sm text-[#241C15]">
                {semaforoEstado.titulo}
              </span>
            </div>
            <p className="text-xs text-[#75695D] leading-relaxed">
              {semaforoEstado.desc}
            </p>
          </div>

          {/* Poder de Compra Calculado con Liquidez Libre */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] text-center">
              <ShoppingBag className="h-5 w-5 text-[#A36F4C] mx-auto mb-1.5" />
              <div className="text-2xl font-extrabold text-[#241C15] font-mono">{bobinasFilamento}</div>
              <span className="text-xs text-[#75695D] block mt-0.5 font-medium">Bobinas PLA (S/48 c/u)</span>
              <span className="text-[10px] text-[#75695D] block">~{bobinasFilamento} kg de material 3D</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] text-center">
              <Megaphone className="h-5 w-5 text-[#633E20] mx-auto mb-1.5" />
              <div className="text-2xl font-extrabold text-[#241C15] font-mono">{diasPautaMeta}</div>
              <span className="text-xs text-[#75695D] block mt-0.5 font-medium">Días Meta Ads (S/15/día)</span>
              <span className="text-[10px] text-[#75695D] block">Campañas de captación activa</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] text-center">
              <Box className="h-5 w-5 text-[#1E5E3A] mx-auto mb-1.5" />
              <div className="text-2xl font-extrabold text-[#241C15] font-mono">{packsPackaging}</div>
              <span className="text-xs text-[#75695D] block mt-0.5 font-medium">Packs Packaging (S/25)</span>
              <span className="text-[10px] text-[#75695D] block">~{packsPackaging * 10} envíos listos</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 6. PROYECCIÓN MENSUAL (TABLA Y GRÁFICO IGUAL AL DASHBOARD)                */}
      {/* ========================================================================= */}
      <div className="space-y-6">
        {/* GRÁFICO INTERACTIVO: CURVA DE LIQUIDEZ Y FONDOS BLINDADOS */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-sm rounded-2xl">
          <CardHeader className="pb-2 border-b border-[#E2D9CC]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base font-bold text-[#241C15] flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-[#1E5E3A]" />
                  Curva de Evolución Mensual ({horizonte === 'MENSUAL' ? '1 Mes' : horizonte === 'TRIMESTRAL' ? '3 Meses' : '6 Meses'})
                </CardTitle>
                <CardDescription className="text-xs text-[#75695D]">
                  Proyección mensual del saldo en caja vs. nivel de fondos blindados del taller.
                </CardDescription>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-[#1E5E3A] font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E5E3A] inline-block" />
                  Saldo en Caja
                </span>
                <span className="flex items-center gap-1 text-[#944917] font-bold">
                  <span className="w-2.5 h-0.5 bg-[#944917] inline-block" />
                  Fondos Blindados ({formatCurrency(totalFondosApartados)})
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={proyeccionMeses} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSaldoCajaTes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1E5E3A" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#1E5E3A" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2D9CC" vertical={false} />
                  <XAxis dataKey="nombreMes" stroke="#75695D" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#75695D" 
                    fontSize={11} 
                    tickLine={false} 
                    tickFormatter={(val) => `S/${val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}`} 
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="bg-[#FFFFFF] border border-[#E2D9CC] p-3 rounded-2xl shadow-xl text-xs space-y-1.5 min-w-[210px]">
                            <div className="font-bold text-[#241C15] border-b border-[#E2D9CC] pb-1 flex justify-between">
                              <span>{data.nombreMes}</span>
                              <span className="text-[#75695D]">{data.pedidosEstimados} pedidos</span>
                            </div>
                            <div className="space-y-1 text-[#241C15]">
                              <div className="flex justify-between">
                                <span className="text-[#75695D]">Ingresos Ventas:</span>
                                <span className="font-mono text-[#1E5E3A] font-bold">+{formatCurrency(data.totalIngresos)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#75695D]">Egresos Totales:</span>
                                <span className="font-mono text-[#944917]">-{formatCurrency(data.totalEgresos)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#75695D]">Flujo Neto:</span>
                                <span className={`font-mono font-bold ${data.flujoNeto >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}`}>
                                  {data.flujoNeto >= 0 ? '+' : ''}{formatCurrency(data.flujoNeto)}
                                </span>
                              </div>
                              <div className="flex justify-between pt-1 border-t border-[#E2D9CC] font-bold">
                                <span className="text-[#241C15]">Saldo en Caja:</span>
                                <span className="font-mono text-[#1E5E3A]">{formatCurrency(data.saldoFinalCaja)}</span>
                              </div>
                              <div className="flex justify-between text-[10px] text-[#1E5E3A]">
                                <span>Liquidez Libre:</span>
                                <span className="font-mono font-bold">{formatCurrency(data.liquidezLibreProyectada)}</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <ReferenceLine 
                    y={totalFondosApartados} 
                    stroke="#944917" 
                    strokeDasharray="4 4" 
                    label={{ value: `Blindado: S/ ${totalFondosApartados}`, fill: '#944917', fontSize: 10, position: 'insideTopLeft' }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="saldoFinalCaja" 
                    stroke="#1E5E3A" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorSaldoCajaTes)" 
                    name="Saldo en Caja" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* TABLA DE PROYECCIÓN MENSUAL DETALLADA (IGUAL AL DASHBOARD) */}
        <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-[#E2D9CC] bg-[#FDFBF7]">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-[#241C15] flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-[#A36F4C]" />
                  Proyección Financiera Mensual ({horizonte === 'MENSUAL' ? '1 Mes' : horizonte === 'TRIMESTRAL' ? '3 Meses' : '6 Meses'})
                </CardTitle>
                <CardDescription className="text-xs text-[#75695D] mt-0.5">
                  Desglose mensual de ingresos por ventas, costos de materiales, cuota blindada y saldo proyectado.
                </CardDescription>
              </div>
              <Badge variant="outline" className="bg-[#EFE5D8] border-[#D4BEA7] text-[#633E20] font-bold text-xs">
                {mesesHorizonte} {mesesHorizonte === 1 ? 'Mes' : 'Meses'}
              </Badge>
            </div>
          </CardHeader>

          {/* Mobile View (< md): Monthly Projection Cards */}
          <div className="block md:hidden divide-y divide-[#E2D9CC]/70">
            {proyeccionMeses.map((m) => {
              const isHealthy = m.saldoFinalCaja >= totalFondosApartados
              const isWarning = m.saldoFinalCaja > 0 && m.saldoFinalCaja < totalFondosApartados

              return (
                <div key={m.mesNumero} className="p-4 space-y-3 hover:bg-[#FDFBF7] transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <span className="font-extrabold text-sm text-[#241C15] block">{m.nombreMes}</span>
                      <span className="text-[11px] text-[#75695D] font-mono">{m.pedidosEstimados} pedidos estimados</span>
                    </div>

                    <div>
                      {isHealthy ? (
                        <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold">
                          Óptimo
                        </Badge>
                      ) : isWarning ? (
                        <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-bold">
                          Alerta
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-[#FDF2F0] text-[#A34335] border-[#F0BCB4] text-[10px] font-bold">
                          Déficit
                        </Badge>
                      )}
                    </div>
                  </div>

                  {m.ingresosExtras > 0 && (
                    <div className="p-2 rounded-xl bg-[#EBF7EE]/60 border border-[#B4E3C0] text-[11px] text-[#1E5E3A] font-medium">
                      📥 Cobro Saldos Pendientes (+{formatCurrency(m.ingresosExtras)})
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]/70">
                      <span className="text-[10px] text-[#75695D] block uppercase font-bold">Ingresos (+)</span>
                      <span className="font-mono font-bold text-[#1E5E3A]">+{formatCurrency(m.totalIngresos)}</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#E2D9CC]/70">
                      <span className="text-[10px] text-[#75695D] block uppercase font-bold">Materiales (-)</span>
                      <span className="font-mono font-bold text-[#944917]">-{formatCurrency(m.costoMateriales)}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-[#75695D] block">Saldo en Caja</span>
                      <span className="font-mono font-extrabold text-sm text-[#241C15]">{formatCurrency(m.saldoFinalCaja)}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-[#1E5E3A] font-bold block">Liquidez Libre</span>
                      <span className="font-mono font-extrabold text-sm text-[#1E5E3A]">{formatCurrency(m.liquidezLibreProyectada)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto max-h-[350px] overflow-y-auto scrollbar-thin">
            <Table className="w-full min-w-[700px]">
              <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
              <TableRow className="border-[#E2D9CC] hover:bg-transparent text-xs">
                <TableHead className="text-[#241C15] font-bold px-4 py-3 text-left">Período Mensual</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-center">Pedidos Est.</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">Saldo Inicial</TableHead>
                <TableHead className="text-[#1E5E3A] font-bold px-3 py-3 text-right">(+) Ingresos</TableHead>
                <TableHead className="text-[#944917] font-bold px-3 py-3 text-right">(-) Materiales</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">(-) Cuota Banco</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">Flujo Neto</TableHead>
                <TableHead className="text-[#241C15] font-bold px-4 py-3 text-right">Saldo en Caja</TableHead>
                <TableHead className="text-[#1E5E3A] font-bold px-4 py-3 text-right">Liquidez Libre</TableHead>
                <TableHead className="text-[#241C15] font-bold px-3 py-3 text-center">Salud</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proyeccionMeses.map((m) => {
                const isHealthy = m.saldoFinalCaja >= totalFondosApartados
                const isWarning = m.saldoFinalCaja > 0 && m.saldoFinalCaja < totalFondosApartados
                const isDanger = m.saldoFinalCaja <= 0

                return (
                  <TableRow 
                    key={m.mesNumero}
                    className="border-[#E2D9CC]/70 hover:bg-[#FDFBF7] transition-colors text-xs"
                  >
                    <TableCell className="px-4 py-3 font-bold text-[#241C15]">
                      {m.nombreMes}
                      {m.ingresosExtras > 0 && (
                        <span className="block text-[10px] text-[#1E5E3A] font-medium">
                          📥 Cobro Saldos Pendientes (+{formatCurrency(m.ingresosExtras)})
                        </span>
                      )}
                    </TableCell>

                    <TableCell className="px-3 py-3 text-center font-mono font-bold text-[#241C15]">
                      {m.pedidosEstimados}
                    </TableCell>

                    <TableCell className="px-3 py-3 text-right font-mono text-[#75695D]">
                      {formatCurrency(m.saldoInicial)}
                    </TableCell>

                    <TableCell className="px-3 py-3 text-right font-mono text-[#1E5E3A] font-bold">
                      +{formatCurrency(m.totalIngresos)}
                    </TableCell>

                    <TableCell className="px-3 py-3 text-right font-mono text-[#944917]">
                      -{formatCurrency(m.costoMateriales)}
                    </TableCell>

                    <TableCell className="px-3 py-3 text-right font-mono text-[#75695D]">
                      -{formatCurrency(m.cuotaBanco)}
                    </TableCell>

                    <TableCell className="px-3 py-3 text-right font-mono font-bold">
                      <span className={m.flujoNeto >= 0 ? 'text-[#1E5E3A]' : 'text-[#A34335]'}>
                        {m.flujoNeto >= 0 ? '+' : ''}{formatCurrency(m.flujoNeto)}
                      </span>
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right font-mono font-extrabold text-[#241C15]">
                      {formatCurrency(m.saldoFinalCaja)}
                    </TableCell>

                    <TableCell className="px-4 py-3 text-right font-mono font-bold text-[#1E5E3A]">
                      {formatCurrency(m.liquidezLibreProyectada)}
                    </TableCell>

                    <TableCell className="px-3 py-3 text-center">
                      {isHealthy ? (
                        <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold">
                          Óptimo
                        </Badge>
                      ) : isWarning ? (
                        <Badge variant="outline" className="bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B] text-[10px] font-bold">
                          Alerta
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-[#FDF2F0] text-[#A34335] border-[#F0BCB4] text-[10px] font-bold">
                          Déficit
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      </div>
    </div>
  )
}
