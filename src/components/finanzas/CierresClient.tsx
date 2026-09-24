'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  ShieldCheck, 
  Plus, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  DollarSign, 
  TrendingUp, 
  Trash2, 
  X, 
  ArrowRight, 
  Loader2, 
  Landmark, 
  Wallet,
  Sparkles,
  FileCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { CierreMesItem, DatosPreCierre, createCierreMes, deleteCierreMes } from '@/actions/cierres'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

interface CierresClientProps {
  cierres: CierreMesItem[]
  datosPreCierre: DatosPreCierre
}

const ITEMS_PER_PAGE = 5

export function CierresClient({ cierres: initialCierres, datosPreCierre }: CierresClientProps) {
  const router = useRouter()
  const [cierres, setCierres] = useState<CierreMesItem[]>(initialCierres)
  const [openModal, setOpenModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(cierres.length / ITEMS_PER_PAGE))
  const paginatedCierres = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return cierres.slice(start, start + ITEMS_PER_PAGE)
  }, [cierres, currentPage])

  // Wizard state (Paso 1: Rendimiento, Paso 2: Arqueo, Paso 3: Blindaje)
  const [pasoWizard, setPasoWizard] = useState<1 | 2 | 3>(1)

  // Form states
  const [formMes, setFormMes] = useState<number>(datosPreCierre.mes)
  const [formAnio, setFormAnio] = useState<number>(datosPreCierre.anio)
  const [formPeriodo, setFormPeriodo] = useState<string>(datosPreCierre.nombrePeriodo)

  // Arqueo Inputs
  const [formRealBCP, setFormRealBCP] = useState<string>((datosPreCierre.saldoSistemaCaja * 0.65).toFixed(2))
  const [formRealYape, setFormRealYape] = useState<string>((datosPreCierre.saldoSistemaCaja * 0.35).toFixed(2))

  // Blindaje Inputs
  const [formCuotaPrestamo, setFormCuotaPrestamo] = useState<string>(datosPreCierre.cuotaPrestamoSugerida.toString())
  const [formReservaMaquina, setFormReservaMaquina] = useState<string>(datosPreCierre.reservaSugerida.toString())
  const [formColchonEmergencia, setFormColchonEmergencia] = useState<string>(datosPreCierre.colchonSugerido.toString())
  const [formNotas, setFormNotas] = useState<string>('')

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  // Calculations for Modal
  const saldoRealBCPNum = parseFloat(formRealBCP) || 0
  const saldoRealYapeNum = parseFloat(formRealYape) || 0
  const saldoRealTotalCalculado = saldoRealBCPNum + saldoRealYapeNum
  const descuadreCalculado = saldoRealTotalCalculado - datosPreCierre.saldoSistemaCaja

  const cuotaPrestamoNum = parseFloat(formCuotaPrestamo) || 0
  const reservaMaquinaNum = parseFloat(formReservaMaquina) || 0
  const colchonEmergenciaNum = parseFloat(formColchonEmergencia) || 0
  const totalBlindadoCalculado = cuotaPrestamoNum + reservaMaquinaNum + colchonEmergenciaNum
  const liquidezLibreFinalCalculada = Math.max(0, saldoRealTotalCalculado - totalBlindadoCalculado)

  // Open Create Wizard
  const handleOpenWizard = () => {
    setPasoWizard(1)
    setFormMes(datosPreCierre.mes)
    setFormAnio(datosPreCierre.anio)
    setFormPeriodo(datosPreCierre.nombrePeriodo)
    setFormRealBCP((datosPreCierre.saldoSistemaCaja * 0.65).toFixed(2))
    setFormRealYape((datosPreCierre.saldoSistemaCaja * 0.35).toFixed(2))
    setFormCuotaPrestamo(datosPreCierre.cuotaPrestamoSugerida.toString())
    setFormReservaMaquina(datosPreCierre.reservaSugerida.toString())
    setFormColchonEmergencia(datosPreCierre.colchonSugerido.toString())
    setFormNotas('')
    setOpenModal(true)
  }

  // Handle submit Cierre
  const handleSubmitCierre = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await createCierreMes({
        mes: formMes,
        anio: formAnio,
        nombrePeriodo: formPeriodo,
        totalIngresosVentas: datosPreCierre.totalIngresosVentas,
        totalIngresosDirectos: datosPreCierre.totalIngresosDirectos,
        totalIngresos: datosPreCierre.totalIngresos,
        totalEgresosInsumos: datosPreCierre.totalEgresosInsumos,
        totalEgresosMaquinaria: datosPreCierre.totalEgresosMaquinaria,
        totalEgresosServicios: datosPreCierre.totalEgresosServicios,
        totalEgresos: datosPreCierre.totalEgresos,
        flujoNetoMes: datosPreCierre.flujoNetoMes,
        saldoSistema: datosPreCierre.saldoSistemaCaja,
        saldoRealBCP: saldoRealBCPNum,
        saldoRealYape: saldoRealYapeNum,
        saldoRealTotal: saldoRealTotalCalculado,
        descuadreCaja: descuadreCalculado,
        montoCuotaPrestamo: cuotaPrestamoNum,
        montoReservaMaquina: reservaMaquinaNum,
        montoColchonEmergencia: colchonEmergenciaNum,
        totalFondosBlindados: totalBlindadoCalculado,
        liquidezLibreFinal: liquidezLibreFinalCalculada,
        cuentasPorCobrarTraspaso: datosPreCierre.cuentasPorCobrar,
        totalPedidosMes: datosPreCierre.totalPedidos,
        notas: formNotas || undefined
      })

      toast.success(res.message)
      setOpenModal(false)
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar el cierre de mes.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete Cierre
  const handleDeleteCierre = async (id: string, periodo: string) => {
    if (confirm(`¿Deseas eliminar el registro de prueba del cierre "${periodo}"?`)) {
      try {
        await deleteCierreMes(id)
        setCierres(prev => prev.filter(c => c.id !== id))
        toast.success(`Cierre de "${periodo}" eliminado exitosamente.`)
        router.refresh()
      } catch (err: any) {
        toast.error(err?.message || 'Error al eliminar cierre.')
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-2.5 sm:gap-3">
              <div className="p-2 sm:p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm shrink-0">
                <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 stroke-[2.5]" />
              </div>
              <span>Cierres Mensuales & Arqueo</span>
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#75695D] mt-1">
            Auditoría mensual de caja, conciliación bancaria y congelación oficial de resultados por período.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
          <Link href="/finanzas/proyecciones" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full sm:w-auto border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#F4EFEA] hover:border-[#DCD3C6] cursor-pointer rounded-xl text-xs h-10 shadow-sm font-medium">
              <Landmark className="h-4 w-4 mr-1.5 text-[#A36F4C]" />
              Tesorería
            </Button>
          </Link>

          <Button 
            onClick={handleOpenWizard}
            className="flex-1 sm:flex-initial bg-[#A36F4C] hover:bg-[#8E5E3E] text-[#FFFFFF] font-bold shadow-md shadow-[#A36F4C]/20 transition-all cursor-pointer rounded-xl px-4 py-2.5 text-xs h-10 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            Nuevo Cierre
          </Button>
        </div>
      </div>

      {/* KPI Cards Minimalistas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Cierres Registrados</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#A36F4C]">
              <Calendar className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
              {cierres.length} <span className="text-xs font-normal font-sans text-[#75695D]">meses</span>
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">Historial oficial</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Estado de Cierres</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#1E5E3A]">
              <CheckCircle2 className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#1E5E3A] font-mono tabular-nums">
              {cierres.length > 0 ? 'Al día' : 'Pendiente'}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">
              {cierres.length > 0 ? `Último: ${cierres[0].nombrePeriodo}` : 'Sin cierres previos'}
            </span>
          </div>
        </div>

        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Saldo Caja Actual</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#633E20]">
              <Wallet className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#241C15] font-mono tabular-nums">
              {formatCurrency(datosPreCierre.saldoSistemaCaja)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">Saldo en sistema</span>
          </div>
        </div>

        <div className="bg-white border border-[#E2D9CC] rounded-2xl p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#6B7280]">
            <span className="text-xs font-semibold">Cuentas por Cobrar</span>
            <div className="p-1 rounded-md bg-[#FAF7F4] text-[#8C6D1F]">
              <DollarSign className="h-3.5 w-3.5" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#8C6D1F] font-mono tabular-nums">
              {formatCurrency(datosPreCierre.cuentasPorCobrar)}
            </div>
            <span className="text-xs text-[#75695D] mt-0.5 block truncate">Traspaso al nuevo mes</span>
          </div>
        </div>
      </div>

      {/* Historial de Cierres Registrados */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-[#E2D9CC] bg-[#FDFBF7]">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-[#241C15] flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-[#A36F4C]" />
                Historial Oficial de Cierres Mensuales
              </CardTitle>
              <CardDescription className="text-xs text-[#75695D] mt-0.5">
                Fotografías financieras oficiales guardadas al final de cada mes con sus arqueos y fondos blindados.
              </CardDescription>
            </div>
            <Badge variant="outline" className="bg-[#EFE5D8] border-[#D4BEA7] text-[#633E20] font-bold text-xs">
              {cierres.length} Registros
            </Badge>
          </div>
        </CardHeader>

        {cierres.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#EFE5D8] text-[#A36F4C] flex items-center justify-center mx-auto shadow-sm">
              <FileCheck className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#241C15]">No hay cierres mensuales registrados aún</h3>
            <p className="text-xs text-[#75695D] max-w-md mx-auto">
              Como Agosto está por finalizar, puedes realizar el primer cierre de prueba para conciliar saldos de cuentas y congelar el resultado del mes.
            </p>
            <Button
              onClick={handleOpenWizard}
              className="mt-2 bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold rounded-xl text-xs"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              Realizar Cierre de Agosto (Prueba)
            </Button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-[#E2D9CC]/70">
              {paginatedCierres.map((c) => (
                <div key={c.id} className="p-5 hover:bg-[#FDFBF7] transition-colors space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#633E20]">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-[#241C15]">{c.nombrePeriodo}</span>
                          <Badge variant="outline" className="bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0] text-[10px] font-bold">
                            Cierre Oficial
                          </Badge>
                        </div>
                        <span className="text-xs text-[#75695D]">
                          Cerrado el {formatDate(c.fechaCierre)} • {c.totalPedidosMes} pedidos producidos
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteCierre(c.id, c.nombrePeriodo)}
                        className="text-[#A34335] hover:text-red-700 hover:bg-red-50 text-xs rounded-xl cursor-pointer"
                        title="Eliminar registro de prueba"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-1" />
                        Eliminar Prueba
                      </Button>
                    </div>
                  </div>

                  {/* Grid de métricas del cierre */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
                      <span className="text-[11px] text-[#75695D] block font-medium">Ingresos Cobrados:</span>
                      <span className="text-sm font-bold font-mono text-[#1E5E3A]">+{formatCurrency(c.totalIngresos)}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
                      <span className="text-[11px] text-[#75695D] block font-medium">Egresos Totales:</span>
                      <span className="text-sm font-bold font-mono text-[#944917]">-{formatCurrency(c.totalEgresos)}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC]">
                      <span className="text-[11px] text-[#75695D] block font-medium">Fondos Blindados:</span>
                      <span className="text-sm font-bold font-mono text-[#633E20]">{formatCurrency(c.totalFondosBlindados)}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#F4FAF5] border border-[#B4E3C0]">
                      <span className="text-[11px] text-[#1E5E3A] block font-bold">Liquidez Libre de Cierre:</span>
                      <span className="text-sm font-extrabold font-mono text-[#1E5E3A]">{formatCurrency(c.liquidezLibreFinal)}</span>
                    </div>
                  </div>

                  {/* Conciliación bancaria */}
                  <div className="p-3 rounded-xl bg-[#F4EFEA] border border-[#DCD3C6] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#1E5E3A]" />
                      <span className="text-[#241C15] font-bold">Conciliación Bancaria:</span>
                      <span className="font-mono text-[#75695D]">BCP: {formatCurrency(c.saldoRealBCP)} | Yape: {formatCurrency(c.saldoRealYape)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`font-mono text-[10px] font-bold ${
                        c.descuadreCaja === 0 ? 'bg-[#EBF7EE] text-[#1E5E3A] border-[#B4E3C0]' : 'bg-[#FDF6E2] text-[#8C6D1F] border-[#E8D49B]'
                      }`}>
                        Descuadre: {formatCurrency(c.descuadreCaja)}
                      </Badge>
                    </div>
                  </div>

                  {c.notas && (
                    <p className="text-xs text-[#75695D] bg-[#FFFFFF] p-2.5 rounded-xl border border-[#E2D9CC]">
                      <strong>Notas del cierre:</strong> {c.notas}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="p-4 bg-[#FDFBF7] border-t border-[#E2D9CC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-[#75695D]">
                  Mostrando página <strong className="text-[#241C15]">{currentPage}</strong> de <strong className="text-[#241C15]">{totalPages}</strong> ({cierres.length} periodos)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          currentPage === page
                            ? 'bg-[#A36F4C] text-[#FFFFFF] shadow-sm'
                            : 'bg-[#FFFFFF] border border-[#E2D9CC] text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC]'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2.5 border-[#E2D9CC] bg-[#FFFFFF] text-[#241C15] hover:bg-[#EAE4DC] disabled:opacity-40 cursor-pointer"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* MODAL / WIZARD DE CIERRE DE MES (PRUEBA)                                  */}
      {/* ========================================================================= */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[620px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-2xl z-50">
          {/* Header Fijo */}
          <div className="px-5 sm:px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[#A36F4C] shadow-sm">
                <FileCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <DialogTitle className="text-base font-bold text-[#241C15]">
                    Asistente de Cierre de Mes: {formPeriodo}
                  </DialogTitle>
                  <Badge variant="outline" className="bg-[#EFE5D8] border-[#D4BEA7] text-[#633E20] text-[10px] font-bold">
                    PRUEBA
                  </Badge>
                </div>
                <DialogDescription className="text-xs text-[#75695D]">
                  Paso {pasoWizard} de 3: {pasoWizard === 1 ? 'Rendimiento' : pasoWizard === 2 ? 'Arqueo Bancario' : 'Blindaje de Fondos'}
                </DialogDescription>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setOpenModal(false)}
              className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Stepper Tabs Header Fijo */}
          <div className="grid grid-cols-3 bg-[#F4EFEA] border-b border-[#E2D9CC] text-xs font-bold text-center flex-shrink-0">
            <button
              type="button"
              onClick={() => setPasoWizard(1)}
              className={`py-2.5 transition-colors cursor-pointer border-b-2 ${
                pasoWizard === 1 ? 'border-[#A36F4C] text-[#A36F4C] bg-[#FFFFFF]' : 'border-transparent text-[#75695D]'
              }`}
            >
              1. Rendimiento
            </button>
            <button
              type="button"
              onClick={() => setPasoWizard(2)}
              className={`py-2.5 transition-colors cursor-pointer border-b-2 ${
                pasoWizard === 2 ? 'border-[#A36F4C] text-[#A36F4C] bg-[#FFFFFF]' : 'border-transparent text-[#75695D]'
              }`}
            >
              2. Arqueo Caja
            </button>
            <button
              type="button"
              onClick={() => setPasoWizard(3)}
              className={`py-2.5 transition-colors cursor-pointer border-b-2 ${
                pasoWizard === 3 ? 'border-[#A36F4C] text-[#A36F4C] bg-[#FFFFFF]' : 'border-transparent text-[#75695D]'
              }`}
            >
              3. Blindaje Final
            </button>
          </div>

          <form onSubmit={handleSubmitCierre} className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
              {/* PASO 1: RENDIMIENTO DEL PERÍODO */}
              {pasoWizard === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#241C15] block">
                      Resumen Financiero del Período ({formPeriodo}):
                    </span>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2D9CC]">
                        <span className="text-[#75695D] block">Ventas Cobradas:</span>
                        <span className="font-bold text-[#1E5E3A] font-mono">{formatCurrency(datosPreCierre.totalIngresosVentas)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2D9CC]">
                        <span className="text-[#75695D] block">Servicios Directos:</span>
                        <span className="font-bold text-[#1E5E3A] font-mono">{formatCurrency(datosPreCierre.totalIngresosDirectos)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2D9CC]">
                        <span className="text-[#75695D] block">Compras Insumos:</span>
                        <span className="font-bold text-[#944917] font-mono">-{formatCurrency(datosPreCierre.totalEgresosInsumos)}</span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#FFFFFF] border border-[#E2D9CC]">
                        <span className="text-[#75695D] block">Maquinaria & Equipos:</span>
                        <span className="font-bold text-[#944917] font-mono">-{formatCurrency(datosPreCierre.totalEgresosMaquinaria)}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[#F4FAF5] border border-[#B4E3C0] flex items-center justify-between text-xs">
                      <span className="font-bold text-[#1E5E3A]">Saldo Neto Calculado por el Sistema:</span>
                      <span className="text-base font-extrabold text-[#1E5E3A] font-mono">
                        {formatCurrency(datosPreCierre.saldoSistemaCaja)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 2: ARQUEO Y CONCILIACIÓN BANCARIA */}
              {pasoWizard === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-3.5 rounded-xl bg-[#FDF6E2] border border-[#E8D49B] text-xs text-[#8C6D1F]">
                    <strong>Arqueo de Caja:</strong> Ingresa los saldos que figuran en tus aplicaciones bancarias al cierre de mes para conciliar posibles diferencias.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#241C15]">Saldo Real en BCP (S/):</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formRealBCP}
                        onChange={(e) => setFormRealBCP(e.target.value)}
                        className="bg-[#F4EFEA] border-[#DCD3C6] font-mono font-bold text-sm h-9 rounded-xl"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-[#241C15]">Saldo Real en Yape (S/):</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formRealYape}
                        onChange={(e) => setFormRealYape(e.target.value)}
                        className="bg-[#F4EFEA] border-[#DCD3C6] font-mono font-bold text-sm h-9 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Comparación y descuadre */}
                  <div className="p-4 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-[#75695D]">Saldo Real Total Ingresado:</span>
                      <span className="font-mono font-bold text-[#241C15]">{formatCurrency(saldoRealTotalCalculado)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#75695D]">Saldo Registrado en Sistema:</span>
                      <span className="font-mono text-[#75695D]">{formatCurrency(datosPreCierre.saldoSistemaCaja)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-[#E2D9CC] font-bold">
                      <span>Descuadre / Diferencia:</span>
                      <span className={`font-mono ${descuadreCalculado === 0 ? 'text-[#1E5E3A]' : 'text-[#8C6D1F]'}`}>
                        {descuadreCalculado >= 0 ? '+' : ''}{formatCurrency(descuadreCalculado)} ({descuadreCalculado === 0 ? 'Cuadrado perfecto' : 'Ajuste registrado'})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* PASO 3: BLINDAJE FINAL Y CONFIRMACIÓN */}
              {pasoWizard === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] space-y-1">
                      <Label className="text-[11px] text-[#75695D]">Cuota Préstamo:</Label>
                      <Input
                        type="number"
                        step="10"
                        value={formCuotaPrestamo}
                        onChange={(e) => setFormCuotaPrestamo(e.target.value)}
                        className="bg-[#FFFFFF] border-[#DCD3C6] font-mono text-xs font-bold h-8 rounded-xl"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] space-y-1">
                      <Label className="text-[11px] text-[#75695D]">Reserva Máquina:</Label>
                      <Input
                        type="number"
                        step="50"
                        value={formReservaMaquina}
                        onChange={(e) => setFormReservaMaquina(e.target.value)}
                        className="bg-[#FFFFFF] border-[#DCD3C6] font-mono text-xs font-bold h-8 rounded-xl"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-[#F8F6F2] border border-[#E2D9CC] space-y-1">
                      <Label className="text-[11px] text-[#75695D]">Colchón Emergencia:</Label>
                      <Input
                        type="number"
                        step="25"
                        value={formColchonEmergencia}
                        onChange={(e) => setFormColchonEmergencia(e.target.value)}
                        className="bg-[#FFFFFF] border-[#DCD3C6] font-mono text-xs font-bold h-8 rounded-xl"
                      />
                    </div>
                  </div>

                  {/* Resumen de liquidez final */}
                  <div className="p-4 rounded-xl bg-[#F4FAF5] border-2 border-[#1E5E3A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                    <div>
                      <span className="font-extrabold text-[#1E5E3A] block text-sm">Liquidez Libre Oficial de Cierre:</span>
                      <span className="text-[11px] text-[#1E5E3A]/80">Saldo Real ({formatCurrency(saldoRealTotalCalculado)}) - Blindado ({formatCurrency(totalBlindadoCalculado)})</span>
                    </div>
                    <div className="text-2xl font-extrabold font-mono text-[#1E5E3A]">
                      {formatCurrency(liquidezLibreFinalCalculada)}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#241C15]">Notas u Observaciones del Cierre (Opcional):</Label>
                    <Input
                      placeholder="Ej: Cuota bancaria pagada el 28, preventa A2L reservada..."
                      value={formNotas}
                      onChange={(e) => setFormNotas(e.target.value)}
                      className="bg-[#F4EFEA] border-[#DCD3C6] text-xs text-[#241C15] rounded-xl"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Fijo con Navegación y Botones */}
            <div className="px-5 sm:px-6 py-4 border-t border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
              {pasoWizard > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setPasoWizard((p) => Math.max(1, p - 1) as any)}
                  className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2.5 rounded-xl cursor-pointer active:scale-[0.98]"
                >
                  Volver
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenModal(false)}
                  className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2.5 rounded-xl cursor-pointer active:scale-[0.98]"
                >
                  Cancelar
                </Button>
              )}

              {pasoWizard < 3 ? (
                <Button
                  type="button"
                  onClick={() => setPasoWizard((p) => Math.min(3, p + 1) as any)}
                  className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold rounded-xl text-xs px-5 py-2.5 cursor-pointer active:scale-[0.98]"
                >
                  Siguiente
                  <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-[#1E5E3A] hover:bg-[#16472C] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                      Guardando Cierre...
                    </>
                  ) : (
                    'Confirmar y Guardar Cierre Oficial'
                  )}
                </Button>
              )}
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
