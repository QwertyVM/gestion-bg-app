'use client'

import React, { useState } from 'react'
import {
  CuponDescuentoItem,
  createCuponTienda,
  updateCuponTienda,
  deleteCuponTienda,
  toggleCuponTienda,
} from '@/actions/tienda'
import { TipoNegocio } from '@/lib/business'
import {
  Plus,
  Ticket,
  Percent,
  DollarSign,
  Copy,
  Check,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sparkles,
  Calendar,
  X,
  Layers,
  Flame,
} from 'lucide-react'
import { toast } from 'sonner'

interface TabOfertasCuponesProps {
  negocio: TipoNegocio
  cupones: CuponDescuentoItem[]
  onRefresh: () => void
}

export function TabOfertasCupones({ negocio, cupones, onRefresh }: TabOfertasCuponesProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCupon, setEditingCupon] = useState<CuponDescuentoItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Form State
  const [codigo, setCodigo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [tipo, setTipo] = useState<'PORCENTAJE' | 'MONTO_FIJO'>('PORCENTAJE')
  const [valor, setValor] = useState(10)
  const [montoMinimo, setMontoMinimo] = useState(0)
  const [usosMaximos, setUsosMaximos] = useState<number | ''>('')
  const [fechaFin, setFechaFin] = useState('')

  const handleOpenCreate = () => {
    setEditingCupon(null)
    setCodigo(negocio === '3D' ? 'NOVA3D10' : 'NOVABG10')
    setDescripcion('Descuento de bienvenida por inauguración de la tienda web')
    setTipo('PORCENTAJE')
    setValor(10)
    setMontoMinimo(50)
    setUsosMaximos('')
    setFechaFin('')
    setModalOpen(true)
  }

  const handleOpenEdit = (c: CuponDescuentoItem) => {
    setEditingCupon(c)
    setCodigo(c.codigo)
    setDescripcion(c.descripcion || '')
    setTipo(c.tipo)
    setValor(c.valor)
    setMontoMinimo(c.montoMinimo || 0)
    setUsosMaximos(c.usosMaximos !== null ? c.usosMaximos : '')
    setFechaFin(c.fechaFin ? c.fechaFin.split('T')[0] : '')
    setModalOpen(true)
  }

  const handleCopyCode = (codigo: string, id: string) => {
    navigator.clipboard.writeText(codigo)
    setCopiedId(id)
    toast.success(`Código "${codigo}" copiado al portapapeles`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleToggleActive = async (id: string) => {
    try {
      await toggleCuponTienda(id)
      toast.success('Estado del cupón actualizado')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar cupón')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este cupón de descuento?')) return
    try {
      await deleteCuponTienda(id)
      toast.success('Cupón eliminado correctamente')
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar cupón')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codigo.trim()) {
      toast.error('El código del cupón es obligatorio')
      return
    }
    if (valor <= 0) {
      toast.error('El valor de descuento debe ser mayor a 0')
      return
    }

    setIsSubmitting(true)
    try {
      if (editingCupon) {
        await updateCuponTienda(editingCupon.id, {
          codigo,
          descripcion,
          tipo,
          valor,
          montoMinimo,
          usosMaximos: usosMaximos === '' ? null : Number(usosMaximos),
          fechaFin: fechaFin ? new Date(fechaFin).toISOString() : null,
        })
        toast.success('Cupón actualizado correctamente')
      } else {
        await createCuponTienda({
          negocio,
          codigo,
          descripcion,
          tipo,
          valor,
          montoMinimo,
          usosMaximos: usosMaximos === '' ? null : Number(usosMaximos),
          fechaFin: fechaFin ? new Date(fechaFin).toISOString() : null,
          activo: true,
        })
        toast.success('Cupón creado exitosamente')
      }
      setModalOpen(false)
      onRefresh()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar cupón')
    } finally {
      setIsSubmitting(false)
    }
  }

  const cuponesActivos = cupones.filter((c) => c.activo).length

  return (
    <div className="space-y-6">
      {/* Header Stats & Action */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2D9CC] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-[#75695D] font-medium">Cupones Registrados</p>
            <p className="text-xl sm:text-2xl font-black text-[#241C15] mt-1">{cupones.length}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Ticket className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2D9CC] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs text-[#75695D] font-medium">Cupones Activos en Tienda</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{cuponesActivos}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2D9CC] shadow-xs flex items-center justify-center">
          <button
            onClick={handleOpenCreate}
            className="w-full h-full py-3 px-4 rounded-xl bg-[#241C15] hover:bg-[#3D3025] text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Cupón de Descuento</span>
          </button>
        </div>
      </div>

      {/* Coupons List */}
      <div className="bg-white rounded-2xl border border-[#E2D9CC] shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E2D9CC] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#241C15]">
              Cupones de Descuento Activos & Campañas ({negocio})
            </h3>
            <p className="text-xs text-[#75695D]">
              Los clientes podrán ingresar estos códigos en el carrito y checkout de la tienda web.
            </p>
          </div>
        </div>

        {cupones.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center mx-auto border border-amber-200">
              <Ticket className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-[#241C15]">No hay cupones creados para {negocio}</h4>
            <p className="text-xs text-[#75695D] max-w-sm mx-auto">
              Crea cupones como NOVABG10 o ENVIOGRATIS para incentivar las compras en tu tienda web.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-[#241C15] text-white text-xs font-bold hover:bg-[#3D3025] cursor-pointer"
            >
              Crear Primer Cupón
            </button>
          </div>
        ) : (
          <div className="divide-y divide-[#E2D9CC]">
            {cupones.map((c) => (
              <div
                key={c.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  c.activo ? 'hover:bg-[#FAF7F4]' : 'bg-gray-50/70 opacity-75'
                }`}
              >
                {/* Left info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border ${
                      c.tipo === 'PORCENTAJE'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {c.tipo === 'PORCENTAJE' ? `${c.valor}%` : `S/${c.valor}`}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-black text-sm text-[#241C15] tracking-wider bg-[#F8F6F2] px-2.5 py-0.5 rounded-lg border border-[#E2D9CC]">
                        {c.codigo}
                      </span>

                      <button
                        onClick={() => handleCopyCode(c.codigo, c.id)}
                        className="text-[11px] text-[#75695D] hover:text-[#241C15] p-1 rounded hover:bg-[#EFE5D8] transition-colors cursor-pointer"
                        title="Copiar código"
                      >
                        {copiedId === c.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          c.activo
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-gray-100 text-gray-500 border-gray-200'
                        }`}
                      >
                        {c.activo ? 'ACTIVO EN WEB' : 'INACTIVO'}
                      </span>
                    </div>

                    {c.descripcion && (
                      <p className="text-xs text-[#75695D] leading-snug">{c.descripcion}</p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-[#75695D] pt-0.5 flex-wrap">
                      <span>
                        Mínimo:{' '}
                        <strong>{c.montoMinimo > 0 ? `S/ ${c.montoMinimo}` : 'Sin mínimo'}</strong>
                      </span>
                      <span>•</span>
                      <span>
                        Usos: <strong>{c.usosActuales}</strong>
                        {c.usosMaximos ? ` / ${c.usosMaximos} máx` : ' (ilimitado)'}
                      </span>
                      {c.fechaFin && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#75695D]" />
                            <span>Vence: {c.fechaFin.split('T')[0]}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(c.id)}
                    className={`p-2 rounded-xl border transition-colors cursor-pointer text-xs flex items-center gap-1.5 font-bold ${
                      c.activo
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'
                        : 'text-gray-600 bg-gray-100 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {c.activo ? (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Pausar</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Activar</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(c)}
                    className="p-2 rounded-xl text-[#241C15] bg-[#F8F6F2] hover:bg-[#EFE5D8] border border-[#E2D9CC] transition-colors cursor-pointer"
                    title="Editar Cupón"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="p-2 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
                    title="Eliminar Cupón"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E2D9CC] w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 sm:p-5 border-b border-[#E2D9CC] flex items-center justify-between bg-[#F8F6F2]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Ticket className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-[#241C15]">
                  {editingCupon ? 'Editar Cupón de Descuento' : 'Crear Cupón de Descuento'} ({negocio})
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              <div className="space-y-1">
                <label className="block font-bold text-[#241C15]">Código del Cupón (Ej: NOVABG15)</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                  placeholder="Ej: NOVABG10"
                  className="w-full text-xs font-mono font-bold tracking-wider px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15] uppercase"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#241C15]">Descripción o Motivo</label>
                <input
                  type="text"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Ej: Descuento exclusivo para nuevos clientes en la tienda web"
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block font-bold text-[#241C15]">Tipo de Descuento</label>
                  <select
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value as any)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15] cursor-pointer"
                  >
                    <option value="PORCENTAJE">Porcentaje (%)</option>
                    <option value="MONTO_FIJO">Monto Fijo (S/)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#241C15]">
                    {tipo === 'PORCENTAJE' ? 'Valor (%)' : 'Monto (S/)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    step={tipo === 'PORCENTAJE' ? '1' : '0.50'}
                    value={valor}
                    onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15] font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="block font-bold text-[#241C15]">Monto Mínimo de Compra (S/)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.50"
                    value={montoMinimo}
                    onChange={(e) => setMontoMinimo(parseFloat(e.target.value) || 0)}
                    placeholder="0 = Sin mínimo"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block font-bold text-[#241C15]">Límite de Usos Máximos</label>
                  <input
                    type="number"
                    min="1"
                    value={usosMaximos}
                    onChange={(e) =>
                      setUsosMaximos(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    placeholder="En blanco = Ilimitado"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-[#241C15]">Fecha Límite de Expiración (Opcional)</label>
                <input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
                />
              </div>

              <div className="pt-3 border-t border-[#E2D9CC] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2D9CC] text-[#75695D] hover:bg-[#F8F6F2] font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#241C15] hover:bg-[#3D3025] text-white font-bold cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting
                    ? 'Guardando...'
                    : editingCupon
                    ? 'Actualizar Cupón'
                    : 'Crear Cupón'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
