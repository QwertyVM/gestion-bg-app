'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  ShoppingBag, 
  History, 
  Wallet, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Tag, 
  TrendingUp, 
  PackageSearch, 
  Layers, 
  CircleDot, 
  ChevronDown, 
  X,
  Hammer,
  Users,
  Globe,
  Store
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNavLiveMetrics } from '@/actions/nav'
import { useBusiness } from '@/context/BusinessContext'
import { BusinessSwitcher } from '@/components/layout/BusinessSwitcher'

interface SidebarProps {
  isMobile?: boolean
  onClose?: () => void
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { negocio, is3D, config } = useBusiness()

  // Dynamic live counters
  const [metrics, setMetrics] = useState<{ pedidosPendientes: number; filamentosCriticos: number; piezasTallerPendientes?: number }>({
    pedidosPendientes: 0,
    filamentosCriticos: 0,
    piezasTallerPendientes: 0
  })

  // Active section matchers
  const isDashboard = pathname === '/'
  const isPedidos = pathname.startsWith('/pedidos') || pathname.startsWith('/ventas')
  const isTaller = pathname.startsWith('/taller')
  
  const isHistorico = pathname.startsWith('/historico-mensual') || pathname.startsWith('/flujo-mensual')
  const isFinanzasSection = pathname.startsWith('/finanzas') || pathname.startsWith('/inversiones') || isHistorico
  
  const isClientes = pathname.startsWith('/clientes')
  const isTiendaWeb = pathname.startsWith('/tienda-web')
  const isTiendaSection = pathname.startsWith('/catalogo') || pathname.startsWith('/inventario') || isClientes || isTiendaWeb

  // Collapsible Accordion states
  const [tiendaOpen, setTiendaOpen] = useState(true)
  const [finanzasOpen, setFinanzasOpen] = useState(true)

  // Fetch live metrics on mount and when pathname or negocio changes
  useEffect(() => {
    let mounted = true

    const fetchMetrics = async () => {
      try {
        const data = await getNavLiveMetrics(negocio)
        if (mounted) {
          setMetrics(data)
        }
      } catch (err) {
        // fail silently
      }
    }

    fetchMetrics()
    const interval = setInterval(fetchMetrics, 25000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [pathname, negocio])

  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose()
    }
  }

