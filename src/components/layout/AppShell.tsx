'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Menu } from 'lucide-react'
import { Sidebar } from '@/components/layout/Sidebar'
import { useBusiness } from '@/context/BusinessContext'

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()
  const { config, is3D } = useBusiness()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Get current page name for mobile topbar
  const getPageTitle = () => {
    if (pathname === '/') return 'Dashboard General'
    if (pathname.startsWith('/taller')) return 'Taller de Producción'
    if (pathname.startsWith('/pedidos')) return 'Gestión de Pedidos'
    if (pathname.startsWith('/historico-mensual')) return 'Histórico Mensual'
    if (pathname.startsWith('/ventas')) return 'Ventas y Pedidos'
    if (pathname === '/catalogo/inventario' || pathname.startsWith('/inventario')) return 'Inventario de Filamentos'
    if (pathname === '/finanzas/flujo-caja') return 'Flujo de Caja'
    if (pathname === '/finanzas/ingresos') return 'Ingresos'
    if (pathname === '/finanzas/egresos') return 'Registro de Egresos'
    if (pathname === '/finanzas/tags') return 'Tags & Categorías'
    if (pathname === '/catalogo/categorias') return 'Categorías'
    if (pathname.startsWith('/catalogo')) return is3D ? 'Catálogo de Modelos' : 'Catálogo de Juegos'
    if (pathname === '/finanzas/proyecciones') return 'Presupuesto & Proyecciones'
    if (pathname === '/finanzas/cierres') return 'Cierres de Mes'
    return config.name
  }

  return (
    <div className="flex h-[100dvh] min-h-[100dvh] w-full bg-[#F8F6F2] overflow-hidden text-[#241C15] relative">
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (>= lg)                                                   */}
      {/* ========================================================================= */}
      <div className="hidden lg:flex h-full w-64 flex-shrink-0 z-30 shadow-xs">
        <Sidebar isMobile={false} />
      </div>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER / SHEET (< lg)                                              */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop Overlay */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
          />

          {/* Slide-in Drawer Sidebar */}
          <div className="relative flex w-72 max-w-[85vw] h-full z-50 animate-in slide-in-from-left duration-250 shadow-2xl">
            <Sidebar isMobile={true} onClose={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN VIEWPORT CONTAINER (TOPBAR + SCROLLABLE MAIN CONTENT)                */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
        {/* Mobile / Tablet Topbar (< lg) */}
        <header className="flex lg:hidden h-14 items-center justify-between px-3.5 sm:px-4 border-b border-[#E2D9CC] bg-[#FFFFFF] shadow-2xs flex-shrink-0 z-20">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-1 rounded-xl text-[#241C15] hover:bg-[#F4EFEA] border border-[#E2D9CC] transition-colors cursor-pointer flex items-center justify-center shadow-2xs shrink-0"
              aria-label="Abrir Menú Lateral"
            >
              <Menu className="h-5 w-5 text-[#241C15]" />
            </button>
            <span className="font-black text-sm text-[#241C15] truncate">
              {getPageTitle()}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div
              className={`h-8 px-2 rounded-xl flex items-center justify-center font-bold text-xs shadow-2xs ${
                is3D
                  ? 'bg-amber-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {config.id}
            </div>
          </div>
        </header>

        {/* Scrollable Main Content (Strictly Mobile-First & Overflow protected) */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-[#F8F6F2] p-3 sm:p-4 lg:p-5 pb-12 sm:pb-8 text-[#241C15] overscroll-y-contain">
          <div className="mx-auto max-w-7xl w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
