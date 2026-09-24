import React from 'react'
import { getActiveNegocioServer } from '@/lib/business-server'
import {
  getConfiguracionTienda,
  getBannersTienda,
  getCuponesTienda,
  getProductosStoreConfig,
  getFavoritosDemanda,
} from '@/actions/tienda'
import { GestionTiendaClient } from '@/components/tienda-web/GestionTiendaClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gestión de la Store Web | NOVA ERP',
  description: 'Módulo de administración en tiempo real de la tienda web oficial (3D y BG).',
}

export default async function TiendaWebPage() {
  const activeNegocio = await getActiveNegocioServer()

  const [config, banners, cupones, productos, favoritos] = await Promise.all([
    getConfiguracionTienda(activeNegocio),
    getBannersTienda(activeNegocio),
    getCuponesTienda(activeNegocio),
    getProductosStoreConfig(activeNegocio),
    getFavoritosDemanda(activeNegocio),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
      <GestionTiendaClient
        initialConfig={config}
        initialBanners={banners}
        initialCupones={cupones}
        initialProductos={productos}
        initialFavoritos={favoritos}
      />
    </div>
  )
}
