'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { TipoNegocio } from '@/lib/business'
import { getActiveNegocioServer } from '@/lib/business-server'

function safeRevalidateStore() {
  try {
    revalidatePath('/tienda-web')
    revalidatePath('/catalogo')
    revalidatePath('/')
  } catch (e) {
    // Ignore revalidation errors in static context
  }
}

// =========================================================================
// 1. CONFIGURACIÓN GENERAL & IDENTIDAD DE LA TIENDA WEB
// =========================================================================

export interface ConfiguracionTiendaData {
  id?: string
  negocio: TipoNegocio
  nombreTienda: string
  ruc: string
  razonSocial: string
  telefonoContacto: string
  emailContacto: string
  direccionFisica: string
  horarioAtencion: string
  anuncioTopActivo: boolean
  anuncioTopTexto: string
  anuncioTopLink: string
  fraseHero: string
  subtituloHero: string
  habilitarSeccion3d: boolean
  habilitarSeccionBg: boolean
  instagramUrl: string
  tiktokUrl: string
  facebookUrl: string
  whatsappMensaje: string
  envioGratisMinimo: number
  diasGarantia: number
  politicaEnvios: string
  yapeNumero: string
  yapeTitular: string
  bcpNumeroCuenta: string
  bcpCci: string
  bcpTitular: string
}

export async function getConfiguracionTienda(negocio?: TipoNegocio): Promise<ConfiguracionTiendaData> {
  const targetNegocio = negocio || (await getActiveNegocioServer())

  let config = await prisma.configuracionTienda.findUnique({
    where: { negocio: targetNegocio },
  })

  if (!config) {
    const is3D = targetNegocio === '3D'
    config = await prisma.configuracionTienda.create({
      data: {
        negocio: targetNegocio,
        nombreTienda: is3D ? 'NOVA 3D Studio' : 'NOVA Board Games',
        ruc: '20608934512',
        razonSocial: is3D ? 'NOVA 3D IMPRESIONES S.A.C.' : 'NOVA JUEGOS Y ACCESORIOS S.A.C.',
        telefonoContacto: is3D ? '+51 924 812 345' : '+51 945398747',
        emailContacto: is3D ? 'contacto@nova3d.pe' : 'contacto@novabg.pe',
        direccionFisica: 'Taller Central - Lima, Perú',
        horarioAtencion: 'Lunes a Sábado: 9:00 AM - 8:00 PM',
        anuncioTopActivo: true,
        anuncioTopTexto: is3D
          ? '🚀 ¡Envíos gratis en piezas y accesorios 3D por compras mayores a S/ 150! Lima y Provincias'
          : '🔥 ¡Envíos gratis en juegos de mesa y accesorios por compras mayores a S/ 150! Despachos a todo el Perú',
        anuncioTopLink: '/categoria/ofertas',
        fraseHero: is3D ? 'Impresión 3D de Alta Precisión y Diseños Personalizados' : 'Tu Pasión por los Juegos de Mesa, Elevada al Máximo',
        subtituloHero: is3D
          ? 'Fabricamos accesorios modulares, miniaturas y piezas técnicas de la más alta calidad.'
          : 'Descubre juegos de mesa, organizadores a medida y accesorios exclusivos diseñados para optimizar cada partida.',
        habilitarSeccion3d: true,
        habilitarSeccionBg: true,
        instagramUrl: is3D ? 'https://instagram.com/nova3d.pe' : 'https://instagram.com/novabg.pe',
        tiktokUrl: is3D ? 'https://tiktok.com/@nova3d.pe' : 'https://tiktok.com/@novabg.pe',
        facebookUrl: '',
        whatsappMensaje: is3D
          ? '¡Hola NOVA 3D! Quisiera consultar por una impresión 3D / accesorio del catálogo.'
          : '¡Hola NOVA BG! Quisiera consultar sobre los juegos de mesa y organizadores de la tienda.',
        envioGratisMinimo: 150.0,
        diasGarantia: 30,
        politicaEnvios: 'Despacho express a Lima Metropolitana en 24h y envíos certificados a provincias vía Olva Courier o Shalom.',
        yapeNumero: '945398747',
        yapeTitular: 'Víctor Monzon Anglas',
        bcpNumeroCuenta: '',
        bcpCci: '',
        bcpTitular: 'Víctor Monzon Anglas',
      },
    })
  }

  return {
    id: config.id,
    negocio: config.negocio as TipoNegocio,
    nombreTienda: config.nombreTienda || '',
    ruc: config.ruc || '',
    razonSocial: config.razonSocial || '',
    telefonoContacto: config.telefonoContacto || '',
    emailContacto: config.emailContacto || '',
    direccionFisica: config.direccionFisica || '',
    horarioAtencion: config.horarioAtencion || '',
    anuncioTopActivo: config.anuncioTopActivo ?? true,
    anuncioTopTexto: config.anuncioTopTexto || '',
    anuncioTopLink: config.anuncioTopLink || '/categoria/ofertas',
    fraseHero: config.fraseHero || '',
    subtituloHero: config.subtituloHero || '',
    habilitarSeccion3d: config.habilitarSeccion3d ?? true,
    habilitarSeccionBg: config.habilitarSeccionBg ?? true,
    instagramUrl: config.instagramUrl || '',
    tiktokUrl: config.tiktokUrl || '',
    facebookUrl: config.facebookUrl || '',
    whatsappMensaje: config.whatsappMensaje || '',
    envioGratisMinimo: config.envioGratisMinimo ? Number(config.envioGratisMinimo) : 150,
    diasGarantia: config.diasGarantia ?? 30,
    politicaEnvios: config.politicaEnvios || '',
    yapeNumero: config.yapeNumero || '945398747',
    yapeTitular: config.yapeTitular || 'Víctor Monzon Anglas',
    bcpNumeroCuenta: config.bcpNumeroCuenta || '',
    bcpCci: config.bcpCci || '',
    bcpTitular: config.bcpTitular || 'Víctor Monzon Anglas',
  }
}

