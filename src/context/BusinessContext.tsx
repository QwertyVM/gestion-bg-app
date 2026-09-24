'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { TipoNegocio, BusinessConfig, BUSINESSES, BUSINESS_COOKIE_NAME, DEFAULT_NEGOCIO } from '@/lib/business'

interface BusinessContextType {
  negocio: TipoNegocio
  config: BusinessConfig
  is3D: boolean
  isBG: boolean
  setNegocio: (nextNegocio: TipoNegocio) => void
  isPending: boolean
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined)

function getInitialNegocio(): TipoNegocio {
  return 'BG'
}

export function BusinessProvider({
  children,
  initialNegocio
}: {
  children: React.ReactNode
  initialNegocio?: TipoNegocio
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, setIsPending] = useState(false)
  const [negocio, setNegocioState] = useState<TipoNegocio>(initialNegocio || DEFAULT_NEGOCIO)

  useEffect(() => {
    const active = getInitialNegocio()
    if (active !== negocio) {
      setNegocioState(active)
    }
  }, [])

  const setNegocio = (nextNegocio: TipoNegocio) => {
    if (nextNegocio === negocio) return

    setIsPending(true)

    // Set cookie (valid for 1 year)
    document.cookie = `${BUSINESS_COOKIE_NAME}=${nextNegocio}; path=/; max-age=31536000; SameSite=Lax`
    try {
      localStorage.setItem('nova_business', nextNegocio)
    } catch {}

    setNegocioState(nextNegocio)

    if (typeof window !== 'undefined') {
      // If switching to BG and on 3D-specific routes like /taller or /inventario, redirect to orders or dashboard
      if (nextNegocio === 'BG' && (pathname?.startsWith('/taller') || pathname?.startsWith('/inventario') || pathname?.startsWith('/catalogo/inventario'))) {
        window.location.href = '/pedidos'
      } else {
        window.location.reload()
      }
    }
  }

  const config = BUSINESSES[negocio] || BUSINESSES[DEFAULT_NEGOCIO]

  return (
    <BusinessContext.Provider
      value={{
        negocio,
        config,
        is3D: negocio === '3D',
        isBG: negocio === 'BG',
        setNegocio,
        isPending
      }}
    >
      {children}
    </BusinessContext.Provider>
  )
}

export function useBusiness() {
  const context = useContext(BusinessContext)
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider')
  }
  return context
}
