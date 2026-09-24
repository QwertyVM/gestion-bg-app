import { getVentas } from '@/actions/ventas'
import { getPedidos } from '@/actions/pedidos'
import { getIngresos } from '@/actions/ingresos'
import { IngresosClient } from '@/components/finanzas/IngresosClient'

export const dynamic = 'force-dynamic'

export default async function IngresosPage() {
  const [ventas, pedidos, ingresosDirectos] = await Promise.all([
    getVentas(),
    getPedidos(),
    getIngresos(),
  ])

  return (
    <IngresosClient 
      ventas={ventas as any} 
      pedidos={pedidos as any}
      ingresosDirectos={ingresosDirectos as any} 
    />
  )
}