export async function updateConfiguracionTienda(negocio: TipoNegocio, data: Partial<ConfiguracionTiendaData>) {
  const current = await getConfiguracionTienda(negocio)

  const updated = await prisma.configuracionTienda.upsert({
    where: { negocio },
    update: {
      nombreTienda: data.nombreTienda !== undefined ? data.nombreTienda.trim() : current.nombreTienda,
      ruc: data.ruc !== undefined ? data.ruc.trim() : current.ruc,
      razonSocial: data.razonSocial !== undefined ? data.razonSocial.trim() : current.razonSocial,
      telefonoContacto: data.telefonoContacto !== undefined ? data.telefonoContacto.trim() : current.telefonoContacto,
      emailContacto: data.emailContacto !== undefined ? data.emailContacto.trim() : current.emailContacto,
      direccionFisica: data.direccionFisica !== undefined ? data.direccionFisica.trim() : current.direccionFisica,
      horarioAtencion: data.horarioAtencion !== undefined ? data.horarioAtencion.trim() : current.horarioAtencion,
      anuncioTopActivo: data.anuncioTopActivo !== undefined ? data.anuncioTopActivo : current.anuncioTopActivo,
      anuncioTopTexto: data.anuncioTopTexto !== undefined ? data.anuncioTopTexto.trim() : current.anuncioTopTexto,
      anuncioTopLink: data.anuncioTopLink !== undefined ? data.anuncioTopLink.trim() : current.anuncioTopLink,
      fraseHero: data.fraseHero !== undefined ? data.fraseHero.trim() : current.fraseHero,
      subtituloHero: data.subtituloHero !== undefined ? data.subtituloHero.trim() : current.subtituloHero,
      habilitarSeccion3d: data.habilitarSeccion3d !== undefined ? data.habilitarSeccion3d : current.habilitarSeccion3d,
      habilitarSeccionBg: data.habilitarSeccionBg !== undefined ? data.habilitarSeccionBg : current.habilitarSeccionBg,
      instagramUrl: data.instagramUrl !== undefined ? data.instagramUrl.trim() : current.instagramUrl,
      tiktokUrl: data.tiktokUrl !== undefined ? data.tiktokUrl.trim() : current.tiktokUrl,
      facebookUrl: data.facebookUrl !== undefined ? data.facebookUrl.trim() : current.facebookUrl,
      whatsappMensaje: data.whatsappMensaje !== undefined ? data.whatsappMensaje.trim() : current.whatsappMensaje,
      envioGratisMinimo: data.envioGratisMinimo !== undefined ? Number(data.envioGratisMinimo) : current.envioGratisMinimo,
      diasGarantia: data.diasGarantia !== undefined ? Number(data.diasGarantia) : current.diasGarantia,
      politicaEnvios: data.politicaEnvios !== undefined ? data.politicaEnvios.trim() : current.politicaEnvios,
      yapeNumero: data.yapeNumero !== undefined ? data.yapeNumero.trim() : current.yapeNumero,
      yapeTitular: data.yapeTitular !== undefined ? data.yapeTitular.trim() : current.yapeTitular,
      bcpNumeroCuenta: data.bcpNumeroCuenta !== undefined ? data.bcpNumeroCuenta.trim() : current.bcpNumeroCuenta,
      bcpCci: data.bcpCci !== undefined ? data.bcpCci.trim() : current.bcpCci,
      bcpTitular: data.bcpTitular !== undefined ? data.bcpTitular.trim() : current.bcpTitular,
    },
    create: {
      negocio,
      nombreTienda: data.nombreTienda?.trim() || 'NOVA',
      ruc: data.ruc?.trim() || '',
      razonSocial: data.razonSocial?.trim() || '',
      telefonoContacto: data.telefonoContacto?.trim() || '',
      emailContacto: data.emailContacto?.trim() || '',
      direccionFisica: data.direccionFisica?.trim() || '',
      horarioAtencion: data.horarioAtencion?.trim() || '',
      anuncioTopActivo: data.anuncioTopActivo ?? true,
      anuncioTopTexto: data.anuncioTopTexto?.trim() || '',
      anuncioTopLink: data.anuncioTopLink?.trim() || '/categoria/ofertas',
      fraseHero: data.fraseHero?.trim() || '',
      subtituloHero: data.subtituloHero?.trim() || '',
      habilitarSeccion3d: data.habilitarSeccion3d ?? true,
      habilitarSeccionBg: data.habilitarSeccionBg ?? true,
      instagramUrl: data.instagramUrl?.trim() || '',
      tiktokUrl: data.tiktokUrl?.trim() || '',
      facebookUrl: data.facebookUrl?.trim() || '',
      whatsappMensaje: data.whatsappMensaje?.trim() || '',
      envioGratisMinimo: data.envioGratisMinimo ? Number(data.envioGratisMinimo) : 150,
      diasGarantia: data.diasGarantia ? Number(data.diasGarantia) : 30,
      politicaEnvios: data.politicaEnvios?.trim() || '',
      yapeNumero: data.yapeNumero?.trim() || '945398747',
      yapeTitular: data.yapeTitular?.trim() || 'Víctor Monzon Anglas',
      bcpNumeroCuenta: data.bcpNumeroCuenta?.trim() || '',
      bcpCci: data.bcpCci?.trim() || '',
      bcpTitular: data.bcpTitular?.trim() || 'Víctor Monzon Anglas',
    },
  })

  safeRevalidateStore()
  return {
    ...updated,
    envioGratisMinimo: updated.envioGratisMinimo ? Number(updated.envioGratisMinimo) : 150,
  }
}