  return (
    <aside className={cn(
      'flex h-full flex-col bg-[#F8F6F2] text-[#75695D] select-none transition-colors border-r border-[#E2D9CC]',
      isMobile ? 'w-full' : 'w-64'
    )}>
      {/* ========================================================================= */}
      {/* 1. ENCABEZADO (BRAND HEADER / BUSINESS SWITCHER)                         */}
      {/* ========================================================================= */}
      <div className="p-3 border-b border-[#E2D9CC] bg-[#F8F6F2] flex-shrink-0 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <BusinessSwitcher />
        </div>

        {isMobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#75695D] hover:text-[#241C15] hover:bg-[#EFE5D8] border border-[#E2D9CC] transition-colors cursor-pointer shrink-0"
            title="Cerrar Menú"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. LISTA DE NAVEGACIÓN REESTRUCTURADA                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1 bg-[#F8F6F2] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        {/* ======================================================================= */}
        {/* PRIMERA JERARQUÍA: DASHBOARD Y PEDIDOS                                  */}
        {/* ======================================================================= */}
        
        {/* DASHBOARD PRINCIPAL */}
        <Link
          href="/"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 min-h-[38px]',
            isDashboard
              ? 'bg-white text-[#241C15] shadow-xs border border-[#E2D9CC]'
              : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
          )}
        >
          <LayoutDashboard className={cn('h-4 w-4 shrink-0', isDashboard ? (is3D ? 'text-amber-600' : 'text-indigo-600') : 'text-[#75695D]')} />
          <span>Dashboard</span>
        </Link>

        {/* PEDIDOS */}
        <Link
          href="/pedidos"
          onClick={handleLinkClick}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 min-h-[38px]',
            isPedidos
              ? 'bg-white text-[#241C15] shadow-xs border border-[#E2D9CC]'
              : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
          )}
        >
          <ShoppingBag className={cn('h-4 w-4 shrink-0', isPedidos ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
          <span>Pedidos</span>

          {metrics.pedidosPendientes > 0 && (
            <span className="ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
              {metrics.pedidosPendientes}
            </span>
          )}
        </Link>

        {/* TALLER DE PRODUCCIÓN (3D EXCLUSIVO) */}
        {is3D && (
          <Link
            href="/taller"
            onClick={handleLinkClick}
            className={cn(
              'flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 min-h-[38px]',
              isTaller
                ? 'bg-white text-[#241C15] shadow-xs border border-[#E2D9CC]'
                : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
            )}
          >
            <Hammer className={cn('h-4 w-4 shrink-0', isTaller ? 'text-amber-600' : 'text-[#75695D]')} />
            <span>Taller de Producción</span>

            {(metrics.piezasTallerPendientes ?? 0) > 0 && (
              <span className="ml-auto text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-[#FAF7F4] text-[#1E5E3A] border border-[#E2D9CC]">
                {metrics.piezasTallerPendientes} pzas
              </span>
            )}
          </Link>
        )}

        {/* ======================================================================= */}
        {/* SECCIÓN TIENDA: PRODUCTOS, CATEGORÍAS, CLIENTES, CONFIGURACIÓN          */}
        {/* ======================================================================= */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setTiendaOpen(!tiendaOpen)}
            className={cn(
              'w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 cursor-pointer min-h-[36px]',
              isTiendaSection
                ? 'text-[#241C15] font-black'
                : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Store className={cn('h-4 w-4 shrink-0', isTiendaSection ? (is3D ? 'text-amber-600' : 'text-indigo-600') : 'text-[#75695D]')} />
              <span>Tienda</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-[#75695D]',
                tiendaOpen ? 'rotate-0' : '-rotate-90'
              )} 
            />
          </button>

          {tiendaOpen && (
            <div className="pl-3 space-y-0.5 my-1 border-l border-[#E2D9CC] ml-3 transition-all">
              {/* PRODUCTOS */}
              <Link
                href="/catalogo"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-[32px]',
                  pathname === '/catalogo'
                    ? 'bg-white text-[#241C15] font-bold shadow-xs border border-[#E2D9CC]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <PackageSearch className="h-3.5 w-3.5 shrink-0 text-[#75695D]" />
                <span>{is3D ? 'Productos 3D' : 'Juegos de Mesa'}</span>
              </Link>

              {/* CATEGORÍAS */}
              <Link
                href="/catalogo/categorias"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-[32px]',
                  pathname === '/catalogo/categorias'
                    ? 'bg-white text-[#241C15] font-bold shadow-xs border border-[#E2D9CC]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <Layers className="h-3.5 w-3.5 shrink-0 text-[#75695D]" />
                <span>Categorías</span>
              </Link>

              {/* CLIENTES */}
              <Link
                href="/clientes"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-[32px]',
                  isClientes
                    ? 'bg-white text-[#241C15] font-bold shadow-xs border border-[#E2D9CC]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <Users className="h-3.5 w-3.5 shrink-0 text-[#A36F4C]" />
                <span>Clientes</span>
              </Link>

              {/* CONFIGURACIÓN DE LA TIENDA WEB */}
              <Link
                href="/tienda-web"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-[32px]',
                  isTiendaWeb
                    ? 'bg-white text-[#241C15] font-bold shadow-xs border border-[#E2D9CC]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <Globe className="h-3.5 w-3.5 shrink-0 text-[#75695D]" />
                <span>Configuración</span>
                <span className="ml-auto text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  Live
                </span>
              </Link>

              {/* INVENTARIO FILAMENTOS (3D) */}
              {is3D && (
                <Link
                  href="/catalogo/inventario"
                  onClick={handleLinkClick}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-[32px]',
                    pathname === '/catalogo/inventario' || pathname === '/inventario'
                      ? 'bg-white text-[#241C15] font-bold shadow-xs border border-[#E2D9CC]'
                      : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                  )}
                >
                  <CircleDot className="h-3.5 w-3.5 shrink-0 text-[#A36F4C]" />
                  <span>Inventario Filamentos</span>

                  {metrics.filamentosCriticos > 0 && (
                    <span 
                      className="ml-auto text-[10px] font-mono font-bold text-[#854D0E] bg-[#FEF3C7] border border-[#FDE68A] px-1.5 py-0.5 rounded-md"
                      title={`${metrics.filamentosCriticos} bobinas críticas`}
                    >
                      {metrics.filamentosCriticos}
                    </span>
                  )}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ======================================================================= */}
        {/* SECCIÓN FINANZAS: CON HISTÓRICO MENSUAL DENTRO                           */}
        {/* ======================================================================= */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setFinanzasOpen(!finanzasOpen)}
            className={cn(
              'w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 cursor-pointer min-h-[36px]',
              isFinanzasSection
                ? 'text-[#241C15] font-black'
                : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Wallet className={cn('h-4 w-4 shrink-0', isFinanzasSection ? 'text-[#A36F4C]' : 'text-[#75695D]')} />
              <span>Finanzas</span>
            </div>
            <ChevronDown 
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-200 text-[#75695D]',
                finanzasOpen ? 'rotate-0' : '-rotate-90'
              )} 
            />
          </button>

          {finanzasOpen && (
            <div className="pl-3 space-y-0.5 my-1 border-l border-[#E2D9CC] ml-3 transition-all">
              {/* FLUJO DE CAJA */}
              <Link
                href="/finanzas/flujo-caja"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-[32px]',
                  pathname === '/finanzas/flujo-caja' || pathname === '/finanzas' || pathname === '/inversiones' || pathname === '/inversiones/flujo-caja'
                    ? 'bg-white text-[#241C15] font-bold shadow-xs border border-[#E2D9CC]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <DollarSign className="h-3.5 w-3.5 shrink-0 text-[#1E5E3A]" />
                <span>Flujo de Caja</span>
              </Link>

              {/* HISTÓRICO MENSUAL (AHORA DENTRO DE FINANZAS) */}
              <Link
                href="/historico-mensual"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-[32px]',
                  isHistorico
                    ? 'bg-white text-[#241C15] font-bold shadow-xs border border-[#E2D9CC]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <History className="h-3.5 w-3.5 shrink-0 text-[#A36F4C]" />
                <span>Histórico Mensual</span>
              </Link>

              {/* INGRESOS */}
              <Link
                href="/finanzas/ingresos"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-[32px]',
                  pathname === '/finanzas/ingresos'
                    ? 'bg-white text-[#241C15] font-bold shadow-xs border border-[#E2D9CC]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-[#1E5E3A]" />
                <span>Ingresos</span>
              </Link>

              {/* EGRESOS */}
              <Link
                href="/finanzas/egresos"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-[32px]',
                  pathname === '/finanzas/egresos'
                    ? 'bg-white text-[#241C15] font-bold shadow-xs border border-[#E2D9CC]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <ArrowDownLeft className="h-3.5 w-3.5 shrink-0 text-[#A36F4C]" />
                <span>Egresos</span>
              </Link>

              {/* TAGS DE GASTO */}
              <Link
                href="/finanzas/tags"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-[32px]',
                  pathname === '/finanzas/tags'
                    ? 'bg-white text-[#241C15] font-bold shadow-xs border border-[#E2D9CC]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <Tag className="h-3.5 w-3.5 shrink-0 text-[#75695D]" />
                <span>Tags de Gasto</span>
              </Link>

              {/* PROYECCIONES */}
              <Link
                href="/finanzas/proyecciones"
                onClick={handleLinkClick}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all duration-150 min-h-[32px]',
                  pathname === '/finanzas/proyecciones' || pathname === '/finanzas/caja-chica'
                    ? 'bg-white text-[#241C15] font-bold shadow-xs border border-[#E2D9CC]'
                    : 'text-[#75695D] hover:bg-[#F1ECE4] hover:text-[#241C15]'
                )}
              >
                <TrendingUp className="h-3.5 w-3.5 shrink-0 text-[#A36F4C]" />
                <span>Proyecciones & Presupuesto</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FOOTER DEL NEGOCIO                                                     */}
      {/* ========================================================================= */}
      <div className="mt-auto p-3 border-t border-[#E2D9CC] bg-[#F8F6F2] flex-shrink-0">
        <div className="rounded-xl border border-[#E2D9CC] p-2.5 flex items-center gap-2.5 bg-white shadow-xs">
          <div
            className={`h-7 w-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
              is3D
                ? 'bg-amber-600 text-white'
                : 'bg-indigo-600 text-white'
            }`}
          >
            {is3D ? '3D' : 'BG'}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-xs text-[#241C15] truncate block leading-tight">
              {config.name}
            </span>
            <span className="text-[10px] text-[#75695D] truncate block leading-tight">
              {config.badge} • Activo
            </span>
          </div>
          <div className="w-2 h-2 rounded-full bg-[#1E5E3A] shrink-0" title="En línea" />
        </div>
      </div>
    </aside>
  )
}
