import { getCierres, getDatosPreCierre } from '@/actions/cierres'
import { CierresClient } from '@/components/finanzas/CierresClient'

export const dynamic = 'force-dynamic'

export default async function CierresPage() {
  const [cierres, datosPreCierre] = await Promise.all([
    getCierres(),
    getDatosPreCierre(),
  ])

  return <CierresClient cierres={cierres} datosPreCierre={datosPreCierre} />
}