// =========================================================================
// 2. BANNERS DEL HERO CAROUSEL
// =========================================================================

export interface BannerTiendaItem {
  id: string
  negocio: TipoNegocio
  tag: string
  titulo: string
  resaltado: string
  subtitulo: string
  ctaTexto: string
  ctaLink: string
  imagenUrl: string
  previewBadge: string
  previewTitle: string
  previewRating: string
  colorAcento: string
  orden: number
  activo: boolean
  createdAt: string
  updatedAt: string
}

export async function getBannersTienda(negocio?: TipoNegocio): Promise<BannerTiendaItem[]> {
  const targetNegocio = negocio || (await getActiveNegocioServer())

  const banners = await prisma.bannerTienda.findMany({
    where: { negocio: targetNegocio },
    orderBy: [{ orden: 'asc' }, { createdAt: 'desc' }],
  })

  return banners.map((b) => ({
    id: b.id,
    negocio: b.negocio as TipoNegocio,
    tag: b.tag || '',
    titulo: b.titulo,
    resaltado: b.resaltado || '',
    subtitulo: b.subtitulo || '',
    ctaTexto: b.ctaTexto || 'Explorar Catálogo',
    ctaLink: b.ctaLink || '/categoria/todos',
    imagenUrl: b.imagenUrl || '',
    previewBadge: b.previewBadge || '',
    previewTitle: b.previewTitle || '',
    previewRating: b.previewRating || '5.0 Calidad Garantizada',
    colorAcento: b.colorAcento || '#0066ff',
    orden: b.orden ?? 0,
    activo: b.activo ?? true,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }))
}

