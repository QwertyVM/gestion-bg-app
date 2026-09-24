'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Building2, 
  Plus, 
  Trash2, 
  Search, 
  X, 
  CreditCard, 
  Coins, 
  Wrench, 
  ChevronLeft, 
  ChevronRight,
  User
} from 'lucide-react'
import { createInversion, deleteInversion } from '@/actions/inversiones'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { InversionItem } from './FlujoCajaClient'

interface InyeccionClientProps {
  inversiones: InversionItem[]
}

const ITEMS_PER_PAGE = 5

export function InyeccionClient({ inversiones }: InyeccionClientProps) {
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<'TODOS' | 'APORTE_CAPITAL' | 'ACTIVO_FIJO'>('TODOS')
  const [openModal, setOpenModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Form states
  const [formPersona, setFormPersona] = useState('Víctor')
  const [formCategoria, setFormCategoria] = useState<'APORTE_CAPITAL' | 'ACTIVO_FIJO'>('ACTIVO_FIJO')
  const [formConcepto, setFormConcepto] = useState('')
  const [formCantidad, setFormCantidad] = useState('1')
  const [formCostoUnitario, setFormCostoUnitario] = useState('')
  const [formCostoEnvio, setFormCostoEnvio] = useState('')
  const [formCuotas, setFormCuotas] = useState('')

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

  // Filter only inyecciones and activos fijos
  const inyecciones = useMemo(() => {
    return inversiones.filter(i => i.categoria === 'APORTE_CAPITAL' || i.categoria === 'ACTIVO_FIJO')
  }, [inversiones])

  // KPIs
  const totalAportesCapital = useMemo(() => {
    return inyecciones
      .filter(i => i.categoria === 'APORTE_CAPITAL')
      .reduce((acc, i) => acc + i.costoTotal, 0)
  }, [inyecciones])

  const totalActivoFijo = useMemo(() => {
    return inyecciones
      .filter(i => i.categoria === 'ACTIVO_FIJO')
      .reduce((acc, i) => acc + i.costoTotal, 0)
  }, [inyecciones])

  const totalInvertido = totalAportesCapital + totalActivoFijo

  // Filtered & Sorted List
  const filteredInyecciones = useMemo(() => {
    return inyecciones
      .filter(inv => {
        const matchSearch = 
          inv.itemConcepto.toLowerCase().includes(search.toLowerCase()) ||
          inv.persona.toLowerCase().includes(search.toLowerCase())

        const matchTipo = tipoFilter === 'TODOS' || inv.categoria === tipoFilter

        return matchSearch && matchTipo
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [inyecciones, search, tipoFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInyecciones.length / ITEMS_PER_PAGE))
  const paginatedInyecciones = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredInyecciones.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredInyecciones, currentPage])

  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0])

  const handleOpenCreate = () => {
    setFormFecha(new Date().toISOString().split('T')[0])
    setFormPersona('Víctor')
    setFormCategoria('ACTIVO_FIJO')
    setFormConcepto('')
    setFormCantidad('1')
    setFormCostoUnitario('')
    setFormCostoEnvio('')
    setFormCuotas('')
    setOpenModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formConcepto.trim() || !formCostoUnitario) {
      toast.error('Por favor completa los campos obligatorios')
      return
    }

    setIsSubmitting(true)
    try {
      await createInversion({
        fecha: formFecha || undefined,
        persona: formPersona.trim() || 'Víctor',
        categoria: formCategoria,
        itemConcepto: formConcepto.trim(),
        cantidad: parseInt(formCantidad) || 1,
        costoUnitario: parseFloat(formCostoUnitario) || 0,
        costoEnvio: parseFloat(formCostoEnvio) || 0,
        numeroCuotas: parseInt(formCuotas) || undefined,
      })
      toast.success('Inyección / Activo Fijo registrado con éxito')
      setOpenModal(false)
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string, concepto: string) => {
    if (confirm(`¿Seguro que deseas eliminar "${concepto}"?`)) {
      try {
        await deleteInversion(id)
        toast.success('Registro eliminado')
      } catch (err) {
        toast.error('Error al eliminar')
      }
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <Building2 className="h-8 w-8 text-blue-500" />
            Inyección de Dinero & Activo Fijo
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Registro de aportes de capital, compra de maquinaria (impresoras 3D) y financiamientos del taller.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Inyección / Activo
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <Coins className="h-4 w-4" />
            Aportes de Capital
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatCurrency(totalAportesCapital)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">
            Dinero líquido inyectado al negocio
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-400 flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Activo Fijo (Maquinaria)
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatCurrency(totalActivoFijo)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">
            Impresoras 3D, secadores y equipos
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Total Invertido en Taller
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {formatCurrency(totalInvertido)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">
            Patrimonio acumulado del taller
          </span>
        </div>
      </div>

      {/* Toolbar */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl">
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input 
                placeholder="Buscar por equipo, concepto o persona..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setCurrentPage(1)
                }}
                className="pl-9 bg-zinc-900/80 border-zinc-800 text-white placeholder:text-zinc-500 text-sm"
              />
              {search && (
                <button 
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setTipoFilter('TODOS'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  tipoFilter === 'TODOS'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                Todos ({inyecciones.length})
              </button>
              <button
                onClick={() => { setTipoFilter('ACTIVO_FIJO'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  tipoFilter === 'ACTIVO_FIJO'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Wrench className="h-3 w-3" />
                Activo Fijo
              </button>
              <button
                onClick={() => { setTipoFilter('APORTE_CAPITAL'); setCurrentPage(1); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                  tipoFilter === 'APORTE_CAPITAL'
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Coins className="h-3 w-3" />
                Aportes
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="bg-zinc-950/50 border-zinc-800 backdrop-blur-xl overflow-hidden">
        <Table className="w-full">
          <TableHeader className="bg-zinc-900/70 border-b border-zinc-800">
            <TableRow className="border-zinc-800 hover:bg-transparent">
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-left">Fecha</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Tipo</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Concepto / Maquinaria</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left hidden sm:table-cell">Aportante / Persona</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center hidden md:table-cell">Financiamiento</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-right">Monto Total</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInyecciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-zinc-500">
                  No se encontraron registros de inyección de dinero o activo fijo.
                </TableCell>
              </TableRow>
            ) : (
              paginatedInyecciones.map((inv) => (
                <TableRow key={inv.id} className="border-zinc-800/60 hover:bg-zinc-900/40 transition-colors">
                  <TableCell className="px-4 py-3 text-xs text-zinc-400 font-mono whitespace-nowrap">
                    {formatDate(inv.createdAt)}
                  </TableCell>

                  <TableCell className="px-3 py-3 whitespace-nowrap">
                    {inv.categoria === 'APORTE_CAPITAL' ? (
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30 text-xs">
                        Aporte Capital
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs">
                        Activo Fijo
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="px-3 py-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-zinc-100">
                        {inv.itemConcepto}
                      </span>
                      {inv.cantidad > 1 && (
                        <span className="text-[11px] text-zinc-400">
                          {inv.cantidad} unidades x {formatCurrency(inv.costoUnitario)}
                        </span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-3 text-xs text-zinc-300 hidden sm:table-cell whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-zinc-500" />
                      {inv.persona}
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-3 text-center hidden md:table-cell whitespace-nowrap">
                    {inv.numeroCuotas ? (
                      <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-300 text-xs">
                        {inv.numeroCuotas} cuotas de {formatCurrency(inv.montoCuota || 0)}
                      </Badge>
                    ) : (
                      <span className="text-xs text-zinc-500">Contado</span>
                    )}
                  </TableCell>

                  <TableCell className="px-4 py-3 text-right font-mono font-bold text-white whitespace-nowrap">
                    {formatCurrency(inv.costoTotal)}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-center whitespace-nowrap">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(inv.id, inv.itemConcepto)}
                      className="h-8 w-8 text-zinc-500 hover:text-red-400 hover:bg-red-400/10"
                      title="Eliminar registro"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-zinc-800/80 bg-zinc-950/70 text-xs text-zinc-400">
            <div>
              Mostrando página <span className="text-white font-medium">{currentPage}</span> de <span className="text-white font-medium">{totalPages}</span> ({filteredInyecciones.length} registros)
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-all ${
                      currentPage === page
                        ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                        : 'bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
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
                className="h-8 px-2.5 border-zinc-800 bg-zinc-900 text-zinc-300 hover:text-white disabled:opacity-40"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal: Registrar Inyección / Activo */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 w-[95vw] sm:max-w-[500px] max-h-[90dvh] p-0 flex flex-col overflow-hidden z-50">
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                <DialogTitle className="text-lg font-bold">
                  Registrar Inyección / Activo Fijo
                </DialogTitle>
              </div>
              <button
                type="button"
                onClick={() => setOpenModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 touch-pan-y">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Fecha *</Label>
                  <Input 
                    type="date"
                    value={formFecha}
                    onChange={(e) => setFormFecha(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-700 text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Tipo de Registro *</Label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="ACTIVO_FIJO">Activo Fijo</option>
                    <option value="APORTE_CAPITAL">Aporte Capital</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Persona *</Label>
                  <Input 
                    value={formPersona}
                    onChange={(e) => setFormPersona(e.target.value)}
                    placeholder="Víctor"
                    required
                    className="bg-zinc-900 border-zinc-700 text-white text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-zinc-400">Concepto / Maquinaria / Inversión *</Label>
                <Input 
                  value={formConcepto}
                  onChange={(e) => setFormConcepto(e.target.value)}
                  placeholder="Ej: Impresora 3D Bambu Lab A1 Mini, Secador Sunlu..."
                  required
                  className="bg-zinc-900 border-zinc-700 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Cantidad *</Label>
                  <Input 
                    type="number"
                    min="1"
                    value={formCantidad}
                    onChange={(e) => setFormCantidad(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-700 text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Costo Unitario (S/) *</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCostoUnitario}
                    onChange={(e) => setFormCostoUnitario(e.target.value)}
                    placeholder="0.00"
                    required
                    className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Costo de Envío / Flete (S/)</Label>
                  <Input 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCostoEnvio}
                    onChange={(e) => setFormCostoEnvio(e.target.value)}
                    placeholder="0.00"
                    className="bg-zinc-900 border-zinc-700 text-white font-mono text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">N° de Cuotas (Financiamiento)</Label>
                  <Input 
                    type="number"
                    min="1"
                    value={formCuotas}
                    onChange={(e) => setFormCuotas(e.target.value)}
                    placeholder="Opcional (ej: 3, 6)"
                    className="bg-zinc-900 border-zinc-700 text-white text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 py-4 border-t border-zinc-800 flex items-center justify-end gap-3 flex-shrink-0">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpenModal(false)}
                className="text-zinc-400 hover:text-white text-xs px-4 py-2.5 rounded-xl cursor-pointer active:scale-[0.98]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Registro'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
