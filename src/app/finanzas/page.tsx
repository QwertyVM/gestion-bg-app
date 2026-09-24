import { getInversiones } from '@/actions/inversiones'
import { getVentas } from '@/actions/ventas'
import { getIngresos } from '@/actions/ingresos'
import { FlujoCajaClient } from '@/components/finanzas/FlujoCajaClient'

export const dynamic = 'force-dynamic'

export default async function FinanzasPage() {
  const [egresos, ventas, ingresosDirectos] = await Promise.all([
    getInversiones(),
    getVentas(),
    getIngresos(),
  ])

  return (
    <FlujoCajaClient 
      egresos={egresos as any} 
      ventas={ventas as any} 
      ingresosDirectos={ingresosDirectos as any} 
    />
  )
}
