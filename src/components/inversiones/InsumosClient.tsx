'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Plus, 
  Trash2, 
  Search, 
  X, 
  Layers, 
  Sparkles, 
  Scale, 
  ShoppingBag, 
  ChevronLeft, 
  ChevronRight,
  Palette
} from 'lucide-react'
import { createInversion, deleteInversion } from '@/actions/inversiones'
import { toast } from 'sonner'
import { formatDate } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { InversionItem } from './FlujoCajaClient'

interface InsumosClientProps {
  inversiones: InversionItem[]
}

const ITEMS_PER_PAGE = 5

export function InsumosClient({ inversiones }: InsumosClientProps) {
  const [search, setSearch] = useState('')
  const [openModal, setOpenModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // Form states
  const [formPersona, setFormPersona] = useState('Víctor')
  const [formCategoria, setFormCategoria] = useState<'INSUMO' | 'SERVICIO'>('INSUMO')
  const [formConcepto, setFormConcepto] = useState('')
  const [formColor, setFormColor] = useState('')
  const [formPresentacion, setFormPresentacion] = useState('1kg')
  const [formCantidad, setFormCantidad] = useState('1')
  const [formCostoUnitario, setFormCostoUnitario] = useState('')
  const [formCostoEnvio, setFormCostoEnvio] = useState('')

  const formatCurrency = (val: number) => `S/ ${val.toFixed(2)}`

  // Filter only insumos and services
  const insumos = useMemo(() => {
    return inversiones.filter(i => i.categoria === 'INSUMO' || i.categoria === 'SERVICIO')
  }, [inversiones])

  // KPIs
  const totalGastoInsumos = useMemo(() => {
    return insumos.reduce((acc, i) => acc + i.costoTotal, 0)
  }, [insumos])

  const totalBobinas = useMemo(() => {
    return insumos
      .filter(i => i.categoria === 'INSUMO')
      .reduce((acc, i) => acc + (i.cantidad || 1), 0)
  }, [insumos])

  const costoPromedioGramo = useMemo(() => {
    const conGramo = insumos.filter(i => i.costoPorGramo && i.costoPorGramo > 0)
    if (conGramo.length === 0) return 0
    const suma = conGramo.reduce((acc, i) => acc + (i.costoPorGramo || 0), 0)
    return suma / conGramo.length
  }, [insumos])

  // Filtered & Sorted List
  const filteredInsumos = useMemo(() => {
    return insumos
      .filter(inv => {
        const matchSearch = 
          inv.itemConcepto.toLowerCase().includes(search.toLowerCase()) ||
          (inv.especificacionColor && inv.especificacionColor.toLowerCase().includes(search.toLowerCase())) ||
          (inv.presentacion && inv.presentacion.toLowerCase().includes(search.toLowerCase()))

        return matchSearch
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [insumos, search])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredInsumos.length / ITEMS_PER_PAGE))
  const paginatedInsumos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filteredInsumos.slice(start, start + ITEMS_PER_PAGE)
  }, [filteredInsumos, currentPage])

  // Dynamic preview of cost per gram in form
  const previewCostoGramo = useMemo(() => {
    const cant = parseInt(formCantidad) || 1
    const costUnit = parseFloat(formCostoUnitario) || 0
    const costEnvio = parseFloat(formCostoEnvio) || 0
    const total = (cant * costUnit) + costEnvio

    if (total <= 0) return null

    const match = formPresentacion.match(/(\d+)\s*(kg|g)/i)
    if (match) {
      const amount = parseFloat(match[1])
      const unit = match[2].toLowerCase()
      const totalGrams = (unit === 'kg' ? amount * 1000 : amount) * cant
      if (totalGrams > 0) {
        return total / totalGrams
      }
    }
    return null
  }, [formCantidad, formCostoUnitario, formCostoEnvio, formPresentacion])

  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0])

  const handleOpenCreate = () => {
    setFormFecha(new Date().toISOString().split('T')[0])
    setFormPersona('Víctor')
    setFormCategoria('INSUMO')
    setFormConcepto('')
    setFormColor('')
    setFormPresentacion('1kg')
    setFormCantidad('1')
    setFormCostoUnitario('')
    setFormCostoEnvio('')
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
        especificacionColor: formColor.trim() || undefined,
        presentacion: formPresentacion.trim() || undefined,
        cantidad: parseInt(formCantidad) || 1,
        costoUnitario: parseFloat(formCostoUnitario) || 0,
        costoEnvio: parseFloat(formCostoEnvio) || 0,
      })
      toast.success('Insumo registrado con éxito')
      setOpenModal(false)
    } catch (err: any) {
      toast.error(err?.message || 'Error al registrar insumo')
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
            <ShoppingBag className="h-8 w-8 text-amber-500" />
            Compra de Insumos & Materiales
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Registro de filamentos (PLA, PETG, ABS), resinas y repuestos con cálculo de costo por gramo.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate}
          className="bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
        >
          <Plus className="h-4 w-4 mr-2" />
          Registrar Insumo / Filamento
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4" />
            Total Invertido en Insumos
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {formatCurrency(totalGastoInsumos)}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">
            Filamentos, resinas y repuestos
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Bobinas / Insumos Comprados
          </span>
          <div className="text-2xl font-extrabold text-white font-mono mt-1">
            {totalBobinas} unidades
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">
            Volumen de material para producción
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-4 backdrop-blur-md">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Costo Promedio por Gramo
          </span>
          <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
            {costoPromedioGramo > 0 ? `S/ ${costoPromedioGramo.toFixed(4)}/g` : 'S/ 0.0000/g'}
          </div>
          <span className="text-xs text-zinc-500 mt-0.5 block">
            Base para costeo de modelos 3D
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
                placeholder="Buscar por material, marca o color..."
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

            <div className="text-xs text-zinc-400">
              Total: <span className="text-white font-medium">{filteredInsumos.length}</span> registros de insumos
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
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Material / Insumo</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-left">Color / Esp.</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center">Presentación</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right">Costo Unit.</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-right">Costo / Gramo</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-4 py-3 text-right">Total</TableHead>
              <TableHead className="text-zinc-400 font-semibold px-3 py-3 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInsumos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-zinc-500">
                  No se encontraron compras de insumos registradas.
                </TableCell>
              </TableRow>
            ) : (
              paginatedInsumos.map((inv) => (
                <TableRow key={inv.id} className="border-zinc-800/60 hover:bg-zinc-900/40 transition-colors">
                  <TableCell className="px-4 py-3 text-xs text-zinc-400 font-mono whitespace-nowrap">
                    {formatDate(inv.createdAt)}
                  </TableCell>

                  <TableCell className="px-3 py-3 font-medium text-zinc-100">
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold">{inv.itemConcepto}</span>
                      {inv.cantidad > 1 && (
                        <span className="text-[11px] text-zinc-400">{inv.cantidad} unidades</span>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="px-3 py-3 whitespace-nowrap">
                    {inv.especificacionColor ? (
                      <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-200 text-xs gap-1 inline-flex items-center">
                        <Palette className="h-3 w-3 text-amber-400" />
                        {inv.especificacionColor}
                      </Badge>
                    ) : (
                      <span className="text-xs text-zinc-500">-</span>
                    )}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-center whitespace-nowrap">
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-300 border-amber-500/20 text-xs">
                      {inv.presentacion || '1 kg'}
                    </Badge>
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono text-zinc-300 whitespace-nowrap">
                    {formatCurrency(inv.costoUnitario)}
                    {inv.costoEnvio && inv.costoEnvio > 0 ? (
                      <span className="block text-[10px] text-zinc-500">+ {formatCurrency(inv.costoEnvio)} envío</span>
                    ) : null}
                  </TableCell>

                  <TableCell className="px-3 py-3 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap">
                    {inv.costoPorGramo ? `S/ ${inv.costoPorGramo.toFixed(4)}/g` : '-'}
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
                      title="Eliminar insumo"
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
              Mostrando página <span className="text-white font-medium">{currentPage}</span> de <span className="text-white font-medium">{totalPages}</span> ({filteredInsumos.length} insumos)
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
                        ? 'bg-amber-600 text-white font-bold shadow-md shadow-amber-500/20'
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

      {/* Modal: Registrar Insumo */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="bg-zinc-950 border border-zinc-800 text-zinc-100 w-[95vw] sm:max-w-[520px] max-h-[90dvh] p-0 flex flex-col overflow-hidden z-50">
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="p-5 sm:p-6 pb-4 border-b border-zinc-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-500" />
                <DialogTitle className="text-lg font-bold">
                  Registrar Compra de Insumo
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
                  <Label className="text-xs text-zinc-400">Tipo de Insumo *</Label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-500"
                  >
                    <option value="INSUMO">Insumo / Filamento</option>
                    <option value="SERVICIO">Servicio / Mant.</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Comprador *</Label>
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
                <Label className="text-xs text-zinc-400">Descripción / Marca / Material *</Label>
                <Input 
                  value={formConcepto}
                  onChange={(e) => setFormConcepto(e.target.value)}
                  placeholder="Ej: Filamento PLA+ Polymaker, Resina Anycubic Eco..."
                  required
                  className="bg-zinc-900 border-zinc-700 text-white text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Color / Acabado</Label>
                  <Input 
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    placeholder="Ej: Negro Mate, Azul Cobalto"
                    className="bg-zinc-900 border-zinc-700 text-white text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Presentación / Peso *</Label>
                  <Input 
                    value={formPresentacion}
                    onChange={(e) => setFormPresentacion(e.target.value)}
                    placeholder="Ej: 1kg, 1000g, 500g"
                    required
                    className="bg-zinc-900 border-zinc-700 text-white text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Cantidad *</Label>
                  <Input 
                    type="number"
                    min="1"
                    value={formCantidad}
                    onChange={(e) => setFormCantidad(e.target.value)}
                    required
                    className="bg-zinc-900 border-zinc-700 text-white text-sm font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Costo Unit. (S/) *</Label>
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

                <div className="space-y-1.5">
                  <Label className="text-xs text-zinc-400">Envío (S/)</Label>
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
              </div>

              {/* Live calculated cost per gram preview */}
              {previewCostoGramo !== null && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5 text-emerald-400" />
                    Costo estimado por gramo:
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    S/ {previewCostoGramo.toFixed(4)} / gramo
                  </span>
                </div>
              )}
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
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-5 py-2.5 rounded-xl cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? 'Guardando...' : 'Guardar Insumo'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
