'use client'

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, Loader2, X, Wallet, ChevronLeft, ChevronRight } from 'lucide-react'
import { deleteInversion, createInversion } from '@/actions/inversiones'
import { toast } from 'sonner'
import { CategoriaInversion } from '@prisma/client'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { DateRange, getDefaultDateRange, isDateInRange } from '@/lib/date-utils'
import { DateFilterControl } from '@/components/ui/DateFilterControl'

interface InversionesClientProps {
  inversiones: any[]
}

const ITEMS_PER_PAGE = 5

export function InversionesClient({ inversiones }: InversionesClientProps) {
  const [search, setSearch] = useState('')
  const [categoriaFilter, setCategoriaFilter] = useState<string>('TODOS')
  const [dateRange, setDateRange] = useState<DateRange>(getDefaultDateRange('ESTE_MES'))
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, categoriaFilter, dateRange])

  // Form states
  const [formCategoria, setFormCategoria] = useState<CategoriaInversion>('INSUMO')

  const filtered = useMemo(() => {
    return inversiones
      .filter(inv => {
        const matchDate = isDateInRange(inv.createdAt, dateRange.from, dateRange.to)
        if (!matchDate) return false

        const matchSearch = inv.itemConcepto.toLowerCase().includes(search.toLowerCase()) 
          || (inv.especificacionColor && inv.especificacionColor.toLowerCase().includes(search.toLowerCase()))
          || (inv.persona && inv.persona.toLowerCase().includes(search.toLowerCase()))
        const matchCat = categoriaFilter === 'TODOS' || inv.categoria === categoriaFilter
        return matchSearch && matchCat
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [inversiones, dateRange, search, categoriaFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const paginatedInversiones = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

  const formatCurrency = (val: number) => `S/ ${val.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const handleDelete = async (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este registro?')) {
      try {
        await deleteInversion(id)
        toast.success('Registro eliminado')
      } catch (e) {
        toast.error('Error al eliminar')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    const formData = new FormData(e.currentTarget)
    
    try {
      await createInversion({
        fecha: formData.get('fecha') as string || undefined,
        persona: formData.get('persona') as string,
        categoria: formCategoria,
        itemConcepto: formData.get('itemConcepto') as string,
        especificacionColor: formData.get('especificacionColor') as string || undefined,
        cantidad: Number(formData.get('cantidad')) || 1,
        costoUnitario: Number(formData.get('costoUnitario')),
        costoEnvio: Number(formData.get('costoEnvio')) || 0,
        numeroCuotas: Number(formData.get('numeroCuotas')) || undefined,
        presentacion: formData.get('presentacion') as string || undefined,
      })
      toast.success('Inversión registrada exitosamente')
      setOpen(false)
    } catch (e) {
      toast.error('Error al registrar la inversión')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#241C15] flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] text-[#A36F4C] shadow-sm">
            <Wallet className="h-6 w-6 stroke-[2.5]" />
          </div>
          Inversiones & Capital
        </h1>
        
        <div className="flex flex-wrap items-center gap-2">
          <DateFilterControl
            value={dateRange}
            onChange={(newRange) => {
              setDateRange(newRange)
              setCurrentPage(1)
            }}
          />
          <Button 
            onClick={() => setOpen(true)}
            className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold rounded-xl shadow-md shadow-[#A36F4C]/20 transition-all cursor-pointer h-10 px-4 text-xs"
          >
            <Plus className="h-4 w-4 mr-1.5 stroke-[2.5]" />
            Nueva Inversión
          </Button>
        </div>
      </div>

      {/* Modal Nueva Inversión */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent showCloseButton={false} className="bg-[#FFFFFF] border border-[#E2D9CC] text-[#241C15] w-[95vw] sm:max-w-[500px] max-h-[90dvh] p-0 flex flex-col overflow-hidden shadow-2xl rounded-2xl z-50">
          <form onSubmit={handleSubmit} className="flex flex-col max-h-[90dvh] h-full overflow-hidden">
            <div className="px-5 sm:px-6 py-4 border-b border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[#A36F4C] shadow-sm">
                  <Plus className="h-5 w-5 stroke-[2.5]" />
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-[#241C15] tracking-tight">
                    Registrar Nueva Inversión
                  </DialogTitle>
                  <DialogDescription className="text-xs text-[#75695D]">
                    Compra de maquinaria, insumos o aportes de capital.
                  </DialogDescription>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-[#75695D] hover:text-[#241C15] p-1.5 rounded-lg hover:bg-[#F4EFEA] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4 touch-pan-y">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Fecha *</Label>
                  <Input 
                    type="date"
                    name="fecha"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    required
                    className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-sm rounded-xl focus:border-[#A36F4C] focus:bg-[#FFFFFF]"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Tipo de Registro</Label>
                  <select 
                    name="categoria"
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value as CategoriaInversion)}
                    className="w-full bg-[#F4EFEA] border border-[#DCD3C6] text-[#241C15] rounded-xl px-3 py-2 text-sm focus:border-[#A36F4C]"
                  >
                    <option value="INSUMO">Compra de Insumo</option>
                    <option value="ACTIVO_FIJO">Compra de Activo Fijo</option>
                    <option value="SERVICIO">Pago de Servicio</option>
                    <option value="APORTE_CAPITAL">Aporte de Capital / Préstamo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Persona / Inversionista</Label>
                  <Input name="persona" defaultValue="Víctor" required className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Concepto</Label>
                  <Input name="itemConcepto" required placeholder="Ej: Préstamo, Filamento..." className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl" />
                </div>
              </div>

              {formCategoria === 'APORTE_CAPITAL' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Monto Total (S/)</Label>
                    <Input name="costoUnitario" type="number" step="0.01" required className="bg-[#F4EFEA] border-[#DCD3C6] text-[#1E5E3A] font-mono font-bold rounded-xl" />
                    <input type="hidden" name="cantidad" value="1" />
                    <input type="hidden" name="costoEnvio" value="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Número de Cuotas</Label>
                    <Input name="numeroCuotas" type="number" min="1" placeholder="Ej: 24" className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Cant.</Label>
                      <Input name="cantidad" type="number" defaultValue="1" min="1" required className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">C. Unitario</Label>
                      <Input name="costoUnitario" type="number" step="0.01" required className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Envío Total</Label>
                      <Input name="costoEnvio" type="number" step="0.01" defaultValue="0" className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#241C15] font-bold uppercase tracking-wider">Presentación</Label>
                    <Input name="presentacion" placeholder="Ej: Bobina 1Kg, Pack 100u, etc." className="bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] rounded-xl" />
                  </div>
                </>
              )}
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-[#E2D9CC] bg-[#FDFBF7] flex items-center justify-end gap-3 flex-shrink-0">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => setOpen(false)}
                className="text-[#75695D] hover:text-[#241C15] hover:bg-[#EAE4DC] text-xs px-4 py-2.5 rounded-xl cursor-pointer active:scale-[0.98]"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-[#A36F4C] hover:bg-[#8E5E3E] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-[#A36F4C]/20 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Registrar Inversión'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Tabla */}
      <Card className="bg-[#FFFFFF] border-[#E2D9CC] shadow-md rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-[#FDFBF7] border-b border-[#E2D9CC]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <CardTitle className="text-base font-bold text-[#241C15]">Registro de Gastos y Capital</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Input 
                placeholder="Buscar concepto o persona..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-xs bg-[#F4EFEA] border-[#DCD3C6] text-[#241C15] text-xs h-9 rounded-xl focus:border-[#A36F4C]"
              />
              <select 
                className="bg-[#F4EFEA] border border-[#DCD3C6] text-[#241C15] rounded-xl px-3 py-1.5 text-xs font-medium focus:border-[#A36F4C] h-9"
                value={categoriaFilter}
                onChange={(e) => setCategoriaFilter(e.target.value)}
              >
                <option value="TODOS">Todas las Categorías</option>
                <option value={CategoriaInversion.ACTIVO_FIJO}>Activo Fijo</option>
                <option value={CategoriaInversion.INSUMO}>Insumo</option>
                <option value={CategoriaInversion.SERVICIO}>Servicio</option>
                <option value={CategoriaInversion.APORTE_CAPITAL}>Aporte de Capital</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Mobile Cards View (< md) */}
          <div className="block md:hidden divide-y divide-[#E2D9CC]/70">
            {paginatedInversiones.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#75695D]">
                No hay inversiones registradas.
              </div>
            ) : (
              paginatedInversiones.map((inv) => (
                <div key={inv.id} className="p-4 space-y-2.5 hover:bg-[#FDFBF7] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-bold text-sm text-[#241C15] block truncate">{inv.itemConcepto}</span>
                      {inv.especificacionColor && <span className="block text-xs text-[#75695D]">{inv.especificacionColor}</span>}
                      {inv.presentacion && <span className="block text-xs text-[#75695D]">{inv.presentacion}</span>}
                      {inv.numeroCuotas && <span className="block text-xs text-[#A36F4C] font-bold">{inv.numeroCuotas} Cuotas de {formatCurrency(Number(inv.montoCuota))}</span>}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className={
                        inv.categoria === 'ACTIVO_FIJO' ? 'text-[#8C6D1F] border-[#E8D49B] bg-[#FDF6E2] font-bold text-[10px]' :
                        inv.categoria === 'INSUMO' ? 'text-[#1E5E3A] border-[#B4E3C0] bg-[#EBF7EE] font-bold text-[10px]' :
                        inv.categoria === 'APORTE_CAPITAL' ? 'text-[#633E20] border-[#D4BEA7] bg-[#EFE5D8] font-bold text-[10px]' :
                        'text-[#75695D] border-[#E2D9CC] bg-[#F4EFEA] font-medium text-[10px]'
                      }>
                        {inv.categoria.replace('_', ' ')}
                      </Badge>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)} className="h-7 w-7 text-[#75695D] hover:text-[#A34335] hover:bg-red-50 rounded-lg cursor-pointer">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-[#E2D9CC]/50 text-xs">
                    <span className="flex items-center gap-1.5 text-[#75695D]">
                      <div className="w-5 h-5 rounded-full bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[9px] font-bold text-[#633E20] uppercase">
                        {inv.persona?.charAt(0) || '?'}
                      </div>
                      {inv.persona || '-'}
                    </span>

                    <div className="text-right">
                      <span className="font-mono text-[#75695D] mr-2">x{inv.cantidad}</span>
                      <span className="font-mono font-extrabold text-sm text-[#1E5E3A]">{formatCurrency(Number(inv.costoTotal))}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View (>= md) */}
          <div className="hidden md:block overflow-x-auto">
            <Table className="w-full">
              <TableHeader className="bg-[#F4EFEA] border-b border-[#E2D9CC]">
                <TableRow className="border-[#E2D9CC] hover:bg-transparent">
                  <TableHead className="text-[#241C15] font-bold px-4 py-3">Concepto</TableHead>
                  <TableHead className="text-[#241C15] font-bold px-3 py-3">Persona</TableHead>
                  <TableHead className="text-[#241C15] font-bold px-3 py-3">Categoría</TableHead>
                  <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">Cant.</TableHead>
                  <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">C. Unitario</TableHead>
                  <TableHead className="text-[#241C15] font-bold px-3 py-3 text-right">Total</TableHead>
                  <TableHead className="text-[#241C15] font-bold px-3 py-3 text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInversiones.map((inv) => (
                  <TableRow key={inv.id} className="border-[#E2D9CC]/70 hover:bg-[#FDFBF7] transition-colors">
                    <TableCell className="font-bold text-[#241C15] px-4 py-3">
                      {inv.itemConcepto}
                      {inv.especificacionColor && <span className="block text-xs text-[#75695D] font-normal">{inv.especificacionColor}</span>}
                      {inv.presentacion && <span className="block text-xs text-[#75695D] font-normal">{inv.presentacion}</span>}
                      {inv.numeroCuotas && <span className="block text-xs text-[#A36F4C] font-bold">{inv.numeroCuotas} Cuotas de {formatCurrency(Number(inv.montoCuota))}</span>}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-[#241C15]">
                      <span className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-[#EFE5D8] border border-[#D4BEA7] flex items-center justify-center text-[10px] font-bold text-[#633E20] uppercase">
                          {inv.persona?.charAt(0) || '?'}
                        </div>
                        {inv.persona || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <Badge variant="outline" className={
                        inv.categoria === 'ACTIVO_FIJO' ? 'text-[#8C6D1F] border-[#E8D49B] bg-[#FDF6E2] font-bold' :
                        inv.categoria === 'INSUMO' ? 'text-[#1E5E3A] border-[#B4E3C0] bg-[#EBF7EE] font-bold' :
                        inv.categoria === 'APORTE_CAPITAL' ? 'text-[#633E20] border-[#D4BEA7] bg-[#EFE5D8] font-bold' :
                        'text-[#75695D] border-[#E2D9CC] bg-[#F4EFEA] font-medium'
                      }>
                        {inv.categoria.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-[#241C15] font-mono px-3 py-3">{inv.cantidad}</TableCell>
                    <TableCell className="text-right text-[#75695D] font-mono px-3 py-3">{formatCurrency(Number(inv.costoUnitario))}</TableCell>
                    <TableCell className="text-right font-mono font-extrabold text-[#1E5E3A] px-3 py-3">{formatCurrency(Number(inv.costoTotal))}</TableCell>
                    <TableCell className="text-center px-3 py-3">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(inv.id)} className="h-8 w-8 text-[#75695D] hover:text-[#A34335] hover:bg-red-50 rounded-xl cursor-pointer">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="p-4 bg-[#FDFBF7] border-t border-[#E2D9CC] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-[#75695D]">
                Mostrando página <strong className="text-[#241C15]">{currentPage}</strong> de <strong className="text-[#241C15]">{totalPages}</strong> ({filtered.length} registros)
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
        </CardContent>
      </Card>
    </div>
  )
}
