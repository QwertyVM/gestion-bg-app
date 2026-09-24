'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ConfiguracionTiendaData,
  BannerTiendaItem,
  CuponDescuentoItem,
  ProductoStoreConfigItem,
  ProductoDemandaFavoritosItem,
} from '@/actions/tienda'
import { useBusiness } from '@/context/BusinessContext'
import { TabIdentidadContacto } from './TabIdentidadContacto'
import { TabBannersHero } from './TabBannersHero'
import { TabOfertasCupones } from './TabOfertasCupones'
import { TabStockCatalogo } from './TabStockCatalogo'
import { TabFavoritosDemanda } from './TabFavoritosDemanda'
import {
  Globe,
  Sliders,
  Sparkles,
  Ticket,
  Package,
  ExternalLink,
  Flame,
  RefreshCw,
  Store,
  Layers,
  ShoppingBag,
  Heart,
} from 'lucide-react'

interface GestionTiendaClientProps {
  initialConfig: ConfiguracionTiendaData
  initialBanners: BannerTiendaItem[]
  initialCupones: CuponDescuentoItem[]
  initialProductos: ProductoStoreConfigItem[]
  initialFavoritos: ProductoDemandaFavoritosItem[]
}

type TabType = 'identidad' | 'banners' | 'cupones' | 'stock' | 'favoritos'

export function GestionTiendaClient({
  initialConfig,
  initialBanners,
  initialCupones,
  initialProductos,
  initialFavoritos,
}: GestionTiendaClientProps) {
  const router = useRouter()
  const { negocio, setNegocio, is3D, isBG, config } = useBusiness()
  const [activeTab, setActiveTab] = useState<TabType>('identidad')
  const [storeConfig, setStoreConfig] = useState<ConfiguracionTiendaData>(initialConfig)

  const handleRefresh = () => {
    router.refresh()
  }

  // Count active stats
  const totalOfertas = initialProductos.filter((p) => p.enOferta).length
  const totalBannersActivos = initialBanners.filter((b) => b.activo).length
  const totalCuponesActivos = initialCupones.filter((c) => c.activo).length

  return (
    <div className="space-y-6 pb-12">
      {/* 1. TOP HEADER & BUSINESS SWITCHER */}
      <div className="bg-white rounded-2xl border border-[#E2D9CC] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white shadow-xs ${
              is3D ? 'bg-amber-600' : 'bg-indigo-600'
            }`}
          >
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#241C15] tracking-tight">
                Gestión de la Store Web
              </h1>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider ${
                  is3D
                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                    : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                }`}
              >
                Perfil {negocio}
              </span>
            </div>
            <p className="text-xs text-[#75695D] mt-0.5">
              Administra la configuración, ofertas, cupones, banners e inventario que impactan en vivo la tienda online.
            </p>
          </div>
        </div>

        {/* Action buttons: Switch business & View Store */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Business switcher tabs */}
          <div className="flex items-center bg-[#F8F6F2] p-1 rounded-xl border border-[#E2D9CC] text-xs">
            <button
              onClick={() => setNegocio('3D')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                is3D
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              Tienda 3D
            </button>
            <button
              onClick={() => setNegocio('BG')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                isBG
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-[#75695D] hover:text-[#241C15]'
              }`}
            >
              Tienda BG
            </button>
          </div>

          {/* Open Store Link */}
          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0066ff] hover:bg-[#0052cc] text-white text-xs font-bold transition-colors cursor-pointer shadow-xs shrink-0"
            title="Abrir tienda pública en una pestaña nueva"
          >
            <span>Ver Tienda Web</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveTab('identidad')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 border ${
            activeTab === 'identidad'
              ? 'bg-[#241C15] text-white border-[#241C15] shadow-xs'
              : 'bg-white text-[#75695D] border-[#E2D9CC] hover:bg-[#F8F6F2] hover:text-[#241C15]'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Identidad & Contacto</span>
        </button>

        <button
          onClick={() => setActiveTab('banners')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 border ${
            activeTab === 'banners'
              ? 'bg-[#241C15] text-white border-[#241C15] shadow-xs'
              : 'bg-white text-[#75695D] border-[#E2D9CC] hover:bg-[#F8F6F2] hover:text-[#241C15]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Banners & Hero ({initialBanners.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('cupones')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 border ${
            activeTab === 'cupones'
              ? 'bg-[#241C15] text-white border-[#241C15] shadow-xs'
              : 'bg-white text-[#75695D] border-[#E2D9CC] hover:bg-[#F8F6F2] hover:text-[#241C15]'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Ofertas & Cupones ({totalCuponesActivos} activos)</span>
        </button>

        <button
          onClick={() => setActiveTab('stock')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 border ${
            activeTab === 'stock'
              ? 'bg-[#241C15] text-white border-[#241C15] shadow-xs'
              : 'bg-white text-[#75695D] border-[#E2D9CC] hover:bg-[#F8F6F2] hover:text-[#241C15]'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Stock & Catálogo Web ({initialProductos.length})</span>
          {totalOfertas > 0 && (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
              {totalOfertas} en promo
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('favoritos')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer shrink-0 border ${
            activeTab === 'favoritos'
              ? 'bg-[#241C15] text-white border-[#241C15] shadow-xs'
              : 'bg-white text-[#75695D] border-[#E2D9CC] hover:bg-[#F8F6F2] hover:text-[#241C15]'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
          <span>Favoritos & Demanda ({initialFavoritos.length})</span>
          {initialFavoritos.filter((p) => p.totalAvisosPendientes > 0).length > 0 && (
            <span className="bg-rose-100 text-rose-800 text-[10px] px-1.5 py-0.2 rounded-md font-bold">
              {initialFavoritos.filter((p) => p.totalAvisosPendientes > 0).length} con avisos
            </span>
          )}
        </button>
      </div>

      {/* 3. ACTIVE TAB CONTENT */}
      {activeTab === 'identidad' && (
        <TabIdentidadContacto
          negocio={negocio}
          initialConfig={storeConfig}
          onConfigUpdated={(c) => setStoreConfig(c)}
        />
      )}

      {activeTab === 'banners' && (
        <TabBannersHero
          negocio={negocio}
          banners={initialBanners}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'cupones' && (
        <TabOfertasCupones
          negocio={negocio}
          cupones={initialCupones}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'stock' && (
        <TabStockCatalogo
          negocio={negocio}
          productos={initialProductos}
          onRefresh={handleRefresh}
        />
      )}

      {activeTab === 'favoritos' && (
        <TabFavoritosDemanda
          negocio={negocio}
          favoritos={initialFavoritos}
          onRefresh={handleRefresh}
        />
      )}
    </div>
  )
}
