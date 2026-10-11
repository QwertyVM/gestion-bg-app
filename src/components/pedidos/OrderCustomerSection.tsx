'use client'

import React, { useRef, useEffect } from 'react'
import {
  User,
  UserCheck,
  UserPlus,
  Search,
  Check,
  Phone,
  Calendar,
  AlertTriangle,
  X,
  MapPin,
  Clock,
  CreditCard
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface ClienteOption {
  id: string
  nombre: string
  dni?: string | null
  telefono?: string | null
  email?: string | null
  canalOrigen?: string | null
  canalPreferido?: string | null
  handleSocial?: string | null
  direccion?: string | null
  distrito?: string | null
}

export interface OrderCustomerSectionProps {
  clientSelectMode: 'EXISTING' | 'NEW'
  setClientSelectMode: (mode: 'EXISTING' | 'NEW') => void
  clientesList: ClienteOption[]
  selectedClientOption: ClienteOption | null
  onSelectClient: (client: ClienteOption) => void
  onClearSelectedClient: () => void
  onSwitchToNewClient: (presetName?: string) => void
  clientSearchTerm: string
  setClientSearchTerm: (term: string) => void
  isClientDropdownOpen: boolean
  setIsClientDropdownOpen: (open: boolean) => void
  filteredClientOptions: ClienteOption[]
  similarExistingClient: ClienteOption | null
  formFecha: string
  setFormFecha: (fecha: string) => void
  formCliente: string
  setFormCliente: (cliente: string) => void
  formDni: string
  setFormDni: (dni: string) => void
  formTelefono: string
  setFormTelefono: (tel: string) => void
  formCanal: string
  setFormCanal: (canal: string) => void
  formDestino: string
  setFormDestino: (dest: string) => void
  formDiaEntrega: string
  setFormDiaEntrega: (dia: string) => void
  isRegisteringClientInline?: boolean
  onRegisterClientInline?: () => void
  headerExtra?: React.ReactNode
}

export function OrderCustomerSection({
  clientSelectMode,
  setClientSelectMode,
  clientesList,
  selectedClientOption,
  onSelectClient,
  onClearSelectedClient,
  onSwitchToNewClient,
  clientSearchTerm,
  setClientSearchTerm,
  isClientDropdownOpen,
  setIsClientDropdownOpen,
  filteredClientOptions,
  similarExistingClient,
  formFecha,
  setFormFecha,
  formCliente,
  setFormCliente,
  formDni,
  setFormDni,
  formTelefono,
  setFormTelefono,
  formCanal,
  setFormCanal,
  formDestino,
  setFormDestino,
  formDiaEntrega,
  setFormDiaEntrega,
  isRegisteringClientInline = false,
  onRegisterClientInline,
  headerExtra
}: OrderCustomerSectionProps) {
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Cerrar dropdown si se hace click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsClientDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [setIsClientDropdownOpen])

  return (
    <div className="bg-card border border-border rounded-2xl p-5 mb-5 space-y-4 shadow-sm">
      {/* ========================================================================= */}
      {/* ENCABEZADO CON STEPPER BADGE Y CONTROL SEGMENTADO                         */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center">
            <span className="bg-primary/10 text-primary font-bold text-xs w-6 h-6 rounded-full inline-flex items-center justify-center mr-2 shrink-0">
              1
            </span>
            <span className="text-xs font-extrabold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-primary" />
              1. Datos del Cliente y Despacho
            </span>
          </div>
          {headerExtra}
        </div>

        {/* Control segmentado superior unificado (Tabs / Toggle Group) */}
        <div className="bg-secondary/80 p-1 rounded-xl flex gap-1 w-fit border border-border/60 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setClientSelectMode('EXISTING')
              setIsClientDropdownOpen(false)
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
              clientSelectMode === 'EXISTING'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <UserCheck className="h-3.5 w-3.5 text-primary" />
            <span>Cliente Existente</span>
            <span className="bg-secondary text-muted-foreground px-2 py-0.5 rounded-full text-[11px] font-mono font-bold border border-border/60">
              {clientesList.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchToNewClient()}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer',
              clientSelectMode === 'NEW'
                ? 'bg-card text-foreground shadow-xs font-bold'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <UserPlus className="h-3.5 w-3.5 text-primary" />
            <span>+ Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. METADATOS DE LA ORDEN: FECHA DEL PEDIDO Y CANAL DE VENTA               */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Fecha del Pedido */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-primary" />
            Fecha del Pedido *
          </Label>
          <Input
            type="date"
            required
            value={formFecha}
            onChange={(e) => setFormFecha(e.target.value)}
            className="h-10 rounded-xl border-input bg-card text-foreground text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Canal de Venta */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            Canal de Venta
          </Label>
          <select
            value={formCanal}
            onChange={(e) => setFormCanal(e.target.value)}
            className="w-full h-10 rounded-xl border border-input bg-card text-foreground text-sm font-medium px-3 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
          >
            <option value="WhatsApp">WhatsApp</option>
            <option value="Instagram">Instagram</option>
            <option value="TikTok">TikTok</option>
            <option value="Feria">Feria / Presencial</option>
            <option value="Recomendación">Recomendación</option>
            <option value="Directo">Directo / Tienda</option>
          </select>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. GESTIÓN DEL CLIENTE SEGÚN TAB ACTIVO                                   */}
      {/* ========================================================================= */}
      {clientSelectMode === 'EXISTING' ? (
        <div className="space-y-3 pt-1">
          {selectedClientOption ? (
            /* Card compacta de cliente vinculado */
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-2.5 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-500/30">
                  {selectedClientOption.nombre.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-foreground truncate">
                    {selectedClientOption.nombre}
                  </span>
                  {selectedClientOption.dni && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md bg-card border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                      <CreditCard className="h-2.5 w-2.5 text-emerald-600" />
                      DNI: {selectedClientOption.dni}
                    </span>
                  )}
                  {selectedClientOption.telefono && (
                    <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-0.5 rounded-md bg-card border border-emerald-500/30 text-emerald-800 dark:text-emerald-300">
                      <Phone className="h-2.5 w-2.5 text-emerald-600" />
                      {selectedClientOption.telefono}
                    </span>
                  )}
                  {selectedClientOption.direccion && (
                    <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-card border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 truncate max-w-[200px]">
                      <MapPin className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                      {selectedClientOption.direccion}
                    </span>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClearSelectedClient}
                className="text-xs h-8 px-3 rounded-xl border-emerald-500/40 bg-card text-foreground hover:bg-emerald-500/20 font-medium flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
              >
                <X className="h-3 w-3" />
                <span>Cambiar</span>
              </Button>
            </div>
          ) : (
            /* Buscador de clientes registrados */
            <div className="relative" ref={dropdownRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Buscar cliente registrado por nombre, teléfono o DNI..."
                value={clientSearchTerm}
                onChange={(e) => {
                  setClientSearchTerm(e.target.value)
                  setIsClientDropdownOpen(true)
                }}
                onFocus={() => setIsClientDropdownOpen(true)}
                className="pl-9 pr-9 h-10 rounded-xl border-input bg-card text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60 w-full shadow-2xs"
              />
              {clientSearchTerm && (
                <button
                  type="button"
                  onClick={() => setClientSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Popover de autocompletado flotante */}
              {isClientDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-card border border-border shadow-xl rounded-xl overflow-hidden py-1 z-50 max-h-60 overflow-y-auto divide-y divide-border/60 animate-in fade-in-50 duration-150">
                  <div className="px-3 py-1.5 bg-secondary/50 text-[11px] font-bold text-muted-foreground flex items-center justify-between border-b border-border">
                    <span>
                      {clientSearchTerm.trim()
                        ? `Resultados para "${clientSearchTerm}" (${filteredClientOptions.length})`
                        : `Clientes registrados (${clientesList.length}) - Selecciona uno:`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsClientDropdownOpen(false)}
                      className="text-xs text-muted-foreground hover:text-foreground cursor-pointer font-medium"
                    >
                      Cerrar
                    </button>
                  </div>

                  {filteredClientOptions.length > 0 ? (
                    filteredClientOptions.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onSelectClient(c)}
                        className="hover:bg-secondary/70 transition-colors cursor-pointer px-3 py-2 text-xs flex justify-between items-center group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            {c.nombre.slice(0, 1).toUpperCase()}
                          </div>
                          <div className="truncate">
                            <span className="font-bold text-xs text-foreground block truncate">
                              {c.nombre}
                            </span>
                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                              {c.dni && <span>🪪 {c.dni}</span>}
                              {c.telefono && <span>📞 {c.telefono}</span>}
                              {c.direccion && <span>📍 {c.direccion}</span>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground font-mono">
                            {c.canalOrigen || c.canalPreferido || 'Directo'}
                          </span>
                          <span className="text-xs text-primary font-bold group-hover:translate-x-0.5 transition-transform">
                            Seleccionar →
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center space-y-2">
                      <p className="text-xs text-muted-foreground">
                        No se encontró ningún cliente registrado con &quot;{clientSearchTerm}&quot;.
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => onSwitchToNewClient(clientSearchTerm)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded-xl"
                      >
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        Registrar &quot;{clientSearchTerm}&quot; como nuevo cliente
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ========================================================================= */
        /* 3. ESTADO "NUEVO CLIENTE": INPUTS EDITABLES Y LIMPIOS                     */
        /* ========================================================================= */
        <div className="space-y-3 pt-1">
          {/* Advertencia preventiva si existe cliente similar */}
          {similarExistingClient && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in-50 duration-150">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-foreground">
                  <span className="font-bold block text-amber-800 dark:text-amber-200">
                    ¡Atención! Ya existe un cliente similar registrado:
                  </span>
                  <span className="text-muted-foreground">
                    &quot;{similarExistingClient.nombre}&quot;
                    {similarExistingClient.dni ? ` (🪪 ${similarExistingClient.dni})` : ''}
                    {similarExistingClient.telefono ? ` (📞 ${similarExistingClient.telefono})` : ''}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => onSelectClient(similarExistingClient)}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs rounded-xl shrink-0 h-8 font-semibold cursor-pointer"
              >
                <Check className="h-3.5 w-3.5 mr-1" />
                Usar &quot;{similarExistingClient.nombre}&quot;
              </Button>
            </div>
          )}

          {/* Cuadrícula de 3 Columnas Limpias y Editables */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* Nombre Completo * */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <User className="h-3 w-3 text-primary" />
                Nombre Completo *
              </Label>
              <Input
                required
                placeholder="Nombre del nuevo cliente..."
                value={formCliente}
                onChange={(e) => setFormCliente(e.target.value)}
                className="h-10 rounded-xl border-input bg-card text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {/* DNI / RUC */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CreditCard className="h-3 w-3 text-primary" />
                DNI / RUC
              </Label>
              <Input
                placeholder="Ej: 71234567"
                value={formDni}
                onChange={(e) => setFormDni(e.target.value)}
                maxLength={11}
                className="h-10 rounded-xl border-input bg-card text-foreground text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>

            {/* Teléfono / WhatsApp */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Phone className="h-3 w-3 text-primary" />
                Teléfono / WhatsApp
              </Label>
              <Input
                placeholder="Ej: 987654321"
                value={formTelefono}
                onChange={(e) => setFormTelefono(e.target.value)}
                className="h-10 rounded-xl border-input bg-card text-foreground text-sm font-mono focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          {/* Opción de guardar en directorio */}
          {onRegisterClientInline && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-border/60">
              <span className="text-[11px] text-muted-foreground">
                💡 Se registrará automáticamente con el pedido o puedes guardarlo de inmediato en el directorio.
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!formCliente.trim() || isRegisteringClientInline}
                onClick={onRegisterClientInline}
                className="text-[11px] h-8 border-border text-foreground bg-card hover:bg-secondary rounded-xl cursor-pointer"
              >
                {isRegisteringClientInline ? 'Guardando...' : '💾 Guardar en Directorio'}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FILA DE DESPACHO: ENTREGA PACTADA Y DESTINO                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
        {/* Entrega Pactada */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <Clock className="h-3 w-3 text-primary" />
            Fecha / Hora Pactada de Entrega
          </Label>
          <Input
            placeholder="Ej: Sábado 18:00, Mañana en Shalom..."
            value={formDiaEntrega}
            onChange={(e) => setFormDiaEntrega(e.target.value)}
            className="h-10 rounded-xl border-input bg-card text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Destino / Dirección / Agencia */}
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <MapPin className="h-3 w-3 text-primary" />
            Destino / Dirección / Agencia
          </Label>
          <Input
            placeholder="Ej: Shalom Agencia Miraflores, Lima..."
            value={formDestino}
            onChange={(e) => setFormDestino(e.target.value)}
            className="h-10 rounded-xl border-input bg-card text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/60"
          />
        </div>
      </div>
    </div>
  )
}
