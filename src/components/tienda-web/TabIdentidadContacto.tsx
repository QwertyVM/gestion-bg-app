'use client'

import React, { useState } from 'react'
import { ConfiguracionTiendaData, updateConfiguracionTienda } from '@/actions/tienda'
import { TipoNegocio } from '@/lib/business'
import {
  Store,
  FileText,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  Megaphone,
  Share2,
  ShieldCheck,
  Truck,
  MessageCircle,
  Save,
  CheckCircle2,
  ExternalLink,
  Info,
  Printer,
  Dice5,
  Eye,
  EyeOff,
  Landmark,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'

interface TabIdentidadContactoProps {
  negocio: TipoNegocio
  initialConfig: ConfiguracionTiendaData
  onConfigUpdated?: (config: ConfiguracionTiendaData) => void
}

export function TabIdentidadContacto({
  negocio,
  initialConfig,
  onConfigUpdated,
}: TabIdentidadContactoProps) {
  const [formData, setFormData] = useState<ConfiguracionTiendaData>(initialConfig)
  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (field: keyof ConfiguracionTiendaData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const updated = await updateConfiguracionTienda(negocio, formData)
      toast.success('Configuración de la tienda web guardada exitosamente')
      if (onConfigUpdated) {
        onConfigUpdated(updated as any)
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar la configuración')
    } finally {
      setIsSaving(false)
    }
  }

  // Generate WhatsApp preview test link
  const cleanPhone = formData.telefonoContacto.replace(/[^\d]/g, '')
  const whatsappTestUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formData.whatsappMensaje || '')}`

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 0. SECCIONES VISIBLES EN LA WEB (BG / 3D TOGGLES) */}
      <div className="bg-white rounded-2xl border border-[#E2D9CC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#E2D9CC] pb-3.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#241C15]">Secciones Activas en la Tienda Web</h3>
            <p className="text-xs text-[#75695D]">
              Controla qué catálogos y pestañas están visibles para los clientes en la tienda pública
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* 3D Section Toggle Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              formData.habilitarSeccion3d
                ? 'bg-amber-50/50 border-amber-200'
                : 'bg-gray-50 border-gray-200 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    formData.habilitarSeccion3d ? 'bg-amber-500 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  <Printer className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-[#241C15]">Sección Impresión 3D</span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.habilitarSeccion3d}
                  onChange={(e) => handleChange('habilitarSeccion3d', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
              </label>
            </div>

            <p className="text-[11px] text-[#75695D] leading-relaxed">
              {formData.habilitarSeccion3d
                ? '✅ Sección 3D activa. Los clientes pueden alternar al catálogo de accesorios y piezas 3D.'
                : '🚫 Sección 3D desactivada. La tienda web ocultará la pestaña 3D y se enfocará 100% en Juegos de Mesa.'}
            </p>
          </div>

          {/* BG Section Toggle Card */}
          <div
            className={`p-4 rounded-xl border transition-all ${
              formData.habilitarSeccionBg
                ? 'bg-blue-50/50 border-blue-200'
                : 'bg-gray-50 border-gray-200 opacity-75'
            }`}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    formData.habilitarSeccionBg ? 'bg-[#0066ff] text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  <Dice5 className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-[#241C15]">Sección Juegos de Mesa (BG)</span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.habilitarSeccionBg}
                  onChange={(e) => handleChange('habilitarSeccionBg', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <p className="text-[11px] text-[#75695D] leading-relaxed">
              {formData.habilitarSeccionBg
                ? '✅ Sección Juegos de Mesa (BG) visible y habilitada para los visitantes.'
                : '🚫 Sección Juegos de Mesa desactivada temporalmente.'}
            </p>
          </div>
        </div>
      </div>
      {/* 1. TOP ANNOUNCEMENT BANNER */}
      <div className="bg-white rounded-2xl border border-[#E2D9CC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2D9CC] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <Megaphone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#241C15]">Cintillo de Anuncios Superior (Top Bar)</h3>
              <p className="text-xs text-[#75695D]">
                Frase promocional visible en la parte más alta de la tienda web ({negocio})
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto bg-[#F8F6F2] px-3 py-1.5 rounded-xl border border-[#E2D9CC]">
            <input
              type="checkbox"
              checked={formData.anuncioTopActivo}
              onChange={(e) => handleChange('anuncioTopActivo', e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-xs font-bold text-[#241C15]">
              {formData.anuncioTopActivo ? 'Cintillo Activado' : 'Cintillo Oculto'}
            </span>
          </label>
        </div>

        {/* Live Preview Box */}
        {formData.anuncioTopActivo && (
          <div className="bg-[#0f172a] text-white p-3 rounded-xl flex items-center justify-between text-xs shadow-inner">
            <div className="flex items-center gap-2 min-w-0">
              <span className="bg-[#00d2ff] text-[#0f172a] text-[10px] font-black px-1.5 py-0.5 rounded shrink-0">
                PROMO
              </span>
              <span className="truncate text-white/90 font-medium">
                {formData.anuncioTopTexto || 'Escribe tu frase de anuncio...'}
              </span>
            </div>
            {formData.anuncioTopLink && (
              <span className="text-[11px] text-[#00d2ff] hover:underline shrink-0 ml-2 font-semibold">
                Ver más →
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">
              Texto del Anuncio / Frase Promocional
            </label>
            <input
              type="text"
              value={formData.anuncioTopTexto}
              onChange={(e) => handleChange('anuncioTopTexto', e.target.value)}
              placeholder="Ej: 🔥 ¡Envíos gratis por compras mayores a S/ 150 a todo Lima!"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">Enlace de Redirección (Opcional)</label>
            <input
              type="text"
              value={formData.anuncioTopLink}
              onChange={(e) => handleChange('anuncioTopLink', e.target.value)}
              placeholder="/categoria/ofertas o URL externa"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>
        </div>
      </div>

      {/* 2. DATOS DE IDENTIDAD & LEGALES (RUC, RAZÓN SOCIAL, NOMBRE) */}
      <div className="bg-white rounded-2xl border border-[#E2D9CC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#E2D9CC] pb-3.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center border border-blue-200">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#241C15]">Datos Legales & Nombre de la Tienda</h3>
            <p className="text-xs text-[#75695D]">
              Información oficial que se mostrará en el footer, comprobantes y contacto web
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">Nombre de la Tienda</label>
            <input
              type="text"
              value={formData.nombreTienda}
              onChange={(e) => handleChange('nombreTienda', e.target.value)}
              placeholder="Ej: NOVA Board Games"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">RUC (SUNAT)</label>
            <input
              type="text"
              value={formData.ruc}
              onChange={(e) => handleChange('ruc', e.target.value)}
              placeholder="Ej: 20608934512"
              maxLength={11}
              className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2 md:col-span-1">
            <label className="block text-xs font-bold text-[#241C15]">Razón Social Oficial</label>
            <input
              type="text"
              value={formData.razonSocial}
              onChange={(e) => handleChange('razonSocial', e.target.value)}
              placeholder="Ej: NOVA JUEGOS Y ACCESORIOS S.A.C."
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">Frase Principal en el Hero (Home)</label>
            <input
              type="text"
              value={formData.fraseHero}
              onChange={(e) => handleChange('fraseHero', e.target.value)}
              placeholder="Ej: Tu Pasión por los Juegos de Mesa, Elevada al Máximo"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">Subtítulo / Bajada en el Home</label>
            <input
              type="text"
              value={formData.subtituloHero}
              onChange={(e) => handleChange('subtituloHero', e.target.value)}
              placeholder="Ej: Descubre juegos de mesa, organizadores y accesorios exclusivos."
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>
        </div>
      </div>

      {/* 3. CONTACTO, WHATSAPP & REDES SOCIALES */}
      <div className="bg-white rounded-2xl border border-[#E2D9CC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#E2D9CC] pb-3.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#241C15]">Contacto, WhatsApp & Redes Sociales</h3>
            <p className="text-xs text-[#75695D]">
              Canales de atención directa para tus clientes de la tienda web
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-[#241C15]">WhatsApp de Ventas / Soporte</label>
              {cleanPhone && (
                <a
                  href={whatsappTestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-emerald-600 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Probar Chat</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
            <input
              type="text"
              value={formData.telefonoContacto}
              onChange={(e) => handleChange('telefonoContacto', e.target.value)}
              placeholder="+51 924 812 345"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">Email de Contacto</label>
            <input
              type="email"
              value={formData.emailContacto}
              onChange={(e) => handleChange('emailContacto', e.target.value)}
              placeholder="contacto@novabg.pe"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">Horario de Atención</label>
            <input
              type="text"
              value={formData.horarioAtencion}
              onChange={(e) => handleChange('horarioAtencion', e.target.value)}
              placeholder="Lun a Sáb: 9:00 AM - 8:00 PM"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#241C15]">
            Mensaje Predeterminado de WhatsApp al hacer clic
          </label>
          <input
            type="text"
            value={formData.whatsappMensaje}
            onChange={(e) => handleChange('whatsappMensaje', e.target.value)}
            placeholder="¡Hola! Quisiera consultar por un producto de la tienda online."
            className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">Instagram URL / Usuario</label>
            <input
              type="text"
              value={formData.instagramUrl}
              onChange={(e) => handleChange('instagramUrl', e.target.value)}
              placeholder="https://instagram.com/novabg.pe"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">TikTok URL</label>
            <input
              type="text"
              value={formData.tiktokUrl}
              onChange={(e) => handleChange('tiktokUrl', e.target.value)}
              placeholder="https://tiktok.com/@novabg.pe"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">Dirección / Distrito de Taller</label>
            <input
              type="text"
              value={formData.direccionFisica}
              onChange={(e) => handleChange('direccionFisica', e.target.value)}
              placeholder="Taller Central - Lima, Perú"
              className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
            />
          </div>
        </div>
      </div>

      {/* 4. CUENTAS BANCARIAS & MÉTODOS DE PAGO (YAPE / BCP) */}
      <div className="bg-white rounded-2xl border border-[#E2D9CC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#E2D9CC] pb-3.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-200">
            <Landmark className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#241C15]">Cuentas Bancarias & Cobro Web (Yape y BCP)</h3>
            <p className="text-xs text-[#75695D]">
              Datos mostrados al cliente en la pantalla de pago tras confirmar su pedido en la tienda web
            </p>
          </div>
        </div>

        {/* Yape */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-[#732282] text-white text-[10px] font-black tracking-wide uppercase">
              Yape
            </span>
            <span className="text-xs font-bold text-[#241C15]">Datos de Cobro por Yape</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#241C15]">Número de Teléfono / Yape</label>
              <input
                type="text"
                value={formData.yapeNumero}
                onChange={(e) => handleChange('yapeNumero', e.target.value)}
                placeholder="945398747"
                className="w-full text-xs font-mono font-bold px-3 py-2 rounded-xl border border-[#E2D9CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#241C15]">Titular de la Cuenta Yape</label>
              <input
                type="text"
                value={formData.yapeTitular}
                onChange={(e) => handleChange('yapeTitular', e.target.value)}
                placeholder="Víctor Monzon Anglas"
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
              />
            </div>
          </div>
        </div>

        {/* BCP */}
        <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E2D9CC] space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-lg bg-[#002A8F] text-[#FF7800] text-[10px] font-black tracking-wide uppercase">
              BCP
            </span>
            <span className="text-xs font-bold text-[#241C15]">Transferencia Bancaria BCP</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#241C15]">Número de Cuenta BCP</label>
              <input
                type="text"
                value={formData.bcpNumeroCuenta}
                onChange={(e) => handleChange('bcpNumeroCuenta', e.target.value)}
                placeholder="Ej: 191-XXXXXXXX-0-XX"
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-[#E2D9CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#241C15]">Código Interbancario (CCI)</label>
              <input
                type="text"
                value={formData.bcpCci}
                onChange={(e) => handleChange('bcpCci', e.target.value)}
                placeholder="Ej: 002-191-XXXXXXXXXXXX-XX"
                className="w-full text-xs font-mono px-3 py-2 rounded-xl border border-[#E2D9CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#241C15]">Titular de la Cuenta BCP</label>
              <input
                type="text"
                value={formData.bcpTitular}
                onChange={(e) => handleChange('bcpTitular', e.target.value)}
                placeholder="Víctor Monzon Anglas"
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 5. BENEFICIOS, ENVÍOS & POLÍTICAS */}
      <div className="bg-white rounded-2xl border border-[#E2D9CC] p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 border-b border-[#E2D9CC] pb-3.5">
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#241C15]">Beneficios de Compra, Garantía & Envíos</h3>
            <p className="text-xs text-[#75695D]">
              Condiciones mostradas en el checkout, ficha de producto y franjas de confianza
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">
              Monto Mínimo para Envío Gratis (S/)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-xs font-bold text-gray-500">S/</span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={formData.envioGratisMinimo}
                onChange={(e) => handleChange('envioGratisMinimo', parseFloat(e.target.value) || 0)}
                className="w-full text-xs pl-8 pr-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15] font-semibold"
              />
            </div>
            <p className="text-[11px] text-[#75695D]">
              Los pedidos que alcancen o superen este valor tendrán flete gratuito automático.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-[#241C15]">Días de Garantía de Compra</label>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="365"
                value={formData.diasGarantia}
                onChange={(e) => handleChange('diasGarantia', parseInt(e.target.value, 10) || 30)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15] font-semibold"
              />
              <span className="absolute right-3 top-2 text-xs text-gray-500 font-medium">días</span>
            </div>
            <p className="text-[11px] text-[#75695D]">
              Plazo de garantía mostrado en los sellos de confianza de la tienda.
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-[#241C15]">Política de Envíos (Detalle)</label>
          <input
            type="text"
            value={formData.politicaEnvios}
            onChange={(e) => handleChange('politicaEnvios', e.target.value)}
            placeholder="Despacho express a Lima en 24h y envíos a todo el país vía Olva / Shalom."
            className="w-full text-xs px-3 py-2 rounded-xl border border-[#E2D9CC] bg-[#F8F6F2] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A36F4C]/40 text-[#241C15]"
          />
        </div>
      </div>

      {/* SAVE BUTTON */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#241C15] hover:bg-[#3D3025] text-white text-xs font-bold transition-colors cursor-pointer shadow-md disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Guardando Cambios...' : 'Guardar Configuración de Tienda'}</span>
        </button>
      </div>
    </form>
  )
}
