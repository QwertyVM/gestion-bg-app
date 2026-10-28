'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Coins,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Sliders,
  Wallet,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  Users,
  Copy,
  Check,
  Target,
  PieChart,
  CheckSquare,
  Lock,
  ArrowUpRight,
  Dice5
} from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, cn } from '@/lib/utils'
import type { RentabilidadSueldosResumen, MesRentabilidadData } from '@/actions/rentabilidad'

interface RentabilidadSueldosViewProps {
  initialData: RentabilidadSueldosResumen
}

export function RentabilidadSueldosView({ initialData }: RentabilidadSueldosViewProps) {
  const [selectedMesKey, setSelectedMesKey] = useState<string>(
    initialData.mesSeleccionado.mesKey
  )

  const activeMes = useMemo<MesRentabilidadData>(() => {
    const found = initialData.meses.find((m) => m.mesKey === selectedMesKey)
    return found || initialData.mesSeleccionado
  }, [initialData.meses, initialData.mesSeleccionado, selectedMesKey])

  const numSocios = activeMes.numSocios || 2

  // Simulación: Equitativo 50/50 o Individual por socio
  const [modoReparto, setModoReparto] = useState<'EQUILIBRADO' | 'INDIVIDUAL'>('EQUILIBRADO')
  const [sueldoSimulado, setSueldoSimulado] = useState<string>('250')
  const [sueldoVictor, setSueldoVictor] = useState<string>('250')
  const [sueldoSocio2, setSueldoSocio2] = useState<string>('250')

  const [copiado, setCopiado] = useState(false)

  const inputNum = Math.max(0, parseFloat(sueldoSimulado) || 0)
  const montoVictor = modoReparto === 'EQUILIBRADO' ? inputNum : Math.max(0, parseFloat(sueldoVictor) || 0)
  const montoSocio2 = modoReparto === 'EQUILIBRADO' ? inputNum : Math.max(0, parseFloat(sueldoSocio2) || 0)
  const sueldoTotalEmpresa = modoReparto === 'EQUILIBRADO' ? inputNum * numSocios : (montoVictor + montoSocio2)

  const saldoPostSueldo = activeMes.saldoAcumulado - sueldoTotalEmpresa
  const colchonRestante = saldoPostSueldo - activeMes.reservaObligaciones
  const esSueldoSeguro = sueldoTotalEmpresa > 0 && sueldoTotalEmpresa <= activeMes.capacidadSueldoSeguro
  const esSueldoAlerta = sueldoTotalEmpresa > activeMes.capacidadSueldoSeguro && sueldoTotalEmpresa <= activeMes.saldoAcumulado
  const esSueldoPeligro = sueldoTotalEmpresa > activeMes.saldoAcumulado

  const fijosMensuales = activeMes.totalObligacionesMes || 220
  const runwayDiasPostRetiro = fijosMensuales > 0 
    ? Math.max(0, Math.round((saldoPostSueldo / fijosMensuales) * 30))
    : 999

  // Punto de Equilibrio Digno para Board Games
  // Margen comercial promedio en juegos de mesa (~35% - 40%)
  const margenComercialRatio = 0.38
  const costoTotalFijoMasSueldos = fijosMensuales + sueldoTotalEmpresa
  const metaFacturacionConSueldos = margenComercialRatio > 0 ? (costoTotalFijoMasSueldos / margenComercialRatio) : 0
  const pctMetaSueldosAlcanzada = metaFacturacionConSueldos > 0 
    ? Math.min(100, Math.round((activeMes.ventasCobradas / metaFacturacionConSueldos) * 100))
    : 0
  const ventasFaltantesMeta = Math.max(0, metaFacturacionConSueldos - activeMes.ventasCobradas)
  const ticketPromedioJuego = 85 // S/ 85 por juego de mesa estándar
  const juegosFaltantesMeta = Math.ceil(ventasFaltantesMeta / ticketPromedioJuego)

  // Porcentajes para la barra de cascada
  const pctCompras = activeMes.ventasCobradas > 0
    ? Math.min(100, Math.round((activeMes.comprasDirectas / activeMes.ventasCobradas) * 100))
    : 0
  const pctOperativos = activeMes.ventasCobradas > 0
    ? Math.min(100 - pctCompras, Math.round((activeMes.gastosOperativos / activeMes.ventasCobradas) * 100))
    : 0
  const pctBlindados = activeMes.ventasCobradas > 0
    ? Math.min(100 - pctCompras - pctOperativos, Math.round((activeMes.totalBlindadosMes / activeMes.ventasCobradas) * 100))
    : 0
  const pctUtilidad = activeMes.ventasCobradas > 0
    ? Math.max(0, 100 - pctCompras - pctOperativos - pctBlindados)
    : 0

  const handleCopiarResumenSocios = () => {
    const texto = `🎲 *Resumen Financiero & Sueldos - NOVA Board Games (${activeMes.nombreMes})* 📦\n` +
      `• Ventas Cobradas en Juegos: ${formatCurrency(activeMes.ventasCobradas)}\n` +
      `• Compras de Lotes / Mercadería: -${formatCurrency(activeMes.comprasDirectas)}\n` +
      `• Gastos de Publicidad / Operación: -${formatCurrency(activeMes.gastosOperativos)}\n` +
      `• Utilidad Neta del Mes: ${activeMes.utilidadMes >= 0 ? '+' : ''}${formatCurrency(activeMes.utilidadMes)}\n` +
      `• Caja Acumulada Total en Cuenta: ${formatCurrency(activeMes.saldoAcumulado)}\n` +
      `• Reserva de Contingencia: ${formatCurrency(activeMes.reservaObligaciones)}\n\n` +
      `💰 *Propuesta de Retiro / Sueldo:*\n` +
      `• Víctor: ${formatCurrency(montoVictor)}\n` +
      `• Socio 2: ${formatCurrency(montoSocio2)}\n` +
      `• Total Retiro: ${formatCurrency(sueldoTotalEmpresa)}\n` +
      `• Saldo en Caja Post-Retiro: ${formatCurrency(saldoPostSueldo)}\n` +
      `• Pista de Supervivencia: ${runwayDiasPostRetiro} días de fijos cubiertos\n\n` +
      `Diagnóstico: ${esSueldoSeguro ? '✅ 100% Sostenible y Seguro' : esSueldoAlerta ? '⚠️ Consume parte de la Reserva' : '❌ Fondos Insuficientes'}`

    navigator.clipboard.writeText(texto)
    setCopiado(true)
    toast.success('¡Acta de socios copiada! Lista para compartir por WhatsApp.')
    setTimeout(() => setCopiado(false), 3000)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-12">
      {/* ========================================================================= */}
      {/* 1. CABECERA EJECUTIVA MINIMALISTA & SELECTOR DE MES                       */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-b border-border/40 pb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-mono tracking-wider uppercase text-muted-foreground/70 font-medium">
              Board Games · Finanzas & Socios
            </span>
            <span className="text-muted-foreground/40 text-xs">/</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted/40 text-muted-foreground border border-border/30">
              NOVA BG
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-semibold text-foreground tracking-tight">
            Rentabilidad Mensual & Asignación de Sueldos
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Auditoría de caja, margen comercial en juegos de mesa y simulador de retiros seguros para socios.
          </p>
        </div>

        {/* Acciones Rápidas: Copiar Acta & Selector de Mes */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={handleCopiarResumenSocios}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border/40 bg-card hover:bg-muted/50 text-foreground text-xs font-medium cursor-pointer transition-colors shadow-2xs"
            title="Copiar resumen ejecutivo para enviar a los socios por WhatsApp"
          >
            {copiado ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                <span>Copiar Acta para Socios</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-1.5 bg-card px-2.5 h-8 rounded-lg border border-border/40 shadow-2xs text-xs font-medium">
            <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <select
              value={selectedMesKey}
              onChange={(e) => setSelectedMesKey(e.target.value)}
              className="bg-transparent outline-none cursor-pointer pr-1 text-foreground font-semibold text-xs"
            >
              {initialData.meses.map((m) => (
                <option key={m.mesKey} value={m.mesKey} className="bg-popover text-foreground">
                  {m.nombreMes} {m.mesKey === initialData.mesSeleccionado.mesKey ? '(Actual)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EL TRÍPTICO EJECUTIVO: PANEL UNIFICADO CON HAIRLINE DIVIDERS           */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/40 rounded-2xl overflow-hidden divide-y md:divide-y-0 md:divide-x divide-border/30 grid grid-cols-1 md:grid-cols-3 shadow-2xs">
        {/* COLUMNA 1: UTILIDAD OPERATIVA DEL MES (P&L PURO) */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-3 group hover:bg-muted/10 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              1. Utilidad del Mes
            </span>
            <span className={cn(
              'text-[10px] font-mono font-medium px-1.5 py-0.5 rounded border',
              activeMes.utilidadMes >= 0
                ? 'bg-muted/40 text-emerald-600 dark:text-emerald-400 border-border/30'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            )}>
              {activeMes.margenOperativoPct}% margen
            </span>
          </div>

          <div className="pt-0.5">
            <div className={cn(
              'text-2xl sm:text-3xl font-mono font-semibold tracking-tight tabular-nums',
              activeMes.utilidadMes >= 0 ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'
            )}>
              {activeMes.utilidadMes >= 0 ? '+' : ''}
              {formatCurrency(activeMes.utilidadMes)}
            </div>
            <p className="text-[11px] text-muted-foreground/75 mt-0.5 truncate">
              Rendimiento de {activeMes.nombreMes.split(' ')[0]}
            </p>
          </div>

          {/* Micro desglose con hairline dividers */}
          <div className="pt-2 border-t border-border/20 space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Ventas Cobradas:</span>
              <span className="font-mono font-medium text-foreground tabular-nums">
                {formatCurrency(activeMes.ventasCobradas)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>(-) Lotes de Juegos / Mercadería:</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                -{formatCurrency(activeMes.comprasDirectas)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>(-) Pauta Publicitaria / Envíos:</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                -{formatCurrency(activeMes.gastosOperativos)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>(-) Gastos Blindados / ITF:</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                -{formatCurrency(activeMes.totalBlindadosMes)}
              </span>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: LIQUIDEZ ACUMULADA EN CUENTA (CARRY-OVER) */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-3 group hover:bg-muted/10 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-muted-foreground" />
              2. Caja Total Acumulada
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/70 px-1.5 py-0.5 rounded bg-muted/40 border border-border/30">
              Efectivo Real
            </span>
          </div>

          <div className="pt-0.5">
            <div className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight text-foreground tabular-nums">
              {formatCurrency(activeMes.saldoAcumulado)}
            </div>
            <p className="text-[11px] text-muted-foreground/75 mt-0.5 truncate">
              Saldo bancario consolidado al cierre del período
            </p>
          </div>

          <div className="pt-2 border-t border-border/20 space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Saldo Inicial (Arrastre anterior):</span>
              <span className="font-mono tabular-nums text-foreground">
                {formatCurrency(activeMes.saldoInicial)}
              </span>
            </div>
            {activeMes.inyeccionCapital > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>(+) Inyección / Préstamo Capital:</span>
                <span className="font-mono tabular-nums text-foreground">
                  +{formatCurrency(activeMes.inyeccionCapital)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-muted-foreground">
              <span>(+) Flujo Operativo del Mes:</span>
              <span className="font-mono tabular-nums text-foreground">
                {activeMes.utilidadMes >= 0 ? '+' : ''}{formatCurrency(activeMes.utilidadMes)}
              </span>
            </div>
            {activeMes.activosFijosCapex > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>(-) Mobiliario / Activos:</span>
                <span className="font-mono tabular-nums text-muted-foreground">
                  -{formatCurrency(activeMes.activosFijosCapex)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA 3: CAPACIDAD REAL DE SUELDO SEGURO */}
        <div className="p-4 sm:p-5 flex flex-col justify-between gap-3 group hover:bg-muted/10 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/80 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground" />
              3. Capacidad de Sueldo Seguro
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/80 px-1.5 py-0.5 rounded bg-muted/40 border border-border/30">
              {numSocios} socios
            </span>
          </div>

          <div className="pt-0.5">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-mono font-semibold tracking-tight text-foreground tabular-nums">
                {formatCurrency(activeMes.capacidadSueldoPorSocio || activeMes.capacidadSueldoSeguro / numSocios)}
              </span>
              <span className="text-xs font-mono text-muted-foreground/70 uppercase">
                c/u por socio
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground/75 mt-0.5 truncate">
              Total seguro para ambos: <strong className="font-mono text-foreground font-semibold">{formatCurrency(activeMes.capacidadSueldoSeguro)}</strong>
            </p>
          </div>

          <div className="pt-2 border-t border-border/20 space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>Reserva de Fijos & Reposición:</span>
              <span className="font-mono tabular-nums text-foreground">
                {formatCurrency(activeMes.reservaObligaciones)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Cuota / Publicidad provisionada:</span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {formatCurrency(activeMes.compromisosPendientes)}
              </span>
            </div>
            <div className="flex justify-between text-muted-foreground pt-1 border-t border-border/20">
              <span>Diagnóstico de Retiro:</span>
              <span className="font-mono font-medium text-foreground text-[11px]">
                {activeMes.estadoDiagnostico}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. SIMULADOR DINÁMICO DE RETIRO DE SOCIOS (VÍCTOR & SOCIO 2)              */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/40 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/30">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                Simulador Dinámico de Asignación de Sueldos ({numSocios} Socios)
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Proyecta el impacto en la liquidez y días de supervivencia (runway) antes de realizar transferencias personales.
            </p>
          </div>

          {/* Toggle de Modo: 50/50 vs Individual */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-muted/40 border border-border/40 text-xs shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setModoReparto('EQUILIBRADO')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
                modoReparto === 'EQUILIBRADO'
                  ? 'bg-card text-foreground font-semibold border border-border/40 shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Reparto 50/50
            </button>
            <button
              type="button"
              onClick={() => setModoReparto('INDIVIDUAL')}
              className={cn(
                'px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer',
                modoReparto === 'INDIVIDUAL'
                  ? 'bg-card text-foreground font-semibold border border-border/40 shadow-2xs'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              Asignación Individual
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Lado Izquierdo: Inputs de Sueldo */}
          <div className="lg:col-span-5 space-y-3">
            {modoReparto === 'EQUILIBRADO' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">Sueldo por Socio (c/u):</span>
                  <span className="font-mono text-muted-foreground">Total: {formatCurrency(sueldoTotalEmpresa)}</span>
                </div>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-muted-foreground">
                    S/
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={sueldoSimulado}
                    onChange={(e) => setSueldoSimulado(e.target.value)}
                    className="w-full pl-8 pr-3 h-9 rounded-lg border border-border/40 bg-muted/20 text-foreground font-mono text-sm font-semibold outline-none focus:border-border transition-colors"
                    placeholder="250.00"
                  />
                </div>

                {/* Presets rápidos */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {[150, 200, 250, Math.floor(activeMes.capacidadSueldoPorSocio || activeMes.capacidadSueldoSeguro / numSocios)]
                    .filter((v, idx, arr) => v > 0 && arr.indexOf(v) === idx)
                    .map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setSueldoSimulado(String(val))}
                        className="px-2 py-0.5 rounded text-[10px] font-mono font-medium border border-border/30 bg-muted/30 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                      >
                        S/ {val} c/u
                      </button>
                    ))}
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Socio 1: Víctor */}
                <div className="p-2.5 rounded-xl border border-border/30 bg-muted/15 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Víctor (Gestión & Operaciones)
                    </span>
                    <span className="font-mono font-semibold text-foreground tabular-nums">
                      {formatCurrency(montoVictor)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={sueldoVictor}
                    onChange={(e) => setSueldoVictor(e.target.value)}
                    className="w-full px-2.5 h-8 rounded-lg border border-border/30 bg-background text-foreground font-mono text-xs font-semibold outline-none focus:border-border"
                    placeholder="250.00"
                  />
                </div>

                {/* Socio 2 */}
                <div className="p-2.5 rounded-xl border border-border/30 bg-muted/15 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                      Socio 2 (Comercial / Eventos)
                    </span>
                    <span className="font-mono font-semibold text-foreground tabular-nums">
                      {formatCurrency(montoSocio2)}
                    </span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={sueldoSocio2}
                    onChange={(e) => setSueldoSocio2(e.target.value)}
                    className="w-full px-2.5 h-8 rounded-lg border border-border/30 bg-background text-foreground font-mono text-xs font-semibold outline-none focus:border-border"
                    placeholder="250.00"
                  />
                </div>

                <div className="flex justify-between items-center text-xs font-mono pt-1 text-muted-foreground">
                  <span>Total Retiro Combinado:</span>
                  <span className="font-semibold text-foreground">{formatCurrency(sueldoTotalEmpresa)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Lado Derecho: Telemetría de Impacto en Liquidez */}
          <div className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl border border-border/30 bg-muted/10 space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground/70 block">Total Retiro</span>
                <span className="font-mono text-sm font-semibold text-foreground block tabular-nums">
                  {formatCurrency(sueldoTotalEmpresa)}
                </span>
                <span className="text-[10px] text-muted-foreground/60">Víctor + Socio 2</span>
              </div>

              <div className="p-2.5 rounded-xl border border-border/30 bg-muted/10 space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground/70 block">Caja Post-Retiro</span>
                <span className={cn(
                  'font-mono text-sm font-semibold block tabular-nums',
                  saldoPostSueldo >= 0 ? 'text-foreground' : 'text-rose-600 dark:text-rose-400'
                )}>
                  {formatCurrency(saldoPostSueldo)}
                </span>
                <span className="text-[10px] text-muted-foreground/60">en cuenta bancaria</span>
              </div>

              <div className="p-2.5 rounded-xl border border-border/30 bg-muted/10 space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground/70 block">Reserva Fija</span>
                <span className={cn(
                  'font-mono text-sm font-semibold block tabular-nums',
                  colchonRestante >= 0 ? 'text-foreground' : 'text-amber-600 dark:text-amber-400'
                )}>
                  {formatCurrency(activeMes.reservaObligaciones)} {colchonRestante >= 0 ? '✓' : '⚠️'}
                </span>
                <span className="text-[10px] text-muted-foreground/60">Stock & Operación</span>
              </div>

              <div className="p-2.5 rounded-xl border border-border/30 bg-muted/10 space-y-0.5">
                <span className="text-[10px] font-mono uppercase text-muted-foreground/70 block">Pista de Caja</span>
                <span className="font-mono text-sm font-semibold text-foreground block tabular-nums">
                  {runwayDiasPostRetiro} días
                </span>
                <span className="text-[10px] text-muted-foreground/60">supervivencia</span>
              </div>
            </div>

            <div className="p-3 rounded-xl border border-border/30 bg-muted/10 text-xs text-muted-foreground leading-relaxed flex items-start gap-2.5">
              <span className={cn(
                'w-2 h-2 rounded-full mt-1 shrink-0',
                esSueldoSeguro ? 'bg-emerald-500' : esSueldoAlerta ? 'bg-amber-500' : 'bg-rose-500'
              )} />
              <div>
                {sueldoTotalEmpresa === 0 ? (
                  <span>Ingresa un monto para simular la sostenibilidad de la caja tras el retiro de ambos socios.</span>
                ) : esSueldoSeguro ? (
                  <span>
                    <strong className="text-foreground">Retiro 100% Sostenible:</strong> Asignar {formatCurrency(sueldoTotalEmpresa)} deja {formatCurrency(saldoPostSueldo)} en caja, cubriendo enteramente la reserva técnica de {formatCurrency(activeMes.reservaObligaciones)} con {runwayDiasPostRetiro} días de pista de liquidez.
                  </span>
                ) : esSueldoAlerta ? (
                  <span>
                    <strong className="text-amber-600 dark:text-amber-400">Atención (Consume Reserva):</strong> Hay saldo en cuenta ({formatCurrency(activeMes.saldoAcumulado)}), pero el retiro invade {formatCurrency(Math.abs(colchonRestante))} de la reserva necesaria para reposición de stock del próximo mes.
                  </span>
                ) : (
                  <span>
                    <strong className="text-rose-600 dark:text-rose-400">Fondos Insuficientes:</strong> El retiro propuesto ({formatCurrency(sueldoTotalEmpresa)}) supera la caja total disponible ({formatCurrency(activeMes.saldoAcumulado)}).
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PUNTO DE EQUILIBRIO DIGNO (BREAK-EVEN DE BOARD GAMES)                  */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/40 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                Punto de Equilibrio con Sueldos Dignos ({activeMes.nombreMes})
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Ventas requeridas para cubrir fijos (pauta/servicios) MÁS la compensación operativa de ambos fundadores.
            </p>
          </div>

          <div className="text-xs font-mono font-medium text-foreground">
            {pctMetaSueldosAlcanzada}% cubierto
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-2 w-full rounded-full bg-muted/30 overflow-hidden border border-border/30">
            <div
              className={cn(
                'h-full transition-all duration-500 rounded-full',
                pctMetaSueldosAlcanzada >= 100 ? 'bg-emerald-500' : 'bg-primary'
              )}
              style={{ width: `${pctMetaSueldosAlcanzada}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
            <span>Facturación Actual: <strong className="text-foreground">{formatCurrency(activeMes.ventasCobradas)}</strong></span>
            <span>Meta con Sueldos: <strong className="text-foreground">{formatCurrency(metaFacturacionConSueldos)}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
          <div className="p-3 rounded-xl border border-border/30 bg-muted/10 space-y-1">
            <div className="flex items-center justify-between font-mono">
              <span className="font-medium text-foreground">1. Equilibrio de Supervivencia:</span>
              <span className="font-semibold text-foreground">{formatCurrency(fijosMensuales)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Cubre únicamente pauta publicitaria y servicios. La tienda no genera deudas pero los fundadores trabajan gratis (S/ 0).
            </p>
          </div>

          <div className="p-3 rounded-xl border border-border/30 bg-muted/10 space-y-1">
            <div className="flex items-center justify-between font-mono">
              <span className="font-medium text-foreground">2. Equilibrio Digno (Con Sueldos):</span>
              <span className="font-semibold text-foreground">{formatCurrency(metaFacturacionConSueldos)}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {ventasFaltantesMeta === 0
                ? '¡Meta mensual superada! El volumen comercial paga todos los gastos y los sueldos íntegros de ambos socios.'
                : `Faltan ${formatCurrency(ventasFaltantesMeta)} (~${juegosFaltantesMeta} juegos de ticket promedio S/ ${ticketPromedioJuego}) para que ambos socios cobren sin recurrir al colchón de capital.`}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CHECKLIST DE SEGURIDAD PRE-RETIRO & PROFIT FIRST BOARD GAMES           */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Checklist Pre-Retiro (6 cols) */}
        <div className="lg:col-span-6 bg-card border border-border/40 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border/30">
            <CheckSquare className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Checklist de Seguridad Pre-Transferencia
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Verificaciones automáticas de prudencia antes de transferir dinero de la tienda a cuentas personales:
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/15 border border-border/25">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>1. Lotes de juegos y compras de mercadería al día</span>
              </div>
              <span className="font-mono text-xs">{formatCurrency(activeMes.comprasDirectas)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/15 border border-border/25">
              <div className="flex items-center gap-2">
                {colchonRestante >= 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span>2. Reserva fija intacta tras el retiro proyectado</span>
              </div>
              <span className="font-mono text-xs">{formatCurrency(activeMes.reservaObligaciones)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/15 border border-border/25">
              <div className="flex items-center gap-2">
                {activeMes.ventasCobradas > 0 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                )}
                <span>3. Facturación activa en el período</span>
              </div>
              <span className="font-mono text-xs">+{formatCurrency(activeMes.ventasCobradas)}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/15 border border-border/25">
              <div className="flex items-center gap-2">
                {runwayDiasPostRetiro >= 15 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                )}
                <span>4. Pista de liquidez segura (&gt; 15 días)</span>
              </div>
              <span className="font-mono text-xs">{runwayDiasPostRetiro} días</span>
            </div>
          </div>
        </div>

        {/* Regla Profit First Adaptada a Board Games (6 cols) */}
        <div className="lg:col-span-6 bg-card border border-border/40 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border/30">
            <PieChart className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              Regla de Distribución &quot;Profit First&quot; en Board Games
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Distribución teórica recomendada de cada S/ 100 cobrados por venta de juegos:
          </p>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/15 border border-border/25 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <span className="font-sans">50% Reposición de Inventario (Lotes a Distribuidoras)</span>
              </div>
              <span className="text-muted-foreground font-semibold">S/ 50</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/15 border border-border/25 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-500 shrink-0" />
                <span className="font-sans">20% Gastos Blindados, Almacén & Cuotas BCP</span>
              </div>
              <span className="text-muted-foreground font-semibold">S/ 20</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/15 border border-border/25 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                <span className="font-sans">20% Sueldos de Fundadores (Compensación Operativa)</span>
              </div>
              <span className="text-muted-foreground font-semibold">S/ 20</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-muted/15 border border-border/25 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                <span className="font-sans">10% Fondo de Oportunidad / Pre-orders / Kickstarter</span>
              </div>
              <span className="text-muted-foreground font-semibold">S/ 10</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. TABLA DE AUDITORÍA HISTÓRICA DE ARRASTRE                               */}
      {/* ========================================================================= */}
      <div className="bg-card border border-border/40 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-border/30">
          <div>
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground tracking-tight">
                Auditoría Histórica de Arrastre de Caja
              </h2>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Demostración cronológica de cómo el saldo anterior alimenta el acumulado de cada mes.
            </p>
          </div>
          <div className="text-xs font-mono text-muted-foreground">
            {initialData.meses.length} meses auditados
          </div>
        </div>

        <div className="w-full overflow-hidden">
          <div className="hidden lg:grid grid-cols-12 gap-2 px-3 py-2 bg-muted/25 rounded-lg text-[10px] font-mono uppercase tracking-wider text-muted-foreground border border-border/25 mb-1.5">
            <div className="col-span-2">Período</div>
            <div className="col-span-1 text-right">Saldo Inic.</div>
            <div className="col-span-2 text-right">Ventas Cobr.</div>
            <div className="col-span-2 text-right">Lotes / Compras</div>
            <div className="col-span-2 text-right">Operativos/Pauta</div>
            <div className="col-span-1 text-right">Utilidad</div>
            <div className="col-span-2 text-right">Caja Final</div>
          </div>

          <div className="space-y-1">
            {initialData.meses.map((m) => {
              const isSelected = m.mesKey === selectedMesKey

              return (
                <div
                  key={m.mesKey}
                  onClick={() => setSelectedMesKey(m.mesKey)}
                  className={cn(
                    'p-3 rounded-xl border transition-all cursor-pointer text-xs',
                    isSelected
                      ? 'bg-muted/40 border-border/60 shadow-2xs'
                      : 'bg-card border-border/25 hover:bg-muted/20'
                  )}
                >
                  <div className="hidden lg:grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-2 font-medium text-foreground flex items-center gap-1.5 truncate">
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isSelected ? 'bg-foreground' : 'bg-transparent')} />
                      <span className="truncate">{m.nombreMes}</span>
                    </div>

                    <div className="col-span-1 text-right font-mono text-muted-foreground tabular-nums">
                      {formatCurrency(m.saldoInicial)}
                    </div>

                    <div className="col-span-2 text-right font-mono font-medium text-foreground tabular-nums">
                      +{formatCurrency(m.ventasCobradas)}
                    </div>

                    <div className="col-span-2 text-right font-mono text-muted-foreground tabular-nums">
                      -{formatCurrency(m.comprasDirectas)}
                    </div>

                    <div className="col-span-2 text-right font-mono text-muted-foreground tabular-nums">
                      -{formatCurrency(m.gastosOperativos)}
                    </div>

                    <div className="col-span-1 text-right font-mono font-medium tabular-nums">
                      <span className={m.utilidadMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                        {m.utilidadMes >= 0 ? '+' : ''}{formatCurrency(m.utilidadMes)}
                      </span>
                    </div>

                    <div className="col-span-2 text-right font-mono font-semibold text-foreground tabular-nums">
                      {formatCurrency(m.saldoAcumulado)}
                    </div>
                  </div>

                  <div className="lg:hidden space-y-1.5">
                    <div className="flex items-center justify-between pb-1 border-b border-border/25">
                      <span className="font-semibold text-foreground text-xs">{m.nombreMes}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">{m.margenOperativoPct}% margen</span>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Ventas:</span>
                        <span className="text-foreground">+{formatCurrency(m.ventasCobradas)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Utilidad:</span>
                        <span className={m.utilidadMes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}>
                          {m.utilidadMes >= 0 ? '+' : ''}{formatCurrency(m.utilidadMes)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Compras Lotes:</span>
                        <span className="text-muted-foreground">-{formatCurrency(m.comprasDirectas)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px]">Caja Final:</span>
                        <span className="font-semibold text-foreground">{formatCurrency(m.saldoAcumulado)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