export async function createBannerTienda(data: {
  negocio?: TipoNegocio
  tag?: string
  titulo: string
  resaltado?: string
  subtitulo?: string
  ctaTexto?: string
  ctaLink?: string
  imagenUrl?: string
  previewBadge?: string
  previewTitle?: string
  previewRating?: string
  colorAcento?: string
  orden?: number
  activo?: boolean
}) {
  const targetNegocio = data.negocio || (await getActiveNegocioServer())

  const banner = await prisma.bannerTienda.create({
    data: {
      negocio: targetNegocio,
      tag: data.tag?.trim() || 'COLECCIÓN OFICIAL',
      titulo: data.titulo.trim(),
      resaltado: data.resaltado?.trim() || null,
      subtitulo: data.subtitulo?.trim() || null,
      ctaTexto: data.ctaTexto?.trim() || 'Explorar Catálogo',
      ctaLink: data.ctaLink?.trim() || '/categoria/todos',
      imagenUrl: data.imagenUrl?.trim() || null,
      previewBadge: data.previewBadge?.trim() || null,
      previewTitle: data.previewTitle?.trim() || null,
      previewRating: data.previewRating?.trim() || '5.0 Calidad Premium',
      colorAcento: data.colorAcento?.trim() || (targetNegocio === '3D' ? '#f59e0b' : '#0066ff'),
      orden: data.orden ?? 0,
      activo: data.activo ?? true,
    },
  })

  safeRevalidateStore()
  return banner
}

