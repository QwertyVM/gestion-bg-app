import { cookies } from 'next/headers'
import { TipoNegocio, BUSINESS_COOKIE_NAME, DEFAULT_NEGOCIO } from '@/lib/business'

export async function getActiveNegocioServer(): Promise<TipoNegocio> {
  return 'BG'
}
