export type TipoNegocio = '3D' | 'BG'

export const BUSINESS_COOKIE_NAME = 'nova_business'
export const DEFAULT_NEGOCIO: TipoNegocio = 'BG'

export interface BusinessConfig {
  id: TipoNegocio
  name: string
  subname: string
  tagline: string
  badge: string
  themeColor: string
  gradient: string
  bgLight: string
  bgHover: string
  textAccent: string
  borderAccent: string
  ringAccent: string
  iconName: 'Printer' | 'Dice5'
}

export const BUSINESSES: Record<TipoNegocio, BusinessConfig> = {
  '3D': {
    id: '3D',
    name: 'NOVA 3D',
    subname: 'Impresión & Diseño 3D',
    tagline: 'Taller de Fabricación y Prototipado 3D',
    badge: '3D Studio',
    themeColor: '#f59e0b', // Amber
    gradient: 'from-amber-500 via-orange-500 to-amber-600',
    bgLight: 'bg-amber-500/10',
    bgHover: 'hover:bg-amber-500/20',
    textAccent: 'text-amber-400',
    borderAccent: 'border-amber-500/30',
    ringAccent: 'focus:ring-amber-500/40',
    iconName: 'Printer'
  },
  'BG': {
    id: 'BG',
    name: 'NOVA BG',
    subname: 'Juegos de Mesa',
    tagline: 'Venta de Juegos de Mesa, Expansiones y Accesorios',
    badge: 'Board Games',
    themeColor: '#6366f1', // Indigo / Purple
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
    bgLight: 'bg-indigo-500/10',
    bgHover: 'hover:bg-indigo-500/20',
    textAccent: 'text-indigo-400',
    borderAccent: 'border-indigo-500/30',
    ringAccent: 'focus:ring-indigo-500/40',
    iconName: 'Dice5'
  }
}