export async function updateBannerTienda(
  id: string,
  data: {
    tag?: string
    titulo?: string
    resaltado?: string
    subtitulo?: string
    ctaTexto?: string
    ctaLink?: string
    imagenUrl?: string
    previewBadge?: string
    previewTitle?: string
    previewRating?: string
    colorAcento?: string
    orden?: number
    activo?: boolean
  }
) {
  const banner = await prisma.bannerTienda.update({
    where: { id },
    data: {
      ...(data.tag !== undefined ? { tag: data.tag.trim() } : {}),
      ...(data.titulo !== undefined ? { titulo: data.titulo.trim() } : {}),
      ...(data.resaltado !== undefined ? { resaltado: data.resaltado.trim() } : {}),
      ...(data.subtitulo !== undefined ? { subtitulo: data.subtitulo.trim() } : {}),
      ...(data.ctaTexto !== undefined ? { ctaTexto: data.ctaTexto.trim() } : {}),
      ...(data.ctaLink !== undefined ? { ctaLink: data.ctaLink.trim() } : {}),
      ...(data.imagenUrl !== undefined ? { imagenUrl: data.imagenUrl.trim() } : {}),
      ...(data.previewBadge !== undefined ? { previewBadge: data.previewBadge.trim() } : {}),
      ...(data.previewTitle !== undefined ? { previewTitle: data.previewTitle.trim() } : {}),
      ...(data.previewRating !== undefined ? { previewRating: data.previewRating.trim() } : {}),
      ...(data.colorAcento !== undefined ? { colorAcento: data.colorAcento.trim() } : {}),
      ...(data.orden !== undefined ? { orden: Number(data.orden) } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    },
  })

  safeRevalidateStore()
  return banner
}

export async function toggleBannerTienda(id: string) {
  const current = await prisma.bannerTienda.findUnique({ where: { id } })
  if (!current) throw new Error('Banner no encontrado')

  const updated = await prisma.bannerTienda.update({
    where: { id },
    data: { activo: !current.activo },
  })

  safeRevalidateStore()
  return updated
}

export async function deleteBannerTienda(id: string) {
  await prisma.bannerTienda.delete({ where: { id } })
  safeRevalidateStore()
  return { success: true }
}

// =========================================================================
// 3. OFERTAS & CUPONES DE DESCUENTO
// =========================================================================

export interface CuponDescuentoItem {
  id: string
  negocio: TipoNegocio
  codigo: string
  descripcion: string
  tipo: 'PORCENTAJE' | 'MONTO_FIJO'
  valor: number
  montoMinimo: number
  usosMaximos: number | null
  usosActuales: number
  fechaInicio: string | null
  fechaFin: string | null
  activo: boolean
  createdAt: string
  updatedAt: string
}

export async function getCuponesTienda(negocio?: TipoNegocio): Promise<CuponDescuentoItem[]> {
  const targetNegocio = negocio || (await getActiveNegocioServer())

  const cupones = await prisma.cuponDescuento.findMany({
    where: { negocio: targetNegocio },
    orderBy: [{ activo: 'desc' }, { createdAt: 'desc' }],
  })

  return cupones.map((c) => ({
    id: c.id,
    negocio: c.negocio as TipoNegocio,
    codigo: c.codigo,
    descripcion: c.descripcion || '',
    tipo: c.tipo as 'PORCENTAJE' | 'MONTO_FIJO',
    valor: Number(c.valor),
    montoMinimo: c.montoMinimo ? Number(c.montoMinimo) : 0,
    usosMaximos: c.usosMaximos,
    usosActuales: c.usosActuales,
    fechaInicio: c.fechaInicio ? c.fechaInicio.toISOString() : null,
    fechaFin: c.fechaFin ? c.fechaFin.toISOString() : null,
    activo: c.activo ?? true,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }))
}

export async function createCuponTienda(data: {
  negocio?: TipoNegocio
  codigo: string
  descripcion?: string
  tipo: 'PORCENTAJE' | 'MONTO_FIJO'
  valor: number
  montoMinimo?: number
  usosMaximos?: number | null
  fechaInicio?: string | null
  fechaFin?: string | null
  activo?: boolean
}) {
  const targetNegocio = data.negocio || (await getActiveNegocioServer())
  const cleanCodigo = data.codigo.trim().toUpperCase()

  if (!cleanCodigo) throw new Error('El código del cupón es obligatorio')
  if (data.valor <= 0) throw new Error('El valor del descuento debe ser mayor a 0')

  const cupon = await prisma.cuponDescuento.create({
    data: {
      negocio: targetNegocio,
      codigo: cleanCodigo,
      descripcion: data.descripcion?.trim() || null,
      tipo: data.tipo,
      valor: data.valor,
      montoMinimo: data.montoMinimo != null ? data.montoMinimo : 0,
      usosMaximos: data.usosMaximos ? Number(data.usosMaximos) : null,
      fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
      fechaFin: data.fechaFin ? new Date(data.fechaFin) : null,
      activo: data.activo ?? true,
    },
  })

  safeRevalidateStore()
  return cupon
}

export async function updateCuponTienda(
  id: string,
  data: {
    codigo?: string
    descripcion?: string
    tipo?: 'PORCENTAJE' | 'MONTO_FIJO'
    valor?: number
    montoMinimo?: number
    usosMaximos?: number | null
    fechaInicio?: string | null
    fechaFin?: string | null
    activo?: boolean
  }
) {
  const cupon = await prisma.cuponDescuento.update({
    where: { id },
    data: {
      ...(data.codigo !== undefined ? { codigo: data.codigo.trim().toUpperCase() } : {}),
      ...(data.descripcion !== undefined ? { descripcion: data.descripcion.trim() } : {}),
      ...(data.tipo !== undefined ? { tipo: data.tipo } : {}),
      ...(data.valor !== undefined ? { valor: data.valor } : {}),
      ...(data.montoMinimo !== undefined ? { montoMinimo: data.montoMinimo } : {}),
      ...(data.usosMaximos !== undefined ? { usosMaximos: data.usosMaximos ? Number(data.usosMaximos) : null } : {}),
      ...(data.fechaInicio !== undefined ? { fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : null } : {}),
      ...(data.fechaFin !== undefined ? { fechaFin: data.fechaFin ? new Date(data.fechaFin) : null } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
    },
  })

  safeRevalidateStore()
  return cupon
}

export async function toggleCuponTienda(id: string) {
  const current = await prisma.cuponDescuento.findUnique({ where: { id } })
  if (!current) throw new Error('Cupón no encontrado')

  const updated = await prisma.cuponDescuento.update({
    where: { id },
    data: { activo: !current.activo },
  })

  safeRevalidateStore()
  return updated
}

export async function deleteCuponTienda(id: string) {
  await prisma.cuponDescuento.delete({ where: { id } })
  safeRevalidateStore()
  return { success: true }
}

// =========================================================================
// 4. STOCK & CATÁLOGO WEB
// =========================================================================

export interface ProductoStoreConfigItem {
  id: string
  negocio: TipoNegocio
  lineaCategoria: string
  nombreModelo: string
  costoBase: number
  precioAmigos: number
  precioMercado: number
  precioComunidad: number
  pesoGramos: number
  stock: number
  controlarStock: boolean
  enOferta: boolean
  precioOferta: number | null
  porcentajeDescuento: number
  badgePromocion: string
  destacadoWeb: boolean
  imagenUrl: string
  descripcionWeb: string
  activo: boolean
  createdAt: string
  updatedAt: string
}

export async function getProductosStoreConfig(negocio?: TipoNegocio): Promise<ProductoStoreConfigItem[]> {
  const targetNegocio = negocio || (await getActiveNegocioServer())

  const productos = await prisma.producto.findMany({
    where: { negocio: targetNegocio },
    orderBy: [
      { activo: 'desc' },
      { enOferta: 'desc' },
      { lineaCategoria: 'asc' },
      { nombreModelo: 'asc' },
    ],
  })

  return productos.map((p) => ({
    id: p.id,
    negocio: p.negocio as TipoNegocio,
    lineaCategoria: p.lineaCategoria,
    nombreModelo: p.nombreModelo,
    costoBase: Number(p.costoBase),
    precioAmigos: Number(p.precioAmigos),
    precioMercado: Number(p.precioMercado),
    precioComunidad: Number(p.precioComunidad),
    pesoGramos: p.pesoGramos != null ? Number(p.pesoGramos) : 0,
    stock: p.stock ?? 0,
    controlarStock: p.controlarStock ?? false,
    enOferta: p.enOferta ?? false,
    precioOferta: p.precioOferta ? Number(p.precioOferta) : null,
    porcentajeDescuento: p.porcentajeDescuento ?? 0,
    badgePromocion: p.badgePromocion || '',
    destacadoWeb: p.destacadoWeb ?? false,
    imagenUrl: p.imagenUrl || '',
    descripcionWeb: p.descripcionWeb || '',
    activo: p.activo ?? true,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }))
}

export async function updateProductoStoreConfig(
  id: string,
  data: {
    stock?: number
    controlarStock?: boolean
    enOferta?: boolean
    precioOferta?: number | null
    porcentajeDescuento?: number
    badgePromocion?: string
    destacadoWeb?: boolean
    imagenUrl?: string
    descripcionWeb?: string
    activo?: boolean
    precioMercado?: number
  }
) {
  // If enOferta is true and porcentajeDescuento is provided, calculate precioOferta or viceversa
  let computedPrecioOferta = data.precioOferta
  const current = await prisma.producto.findUnique({ where: { id } })
  if (!current) throw new Error('Producto no encontrado')

  const basePrice = data.precioMercado !== undefined ? Number(data.precioMercado) : Number(current.precioMercado)

  if (data.enOferta && data.porcentajeDescuento && data.porcentajeDescuento > 0) {
    computedPrecioOferta = Number((basePrice * (1 - data.porcentajeDescuento / 100)).toFixed(2))
  }

  const updated = await prisma.producto.update({
    where: { id },
    data: {
      ...(data.stock !== undefined ? { stock: Number(data.stock) } : {}),
      ...(data.controlarStock !== undefined ? { controlarStock: data.controlarStock } : {}),
      ...(data.enOferta !== undefined ? { enOferta: data.enOferta } : {}),
      ...(computedPrecioOferta !== undefined ? { precioOferta: computedPrecioOferta } : {}),
      ...(data.porcentajeDescuento !== undefined ? { porcentajeDescuento: Number(data.porcentajeDescuento) } : {}),
      ...(data.badgePromocion !== undefined ? { badgePromocion: data.badgePromocion.trim() || null } : {}),
      ...(data.destacadoWeb !== undefined ? { destacadoWeb: data.destacadoWeb } : {}),
      ...(data.imagenUrl !== undefined ? { imagenUrl: data.imagenUrl.trim() || null } : {}),
      ...(data.descripcionWeb !== undefined ? { descripcionWeb: data.descripcionWeb.trim() || null } : {}),
      ...(data.activo !== undefined ? { activo: data.activo } : {}),
      ...(data.precioMercado !== undefined ? { precioMercado: data.precioMercado } : {}),
    },
  })

  safeRevalidateStore()
  return updated
}

export async function bulkUpdateStockOfertas(
  updates: Array<{
    id: string
    stock?: number
    enOferta?: boolean
    porcentajeDescuento?: number
    precioOferta?: number
    badgePromocion?: string
  }>
) {
  for (const item of updates) {
    await updateProductoStoreConfig(item.id, {
      stock: item.stock,
      enOferta: item.enOferta,
      porcentajeDescuento: item.porcentajeDescuento,
      precioOferta: item.precioOferta,
      badgePromocion: item.badgePromocion,
    })
  }

  safeRevalidateStore()
  return { success: true }
}

// =========================================================================
// 5. FAVORITOS & DEMANDA WEB (TOMA DE DECISIONES DE COMPRA/REABASTECIMIENTO)
// =========================================================================

export interface FavoritoClienteItem {
  id: string
  clienteNombre: string | null
  clienteTelefono: string | null
  clienteEmail: string | null
  deseaAvisoStock: boolean
  avisado: boolean
  createdAt: string
}

export interface ProductoDemandaFavoritosItem {
  id: string
  nombreModelo: string
  lineaCategoria: string
  negocio: TipoNegocio
  stock: number
  controlarStock: boolean
  precioMercado: number
  precioOferta: number | null
  enOferta: boolean
  imagenUrl: string | null
  activo: boolean
  totalFavoritos: number
  totalAvisosPendientes: number
  totalAvisosEnviados: number
  clientesAviso: FavoritoClienteItem[]
  prioridad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'ESTABLE'
}

export async function getFavoritosDemanda(
  negocio?: TipoNegocio
): Promise<ProductoDemandaFavoritosItem[]> {
  const targetNegocio = negocio || (await getActiveNegocioServer())

  const productos = await prisma.producto.findMany({
    where: {
      negocio: targetNegocio,
      favoritos: {
        some: {},
      },
    },
    include: {
      favoritos: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  const results: ProductoDemandaFavoritosItem[] = productos.map((p) => {
    const totalFavoritos = p.favoritos.length
    const totalAvisosPendientes = p.favoritos.filter(
      (f) => f.deseaAvisoStock && !f.avisado
    ).length
    const totalAvisosEnviados = p.favoritos.filter(
      (f) => f.deseaAvisoStock && f.avisado
    ).length

    const isOutOfStock = p.controlarStock && p.stock <= 0
    const isLowStock = p.controlarStock && p.stock > 0 && p.stock <= 2

    let prioridad: 'CRITICA' | 'ALTA' | 'MEDIA' | 'ESTABLE' = 'ESTABLE'
    if (isOutOfStock && totalAvisosPendientes > 0) {
      prioridad = 'CRITICA'
    } else if (isOutOfStock && totalFavoritos > 0) {
      prioridad = 'ALTA'
    } else if (isLowStock && totalFavoritos > 0) {
      prioridad = 'MEDIA'
    }

    return {
      id: p.id,
      nombreModelo: p.nombreModelo,
      lineaCategoria: p.lineaCategoria,
      negocio: p.negocio as TipoNegocio,
      stock: p.stock,
      controlarStock: p.controlarStock,
      precioMercado: Number(p.precioMercado),
      precioOferta: p.precioOferta ? Number(p.precioOferta) : null,
      enOferta: p.enOferta ?? false,
      imagenUrl: p.imagenUrl || null,
      activo: p.activo ?? true,
      totalFavoritos,
      totalAvisosPendientes,
      totalAvisosEnviados,
      clientesAviso: p.favoritos
        .filter((f) => f.deseaAvisoStock || f.clienteNombre || f.clienteTelefono)
        .map((f) => ({
          id: f.id,
          clienteNombre: f.clienteNombre,
          clienteTelefono: f.clienteTelefono,
          clienteEmail: f.clienteEmail,
          deseaAvisoStock: f.deseaAvisoStock,
          avisado: f.avisado,
          createdAt: f.createdAt.toISOString(),
        })),
      prioridad,
    }
  })

  const prioridadOrder = { CRITICA: 0, ALTA: 1, MEDIA: 2, ESTABLE: 3 }
  return results.sort((a, b) => {
    const pDiff = prioridadOrder[a.prioridad] - prioridadOrder[b.prioridad]
    if (pDiff !== 0) return pDiff
    return b.totalFavoritos - a.totalFavoritos
  })
}

export async function toggleAvisoFavorito(favoritoId: string, avisado: boolean) {
  const updated = await prisma.favorito.update({
    where: { id: favoritoId },
    data: { avisado },
  })
  safeRevalidateStore()
  return { success: true, favorito: updated }
}

export async function marcarTodosAvisosProducto(productoId: string, avisado: boolean) {
  await prisma.favorito.updateMany({
    where: {
      productoId,
      deseaAvisoStock: true,
    },
    data: { avisado },
  })
  safeRevalidateStore()
  return { success: true }
}

