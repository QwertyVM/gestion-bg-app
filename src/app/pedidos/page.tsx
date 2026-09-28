import { getPedidos } from '@/actions/pedidos'
import { getProductos } from '@/actions/productos'
import { PedidosClient } from '@/components/pedidos/PedidosClient'

export const dynamic = 'force-dynamic'

export default async function PedidosPage() {
  const [pedidos, productos] = await Promise.all([
    getPedidos(),
    getProductos()
  ])

  return (
    <PedidosClient
      pedidosIniciales={pedidos as any}
      productos={productos as any}
      filamentos={[]}
    />
  )
}
